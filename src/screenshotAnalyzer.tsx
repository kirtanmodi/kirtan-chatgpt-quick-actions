import { showHUD, showToast, Toast } from "@raycast/api";
import { runAppleScript } from "run-applescript";
import fs from "fs/promises";
import path from "path";

const SCREENSHOTS_FOLDER = "Raycast_Screenshots";
const TEMP_SCREENSHOT_NAME = "temp_screenshot.png";

export default async function ScreenshotAnalyzer() {
  try {
    await analyzeScreenshot();
  } catch (error) {
    console.error("Error:", error);
    await showToast({
      style: Toast.Style.Failure,
      title: "Error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

async function takeScreenshot(): Promise<string | null> {
  const desktopPath = await runAppleScript("return POSIX path of (path to desktop)");
  const screenshotPath = path.join(desktopPath.trim(), TEMP_SCREENSHOT_NAME);

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
  const path = await takeScreenshot();

  if (path === null) {
    // User cancelled the screenshot
    await showHUD("Screenshot cancelled by user.");
    return;
  }

  await showHUD("Opening ChatGPT in Safari...");

  await copyScreenshotToClipboard(path);
  await openChatGPTInSafari();
  await sendPromptToChatGPT();

  await showHUD("Screenshot and prompt sent to ChatGPT in Safari.");

  // Clean up the temporary screenshot
  await fs.unlink(path).catch(console.error);
}

async function copyScreenshotToClipboard(path: string) {
  try {
    await runAppleScript(`set the clipboard to (read (POSIX file "${path}") as JPEG picture)`);
  } catch (error) {
    throw new Error(`Failed to copy screenshot to clipboard: ${error}`);
  }
}

async function openChatGPTInSafari() {
  const script = `
    tell application "Safari"
      open location "https://chat.openai.com/"
      activate
    end tell
  `;
  try {
    await runAppleScript(script);
  } catch (error) {
    throw new Error(`Failed to open ChatGPT in Safari: ${error}`);
  }
}

async function sendPromptToChatGPT() {
  const promptText =
    "Please analyze this screenshot and describe what you see, try to help me understand what is being discussed, keep it short and concise:";
  const script = `
    tell application "Safari"
      delay 2
      do JavaScript "document.querySelector('textarea').focus();" in document 1
    end tell
    tell application "System Events"
      keystroke "${promptText}"
      keystroke "v" using command down
    end tell
  `;
  try {
    await runAppleScript(script);
  } catch (error) {
    throw new Error(`Failed to send prompt to ChatGPT: ${error}`);
  }
}
