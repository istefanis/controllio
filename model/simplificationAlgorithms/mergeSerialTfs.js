/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Model / SimplificationAlgorithms / MergeSerialTfs
 */

import {
  multiply,
  simplify,
} from "../../math/computerAlgebra/algebraicOperations.js";
import { logMessages } from "../../util/loggingService.js";
import { connectWithoutChecks } from "../elementConnectionService.js";
import { updateSimplificationsDoneCounters } from "../../util/metricsService.js";
import { printElementValues } from "../../util/prettyPrintingService.js";
import { animateMergeNElements } from "../../view/animation/animateMergeNElements.js";

/**
 * Algorithm #5: "Merge serial tfs"
 *
 * Executed for its side effects, not its return value
 */
export const mergeSerialTfs = async function (tfsAndBlocks) {
  if (tfsAndBlocks.length === 0) {
    logMessages(["[AL-50] INVOKED - MERGE SERIAL TFS"], "algorithms");
  } else {
    const tf = this._getFirstTfOrBlock(tfsAndBlocks);
    const remainingTfsAndBlocks = this._getRemainingElements(tfsAndBlocks);

    // console.log("mergeSerialTfs.call(this)");
    // console.log(tf.getValue());
    // console.log("outputs: ", tf.getOutputs()))

    if (tf.hasSingleOutput()) {
      let secondTf = tf.getOutputs()[0];

      if (secondTf.isAdder()) {
        logMessages(
          ["[CP-51] no merge serial tfs here - isAdder()"],
          "checkpoints"
        );
        await mergeSerialTfs.call(this, remainingTfsAndBlocks);
      } else {
        await animateMergeNElements(tf.getElementId(), secondTf.getElementId());

        updateSimplificationsDoneCounters();
        logMessages(
          [
            "[SF-51] SIMPLIFICATION DONE - MERGE SERIAL TFS - " +
              tf.getValue() +
              " and " +
              secondTf.getValue() +
              " merged",
          ],
          "simplifications"
        );

        // store the merged value at secondTf:
        // console.log("tf.getValue()): ", tf.getValue());
        // console.log(secondTf.getValue());

        secondTf.setValue(
          simplify(multiply(tf.getValue(), secondTf.getValue()))
        );
        // console.log("new value: ", secondTf.getValue());

        // rearrange connections:
        if (tf.hasInput()) {
          tf.getInput().removeOutput(tf);
          connectWithoutChecks(tf.getInput(), secondTf); // input to secondTf removed
        } else {
          secondTf.setInput(null);
        }

        // delete tf from tfs:
        tf.isBlock()
          ? tf.getBlock().removeFromBlocks(tf)
          : this._internalRemoveFromTfs(tf);

        // console.log(a.getBlocks());
        // console.log(a.getValue());

        logMessages(
          ["[CP-52] tfs now: " + printElementValues(this._tfs)],
          "checkpoints"
        );

        await mergeSerialTfs.call(this, remainingTfsAndBlocks);
      }
    } else {
      logMessages(
        [
          "[CP-53] no merge serial tfs here - tf.hasSingleOutput()) - " +
            tf.getValue(),
        ],
        "checkpoints"
      );
      await mergeSerialTfs.call(this, remainingTfsAndBlocks);
    }
  }
};
