import { showHUD, showToast, Toast } from "@raycast/api";
import { runAppleScript } from "run-applescript";
import fs from "fs/promises";
import path from "path";

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
  const screenshotPath = await takeScreenshot();

  if (screenshotPath === null) {
    await showHUD("Screenshot cancelled by user.");
    return;
  }

  try {
    await showHUD("Processing screenshot...");
    await copyScreenshotToClipboard(screenshotPath);
    await openChatGPTInSafari();
    await sendPromptToChatGPT();
    await showHUD("Screenshot and prompt sent to ChatGPT in Safari.");
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

async function cleanupTempScreenshot(path: string) {
  try {
    await fs.unlink(path);
  } catch (error) {
    console.error(`Failed to delete temporary screenshot: ${error}`);
  }
}
