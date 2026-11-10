---
name: network-diagram
description: Draw network, homelab and infrastructure diagrams with per-device service cards from YAML, automatic Graphviz layout, night/paper themes and offline Lucide icons. Use when creating or refreshing network topology or device/workload maps in any project.
---

# Network diagram

Use the complete skill folder, including scripts, assets and package files.
Resolve SKILL_DIR from this loaded skill's directory. Do not infer a repository
root from SKILL_DIR: the project and skill may be in unrelated directories.
Requires Node.js 22+ and npm. Dependencies install inside the skill folder.

## Run

Install once with npm ci --prefix SKILL_DIR --no-audit --no-fund (npm.cmd if
Windows blocks the PowerShell shim). Execute the bundled renderer; do not rewrite
it or download icons during rendering. From the target project's directory:

```text
node SKILL_DIR/scripts/render.mjs --inventory docs/network/inventory.yaml --out docs/network/network
node SKILL_DIR/scripts/render.mjs --inventory docs/network/inventory.yaml --out docs/network/network --check
```

Replace SKILL_DIR with the actual loaded skill's absolute path. Input/output
paths resolve against the calling directory; the output directory must exist.
Use --theme paper for the light palette; night is the default example palette.
Copy [examples/inventory.yaml](examples/inventory.yaml) to start another project.
Read [references.md](references.md) for schema, icons and declarative layout.

## Workflow

1. Read the target project's rules and canonical design. Put its devices,
   hardware, OS, per-device services, links and evidence states in its inventory.
   Keep unknowns explicit; do not copy the example as discovered infrastructure.
2. Choose Lucide icon names in the inventory. Keep colors in the bundled themes;
   grouping and ordering belong in inventory.layout, never device-specific code.
3. Render SVG/PNG, then run --check. Inspect the PNG for clipped icons/text,
   misleading links and complete service rows. A render is not a deployment audit.
4. Preserve assets/ICONS-LICENSE.txt with shared raster exports; SVG embeds the
   full notice. Icon assets are embedded, so viewing requires no network access.
5. Deliver inventory and generated outputs under the target project's normal
   branch/review rules. Keep project-specific assumptions out of this skill.

--check compares SVG text with Git line endings normalized, and PNG bytes in the
same font environment. Cross-OS/font PNG identity is not guaranteed. Tests run
with npm test --prefix SKILL_DIR. See [README.md](README.md) for installation.
