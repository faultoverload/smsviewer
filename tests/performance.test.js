"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
require("../core.js");
const Parser = require("../stream-parser.js");

test("stream parser handles 100,000 records without constructing a complete XML document", { timeout: 30000 }, () => {
    let count = 0;
    const parser = Parser.createParser({ onRecord() { count += 1; } });
    parser.write('<smses count="100000">');
    for (let index = 0; index < 100000; index += 1) {
        parser.write(`<sms address="+12125550123" date="${index}" body="Message ${index}" type="1" />`);
    }
    parser.write("</smses>");
    const summary = parser.finish();
    assert.equal(count, 100000);
    assert.equal(summary.recordCount, 100000);
});
