/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / TfView
 */

import {
  getNumerator,
  getDenominator,
  getTermsArray,
} from "../math/computerAlgebra/algebraicOperations.js";
import {
  polynomialTermsArrayToMarkup,
  computePaddedTfStrings,
  removeSupTagsFromMarkup,
} from "../util/prettyPrintingService.js";
import {
  getNavbarHeight,
  indicativeTfHeight,
  indicativeTfWidth,
} from "../util/uiService.js";
import {
  generateNewTfPosition,
  registerDomElement,
  setNewElementPosition,
} from "./services/core/elementRenderingService.js";
import { updateMockedGetBoundingClientRect } from "./services/core/mockingService.js";

export default class TfView {
  #tf;
  #domElementId;
  #domElement;
  #width;
  #height;

  constructor(tf, position) {
    this.#tf = tf;
    this.#domElementId = tf.getElementId();
    this.render(position);
  }

  render(position) {
    const n = getNumerator(this.#tf.getValue());
    const d = getDenominator(this.#tf.getValue());
    const tfParam = this.#tf.getParam();

    //compute numerator & denominator markup
    const numMarkup = polynomialTermsArrayToMarkup(getTermsArray(n), tfParam);
    const denMarkup = polynomialTermsArrayToMarkup(getTermsArray(d), tfParam);

    //compute horizontal line of proper length
    const [, h2] = computePaddedTfStrings(
      removeSupTagsFromMarkup(numMarkup),
      removeSupTagsFromMarkup(denMarkup)
    );

    const markup = `
      <div 
        class="element tf ${tfParam === "z" ? "discrete" : ""}" 
        id="element${this.#domElementId}" tabindex="0"> 
        <p>${numMarkup}</p>
        <p>${h2}</p>
        <p>${denMarkup}</p>
      </div>
    `;
    let grid = document.querySelector(".grid");
    grid.insertAdjacentHTML("beforeend", markup);

    //retrieve DOM element
    this.#domElement = document.querySelector(`#element${this.#domElementId}`);

    //store width & height values
    const tfBoundingRect = this.#domElement.getBoundingClientRect();
    if (tfBoundingRect.width !== 0 && tfBoundingRect.height !== 0) {
      this.#width = tfBoundingRect.width;
      this.#height = tfBoundingRect.height;
    } else {
      //mocked getBoundingClientRect() case (ex. testing with Jest)
      updateMockedGetBoundingClientRect(this.#domElement, {
        width: indicativeTfWidth,
        height: indicativeTfHeight,
        top: 0,
        left: 0,
        right: indicativeTfWidth,
        bottom: indicativeTfHeight,
      });
      this.#width = indicativeTfWidth;
      this.#height = indicativeTfHeight;
    }

    //set dataset attribute
    this.#domElement.dataset.elementId = this.#domElementId;

    //register DOM element
    registerDomElement(this.#domElement);

    //set position
    if (position) {
      setNewElementPosition(this.#domElement, position);
    } else {
      generateNewTfPosition(this.#domElement);
    }
  }

  reRender() {
    const n = getNumerator(this.#tf.getValue());
    const d = getDenominator(this.#tf.getValue());
    const tfParam = this.#tf.getParam();

    //compute numerator & denominator markup
    const numMarkup = polynomialTermsArrayToMarkup(getTermsArray(n), tfParam);
    const denMarkup = polynomialTermsArrayToMarkup(getTermsArray(d), tfParam);

    //compute horizontal line of proper length
    const [, h2] = computePaddedTfStrings(
      removeSupTagsFromMarkup(numMarkup),
      removeSupTagsFromMarkup(denMarkup)
    );

    //update existing DOM element contents
    const newMarkup = `
        <p>${numMarkup}</p>
        <p>${h2}</p>
        <p>${denMarkup}</p>
    `;
    this.#domElement.innerHTML = newMarkup;

    //adjust new position, based on new dimensions
    const newTfBoundingRect = this.#domElement.getBoundingClientRect();
    const newWidth = newTfBoundingRect.width;
    const newHeight = newTfBoundingRect.height;

    setNewElementPosition(this.#domElement, {
      left: newTfBoundingRect.left - (newWidth - this.#width) / 2,
      top:
        newTfBoundingRect.top -
        (newHeight - this.#height) / 2 -
        getNavbarHeight(),
    });

    this.#width = newWidth;
    this.#height = newHeight;
  }

  getPosition() {
    return this.#domElement.getBoundingClientRect();
  }
}
