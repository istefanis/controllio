# Controllio

![app](https://github.com/istefanis/controllio/blob/main/assets/img/app.png)

Controllio is a web app which lets Control Systems engineers design & experiment with LTI (linear time-invariant) dynamical systems online.

So far, functionality has been implemented for:

- the analytical computation of the overall transfer function (tf) of a system modeled by interconnected elements in the s-domain
- the generation of its Bode and Nyquist plots
- the numerical computation of its time response plot
- the numerical computation of its zeros/poles & some characteristic numbers, ex. bandwidth
- the numerical computation of its stability

> _This is a web GUI tool. For a command-line one, check the [lti-freq-domain-toolbox](https://github.com/istefanis/lti-freq-domain-toolbox)_

## Motivation

The motivation behind Controllio is to create an open-source tool for studying Control Systems, which:

- runs on the browser without any installation, is fast and mobile-friendly
- is written in a widely-used programming language (vanilla Javascript), and can be easily extended

## Technical details

### Circuit simplification

- A set of 6 simplication algorithms to compute analytically its overall transfer function

![circuit simplification](https://github.com/istefanis/controllio/blob/main/assets/img/circuit-simplification.gif)

### Numerical algorithms

- Polynomial complex roots: Weierstrass / Durand-Kerner algorithm
- Laplace inversion: Talbot algorithm

### Topology optimization

- A stochastic algorithm to simplify the circuit's topology

![topology optimization](https://github.com/istefanis/controllio/blob/main/assets/img/topology-optimization.gif)

### Ready-made components

- Utilities: integrator / step, exponential decay, sine, phase delay
- Controllers: PI, PD, PID

## Try it out

### Online

- The app is deployed [here](https://istefanis.github.io/controllio)

### Locally

- Download the repo, and just load the app using a development server

## User Guide

A User Guide is included in the web app, and can be launched from the main menu

## Code Structure

The project uses a simplified variation of the MVC pattern, organizing code into _model_ and _view_ parts:

- `\model\` contains all code modeling the circuit elements, state & functionality:
  - the definitions of the main circuit elements (_tf_, _adder_, _block_), as JS classes
  - the circuit/block simplification algorithms' logic
  - the services related to the circuit state & core functionality (ex. _elementConnectionService_)
- `\view\` contains all code related to the visual part of the app & its UI:
  - the views of the main circuit elements (ex. _tfView_) & all other UI components (ex. _navbarView_)
  - the core rendering & UI services (ex. _elementRenderingService_, _elementSelectingAndDraggingService_)
  - the app features' services (ex. _optimizeTopologyService_)
  - the animations' rendering code
  - the plot computations & rendering code
  - the CSS styles

In addition:

- `\assets\` contains any other resources used (ex. libraries, images)
- `\math\` contains the math services (ex. _complexAnalysisService_)
- `\test\` contains the services' tests (ex. _plotsTests_), which can be executed from the main JS file _script.js_
- `\util\` contains any general-purpose utility code & services (ex. _loggingService_)

## License

Controllio is distributed under the MIT License, included in the 'LICENCE.TXT' file.
Copyright (C) 2023 Ioannis Stefanis
