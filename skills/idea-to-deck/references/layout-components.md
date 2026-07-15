# Layout Components

Read this reference after plan approval when repeated cards, process flows, or node-link diagrams would otherwise require manual coordinate arithmetic.

Import the authoring helpers from `src/shared/components.mjs`. They return ordinary native DeckSpec elements; they do not add renderer-only macro types.

## Available helpers

- `titleBlock(options)` returns eyebrow, heading, and optional subtitle text elements.
- `stepFlow(options)` returns equally spaced native cards, labels, and anchored arrow connectors.
- `nodeGrid(options)` returns native ellipse nodes, labels, and stable node references.
- `connectorBetween(options)` connects two boxes at explicit or automatically computed boundary anchors.
- `anchorPoint(box, anchor, toward)` resolves `top`, `right`, `bottom`, `left`, `center`, or `auto`.

Use explicit stable ids. Put connectors below nodes and cards in z-order. Use `auto` anchors for diagonal diagrams and explicit side anchors when the reading direction must be fixed.

```js
import { connectorBetween, nodeGrid, stepFlow, titleBlock } from "<SKILL_DIR>/src/shared/components.mjs";

const heading = titleBlock({
  id: "hero",
  eyebrow: "NEURAL NETWORKS",
  title: "Learning is repeated correction",
  subtitle: "Prediction, loss, backpropagation, update",
});

const grid = nodeGrid({
  id: "network",
  x: 180,
  y: 360,
  w: 1500,
  h: 480,
  columns: [
    { id: "input", nodes: [{ id: "x1", label: "x₁" }, { id: "x2", label: "x₂" }] },
    { id: "hidden", nodes: [{ id: "h1", label: "h₁" }, { id: "h2", label: "h₂" }] },
    { id: "output", nodes: [{ id: "y", label: "ŷ" }] },
  ],
});

const edge = connectorBetween({
  id: "x1-to-h1",
  from: grid.nodes["input.x1"],
  to: grid.nodes["hidden.h1"],
  endArrowType: "triangle",
});

const flow = stepFlow({
  id: "training",
  x: 120,
  y: 520,
  w: 1680,
  h: 180,
  steps: ["Predict", "Measure loss", "Backpropagate", "Update"],
});
```

Validate the expanded DeckSpec normally. Helpers calculate initial anchors; they are not dynamic PowerPoint glue connectors, so moving a node manually in PowerPoint does not move its line endpoint.
