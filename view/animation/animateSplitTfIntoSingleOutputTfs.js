/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / Animation / AnimateSplitTfIntoSingleOutputTfs
 */

import { sleep, pauseSimulation } from "../../util/commons.js";
import {
  giveElementAttention,
  removeElementAttention,
} from "../../util/uiService.js";
import { renderAllLines } from "../services/core/lineRenderingService.js";
import { animationSpeedCoeff, pauseButtonClicked } from "../navbarView.js";

export const animateSplitTfIntoSingleOutputTfs = async function (tf1Id, tf2Id) {
  //retrieve DOM elements
  const tf1Dom = document.querySelector(`#element${tf1Id}`);
  const tf2Dom = document.querySelector(`#element${tf2Id}`);

  //change style
  giveElementAttention(tf1Dom);
  giveElementAttention(tf2Dom);

  const tf1BoundRect = tf1Dom.getBoundingClientRect();

  //current positions (left & top)
  let l1 = tf1BoundRect.left;
  let t1 = tf1BoundRect.top;
  let l2 = tf1BoundRect.left;
  let t2 = tf1BoundRect.top;

  //final positions (left & top)
  const l1Final = tf1BoundRect.left;
  const t1Final = tf1BoundRect.top - tf1BoundRect.height;
  const l2Final = tf1BoundRect.left;
  const t2Final = tf1BoundRect.top + tf1BoundRect.height;

  //animation loop:
  //the whole repositioning of elements will be performed incrementally,
  //in a number of 'totalSteps'. The latter will depend on the distance to be
  //covered & the animation speed selected, so that the animation looks smooth
  let step = 1;
  const distance = t2Final - t1Final;

  let totalSteps = Math.ceil((distance * animationSpeedCoeff) / 10);
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

    //calculation of new position
    tf1Dom.style.left = l1 + (step / totalSteps) * (l1Final - l1) + "px";
    tf1Dom.style.top = t1 + (step / totalSteps) * (t1Final - t1) + "px";

    tf2Dom.style.left = l2 + (step / totalSteps) * (l2Final - l2) + "px";
    tf2Dom.style.top = t2 + (step / totalSteps) * (t2Final - t2) + "px";

    step++;
    renderAllLines();

    if (pauseButtonClicked) {
      //store position before pause
      const beforePausel1 = parseFloat(tf1Dom.style.left);
      const beforePauset1 = parseFloat(tf1Dom.style.top);
      const beforePausel2 = parseFloat(tf2Dom.style.left);
      const beforePauset2 = parseFloat(tf2Dom.style.top);

      await pauseSimulation();

      //check if any element to be merged has been moved, while the simulation is paused
      const afterPausel1 = parseFloat(tf1Dom.style.left);
      const afterPauset1 = parseFloat(tf1Dom.style.top);
      const afterPausel2 = parseFloat(tf2Dom.style.left);
      const afterPauset2 = parseFloat(tf2Dom.style.top);

      if (
        beforePausel1 !== afterPausel1 ||
        beforePauset1 !== afterPauset1 ||
        beforePausel2 !== afterPausel2 ||
        beforePauset2 !== afterPauset2
      ) {
        //update current positions & reset step
        l1 = afterPausel1;
        t1 = afterPauset1;
        l2 = afterPausel2;
        t2 = afterPauset2;
        step = 1;
      }
    }

    await sleep(animationSpeedCoeff);
  };

  while (step <= totalSteps) {
    await moveHelper();
  }

  await sleep(10 * animationSpeedCoeff);

  //revert style
  removeElementAttention(tf1Dom);
  removeElementAttention(tf2Dom);
  await sleep(10 * animationSpeedCoeff);
};
