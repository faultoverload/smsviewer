"use strict";

(function exposeDatabase(globalScope, factory) {
    const api = factory();
    globalScope.SMSViewerDB = api;
    if (typeof module !== "undefined" && module.exports) {
        module.exports = api;
    }
})(typeof window !== "undefined" ? window : globalThis, function createDatabaseAPI() {
    const DB_NAME = "sms-viewer-v2";
    const DB_VERSION = 1;
    const MAX_KEY_NUMBER = Number.MAX_SAFE_INTEGER;
    let databasePromise = null;

    function requestToPromise(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error("IndexedDB request failed."));
        });
    }

    function transactionDone(transaction) {
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error || new Error("IndexedDB transaction failed."));
            transaction.onabort = () => reject(transaction.error || new Error("IndexedDB transaction was aborted."));
        });
    }

    function openDatabase() {
        if (!globalThis.indexedDB) {
            return Promise.reject(new Error("IndexedDB is not available in this browser."));
        }
        if (databasePromise) return databasePromise;

        databasePromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = () => reject(request.error || new Error("Could not open IndexedDB."));
            request.onblocked = () => reject(new Error("The local database is blocked by another open tab."));
            request.onupgradeneeded = () => {
                const db = request.result;

                if (!db.objectStoreNames.contains("imports")) {
                    db.createObjectStore("imports", { keyPath: "id" });
                }

                if (!db.objectStoreNames.contains("contacts")) {
                    const contacts = db.createObjectStore("contacts", { keyPath: ["importId", "contactKey"] });
                    contacts.createIndex("byImport", "importId", { unique: false });
                    contacts.createIndex("byImportSortName", ["importId", "sortName", "contactKey"], { unique: false });
                }

                if (!db.objectStoreNames.contains("messages")) {
                    const messages = db.createObjectStore("messages", { keyPath: ["importId", "sequence"] });
                    messages.createIndex("byImport", "importId", { unique: false });
                    messages.createIndex(
                        "byContactOrder",
                        ["importId", "contactKey", "timestampSort", "sequence"],
                        { unique: false }
                    );
                    messages.createIndex("byContact", ["importId", "contactKey"], { unique: false });
                }

                if (!db.objectStoreNames.contains("settings")) {
                    db.createObjectStore("settings", { keyPath: "key" });
                }
            };
            request.onsuccess = () => {
                const db = request.result;
                db.onversionchange = () => db.close();
                resolve(db);
            };
        });

        return databasePromise;
    }

    async function clearImportData() {
        const db = await openDatabase();
        const transaction = db.transaction(["imports", "contacts", "messages"], "readwrite");
        const done = transactionDone(transaction);
        transaction.objectStore("imports").clear();
        transaction.objectStore("contacts").clear();
        transaction.objectStore("messages").clear();
        await done;
    }

    async function beginImport(metadata) {
        const db = await openDatabase();
        const transaction = db.transaction(["imports", "contacts", "messages"], "readwrite");
        const done = transactionDone(transaction);
        transaction.objectStore("imports").clear();
        transaction.objectStore("contacts").clear();
        transaction.objectStore("messages").clear();
        transaction.objectStore("imports").put(metadata);
        await done;
    }

    async function updateImport(metadata) {
        const db = await openDatabase();
        const transaction = db.transaction("imports", "readwrite");
        const done = transactionDone(transaction);
        transaction.objectStore("imports").put(metadata);
        await done;
    }

    async function getActiveImport() {
        const db = await openDatabase();
        const transaction = db.transaction("imports", "readonly");
        const done = transactionDone(transaction);
        const values = await requestToPromise(transaction.objectStore("imports").getAll());
        await done;
        return values[0] || null;
    }

    async function putMessages(messages) {
        if (!messages.length) return;
        const db = await openDatabase();
        const transaction = db.transaction("messages", "readwrite");
        const done = transactionDone(transaction);
        const store = transaction.objectStore("messages");
        messages.forEach((message) => store.put(message));
        await done;
    }

    async function putContacts(contacts) {
        if (!contacts.length) return;
        const db = await openDatabase();
        const transaction = db.transaction("contacts", "readwrite");
        const done = transactionDone(transaction);
        const store = transaction.objectStore("contacts");
        contacts.forEach((contact) => store.put(contact));
        await done;
    }

    async function getContacts(importId) {
        const db = await openDatabase();
        const transaction = db.transaction("contacts", "readonly");
        const done = transactionDone(transaction);
        const index = transaction.objectStore("contacts").index("byImportSortName");
        const range = IDBKeyRange.bound([importId, "", ""], [importId, "\uffff", "\uffff"]);
        const values = await requestToPromise(index.getAll(range));
        await done;
        return values;
    }

    async function getContact(importId, contactKey) {
        const db = await openDatabase();
        const transaction = db.transaction("contacts", "readonly");
        const done = transactionDone(transaction);
        const value = await requestToPromise(transaction.objectStore("contacts").get([importId, contactKey]));
        await done;
        return value || null;
    }

    function contactOrderRange(importId, contactKey) {
        return IDBKeyRange.bound(
            [importId, contactKey, -MAX_KEY_NUMBER, -MAX_KEY_NUMBER],
            [importId, contactKey, MAX_KEY_NUMBER, MAX_KEY_NUMBER]
        );
    }

    async function getMessagePage(importId, contactKey, offset, limit) {
        const db = await openDatabase();
        const transaction = db.transaction("messages", "readonly");
        const done = transactionDone(transaction);
        const index = transaction.objectStore("messages").index("byContactOrder");
        const request = index.openCursor(contactOrderRange(importId, contactKey), "next");
        const values = [];

        await new Promise((resolve, reject) => {
            let advanced = false;
            request.onerror = () => reject(request.error || new Error("Could not load messages."));
            request.onsuccess = () => {
                const cursor = request.result;
                if (!cursor || values.length >= limit) {
                    resolve();
                    return;
                }
                if (!advanced && offset > 0) {
                    advanced = true;
                    cursor.advance(offset);
                    return;
                }
                advanced = true;
                values.push(cursor.value);
                cursor.continue();
            };
        });

        await done;
        return values;
    }

    async function searchMessages(importId, contactKey, searchTerm, maxResults = 500, onProgress = null) {
        const normalizedTerm = String(searchTerm || "").toLocaleLowerCase();
        if (!normalizedTerm) return [];

        const db = await openDatabase();
        const transaction = db.transaction("messages", "readonly");
        const done = transactionDone(transaction);
        const index = transaction.objectStore("messages").index("byContactOrder");
        const request = index.openCursor(contactOrderRange(importId, contactKey), "next");
        const values = [];
        let scanned = 0;

        await new Promise((resolve, reject) => {
            request.onerror = () => reject(request.error || new Error("Conversation search failed."));
            request.onsuccess = () => {
                const cursor = request.result;
                if (!cursor || values.length >= maxResults) {
                    resolve();
                    return;
                }
                scanned += 1;
                const message = cursor.value;
                if (String(message.body || "").toLocaleLowerCase().includes(normalizedTerm)) {
                    values.push(message);
                }
                if (onProgress && scanned % 1000 === 0) onProgress(scanned);
                cursor.continue();
            };
        });

        await done;
        return values;
    }

    async function getMessageBatch(importId, afterSequence = -1, limit = 1000) {
        const db = await openDatabase();
        const transaction = db.transaction("messages", "readonly");
        const done = transactionDone(transaction);
        const store = transaction.objectStore("messages");
        const range = IDBKeyRange.bound([importId, afterSequence + 1], [importId, MAX_KEY_NUMBER]);
        const values = await requestToPromise(store.getAll(range, limit));
        await done;
        return values;
    }

    async function getContactMessageBatch(importId, contactKey, offset, limit) {
        return getMessagePage(importId, contactKey, offset, limit);
    }

    async function getSetting(key) {
        const db = await openDatabase();
        const transaction = db.transaction("settings", "readonly");
        const done = transactionDone(transaction);
        const value = await requestToPromise(transaction.objectStore("settings").get(key));
        await done;
        return value?.value ?? null;
    }

    async function setSetting(key, value) {
        const db = await openDatabase();
        const transaction = db.transaction("settings", "readwrite");
        const done = transactionDone(transaction);
        transaction.objectStore("settings").put({ key, value });
        await done;
    }

    return {
        DB_NAME,
        openDatabase,
        clearImportData,
        beginImport,
        updateImport,
        getActiveImport,
        putMessages,
        putContacts,
        getContacts,
        getContact,
        getMessagePage,
        searchMessages,
        getMessageBatch,
        getContactMessageBatch,
        getSetting,
        setSetting,
    };
});
