/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / Plots / BodePlot
 */

import {
  discreteTimePolynomialEvaluatedWithWiImagTermsFunction,
  discreteTimePolynomialEvaluatedWithWiRealTermsFunction,
  polynomialEvaluatedWithWiImagTermsArray,
  polynomialEvaluatedWithWiRealTermsArray,
} from "../../math/complexAnalysis/complexAnalysisService.js";
import { linearInterpolationOfCurvePoints } from "../../math/numericalAnalysis/numericalAnalysisService.js";
import {
  functionFromPolynomialTermsArray,
  areAllTfTermsNumbers,
  roundDecimal,
  toleranceNumericalAnalysisSmall,
  tolerancePhaseAdjustmentLarge,
} from "../../util/commons.js";
import { logMessages } from "../../util/loggingService.js";
import {
  computeCharacteristicNumbers,
  insertCharacteristicNumbersMarkup,
} from "./characteristicNumbersService.js";
import {
  functionPlot,
  maxCurvePointsAllowed,
  VariableStep,
  PhaseUnwrapper,
  removeOrFormatAxisTickElement,
  formatTip,
} from "./plotService.js";

export default class BodePlot {
  #magnitudePlotDomElement;
  #phasePlotDomElement;
  #numeratorTermsArray;
  #denominatorTermsArray;
  #zeros;
  #poles;
  #isDiscrete;
  #samplingT;

  #plotContainerDomElement;
  #phaseCanvasElement;

  #magnitudeCurvePoints = [];
  #phaseCurvePoints = [];

  #magnitude;
  #phase;

  #minMagnitude;
  #maxMagnitude;

  #wMin = 5 * 10 ** -4;
  #wMax;
  #plotWMax = 5 * 10 ** 3;

  #bandwidthThreshold;

  #bodeObserver;

  constructor(
    plotContainerDomElement,
    numeratorTermsArray,
    denominatorTermsArray,
    zeros,
    poles,
    samplingT
  ) {
    this.#numeratorTermsArray = numeratorTermsArray;
    this.#denominatorTermsArray = denominatorTermsArray;
    this.#zeros = zeros;
    this.#poles = poles;

    if (samplingT) {
      this.#isDiscrete = true;
      this.#samplingT = samplingT;

      //computation of Nyquist frequency
      const samplingF = 1 / this.#samplingT;
      const nyquistF = samplingF / 2;

      this.#wMax = Math.min(2 * Math.PI * nyquistF, this.#plotWMax);
    } else {
      this.#isDiscrete = false;
      this.#wMax = this.#plotWMax;
    }

    let characteristicNumbers;

    const allTfTermsAreNumbers = areAllTfTermsNumbers(
      numeratorTermsArray,
      denominatorTermsArray
    );

    if (allTfTermsAreNumbers) {
      this.computeBodePlotCurvePoints(
        this.#numeratorTermsArray,
        this.#denominatorTermsArray
      );

      characteristicNumbers = computeCharacteristicNumbers(
        this.#magnitude,
        this.#magnitudeCurvePoints,
        this.#phaseCurvePoints,
        this.#wMin,
        this.#wMax,
        this.#minMagnitude,
        this.#maxMagnitude,
        this.#isDiscrete
      );

      if (characteristicNumbers.bandwidthThreshold) {
        this.#bandwidthThreshold = characteristicNumbers.bandwidthThreshold;
      }
    } else {
      characteristicNumbers = {
        filterTypeText: "N/A",
        bandwidthText: "N/A",
        thresholdText: "N/A",
        rollOffText: "N/A",
        bandwidthThreshold: "",
      };

      this.#bandwidthThreshold = "";
    }

    if (!plotContainerDomElement || !functionPlot) {
      // return Bode curve points & characteristics numbers without displaying the plot (ex. for testing)
      return {
        magnitudeCurvePoints: this.#magnitudeCurvePoints,
        phaseCurvePoints: this.#phaseCurvePoints,
        characteristicNumbers,
      };
    } else {
      this.#plotContainerDomElement = plotContainerDomElement;
      //create the two plot DOM elements inside the container
      const markup = `
        <div class="bode-subplot" id="bode-plot1"></div>
        <div class="bode-subplot" id="bode-plot2"></div>
      `;
      plotContainerDomElement.insertAdjacentHTML("afterbegin", markup);

      this.#magnitudePlotDomElement =
        plotContainerDomElement.querySelector("#bode-plot1");
      this.#phasePlotDomElement =
        plotContainerDomElement.querySelector("#bode-plot2");

      this.createBodePlot();

      insertCharacteristicNumbersMarkup(
        plotContainerDomElement.parentNode.querySelector(
          "#characteristic-numbers-grid"
        ),
        characteristicNumbers,
        allTfTermsAreNumbers ? false : true,
        this.#isDiscrete ? 1 / (2 * this.#samplingT) : null
      );

      return this.#bodeObserver;
    }
  }

  /**
   * Numerical computation of Bode plot curve points
   */
  computeBodePlotCurvePoints() {
    this.#magnitudeCurvePoints = [];
    this.#phaseCurvePoints = [];

    const [magnitude, phase] = this.#isDiscrete
      ? computeDiscreteTimeBodeMagnitudeAndPhaseWFunctions(
          this.#numeratorTermsArray,
          this.#denominatorTermsArray,
          this.#samplingT
        )
      : computeBodeMagnitudeAndPhaseWFunctions(
          this.#numeratorTermsArray,
          this.#denominatorTermsArray
        );

    this.#magnitude = magnitude;
    this.#phase = phase;

    //compute expected steep phase shifts due to polynomial zeros & poles at y-axis
    const expectedSteepPhaseShiftsMap = new Map();
    const zerosAtYAxis = this.#zeros.filter(
      (x) =>
        (x[0] === 0 && x[1] !== 0) ||
        (Math.abs(x[0]) < 1 && Math.abs(x[1] / x[0]) > 15)
    );
    const polesAtYAxis = this.#poles.filter(
      (x) =>
        (x[0] === 0 && x[1] !== 0) ||
        (Math.abs(x[0]) < 1 && Math.abs(x[1] / x[0]) > 15)
    );

    zerosAtYAxis.forEach((x) => {
      const value = expectedSteepPhaseShiftsMap.get(Math.abs(x[1]));
      expectedSteepPhaseShiftsMap.set(Math.abs(x[1]), value ? value + 90 : 90);
    });
    polesAtYAxis.forEach((x) => {
      const value = expectedSteepPhaseShiftsMap.get(Math.abs(x[1]));
      expectedSteepPhaseShiftsMap.set(Math.abs(x[1]), value ? value - 90 : -90);
    });

    if (expectedSteepPhaseShiftsMap.size > 0)
      logMessages(
        [
          "[CP-86] Expected steep phase shifts: " +
            [...expectedSteepPhaseShiftsMap.entries()].map((x) => `[${x}]`),
        ],
        "checkpoints"
      );

    //
    // curve points numerical computation loop
    //
    let newMagnitudeValue;
    let newPhaseValue;
    let lastMagnitudeValue = magnitude(this.#wMin);
    const firstPhaseValue = (180 / Math.PI) * phase(this.#wMin);
    let lastPhaseValue = firstPhaseValue;

    const variableStep = new VariableStep();
    const phaseUnwrapper = new PhaseUnwrapper(expectedSteepPhaseShiftsMap);

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
        console.error(
          "computeBodePlotCurvePoints()",
          "Too many curve points - computation aborted"
        );
        break;
      }
    }
    logMessages(
      ["[CP-87] Total number of Bode curve points: " + i],
      "checkpoints"
    );

    //calculate magnitude min & max values
    const magnitudeCurvePoints = this.#magnitudeCurvePoints.map((x) => x[1]);
    this.#minMagnitude =
      magnitudeCurvePoints.length > 0
        ? Math.min(...magnitudeCurvePoints)
        : undefined;
    this.#maxMagnitude =
      magnitudeCurvePoints.length > 0
        ? Math.max(...magnitudeCurvePoints)
        : undefined;

    //calculate pre-adjusted phase min & max values
    const minPhaseTemp =
      this.#phaseCurvePoints.length > 0
        ? Math.min(...this.#phaseCurvePoints.map((x) => x[1]))
        : undefined;
    const maxPhaseTemp =
      this.#phaseCurvePoints.length > 0
        ? Math.max(...this.#phaseCurvePoints.map((x) => x[1]))
        : undefined;

    let expectedPhaseValueAtWmax = lastPhaseValue;
    const tol = tolerancePhaseAdjustmentLarge;

    //adjust expected phase value at wMax - case 1
    if (minPhaseTemp > 180 - tol && maxPhaseTemp > minPhaseTemp + 2 * tol) {
      expectedPhaseValueAtWmax = lastPhaseValue - 360;
    } else if (
      maxPhaseTemp < -180 + tol &&
      maxPhaseTemp > minPhaseTemp + 2 * tol
    ) {
      expectedPhaseValueAtWmax = lastPhaseValue + 360;
    }

    //adjust expected phase value at wMax - case 2
    //(display absolute phase values beyond 180, as an exception in this case)
    const polesAtYAxisOrOrigin = this.#poles.filter((x) => x[0] === 0).length;
    const zerosAtYAxisOrOrigin = this.#zeros.filter((x) => x[0] === 0).length;
    if (
      this.#poles.length === polesAtYAxisOrOrigin &&
      this.#zeros.length === 0
    ) {
      expectedPhaseValueAtWmax = -90 * polesAtYAxisOrOrigin;
    } else if (
      this.#zeros.length === zerosAtYAxisOrOrigin &&
      this.#poles.length === 0
    ) {
      expectedPhaseValueAtWmax = 90 * zerosAtYAxisOrOrigin;
    }

    //apply adjustment
    if (lastPhaseValue > expectedPhaseValueAtWmax + tol) {
      const factor = Math.ceil(
        (Math.abs(lastPhaseValue - expectedPhaseValueAtWmax) - tol) / 180
      );
      logMessages(
        [
          `[CP-88] Current phase value at wMax: ${roundDecimal(
            lastPhaseValue,
            5
          )}. Expected phase value at wMax: ${expectedPhaseValueAtWmax}. Phase adjustment via wMax: ${
            -factor * 180
          }`,
        ],
        "checkpoints"
      );
      this.#phaseCurvePoints.forEach(
        (_, i) => (this.#phaseCurvePoints[i][1] -= factor * 180)
      );
    } else if (lastPhaseValue + tol < expectedPhaseValueAtWmax) {
      const factor = Math.ceil(
        (Math.abs(expectedPhaseValueAtWmax - lastPhaseValue) - tol) / 180
      );
      logMessages(
        [
          `[CP-89] Current phase value at wMax: ${roundDecimal(
            lastPhaseValue,
            5
          )}. Expected phase value at wMax: ${expectedPhaseValueAtWmax}. Phase adjustment via wMax: ${
            factor * 180
          }`,
        ],
        "checkpoints"
      );
      this.#phaseCurvePoints.forEach(
        (_, i) => (this.#phaseCurvePoints[i][1] += factor * 180)
      );
    }
  }

  createBodePlot() {
    let plotBoundRect = this.#magnitudePlotDomElement.getBoundingClientRect();
    let plotWidth = plotBoundRect.width;
    let plotHeight = plotBoundRect.height;

    //calculate phase min & max values
    const phaseCurvePoints = this.#phaseCurvePoints.map((x) => x[1]);
    const minPhase =
      phaseCurvePoints.length > 0 ? Math.min(...phaseCurvePoints) : undefined;
    const maxPhase =
      phaseCurvePoints.length > 0 ? Math.max(...phaseCurvePoints) : undefined;

    //create the two plots
    const magnitudePlot = functionPlot({
      target: `#${this.#magnitudePlotDomElement.id}`,
      width: plotWidth,
      height: plotHeight,
      xAxis: {
        label: "Frequency [rad/s]",
        type: "log",
        domain: [this.#wMin, this.#plotWMax],
      },
      yAxis: {
        label: "Magnitude (abs)",
        type: "log",
        domain: [
          Math.min(this.#minMagnitude ? this.#minMagnitude : 0.1, 0.1),
          Math.max(this.#maxMagnitude ? this.#maxMagnitude : 10, 10),
        ],
      },
      tip: {
        xLine: true,
        yLine: true,
      },
      grid: true,
      data: [
        this.#magnitudeCurvePoints.length > 0
          ? {
              graphType: "polyline",
              fn: (scope) => {
                return linearInterpolationOfCurvePoints(
                  this.#magnitudeCurvePoints
                )(scope.x);
              },
              color: this.#isDiscrete ? "black" : null,
            }
          : {
              points: this.#magnitudeCurvePoints,
              color: "red",
              fnType: "points",
              graphType: "scatter",
            },
        {
          fn: this.#bandwidthThreshold ? String(this.#bandwidthThreshold) : "1",
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
        domain: [this.#wMin, this.#plotWMax],
      },
      yAxis: {
        label: "Phase [deg]",
        domain: [minPhase ? minPhase : -90, maxPhase ? maxPhase : 90],
      },
      tip: {
        xLine: true,
        yLine: true,
      },
      grid: true,
      data: [
        this.#phaseCurvePoints.length > 0
          ? {
              graphType: "polyline",
              fn: (scope) => {
                return linearInterpolationOfCurvePoints(this.#phaseCurvePoints)(
                  scope.x
                );
              },
              color: this.#isDiscrete ? "black" : null,
            }
          : {
              points: this.#phaseCurvePoints,
              color: "red",
              fnType: "points",
              graphType: "scatter",
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
    this.#bodeObserver = new MutationObserver(() =>
      this.adjustBodePlotAppearance.call(this)
    );
    this.#bodeObserver.observe(this.#plotContainerDomElement, {
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

    //adjust tips' appearance
    formatTip(
      this.#magnitudePlotDomElement.getElementsByClassName("inner-tip")[0]
    );
    formatTip(this.#phasePlotDomElement.getElementsByClassName("inner-tip")[0]);
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
      "[CP-78] Bode plot s=w*i substitution - " +
        "numerator: " +
        `[${polynomialEvaluatedWithWiRealTermsArray(
          numeratorTermsArray
        )}]+i*[${polynomialEvaluatedWithWiImagTermsArray(
          numeratorTermsArray
        )}], ` +
        "denominator: " +
        `[${polynomialEvaluatedWithWiRealTermsArray(
          denominatorTermsArray
        )}]+i*[${polynomialEvaluatedWithWiImagTermsArray(
          denominatorTermsArray
        )}]`,
    ],
    "checkpoints"
  );

  //
  // define magnitude & phase functions
  //
  const numReal = functionFromPolynomialTermsArray(
    polynomialEvaluatedWithWiRealTermsArray(numeratorTermsArray)
  );
  const numImag = functionFromPolynomialTermsArray(
    polynomialEvaluatedWithWiImagTermsArray(numeratorTermsArray)
  );

  const denReal = functionFromPolynomialTermsArray(
    polynomialEvaluatedWithWiRealTermsArray(denominatorTermsArray)
  );
  const denImag = functionFromPolynomialTermsArray(
    polynomialEvaluatedWithWiImagTermsArray(denominatorTermsArray)
  );

  const magnitude = (w) =>
    Math.sqrt(
      (numReal(w) ** 2 + numImag(w) ** 2) / (denReal(w) ** 2 + denImag(w) ** 2)
    );

  const phase = (w) =>
    Math.atan2(numImag(w), numReal(w)) - Math.atan2(denImag(w), denReal(w));

  return [magnitude, phase];
};

/**
 * Starting from the total transfer function of a discrete-time system,
 * as a ratio of polynomials of variable z,
 * after the latter variable is substituted by the complex number z=e^(w*T*i),
 * compute the magnitude & phase functions of variable w, constituting the Bode plot's curves
 */
const computeDiscreteTimeBodeMagnitudeAndPhaseWFunctions = function (
  numeratorTermsArray,
  denominatorTermsArray,
  samplingT
) {
  logMessages(
    ["[CP-79] Discrete-time Bode plot z=e^(w*T*i) substitution"],
    "checkpoints"
  );

  //
  // define magnitude & phase functions
  //
  const numReal = discreteTimePolynomialEvaluatedWithWiRealTermsFunction(
    numeratorTermsArray,
    samplingT
  );
  const numImag = discreteTimePolynomialEvaluatedWithWiImagTermsFunction(
    numeratorTermsArray,
    samplingT
  );
  const denReal = discreteTimePolynomialEvaluatedWithWiRealTermsFunction(
    denominatorTermsArray,
    samplingT
  );
  const denImag = discreteTimePolynomialEvaluatedWithWiImagTermsFunction(
    denominatorTermsArray,
    samplingT
  );

  const magnitude = (w) =>
    Math.sqrt(
      (numReal(w) ** 2 + numImag(w) ** 2) / (denReal(w) ** 2 + denImag(w) ** 2)
    );

  const phase = (w) =>
    Math.atan2(numImag(w), numReal(w)) - Math.atan2(denImag(w), denReal(w));

  return [magnitude, phase];
};
