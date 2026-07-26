"use strict";

(function exposeSMSViewerCore(globalScope, factory) {
    const phoneLibrary =
        globalScope.libphonenumber ||
        (typeof require === "function" ? require("libphonenumber-js/min") : null);
    const api = factory(phoneLibrary);

    globalScope.SMSViewerCore = api;
    if (typeof module !== "undefined" && module.exports) {
        module.exports = api;
    }
})(typeof window !== "undefined" ? window : globalThis, function createCore(phoneLibrary) {
    const UNKNOWN_CONTACT_NAMES = new Set(["unknown", "(unknown)", "null", "undefined"]);
    const UNKNOWN_ADDRESSES = new Set(["null", "undefined", "(unknown)", "insert-address-token"]);
    const ENGLISH_NUMBER_FORMAT = new Intl.NumberFormat("en-US");
    const PDF_WIN_ANSI_EXTRA = new Set([
        0x0152, 0x0153, 0x0160, 0x0161, 0x0178, 0x017d, 0x017e, 0x0192,
        0x02c6, 0x02dc, 0x2013, 0x2014, 0x2018, 0x2019, 0x201a, 0x201c,
        0x201d, 0x201e, 0x2020, 0x2021, 0x2022, 0x2026, 0x2030, 0x2039,
        0x203a, 0x20ac, 0x2122,
    ]);

    function isPDFStandardFontCharacter(codePoint) {
        return (codePoint >= 0x20 && codePoint <= 0x7e) ||
            (codePoint >= 0xa0 && codePoint <= 0xff) ||
            PDF_WIN_ANSI_EXTRA.has(codePoint);
    }

    /**
     * Prepares user-controlled text for jsPDF's built-in Helvetica font.
     *
     * The standard PDF fonts use a WinAnsi-like single-byte encoding. Passing
     * astral Unicode characters, especially emoji surrogate pairs, can corrupt
     * character spacing for the entire line. Replacements affect only the PDF;
     * the original imported data and CSV/JSON exports remain untouched.
     */
    function preparePDFText(value) {
        let text = String(value ?? "")
            .normalize("NFC")
            .replace(/\r\n?/g, "\n")
            .replace(/[\t\v\f]+/g, "    ")
            .replace(/[\u00A0\u202F]/g, " ")
            .replace(/[\u200B\u200C\u2060\uFEFF]/g, "")
            .replace(/[\u202A-\u202E\u2066-\u2069]/g, "")
            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ");

        let emojiReplacements = 0;
        let unsupportedReplacements = 0;
        const emojiPattern = /(?:[\u{1F1E6}-\u{1F1FF}]{2}|\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)/gu;

        text = text.replace(emojiPattern, () => {
            emojiReplacements += 1;
            return "[emoji]";
        });
        text = text.replace(/[\u200D\uFE0E\uFE0F]/g, "");

        let safe = "";
        for (const character of text) {
            if (character === "\n") {
                safe += character;
                continue;
            }

            const codePoint = character.codePointAt(0);
            if (isPDFStandardFontCharacter(codePoint)) {
                safe += character;
            } else {
                unsupportedReplacements += 1;
                safe += "?";
            }
        }

        return {
            text: safe
                .split("\n")
                .map((line) => line.replace(/[ ]{2,}/g, " ").trimEnd())
                .join("\n")
                .trim(),
            emojiReplacements,
            unsupportedReplacements,
            replacementCount: emojiReplacements + unsupportedReplacements,
        };
    }

    function normalizeCountry(value) {
        const country = String(value || "").trim().toUpperCase();
        return /^[A-Z]{2}$/.test(country) ? country : null;
    }

    function compactAddress(value) {
        return String(value ?? "")
            .trim()
            .replace(/[\u00A0\s().\-/]/g, "");
    }

    function normalizePhoneNumber(value, defaultCountry = null) {
        if (value === null || value === undefined) {
            return null;
        }

        const original = String(value).trim();
        if (!original || UNKNOWN_ADDRESSES.has(original.toLowerCase())) {
            return null;
        }

        // Sender IDs such as "Vodafone" are valid in SMS backups and should be kept.
        if (/[A-Za-z]/.test(original)) {
            return original.replace(/\s+/g, " ");
        }

        let compact = compactAddress(original);
        if (!compact) {
            return null;
        }

        if (compact.startsWith("00")) {
            compact = `+${compact.slice(2)}`;
        }

        const country = normalizeCountry(defaultCountry);
        const parse = phoneLibrary?.parsePhoneNumberFromString;

        if (typeof parse === "function") {
            try {
                let parsed = compact.startsWith("+") ? parse(compact) : country ? parse(compact, country) : null;

                // Some backups omit the leading + but already contain the selected calling code.
                if (!parsed && country && /^\d+$/.test(compact)) {
                    const callingCode = phoneLibrary.getCountryCallingCode?.(country);
                    if (callingCode && compact.startsWith(callingCode)) {
                        parsed = parse(`+${compact}`);
                    }
                }

                if (parsed && (parsed.isPossible?.() ?? true)) {
                    return parsed.number;
                }
            } catch (_error) {
                // Preserve the source value when phone metadata cannot parse it safely.
            }
        }

        // Without a configured country, never guess the meaning of a local number.
        return compact;
    }

    function normalizeContactName(value) {
        if (value === null || value === undefined) {
            return null;
        }

        const normalized = String(value).trim();
        if (!normalized || UNKNOWN_CONTACT_NAMES.has(normalized.toLowerCase())) {
            return null;
        }
        return normalized;
    }

    function getDisplayName(contact) {
        return contact?.name || "Unknown";
    }

    function classifyMessageType(type, kind = "sms") {
        const normalizedType = String(type ?? "");
        if (kind === "mms") {
            if (normalizedType === "1") return "received";
            if (normalizedType === "2") return "sent";
            return "other";
        }

        if (normalizedType === "1") return "received";
        if (normalizedType === "2") return "sent";
        return "other";
    }

    function getMessageStatus(type, kind = "sms") {
        const value = String(type ?? "");
        if (kind === "mms") {
            return ({ "1": "Received", "2": "Sent", "3": "Draft", "4": "Outbox" })[value] || "Other";
        }
        return (
            {
                "1": "Received",
                "2": "Sent",
                "3": "Draft",
                "4": "Outbox",
                "5": "Failed",
                "6": "Queued",
            }[value] || "Other"
        );
    }

    function decodeXMLEntities(value) {
        return String(value ?? "").replace(
            /&(?:#(\d+)|#x([0-9a-fA-F]+)|amp|lt|gt|quot|apos);/g,
            (match, decimal, hexadecimal) => {
                if (decimal) return String.fromCodePoint(Number.parseInt(decimal, 10));
                if (hexadecimal) return String.fromCodePoint(Number.parseInt(hexadecimal, 16));
                return (
                    {
                        "&amp;": "&",
                        "&lt;": "<",
                        "&gt;": ">",
                        "&quot;": '"',
                        "&apos;": "'",
                    }[match] || match
                );
            }
        );
    }

    function protectSpreadsheetFormula(value) {
        const text = String(value ?? "");
        return /^\s*[=+\-@]/.test(text) ? `'${text}` : text;
    }

    function escapeCSVField(value) {
        const protectedValue = protectSpreadsheetFormula(value);
        return `"${protectedValue.replace(/"/g, '""')}"`;
    }

    function messageToCSVRow(message, contact) {
        return [
            getDisplayName(contact),
            contact.displayAddress || contact.contactKey || "",
            message.readableDate || (message.timestamp ? new Date(message.timestamp).toISOString() : ""),
            getMessageStatus(message.type, message.kind),
            message.kind?.toUpperCase() || "SMS",
            message.attachmentCount || 0,
            message.body || "",
        ]
            .map(escapeCSVField)
            .join(",");
    }

    function getCSVHeader() {
        return ["Name", "Phone", "Date", "Direction", "Kind", "Attachments", "Message"]
            .map(escapeCSVField)
            .join(",");
    }

    function sanitizeFilename(value, fallback = "export") {
        const sanitized = String(value ?? "")
            .normalize("NFKC")
            .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
            .replace(/\s+/g, " ")
            .replace(/[. ]+$/g, "")
            .trim()
            .slice(0, 120);
        return sanitized || fallback;
    }

    function formatBytes(bytes) {
        const numeric = Number(bytes) || 0;
        if (numeric < 1024) return `${numeric} B`;
        const units = ["KB", "MB", "GB", "TB"];
        let value = numeric;
        let index = -1;
        do {
            value /= 1024;
            index += 1;
        } while (value >= 1024 && index < units.length - 1);
        return `${value >= 10 ? value.toFixed(1) : value.toFixed(2)} ${units[index]}`;
    }

    function formatNumber(value) {
        const numeric = Number(value);
        return ENGLISH_NUMBER_FORMAT.format(Number.isFinite(numeric) ? numeric : 0);
    }

    function getCountryOptions(displayLocale = "en") {
        if (!phoneLibrary?.getCountries || !phoneLibrary?.getCountryCallingCode) {
            return [];
        }
        const names = typeof Intl.DisplayNames === "function"
            ? new Intl.DisplayNames([displayLocale], { type: "region" })
            : null;

        return phoneLibrary
            .getCountries()
            .map((code) => ({
                code,
                name: names?.of(code) || code,
                callingCode: phoneLibrary.getCountryCallingCode(code),
            }))
            .sort((left, right) => left.name.localeCompare(right.name, displayLocale));
    }

    function inferCountryFromLocale(localeValue) {
        const locale = String(localeValue || "").replace("_", "-");
        const parts = locale.split("-");
        const region = parts.find((part, index) => index > 0 && /^[A-Za-z]{2}$/.test(part));
        const country = normalizeCountry(region);
        if (!country || !phoneLibrary?.getCountries?.().includes(country)) {
            return null;
        }
        return country;
    }

    return {
        normalizeCountry,
        normalizePhoneNumber,
        normalizeContactName,
        getDisplayName,
        classifyMessageType,
        getMessageStatus,
        decodeXMLEntities,
        protectSpreadsheetFormula,
        escapeCSVField,
        getCSVHeader,
        messageToCSVRow,
        sanitizeFilename,
        formatBytes,
        formatNumber,
        getCountryOptions,
        inferCountryFromLocale,
        preparePDFText,
    };
});
