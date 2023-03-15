/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Math / ComputerAlgebra / DataTypes / Polynomials
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

import { isSymbol, isReal, areEqualArrays } from "../../../util/commons.js";
import {
  set,
  get,
  addTypeTag,
  add,
  multiply,
  divide,
  negate,
  isZero,
  gcd,
} from "../algebraicOperations.js";

/**
 * Polynomials operations (ex.: SICP 2.5.3)
 */
export const loadPolynomialsOperations = function () {
  // 1. polynomial level representation: (param, termsArray)
  const newPolynomial = (param, termsArray) => [param, termsArray];
  const param = (p) => p[0];
  const termsArray = (p) => p[1];
  const isParam = (p) => isSymbol(p);
  const areSameParam = (p1, p2) => isParam(p1) && isParam(p2) && p1 === p2;

  // 2. terms array level representation ('dense' polynomial): [coeff4,0,0,coeff1,coeff0]
  // - namings using 'TermsArray' over 'Terms' are preferred in some cases to enhance clarity
  const emptyTermsArray = [];
  const isEmptyTermsArray = (ta) => ta.length === 0;
  const firstTerm = (ta) => newTerm(ta.length - 1, ta[0]); //not just coeff of first term
  const restTermsArray = (ta) => ta.slice(1);
  const addExtraFirstTerm = (coeff, ta) => [coeff].concat(ta);
  const coeffsOfTermsArray = (ta) => ta;

  // 3. single term level representation ('dense' polynomial): [coeff,0,...,0]
  // (each term represented as an array of (order + 1) elements, like a term array)
  const newTerm = (order, coeff) =>
    order < 0 ? [] : [coeff].concat(newTerm(order - 1, 0));
  const order = (ta) => ta.length - 1; //applicable for either a term, or a term array
  const coeff = (t) => t[0];

  const negatePolynomial = function (p) {
    return newPolynomial(param(p), negateTerms(termsArray(p)));
  };

  const negateTerms = function (ta) {
    return isEmptyTermsArray(ta)
      ? emptyTermsArray
      : addExtraFirstTerm(
          negate(coeff(firstTerm(ta))),
          negateTerms(restTermsArray(ta))
        );
  };

  const addPolynomials = function (p1, p2) {
    if (areSameParam(param(p1), param(p2))) {
      return newPolynomial(param(p1), addTerms(termsArray(p1), termsArray(p2)));
    }
    console.error("addPolynomials()", "Params do not match", p1, p2);
  };

  const addTerms = function (ta1, ta2) {
    // console.log("ta1:", ta1, "ta2:", ta2, "isEmpty:", isEmptyTermsArray(ta1));
    if (isEmptyTermsArray(ta1)) return ta2;
    if (isEmptyTermsArray(ta2)) return ta1;

    const t1 = firstTerm(ta1);
    const t2 = firstTerm(ta2);
    // return;

    if (order(t1) > order(t2)) {
      return addTermToTermsArray(t1, addTerms(restTermsArray(ta1), ta2));
    }
    if (order(t1) < order(t2)) {
      return addTermToTermsArray(t2, addTerms(restTermsArray(ta2), ta1));
    }
    return addTermToTermsArray(
      newTerm(order(t1), add(coeff(t1), coeff(t2))),
      addTerms(restTermsArray(ta1), restTermsArray(ta2))
    );
  };
  // console.log("test addTerms", addTerms([1, 0], [1, 0]));

  const addTermToTermsArray = function (t1, ta) {
    if (isReal(coeff(t1)) && isZero(coeff(t1))) {
      return ta;
    }
    if (!isEmptyTermsArray(ta)) {
      const t2 = firstTerm(ta);

      if (order(t1) > order(ta)) {
        return addTermToTermsArray(t1, addExtraFirstTerm(0, ta));
      }
      if (order(t1) === order(ta)) {
        return addExtraFirstTerm(add(coeff(t1), coeff(t2)), restTermsArray(ta));
      }
      return addExtraFirstTerm(t2, addTermToTermsArray(t1, restTermsArray(ta)));
    }
    // return;
    return t1; // ex.: [10, 0]
  };

  const subtractPolynomials = function (p1, p2) {
    if (areSameParam(param(p1), param(p2))) {
      return addPolynomials(p1, negatePolynomial(p2));
    }
    console.error("subtractPolynomials()", "Params do not match", p1, p2);
  };

  const multiplyPolynomials = function (p1, p2) {
    if (areSameParam(param(p1), param(p2))) {
      return newPolynomial(
        param(p1),
        multiplyTerms(termsArray(p1), termsArray(p2))
      );
    }
    console.error("multiplyPolynomials()", "Params do not match", p1, p2);
  };

  const multiplyTerms = function (ta1, ta2) {
    return isEmptyTermsArray(ta1)
      ? emptyTermsArray
      : addTerms(
          multiplyTermByTermsArray(firstTerm(ta1), ta2),
          multiplyTerms(restTermsArray(ta1), ta2)
        );
  };

  const multiplyTermByTermsArray = function (t1, ta) {
    if (isEmptyTermsArray(ta)) return emptyTermsArray;
    const t2 = firstTerm(ta);
    return addTermToTermsArray(
      newTerm(order(t1) + order(t2), multiply(coeff(t1), coeff(t2))),
      multiplyTermByTermsArray(t1, restTermsArray(ta))
    );
  };

  const multiplyRealByTermsArray = (x, ta) =>
    multiplyTermByTermsArray(newTerm(0, x), ta);

  // constructor & selectors
  const newDivideTermsResult = (quotientTerms, remainderTerms) => [
    quotientTerms,
    remainderTerms,
  ];
  const quotientTerms = (divideTermsResult) => divideTermsResult[0];
  const remainderTerms = (divideTermsResult) => divideTermsResult[1];

  const dividePolynomials = function (p1, p2) {
    if (areSameParam(param(p1), param(p2))) {
      const d = divideTerms(termsArray(p1), termsArray(p2));

      // returns only the quotient if the remainder is zero
      if (isEmptyTermsArray(remainderTerms(d))) {
        return isEmptyTermsArray(quotientTerms(d))
          ? [newPolynomial(param(p1), [0])]
          : [newPolynomial(param(p1), quotientTerms(d))];
      } else {
        return d.map((x) =>
          isEmptyTermsArray(x)
            ? newPolynomial(param(p1), [0])
            : newPolynomial(param(p1), x)
        );
      }
    }
    console.error("dividePolynomials()", "Params do not match", p1, p2);
  };

  // returns an array: [quotient, remainder]
  const divideTerms = function (ta1, ta2) {
    if (isEmptyTermsArray(ta1))
      return newDivideTermsResult(emptyTermsArray, emptyTermsArray);

    const t1 = firstTerm(ta1);
    const t2 = firstTerm(ta2);
    // console.log(ta1, ta2);
    if (order(t2) > order(t1))
      return newDivideTermsResult(emptyTermsArray, ta1);

    const o = order(t1) - order(t2);
    const c = divide(coeff(t1), coeff(t2));

    // recursive computation of the remaining result
    const rest = divideTerms(
      addTerms(ta1, multiplyTermByTermsArray(newTerm(o, negate(c)), ta2)),
      ta2
    );

    return newDivideTermsResult(
      addTermToTermsArray(newTerm(o, c), quotientTerms(rest)),
      remainderTerms(rest)
    );
  };

  // ex.: SICP 2.94 - 2.96
  const gcdPolynomials = function (p1, p2) {
    if (areSameParam(param(p1), param(p2))) {
      return newPolynomial(param(p1), gcdTerms(termsArray(p1), termsArray(p2)));
    }
    console.error("gcdPolynomials()", "Params do not match", p1, p2);
  };

  const gcdTerms = function (ta1, ta2) {
    if (isEmptyTermsArray(ta2)) {
      //BUGFIX
      const gcdivisor =
        order(ta1) > 0
          ? gcd.apply("_", coeffsOfTermsArray(ta1))
          : coeff(firstTerm(ta1));
      return multiplyRealByTermsArray(1 / gcdivisor, ta1);
    }
    return gcdTerms(ta2, pseudoremainderTerms(ta1, ta2));
  };

  const pseudoremainderTerms = function (ta1, ta2) {
    const x = Math.pow(
      coeff(firstTerm(ta2)),
      1 + order(firstTerm(ta1)) - order(firstTerm(ta2))
    );
    return divideTerms(multiplyRealByTermsArray(x, ta1), ta2)[1];
  };

  // ex.: SICP 2.97
  const simplifyPolynomials = function (p1, p2) {
    if (areSameParam(param(p1), param(p2))) {
      if (areEqualArrays(termsArray(p1), termsArray(p2))) {
        return [newPolynomial(param(p1), [1]), newPolynomial(param(p1), [1])];
      } else {
        return simplifyTerms(termsArray(p1), termsArray(p2)).map((x) =>
          newPolynomial(param(p1), x)
        );
      }
    }
    console.error("simplifyPolynomials()", "Params do not match", p1, p2);
  };

  const simplifyTerms = function (ta1, ta2) {
    if (
      ta1.filter((x) => !Number.isFinite(x)).length > 0 ||
      ta2.filter((x) => !Number.isFinite(x)).length > 0
    ) {
      return [ta1, ta2];
    }

    // return [];
    const gcd1 = gcdTerms(ta1, ta2);
    const maxOrder = Math.max(order(firstTerm(ta1)), order(firstTerm(ta2)));

    // to ensure integer coefficients:
    const x = Math.pow(
      coeff(firstTerm(gcd1)),
      1 + maxOrder - order(firstTerm(gcd1))
    );
    const numerator = divideTerms(multiplyRealByTermsArray(x, ta1), gcd1);
    const denominator = divideTerms(multiplyRealByTermsArray(x, ta2), gcd1);
    // console.log("numerator: ", numerator, "denominator: ", denominator);

    // division with gcd1 returns no remainder, so:
    const simplifiedNumerator = quotientTerms(numerator);
    const simplifiedDenominator = quotientTerms(denominator);

    // simplification of integer coefficients:

    // a. based on the gcd of all coefficients:
    // const gcdivisor = gcd.apply("_", simplifiedNumerator.concat(simplifiedDenominator));
    // return [
    //   multiplyRealByTermsArray(1 / gcdivisor, simplifiedNumerator),
    //   multiplyRealByTermsArray(1 / gcdivisor, simplifiedDenominator),
    // ];

    // b. based on the coefficient of numerator's first term:
    const y = 1 / coeff(firstTerm(simplifiedNumerator));
    return [
      multiplyRealByTermsArray(y, simplifiedNumerator),
      multiplyRealByTermsArray(y, simplifiedDenominator),
    ];
  };

  const tag = (p) => addTypeTag("polynomial", p);
  set(["new", "polynomial"], (param, termsArray) =>
    tag(newPolynomial(param, termsArray))
  );
  set(["add", "polynomial", "polynomial"], (p1, p2) =>
    tag(addPolynomials(p1, p2))
  );
  set(["subtract", "polynomial", "polynomial"], (p1, p2) =>
    tag(subtractPolynomials(p1, p2))
  );
  set(["multiply", "polynomial", "polynomial"], (p1, p2) =>
    tag(multiplyPolynomials(p1, p2))
  );
  set(["divide", "polynomial", "polynomial"], dividePolynomials);

  set(["negate", "polynomial"], (p) => tag(negatePolynomial(p)));

  set(["gcd", "polynomial", "polynomial"], gcdPolynomials);
  set(["reduce", "polynomial", "polynomial"], (p1, p2) =>
    simplifyPolynomials(p1, p2).map(tag)
  );

  set(["getTermsArray", "polynomial"], termsArray);

  // console.log("Polynomials operations loaded");
};

//
// Explicit data type constructor
//
export const newPolynomial = (param, termsArray) =>
  get(["new", "polynomial"])(param, termsArray);

export class Polynomial {
  constructor(param, termsArray) {
    return get(["new", "polynomial"])(param, termsArray);
  }
}
