/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Math / DomainTransformation / BilinearMethod
 */

import {
  getNumerator,
  getDenominator,
  getTermsArray,
  multiply,
  simplify,
  add,
} from "../computerAlgebra/algebraicOperations.js";
import { Polynomial } from "../computerAlgebra/dataTypes/polynomials.js";
import { Ratio } from "../computerAlgebra/dataTypes/ratios.js";
import { isOdd, pascalTriangleLine } from "../../util/commons.js";

/**
 * Perform a continuous to discrete-time transformation of a tf,
 * using the Tustin/Bilinear approximation: s = 2/T*(z-1)/(z+1)
 *
 * Example 1:
 *
 * continuous-time tf: new Polynomial("s", [a, b, c, d]) => a*s^3 + b*s^2 + c*s + d
 *
 * with: s = 2/T*(z-1)/(z+1):
 *
 * => [a*(2/T)^3*(z-1)^3 + b*(2/T)^2*(z-1)^2*(z+1) + c*(2/T)*(z-1)*(z+1)^2 + d*(z+1)^3] / (z+1)^3
 *
 * =  [a*(2/T)^3*(z^3 - 3*z^2 + 3*z - 1) + b*(2/T)^2*(z^2 - 2*z + 1)*(z+1) +
 *
 *    c*(2/T)*(z-1)*(z^2 + 2*z + 1) + d*(z^3 + 3*z^2 + 3*z + 1)] / (z^3 + 3*z^2 + 3*z + 1)
 *
 * In table form:
 *
 *  j=0    j=1    j=2    j=3
 * *z^3   *z^2     *z     *1
 * -------------------------
 *   a    -3*a    3*a     -a  | *(2/T)^3
 *   b   -2*b+b   b-2*b    b  | *(2/T)^2
 *   c    2*c-c   c-2*c   -c  | *(2/T)
 *   d     3*d    3*d      d  | *1
 *
 * -------------------------
 *   a    -3*a    3*a     -a  | *(2/T)^3
 *   b     -b     -b       b  | *(2/T)^2
 *   c      c     -c      -c  | *(2/T)
 *   d     3*d    3*d      d  | *1
 *
 *
 * Example 2:
 *
 * continuous-time ft: new Polynomial("s", [a, b, c, d, e]) => a*s^4 + b*s^3 + c*s^2 + d*s + e
 *
 * with: s = 2/T*(z-1)/(z+1):
 *
 * => [a*(2/T)^4*(z-1)^4 + b*(2/T)^3*(z-1)^3*(z+1) +
 *
 *    c*(2/T)^2*(z-1)^2*(z+1)^2 + d*(2/T)*(z-1)*(z+1)^3 + e*(z+1)^4] / (z+1)^4
 *
 * =  [a*(2/T)^4*(z^4 - 4*z^3 + 6*z^2 - 4*z + 1) + b*(2/T)^3*(z^3 - 3*z^2 + 3*z - 1)*(z+1) +
 *
 *    c*(2/T)*(z^2 - 2*z + 1)*(z^2 + 2*z + 1) + d*(2/T)*(z-1)*(z^3 + 3*z^2 + 3*z + 1) +
 *
 *    e*(z^4 + 4*z^3 + 6*z^2 + 4*z + 1)] / (z^4 + 4*z^3 + 6*z^2 + 4*z + 1)
 *
 * In table form:
 *
 *  j=0    j=1       j=2        j=3    j=4
 * *z^4   *z^3      *z^2        *z       1
 * ---------------------------------------
 *   a    -4*a       6*a        -4*a     a  | *(2/T)^4
 *   b   -3*b+b    3*b-3*b     -b+3*b   -b  | *(2/T)^3
 *   c  -2*c+2*c   c-4*c+c    2*c-2*c    c  | *(2/T)^2
 *   d    3*d-d    3*d-3*d      d-3*d   -d  | *(2/T)
 *   e     4*e       6*e         4*e     e  | *1
 *
 * ---------------------------------------
 *   a    -4*a       6*a        -4*a     a  | *(2/T)^4
 *   b    -2*b        0          2*b    -b  | *(2/T)^3
 *   c       0      -2*c          0      c  | *(2/T)^2
 *   d     2*d        0         -2*d    -d  | *(2/T)
 *   e     4*e       6*e         4*e     e  | *1
 *
 */
export const c2dViaTustinBilinearMethod = function (
  continuousTfNumTermsArray,
  continuousTfDenomTermsArray,
  T
) {
  const getPolynomialSubstitutionNumTerms = (ta, T) => {
    let newTermsPolynomial = new Polynomial("z", Array(ta.length).fill(0));
    // const numericalCounterbalance = T ** (ta.length - 2);
    for (let i = 0; i < ta.length; ++i) {
      const p1 = new Polynomial(
        "z",
        pascalTriangleLine(ta.length - i - 1, true)
      );
      const p2 = new Polynomial("z", pascalTriangleLine(i, false));

      const product1 = multiply(p1, p2);
      const product2 = multiply(
        new Polynomial("z", [ta[i] * (2 / T) ** (ta.length - i - 1)]),
        product1
      );

      // console.log(ta[i], getTermsArray(product1));
      // console.log(getTermsArray(product2));

      newTermsPolynomial = add(newTermsPolynomial, product2);
    }
    // console.log(getTermsArray(newTermsPolynomial));

    return getTermsArray(newTermsPolynomial);
  };

  const getPolynomialSubstitutionDenomTerms = (ta) => {
    const newTermsArray = new Array(ta.length).fill(0);
    // const numericalCounterbalance = T ** (ta.length - 2);
    // console.log(pascalTriangleLine(ta.length - 1, false));
    return pascalTriangleLine(ta.length - 1, false);
  };

  const discreteTfNum = multiply(
    new Polynomial(
      "z",
      getPolynomialSubstitutionNumTerms(continuousTfNumTermsArray, T)
    ),
    new Polynomial(
      "z",
      getPolynomialSubstitutionDenomTerms(continuousTfDenomTermsArray)
    )
  );

  const discreteTfDenom = multiply(
    new Polynomial(
      "z",
      getPolynomialSubstitutionDenomTerms(continuousTfNumTermsArray)
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
 * using the Tustin/Bilinear approximation: s = 2/T*(z-1)/(z+1) <=> z = -(s+2/T)/(s-2/T)
 *
 * Example:
 *
 * discrete tf: new Polynomial("z", [a, b, c, d]) => a*z^3 + b*z^2 + c*z + d
 *
 * with: z = -(s+2/T)/(s-2/T):
 *
 * => [-a*(s+2/T)^3 + b*(s+2/T)^2*(s-2/T) - c*(s+2/T)*(s-2/T)^2 + d*(s-2/T)^3] / (s-2/T)^3
 *
 * =  [-a*(s^3 + 3*s^2*2/T + 3*s*(2/T)^2 + (2/T)^3) + b*(s^2 + 2*s*2/T + (2/T)^2)*(s-2/T) -
 *
 *    c*(s+2/T)*(s^2 - 2*s*2/T + (2/T)^2) + d*(s^3 - 3*s^2*2/T + 3*s*(2/T)^2 - (2/T)^3)] /
 *
 *    (s^3 - 3*s^2*2/T + 3*s*(2/T)^2 - (2/T)^3)
 *
 * In table form:
 *
 *  j=0         j=1                 j=2              j=3
 * *s^3        *s^2                 *s               *1
 * --------------------------------------------------------
 *   a       a*3*(2/T)           a*3*(2/T)^2      a*(2/T)^3  | *(-1)
 *   b   2*b*(2/T)-b*(2/T)   b*(2/T)^2-2*(2/T)^2   -(2/T)^3  |
 *   c         2*c-c               c-2*c             -c      | *(-1)
 *   d          3*d                 3*d               d      |
 *
 * --------------------------------------------------------
 *   a       a*3*(2/T)           a*3*(2/T)^2     a*(2/T)^3  | *(-1)
 *   b        b*(2/T)            -b*(2/T)^2     -b*(2/T)^3  |
 *   c         2*c-c               c-2*c             -c     | *(-1)
 *   d          3*d                 3*d               d     |
 *
 */
export const d2cViaTustinBilinearMethod = function (
  discreteTfNumTermsArray,
  discreteTfDenomTermsArray,
  T
) {
  const getPolynomialSubstitutionNumTerms = (ta, T) => {
    let newTermsPolynomial = new Polynomial("s", Array(ta.length).fill(0));
    // const numericalCounterbalance = T ** (ta.length - 2);
    for (let i = 0; i < ta.length; ++i) {
      const p1 = new Polynomial(
        "s",
        pascalTriangleLine(ta.length - i - 1, false).map(
          (x, j) => x * (2 / T) ** j * (isOdd(ta.length - i - 1) ? -1 : 1)
        )
      );
      const p2 = new Polynomial(
        "s",
        pascalTriangleLine(i, true).map((x, j) => ta[i] * x * (2 / T) ** j)
      );

      const product1 = multiply(p1, p2);

      // console.log(ta[i], getTermsArray(product1));

      newTermsPolynomial = add(newTermsPolynomial, product1);
    }

    // console.log(ta, getTermsArray(newTermsPolynomial));

    return getTermsArray(newTermsPolynomial);
  };

  const getPolynomialSubstitutionDenomTerms = (ta) => {
    const newTermsArray = new Array(ta.length).fill(0);
    // const numericalCounterbalance = T ** (ta.length - 2);
    // console.log(
    //   ta,
    //   pascalTriangleLine(ta.length - 1, true).map((x, j) => x * (2 / T) ** j)
    // );
    return pascalTriangleLine(ta.length - 1, true).map(
      (x, j) => x * (2 / T) ** j
    );
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
