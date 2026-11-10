# Inventory reference

The inventory is YAML. Strings are escaped before they become Graphviz labels.
Do not place credentials or private conversation excerpts in an inventory.

| Field | Meaning |
|---|---|
| meta.title, subtitle, source | Visible title, scope statement and canonical source label |
| meta.notes | List of visible caveats or design notes |
| theme | night or paper; CLI --theme overrides it |
| zones | List of {id, label}; IDs are arbitrary project-owned strings |
| nodes | List of {id, zone, icon, name, hardware, os, services} |
| services | List of {name, icon, state} within each node |
| edges | List of {from, to, label, state}; optional reverse:true draws the arrow back |
| layout | Optional visual ordering only; never creates a visible network connection |

Node IDs must be unique. Node zones, link endpoints and layout references must
exist. Icons are names from the pinned @iconify-json/lucide collection.
States are reported, configured, proposed, optional, unknown, deferred or candidate.
A configured link is solid intent; other links are dashed. No state establishes
live service health or proves physical connectivity.

## Layout

Graphviz places everything automatically. Optional constraints are data:

```yaml
layout:
  ranks: [[entry], [compute, workstation]]
  after:
    - {from: compute, to: future}
  footer_after: [future]
```

Each ranks row puts those node IDs on the same rank. after adds an invisible
ordering edge. footer_after places the footer after selected nodes. These IDs
must exist in your own nodes list; the snippet shows syntax, not a complete map.
Omit layout entirely when no ordering is needed. Renderer code has no built-in
home, LAN, cloud-provider or deferred-service topology.

## Icons and themes

Headers use 24-point accent icons; services use 16-point muted icons. Examples:
monitor, laptop, server, cloud, router, bird, brain, container, database, palette.
All icon images and the full ISC/Feather MIT notice are embedded in SVG. Retain
[the companion license](assets/ICONS-LICENSE.txt) with PNG distribution.
[themes.json](assets/themes.json) defines night/paper palettes and state colors.

SVG comparisons normalize CRLF to LF. PNG rendering uses installed fonts; compare
bytes in the same font environment and inspect/regenerate after an OS/font change.
Only Windows execution has been verified for this extraction; other platforms
are supported by the chosen dependencies but were not executed in this task.
