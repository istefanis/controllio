/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / Services / Feature / ElementCreationService
 */

import { Polynomial } from "../../../math/computerAlgebra/dataTypes/polynomials.js";
import { Ratio } from "../../../math/computerAlgebra/dataTypes/ratios.js";
import {
  disableHistoricalStateStorage,
  enableHistoricalStateStorage,
} from "../../../model/blockStateService.js";
import { Adder } from "../../../model/elements/adder.js";
import { Tf } from "../../../model/elements/tf.js";
import { getTopBlock } from "../../../model/topBlockService.js";
import {
  indicativeTfHeight,
  indicativeTfWidth,
  adderWidth,
  adderHeight,
  makeButtonActive,
  makeButtonInActive,
  isMobileDevice,
  makeElementActive,
  resetActiveElements,
  getNavbarHeight,
  getZoomFactor,
} from "../../../util/uiService.js";
import {
  closeElementAnalysisWindow,
  openOrUpdateElementAnalysisWindow,
  setExpandedElement,
} from "../../elementAnalysisWindowView.js";
import {
  deleteExpandedOrSelectedElements,
  getNewlyCreatedElement,
  setNewlyCreatedElement,
} from "../core/elementSelectingAndDraggingService.js";

const deleteButton = document.getElementById("delete-button");

export const createNewTf = function (invokedByTouchEvent) {
  const newTfButton = document.getElementById("tf-button");

  disableHistoricalStateStorage();

  if (!getNewlyCreatedElement()) {
    //case: button is pressed for the first time

    closeElementAnalysisWindow();

    //compute required components
    const position = {
      left:
        newTfButton.getBoundingClientRect().left +
        (invokedByTouchEvent
          ? (Math.random() - 0.5) * 40
          : -indicativeTfWidth / 2),
      top:
        newTfButton.getBoundingClientRect().top +
        (invokedByTouchEvent
          ? indicativeTfHeight + (Math.random() - 0.5) * 60 + getNavbarHeight()
          : -indicativeTfHeight / 2),
    };
    const block = getTopBlock();

    //create new tf
    const tf = new Tf(
      new Ratio(new Polynomial("s", [1, 2, 3]), new Polynomial("s", [1, 2, 3])),
      block,
      {
        left: position.left,
        top: position.top * getZoomFactor(),
      }
    );

    //retrieve DOM element
    const tfId = tf.getElementId();
    const tfDomElement = document.querySelector(`#element${tfId}`);

    deleteButton.disabled = true;
    if (invokedByTouchEvent && isMobileDevice) {
      //store state
      enableHistoricalStateStorage();
      block.storeNewHistoricalState();

      resetActiveElements();
      makeElementActive(tfDomElement);
    } else if (invokedByTouchEvent) {
      //store state
      enableHistoricalStateStorage();
      block.storeNewHistoricalState();

      setExpandedElement(tfDomElement);
      openOrUpdateElementAnalysisWindow(tfDomElement);
    } else {
      makeButtonActive(newTfButton);
      setNewlyCreatedElement(tfDomElement);
    }
  } else {
    //case: button has already been pressed, and is now revoked

    deleteExpandedOrSelectedElements();
    setNewlyCreatedElement(null);
    makeButtonInActive(newTfButton);
  }
};

export const createNewReadyMadeTf = function (
  numTermsArray,
  denTermsArray,
  clientX,
  clientY,
  domElementWidth,
  invokedByTouchEvent
) {
  const newReadyMadeTfButton = document.getElementById("ready-made-tf-button");

  disableHistoricalStateStorage();

  closeElementAnalysisWindow();

  //compute required components
  const position = {
    left: invokedByTouchEvent
      ? newReadyMadeTfButton.getBoundingClientRect().left +
        (Math.random() - 0.5) * 40
      : clientX - (domElementWidth * getZoomFactor()) / 2,
    top: invokedByTouchEvent
      ? newReadyMadeTfButton.getBoundingClientRect().top +
        indicativeTfHeight +
        (Math.random() - 0.5) * 60 +
        getNavbarHeight() / 2
      : clientY - indicativeTfHeight / 2 - getNavbarHeight(),
  };
  const block = getTopBlock();

  //create new tf
  const tf = new Tf(
    new Ratio(
      new Polynomial("s", numTermsArray),
      new Polynomial("s", denTermsArray)
    ),
    block,
    {
      left: position.left,
      top: position.top,
    }
  );

  //retrieve DOM element
  const tfId = tf.getElementId();
  const tfDomElement = document.querySelector(`#element${tfId}`);

  deleteButton.disabled = true;
  if (invokedByTouchEvent && isMobileDevice) {
    //store state
    enableHistoricalStateStorage();
    block.storeNewHistoricalState();

    resetActiveElements();
    makeElementActive(tfDomElement);
  } else if (invokedByTouchEvent) {
    //store state
    enableHistoricalStateStorage();
    block.storeNewHistoricalState();

    setExpandedElement(tfDomElement);
    openOrUpdateElementAnalysisWindow(tfDomElement);
  } else {
    setNewlyCreatedElement(tfDomElement);
  }
};

export const createNewAdder = function (invokedByTouchEvent) {
  const newAdderButton = document.getElementById("adder-button");

  disableHistoricalStateStorage();

  if (!getNewlyCreatedElement()) {
    //case: button is pressed for the first time

    closeElementAnalysisWindow();

    //compute required components
    const position = {
      left:
        newAdderButton.getBoundingClientRect().left +
        (invokedByTouchEvent ? (Math.random() - 0.5) * 40 : -adderWidth / 2),
      top:
        newAdderButton.getBoundingClientRect().top +
        (invokedByTouchEvent
          ? adderHeight + (Math.random() - 0.5) * 60 + getNavbarHeight()
          : -adderHeight / 2),
    };
    const block = getTopBlock();

    //create new adder
    const adder = new Adder(block, position);

    //retrieve DOM element
    const adderId = adder.getElementId();
    const adderDomElement = document.querySelector(`#element${adderId}`);

    deleteButton.disabled = true;
    if (invokedByTouchEvent && isMobileDevice) {
      //store state
      enableHistoricalStateStorage();
      block.storeNewHistoricalState();

      resetActiveElements();
      makeElementActive(adderDomElement);
    } else if (invokedByTouchEvent) {
      //store state
      enableHistoricalStateStorage();
      block.storeNewHistoricalState();

      setExpandedElement(adderDomElement);
      openOrUpdateElementAnalysisWindow(adderDomElement);
    } else {
      makeButtonActive(newAdderButton);
      setNewlyCreatedElement(adderDomElement);
    }
  } else {
    //case: button has already been pressed, and is now revoked

    deleteExpandedOrSelectedElements();
    setNewlyCreatedElement(null);
    makeButtonInActive(newAdderButton);
  }
};
