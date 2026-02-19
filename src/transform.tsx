import { Clipboard, LaunchProps, getPreferenceValues, getSelectedText, showHUD } from "@raycast/api";
import { apiProvider, createCompletion, getModel } from "./api";

const model = getModel(getPreferenceValues().model_transform);

export default async function Command(props: LaunchProps<{ arguments: Arguments.Transform }>) {
  const selectedText = await getSelectedText();
  await showHUD(`Connecting to ${apiProvider} with model ${model}...`);
  const { prompt } = props.arguments;
  try {
    const text = await createCompletion(model, `${prompt}\n\n${selectedText}`);
    if (text) {
      await showHUD("Response pasted to the current application.");
      await Clipboard.paste(text);
    } else {
      await showHUD("No response from AI provider.");
    }
  } catch (error) {
    await showHUD(`Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
