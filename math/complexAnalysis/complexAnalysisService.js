/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Math / ComplexAnalysis / ComplexAnalysisService
 */

import { Complex } from "../../assets/lib/Complex/Complex.js";
import { isEven, isOdd, pascalTriangleLine } from "../../util/commons.js";

/**
 * Starting from a polynomial of variable s,
 * after the latter variable is substituted by the imaginary number s=w*i,
 * compute the real numbers terms array of the new polynomial of variable w
 *
 * (used in Bode plot computation)
 *
 * Example:
 *
 * [5, 3, 7] <-> 5*s^2 + 3*s + 7
 *
 * => 5*(w*i)^2 + 3*(w*i) + 7
 * = -5*w^2 + 3*w*i + 7
 * = (-5*w^2 + 7) + (3*w)*i
 *
 * <-> real: [-5, 0, 7], imag: [3, 0]
 *
 * Thus the rule:
 *
 * - [ 0,  t4,   0, -t2,  0,  t0] (real terms)
 * - [t5,   0, -t3,   0,  t1,  0] (imag terms)
 * - [ 5,   4,   3,   2,   1,  0] (term order)
 */
export const polynomialEvaluatedWithWiRealTermsArray = function (termsArray) {
  const length = termsArray.length;
  return termsArray.map((t, i) => {
    if (isOdd(length - i - 1)) {
      return 0;
    } else if (isEven(length - i - 1) && isEven((length - i - 1) / 2)) {
      return t;
    } else {
      return -t;
    }
  });
};

/**
 * Starting from a polynomial of variable s,
 * after the latter variable is substituted by the imaginary number s=w*i,
 * compute the imaginary numbers terms array of the new polynomial of variable w
 *
 * (used in Bode plot computation)
 *
 * Example:
 *
 * [5, 3, 7] <-> 5*s^2 + 3*s + 7
 *
 * => 5*(w*i)^2 + 3*(w*i) + 7
 * = -5*w^2 + 3*w*i + 7
 * = (-5*w^2 + 7) + (3*w)*i
 *
 * <-> real: [-5, 0, 7], imag: [3, 0]
 *
 * Thus the rule:
 *
 * - [ 0  t4,   0, -t2,  0,  t0] (real terms)
 * - [t5,  0, -t3,   0,  t1,  0] (imag terms)
 * - [ 5,  4,   3,   2,   1,  0] (term order)
 */
export const polynomialEvaluatedWithWiImagTermsArray = function (termsArray) {
  const length = termsArray.length;
  return termsArray.map((t, i) => {
    if (isOdd(length - i - 1) && isOdd((length - i - 1 - 1) / 2)) {
      return -t;
    } else if (isOdd(length - i - 1)) {
      return t;
    } else {
      return 0;
    }
  });
};

/**
 * Starting from a polynomial of variable z,
 * after the latter variable is substituted by the complex number z=e^(w*T*i),
 * compute the real terms as a function of variable w
 *
 * (used in discrete-time Bode plot computation)
 *
 * Formulas used below:
 *
 * - Euler's: e^(x*i) = cos(x) + i*sin(x)
 * - i^1 = i, i^2 =-1, i^3 =-i, i^4 = 1, i^5 = i
 *
 * Example:
 *
 * [5, 3, 7] <-> 5*z^2 + 3*z + 7
 *
 * => 5*e^(2*w*Ti) + 3*e^(w*i*T) + 7
 * = 5*(cos(w*T) + i*sin(w*T))^2 + 3*(cos(w*T) + i*sin(w*T)) + 7
 *
 * In general, with: a=cos(w*T), b=sin(w*T):
 *
 * - (a+b*i)^2 = a^2 + i*2*a*b - b^2
 * - (a+b*i)^3 = a^3 + i*3*a^2*b - 3*a*b^2 - i*b^3
 * - (a+b*i)^4 = a^4 + i*4*a^3*b - 6*a^2*b^2 - i*4*a*b^3 + b^4
 *
 * Thus the rule:
 *
 * - [t4*(a^4 - 6*a^2*b^2 + b^4),  t3*(a^3 - 3*a*b^2),    t2*(a^2 - b^2),  t1*a,  t0] (real terms)
 * - [t4*(4*a^3*b -4*a*b^3),       t3*(3*a^2*b - 3*b^3),  t2*(2*a*b),      t1*b,   0] (imag terms)
 * - [4,                           3,                     2,               1,      0] (term order)
 */
export const discreteTimePolynomialEvaluatedWithWiRealTermsFunction = function (
  termsArray,
  samplingT
) {
  const a = (w) => Math.cos(w * samplingT);
  const b = (w) => Math.sin(w * samplingT);

  const realTerms = termsArray
    .map((term, i) => {
      //computation, filtering & addition of all real terms
      //stemming from a single binomial
      const order = termsArray.length - i - 1;

      const line = pascalTriangleLine(order, false);
      const mapped = line.map((pascalTerm, j) => {
        const sign = j % 4 === 2 || j % 4 === 3 ? -1 : 1;
        return (w) =>
          term * sign * pascalTerm * a(w) ** (line.length - j - 1) * b(w) ** j;
      });
      return mapped
        .filter((_, i) => isEven(i))
        .reduce(
          (acc, x) => (w) => acc(w) + x(w),
          (w) => 0
        );
    })
    .reduce(
      //addition of all real terms stemming from all binomials
      (acc, x) => (w) => acc(w) + x(w),
      (w) => 0
    );

  return realTerms;
};

/**
 * Starting from a polynomial of variable z,
 * after the latter variable is substituted by the complex number z=e^(w*T*i),
 * compute the imag terms as a function of variable w
 *
 * (used in discrete-time Bode plot computation)
 *
 * Formulas used below:
 *
 * - Euler's: e^(x*i) = cos(x) + i*sin(x)
 * - i^1 = i, i^2 =-1, i^3 =-i, i^4 = 1, i^5 = i
 *
 * Example:
 *
 * [5, 3, 7] <-> 5*z^2 + 3*z + 7
 *
 * => 5*e^(2*w*Ti) + 3*e^(w*i*T) + 7
 * = 5*(cos(w*T) + i*sin(w*T))^2 + 3*(cos(w*T) + i*sin(w*T)) + 7
 *
 * In general, with: a=cos(w*T), b=sin(w*T):
 *
 * - (a+b*i)^2 = a^2 + i*2*a*b - b^2
 * - (a+b*i)^3 = a^3 + i*3*a^2*b - 3*a*b^2 - i*b^3
 * - (a+b*i)^4 = a^4 + i*4*a^3*b - 6*a^2*b^2 - i*4*a*b^3 + b^4
 *
 * Thus the rule:
 *
 * - [t4*(a^4 - 6*a^2*b^2 + b^4),  t3*(a^3 - 3*a*b^2),    t2*(a^2 - b^2),  t1*a,  t0] (real terms)
 * - [t4*(4*a^3*b -4*a*b^3),       t3*(3*a^2*b - 3*b^3),  t2*(2*a*b),      t1*b,   0] (imag terms)
 * - [4,                           3,                     2,               1,      0] (term order)
 */
export const discreteTimePolynomialEvaluatedWithWiImagTermsFunction = function (
  termsArray,
  samplingT
) {
  const a = (w) => Math.cos(w * samplingT);
  const b = (w) => Math.sin(w * samplingT);

  const imagTerms = termsArray
    .map((term, i) => {
      //computation, filtering & addition of all imag terms
      //stemming from a single binomial
      const order = termsArray.length - i - 1;

      const line = pascalTriangleLine(order, false);
      const mapped = line.map((pascalTerm, j) => {
        const sign = j % 4 === 2 || j % 4 === 3 ? -1 : 1;
        return (w) =>
          term * sign * pascalTerm * a(w) ** (line.length - j - 1) * b(w) ** j;
      });
      return mapped
        .filter((_, i) => isOdd(i))
        .reduce(
          (acc, x) => (w) => acc(w) + x(w),
          (w) => 0
        );
    })
    .reduce(
      //addition of all imag terms stemming from all binomials
      (acc, x) => (w) => acc(w) + x(w),
      (w) => 0
    );

  return imagTerms;
};

//
// Methods using the 'Complex' library
//

export const tfEvaluatedWithComplexNumber = function (
  numTermsArray,
  denTermsArray
) {
  return (complex) =>
    polynomialEvaluatedWithComplexNumber(numTermsArray, complex).divide(
      polynomialEvaluatedWithComplexNumber(denTermsArray, complex)
    );
};

const polynomialEvaluatedWithComplexNumber = function (termsArray, complex) {
  const length = termsArray.length;
  return termsArray
    .map((term, i) =>
      new Complex.from(term).multiply(
        new Complex.from(complex).pow(length - i - 1)
      )
    )
    .reduce((acc, x) => acc.add(x), new Complex(0, 0));
};
