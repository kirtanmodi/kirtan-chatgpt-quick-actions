import { getPreferenceValues } from "@raycast/api";
import ResultView from "./common";

const pref = getPreferenceValues<{ prompt_custom: string; model_custom: string; tone?: string }>();
const toast_title = "Thinking...";

export default function CustomAction() {
  return ResultView(pref.prompt_custom, pref.model_custom, toast_title, pref.tone);
}
