/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Math / ComputerAlgebra / Tests
 */

import {
  add,
  subtract,
  multiply,
  divide,
  simplify,
} from "./algebraicOperations.js";
import { Ratio } from "./dataTypes/ratios.js";
import { Polynomial } from "./dataTypes/polynomials.js";

export const runTests = function () {
  console.log("Tests start");

  console.log("add ex1", add(1, 2));
  console.log("add ex2", add(1, 1.5));
  console.log("add ex3", add(new Ratio(3, 5), new Ratio(2, 5)));
  console.log("subtract ex1", subtract(new Ratio(3, 5), new Ratio(3, 5)));

  const p1 = new Polynomial("x", [1, -2, 1]);
  const p2 = new Polynomial("x", [1, -1]);
  const p3 = new Polynomial("x", [2, -2, 2]);
  console.log("ratio ex1", new Ratio(p2, p1));

  console.log("polynomial ex1", add(p1, p2));
  console.log("polynomial ex2", subtract(p1, p2));
  console.log("polynomial ex3", multiply(p1, p2));
  console.log("polynomial ex4", subtract(p2, new Polynomial("x", [1])));
  console.log("polynomial ex5", divide(p1, p2));

  console.log("polynomial ex6", simplify(p1, p2));
  console.log("polynomial ex7", simplify(p3, new Polynomial("x", [2])));

  console.log("Tests end");
};
