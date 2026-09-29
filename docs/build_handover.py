"""Regenerate the feature handover with Python and reportlab; no API calls."""

from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    PageBreak, Paragraph, SimpleDocTemplate, Table, TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs" / "ai-models-handover.pdf"
CHECKED = "2026-09-30"
BLUE = colors.HexColor("#245B78")
INK = colors.HexColor("#172C3A")
LIGHT = colors.HexColor("#EFF5F8")
WIDTH = A4[0] - 88

styles = getSampleStyleSheet()
styles.add(ParagraphStyle("TitleCustom", fontName="Helvetica-Bold", fontSize=25,
                          leading=29, textColor=INK, spaceAfter=13))
styles.add(ParagraphStyle("Sub", fontSize=11, leading=15, textColor=BLUE,
                          spaceAfter=18))
styles.add(ParagraphStyle("Section", fontName="Helvetica-Bold", fontSize=14,
                          leading=18, textColor=BLUE, spaceBefore=14, spaceAfter=8))
styles.add(ParagraphStyle("Copy", fontSize=10.5, leading=14.5,
                          textColor=INK, spaceAfter=9))
styles.add(ParagraphStyle("Cell", fontSize=9.5, leading=13, textColor=INK))
styles.add(ParagraphStyle("Flow", fontName="Helvetica-Bold", fontSize=11,
                          leading=15, textColor=BLUE, alignment=TA_CENTER))
styles.add(ParagraphStyle("CodeCustom", fontName="Courier", fontSize=9,
                          leading=13, textColor=INK, spaceAfter=10))
story = []


def p(text, style="Copy"):
    return Paragraph(text, styles[style])


def text(value):
    story.append(p(value))


def title(value, subtitle):
    story.extend([p(value, "TitleCustom"), p(subtitle, "Sub")])


def heading(value):
    story.append(p(value, "Section"))


def table(rows, widths):
    cells = [[p(escape(str(cell)), "Cell") for cell in row] for row in rows]
    result = Table(cells, colWidths=widths, hAlign="LEFT")
    result.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), LIGHT),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LINEBELOW", (0, 0), (-1, 0), 1, BLUE),
        ("LINEBELOW", (0, 1), (-1, -1), 0.4, colors.HexColor("#DCE6EC")),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(result)


title("ChatGPT Quick Actions", "A simple developer handover | Code and catalog checked " + CHECKED)
text("Think of the extension as a helper. You give it some words and a job, such as 'rewrite this'. It sends the words to an AI service and brings the answer back.")
flow = Table([[p("Your text", "Flow"), p("&gt;", "Flow"), p("Model", "Flow"),
               p("&gt;", "Flow"), p("Provider", "Flow"), p("&gt;", "Flow"),
               p("Answer", "Flow")]], colWidths=[112, 19, 101, 19, 112, 19, WIDTH - 382])
flow.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), LIGHT),
                         ("TOPPADDING", (0, 0), (-1, -1), 16),
                         ("BOTTOMPADDING", (0, 0), (-1, -1), 16)]))
story.append(flow)
heading("What changed, and why?")
table([
    ["Change", "Simple reason"],
    ["Raycast API 2.5.3 and newer build types", "Build the extension with tools for current Raycast."],
    ["GPT-6 Luna default and recent model choices", "Start with a low-cost GPT-6 model; let users choose others."],
    ["Type Text Instead form", "Keep working when Raycast cannot read the selected words."],
    ["Provider-compatible model selection", "Avoid sending a Claude model name to OpenAI, or the reverse."],
    ["Retry and cost fixes", "Use the requested model immediately and avoid counting missing-text errors as paid results."],
], [WIDTH * .45, WIDTH * .55])
heading("Set it up")
text("Open Raycast Settings &gt; Extensions &gt; ChatGPT Quick Actions. Choose <b>API Provider</b> and enter its API key. Choose <b>Model</b>, then set command models to <b>Follow global model</b>. For Ollama, set its endpoint and locally installed model instead.")
text("The OpenAI default is <b>gpt-6-luna</b>. A saved model stays saved after an update. Older GPT-5 nano has a lower list price; newest and cheapest do not always mean the same model. Browser commands use the model chosen on the website.")

story.append(PageBreak())
title("Inside the extension", "Follow the words from input to answer")
table([
    ["File", "Its job"],
    ["package.json / package-lock.json", "Register commands, settings and model choices; pin installed dependencies."],
    ["src/api.ts", "Pick a compatible model and talk to OpenAI, Anthropic or Ollama."],
    ["src/common.tsx", "Read text, show the manual form, stream answers, retry and display estimates."],
    ["src/util.ts", "Count visible text tokens and look up static model prices."],
], [WIDTH * .43, WIDTH * .57])
heading("How the model is picked")
text("1. Use the command's model if it has an override. Otherwise, use the global choice.<br/>2. OpenAI changes a Claude choice to Luna. Anthropic changes a non-Claude choice to Haiku 4.5.<br/>3. Ollama always uses its own model setting, ignoring the API dropdowns.")
heading("When selected text is missing")
text("No words means no AI request. In summarize, rewrite, refine, custom, preview and transform preview, choose <b>Type Text Instead</b>, type or paste the words, then choose <b>Send to AI</b>. Blank input is rejected. Retries reuse manual text; selected-text retries read the selection again. Execute and transform still need selected text.")
text("<b>Cmd+R</b> retries in a result preview. <b>Cmd+Shift+R</b> switches an OpenAI result view to GPT-6.1 Sol and retries. Sol costs more than the Luna default. The switch lasts for that view; later retries also use Sol.")
heading("The cost number is a rough estimate")
text("A token is a small piece of text. The extension counts visible text with a GPT-3 tokenizer, then uses its stored price table. It does not read actual billed usage. Hidden reasoning, caching, processing tiers and provider tokenizers can change the real bill.")
table([
    ["Request state", "Displayed cost / totals"],
    ["Missing or blank text", "0 cents; no request sent."],
    ["Pending or failed", "Unknown. A failed API request may still be billed."],
    ["Completed", "Estimate when a price is known; otherwise Unknown."],
    ["Cumulative", "Completed tokens and known completed costs in this view only; reset when it closes."],
], [WIDTH * .33, WIDTH * .67])

story.append(PageBreak())
title("Maintain and verify", "Small steps for the next developer")
heading("Run it locally")
text("Use macOS with Raycast running and Node <b>22.22.2 or newer</b>, matching the current Raycast SDK's engine requirement.")
story.append(p("npm ci<br/>npm run lint<br/>npm run build<br/>npm run dev", "CodeCustom"))
text("Run development to import the extension and refresh preferences after manifest changes. Press <b>Ctrl+C</b> when finished. The extension stays in Raycast; no dev server is needed for normal use.")
heading("Add or replace a model")
text("1. Check the official model ID, endpoint support, account availability and price.<br/>2. Update the global dropdown and all eight command model dropdowns in package.json: summarize, rewrite, refine, custom, execute, preview, transform and transform_preview.<br/>3. Update prices in src/util.ts and defaults/fallbacks in src/api.ts if needed.<br/>4. Update README and this guide; run lint, build, then development to refresh Raycast.")
text("The catalog is static. There is no automatic model discovery or forever-cheapest selection. A dropdown entry does not prove that an account can use the model.")
heading("Verification and limits")
text("Check provider/model resolution without real API calls, all nine model dropdowns, blank input, manual input, retry selection and cost states. No permanent test framework is configured. Before a live paid check, get approval for its expected cost.")
text("The approved live check completed one short Rewrite request on Luna through manual input. Selected-text capture still failed in that test, so the cause is unresolved. The manual form is the working fallback. No database, server backend or browser automation code changed.")
heading("Undo or update the handover")
text("For a pushed change: <b>git revert &lt;commit&gt;</b>, then push the revert. Run npm ci and npm run dev to reinstall the reverted local extension, then Ctrl+C. A Git revert does not reset saved Raycast preferences; check them separately.")
text("Edit <b>docs/build_handover.py</b> and run <b>python3 docs/build_handover.py</b> with reportlab installed. Inspect every PDF page before committing. Architecture rules live in CLAUDE.md; AGENTS.md points agents to them.")
heading("Official references")
text('<link href="https://developers.openai.com/api/docs/changelog" color="#245B78">OpenAI changelog</link>: Luna released 2026-09-22; Sol 6.1 released 2026-09-29.<br/><link href="https://platform.claude.com/docs/en/models/overview" color="#245B78">Claude catalog</link> and <link href="https://developers.raycast.com/basics/create-your-first-extension" color="#245B78">Raycast setup</link>: checked ' + CHECKED + '; publication dates not shown.')


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#DCE6EC"))
    canvas.line(44, 36, A4[0] - 44, 36)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(BLUE)
    canvas.drawString(44, 23, "ChatGPT Quick Actions | Developer handover | " + CHECKED)
    canvas.drawRightString(A4[0] - 44, 23, str(doc.page))
    canvas.restoreState()


if __name__ == "__main__":
    document = SimpleDocTemplate(str(OUTPUT), pagesize=A4, rightMargin=44,
                                 leftMargin=44, topMargin=44, bottomMargin=50,
                                 title="ChatGPT Quick Actions - Developer Handover",
                                 author="ChatGPT Quick Actions contributors")
    document.build(story, onFirstPage=footer, onLaterPages=footer)
    print(OUTPUT)
