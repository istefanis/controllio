/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / Plots / TimeDomainPlot
 */

import { tfEvaluatedWithComplexNumber } from "../../math/complexAnalysis/complexAnalysisService.js";
import {
  TalbotMethod,
  linearInterpolationOfCurvePoints,
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

  #plotContainerDomElement;

  #timeResponseCurvePoints = [];
  #trajectoryCurvePoints = [];

  #minFunctionValue;
  #maxFunctionValue;

  #tMin = 0.01;
  #tMax = 20;

  #timeDomainObserver = {};

  constructor(
    plotContainerDomElement,
    numeratorTermsArray,
    denominatorTermsArray,
    zeros,
    poles
  ) {
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
    this.#numeratorTermsArray = numeratorTermsArray;
    this.#denominatorTermsArray = denominatorTermsArray;
    this.#zeros = zeros;
    this.#poles = poles;

    if (areAllTfTermsNumbers(numeratorTermsArray, denominatorTermsArray)) {
      this.computeTimeDomainPlotCurvePoints(
        this.#numeratorTermsArray,
        this.#denominatorTermsArray
      );
    }

    this.createTimeDomainPlot();

    return this.#timeDomainObserver;
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
    const step = 0.05;

    for (let t = this.#tMin; t <= this.#tMax; t += step) {
      //new values
      newFunctionValue = TalbotMethod(
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
      newVelocityValue = (newFunctionValue - lastFunctionValue) / step;

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
      data: [
        {
          graphType: "polyline",
          fn: (scope) => {
            return linearInterpolationOfCurvePoints(
              this.#timeResponseCurvePoints
            )(scope.x);
          },
        },
        // {
        //   points: this.#timeResponseCurvePoints,
        //   fnType: "points",
        //   color: "red",
        //   graphType: "scatter",
        // },
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
      data: [
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
