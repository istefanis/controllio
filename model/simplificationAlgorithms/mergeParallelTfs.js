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
import { Polynomial } from "../../math/computerAlgebra/dataTypes/polynomials.js";
import { Ratio } from "../../math/computerAlgebra/dataTypes/ratios.js";
import { logMessages } from "../../util/loggingService.js";
import { updateSimplificationsDoneCounters } from "../../util/metricsService.js";
import { printElementValues } from "../../util/prettyPrintingService.js";
import { animateCreateElement } from "../../view/animation/animateCreateElement.js";
import { animateMergeNElements } from "../../view/animation/animateMergeNElements.js";
import { connectWithoutChecks } from "../elementConnectionService.js";
import { Tf } from "../elements/tf.js";

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
    logMessages(["[CP-30] no inputs for this adder"], "checkpoints");
  } else {
    // console.log("checkAdder", inputs.length);
    await checkAdderInputs.call(this, adder, inputs);
  }
  await mergeParallelTfs.call(this, this._getRemainingElements(adders));
};

const checkAdderInputs = async function (adder, remainingReferenceInputs) {
  // console.log("checkAdderInputs-1", remainingReferenceInputs.length);
  if (remainingReferenceInputs.length === 0) return;

  const referenceInput = remainingReferenceInputs[0];
  if (!referenceInput.isAdder() && referenceInput.hasSingleOutput()) {
    logMessages(["[CP-31] check referenceInput"], "checkpoints");
    // console.log("checkAdderInputs-2", remainingReferenceInputs.length);
    await checkReferenceInputSchemas.call(
      this,
      adder,
      referenceInput,
      adder.getInput().filter((x) => x !== referenceInput),
      remainingReferenceInputs
    );
  } else {
    logMessages(
      ["[CP-32] no single output: " + referenceInput.getValue()],
      "checkpoints"
    );
    await checkAdderInputs.call(this, adder, remainingReferenceInputs.slice(1));
  }
};

/**
 * Having one input as a reference,
 * check consecutively the schema formed with each of its sibling inputs,
 * and when finished, call its parent function with the reference input removed
 */
const checkReferenceInputSchemas = async function (
  adder,
  referenceInput,
  remainingSiblingInputs,
  remainingReferenceInputs
) {
  if (remainingSiblingInputs.length === 0) return;

  if (referenceInput.hasInput()) {
    if (referenceInput.getInput().isAdder()) {
      const adder1 = referenceInput.getInput();
      let siblingInput = remainingSiblingInputs[0];

      //if one of the two schema branches is a bare connection, create an identity tf there,
      //so as to merge the two tfs afterwards
      if (siblingInput.isAdder()) {
        const adder2 = siblingInput;

        if (adder1 === adder2) {
          logMessages(["[CP-33] Identity tf to be created"], "checkpoints");

          const position = adder.getPosition();
          const position1 = adder1.getPosition();

          const identityTf = new Tf(
            new Ratio(new Polynomial("s", [1]), new Polynomial("s", [1])),
            this,
            {
              left: (position.left + position1.left) / 2,
              top: (position.top + position1.top) / 2,
            }
          );

          connectWithoutChecks(adder1, identityTf);
          connectWithoutChecks(identityTf, adder);

          adder1.removeOutput(adder);
          adder.removeInput(adder1);

          await animateCreateElement(identityTf.getElementId());

          //call the procedure again to perform the simplification, replacing the input modified
          await checkReferenceInputSchemas.call(
            this,
            adder,
            referenceInput,
            remainingSiblingInputs.map((x) =>
              x === siblingInput ? identityTf : x
            ),
            remainingReferenceInputs.map((x) =>
              x === siblingInput ? identityTf : x
            )
          );
        } else {
          logMessages(["[CP-34] adder1 === adder2"], "checkpoints");
          await checkReferenceInputSchemas.call(
            this,
            adder,
            referenceInput,
            remainingSiblingInputs.slice(1),
            remainingReferenceInputs
          );
        }
      } else {
        if (siblingInput.hasSingleOutput()) {
          if (siblingInput.hasInput()) {
            if (siblingInput.getInput().isAdder()) {
              const adder2 = siblingInput.getInput();

              //check if both tf/block elements that are inputs to 'adder' (referenceInput & siblingInput
              //respectively) have themselves the same adder input (which is adder1 = adder2)
              if (adder1 === adder2) {
                await animateMergeNElements(
                  referenceInput.getElementId(),
                  siblingInput.getElementId()
                );

                siblingInput.setValue(
                  simplify(
                    add(referenceInput.getValue(), siblingInput.getValue())
                  )
                );

                adder1.removeOutput(referenceInput);
                adder.removeInput(referenceInput);

                //this._internalRemoveFromTfs(referenceInput);
                referenceInput.isBlock()
                  ? getBlock(referenceInput).removeFromBlocks(referenceInput)
                  : this._internalRemoveFromTfs(referenceInput);

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

                await checkAdderInputs.call(
                  this,
                  adder,
                  remainingReferenceInputs.filter((x) => x !== referenceInput)
                );
              } else {
                logMessages(["[CP-35] adder1 === adder2"], "checkpoints");
                await checkReferenceInputSchemas.call(
                  this,
                  adder,
                  referenceInput,
                  remainingSiblingInputs.slice(1),
                  remainingReferenceInputs
                );
              }
            } else {
              logMessages(
                ["[CP-36] siblingInput.getInput().isAdder()"],
                "checkpoints"
              );
              await checkReferenceInputSchemas.call(
                this,
                adder,
                referenceInput,
                remainingSiblingInputs.slice(1),
                remainingReferenceInputs
              );
            }
          } else {
            logMessages(["[CP-37] siblingInput.hasInput()"], "checkpoints");
            await checkReferenceInputSchemas.call(
              this,
              adder,
              referenceInput,
              remainingSiblingInputs.slice(1),
              remainingReferenceInputs
            );
          }
        } else {
          logMessages(
            ["[CP-38] siblingInput.hasSingleOutput()"],
            "checkpoints"
          );
          await checkReferenceInputSchemas.call(
            this,
            adder,
            referenceInput,
            remainingSiblingInputs.slice(1),
            remainingReferenceInputs
          );
        }
      }
    } else {
      logMessages(
        ["[CP-39] referenceInput.getInput().isAdder()"],
        "checkpoints"
      );
      await checkAdderInputs.call(
        this,
        adder,
        remainingReferenceInputs.slice(1)
      );
    }
  } else {
    logMessages(["[CP-40] referenceInput.hasInput()"], "checkpoints");
    await checkAdderInputs.call(this, adder, remainingReferenceInputs.slice(1));
  }
};
