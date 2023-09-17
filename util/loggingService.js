/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Util / LoggingService
 */

let logMode;
const logModes = ["null", "algorithms", "simplifications", "checkpoints"];

/**
 * Adjust the volume of info logged, in terms of the following levels / log modes:
 * - "null"
 * - "algorithms" (AL)
 * - "simplifications" (SF)
 * - "checkpoints" (CP)
 *
 * more info displayed: null < AL < SF < CP
 */
export const setLogMode = function (mode) {
  if (logModes.includes(mode)) {
    if (mode === "null") {
      logMessages([`[CP-01] Log mode set to: ${mode}`], "checkpoints");
      logMode = mode;
    } else {
      logMode = mode;
      logMessages([`[CP-01] Log mode set to: ${mode}`], "checkpoints");
    }
  } else {
    console.error("setLogMode()", "Unknown log mode");
  }
};

export const getLogMode = () => logMode;

export const logMessages = function (messagesArray, attr) {
  const logMessagesHelper = function (character) {
    messagesArray.forEach((x) => {
      console.log(x);
    });
    // const displayWidth = 40;
    // return console.log(makeString(displayWidth, character));
  };

  if (logMode === "null") {
    if (attr === "tests") {
      return logMessagesHelper("-");
    } else {
      return;
    }
  } else if (attr === "algorithms") {
    if (["checkpoints", "simplifications", "algorithms"].includes(logMode)) {
      return logMessagesHelper("=");
    }
  } else if (attr === "simplifications") {
    if (["checkpoints", "simplifications"].includes(logMode)) {
      return logMessagesHelper("-");
    }
  } else if (attr === "checkpoints") {
    if (logMode === "checkpoints") {
      return logMessagesHelper("-");
    }
  } else {
    console.error("logMessages()", "Undefined log mode", logMode);
  }
};
