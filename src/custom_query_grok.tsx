import { getSelectedText, LaunchProps } from "@raycast/api";
import { AI_PLATFORMS, sendToAIPlatform } from "./ai_platform_utils";

export default async function Command(props: LaunchProps<{ arguments: Arguments.CustomQuery }>) {
  try {
    const selectedText = await getSelectedText();
    const { prefix } = props.arguments;

    await sendToAIPlatform(
      selectedText, 
      prefix, 
      AI_PLATFORMS.GROK.url, 
      AI_PLATFORMS.GROK.selector, 
      AI_PLATFORMS.GROK.name
    );
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}
