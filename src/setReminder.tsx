import { getSelectedText, showHUD } from "@raycast/api";
import { runAppleScript } from "run-applescript";

export default async function Command() {
  try {
    const selectedText = await getSelectedText();
    const reminderText = `Set a reminder: ${selectedText}`;

    // Generate AppleScript to create a reminder for the next hour
    const appleScript = `
      tell application "Reminders"
        tell list "Reminders"
          make new reminder with properties {name:"${selectedText}", due date:((current date) + (1 * hours))}
        end tell
      end tell
    `;

    await runAppleScript(appleScript);
    await showHUD("Reminder created for the next hour.");
  } catch (error) {
    console.error("Error:", error);
    await showHUD("Error: Failed to create reminder.");
  }
}
