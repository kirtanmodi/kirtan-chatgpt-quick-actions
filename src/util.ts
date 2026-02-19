import { closeMainWindow } from "@raycast/api";
import { runAppleScript } from "run-applescript";
import { encode } from "@nem035/gpt-3-encoder";

function escapeStringForAppleScript(str: string) {
  return str.replace(/[\\"]/g, "\\$&");
}

export async function sentToSideNote(content: string) {
  const applescript = `
  tell application "SideNotes"
    set f to first folder
    make new note in f with properties { text: "${escapeStringForAppleScript(content.trim())}" }
  end tell
  `;
  await runAppleScriptSilently(applescript);
}

function naiveRound(num: number, decimalPlaces = 0) {
  const p = Math.pow(10, decimalPlaces);
  return Math.round(num * p) / p;
}

export function countToken(content: string) {
  return encode(content).length;
}

// Price per 1M tokens [input, output] in dollars
// Source: https://openai.com/api/pricing/
const MODEL_PRICING: Record<string, [number, number]> = {
  // GPT-5.x family (source: platform.openai.com/docs/pricing, Feb 2026)
  "gpt-5.2": [1.75, 14.0],
  "gpt-5.1": [1.25, 10.0],
  "gpt-5.1-codex": [0.25, 2.0],
  "gpt-5": [1.25, 10.0],
  "gpt-5-mini": [0.25, 2.0],
  "gpt-5-nano": [0.05, 0.4],
  // GPT-4.1 family
  "gpt-4.1": [2.0, 8.0],
  "gpt-4.1-mini": [0.4, 1.6],
  "gpt-4.1-nano": [0.02, 0.15],
  // GPT-4o family
  "gpt-4o": [2.5, 10.0],
  "gpt-4o-mini": [0.15, 0.6],
  // Legacy
  "gpt-4-turbo": [10.0, 30.0],
  "gpt-4": [30.0, 60.0],
  "gpt-3.5-turbo": [0.5, 1.5],
  // Anthropic
  "claude-opus-4-6": [5.0, 25.0],
  "claude-sonnet-4-6": [3.0, 15.0],
  "claude-haiku-4-5": [1.0, 5.0],
};

export function estimatePrice(prompt_token: number, output_token: number, model: string) {
  // price is per 1M tokens in dollars, but we are measuring in cents. Hence the denominator is 10,000
  const pricing = MODEL_PRICING[model];
  if (!pricing) return -1;
  const price = (prompt_token * pricing[0] + output_token * pricing[1]) / 10000;
  return naiveRound(price, 3);
}

export async function runAppleScriptSilently(appleScript: string) {
  await closeMainWindow();
  await runAppleScript(appleScript);
}
