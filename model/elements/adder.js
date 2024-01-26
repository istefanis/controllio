/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Model / Elements / Adder
 */

import {
  generateNewElementIdForElement,
  setElementIdForElement,
} from "../elementService.js";
import AdderView from "../../view/adderView.js";
import { removeLineRender } from "../../view/services/core/lineRenderingService.js";

/**
 * A class implementing an adder circuit element
 *
 * Implementation assumption: Each adder has multiple inputs and multiple outputs
 *
 * The class exposes an extensive API
 */
export class Adder {
  #adderView;
  #elementId = null;

  #value;
  #block;
  #iAmBlock = false;
  #iAmTf = false;
  #iAmAdder = true;
  #inputsArray = []; // '[[input1, sign1], [input2, sign2],...]
  #outputsArray = [];

  constructor(block, position, id) {
    if (!id) {
      this.#elementId = generateNewElementIdForElement(this);
    } else {
      setElementIdForElement(id, this);
      this.#elementId = id;
    }
    this.#value = "adder" + this.#elementId;
    this.#block = block;

    this.#render(position);

    block.adjoinAdders(this);

    return this;
  }

  #render = (position) => {
    this.#adderView = new AdderView(this, position);
  };

  #internalAddInput = (i) => this.#inputsArray.unshift(i);
  #internalRemoveInput = (i) => {
    this.#inputsArray = this.#inputsArray.filter((x) => x !== i);
    removeLineRender(i.getElementId(), this.#elementId);
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
  getPosition = () => this.#adderView.getPosition();

  getValue = () => this.#value;

  isBlock = () => this.#iAmBlock;
  isTf = () => this.#iAmTf;
  isAdder = () => this.#iAmAdder;

  hasInput = () => !(this.#inputsArray.length === 0);
  hasSingleInput = () => this.#inputsArray.length === 1;
  hasTwoInputs = () => this.#inputsArray.length === 2;
  hasTwoOrMoreInputs = () => this.#inputsArray.length >= 2;
  getInput = () => this.#inputsArray;
  setInput = (i) => this.#internalAddInput(i);
  removeInput = (i) => this.#internalRemoveInput(i);

  hasOutputs = () => !(this.#outputsArray.length === 0);
  hasSingleOutput = () => this.#outputsArray.length === 1;
  hasTwoOutputs = () => this.#outputsArray.length === 2;
  getOutputs = () => this.#outputsArray;
  addOutput = (o) => this.#internalAddOutput(o);
  removeOutput = (o) => this.#internalRemoveOutput(o);

  hasSingleConnection = () =>
    this.getInput().concat(this.getOutputs()).length === 1;

  getBlock = () => this.#block;
}

/**
 * Shortcut constructor for adders
 */
export const adder = (block) => new Adder(block);
