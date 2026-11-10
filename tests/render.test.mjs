import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const renderer = path.join(root, 'scripts/render.mjs');
const sample = readFileSync(path.join(root, 'examples/inventory.yaml'), 'utf8');
const invoke = (cwd, args) => spawnSync(process.execPath, [renderer, ...args], {cwd, encoding:'utf8'});
const success = result => assert.equal(result.status, 0, result.stdout + result.stderr);

test('independent project names and cwd render both themes with offline icons', () => {
  const dir = mkdtempSync(path.join(root, '.test-output-'));
  try {
    const input = path.join(dir, 'project.yaml');
    writeFileSync(input, sample);
    for (const theme of ['night', 'paper']) {
      const out = path.join(dir, theme);
      const args = ['--inventory', input, '--out', out, '--theme', theme];
      success(invoke(dir, args));
      const svg = readFileSync(out + '.svg', 'utf8');
      assert(svg.includes('Demo workstation'));
      assert(svg.includes('Build worker'));
      assert.doesNotMatch(svg, /Kamatera|XPS 15|Magpie|RTX 4080/);
      assert.equal((svg.match(/<image /g) ?? []).length, 6);
      assert.equal((svg.match(/href="data:image\/svg\+xml;base64,/g) ?? []).length, 6);
      assert(svg.includes('lucide-license'));
      assert.equal(readFileSync(out + '.png').subarray(0,8).toString('hex'), '89504e470d0a1a0a');
      success(invoke(dir, [...args, '--check']));
      writeFileSync(out + '.svg', svg.replaceAll('\n', '\r\n'));
      success(invoke(dir, [...args, '--check']));
    }
  } finally { rmSync(dir, {recursive:true, force:true}); }
});

test('unknown layout node fails at the CLI before writing diagram files', () => {
  const dir = mkdtempSync(path.join(root, '.test-output-'));
  try {
    const input = path.join(dir, 'invalid.yaml');
    const inv = parse(sample);
    inv.layout.ranks = [['missing-node']];
    writeFileSync(input, JSON.stringify(inv));
    const out = path.join(dir, 'diagram');
    const result = invoke(dir, ['--inventory',input,'--out',out]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Unknown layout node: missing-node/);
    assert.equal(existsSync(out + '.svg'), false);
    assert.equal(existsSync(out + '.png'), false);
  } finally { rmSync(dir, {recursive:true, force:true}); }
});

test('CRLF license metadata survives npx-style checkout and check', () => {
  const dir = mkdtempSync(path.join(root, '.test-output-'));
  try {
    const pkg = path.join(dir, 'package');
    mkdirSync(path.join(pkg, 'scripts'), {recursive:true});
    mkdirSync(path.join(pkg, 'assets'));
    const clone = path.join(pkg, 'scripts/render.mjs');
    writeFileSync(clone, readFileSync(renderer));
    writeFileSync(path.join(pkg, 'assets/themes.json'), readFileSync(path.join(root, 'assets/themes.json')));
    const license = readFileSync(path.join(root, 'assets/ICONS-LICENSE.txt'), 'utf8').replaceAll('\r\n', '\n').replaceAll('\n', '\r\n');
    assert(license.includes('\r\n'));
    writeFileSync(path.join(pkg, 'assets/ICONS-LICENSE.txt'), license);
    const input = path.join(dir, 'project.yaml');
    writeFileSync(input, sample);
    const out = path.join(dir, 'diagram');
    const args = [clone, '--inventory', input, '--out', out];
    success(spawnSync(process.execPath, args, {cwd:dir, encoding:'utf8'}));
    success(spawnSync(process.execPath, [...args, '--check'], {cwd:dir, encoding:'utf8'}));
    assert.doesNotMatch(readFileSync(out + '.svg', 'utf8'), /\r/);
  } finally { rmSync(dir, {recursive:true, force:true}); }
});
