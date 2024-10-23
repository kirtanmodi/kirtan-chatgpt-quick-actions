import { getSelectedText, Clipboard, showHUD, getPreferenceValues } from "@raycast/api";
import { runAppleScript } from "run-applescript";

export default async function Command() {
  const preferences = getPreferenceValues();
  const PREFIX = preferences.prefix_perplexity_search || "";

  try {
    let selectedText;

    try {
      selectedText = await getSelectedText();
    } catch (error) {
      console.error("Error getting selected text:", error);
    }

    if (!selectedText) {
      const { text } = await Clipboard.read();
      if (text) {
        selectedText = text;
      } else {
        await showHUD("No text selected or found in clipboard.");
        return;
      }
    }

    const encodedText = encodeURIComponent(PREFIX + selectedText);
    const perplexitySearchUrl = `https://www.perplexity.com/search?q=${encodedText}`;

    await runAppleScript(`
      tell application "Safari"
        open location "${perplexitySearchUrl}"
        activate
      end tell
    `);

    await showHUD("Perplexity search opened in Safari for the text.");
  } catch (error) {
    console.error("Error:", error);
    await showHUD("Error: Failed to perform Perplexity search in Safari.");
  }
}
