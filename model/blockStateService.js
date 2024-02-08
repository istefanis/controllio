/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Model / BlockStateService
 */

import { logMessages } from "../util/loggingService.js";
import { Tf } from "./elements/tf.js";
import { Adder } from "./elements/adder.js";
import { connectWithoutChecks } from "./elementConnectionService.js";
import {
  getElementFromElementId,
  resetElementService,
} from "./elementService.js";
import { roundDecimal } from "../util/commons.js";
import { getNavbarHeight, getZoomFactor } from "../util/uiService.js";
import { resetCanvas } from "../view/services/core/canvasService.js";
import { resetElementRenderingService } from "../view/services/core/elementRenderingService.js";
import {
  getLineViewsNumber,
  resetLineRenderingService,
} from "../view/services/core/lineRenderingService.js";

//
// State-related navbar buttons
//
const previousButton = document.getElementById("previous-button");
const nextButton = document.getElementById("next-button");
const connectionButton = document.getElementById("connection-button");
const deleteAllButton = document.getElementById("delete-all-button");
const optimizeTopologyButton = document.getElementById(
  "optimize-topology-button"
);
const simplifyButton = document.getElementById("simplify-button");

const enableOrDisableButtonsBasedOnBlockState = function (state) {
  const isEmptyState = isEmptyBlockState(state);

  connectionButton.disabled = isEmptyState;
  deleteAllButton.disabled = isEmptyState;
  optimizeTopologyButton.disabled = isEmptyState;
  simplifyButton.disabled = isEmptyState;
};

/**
 * Check if block state contains no tfs & adders
 */
const isEmptyBlockState = function (state) {
  return state.tfs.length === 0 && state.adders.length === 0;
};

/**
 * Clear current block state
 */
export const clearBlockState = function () {
  this._value = null;
  this._iAmBlock = true;
  this._iAmTf = false;
  this._iAmAdder = false;
  this._blocks = [];
  this._tfs = [];
  this._adders = [];
  this._input = null;
  this._outputsArray = [];
  this._iAmSimplified = true;
  this._connections = [];

  resetElementService();
  resetElementRenderingService();
  resetLineRenderingService();
  resetCanvas();
};

/**
 * Set/override current block state
 */
export const setBlockState = function (state) {
  clearBlockState.call(this);

  const zoomFactor = getZoomFactor();

  //adjust the element positions to the current zoom factor
  state.tfs.forEach(
    (x) =>
      new Tf(
        x.value,
        this,
        {
          left: x.position.left * zoomFactor,
          top: x.position.top * zoomFactor,
        },
        x.elementId
      )
  );
  state.adders.forEach(
    (x) =>
      new Adder(
        this,
        {
          left: x.position.left * zoomFactor,
          top: x.position.top * zoomFactor,
        },
        x.elementId
      )
  );
  state.connections.forEach((x) => {
    connectWithoutChecks(
      getElementFromElementId(x[0]),
      getElementFromElementId(x[1])
    );
  });

  optimizeTopologyButton.disabled = getLineViewsNumber() === 0 ? true : false;
};

/**
 * Get current block state
 */
export const getBlockState = function () {
  const zoomFactor = getZoomFactor();

  const currentState = {};

  //element positions must be transformed into a navbar height & zoom agnostic format
  //before being stored in the object returned
  const navbarHeight = getNavbarHeight();

  //store blocks
  currentState.blocks = [];
  this._blocks.forEach((x) => {
    const boundRect = document
      .querySelector(`#element${x.getElementId()}`)
      .getBoundingClientRect();

    currentState.blocks[x.getElementId()] = {
      value: x.getValue(),
      position: {
        left: roundDecimal(boundRect.left / zoomFactor, 1),
        top: roundDecimal((boundRect.top - navbarHeight) / zoomFactor, 1),
      },
    };
  });

  //store tfs
  currentState.tfs = [];
  this._tfs.forEach((x) => {
    const boundRect = document
      .querySelector(`#element${x.getElementId()}`)
      .getBoundingClientRect();

    currentState.tfs.push({
      value: x.getValue(),
      position: {
        left: roundDecimal(boundRect.left / zoomFactor, 1),
        top: roundDecimal((boundRect.top - navbarHeight) / zoomFactor, 1),
      },
      elementId: x.getElementId(),
    });
  });

  //store adders
  currentState.adders = [];
  this._adders.forEach((x) => {
    const boundRect = document
      .querySelector(`#element${x.getElementId()}`)
      .getBoundingClientRect();

    currentState.adders.push({
      value: x.getValue(),
      position: {
        left: roundDecimal(boundRect.left / zoomFactor, 1),
        top: roundDecimal((boundRect.top - navbarHeight) / zoomFactor, 1),
      },
      elementId: x.getElementId(),
    });
  });

  //store connections
  currentState.connections = [];
  this._connections.forEach((x) => {
    currentState.connections.push(x);
  });

  // console.log(currentState);
  return currentState;
};

//
// State history
//
const maxHistoricalStatesNumber = 150;
let historicalStateStorageEnabled = true;

export const enableHistoricalStateStorage = () =>
  (historicalStateStorageEnabled = true);
export const disableHistoricalStateStorage = () =>
  (historicalStateStorageEnabled = false);

/**
 * Clear stateHistory
 */
export const clearBlockStateHistory = function () {
  this._stateHistory = [];
  this._currentHistoricalState = [];

  previousButton.disabled = true;
  nextButton.disabled = true;
};

/**
 * Store state to stateHistory
 */
export const storeNewHistoricalBlockState = function () {
  if (historicalStateStorageEnabled) {
    const currentState = getBlockState.call(this);
    enableOrDisableButtonsBasedOnBlockState(currentState);

    //if the current state is not the last historical state, remove all following states
    if (this._currentHistoricalState !== this._stateHistory.length - 1) {
      this._stateHistory.splice(
        -(this._stateHistory.length - this._currentHistoricalState - 1)
      );
    }
    this._stateHistory.push(currentState);
    if (this._stateHistory.length > maxHistoricalStatesNumber) {
      //remove first state
      this._stateHistory.shift();
    }
    this._currentHistoricalState = this._stateHistory.length - 1;

    // log every new state stored:
    // console.log(this._stateHistory);

    if (this._currentHistoricalState > 0) {
      previousButton.disabled = false;
    }
    nextButton.disabled = true;
  }
};

/**
 * Load previous historical state
 */
export const loadPreviousHistoricalBlockState = function () {
  const previousHistoricalState = this._currentHistoricalState - 1;
  if (previousHistoricalState >= 0) {
    disableHistoricalStateStorage();

    const state = this._stateHistory[previousHistoricalState];
    setBlockState.call(this, state);
    enableOrDisableButtonsBasedOnBlockState(state);

    this._currentHistoricalState = previousHistoricalState;
    enableHistoricalStateStorage();
    nextButton.disabled = false;
  }
  if (this._currentHistoricalState === 0) {
    previousButton.disabled = true;
  }
};

/**
 * Load next historical state
 */
export const loadNextHistoricalBlockState = function () {
  const nextHistoricalState = this._currentHistoricalState + 1;
  if (nextHistoricalState < this._stateHistory.length) {
    disableHistoricalStateStorage();

    const state = this._stateHistory[nextHistoricalState];
    setBlockState.call(this, state);
    enableOrDisableButtonsBasedOnBlockState(state);

    this._currentHistoricalState = nextHistoricalState;
    enableHistoricalStateStorage();
    previousButton.disabled = false;
  }
  if (this._currentHistoricalState + 1 === this._stateHistory.length) {
    nextButton.disabled = true;
  }
};

/**
 * Store original pre-simplification block state
 */
export const storeOriginalBlockState = function () {
  const currentState = getBlockState.call(this);
  this._originalState.blocks = currentState.blocks;
  this._originalState.tfs = currentState.tfs;
  this._originalState.adders = currentState.adders;
  this._originalState.connections = currentState.connections;
  // console.log("connections stored", this._originalState.connections);

  logMessages(
    [
      "[CP-103] Original block state stored. " +
        "Blocks: " +
        this._originalState.blocks.length +
        ", Tfs: " +
        this._originalState.tfs.length +
        ", Adders: " +
        this._originalState.adders.length +
        ", Connections: " +
        this._originalState.connections.length,
    ],
    "checkpoints"
  );
};
