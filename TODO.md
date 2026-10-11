# TODO

Open work for the AI Ecosystem Navigator POC. Live site: https://tsouth1.github.io/AIHeatMap/

Scope and acceptance criteria are in `POC_PLAN.md`.

## Index

1. [ ] [Point the tool-use link at its final URL](#1-point-the-tool-use-link-at-its-final-url)
2. [ ] [Non-expert review of definitions](#2-non-expert-review-of-definitions)
3. [ ] [Check the live site on a phone](#3-check-the-live-site-on-a-phone)
4. [ ] [Run the self-check against the acceptance criteria](#4-run-the-self-check-against-the-acceptance-criteria)
5. [ ] [Run the five-person test](#5-run-the-five-person-test)
6. [ ] [Answer the open decisions](#6-answer-the-open-decisions)
7. [ ] [Re-check the Leading LLMs chart data](#7-re-check-the-leading-llms-chart-data)

Completed items are in [TODO.DONE.md](TODO.DONE.md).

---

## 1. Point the tool-use link at its final URL

Optional. The `tool-use` link on `docs.anthropic.com` redirects to https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview. Link there directly.

## 2. Non-expert review of definitions

Have one non-technical person read all 30 definitions and mark any they don't understand. Rewrite the marked ones (2 to 4 sentences each).

## 3. Check the live site on a phone

Open the live site on a phone in portrait and landscape. Confirm the panel stacks below the graph and nodes can be tapped.

## 4. Run the self-check against the acceptance criteria

Click through every concept once and tick off section 7 of `POC_PLAN.md`: panel speed, related-concept navigation, searches for "MCP", "Model Context Protocol" and "rag", load time under 2 seconds.

## 5. Run the five-person test

Recruit five people who know little about AI, give each a task such as "find out what RAG is and what it needs", and watch without helping. Questions and pass threshold are in section 8 of `POC_PLAN.md`. Re-check all resource links just before the test.

## 6. Answer the open decisions

From section 9 of `POC_PLAN.md`:

- Primary persona (recommended: the curious beginner).
- Who writes and reviews the content.

## 7. Re-check the Leading LLMs chart data

`data/llms.json` lists the latest version of 11 model families as of 2026-10-11. Model versions change every few weeks, so re-check each row against the developer's own site just before the five-person test (item 5), then update `asOf`. Steps are in "Updating the LLM chart" in `POC_README.md`.

Rows to look at first:

- **Claude:** the row lists Opus 5.5, Sonnet 5.5 and Haiku 5.5. Check whether Fable 5.1 should be listed too.
- **Mistral:** open weights are marked "Planned (late October 2026)". Update once released.
- **Gemini 4 Argon:** marked limited access. Update if it becomes generally available.

