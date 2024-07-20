/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / Services / Feature / ReadyMadeTfCreationService
 */

import {
  computeButterworthTermsArrays,
  minSamplingT,
} from "../../../util/commons.js";
import {
  computePaddedTfStrings,
  polynomialTermsArrayToMarkup,
  removeSupTagsFromMarkup,
} from "../../../util/prettyPrintingService.js";
import { indicativeTfWidth } from "../../../util/uiService.js";
import { openPopupWindow } from "../../popupWindowView.js";
import { closeElementAnalysisWindow } from "../../elementAnalysisWindowView.js";
import { createNewReadyMadeTf } from "./elementCreationService.js";

const readyMadeTfsSubsections = [];

let butterworthFilterDesignContentsMarkup;
let specifySamplingTWindowContentsMarkup;

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
          const tfParam = x[3] && x[3] === "discrete" ? "z" : "s";

          //compute numerator & denominator markup
          const numMarkup = polynomialTermsArrayToMarkup(x[1], tfParam);
          const denMarkup = polynomialTermsArrayToMarkup(x[2], tfParam);

          //compute horizontal line of proper length
          const [, h2] = computePaddedTfStrings(
            removeSupTagsFromMarkup(numMarkup),
            removeSupTagsFromMarkup(denMarkup)
          );

          tfsCounter++;

          return `
            <a class="popup-window-selectable-content popup-window-tf-content" data-content-id='${tfsCounter}'>
              <div class="element tf popup-window-tf measured 
              ${tfParam === "z" ? "discrete" : ""}"> 
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

  const selectionResult = await openPopupWindow(
    "Ready-made Tfs",
    contentsMarkup
  );

  if (selectionResult !== null) {
    const [selectedContentId, clientX, clientY, domElementBoundRect] =
      selectionResult;
    const tfDefinitionSelected = readyMadeTfsSubsections.flatMap((s) => s[1])[
      selectedContentId
    ];

    if (tfDefinitionSelected.length == 3) {
      //regular ready-to-be-inserted transfer function selected
      createNewReadyMadeTf(
        tfDefinitionSelected[1],
        tfDefinitionSelected[2],
        clientX,
        clientY,
        domElementBoundRect.width,
        invokedByTouchEvent
      );
    } else if (tfDefinitionSelected[0] === "Butterworth filter") {
      //open another popup window to design a Butterworth filter
      const designResult = await openPopupWindow(
        "Design Butterworth filter",
        butterworthFilterDesignContentsMarkup,
        function (e) {
          const lowPassInput = document.getElementById(
            "butterworth-filter-low-pass-input"
          );
          const orderInput = document.getElementById(
            "butterworth-filter-order-input"
          );
          const gainInput = document.getElementById(
            "butterworth-filter-gain-input"
          );
          const wCutoffInput = document.getElementById(
            "butterworth-filter-cutoff-frequency-input"
          );

          const orderInputValue = +orderInput.value;
          const gainInputValue = +gainInput.value;
          const wCutoffInputValue = +wCutoffInput.value;

          if (
            Number.isFinite(orderInputValue) &&
            Number.isInteger(orderInputValue) &&
            Number.isFinite(gainInputValue) &&
            Number.isFinite(wCutoffInputValue) &&
            orderInputValue >= 1 &&
            orderInputValue >= 1 &&
            orderInputValue <= 5 &&
            gainInputValue >= 1 &&
            wCutoffInputValue >= 0.01
          ) {
            return {
              type: lowPassInput.checked ? "low-pass" : "high-pass",
              order: orderInputValue,
              gain: gainInputValue,
              wCutoff: wCutoffInputValue,
              clientX: e.clientX,
              clientY: e.clientY,
            };
          } else {
            return -1;
          }
        }
      );

      if (designResult !== null) {
        const approximateTfWidth = indicativeTfWidth * (designResult.order / 2);

        createNewReadyMadeTf(
          ...computeButterworthTermsArrays(
            designResult.type,
            designResult.order,
            designResult.gain,
            designResult.wCutoff
          ),
          designResult.clientX,
          designResult.clientY,
          approximateTfWidth,
          invokedByTouchEvent
        );
      }
    } else if (
      (tfDefinitionSelected.length == 4) &
      (tfDefinitionSelected[3] === "discrete")
    ) {
      //open another popup window to specify sampling T
      const samplingTResult = await openPopupWindow(
        "Specify sampling T",
        specifySamplingTWindowContentsMarkup,
        function (e) {
          const samplingT = document.getElementById(
            "transform-tf-sampling-t-input"
          );
          const samplingTValue = +samplingT.value;

          if (
            Number.isFinite(samplingTValue) &&
            samplingTValue >= minSamplingT &&
            samplingTValue <= 10
          ) {
            return samplingTValue;
          } else {
            return;
          }
        }
      );

      if (samplingTResult !== null) {
        createNewReadyMadeTf(
          tfDefinitionSelected[1],
          tfDefinitionSelected[2],
          clientX,
          clientY,
          domElementBoundRect.width,
          invokedByTouchEvent,
          samplingTResult
        );
      }
    }
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
    "Filters",
    [["Butterworth filter", [5], [1, 2, 2, 1], true]],
  ]);
  readyMadeTfsSubsections.push([
    "Controllers",
    [
      ["PI controller", ["kp", "ki"], [1, 0]],
      ["PD controller", ["kd", "kp"], [1]],
      ["PID controller", ["kd", "kp", "ki"], [1, 0]],
    ],
  ]);
  readyMadeTfsSubsections.push([
    "Discrete-time simple components",
    [
      ["Delay", [1], [1, 0], "discrete"],
      ["Step", [1, 0], [1, -1], "discrete"],
    ],
    // [
    //   "PID controller",
    //   ["(ki*T^2 + kp*T + kd)", "(-kp*T - 2*kd)", "kd"],
    //   ["T", "(-T)"],
    //   "discrete",
    // ],
  ]);

  butterworthFilterDesignContentsMarkup = `
  <section class="popup-window-text-content">
    <p>Specify the following parameters:</p>
    <div class="input-radio-buttons">
      <div>
        <label>
          <input
            type="radio"
            name="butterworth-filter-type"
            value="low-pass"
            id="butterworth-filter-low-pass-input"
            checked
          />
          <p>Low-pass</p>
        </label>
      </div>
      <div>
        <label>
          <input
            type="radio"
            name="butterworth-filter-type"
            value="high-pass"
            id="butterworth-filter-high-pass-input"
          />
          <p>High-pass</p>
        </label>
      </div>
    </div>
    <div class="flex-row-left">
      <p>Order:</p>
      <input
        type="number"
        min="1"
        value="3"
        max="5"
        id="butterworth-filter-order-input"
        class="popup-window-input"
      />
      <p>(1-5)</p>
    </div>
    <div class="flex-row-left">
      <p>Passband gain:</p>
      <input
        type="number"
        min="1"
        value="1"
        step="0.01"
        id="butterworth-filter-gain-input"
        class="popup-window-input"
      />
      <p>(&#8805 1)</p>
    </div>
    <div class="flex-row-left">
      <p>Cutoff frequency:</p>
      <input
        type="number"
        min="0.01"
        value="1"
        step="0.01"
        id="butterworth-filter-cutoff-frequency-input"
        class="popup-window-input"
      />
      <p>(&#8805 0.01) [rad/s]</p>
    </div>
    <div class="flex-row-center">
      <button id="popup-window-regular-button">Insert</button>
    </div>
  </section>
`;

  specifySamplingTWindowContentsMarkup = `
  <section class="popup-window-text-content">
    <p>Specify the following parameter:</p>
    <div class="flex-row-left">
      <p>Sampling T:</p>
      <input
        type="number"
        min="${minSamplingT}"
        value="0.1"
        step="${minSamplingT}"
        max="10"
        id="transform-tf-sampling-t-input"
        class="popup-window-input"
      />
      <p>(&#8805 ${minSamplingT}) [s]</p>
    </div>
    <div class="flex-row-center">
      <button id="popup-window-regular-button">Insert</button>
    </div>
  </section>
`;
};

init();
