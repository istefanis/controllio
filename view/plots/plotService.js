/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / Plots / PlotService
 */

import { isPowerOfTen, roundDecimal } from "../../util/commons.js";
import { logMessages } from "../../util/loggingService.js";

// to abort computations that take too long
export const maxCurvePointsAllowed = 250000;

/**
 * Remove altogether (if not needed), or adjust the appearance of a plot's axis tick element
 */
export const removeOrFormatAxisTickElement = function (element) {
  if (Number.isNaN(+element.textContent.slice(-1))) {
    //convert thousands, millions & billions notation
    if (element.textContent.endsWith("k")) {
      const decimals = computeDecimals(element.textContent);
      element.textContent = element.textContent
        .slice(0, -1)
        .replace(".", "")
        .concat("0".repeat(3 - decimals));
    } else if (element.textContent.endsWith("M")) {
      const decimals = computeDecimals(element.textContent);
      element.textContent = element.textContent
        .slice(0, -1)
        .replace(".", "")
        .concat("0".repeat(6 - decimals));
    } else if (element.textContent.endsWith("G")) {
      const decimals = computeDecimals(element.textContent);
      element.textContent = element.textContent
        .slice(0, -1)
        .replace(".", "")
        .concat("0".repeat(9 - decimals));
    } else {
      element.remove();
    }
  }
  const tickIsPowerOfTen = isPowerOfTen(+element.textContent.replace("−", "-"));
  // console.log(element.textContent);
  if (
    !Number.isNaN(+element.textContent.replace("−", "-")) &&
    !tickIsPowerOfTen
  ) {
    // console.log("case1:", element.textContent);
    element.remove();
  } else if (tickIsPowerOfTen) {
    // console.log("case2:", element.textContent);
    const expForm = (+element.textContent.replace("−", "-")).toExponential();
    element.textContent = `${expForm < 0 ? "-" : ""}10^${expForm
      .split("e")[1]
      .replaceAll("+", "")}`;
    // console.log(element.textContent);
  }
};

const computeDecimals = (textContent) => {
  const dotIndex = textContent.indexOf(".");
  return dotIndex !== -1 ? textContent.length - dotIndex - 2 : 0;
};

/**
 * Adjust the appearance of a plot's tip
 */
export const formatTip = (tipElement) => {
  tipElement.querySelector("text").style.fill = "#000";
  tipElement.querySelector("circle").style.fill = "#000";
  tipElement.querySelector("circle").setAttribute("r", "2");
};

/**
 * A step used in the numerical computation of a curve's points,
 * whose size is adjusted based on w, or the curve's slope & its change
 */
export class VariableStep {
  //tiny fixed step: for small w, or large curve slopes, or large curve slope changes
  #tinyFixedStepCurveSlopeThreshold = 500;
  #tinyFixedStepCurveSlopeChangeThreshold = 2;
  #tinyFixedStep = 0.0005;

  //small fixed step: for regular curve slopes, or regular curve slope changes
  #wSmallFixedStepThreshold = 0.1;
  #smallFixedStep = 0.005;

  //log step: for large w
  #wLogStepThreshold = 10;
  #logStepFactor = 0.1;

  #fixedStepEnabled = true;
  #fixedStep = this.#tinyFixedStep;
  #lastCurveSlope = 0;

  getAdjustedStepSize(w, curveSlope) {
    // console.log(w, curveSlope);
    const curveSlopeChange = Math.abs(curveSlope - this.#lastCurveSlope);

    if (
      w < this.#wLogStepThreshold &&
      curveSlope >= this.#tinyFixedStepCurveSlopeThreshold &&
      curveSlopeChange >= this.#tinyFixedStepCurveSlopeChangeThreshold &&
      (!this.#fixedStepEnabled || this.#fixedStep !== this.#tinyFixedStep)
    ) {
      // console.log(curveSlope, this.#lastCurveSlope);
      // logMessages(
      //   [
      //     `[CP-80] Tiny fixed step ${
      //       this.#tinyFixedStep
      //     } enabled at w=${roundDecimal(w, 5)}, curve slope=${roundDecimal(
      //       curveSlope,
      //       3
      //     )} and curve slope change=${roundDecimal(curveSlopeChange, 3)}`,
      //   ],
      //   "checkpoints"
      // );
      this.#fixedStep = this.#tinyFixedStep;
      this.#fixedStepEnabled = true;
    } else if (
      w > this.#wSmallFixedStepThreshold &&
      w < this.#wLogStepThreshold &&
      curveSlope < this.#tinyFixedStepCurveSlopeThreshold &&
      curveSlopeChange < this.#tinyFixedStepCurveSlopeChangeThreshold &&
      (!this.#fixedStepEnabled || this.#fixedStep === this.#tinyFixedStep)
    ) {
      // console.log(curveSlope, this.#lastCurveSlope);
      // logMessages(
      //   [
      //     `[CP-81] Small fixed step ${
      //       this.#smallFixedStep
      //     } enabled at w=${roundDecimal(w, 5)}, curve slope=${roundDecimal(
      //       curveSlope,
      //       3
      //     )} and curve slope change=${roundDecimal(curveSlopeChange, 3)}`,
      //   ],
      //   "checkpoints"
      // );
      this.#fixedStep = this.#smallFixedStep;
      this.#fixedStepEnabled = true;
    } else if (w >= this.#wLogStepThreshold && this.#fixedStepEnabled) {
      // console.log(curveSlope, this.#lastCurveSlope);
      // logMessages(
      //   [
      //     `[CP-82] Log step enabled at w=${roundDecimal(
      //       w,
      //       5
      //     )}, curve slope=${roundDecimal(
      //       curveSlope,
      //       3
      //     )} and curve slope change=${roundDecimal(curveSlopeChange, 3)}`,
      //   ],
      //   "checkpoints"
      // );
      this.#fixedStepEnabled = false;
    }

    this.#lastCurveSlope = curveSlope;

    if (this.#fixedStepEnabled) {
      return this.#fixedStep;
    } else {
      //logStep
      return this.#logStepFactor * Math.log10(w + 1) ** 5;
    }
  }
}

/**
 * Unwraps phase curves computed using Math.atan2(),
 * based on the comparison of consecutive phase values
 */
export class PhaseUnwrapper {
  #phaseAdjustmentTotal = 0; //in degrees
  #newAdjustment = 0;
  #expectedSteepPhaseShiftsMap;

  constructor(expectedSteepPhaseShiftsMap) {
    this.#expectedSteepPhaseShiftsMap = expectedSteepPhaseShiftsMap;
  }

  unwrapPhaseValue(newPhaseValue, lastPhaseValue, w) {
    newPhaseValue += this.#phaseAdjustmentTotal;
    this.#newAdjustment = 0;
    let diff = newPhaseValue - lastPhaseValue;
    if (diff > 300) {
      // console.log("case1", newPhaseValue, lastPhaseValue);
      logMessages(
        [`[CP-83] Phase unwarp adjustment by -360, at w=${roundDecimal(w, 5)}`],
        "checkpoints"
      );
      this.#newAdjustment = -360;
    } else if (diff < -300) {
      // console.log("case2", newPhaseValue, lastPhaseValue);
      logMessages(
        [`[CP-84] Phase unwarp adjustment by +360, at w=${roundDecimal(w, 5)}`],
        "checkpoints"
      );
      this.#newAdjustment = 360;
    } else if (
      (diff > 70 || diff < -70) &&
      [...this.#expectedSteepPhaseShiftsMap].filter(
        (x) => Math.abs(x[0] - w) < 0.05
      ).length === 1
    ) {
      // console.log("case3", newPhaseValue, lastPhaseValue);
      const expectedSteepPhaseShift = [
        ...this.#expectedSteepPhaseShiftsMap,
      ].filter((x) => Math.abs(x[0] - w) < 0.05)[0][1];
      logMessages(
        [
          `[CP-85] Steep phase shift by ${
            expectedSteepPhaseShift > 0 ? "+" : ""
          }${expectedSteepPhaseShift} at w=${roundDecimal(w, 5)}`,
        ],
        "checkpoints"
      );
      this.#newAdjustment = expectedSteepPhaseShift;
      diff = this.#newAdjustment;
      return lastPhaseValue + diff;
    }
    diff += this.#newAdjustment;
    this.#phaseAdjustmentTotal += this.#newAdjustment;
    return lastPhaseValue + diff;
  }
}
