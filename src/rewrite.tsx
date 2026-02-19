import { getPreferenceValues } from "@raycast/api";
import ResultView from "./common";

const pref = getPreferenceValues<{ prompt_rewrite: string; model_rewrite: string; tone?: string }>();
const toast_title = "Rewriting...";

export default function Rewrite() {
  return ResultView(pref.prompt_rewrite, pref.model_rewrite, toast_title, pref.tone);
}
