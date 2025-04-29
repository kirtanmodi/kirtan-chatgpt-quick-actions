import { Clipboard, showHUD } from "@raycast/api";
import { runAppleScript } from "run-applescript";

// Define URLs for different AI platforms
export const AI_PLATFORMS = {
  CHATGPT: {
    url: "https://chatgpt.com/?temporary-chat=true",
    selector: "textarea",
    name: "ChatGPT",
  },
  CLAUDE: {
    url: "https://claude.ai/new",
    selector: ".ProseMirror",
    name: "Claude",
  },
  GROK: {
    url: "https://grok.com/",
    selector: ".grok-chat-input",
    name: "Grok",
  },
};

// Define browser types
export enum Browser {
  SAFARI = "safari",
  CHROME = "chrome",
}

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
 * Open an AI platform in the selected browser
 */
export async function openAIPlatformInBrowser(url: string, browser: Browser): Promise<void> {
  try {
    if (browser === Browser.SAFARI) {
      await runAppleScript(`
				tell application "Safari"
					open location "${url}"
					activate
				end tell
			`);
    } else if (browser === Browser.CHROME) {
      await runAppleScript(`
				tell application "Google Chrome"
					open location "${url}"
					activate
				end tell
			`);
    }
  } catch (error) {
    throw new Error(`Failed to open AI platform in ${browser}: ${error}`);
  }
}

/**
 * Check if an error is related to Chrome JavaScript permissions
 */
export function isChromeJSPermissionError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("Executing JavaScript through AppleScript is turned off") ||
      error.message.includes("execute front window's active tab javascript"))
  );
}

/**
 * Focus on the text area in the AI platform
 */
export async function focusTextAreaInBrowser(selector: string, browser: Browser): Promise<void> {
  try {
    if (browser === Browser.SAFARI) {
      await runAppleScript(`
				tell application "Safari"
					delay ${LOAD_DELAY / 1000}
					do JavaScript "document.querySelector('${selector}').focus();" in document 1
				end tell
			`);
    } else if (browser === Browser.CHROME) {
      try {
        await runAppleScript(`
				tell application "Google Chrome"
					delay ${LOAD_DELAY / 1000}
					execute front window's active tab javascript "document.querySelector('${selector}').focus();"
				end tell
			`);
      } catch (error) {
        if (isChromeJSPermissionError(error)) {
          throw new Error(
            "Executing JavaScript through AppleScript is turned off. To turn it on, from the Chrome menu bar, go to View > Developer > Allow JavaScript from Apple Events."
          );
        } else {
          throw error;
        }
      }
    }
  } catch (error) {
    throw new Error(`Failed to focus on textarea in ${browser}: ${error}`);
  }
}

/**
 * Paste text and send it
 */
export async function pasteAndSendTextInBrowser(browser: Browser): Promise<void> {
  try {
    if (browser === Browser.SAFARI) {
      await runAppleScript(`
				tell application "Safari"
					tell application "System Events"
						keystroke "v" using command down
						delay ${PASTE_DELAY / 1000}
						keystroke return
					end tell
				end tell
			`);
    } else if (browser === Browser.CHROME) {
      await runAppleScript(`
				tell application "Google Chrome"
					tell application "System Events"
						keystroke "v" using command down
						delay ${PASTE_DELAY / 1000}
						keystroke return
					end tell
				end tell
			`);
    }
  } catch (error) {
    throw new Error(`Failed to paste and send text in ${browser}: ${error}`);
  }
}

/**
 * Send text to an AI platform
 */
export async function sendToAIPlatformWithBrowser(
  text: string,
  prefix: string,
  platformUrl: string,
  selector: string,
  platformName: string,
  browser: Browser
): Promise<void> {
  try {
    await copyTextToClipboard(prefix, text);
    await openAIPlatformInBrowser(platformUrl, browser);
    await focusTextAreaInBrowser(selector, browser);
    await pasteAndSendTextInBrowser(browser);

    await showHUD(`${platformName} opened in ${browser === Browser.SAFARI ? "Safari" : "Chrome"}. Query sent.`);
  } catch (error) {
    console.error("Error:", error);
    await showHUD(`Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Keep the original functions for backward compatibility
export async function openAIPlatformInSafari(url: string): Promise<void> {
  return openAIPlatformInBrowser(url, Browser.SAFARI);
}

export async function focusTextArea(selector: string): Promise<void> {
  return focusTextAreaInBrowser(selector, Browser.SAFARI);
}

export async function pasteAndSendText(): Promise<void> {
  return pasteAndSendTextInBrowser(Browser.SAFARI);
}

export async function sendToAIPlatform(
  text: string,
  prefix: string,
  platformUrl: string,
  selector: string,
  platformName: string
): Promise<void> {
  return sendToAIPlatformWithBrowser(text, prefix, platformUrl, selector, platformName, Browser.SAFARI);
}
