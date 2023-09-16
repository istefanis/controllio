/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Test / ComputerAlgebraTests
 */

import {
  add,
  subtract,
  multiply,
  divide,
  simplify,
} from "../math/computerAlgebra/algebraicOperations.js";
import { Ratio } from "../math/computerAlgebra/dataTypes/ratios.js";
import { Polynomial } from "../math/computerAlgebra/dataTypes/polynomials.js";
import { areEqualArrays } from "../util/commons.js";
import { runTestsSection } from "./testService.js";

export const runComputerAlgebraTests = function () {
  const runComputerAlgebraTest = (test) => {
    const testCondition = areEqualArrays(test.operation, test.expectedResult);
    console.log(
      testCondition ? "✔️ success -" : "❌ failure -",
      `${test.description} = ${test.operation}`
    );
  };

  const p1 = new Polynomial("x", [1, -2, 1]);
  const p2 = new Polynomial("x", [1, -1]);
  const p3 = new Polynomial("x", [2, -2, 2]);

  const tests = {
    test1: {
      description: "test1: add(1, 2)",
      operation: add(1, 2),
      expectedResult: 3,
    },

    test2: {
      description: "test2: add(1, 1.5)",
      operation: add(1, 1.5),
      expectedResult: 2.5,
    },

    test3: {
      description: "test3: add(new Ratio(3, 5), new Ratio(2, 5))",
      operation: add(new Ratio(3, 5), new Ratio(2, 5)),
      expectedResult: ["ratio", [25, 25]],
    },

    test4: {
      description: "test4: subtract(new Ratio(3, 5), new Ratio(3, 5))",
      operation: subtract(new Ratio(3, 5), new Ratio(3, 5)),
      expectedResult: ["ratio", [0, 25]],
    },

    test5: {
      description: "test5: new Ratio(p2, p1)",
      operation: new Ratio(p2, p1),
      expectedResult: [
        "ratio",
        [
          ["polynomial", ["x", [1, -1]]],
          ["polynomial", ["x", [1, -2, 1]]],
        ],
      ],
    },

    test6: {
      description: "test6: add(p1, p2)",
      operation: add(p1, p2),
      expectedResult: ["polynomial", ["x", [1, -1, 0]]],
    },

    test7: {
      description: "test7: subtract(p1, p2)",
      operation: subtract(p1, p2),
      expectedResult: ["polynomial", ["x", [1, -3, 2]]],
    },

    test8: {
      description: "test8: multiply(p1, p2)",
      operation: multiply(p1, p2),
      expectedResult: ["polynomial", ["x", [1, -3, 3, -1]]],
    },

    test9: {
      description: "test9: subtract(p2, new Polynomial('x', [1]))",
      operation: subtract(p2, new Polynomial("x", [1])),
      expectedResult: ["polynomial", ["x", [1, -2]]],
    },

    test10: {
      description: "test10: divide(p1, p2)",
      operation: divide(p1, p2),
      expectedResult: [["x", [1, -1]]],
    },

    test11: {
      description: "test11: simplify(new Ratio(p1, p2))",
      operation: simplify(new Ratio(p1, p2)),
      expectedResult: [
        "ratio",
        [
          ["polynomial", ["x", [1, -1]]],
          ["polynomial", ["x", [1]]],
        ],
      ],
    },

    test12: {
      description: "test12: simplify(new Ratio(p3, new Polynomial('x', [2])))",
      operation: simplify(new Ratio(p3, new Polynomial("x", [2]))),
      expectedResult: [
        "ratio",
        [
          ["polynomial", ["x", [1, -1, 1]]],
          ["polynomial", ["x", [1]]],
        ],
      ],
    },
  };

  runTestsSection(
    "Computer algebra",
    runComputerAlgebraTest,
    Object.values(tests)
  );
};
