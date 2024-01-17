/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Test / Jest / JestSetupFileAfterEnv
 */

import { JSDOM } from "jsdom";

const dom = await JSDOM.fromFile("index.html");
window = dom.window;
document.documentElement.innerHTML =
  dom.window.document.documentElement.innerHTML;

// console.log(document.documentElement.innerHTML);
