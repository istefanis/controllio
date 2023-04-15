/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / Plots / NyquistPlot
 */

import {
  polynomialEvaluatedWithWiImagTermsArray,
  polynomialEvaluatedWithWiRealTermsArray,
} from "../../math/complexAnalysis/complexAnalysisService.js";
import { functionFromPolynomialTermsArray } from "../../util/commons.js";
import { logMessages } from "../../util/loggingService.js";
import {
  makeElementFontSizeNormal,
  makeElementFontSizeSmaller,
} from "../../util/uiService.js";
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
  #zeros;
  #poles;

  #plotContainerDomElement;

  #curvePoints = [];

  #nyquistObserver;

  constructor(
    plotContainerDomElement,
    numeratorTermsArray,
    denominatorTermsArray,
    zeros,
    poles
  ) {
    this.#plotContainerDomElement = plotContainerDomElement;
    //create the plot DOM element inside the container
    const markup = `
      <div class="nyquist-plot" id="nyquist-plot"></div>
    `;
    plotContainerDomElement.insertAdjacentHTML("afterbegin", markup);

    this.#nyquistPlotDomElement =
      plotContainerDomElement.querySelector("#nyquist-plot");
    this.#numeratorTermsArray = numeratorTermsArray;
    this.#denominatorTermsArray = denominatorTermsArray;
    this.#zeros = zeros;
    this.#poles = poles;

    this.computeNyquistPlotCurvePoints(
      this.#numeratorTermsArray,
      this.#denominatorTermsArray
    );

    this.createNyquistPlot();
    this.insertZerosAndPolesMarkup();

    return this.#nyquistObserver;
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
        console.error(
          "computeNyquistPlotCurvePoints()",
          "Too many curve points - computation aborted"
        );
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
          console.error(
            "computeNyquistPlotCurvePoints()",
            "Too many curve points - computation aborted"
          );
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
    const arrowsNumber = 100;

    let plotBoundRect = this.#nyquistPlotDomElement.getBoundingClientRect();
    let plotWidth = plotBoundRect.width;
    let plotHeight = plotBoundRect.height;

    //calculate min & max values
    // const reals = this.#curvePoints.map((x) => x[1]);
    // const minReal = Math.min(...reals);
    // const maxReal = Math.max(...reals);

    // const imags = this.#curvePoints.map((x) => x[2]);
    // const minImag = Math.min(...imags);
    // const maxImag = Math.max(...imags);

    //create the plot
    const nyquistPlot = functionPlot({
      target: `#${this.#nyquistPlotDomElement.id}`,
      width: plotWidth,
      height: plotHeight,
      xAxis: {
        label: "Real part",
        domain: [-10, 10],
      },
      yAxis: {
        label: "Imag part",
        domain: [-10, 10],
      },
      grid: true,
      data: [
        {
          points: this.#curvePoints
            .filter((x) => x[0] > 0)
            .map((x) => [x[1], x[2]]),
          fnType: "points",
          graphType: "polyline",
        },
        {
          points: this.#curvePoints
            .filter((x) => x[0] < 0)
            .map((x) => [x[1], x[2]]),
          fnType: "points",
          graphType: "polyline",
          color: "gray",
        },
        {
          points: this.#zeros,
          fnType: "points",
          graphType: "scatter",
          color: "gray",
        },
        {
          points: this.#poles,
          fnType: "points",
          graphType: "scatter",
          color: "green",
        },
        ...this.#poles.map((z) => {
          return {
            points: [
              [z[0] - 0.1, z[1] - 0.1],
              [z[0] + 0.1, z[1] + 0.1],
            ],
            fnType: "points",
            graphType: "polyline",
            color: "green",
          };
        }),
        ...this.#poles.map((z) => {
          return {
            points: [
              [z[0] - 0.1, z[1] + 0.1],
              [z[0] + 0.1, z[1] - 0.1],
            ],
            fnType: "points",
            graphType: "polyline",
            color: "green",
          };
        }),
        {
          points: [[-1, 0]],
          fnType: "points",
          graphType: "scatter",
          color: "red",
        },
        ...Array.from(Array(arrowsNumber))
          .map((_, i) =>
            Math.floor((i / arrowsNumber) * this.#curvePoints.length)
          )
          .map((x) => {
            return {
              vector: [
                this.#curvePoints[x + 1][1] - this.#curvePoints[x][1],
                this.#curvePoints[x + 1][2] - this.#curvePoints[x][2],
              ],
              offset: [this.#curvePoints[x][1], this.#curvePoints[x][2]],
              graphType: "polyline",
              fnType: "vector",
            };
          }),
      ],
    });
    // const zoomLevel = nyquistPlot.options.xAxis.domain[1] - nyquistPlot.options.xAxis.domain[0];

    //adjust appearance
    this.adjustNyquistPlotAppearance();

    //attach observer to remove axis ticks every time the plot is panned or zoomed
    this.#nyquistObserver = new MutationObserver(() =>
      this.adjustNyquistPlotAppearance.call(this)
    );
    this.#nyquistObserver.observe(this.#plotContainerDomElement, {
      childList: true,
      subtree: true,
    });
  }

  adjustNyquistPlotAppearance() {
    const circles = this.#nyquistPlotDomElement.querySelectorAll("g circle");
    circles.forEach((c) => {
      //select zeros only (colored gray)
      if (["#dbdbdb"].includes(c.getAttribute("fill"))) {
        c.style.opacity = 1;
        c.r.baseVal.value = 2.5;
      }
      //select poles only (colored green)
      else if (["#00db00"].includes(c.getAttribute("fill"))) {
        c.style.opacity = 0.5;
        c.r.baseVal.value = 2.5;
      } else {
        c.style.opacity = 1;
        c.r.baseVal.value = 1.5;
      }
    });

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

  insertZerosAndPolesMarkup() {
    const zerosAndPolesGrid =
      this.#plotContainerDomElement.parentNode.querySelector(
        "#zeros-and-poles-grid"
      );
    if (this.#zeros.concat(this.#poles).length > 10) {
      makeElementFontSizeSmaller(zerosAndPolesGrid);
    } else {
      makeElementFontSizeNormal(zerosAndPolesGrid);
    }
    const markup = `
    <p>Zero${this.#zeros.length === 1 ? "" : "s"}:</p><p> ${
      this.#zeros.length > 0
        ? this.#zeros
            .filter((x) => x[1] >= 0)
            .map(
              (x) =>
                `${x[1] > 0 ? "(" : ""}${x[0]}${
                  x[1] > 0 ? ` ± ${x[1]}*i` : ""
                }${x[1] > 0 ? ")" : ""}`
            )
            .join(", ")
        : "N/A"
    }</p>
    <p>Pole${this.#poles.length === 1 ? "" : "s"}:</p><p> ${
      this.#poles.length > 0
        ? this.#poles
            .filter((x) => x[1] >= 0)
            .map(
              (x) =>
                `${x[1] > 0 ? "(" : ""}${x[0]}${
                  x[1] > 0 ? ` ± ${x[1]}*i` : ""
                }${x[1] > 0 ? ")" : ""}`
            )
            .join(", ")
        : "N/A"
    }</p>
  `;
    zerosAndPolesGrid.innerHTML = "";
    zerosAndPolesGrid.insertAdjacentHTML("afterbegin", markup);
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

  const real = (w) =>
    (numReal(w) * denReal(w) + numImag(w) * denImag(w)) /
    (denReal(w) ** 2 + denImag(w) ** 2);

  const imag = (w) =>
    (numImag(w) * denReal(w) - numReal(w) * denImag(w)) /
    (denReal(w) ** 2 + denImag(w) ** 2);

  return [real, imag];
};
