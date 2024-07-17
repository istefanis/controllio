/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / Plots / NyquistPlot
 */

import {
  discreteTimePolynomialEvaluatedWithWiImagTermsFunction,
  discreteTimePolynomialEvaluatedWithWiRealTermsFunction,
  polynomialEvaluatedWithWiImagTermsArray,
  polynomialEvaluatedWithWiRealTermsArray,
} from "../../math/complexAnalysis/complexAnalysisService.js";
import {
  add,
  getTermsArray,
} from "../../math/computerAlgebra/algebraicOperations.js";
import { Polynomial } from "../../math/computerAlgebra/dataTypes/polynomials.js";
import { findComplexRootsOfPolynomial } from "../../math/numericalAnalysis/numericalAnalysisService.js";
import {
  functionFromPolynomialTermsArray,
  areAllTfTermsNumbers,
  toleranceNumericalAnalysisSmall,
} from "../../util/commons.js";
import { logMessages } from "../../util/loggingService.js";
import {
  makeElementFontSizeNormal,
  makeElementFontSizeSmaller,
} from "../../util/uiService.js";
import {
  functionPlot,
  maxCurvePointsAllowed,
  removeOrFormatAxisTickElement,
} from "./plotService.js";

export default class NyquistPlot {
  #nyquistPlotDomElement;
  #numeratorTermsArray;
  #denominatorTermsArray;
  #zeros;
  #poles;
  #isDiscrete;
  #samplingT;

  #closedLoopTfZeros;
  #stability;

  #plotContainerDomElement;

  #curvePoints = [];

  #absWMin = 10 ** -8;
  #absWMax;
  #defaultAbsWMax = 10 ** 3;

  #nyquistObserver;

  //plot colors
  #curveSegmentColor1 = "#4682b4";
  #curveSegmentDiscreteColor1 = "black";
  #curveSegmentColor2 = "#aaaaaa";

  #symbolOpenLoopZeroColor = "red";
  #symbolClosedLoopZeroColor = "blue";
  #symbolPoleColor = "green";

  #stabilityDeterminationElementColor = "#a0a0a0";

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

      this.#absWMax = Math.min(2 * Math.PI * nyquistF, this.#defaultAbsWMax);
    } else {
      this.#isDiscrete = false;
      this.#absWMax = this.#defaultAbsWMax;
    }

    if (areAllTfTermsNumbers(numeratorTermsArray, denominatorTermsArray)) {
      this.computeNyquistPlotCurvePoints(
        this.#numeratorTermsArray,
        this.#denominatorTermsArray
      );
    }

    [this.#stability, this.#closedLoopTfZeros] =
      computeStabilityAndClosedLoopTfZeros(
        this.#numeratorTermsArray,
        this.#denominatorTermsArray,
        this.#isDiscrete
      );

    if (!plotContainerDomElement || !functionPlot) {
      // return Nyquist curve points & stability without displaying the plot (ex. for testing)
      return {
        curvePoints: this.#curvePoints,
        stability: this.#stability,
      };
    } else {
      this.#plotContainerDomElement = plotContainerDomElement;
      //create the plot DOM element inside the container
      const markup = `
        <div class="nyquist-plot" id="nyquist-plot"></div>
      `;
      plotContainerDomElement.insertAdjacentHTML("afterbegin", markup);

      this.#nyquistPlotDomElement =
        plotContainerDomElement.querySelector("#nyquist-plot");

      this.createNyquistPlot();
      this.insertZerosPolesAndStabilityMarkup(this.#stability);

      return this.#nyquistObserver;
    }
  }

  /**
   * Numerical computation of Nyquist plot curve points
   */
  computeNyquistPlotCurvePoints() {
    this.#curvePoints = [];

    const [real, imag] = this.#isDiscrete
      ? computeDiscreteTimeNyquistRealAndImagWFunctions(
          this.#numeratorTermsArray,
          this.#denominatorTermsArray,
          this.#samplingT
        )
      : computeNyquistRealAndImagWFunctions(
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

    wMin = -1 * this.#absWMax;
    wMax = -1 * this.#absWMin;
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
      wMin = this.#absWMin;
      wMax = this.#absWMax;
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

    const arrowsNumber = 100;
    const maxAllowedDistanceOfConsecutivePoints = 50;

    //set limits for coordinates of plotted points
    const xMax = 10 ** 4;
    const yMax = 10 ** 4;

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
        // {
        //   graphType: "polyline",
        //   fn: (scope) => {
        //     return linearInterpolationOfCurvePoints(
        //       this.#curvePoints.filter((x) => x[0] > 0).map((x) => [x[1], x[2]])
        //     )(scope.x);
        //   },
        // },
        // {
        //   graphType: "polyline",
        //   fn: (scope) => {
        //     return linearInterpolationOfCurvePoints(
        //       this.#curvePoints.filter((x) => x[0] < 0).map((x) => [x[1], x[2]])
        //     )(scope.x);
        //   },
        //   color: this.#curveSegmentColor2,
        // },
        ...divideNyquistCurveIntoSegments(
          this.#curvePoints
            .filter((x) => x[0] > 0 && x[1] < xMax && x[2] < yMax)
            .map((x) => [x[1], x[2]]),
          maxAllowedDistanceOfConsecutivePoints
        ).map((curvePointsSegment) => {
          return {
            points: curvePointsSegment,
            fnType: "points",
            graphType: "polyline",
            color: this.#isDiscrete
              ? this.#curveSegmentDiscreteColor1
              : this.#curveSegmentColor1,
          };
        }),
        ...divideNyquistCurveIntoSegments(
          this.#curvePoints
            .filter((x) => x[0] < 0 && x[1] > -xMax && x[2] > -yMax)
            .map((x) => [x[1], x[2]]),
          maxAllowedDistanceOfConsecutivePoints
        ).map((curvePointsSegment) => {
          return {
            points: curvePointsSegment,
            fnType: "points",
            graphType: "polyline",
            color: this.#curveSegmentColor2,
          };
        }),
        {
          points: this.#zeros,
          fnType: "points",
          graphType: "scatter",
          color: this.#symbolOpenLoopZeroColor,
        },
        {
          points: this.#poles,
          fnType: "points",
          graphType: "scatter",
          color: this.#symbolPoleColor,
        },
        ...this.#poles.map((z) => {
          return {
            points: [
              [z[0] - 0.1, z[1] - 0.1],
              [z[0] + 0.1, z[1] + 0.1],
            ],
            fnType: "points",
            graphType: "polyline",
            color: this.#symbolPoleColor,
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
            color: this.#symbolPoleColor,
          };
        }),
        {
          points: this.#closedLoopTfZeros,
          fnType: "points",
          graphType: "scatter",
          color: this.#symbolClosedLoopZeroColor,
        },
        this.#isDiscrete
          ? {
              x: "cos(t)",
              y: "sin(t)",
              fnType: "parametric",
              graphType: "polyline",
              color: this.#stabilityDeterminationElementColor,
            }
          : {
              points: [[-1, 0]],
              fnType: "points",
              graphType: "scatter",
              color: this.#stabilityDeterminationElementColor,
            },
        ...Array.from(Array(arrowsNumber))
          .map((_, i) =>
            Math.floor((i / arrowsNumber) * this.#curvePoints.length)
          )
          .map((x) => {
            return this.#curvePoints.length > 1
              ? {
                  vector: [
                    this.#curvePoints[x + 1][1] - this.#curvePoints[x][1],
                    this.#curvePoints[x + 1][2] - this.#curvePoints[x][2],
                  ],
                  offset: [this.#curvePoints[x][1], this.#curvePoints[x][2]],
                  graphType: "polyline",
                  fnType: "vector",
                }
              : {
                  vector: [],
                  offset: [],
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
    const circles =
      this.#nyquistPlotDomElement.querySelectorAll("g.graph circle");
    circles.forEach((c) => {
      //select zeros & other circle elements
      if (
        [
          this.#symbolOpenLoopZeroColor,
          this.#symbolClosedLoopZeroColor,
          this.#stabilityDeterminationElementColor,
        ].includes(c.getAttribute("stroke"))
      ) {
        c.style.opacity = 1;
        c.r.baseVal.value = 2.5;
      }
      //select poles
      else if ([this.#symbolPoleColor].includes(c.getAttribute("stroke"))) {
        c.style.opacity = 0.75;
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

  insertZerosPolesAndStabilityMarkup(stability) {
    const zerosPolesAndStabilityGridContainer =
      this.#plotContainerDomElement.parentNode.querySelector(
        "#zeros-poles-and-stability-grid-container"
      );
    const zerosPolesAndStabilityGrid =
      this.#plotContainerDomElement.parentNode.querySelector(
        "#zeros-poles-and-stability-grid"
      );
    if (this.#zeros.concat(this.#poles).length > 10) {
      makeElementFontSizeSmaller(zerosPolesAndStabilityGridContainer);
    } else {
      makeElementFontSizeNormal(zerosPolesAndStabilityGridContainer);
    }

    const markup = `
    <div>
      <div class="symbol-open-loop-zero"><div></div></div>
      <p>Zero${this.#zeros.length === 1 ? "" : "s"}:</p>
    </div>
    <p> ${
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
    <div>
      <p class="symbol-pole">&times;</p>
      <p>Pole${this.#poles.length === 1 ? "" : "s"}:</p>
    </div>
    <p> ${
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
    ${
      stability
        ? `<div>
            <div class="symbol-closed-loop-zero"><div></div></div>
            <p>Stable:</p>
          </div> 
          <p>${stability}</p>`
        : ""
    }
  `;
    zerosPolesAndStabilityGrid.innerHTML = "";
    zerosPolesAndStabilityGrid.insertAdjacentHTML("afterbegin", markup);
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
  // define real & imag functions
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

/**
 * Starting from the total transfer function of a system, as a ratio of polynomials of variable Z,
 * after the latter variable is substituted by the complex number z=e^(w*i*T),
 * compute the real & imag functions of variable w, constituting the parametric Nyquist plot's curve
 */
const computeDiscreteTimeNyquistRealAndImagWFunctions = function (
  numeratorTermsArray,
  denominatorTermsArray,
  samplingT
) {
  logMessages(
    ["[CP-94] Discrete-time Nyquist plot z=e^(w*i) substitution"],
    "checkpoints"
  );

  //
  // define real & imag functions
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

  const real = (w) =>
    (numReal(w) * denReal(w) + numImag(w) * denImag(w)) /
    (denReal(w) ** 2 + denImag(w) ** 2);

  const imag = (w) =>
    (numImag(w) * denReal(w) - numReal(w) * denImag(w)) /
    (denReal(w) ** 2 + denImag(w) ** 2);

  return [real, imag];
};

/**
 * Numerical computation of the system's stability
 * and the (complex) zeros of the respective closed loop tf,
 * via the position of the latter
 *
 * @returns an array with two elements:
 * - a string with either the result of its stability or undefined
 * - an array with the closed loop tf zeros
 */
const computeStabilityAndClosedLoopTfZeros = function (
  numeratorTermsArray,
  denominatorTermsArray,
  isDiscrete
) {
  let stability;
  let closedLoopTfZeros;
  if (areAllTfTermsNumbers(numeratorTermsArray, denominatorTermsArray)) {
    const closedLoopTfNumerator = add(
      new Polynomial(isDiscrete ? "z" : "s", numeratorTermsArray),
      new Polynomial(isDiscrete ? "z" : "s", denominatorTermsArray)
    );
    closedLoopTfZeros = findComplexRootsOfPolynomial(
      getTermsArray(closedLoopTfNumerator)
    );

    if (closedLoopTfZeros.length > 0) {
      if (isDiscrete) {
        if (
          closedLoopTfZeros.every(
            (x) =>
              Math.sqrt(x[0] ** 2 + x[1] ** 2) <=
              1 - toleranceNumericalAnalysisSmall
          )
        ) {
          stability = "yes";
        } else if (
          closedLoopTfZeros.some(
            (x) =>
              Math.sqrt(x[0] ** 2 + x[1] ** 2) >=
              1 + toleranceNumericalAnalysisSmall
          )
        ) {
          stability = "no";
        } else {
          stability = "marginally";
        }
      } else {
        if (
          closedLoopTfZeros.every(
            (x) => x[0] < 0 - toleranceNumericalAnalysisSmall
          )
        ) {
          stability = "yes";
        } else if (
          closedLoopTfZeros.some(
            (x) => x[0] > 0 + toleranceNumericalAnalysisSmall
          )
        ) {
          stability = "no";
        } else {
          stability = "marginally";
        }
      }
    }
  } else {
    stability = "N/A";
  }
  return [stability, Array.isArray(closedLoopTfZeros) ? closedLoopTfZeros : []];
};

/**
 * Divide a Nyquist plot curve into multiple segments, in case
 * connections between two consecutive points of paths tending into inf
 * are expected to be made
 *
 * @returns an array of curve segments
 * (with each curve segment as an array of points)
 */
const divideNyquistCurveIntoSegments = (
  curvePoints,
  maxAllowedDistanceOfConsecutivePoints
) => {
  const allSegments = [];
  let currentSegment = [];

  for (let p of curvePoints) {
    if (currentSegment.length === 0) {
      currentSegment.push(p);
    } else {
      const lastP = currentSegment.slice(-1)[0];

      if (
        (lastP[0] * p[0] < 0 || lastP[1] * p[1] < 0) &&
        Math.sqrt((lastP[0] - p[0]) ** 2 + (lastP[1] - p[1]) ** 2) >
          maxAllowedDistanceOfConsecutivePoints
      ) {
        //segment end
        allSegments.push([...currentSegment]);
        currentSegment = [];
      }
      currentSegment.push(p);
    }
  }
  allSegments.push([...currentSegment]);

  return allSegments;
};
