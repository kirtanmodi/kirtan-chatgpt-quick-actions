import { getSelectedText, showHUD, Clipboard } from "@raycast/api";
import { runAppleScript } from "run-applescript";

export default async function Command() {
  try {
    // Get the selected text
    const selectedText = await getSelectedText();

    const prompt = `I want to search for ${selectedText}. Help me refine this Google search query by focusing on [key points or purpose, e.g., accuracy, up-to-date information, or specific sources]. Exclude [any irrelevant terms or websites], and include results from [specific sites, if any]. Provide a search query I can use to get the best results, only give me the query and nothing else, and also provide separately for yt`;

    // Copy the prompt with selected text to clipboard
    await Clipboard.copy(prompt);

    // Open ChatGPT website in Safari
    await runAppleScript(`
      tell application "Safari"
        open location "https://chat.openai.com/"
        activate
      end tell
    `);

    // Wait for the page to load and the textarea to be available
    await runAppleScript(`
      tell application "Safari"
        delay 2 -- Wait for page load
        do JavaScript "document.querySelector('textarea').focus();" in document 1
      end tell
    `);

    // Paste the copied text and send it
    await runAppleScript(`
      tell application "Safari"
        tell application "System Events"
          keystroke "v" using command down -- Paste the text
          delay 0.5
          keystroke return -- Send the message
        end tell
      end tell
    `);

    // Show a HUD to inform the user
    await showHUD("ChatGPT opened in Safari. Query sent for refinement.");
  } catch (error) {
    console.error("Error:", error);
    await showHUD("Error: Failed to open ChatGPT or paste text in Safari.");
  }
}
