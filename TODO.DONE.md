# TODO: Done

Completed items moved from [TODO.md](TODO.md), oldest first.

## Index

1. [x] [Fix six resource links in `concepts.json`](#1-fix-six-resource-links-in-conceptsjson)

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
