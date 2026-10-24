#!/usr/bin/env node
// Generates a standalone, static index.html from "Impact - Landing.dc.html"
// for GitHub Pages — no support.js/React runtime needed at runtime.
//
// Usage: node build.js

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SRC = path.join(__dirname, "Impact - Landing.dc.html");
const OUT = path.join(__dirname, "index.html");

const src = fs.readFileSync(SRC, "utf8");

function unescapeHtml(s) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

// --- extract <helmet>...</helmet> ---
const helmetMatch = src.match(/<helmet>([\s\S]*?)<\/helmet>/);
if (!helmetMatch) throw new Error("Could not find <helmet> block");
let helmetContent = helmetMatch[1];
// drop the internal bundler thumbnail template, not needed on the public site
helmetContent = helmetContent.replace(/<template id="__bundler_thumbnail"[\s\S]*?<\/template>\s*/, "");

// --- extract body content: everything between </helmet> and </x-dc> ---
const bodyStart = src.indexOf("</helmet>") + "</helmet>".length;
const bodyEnd = src.indexOf("</x-dc>");
if (bodyStart < 0 || bodyEnd < 0) throw new Error("Could not find x-dc boundaries");
let bodyContent = src.slice(bodyStart, bodyEnd);

// --- extract data-dc-script props defaults + logic class ---
const scriptMatch = src.match(
  /<script\s+type="text\/x-dc"\s+data-dc-script\s+data-props=(?:"([^"]*)"|'([^']*)')\s*>([\s\S]*?)<\/script>/
);
if (!scriptMatch) throw new Error("Could not find data-dc-script block");
const propsSchema = JSON.parse(unescapeHtml(scriptMatch[1] ?? scriptMatch[2]));
const scriptBody = scriptMatch[3];

const propsDefaults = {};
for (const [key, def] of Object.entries(propsSchema)) {
  propsDefaults[key] = def.default;
}

// --- run the component's renderVals() to get the derived {{ }} values ---
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(
  `
  class DCLogic {
    constructor(props) { this.props = props; }
  }
  ${scriptBody}
  globalThis.__vals = new Component(${JSON.stringify(propsDefaults)}).renderVals();
  `,
  sandbox
);
const vals = sandbox.__vals;

// --- replace {{ key }} placeholders ---
bodyContent = bodyContent.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
  if (!(key in vals)) throw new Error(`Unknown template var: ${key}`);
  return vals[key];
});

// --- convert style-hover="..." into real :hover CSS (inert as a plain attribute) ---
let hoverCounter = 0;
const hoverRules = [];
bodyContent = bodyContent.replace(
  /style="([^"]*)"\s+style-hover="([^"]*)"/g,
  (_, baseStyle, hoverStyle) => {
    hoverCounter += 1;
    const cls = `hov-${hoverCounter}`;
    hoverRules.push(`.${cls}:hover { ${hoverStyle} }`);
    return `class="${cls}" style="${baseStyle}"`;
  }
);

// --- assemble the static page ---
const output = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Impact - Mon empreinte carbone</title>
${helmetContent.trim()}
<style>
${hoverRules.join("\n")}
</style>
</head>
<body>
${bodyContent.trim()}
</body>
</html>
`;

fs.writeFileSync(OUT, output);
console.log(`Wrote ${OUT} (${(output.length / 1024).toFixed(1)} KB)`);
