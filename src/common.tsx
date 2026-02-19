import {
  getSelectedText,
  Detail,
  getPreferenceValues,
  ActionPanel,
  Action,
  showToast,
  Toast,
  Icon,
  Clipboard,
  closeMainWindow,
  popToRoot,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { apiProvider, createStream, getModel } from "./api";
import { countToken, estimatePrice, sentToSideNote } from "./util";

const TONE_INSTRUCTIONS: Record<string, string> = {
  professional: "Use a professional, business-appropriate tone.",
  casual: "Use a casual, conversational tone.",
  academic: "Use an academic, scholarly tone with precise language.",
  concise: "Be extremely concise. No filler words.",
  creative: "Use a creative, engaging tone with vivid language.",
};

export default function ResultView(prompt: string, model_override: string, toast_title: string, tone?: string) {
  const pref = getPreferenceValues<{ sidenote?: boolean; outputMode?: string }>();
  const outputMode = pref.outputMode || "preview";
  const [response_token_count, setResponseTokenCount] = useState(0);
  const [prompt_token_count, setPromptTokenCount] = useState(0);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(true);
  const [cumulative_tokens, setCumulativeTokens] = useState(0);
  const [cumulative_cost, setCumulativeCost] = useState(0);
  const [model, setModel] = useState(getModel(model_override));

  async function getResult() {
    const now = new Date();
    let duration = 0;
    const toast = await showToast(Toast.Style.Animated, toast_title);
    let selectedText = "";

    try {
      selectedText = await getSelectedText();
    } catch (error) {
      toast.title = "Error";
      toast.style = Toast.Style.Failure;
      setLoading(false);
      setResponse(
        "⚠️ Raycast was unable to get the selected text. You may try copying the text to a text editor and try again."
      );
      return;
    }

    try {
      const toneInstruction = tone && tone !== "default" ? TONE_INSTRUCTIONS[tone] : "";
      const fullPrompt = toneInstruction ? `${prompt}\n\n${toneInstruction}` : prompt;
      const stream = createStream(model, fullPrompt, selectedText);
      setPromptTokenCount(countToken(fullPrompt + selectedText));

      let response_ = "";
      for await (const part of stream) {
        if (part.text) {
          response_ += part.text;
          if (outputMode === "preview") {
            setResponse(response_);
            setResponseTokenCount(countToken(response_));
          }
        }
        if (part.done) {
          if (outputMode === "paste") {
            // Paste directly and close
            await Clipboard.paste(response_);
            toast.style = Toast.Style.Success;
            const done = new Date();
            duration = (done.getTime() - now.getTime()) / 1000;
            toast.title = `Pasted in ${duration}s`;
            await closeMainWindow();
            await popToRoot();
          } else {
            setResponse(response_);
            setResponseTokenCount(countToken(response_));
          }
          setLoading(false);
          if (outputMode === "preview") {
            const done = new Date();
            duration = (done.getTime() - now.getTime()) / 1000;
            toast.style = Toast.Style.Success;
            toast.title = `Finished in ${duration} seconds`;
          }
          break;
        }
      }
    } catch (error) {
      toast.title = "Error";
      toast.style = Toast.Style.Failure;
      setLoading(false);
      setResponse(
        `⚠️ Failed to get response from AI provider. Please check your network connection and API key. \n\n Error Message: \`\`\`${
          (error as Error).message
        }\`\`\``
      );
      return;
    }
  }

  async function retry() {
    setLoading(true);
    setResponse("");
    getResult();
  }

  async function retryWithGPT5() {
    setModel("gpt-5");
    setLoading(true);
    setResponse("");
    getResult();
  }

  useEffect(() => {
    getResult();
  }, []);

  useEffect(() => {
    if (loading == false) {
      setCumulativeTokens(cumulative_tokens + prompt_token_count + response_token_count);
      setCumulativeCost(cumulative_cost + estimatePrice(prompt_token_count, response_token_count, model));
    }
  }, [loading]);

  let sidenote = undefined;
  if (pref.sidenote) {
    sidenote = (
      <Action
        title="Send to SideNote"
        onAction={async () => {
          await sentToSideNote(response);
        }}
        shortcut={{ modifiers: ["cmd"], key: "s" }}
        icon={Icon.Sidebar}
      />
    );
  }

  const showRetryWithGPT5 = apiProvider === "openai" && model !== "gpt-5";

  // In paste mode, show a minimal loading view
  if (outputMode === "paste") {
    return <Detail markdown={loading ? "Generating response..." : response} isLoading={loading} />;
  }

  return (
    <Detail
      markdown={response}
      isLoading={loading}
      actions={
        !loading && (
          <ActionPanel title="Actions">
            <Action.CopyToClipboard title="Copy Results" content={response} />
            <Action.Paste title="Paste Results" content={response} />
            <Action title="Retry" onAction={retry} shortcut={{ modifiers: ["cmd"], key: "r" }} icon={Icon.Repeat} />
            {showRetryWithGPT5 && (
              <Action
                title="Retry with GPT-5"
                onAction={retryWithGPT5}
                shortcut={{ modifiers: ["cmd", "shift"], key: "r" }}
                icon={Icon.ArrowNe}
              />
            )}
            {sidenote}
          </ActionPanel>
        )
      }
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Current Model" text={model} />
          <Detail.Metadata.Label title="Provider" text={apiProvider} />
          <Detail.Metadata.Label title="Prompt Tokens" text={prompt_token_count.toString()} />
          <Detail.Metadata.Label title="Response Tokens" text={response_token_count.toString()} />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="Total Tokens" text={(prompt_token_count + response_token_count).toString()} />
          <Detail.Metadata.Label
            title="Total Cost"
            text={estimatePrice(prompt_token_count, response_token_count, model).toString() + " cents"}
          />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="Cumulative Tokens" text={cumulative_tokens.toString()} />
          <Detail.Metadata.Label title="Cumulative Cost" text={cumulative_cost.toString() + " cents"} />
        </Detail.Metadata>
      }
    />
  );
}
