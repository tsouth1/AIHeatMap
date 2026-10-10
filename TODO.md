# TODO

Open work for the AI Ecosystem Navigator POC. Live site: https://tsouth1.github.io/AIHeatMap/

Scope and acceptance criteria are in `POC_PLAN.md`.

## Index

1. [x] [Fix six resource links in `concepts.json`](#1-fix-six-resource-links-in-conceptsjson)
2. [ ] [Check the OpenAI Tokenizer link in a browser](#2-check-the-openai-tokenizer-link-in-a-browser)
3. [ ] [Point the tool-use link at its final URL](#3-point-the-tool-use-link-at-its-final-url)
4. [ ] [Non-expert review of definitions](#4-non-expert-review-of-definitions)
5. [ ] [Check the live site on a phone](#5-check-the-live-site-on-a-phone)
6. [ ] [Run the self-check against the acceptance criteria](#6-run-the-self-check-against-the-acceptance-criteria)
7. [ ] [Run the five-person test](#7-run-the-five-person-test)
8. [ ] [Answer the open decisions](#8-answer-the-open-decisions)

---

## 1. Fix six resource links in `concepts.json`

**Done 2026-10-10.**

Found by the link check on 2026-10-10. Every suggested replacement returned 200. Make the changes in `data/concepts.json` and push to `main`; GitHub Pages redeploys automatically.

| Concept | Current resource | Problem | Replacement |
|---|---|---|---|
| `embedding` | Embeddings (Google ML Crash Course): `developers.google.com/machine-learning/crash-course/embeddings/embedding-spaces` | 404 | https://developers.google.com/machine-learning/crash-course/embeddings |
| `inference` | Inference (Google ML Crash Course): `.../crash-course/framing/ml-terminology` | Redirects to "Supervised Learning" | https://developers.google.com/machine-learning/glossary#inference |
| `training` | Training and loss (Google ML Crash Course): `.../linear-regression/gradient-descent` | Page is "Linear regression: Gradient descent" | https://developers.google.com/machine-learning/crash-course/linear-regression/loss |
| `context-window` | Large language model (overview): Wikipedia | Same link as `llm`; not about context windows | https://platform.claude.com/docs/en/build-with-claude/context-windows |
| `supervised-learning` | Machine Learning Crash Course (Google): course home page | Generic landing page; same link as `machine-learning` | https://developers.google.com/machine-learning/intro-to-ml/supervised |
| `guardrails` | AI safety (overview): Wikipedia | Covers the whole field, not guardrails | https://github.com/NVIDIA-NeMo/Guardrails |

Update each resource's `title` to match the new page. Done when the JSON still parses, every `related.id` resolves, and the six links open the right pages on the live site.

## 2. Check the OpenAI Tokenizer link in a browser

`token` → https://platform.openai.com/tokenizer returns 200 but renders with JavaScript, so the automated check only saw "OpenAI Platform". Open it in a browser and confirm the tokenizer tool is there. Replace it if not.

## 3. Point the tool-use link at its final URL

Optional. The `tool-use` link on `docs.anthropic.com` redirects to https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview. Link there directly.

## 4. Non-expert review of definitions

Have one non-technical person read all 30 definitions and mark any they don't understand. Rewrite the marked ones (2 to 4 sentences each).

## 5. Check the live site on a phone

Open the live site on a phone in portrait and landscape. Confirm the panel stacks below the graph and nodes can be tapped.

## 6. Run the self-check against the acceptance criteria

Click through every concept once and tick off section 7 of `POC_PLAN.md`: panel speed, related-concept navigation, searches for "MCP", "Model Context Protocol" and "rag", load time under 2 seconds.

## 7. Run the five-person test

Recruit five people who know little about AI, give each a task such as "find out what RAG is and what it needs", and watch without helping. Questions and pass threshold are in section 8 of `POC_PLAN.md`. Re-check all resource links just before the test.

## 8. Answer the open decisions

From section 9 of `POC_PLAN.md`:

- Primary persona (recommended: the curious beginner).
- Who writes and reviews the content.
