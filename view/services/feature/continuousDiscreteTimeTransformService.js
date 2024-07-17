/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / Services / Feature / ContinuousDiscreteTimeTransformService
 */

import { Ratio } from "../../../math/computerAlgebra/dataTypes/ratios.js";
import {
  getDenominator,
  getNumerator,
  getTermsArray,
} from "../../../math/computerAlgebra/algebraicOperations.js";
import {
  c2dViaEulerBackwardDifferenceMethod,
  d2cViaEulerBackwardDifferenceMethod,
} from "../../../math/domainTransformation/backwardDifferenceMethod.js";
import {
  c2dViaTustinBilinearMethod,
  d2cViaTustinBilinearMethod,
} from "../../../math/domainTransformation/bilinearMethod.js";
import { Tf } from "../../../model/elements/tf.js";
import { containsSymbols, minSamplingT } from "../../../util/commons.js";
import {
  marginAroundElements,
  getNavbarHeight,
} from "../../../util/uiService.js";
import { openPopupWindow } from "../../popupWindowView.js";

let transformPopupWindowContentsMarkup;

export const continuousDiscreteTimeTransform = async function (element) {
  if (element.isTf()) {
    //check whether all tf terms are numbers
    const tfNumTermsArray = getTermsArray(getNumerator(element.getValue()));
    const tfDenomTermsArray = getTermsArray(getDenominator(element.getValue()));
    if (
      containsSymbols(tfNumTermsArray) ||
      containsSymbols(tfDenomTermsArray)
    ) {
      console.warn(
        "All tf terms should be numbers to proceed with transformation"
      );
      return;
    }

    const block = element.getBlock();

    //compute a position for the transformed tf
    const position = element.getPosition();
    const offsetLeft = marginAroundElements + 10 * (Math.random() - 0.5);
    const offsetTop = marginAroundElements + 10 * (Math.random() - 0.5);

    const transformedElementPosition = {
      left: position.left + offsetLeft,
      top: position.top - getNavbarHeight() + offsetTop,
    };

    //create transformed tf
    const param = element.getParam();
    if (param === "s") {
      //continuous to discrete-time transformation

      //open a popup window to specify parameters
      const result = await openPopupWindow(
        "Continuous to discrete-time transform",
        transformPopupWindowContentsMarkup(true),
        function (e) {
          const discretizationMethod = document.getElementById(
            "transform-tf-discretization-method-input"
          );
          const discretizationMethodValue = discretizationMethod.value;

          const samplingT = document.getElementById(
            "transform-tf-sampling-t-input"
          );
          const samplingTValue = +samplingT.value;

          if (
            Number.isFinite(samplingTValue) &&
            samplingTValue >= minSamplingT &&
            samplingTValue <= 10 &&
            discretizationMethodValue
          ) {
            return [discretizationMethodValue, samplingTValue];
          } else {
            return -1;
          }
        }
      );

      if (result !== null) {
        const [discretizationMethodResult, samplingTResult] = result;

        const c2dFunction =
          discretizationMethodResult === "bilinear-method"
            ? c2dViaTustinBilinearMethod
            : c2dViaEulerBackwardDifferenceMethod;

        return new Tf(
          new Ratio(...c2dFunction(element, samplingTResult)),
          block,
          transformedElementPosition,
          null,
          samplingTResult
        );
      }
    } else {
      //discrete to continuous-time transformation

      const samplingT = element.getSamplingT();

      //open a popup window to specify parameter
      const discretizationMethodResult = await openPopupWindow(
        "Discrete to continuous-time transform",
        transformPopupWindowContentsMarkup(false),
        function (e) {
          const discretizationMethod = document.getElementById(
            "transform-tf-discretization-method-input"
          );
          const discretizationMethodValue = discretizationMethod.value;

          if (discretizationMethodValue) {
            return discretizationMethodValue;
          } else {
            return -1;
          }
        }
      );

      if (discretizationMethodResult !== null) {
        const d2cFunction =
          discretizationMethodResult === "bilinear-method"
            ? d2cViaTustinBilinearMethod
            : d2cViaEulerBackwardDifferenceMethod;

        return new Tf(
          new Ratio(...d2cFunction(element, samplingT)),
          block,
          transformedElementPosition,
          null,
          null
        );
      }
    }
  }
};

//
// Init
//
const init = function () {
  transformPopupWindowContentsMarkup = (toDiscrete) => `
  <section class="popup-window-text-content">
    <p>Specify the following parameters:</p>
    <div class="flex-row-left">
      <p>Discretization method:</p>
      <div>
        <select id="transform-tf-discretization-method-input">
          <option value="bilinear-method">Tustin / Bilinear</option>
          <option value="backward-difference-method">Backward difference</option>
        </select>
      </div>
    </div>
    ${
      toDiscrete
        ? `<div class="flex-row-left">
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
          </div>`
        : ""
    }
    <div class="flex-row-center">
      <button id="popup-window-regular-button">Insert</button>
    </div>
  </section>
`;
};

init();
