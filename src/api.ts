import { getPreferenceValues } from "@raycast/api";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

const prefs = getPreferenceValues<{
  apikey: string;
  model: string;
  apiProvider: string;
  anthropicApiKey?: string;
  ollamaEndpoint?: string;
  ollamaModel?: string;
}>();

export const apiProvider = prefs.apiProvider || "openai";
export const global_model = prefs.model;

// OpenAI client
export const openai = new OpenAI({
  apiKey: prefs.apikey || "not-set",
});

// Anthropic client (lazy init)
let _anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({
      apiKey: prefs.anthropicApiKey || "",
    });
  }
  return _anthropic;
}

// Ollama client — uses OpenAI SDK pointed at Ollama's OpenAI-compatible endpoint
const ollamaEndpoint = prefs.ollamaEndpoint || "http://localhost:11434";
export const ollamaModel = prefs.ollamaModel || "llama3";
let _ollama: OpenAI | null = null;
function getOllama(): OpenAI {
  if (!_ollama) {
    _ollama = new OpenAI({
      apiKey: "ollama",
      baseURL: `${ollamaEndpoint}/v1`,
    });
  }
  return _ollama;
}

// Unified model resolver
export function getModel(model_override: string): string {
  if (model_override && model_override !== "global") return model_override;
  if (apiProvider === "ollama") return ollamaModel;
  return global_model;
}

// Unified streaming interface
export interface StreamResult {
  text: string;
  done: boolean;
}

export async function* createStream(
  model: string,
  systemPrompt: string,
  userMessage: string
): AsyncGenerator<StreamResult> {
  if (apiProvider === "anthropic") {
    const client = getAnthropic();
    const stream = client.messages.stream({
      model: model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield { text: event.delta.text, done: false };
      }
    }
    yield { text: "", done: true };
  } else {
    // OpenAI or Ollama (both use OpenAI-compatible API)
    const client = apiProvider === "ollama" ? getOllama() : openai;
    const stream = await client.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      stream: true,
    });

    for await (const part of stream) {
      const content = part.choices[0]?.delta?.content;
      if (content) {
        yield { text: content, done: false };
      }
      if (part.choices[0]?.finish_reason === "stop") {
        yield { text: "", done: true };
        return;
      }
    }
    yield { text: "", done: true };
  }
}

// Non-streaming completion (for search refinement, execute, transform commands)
export async function createCompletion(model: string, userMessage: string): Promise<string> {
  if (apiProvider === "anthropic") {
    const client = getAnthropic();
    const response = await client.messages.create({
      model: model,
      max_tokens: 1024,
      messages: [{ role: "user", content: userMessage }],
    });
    const block = response.content[0];
    return block.type === "text" ? block.text.trim() : "";
  } else {
    // OpenAI or Ollama (both use OpenAI-compatible API)
    const client = apiProvider === "ollama" ? getOllama() : openai;
    const response = await client.chat.completions.create({
      model: model,
      messages: [{ role: "user", content: userMessage }],
    });
    return response.choices[0]?.message?.content?.trim() || "";
  }
}
