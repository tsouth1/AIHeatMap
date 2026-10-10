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
7. [ ] [Tag resources and add a resource filter](#7-tag-resources-and-add-a-resource-filter)

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

## 7. Tag resources and add a resource filter

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
