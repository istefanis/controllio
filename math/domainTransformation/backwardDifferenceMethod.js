/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Math / DomainTransformation / BackwardDifferenceMethod
 */

import {
  getNumerator,
  getDenominator,
  getTermsArray,
  multiply,
  simplify,
} from "../computerAlgebra/algebraicOperations.js";
import { Polynomial } from "../computerAlgebra/dataTypes/polynomials.js";
import { Ratio } from "../computerAlgebra/dataTypes/ratios.js";
import { isEven, pascalTriangleElement } from "../../util/commons.js";

/**
 * Perform a continuous to discrete-time transformation of a tf,
 * using the Euler Backward Difference approximation: s = (z-1)/(T*z)
 *
 * Example:
 *
 * continuous-time tf: new Polynomial("s", [a, b, c, d]) => a*s^3 + b*s^2 + c*s + d
 *
 * with: s = (z-1)/(T*z):
 *
 * => [a*(z-1)^3 + b*(z-1)^2*(T*z) + c*(z-1)*(T*z)^2 + d*(T*z)^3] / (T*z)^3
 *
 * =  [a*(z^3 - 3*z^2 + 3*z - 1) + b*(z^2 - 2*z + 1)*(T*z) + c*(z - 1)*(T*z)^2 + d*(T*z)^3] / (T*z)^3
 *
 * In table form:
 *
 *  j=0    j=1   j=2  j=3
 * *z^3   *z^2    *z   *1
 * -----------------------
 *   a    -3*a   3*a   -a  | *1
 *   b    -2*b     b       | *T
 *   c      -c             | *T^2
 *   d                     | *T^3
 *
 * Thus the discrete tf approximation (numer & denom terms):
 * - new Polynomial("z", [a + b*T + T^2*c + T^3*d, - 3*a - 2*b*T - c*T^2, 3*a + b*T, -a]) /
 * - new Polynomial("z", [T^3, 0, 0, 0]);
 */
export const c2dViaEulerBackwardDifferenceMethod = function (
  continuousTfNumTermsArray,
  continuousTfDenomTermsArray,
  T
) {
  const getPolynomialSubstitutionNumTerms = (ta, T) => {
    const newTermsArray = new Array(ta.length).fill(0);
    const numericalCounterbalance = T ** (ta.length - 2);
    for (let i = 0; i < ta.length; ++i) {
      for (let j = 0; j < ta.length; ++j) {
        newTermsArray[j] +=
          ta[i] *
          (isEven(j) ? 1 : -1) *
          pascalTriangleElement(j + 1, ta.length - i) *
          (T ** i / numericalCounterbalance);
      }
    }
    return newTermsArray;
  };

  const getPolynomialSubstitutionDenomTerms = (ta, T) => {
    const newTermsArray = new Array(ta.length).fill(0);
    const numericalCounterbalance = T ** (ta.length - 2);
    for (let i = 0; i < ta.length; ++i) {
      for (let j = 0; j < ta.length; ++j) {
        newTermsArray[0] = T ** (ta.length - 1) / numericalCounterbalance;
      }
    }
    return newTermsArray;
  };

  const discreteTfNum = multiply(
    new Polynomial(
      "z",
      getPolynomialSubstitutionNumTerms(continuousTfNumTermsArray, T)
    ),
    new Polynomial(
      "z",
      getPolynomialSubstitutionDenomTerms(continuousTfDenomTermsArray, T)
    )
  );

  const discreteTfDenom = multiply(
    new Polynomial(
      "z",
      getPolynomialSubstitutionDenomTerms(continuousTfNumTermsArray, T)
    ),
    new Polynomial(
      "z",
      getPolynomialSubstitutionNumTerms(continuousTfDenomTermsArray, T)
    )
  );

  const discreteRatio = simplify(new Ratio(discreteTfNum, discreteTfDenom));

  return [getNumerator(discreteRatio), getDenominator(discreteRatio)];
};

/**
 * Perform a discrete to continuous-time transformation of a tf,
 * using the Euler Backward Difference approximation: s = (z-1)/(T*z) <=> z = 1/(1-s*T)
 *
 * Example:
 *
 * discrete tf: new Polynomial("z", [a, b, c, d]) => a*z^3 + b*z^2 + c*z + d
 *
 * with: z = 1/(1-s*T):
 *
 * => [a + b*(1-s*T) + c*(1-s*T)^2 + d*(1-s*T)^3] / (1-s*T)^3
 *
 * =  [a + b*(1-s*T) + c*(1 - 2*s*T + s^2*T^2) + d*(1 - 3*s*T + 3*s^2*T^2 - s^3*T^3)] / (1-s*T)^3
 *
 * In table form:
 *
 *  j=0     j=1     j=2       j=3
 * *s^3    *s^2      *s        *1
 * ---------------------------------
 *                          a+b+c+d  | *1
 *              -b-2*c-3*d           | *T
 *        c+3*d                      | *T^2
 *  -d                               | *T^3
 *
 *
 * where:
 *
 *    a+b+c+d =  ta[0]*pascal(1,1) + ta[1]*pascal(1,2) + ta[3]*pascal(1,3) + ta[4]*pascal(1,4)
 *
 * -b-2*c-3*d = -ta[1]*pascal(2,2) - ta[2]*pascal(2,3) - ta[3]*pascal(2,4)
 *
 *      c+3*d =  ta[2]*pascal(3,3) + ta[1]*pascal(3,4)
 *
 *         -d = -ta[3]*pascal(4,4)
 *
 * Thus the continuous-time tf approximation (numer & denom terms):
 * - new Polynomial("s", [-d*T^3, (c+3*d)*T^2, (-b-2*c-3*d)*T, a+b+c+d]) /
 * - new Polynomial("s", [-T^3, 3*T^2, -3*T, 1]);
 */
export const d2cViaEulerBackwardDifferenceMethod = function (
  discreteTfNumTermsArray,
  discreteTfDenomTermsArray,
  T
) {
  const getPolynomialSubstitutionNumTerms = (ta, T) => {
    const newTermsArray = new Array(ta.length).fill(0);
    const numericalCounterbalance = T ** (ta.length - 2);
    for (let i = 0; i < ta.length; ++i) {
      for (let j = 0; j < ta.length; ++j) {
        if (i + j + 1 >= ta.length)
          newTermsArray[j] +=
            ta[i] *
            (isEven(j) ? -1 : 1) *
            pascalTriangleElement(ta.length - j, i + 1) *
            (T ** (ta.length - j - 1) / numericalCounterbalance);
      }
    }
    return newTermsArray;
  };

  const getPolynomialSubstitutionDenomTerms = (ta, T) => {
    const newTermsArray = new Array(ta.length).fill(0);
    const numericalCounterbalance = T ** (ta.length - 2);
    for (let i = 0; i < ta.length; ++i) {
      for (let j = 0; j < ta.length; ++j) {
        newTermsArray[j] =
          (isEven(j) ? -1 : 1) *
          pascalTriangleElement(j + 1, ta.length) *
          (T ** (ta.length - j - 1) / numericalCounterbalance);
      }
    }
    return newTermsArray;
  };

  const continuousTfNum = multiply(
    new Polynomial(
      "s",
      getPolynomialSubstitutionNumTerms(discreteTfNumTermsArray, T)
    ),
    new Polynomial(
      "s",
      getPolynomialSubstitutionDenomTerms(discreteTfDenomTermsArray, T)
    )
  );

  const continuousTfDenom = multiply(
    new Polynomial(
      "s",
      getPolynomialSubstitutionDenomTerms(discreteTfNumTermsArray, T)
    ),
    new Polynomial(
      "s",
      getPolynomialSubstitutionNumTerms(discreteTfDenomTermsArray, T)
    )
  );

  const continuousRatio = simplify(
    new Ratio(continuousTfNum, continuousTfDenom)
  );

  return [getNumerator(continuousRatio), getDenominator(continuousRatio)];
};
