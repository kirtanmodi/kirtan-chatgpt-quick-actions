import { getSelectedText, LaunchProps, getPreferenceValues } from "@raycast/api";
import { AI_PLATFORMS, sendToAIPlatform } from "./ai_platform_utils";

// Define interface for preferences
interface Preferences {
  aiPlatform: string;
  customUrl?: string;
  customSelector?: string;
}

export default async function Command(props: LaunchProps<{ arguments: Arguments.CustomQuery }>) {
  try {
    const selectedText = await getSelectedText();
    const { prefix } = props.arguments;
    const preferences = getPreferenceValues<Preferences>();
    
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

    await sendToAIPlatform(selectedText, prefix, platformUrl, textareaSelector, platformName);
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}
