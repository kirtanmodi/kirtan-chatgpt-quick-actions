import { closeMainWindow, getPreferenceValues, showHUD, showToast, Toast } from "@raycast/api";
import fs from "fs/promises";
import path from "path";
import { runAppleScript } from "run-applescript";
import {
  AI_PLATFORMS,
  Browser,
  focusTextAreaInBrowser,
  isChromeJSPermissionError,
  openAIPlatformInBrowser,
} from "./ai_platform_utils";

const TEMP_SCREENSHOT_NAME = "temp_screenshot.png";

interface Preferences {
  defaultBrowser: string;
  defaultAIService: string;
}

export default async function ScreenshotAnalyzer() {
  try {
    await analyzeScreenshot();
  } catch (error) {
    console.error("Error:", error);

    // Check for Chrome JavaScript permission error
    if (isChromeJSPermissionError(error)) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Chrome JavaScript Permission Error",
        message:
          "Please enable JavaScript from Apple Events in Chrome: View > Developer > Allow JavaScript from Apple Events",
      });
    } else {
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

async function getDesktopPath(): Promise<string> {
  try {
    const desktopPath = await runAppleScript("return POSIX path of (path to desktop)");
    return desktopPath.trim();
  } catch (error) {
    throw new Error(`Failed to get desktop path: ${error}`);
  }
}

async function takeScreenshot(): Promise<string | null> {
  const desktopPath = await getDesktopPath();
  const screenshotPath = path.join(desktopPath, TEMP_SCREENSHOT_NAME);

  const script = `
    try
      do shell script "/usr/sbin/screencapture -i " & quoted form of "${screenshotPath}"
      return "${screenshotPath}"
    on error
      return "cancelled"
    end try
  `;

  try {
    const result = await runAppleScript(script);
    return result === "cancelled" ? null : result;
  } catch (error) {
    throw new Error(`Failed to take screenshot: ${error}`);
  }
}

async function analyzeScreenshot() {
  await closeMainWindow();
  const screenshotPath = await takeScreenshot();

  if (screenshotPath === null) {
    await showHUD("Screenshot cancelled by user.");
    return;
  }

  try {
    await showHUD("Processing screenshot...");
    await copyScreenshotToClipboard(screenshotPath);

    const preferences = getPreferenceValues<Preferences>();
    const globalPreferences = getPreferenceValues();

    // Use command-specific preference if set, otherwise fall back to global preference
    const browserPref = preferences.defaultBrowser || globalPreferences.defaultBrowser;
    const browser = browserPref === "chrome" ? Browser.CHROME : Browser.SAFARI;
    const aiService = preferences.defaultAIService === "claude" ? AI_PLATFORMS.CLAUDE : AI_PLATFORMS.CHATGPT;

    await openAIPlatformInBrowser(aiService.url, browser);

    try {
      await sendPromptToAIService(aiService, browser);
      await showHUD(
        `Screenshot and prompt sent to ${aiService.name} in ${browser === Browser.CHROME ? "Chrome" : "Safari"}.`
      );
    } catch (error) {
      // Check for Chrome JavaScript permission error
      if (isChromeJSPermissionError(error)) {
        throw new Error(
          "Chrome JavaScript permission error: Please enable 'Allow JavaScript from Apple Events' in Chrome menu: View > Developer"
        );
      } else {
        throw error;
      }
    }
  } catch (error) {
    throw new Error(`Failed to analyze screenshot: ${error}`);
  } finally {
    await cleanupTempScreenshot(screenshotPath);
  }
}

async function copyScreenshotToClipboard(path: string) {
  try {
    await runAppleScript(`set the clipboard to (read (POSIX file "${path}") as JPEG picture)`);
  } catch (error) {
    throw new Error(`Failed to copy screenshot to clipboard: ${error}`);
  }
}

async function sendPromptToAIService(
  aiPlatform: typeof AI_PLATFORMS.CHATGPT | typeof AI_PLATFORMS.CLAUDE,
  browser: Browser
) {
  const promptText =
    "Please analyze this screenshot and describe what you see, try to help me understand what is being discussed, keep it short and concise:";

  try {
    if (browser === Browser.CHROME) {
      try {
        await focusTextAreaInBrowser(aiPlatform.selector, browser);
      } catch (error) {
        // For Chrome, if focusing fails due to JavaScript permissions, provide manual instructions
        if (isChromeJSPermissionError(error)) {
          // Only handle typing and pasting without focus
          await runAppleScript(`
            tell application "System Events"
              delay 2
              keystroke "${promptText}"
              keystroke "v" using command down
              delay 0.5
              keystroke return
            end tell
          `);
          return;
        } else {
          throw error;
        }
      }
    } else {
      // Safari should work as normal
      await focusTextAreaInBrowser(aiPlatform.selector, browser);
    }

    // Type in the prompt text
    await runAppleScript(`
      tell application "System Events"
        keystroke "${promptText}"
        keystroke "v" using command down
      end tell
    `);

    // Press Enter/Return to send
    await runAppleScript(`
      tell application "System Events"
        delay 0.5
        keystroke return
      end tell
    `);
  } catch (error) {
    throw new Error(`Failed to send prompt to ${aiPlatform.name}: ${error}`);
  }
}

async function cleanupTempScreenshot(path: string) {
  try {
    await fs.unlink(path);
  } catch (error) {
    console.error(`Failed to delete temporary screenshot: ${error}`);
  }
}
