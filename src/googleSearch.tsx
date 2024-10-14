import { getSelectedText, Clipboard, showHUD } from "@raycast/api";
import { runAppleScript } from "run-applescript";

export default async function Command() {
  try {
    let selectedText;

    try {
      // Try to get the selected text
      selectedText = await getSelectedText();
    } catch (error) {
      console.error("Error getting selected text:", error);
    }

    // If no text is selected or getSelectedText failed, check the clipboard
    if (!selectedText) {
      const { text } = await Clipboard.read();
      if (text) {
        selectedText = text;
      } else {
        await showHUD("No text selected or found in clipboard.");
        return;
      }
    }

    // Encode the text for use in URLs
    const encodedText = encodeURIComponent(selectedText);

    // Construct the Google and Perplexity search URLs
    const googleSearchUrl = `https://www.google.com/search?q=${encodedText}`;
    const perplexitySearchUrl = `https://www.perplexity.com/search?q=${encodedText}`;

    // Open Google search in Safari and Perplexity in a new window, then run keyboard shortcuts
    await runAppleScript(`
      tell application "Safari"
        open location "${googleSearchUrl}"
        activate
        tell application "System Events" to keystroke "z" using {command down, option down}
        
        make new document with properties {URL:"${perplexitySearchUrl}"}
        tell application "System Events" to keystroke "x" using {command down, option down}
      end tell
    `);

    // Show a HUD to inform the user
    await showHUD("Searches opened in Safari with keyboard shortcuts applied.");
  } catch (error) {
    console.error("Error:", error);
    await showHUD("Error: Failed to perform searches or apply shortcuts in Safari.");
  }
}
