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
 * A step used in the numerical computation of a curve's points,
 * whose size is adjusted based on the curve's slope value
 */
export class VariableStep {
  #fixedStepEnabled = false;
  #fixedStep;
  #lastCurveSlope = 0;

  #logStepFactor = 0.5;
  #smallFixedStep = 0.001;
  #tinyFixedStep = 0.0005;
  #smallFixedStepThreshold = 3;
  #tinyFixedStepThreshold = 100;
  #curveSlopeChangeThreshold = 0.1;

  getAdjustedStepSize(w, curveSlope) {
    // console.log(w, curveSlope);
    const logStep = this.#logStepFactor * Math.log10(w + 1);

    if (
      (curveSlope < this.#smallFixedStepThreshold ||
        Math.abs(this.#lastCurveSlope - curveSlope) <
          this.#curveSlopeChangeThreshold) &&
      this.#fixedStepEnabled
    ) {
      // console.log(curveSlope, this.#lastCurveSlope);
      // logMessages(
      //   [
      //     `[CP-82] Log step re-enabled at w=${roundDecimal(
      //       w,
      //       5
      //     )} and curve slope=${roundDecimal(curveSlope, 3)}`,
      //   ],
      //   "checkpoints"
      // );
      this.#fixedStepEnabled = false;
    } else if (
      curveSlope >= this.#smallFixedStepThreshold &&
      curveSlope < this.#tinyFixedStepThreshold &&
      Math.abs(this.#lastCurveSlope - curveSlope) >
        this.#curveSlopeChangeThreshold &&
      (!this.#fixedStepEnabled || this.#fixedStep === this.#tinyFixedStep) &&
      this.#smallFixedStep < logStep
    ) {
      // console.log(curveSlope, this.#lastCurveSlope);
      // logMessages(
      //   [
      //     `[CP-80] Fixed step ${
      //       this.#smallFixedStep
      //     } enabled at w=${roundDecimal(w, 5)} and curve slope=${roundDecimal(
      //       curveSlope,
      //       3
      //     )}`,
      //   ],
      //   "checkpoints"
      // );
      this.#fixedStep = this.#smallFixedStep;
      this.#fixedStepEnabled = true;
    } else if (
      curveSlope >= this.#tinyFixedStepThreshold &&
      Math.abs(this.#lastCurveSlope - curveSlope) >
        this.#curveSlopeChangeThreshold &&
      (!this.#fixedStepEnabled || this.#fixedStep === this.#smallFixedStep) &&
      this.#tinyFixedStep < logStep
    ) {
      // logMessages(
      //   [
      //     `[CP-81] Fixed step ${
      //       this.#tinyFixedStep
      //     } enabled at w=${roundDecimal(w, 5)} and curve slope=${roundDecimal(
      //       curveSlope,
      //       3
      //     )}`,
      //   ],
      //   "checkpoints"
      // );
      this.#fixedStep = this.#tinyFixedStep;
      this.#fixedStepEnabled = true;
    }
    this.#lastCurveSlope = curveSlope;
    return !this.#fixedStepEnabled ? logStep : this.#fixedStep;
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
