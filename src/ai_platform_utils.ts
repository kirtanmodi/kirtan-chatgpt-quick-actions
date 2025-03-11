import { Clipboard, showHUD } from "@raycast/api";
import { runAppleScript } from "run-applescript";

// Define URLs for different AI platforms
export const AI_PLATFORMS = {
	CHATGPT: {
		url: "https://chat.openai.com/",
		selector: "textarea",
		name: "ChatGPT"
	},
	CLAUDE: {
		url: "https://claude.ai/new",
		selector: ".ProseMirror",
		name: "Claude"
	},
	GROK: {
		url: "https://grok.com/",
		selector: ".grok-chat-input",
		name: "Grok"
	}
};

// Default delays
export const LOAD_DELAY = 2000; // 2 seconds
export const PASTE_DELAY = 500; // 0.5 seconds

/**
 * Copy text to clipboard with a prefix
 */
export async function copyTextToClipboard(prefix: string, text: string): Promise<void> {
	try {
		const formattedText = `${prefix}\n\n${text}`;
		await Clipboard.copy(formattedText);
	} catch (error) {
		throw new Error(`Failed to copy text to clipboard: ${error}`);
	}
}

/**
 * Open an AI platform in Safari
 */
export async function openAIPlatformInSafari(url: string): Promise<void> {
	try {
		await runAppleScript(`
      tell application "Safari"
        open location "${url}"
        activate
      end tell
    `);
	} catch (error) {
		throw new Error(`Failed to open AI platform in Safari: ${error}`);
	}
}

/**
 * Focus on the text area in the AI platform
 */
export async function focusTextArea(selector: string): Promise<void> {
	try {
		await runAppleScript(`
      tell application "Safari"
        delay ${LOAD_DELAY / 1000}
        do JavaScript "document.querySelector('${selector}').focus();" in document 1
      end tell
    `);
	} catch (error) {
		throw new Error(`Failed to focus on textarea: ${error}`);
	}
}

/**
 * Paste text and send it
 */
export async function pasteAndSendText(): Promise<void> {
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

/**
 * Send text to an AI platform
 */
export async function sendToAIPlatform(
	text: string,
	prefix: string,
	platformUrl: string,
	selector: string,
	platformName: string
): Promise<void> {
	try {
		await copyTextToClipboard(prefix, text);
		await openAIPlatformInSafari(platformUrl);
		await focusTextArea(selector);
		await pasteAndSendText();

		await showHUD(`${platformName} opened in Safari. Query sent.`);
	} catch (error) {
		console.error("Error:", error);
		await showHUD(`Error: ${error instanceof Error ? error.message : String(error)}`);
	}
} 