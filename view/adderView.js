/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / AdderView
 */

import { adderHeight, adderWidth } from "../util/uiService.js";
import {
  generateNewAdderPosition,
  registerDomElement,
  setNewElementPosition,
} from "./services/core/elementRenderingService.js";
import { updateMockedGetBoundingClientRect } from "./services/core/mockingService.js";

export default class AdderView {
  #adder;
  #domElementId;
  #domElement;

  constructor(adder, position) {
    this.#adder = adder;
    this.#domElementId = adder.getElementId();
    this.render(position);
  }

  render(position) {
    //insert DOM element
    const markup = `
      <div class="element adder" id="element${this.#domElementId}" tabindex="0">
        <p>+</p>
      </div>
    `;
    let grid = document.querySelector(".grid");
    grid.insertAdjacentHTML("afterbegin", markup);

    //retrieve DOM element
    this.#domElement = document.querySelector(`#element${this.#domElementId}`);

    //mocked getBoundingClientRect() case (ex. testing with Jest)
    const adderBoundingRect = this.#domElement.getBoundingClientRect();
    if (adderBoundingRect.width === 0 && adderBoundingRect.height === 0) {
      updateMockedGetBoundingClientRect(this.#domElement, {
        width: adderWidth,
        height: adderHeight,
        top: 0,
        left: 0,
        right: adderWidth,
        bottom: adderHeight,
      });
    }

    //set dataset attribute
    this.#domElement.dataset.elementId = this.#domElementId;

    //register DOM element
    registerDomElement(this.#domElement);

    //set position
    if (position) {
      setNewElementPosition(this.#domElement, position);
    } else {
      generateNewAdderPosition(this.#domElement);
    }
  }

  getPosition() {
    return this.#domElement.getBoundingClientRect();
  }
}
