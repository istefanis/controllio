/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Model / Elements / Tf
 */

import { Ratio } from "../../math/computerAlgebra/dataTypes/ratios.js";
import { Polynomial } from "../../math/computerAlgebra/dataTypes/polynomials.js";
import { round } from "../../math/computerAlgebra/algebraicOperations.js";
import {
  generateNewElementIdForElement,
  setElementIdForElement,
} from "../elementService.js";
import { roundDecimalDigitsTfComputations } from "../../util/commons.js";
import TfView from "../../view/tfView.js";
import { removeLineRender } from "../../view/services/core/lineRenderingService.js";

/**
 * A class implementing a transfer function (tf) circuit element
 *
 * Implementation assumption:
 * Each transfer function (tf) has only one input and multiple outputs.
 * Multiple inputs can be achieved by adding in front of it an adder
 *
 * The class exposes an extensive API
 */
export class Tf {
  #tfView;
  #elementId = null;

  #value = null;
  #block = null;
  #iAmBlock = false;
  #iAmTf = true;
  #iAmAdder = false;
  #input = null;
  #outputsArray = [];

  constructor(value, block, position, id) {
    if (!id) {
      this.#elementId = generateNewElementIdForElement(this);
    } else {
      setElementIdForElement(id, this);
      this.#elementId = id;
    }
    this.#block = block;

    this.setValue(value, position);

    block.adjoinTfs(this);

    return this;
  }

  #render = (position) => {
    if (!this.#tfView) {
      this.#tfView = new TfView(this, position);
    } else {
      this.#tfView.reRender(position);
    }
  };

  #internalSetInput = (i) => {
    // TODO - why this.#input !== null
    if (this.#input !== null) {
      removeLineRender(this.#input.getElementId(), this.#elementId);
    }
    if (i === null || (Array.isArray(i) && i.length === 0)) {
      this.#input = null;
    } else {
      if (
        this.#input == null ||
        (Array.isArray(this.#input) && this.#input.length === 0)
      ) {
        // console.log("input set - tf");
      } else {
        // console.log("input substitution - tf");
      }
      this.#input = i;
    }
  };

  #internalAddOutput = (o) => this.#outputsArray.unshift(o);
  #internalRemoveOutput = (o) => {
    this.#outputsArray = this.#outputsArray.filter((x) => x !== o);
    removeLineRender(this.#elementId, o.getElementId());
  };

  //
  // API
  //
  getElementId = () => this.#elementId;
  render = () => this.#render();
  getPosition = () => this.#tfView.getPosition();

  getValue = () => this.#value;
  setValue = (x, position) => {
    this.#value = round(x, roundDecimalDigitsTfComputations);
    this.#render(position);
  };

  isBlock = () => this.#iAmBlock;
  isTf = () => this.#iAmTf;
  isAdder = () => this.#iAmAdder;

  hasInput = () => this.#input !== null;
  getInput = () => this.#input;
  setInput = (i) => this.#internalSetInput(i);

  hasOutputs = () => !(this.#outputsArray.length === 0);
  hasSingleOutput = () => this.#outputsArray.length === 1;
  getOutputs = () => this.#outputsArray;
  addOutput = (o) => this.#internalAddOutput(o);
  removeOutput = (o) => this.#internalRemoveOutput(o);

  hasSingleConnection = () =>
    (this.hasInput() ? 1 : 0) + this.getOutputs().length === 1;

  getBlock = () => this.#block;
}

/**
 * Shortcut constructor for transfer functions
 */
export const tf = (n, d, block) =>
  new Tf(new Ratio(new Polynomial("s", n), new Polynomial("s", d)), block);
