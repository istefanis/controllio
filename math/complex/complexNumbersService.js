/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Math / Complex / ComplexNumbersService
 */

import { isEven, isOdd } from "../../util/commons.js";

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
 * Formula:
 *
 * [0,  t4,   0, -t2,  0,  t0] (real terms)
 *
 * [t5,  0, -t3,   0,  t1,  0] (imag terms)
 *
 *   5,  4,   3,   2,   1,  0  (term order)
 */
export const polynomialWiSubstitutionRealTermsArray = function (termsArray) {
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
 * Formula:
 *
 * [0,  t4,   0, -t2,  0,  t0] (real terms)
 *
 * [t5,  0, -t3,   0,  t1,  0] (imag terms)
 *
 *   5,  4,   3,   2,   1,  0  (term order)
 */
export const polynomialWiSubstitutionImagTermsArray = function (termsArray) {
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
