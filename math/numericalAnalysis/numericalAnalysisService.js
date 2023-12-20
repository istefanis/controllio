/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Math / NumericalAnalysis / NumericalAnalysisService
 */

/*
 * Reference for real root-finding methods:
 *
 * Structure and Interpretation of Computer Programs second edition.
 * The MIT Press with the McGraw-Hill Book Company, 1996
 * Harold Abelson and Gerald Jay Sussman with Julie Sussman, foreword by Alan J. Perlis,
 *
 * noted below as 'SICP'
 */

/*
 * Reference for Talbot method for Laplace inversion:
 *
 * Implementation originally developed in Python by F.D. Nieuwveldt and D. Kadelka. See:
 * https://code.activestate.com/recipes/576934/
 * https://code.activestate.com/recipes/576938/
 *
 * Reference:
 * L.N. Trefethen, J.A.C. Weideman, and T. Schmelzer. Talbot quadratures and rational
 * approximations. BIT. Numerical Mathematics, 46(3):653 670, 2006.
 */

import { Complex } from "../../assets/lib/Complex/Complex.js";
import findRoots from "../../assets/lib/durand-kerner/roots.js";
import {
  roundDecimal,
  zeroRootsFromPolynomialTermsArray,
} from "../../util/commons.js";

//
// Real root-finding methods for non-linear functions of a single variable
//

let maxLoopCounter = 0;

export const tolerance = 0.0001;
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
      // console.error("halfIntervalMethod()", "Values are not of opposite sign", a, b, f(a), f(b));
      maxLoopCounter++;
      // console.log(maxLoopCounter);
      // console.log(1.05 * a, 0.95 * b);
      return halfIntervalMethod(f, 1.05 * a, 0.95 * b);
    }
  }
};

//
// Linear interpolation
//

export const linearInterpolationOfCurvePoints = function (curvePoints) {
  return function (x) {
    //index:
    const i = curvePoints.findIndex((p) => p[0] >= x);
    if (i === 0 || i === -1) {
      //x < xmin || x > xmax
      return undefined;
    } else {
      //interpolation:
      const p1 = curvePoints[i - 1];
      const p2 = curvePoints[i];
      return p1[1] + (p2[1] - p1[1]) * ((x - p1[0]) / (p2[0] - p1[0]));
    }
  };
};

//
// Approximate root localization
//

/**
 * Locates intervals in which a curve's roots are to be found
 *
 * @param curvePoints a curve as an array of points (with each point represented as an array [x, f(x)] itself)
 *
 * @returns an array containing the intervals (with each interval represented as an array itself)
 */
export const findCurveRootIntervals = function (curvePoints) {
  const rootIntervals = [];

  let intervalStart = curvePoints[0];

  for (let i = 1; i < curvePoints.length; i++) {
    if (Math.sign(intervalStart[1]) * Math.sign(curvePoints[i][1]) <= 0) {
      rootIntervals.push([intervalStart[0], curvePoints[i][0]]);
    }
    intervalStart = curvePoints[i];
  }

  return rootIntervals;
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
  let r;
  if (termsArray.length - 1 === zeroRootsFromPolynomialTermsArray(termsArray)) {
    //if all roots are zero, provide a tailored initial guess
    r = findRoots(
      termsArray.slice().reverse(),
      undefined,
      undefined,
      undefined,
      Array(termsArray.length - 1).fill(0),
      undefined
    );
  } else {
    r = findRoots(termsArray.slice().reverse());
  }
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

//
// Laplace inversion
//

/**
 * Using an implementation of the Talbot numerical method for Laplace inversion,
 * after taking as input the s-domain Laplace transform function F(s),
 * compute the t-domain function value f(t) at time t
 *
 * It uses the 'Complex' library
 */
export const TalbotMethod = function (F, t, N) {
  if (t <= 0) {
    console.error("TalbotMethod()", "t must be positive");
    return;
  }

  const h = (2 * Math.PI) / N;
  const shift = 0; //contour should be shifted if positive real poles exist

  //parameters by Weideman
  const c1 = 0.5017;
  const c2 = 0.6407;
  const c3 = 0.6122;
  const c4 = 0.2645;

  //evaluation at theta
  const loop = (k, ans) => {
    if (k > N) {
      return new Complex(h, 0)
        .divide(new Complex(0, 2 * Math.PI))
        .multiply(ans);
    } else {
      const theta = -Math.PI + (k + 0.5) * h;

      const z = new Complex.from(shift).add(
        new Complex(N / t, 0).multiply(
          new Complex((c1 * theta) / Math.tan(c2 * theta) - c3, c4 * theta)
        )
      );

      const dz_dtheta = new Complex(N / t, 0).multiply(
        new Complex(
          (-c1 * c2 * theta) / Math.pow(Math.sin(c2 * theta), 2) +
            c1 / Math.tan(c2 * theta),
          c4
        )
      );

      return loop(
        k + 1,
        ans.add(
          new Complex.from(z)
            .multiply(t)
            .exp()
            .multiply(F(z))
            .multiply(dz_dtheta)
        )
      );
    }
  };
  return loop(0, new Complex(0, 0)).real;
};
