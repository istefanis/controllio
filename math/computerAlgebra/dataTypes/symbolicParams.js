/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Math / ComputerAlgebra / DataTypes / SymbolicParams
 */

/*
 * Prefix notation used extensively
 */

import { set } from "../algebraicOperations.js";

/**
 * Symbolic params operations
 */
export const loadSymbolicParamsOperations = function () {
  // operations between symbols
  set(["add", "symbol", "symbol"], (x, y) => ["+", x, y]);
  set(["subtract", "symbol", "symbol"], (x, y) => ["-", x, y]);
  set(["multiply", "symbol", "symbol"], (x, y) => ["*", x, y]);
  set(["divide", "symbol", "symbol"], (x, y) => ["/", x, y]);

  // operations between symbols & reals
  set(["add", "symbol", "real"], (x, y) => (y === 0 ? x : ["+", x, y]));
  set(["add", "real", "symbol"], (x, y) => (x === 0 ? y : ["+", x, y]));
  set(["subtract", "symbol", "real"], (x, y) => (y === 0 ? x : ["-", x, y]));
  set(["subtract", "real", "symbol"], (x, y) =>
    x === 0 ? ["-", y] : ["-", x, y]
  );
  set(["multiply", "symbol", "real"], (x, y) => {
    if (y === 0) return 0;
    if (y === 1) return x;
    return ["*", x, y];
  });
  set(["multiply", "real", "symbol"], (x, y) => {
    if (x === 0) return 0;
    if (x === 1) return y;
    return ["*", x, y];
  });
  set(["divide", "symbol", "real"], (x, y) => (y === 1 ? x : ["/", x, y]));
  set(["divide", "real", "symbol"], (x, y) => (x === 0 ? 0 : ["/", x, y]));

  // other operations
  set(["negate", "symbol"], (x) => ["-", x]);
  set(["isZero", "symbol"], (x) => false);

  // console.log("Symbolic params operations loaded");
};
