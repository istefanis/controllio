/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Test / Definitions / ComputerAlgebraTests
 */

import {
  add,
  divide,
  multiply,
  simplify,
  subtract,
} from "../../math/computerAlgebra/algebraicOperations.js";
import { Polynomial } from "../../math/computerAlgebra/dataTypes/polynomials.js";
import { Ratio } from "../../math/computerAlgebra/dataTypes/ratios.js";

const p1 = new Polynomial("x", [1, -2, 1]);
const p2 = new Polynomial("x", [1, -1]);
const p3 = new Polynomial("x", [2, -2, 2]);

export const computerAlgebraTests = {
  test1: {
    description: "test1: add(1, 2)",
    assertion: [add(1, 2), 3],
  },

  test2: {
    description: "test2: add(1, 1.5)",
    assertion: [add(1, 1.5), 2.5],
  },

  test3: {
    description: "test3: add(new Ratio(3, 5), new Ratio(2, 5))",
    assertion: [add(new Ratio(3, 5), new Ratio(2, 5)), ["ratio", [25, 25]]],
  },

  test4: {
    description: "test4: subtract(new Ratio(3, 5), new Ratio(3, 5))",
    assertion: [subtract(new Ratio(3, 5), new Ratio(3, 5)), ["ratio", [0, 25]]],
  },

  test5: {
    description: "test5: new Ratio(p2, p1)",
    assertion: [
      new Ratio(p2, p1),
      [
        "ratio",
        [
          ["polynomial", ["x", [1, -1]]],
          ["polynomial", ["x", [1, -2, 1]]],
        ],
      ],
    ],
  },

  test6: {
    description: "test6: add(p1, p2)",
    assertion: [add(p1, p2), ["polynomial", ["x", [1, -1, 0]]]],
  },

  test7: {
    description: "test7: subtract(p1, p2)",
    assertion: [subtract(p1, p2), ["polynomial", ["x", [1, -3, 2]]]],
  },

  test8: {
    description: "test8: multiply(p1, p2)",
    assertion: [multiply(p1, p2), ["polynomial", ["x", [1, -3, 3, -1]]]],
  },

  test9: {
    description: "test9: subtract(p2, new Polynomial('x', [1]))",
    assertion: [
      subtract(p2, new Polynomial("x", [1])),
      ["polynomial", ["x", [1, -2]]],
    ],
  },

  test10: {
    description: "test10: divide(p1, p2)",
    assertion: [divide(p1, p2), [["x", [1, -1]]]],
  },

  test11: {
    description: "test11: simplify(new Ratio(p1, p2))",
    assertion: [
      simplify(new Ratio(p1, p2)),
      [
        "ratio",
        [
          ["polynomial", ["x", [1, -1]]],
          ["polynomial", ["x", [1]]],
        ],
      ],
    ],
  },

  test12: {
    description: "test12: simplify(new Ratio(p3, new Polynomial('x', [2])))",
    assertion: [
      simplify(new Ratio(p3, new Polynomial("x", [2]))),
      [
        "ratio",
        [
          ["polynomial", ["x", [1, -1, 1]]],
          ["polynomial", ["x", [1]]],
        ],
      ],
    ],
  },
};
