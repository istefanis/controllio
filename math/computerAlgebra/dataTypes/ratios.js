/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Math / ComputerAlgebra / DataTypes / Ratios
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

import {
  set,
  get,
  addTypeTag,
  add,
  subtract,
  multiply,
  reduce,
} from "../algebraicOperations.js";

/**
 * Ratios operations (ex.: SICP 2.5.1)
 */
export const loadRatiosOperations = function () {
  // representation
  const newRatio = (n, d) => [n, d];
  const numerator = (r) => r[0];
  const denominator = (r) => r[1];

  const addRatios = (r1, r2) =>
    newRatio(
      add(
        multiply(numerator(r1), denominator(r2)),
        multiply(numerator(r2), denominator(r1))
      ),
      multiply(denominator(r1), denominator(r2))
    );
  const subtractRatios = (r1, r2) =>
    newRatio(
      subtract(
        multiply(numerator(r1), denominator(r2)),
        multiply(numerator(r2), denominator(r1))
      ),
      multiply(denominator(r1), denominator(r2))
    );
  const multiplyRatios = (r1, r2) =>
    newRatio(
      multiply(numerator(r1), numerator(r2)),
      multiply(denominator(r1), denominator(r2))
    );
  const divideRatios = (r1, r2) =>
    newRatio(
      multiply(numerator(r1), denominator(r2)),
      multiply(denominator(r1), numerator(r2))
    );

  const tag = (r) => addTypeTag("ratio", r);
  set(["new", "ratio"], (n, d) => tag(newRatio(n, d)));
  set(["add", "ratio", "ratio"], (r1, r2) => tag(addRatios(r1, r2)));
  set(["subtract", "ratio", "ratio"], (r1, r2) => tag(subtractRatios(r1, r2)));
  set(["multiply", "ratio", "ratio"], (r1, r2) => tag(multiplyRatios(r1, r2)));
  set(["divide", "ratio", "ratio"], (r1, r2) => tag(divideRatios(r1, r2)));

  set(["getNumerator", "ratio"], numerator);
  set(["getDenominator", "ratio"], denominator);

  set(["simplify", "ratio"], (r) => {
    const res = reduce(numerator(r), denominator(r));
    return tag(newRatio(numerator(res), denominator(res)));
  });

  // console.log("Ratios operations loaded");
};

//
// Explicit data type constructor
//
export const newRatio = (n, d) => get(["new", "ratio"])(n, d);

export class Ratio {
  constructor(n, d) {
    return get(["new", "ratio"])(n, d);
  }
}
