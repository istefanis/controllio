/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / LineView
 */

import { enableLineDrawingStyle } from "./services/core/canvasService.js";
import {
  registerLineView,
  drawLineWithArrow,
} from "./services/core/lineRenderingService.js";

export default class LineView {
  #element1;
  #element2;

  #domElement1;
  #domElement2;

  #lineLength;

  constructor(element1, element2) {
    this.#element1 = element1;
    this.#element2 = element2;
    registerLineView(this);
    this.render();
  }

  getLineLength() {
    return this.#lineLength;
  }

  isLineConnectingElements(element1Id, element2Id) {
    return (
      this.#element1.getElementId() === element1Id &&
      this.#element2.getElementId() === element2Id
    );
  }

  isLineConnectedToElement(elementId) {
    return (
      this.#element1.getElementId() === elementId ||
      this.#element2.getElementId() === elementId
    );
  }

  render() {
    //retrieve DOM elements
    this.#domElement1 = document.querySelector(
      `#element${this.#element1.getElementId()}`
    );
    this.#domElement2 = document.querySelector(
      `#element${this.#element2.getElementId()}`
    );

    //calculate start & end points
    const element1BoundingRect = this.#domElement1.getBoundingClientRect();
    const element2BoundingRect = this.#domElement2.getBoundingClientRect();

    const startX = element1BoundingRect.right;
    const startY = (element1BoundingRect.top + element1BoundingRect.bottom) / 2;
    const endX = element2BoundingRect.left;
    const endY = (element2BoundingRect.top + element2BoundingRect.bottom) / 2;

    enableLineDrawingStyle();
    this.#lineLength = drawLineWithArrow(startX, startY, endX, endY);
  }
}
