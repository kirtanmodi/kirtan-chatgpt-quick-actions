import { getSelectedText, getPreferenceValues } from "@raycast/api";
import { AI_PLATFORMS, sendToAIPlatformWithBrowser, Browser } from "./ai_platform_utils";

interface Preferences {
  bullet_style: string;
  aiPlatform: string;
  customUrl?: string;
  customSelector?: string;
  browser?: string;
  tabBehavior?: string;
}

interface GlobalPreferences {
  defaultBrowser: string;
}

function getBulletPointsPrefix(style: string): string {
  const basePrefix =
    "Explain this clearly in well-organized bullet points explainning whats going on in detail. Keep it to the point and no fluff. ";

  switch (style) {
    case "hierarchical":
      return (
        basePrefix +
        "Create a hierarchical structure with main points and sub-points where appropriate. Use indentation to show the hierarchy. The Topic and Subtopics should be in BOLD. Group related information together under main topics.\n\n"
      );
    case "simple":
      return (
        basePrefix +
        "Create a simple, flat list of bullet points. Each point should be concise and start with a bullet (•). Keep all points at the same level without any sub-points or hierarchy.\n\n"
      );
    case "numbered":
      return (
        basePrefix +
        "Create a numbered list (1., 2., 3., etc.) with clear, concise points. If there are sub-points, use letters (a., b., c.) for secondary items. Maintain logical order and grouping.\n\n"
      );
    default:
      return basePrefix + "Create a hierarchical structure with main points and sub-points where appropriate.\n\n";
  }
}

export default async function Command() {
  try {
    const selectedText = await getSelectedText();
    const preferences = getPreferenceValues<Preferences>();
    const globalPreferences = getPreferenceValues<GlobalPreferences>();

    const bulletStyle = preferences.bullet_style || "hierarchical";
    const prefix = getBulletPointsPrefix(bulletStyle);

    // Determine which AI platform to use
    let platformUrl = AI_PLATFORMS.CHATGPT.url;
    let textareaSelector = AI_PLATFORMS.CHATGPT.selector;
    let platformName = AI_PLATFORMS.CHATGPT.name;

    switch (preferences.aiPlatform) {
      case "chatgpt":
        platformUrl = AI_PLATFORMS.CHATGPT.url;
        textareaSelector = AI_PLATFORMS.CHATGPT.selector;
        platformName = AI_PLATFORMS.CHATGPT.name;
        break;
      case "claude":
        platformUrl = AI_PLATFORMS.CLAUDE.url;
        textareaSelector = AI_PLATFORMS.CLAUDE.selector;
        platformName = AI_PLATFORMS.CLAUDE.name;
        break;
      case "custom":
        platformUrl = preferences.customUrl || AI_PLATFORMS.CHATGPT.url;
        textareaSelector = preferences.customSelector || "textarea";
        platformName = "Custom AI";
        break;
    }

    // Determine which browser to use
    const browserPreference = preferences.browser || globalPreferences.defaultBrowser || "safari";
    const browser = browserPreference === "chrome" ? Browser.CHROME : Browser.SAFARI;

    // Determine tab behavior from preferences, defaulting to reuse
    const tabBehavior = (preferences.tabBehavior || "reuse") as "new" | "reuse";

    await sendToAIPlatformWithBrowser(
      selectedText,
      prefix,
      platformUrl,
      textareaSelector,
      platformName,
      browser,
      tabBehavior
    );
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}
