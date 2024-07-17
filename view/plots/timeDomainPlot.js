/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / Plots / TimeDomainPlot
 */

import { tfEvaluatedWithComplexNumber } from "../../math/complexAnalysis/complexAnalysisService.js";
import {
  linearInterpolationOfCurvePoints,
  talbotMethodForLaplaceTransformInversion,
  divisionMethodForZTransformInversion,
} from "../../math/numericalAnalysis/numericalAnalysisService.js";
import { areAllTfTermsNumbers } from "../../util/commons.js";
import { logMessages } from "../../util/loggingService.js";
import {
  functionPlot,
  maxCurvePointsAllowed,
  formatTip,
} from "./plotService.js";

export default class TimeDomainPlot {
  #timeResponsePlotDomElement;
  #trajectoryPlotDomElement;
  #numeratorTermsArray;
  #denominatorTermsArray;
  #zeros;
  #poles;
  #isDiscrete;

  #plotContainerDomElement;

  #timeResponseCurvePoints = [];
  #trajectoryCurvePoints = [];

  #minFunctionValue;
  #maxFunctionValue;

  #tMin;
  #tMax;
  #step;

  #timeDomainObserver = {};

  constructor(
    plotContainerDomElement,
    numeratorTermsArray,
    denominatorTermsArray,
    timeDomainInputSignal,
    zeros,
    poles,
    samplingT
  ) {
    this.#numeratorTermsArray = numeratorTermsArray;
    this.#zeros = zeros;
    this.#poles = poles;
    this.#isDiscrete = samplingT ? true : false;

    if (areAllTfTermsNumbers(numeratorTermsArray, denominatorTermsArray)) {
      if (this.#isDiscrete) {
        this.#tMin = 0;
        this.#step = samplingT;
        this.#tMax = Math.min(20, 200 * samplingT);

        // *z/(z-1) for step input
        this.#numeratorTermsArray =
          timeDomainInputSignal === "step"
            ? [...numeratorTermsArray, 0]
            : numeratorTermsArray;
        this.#denominatorTermsArray =
          timeDomainInputSignal === "step"
            ? [...denominatorTermsArray, 0].map(
                (x, i) => x - [0, ...denominatorTermsArray][i]
              )
            : denominatorTermsArray;
      } else {
        this.#tMin = 0.01;
        this.#step = 0.05;
        this.#tMax = 20;

        // *1/s for step input
        this.#denominatorTermsArray =
          timeDomainInputSignal === "step"
            ? [...denominatorTermsArray, 0]
            : denominatorTermsArray;
      }

      this.computeTimeDomainPlotCurvePoints(
        this.#numeratorTermsArray,
        this.#denominatorTermsArray
      );
    }

    if (!plotContainerDomElement || !functionPlot) {
      // return time domain curve points without displaying the plots (ex. for testing)
      return {
        timeResponseCurvePoints: this.#timeResponseCurvePoints,
        trajectoryCurvePoints: this.#trajectoryCurvePoints,
      };
    } else {
      this.#plotContainerDomElement = plotContainerDomElement;
      //create the two plot DOM elements inside the container
      const markup = `
      <div class="time-domain-subplot" id="time-response-plot"></div>
      <div class="time-domain-subplot" id="trajectory-plot"></div>
    `;
      plotContainerDomElement.insertAdjacentHTML("afterbegin", markup);

      this.#timeResponsePlotDomElement = plotContainerDomElement.querySelector(
        "#time-response-plot"
      );
      this.#trajectoryPlotDomElement =
        plotContainerDomElement.querySelector("#trajectory-plot");

      this.createTimeDomainPlot();

      return this.#timeDomainObserver;
    }
  }

  /**
   * Numerical computation of time domain plot curve points
   */
  computeTimeDomainPlotCurvePoints() {
    this.#timeResponseCurvePoints = [];
    this.#trajectoryCurvePoints = [];

    //
    // curve points numerical computation loop
    //
    let newFunctionValue;
    let newVelocityValue;
    let lastFunctionValue;

    let i = 0;

    const discreteFunctionPoints = this.#isDiscrete
      ? divisionMethodForZTransformInversion(
          this.#numeratorTermsArray,
          this.#denominatorTermsArray,
          Math.floor(this.#tMax / this.#step) + 1
        )
      : null;

    for (let t = this.#tMin; t <= this.#tMax; t += this.#step) {
      //new values
      newFunctionValue = this.#isDiscrete
        ? discreteFunctionPoints[i]
        : talbotMethodForLaplaceTransformInversion(
            tfEvaluatedWithComplexNumber(
              this.#numeratorTermsArray,
              this.#denominatorTermsArray
            ),
            t,
            100
          );

      if (!lastFunctionValue) {
        lastFunctionValue = newFunctionValue;
      }
      newVelocityValue = (newFunctionValue - lastFunctionValue) / this.#step;

      //add new points
      this.#timeResponseCurvePoints.push([t, newFunctionValue]);
      this.#trajectoryCurvePoints.push([newVelocityValue, newFunctionValue]);

      //update other values
      lastFunctionValue = newFunctionValue;
      i++;

      //guard clause
      if (i > maxCurvePointsAllowed) {
        console.error(
          "computeTimeDomainPlotCurvePoints()",
          "Too many curve points - computation aborted"
        );
        break;
      }
    }
    logMessages(
      ["[CP-93] Total number of time response curve points: " + i],
      "checkpoints"
    );

    //reset first trajectory point value
    this.#trajectoryCurvePoints[0] = this.#trajectoryCurvePoints[1];
  }

  createTimeDomainPlot() {
    let plotBoundRect =
      this.#timeResponsePlotDomElement.getBoundingClientRect();
    let plotWidth = plotBoundRect.width;
    let plotHeight = plotBoundRect.height;

    //calculate min & max values
    const timeResponseCurvePoints = this.#timeResponseCurvePoints.map(
      (x) => x[1]
    );
    this.#minFunctionValue = Math.min(...timeResponseCurvePoints);
    this.#maxFunctionValue = Math.max(...timeResponseCurvePoints);
    const maxAbsoluteFunctionValue = Math.max(
      Math.abs(this.#minFunctionValue),
      Math.abs(this.#maxFunctionValue)
    );

    const trajectoryCurvePoints = this.#trajectoryCurvePoints.map((x) => x[0]);
    const minVelocity = Math.min(...trajectoryCurvePoints);
    const maxVelocity = Math.max(...trajectoryCurvePoints);
    const maxAbsoluteVelocityValue = Math.max(
      Math.abs(minVelocity),
      Math.abs(maxVelocity)
    );

    //create the two plots
    const timeResponsePlot = functionPlot({
      target: `#${this.#timeResponsePlotDomElement.id}`,
      width: plotWidth,
      height: plotHeight,
      title: "Time response",
      xAxis: {
        label: "Time [s]",
        domain: [0, this.#tMax],
      },
      yAxis: {
        label: "f(t)",
        domain: [-maxAbsoluteFunctionValue, maxAbsoluteFunctionValue],
      },
      tip: {
        xLine: true,
        yLine: true,
      },
      grid: true,
      data: this.#isDiscrete
        ? [
            {
              graphType: "polyline",
              fn: (scope) => {
                return linearInterpolationOfCurvePoints(
                  this.#timeResponseCurvePoints
                )(scope.x);
              },
              color: "#c0c0c0",
            },
            {
              points: this.#timeResponseCurvePoints,
              fnType: "points",
              graphType: "scatter",
              color: "black",
            },
          ]
        : this.#timeResponseCurvePoints.length > 0
        ? [
            {
              graphType: "polyline",
              fn: (scope) => {
                return linearInterpolationOfCurvePoints(
                  this.#timeResponseCurvePoints
                )(scope.x);
              },
            },
          ]
        : [
            {
              points: this.#timeResponseCurvePoints,
              fnType: "points",
              graphType: "scatter",
              color: "black",
            },
          ],
    });

    const trajectoryPlot = functionPlot({
      target: `#${this.#trajectoryPlotDomElement.id}`,
      width: plotWidth,
      height: plotHeight,
      title: "Trajectory",
      xAxis: {
        label: "df(t)/dt",
        domain: [-maxAbsoluteVelocityValue, maxAbsoluteVelocityValue],
      },
      yAxis: {
        label: "f(t)",
        domain: [-maxAbsoluteFunctionValue, maxAbsoluteFunctionValue],
      },
      grid: true,
      data: this.#isDiscrete
        ? [
            {
              points: this.#trajectoryCurvePoints,
              fnType: "points",
              graphType: "polyline",
              color: "#c0c0c0",
            },
            {
              points: this.#trajectoryCurvePoints,
              fnType: "points",
              graphType: "scatter",
              color: "black",
            },
          ]
        : [
            {
              points: this.#trajectoryCurvePoints,
              fnType: "points",
              graphType: "polyline",
            },
          ],
    });

    //adjust appearance
    this.adjustTimeDomainPlotAppearance();
  }

  adjustTimeDomainPlotAppearance() {
    [this.#timeResponsePlotDomElement, this.#trajectoryPlotDomElement].forEach(
      (x) => {
        //adjust height for plot title
        x
          .getElementsByClassName("canvas")[0]
          .transform.baseVal.getItem(0).matrix.f = 25;

        //adjust title font size
        x.getElementsByClassName("title")[0].style.fontSize = "11px";
      }
    );

    //adjust tip's appearance
    formatTip(
      this.#timeResponsePlotDomElement.getElementsByClassName("inner-tip")[0]
    );
  }
}
