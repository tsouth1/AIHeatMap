# AI Ecosystem Navigator: Proof of Concept Plan

**Goal:** A clickable mockup that shows whether an interactive AI concept graph helps beginners understand AI terms.
**Target timeline:** 1 to 2 weeks for one developer.
**Hosting cost:** $0.

---

## 1. What the POC proves

1. A beginner can click a concept on a graph and understand it in under a minute.
2. Showing how concepts connect (for example, RAG relies on embeddings and vector databases) helps more than a glossary list.
3. Learning resources attached to each concept are useful enough to click.

If testers find the graph confusing or the definitions unhelpful, the POC has answered the question and the rest of the PRD can wait.

---

## 2. Scope

### In scope
- One static page with a force-directed graph of about 30 AI concepts.
- Click a node to open a side panel showing its definition, related concepts, and resource links.
- Click a related concept in the panel to move to it.
- A search box that finds a concept by name or alias and centers the graph on it.
- Zoom, pan, and drag nodes.
- Works on a phone-sized screen (the panel can stack below the graph).
- Concept data stored in a single hand-written JSON file.

### Out of scope
- User accounts, login, saved progress.
- Backend, database, or API server.
- Learning paths, trend data, timelines, 3D view, credibility scores.
- Automated content generation with an LLM.
- Admin tools for editing content (edit the JSON file directly).

---

## 3. Technology

Plain web technologies with no build step and no paid services.

| Need | Choice | Why |
|---|---|---|
| Structure and styling | HTML, CSS | No framework to install or learn |
| Logic | Vanilla JavaScript (ES modules) | Keeps the POC to a few files |
| Graph | D3.js v7, loaded from a CDN | Matches the PRD; a single script tag, no install |
| Data | `concepts.json` in the repo | No database needed for about 30 concepts |
| Search | Simple case-insensitive match over names and aliases | Adequate at this size; no search engine needed |
| Hosting | GitHub Pages (free for public repos) | Your repo is already on GitHub |
| Editor | Any text editor and a browser | No Node.js required |

**Optional:** Use a local server such as `python -m http.server` for testing, since browsers block loading JSON files directly from disk. Python is probably already installed on most machines.

**Deliberately excluded:** Next.js, React, NestJS, Neo4j, PostgreSQL, OpenSearch, Three.js, Tailwind, Zustand, Auth providers. Each can return after the POC proves value.

---

## 4. File layout

```
AIHeatMap/
├── index.html        # Page layout: header, search, graph, side panel
├── style.css         # Basic styling and responsive layout
├── app.js            # Loads data, draws graph, handles clicks and search
├── data/
│   └── concepts.json # All concepts, relationships, and resources
└── README.md         # How to run locally and how to add a concept
```

---

## 5. Data format

Each concept is one object. Relationship types come from the PRD list: `related_to`, `depends_on`, `part_of`, `alternative_to`, `uses`, `extends`.

```json
{
  "concepts": [
    {
      "id": "rag",
      "name": "RAG",
      "aliases": ["Retrieval-Augmented Generation"],
      "category": "technique",
      "summary": "Lets an AI model look up documents before answering.",
      "definition": "Retrieval-Augmented Generation (RAG) is a method where a system retrieves relevant documents and gives them to a language model so its answer is based on that content.",
      "related": [
        { "id": "vector-database", "type": "depends_on" },
        { "id": "embeddings", "type": "depends_on" },
        { "id": "llm", "type": "uses" }
      ],
      "resources": [
        { "title": "Title of resource", "type": "video", "url": "https://example.com" }
      ]
    }
  ]
}
```

**Rules for content:**
- Write each definition by hand, and keep it to 2 to 4 sentences.
- Every resource link must be checked by hand before it is added.
- Only link to sources you are allowed to link to (official docs, university pages, well-known channels).
- Each concept needs at least one resource and at least one relationship.

**Seed concepts (about 30):** LLM, Token, Context Window, Embedding, Vector Database, RAG, Transformer, Attention, Neural Network, Machine Learning, Deep Learning, Supervised Learning, Reinforcement Learning, Training, Inference, Fine-Tuning, LoRA, Prompt Engineering, Hallucination, Guardrails, AI Agent, Tool Use, MCP, Multimodal Model, Diffusion Model, Computer Vision, Natural Language Processing, Chatbot, Benchmark, Open-Source Model.

---

## 6. Build steps

### Step 1: Content (2 to 3 days)
- Write the 30 concepts into `concepts.json`.
- Check every resource link.
- Have one non-technical person read the definitions and mark any they don't understand.

### Step 2: Static page and graph (2 to 3 days)
- Build `index.html` with a header, search box, graph area, and empty side panel.
- Load D3 and draw every concept as a node with its name as a label.
- Draw links between related concepts, styled by relationship type.
- Enable zoom, pan, and node dragging.

### Step 3: Interaction (2 days)
- Clicking a node fills the side panel with name, category, definition, related concepts, and resources.
- Clicking a related concept in the panel moves the graph focus to it.
- Search finds a concept by name or alias and focuses it.
- Add a "reset view" button.

### Step 4: Polish and deploy (2 days)
- Add responsive layout so the panel stacks below the graph on narrow screens.
- Make the page readable: contrast, font size, and a short "how to use" note at the top.
- Write `README.md` with local run instructions and steps to add a concept.
- Enable GitHub Pages on the `main` branch and check the live link on a phone.

---

## 7. Acceptance criteria

- [ ] All seed concepts appear on the graph with readable labels.
- [ ] Clicking any node shows its full panel within 1 second.
- [ ] Every related concept in the panel is clickable and moves the focus.
- [ ] Searching "MCP", "Model Context Protocol", and "rag" each focuses the correct node.
- [ ] All resource links open and point to the intended page.
- [ ] The page works on a phone in both portrait and landscape.
- [ ] The graph loads in under 2 seconds on a typical laptop.
- [ ] No backend, database, or paid service is needed to run or deploy the POC.

---

## 8. Testing the POC

- **Self-check:** Click through every concept once and confirm the links and panel work.
- **Five-person test:** Recruit five people who know little about AI. Give each one a task such as "find out what RAG is and what it needs" and watch without helping.
- **Questions to ask afterward:**
  - Did the graph help you understand how concepts fit together?
  - Which definition was hardest to understand?
  - Would you come back to this? Why or why not?
- **Pass threshold (rough):** At least four of five testers complete the task without help, and at least three say the connections helped.

---

## 9. Risks and decisions

| Risk | Mitigation |
|---|---|
| Definitions are inaccurate or too technical | Hand-write them, then have a non-expert review them |
| Resource links break over time | Limit to stable sources; check links before each test |
| Graph becomes cluttered at 30 nodes | Limit each node to 3 to 5 relationships; test layout early |
| Copyright or terms issues with linked content | Link only; never copy text or thumbnails from sources |
| Scope creep toward the full PRD | Keep the out-of-scope list visible and review it weekly |

**Decisions to make before starting:**
1. Which single persona is the primary target? (Recommended: the curious beginner.)
2. Should the POC be public or private? (GitHub Pages works either way on a public repo; a private repo needs a paid plan for Pages.)
3. Who writes and reviews the content?

---

## 10. Success and next step

If the five-person test passes, the next step is a short second plan that covers:
- A learning path view (the first P1 feature).
- A larger concept set (100 or more).
- Whether a database is needed, based on how often content changes.

If the test fails, revise the layout or definitions before adding anything new.
