/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Model / Elements / Block
 */

import { areEqualArrays } from "../../util/commons.js";
import { logMessages } from "../../util/loggingService.js";
import { removeRenderedElement } from "../../view/services/core/elementRenderingService.js";
import { simplifyBlock } from "../blockSimplificationService.js";
import {
  clearBlockState,
  setBlockState,
  getBlockState,
  loadPreviousHistoricalBlockState,
  loadNextHistoricalBlockState,
  storeNewHistoricalBlockState,
  clearBlockStateHistory,
} from "../blockStateService.js";
import { removeElementWithElementId } from "../elementService.js";

/**
 * Circuit elements (tfs, adders and blocks) are implemented as objects, using the message-passing style
 *
 * A block of elements is a means for achieving abstraction. Circuit elements (such as tfs, adders and blocks) can be "stored" inside a block and form a whole, which can be handled as an element itself
 *
 * Implementation assumption: Each block of elements has only one input (another tf, adder or block) and multiple outputs. Multiple inputs can be achieved by adding in front of it an adder
 */
export class Block {
  _value; //a block obtains a value only when simplified
  _parentBlock; //a parent block is optional
  _iAmBlock = true;
  _iAmTf = false;
  _iAmAdder = false;
  _blocks = []; //an array of all block elements of the block
  _tfs = []; //an array of all tf elements of the block
  _adders = []; //an array of all adder elements of the block
  _input = null;
  _outputsArray = [];
  _iAmSimplified = true;

  _connections = []; //an array of all connections between elements both belonging to this block
  _originalState = {}; //pre-simplification state

  _stateHistory = [];
  _currentHistoricalState = [];

  constructor(...parentBlock) {
    this._parentBlock = parentBlock.length !== 0 ? parentBlock[0] : null;
    if (this._parentBlock !== null) {
      this._parentBlock.adjoinBlocks(this);
    }

    storeNewHistoricalBlockState.call(this);
    return this;
  }

  _internalSetInput = (i) => {
    if (i !== null) {
      // console.log("input substitution - block");
    }
    this._input = i;
  };

  _internalAddOutput = (o) => this._outputsArray.unshift(o);
  _internalRemoveOutput = (o) =>
    (this._outputsArray = this._outputsArray.filter((x) => x !== o));

  //
  // Blocks, tfs and adders lists operators
  //

  // array operators for handling tfs, block and adders elements (they share the same array representation):
  _getFirstTfOrBlock = (elements) => elements[0];
  _getFirstAdder = (adders) => adders[0];
  _getRemainingElements = (elements) => elements.slice(1);

  // blocks operators:
  _internalIsElementOfBlocks = (x) => this._blocks.includes(x);

  _internalAdjoinBlocks = (x) => {
    if (this._internalIsElementOfBlocks(x)) return "adjoinOk";
    this._iAmSimplified = false;
    this._blocks.unshift(x);
    storeNewHistoricalBlockState.call(this);
  };

  _internalRemoveFromBlocks = (x) => {
    this._iAmSimplified = false;
    this._blocks = this._blocks.filter((y) => y !== x);
    removeRenderedElement(x.getElementId());
    removeElementWithElementId(x.getElementId());
    storeNewHistoricalBlockState.call(this);
  };

  // tfs operators:
  _internalIsElementOfTfs = (x) => this._tfs.includes(x);

  _internalAdjoinTfs = (x) => {
    if (this._internalIsElementOfTfs(x)) return "adjoinOk";
    this._iAmSimplified = false;
    this._tfs.unshift(x);
    storeNewHistoricalBlockState.call(this);
  };

  _internalRemoveFromTfs = (x) => {
    this._iAmSimplified = false;
    this._tfs = this._tfs.filter((y) => y !== x);
    removeRenderedElement(x.getElementId());
    removeElementWithElementId(x.getElementId());
    storeNewHistoricalBlockState.call(this);
  };

  // adders operators:
  _internalIsElementOfAdders = (x) => this._adders.includes(x);

  _internalAdjoinAdders = (x) => {
    if (this._internalIsElementOfAdders(x)) return "adjoinOk";
    this._iAmSimplified = false;
    this._adders.unshift(x);
    storeNewHistoricalBlockState.call(this);
  };

  _internalRemoveFromAdders = (x) => {
    this._iAmSimplified = false;
    this._adders = this._adders.filter((y) => y !== x);
    removeRenderedElement(x.getElementId());
    removeElementWithElementId(x.getElementId());
    storeNewHistoricalBlockState.call(this);
  };

  _internalStoreConnection = (elementId1, elementId2) => {
    this._connections.push([elementId1, elementId2]);
    storeNewHistoricalBlockState.call(this);
  };

  _internalRemoveConnection = (elementId1, elementId2) => {
    this._connections = this._connections.filter(
      (x) => !areEqualArrays(x, [elementId1, elementId2])
    );
    storeNewHistoricalBlockState.call(this);
  };

  _internalRemoveAllConnections = () => {
    // console.log("remove all connections");
    this._connections = [];
    storeNewHistoricalBlockState.call(this);
  };

  //
  // API
  //
  getValue = () => this._value;
  setValue = (x) => (this._value = x);

  isBlock = () => this._iAmBlock;
  isTf = () => this._iAmTf;
  isAdder = () => this._iAmAdder;

  isSimplified = () => this._iAmSimplified;
  simplify = async () => await simplifyBlock.call(this);

  hasInput = () => this._input !== null;
  getInput = () => this._input;
  setInput = (i) => this._internalSetInput(i);

  hasOutputs = () => !(this._outputsArray.length === 0);
  hasSingleOutput = () => this._outputsArray.length === 1;
  getOutputs = () => this._outputsArray;
  addOutput = (o) => this._internalAddOutput(o);
  removeOutput = (o) => this._internalRemoveOutput(o);

  hasSingleConnection = () =>
    (this.hasInput() ? 1 : 0) + this.getOutputs().length === 1;

  isElementOfBlocks = (x) => this._internalIsElementOfBlocks(x);
  isElementOfTfs = (x) => this._internalIsElementOfTfs(x);
  isElementOfAdders = (x) => this._internalIsElementOfAdders(x);
  adjoinBlocks = (x) => this._internalAdjoinBlocks(x);
  adjoinTfs = (x) => this._internalAdjoinTfs(x);
  adjoinAdders = (x) => this._internalAdjoinAdders(x);
  removeFromBlocks = (x) => this._internalRemoveFromBlocks(x);
  removeFromTfs = (x) => this._internalRemoveFromTfs(x);
  removeFromAdders = (x) => this._internalRemoveFromAdders(x);

  getBlock = () => this._parentBlock;
  getBlocks = () => this._blocks;
  getTfs = () => this._tfs;
  getAdders = () => this._adders;

  storeConnection = (elementId1, elementId2) =>
    this._internalStoreConnection(elementId1, elementId2);
  removeConnection = (elementId1, elementId2) =>
    this._internalRemoveConnection(elementId1, elementId2);
  removeAllConnections = () => this._internalRemoveAllConnections();

  clearState = () => clearBlockState.call(this);
  setState = (state) => setBlockState.call(this, state);
  getState = () => getBlockState.call(this);
  loadPreviousHistoricalState = () =>
    loadPreviousHistoricalBlockState.call(this);
  loadNextHistoricalState = () => loadNextHistoricalBlockState.call(this);
  storeNewHistoricalState = () => storeNewHistoricalBlockState.call(this);
  clearStateHistory = () => clearBlockStateHistory.call(this);
}

/**
 * Shortcut constructor for blocks
 */
export const block = (...parentBlock) => new Block(...parentBlock);

export const getSimplifiedBlockValue = async function (block) {
  // if (block.isSimplified()) {
  //   // console.log("already simplified");
  //   return block.getValue();
  // } else {
  await block.simplify();
  if (!block.isSimplified()) {
    logMessages(
      ["getSimplifiedBlockValue() - [CP-104] Block not fully simplified"],
      "checkpoints"
    );
  }
  return block.getValue();
  // }
};
