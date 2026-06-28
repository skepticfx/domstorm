const STORAGE_KEYS = {
  modules: "domlab.local.modules",
  results: "domlab.local.results",
  views: "domlab.local.views"
};

const state = {
  seedModules: [],
  localModules: [],
  resultOverrides: {},
  viewCounts: {},
  query: "",
  filter: "all"
};

const app = document.querySelector("#app");
const navLinks = [...document.querySelectorAll("[data-nav]")];

window.addEventListener("popstate", render);
document.addEventListener("click", handleDocumentClick);

boot();

async function boot() {
  try {
    const response = await fetch("/api/modules", { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`Module API returned ${response.status}`);
    const data = await response.json();
    state.seedModules = data.modules || [];
    state.localModules = readJson(STORAGE_KEYS.modules, []);
    state.resultOverrides = readJson(STORAGE_KEYS.results, {});
    state.viewCounts = readJson(STORAGE_KEYS.views, {});
    registerServiceWorker();
    render();
  } catch (error) {
    app.innerHTML = renderError("DOM Lab could not load the experiment catalog.", error.message);
  }
}

function render() {
  const route = parseRoute(location.pathname, location.search);
  navLinks.forEach((link) => link.classList.toggle("active", link.dataset.nav === route.nav));

  if (route.name === "home" || route.name === "modules") {
    renderModules(route);
    return;
  }

  if (route.name === "module") {
    renderModuleDetail(route.id);
    return;
  }

  if (route.name === "runner") {
    renderRunner(route.id);
    return;
  }

  if (route.name === "new") {
    renderEditor(route.copyFrom);
    return;
  }

  if (route.name === "about") {
    renderAbout();
    return;
  }

  renderNotFound();
}

function parseRoute(pathname, search) {
  const params = new URLSearchParams(search);
  if (pathname === "/" || pathname === "") return { name: "home", nav: "modules", params };
  if (pathname === "/modules") return { name: "modules", nav: "modules", params };
  if (pathname.startsWith("/module/")) {
    return { name: "module", nav: "modules", id: decodeURIComponent(pathname.split("/")[2] || "") };
  }
  if (pathname.startsWith("/runner/")) {
    return { name: "runner", nav: "modules", id: decodeURIComponent(pathname.split("/")[2] || "") };
  }
  if (pathname === "/new") return { name: "new", nav: "new", copyFrom: params.get("from") };
  if (pathname === "/about") return { name: "about", nav: "about" };
  return { name: "404", nav: "" };
}

function renderModules(route) {
  state.query = route.params.get("q") || "";
  state.filter = route.params.get("filter") || "all";
  const modules = getFilteredModules();
  const totals = getTotals(getAllModules());
  const topModules = [...getAllModules()]
    .sort((a, b) => getViewCount(b) - getViewCount(a))
    .slice(0, 6);

  app.innerHTML = `
    <section class="hero-strip">
      <div>
        <span class="eyebrow">DOM Lab</span>
        <h1>Run browser behavior experiments without hauling a server around.</h1>
        <p class="hero-copy">A faster, cleaner rebuild of DomStorm for Cloudflare Workers. Seed experiments ship from the edge, and your own experiments plus run results stay local in this browser.</p>
        <div class="button-row">
          <a class="button" href="/new">New experiment</a>
          <a class="button secondary" href="/about">How it works</a>
        </div>
      </div>
      <div class="hero-meter" aria-label="Catalog statistics">
        <div class="stat"><span class="stat-label">Experiments</span><strong>${totals.modules}</strong></div>
        <div class="stat"><span class="stat-label">Local</span><strong>${state.localModules.length}</strong></div>
        <div class="stat"><span class="stat-label">Tags</span><strong>${totals.tags}</strong></div>
        <div class="stat"><span class="stat-label">Runs</span><strong>${totals.runs}</strong></div>
      </div>
    </section>

    <section class="workspace">
      <div>
        <form class="toolbar" data-action="search">
          <input class="input" name="q" type="search" value="${escapeAttr(state.query)}" placeholder="Search name, tag, or description" aria-label="Search experiments">
          <select class="select" name="filter" aria-label="Filter experiments">
            ${renderOption("all", "All experiments", state.filter)}
            ${renderOption("seed", "Seed only", state.filter)}
            ${renderOption("local", "Local only", state.filter)}
          </select>
          <button class="button" type="submit">Search</button>
        </form>
        ${modules.length ? `<div class="module-grid">${modules.map(renderModuleCard).join("")}</div>` : renderEmpty("No experiments matched your search.")}
      </div>
      <aside class="sidebar">
        <section class="panel">
          <h2>Most viewed here</h2>
          <ul class="list-plain">
            ${topModules.map((module) => `<li><a href="/module/${module.id}">${escapeHtml(module.name)} <span class="pill">${getViewCount(module)} views</span></a></li>`).join("")}
          </ul>
        </section>
        <section class="panel">
          <h2>Runner API</h2>
          <p>Write <code>function test(data)</code> and call <code>addSuccess</code>, <code>addInfo</code>, or <code>addError</code>. Each data item runs in a sandboxed iframe.</p>
        </section>
      </aside>
    </section>
  `;
}

function renderModuleCard(module) {
  return `
    <article class="module-card">
      <a class="module-link" href="/module/${module.id}">
        <span class="module-kind">${formatType(module.type)}</span>
        <h2>${escapeHtml(module.name)}</h2>
        <p>${escapeHtml(module.description)}</p>
      </a>
      <div class="tag-row">
        ${module.tags.slice(0, 4).map(renderTag).join("")}
      </div>
    </article>
  `;
}

function renderModuleDetail(id) {
  const module = getModule(id);
  if (!module) {
    app.innerHTML = renderError("Experiment not found.", "The module may have been removed from this browser.");
    return;
  }

  incrementView(id);
  const results = getResults(module);
  const browserNames = Object.keys(results.browsers || {});

  app.innerHTML = `
    <section class="hero-strip">
      <div>
        <span class="eyebrow">${formatType(module.type)}</span>
        <h1>${escapeHtml(module.name)}</h1>
        <p class="hero-copy">${escapeHtml(module.description)}</p>
        <div class="meta-row">
          <span class="pill blue">${escapeHtml(module.owner || "DOM Lab")}</span>
          <span class="pill">${getViewCount(module)} views</span>
          ${module.tags.map(renderTag).join("")}
        </div>
      </div>
      <div class="button-row">
        <a class="button" href="/runner/${module.id}">Run</a>
        <a class="button secondary" href="/new?from=${module.id}">Fork</a>
        ${module.local ? `<button class="button warning" type="button" data-action="delete-module" data-id="${module.id}">Delete</button>` : ""}
      </div>
    </section>

    <section class="detail-layout">
      <div class="runner-console">
        <section class="panel">
          <h2>Results</h2>
          ${browserNames.length ? browserNames.map((browser) => renderResultSet(browser, results)).join("") : "<p>No local runs yet. Run this experiment to capture results for your browser.</p>"}
        </section>
        <section class="panel">
          <h2>User script</h2>
          ${renderCode(module.test.userScript)}
        </section>
        <section class="panel">
          <h2>${module.type === "FUZZER" ? "Fuzz data" : "Enum data"}</h2>
          ${renderCode(module.type === "FUZZER" ? module.test.fuzzData : module.test.enumData)}
        </section>
      </div>
      <aside class="sidebar">
        <section class="panel">
          <h2>Run model</h2>
          <p>Runs are isolated in sandboxed iframes with a timeout of ${Number(module.test.timeout || 2000)}ms per item. Results are saved in localStorage for this browser.</p>
        </section>
        <section class="panel">
          <h2>Columns</h2>
          <div class="tag-row">${results.columns.map((column) => `<span class="pill">${escapeHtml(column)}</span>`).join("")}</div>
        </section>
      </aside>
    </section>
  `;
}

function renderResultSet(browser, results) {
  const set = results.browsers[browser];
  return `
    <section class="panel">
      <h3>${escapeHtml(browser)}</h3>
      <p>${escapeHtml(set.version || "Unknown version")} on ${escapeHtml(set.os || "Unknown OS")} <span class="pill">${escapeHtml(set.lastRun || "recent run")}</span></p>
      <div class="result-table-wrap">
        <table>
          <thead>
            <tr><th>Status</th>${results.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${set.rows.map((row) => renderResultRow(row, results.columns.length)).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderResultRow(row, columnCount) {
  const data = Array.isArray(row.data) ? row.data : [];
  const cells = Array.from({ length: columnCount }, (_, index) => `<td>${escapeHtml(String(data[index] ?? ""))}</td>`).join("");
  return `<tr class="${escapeAttr(row.type || "INFO")}"><td>${escapeHtml(row.type || "INFO")}</td>${cells}</tr>`;
}

function renderEditor(copyFrom) {
  const source = copyFrom ? getModule(copyFrom) : null;
  const module = source ? cloneForEdit(source) : getBlankModule();

  app.innerHTML = `
    <section class="editor-shell">
      <span class="eyebrow">${source ? "Fork experiment" : "New experiment"}</span>
      <h1>${source ? "Fork " + escapeHtml(source.name) : "Create a local experiment"}</h1>
      <p>Your experiment is saved in this browser and can be run immediately. No login, database, or deploy cycle required.</p>
      <form class="form-grid" data-action="save-module">
        <div class="form-field">
          <label for="name">Name</label>
          <input class="input" id="name" name="name" required value="${escapeAttr(module.name)}">
        </div>
        <div class="form-field">
          <label for="type">Type</label>
          <select class="select" id="type" name="type">
            ${renderOption("ENUM_FUNCTION", "Enum function", module.type)}
            ${renderOption("FUZZER", "Fuzzer", module.type)}
          </select>
        </div>
        <div class="form-field full">
          <label for="description">Description</label>
          <input class="input" id="description" name="description" required value="${escapeAttr(module.description)}">
        </div>
        <div class="form-field">
          <label for="tags">Tags</label>
          <input class="input" id="tags" name="tags" value="${escapeAttr(module.tags.join(", "))}">
        </div>
        <div class="form-field">
          <label for="columns">Result columns</label>
          <input class="input" id="columns" name="columns" value="${escapeAttr(module.results.columns.join(", "))}">
        </div>
        <div class="form-field full" data-enum-field>
          <label for="enumData">Enum data</label>
          <textarea class="textarea" id="enumData" name="enumData" spellcheck="false">${escapeHtml(module.test.enumData || "var data = ['window', 'document'];")}</textarea>
        </div>
        <div class="form-field full" data-fuzz-field hidden>
          <label for="fuzzData">Fuzz data</label>
          <textarea class="textarea" id="fuzzData" name="fuzzData" spellcheck="false">${escapeHtml(module.test.fuzzData || "<div>payload</div>")}</textarea>
        </div>
        <div class="form-field full">
          <label for="userScript">User script</label>
          <textarea class="textarea" id="userScript" name="userScript" required spellcheck="false">${escapeHtml(module.test.userScript)}</textarea>
        </div>
        <div class="form-field">
          <label for="timeout">Timeout per item</label>
          <input class="input" id="timeout" name="timeout" type="number" min="250" max="10000" step="250" value="${Number(module.test.timeout || 2000)}">
        </div>
        <div class="form-field">
          <label>&nbsp;</label>
          <div class="button-row">
            <button class="button" type="submit">Save</button>
            <a class="button secondary" href="/modules">Cancel</a>
          </div>
        </div>
      </form>
    </section>
  `;

  syncEditorType();
}

function renderRunner(id) {
  const module = getModule(id);
  if (!module) {
    app.innerHTML = renderError("Experiment not found.", "The runner needs a valid experiment id.");
    return;
  }

  app.innerHTML = `
    <section class="runner-shell">
      <span class="eyebrow">${formatType(module.type)} runner</span>
      <h1>${escapeHtml(module.name)}</h1>
      <p>${escapeHtml(module.description)}</p>
      <div class="runner-console">
        <div class="progress-track" aria-label="Run progress"><div class="progress-fill" data-progress></div></div>
        <p data-status>Ready to run ${escapeHtml(module.name)}.</p>
        <div class="button-row">
          <button class="button" type="button" data-action="start-run" data-id="${module.id}">Start run</button>
          <a class="button secondary" href="/module/${module.id}">Back to experiment</a>
        </div>
        <section data-results></section>
      </div>
    </section>
  `;
}

function renderAbout() {
  app.innerHTML = `
    <section class="hero-strip">
      <div>
        <span class="eyebrow">About</span>
        <h1>DomStorm, rebuilt as DOM Lab.</h1>
        <p class="hero-copy">The original app mixed Express, MongoDB, Twitter OAuth, EJS, jQuery, and Bootstrap. This version keeps the browser experiment idea and moves delivery to Cloudflare Workers with static edge assets and a small Worker API.</p>
      </div>
    </section>
    <section class="workspace">
      <div class="panel">
        <h2>What changed</h2>
        <p>Seed experiments are served from JSON, custom experiments are local-first, and the runner uses sandboxed iframes with postMessage instead of server-rendered harness pages.</p>
        <p>Legacy URLs such as <code>/modules?id=...</code> redirect to the new routes, so old links degrade gracefully.</p>
      </div>
      <aside class="sidebar">
        <section class="panel">
          <h2>Edge checks</h2>
          <ul class="list-plain">
            <li>Cloudflare Worker shell</li>
            <li>Strict response headers</li>
            <li>Offline-capable service worker</li>
            <li>No runtime npm dependencies</li>
          </ul>
        </section>
      </aside>
    </section>
  `;
}

function renderNotFound() {
  app.innerHTML = renderError("That page does not exist.", "Try the experiment catalog instead.");
}

async function handleDocumentClick(event) {
  const link = event.target.closest("a[href]");
  if (link && link.origin === location.origin && !link.hasAttribute("download")) {
    event.preventDefault();
    history.pushState(null, "", link.href);
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "start-run") {
    event.preventDefault();
    await startRun(event.target.closest("[data-id]").dataset.id);
  }

  if (action === "delete-module") {
    event.preventDefault();
    deleteModule(event.target.closest("[data-id]").dataset.id);
  }
}

document.addEventListener("submit", (event) => {
  const form = event.target.closest("form[data-action]");
  if (!form) return;

  event.preventDefault();
  if (form.dataset.action === "search") {
    const data = new FormData(form);
    const params = new URLSearchParams();
    if (data.get("q")) params.set("q", data.get("q").toString().trim());
    if (data.get("filter") && data.get("filter") !== "all") params.set("filter", data.get("filter"));
    const query = params.toString();
    history.pushState(null, "", `/modules${query ? `?${query}` : ""}`);
    render();
  }

  if (form.dataset.action === "save-module") {
    saveModule(form);
  }
});

document.addEventListener("change", (event) => {
  if (event.target.matches("select[name='type']")) syncEditorType();
});

async function startRun(id) {
  const module = getModule(id);
  const status = document.querySelector("[data-status]");
  const progress = document.querySelector("[data-progress]");
  const output = document.querySelector("[data-results]");
  const dataItems = readDataItems(module);

  if (!dataItems.length) {
    status.textContent = "No data items were found for this experiment.";
    return;
  }

  const rows = [];
  let completed = 0;
  const concurrency = Math.max(1, Math.min(8, navigator.hardwareConcurrency || 4, dataItems.length));
  let cursor = 0;

  status.textContent = `Running ${dataItems.length} item(s) across ${concurrency} sandboxed frame(s)...`;
  output.innerHTML = "";

  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (cursor < dataItems.length) {
        const item = dataItems[cursor++];
        const result = await runSingleItem(module, item);
        rows.push(...result);
        completed += 1;
        progress.style.width = `${Math.round((completed / dataItems.length) * 100)}%`;
        status.textContent = `Completed ${completed} of ${dataItems.length}`;
      }
    })
  );

  const browser = getBrowserInfo();
  const uniqueRows = uniqueResults(rows);
  saveRun(module, browser, uniqueRows);
  status.textContent = `Done. Saved ${uniqueRows.length} row(s) for ${browser.name}.`;
  output.innerHTML = renderResultSet(browser.name, {
    columns: module.results.columns,
    browsers: {
      [browser.name]: {
        rows: uniqueRows,
        version: browser.version,
        os: browser.os,
        lastRun: new Date().toLocaleString()
      }
    }
  });
}

function runSingleItem(module, item) {
  return new Promise((resolve) => {
    const token = crypto.randomUUID();
    const rows = [];
    const timeout = Number(module.test.timeout || 2000);
    const iframe = document.createElement("iframe");
    iframe.className = "runner-frame";
    iframe.sandbox = "allow-scripts";
    iframe.srcdoc = buildRunnerDocument(token, module.test.userScript, item);

    const timer = setTimeout(() => finish([{ type: "ERROR", data: [stringifyData(item), `Timed out after ${timeout}ms`] }]), timeout);

    function onMessage(event) {
      if (!event.data || event.data.token !== token) return;
      if (event.data.type === "__DONE__") {
        finish(rows.length ? rows : [{ type: "INFO", data: [stringifyData(item), "completed without output"] }]);
        return;
      }
      rows.push({ type: event.data.type || "INFO", data: event.data.data || [] });
    }

    function finish(result) {
      clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      iframe.remove();
      resolve(result);
    }

    window.addEventListener("message", onMessage);
    document.body.appendChild(iframe);
  });
}

function buildRunnerDocument(token, userScript, item) {
  return `<!doctype html><meta charset="utf-8"><script>
    const TOKEN = ${JSON.stringify(token)};
    const DATA = ${JSON.stringify(item)};
    const send = (type, data) => parent.postMessage({ token: TOKEN, type, data: Array.from(data, String) }, "*");
    window.addResult = (...args) => send("SUCCESS", args);
    window.addSuccess = (...args) => send("SUCCESS", args);
    window.addInfo = (...args) => send("INFO", args);
    window.addError = (...args) => send("ERROR", args);
    window.addNone = () => {};
    Promise.resolve().then(async () => {
      ${userScript}
      if (typeof test !== "function") throw new Error("function test(data) is not defined");
      await test(DATA);
    }).then(() => send("__DONE__", [])).catch((error) => {
      send("ERROR", [String(DATA), error.name + ": " + error.message]);
      send("__DONE__", []);
    });
  <\/script>`;
}

function readDataItems(module) {
  if (module.type === "FUZZER") {
    return String(module.test.fuzzData || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  try {
    const value = Function(`${module.test.enumData || ""}; return typeof data === "undefined" ? [] : data;`)();
    if (Array.isArray(value)) return value;
    if (value && typeof value[Symbol.iterator] === "function") return [...value];
    return [];
  } catch (error) {
    return [`Enum data error: ${error.message}`];
  }
}

function saveRun(module, browser, rows) {
  const overrides = readJson(STORAGE_KEYS.results, {});
  const existing = overrides[module.id] || { columns: module.results.columns, browsers: {} };
  existing.columns = module.results.columns;
  existing.browsers[browser.name] = {
    rows,
    version: browser.version,
    os: browser.os,
    lastRun: new Date().toLocaleString()
  };
  overrides[module.id] = existing;
  state.resultOverrides = overrides;
  writeJson(STORAGE_KEYS.results, overrides);
}

function saveModule(form) {
  const data = new FormData(form);
  const type = data.get("type").toString();
  const id = slugify(data.get("name").toString()) || crypto.randomUUID();
  const module = {
    id: uniqueLocalId(id),
    local: true,
    name: data.get("name").toString().trim(),
    description: data.get("description").toString().trim(),
    type,
    owner: "Local",
    created: new Date().toISOString(),
    viewCount: 0,
    favorites: 0,
    tags: splitCsv(data.get("tags").toString()),
    test: {
      timeout: Number(data.get("timeout") || 2000),
      enumData: type === "ENUM_FUNCTION" ? data.get("enumData").toString() : "",
      fuzzData: type === "FUZZER" ? data.get("fuzzData").toString() : "",
      userScript: data.get("userScript").toString()
    },
    results: {
      columns: splitCsv(data.get("columns").toString()),
      browsers: {}
    }
  };

  state.localModules = [module, ...state.localModules];
  writeJson(STORAGE_KEYS.modules, state.localModules);
  showToast("Experiment saved locally.");
  history.pushState(null, "", `/module/${module.id}`);
  render();
}

function deleteModule(id) {
  const module = getModule(id);
  if (!module?.local) return;
  if (!confirm(`Delete "${module.name}" from this browser?`)) return;
  state.localModules = state.localModules.filter((item) => item.id !== id);
  delete state.resultOverrides[id];
  writeJson(STORAGE_KEYS.modules, state.localModules);
  writeJson(STORAGE_KEYS.results, state.resultOverrides);
  showToast("Local experiment deleted.");
  history.pushState(null, "", "/modules?filter=local");
  render();
}

function getAllModules() {
  return [
    ...state.localModules.map((module) => ({ ...module, local: true })),
    ...state.seedModules.map((module) => ({ ...module, local: false }))
  ];
}

function getModule(id) {
  return getAllModules().find((module) => module.id === id);
}

function getFilteredModules() {
  const query = state.query.toLowerCase().trim();
  return getAllModules().filter((module) => {
    if (state.filter === "local" && !module.local) return false;
    if (state.filter === "seed" && module.local) return false;
    if (!query) return true;
    const haystack = [module.name, module.description, module.type, ...(module.tags || [])].join(" ").toLowerCase();
    return haystack.includes(query);
  });
}

function getResults(module) {
  const overrides = state.resultOverrides[module.id];
  if (!overrides) return module.results;
  return {
    columns: overrides.columns || module.results.columns,
    browsers: { ...(module.results.browsers || {}), ...(overrides.browsers || {}) }
  };
}

function getTotals(modules) {
  const tags = new Set();
  let runs = 0;
  for (const module of modules) {
    module.tags.forEach((tag) => tags.add(tag));
    runs += Object.keys(getResults(module).browsers || {}).length;
  }
  return { modules: modules.length, tags: tags.size, runs };
}

function incrementView(id) {
  state.viewCounts[id] = (state.viewCounts[id] || 0) + 1;
  writeJson(STORAGE_KEYS.views, state.viewCounts);
}

function getViewCount(module) {
  return Number(module.viewCount || 0) + Number(state.viewCounts[module.id] || 0);
}

function getBlankModule() {
  return {
    name: "Untitled experiment",
    description: "Describe the browser behavior you want to inspect.",
    type: "ENUM_FUNCTION",
    tags: ["dom"],
    test: {
      timeout: 2000,
      enumData: "var data = ['window', 'document'];",
      fuzzData: "<div>payload</div>",
      userScript: "function test(data) {\n  addInfo(String(data), Object.prototype.toString.call(window[data]));\n}"
    },
    results: {
      columns: ["Input", "Observation"]
    }
  };
}

function cloneForEdit(source) {
  return {
    ...source,
    name: `${source.name} copy`,
    tags: [...source.tags],
    test: { ...source.test },
    results: { columns: [...source.results.columns] }
  };
}

function syncEditorType() {
  const type = document.querySelector("select[name='type']")?.value;
  const enumField = document.querySelector("[data-enum-field]");
  const fuzzField = document.querySelector("[data-fuzz-field]");
  if (!type || !enumField || !fuzzField) return;
  enumField.hidden = type !== "ENUM_FUNCTION";
  fuzzField.hidden = type !== "FUZZER";
}

function getBrowserInfo() {
  const ua = navigator.userAgent;
  const match = ua.match(/(Edg|Chrome|Firefox|Safari)\/([\d.]+)/);
  const nameMap = { Edg: "Edge" };
  const raw = match?.[1] || "Browser";
  return {
    name: nameMap[raw] || raw,
    version: match?.[2] || "unknown",
    os: navigator.platform || "unknown"
  };
}

function uniqueResults(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = JSON.stringify(row);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function renderCode(code) {
  return `<div class="code-block"><pre><code>${escapeHtml(code || "")}</code></pre></div>`;
}

function renderTag(tag) {
  return `<span class="tag">${escapeHtml(tag)}</span>`;
}

function renderOption(value, label, selected) {
  return `<option value="${escapeAttr(value)}"${value === selected ? " selected" : ""}>${escapeHtml(label)}</option>`;
}

function renderEmpty(message) {
  return `<div class="empty-state"><p>${escapeHtml(message)}</p></div>`;
}

function renderError(title, detail) {
  return `<section class="empty-state"><div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(detail)}</p><a class="button" href="/modules">Open experiments</a></div></section>`;
}

function formatType(type) {
  return type === "FUZZER" ? "Fuzzer" : "Enum function";
}

function splitCsv(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueLocalId(base) {
  const ids = new Set(getAllModules().map((module) => module.id));
  let id = base;
  let index = 2;
  while (ids.has(id)) {
    id = `${base}-${index++}`;
  }
  return id;
}

function stringifyData(value) {
  return typeof value === "string" ? value : JSON.stringify(value);
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2400);
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
}
