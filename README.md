# Controllio

![tests-workflow](https://github.com/istefanis/controllio/actions/workflows/tests.yml/badge.svg)

![app-preview](https://github.com/istefanis/controllio/blob/main/assets/img/app.png)

Controllio is a web app which lets Control Systems engineers design & experiment with LTI (linear time-invariant) dynamical systems.

It provides functionality for both continuous-time (s-domain) & discrete-time (z-domain) systems.

So far, the following features have been implemented:

- the analytical computation of the overall transfer function (tf) of a system modeled by interconnected elements in the s- and z-domains
- the generation of its Bode and Nyquist plots
- the numerical computation of its time response plot
- the numerical computation of its zeros/poles & some characteristic numbers, ex. bandwidth
- the numerical computation of its stability
- the transformation of a tf between continuous and discrete-time domains via approximate methods

> _This is a web GUI tool. For a command-line one, check the [lti-freq-domain-toolbox](https://github.com/istefanis/lti-freq-domain-toolbox)_

## Motivation

The motivation behind Controllio is to create an open-source tool for studying Control Systems, which:

- runs in the browser without any installation, is fast and mobile-friendly
- is written in a widely-used programming language (vanilla Javascript), and can be easily extended

## Technical details

### Circuit simplification

- A set of 6 simplication algorithms to compute analytically its overall transfer function

![circuit simplification](https://github.com/istefanis/controllio/blob/main/assets/img/circuit-simplification.gif)

### Numerical algorithms

- Polynomial complex roots: Weierstrass / Durand-Kerner algorithm
- Laplace inversion: Talbot algorithm

### Continuous &#x21C4; discrete-time transform

- Approximate methods: Tustin/Bilinear, Backward difference

### Topology optimization

- A stochastic algorithm to simplify the circuit's topology

![topology optimization](https://github.com/istefanis/controllio/blob/main/assets/img/topology-optimization.gif)

### Ready-made components

- Continuous-time:
  - Utilities: integrator / step, exponential decay, sine, phase delay
  - Filters: Butterworth
  - Controllers: PI, PD, PID
- Discrete-time:
  - Utilities: delay, step

## User Guide

A User Guide is included in the web app, and can be launched from the main menu

## Try it out

### Online

- The app is deployed [here](https://istefanis.github.io/controllio)

### Locally with CDN (default)

1. Download the repo

2. Load the app using a development server

### Locally with NPM

1. Install [Node.js®](https://nodejs.org) if you don't have it

2. Download the repo

3. Search the codebase for the string `to run with NPM` (4 occurences excluding this one). Follow the respective guideline in each occurence to slightly modify the code, so that it uses NPM dependencies

4. Open your terminal at the main project directory, and run `npm install` to download the dependencies locally

5. Run `npm start` to load the app via [Parcel](https://parceljs.org/) (stop via `Ctrl+C`)

## Tests

### Run without a framework (default)

1. Open the browser's console, and run `await runAllTests()`

### Run with Jest

1. Install [Node.js®](https://nodejs.org) if you don't have it

2. If you have previously run the app locally with NPM, make sure all NPM-related code changes (4 occurences) are reverted (see above)

3. Open your terminal at the main project directory, and run `npm install` to download the dependencies locally, if you haven't done it already

4. Run `npm test` to execute the tests via [Jest](https://jestjs.io/)

> _Current test coverage according to Jest: 65% (statements)_

## Code Structure

The project uses a simplified variation of the MVC pattern, organizing code into _model_ and _view_ parts:

- `/model/` contains all code modeling the circuit elements, state & functionality:
  - the definitions of the main circuit elements (_tf_, _adder_, _block_), as JS classes
  - the circuit/block simplification algorithms' logic
  - the services related to the circuit state & core functionality (ex. _elementConnectionService_)
- `/view/` contains all code related to the visual part of the app & its UI:
  - the views of the main circuit elements (ex. _tfView_) & all other UI components (ex. _navbarView_)
  - the core rendering & UI services (ex. _elementRenderingService_, _elementSelectingAndDraggingService_)
  - the app features' services (ex. _optimizeTopologyService_)
  - the animations' rendering code
  - the plot computations & rendering code
  - the CSS styles

In addition:

- `/assets/` contains any other resources used (ex. libraries, images)
- `/math/` contains the math services (ex. _complexAnalysisService_)
- `/test/` contains the app's tests
- `/util/` contains any general-purpose utility code & services (ex. _loggingService_)

## License

Controllio is distributed under the MIT License, included in the 'LICENSE.TXT' file.
Copyright (C) 2023-2024 Ioannis Stefanis
