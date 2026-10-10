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

  buildLegend();
  buildGraph();
  bindSearch();

  resetBtn.addEventListener("click", () => {
    clearSelection();
    resetView();
  });

  window.addEventListener("resize", () => {
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

  const nodes = concepts.map((c) => ({ id: c.id, name: c.name, category: c.category }));
  const links = buildLinkData();

  simulation = d3
    .forceSimulation(nodes)
    .force("link", d3.forceLink(links).id((d) => d.id).distance(90).strength(0.6))
    .force("charge", d3.forceManyBody().strength(-260))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide(26));

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
    .attr("class", "node")
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
    .attr("r", 10)
    .attr("fill", (d) => CATEGORY_COLORS[d.category] || "#888");

  nodeSel
    .append("text")
    .attr("x", 14)
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

  if (focus) focusNode(id);
}

function clearSelection() {
  selectedId = null;
  nodeSel.classed("selected", false).classed("dimmed", false);
  linkSel.classed("dimmed", false);
  panel.innerHTML = "";
  const p = document.createElement("p");
  p.className = "placeholder";
  p.textContent = "Select a concept on the graph to see its definition, related concepts, and resources.";
  panel.appendChild(p);
}

function focusNode(id) {
  const node = nodeSel.data().find((d) => d.id === id);
  if (!node || node.x == null) return;

  const scale = 1.4;
  const transform = d3.zoomIdentity
    .translate(width / 2 - node.x * scale, height / 2 - node.y * scale)
    .scale(scale);

  svg.transition().duration(500).call(zoomBehavior.transform, transform);
}

function resetView() {
  svg.transition().duration(500).call(zoomBehavior.transform, d3.zoomIdentity);
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
