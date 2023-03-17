/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / Plots / BodePlot
 */

import {
  polynomialWiSubstitutionImagTermsArray,
  polynomialWiSubstitutionRealTermsArray,
} from "../../math/complex/complexNumbersService.js";
import { functionFromPolynomialTermsArray } from "../../util/commons.js";
import { logMessages } from "../../util/loggingService.js";
import { computeAndDisplayCharacteristicNumbers } from "./characteristicNumbersService.js";
import {
  VariableStep,
  PhaseUnwrapper,
  removeOrFormatAxisTickElement,
  maxCurvePointsAllowed,
} from "./plotService.js";

// import functionPlot from "function-plot";

const functionPlot = window.functionPlot;

export default class BodePlot {
  #magnitudePlotDomElement;
  #phasePlotDomElement;
  #numeratorTermsArray;
  #denominatorTermsArray;

  #plotContainerDomElement;
  #phaseCanvasElement;

  #magnitudeCurvePoints = [];
  #phaseCurvePoints = [];

  #magnitude;
  #phase;

  #minMagnitude;
  #maxMagnitude;

  #wMin = 5 * 10 ** -4;
  #wMax = 5 * 10 ** 3;

  constructor(
    plotContainerDomElement,
    numeratorTermsArray,
    denominatorTermsArray
  ) {
    this.#plotContainerDomElement = plotContainerDomElement;
    //create the two plot DOM elements inside the container
    const markup = `
      <div class="bode-subplot" id="plot1"></div>
      <div class="bode-subplot" id="plot2"></div>
    `;
    plotContainerDomElement.insertAdjacentHTML("afterbegin", markup);

    this.#magnitudePlotDomElement = document.getElementById("plot1");
    this.#phasePlotDomElement = document.getElementById("plot2");
    this.#numeratorTermsArray = numeratorTermsArray;
    this.#denominatorTermsArray = denominatorTermsArray;

    this.computeBodePlotCurvePoints(
      this.#numeratorTermsArray,
      this.#denominatorTermsArray
    );

    this.createBodePlot();

    computeAndDisplayCharacteristicNumbers(
      this.#magnitude,
      this.#phaseCurvePoints,
      this.#wMin,
      this.#wMax,
      this.#minMagnitude,
      this.#maxMagnitude
    );
  }

  /**
   * Numerical computation of Bode plot curve points
   */
  computeBodePlotCurvePoints() {
    this.#magnitudeCurvePoints = [];
    this.#phaseCurvePoints = [];

    const [magnitude, phase] = computeBodeMagnitudeAndPhaseWFunctions(
      this.#numeratorTermsArray,
      this.#denominatorTermsArray
    );

    this.#magnitude = magnitude;
    this.#phase = phase;

    //
    // curve points numerical computation loop
    //
    let newMagnitudeValue;
    let newPhaseValue;
    let lastMagnitudeValue = magnitude(this.#wMin);
    let lastPhaseValue = (180 / Math.PI) * phase(this.#wMin);

    const variableStep = new VariableStep();
    const phaseUnwrapper = new PhaseUnwrapper();

    let lastW = this.#wMin;
    let magnitudeCurveSlope = 0;
    let phaseCurveSlope = 0;
    let i = 0;

    for (
      let w = this.#wMin;
      w <= this.#wMax;
      w += variableStep.getAdjustedStepSize(
        w,
        Math.max(magnitudeCurveSlope, phaseCurveSlope)
      )
    ) {
      //new values
      newMagnitudeValue = magnitude(w);
      newPhaseValue = phaseUnwrapper.unwrapPhaseValue(
        (180 / Math.PI) * phase(w),
        lastPhaseValue,
        w
      );

      //add new points
      this.#magnitudeCurvePoints.push([w, newMagnitudeValue]);
      this.#phaseCurvePoints.push([w, newPhaseValue]);

      //new curve slopes (note the log axes)
      magnitudeCurveSlope = Math.abs(
        Math.log10(newMagnitudeValue / lastMagnitudeValue) /
          Math.log10(w / lastW)
      );
      phaseCurveSlope =
        Math.abs(Math.abs(newPhaseValue) - Math.abs(lastPhaseValue)) /
        Math.log10(w / lastW);

      //update other values
      lastMagnitudeValue = newMagnitudeValue;
      lastPhaseValue = newPhaseValue;
      lastW = w;
      i++;

      //guard clause
      if (i > maxCurvePointsAllowed) {
        console.error("Too many curve points - computation aborted");
        break;
      }
    }
    logMessages(
      ["[CP-87] Total number of Bode curve points: " + i],
      "checkpoints"
    );

    //adjust phase based on possible absolute phase value at wMax according to transfer function polynomial
    const possiblePhaseValueAtWmax1 =
      -90 *
      (this.#denominatorTermsArray.length - this.#numeratorTermsArray.length);
    const possiblePhaseValueAtWmax2 =
      -90 *
      (this.#denominatorTermsArray.length +
        this.#numeratorTermsArray.length -
        2);

    const minPossiblePhaseValueAtWmax = Math.min(
      possiblePhaseValueAtWmax1,
      possiblePhaseValueAtWmax2
    );
    const maxPossiblePhaseValueAtWmax = Math.max(
      possiblePhaseValueAtWmax1,
      possiblePhaseValueAtWmax2
    );

    if (lastPhaseValue > maxPossiblePhaseValueAtWmax + 10) {
      const factor = Math.ceil(
        (Math.abs(lastPhaseValue - maxPossiblePhaseValueAtWmax) - 10) / 360
      );
      logMessages(
        [
          `[CP-88] Range of possible phase values at wMax: [${maxPossiblePhaseValueAtWmax}, ${minPossiblePhaseValueAtWmax}]. Phase adjustment via wMax: ${
            -factor * 360
          }`,
        ],
        "checkpoints"
      );
      this.#phaseCurvePoints.forEach(
        (_, i) => (this.#phaseCurvePoints[i][1] -= factor * 360)
      );
    } else if (lastPhaseValue + 10 < minPossiblePhaseValueAtWmax) {
      const factor = Math.ceil(
        (Math.abs(minPossiblePhaseValueAtWmax - lastPhaseValue) + 10) / 360
      );
      logMessages(
        [
          `[CP-89] Range of possible phase values at wMax: [${maxPossiblePhaseValueAtWmax}, ${minPossiblePhaseValueAtWmax}]. Phase adjustment via wMax: ${
            factor * 360
          }`,
        ],
        "checkpoints"
      );
      this.#phaseCurvePoints.forEach(
        (_, i) => (this.#phaseCurvePoints[i][1] += factor * 360)
      );
    }
  }

  createBodePlot() {
    let plotBoundRect = this.#magnitudePlotDomElement.getBoundingClientRect();
    let plotWidth = plotBoundRect.width;
    let plotHeight = plotBoundRect.height;

    //calculate min & max values
    const magnitudeCurvePoints = this.#magnitudeCurvePoints.map((x) => x[1]);
    this.#minMagnitude = Math.min(...magnitudeCurvePoints);
    this.#maxMagnitude = Math.max(...magnitudeCurvePoints);

    const phaseCurvePoints = this.#phaseCurvePoints.map((x) => x[1]);
    const minPhase = Math.min(...phaseCurvePoints);
    const maxPhase = Math.max(...phaseCurvePoints);

    //create the two plots
    const magnitudePlot = functionPlot({
      target: `#${this.#magnitudePlotDomElement.id}`,
      width: plotWidth,
      height: plotHeight,
      xAxis: {
        label: "Frequency [rad/s]",
        type: "log",
        domain: [this.#wMin, this.#wMax],
      },
      yAxis: {
        label: "Magnitude (abs)",
        type: "log",
        domain: [
          Math.min(this.#minMagnitude, 0.1),
          Math.max(this.#maxMagnitude, 1),
        ],
      },
      grid: true,
      data: [
        {
          points: this.#magnitudeCurvePoints,
          fnType: "points",
          graphType: "polyline",
        },
        {
          fn: "0.707",
          color: "red",
          nSamples: 30,
          graphType: "scatter",
          skipTip: true,
        },
      ],
    });

    const phasePlot = functionPlot({
      target: `#${this.#phasePlotDomElement.id}`,
      width: plotWidth,
      height: plotHeight,
      xAxis: {
        label: "Frequency [rad/s]",
        type: "log",
        domain: [this.#wMin, this.#wMax],
      },
      yAxis: {
        label: "Phase [deg]",
        // type: "log",
        domain: [minPhase, maxPhase],
      },
      grid: true,
      data: [
        {
          points: this.#phaseCurvePoints,
          fnType: "points",
          graphType: "polyline",
        },
      ],
    });

    //link magnitude & phase plots, so that  they are panned or zoomed together
    magnitudePlot.addLink(phasePlot);
    phasePlot.addLink(magnitudePlot);

    //adjust appearance
    this.#phaseCanvasElement =
      this.#phasePlotDomElement.getElementsByClassName("canvas")[0];
    this.adjustBodePlotAppearance();

    //attach observer to remove axis ticks every time the plot is panned or zoomed
    const observer = new MutationObserver(() =>
      this.adjustBodePlotAppearance.call(this)
    );
    observer.observe(this.#plotContainerDomElement, {
      childList: true,
      subtree: true,
    });
  }

  adjustBodePlotAppearance() {
    //make margin between magnitude & phase plot SVGs smaller
    // console.log(this.#phaseCanvasElement.transform);
    this.#phaseCanvasElement.transform.baseVal.getItem(0).matrix.f = 0;
    //can't be also set:
    // this.#phaseCanvasElement.transform.animVal.getItem(0).matrix.f = 0;

    //remove axis ticks
    this.#magnitudePlotDomElement
      .getElementsByClassName("x axis")[0]
      .querySelectorAll("text")
      .forEach(removeOrFormatAxisTickElement);
    this.#magnitudePlotDomElement
      .getElementsByClassName("y axis")[0]
      .querySelectorAll("text")
      .forEach(removeOrFormatAxisTickElement);
    this.#phasePlotDomElement
      .getElementsByClassName("x axis")[0]
      .querySelectorAll("text")
      .forEach(removeOrFormatAxisTickElement);
  }
}

//
// Helper functions
//

/**
 * Starting from the total transfer function of a system, as a ratio of polynomials of variable s,
 * after the latter variable is substituted by the imaginary number s=w*i,
 * compute the magnitude & phase functions of variable w, constituting the Bode plot's curves
 */
const computeBodeMagnitudeAndPhaseWFunctions = function (
  numeratorTermsArray,
  denominatorTermsArray
) {
  logMessages(
    [
      "[CP-81] Bode plot s=w*i substitution - " +
        "numerator: " +
        `[${polynomialWiSubstitutionRealTermsArray(
          numeratorTermsArray
        )}]+i*[${polynomialWiSubstitutionImagTermsArray(
          numeratorTermsArray
        )}], ` +
        "denominator: " +
        `[${polynomialWiSubstitutionRealTermsArray(
          denominatorTermsArray
        )}]+i*[${polynomialWiSubstitutionImagTermsArray(
          denominatorTermsArray
        )}]`,
    ],
    "checkpoints"
  );

  //
  // define magnitude & phase functions
  //
  const numReal = functionFromPolynomialTermsArray(
    polynomialWiSubstitutionRealTermsArray(numeratorTermsArray)
  );
  const numImag = functionFromPolynomialTermsArray(
    polynomialWiSubstitutionImagTermsArray(numeratorTermsArray)
  );

  const denReal = functionFromPolynomialTermsArray(
    polynomialWiSubstitutionRealTermsArray(denominatorTermsArray)
  );
  const denImag = functionFromPolynomialTermsArray(
    polynomialWiSubstitutionImagTermsArray(denominatorTermsArray)
  );

  const magnitude = (w) =>
    Math.sqrt(
      (numReal(w) ** 2 + numImag(w) ** 2) / (denReal(w) ** 2 + denImag(w) ** 2)
    );

  const phase = (w) =>
    Math.atan2(numImag(w), numReal(w)) - Math.atan2(denImag(w), denReal(w));

  return [magnitude, phase];
};
