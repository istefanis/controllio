/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / Services / Feature / ReadyMadeTfCreationService
 */

import { createNewReadyMadeTf } from "./elementCreationService.js";
import {
  computePaddedTfStrings,
  polynomialTermsArrayToMarkup,
  removeSupTagsFromMarkup,
} from "../../../util/prettyPrintingService.js";
import { openPopupWindow } from "../../popupWindowView.js";
import { closeElementAnalysisWindow } from "../../elementAnalysisWindowView.js";

const readyMadeTfsArray = [];

export const openNewReadyMadeTfPopupWindow = async function (
  invokedByTouchEvent
) {
  closeElementAnalysisWindow();

  //create the popup window contents markup
  const contentsMarkup = readyMadeTfsArray
    .map((x, i) => {
      //compute numerator & denominator markup
      const numMarkup = polynomialTermsArrayToMarkup(x[1]);
      const denMarkup = polynomialTermsArrayToMarkup(x[2]);

      //compute horizontal line of proper length
      const [, h2] = computePaddedTfStrings(
        removeSupTagsFromMarkup(numMarkup),
        removeSupTagsFromMarkup(denMarkup)
      );

      return `
     <a class="popup-window-selectable-content popup-window-tf-content" data-content-id='${i}'>
       <div class="element tf popup-window-tf measured"> 
         <p>${numMarkup}</p>
         <p>${h2}</p>
         <p>${denMarkup}</p>
       </div>
       <p class="popup-window-tf-description">${x[0]}</p>
     </a>`;
    })
    .join("");

  const result = await openPopupWindow("Ready-made Tfs", contentsMarkup);

  if (result !== null) {
    const [selectedContentId, middleX, middleY, domElementBoundRect] = result;
    createNewReadyMadeTf(
      readyMadeTfsArray[selectedContentId][1],
      readyMadeTfsArray[selectedContentId][2],
      middleX,
      middleY,
      domElementBoundRect.width,
      invokedByTouchEvent
    );
  }
};

//
// Init
//
const init = function () {
  readyMadeTfsArray.push(["Integrator / step", [1], [1, 0]]);
  readyMadeTfsArray.push(["Exponential decay", [1], [1, 0.2]]);
  readyMadeTfsArray.push(["Sine", [1], [1, 0, 1]]);
  readyMadeTfsArray.push(["Phase delay", [5, 1], [8, 1]]);
  readyMadeTfsArray.push(["PI controller", ["kp", "ki"], [1, 0]]);
  readyMadeTfsArray.push(["PD controller", ["kd", "kp"], [1]]);
  readyMadeTfsArray.push(["PID controller", ["kd", "kp", "ki"], [1, 0]]);
};

init();
