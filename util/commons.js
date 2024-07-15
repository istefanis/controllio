/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Util / Commons
 */

export const primitiveOperationsSymbols = ["+", "-", "*", "/"];

export const isEven = (x) => !(x % 2);
export const isOdd = (x) => x % 2;
export const isPowerOfTen = (x) => Math.log10(Math.abs(x)) % 1 === 0;

export const isSymbol = (x) => typeof x === "string" || x instanceof String;
export const isReal = (x) => !isNaN(x) && x !== true && x !== false;

export const areEqualArrays = (a1, a2) => {
  if (a1.length !== a2.length) return false;
  return JSON.stringify(a1) == JSON.stringify(a2);
};

//
// Rounding & tolerances
//
export const roundDecimal = function (x, digits) {
  return digits === -1 ? x : +x.toFixed(digits);
};

export const areEqualArraysRoundDecimal = (a1, a2, digits) => {
  if (a1.length !== a2.length) return false;
  const roundingReplacer = (key, val) =>
    typeof val === "number" ? roundDecimal(val, digits) : val;
  return (
    JSON.stringify(a1, roundingReplacer) == JSON.stringify(a2, roundingReplacer)
  );
};

/**
 * The number of digits that all tf terms will be rounded to,
 * when the tf method 'setValue()' is invoked
 * (during tf creation/update or a simplification), and that will be stored.
 *
 * In the element analysis window, terms are displayed with this number of digits.
 *
 * Set it to -1 to disable terms rounding, and use the default JS precision
 */
export const roundDecimalDigitsTfComputations = 5;
export const roundDecimalDigitsNumericalAnalysis = 3;
/**
 * The number of digits displayed in HTML markup & the console
 * (these may differ from the actual ones stored, used in computations,
 * and displayed in the element analysis window)
 */
export const roundDecimalDigitsPrettyPrinting = 3;
export const roundDecimalDigitsTests = 3;

export const toleranceNumericalAnalysisTiny = 10 ** -8;
export const toleranceNumericalAnalysisSmall = 10 ** -4;
export const toleranceTestsSmall = 10 ** -4;
export const toleranceTestsMedium = 0.2;
export const toleranceTestsLarge = 3;
export const tolerancePhaseUnwrapMedium = 0.05;
export const tolerancePhaseAdjustmentLarge = 10;

export const isZeroWithinTolerance = function (x) {
  return Math.abs(x) < toleranceNumericalAnalysisTiny;
};

//
// Polynomial
//
export const functionFromPolynomialTermsArray = function (termsArray) {
  return function (s) {
    const length = termsArray.length;
    return termsArray
      .map((term, i) => term * s ** (length - i - 1))
      .reduce((acc, x) => acc + x, 0);
  };
};

export const zeroRootsFromPolynomialTermsArray = function (termsArray) {
  let zeroRootsCounter = 0;
  termsArray
    .slice()
    .reverse()
    .forEach((x, i) => {
      if (i === zeroRootsCounter && x === 0) {
        zeroRootsCounter++;
      }
    });
  return zeroRootsCounter;
};

//
// Transfer function terms
//
export const areAllTfTermsNumbers = (
  numeratorTermsArray,
  denominatorTermsArray
) =>
  numeratorTermsArray.every((x) => !Number.isNaN(+x)) &&
  denominatorTermsArray.every((x) => !Number.isNaN(+x));

//
// Ready-made tfs
//

/**
 * Compute a Butterworth filter's numerator & denominator terms arrays
 * @param {*} type "low-pass", or "high-pass"
 * @param {*} order 1-5
 * @param {*} gain >= 1
 * @param {*} wCutoff >= 0.01 [rad/s]
 * @returns [numeratorTermsArray, denominatorTermsArray]
 */
export const computeButterworthTermsArrays = function (
  type,
  order,
  gain,
  wCutoff
) {
  const butterworthFilterNormalizedCoeffs = {
    1: [1, 1],
    2: [1, 1.41421, 1],
    3: [1, 2, 2, 1],
    4: [1, 2.61313, 3.41421, 2.61313, 1],
    5: [1, 3.23607, 5.23607, 5.23607, 3.23607, 1],
  };

  const numeratorTermsArray =
    type === "low-pass"
      ? [gain * wCutoff ** order]
      : [gain, ...Array(order).fill(0)];

  const denominatorTermsArray = butterworthFilterNormalizedCoeffs[order].map(
    (x, i) => x * wCutoff ** i
  );

  return [numeratorTermsArray, denominatorTermsArray];
};

//
// Await
//
export const sleep = (millisec) => new Promise((r) => setTimeout(r, millisec));
