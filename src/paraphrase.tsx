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

    const prefix = "paraphrase this text for me, keep it simple and short:";

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

    await sendToAIPlatformWithBrowser(selectedText, prefix, platformUrl, selector, platformName, browser, tabBehavior);
  } catch (error) {
    console.error("Error:", error);
    await showHUD(`Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
