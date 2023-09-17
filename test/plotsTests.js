/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Test / PlotsTests
 */

import {
  findComplexRootsOfPolynomial,
  tolerance,
} from "../math/numericalAnalysis/numericalAnalysisService.js";
import { logMessages } from "../util/loggingService.js";
import BodePlot from "../view/plots/bodePlot.js";
import { runTestsSection } from "./testService.js";

export const runPlotsTests = function () {
  const toleranceSmall = tolerance; //0.0001
  const toleranceMedium = 0.2;
  const toleranceLarge = 3;

  const runPlotsTest = (test) => {
    //computation of Bode curve points & characteristic numbers
    const { magnitudeCurvePoints, phaseCurvePoints, characteristicNumbers } =
      new BodePlot(
        null,
        test.numeratorTermsArray,
        test.denominatorTermsArray,
        findComplexRootsOfPolynomial(test.numeratorTermsArray),
        findComplexRootsOfPolynomial(test.denominatorTermsArray)
      );
    // console.log(phaseCurvePoints);

    //evaluation of assertions using the computed data
    const assertionsEvaluated = test.assertions(
      magnitudeCurvePoints,
      phaseCurvePoints,
      characteristicNumbers
    );

    if (assertionsEvaluated.length > 0) {
      const testCondition = assertionsEvaluated.every((a) => {
        const actualValue = a[1];
        const expectedValue = a[2];
        const assertionTolerance = a[3];
        return assertionTolerance
          ? Math.abs(expectedValue - actualValue) < assertionTolerance
          : actualValue === expectedValue;
      });

      logMessages(
        [
          `[TE-03] ${[
            `${testCondition ? "✔️ success" : "❌ failure"} - ${
              test.description
            }`,
            ...assertionsEvaluated.map((a, i) =>
              assertionsEvaluated[i][3]
                ? `${a[0]} ~= ${assertionsEvaluated[i][2]}`
                : `${a[0]} === ${assertionsEvaluated[i][2]}`
            ),
          ].join(",\n")}`,
        ],
        "tests"
      );
    }
  };

  const tests = {
    test1: {
      description: "test1: tf([1, 0, 0, 0], [1])",
      numeratorTermsArray: [1, 0, 0, 0],
      denominatorTermsArray: [1],
      assertions: (
        magnitudeCurvePoints,
        phaseCurvePoints,
        characteristicNumbers
      ) => [
        [
          "Roll-off",
          characteristicNumbers?.rollOffText,
          "60 [dB/dec] (low), 60 [dB/dec] (high)",
        ],
        ["Phase at wMin", phaseCurvePoints[0][1], "270", toleranceSmall],
        [
          "Phase at wMax",
          phaseCurvePoints[phaseCurvePoints.length - 1][1],
          "270",
          toleranceSmall,
        ],
      ],
    },

    test2: {
      description: "test2: tf([1], [1, 0, 0, 0])",
      numeratorTermsArray: [1],
      denominatorTermsArray: [1, 0, 0, 0],
      assertions: (
        magnitudeCurvePoints,
        phaseCurvePoints,
        characteristicNumbers
      ) => [
        [
          "Roll-off",
          characteristicNumbers?.rollOffText,
          "-60 [dB/dec] (low), -60 [dB/dec] (high)",
        ],
        ["Phase at wMin", phaseCurvePoints[0][1], "-270", toleranceSmall],
        [
          "Phase at wMax",
          phaseCurvePoints[phaseCurvePoints.length - 1][1],
          "-270",
          toleranceSmall,
        ],
      ],
    },

    test3: {
      description: "test3: tf([1, 0, 1], [1])",
      numeratorTermsArray: [1, 0, 1],
      denominatorTermsArray: [1],
      assertions: (
        magnitudeCurvePoints,
        phaseCurvePoints,
        characteristicNumbers
      ) => [
        [
          "Roll-off",
          characteristicNumbers?.rollOffText,
          "0 [dB/dec] (low), 40 [dB/dec] (high)",
        ],
        ["Phase at wMin", phaseCurvePoints[0][1], "0", toleranceSmall],
        [
          "Phase at wMax",
          phaseCurvePoints[phaseCurvePoints.length - 1][1],
          "180",
          toleranceSmall,
        ],
      ],
    },

    test4: {
      description: "test4: tf([1], [1, 0, 1])",
      numeratorTermsArray: [1],
      denominatorTermsArray: [1, 0, 1],
      assertions: (
        magnitudeCurvePoints,
        phaseCurvePoints,
        characteristicNumbers
      ) => [
        [
          "Roll-off",
          characteristicNumbers?.rollOffText,
          "0 [dB/dec] (low), -40 [dB/dec] (high)",
        ],
        ["Phase at wMin", phaseCurvePoints[0][1], "0", toleranceSmall],
        [
          "Phase at wMax",
          phaseCurvePoints[phaseCurvePoints.length - 1][1],
          "-180",
          toleranceSmall,
        ],
      ],
    },

    test5: {
      description: "test5: tf([1], [0.3, 0.1, 1])",
      numeratorTermsArray: [1],
      denominatorTermsArray: [0.3, 0.1, 1],
      assertions: (
        magnitudeCurvePoints,
        phaseCurvePoints,
        characteristicNumbers
      ) => [
        [
          "Roll-off",
          characteristicNumbers?.rollOffText,
          "0 [dB/dec] (low), -40 [dB/dec] (high)",
        ],
        ["Phase at wMin", phaseCurvePoints[0][1], "0", toleranceMedium],
        [
          "Phase at wMax",
          phaseCurvePoints[phaseCurvePoints.length - 1][1],
          "-180",
          toleranceMedium,
        ],
      ],
    },

    test6: {
      description: "test6: tf([1], [1, 0])",
      numeratorTermsArray: [1],
      denominatorTermsArray: [1, 0],
      assertions: (
        magnitudeCurvePoints,
        phaseCurvePoints,
        characteristicNumbers
      ) => [
        [
          "Roll-off",
          characteristicNumbers?.rollOffText,
          "-20 [dB/dec] (low), -20 [dB/dec] (high)",
        ],
        ["Phase at wMin", phaseCurvePoints[0][1], "-90", toleranceSmall],
        [
          "Phase at wMax",
          phaseCurvePoints[phaseCurvePoints.length - 1][1],
          "-90",
          toleranceSmall,
        ],
      ],
    },

    test7: {
      description: "test7: tf([1, 200, 33.333], [0.333, 0])",
      numeratorTermsArray: [1, 200, 33.333],
      denominatorTermsArray: [0.333, 0],
      assertions: (
        magnitudeCurvePoints,
        phaseCurvePoints,
        characteristicNumbers
      ) => [
        ["Phase at wMin", phaseCurvePoints[0][1], "-90", toleranceMedium],
        [
          "Phase at wMax",
          phaseCurvePoints[phaseCurvePoints.length - 1][1],
          "90",
          toleranceLarge,
        ],
      ],
    },

    test8: {
      description: "test8: tf([1, 0.625], [0.125])",
      numeratorTermsArray: [1, 0.625],
      denominatorTermsArray: [0.125],
      assertions: (
        magnitudeCurvePoints,
        phaseCurvePoints,
        characteristicNumbers
      ) => [
        ["Phase at wMin", phaseCurvePoints[0][1], "0", toleranceMedium],
        [
          "Phase at wMax",
          phaseCurvePoints[phaseCurvePoints.length - 1][1],
          "90",
          toleranceMedium,
        ],
      ],
    },

    test9: {
      description: "test9: tf([1, 1.6], [0.2, 0])",
      numeratorTermsArray: [1, 1.6],
      denominatorTermsArray: [0.2, 0],
      assertions: (
        magnitudeCurvePoints,
        phaseCurvePoints,
        characteristicNumbers
      ) => [
        ["Phase at wMin", phaseCurvePoints[0][1], "-90", toleranceMedium],
        [
          "Phase at wMax",
          phaseCurvePoints[phaseCurvePoints.length - 1][1],
          "0",
          toleranceMedium,
        ],
      ],
    },

    test10: {
      description: "test10: tf([1, 0.2], [1.6, 0.2])",
      numeratorTermsArray: [1, 0.2],
      denominatorTermsArray: [1.6, 0.2],
      assertions: (
        magnitudeCurvePoints,
        phaseCurvePoints,
        characteristicNumbers
      ) => [
        ["Phase at wMin", phaseCurvePoints[0][1], "0", toleranceMedium],
        [
          "Phase at wMax",
          phaseCurvePoints[phaseCurvePoints.length - 1][1],
          "0",
          toleranceMedium,
        ],
      ],
    },

    test11: {
      description: "test11: tf([1, 2, 5], [4, 4])",
      numeratorTermsArray: [1, 2, 5],
      denominatorTermsArray: [4, 4],
      assertions: (
        magnitudeCurvePoints,
        phaseCurvePoints,
        characteristicNumbers
      ) => [
        [
          "Roll-off",
          characteristicNumbers?.rollOffText,
          "0 [dB/dec] (low), 20 [dB/dec] (high)",
        ],
        ["Phase at wMin", phaseCurvePoints[0][1], "0", toleranceMedium],
        [
          "Phase at wMax",
          phaseCurvePoints[phaseCurvePoints.length - 1][1],
          "90",
          toleranceMedium,
        ],
      ],
    },

    test12: {
      description: "test12: tf([1, 0, -0.1], [-0.1, -0.2, -0.1])",
      numeratorTermsArray: [1, 0, -0.1],
      denominatorTermsArray: [-0.1, -0.2, -0.1],
      assertions: (
        magnitudeCurvePoints,
        phaseCurvePoints,
        characteristicNumbers
      ) => [
        [
          "Roll-off",
          characteristicNumbers?.rollOffText,
          "0 [dB/dec] (low), 0 [dB/dec] (high)",
        ],
        ["Phase at wMin", phaseCurvePoints[0][1], "0", toleranceMedium],
        [
          "Phase at wMax",
          phaseCurvePoints[phaseCurvePoints.length - 1][1],
          "-180",
          toleranceMedium,
        ],
      ],
    },

    test13: {
      description: "test13: tf([1, 2, 1], [-10, 0, 1])",
      numeratorTermsArray: [1, 2, 1],
      denominatorTermsArray: [-10, 0, 1],
      assertions: (
        magnitudeCurvePoints,
        phaseCurvePoints,
        characteristicNumbers
      ) => [
        [
          "Roll-off",
          characteristicNumbers?.rollOffText,
          "0 [dB/dec] (low), 0 [dB/dec] (high)",
        ],
        ["Phase at wMin", phaseCurvePoints[0][1], "-180", toleranceMedium],
        [
          "Phase at wMax",
          phaseCurvePoints[phaseCurvePoints.length - 1][1],
          "0",
          toleranceMedium,
        ],
      ],
    },

    test14: {
      description: "test14: tf([1], [64, 5.214, 64.212, 3.375, 8.062])",
      numeratorTermsArray: [1],
      denominatorTermsArray: [64, 5.214, 64.212, 3.375, 8.062],
      assertions: (
        magnitudeCurvePoints,
        phaseCurvePoints,
        characteristicNumbers
      ) => [
        ["Phase at wMin", phaseCurvePoints[0][1], "0", toleranceMedium],
        [
          "Phase at wMax",
          phaseCurvePoints[phaseCurvePoints.length - 1][1],
          "-360",
          toleranceMedium,
        ],
      ],
    },

    test15: {
      description: "test15: tf([3.8], [64, 5.214, 64.212, 3.375, 8.062, 0])",
      numeratorTermsArray: [3.8],
      denominatorTermsArray: [64, 5.214, 64.212, 3.375, 8.062, 0],
      assertions: (
        magnitudeCurvePoints,
        phaseCurvePoints,
        characteristicNumbers
      ) => [
        [
          "Roll-off",
          characteristicNumbers?.rollOffText,
          "-20 [dB/dec] (low), -100 [dB/dec] (high)",
        ],
        ["Phase at wMin", phaseCurvePoints[0][1], "-90", toleranceMedium],
        [
          "Phase at wMax",
          phaseCurvePoints[phaseCurvePoints.length - 1][1],
          "-450",
          toleranceMedium,
        ],
      ],
    },

    test16: {
      description:
        "test16: tf([1, 1.333, 1, -0.667, 0.667, 0.333, 0.833, 1.167, 1.167, 0.833, 0.333], " +
        "[-1, 0.667, 0.667, 2.333, 1.333, -0.333, -0.5, -0.833, -1.167, -0.833, -0.333])",
      numeratorTermsArray: [
        1, 1.333, 1, -0.667, 0.667, 0.333, 0.833, 1.167, 1.167, 0.833, 0.333,
      ],
      denominatorTermsArray: [
        -1, 0.667, 0.667, 2.333, 1.333, -0.333, -0.5, -0.833, -1.167, -0.833,
        -0.333,
      ],
      assertions: (
        magnitudeCurvePoints,
        phaseCurvePoints,
        characteristicNumbers
      ) => [
        ["Phase at wMin", phaseCurvePoints[0][1], "-720", toleranceMedium],
        [
          "Phase at wMax",
          phaseCurvePoints[phaseCurvePoints.length - 1][1],
          "-720",
          toleranceMedium,
        ],
      ],
    },

    test17: {
      description:
        "test17: tf([1, -21, 210, -1260, 4725, -10395, 10395], " +
        "[1, 21, 211, 1281, 4935, 11655, 15120, 10395, 10395])",
      numeratorTermsArray: [1, -21, 210, -1260, 4725, -10395, 10395],
      denominatorTermsArray: [
        1, 21, 211, 1281, 4935, 11655, 15120, 10395, 10395,
      ],
      assertions: (
        magnitudeCurvePoints,
        phaseCurvePoints,
        characteristicNumbers
      ) => [
        [
          "Roll-off",
          characteristicNumbers?.rollOffText,
          "0 [dB/dec] (low), -40 [dB/dec] (high)",
        ],
        ["Phase at wMin", phaseCurvePoints[0][1], "0", toleranceMedium],
        [
          "Phase at wMax",
          phaseCurvePoints[phaseCurvePoints.length - 1][1],
          "-1260",
          toleranceLarge,
        ],
      ],
    },
  };

  runTestsSection("Plots", runPlotsTest, Object.values(tests));
};
