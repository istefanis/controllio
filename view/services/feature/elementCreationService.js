/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / Services / Feature / ElementCreationService
 */

import { Polynomial } from "../../../math/computerAlgebra/dataTypes/polynomials.js";
import { Ratio } from "../../../math/computerAlgebra/dataTypes/ratios.js";
import { disableHistoricalStateStorage } from "../../../model/blockStateService.js";
import { Adder } from "../../../model/elements/adder.js";
import { Tf } from "../../../model/elements/tf.js";
import {
  indicativeTfHeight,
  indicativeTfWidth,
  adderWidth,
  adderHeight,
  makeButtonActive,
  makeButtonInActive,
  isMobileDevice,
} from "../../../util/uiService.js";
import {
  closeElementAnalysisWindow,
  openOrUpdateElementAnalysisWindow,
} from "../../elementAnalysisWindowView.js";
import { getNavbarHeight } from "../../navbarView.js";
import {
  deleteExpandedOrSelectedElements,
  getNewlyCreatedElement,
  setExpandedElement,
  setNewlyCreatedElement,
} from "../core/elementSelectingAndDraggingService.js";
import { getTopBlock } from "../../../script.js";

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
          ? (Math.random() - 0.5) * 20
          : -indicativeTfWidth / 2),
      top:
        newTfButton.getBoundingClientRect().top +
        (invokedByTouchEvent
          ? indicativeTfHeight + (Math.random() - 0.5) * 20 + getNavbarHeight()
          : -indicativeTfHeight / 2),
    };
    const block = getTopBlock();

    //create new tf
    const tf = new Tf(
      new Ratio(new Polynomial("s", [1, 2, 3]), new Polynomial("s", [1, 2, 3])),
      block,
      position
    );

    //retrieve DOM element
    const tfId = tf.getElementId();
    const tfDomElement = document.querySelector(`#element${tfId}`);

    deleteButton.disabled = true;
    if (invokedByTouchEvent && isMobileDevice) {
    } else if (invokedByTouchEvent) {
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
  domElementMiddleX,
  domElementMiddleY,
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
        (Math.random() - 0.5) * 20
      : domElementMiddleX - domElementWidth / 2,
    top: invokedByTouchEvent
      ? newReadyMadeTfButton.getBoundingClientRect().top +
        indicativeTfHeight +
        (Math.random() - 0.5) * 20 +
        getNavbarHeight() / 2
      : domElementMiddleY - indicativeTfHeight / 2,
  };
  const block = getTopBlock();

  //create new tf
  const tf = new Tf(
    new Ratio(
      new Polynomial("s", numTermsArray),
      new Polynomial("s", denTermsArray)
    ),
    block,
    position
  );

  //retrieve DOM element
  const tfId = tf.getElementId();
  const tfDomElement = document.querySelector(`#element${tfId}`);

  deleteButton.disabled = true;
  if (invokedByTouchEvent && isMobileDevice) {
  } else if (invokedByTouchEvent) {
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
        (invokedByTouchEvent ? (Math.random() - 0.5) * 20 : -adderWidth / 2),
      top:
        newAdderButton.getBoundingClientRect().top +
        (invokedByTouchEvent
          ? adderHeight + (Math.random() - 0.5) * 20 + getNavbarHeight()
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
    } else if (invokedByTouchEvent) {
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
