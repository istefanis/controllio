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

const readyMadeTfsSubsections = [];

export const openNewReadyMadeTfPopupWindow = async function (
  invokedByTouchEvent
) {
  closeElementAnalysisWindow();

  //count tfs across subsections
  let tfsCounter = -1;

  //create the popup window contents markup
  const contentsMarkup = readyMadeTfsSubsections
    .map((subsection) => {
      const subsectionMarkup = subsection[1]
        .map((x) => {
          //compute numerator & denominator markup
          const numMarkup = polynomialTermsArrayToMarkup(x[1]);
          const denMarkup = polynomialTermsArrayToMarkup(x[2]);

          //compute horizontal line of proper length
          const [, h2] = computePaddedTfStrings(
            removeSupTagsFromMarkup(numMarkup),
            removeSupTagsFromMarkup(denMarkup)
          );

          tfsCounter++;

          return `
            <a class="popup-window-selectable-content popup-window-tf-content" data-content-id='${tfsCounter}'>
              <div class="element tf popup-window-tf measured"> 
                <p>${numMarkup}</p>
                <p>${h2}</p>
                <p>${denMarkup}</p>
              </div>
              <p class="popup-window-tf-description">${x[0]}</p>
            </a>`;
        })
        .join("");

      return `
        <section class="popup-window-contents-subsection">
          <h3 class="popup-window-contents-subsection-header">${subsection[0]}</h3>
          <div>
            ${subsectionMarkup}
          </div>
        </section>`;
    })
    .join("");

  const result = await openPopupWindow("Ready-made Tfs", contentsMarkup);

  if (result !== null) {
    const [selectedContentId, clientX, clientY, domElementBoundRect] = result;
    createNewReadyMadeTf(
      readyMadeTfsSubsections.flatMap((s) => s[1])[selectedContentId][1],
      readyMadeTfsSubsections.flatMap((s) => s[1])[selectedContentId][2],
      clientX,
      clientY,
      domElementBoundRect.width,
      invokedByTouchEvent
    );
  }
};

//
// Init
//
const init = function () {
  readyMadeTfsSubsections.push([
    "Simple components",
    [
      ["Integrator / step", [1], [1, 0]],
      ["Exponential decay", [1], [1, 0.2]],
      ["Sine", [1], [1, 0, 1]],
      ["Phase delay", [5, 1], [8, 1]],
    ],
  ]);
  readyMadeTfsSubsections.push([
    "Controllers",
    [
      ["PI controller", ["kp", "ki"], [1, 0]],
      ["PD controller", ["kd", "kp"], [1]],
      ["PID controller", ["kd", "kp", "ki"], [1, 0]],
    ],
  ]);
};

init();
