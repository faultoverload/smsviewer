"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Core = require("../core.js");

test("normalizes local numbers using the selected country", () => {
    assert.equal(Core.normalizePhoneNumber("0176 1234567", "DE"), "+491761234567");
    assert.equal(Core.normalizePhoneNumber("(212) 555-0123", "US"), "+12125550123");
    assert.equal(Core.normalizePhoneNumber("020 7946 0018", "GB"), "+442079460018");
    assert.equal(Core.normalizePhoneNumber("090-1234-5678", "JP"), "+819012345678");
});

test("preserves explicit international numbers independently of the selected country", () => {
    assert.equal(Core.normalizePhoneNumber("+49 (0)176 1234567", "US"), "+491761234567");
    assert.equal(Core.normalizePhoneNumber("0044 20 7946 0018", "DE"), "+442079460018");
});

test("does not guess local numbers when no country is configured", () => {
    assert.equal(Core.normalizePhoneNumber("0176 1234567"), "01761234567");
});

test("preserves alphanumeric sender IDs and rejects empty addresses", () => {
    assert.equal(Core.normalizePhoneNumber("Vodafone Info", "DE"), "Vodafone Info");
    assert.equal(Core.normalizePhoneNumber("insert-address-token", "DE"), null);
    assert.equal(Core.normalizePhoneNumber("null", "DE"), null);
    assert.equal(Core.normalizePhoneNumber("", "DE"), null);
});

test("normalizes unknown contact names", () => {
    assert.equal(Core.normalizeContactName("Unknown"), null);
    assert.equal(Core.normalizeContactName("(Unknown)"), null);
    assert.equal(Core.normalizeContactName(" Alice "), "Alice");
});

test("decodes XML entities including numeric entities", () => {
    assert.equal(Core.decodeXMLEntities("A &amp; B &lt; C &#33; &#x1F600;"), "A & B < C ! 😀");
});

test("CSV fields are quoted and spreadsheet formulas are neutralized", () => {
    const row = Core.messageToCSVRow(
        {
            readableDate: "20 July 2026, 12:00",
            type: "1",
            kind: "sms",
            attachmentCount: 0,
            body: '=HYPERLINK("https://example.invalid","click")',
        },
        { name: "Müller, Peter", displayAddress: "+491761234567" }
    );
    assert.match(row, /"Müller, Peter"/);
    assert.match(row, /"'=/);
    assert.match(row, /""https:\/\/example\.invalid""/);
});

test("country options include multiple regions", () => {
    const options = Core.getCountryOptions("en");
    assert.ok(options.some((entry) => entry.code === "DE" && entry.callingCode === "49"));
    assert.ok(options.some((entry) => entry.code === "JP" && entry.callingCode === "81"));
    assert.ok(options.length > 200);
});

test("prepares emoji and unsupported Unicode safely for the built-in PDF font", () => {
    const result = Core.preparePDFText("Ich habe einen Kunden für Dich. 😜\n日本語");
    assert.equal(result.text, "Ich habe einen Kunden für Dich. [emoji]\n???");
    assert.equal(result.emojiReplacements, 1);
    assert.equal(result.unsupportedReplacements, 3);
    assert.equal(result.replacementCount, 4);
});

test("PDF text preparation preserves German and WinAnsi punctuation", () => {
    const result = Core.preparePDFText("Grüße – 25 € … ‘Test’");
    assert.equal(result.text, "Grüße – 25 € … ‘Test’");
    assert.equal(result.replacementCount, 0);
});

test("formats interface counts with English separators", () => {
    assert.equal(Core.formatNumber(16153), "16,153");
});
