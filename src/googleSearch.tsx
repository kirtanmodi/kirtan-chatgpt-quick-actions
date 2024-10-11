import { getSelectedText, showHUD } from "@raycast/api";
import { runAppleScript } from "run-applescript";

export default async function Command() {
  try {
    // Get the selected text
    const selectedText = await getSelectedText();

    // Encode the selected text for use in a URL
    const encodedText = encodeURIComponent(selectedText);

    // Construct the Google search URL
    const googleSearchUrl = `https://www.google.com/search?q=${encodedText}`;

    // Open Google search in Safari
    await runAppleScript(`
      tell application "Safari"
        open location "${googleSearchUrl}"
        activate
      end tell
    `);

    // Show a HUD to inform the user
    await showHUD("Google search opened in Safari for the selected text.");
  } catch (error) {
    console.error("Error:", error);
    await showHUD("Error: Failed to perform Google search in Safari.");
  }
}
