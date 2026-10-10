# TODO

Open work for the AI Ecosystem Navigator POC. Live site: https://tsouth1.github.io/AIHeatMap/

Scope and acceptance criteria are in `POC_PLAN.md`.

## Index

1. [ ] [Check the OpenAI Tokenizer link in a browser](#1-check-the-openai-tokenizer-link-in-a-browser)
2. [ ] [Point the tool-use link at its final URL](#2-point-the-tool-use-link-at-its-final-url)
3. [ ] [Non-expert review of definitions](#3-non-expert-review-of-definitions)
4. [ ] [Check the live site on a phone](#4-check-the-live-site-on-a-phone)
5. [ ] [Run the self-check against the acceptance criteria](#5-run-the-self-check-against-the-acceptance-criteria)
6. [ ] [Run the five-person test](#6-run-the-five-person-test)
7. [ ] [Answer the open decisions](#7-answer-the-open-decisions)

Completed items are in [TODO.DONE.md](TODO.DONE.md).

---

## 1. Check the OpenAI Tokenizer link in a browser

`token` → https://platform.openai.com/tokenizer returns 200 but renders with JavaScript, so the automated check only saw "OpenAI Platform". Open it in a browser and confirm the tokenizer tool is there. Replace it if not.

## 2. Point the tool-use link at its final URL

Optional. The `tool-use` link on `docs.anthropic.com` redirects to https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview. Link there directly.

## 3. Non-expert review of definitions

Have one non-technical person read all 30 definitions and mark any they don't understand. Rewrite the marked ones (2 to 4 sentences each).

## 4. Check the live site on a phone

Open the live site on a phone in portrait and landscape. Confirm the panel stacks below the graph and nodes can be tapped.

## 5. Run the self-check against the acceptance criteria

Click through every concept once and tick off section 7 of `POC_PLAN.md`: panel speed, related-concept navigation, searches for "MCP", "Model Context Protocol" and "rag", load time under 2 seconds.

## 6. Run the five-person test

Recruit five people who know little about AI, give each a task such as "find out what RAG is and what it needs", and watch without helping. Questions and pass threshold are in section 8 of `POC_PLAN.md`. Re-check all resource links just before the test.

## 7. Answer the open decisions

From section 9 of `POC_PLAN.md`:

- Primary persona (recommended: the curious beginner).
- Who writes and reviews the content.
