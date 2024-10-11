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

    // Encode the text for use in a URL
    const encodedText = encodeURIComponent(selectedText);

    // Construct the YouTube search URL
    const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodedText}`;

    // Open YouTube search in Safari
    await runAppleScript(`
      tell application "Safari"
        open location "${youtubeSearchUrl}"
        activate
      end tell
    `);

    // Show a HUD to inform the user
    await showHUD("YouTube search opened in Safari for the text.");
  } catch (error) {
    console.error("Error:", error);
    await showHUD("Error: Failed to perform YouTube search in Safari.");
  }
}
