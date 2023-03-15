/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / Plots / PlotService
 */

import { isPowerOfTen, roundDecimal } from "../../util/commons.js";
import { logMessages } from "../../util/loggingService.js";

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
export class AdjustableStep {
  #fixedStepEnabled = false;
  #fixedStep;

  #logStepFactor = 0.5;
  #smallFixedStep = 0.01;
  #tinyFixedStep = 0.00005;
  #smallFixedStepThreshold = 2.5;
  #tinyFixedStepThreshold = 100;

  getAdjustedStepSize(w, curveSlope) {
    const logStep = this.#logStepFactor * Math.log10(w + 1);

    if (curveSlope < this.#smallFixedStepThreshold && this.#fixedStepEnabled) {
      logMessages(
        [
          `[CP-84] Log step re-enabled at w=${roundDecimal(
            w,
            5
          )} and curve slope=${roundDecimal(curveSlope, 3)}`,
        ],
        "checkpoints"
      );
      this.#fixedStepEnabled = false;
    } else if (
      curveSlope >= this.#smallFixedStepThreshold &&
      curveSlope < this.#tinyFixedStepThreshold &&
      (!this.#fixedStepEnabled || this.#fixedStep === this.#tinyFixedStep) &&
      this.#smallFixedStep < logStep
    ) {
      logMessages(
        [
          `[CP-82] Fixed step ${
            this.#smallFixedStep
          } enabled at w=${roundDecimal(w, 5)} and curve slope=${roundDecimal(
            curveSlope,
            3
          )}`,
        ],
        "checkpoints"
      );
      this.#fixedStep = this.#smallFixedStep;
      this.#fixedStepEnabled = true;
    } else if (
      curveSlope >= this.#tinyFixedStepThreshold &&
      (!this.#fixedStepEnabled || this.#fixedStep === this.#smallFixedStep) &&
      this.#tinyFixedStep < logStep
    ) {
      logMessages(
        [
          `[CP-83] Fixed step ${
            this.#tinyFixedStep
          } enabled at w=${roundDecimal(w, 5)} and curve slope=${roundDecimal(
            curveSlope,
            3
          )}`,
        ],
        "checkpoints"
      );
      this.#fixedStep = this.#tinyFixedStep;
      this.#fixedStepEnabled = true;
    }
    return !this.#fixedStepEnabled ? logStep : this.#fixedStep;
  }
}

/**
 * An angle unwrapper used to correct the values of angle curves computed using Math.atan(),
 * based on the comparison of consecutive curve values
 */
export class PhaseUnwrapper {
  #phaseAdjustmentTotal = 0; //in degrees
  #phaseAdjustmentTriggered = false;
  #adjustedValue;

  adjustNewPhaseValue(newPhaseValue, lastPhaseValue) {
    newPhaseValue += this.#phaseAdjustmentTotal;
    if (
      newPhaseValue - lastPhaseValue > 0.4 * 180 &&
      !this.#phaseAdjustmentTriggered
    ) {
      logMessages(["[CP-85] Phase unwarp adjustment: -180"], "checkpoints");
      this.#phaseAdjustmentTriggered = true;
      this.#phaseAdjustmentTotal -= 180;
      this.#adjustedValue = newPhaseValue - 180;
    } else if (
      lastPhaseValue - newPhaseValue > 0.4 * 180 &&
      !this.#phaseAdjustmentTriggered
    ) {
      logMessages(["[CP-86] Phase unwarp adjustment: +180"], "checkpoints");
      this.#phaseAdjustmentTriggered = true;
      this.#phaseAdjustmentTotal += 180;
      this.#adjustedValue = newPhaseValue + 180;
    } else {
      this.#phaseAdjustmentTriggered = false;
      this.#adjustedValue = newPhaseValue;
    }
    return this.#adjustedValue;
  }
}
