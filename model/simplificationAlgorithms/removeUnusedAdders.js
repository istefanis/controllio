/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Model / SimplificationAlgorithms / RemoveUnusedAdders
 */

import { logMessages } from "../../util/loggingService.js";
import { connectWithoutChecks } from "../elementConnectionService.js";
import { updateSimplificationsDoneCounters } from "../../util/metricsService.js";
import { printElementValues } from "../../util/prettyPrintingService.js";
import { animateRemoveElement } from "../../view/animation/animateRemoveElement.js";

/**
 * Algorithm #1: "Remove unused adders"
 *
 * Executed for its side effects, not its return value
 */
export const removeUnusedAdders = async function (adders) {
  const removeHelper = async (A, soFar) => {
    if (A.length === 0) {
      logMessages(["[AL-10] INVOKED - REMOVE UNUSED ADDERS"], "algorithms");
    } else {
      if (A[0].hasInput() || A[0].hasOutputs()) {
        // remove adder - it has a single input
        if (A[0].hasSingleInput()) {
          await animateRemoveElement(A[0].getElementId());
          A[0].getOutputs().forEach((x) => {
            connectWithoutChecks(A[0].getInput()[0], x);
          });
          A[0].getInput()[0].removeOutput(A[0]);
          A[0].getOutputs().forEach((x) => {
            if (x.isAdder()) x.removeInput(A[0]);
          });
          this._internalRemoveFromAdders(A[0]);
          updateSimplificationsDoneCounters();
          logMessages(
            [
              "[SF-11] SIMPLIFICATION DONE - REMOVE UNUSED ADDERS - " +
                A[0].getValue() +
                " removed (single input) - new adders array: " +
                printElementValues(this._adders),
            ],
            "simplifications"
          );
          await removeHelper(A.slice(1), soFar);
        }
        // remove adder - it has no inputs
        else if (
          // (!A[0].hasInput() && this._tfs.length === 1) ||
          !A[0].hasInput() &&
          A[0].hasSingleOutput() &&
          A[0].getOutputs()[0].hasSingleConnection()
        ) {
          await animateRemoveElement(A[0].getElementId());
          A[0]
            .getOutputs()
            .forEach((x) =>
              x.isAdder() ? x.removeInput(A[0]) : x.setInput(null)
            );
          this._internalRemoveFromAdders(A[0]);
          updateSimplificationsDoneCounters();
          logMessages(
            [
              "[SF-12] SIMPLIFICATION DONE - REMOVE UNUSED ADDERS - " +
                A[0].getValue() +
                " removed (no inputs) - new adders array: " +
                printElementValues(this._adders),
            ],
            "simplifications"
          );
          await removeHelper(A.slice(1), soFar);
        }
        // remove adder - it has no outputs
        else if (
          // (!A[0].hasOutputs() && this._tfs.length === 1) ||
          !A[0].hasOutputs() &&
          A[0].hasSingleInput() &&
          A[0].getInput()[0].hasSingleConnection()
        ) {
          await animateRemoveElement(A[0].getElementId());
          A[0].getInput().forEach((x) => x.removeOutput(A[0]));
          this._internalRemoveFromAdders(A[0]);
          updateSimplificationsDoneCounters();
          logMessages(
            [
              "[SF-13] SIMPLIFICATION DONE - REMOVE UNUSED ADDERS - " +
                A[0].getValue() +
                " removed (no outputs) - new adders array: " +
                printElementValues(this._adders),
            ],
            "simplifications"
          );
          await removeHelper(A.slice(1), soFar);
        }
        // retain adder
        else {
          await removeHelper(A.slice(1), [A[0]].concat(soFar));
        }

        // remove adder - not connected
      } else {
        await animateRemoveElement(A[0].getElementId());
        this._internalRemoveFromAdders(A[0]);
        updateSimplificationsDoneCounters();
        logMessages(
          [
            "[SF-14] SIMPLIFICATION DONE - REMOVE UNUSED ADDERS - " +
              A[0].getValue() +
              " removed (not connected) - new adders array: " +
              printElementValues(this._adders),
          ],
          "simplifications"
        );
        await removeHelper(A.slice(1), soFar);
      }
    }
  };

  await removeHelper(adders, []);
};
