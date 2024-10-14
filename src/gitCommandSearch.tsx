import { Action, ActionPanel, List, showToast, Toast } from "@raycast/api";
import { readFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";
import { useEffect, useState, useCallback, useMemo } from "react";

interface Command {
  command: string;
  timestamp: number;
}

export default function CommandSearch() {
  const [searchText, setSearchText] = useState("");
  const [commands, setCommands] = useState<Command[]>([]);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);

  useEffect(() => {
    fetchCommandHistory();
  }, []);

  const filteredCommands = useMemo(() => {
    return commands
      .filter((cmd) => cmd.command.toLowerCase().includes(searchText.toLowerCase()))
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [searchText, commands]);

  useEffect(() => {
    setSelectedCommandIndex(0);
  }, [searchText]);

  const handleKeyPress = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "ArrowUp") {
        setSelectedCommandIndex((prevIndex) => Math.max(0, prevIndex - 1));
      } else if (event.key === "ArrowDown") {
        setSelectedCommandIndex((prevIndex) => Math.min(filteredCommands.length - 1, prevIndex + 1));
      } else if (event.key === "Enter") {
        const selectedCommand = filteredCommands[selectedCommandIndex];
        if (selectedCommand) {
          setSearchText(selectedCommand.command);
        }
      }
    },
    [filteredCommands, selectedCommandIndex]
  );

  const formatDate = useCallback((timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  }, []);

  const fetchCommandHistory = async () => {
    try {
      const historyPath = join(homedir(), ".zsh_history");
      const data = await readFile(historyPath, "utf8");
      const parsedCommands = data
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          const match = line.match(/: (\d+):0;(.+)/);
          if (match) {
            return {
              timestamp: parseInt(match[1], 10),
              command: match[2].trim(),
            };
          }
          return null;
        })
        .filter((cmd): cmd is Command => cmd !== null);
      setCommands(parsedCommands);
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to fetch command history",
        message: (error as Error).message,
      });
    }
  };

  return (
    <List
      searchText={searchText}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search commands (Ctrl+R style)..."
    >
      {filteredCommands.length > 0 ? (
        filteredCommands.map((cmd, index) => (
          <List.Item
            key={`${cmd.timestamp}-${index}`}
            title={cmd.command}
            subtitle={formatDate(cmd.timestamp)}
            accessories={[{ text: index === selectedCommandIndex ? "→" : "" }]}
            actions={
              <ActionPanel>
                <Action.CopyToClipboard content={cmd.command} />
                <Action.Paste content={cmd.command} />
              </ActionPanel>
            }
          />
        ))
      ) : (
        <List.EmptyView
          title="No commands found"
          description={commands.length > 0 ? "Try a different search term" : "Your command history appears to be empty"}
        />
      )}
    </List>
  );
}
