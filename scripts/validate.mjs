import { readFile } from "node:fs/promises";

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

if (!Array.isArray(moduleData.modules) || moduleData.modules.length < 3) {
  throw new Error("Expected at least three seed modules.");
}

const ids = new Set();
for (const mod of moduleData.modules) {
  const fields = ["id", "name", "description", "type", "test", "results"];
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
}

console.log(`Validated ${moduleData.modules.length} seed modules and Worker assets.`);
