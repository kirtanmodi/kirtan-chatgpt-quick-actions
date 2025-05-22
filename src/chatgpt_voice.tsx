import { getPreferenceValues, showHUD, closeMainWindow } from "@raycast/api";
import { runAppleScript } from "run-applescript";
import { Browser, openAIPlatformInBrowser, isChromeJSPermissionError } from "./ai_platform_utils";

interface Preferences {
  browser?: string;
  tabBehavior?: string;
}

interface GlobalPreferences {
  defaultBrowser: string;
}

const CHATGPT_URL = "https://chatgpt.com/?model=gpt-4-1&temporary-chat=true";
// Primary selector (your provided selector) and fallbacks
const MIC_BUTTON_SELECTORS = [
  "#thread-bottom > div > div > div > form > div > div > div > div > div > div > span:nth-child(1) > button",
  "[data-testid='voice-input-button']",
  "button[aria-label*='voice' i]",
  "button[aria-label*='microphone' i]",
  "button[title*='voice' i]",
  "button[title*='microphone' i]",
];
const LOAD_DELAY = 100;

async function clickMicButtonInBrowser(browser: Browser): Promise<void> {
  try {
    // Try each selector until one works
    for (const selector of MIC_BUTTON_SELECTORS) {
      try {
        const escapedSelector = selector.replace(/'/g, "\\'").replace(/"/g, '\\"');

        if (browser === Browser.SAFARI) {
          await runAppleScript(`
            tell application "Safari"
              delay ${LOAD_DELAY / 1000}
              do JavaScript "var btn = document.querySelector('${escapedSelector}'); if (btn && btn.offsetParent !== null) { btn.click(); }" in document 1
            end tell
          `);
        } else if (browser === Browser.CHROME) {
          await runAppleScript(`
            tell application "Google Chrome"
              delay ${LOAD_DELAY / 1000}
              execute front window's active tab javascript "var btn = document.querySelector('${escapedSelector}'); if (btn && btn.offsetParent !== null) { btn.click(); }"
            end tell
          `);
        }

        // If we get here without error, assume it worked
        return;
      } catch (error) {
        // Try the next selector
        continue;
      }
    }

    throw new Error("Could not find microphone button with any selector");
  } catch (error) {
    if (browser === Browser.CHROME && isChromeJSPermissionError(error)) {
      throw new Error(
        "Executing JavaScript through AppleScript is turned off. To turn it on, from the Chrome menu bar, go to View > Developer > Allow JavaScript from Apple Events."
      );
    }
    throw new Error(`Failed to click microphone button in ${browser}: ${error}`);
  }
}

export default async function Command() {
  try {
    const preferences = getPreferenceValues<Preferences>();
    const globalPreferences = getPreferenceValues<GlobalPreferences>();

    // Determine which browser to use
    const browserPreference = preferences.browser || globalPreferences.defaultBrowser || "safari";
    const browser = browserPreference === "chrome" ? Browser.CHROME : Browser.SAFARI;

    // Determine tab behavior from preferences, defaulting to reuse
    const tabBehavior = (preferences.tabBehavior || "reuse") as "new" | "reuse";

    await closeMainWindow();

    // Open ChatGPT URL
    const tabWasAlreadyOpen = await openAIPlatformInBrowser(CHATGPT_URL, browser, tabBehavior);

    // Wait a bit longer for the page to fully load
    // await new Promise((resolve) => setTimeout(resolve, tabWasAlreadyOpen ? 1000 : LOAD_DELAY));

    // Click the microphone button
    try {
      await clickMicButtonInBrowser(browser);

      if (tabWasAlreadyOpen) {
        await showHUD("ChatGPT voice activated in existing tab.");
      } else {
        await showHUD(
          `ChatGPT voice opened in ${browser === Browser.SAFARI ? "Safari" : "Chrome"} and voice activated.`
        );
      }
    } catch (error) {
      if (browser === Browser.CHROME && isChromeJSPermissionError(error)) {
        await showHUD(
          "ChatGPT opened in Chrome. JavaScript permissions not enabled. Please click the microphone button manually."
        );
      } else {
        console.error("Error clicking microphone button:", error);
        await showHUD("ChatGPT opened, but couldn't activate voice. Please click the microphone button manually.");
      }
    }
  } catch (error) {
    console.error("Error:", error);
    await showHUD(`Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
