/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Model / SimplificationAlgorithms / SplitTfIntoSingleOutputTfs
 */

import { logMessages } from "../../util/loggingService.js";
import { Tf } from "../elements/tf.js";
import { connectWithoutChecks } from "../elementConnectionService.js";
import { updateSimplificationsDoneCounters } from "../../util/metricsService.js";
import { animateSplitTfIntoSingleOutputTfs } from "../../view/animation/animateSplitTfIntoSingleOutputTfs.js";
import { printElementValues } from "../../util/prettyPrintingService.js";
import { Adder } from "../elements/adder.js";
import { animateCreateElement } from "../../view/animation/animateCreateElement.js";
import { indicativeTfWidth } from "../../util/uiService.js";

/**
 * Algorithm #2: "Split into single-output tfs"
 *
 * It turns a Tf that has 'x' outputs, into 'x' Tfs that have one output each
 *
 * Executed for its side effects, not its return value
 */
export const splitTfIntoSingleOutputTfs = async function (tfsAndBlocks) {
  if (tfsAndBlocks.length === 0) {
    logMessages(
      ["[AL-20] INVOKED - SPLIT TF INTO SINGLE OUTPUT TFS"],
      "algorithms"
    );
  } else {
    await checkTfForOutputs.call(
      this,
      this._getFirstTfOrBlock(tfsAndBlocks),
      tfsAndBlocks
    );
  }
};

const checkTfForOutputs = async function (tf, tfsAndBlocks) {
  const outputs = tf.getOutputs();
  if (outputs.length === 0) {
    logMessages(["[CP-21] no outputs to separate"], "checkpoints");
  } else {
    await createSeparateTfsFromTf.call(this, tf, outputs);
  }
  await splitTfIntoSingleOutputTfs.call(
    this,
    this._getRemainingElements(tfsAndBlocks)
  );
};

const createSeparateTfsFromTf = async function (tf, outputs) {
  if (outputs.length === 0 || outputs.slice(1).length === 0) return;

  let previousElement = tf.getInput();
  const firstOutput = outputs[0];
  const newTf = new Tf(tf.getValue(), this, tf.getPosition());

  if (!previousElement) {
    //create new adder as previousElement
    const tfBoundRect = document
      .querySelector(`#element${tf.getElementId()}`)
      .getBoundingClientRect();

    const adder = new Adder(tf.getBlock(), {
      left: tfBoundRect.left - indicativeTfWidth / 2,
      top: tfBoundRect.top - tfBoundRect.height / 2,
    });
    const adderDom = document.querySelector(`#element${adder.getElementId()}`);
    adderDom.style.opacity = 0;

    connectWithoutChecks(adder, tf);
    await animateCreateElement(adder.getElementId());

    previousElement = tf.getInput();
  }

  // tf: remove output to firstOutput
  tf.removeOutput(firstOutput);

  // firstOutput: remove input from tf
  firstOutput.isAdder()
    ? firstOutput.removeInput(tf)
    : firstOutput.setInput(null);

  connectWithoutChecks(previousElement, newTf);
  connectWithoutChecks(newTf, firstOutput);

  await animateSplitTfIntoSingleOutputTfs(
    tf.getElementId(),
    newTf.getElementId()
  );

  updateSimplificationsDoneCounters();
  logMessages(
    [
      "[SF-21] SIMPLIFICATION DONE - SPLIT TF INTO SINGLE OUTPUT TFS - tfs now: " +
        printElementValues(this._tfs) +
        ", adders now: " +
        printElementValues(this._adders),
    ],
    "simplifications"
  );
  await createSeparateTfsFromTf.call(this, tf, outputs.slice(1));
};
