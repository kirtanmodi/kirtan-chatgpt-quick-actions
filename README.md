# ChatGPT Quick Actions

One-shot AI actions on selected text in Raycast. API commands support **OpenAI**, **Anthropic (Claude)**, and **Ollama (local)**. Browser commands send queries to ChatGPT, Claude, and Grok websites through Safari or Chrome.

This is a customized version. Install this checkout with `npm run dev`. The [upstream store extension](https://www.raycast.com/alanzchen/chatgpt-quick-actions) does not contain these local changes.

## Features

- Streaming results with preview or paste directly into the current app
- OpenAI default: **GPT-6 Luna**, with per-command model overrides
- Tone choices: professional, casual, academic, concise, creative
- Custom prompts, keyboard bindings, and browser automation
- **Type Text Instead** when a streaming command cannot read selected text
- Estimated token counts and costs in the result preview

## Setup

In Raycast Settings > Extensions > ChatGPT Quick Actions, configure:

| API Provider | Required settings |
|---|---|
| OpenAI (default) | **OpenAI API Key**, **Model** (default: `gpt-6-luna`) |
| Anthropic | **Anthropic API Key**, a Claude **Model**, such as `claude-sonnet-5-5` |
| Ollama | **Ollama Endpoint** (default: `http://localhost:11434`), **Ollama Model** (default: `llama3`) |

Set each command's model to **Follow global model** to use the extension's choice. Updating the extension preserves existing saved choices.

If provider and model do not match, OpenAI uses `gpt-6-luna` and Anthropic uses `claude-haiku-4-5`. Ollama always uses **Ollama Model**, ignoring API model dropdowns. Browser commands use the model selected on the website.

## Usage

- Select text in an app, then run summarize, rewrite, refine, custom, preview, execute, transform, or transform preview.
- Set **Output Mode** to preview or paste directly. Tone is available for summarize, rewrite, refine, and custom.
- In a result preview, **Cmd+R** retries. **Cmd+Shift+R** switches that view to GPT-6.1 Sol (OpenAI only). This is another paid request and costs more than the Luna default; later retries in that view also use Sol.
- If selected text cannot be read, choose **Type Text Instead**, enter text, then **Send to AI**. This works in summarize, rewrite, refine, custom, preview, and transform preview. Manual input is reused on retry. Execute and transform still require selected text.

## Model choices

Catalog updated 2026-09-30. Choices are stored in `package.json`; future models are not discovered or selected automatically. A listed model still needs access through your provider account.

| Provider | Recent choices | Older choices retained |
|---|---|---|
| OpenAI | `gpt-6-luna` (default), `gpt-6.1-sol`, `gpt-6-sol`, `gpt-6-astra` | `gpt-5.2`, `gpt-5.1`, `gpt-5.1-codex`, `gpt-5`, `gpt-5-mini`, `gpt-5-nano`, `gpt-4.1`, `gpt-4.1-mini`, `gpt-4.1-nano` |
| Anthropic | `claude-haiku-4-5`, `claude-sonnet-5-5`, `claude-opus-5-5`, `claude-fable-5-1` | `claude-opus-4-6`, `claude-sonnet-4-6` (global dropdown only) |
| Ollama | Any locally installed model | Configured separately |

Luna is the low-cost choice from the GPT-6 family. Older GPT-5 nano has a lower list price. The newest model is not always the cheapest. See [OpenAI's changelog](https://developers.openai.com/api/docs/changelog) (Luna: 2026-09-22; Sol 6.1: 2026-09-29) and [Claude's catalog](https://platform.claude.com/docs/en/models/overview).

### Cost estimates

Counts use a local GPT-3 tokenizer. Costs use a static price table and visible text, so they are estimates, not provider billing. Hidden reasoning tokens, caching, processing tiers, and provider-specific tokenization are not included. No selected text means no API request and zero cost; failed requests show **Unknown** and may still have been billed. Cumulative tokens cover completed requests in the current view; cumulative cost sums only completed requests with known prices.

## Development

Use macOS with Raycast running and Node **22.22.2 or newer** (required by `@raycast/api` 2.5.3).

```bash
npm ci
npm run dev          # import into Raycast and start hot reload
npm run build        # compile commands and TypeScript
npm run lint         # lint check
npm run fix-lint     # auto-fix lint issues
```

After changing the manifest or model dropdowns, rerun `npm run dev` to refresh Raycast's registered preferences. Press **Ctrl+C** to stop development; the imported extension stays available. See [Raycast's setup guide](https://developers.raycast.com/basics/create-your-first-extension).

Before committing, run lint and build. No test framework is configured. Obtain approval for the expected cost before live, potentially billed API checks.

## Developer handover

Read [CLAUDE.md](CLAUDE.md) for architecture and maintenance rules, or [the simple handover PDF](docs/ai-models-handover.pdf) for the feature walkthrough. To update the PDF, edit `docs/build_handover.py`, install Python `reportlab`, and run:

```bash
python3 docs/build_handover.py
```
