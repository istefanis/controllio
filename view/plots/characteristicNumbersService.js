/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / Plots / CharacteristicNumbersService
 */

import { isOdd, roundDecimal } from "../../util/commons.js";
import {
  findCurveRootIntervals,
  halfIntervalMethod,
} from "../../math/numericalAnalysis/numericalAnalysisService.js";

let characteristicNumbersGridDomElement;

//values required for characteristic numbers computations
let magnitudeAtWMin;
let magnitudeAtWMax;
let bandwidthThreshold;
let bandwidthFunction;
let wCutoffRoots;

//filter types
let isAllPassFilter;
let isNoPassFilter;
let isBandPassFilter;
let isBandStopFilter;
let isLowPassFilter;
let isHighPassFilter;

//characteristic numbers text values
let characteristicNumbers = {
  filterTypeText: "",
  bandwidthText: "",
  thresholdText: "",
  rollOffText: "",
};

const halfPowerThreshold = Math.sqrt(2) / 2;

export const computeCharacteristicNumbers = function (
  magnitude,
  magnitudeCurvePoints,
  phaseCurvePoints,
  wMin,
  wMax,
  minMagnitude,
  maxMagnitude
) {
  resetCharacteristicNumbers();

  computeValuesRequired(
    magnitude,
    magnitudeCurvePoints,
    phaseCurvePoints,
    wMin,
    wMax
  );

  generateFilterTypeText(minMagnitude, maxMagnitude);
  generateBandwidthAndThresholdText(wMin);
  generateRollOffText(magnitude, wMin, wMax);

  // console.log(characteristicNumbers.filterTypeText);
  // console.log("Bandwidth      = " + characteristicNumbers.bandwidthText);
  // console.log("Threshold      = " + characteristicNumbers.thresholdText);
  // console.log("Roll-off       = " + characteristicNumbers.rollOffText);

  return characteristicNumbers;
};

const resetCharacteristicNumbers = function () {
  isAllPassFilter = false;
  isNoPassFilter = false;
  isBandPassFilter = false;
  isBandStopFilter = false;
  isLowPassFilter = false;
  isHighPassFilter = false;

  characteristicNumbers.filterTypeText = "";
  characteristicNumbers.bandwidthText = "";
  characteristicNumbers.thresholdText = "";
  characteristicNumbers.rollOffText = "";
};

const computeValuesRequired = function (
  magnitude,
  magnitudeCurvePoints,
  phaseCurvePoints,
  wMin,
  wMax
) {
  magnitudeAtWMin = magnitude(wMin);
  magnitudeAtWMax = magnitude(wMax);

  bandwidthThreshold = halfPowerThreshold;
  bandwidthFunction = (w) => magnitude(w) - bandwidthThreshold;

  const wCutoffRootIntervals = findCurveRootIntervals(
    magnitudeCurvePoints.map((x) => [x[0], x[1] - bandwidthThreshold])
  );
  wCutoffRoots = wCutoffRootIntervals.map((interval) =>
    halfIntervalMethod(bandwidthFunction, ...interval)
  );

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

const generateFilterTypeText = function (minMagnitude, maxMagnitude) {
  if (minMagnitude > bandwidthThreshold) {
    characteristicNumbers.filterTypeText = "All-pass filter";
    isAllPassFilter = true;
    return;
  }
  if (maxMagnitude < bandwidthThreshold) {
    characteristicNumbers.filterTypeText = "No-pass filter";
    isNoPassFilter = true;
    return;
  }
  if (
    magnitudeAtWMin < bandwidthThreshold &&
    magnitudeAtWMax < bandwidthThreshold &&
    maxMagnitude > bandwidthThreshold
  ) {
    characteristicNumbers.filterTypeText = "Band-pass filter";
    isBandPassFilter = true;
    return;
  }
  if (
    magnitudeAtWMin > bandwidthThreshold &&
    magnitudeAtWMax > bandwidthThreshold &&
    minMagnitude < bandwidthThreshold
  ) {
    characteristicNumbers.filterTypeText = "Band-stop filter";
    isBandStopFilter = true;
    return;
  }
  if (
    magnitudeAtWMin > magnitudeAtWMax &&
    magnitudeAtWMin > bandwidthThreshold &&
    magnitudeAtWMax < 3 * bandwidthThreshold &&
    magnitudeAtWMin / magnitudeAtWMax > 1.5
  ) {
    characteristicNumbers.filterTypeText = "Low-pass filter";
    isLowPassFilter = true;
    return;
  }
  if (
    magnitudeAtWMax > magnitudeAtWMin &&
    magnitudeAtWMax > bandwidthThreshold &&
    magnitudeAtWMin < 3 * bandwidthThreshold &&
    magnitudeAtWMax / magnitudeAtWMin > 1.5
  ) {
    characteristicNumbers.filterTypeText = "High-pass filter";
    isHighPassFilter = true;
    return;
  }
  if (characteristicNumbers.filterTypeText !== "") {
    console.log(characteristicNumbers.filterTypeText);
  }
};

const generateBandwidthAndThresholdText = function (wMin) {
  characteristicNumbers.thresholdText = `${roundDecimal(
    bandwidthThreshold,
    3
  )}${bandwidthThreshold === halfPowerThreshold ? " = -3 [dB]" : ""}`;

  if (wCutoffRoots.length === 0) {
    characteristicNumbers.bandwidthText =
      bandwidthFunction(1) > 0 ? "(0, ∞) [rad/s]" : "N/A";
    return;
  }

  let bandwidthTextPrefix;
  const bandwidthTextInfix = function (i) {
    return isOdd(i) ? "] ∪ [" : ", ";
  };
  let bandwidthTextSuffix;
  let z = 0;

  if (bandwidthFunction(wMin) > 0) {
    bandwidthTextPrefix = "(0, ";
    bandwidthTextSuffix = isOdd(wCutoffRoots.length)
      ? "] [rad/s]"
      : ", ∞) [rad/s]";
    z++;
  } else {
    bandwidthTextPrefix = "[";
    bandwidthTextSuffix = isOdd(wCutoffRoots.length)
      ? ", ∞) [rad/s]"
      : "] [rad/s]";
  }
  characteristicNumbers.bandwidthText =
    bandwidthTextPrefix +
    wCutoffRoots
      .map(
        (x, i) =>
          roundDecimal(x, 3) +
          (i !== wCutoffRoots.length - 1 ? bandwidthTextInfix(i + z) : "")
      )
      .join("") +
    bandwidthTextSuffix;
};

const generateRollOffText = function (magnitude, wMin, wMax) {
  if (
    isAllPassFilter ||
    isNoPassFilter ||
    isBandPassFilter ||
    isBandStopFilter ||
    isLowPassFilter ||
    isHighPassFilter
  ) {
    const rollOffLow = roundDecimal(
      Math.log(magnitudeAtWMin / magnitude(0.01)) / Math.log(wMin / 0.01), //log(AR2/AR1)/log(w2/w1))
      3
    );
    const rollOffHigh = roundDecimal(
      Math.log(magnitude(100) / magnitudeAtWMax) / Math.log(100 / wMax),
      3
    );
    characteristicNumbers.rollOffText =
      (rollOffLow === 0
        ? "0 [dB/dec] (low)"
        : `${roundDecimal(20 * rollOffLow, 3)} [dB/dec] (low)`) +
      ", " +
      (rollOffHigh === 0
        ? "0 [dB/dec] (high)"
        : `${roundDecimal(20 * rollOffHigh, 3)} [dB/dec] (high)`);
    return;
  }
};

export const insertCharacteristicNumbersMarkup = function (
  characteristicNumbersGridDomElement,
  characteristicNumbers
) {
  const filterType =
    characteristicNumbersGridDomElement.parentNode.querySelector(
      "#filter-type"
    );
  filterType.innerText = characteristicNumbers.filterTypeText;
  const markup = `
    <p>Bandwidth</p><p>= ${
      characteristicNumbers.bandwidthText !== ""
        ? characteristicNumbers.bandwidthText
        : "N/A"
    }</p>
    <p>Threshold</p><p>= ${
      characteristicNumbers.thresholdText !== ""
        ? characteristicNumbers.thresholdText
        : "N/A"
    }</p>
    <p>Roll-off</p><p>= ${
      characteristicNumbers.rollOffText !== ""
        ? characteristicNumbers.rollOffText
        : "N/A"
    }</p>
  `;
  characteristicNumbersGridDomElement.innerHTML = "";
  characteristicNumbersGridDomElement.insertAdjacentHTML("afterbegin", markup);
};
