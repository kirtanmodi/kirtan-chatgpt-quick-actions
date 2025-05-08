import { getSelectedText, LaunchProps, getPreferenceValues } from "@raycast/api";
import { AI_PLATFORMS, sendToAIPlatformWithBrowser, Browser } from "./ai_platform_utils";

// Define interface for preferences
interface Preferences {
  aiPlatform: string;
  customUrl?: string;
  customSelector?: string;
  browser?: string;
  tabBehavior?: string;
  searchPrefix: string; // Added search prefix as a preference
}

// Define interface for global preferences
interface GlobalPreferences {
  defaultBrowser: string;
}

export default async function Command() {
  try {
    const selectedText = await getSelectedText();
    const preferences = getPreferenceValues<Preferences>();
    const globalPreferences = getPreferenceValues<GlobalPreferences>();

    // Get the prefix from preferences instead of arguments
    const prefix = preferences.searchPrefix || "Search the web for:";

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
    // First check command-specific preference, then fall back to global preference
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
