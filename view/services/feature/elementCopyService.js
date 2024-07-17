/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / Services / Feature / ElementCopyService
 */

import {
  marginAroundElements,
  getNavbarHeight,
} from "../../../util/uiService.js";
import { Adder } from "../../../model/elements/adder.js";
import { Tf } from "../../../model/elements/tf.js";

export const copyElement = function (element) {
  if (element.isAdder() || element.isTf()) {
    const block = element.getBlock();

    //compute a position for the copied element
    const position = element.getPosition();
    const offsetLeft = marginAroundElements + 10 * (Math.random() - 0.5);
    const offsetTop = marginAroundElements + 10 * (Math.random() - 0.5);

    const copiedElementPosition = {
      left: position.left + offsetLeft,
      top: position.top - getNavbarHeight() + offsetTop,
    };

    //create copied element
    if (element.isAdder()) {
      return new Adder(block, copiedElementPosition);
    } else if (element.isTf()) {
      return new Tf(
        element.getValue(),
        block,
        copiedElementPosition,
        null,
        element.getSamplingT()
      );
    }
  }
};
