import { getSelectedText, showHUD, Clipboard, getPreferenceValues } from "@raycast/api";
import { runAppleScript } from "run-applescript";

const CHATGPT_URL = "https://chat.openai.com/";
const LOAD_DELAY = 2000; // 2 seconds
const PASTE_DELAY = 500; // 0.5 seconds

const preferences = getPreferenceValues();
const PREFIX = preferences.prefix_email_composer || "Draft a professional email based on this brief: ";

async function copyTextToClipboard(text: string): Promise<void> {
  try {
    await Clipboard.copy(PREFIX + text);
  } catch (error) {
    throw new Error(`Failed to copy text to clipboard: ${error}`);
  }
}

async function openChatGPTInSafari(): Promise<void> {
  try {
    await runAppleScript(`
					tell application "Safari"
						open location "${CHATGPT_URL}"
						activate
					end tell
				`);
  } catch (error) {
    throw new Error(`Failed to open ChatGPT in Safari: ${error}`);
  }
}

async function focusTextArea(): Promise<void> {
  try {
    await runAppleScript(`
					tell application "Safari"
						delay ${LOAD_DELAY / 1000}
						do JavaScript "document.querySelector('textarea').focus();" in document 1
					end tell
				`);
  } catch (error) {
    throw new Error(`Failed to focus on textarea: ${error}`);
  }
}

async function pasteAndSendText(): Promise<void> {
  try {
    await runAppleScript(`
					tell application "Safari"
						tell application "System Events"
							keystroke "v" using command down
							delay ${PASTE_DELAY / 1000}
							keystroke return
						end tell
					end tell
				`);
  } catch (error) {
    throw new Error(`Failed to paste and send text: ${error}`);
  }
}

export default async function Command() {
  try {
    const selectedText = await getSelectedText();

    await copyTextToClipboard(selectedText);
    await openChatGPTInSafari();
    await focusTextArea();
    await pasteAndSendText();

    await showHUD("ChatGPT opened in Safari. Text pasted and sent.");
  } catch (error) {
    console.error("Error:", error);
    await showHUD(`Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
