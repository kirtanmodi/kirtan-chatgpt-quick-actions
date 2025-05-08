import { Clipboard, showHUD, closeMainWindow } from "@raycast/api";
import { runAppleScript } from "run-applescript";

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

export enum Browser {
  SAFARI = "safari",
  CHROME = "chrome",
}

export const LOAD_DELAY = 1000;
export const PASTE_DELAY = 500;

export async function copyTextToClipboard(prefix: string, text: string): Promise<void> {
  try {
    const formattedText = `${prefix}\n\n${text}`;
    await Clipboard.copy(formattedText);
  } catch (error) {
    throw new Error(`Failed to copy text to clipboard: ${error}`);
  }
}

export async function openAIPlatformInBrowser(
  url: string,
  browser: Browser,
  tabBehavior: "new" | "reuse" = "reuse"
): Promise<boolean> {
  try {
    await closeMainWindow();

    const baseUrl = url.split("?")[0];
    let tabAlreadyExists = false;

    if (tabBehavior === "reuse") {
      if (browser === Browser.SAFARI) {
        const result = await runAppleScript(`
          tell application "Safari"
            activate
            
            set foundTab to false
            set foundWindow to null
            set foundTabIndex to -1
            
            -- Check all windows and tabs for the URL
            repeat with w in windows
              set tabIndex to 1
              repeat with t in tabs of w
                try
                  if URL of t starts with "${baseUrl}" then
                    set foundTab to true
                    set foundWindow to w
                    set foundTabIndex to tabIndex
                    exit repeat
                  end if
                end try
                set tabIndex to tabIndex + 1
              end repeat
              
              if foundTab then exit repeat
            end repeat
            
            -- Reuse the tab if found, otherwise open a new one
            if foundTab then
              try
                set current tab of foundWindow to tab foundTabIndex of foundWindow
                return "true"
              on error
                -- Fallback if focusing the tab fails
                open location "${url}"
                return "false"
              end try
            else
              open location "${url}"
              return "false"
            end if
          end tell
        `);
        tabAlreadyExists = result === "true";
      } else if (browser === Browser.CHROME) {
        const result = await runAppleScript(`
          tell application "Google Chrome"
            activate
            
            set targetURL to "${baseUrl}"
            set found to false
            
            -- Check all windows and tabs for the URL
            repeat with w in windows
              set tabIndex to 1
              repeat with t in tabs of w
                try
                  if URL of t starts with targetURL then
                    set found to true
                    set active tab index of w to tabIndex
                    return "true"
                    exit repeat
                  end if
                end try
                set tabIndex to tabIndex + 1
              end repeat
              
              if found then exit repeat
            end repeat
            
            -- Open a new tab if none found
            if not found then
              open location "${url}"
              return "false"
            end if
          end tell
        `);
        tabAlreadyExists = result === "true";
      }
    } else {
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
    }

    return tabAlreadyExists;
  } catch (error) {
    throw new Error(`Failed to open AI platform in ${browser}: ${error}`);
  }
}

export function isChromeJSPermissionError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("Executing JavaScript through AppleScript is turned off") ||
      error.message.includes("execute front window's active tab javascript"))
  );
}

export async function focusTextAreaInBrowser(selector: string, browser: Browser, focusDelay: number): Promise<void> {
  try {
    if (browser === Browser.SAFARI) {
      await runAppleScript(`
				tell application "Safari"
					delay ${focusDelay / 1000}
					do JavaScript "document.querySelector('${selector}').focus();" in document 1
				end tell
			`);
    } else if (browser === Browser.CHROME) {
      try {
        await runAppleScript(`
				tell application "Google Chrome"
					delay ${focusDelay / 1000}
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
      try {
        await runAppleScript(`
          tell application "Google Chrome"
            tell application "System Events"
              keystroke "v" using command down
              delay ${PASTE_DELAY / 1000}
              keystroke return
            end tell
          end tell
        `);
      } catch (error) {
        if (isChromeJSPermissionError(error)) {
          await runAppleScript(`
            tell application "System Events"
              delay ${LOAD_DELAY / 1000}
              keystroke "v" using command down
              delay ${PASTE_DELAY / 1000}
              keystroke return
            end tell
          `);
          return;
        } else {
          throw error;
        }
      }
    }
  } catch (error) {
    throw new Error(`Failed to paste and send text in ${browser}: ${error}`);
  }
}

export async function sendToAIPlatformWithBrowser(
  text: string,
  prefix: string,
  platformUrl: string,
  selector: string,
  platformName: string,
  browser: Browser,
  tabBehavior: "new" | "reuse" = "reuse"
): Promise<void> {
  try {
    await copyTextToClipboard(prefix, text);

    const tabWasAlreadyOpen = await openAIPlatformInBrowser(platformUrl, browser, tabBehavior);

    const focusDelay = tabWasAlreadyOpen ? 0 : LOAD_DELAY;

    try {
      await new Promise((resolve) => setTimeout(resolve, focusDelay));

      await focusTextAreaInBrowser(selector, browser, focusDelay);
    } catch (error) {
      if (browser === Browser.CHROME && isChromeJSPermissionError(error)) {
        console.warn(
          "Chrome JavaScript permission error: Please enable 'Allow JavaScript from Apple Events' in Chrome menu: View > Developer"
        );

        await pasteAndSendTextInBrowser(browser);
        await showHUD(
          `${platformName} opened in Chrome. JavaScript permissions not enabled. Text may not be pasted correctly.`
        );
        return;
      } else {
        throw error;
      }
    }

    await pasteAndSendTextInBrowser(browser);

    if (tabWasAlreadyOpen) {
      await showHUD(`${platformName} query sent in existing tab.`);
    } else {
      await showHUD(`${platformName} opened in ${browser === Browser.SAFARI ? "Safari" : "Chrome"}. Query sent.`);
    }
  } catch (error) {
    console.error("Error:", error);
    await showHUD(`Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function openAIPlatformInSafari(url: string): Promise<void> {
  await openAIPlatformInBrowser(url, Browser.SAFARI);
}

export async function focusTextArea(selector: string): Promise<void> {
  return focusTextAreaInBrowser(selector, Browser.SAFARI, LOAD_DELAY);
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
