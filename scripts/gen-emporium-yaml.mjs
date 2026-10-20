// Generates reference/emporium-yaml.md from scripts/schema/v1.json
// (a copy of pkg/chartspec/schema/v1.json in the emporium repository) and the
// descriptions in scripts/emporium-yaml.descriptions.json.
//
//   node scripts/gen-emporium-yaml.mjs            write the page
//   node scripts/gen-emporium-yaml.mjs --check    fail if the page is stale
//   node scripts/gen-emporium-yaml.mjs --sync <path to v1.json>   copy a new schema in, then write
//   node scripts/gen-emporium-yaml.mjs --keys     print every table row key (to write descriptions)
//
// A row without a description, or a description without a row, is an error:
// the page cannot drift from the schema.
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const schemaPath = join(root, 'scripts/schema/v1.json');
const templatePath = join(root, 'scripts/emporium-yaml.template.md');
const descPath = join(root, 'scripts/emporium-yaml.descriptions.json');
const outPath = join(root, 'reference/emporium-yaml.md');

const args = process.argv.slice(2);
if (args[0] === '--sync') {
  copyFileSync(args[1], schemaPath);
}

const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
const defs = schema.$defs;

function deref(node) {
  while (node && node.$ref) {
    node = node.$ref.split('/').slice(1).reduce((n, k) => n[k], schema);
  }
  return node;
}

const refName = (node) => (node && node.$ref ? node.$ref.split('/').pop() : '');

const namedTypes = {
  path: 'values path',
  quantity: 'quantity',
  secretKey: 'secret key name',
  capability: 'capability id',
  bound: 'number or quantity',
  sizeParam: 'quantity, or {default, growOnly}',
  secretKeys: 'map',
  resources: '{requests, limits}',
};

function typeText(node) {
  const named = namedTypes[refName(node)];
  if (named) return named;
  const n = deref(node) || {};
  if (n.const !== undefined) return `\`${n.const}\``;
  if (n.enum) return n.enum.map((v) => `\`${v}\``).join(', ');
  if (n.oneOf) {
    const parts = n.oneOf.map((o) => typeText(o));
    return [...new Set(parts)].join(' or ');
  }
  const t = Array.isArray(n.type) ? n.type.join(' or ') : n.type;
  if (t === 'array') {
    const item = n.items ? typeText(n.items) : '';
    return item ? `list of ${item}` : 'list';
  }
  if (t === 'object') return n.properties || n.additionalProperties ? 'map' : 'object';
  return t || 'any';
}

function constraints(node) {
  const n = deref(node) || {};
  const out = [];
  if (n.minimum !== undefined) out.push(`min ${n.minimum}`);
  if (n.maximum !== undefined) out.push(`max ${n.maximum}`);
  if (n.minItems !== undefined) out.push(`at least ${n.minItems} item${n.minItems > 1 ? 's' : ''}`);
  if (n.minProperties !== undefined) out.push(`at least ${n.minProperties} entr${n.minProperties > 1 ? 'ies' : 'y'}`);
  if (n.minLength !== undefined && n.minLength > 0) out.push('not empty');
  if (n.uniqueItems) out.push('unique');
  if (n.pattern && !refName(node)) out.push(`pattern \`${n.pattern}\``);
  if (n.propertyNames && n.propertyNames.pattern) out.push(`keys \`${n.propertyNames.pattern}\``);
  return out.join('; ');
}

// Collects the properties of an object schema, including the ones added by
// allOf/if-then and by the alternatives of oneOf.
function props(node) {
  const n = deref(node);
  const out = {};
  const required = new Set(n.required || []);
  Object.assign(out, n.properties || {});
  for (const part of n.allOf || []) {
    if (part.then) {
      const t = deref(part.then);
      // Conditional branches only add properties the base schema lacks. They
      // narrow the base (type secret for generate, quantity defaults) and must
      // not replace it; their required lists are conditional and are not shown.
      for (const [k, v] of Object.entries(t.properties || {})) if (!(k in out)) out[k] = v;
    }
  }
  const alt = n.oneOf && n.oneOf.every((o) => deref(o).type === 'object' || deref(o).properties) ? n.oneOf : [];
  for (const o of alt) {
    Object.assign(out, deref(o).properties || {});
  }
  return { props: out, required };
}

function walk(node, prefix, rows, depth = 0) {
  const { props: p, required } = props(node);
  for (const [name, sub] of Object.entries(p)) {
    if (sub === true) continue;
    const key = prefix + name;
    const s = deref(sub);
    rows.push({ key, type: typeText(sub), required: required.has(name), constraints: constraints(sub) });
    if (depth >= 3) continue;
    if (s.type === 'object' && s.properties) {
      walk(sub, key + '.', rows, depth + 1);
    } else if (s.type === 'object' && s.additionalProperties && typeof s.additionalProperties === 'object' && (s.additionalProperties.properties || s.additionalProperties.$ref)) {
      const ap = deref(s.additionalProperties);
      if (ap.properties) walk(s.additionalProperties, key + '.<Name>.', rows, depth + 1);
    } else if (s.oneOf && s.oneOf.some((o) => deref(o).properties)) {
      walk(sub, key + '.', rows, depth + 1);
    }
  }
}

function rowsOf(node, prefix = '') {
  const rows = [];
  walk(node, prefix, rows);
  return rows;
}

const profileEntry = deref(defs.profiles).additionalProperties;

const tables = {
  top: rowsOf(schema),
  section: rowsOf(defs.section),
  input: rowsOf(defs.input),
  integration: rowsOf({ required: defs.integration.required, properties: { type: defs.integration.properties.type, required: defs.integration.properties.required, bind: defs.integration.properties.bind } }),
  ingress: rowsOf(defs.params.ingress),
  oidc: rowsOf(defs.params.oidc),
  storage: rowsOf(defs.params.storage),
  postgres: rowsOf(defs.params.postgres),
  redis: rowsOf(defs.params.redis),
  objectStorage: rowsOf(defs.params.objectStorage),
  app: rowsOf(defs.params.app),
  component: rowsOf(defs.component),
  profiles: [{ key: 'default', type: 'string', required: false, constraints: '' }, ...rowsOf(profileEntry, '<name>.')],
  options: rowsOf(defs.options),
  export: rowsOf(defs.export),
};
// top-level `required` comes from the root schema
tables.top = tables.top.filter((r) => !r.key.includes('.'));
tables.top.forEach((r) => { r.required = (schema.required || []).includes(r.key); });
// the export credentials alternatives list kind plus the exported fields
// profile entries: `values` is required
tables.profiles.forEach((r) => { if (r.key === '<name>.values') r.required = true; });

const descriptions = JSON.parse(readFileSync(descPath, 'utf8'));

if (args[0] === '--keys') {
  for (const [id, rows] of Object.entries(tables)) for (const r of rows) console.log(`${id}: ${r.key}`);
  process.exit(0);
}

const problems = [];
const used = new Set();
function render(id) {
  const rows = tables[id];
  const lines = ['| Field | Type | Required | Description |', '|---|---|---|---|'];
  for (const r of rows) {
    const k = `${id}: ${r.key}`;
    used.add(k);
    const d = descriptions[k];
    if (d === undefined) {
      problems.push(`no description for "${k}"`);
      continue;
    }
    const type = r.constraints ? `${r.type} (${r.constraints})` : r.type;
    const depth = (r.key.match(/\./g) || []).length;
    const indent = depth ? '&nbsp;&nbsp;'.repeat(depth) : '';
    const shown = r.key.split('.').pop();
    lines.push(`| ${indent}\`${shown}\` | ${type.replace(/\|/g, '\\|')} | ${r.required ? 'yes' : 'no'} | ${d.replace(/\|/g, '\\|')} |`);
  }
  return lines.join('\n');
}

let page = readFileSync(templatePath, 'utf8').replace(/\{\{table:(\w+)\}\}/g, (_, id) => {
  if (!tables[id]) {
    problems.push(`unknown table ${id}`);
    return '';
  }
  return render(id);
});
for (const k of Object.keys(descriptions)) if (!used.has(k)) problems.push(`description for "${k}" matches no schema field`);
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}

const banner = '<!-- Generated by scripts/gen-emporium-yaml.mjs from scripts/schema/v1.json. Do not edit; edit the template or the descriptions. -->\n\n';
page = banner + page;
if (args[0] === '--check') {
  let current = '';
  try { current = readFileSync(outPath, 'utf8'); } catch { /* missing */ }
  if (current !== page) {
    console.error('reference/emporium-yaml.md is stale: run node scripts/gen-emporium-yaml.mjs');
    process.exit(1);
  }
  console.log('reference/emporium-yaml.md is up to date');
} else {
  writeFileSync(outPath, page);
  console.log('wrote reference/emporium-yaml.md');
}
