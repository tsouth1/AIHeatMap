# AI Ecosystem Navigator (POC)

An interactive graph of AI concepts. Click a node to read its definition, see related concepts, and open learning resources. This is a proof of concept: a static page with no backend, database, or login.

See `POC_PLAN.md` for scope and goals. The original product requirements are in `README.md`.

## Run locally

The page loads `data/concepts.json` with `fetch`, so it must be served over HTTP. Opening `index.html` directly will not work in most browsers.

```bash
cd AIHeatMap
python -m http.server 8000
```

Then open http://localhost:8000 in a browser.

## Deploy with GitHub Pages (free)

1. Push this repo to GitHub.
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select `main`, and folder `/ (root)`.
4. Save. The site appears at `https://<your-username>.github.io/AIHeatMap/` after a minute or two.

## Using the page

- **Click** a node to open its panel.
- **Click** a related concept in the panel to move to it.
- **Search** by name or alias (for example `RAG`, `Model Context Protocol`, `rag`). Arrow keys and Enter select a result.
- **Drag** nodes to rearrange them. **Scroll** or pinch to zoom, and drag empty space to pan.
- **Reset view** returns to the full graph.
- **Leading LLMs** (dashed ring, linked to Large Language Model) has an **Open the LLM chart** button. It opens a table comparing current model families. Searching a family name such as `Gemini` or `DeepSeek` finds this node.
- **Circle size** (top left of the graph) sizes each circle by its keyword's estimated monthly searches, keyword difficulty or cost per click, or makes them all the same size. The side panel shows all three under **Search interest**.
- **Filter resources** (top of the side panel) has a checkbox per tag. Untick a tag to hide every resource that has it, even if its other tags are ticked. Your choices are remembered in this browser. **Show all** clears them.

## Adding or editing a concept

All content lives in `data/concepts.json`. Each concept is one object in the `concepts` array:

```json
{
  "id": "rag",
  "name": "RAG",
  "aliases": ["Retrieval-Augmented Generation"],
  "category": "technique",
  "definition": "Two to four sentences written for a beginner.",
  "related": [
    { "id": "embedding", "type": "depends_on" }
  ],
  "resources": [
    { "title": "Readable title", "tags": ["paper", "peer-reviewed", "free"], "url": "https://example.com" }
  ]
}
```

Rules:

- `id` must be unique and lowercase with hyphens. Other concepts refer to it by this id.
- Every `related.id` must match an existing concept `id`. Unknown ids are skipped and logged to the browser console.
- `related.type` must be one of: `related_to`, `depends_on`, `part_of`, `alternative_to`, `uses`, `extends`.
- `category` must be one of: `field`, `concept`, `architecture`, `technique`, `model`, `protocol`, `application`. Each has a colour in the legend. Unknown categories display grey.
- Give each resource one **format** tag, one **source** tag and at least one **cost and intent** tag. The allowed tags are listed in `tagGroups` at the top of `concepts.json`:
  - Format: `video`, `article`, `paper`, `course`, `book`, `docs`, `tool`, `wiki`.
  - Source: `social-media` (YouTube, TikTok and similar), `education` (universities and colleges), `peer-reviewed`, `vendor`, `community`.
  - Cost and intent: `free`, `promotional` (free content used to sell something), `paid`, `subscription`.
- Tag an arXiv paper `peer-reviewed` only if it was published in a reviewed venue. arXiv itself is not peer reviewed.
- To add a tag, add it to the right group in `tagGroups`. The filter box picks it up automatically. Unknown tags are logged to the browser console.
- Check each resource link by hand before committing.

## Keyword metrics

Circle sizes and the **Search interest** panel section read `data/metrics.json`. Each entry, keyed by concept `id`, has:

- `keyword`: the search phrase the numbers describe.
- `avgMonthlySearches`: `low` and `high`, in the same ranges Google Keyword Planner reports (100 to 1K, 1K to 10K, and so on).
- `keywordDifficulty`: 0 to 100, as in Ahrefs and Semrush. Higher means harder to rank for.
- `cpc`: `low` and `high` top-of-page bids in US dollars, as in Google Ads.

**The current numbers are rough hand estimates, not live data.** The page labels them "Estimated" while `estimated` is `true`. To use real numbers, export them from Keyword Planner (needs a Google Ads account), Ahrefs or Semrush (paid), paste them in, update `asOf`, and set `estimated` to `false`. A concept with no entry gets a medium-sized circle.

## Updating the LLM chart

The chart reads `data/llms.json`. Each entry in `models` has `family`, `developer`, `latest`, `released`, `openWeights`, `inputs`, `description`, `uses` and `url`. When you change it, update `asOf` and keep `sources` pointing at where the facts came from. Model versions change every few weeks, so re-check the chart before each user test.

A concept opens the chart when it has `"chart": "llms"`.

## Content notes

- Definitions are hand-written and simplified for beginners. Have a non-expert read them before testing.
- Resource links were written without live verification and have **not yet been checked**. Open each one and fix or remove any that are broken or do not match the title before the first user test.
- Only link to sources you are allowed to link to. Do not copy text or images from them.

## Project structure

```
index.html          Page layout
style.css           Styling and responsive layout
app.js              Graph, selection, side panel, search
data/concepts.json  All concepts, relationships, and resources
data/llms.json      Leading LLMs chart
data/metrics.json   Keyword metrics used for circle size
POC_PLAN.md         POC scope, steps, and acceptance criteria
POC_README.md       This file
```

## Dependencies

- [D3.js v7](https://d3js.org), loaded from a CDN in `index.html`. No install step.

## Known limits of the POC

- Concept data is edited by hand. There is no admin tool.
- Search matches names and aliases only. It does not search definitions.
- No saved progress, accounts, or learning paths.
- Tested in current desktop browsers. Mobile layout is responsive but not extensively tested.
