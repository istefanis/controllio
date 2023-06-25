/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / Animation / AnimateMergeNElements
 */

import { sleep, pauseSimulation } from "../../util/commons.js";
import {
  giveElementAttention,
  removeElementAttention,
} from "../../util/uiService.js";
import { renderAllLines } from "../services/core/lineRenderingService.js";
import { animationSpeedCoeff, pauseButtonClicked } from "../navbarView.js";

/**
 * Animate the merging of N elements in their centroid point / centre of gravity
 *
 * Used in:
 * - "Merge Parallel Tfs", "Merge Serial Tfs" & "Merge Serial Adders" algorithms (2 elements)
 * - "Merge Feedback Loop" algorithm (2 or 3 elements)"
 */
export const animateMergeNElements = async function (...elementIds) {
  //retrieve DOM elements
  const elementsDom = elementIds.map((x) =>
    document.querySelector(`#element${x}`)
  );

  //change style
  elementsDom.forEach(giveElementAttention);

  let positions = {};
  elementsDom.forEach((_, i) => {
    positions[i] = {};
    //properties must be set manually,
    //because elementsDom[i].getBoundingClientRect() is read-only:
    const boundRect = elementsDom[i].getBoundingClientRect();
    positions[i].left = boundRect.left;
    positions[i].top = boundRect.top;
    positions[i].width = boundRect.width;
    positions[i].height = boundRect.height;
    positions[i].middleX = positions[i].left + positions[i].width / 2;
    positions[i].middleY = positions[i].top + positions[i].height / 2;
  });

  //compute centroid point (centre of gravity) of all elements
  const centroidPointX =
    elementsDom
      .map((_, i) => positions[i].middleX)
      .reduce((acc, x) => acc + x, 0) / elementIds.length;

  const centroidPointY =
    elementsDom
      .map((_, i) => positions[i].middleY)
      .reduce((acc, x) => acc + x, 0) / elementIds.length;

  //compute final positions
  elementsDom.forEach((_, i) => {
    positions[i].leftFinal = centroidPointX - positions[i].width / 2;
    positions[i].topFinal = centroidPointY - positions[i].height / 2;
  });

  //animation loop:
  //the whole repositioning of elements will be performed incrementally,
  //in a number of 'totalSteps'. The latter will depend on:
  // - the sqrt of the distance to be covered (to ensure even smaller animations are visible)
  // - the animation speed selected, so that the animation looks smooth
  let step = 1;
  const distanceToBeCovered = Math.sqrt(
    elementsDom
      .map(
        (_, i) =>
          (centroidPointX - positions[i].middleX) ** 2 +
          (centroidPointY - positions[i].middleY) ** 2
      )
      .reduce((acc, x) => acc + x, 0) / elementIds.length
  );
  let totalSteps = Math.ceil(
    Math.sqrt(distanceToBeCovered) * animationSpeedCoeff * 1.5
  );
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

    //set new positions
    elementsDom.forEach((x, i) => {
      x.style.left =
        positions[i].left +
        (step / totalSteps) * (positions[i].leftFinal - positions[i].left) +
        "px";
      x.style.top =
        positions[i].top +
        (step / totalSteps) * (positions[i].topFinal - positions[i].top) +
        "px";
    });

    step++;
    renderAllLines();

    if (pauseButtonClicked) {
      //store positions before pause
      elementsDom.forEach((_, i) => {
        positions[i].beforePauseLeft = parseFloat(elementsDom[i].style.left);
        positions[i].beforePauseTop = parseFloat(elementsDom[i].style.top);
      });

      await pauseSimulation();

      //check if any element to be merged has been moved, while the simulation is paused
      elementsDom.forEach((_, i) => {
        positions[i].afterPauseLeft = parseFloat(elementsDom[i].style.left);
        positions[i].afterPauseTop = parseFloat(elementsDom[i].style.top);
      });

      if (
        elementsDom.some(
          (_, i) =>
            positions[i].beforePauseLeft !== positions[i].afterPauseLeft ||
            positions[i].beforePauseTop !== positions[i].afterPauseTop
        )
      ) {
        //update current positions & reset step
        elementsDom.forEach((_, i) => {
          positions[i].left = positions[i].afterPauseLeft;
          positions[i].top = positions[i].afterPauseTop;
        });
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
  elementsDom.forEach(removeElementAttention);
  await sleep(10 * animationSpeedCoeff);
};
