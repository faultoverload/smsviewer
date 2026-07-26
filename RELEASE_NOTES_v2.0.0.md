# SMS Viewer and Exporter v2.0.0

Version 2 is a major rewrite of the browser-based viewer for XML backups created by **SMS Backup & Restore**. The application remains entirely client-side and now works without CDNs or runtime network requests.

## Highlights

- Fully offline application with all production dependencies bundled locally
- Streaming XML parser for large backups instead of loading the complete file into a DOM
- IndexedDB-backed storage and windowed rendering of up to 200 messages at a time
- Country-aware international phone-number normalization
- Import progress, cancellation, cleanup, and restoration of the last completed local index
- SMS and text-focused MMS support, including attachment metadata
- Complete CSV and JSON export plus selected-conversation PDF export
- Stable PDF wrapping and safe handling of emoji and unsupported standard-font characters
- English-only interface and documentation
- Automated parser, database, static, performance, syntax, and browser tests

## Privacy

Messages stay in the browser. The production application contains no analytics, tracking, remote fonts, advertisements, upload endpoint, or external CDN calls. Its Content Security Policy blocks network connections.

## Upgrade notes

Version 2 uses a new IndexedDB data model and a first-run default-country setting. Import the XML backup again after upgrading so the new index and phone-number normalization are applied.

## Verified release test

The project owner successfully imported a real 8 MB backup containing 16,153 records from 413 contacts. Automated tests additionally cover a streamed 100,000-record fixture, conversations exceeding 200 messages, search, pagination, MMS metadata, and PDF generation.

## Known limits

- Browser storage quota still depends on the browser, profile, device, and available disk space.
- Compact PDF export is limited to 5,000 messages and substitutes unsupported glyphs. Browser printing preserves installed Unicode-font support for the visible page.
- MMS media is not decoded or previewed; text and attachment metadata are indexed.
- Firefox, Edge, very large real backups above 100 MB, and real MMS fixtures remain recommended follow-up tests.

See [`CHANGELOG.md`](CHANGELOG.md), [`V2_AUDIT.md`](V2_AUDIT.md), and [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) for complete details.
