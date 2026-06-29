import { readdir, readFile } from "node:fs/promises";

const requiredFiles = [
  "site/index.html",
  "site/app.js",
  "site/styles.css",
  "site/data/modules.json",
  "src/worker.js",
  "wrangler.jsonc"
];

for (const file of requiredFiles) {
  await readFile(new URL(`../${file}`, import.meta.url), "utf8");
}

const moduleData = JSON.parse(
  await readFile(new URL("../site/data/modules.json", import.meta.url), "utf8")
);

if (!Array.isArray(moduleData.modules) || moduleData.modules.length < 12) {
  throw new Error("Expected at least twelve seed modules.");
}

const ids = new Set();
for (const mod of moduleData.modules) {
  const fields = ["id", "name", "description", "type", "risk", "securityNote", "test", "results"];
  for (const field of fields) {
    if (!mod[field]) throw new Error(`Module ${mod.id || "(missing id)"} is missing ${field}.`);
  }

  if (ids.has(mod.id)) throw new Error(`Duplicate module id: ${mod.id}`);
  ids.add(mod.id);

  if (!Array.isArray(mod.tags)) throw new Error(`Module ${mod.id} tags must be an array.`);
  if (!Array.isArray(mod.results.columns)) throw new Error(`Module ${mod.id} needs result columns.`);
  if (mod.type === "ENUM_FUNCTION" && !mod.test.enumData) {
    throw new Error(`Enum module ${mod.id} needs enumData.`);
  }
  if (!mod.test.userScript.includes("function test")) {
    throw new Error(`Module ${mod.id} userScript must define function test(data).`);
  }
  new Function(`${mod.test.userScript}; return typeof test;`);
}

const removedPaths = ["controllers", "middlewares", "models", "public", "routes", "views", "server.js", "config.js", "Procfile"];
const rootEntries = new Set(await readdir(new URL("../", import.meta.url)));
for (const path of removedPaths) {
  if (rootEntries.has(path)) throw new Error(`Removed server artifact is still present: ${path}`);
}

const activeText = await Promise.all(requiredFiles.map((file) => readFile(new URL(`../${file}`, import.meta.url), "utf8")));
if (activeText.some((text) => /DomStorm|Dom Storm|storming|\bExpress\b|MongoDB|Twitter OAuth|jQuery|\bBootstrap\b|legacy/i.test(text))) {
  throw new Error("Active Worker app still contains old-branding or server-stack wording.");
}

console.log(`Validated ${moduleData.modules.length} seed modules, Worker assets, and rebrand cleanup.`);
