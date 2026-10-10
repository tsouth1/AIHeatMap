# TODO: Done

Completed items moved from [TODO.md](TODO.md), oldest first.

## Index

1. [x] [Fix six resource links in `concepts.json`](#1-fix-six-resource-links-in-conceptsjson)
2. [x] [Check the OpenAI Tokenizer link in a browser](#2-check-the-openai-tokenizer-link-in-a-browser)
3. [x] [Tag resources and add a resource filter](#3-tag-resources-and-add-a-resource-filter)

---

## 1. Fix six resource links in `concepts.json`

**Done 2026-10-10.**

Found by the link check on 2026-10-10. Every suggested replacement returned 200. Changed in `data/concepts.json` and pushed to `main` in `78358ec`; GitHub Pages redeployed automatically.

| Concept | Old resource | Problem | Replacement |
|---|---|---|---|
| `embedding` | Embeddings (Google ML Crash Course): `developers.google.com/machine-learning/crash-course/embeddings/embedding-spaces` | 404 | https://developers.google.com/machine-learning/crash-course/embeddings |
| `inference` | Inference (Google ML Crash Course): `.../crash-course/framing/ml-terminology` | Redirects to "Supervised Learning" | https://developers.google.com/machine-learning/glossary#inference |
| `training` | Training and loss (Google ML Crash Course): `.../linear-regression/gradient-descent` | Page is "Linear regression: Gradient descent" | https://developers.google.com/machine-learning/crash-course/linear-regression/loss |
| `context-window` | Large language model (overview): Wikipedia | Same link as `llm`; not about context windows | https://platform.claude.com/docs/en/build-with-claude/context-windows |
| `supervised-learning` | Machine Learning Crash Course (Google): course home page | Generic landing page; same link as `machine-learning` | https://developers.google.com/machine-learning/intro-to-ml/supervised |
| `guardrails` | AI safety (overview): Wikipedia | Covers the whole field, not guardrails | https://github.com/NVIDIA-NeMo/Guardrails |

Each resource's `title` was updated to match its new page. The JSON parses and every `related.id` resolves.

## 2. Check the OpenAI Tokenizer link in a browser

**Done 2026-10-10.** Kept the link; no change to `concepts.json`.

`token` → https://platform.openai.com/tokenizer returns 200 but renders with JavaScript, so the automated link check only saw "OpenAI Platform".

The user opened the page in their own browser and confirmed the tokenizer tool is there without logging in. Headless browsers get a Cloudflare "Just a moment..." check instead, so automated link checks will always flag this URL; check it by hand. A fallback that automated tools can load is Tiktokenizer, https://tiktokenizer.vercel.app/ (token counts, coloured tokens and token IDs; no character count).

## 3. Tag resources and add a resource filter

**Done 2026-10-10.**

- `data/concepts.json` has a new `tagGroups` list (format, source, cost and intent). Each resource's `type` field was replaced by a `tags` array, and all 30 resources were tagged by hand. The five arXiv papers are tagged `peer-reviewed` because each was published in a reviewed venue (NeurIPS, ICLR, ACM Computing Surveys). The Prompting Guide is tagged `free` and `promotional`, since its site promotes paid courses.
- The side panel has a collapsible **Filter resources** box built from `tagGroups`, with **Show all** to clear it. Each resource shows its tags. When filters hide every resource for a concept, the panel says so and links to the filters. Choices are saved in `localStorage` and the filter still works when storage is blocked.
- `POC_README.md` documents the tags and the filter.
- Tested in headless Edge at desktop and phone widths: filtering, the all-hidden note, remembering choices after a reload, and Show all.

The original request:

Give each resource in `data/concepts.json` a set of tags, then let users filter resources by tag in the UI.

**Tags.** A resource can carry several tags, from different groups:

- **Format:** video, article, paper, course, book, docs, tool, wiki. This replaces the current single `type` field.
- **Source:** social media (YouTube, TikTok and similar), education (for example an accredited college or university), peer reviewed, vendor, community.
- **Cost and intent:** free and informational, promotional (for example free downloads used to sell something), paid, subscription.

Examples:

- A YouTube video: video, social media, plus a cost tag.
- A university course page: course, education, and possibly promotional.
- An arXiv paper: paper, free. Add peer reviewed only if it was published in a reviewed venue, because arXiv itself is not peer reviewed.

**Data.** Add a `tags` array to each resource, and list the allowed tags with their groups in one place so the UI can build the filter from them. Tag all 30 existing resources by hand.

**UI.** Add a filter box with a checkbox per tag, grouped as above. Unchecking a tag hides resources with that tag in the side panel. Show a note when a filter hides every resource for a concept. Remember the choices in the browser if that's easy.

**Decision:** a resource is hidden if any of its tags is unchecked, even when its other tags are checked. For example, unchecking "paid" hides every paid resource.
