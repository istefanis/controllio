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

//values required for characteristic numbers computations
let magnitudeAtWMin;
let magnitudeAtWMax;
let bandwidthThreshold;
let bandwidthFunction;
let wCutoffRoots;
let rollOffLow;
let rollOffHigh;

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
  bandwidthThreshold,
};

const halfPowerThreshold = Math.sqrt(2) / 2;
const unitMagnitude = 1;

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

  magnitudeAtWMin = magnitude(wMin);
  magnitudeAtWMax = magnitude(wMax);

  rollOffLow = roundDecimal(
    Math.log(magnitudeAtWMin / magnitude(0.01)) / Math.log(wMin / 0.01), //log(AR2/AR1)/log(w2/w1))
    3
  );
  rollOffHigh = roundDecimal(
    Math.log(magnitude(100) / magnitudeAtWMax) / Math.log(100 / wMax),
    3
  );

  generateFilterTypeText(minMagnitude, maxMagnitude);

  computeBandwidthFunctionAndWCutoffRoots(magnitude, magnitudeCurvePoints);

  generateBandwidthAndThresholdText(wMin, maxMagnitude);

  generateRollOffText(magnitude, wMin, wMax);

  // console.log(characteristicNumbers);
  return characteristicNumbers;
};

const resetCharacteristicNumbers = function () {
  bandwidthThreshold = undefined;
  bandwidthFunction = undefined;
  wCutoffRoots = undefined;
  rollOffLow = undefined;
  rollOffHigh = undefined;

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
  characteristicNumbers.bandwidthThreshold = undefined;
};

const generateFilterTypeText = function (minMagnitude, maxMagnitude) {
  // console.log(rollOffLow, rollOffHigh, magnitudeAtWMin, magnitudeAtWMax);

  if (
    roundDecimal(minMagnitude, 3) > unitMagnitude &&
    Math.abs(rollOffLow) < 0.5 &&
    Math.abs(rollOffHigh) < 0.5
  ) {
    characteristicNumbers.filterTypeText = "All-pass filter";
    isAllPassFilter = true;
    bandwidthThreshold = halfPowerThreshold * minMagnitude;
    characteristicNumbers.bandwidthThreshold = bandwidthThreshold;
    return;
  }
  if (roundDecimal(maxMagnitude, 3) < unitMagnitude) {
    characteristicNumbers.filterTypeText = "No-pass filter";
    isNoPassFilter = true;
    bandwidthThreshold = 1;
    return;
  }
  if (
    roundDecimal(magnitudeAtWMin, 3) < unitMagnitude &&
    roundDecimal(magnitudeAtWMax, 3) < unitMagnitude &&
    roundDecimal(maxMagnitude, 3) >= unitMagnitude
  ) {
    characteristicNumbers.filterTypeText = "Band-pass filter";
    isBandPassFilter = true;
    bandwidthThreshold = halfPowerThreshold * maxMagnitude;
    characteristicNumbers.bandwidthThreshold = bandwidthThreshold;
    return;
  }
  if (
    roundDecimal(magnitudeAtWMin, 3) >= unitMagnitude &&
    roundDecimal(magnitudeAtWMax, 3) >= unitMagnitude &&
    roundDecimal(minMagnitude, 3) < unitMagnitude &&
    Math.abs(rollOffLow) > 0.5 &&
    Math.abs(rollOffHigh) > 0.5
  ) {
    characteristicNumbers.filterTypeText = "Band-stop filter";
    isBandStopFilter = true;
    bandwidthThreshold = unitMagnitude;
    characteristicNumbers.bandwidthThreshold = bandwidthThreshold;
    return;
  }
  if (
    roundDecimal(magnitudeAtWMin, 3) >= unitMagnitude &&
    Math.abs(rollOffLow) < 0.5 &&
    roundDecimal(magnitudeAtWMin, 3) > roundDecimal(magnitudeAtWMax, 3)
  ) {
    characteristicNumbers.filterTypeText = "Low-pass filter";
    isLowPassFilter = true;
    bandwidthThreshold = halfPowerThreshold * magnitudeAtWMin;
    characteristicNumbers.bandwidthThreshold = bandwidthThreshold;
    return;
  }
  if (
    roundDecimal(magnitudeAtWMax, 3) >= unitMagnitude &&
    Math.abs(rollOffHigh) < 0.5 &&
    roundDecimal(magnitudeAtWMin, 3) < roundDecimal(magnitudeAtWMax, 3)
  ) {
    characteristicNumbers.filterTypeText = "High-pass filter";
    isHighPassFilter = true;
    bandwidthThreshold = halfPowerThreshold * magnitudeAtWMax;
    characteristicNumbers.bandwidthThreshold = bandwidthThreshold;
    return;
  }
  bandwidthThreshold = 1;
};

const computeBandwidthFunctionAndWCutoffRoots = function (
  magnitude,
  magnitudeCurvePoints
) {
  // console.log(characteristicNumbers.filterTypeText);

  if (bandwidthThreshold) {
    bandwidthFunction = (w) => magnitude(w) - bandwidthThreshold;

    const wCutoffRootIntervals = findCurveRootIntervals(
      magnitudeCurvePoints.map((x) => [x[0], x[1] - bandwidthThreshold])
    );
    wCutoffRoots = wCutoffRootIntervals.map((interval) =>
      halfIntervalMethod(bandwidthFunction, ...interval)
    );

    // console.log(wCutoffRoots);
  }

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

const generateBandwidthAndThresholdText = function (wMin, maxMagnitude) {
  if (bandwidthThreshold) {
    characteristicNumbers.thresholdText = `${roundDecimal(
      bandwidthThreshold,
      3
    )}${
      isAllPassFilter || isBandPassFilter || isLowPassFilter || isHighPassFilter
        ? " &#8660 -3 [dB]"
        : ""
    }`;
  }

  if (!wCutoffRoots || wCutoffRoots.length === 0) {
    characteristicNumbers.bandwidthText =
      bandwidthFunction && bandwidthFunction(1) > 0 ? "(0, ∞) [rad/s]" : "N/A";
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
  characteristicNumbers.rollOffText =
    (rollOffLow === 0
      ? "0 [dB/dec] (low)"
      : `${roundDecimal(20 * rollOffLow, 3)} [dB/dec] (low)`) +
    ", " +
    (rollOffHigh === 0
      ? "0 [dB/dec] (high)"
      : `${roundDecimal(20 * rollOffHigh, 3)} [dB/dec] (high)`);
  return;
};

export const insertCharacteristicNumbersMarkup = function (
  characteristicNumbersGridDomElement,
  characteristicNumbers,
  displayWarning
) {
  const filterTypeOrWarningBanner =
    characteristicNumbersGridDomElement.parentNode.querySelector(
      "#filter-type-or-warning-banner"
    );
  if (displayWarning) {
    filterTypeOrWarningBanner.innerHTML = `
    <div id="warning-banner">
      <i class="bi-exclamation-triangle"></i>
      <p>All tf terms should be numbers to proceed with computations</p>
    </div>`;
  } else {
    filterTypeOrWarningBanner.innerText = characteristicNumbers.filterTypeText;
  }

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
