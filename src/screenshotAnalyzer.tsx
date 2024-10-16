import { showHUD, Detail, ActionPanel, Action, Icon, useNavigation, showToast, Toast } from "@raycast/api";
import { useState, useEffect, useCallback } from "react";
import { runAppleScript } from "run-applescript";
import fs from "fs";
import path from "path";

interface ScreenshotState {
  isLoading: boolean;
  response: string;
  error: string | null;
  screenshotPath: string | null;
}

export default function ScreenshotAnalyzer() {
  const [state, setState] = useState<ScreenshotState>({
    isLoading: true,
    response: "",
    error: null,
    screenshotPath: null,
  });
  const { push } = useNavigation();

  useEffect(() => {
    analyzeScreenshot();
  }, []);

  const takeScreenshot = useCallback(async (): Promise<string> => {
    const script = `
      set screenshotPath to (path to desktop as text) & "temp_screenshot.png"
      do shell script "/usr/sbin/screencapture -i " & quoted form of POSIX path of screenshotPath
      return POSIX path of screenshotPath
    `;
    try {
      return await runAppleScript(script);
    } catch (error) {
      throw new Error(`Failed to take screenshot: ${error}`);
    }
  }, []);

  const analyzeScreenshot = useCallback(async () => {
    try {
      setState((prevState) => ({ ...prevState, isLoading: true, error: null }));
      const path = await takeScreenshot();
      setState((prevState) => ({ ...prevState, screenshotPath: path }));

      await showHUD("Opening ChatGPT in Safari...");

      await copyScreenshotToClipboard(path);
      await openChatGPTInSafari();
      await sendPromptToChatGPT();

      setState((prevState) => ({
        ...prevState,
        response: "Screenshot and prompt sent to ChatGPT in Safari. Please check the browser for results.",
        isLoading: false,
      }));

      // Clean up the temporary screenshot
      if (state.screenshotPath) {
        fs.unlinkSync(state.screenshotPath);
      }
    } catch (error) {
      console.error("Error:", error);
      setState((prevState) => ({
        ...prevState,
        error: `Error: ${error instanceof Error ? error.message : String(error)}`,
        isLoading: false,
      }));
    }
  }, [state.screenshotPath]);

  const copyScreenshotToClipboard = useCallback(async (path: string) => {
    try {
      await runAppleScript(`set the clipboard to (read (POSIX file "${path}") as JPEG picture)`);
    } catch (error) {
      throw new Error(`Failed to copy screenshot to clipboard: ${error}`);
    }
  }, []);

  const openChatGPTInSafari = useCallback(async () => {
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
  }, []);

  const sendPromptToChatGPT = useCallback(async () => {
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
  }, []);

  const saveScreenshot = useCallback(async () => {
    if (!state.screenshotPath) {
      await showToast({ style: Toast.Style.Failure, title: "No screenshot to save" });
      return;
    }

    try {
      const desktopPath = await runAppleScript("return POSIX path of (path to desktop)");
      const screenshotsFolderPath = path.join(desktopPath.trim(), "Raycast_Screenshots");

      if (!fs.existsSync(screenshotsFolderPath)) {
        fs.mkdirSync(screenshotsFolderPath);
      }

      const newPath = path.join(screenshotsFolderPath, `screenshot_analysis_${Date.now()}.png`);
      fs.copyFileSync(state.screenshotPath, newPath);
      await showHUD(`Screenshot saved to ${newPath}`);
    } catch (error) {
      console.error("Error saving screenshot:", error);
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to save screenshot",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }, [state.screenshotPath]);

  return (
    <Detail
      markdown={state.error ? `# Error\n\n${state.error}` : state.response}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Status" text={state.isLoading ? "Processing..." : "Completed"} />
          {state.screenshotPath && (
            <Detail.Metadata.Link
              title="Screenshot Location"
              target={state.screenshotPath}
              text={path.basename(state.screenshotPath)}
            />
          )}
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action
            title="Take New Screenshot"
            onAction={analyzeScreenshot}
            shortcut={{ modifiers: ["cmd"], key: "r" }}
            icon={Icon.Camera}
          />
          {state.screenshotPath && (
            <Action
              title="Save Screenshot"
              onAction={saveScreenshot}
              shortcut={{ modifiers: ["cmd"], key: "s" }}
              icon={Icon.SaveDocument}
            />
          )}
        </ActionPanel>
      }
    />
  );
}
