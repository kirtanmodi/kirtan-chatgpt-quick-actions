import { getSelectedText, showHUD, Clipboard } from "@raycast/api";
import { runAppleScript } from "run-applescript";

export default async function Command() {
  try {
    // Get the selected text
    const selectedText = await getSelectedText();

    const prefix = "write a response to this, keep it simple and short:\n\n";

    // Copy the text with prefix to clipboard
    await Clipboard.copy(prefix + selectedText);

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
    await showHUD("ChatGPT opened in Safari. Text pasted and sent.");
  } catch (error) {
    console.error("Error:", error);
    await showHUD("Error: Failed to open ChatGPT or paste text in Safari.");
  }
}
