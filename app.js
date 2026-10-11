/* global d3 */

// ---- Configuration ---------------------------------------------------------

const CATEGORY_COLORS = {
  field: "#a371f7",        // broad areas, e.g. Machine Learning
  concept: "#58a6ff",      // ideas and terms
  architecture: "#39c5cf", // model designs
  technique: "#3fb950",    // methods used to build or use models
  model: "#f0883e",        // specific model types or families
  protocol: "#f778ba",     // standards for connecting systems
  application: "#e3b341",  // what AI is used for
};

const REL_COLORS = {
  related_to: "#5b6b7c",
  depends_on: "#f0883e",
  part_of: "#a371f7",
  alternative_to: "#f85149",
  uses: "#3fb950",
  extends: "#58a6ff",
};

const REL_LABELS = {
  related_to: "Related to",
  depends_on: "Depends on",
  part_of: "Part of",
  alternative_to: "Alternative to",
  uses: "Uses",
  extends: "Extends",
};

// ---- State -----------------------------------------------------------------

let concepts = [];
let byId = new Map();
let neighbors = new Map();
let selectedId = null;

let tagGroups = [];
let tagById = new Map(); // tag id -> { label, group }
let hiddenTags = new Set();
const HIDDEN_TAGS_KEY = "aiheatmap.hiddenTags";

let metricsData = null; // contents of data/metrics.json, or null if it failed to load
let sizeBy = "volume";
const SIZE_BY_KEY = "aiheatmap.sizeBy";
const MIN_R = 6;
const MAX_R = 24;
const DEFAULT_R = 10;

let svg, gRoot, linkSel, nodeSel, simulation, zoomBehavior;
let width = 0;
let height = 0;

const panel = document.getElementById("panel");
const searchInput = document.getElementById("search");
const resultsList = document.getElementById("search-results");
const resetBtn = document.getElementById("reset");

// ---- Start -----------------------------------------------------------------

init().catch((err) => {
  panel.textContent = "Could not load concept data. Run the site from a local server (see README). " + err.message;
});

async function init() {
  const response = await fetch("data/concepts.json");
  if (!response.ok) throw new Error("HTTP " + response.status);
  const json = await response.json();

  concepts = json.concepts;
  byId = new Map(concepts.map((c) => [c.id, c]));
  buildNeighbors();

  tagGroups = json.tagGroups || [];
  buildTagIndex();
  buildFilters();

  metricsData = await loadMetrics();
  try {
    const saved = localStorage.getItem(SIZE_BY_KEY);
    if (saved && (saved === "none" || SIZE_VALUE[saved])) sizeBy = saved;
  } catch {
    // Storage unavailable; use the default.
  }
  buildRadiusScale();

  buildLegend();
  buildGraph();
  bindSearch();
  bindSizeControl();
  bindViewToggle();

  resetBtn.addEventListener("click", () => {
    clearSelection();
    resetView();
  });

  window.addEventListener("resize", () => {
    resize3D();
    measure();
    simulation.force("center", d3.forceCenter(width / 2, height / 2));
    simulation.alpha(0.3).restart();
  });
}

// ---- Data helpers ----------------------------------------------------------

function buildNeighbors() {
  for (const c of concepts) {
    if (!neighbors.has(c.id)) neighbors.set(c.id, new Set());
    for (const rel of c.related || []) {
      if (!byId.has(rel.id)) {
        console.warn(`Concept "${c.id}" links to unknown id "${rel.id}"`);
        continue;
      }
      neighbors.get(c.id).add(rel.id);
      if (!neighbors.has(rel.id)) neighbors.set(rel.id, new Set());
      neighbors.get(rel.id).add(c.id);
    }
  }
}

function buildLinkData() {
  const seen = new Set();
  const out = [];
  for (const c of concepts) {
    for (const rel of c.related || []) {
      if (!byId.has(rel.id)) continue;
      const key = [c.id, rel.id].sort().join("|") + "|" + rel.type;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ source: c.id, target: rel.id, type: rel.type });
    }
  }
  return out;
}

function buildTagIndex() {
  for (const group of tagGroups) {
    for (const tag of group.tags) tagById.set(tag.id, { label: tag.label, group: group.id });
  }
  for (const c of concepts) {
    for (const res of c.resources || []) {
      for (const t of res.tags || []) {
        if (!tagById.has(t)) console.warn(`Resource "${res.title}" has unknown tag "${t}"`);
      }
    }
  }
}

// ---- Resource filters ------------------------------------------------------

function loadHiddenTags() {
  try {
    const saved = JSON.parse(localStorage.getItem(HIDDEN_TAGS_KEY) || "[]");
    return new Set(saved.filter((t) => tagById.has(t)));
  } catch {
    return new Set();
  }
}

function saveHiddenTags() {
  try {
    localStorage.setItem(HIDDEN_TAGS_KEY, JSON.stringify([...hiddenTags]));
  } catch {
    // Storage unavailable (private window, blocked). Filters still work for this visit.
  }
}

// A resource is hidden if any of its tags is unticked.
function isResourceVisible(res) {
  return !(res.tags || []).some((t) => hiddenTags.has(t));
}

function buildFilters() {
  hiddenTags = loadHiddenTags();
  const container = document.getElementById("filter-groups");

  for (const group of tagGroups) {
    const fieldset = document.createElement("fieldset");
    fieldset.appendChild(el("legend", group.label));
    for (const tag of group.tags) {
      const label = document.createElement("label");
      const box = document.createElement("input");
      box.type = "checkbox";
      box.value = tag.id;
      box.checked = !hiddenTags.has(tag.id);
      box.addEventListener("change", () => {
        if (box.checked) hiddenTags.delete(tag.id);
        else hiddenTags.add(tag.id);
        onFiltersChanged();
      });
      label.appendChild(box);
      label.appendChild(document.createTextNode(" " + tag.label));
      fieldset.appendChild(label);
    }
    container.appendChild(fieldset);
  }

  document.getElementById("filter-reset").addEventListener("click", () => {
    hiddenTags.clear();
    for (const box of container.querySelectorAll("input[type=checkbox]")) box.checked = true;
    onFiltersChanged();
  });

  updateFilterCount();
}

function onFiltersChanged() {
  saveHiddenTags();
  updateFilterCount();
  if (selectedId) renderPanel(byId.get(selectedId));
}

function updateFilterCount() {
  document.getElementById("filter-count").textContent = hiddenTags.size
    ? `(${hiddenTags.size} hidden)`
    : "";
}

// ---- Keyword metrics and node size -----------------------------------------

async function loadMetrics() {
  try {
    const response = await fetch("data/metrics.json");
    if (!response.ok) throw new Error("HTTP " + response.status);
    return await response.json();
  } catch (err) {
    console.warn("Keyword metrics not loaded; all circles use the same size.", err);
    return null;
  }
}

function metricsFor(id) {
  return metricsData?.metrics?.[id] || null;
}

// The raw number each "size by" option uses. Ranges use their geometric middle,
// since Keyword Planner ranges span a factor of ten.
const SIZE_VALUE = {
  volume: (m) => Math.sqrt(m.avgMonthlySearches.low * m.avgMonthlySearches.high),
  kd: (m) => m.keywordDifficulty,
  cpc: (m) => (m.cpc.low + m.cpc.high) / 2,
};

let radiusScale = null;

function buildRadiusScale() {
  radiusScale = null;
  const valueOf = SIZE_VALUE[sizeBy];
  if (!valueOf || !metricsData) return;
  const values = concepts.map((c) => metricsFor(c.id)).filter(Boolean).map(valueOf);
  if (!values.length) return;
  // Search volume spans several orders of magnitude, so use a log scale for it.
  radiusScale = (sizeBy === "volume" ? d3.scaleLog() : d3.scaleSqrt())
    .domain(d3.extent(values))
    .range([MIN_R, MAX_R])
    .clamp(true);
}

function nodeRadius(id) {
  const m = metricsFor(id);
  if (!radiusScale || !m) return DEFAULT_R;
  return radiusScale(SIZE_VALUE[sizeBy](m));
}

function bindSizeControl() {
  const select = document.getElementById("size-by");
  const note = document.querySelector(".size-control .size-note");
  if (!metricsData) {
    select.value = "none";
    select.disabled = true;
    note.textContent = "No data";
    return;
  }
  note.hidden = !metricsData.estimated;
  note.title = metricsData.method || "";
  select.value = sizeBy;
  select.addEventListener("change", () => {
    sizeBy = select.value;
    try {
      localStorage.setItem(SIZE_BY_KEY, sizeBy);
    } catch {
      // Storage unavailable; the choice lasts for this visit only.
    }
    applySizes();
  });
}

function applySizes() {
  buildRadiusScale();
  nodeSel.select("circle").transition().duration(400).attr("r", (d) => nodeRadius(d.id));
  nodeSel.select("text").transition().duration(400).attr("x", (d) => nodeRadius(d.id) + 4);
  simulation.force("collide", d3.forceCollide((d) => nodeRadius(d.id) + 16));
  simulation.alpha(0.3).restart();
  resize3DNodes();
}

const compactNumber = new Intl.NumberFormat("en", { notation: "compact" });

function difficultyLabel(kd) {
  if (kd < 30) return "easy";
  if (kd < 50) return "medium";
  if (kd < 70) return "hard";
  return "very hard";
}

function renderMetrics(concept) {
  const m = metricsFor(concept.id);
  if (!m) return;

  const heading = el("h3", "Search interest");
  if (metricsData.estimated) heading.appendChild(el("span", "Estimated", "estimate-badge"));
  panel.appendChild(heading);

  const dl = document.createElement("dl");
  dl.className = "metrics";
  const row = (term, value, hint) => {
    dl.appendChild(el("dt", term));
    const dd = el("dd", value);
    if (hint) dd.appendChild(el("span", " " + hint, "rel-type"));
    dl.appendChild(dd);
  };
  row("Keyword", `"${m.keyword}"`);
  row(
    "Monthly searches",
    `${compactNumber.format(m.avgMonthlySearches.low)} to ${compactNumber.format(m.avgMonthlySearches.high)}`
  );
  row("Keyword difficulty", `${m.keywordDifficulty} / 100`, `(${difficultyLabel(m.keywordDifficulty)})`);
  row("Cost per click", `$${m.cpc.low.toFixed(2)} to $${m.cpc.high.toFixed(2)}`);
  panel.appendChild(dl);
}

// ---- Legend ----------------------------------------------------------------

function buildLegend() {
  const legend = document.getElementById("legend");
  for (const [cat, color] of Object.entries(CATEGORY_COLORS)) {
    const item = document.createElement("span");
    item.style.setProperty("--swatch", color);
    item.textContent = cat;
    legend.appendChild(item);
  }
}

// ---- Graph -----------------------------------------------------------------

function measure() {
  const rect = svg.node().getBoundingClientRect();
  width = rect.width || 800;
  height = rect.height || 600;
}

function buildGraph() {
  svg = d3.select("#graph");
  measure();

  gRoot = svg.append("g");

  zoomBehavior = d3
    .zoom()
    .scaleExtent([0.4, 3])
    .on("zoom", (event) => gRoot.attr("transform", event.transform));
  svg.call(zoomBehavior).on("dblclick.zoom", null);

  // Clicking empty space clears the selection
  svg.on("click", (event) => {
    if (event.target === svg.node()) clearSelection();
  });

  const nodes = concepts.map((c) => ({ id: c.id, name: c.name, category: c.category, hasChart: Boolean(c.chart) }));
  const links = buildLinkData();

  simulation = d3
    .forceSimulation(nodes)
    .force("link", d3.forceLink(links).id((d) => d.id).distance(90).strength(0.6))
    .force("charge", d3.forceManyBody().strength(-260))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide((d) => nodeRadius(d.id) + 16));

  linkSel = gRoot
    .append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("class", "link")
    .attr("stroke", (d) => REL_COLORS[d.type] || REL_COLORS.related_to)
    .attr("stroke-width", 1.5);

  nodeSel = gRoot
    .append("g")
    .attr("class", "nodes")
    .selectAll("g.node")
    .data(nodes, (d) => d.id)
    .join("g")
    .attr("class", (d) => (d.hasChart ? "node has-chart" : "node"))
    .attr("tabindex", 0)
    .attr("role", "button")
    .attr("aria-label", (d) => d.name)
    .call(makeDrag())
    .on("click", (event, d) => {
      event.stopPropagation();
      selectConcept(d.id, { focus: false });
    })
    .on("keydown", (event, d) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectConcept(d.id, { focus: false });
      }
    });

  nodeSel
    .append("circle")
    .attr("r", (d) => nodeRadius(d.id))
    .attr("fill", (d) => CATEGORY_COLORS[d.category] || "#888");

  nodeSel
    .append("text")
    .attr("x", (d) => nodeRadius(d.id) + 4)
    .attr("y", 4)
    .text((d) => d.name);

  simulation.on("tick", () => {
    linkSel
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    nodeSel.attr("transform", (d) => `translate(${d.x},${d.y})`);
  });

  // Start with the full graph visible
  simulation.alpha(1).restart();
}

function makeDrag() {
  return d3
    .drag()
    .on("start", (event, d) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    })
    .on("drag", (event, d) => {
      d.fx = event.x;
      d.fy = event.y;
    })
    .on("end", (event, d) => {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    });
}

// ---- Selection and focus ---------------------------------------------------

function selectConcept(id, { focus = true } = {}) {
  const concept = byId.get(id);
  if (!concept) return;

  selectedId = id;
  const connected = neighbors.get(id) || new Set();

  nodeSel
    .classed("selected", (d) => d.id === id)
    .classed("dimmed", (d) => d.id !== id && !connected.has(d.id));

  linkSel.classed("dimmed", (d) => {
    const s = d.source.id;
    const t = d.target.id;
    return s !== id && t !== id;
  });

  renderPanel(concept);

  refresh3DStyles();
  if (focus) focusNode(id);
}

function clearSelection() {
  selectedId = null;
  nodeSel.classed("selected", false).classed("dimmed", false);
  linkSel.classed("dimmed", false);
  refresh3DStyles();
  panel.innerHTML = "";
  const p = document.createElement("p");
  p.className = "placeholder";
  p.textContent = "Select a concept on the graph to see its definition, related concepts, and resources.";
  panel.appendChild(p);
}

function focusNode(id) {
  if (viewMode === "3d") {
    focusNode3D(id);
    return;
  }
  const node = nodeSel.data().find((d) => d.id === id);
  if (!node || node.x == null) return;

  const scale = 1.4;
  const transform = d3.zoomIdentity
    .translate(width / 2 - node.x * scale, height / 2 - node.y * scale)
    .scale(scale);

  svg.transition().duration(500).call(zoomBehavior.transform, transform);
}

function resetView() {
  if (viewMode === "3d") {
    graph3d?.zoomToFit(600, 40);
    return;
  }
  svg.transition().duration(500).call(zoomBehavior.transform, d3.zoomIdentity);
}

// ---- 3D view ---------------------------------------------------------------
//
// Uses 3d-force-graph (built on three.js). The library is only downloaded the
// first time someone switches to 3D, so the default 2D view stays light.

const GRAPH3D_URL = "https://cdn.jsdelivr.net/npm/3d-force-graph@1.80.1/+esm";
// Must be the same three.js build that 3d-force-graph imports, so the label
// sprites below are compatible with its scene.
const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.186.1/+esm";

const graph3dEl = document.getElementById("graph3d");
let viewMode = "2d";
let graph3d = null;
let THREE = null;

function bindViewToggle() {
  for (const btn of document.querySelectorAll(".view-toggle button")) {
    btn.addEventListener("click", () => setViewMode(btn.dataset.view));
  }
}

async function setViewMode(mode) {
  if (mode === viewMode) return;
  viewMode = mode;
  for (const btn of document.querySelectorAll(".view-toggle button")) {
    btn.setAttribute("aria-pressed", String(btn.dataset.view === mode));
  }

  const is3D = mode === "3d";
  svg.node().style.visibility = is3D ? "hidden" : "visible";
  graph3dEl.hidden = !is3D;

  if (!is3D) {
    graph3d?.pauseAnimation();
    if (selectedId) focusNode(selectedId);
    return;
  }

  if (graph3d) {
    resize3D();
    graph3d.resumeAnimation();
    if (selectedId) focusNode3D(selectedId);
    return;
  }

  graph3dEl.textContent = "Loading 3D view…";
  try {
    const [lib, three] = await Promise.all([import(GRAPH3D_URL), import(THREE_URL)]);
    THREE = three;
    graph3dEl.textContent = "";
    build3D(lib.default);
  } catch (err) {
    graph3dEl.textContent = "Could not load the 3D view. " + err.message;
  }
}

function build3D(ForceGraph3D) {
  const nodes = concepts.map((c) => ({ id: c.id, name: c.name, category: c.category }));
  const links = buildLinkData();
  let fitted = false;

  graph3d = new ForceGraph3D(graph3dEl, { controlType: "orbit" })
    .backgroundColor(getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || "#0f1419")
    .showNavInfo(false)
    .nodeRelSize(6)
    .nodeResolution(16)
    .nodeVal((d) => nodeVal3D(d.id))
    .nodeColor((d) => nodeColor3D(d))
    .nodeOpacity(0.95)
    .nodeLabel(null)
    .nodeThreeObjectExtend(true)
    .nodeThreeObject((d) => makeLabel3D(d))
    .linkColor((l) => linkColor3D(l))
    .linkOpacity(0.55)
    .linkWidth(0.6)
    .onNodeClick((d) => selectConcept(d.id, { focus: true }))
    .onBackgroundClick(() => clearSelection())
    .cooldownTicks(150)
    .onEngineStop(() => {
      if (fitted) return;
      fitted = true;
      if (selectedId) focusNode3D(selectedId);
      else graph3d.zoomToFit(600, 40);
    })
    .graphData({ nodes, links });

  resize3D();
}

function resize3D() {
  if (!graph3d || viewMode !== "3d") return;
  const rect = graph3dEl.getBoundingClientRect();
  graph3d.width(rect.width).height(rect.height);
}

// nodeVal is a volume; 3d-force-graph draws radius = cbrt(val) * nodeRelSize.
// This keeps 3D sizes proportional to the 2D circle sizes.
function nodeVal3D(id) {
  return (nodeRadius(id) / DEFAULT_R) ** 3;
}

function radius3D(id) {
  return (nodeRadius(id) / DEFAULT_R) * 6;
}

function isDimmed3D(id) {
  if (!selectedId) return false;
  return id !== selectedId && !(neighbors.get(selectedId) || new Set()).has(id);
}

function nodeColor3D(d) {
  const base = CATEGORY_COLORS[d.category] || "#888888";
  if (d.id === selectedId) return "#ffffff";
  return isDimmed3D(d.id) ? d3.interpolateRgb(base, "#0f1419")(0.8) : base;
}

function linkColor3D(l) {
  const base = REL_COLORS[l.type] || REL_COLORS.related_to;
  if (!selectedId) return base;
  const s = l.source.id ?? l.source;
  const t = l.target.id ?? l.target;
  return s === selectedId || t === selectedId ? base : "#1c232b";
}

// Text label drawn on a canvas and shown as a sprite that always faces the camera.
function makeLabel3D(d) {
  const fontSize = 48;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const font = `600 ${fontSize}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  ctx.font = font;
  canvas.width = Math.ceil(ctx.measureText(d.name).width) + 24;
  canvas.height = fontSize + 20;
  ctx.font = font;
  ctx.textBaseline = "middle";
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#0f1419";
  ctx.strokeText(d.name, 12, canvas.height / 2);
  ctx.fillStyle = "#e6edf3";
  ctx.fillText(d.name, 12, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  material.opacity = isDimmed3D(d.id) ? 0.2 : 1;
  const sprite = new THREE.Sprite(material);
  const height = 7;
  sprite.scale.set((height * canvas.width) / canvas.height, height, 1);
  sprite.position.set(0, radius3D(d.id) + 5, 0);
  d.label3D = sprite;
  return sprite;
}

function refresh3DStyles() {
  if (!graph3d) return;
  graph3d.nodeColor(graph3d.nodeColor()).linkColor(graph3d.linkColor());
  for (const d of graph3d.graphData().nodes) {
    if (d.label3D) d.label3D.material.opacity = isDimmed3D(d.id) ? 0.2 : 1;
  }
}

function resize3DNodes() {
  if (!graph3d) return;
  graph3d.nodeVal(graph3d.nodeVal());
  for (const d of graph3d.graphData().nodes) {
    if (d.label3D) d.label3D.position.y = radius3D(d.id) + 5;
  }
}

function focusNode3D(id) {
  const node = graph3d?.graphData().nodes.find((d) => d.id === id);
  if (!node || node.x == null) return;
  const distance = 220;
  const length = Math.hypot(node.x, node.y, node.z) || 1;
  const ratio = 1 + distance / length;
  graph3d.cameraPosition(
    { x: node.x * ratio, y: node.y * ratio, z: node.z * ratio },
    { x: node.x, y: node.y, z: node.z },
    1000
  );
}

// ---- Side panel ------------------------------------------------------------

function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text != null) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function renderPanel(concept) {
  panel.innerHTML = "";

  panel.appendChild(el("span", concept.category, "category"));
  panel.appendChild(el("h2", concept.name));

  if (concept.aliases && concept.aliases.length) {
    panel.appendChild(el("p", "Also known as: " + concept.aliases.join(", "), "aliases"));
  }

  panel.appendChild(el("p", concept.definition));

  if (concept.chart === "llms") {
    const open = el("button", "Open the LLM chart", "chart-open");
    open.type = "button";
    open.addEventListener("click", openLlmChart);
    panel.appendChild(open);
  }

  renderMetrics(concept);

  // Related concepts
  panel.appendChild(el("h3", "Related concepts"));
  const relList = document.createElement("ul");
  for (const rel of concept.related || []) {
    const target = byId.get(rel.id);
    if (!target) continue;
    const li = document.createElement("li");
    const btn = el("button", target.name, "related");
    btn.type = "button";
    btn.addEventListener("click", () => selectConcept(target.id, { focus: true }));
    li.appendChild(btn);
    li.appendChild(document.createTextNode(" "));
    li.appendChild(el("span", "(" + (REL_LABELS[rel.type] || rel.type) + ")", "rel-type"));
    relList.appendChild(li);
  }
  if (!relList.children.length) relList.appendChild(el("li", "None listed."));
  panel.appendChild(relList);

  // Resources
  panel.appendChild(el("h3", "Learning resources"));
  const resList = document.createElement("ul");
  const allResources = concept.resources || [];
  const visible = allResources.filter(isResourceVisible);
  for (const res of visible) {
    const li = document.createElement("li");
    const a = el("a", res.title, "resource");
    a.href = res.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    li.appendChild(a);
    const tags = el("span", null, "tags");
    for (const t of res.tags || []) {
      tags.appendChild(el("span", tagById.get(t)?.label || t, "tag"));
    }
    li.appendChild(tags);
    resList.appendChild(li);
  }
  if (!allResources.length) {
    resList.appendChild(el("li", "No resources yet."));
  } else if (!visible.length) {
    const li = el("li", null, "filtered-note");
    const n = allResources.length;
    li.appendChild(document.createTextNode(`Your filters hide ${n === 1 ? "this concept's only resource" : `all ${n} resources`}. `));
    const show = el("button", "Change filters", "related");
    show.type = "button";
    show.addEventListener("click", () => {
      const filters = document.getElementById("filters");
      filters.open = true;
      filters.scrollIntoView({ block: "nearest" });
    });
    li.appendChild(show);
    resList.appendChild(li);
  } else if (visible.length < allResources.length) {
    resList.appendChild(el("li", `${allResources.length - visible.length} more hidden by filters.`, "filtered-note"));
  }
  panel.appendChild(resList);
}

// ---- LLM chart -------------------------------------------------------------

const chartDialog = document.getElementById("chart-dialog");
const chartBody = document.getElementById("chart-body");
let llmData = null;

document.getElementById("chart-close").addEventListener("click", () => chartDialog.close());
// Clicking the backdrop (outside the dialog box) closes it
chartDialog.addEventListener("click", (event) => {
  if (event.target === chartDialog) chartDialog.close();
});

async function openLlmChart() {
  chartDialog.showModal();
  if (llmData) return;

  chartBody.textContent = "Loading…";
  try {
    const response = await fetch("data/llms.json");
    if (!response.ok) throw new Error("HTTP " + response.status);
    llmData = await response.json();
    renderLlmChart(llmData);
  } catch (err) {
    chartBody.textContent = "Could not load the LLM chart. " + err.message;
  }
}

function renderLlmChart(data) {
  chartBody.innerHTML = "";
  chartBody.appendChild(el("p", `As of ${data.asOf}. ${data.note}`, "chart-note"));

  const columns = [
    ["Model family", (m) => {
      const a = el("a", m.family);
      a.href = m.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      const cell = document.createElement("div");
      cell.appendChild(a);
      cell.appendChild(el("div", m.developer, "chart-sub"));
      return cell;
    }],
    ["Latest version", (m) => {
      const cell = el("div", m.latest);
      cell.appendChild(el("div", "Released " + m.released, "chart-sub"));
      return cell;
    }],
    ["What it is", (m) => el("div", m.description)],
    ["Common uses", (m) => el("div", m.uses)],
    ["Reads", (m) => el("div", m.inputs)],
    ["Open weights", (m) => el("div", m.openWeights)],
  ];

  const wrap = el("div", null, "chart-scroll");
  const table = document.createElement("table");
  table.className = "chart-table";
  const headRow = document.createElement("tr");
  for (const [label] of columns) {
    const th = el("th", label);
    th.scope = "col";
    headRow.appendChild(th);
  }
  table.appendChild(document.createElement("thead")).appendChild(headRow);

  const tbody = document.createElement("tbody");
  for (const m of data.models) {
    const tr = document.createElement("tr");
    for (const [label, render] of columns) {
      const td = document.createElement("td");
      td.dataset.label = label;
      td.appendChild(render(m));
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  wrap.appendChild(table);
  chartBody.appendChild(wrap);

  chartBody.appendChild(el("h3", "Sources"));
  const list = document.createElement("ul");
  for (const src of data.sources) {
    const a = el("a", src.title);
    a.href = src.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    list.appendChild(document.createElement("li")).appendChild(a);
  }
  chartBody.appendChild(list);
}

// ---- Search ----------------------------------------------------------------

function findMatches(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const scored = [];
  for (const c of concepts) {
    const names = [c.name, ...(c.aliases || [])].map((n) => n.toLowerCase());
    let score = -1;
    if (names.some((n) => n === q)) score = 0;
    else if (names.some((n) => n.startsWith(q))) score = 1;
    else if (names.some((n) => n.includes(q))) score = 2;
    if (score >= 0) scored.push({ concept: c, score });
  }
  scored.sort((a, b) => a.score - b.score || a.concept.name.localeCompare(b.concept.name));
  return scored.slice(0, 8).map((s) => s.concept);
}

function bindSearch() {
  let matches = [];
  let active = -1;

  function hideResults() {
    resultsList.hidden = true;
    resultsList.innerHTML = "";
    active = -1;
  }

  function choose(concept) {
    searchInput.value = concept.name;
    hideResults();
    selectConcept(concept.id, { focus: true });
  }

  function render() {
    resultsList.innerHTML = "";
    matches.forEach((c, i) => {
      const li = el("li", c.name);
      if (i === active) li.classList.add("active");
      li.addEventListener("mousedown", (e) => {
        e.preventDefault(); // keep focus in the input
        choose(c);
      });
      resultsList.appendChild(li);
    });
    resultsList.hidden = matches.length === 0;
  }

  searchInput.addEventListener("input", () => {
    matches = findMatches(searchInput.value);
    active = matches.length ? 0 : -1;
    render();
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" && matches.length) {
      e.preventDefault();
      active = (active + 1) % matches.length;
      render();
    } else if (e.key === "ArrowUp" && matches.length) {
      e.preventDefault();
      active = (active - 1 + matches.length) % matches.length;
      render();
    } else if (e.key === "Enter") {
      const pick = matches[active] || findMatches(searchInput.value)[0];
      if (pick) choose(pick);
    } else if (e.key === "Escape") {
      hideResults();
    }
  });

  searchInput.addEventListener("blur", hideResults);
}
