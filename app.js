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
  for (const res of concept.resources || []) {
    const li = document.createElement("li");
    const a = el("a", res.title, "resource");
    a.href = res.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    li.appendChild(a);
    li.appendChild(document.createTextNode(" "));
    li.appendChild(el("span", "(" + res.type + ")", "rel-type"));
    resList.appendChild(li);
  }
  if (!resList.children.length) resList.appendChild(el("li", "No resources yet."));
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
