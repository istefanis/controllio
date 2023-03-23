/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Model / SimplificationAlgorithms / MergeFeedbackLoop
 */

import { Ratio } from "../../math/computerAlgebra/dataTypes/ratios.js";
import {
  subtract,
  multiply,
  getNumerator,
  getDenominator,
  simplify,
} from "../../math/computerAlgebra/algebraicOperations.js";
import { logMessages } from "../../util/loggingService.js";
import { updateSimplificationsDoneCounters } from "../../util/metricsService.js";
import { printElementValues } from "../../util/prettyPrintingService.js";
import { animateMergeNElements } from "../../view/animation/animateMergeNElements.js";
import { connectWithoutChecks } from "../elementConnectionService.js";

/**
 * Algorithm #4: " Merge feedback loop"
 *
 * Executed for its side effects, not its return value
 */
export const mergeFeedbackLoop = async function (tfsAndBlocks) {
  if (tfsAndBlocks.length === 0) {
    logMessages(["[AL-40] INVOKED - MERGE FEEDBACK LOOP"], "algorithms");
  } else {
    await checkTf.call(
      this,
      this._getFirstTfOrBlock(tfsAndBlocks),
      tfsAndBlocks
    );
  }
};

const checkTf = async function (tf, tfsAndBlocks) {
  const outputs = tf.getOutputs();
  if (outputs.length === 0) {
    logMessages(["[CP-41] no outputs"], "checkpoints");
  } else {
    await checkTfOutput.call(this, tf, outputs);
  }
  await mergeFeedbackLoop.call(this, this._getRemainingElements(tfsAndBlocks));
};

const checkTfOutput = async function (tf, outputs) {
  if (outputs.length === 0) return;

  if (outputs[0].isAdder()) {
    // case 1 - no feedback tf
    const firstAdder = outputs[0];

    if (firstAdder.hasSingleOutput()) {
      // console.log(firstAdder.getOutputs());
      const adderOutput = firstAdder.getOutputs()[0];

      if (adderOutput === tf) {
        //computation of new tf value:
        const tfValue = tf.getValue();
        const newTfValue = simplify(
          new Ratio(
            multiply(getNumerator(tfValue), getDenominator(tfValue)),
            multiply(
              subtract(getDenominator(tfValue), getNumerator(tfValue)),
              getDenominator(tfValue)
            )
          )
        );

        await animateMergeNElements(
          tf.getElementId(),
          firstAdder.getElementId()
        );

        if (firstAdder.hasTwoOrMoreInputs()) {
          if (firstAdder.hasTwoInputs()) {
            // tf step 1 - store the merged value at tf:
            tf.setValue(newTfValue);
            // tf step 2 - remove output to adder:
            tf.removeOutput(firstAdder);
            // adder step 1 - remove tf input:
            firstAdder.removeInput(tf);

            // adder step 1 - remove adder from adders, since it has no input or only one input left:
            const previousBlock = firstAdder.getInput()[0];
            // remove output from previous block to adder:
            previousBlock.removeOutput(firstAdder);
            // rearrange connections:
            firstAdder
              .getOutputs()
              .map((x) => connectWithoutChecks(previousBlock, x));
            // remove from adders:
            this._internalRemoveFromAdders(firstAdder);
          } else {
            // tf step 1 - store the merged value at tf:
            tf.setValue(newTfValue);
            // tf step 2 - remove output to adder:
            tf.removeOutput(firstAdder);
            // adder step 1 - remove tf input:
            firstAdder.removeInput(tf);
          }
        } else {
          //case: has only one input

          // tf step 1 - store the merged value at tf:
          tf.setValue(newTfValue);
          // tf step 2 - remove output to adder:
          tf.removeOutput(firstAdder);
          // adder step 1 - remove tf input:
          firstAdder.removeInput(tf);

          // tf step 2 - remove output to adder (continued):
          tf.setInput(null);

          // remove from adders:
          this._internalRemoveFromAdders(firstAdder);
        }

        updateSimplificationsDoneCounters();
        logMessages(
          [
            "[SF-41] SIMPLIFICATION DONE - MERGE FEEDBACK LOOP (with no feedback tf) - tfs now: " +
              printElementValues(this._tfs) +
              ", adders now: " +
              printElementValues(this._adders),
          ],
          "simplifications"
        );
        await checkTfOutput.call(this, tf, outputs.slice(1));
      } else {
        logMessages(
          ["[CP-42] no loop here - (adderOutput === tf) - no feedback tf"],
          "checkpoints"
        );
        await checkTfOutput.call(this, tf, outputs.slice(1));
      }
    } else {
      logMessages(
        ["[CP-43] no loop here - firstAdder.hasSingleOutput()"],
        "checkpoints"
      );
      await checkTfOutput.call(this, tf, outputs.slice(1));
    }
  } else {
    //case 2 - feedback tf
    const feedbackTf = outputs[0];

    if (feedbackTf.hasSingleOutput()) {
      const feedbackTfOutput = feedbackTf.getOutputs()[0];

      if (feedbackTfOutput.isAdder()) {
        // as in case 1 above:
        const firstAdder = feedbackTfOutput;

        if (firstAdder.hasSingleOutput()) {
          // console.log(firstAdder.getOutputs());
          const adderOutput = firstAdder.getOutputs()[0];

          if (adderOutput === tf) {
            //computation of new tf value:
            const tfValue = tf.getValue();
            const numTf = getNumerator(tfValue);
            const denomTf = getDenominator(tfValue);
            const numFeedTf = multiply(
              getNumerator(tfValue),
              getNumerator(feedbackTf.getValue())
            );
            const denomFeedTf = multiply(
              getDenominator(tfValue),
              getDenominator(feedbackTf.getValue())
            );
            const newTfValue = simplify(
              new Ratio(
                multiply(numTf, denomFeedTf),
                multiply(subtract(denomFeedTf, numFeedTf), denomTf)
              )
            );

            await animateMergeNElements(
              tf.getElementId(),
              feedbackTf.getElementId(),
              firstAdder.getElementId()
            );

            if (firstAdder.hasTwoOrMoreInputs()) {
              if (firstAdder.hasTwoInputs()) {
                // tf step 1 - store the merged value at tf:
                tf.setValue(newTfValue);
                // tf step 2 - remove output to feedbackTf:
                tf.removeOutput(feedbackTf);

                // adder step 1 - remove feedbackTf input:
                firstAdder.removeInput(feedbackTf);

                // remove feedbackTf from tfs:
                // this._internalRemoveFromTfs(feedbackTf);
                feedbackTf.isBlock()
                  ? getBlock(feedbackTf).removeFromBlocks(feedbackTf)
                  : this._internalRemoveFromTfs(feedbackTf);

                // adder step 2 - remove adder from adders, since it has no input or only one input left:
                const previousBlock = firstAdder.getInput()[0];
                // remove output from previous block to adder:
                previousBlock.removeOutput(firstAdder);
                // rearrange connections:
                firstAdder
                  .getOutputs()
                  .map((x) => connectWithoutChecks(previousBlock, x));
                // remove from adders:
                this._internalRemoveFromAdders(firstAdder);
              } else {
                // tf step 1 - store the merged value at tf:
                tf.setValue(newTfValue);
                // tf step 2 - remove output to feedbackTf:
                tf.removeOutput(feedbackTf);

                // adder step 1 - remove feedbackTf input:
                firstAdder.removeInput(feedbackTf);

                // remove feedbackTf from tfs:
                // this._internalRemoveFromTfs(feedbackTf);
                feedbackTf.isBlock()
                  ? getBlock(feedbackTf).removeFromBlocks(feedbackTf)
                  : this._internalRemoveFromTfs(feedbackTf);
              }
            } else {
              //case: has only one input

              // tf step 1 - store the merged value at tf:
              tf.setValue(newTfValue);
              // tf step 2 - remove output to feedbackTf:
              tf.removeOutput(feedbackTf);

              // adder step 1 - remove feedbackTf input:
              firstAdder.removeInput(feedbackTf);

              // remove feedbackTf from tfs:
              // this._internalRemoveFromTfs(feedbackTf);
              feedbackTf.isBlock()
                ? getBlock(feedbackTf).removeFromBlocks(feedbackTf)
                : this._internalRemoveFromTfs(feedbackTf);

              // tf step 2 - remove output to adder:
              tf.setInput(null);

              // remove from adders:
              this._internalRemoveFromAdders(firstAdder);
            }

            updateSimplificationsDoneCounters();
            logMessages(
              [
                "[SF-42] SIMPLIFICATION DONE - MERGE FEEDBACK LOOP (with feedback tf) - tfs now: " +
                  printElementValues(this._tfs) +
                  ", adders now: " +
                  printElementValues(this._adders),
              ],
              "simplifications"
            );
            await checkTfOutput.call(this, tf, outputs.slice(1));
          } else {
            logMessages(
              ["[CP-44] no loop here - (adderOutput === tf)"],
              "checkpoints"
            );
            await checkTfOutput.call(this, tf, outputs.slice(1));
          }
        } else {
          logMessages(
            ["[CP-45] no loop here - firstAdder.hasSingleOutput()"],
            "checkpoints"
          );
          await checkTfOutput.call(this, tf, outputs.slice(1));
        }
      } else {
        logMessages(
          ["[CP-46] no loop here - feedbackTfOutput.isAdder()"],
          "checkpoints"
        );
        await checkTfOutput.call(this, tf, outputs.slice(1));
      }
    } else {
      logMessages(
        ["[CP-47] no loop here - feedbackTf.hasSingleOutput()"],
        "checkpoints"
      );
      await checkTfOutput.call(this, tf, outputs.slice(1));
    }
  }
};
