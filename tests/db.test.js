"use strict";

require("fake-indexeddb/auto");
const test = require("node:test");
const assert = require("node:assert/strict");
const DB = require("../db.js");

test("IndexedDB stores, restores, pages, searches, and clears an import", async () => {
    const metadata = {
        id: "active",
        status: "importing",
        fileName: "test.xml",
        recordCount: 3,
        messageCount: 3,
    };
    await DB.beginImport(metadata);
    await DB.putContacts([
        {
            importId: "active",
            contactKey: "+12125550123",
            displayAddress: "+12125550123",
            name: "Alice",
            sortName: "alice",
            messageCount: 3,
            mmsCount: 0,
        },
    ]);
    await DB.putMessages([
        {
            importId: "active",
            sequence: 0,
            contactKey: "+12125550123",
            timestampSort: 10,
            timestamp: 10,
            body: "first",
        },
        {
            importId: "active",
            sequence: 1,
            contactKey: "+12125550123",
            timestampSort: 20,
            timestamp: 20,
            body: "needle",
        },
        {
            importId: "active",
            sequence: 2,
            contactKey: "+12125550123",
            timestampSort: 30,
            timestamp: 30,
            body: "third",
        },
    ]);

    metadata.status = "complete";
    await DB.updateImport(metadata);
    assert.equal((await DB.getActiveImport()).status, "complete");
    assert.equal((await DB.getContacts("active")).length, 1);
    assert.deepEqual(
        (await DB.getMessagePage("active", "+12125550123", 1, 1)).map((message) => message.body),
        ["needle"]
    );
    assert.deepEqual(
        (await DB.searchMessages("active", "+12125550123", "need")).map((message) => message.body),
        ["needle"]
    );
    assert.deepEqual(
        (await DB.getMessageBatch("active", 0, 2)).map((message) => message.sequence),
        [1, 2]
    );

    await DB.setSetting("defaultCountry", "US");
    assert.equal(await DB.getSetting("defaultCountry"), "US");

    await DB.clearImportData();
    assert.equal(await DB.getActiveImport(), null);
    assert.equal((await DB.getContacts("active")).length, 0);
    assert.equal(await DB.getSetting("defaultCountry"), "US");
});
