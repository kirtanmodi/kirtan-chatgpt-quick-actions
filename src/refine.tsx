import { getPreferenceValues } from "@raycast/api";
import ResultView from "./common";

const pref = getPreferenceValues<{ prompt_refine: string; model_refine: string; tone?: string }>();
const toast_title = "Refining...";

export default function Refine() {
  return ResultView(pref.prompt_refine, pref.model_refine, toast_title, pref.tone);
}
