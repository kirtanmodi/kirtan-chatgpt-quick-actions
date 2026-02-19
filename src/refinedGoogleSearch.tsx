import { getSelectedText, showHUD, Clipboard, showToast, Toast } from "@raycast/api";
import { runAppleScript } from "run-applescript";
import { apiProvider, createCompletion, getModel } from "./api";

const model = getModel("global");

export default async function Command() {
  const toast = await showToast({
    style: Toast.Style.Animated,
    title: "Preparing to refine search query...",
  });

  try {
    let selectedText = await getSelectedText();

    if (!selectedText) {
      const { text } = await Clipboard.read();
      if (text) {
        selectedText = text;
      } else {
        toast.hide();
        await showHUD("No text selected or found in clipboard.");
        return;
      }
    }

    toast.title = "Refining search query...";
    const refinedQuery = await refineSearchQuery(selectedText, toast);

    toast.title = "Opening refined search...";
    await googleSearch(refinedQuery);

    toast.hide();
    await showHUD("Refined Google search opened in Safari.");
  } catch (error) {
    console.error("Error:", error);
    toast.style = Toast.Style.Failure;
    toast.title = "Error";
    toast.message = "Failed to perform refined Google search.";
  }
}

async function refineSearchQuery(query: string, toast: Toast): Promise<string> {
  const prompt = `I want to search for ${query}. Help me refine this Google search query by focusing on [key points or purpose, e.g., accuracy, up-to-date information, or specific sources]. Exclude [any irrelevant terms or websites], and include results from [specific sites, if any]. Provide a search query I can use to get the best results, only give me the query and nothing else`;

  toast.message = `Connecting to ${apiProvider}...`;

  try {
    const result = await createCompletion(model, prompt);
    toast.message = "Processing refined query...";
    return result || query;
  } catch (error) {
    console.error("Error in refineSearchQuery:", error);
    toast.style = Toast.Style.Failure;
    toast.title = "Refinement Error";
    toast.message = "Failed to refine the search query. Using original query.";
    return query;
  }
}

async function googleSearch(query: string) {
  const encodedQuery = encodeURIComponent(query);
  const googleSearchUrl = `https://www.google.com/search?q=${encodedQuery}`;

  await runAppleScript(`
    tell application "Safari"
      open location "${googleSearchUrl}"
      activate
    end tell
  `);
}
