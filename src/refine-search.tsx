import { getSelectedText, showHUD, getPreferenceValues } from "@raycast/api";
import { sendToAIPlatformWithBrowser, AI_PLATFORMS, Browser } from "./ai_platform_utils";

export default async function Command() {
  try {
    const selectedText = await getSelectedText();
    const prefs = getPreferenceValues<{
      aiPlatform?: string;
      browser?: string;
      tabBehavior?: string;
      customUrl?: string;
      customSelector?: string;
    }>();

    const prefix = `I want to search for ${selectedText}. Help me refine this Google search query by focusing on [key points or purpose, e.g., accuracy, up-to-date information, or specific sources]. Exclude [any irrelevant terms or websites], and include results from [specific sites, if any]. Provide a search query I can use to get the best results, only give me the query and nothing else, and also provide separately for yt`;

    const browser = (prefs.browser as Browser) || Browser.SAFARI;
    const tabBehavior = (prefs.tabBehavior as "new" | "reuse") || "reuse";

    let platformUrl: string;
    let selector: string;
    let platformName: string;

    switch (prefs.aiPlatform) {
      case "claude":
        platformUrl = AI_PLATFORMS.CLAUDE.url;
        selector = AI_PLATFORMS.CLAUDE.selector;
        platformName = AI_PLATFORMS.CLAUDE.name;
        break;
      case "custom":
        platformUrl = prefs.customUrl || AI_PLATFORMS.CHATGPT.url;
        selector = prefs.customSelector || "textarea";
        platformName = "Custom AI";
        break;
      default:
        platformUrl = AI_PLATFORMS.CHATGPT.url;
        selector = AI_PLATFORMS.CHATGPT.selector;
        platformName = AI_PLATFORMS.CHATGPT.name;
    }

    // Selected text is already embedded in the prefix, so pass empty string as text
    await sendToAIPlatformWithBrowser("", prefix, platformUrl, selector, platformName, browser, tabBehavior);
  } catch (error) {
    console.error("Error:", error);
    await showHUD(`Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
