import {
  List,
  Action,
  ActionPanel,
  showToast,
  Toast,
  Form,
  useNavigation,
  LocalStorage,
  confirmAlert,
} from "@raycast/api";
import { useState, useEffect } from "react";
import { runAppleScript } from "run-applescript";

interface Link {
  id: string;
  title: string;
  url: string;
  isDefault: boolean;
}

const DEFAULT_LINKS: Link[] = [
  {
    id: "1",
    title: "Udemy Azure Course",
    url: "https://www.udemy.com/course/70532-azure/learn/lecture/27346876#overview",
    isDefault: true,
  },
  // Add more default links here
];

const AZURE_FUNCTION_LINKS: Link[] = [
  {
    id: "af1",
    title: "HTTP Trigger",
    url: "https://portal.azure.com/#view/WebsitesExtension/FunctionTabMenuBlade/~/logs/resourceId/%2Fsubscriptions%2F5cecbe25-06b8-4af3-b31f-ea06eb144f12%2FresourceGroups%2FTOCMiddlewareProdResources%2Fproviders%2FMicrosoft.Web%2Fsites%2Fprod-toc-middleware-func%2Ffunctions%2FhttpTrigger",
    isDefault: true,
  },
  {
    id: "af2",
    title: "Queue Trigger",
    url: "https://portal.azure.com/#view/WebsitesExtension/FunctionTabMenuBlade/~/logs/resourceId/%2Fsubscriptions%2F5cecbe25-06b8-4af3-b31f-ea06eb144f12%2FresourceGroups%2FTOCMiddlewareProdResources%2Fproviders%2FMicrosoft.Web%2Fsites%2Fprod-toc-middleware-func%2Ffunctions%2FqueueTrigger",
    isDefault: true,
  },
];

const STORAGE_KEY = "custom_links";

export default function OpenLink() {
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { push } = useNavigation();

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      const storedLinks = await LocalStorage.getItem<string>(STORAGE_KEY);
      if (storedLinks) {
        setLinks([...DEFAULT_LINKS, ...JSON.parse(storedLinks)]);
      } else {
        setLinks(DEFAULT_LINKS);
      }
    } catch (error) {
      console.error("Failed to load links:", error);
      await showToast({ style: Toast.Style.Failure, title: "Failed to load links", message: String(error) });
      setLinks(DEFAULT_LINKS);
    } finally {
      setIsLoading(false);
    }
  };

  const saveLinks = async (newLinks: Link[]) => {
    try {
      const customLinks = newLinks.filter((link) => !link.isDefault);
      await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(customLinks));
      setLinks(newLinks);
    } catch (error) {
      console.error("Failed to save links:", error);
      await showToast({ style: Toast.Style.Failure, title: "Failed to save links", message: String(error) });
    }
  };

  const openLinkInChrome = async (url: string) => {
    try {
      await runAppleScript(`tell application "Google Chrome" to open location "${url}"`);
      await showToast({ style: Toast.Style.Success, title: "Link opened in Chrome" });
    } catch (error) {
      console.error("Failed to open link:", error);
      await showToast({ style: Toast.Style.Failure, title: "Failed to open link", message: String(error) });
    }
  };

  const openAzureFunctionLinks = async () => {
    try {
      const script = AZURE_FUNCTION_LINKS.map((link) => `open location "${link.url}"`).join("\n");
      await runAppleScript(`tell application "Google Chrome"\n${script}\nend tell`);
      await showToast({ style: Toast.Style.Success, title: "Azure Function links opened in Chrome" });
    } catch (error) {
      console.error("Failed to open Azure Function links:", error);
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to open Azure Function links",
        message: String(error),
      });
    }
  };

  const handleAddLink = (newLink: Link) => {
    const updatedLinks = [...links, { ...newLink, isDefault: false }];
    saveLinks(updatedLinks);
  };

  const handleEditLink = (editedLink: Link, index: number) => {
    const updatedLinks = [...links];
    updatedLinks[index] = editedLink;
    saveLinks(updatedLinks);
  };

  const handleDeleteLink = async (index: number) => {
    const linkToDelete = links[index];
    if (linkToDelete.isDefault) {
      await showToast({ style: Toast.Style.Failure, title: "Cannot delete default links" });
      return;
    }

    const options = {
      title: "Confirm Deletion",
      message: `Are you sure you want to delete "${linkToDelete.title}"?`,
      primaryAction: {
        title: "Delete",
        style: Action.Style.Destructive,
      },
    };

    if (await confirmAlert(options)) {
      const updatedLinks = links.filter((_, i) => i !== index);
      saveLinks(updatedLinks);
      await showToast({ style: Toast.Style.Success, title: "Link deleted successfully" });
    }
  };

  return (
    <List isLoading={isLoading}>
      <List.Item
        title="Add New Link"
        icon="➕"
        actions={
          <ActionPanel>
            <Action title="Add Link" onAction={() => push(<AddLinkForm onSubmit={handleAddLink} />)} />
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
          key={link.id}
          title={link.title}
          accessories={[{ text: link.isDefault ? "Default" : "Custom" }]}
          actions={
            <ActionPanel>
              <Action title="Open in Chrome" onAction={() => openLinkInChrome(link.url)} />
              <Action
                title="Edit Link"
                onAction={() =>
                  push(
                    <AddLinkForm onSubmit={(editedLink) => handleEditLink(editedLink, index)} initialValues={link} />
                  )
                }
              />
              <Action
                title="Delete Link"
                onAction={() => handleDeleteLink(index)}
                shortcut={{ modifiers: ["cmd"], key: "delete" }}
                style={Action.Style.Destructive}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

interface AddLinkFormProps {
  onSubmit: (link: Link) => void;
  initialValues?: Link;
}

function AddLinkForm({ onSubmit, initialValues }: AddLinkFormProps) {
  const { pop } = useNavigation();

  const handleSubmit = (values: { title: string; url: string }) => {
    const newLink: Link = {
      id: initialValues?.id || Date.now().toString(),
      title: values.title,
      url: values.url,
      isDefault: initialValues?.isDefault || false,
    };
    onSubmit(newLink);
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
      <Form.TextField id="title" title="Title" defaultValue={initialValues?.title} />
      <Form.TextField id="url" title="URL" defaultValue={initialValues?.url} />
    </Form>
  );
}
