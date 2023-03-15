/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Model / SimplificationAlgorithms / MergeSerialAdders
 */

import { logMessages } from "../../util/loggingService.js";
import { connectWithoutChecks } from "../elementConnectionService.js";
import { updateSimplificationsDoneCounters } from "../../util/metricsService.js";
import { printElementValues } from "../../util/prettyPrintingService.js";
import { animateMergeNElements } from "../../view/animation/animateMergeNElements.js";

/**
 * Algorithm #6: "Merge serial adders"
 *
 * Executed for its side effects, not its return value
 */
export const mergeSerialAdders = async function (adders) {
  if (adders.length === 0) {
    logMessages(["[AL-60] INVOKED - MERGE SERIAL ADDERS"], "algorithms");
  } else {
    const adder = this._getFirstAdder(adders);
    const remainingAdders = this._getRemainingElements(adders);

    if (adder.hasSingleOutput()) {
      const secondAdder = adder.getOutputs()[0];

      if (!secondAdder.isAdder()) {
        logMessages(
          ["[CP-61] no merge serial adders here - !isAdder()"],
          "checkpoints"
        );
        await mergeSerialAdders.call(this, remainingAdders);
      } else {
        if (!secondAdder.hasSingleInput()) {
          logMessages(
            ["[CP-62] no merge serial adders here - !hasSingleInput()"],
            "checkpoints"
          );
          await mergeSerialAdders.call(this, remainingAdders);
        } else {
          await animateMergeNElements(
            adder.getElementId(),
            secondAdder.getElementId()
          );
          updateSimplificationsDoneCounters();
          logMessages(
            [
              "[SF-61] SIMPLIFICATION DONE - MERGE SERIAL ADDERS - " +
                adder.getValue() +
                " and " +
                secondAdder.getValue() +
                " merged",
            ],
            "simplifications"
          );

          // rearrange connections:
          if (adder.hasInput()) {
            adder.getInput().map((x) => x.removeOutput(adder));
            adder.getInput().map((x) => connectWithoutChecks(x, secondAdder));
          }
          secondAdder.removeInput(adder);

          // delete adder from adders:
          this._internalRemoveFromAdders(adder);
          logMessages(
            ["[CP-63] adders now: " + printElementValues(this._adders)],
            "checkpoints"
          );
          await mergeSerialAdders.call(this, remainingAdders);
        }
      }
    } else {
      logMessages(
        [
          "[CP-64] no merge serial adders here - hasSingleOutput() - " +
            adder.getValue(),
        ],
        "checkpoints"
      );
      await mergeSerialAdders.call(this, remainingAdders);
    }
  }
};
