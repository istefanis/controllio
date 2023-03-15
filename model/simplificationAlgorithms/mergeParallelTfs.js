/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Model / SimplificationAlgorithms / MergeParallelTfs
 */

import {
  add,
  simplify,
} from "../../math/computerAlgebra/algebraicOperations.js";
import { logMessages } from "../../util/loggingService.js";
import { updateSimplificationsDoneCounters } from "../../util/metricsService.js";
import { printElementValues } from "../../util/prettyPrintingService.js";
import { animateMergeNElements } from "../../view/animation/animateMergeNElements.js";

/**
 * Algorithm #3: "Merge parallel tfs"
 *
 * Merges two parallel Tfs, which are placed between two adders
 *
 * The algorithm has an adder as its starting point, and traces any
 * connected elements backwards, in order to discover the schema to be simplified
 *
 * Executed for its side effects, not its return value
 */
export const mergeParallelTfs = async function (adders) {
  if (adders.length === 0) {
    logMessages(["[AL-30] INVOKED - MERGE PARALLEL TFS"], "algorithms");
  } else {
    // console.log(this._getFirstAdder(adders));
    await checkAdder.call(this, this._getFirstAdder(adders), adders);
  }
};

const checkAdder = async function (adder, adders) {
  const inputs = adder.getInput();
  if (inputs.length === 0) {
    logMessages(["[CP-31] no inputs for this adder"], "checkpoints");
  } else {
    await checkAdderInputs.call(this, adder, inputs);
  }
  await mergeParallelTfs.call(this, this._getRemainingElements(adders));
};

const checkAdderInputs = async function (adder, inputs) {
  if (inputs.length === 0) return;

  const input1 = inputs[0];
  if (!input1.isAdder() && input1.hasSingleOutput()) {
    logMessages(["[CP-32] check input1"], "checkpoints");
    await checkInput1.call(this, adder, input1, inputs.slice(1));
  } else {
    logMessages(
      ["[CP-33] no single output: " + input1.getValue()],
      "checkpoints"
    );
    await checkAdderInputs.call(this, adder, inputs.slice(1));
  }
};

const checkInput1 = async function (adder, input1, inputs) {
  if (inputs.length === 0) return;

  if (input1.hasInput()) {
    if (input1.getInput().isAdder()) {
      const adder1 = input1.getInput();
      let input2 = inputs[0];

      if (input2.hasSingleOutput()) {
        if (input2.hasInput()) {
          if (input2.getInput().isAdder()) {
            const adder2 = input2.getInput();

            //check if both tf/block elements that are inputs to 'adder' (input1 & input2
            //respectively) have themselves the same adder input (which is adder1=adder2)
            if (adder1 === adder2) {
              await animateMergeNElements(
                input1.getElementId(),
                input2.getElementId()
              );

              input2.setValue(
                simplify(add(input1.getValue(), input2.getValue()))
              );

              adder1.removeOutput(input1);
              adder.removeInput(input1);

              //this._internalRemoveFromTfs(input1);
              input1.isBlock()
                ? getBlock(input1).removeFromBlocks(input1)
                : this._internalRemoveFromTfs(input1);

              updateSimplificationsDoneCounters();
              logMessages(
                [
                  "[SF-31] SIMPLIFICATION DONE - MERGE PARALLEL TFS - tfs now: " +
                    printElementValues(this._tfs) +
                    ", adders now: " +
                    printElementValues(this._adders),
                ],
                "simplifications"
              );

              await checkAdderInputs.call(this, adder, inputs);
            } else {
              logMessages(["[CP-34] adder1 === adder2"], "checkpoints");
              await checkInput1.call(this, adder, input1, inputs.slice(1));
            }
          } else {
            logMessages(["[CP-35] input2.getInput().isAdder()"], "checkpoints");
            await checkInput1.call(this, adder, input1, inputs.slice(1));
          }
        } else {
          logMessages(["[CP-36] input2.hasInput()"], "checkpoints");
          await checkInput1.call(this, adder, input1, inputs.slice(1));
        }
      } else {
        logMessages(["[CP-37] input2.hasSingleOutput()"], "checkpoints");
        await checkInput1.call(this, adder, input1, inputs.slice(1));
      }
    } else {
      logMessages(["[CP-38] input1.getInput().isAdder()"], "checkpoints");
      await checkAdderInputs.call(this, adder, inputs.slice(1));
    }
  } else {
    logMessages(["[CP-39] input1.hasInput()"], "checkpoints");
    await checkAdderInputs.call(this, adder, inputs.slice(1));
  }
};
