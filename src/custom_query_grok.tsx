import { getSelectedText, showHUD, Clipboard, LaunchProps } from "@raycast/api";
import { runAppleScript } from "run-applescript";

const GROK_URL = "https://grok.com/";
const LOAD_DELAY = 2000; // 1 second
const PASTE_DELAY = 500; // 0.5 seconds

async function copyTextToClipboard(prefix: string, text: string): Promise<void> {
  try {
    const formattedText = `${prefix}\n\n${text}`;
    await Clipboard.copy(formattedText);
  } catch (error) {
    throw new Error(`Failed to copy text to clipboard: ${error}`);
  }
}

async function openGrokInSafari(): Promise<void> {
  try {
    await runAppleScript(`
      tell application "Safari"
        open location "${GROK_URL}"
        activate
      end tell
    `);
  } catch (error) {
    throw new Error(`Failed to open Grok in Safari: ${error}`);
  }
}

async function focusTextArea(): Promise<void> {
  try {
    await runAppleScript(`
      tell application "Safari"
        delay ${LOAD_DELAY / 1000}
        do JavaScript "document.querySelector('.grok-chat-input').focus();" in document 1
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

export default async function Command(props: LaunchProps<{ arguments: Arguments.CustomQuery }>) {
  try {
    const selectedText = await getSelectedText();
    const { prefix } = props.arguments;

    await copyTextToClipboard(prefix, selectedText);
    await openGrokInSafari();
    await focusTextArea();
    await pasteAndSendText();

    await showHUD("Grok opened in Safari. Query sent.");
  } catch (error) {
    console.error("Error:", error);
    await showHUD(`Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
