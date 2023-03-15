/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Model / ElementConnectionService
 */

import { adderWidth, marginAroundElements } from "../util/uiService.js";
import LineView from "../view/lineView.js";
import { removeLineRender } from "../view/services/core/lineRenderingService.js";
import { Adder } from "./elements/adder.js";

/**
 * Check whether a serial connection between two elements already exists (either directly or indirectly)
 */
const connectionAlreadyExists = function (element1, element2) {
  //1st level check
  if (
    element2.isAdder() &&
    element2.hasInput() &&
    element2.getInput().includes(element1)
  ) {
    console.warn("Connection between elements already exists");
    return true;
  }

  //TODO - more elaborate check
  // if (
  //   element2.isAdder() &&
  //   element2.hasInput() &&
  //   element2
  //     .getInput()
  //     .some(
  //       (x) => x.isAdder() && x.hasInput() && x.getInput().includes(element1)
  //     )
  // ) {
  //   console.warn("Connection between elements already exists");
  //   return false;
  // }

  //2nd level check
  if (
    element2.isAdder() &&
    element2.hasSingleInput() &&
    element2.getInput()[0].isAdder() &&
    element2.getInput()[0].hasSingleInput() &&
    element2.getInput()[0].getInput()[0] === element1
  ) {
    console.warn("Connection between elements already exists");
    return true;
  }
  //1st level check
  if (
    (element2.isBlock() || element2.isTf()) &&
    element2.hasInput() &&
    element2.getInput() === element1
  ) {
    console.warn("Connection between elements already exists");
    return true;
  }
  //2nd level check
  if (
    (element2.isBlock() || element2.isTf()) &&
    element2.hasInput() &&
    element2.getInput().isAdder() &&
    element2.getInput().hasSingleInput() &&
    element2.getInput().getInput()[0] === element1
  ) {
    console.warn("Connection between elements already exists");
    return true;
  }
  return false;
};

/**
 * Connect elements serially (a connection has a direction)
 */
export const connect = function (element1, element2) {
  if (element1.getBlock() !== element2.getBlock()) {
    console.warn("Elements do not belong to the same block");
    return;
  }

  if (connectionAlreadyExists(element1, element2)) return;

  if ((element2.isBlock() || element2.isTf()) && element2.hasInput()) {
    // console.log("case1");
    const element2Input = element2.getInput();

    if (element2Input.isAdder()) {
      // console.log("case2");
      //connect element1 to adder instead
      if (!connectionAlreadyExists(element1, element2Input)) {
        return connectWithoutChecks(element1, element2Input);
      } else {
        return;
      }
    } else {
      // console.log("case3");
      //connect element1 to a new adder instead

      //compute required components
      const block = element2.getBlock();
      const domElement2 = document.querySelector(
        `#element${element2.getElementId()}`
      );
      const position = {
        left:
          domElement2.getBoundingClientRect().left -
          adderWidth -
          marginAroundElements,
        top: domElement2.getBoundingClientRect().top,
      };

      //create new adder
      const adder = new Adder(block, position);

      //rearrange connections
      element2Input.removeOutput(element2);
      element2.setInput(null);
      removeLineRender(element2Input.getElementId(), element2.getElementId());

      if (
        !connectionAlreadyExists(element2Input, adder) &&
        !connectionAlreadyExists(element1, adder) &&
        !connectionAlreadyExists(adder, element2)
      ) {
        connectWithoutChecks(element2Input, adder);
        connectWithoutChecks(element1, adder);
        return connectWithoutChecks(adder, element2);
      } else {
        return;
      }
    }
  } else {
    return connectWithoutChecks(element1, element2);
  }
};

export const connectWithoutChecks = function (element1, element2) {
  if (element1.getBlock() === element2.getBlock()) {
    //store connection
    element1
      .getBlock()
      .storeConnection(element1.getElementId(), element2.getElementId());

    //render
    new LineView(element1, element2);

    element2.setInput(element1);
    return element1.addOutput(element2);
  } else {
    console.warn("Elements do not belong to the same block");
    return;
  }
};
