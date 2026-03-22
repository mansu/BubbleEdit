# BubbleEdit

An AI-powered markdown editor that suggests edits through a tree of interactive "bubbles". Ask questions about your document, review diffs, and accept or reject changes hunk by hunk.

## Features

- **Open & save** markdown files directly from disk (no upload)
- **Bubble tree** — each question spawns a bubble with a diff; bubbles can have child bubbles forming a tree
- **Per-hunk accept/reject** — accept or reject individual diff hunks, then apply the whole bubble
- **Parallel questions** — ask multiple questions at once; each bubble loads independently
- **Expert mode** — on file open, the document domain is auto-detected (e.g. "legal contract") and an expert persona is assigned (e.g. "experienced contract attorney"). Domain-specific questions are generated and added to the dropdown alongside standard ones
- **Closed bubble memory** — rejected/closed bubbles are excluded from future AI suggestions
- **Collapse bubbles** — click a bubble header to minimize it and focus on others

## Requirements

- **Node.js** 18+
- **Chrome or Edge** (File System Access API — Firefox/Safari not supported)
- **Anthropic API key**

## Setup

```bash
make install
```

Create the server environment file:

```bash
cp server/.env.example server/.env
# Edit server/.env and add your key:
# ANTHROPIC_API_KEY=sk-ant-...
```

## Running

Start both the API server and frontend in separate terminals:

```bash
# Terminal 1 — API server (port 3001)
make server

# Terminal 2 — Frontend (port 5173)
make frontend
```

Then open **http://localhost:5173** in Chrome or Edge.

## Usage

1. Click **Open File** and select a markdown file
2. The document domain is auto-detected and expert questions are generated
3. Select a question from the dropdown (standard or expert) or type a custom one, then click **Ask**
4. A bubble appears on the right with a diff showing suggested changes
5. Accept or reject individual hunks, then click **✓ Accept All** to apply to the document
6. Ask follow-up questions inside any open or accepted bubble to create child bubbles
7. Click a bubble header to collapse it; click **×** to close and exclude it from future suggestions
8. Click **Save** to write the final document back to disk

## Project Structure

```
bubble_edit/
├── Makefile
├── src/
│   ├── App.vue                    # file open/save, header
│   ├── composables/
│   │   └── useDocument.js         # shared state, diff logic, bubble management
│   ├── services/
│   │   └── api.js                 # fetch calls to backend
│   └── components/
│       ├── DocumentBubble.vue     # root document panel (left)
│       ├── QuestionBubble.vue     # recursive question bubble (right)
│       ├── QuestionSelector.vue   # question dropdown + custom input
│       └── DiffView.vue           # per-hunk diff with accept/reject
└── server/
    └── index.js                   # Express + Anthropic API (3 routes)
```

## API Routes (port 3001)

| Method | Path | Description |
|---|---|---|
| POST | `/api/detect-domain` | Identify document domain and suggest expert persona |
| POST | `/api/generate-questions` | Generate domain-specific expert questions |
| POST | `/api/suggest-edit` | Return full modified document for a given question |
