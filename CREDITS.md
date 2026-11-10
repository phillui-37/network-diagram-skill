# Credits

## Visual inspiration

[Goblinmine/homelab-diagram](https://github.com/Goblinmine/homelab-diagram) inspired
the r/homelab-style presentation: network zones, device cards, hardware details
and per-device service lists. Thank you to Goblinmine for publishing the project
and making that approach available to others.

The original project uses a hand-placed layout tailored to its author's network.
This skill implements automatic layout with Graphviz and keeps project topology
in YAML. The original build.py and its hand-placed topology are not vendored here.
The inspected inspiration revision was c53f9f3b9efb9e4930549c9678a6f64c6fbc4a08.

## Libraries and artwork

- [Viz.js](https://github.com/mdaines/viz-js): Graphviz compiled to WebAssembly.
- [Graphviz](https://graphviz.org/): graph layout and routing.
- [resvg-js](https://github.com/thx/resvg-js): SVG-to-PNG rendering.
- [yaml](https://github.com/eemeli/yaml): YAML parsing.
- [Lucide](https://lucide.dev/) and its contributors: device and service icons.
- [Iconify](https://iconify.design/): the packaged Lucide JSON collection.
- [Feather](https://feathericons.com/): artwork from which some Lucide icons derive.

Dependency versions are pinned in package-lock.json. Their upstream licenses
remain applicable. Full Lucide/Feather notices are retained in
[assets/ICONS-LICENSE.txt](assets/ICONS-LICENSE.txt), including inside SVG metadata.
The [root MIT license](LICENSE) covers this project's own code.
