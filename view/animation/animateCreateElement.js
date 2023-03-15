/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / Animation / AnimateCreateElement
 */

import { pauseSimulation, sleep } from "../../util/commons.js";
import {
  giveElementAttention,
  removeElementAttention,
} from "../../util/uiService.js";
import { renderAllLines } from "../services/core/lineRenderingService.js";
import { animationSpeedCoeff, pauseButtonClicked } from "../navbarView.js";

export const animateCreateElement = async function (elementId) {
  //retrieve DOM element
  const elementDom = document.querySelector(`#element${elementId}`);

  //change style
  giveElementAttention(elementDom);

  await sleep(10 * animationSpeedCoeff);

  //animation loop:
  //the whole repositioning of elements will be performed incrementally,
  //in a number of 'totalSteps'. The latter will depend on the distance to be
  //covered & the animation speed selected, so that the animation looks smooth
  let step = 1;
  let totalSteps = Math.ceil(7.5 * animationSpeedCoeff);
  const initialTotalSteps = totalSteps;
  const initialAnimationSpeedCoeff = animationSpeedCoeff;
  let lastTotalSteps;

  const moveHelper = async () => {
    //adjustment of 'step' & 'totalSteps' values,
    //according to animation speed changes happening during the animation
    lastTotalSteps = totalSteps;
    totalSteps = Math.ceil(
      initialTotalSteps * (animationSpeedCoeff / initialAnimationSpeedCoeff)
    );
    step = Math.ceil(step * (totalSteps / lastTotalSteps));

    //calculation of new opacity
    elementDom.style.opacity = 0.5 + 0.5 * (step / totalSteps);

    step++;
    renderAllLines();

    if (pauseButtonClicked) {
      await pauseSimulation();
    }

    await sleep(animationSpeedCoeff);
  };

  while (step <= totalSteps) {
    await moveHelper();
  }

  await sleep(10 * animationSpeedCoeff);

  //revert style
  removeElementAttention(elementDom);
  await sleep(10 * animationSpeedCoeff);
};
