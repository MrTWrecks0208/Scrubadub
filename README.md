# Scrubadub End-User Documentation

Scrubadub is a real-time multi-string search and replace tool for developers, data analysts, security engineers, and privacy-conscious users. It allows you to find and replace any number of strings of text within a large body of text.

---

## Table of Contents

- [Overview](#overview)
- [Layout](#layout)
- [Getting Started](#getting-started)
  - [Rules & Rule Sets](#rules--rule-sets)
    - [Creating Rules](#creating-rules)
      - [Renaming Rules](#renaming-rules)
      - [Entering Patterns](#entering-patterns)
        - [Regular Expressions](#regular-expressions)
        - [AI Rule Generator](#ai-rule-generator)
      - [Replace With](#replace-with)
      - [Flags](#flags)
      - [Enable/Disable](#enabledisable)
    - [Saving Rules](#saving-rules)
      - [Rule Sets](#rule-sets)
  - [Source Input](#source-input)
    - [Matched Regions](#matched-regions)
    - [Generate Sample Data](#generate-sample-data)
  - [Scrubbed Output](#scrubbed-output)
    - [Copy](#copy)
    - [Download](#download)
    - [Stats](#stats)
  - [Accounts](#accounts)
    - [Must have account to save custom rule sets](#must-have-account-to-save-custom-rule-sets)
- [Additional Resources](#additional-resources)
  - [RegEx Cheat Sheet (regex101.com)](#regex-cheat-sheet-regex101com)

---

## 🔍 Overview

**Scrubadub** is an interactive, browser-based text scrubbing and transformation tool. It enables you to chain multiple Regular Expression, string, or pattern rules together into an ordered rule set that processes raw text, redacts sensitive information (PII), strips unwanted markup, normalizes logs, and formats structured data in real time.

### Key Principles
- **Sequential Execution**: Rules run from top to bottom. Each rule operates on the transformed output of the rule that preceded it.
- **Real-Time Visual Validation**: Text matching your active regular expressions, strings, and/or patterns is highlighted live in the source input box with high-contrast indicator bands before changes are finalized.
- **AI-Assisted Rule Synthesis**: Describe what you want to extract or redact in natural language, and the integrated Gemini AI will generate, validate, and explain the regular expression for you.
- **Client-Side Privacy First**: All pattern matching, replacements, and data processing happen entirely within your local browser at runtime. Your text is never transmitted to an external server for processing or storing.

---

## 📐 Layout

The Scrubadub workspace is organized into two primary columns below the top header and preset bar:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  HEADER: Logo                                                Auth / Account      |
|          Built-in Rule Sets                                                      |
|          Custom Rule Sets                                                        |
├─────────────────────────────────────────┬────────────────────────────────────────┤
│  LEFT COLUMN (Editor Panels)            │  RIGHT COLUMN (Rules Management)       │
│                                         │                                        │
│  1. Source Input (Top)                  │  1. AI Rule Generator                  │
│     - Raw text editor                   │     - Prompt-to-regex generator        │
│     - Live match highlighting overlay   │                                        │
│     - Generate Sample Data              │  2. Rules List                         │
│     - Clear Input                       │     - Add Rule & Save Rule Set actions |
│                                         |     - Ordered rule cards               |
│  2. Scrubbed Output (Bottom)            │     - Renaming, Patterns, Flags,       │
│     - Real-time result                  │       Replace With, & Enable/Disable   │
│     - Copy & Download actions           │                                        │
│     - Matches & character stats         │                                        │
└─────────────────────────────────────────┴────────────────────────────────────────┘
```

1. **Header & Rule Sets Bar (Top)**:
   - Cards for built-in rule sets (*PII Redactor*, *HTML Stripper*, *Log Cleaner*, *Code Minifier*).
   - Cards for your custom rule sets
   - User account & authentication menu.
2. **Left Column (Source Input & Scrubbed Output)**:
   - **Source Input (Top Left)**: Enter or paste your raw text. Live color-coded overlays highlight all matched regions directly under your text cursor. Includes a sample data generator and clear button.
   - **Scrubbed Output (Bottom Left)**: Displays the live result right below the source input, complete with buttons to copy to clipboard and download, plus real-time match/alteration statistics.
3. **Right Column (Rules Management)**:
   - **AI Rule Generator (Top Right)**: Describe matching patterns in plain English to have the AI create regular expressions for you.
   - **Rules List (Bottom Right)**: Add rules, reorder them, adjust regex patterns and replacements, toggle flags (`g`, `i`, `m`, `s`), enable/disable rules, and save your rules into custom rule sets.

---

<details open>

<summary>🚀 Getting Started</summary>
<br/>
To get started using Scrubadub, simply paste your body of text into the textbox on the left-hand side of the screen labeled 'Source Input'. Then, start creating rules to scrub the text.

</details>

<details>
<summary>Source Input</summary>
<br/>
The **Source Input** pane (top-left) is your raw document workspace.

#### Matched Regions
- As you enter, paste, or edit text in the Source Input, Scrubadub highlights every matched text segment in real time.
- Matches from active rules are rendered with distinct visual highlight boxes synchronized behind the text cursor, allowing you to verify exactly what will be modified before you export your data.

#### Generate Sample Data
- To test rules immediately without exposing real customer data or searching for test files, click the **`Generate Sample Data`** button above the source editor.
- Scrubadub automatically injects structured test data tailored to your active rules (including realistic mock emails, phone numbers, IP addresses, JSON objects, or server logs).

</details>

<details>
  
<summary>📋 Rules & Rule Sets</summary>
<br/>
The engine operates on an ordered list of rules. When text is entered into the Source Input, it passes through Rule 1; the resulting text is then fed directly into Rule 2, and so on through the end of your active rules.
## Rules
<br/>
#### Creating Rules
- Click the **`+ Add Rule`** button in the Rules panel to append a new blank rule.
- You can create as many rules as needed to handle distinct patterns independently.
- Alternatively, clicking any **Built-in Rule Set** in the top bar will populate your workspace with a curated set of rules tailored to that specific domain.

##### Renaming Rules
- Click directly on the rule name field (e.g., `Rule 1`, `Rule 2`) to assign a meaningful label, such as *"Redact SSNs"*, *"Strip <script> tags"*, or *"Mask IPv4 Addresses"*.
- Naming rules can make it easier to inspect, debug, and maintain.

##### Entering Patterns

###### Regular Expressions
- In the **Pattern** input field, type standard regular expression syntax (without enclosing forward slashes `/`).
- **Examples**:
  - `\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b` (Email addresses)
  - `\b\d{3}-\d{2}-\d{4}\b` (US Social Security Numbers)
  - `(?:\d{1,3}\.){3}\d{1,3}` (IPv4 Addresses)
  - `<[^>]+>` (HTML tags)
- **Live Syntax Validation**: If your regex contains an invalid token or an unclosed group, an error indicator will immediately alert you without interrupting your session.

###### AI Rule Generator
- If you are new to regex and/or don't know the exact syntax or are dealing with complex edge cases:
  1. Click the **`AI Assistant`** / **`Generate with AI`** button in the header or rule section.
  2. Enter a natural language description of what you want to match, such as:
     - *"Match Canadian postal codes like A1A 1A1"*
     - *"Find all UUID v4 strings"*
     - *"Match ISO 8601 formatted timestamps (YYYY-MM-DDTHH:MM:SSZ)"*
     - *"Extract dollar amounts like $1,250.00"*
  3. The Gemini AI synthesizes the regular expression, provides a step-by-step breakdown of how the tokens work, and inserts the completed rule into your rules list with recommended flags.

##### Replace With
- In the **Replace With** field, enter the replacement string that will substitute for each matched occurrence.
- **Blank / Empty (Default)**: If left blank, matched text will simply be removed from the final output.
- **Literal Text Replacement**: Enter literal placeholder strings such as `[REDACTED]`, `***`, `HIDDEN`, or `0.0.0.0`.
- **Capture Groups & Backreferences**: You can use standard regex replacement tokens to rearrange or preserve parts of the matched text:
  - `$1`, `$2`, `$3`: References capture groups `(...)` defined in your pattern.
  - `$&`: Inserts the entire matched substring.
  - *Example*: Pattern `(\w+)\s(\w+)` with Replace With `$2, $1` transforms `"John Doe"` into `"Doe, John"`.

##### Flags
Each rule includes toggleable flag pills that alter regular expression engine behavior:
- **`g` (Global Match)**: Finds all matches across the entire text rather than stopping after the first occurrence. (Recommended).
- **`i` (Case Insensitive)**: Ignores character casing so that `[a-z]` matches uppercase letters as well.
- **`m` (Multiline Mode)**: Treats the beginning (`^`) and end (`$`) assertions as matching the start and end of each individual line, rather than the start and end of the entire input string.
- **`s` (DotAll / Single Line)**: Allows the dot `.` wildcard to match newline characters (`\n`), enabling matches that span across multiple lines.

##### Enable/Disable
- Every rule card includes an **Active Toggle switch**.
- You can turn individual rules off temporarily to test how the rest of your rules behave, without having to delete the rule or lose its configuration.

</details>

## Rule Sets
<br/>
- Once you have configured and tested your rules, you can bundle them into a permanent **Rule Set**.
- Click the **`Save Rule Set`** button in the top action bar or rules header.
- Provide a name (e.g., *"Kubernetes Log Sanitizer"*) and an optional description.
- Your saved rule sets will appear in the **Custom Rule Sets** bar at the top for one-click loading on any device where you are signed in.
- You can manage, update, or delete existing custom rule sets from the custom rule sets bar.
</details>

<details>
<summary>💾 Saving Rules</summary>
######<strong>Note</strong>: Scrubadub requires an account in order to save custom rule sets and have them sync across devices. 
<br/>
### Accounts

- **Free Access**: Creating an account is completely free.
- **Feature Access**: Anyone can use Scrubadub for free with no restrictions and without creating an account. However, you **must create an account to save and manage custom rule sets** in the cloud and have them sync across devices.
- **Strict Data Privacy & Ownership Policy**:
  - **Your data belongs to you.**
  - We will **never sell, share, or provide your data** to any third party.
  - We do **not** use your data for advertising, marketing, monetization, or promotional purposes.
  - All text scrubbing operations execute purely within your local browser window.
</details>

<details>
<summary>📑 Scrubbed Output</summary>
<br/>
The **Scrubbed Output** pane (bottom-left, right below the Source Input) displays the real-time, sanitized result produced by executing your active rules against the source text.

### Copy
- Click the **`Copy`** button in the output panel header to copy the entire scrubbed text directly to your clipboard.
- A visual checkmark confirmation verifies that the text was copied successfully.

### Download
- Click the **`Download`** button to export the scrubbed output as a clean `.txt` plain-text file to your local computer.

### Stats
The telemetry toolbar at the top of the output panel displays real-time execution analytics:
- **Matches Found**: The total count of all matched text instances across all active rules.
- **Characters Altered / Removed**: The net difference in character count between the raw input and the final scrubbed output.
- **Line & Word Counts**: Total line and word counts for the sanitized document.
- **Execution Time**: The time in milliseconds (ms) taken to execute your rules, ensuring high-throughput performance.
</details>

<details>

<summary>📑 Additional Resources</summary>
<br/>
### RegEx Cheat Sheet

For testing complex patterns, inspecting detailed regex token trees, and debugging regular expressions, visit [regex101.com](https://regex101.com).

#### Quick Reference Table

| Category | Token | Description | Example |
| :--- | :--- | :--- | :--- |
| **Character Classes** | `.` | Any single character except newline | `c.t` matches `cat`, `c0t` |
| | `\d` | Any digit `[0-9]` | `\d{3}` matches `555` |
| | `\D` | Any non-digit character `[^0-9]` | `\D+` matches `abc` |
| | `\w` | Word character `[a-zA-Z0-9_]` | `\w+` matches `user_1` |
| | `\W` | Non-word character | `\W` matches `!`, `@`, `#` |
| | `\s` | Whitespace (spaces, tabs, newlines) | `\s+` matches `   ` |
| | `\S` | Non-whitespace character | `\S+` matches non-empty text |
| **Anchors & Boundaries** | `\b` | Word boundary | `\bcat\b` matches `cat`, not `scat` |
| | `\B` | Non-word boundary | `\Bcat` matches `scat` |
| | `^` | Beginning of string (or line with `m` flag) | `^Error` |
| | `$` | End of string (or line with `m` flag) | `done$` |
| **Quantifiers** | `*` | 0 or more occurrences (greedy) | `ba*` matches `b`, `ba`, `baaa` |
| | `+` | 1 or more occurrences (greedy) | `ba+` matches `ba`, `baaa` |
| | `?` | 0 or 1 occurrence (optional) | `https?` matches `http`, `https` |
| | `{n}` | Exactly `n` occurrences | `\d{4}` matches `2026` |
| | `{n,m}` | Between `n` and `m` occurrences | `\d{2,4}` matches `12`, `123`, `1234` |
| | `*?`, `+?` | Lazy / Non-greedy quantifiers | `<.+?>` matches `<p>` in `<p>text</p>` |
| **Groups & Lookarounds** | `(...)` | Capturing group (reference with `$1`) | `(\d{3})-(\d{4})` |
| | `(?:...)` | Non-capturing group | `(?:https?\|ftp)://` |
| | `(?=...)` | Positive Lookahead (followed by) | `\d+(?=px)` matches `10` in `10px` |
| | `(?!...)` | Negative Lookahead (not followed by) | `\d+(?!px)` matches `10` in `10em` |
| | `(?<=...)` | Positive Lookbehind (preceded by) | `(?<=\$)\d+` matches `100` in `$100` |
| | `(?<!...)` | Negative Lookbehind (not preceded by)| `(?<!\$)\d+` matches `100` in `€100` |

</details>
