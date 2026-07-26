# SMS Viewer and Exporter

Version 2 is an offline-first browser application for viewing, searching, and exporting XML message backups created by the Android app **SMS Backup & Restore** by SyncTech. This project is independent and is not affiliated with or endorsed by SyncTech.

## What Version 2 changes

- All application and third-party files are bundled locally; no CDN is contacted.
- Local phone numbers are normalized using a user-selected default country.
- International numbers beginning with `+` or `00` keep their own country code.
- XML files are read as a stream instead of being loaded into one large DOM document.
- Parsed records are stored in IndexedDB instead of being held entirely in memory.
- Conversations use a window of at most 200 rendered messages at a time.
- Imports show progress and can be cancelled safely.
- SMS and MMS text records are supported.
- MMS attachment metadata is shown, while large base64 media payloads are skipped during indexing.
- Full-backup CSV and JSON exports can stream directly to disk in supported browsers.
- The application remains entirely client-side: message contents are not uploaded by this project.

## Supported input

The viewer intentionally supports the message-backup XML format produced by **SMS Backup & Restore**. It is not a general XML, database, VMSG, or CSV viewer.

Supported records:

- `<sms>` messages
- `<mms>` messages, including text parts and attachment metadata
- SMS/MMS records interleaved under the `<smses>` root element

Not currently displayed:

- decoded MMS images, audio, or video
- call-log backups under a `<calls>` root element
- encrypted or compressed backups that have not first been extracted by the user

## First start and country selection

On first start, the viewer asks for the country where the phone was used when the backup was created. This setting is used only for local numbers without an explicit international prefix.

Example with Germany selected:

```text
0176 1234567     -> +49 176 1234567
+49 176 1234567  -> +49 176 1234567
```

A number beginning with `+` or `00` is parsed as an international number regardless of the selected country. The setting can be changed later, but an already imported backup must be imported again before its existing index uses the new country.

## Installation

Clone the repository:

```bash
git clone https://github.com/petrk94/smsviewer.git
cd smsviewer
```

Downloadable source archives are also available from the GitHub Releases page.

## Running the viewer

### Recommended

Serve the folder through a local web server or publish it through GitHub Pages:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

This gives the browser a normal origin and provides the most reliable IndexedDB, persistent-storage, and streaming-export behavior.

### Direct file opening

Opening `index.html` directly may work for ordinary imports, depending on the browser. Very large backups should be opened through `http://localhost` or HTTPS because browser storage and file-export capabilities are more reliable in a secure origin.

## Large-backup design

Version 2 does not promise that every multi-gigabyte backup will fit within every browser's local storage quota. It is designed to avoid the two most common failure modes:

1. The XML file is never converted into one complete in-memory DOM tree.
2. MMS base64 media values are scanned and skipped rather than retained in JavaScript memory or IndexedDB.

Messages are written to IndexedDB in batches. Only one 200-message conversation window is rendered at a time. For backups containing very large amounts of text, the browser still needs enough local storage for the indexed message text and metadata.

## Exports

- **CSV:** complete indexed backup
- **JSON:** complete indexed backup
- **PDF:** selected conversation, limited to 5,000 messages to prevent browser-memory exhaustion
- **Print:** currently visible 200-message window, rendered by the browser with its full installed Unicode-font support

The compact PDF export uses jsPDF's built-in Helvetica font. Emoji are written as `[emoji]`, and characters outside that font's supported encoding are written as `?`. This prevents the broken spacing and clipped lines that raw emoji surrogate pairs can otherwise cause in standard-font PDFs. These substitutions affect only the PDF; the original messages remain unchanged in the viewer, CSV, and JSON exports. Use **Print current page (Unicode)** and the browser's **Save as PDF** option when exact emoji or non-Latin glyphs are required.

Chromium-based browsers in a secure context can stream CSV and JSON directly to a user-selected file. Other browsers use an in-memory Blob fallback for backups of up to 100,000 records.

## Privacy and security

- The backup is processed locally in the browser.
- Production HTML references only local scripts and stylesheets.
- The Content Security Policy blocks network connections from the application.
- No analytics, tracking, remote fonts, advertisements, or upload endpoint are included.
- A local IndexedDB index remains in the browser so the last completed import can be restored after reload.

Anyone with access to the same browser profile may be able to access that local index. Clear the site's browser storage when working on a shared computer.

## Third-party software and licenses

Exact dependency versions and their license files are documented in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md). File sizes and SHA-256 checksums are recorded in [`vendor/manifest.json`](vendor/manifest.json). The short answer is: yes, redistributed libraries should be identified, and their required copyright and license notices must be retained. Version 2 keeps those notices both in the vendor files and in `vendor/licenses/`.

## Development

Install the exact dependencies:

```bash
npm ci
```

Rebuild the local vendor directory:

```bash
npm run vendor
```

Run tests:

```bash
npm test
npm run test:performance
npm run test:browser
npm run test:syntax
```

## Project license

The original project code is released under the MIT License. See [`LICENSE`](LICENSE). Third-party components remain under their respective licenses.
