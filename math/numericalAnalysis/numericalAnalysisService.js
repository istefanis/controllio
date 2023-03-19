/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Math / NumericalAnalysis / NumericalAnalysisService
 */

/*
 * Reference for algorithms:
 *
 * Structure and Interpretation of Computer Programs second edition.
 * The MIT Press with the McGraw-Hill Book Company, 1996
 * Harold Abelson and Gerald Jay Sussman with Julie Sussman, foreword by Alan J. Perlis,
 *
 * noted below as 'SICP'
 */

import findRoots from "../../assets/lib/durand-kerner/roots.js";
import { roundDecimal } from "../../util/commons.js";

//
// Real root-finding methods for non-linear functions of a single variable
//

let maxLoopCounter = 0;

const tolerance = 0.0001;
const maxLoops = 1000;

/**
 * Newton's method
 * - input: a first guess
 */
export const NewtonsMethod = (g, guess) => {
  const helperFunction = function (g) {
    return (x) =>
      derivative(g)(x) === 0 ? false : x - g(x) / derivative(g)(x);
  };

  return computeFixedPoint(helperFunction(g), guess);
};

const dx = 0.01;
const derivative = function (g) {
  return (x) => (g(x + dx) - g(x)) / dx;
};

const computeFixedPoint = function (f, firstGuess) {
  const loop = function (guess) {
    if (f === false) {
      return false;
    } else {
      const next = f(guess);
      // console.log(next);
      if (Math.abs(guess - next) < tolerance || maxLoopCounter > maxLoops) {
        return next;
      } else {
        if (isNaN(next)) {
          return false;
        } else {
          maxLoopCounter++;
          return loop(next);
        }
      }
    }
  };

  maxLoopCounter = 0;
  return loop(firstGuess);
};

/**
 * Half interval (or bisection) method
 * - input: an interval
 * - chosen after comparison with other interval methods
 */
export const halfIntervalMethod = function (f, a, b) {
  const loop = function (an, bn, n) {
    const m = (an + bn) / 2;
    if (n > maxLoops || Math.abs(bn - an) < tolerance) {
      return m;
    } else {
      return f(an) * f(m) < 0 ? loop(an, m, n + 1) : loop(m, bn, n + 1);
    }
  };

  if (f(a) * f(b) < 0) {
    maxLoopCounter = 0;
    return loop(a, b, 1);
  } else {
    if (maxLoopCounter > maxLoops / 3 || a >= b) {
      return false;
    } else {
      // console.error("Values are not of opposite sign", a, b, f(a), f(b));
      maxLoopCounter++;
      // console.log(maxLoopCounter);
      // console.log(1.05 * a, 0.95 * b);
      return halfIntervalMethod(f, 1.05 * a, 0.95 * b);
    }
  }
};

//
// Complex root-finding method for polynomials
//

/**
 * Using an implementation of the Weierstrass / Durand-Kerner method,
 * compute the complex roots of a polynomial and return them inside an array.
 * Each root (element of the array) is an array itself, containing the root's real & imag parts
 */
export const findComplexRootsOfPolynomial = function (termsArray) {
  const complexRoots = [];
  const r = findRoots(termsArray.slice().reverse());
  if (r && r[0]) {
    for (let i = 0; i <= r[0].length - 1; i++) {
      //real & imag parts respectively
      complexRoots.push([roundDecimal(r[0][i], 3), roundDecimal(r[1][i], 3)]);
    }
  }
  return complexRoots.sort(function (x1, x2) {
    return x1[0] - x2[0];
  });
};
