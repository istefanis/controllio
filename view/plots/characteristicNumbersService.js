/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / Plots / CharacteristicNumbersService
 */

import { roundDecimal } from "../../util/commons.js";
import {
  halfIntervalMethod,
  NewtonsMethod,
} from "../../math/numericalAnalysis/numericalAnalysisService.js";

//values required for characteristic numbers computations
let magnitudeAtWMin;
let magnitudeAtWMax;
let magnitudeAt001;
let magintudeAt100;
let bandwidthThreshold;
let wLowerCutoff;
let wUpperCutoff;

//filter types
let isAllPassFilter;
let isNoPassFilter;
let isBandPassFilter;
let isBandStopFilter;
let isLowPassFilter;
let isHighPassFilter;

//characteristic numbers text values
let filterTypeText;
let bandwidthText;
let thresholdText;
let rollOffText;

const halfPowerThreshold = Math.sqrt(2) / 2;

export const computeAndDisplayCharacteristicNumbers = function (
  magnitude,
  phaseCurvePoints,
  wMin,
  wMax,
  minMagnitude,
  maxMagnitude
) {
  resetCharacteristicNumbers();

  computeValuesRequired(magnitude, phaseCurvePoints, wMin, wMax);
  computeFilterTypeText(minMagnitude, maxMagnitude);
  computeBandwidthAndThresholdText();
  computeRollOffText(wMin, wMax);

  // console.log(filterTypeText);
  // console.log("Bandwidth      = " + bandwidthText);
  // console.log("Threshold      = " + thresholdText);
  // console.log("Roll-off       = " + rollOffText);

  insertCharacteristicNumbersMarkup();
};

const resetCharacteristicNumbers = function () {
  isAllPassFilter = false;
  isNoPassFilter = false;
  isBandPassFilter = false;
  isBandStopFilter = false;
  isLowPassFilter = false;
  isHighPassFilter = false;

  filterTypeText = "";
  bandwidthText = "";
  thresholdText = "";
  rollOffText = "";
};

const computeValuesRequired = function (magnitude, phase, wMin, wMax) {
  magnitudeAtWMin = magnitude(wMin);
  magnitudeAtWMax = magnitude(wMax);

  //magnitude at faraway points required for roll-off computation:
  magnitudeAt001 = magnitude(0.01);
  magintudeAt100 = magnitude(100);

  bandwidthThreshold = halfPowerThreshold;
  const bandwidthFunction = (w) => magnitude(w) - bandwidthThreshold;
  //TODO - verify numbers chosen
  const initialW =
    halfIntervalMethod(bandwidthFunction, wMin, wMax) ||
    NewtonsMethod(bandwidthFunction, 0.011) ||
    NewtonsMethod(bandwidthFunction, 0.101) ||
    NewtonsMethod(bandwidthFunction, 1.001) ||
    NewtonsMethod(bandwidthFunction, 10.01);

  wLowerCutoff = initialW
    ? halfIntervalMethod(bandwidthFunction, wMin, initialW + wMin)
    : false;

  wUpperCutoff = wLowerCutoff
    ? halfIntervalMethod(bandwidthFunction, initialW + wMin, wMax)
    : false;

  // TODO - add more characteristic numbers
  // console.log(initialW);
  // console.log("lower cut-off freq:", wLowerCutoff);
  // console.log("upper cut-off freq:", wUpperCutoff);

  // const wGainMargin //for which phaseCurve = -180
  // const gainMargin = wGainMargin ? 1 / magnitude(wGainMargin) : false;

  // const phaseMarginFunction = (w) => magnitude(w) - 1;
  // const wPhaseMargin = halfIntervalMethod(phaseMarginFunction, wMin, wMax);
  // const phaseMargin = wPhaseMargin ? 180 + phaseCurve(wPhaseMargin) : false;
};

const computeFilterTypeText = function (minMagnitude, maxMagnitude) {
  if (minMagnitude > bandwidthThreshold) {
    filterTypeText = "All pass filter";
    isAllPassFilter = true;
    return;
  }
  if (maxMagnitude < bandwidthThreshold) {
    filterTypeText = "No pass filter";
    isNoPassFilter = true;
    return;
  }
  if (
    magnitudeAtWMin < bandwidthThreshold &&
    magnitudeAtWMax < bandwidthThreshold &&
    maxMagnitude > bandwidthThreshold &&
    wLowerCutoff &&
    wUpperCutoff
  ) {
    filterTypeText = "Band-pass filter";
    isBandPassFilter = true;
    return;
  }
  if (
    magnitudeAtWMin > bandwidthThreshold &&
    magnitudeAtWMax > bandwidthThreshold &&
    minMagnitude < bandwidthThreshold &&
    wLowerCutoff &&
    wUpperCutoff
  ) {
    filterTypeText = "Band-stop filter";
    isBandStopFilter = true;
    return;
  }
  if (
    magnitudeAtWMin / magnitudeAtWMax > 1.5 &&
    magnitudeAtWMin > bandwidthThreshold &&
    !(magnitudeAtWMax > 3 * bandwidthThreshold)
  ) {
    filterTypeText = "Low-pass filter";
    isLowPassFilter = true;
    return;
  }
  if (
    magnitudeAtWMax / magnitudeAtWMin > 1.5 &&
    magnitudeAtWMax > bandwidthThreshold &&
    !(magnitudeAtWMin > 3 * bandwidthThreshold)
  ) {
    filterTypeText = "High-pass filter";
    isHighPassFilter = true;
    return;
  }
  if (filterTypeText !== "") {
    console.log(filterTypeText);
  }
};

const computeBandwidthAndThresholdText = function () {
  const bandwidthThresholdRounded = roundDecimal(bandwidthThreshold, 3);
  const halfPowerThresholdRounded = roundDecimal(halfPowerThreshold, 3);
  const defaultThresholdText = `${bandwidthThresholdRounded}${
    bandwidthThresholdRounded === halfPowerThresholdRounded ? " = -3 [dB]" : ""
  }`;

  if (!wLowerCutoff) {
    bandwidthText = "(0, ∞) [rad/s]";
    thresholdText = defaultThresholdText;
    return;
  }
  if (!wUpperCutoff && wLowerCutoff) {
    const wLowerCutoffRounded = roundDecimal(wLowerCutoff, 2);
    if (wLowerCutoffRounded === 0) {
      bandwidthText = "(0, ∞) [rad/s]";
    } else {
      if (isLowPassFilter) {
        bandwidthText = `(0, ${wLowerCutoffRounded}] [rad/s]`;
      } else {
        bandwidthText = `[${wLowerCutoffRounded}, ∞) [rad/s]`;
      }
    }
    thresholdText = defaultThresholdText;
    return;
  }
  if (
    wUpperCutoff &&
    wLowerCutoff &&
    roundDecimal(wUpperCutoff, 2) > roundDecimal(wLowerCutoff, 2)
  ) {
    const wLowerCutoffRounded = roundDecimal(wLowerCutoff, 2);
    const wUpperCutoffRounded = roundDecimal(wUpperCutoff, 2);
    if (wLowerCutoffRounded === 0) {
      bandwidthText = `(0, ${wUpperCutoffRounded}] [rad/s],`;
    } else {
      if (isBandStopFilter) {
        bandwidthText = `(0, ${wLowerCutoffRounded}] ∪ [${wUpperCutoffRounded}, ∞) [rad/s]`;
      } else {
        bandwidthText = `[${wLowerCutoffRounded}, ${wUpperCutoffRounded}] [rad/s]`;
      }
    }
    thresholdText = defaultThresholdText;
    return;
  }
  if (wLowerCutoff) {
    const wLowerCutoffRounded = roundDecimal(wLowerCutoff, 2);
    if (wLowerCutoffRounded === 0) {
      bandwidthText = `(0, ∞) [rad/s]`;
    } else {
      bandwidthText = `(0, ${wLowerCutoffRounded}] [rad/s]`;
    }
    thresholdText = defaultThresholdText;
  }
};

const computeRollOffText = function (wMin, wMax) {
  if (isLowPassFilter) {
    const rollOff = roundDecimal(
      Math.log(magintudeAt100 / magnitudeAtWMax) / Math.log(100 / wMax), //log(AR2/AR1)/log(w2/w1))
      3
    );
    rollOffText =
      rollOff === 0
        ? "0 (high)"
        : `${roundDecimal(20 * rollOff, 3)} [dB/dec] (high)`;
    return;
  }

  if (isHighPassFilter) {
    const rollOff = roundDecimal(
      Math.log(magnitudeAtWMin / magnitudeAt001) / Math.log(wMin / 0.01),
      3
    );
    rollOffText =
      rollOff === 0
        ? "0 (low)"
        : `${roundDecimal(20 * rollOff, 3)} [dB/dec] (low)`;
    return;
  }

  if (isBandPassFilter) {
    const rollOffLow = roundDecimal(
      Math.log(magnitudeAtWMin / magnitudeAt001) / Math.log(wMin / 0.01),
      3
    );
    const rollOffHigh = roundDecimal(
      Math.log(magintudeAt100 / magnitudeAtWMax) / Math.log(100 / wMax),
      3
    );
    rollOffText =
      (rollOffLow === 0
        ? "0 (low)"
        : `${roundDecimal(20 * rollOffLow, 3)} [dB/dec] (low)`) +
      ", " +
      (rollOffHigh === 0
        ? "0 (high)"
        : `${roundDecimal(20 * rollOffHigh, 3)} [dB/dec] (high)`);
    return;
  }
};

const insertCharacteristicNumbersMarkup = function () {
  const filterType = document.getElementById("filter-type");
  filterType.innerText = filterTypeText;

  const characteristicNumbersGrid = document.getElementById(
    "characteristic-numbers-grid"
  );
  const markup = `
    <p>Bandwidth</p><p>= ${bandwidthText !== "" ? bandwidthText : "N/A"}</p>
    <p>Threshold</p><p>= ${thresholdText !== "" ? thresholdText : "N/A"}</p>
    <p>Roll-off</p><p>= ${rollOffText !== "" ? rollOffText : "N/A"}</p>
  `;
  characteristicNumbersGrid.innerHTML = "";
  characteristicNumbersGrid.insertAdjacentHTML("afterbegin", markup);
};
