/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Model / BlockSimplificationService
 */

import { areEqualArrays } from "../util/commons.js";
import { logMessages } from "../util/loggingService.js";
import {
  simplificationsDone,
  algorithmsRun,
  algorithmsRunSinceLastSimplification,
  resetCounters,
  updateAlgorithmsRunCounters,
} from "../util/metricsService.js";
import { splitTfIntoSingleOutputTfs } from "./simplificationAlgorithms/splitTfIntoSingleOutputTfs.js";
import { mergeFeedbackLoop } from "./simplificationAlgorithms/mergeFeedbackLoop.js";
import { mergeParallelTfs } from "./simplificationAlgorithms/mergeParallelTfs.js";
import { mergeSerialAdders } from "./simplificationAlgorithms/mergeSerialAdders.js";
import { mergeSerialTfs } from "./simplificationAlgorithms/mergeSerialTfs.js";
import { removeUnusedAdders } from "./simplificationAlgorithms/removeUnusedAdders.js";
import {
  enableHistoricalStateStorage,
  disableHistoricalStateStorage,
  storeOriginalBlockState,
  storeNewHistoricalBlockState,
} from "./blockStateService.js";

/**
 * The method managing the simplification process of a block itself
 */
export const simplifyBlock = async function () {
  const simplifyLoop = async function () {
    const fullSimplificationAchieved = this.isFullySimplified();

    const partialSimplificationAchieved =
      algorithmsRunSinceLastSimplification > 9;

    if (fullSimplificationAchieved || partialSimplificationAchieved) {
      fullSimplificationAchieved
        ? logMessages(["FULL SIMPLIFICATION COMPLETED"], "algorithms")
        : logMessages(["PARTIAL SIMPLIFICATION COMPLETED"], "algorithms");

      logMessages(
        [
          "simplifications done: " +
            simplificationsDone +
            ", algorithms run: " +
            algorithmsRun,
          //  "adders: " + this._adders +
          //  "simplified tf: "
        ],
        "algorithms"
      );

      this._iAmSimplified = true;
      // console.log("simplified:", this._iAmSimplified);
      /*
        console.log(this._tfs, this._blocks);
        this._tfs.map((x) => {
          console.log(x.getValue());
        });
        this._blocks.map((x) => {
          console.log(x.getValue());
        });
        */

      this._value = this._tfs.concat(this._blocks)[0].getValue();

      enableHistoricalStateStorage();
      storeNewHistoricalBlockState.call(this);

      resetCounters();
    } else {
      updateAlgorithmsRunCounters();
      await mergeSerialTfs.call(this, this._tfs.concat(this._blocks));

      updateAlgorithmsRunCounters();
      await mergeSerialAdders.call(this, this._adders);
      // console.log("checkpoint1");

      const elementsNow = this._tfs.concat(this._blocks);
      updateAlgorithmsRunCounters();
      await mergeFeedbackLoop.call(this, this._tfs.concat(this._blocks));
      updateAlgorithmsRunCounters();
      await removeUnusedAdders.call(this, this._adders);
      // console.log("checkpoint2");

      // console.log(elementsNow.map((x) => x.getValue()));
      // console.log(this._tfs.concat(this._blocks));
      if (
        !areEqualArrays(elementsNow, this._tfs.concat(this._blocks)) &&
        !this._tfs.concat(this._blocks).length === 0
      ) {
        await simplifyLoop.call(this);
      } else {
        updateAlgorithmsRunCounters();
        await splitTfIntoSingleOutputTfs.call(
          this,
          this._tfs.concat(this._blocks)
        );
        updateAlgorithmsRunCounters();
        await mergeParallelTfs.call(this, this._adders);
        // console.log("checkpoint3");
        if (
          !areEqualArrays(elementsNow, this._tfs.concat(this._blocks)) &&
          !this._tfs.concat(this._blocks).length === 0
        ) {
          updateAlgorithmsRunCounters();
          await mergeFeedbackLoop.call(this, this._tfs.concat(this._blocks));

          updateAlgorithmsRunCounters();
          await removeUnusedAdders.call(this, this._adders);
          // console.log("checkpoint4");
        } else {
          updateAlgorithmsRunCounters();
          await mergeParallelTfs.call(this, this._adders);
        }
        await simplifyLoop.call(this);
      }
    }
  };

  //store the current state, before any simplification starts
  storeOriginalBlockState.call(this);
  disableHistoricalStateStorage();

  this._blocks.map(async (x) => await x.simplify());
  if (this._tfs.concat(this._blocks).length === 0 || this.isFullySimplified()) {
    this._iAmSimplified = true;
    // console.log(this._blocks);
    this._value = this._tfs.concat(this._blocks)[0].getValue();
    logMessages(["NO SIMPLIFICATIONS TO BE DONE"], "algorithms");
  } else {
    // logMessages(["problem"], "algorithms");
    // this._blocks.map(simplify);
    // updateAlgorithmsRunCounters();
    // removeUnconnectedTfs(this, "noArg");
    await simplifyLoop.call(this);
  }
};
