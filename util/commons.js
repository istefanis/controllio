/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Util / Commons
 */

import { pauseButtonClicked } from "../view/navbarView.js";

export const primitiveOperationsSymbols = ["+", "-", "*", "/"];

export const isEven = (x) => !(x % 2);
export const isOdd = (x) => x % 2;
export const isPowerOfTen = (x) => Math.log10(Math.abs(x)) % 1 === 0;

export const isSymbol = (x) => typeof x === "string" || x instanceof String;
export const isReal = (x) => !isNaN(x);

export const areEqualArrays = (a1, a2) => {
  if (a1.length !== a2.length) return false;
  return JSON.stringify(a1) == JSON.stringify(a2);
};

export const areEqualArraysRoundDecimal = (a1, a2, digits) => {
  if (a1.length !== a2.length) return false;
  const roundingReplacer = (key, val) =>
    typeof val === "number" ? roundDecimal(val, digits) : val;
  return (
    JSON.stringify(a1, roundingReplacer) == JSON.stringify(a2, roundingReplacer)
  );
};

export const roundDecimal = function (x, digits) {
  return +x.toFixed(digits);
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
// Await
//
export const sleep = (millisec) => new Promise((r) => setTimeout(r, millisec));

export const pauseSimulation = async () => {
  if (pauseButtonClicked) {
    await sleep(200);
    await pauseSimulation();
  }
};
