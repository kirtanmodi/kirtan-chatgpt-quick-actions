import { List, Action, ActionPanel, showToast, Toast, Form, useNavigation } from "@raycast/api";
import { useState, useEffect } from "react";
import { runAppleScript } from "run-applescript";

interface Link {
  title: string;
  url: string;
}

const defaultLinks: Link[] = [
  {
    title: "Udemy Azure Course",
    url: "https://www.udemy.com/course/70532-azure/learn/lecture/27346876#overview",
  },
  // Add more default links here
];

const azureFunctionLinks = [
  {
    title: "HTTP Trigger",
    url: "https://portal.azure.com/#view/WebsitesExtension/FunctionTabMenuBlade/~/logs/resourceId/%2Fsubscriptions%2F5cecbe25-06b8-4af3-b31f-ea06eb144f12%2FresourceGroups%2FTOCMiddlewareProdResources%2Fproviders%2FMicrosoft.Web%2Fsites%2Fprod-toc-middleware-func%2Ffunctions%2FhttpTrigger",
  },
  {
    title: "Queue Trigger",
    url: "https://portal.azure.com/#view/WebsitesExtension/FunctionTabMenuBlade/~/logs/resourceId/%2Fsubscriptions%2F5cecbe25-06b8-4af3-b31f-ea06eb144f12%2FresourceGroups%2FTOCMiddlewareProdResources%2Fproviders%2FMicrosoft.Web%2Fsites%2Fprod-toc-middleware-func%2Ffunctions%2FqueueTrigger",
  },
];

export default function OpenLink() {
  const [links, setLinks] = useState<Link[]>(defaultLinks);
  const [isLoading, setIsLoading] = useState(true);
  const { push } = useNavigation();

  useEffect(() => {
    // Load links from storage or any other source
    // For now, we'll just use the default links
    setLinks(defaultLinks);
    setIsLoading(false);
  }, []);

  const openLinkInChrome = async (url: string) => {
    try {
      await runAppleScript(`tell application "Google Chrome" to open location "${url}"`);
      await showToast({ style: Toast.Style.Success, title: "Link opened in Chrome" });
    } catch (error) {
      await showToast({ style: Toast.Style.Failure, title: "Failed to open link", message: String(error) });
    }
  };

  const openAzureFunctionLinks = async () => {
    try {
      const script = azureFunctionLinks.map((link) => `open location "${link.url}"`).join("\n");
      await runAppleScript(`tell application "Google Chrome"\n${script}\nend tell`);
      await showToast({ style: Toast.Style.Success, title: "Azure Function links opened in Chrome" });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to open Azure Function links",
        message: String(error),
      });
    }
  };

  return (
    <List isLoading={isLoading}>
      <List.Item
        title="Add New Link"
        icon="➕"
        actions={
          <ActionPanel>
            <Action title="Add Link" onAction={() => push(<AddLinkForm links={links} setLinks={setLinks} />)} />
          </ActionPanel>
        }
      />
      <List.Item
        title="Open Azure Function Links - PROD"
        icon="⚡"
        actions={
          <ActionPanel>
            <Action title="Open Azure Function Links in Chrome" onAction={openAzureFunctionLinks} />
          </ActionPanel>
        }
      />
      {links.map((link, index) => (
        <List.Item
          key={index}
          title={link.title}
          actions={
            <ActionPanel>
              <Action title="Open in Chrome" onAction={() => openLinkInChrome(link.url)} />
              <Action
                title="Edit Link"
                onAction={() => push(<AddLinkForm links={links} setLinks={setLinks} editIndex={index} />)}
              />
              <Action
                title="Delete Link"
                onAction={() => {
                  const newLinks = links.filter((_, i) => i !== index);
                  setLinks(newLinks);
                }}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

function AddLinkForm({
  links,
  setLinks,
  editIndex,
}: {
  links: Link[];
  setLinks: React.Dispatch<React.SetStateAction<Link[]>>;
  editIndex?: number;
}) {
  const { pop } = useNavigation();
  const linkToEdit = editIndex !== undefined ? links[editIndex] : undefined;

  const handleSubmit = (values: { title: string; url: string }) => {
    if (editIndex !== undefined) {
      const newLinks = [...links];
      newLinks[editIndex] = values;
      setLinks(newLinks);
    } else {
      setLinks([...links, values]);
    }
    pop();
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Save Link" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="title" title="Title" defaultValue={linkToEdit?.title} />
      <Form.TextField id="url" title="URL" defaultValue={linkToEdit?.url} />
    </Form>
  );
}
