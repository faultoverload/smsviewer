"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

test("production HTML uses only local assets", () => {
    const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
    assert.doesNotMatch(html, /https?:\/\//i);
    const localReferences = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
        .map((match) => match[1])
        .filter((reference) => !reference.startsWith("#"));
    for (const reference of localReferences) {
        assert.ok(fs.existsSync(path.join(root, reference)), `Missing local asset: ${reference}`);
    }
});

test("bundled dependency versions are documented", () => {
    const notices = fs.readFileSync(path.join(root, "THIRD_PARTY_NOTICES.md"), "utf8");
    assert.match(notices, /Bootstrap 5\.3\.8/);
    assert.match(notices, /jsPDF 4\.2\.1/);
    assert.match(notices, /libphonenumber-js 1\.13\.9/);
});

test("vendor manifest matches the bundled local files", () => {
    const crypto = require("node:crypto");
    const manifest = JSON.parse(fs.readFileSync(path.join(root, "vendor/manifest.json"), "utf8"));
    for (const entry of manifest.files) {
        const content = fs.readFileSync(path.join(root, entry.path));
        const sha256 = crypto.createHash("sha256").update(content).digest("hex");
        assert.equal(sha256, entry.sha256, `Checksum mismatch: ${entry.path}`);
        assert.equal(content.byteLength, entry.bytes, `Size mismatch: ${entry.path}`);
    }
});
