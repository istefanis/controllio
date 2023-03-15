/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Math / ComputerAlgebra / DataTypes / Reals
 */

import { set } from "../algebraicOperations.js";

/**
 * Reals operations
 */
export const loadRealsOperations = function () {
  const gcdReals = (a, b) => (!b ? a : gcdReals(b, a % b));

  set(["add", "real", "real"], (x, y) => x + y);
  set(["subtract", "real", "real"], (x, y) => x - y);
  set(["multiply", "real", "real"], (x, y) => x * y);
  set(["divide", "real", "real"], (x, y) => x / y);

  //BUGFIX
  set(["negate", "real"], (x) => -x);
  set(["isZero", "real"], (x) => x === 0);

  set(["gcd", "real", "real"], (a, b) => gcdReals(a, b));

  // console.log("Reals operations loaded");
};
