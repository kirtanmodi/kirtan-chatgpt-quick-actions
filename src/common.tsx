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
  Form,
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
  const [requestStatus, setRequestStatus] = useState<"pending" | "completed" | "no-request" | "failed">("pending");
  const [needsInput, setNeedsInput] = useState(false);
  const [manualText, setManualText] = useState("");
  const [lastInputText, setLastInputText] = useState<string | undefined>(undefined);
  const [model, setModel] = useState(getModel(model_override));

  async function getResult(requestedModel = model, inputText?: string) {
    setLastInputText(inputText);
    setPromptTokenCount(0);
    setResponseTokenCount(0);
    setRequestStatus("pending");
    const now = new Date();
    let duration = 0;
    const toast = await showToast(Toast.Style.Animated, toast_title);
    let selectedText = inputText || "";

    if (!inputText) {
      try {
        selectedText = await getSelectedText();
      } catch (error) {
        toast.title = "No Selected Text";
        toast.style = Toast.Style.Failure;
        setRequestStatus("no-request");
        setLoading(false);
        setResponse("⚠️ Raycast was unable to get the selected text. Choose Type Text Instead to continue.");
        return;
      }
    }

    if (!selectedText.trim()) {
      toast.title = "No Selected Text";
      toast.style = Toast.Style.Failure;
      setRequestStatus("no-request");
      setLoading(false);
      setResponse("⚠️ No text was selected. Choose Type Text Instead to continue.");
      return;
    }

    try {
      const toneInstruction = tone && tone !== "default" ? TONE_INSTRUCTIONS[tone] : "";
      const fullPrompt = toneInstruction ? `${prompt}\n\n${toneInstruction}` : prompt;
      const stream = createStream(requestedModel, fullPrompt, selectedText);
      const promptTokens = countToken(fullPrompt + selectedText);
      setPromptTokenCount(promptTokens);

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
          const responseTokens = countToken(response_);
          setResponseTokenCount(responseTokens);
          setCumulativeTokens((previous) => previous + promptTokens + responseTokens);
          const estimatedCost = estimatePrice(promptTokens, responseTokens, requestedModel);
          if (estimatedCost >= 0) setCumulativeCost((previous) => previous + estimatedCost);
          setRequestStatus("completed");
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
      setRequestStatus("failed");
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
    getResult(model, lastInputText);
  }

  async function retryWithGPT61Sol() {
    setModel("gpt-6.1-sol");
    setLoading(true);
    setResponse("");
    getResult("gpt-6.1-sol", lastInputText);
  }

  useEffect(() => {
    getResult();
  }, []);

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

  const showRetryWithGPT61Sol = apiProvider === "openai" && model !== "gpt-6.1-sol";
  const estimatedCost = estimatePrice(prompt_token_count, response_token_count, model);
  const currentCostText =
    requestStatus === "completed"
      ? estimatedCost >= 0
        ? `${estimatedCost} cents`
        : "Unknown"
      : requestStatus === "no-request"
      ? "0 cents"
      : "Unknown";

  if (needsInput) {
    return (
      <Form
        actions={
          <ActionPanel>
            <Action.SubmitForm
              title="Send to AI"
              onSubmit={() => {
                if (!manualText.trim()) {
                  showToast(Toast.Style.Failure, "Enter text first");
                  return;
                }
                setNeedsInput(false);
                setLoading(true);
                setResponse("");
                getResult(model, manualText);
              }}
            />
          </ActionPanel>
        }
      >
        <Form.TextArea
          id="text"
          title="Text"
          placeholder="Enter the text to process"
          value={manualText}
          onChange={setManualText}
        />
      </Form>
    );
  }

  // In paste mode, show a minimal loading view
  if (outputMode === "paste") {
    return (
      <Detail
        markdown={loading ? "Generating response..." : response}
        isLoading={loading}
        actions={
          requestStatus === "no-request" ? (
            <ActionPanel>
              <Action title="Type Text Instead" onAction={() => setNeedsInput(true)} icon={Icon.Pencil} />
            </ActionPanel>
          ) : undefined
        }
      />
    );
  }

  return (
    <Detail
      markdown={response}
      isLoading={loading}
      actions={
        !loading && (
          <ActionPanel title="Actions">
            {requestStatus === "no-request" && (
              <Action title="Type Text Instead" onAction={() => setNeedsInput(true)} icon={Icon.Pencil} />
            )}
            <Action.CopyToClipboard title="Copy Results" content={response} />
            <Action.Paste title="Paste Results" content={response} />
            <Action title="Retry" onAction={retry} shortcut={{ modifiers: ["cmd"], key: "r" }} icon={Icon.Repeat} />
            {showRetryWithGPT61Sol && (
              <Action
                title="Retry with GPT-6.1 Sol"
                onAction={retryWithGPT61Sol}
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
          <Detail.Metadata.Label title="Estimated Cost" text={currentCostText} />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="Cumulative Tokens" text={cumulative_tokens.toString()} />
          <Detail.Metadata.Label title="Estimated Cumulative Cost" text={cumulative_cost.toString() + " cents"} />
        </Detail.Metadata>
      }
    />
  );
}
