import { showHUD, Detail, ActionPanel, Action, Icon, useNavigation } from "@raycast/api";
import { useState, useEffect } from "react";
import { runAppleScript } from "run-applescript";
import { openai } from "./api";
import fs from "fs";
import path from "path";

export default function ScreenshotAnalyzer() {
  const [isLoading, setIsLoading] = useState(true);
  const [response, setResponse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [screenshotPath, setScreenshotPath] = useState<string | null>(null);
  const { push } = useNavigation();

  useEffect(() => {
    analyzeScreenshot();
  }, []);

  async function takeScreenshot() {
    const script = `
      set screenshotPath to (path to desktop as text) & "temp_screenshot.png"
      do shell script "/usr/sbin/screencapture -i " & quoted form of POSIX path of screenshotPath
      return POSIX path of screenshotPath
    `;
    return runAppleScript(script);
  }

  async function analyzeScreenshot() {
    try {
      setIsLoading(true);
      setError(null);
      const path = await takeScreenshot();
      setScreenshotPath(path);

      await showHUD("Analyzing screenshot...");
      const base64Image = await runAppleScript(`do shell script "base64 -i '${path}'"`);

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a senior developer analyzing a screenshot. Provide detailed and professional insights about the code or interface shown in the image, keep it simple and short.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this screenshot and provide insights as a senior developer, keep it simple and short :",
              },
              { type: "image_url", image_url: { url: `data:image/png;base64,${base64Image}` } },
            ],
          },
        ],
        max_tokens: 500,
      });

      setResponse(response.choices[0].message.content || "No analysis available.");

      // Clean up the temporary screenshot
      if (screenshotPath) {
        fs.unlinkSync(screenshotPath);
      }
    } catch (error) {
      console.error("Error:", error);
      setError(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function saveScreenshot() {
    if (!screenshotPath) return;
    const desktopPath = await runAppleScript("return POSIX path of (path to desktop)");
    const screenshotsFolderPath = path.join(desktopPath.trim(), "Raycast_Screenshots");

    // Create the screenshots folder if it doesn't exist
    if (!fs.existsSync(screenshotsFolderPath)) {
      fs.mkdirSync(screenshotsFolderPath);
    }

    const newPath = path.join(screenshotsFolderPath, `screenshot_analysis_${Date.now()}.png`);
    fs.copyFileSync(screenshotPath, newPath);
    await showHUD(`Screenshot saved to ${newPath}`);
  }

  return (
    <Detail
      markdown={error ? `# Error\n\n${error}` : response}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Status" text={isLoading ? "Analyzing..." : "Completed"} />
          {screenshotPath && (
            <Detail.Metadata.Link
              title="Screenshot Location"
              target={screenshotPath}
              text={path.basename(screenshotPath)}
            />
          )}
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title="Copy Analysis"
            content={response}
            shortcut={{ modifiers: ["cmd"], key: "c" }}
          />
          <Action
            title="Take New Screenshot"
            onAction={analyzeScreenshot}
            shortcut={{ modifiers: ["cmd"], key: "r" }}
            icon={Icon.Camera}
          />
          {screenshotPath && (
            <Action
              title="Save Screenshot"
              onAction={saveScreenshot}
              shortcut={{ modifiers: ["cmd"], key: "s" }}
              icon={Icon.SaveDocument}
            />
          )}
          <Action
            title="Show Full Screen"
            onAction={() => push(<Detail markdown={response} />)}
            shortcut={{ modifiers: ["cmd"], key: "f" }}
            icon={Icon.Maximize}
          />
        </ActionPanel>
      }
    />
  );
}
