/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Test / PlotsTests
 */

import { findComplexRootsOfPolynomial } from "../math/numericalAnalysis/numericalAnalysisService.js";
import BodePlot from "../view/plots/bodePlot.js";
import { runTestsSection } from "./testService.js";

export const runPlotsTests = function () {
  const runPlotsTest = (test) => {
    const { magnitudeCurvePoints, phaseCurvePoints, characteristicNumbers } =
      new BodePlot(
        null,
        test.numeratorTermsArray,
        test.denominatorTermsArray,
        findComplexRootsOfPolynomial(test.numeratorTermsArray),
        findComplexRootsOfPolynomial(test.denominatorTermsArray)
      );

    const expectedResultsEvaluated = test.expectedResults(
      magnitudeCurvePoints,
      phaseCurvePoints,
      characteristicNumbers
    );

    if (expectedResultsEvaluated.length > 0) {
      const testCondition = expectedResultsEvaluated.every(
        (x) => x[1] === x[2]
      );
      console.log(
        [
          `${testCondition ? "✔️ success" : "❌ failure"} - ${
            test.description
          }`,
          ...expectedResultsEvaluated.map(
            (x, i) => `${x[0]} === ${expectedResultsEvaluated[i][2]}`
          ),
        ].join(",\n")
      );
    }
  };

  const tests = {
    test1: {
      description: "test1: tf([1, 0, 0, 0], [1])",
      numeratorTermsArray: [1, 0, 0, 0],
      denominatorTermsArray: [1],
      expectedResults: (
        magnitudeCurvePoints,
        phaseCurvePoints,
        characteristicNumbers
      ) => [
        ["Threshold", characteristicNumbers?.thresholdText, "0.707 = -3 [dB]"],
        [
          "Roll-off",
          characteristicNumbers?.rollOffText,
          "60 [dB/dec] (low), 60 [dB/dec] (high)",
        ],
      ],
    },

    test2: {
      description: "test2",
      numeratorTermsArray: [1],
      denominatorTermsArray: [1, 0, 0, 0],
      expectedResults: (
        magnitudeCurvePoints,
        phaseCurvePoints,
        characteristicNumbers
      ) => [],
    },

    test3: {
      description: "test3",
      numeratorTermsArray: [1, 0, 0, 0],
      denominatorTermsArray: [1],
      expectedResults: (
        magnitudeCurvePoints,
        phaseCurvePoints,
        characteristicNumbers
      ) => [],
    },

    test4: {
      description: "test4",
      numeratorTermsArray: [1, 0, 1],
      denominatorTermsArray: [1],
      expectedResults: (
        magnitudeCurvePoints,
        phaseCurvePoints,
        characteristicNumbers
      ) => [],
    },

    test5: {
      description: "test5",
      numeratorTermsArray: [1],
      denominatorTermsArray: [1, 0, 1],
      expectedResults: (
        magnitudeCurvePoints,
        phaseCurvePoints,
        characteristicNumbers
      ) => [],
    },

    test6: {
      description: "test6",
      numeratorTermsArray: [1],
      denominatorTermsArray: [1, 0],
      expectedResults: (
        magnitudeCurvePoints,
        phaseCurvePoints,
        characteristicNumbers
      ) => [],
    },

    test7: {
      description: "test7",
      numeratorTermsArray: [1, 200, 33.333],
      denominatorTermsArray: [0.333, 0],
      expectedResults: (
        magnitudeCurvePoints,
        phaseCurvePoints,
        characteristicNumbers
      ) => [],
    },

    test8: {
      description: "test8",
      numeratorTermsArray: [1, 0.625],
      denominatorTermsArray: [0.125],
      expectedResults: (
        magnitudeCurvePoints,
        phaseCurvePoints,
        characteristicNumbers
      ) => [],
    },

    test9: {
      description: "test9",
      numeratorTermsArray: [1, 1.6],
      denominatorTermsArray: [0.2, 0],
      expectedResults: (
        magnitudeCurvePoints,
        phaseCurvePoints,
        characteristicNumbers
      ) => [],
    },

    test10: {
      description: "test10",
      numeratorTermsArray: [1, 0.2],
      denominatorTermsArray: [1.6, 0.2],
      expectedResults: (
        magnitudeCurvePoints,
        phaseCurvePoints,
        characteristicNumbers
      ) => [],
    },

    test11: {
      description: "test11",
      numeratorTermsArray: [1],
      denominatorTermsArray: [0.3, 0.1, 1],
      expectedResults: (
        magnitudeCurvePoints,
        phaseCurvePoints,
        characteristicNumbers
      ) => [],
    },

    test12: {
      description: "test12",
      numeratorTermsArray: [1, 2, 5],
      denominatorTermsArray: [4, 4],
      expectedResults: (
        magnitudeCurvePoints,
        phaseCurvePoints,
        characteristicNumbers
      ) => [],
    },

    test13: {
      description: "test13",
      numeratorTermsArray: [1, 0, -0.1],
      denominatorTermsArray: [-0.1, -0.2, -0.1],
      expectedResults: (
        magnitudeCurvePoints,
        phaseCurvePoints,
        characteristicNumbers
      ) => [],
    },

    test14: {
      description: "test14",
      numeratorTermsArray: [1, 2, 1],
      denominatorTermsArray: [-10, 0, 1],
      expectedResults: (
        magnitudeCurvePoints,
        phaseCurvePoints,
        characteristicNumbers
      ) => [],
    },
  };

  runTestsSection("Plots", runPlotsTest, Object.values(tests));
};
