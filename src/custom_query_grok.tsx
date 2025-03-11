import { getSelectedText, LaunchProps, getPreferenceValues } from "@raycast/api";
import { AI_PLATFORMS, sendToAIPlatformWithBrowser, Browser } from "./ai_platform_utils";

// Define interface for preferences
interface Preferences {
  browser?: string;
}

// Define interface for global preferences
interface GlobalPreferences {
  defaultBrowser: string;
}

export default async function Command(props: LaunchProps<{ arguments: Arguments.CustomQuery }>) {
  try {
    const selectedText = await getSelectedText();
    const { prefix } = props.arguments;
    const preferences = getPreferenceValues<Preferences>();
    const globalPreferences = getPreferenceValues<GlobalPreferences>();
    
    // Determine which browser to use
    // First check command-specific preference, then fall back to global preference
    const browserPreference = preferences.browser || globalPreferences.defaultBrowser || "safari";
    const browser = browserPreference === "chrome" ? Browser.CHROME : Browser.SAFARI;

    await sendToAIPlatformWithBrowser(
      selectedText, 
      prefix, 
      AI_PLATFORMS.GROK.url, 
      AI_PLATFORMS.GROK.selector, 
      AI_PLATFORMS.GROK.name,
      browser
    );
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}
