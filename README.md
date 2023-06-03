# Controllio

![app](https://github.com/istefanis/controllio/blob/main/assets/img/app.png)

Controllio is a web app which lets Control Systems engineers design & experiment with LTI (linear time-invariant) dynamical systems online.

So far, functionality has been implemented for:

- the analytical computation of the overall transfer function (tf) of a system modeled by interconnected elements in the s-domain
- the generation of its Bode and Nyquist plots
- the numerical computation of its time response plot
- the numerical computation of its zeros/poles & some characteristic numbers, ex. bandwidth

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

- Polynomial complex roots: Weierstrass / Durand-Kerner
- Laplace inversion: Talbot

### Topology optimization

- A stochastic algorithm to simplify the circuit's topology

![topology optimization](https://github.com/istefanis/controllio/blob/main/assets/img/topology-optimization.gif)

### Ready-made components

- Utilities: integrator / step, exponential decay, sine, phase delay
- Controllers: PI, PD, PID

## Try it out

### Online

- The app is deployed [here](https://istefanis.github.io/controllio) (make sure that JS is enabled in order to run it - a circuit should appear at startup)

### Locally

- Download the repo, and just load the app using a development server

## User Guide

A User Guide is included in the web app, and can be launched from the main menu

## License

Controllio is distributed under the MIT License, included in the 'LICENCE.TXT' file.
Copyright (C) 2023 Ioannis Stefanis
