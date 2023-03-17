/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / Plots / NyquistPlot
 */

import {
  polynomialWiSubstitutionImagTermsArray,
  polynomialWiSubstitutionRealTermsArray,
} from "../../math/complex/complexNumbersService.js";
import { functionFromPolynomialTermsArray } from "../../util/commons.js";
import { logMessages } from "../../util/loggingService.js";
import {
  maxCurvePointsAllowed,
  removeOrFormatAxisTickElement,
} from "./plotService.js";

// import functionPlot from "function-plot";

const functionPlot = window.functionPlot;

export default class NyquistPlot {
  #nyquistPlotDomElement;
  #numeratorTermsArray;
  #denominatorTermsArray;

  #plotContainerDomElement;

  #curvePoints = [];

  constructor(
    plotContainerDomElement,
    numeratorTermsArray,
    denominatorTermsArray
  ) {
    this.#plotContainerDomElement = plotContainerDomElement;
    //create the plot DOM element inside the container
    const markup = `
      <div class="nyquist-plot" id="plot1"></div>
    `;
    plotContainerDomElement.insertAdjacentHTML("afterbegin", markup);

    this.#nyquistPlotDomElement = document.getElementById("plot1");
    this.#numeratorTermsArray = numeratorTermsArray;
    this.#denominatorTermsArray = denominatorTermsArray;

    this.computeNyquistPlotCurvePoints(
      this.#numeratorTermsArray,
      this.#denominatorTermsArray
    );

    this.createNyquistPlot();
  }

  /**
   * Numerical computation of Nyquist plot curve points
   */
  computeNyquistPlotCurvePoints() {
    this.#curvePoints = [];

    const [real, imag] = computeNyquistRealAndImagWFunctions(
      this.#numeratorTermsArray,
      this.#denominatorTermsArray
    );

    //
    // curve points numerical computation loop
    //
    let i = 0;
    let computationAborted = false;
    let wMin;
    let wMax;

    wMin = -1 * 10 ** 3;
    wMax = -1 * 10 ** -8;
    for (let w = wMin; w <= wMax; w += 0.1 * Math.log10(-0.1 * w + 1)) {
      // console.log(w);
      //add new point
      this.#curvePoints.push([w, real(w), imag(w)]);
      i++;

      //guard clause
      if (i > maxCurvePointsAllowed) {
        computationAborted = true;
        console.error("Too many curve points - computation aborted");
        break;
      }
    }
    if (!computationAborted) {
      wMin = 10 ** -8;
      wMax = 10 ** 3;
      for (let w = wMin; w <= wMax; w += 0.1 * Math.log10(0.1 * w + 1)) {
        // console.log(w);
        //add new point
        this.#curvePoints.push([w, real(w), imag(w)]);
        i++;

        //guard clause
        if (i > maxCurvePointsAllowed) {
          console.error("Too many curve points - computation aborted");
          break;
        }
      }
      logMessages(
        ["[CP-92] Total number of nyquist curve points: " + i],
        "checkpoints"
      );
    }
  }

  createNyquistPlot() {
    let plotBoundRect = this.#nyquistPlotDomElement.getBoundingClientRect();
    let plotWidth = plotBoundRect.width;
    let plotHeight = plotBoundRect.height;

    //calculate min & max values
    const reals = this.#curvePoints.map((x) => x[1]);
    // const minReal = Math.min(...reals);
    // const maxReal = Math.max(...reals);

    const imags = this.#curvePoints.map((x) => x[2]);
    // const minImag = Math.min(...imags);
    // const maxImag = Math.max(...imags);

    //create the plot
    const nyquistPlot = functionPlot({
      target: `#${this.#nyquistPlotDomElement.id}`,
      width: plotWidth,
      height: plotHeight,
      xAxis: {
        label: "Real part",
        // type: "log",
        domain: [-10, 10],
      },
      yAxis: {
        label: "Imag part",
        // type: "log",
        domain: [-10, 10],
      },
      grid: true,
      data: [
        {
          points: this.#curvePoints.map((x) => [x[1], x[2]]),
          fnType: "points",
          graphType: "polyline",
        },
      ],
    });

    //adjust appearance
    this.adjustNyquistPlotAppearance();

    //attach observer to remove axis ticks every time the plot is panned or zoomed
    const observer = new MutationObserver(() =>
      this.adjustNyquistPlotAppearance.call(this)
    );
    observer.observe(this.#plotContainerDomElement, {
      childList: true,
      subtree: true,
    });
  }

  adjustNyquistPlotAppearance() {
    //remove axis ticks
    this.#nyquistPlotDomElement
      .getElementsByClassName("x axis")[0]
      .querySelectorAll("text")
      .forEach(removeOrFormatAxisTickElement);
    this.#nyquistPlotDomElement
      .getElementsByClassName("y axis")[0]
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
 * compute the real & imag functions of variable w, constituting the parametric Nyquist plot's curve
 */
const computeNyquistRealAndImagWFunctions = function (
  numeratorTermsArray,
  denominatorTermsArray
) {
  logMessages(
    [
      "[CP-91] Nyquist plot s=w*i substitution - " +
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

  const real = (w) =>
    (numReal(w) * denReal(w) + numImag(w) * denImag(w)) /
    (denReal(w) ** 2 + denImag(w) ** 2);

  const imag = (w) =>
    (numImag(w) * denReal(w) - numReal(w) * denImag(w)) /
    (denReal(w) ** 2 + denImag(w) ** 2);

  return [real, imag];
};
