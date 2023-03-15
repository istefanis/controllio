/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Util / MetricsService
 */

// counters of simplifications done & algorithms run:
export let simplificationsDone = 0;
export let algorithmsRun = 0;
export let algorithmsRunSinceLastSimplification = 0;

export const updateSimplificationsDoneCounters = function () {
  simplificationsDone++;
  algorithmsRunSinceLastSimplification = 0;
};

export const updateAlgorithmsRunCounters = function () {
  algorithmsRun++;
  algorithmsRunSinceLastSimplification++;
  // console.log("lineviews: " + lineViews.length);
};

export const resetCounters = function () {
  simplificationsDone = 0;
  algorithmsRun = 0;
  algorithmsRunSinceLastSimplification = 0;
};
