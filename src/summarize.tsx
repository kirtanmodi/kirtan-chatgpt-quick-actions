import { getPreferenceValues } from "@raycast/api";
import ResultView from "./common";

const pref = getPreferenceValues<{ prompt_summarize: string; model_summarize: string; tone?: string }>();
const toast_title = "Summarizing...";

export default function Summarize() {
  return ResultView(pref.prompt_summarize, pref.model_summarize, toast_title, pref.tone);
}
