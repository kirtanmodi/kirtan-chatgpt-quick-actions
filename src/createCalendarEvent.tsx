import { getSelectedText, showHUD, Form, ActionPanel, Action, closeMainWindow } from "@raycast/api";
import { runAppleScript } from "run-applescript";
import { useState, useEffect } from "react";
import * as chrono from "chrono-node";
import moment from "moment-timezone";

export default function CreateCalendarEvent() {
  const [time, setTime] = useState("");
  const [title, setTitle] = useState("");
  const [parsedDate, setParsedDate] = useState<Date | null>(null);

  useEffect(() => {
    // Get current time in IST
    const now = moment().tz("Asia/Kolkata");
    const referenceDate = now.toDate();

    // First try parsing relative time expressions
    if (time.toLowerCase().includes("in")) {
      const casualParsed = chrono.casual.parse(time, referenceDate, { forwardDate: true });
      if (casualParsed.length > 0) {
        setParsedDate(casualParsed[0].date());
        return;
      }
    }

    // If not a relative time, use strict parsing
    const parsed = chrono.casual.parse(time, referenceDate, {
      forwardDate: true,
    });

    if (parsed.length > 0) {
      setParsedDate(parsed[0].date());
    } else {
      setParsedDate(null);
    }
  }, [time]);

  async function handleSubmit() {
    try {
      let selectedText = "";
      try {
        selectedText = await getSelectedText();
      } catch (error) {
        // Ignore error if no text is selected
      }

      if (!parsedDate) {
        await showHUD("Error: Could not parse the time.");
        return;
      }

      if (!title.trim()) {
        await showHUD("Error: Please enter a title for the event.");
        return;
      }

      const startDate = parsedDate;
      const endDate = new Date(parsedDate.getTime() + 30 * 60000);

      const escapedTitle = title.replace(/"/g, '\\"');
      const escapedNotes = selectedText.replace(/"/g, '\\"');

      const appleScript = `
        tell application "Calendar"
          tell calendar "Home"
            set eventStartDate to (current date)
            set year of eventStartDate to ${startDate.getFullYear()}
            set month of eventStartDate to ${startDate.getMonth() + 1}
            set day of eventStartDate to ${startDate.getDate()}
            set time of eventStartDate to (${startDate.getHours()} * hours + ${startDate.getMinutes()} * minutes)
            
            set eventEndDate to (current date)
            set year of eventEndDate to ${endDate.getFullYear()}
            set month of eventEndDate to ${endDate.getMonth() + 1}
            set day of eventEndDate to ${endDate.getDate()}
            set time of eventEndDate to (${endDate.getHours()} * hours + ${endDate.getMinutes()} * minutes)
            
            set newEvent to make new event with properties {summary:"${escapedTitle}", start date:eventStartDate, end date:eventEndDate}
            set description of newEvent to "${escapedNotes}"
          end tell
        end tell
      `;

      await runAppleScript(appleScript);
      await showHUD("Event created in Calendar.");
      await closeMainWindow(); // Add this line to close the window after successful creation
    } catch (error) {
      console.error("Error:", error);
      await showHUD("Error: Failed to create event.");
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Event" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="title"
        title="Event Title"
        value={title}
        onChange={setTitle}
        placeholder="Enter event title"
      />
      <Form.TextField
        id="time"
        title="Event Time"
        value={time}
        onChange={setTime}
        placeholder="e.g., tomorrow at 3 pm, in an hour"
      />
      <Form.Description
        title="Parsed Date"
        text={
          parsedDate
            ? parsedDate.toLocaleString("en-US", {
                timeZone: "Asia/Kolkata",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
                hour12: true,
                weekday: "long",
              })
            : "Invalid date"
        }
      />
    </Form>
  );
}
