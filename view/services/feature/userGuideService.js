/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / Services / Feature / UserGuideService
 */

import { openPopupWindow } from "../../popupWindowView.js";

let contentsMarkup;

const popupWindow = document.querySelector(".popup-window");

export const openUserGuidePopupWindow = async function () {
  popupWindow.classList.add("popup-window-large");

  const result = await openPopupWindow("User Guide", contentsMarkup);

  popupWindow.classList.remove("popup-window-large");
};

//
// Init
//
const init = function () {
  contentsMarkup = `
  <div class="popup-window-tab-buttons tab-buttons-container"> 
    <button class="tab-button" id="popup-window-tab-button-1" data-tab-id="1">General</button>
    <button class="tab-button" id="popup-window-tab-button-2" data-tab-id="2">System modelling</button>
    <button class="tab-button" id="popup-window-tab-button-3" data-tab-id="3">Ready-made tfs</button>
    <button class="tab-button" id="popup-window-tab-button-4" data-tab-id="4">Block simplification</button>
    <button class="tab-button" id="popup-window-tab-button-5" data-tab-id="5">Logging</button>
  </div> 
  <div class="popup-window-tab-contents tab-contents">  
    <section class="tab-content" id="popup-window-tab-content-1">
      <h3>General</h3>
      <p>Controllio is an open-source web app which lets Control Systems engineers design & experiment with LTI (linear time-invariant) dynamical systems.</p>
      <p>It provides functionality for both continuous-time (s-domain) & discrete-time (z-domain) systems.</p>
      <p>So far, the following features have been implemented:</p>
      <ul>
        <li>the analytical computation of the overall transfer function (tf) of a system modeled by interconnected elements in the s- and z-domains</li>
        <li>the generation of its Bode and Nyquist plots</li>
        <li>the numerical computation of its time response plot</li>
        <li>the numerical computation of its zeros/poles & some characteristic numbers, ex. bandwidth</li>
        <li>the numerical computation of its stability</li>
        <li>the transformation of a tf between continuous and discrete-time domains via approximate methods</li>
      </ul>
      <h3>Motivation</h3>
      <p>The motivation behind Controllio is to create an open-source tool for studying Control Systems, which:</p>
      <ul>
        <li>runs in the browser without any installation, is fast and mobile-friendly</li>
        <li>is written in a widely-used programming language (vanilla Javascript), and can be easily extended</li>
      </ul>
      <h3>License</h3>
      <p>Controllio is distributed under the MIT License, included in the 'LICENSE.TXT' file.</p>
    </section>
    <section class="tab-content" id="popup-window-tab-content-2">
      <h3>Modelling a dynamical system</h3>
      <p>A linear time-invariant (LTI) dynamical system in the s- or z-domain is represented as a circuit of interconnected elements: transfer functions (tfs) & adders.</p>
      <h3>Elements</h3>
      <h4>Transfer functions (tfs)</h4>
      <div class="flex-row-left gap-2">
        <div class="flex-column-center">
          <div class="element tf popup-window-tf user-guide-element">
            <p>10*s<sup>2</sup> + 2*s + 5</p>
            <p>―――――――――――――――</p>
            <p>8*s<sup>2</sup> - s + 1</p>
          </div>
          <p class="figure-description">s-domain</p>
        </div>
        <div class="flex-column-center">
          <div class="element tf discrete popup-window-tf user-guide-element">
            <p>z<sup>2</sup> - 2*z + 1</p>
            <p>―――――――――――――――</p>
            <p>z<sup>2</sup> -1.5*z + 0.8</p>
          </div>
          <p class="figure-description">z-domain</p>
        </div>
      </div>
      <p>To define a transfer function, the lists of the coefficients of its numerator and denominator polynomials must be specified.<p>
      <p>For a z-domain tf, the sampling period T is also required.<p>
      <p><u>Implementation assumption</u>: Each tf has only one input (another tf, or adder) and multiple outputs. Multiple inputs can be achieved by adding in front of it an adder.</p>
      <h4>Adders</h4>
      <div class="element adder popup-window-adder user-guide-element"
        <p>+</p>
      </div>
      <p>An adder is an element used to add multiple input signals, and provides one or multiple outputs. It can be placed in front of a tf, to provide it with multiple inputs.</p>
      <p>To subtract an input instead, pass it through a negating transfer function before connecting it to the adder.</p>
      <p><u>Implementation assumption</u>: Each adder has multiple inputs and multiple outputs.</p>
      <h3>Connections</h3>
      <p style="font-size: 18px">――&#x2192</p>
      <p>Elements (tfs, adders) can be connected serially. Complex connection designs can be achieved by defining all serial connections between elements.</p>
      <p><u>Note</u>: Due to the implementation assumptions above, when adding two elements, an adder may also be auto-generated between them, or the connection target may be automatically adjusted (without affecting the result).</p>
    </section>
    <section class="tab-content" id="popup-window-tab-content-3">
      <h3>Ready-made tfs</h3>
      <h4>Continuous-time</h4>
      <h5>Simple components</h5>
      <ul>
        <li>Integrator / step</li>
        <li>Exponential decay</li>
        <li>Sine</li>
        <li>Phase delay</li>
      </ul>
      <h5>Filters</h5>
      <ul>
        <li>Butterworth filter</li>
      </ul>
      <h5>Controllers</h5>
      <ul>
        <li>PI controller 
        <li>PD controller 
        <li>PID controller 
        <p>These are defined by specifying the proportional (Kp), integral (Ki) and/or derivative (Kd) gains respectively. Simple analytical tf computations can also be performed without fixing these parameters.</p>
      </ul>
      <h4>Discrete-time</h4>
      <h5>Simple components</h5>
      <ul>
        <li>Delay</li>
        <li>Step</li>
      </ul>
      </section> 
    <section class="tab-content" id="popup-window-tab-content-4">
      <h3>Simplification of a block</h3>
      <p>To compute analytically the overall transfer function (tf) of a block of interconnected elements, a simplification of its structure must be performed. The goal is to simplify the block either completely (by replacing it with an equivalent total tf) or as much as possible.</p>
      <p>This simplification is performed by running a set of <u>simplification algorithms</u> inside the block. Each algorithm may run more than once. During each algorithm run, a simplification may or may not be performed. The 6 algorithms included perform the following operations:</p>
      <ul>
        <li>Removal of unused adders
        <li>Spliting a tf into multiple single-output tfs
        <li>Merging parallel tfs
        <li>Merging a feedback loop
        <li>Merging serial tfs
        <li>Merging serial adders
      </ul>
      <p>To be able to test and review this whole process, the simplification process is animated, and <u>logging checkpoints</u> have been implemented, with respective messages that can be displayed at the browser's developer tools console. The latter can be opened via the browser's settings.</p>
    </section> 
    <section class="tab-content" id="popup-window-tab-content-5">
      <h3>Logging</h3>
      <p>Messages related to block simplification or other operations are displayed at the browser's developer tools console, which can be opened via the browser's settings. The volume of messages can be adjusted in terms of the following 4 levels:</p>
      <table>
        <tr>
          <th>Level</th>
          <th>Description</th>
        </tr>
        <tr>
          <td>N/A</td>
          <td>No messages are displayed</td>
        </tr>
        <tr>
          <td>AL</td>
          <td>Only messages regarding the algorithms run are displayed</td>
        </tr>
        <tr>
          <td>SF</td>
          <td>Only messages regarding the algorithms run & the simplifications performed are displayed</td>
        </tr>
        <tr>
          <td>CP</td>
          <td>Messages from all checkpoints are displayed (default)</td>
        </tr>
      </table> 
    </section> 
  </div>
  `;
};

init();
