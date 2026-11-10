import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { instance } from '@viz-js/viz';
import { Resvg } from '@resvg/resvg-js';
import { parse } from 'yaml';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const lucide = require('@iconify-json/lucide/icons.json');

const root = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log('Usage: node render.mjs --inventory FILE --out PREFIX [--theme night|paper] [--check]');
  process.exit(0);
}
const packageRoot = path.resolve(root, '..');
const option = (flag, fallback) => {
  const index = args.indexOf(flag);
  if (index < 0) return fallback;
  assert(args[index + 1] && !args[index + 1].startsWith('--'), flag + ' requires a value');
  return args[index + 1];
};
const inputArg = option('--inventory');
const outputArg = option('--out');
assert(inputArg && outputArg, 'Pass --inventory FILE and --out PREFIX; see --help');
const input = path.resolve(inputArg);
const output = path.resolve(outputArg);
const inv = parse(await readFile(input, 'utf8'));
const themes = JSON.parse(await readFile(path.join(packageRoot, 'assets/themes.json'), 'utf8'));
const theme = option('--theme', inv.theme);
const t = themes[theme];
assert(t, 'Unknown theme: ' + theme);
const q = JSON.stringify;
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const font = (text, color=t.text, size=12) => '<FONT FACE="Arial" COLOR="' + color + '" POINT-SIZE="' + size + '">' + esc(text) + '</FONT>';
const ids = new Set();
const zoneIds = new Set(inv.zones.map(z => z.id));
for (const n of inv.nodes) {
  assert(!ids.has(n.id), 'Duplicate node ID: ' + n.id);
  ids.add(n.id);
  assert(zoneIds.has(n.zone), 'Unknown zone: ' + n.zone);
  for (const s of n.services) assert(t.states[s.state], 'Unknown service state: ' + s.state);
}
for (const e of inv.edges) {
  assert(ids.has(e.from) && ids.has(e.to), 'Edge references missing device');
  assert(t.states[e.state], 'Unknown link state: ' + e.state);
}
const iconImages = new Map();
function iconCell(name, size, color) {
  const icon = lucide.icons[name];
  assert(icon, 'Unknown Lucide icon: ' + name);
  const file = 'lucide-' + name + '-' + size + '.svg';
  const body = icon.body.replaceAll('currentColor', color);
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 ' + lucide.width + ' ' + lucide.height + '">' + body + '</svg>';
  iconImages.set(file, {name:file, width:size, height:size, svg});
  return '<TD WIDTH="' + (size + 18) + '" HEIGHT="' + (size + 12) + '"><IMG SRC="' + file + '"/></TD>';
}
function card(n) {
  const rows = [
    '<TR><TD COLSPAN="3" ALIGN="LEFT" BGCOLOR="' + t.header + '" CELLPADDING="7"><TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0"><TR>' + iconCell(n.icon, 24, t.accent) + '<TD ALIGN="LEFT">' + font(n.name, t.text, 18) + '</TD></TR></TABLE></TD></TR>',
    '<TR><TD COLSPAN="3" ALIGN="LEFT">' + font(n.hardware, t.muted, 11) + '</TD></TR>',
    '<TR><TD COLSPAN="3" ALIGN="LEFT">' + font(n.os, t.muted, 11) + '</TD></TR>',
    ...n.services.map(s => '<TR>' + iconCell(s.icon, 16, t.muted) + '<TD ALIGN="LEFT">' + font(s.name) + '</TD><TD ALIGN="RIGHT" BGCOLOR="' + t.header + '">' + font(s.state.toUpperCase(), t.states[s.state], 9) + '</TD></TR>')
  ];
  return '<TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" CELLPADDING="10" COLOR="' + t.border + '" BGCOLOR="' + t.panel + '" STYLE="ROUNDED">' + rows.join('') + '</TABLE>';
}
const lines = [
  'digraph network {',
  'graph [newrank=true, rankdir=TB, bgcolor=' + q(t.background) + ', fontname="Arial", pad=0.5, nodesep=0.5, ranksep=0.85, splines=polyline, compound=true, outputorder=edgesfirst];',
  'node [shape=plain, fontname="Arial"];',
  'edge [fontname="Arial", fontsize=10, arrowsize=0.7, penwidth=1.6];'
];
const title = '<TABLE BORDER="0" CELLBORDER="0" CELLPADDING="7"><TR><TD>' + font(inv.meta.title, t.accent, 26) + '</TD></TR><TR><TD>' + font(inv.meta.subtitle, t.muted, 13) + '</TD></TR></TABLE>';
lines.push('label=<' + title + '>; labelloc=t;');
for (const z of inv.zones) {
  lines.push('subgraph ' + q('cluster_' + z.id) + ' { label=' + q(z.label) + '; fontcolor=' + q(t.accent) + '; fontsize=13; color=' + q(t.border) + '; style="rounded,dashed"; margin=25;');
  for (const n of inv.nodes.filter(n => n.zone === z.id)) lines.push(q(n.id) + ' [label=<' + card(n) + '>];');
  lines.push('}');
}
for (const e of inv.edges) {
  const attrs = {label:e.label, color:t.states[e.state], fontcolor:t.muted, style:e.state === 'configured' ? 'solid' : 'dashed'};
  if (e.reverse) attrs.dir = 'back';
  lines.push(q(e.from) + ' -> ' + q(e.to) + ' [' + Object.entries(attrs).map(([k,v]) => k + '=' + q(v)).join(',') + '];');
}
// Layout intent comes from the inventory, never project-specific device IDs.
const layout = inv.layout ?? {};
for (const rank of layout.ranks ?? []) {
  for (const id of rank) assert(ids.has(id), 'Unknown layout node: ' + id);
  lines.push('{rank=same; ' + rank.map(q).join(';') + ';}');
}
for (const edge of layout.after ?? []) {
  assert(ids.has(edge.from) && ids.has(edge.to), 'Unknown layout ordering node');
  lines.push(q(edge.from) + ' -> ' + q(edge.to) + ' [style=invis];');
}
const legend = Object.keys(t.states).map(s => font(s.toUpperCase(), t.states[s], 10)).join(' ');
const notes = '<TABLE BORDER="0" CELLBORDER="0" CELLPADDING="6"><TR><TD ALIGN="LEFT">' + legend + '</TD></TR>' + inv.meta.notes.map(n => '<TR><TD ALIGN="LEFT">' + font(n, t.muted, 11) + '</TD></TR>').join('') + '<TR><TD ALIGN="LEFT">' + font('Icons: Lucide / ISC + Feather-derived MIT | Source: ' + inv.meta.source + ' | Graphviz automatic layout | theme: ' + theme, t.muted, 10) + '</TD></TR></TABLE>';
lines.push('notes [label=<' + notes + '>];');
for (const id of layout.footer_after ?? []) {
  assert(ids.has(id), 'Unknown footer ordering node: ' + id);
  lines.push(q(id) + ' -> notes [style=invis];');
}
lines.push('}');
const viz = await instance();
let svg = viz.renderString(lines.join('\n'), {format:'svg', engine:'dot', images:[...iconImages.values()].map(({name,width,height}) => ({name,width,height}))});
for (const icon of iconImages.values()) {
  const data = 'data:image/svg+xml;base64,' + Buffer.from(icon.svg).toString('base64');
  assert(svg.includes('href="' + icon.name + '"'), 'Graphviz omitted icon: ' + icon.name);
  svg = svg.replaceAll('href="' + icon.name + '"', 'href="' + data + '"');
}
const iconCount = inv.nodes.length + inv.nodes.reduce((sum, n) => sum + n.services.length, 0);
assert.equal((svg.match(/<image /g) || []).length, iconCount, 'Missing embedded device/service icons');
const license = await readFile(path.join(packageRoot, 'assets/ICONS-LICENSE.txt'), 'utf8');
svg = svg.replace(/<svg\b[^>]*>/, tag => tag + '\n<metadata id="lucide-license">' + esc(license) + '</metadata>');
for (const n of inv.nodes) assert(svg.includes(esc(n.name)), 'Missing node in SVG: ' + n.name);
const image = new Resvg(svg, {font:{defaultFontFamily:'Arial',loadSystemFonts:true}}).render();
const png = image.asPng();
assert.equal(png.subarray(0,8).toString('hex'), '89504e470d0a1a0a');
assert(image.width > 0 && image.height > 0);
if (args.includes('--check')) {
  assert.equal((await readFile(output + '.svg', 'utf8')).replaceAll('\r\n', '\n'), svg, 'SVG is stale: run npm run render');
  assert.deepEqual(await readFile(output + '.png'), png, 'PNG is stale: run npm run render on the same font environment');
  console.log('Current outputs match inventory, renderer and theme.');
} else {
  await writeFile(output + '.svg', svg);
  await writeFile(output + '.png', png);
}
console.log(JSON.stringify({nodes:inv.nodes.length, links:inv.edges.length, theme, icons:iconCount, width:image.width,height:image.height,output}));
