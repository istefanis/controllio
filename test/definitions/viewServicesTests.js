/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Test / Definitions / ViewServicesTests
 */

import { Block } from "../../model/elements/block.js";
import { getTopBlock, setTopBlock } from "../../model/topBlockService.js";
import { roundDecimal, sleep } from "../../util/commons.js";
import { setLogMode } from "../../util/loggingService.js";
import { getTotalLengthOfAllLines } from "../../view/services/core/lineRenderingService.js";
import { optimizeTopology } from "../../view/services/feature/optimizeTopologyService.js";
import { circuit1 } from "./circuits.js";

export const viewServicesTests = {
  test1: {
    description: "test1: zoomingService",
    steps: async function () {
      setLogMode("null");

      if (getTopBlock()) {
        getTopBlock().clearState();
      } else {
        setTopBlock(new Block());
      }
      setTopBlock(circuit1(getTopBlock()));

      const zoomInButton = document.getElementById("zoom-in-button");
      const zoomOutButton = document.getElementById("zoom-out-button");

      let initialTotalLengthOfAllLines;
      let finalTotalLengthOfAllLines;

      let testResult = true;

      for (let i = 1; i <= 5; i++) {
        initialTotalLengthOfAllLines = getTotalLengthOfAllLines();
        zoomInButton.click();
        await sleep(200);
        finalTotalLengthOfAllLines = getTotalLengthOfAllLines();

        //the total length of all lines should become larger when zooming in
        if (finalTotalLengthOfAllLines < initialTotalLengthOfAllLines) {
          testResult = false;
        }
      }
      for (let i = 1; i <= 5; i++) {
        initialTotalLengthOfAllLines = getTotalLengthOfAllLines();
        zoomOutButton.click();
        await sleep(200);
        finalTotalLengthOfAllLines = getTotalLengthOfAllLines();

        //the total length of all lines should become smaller when zooming out
        if (finalTotalLengthOfAllLines > initialTotalLengthOfAllLines) {
          testResult = false;
        }
      }

      getTopBlock().clearState();

      return [testResult];
    },
    assertion: (x) => x,
    resultsDescription: () => "zoomed in/out successfully",
  },

  test2: {
    description: "test2: optimizeTopologyService",
    steps: async function () {
      if (getTopBlock()) {
        getTopBlock().clearState();
      } else {
        setTopBlock(new Block());
      }
      setTopBlock(circuit1(getTopBlock()));

      const initialTotalLengthOfAllLines = getTotalLengthOfAllLines();
      await optimizeTopology({
        loopsOverAllElements: 25,
        triesPerElementInEachLoop: 5,
      });
      const finalTotalLengthOfAllLines = getTotalLengthOfAllLines();

      getTopBlock().clearState();

      return [
        roundDecimal(finalTotalLengthOfAllLines, 1),
        roundDecimal(initialTotalLengthOfAllLines, 1),
      ];
    },
    assertion: (finalTotalLengthOfAllLines, initialTotalLengthOfAllLines) => {
      return finalTotalLengthOfAllLines <= initialTotalLengthOfAllLines;
    },
    resultsDescription: (
      finalTotalLengthOfAllLines,
      initialTotalLengthOfAllLines
    ) => {
      return (
        `finalTotalLengthOfAllLines: ${finalTotalLengthOfAllLines}` +
        " <= " +
        `initialTotalLengthOfAllLines: ${initialTotalLengthOfAllLines}`
      );
    },
  },

  test3: {
    description: "test3: userGuideService",
    steps: async function () {
      const userGuideButton = document.getElementById("user-guide-button");
      userGuideButton.click();
      await sleep(200);

      for (let i = 1; i <= 5; i++) {
        const popupWindowTabButton = document.getElementById(
          `popup-window-tab-button-${i}`
        );
        popupWindowTabButton.click();
        await sleep(200);
      }

      const popupWindowCloseButton = document.getElementsByClassName(
        "popup-window-close-button"
      )[0];
      popupWindowCloseButton.click();
      await sleep(200);

      return [true];
    },
    assertion: (x) => x,
    resultsDescription: () => "traversed successfully",
  },
};
