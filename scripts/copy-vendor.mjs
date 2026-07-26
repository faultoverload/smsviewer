import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const copies = [
    ["bootstrap", "node_modules/bootstrap/dist/css/bootstrap.min.css", "vendor/bootstrap/bootstrap.min.css"],
    ["bootstrap", "node_modules/bootstrap/dist/js/bootstrap.bundle.min.js", "vendor/bootstrap/bootstrap.bundle.min.js"],
    ["jspdf", "node_modules/jspdf/dist/jspdf.umd.min.js", "vendor/jspdf/jspdf.umd.min.js"],
    ["libphonenumber-js", "node_modules/libphonenumber-js/bundle/libphonenumber-min.js", "vendor/libphonenumber/libphonenumber-min.js"],
    ["bootstrap", "node_modules/bootstrap/LICENSE", "vendor/licenses/bootstrap-LICENSE.txt"],
    ["jspdf", "node_modules/jspdf/LICENSE", "vendor/licenses/jspdf-LICENSE.txt"],
    ["libphonenumber-js", "node_modules/libphonenumber-js/LICENSE", "vendor/licenses/libphonenumber-js-LICENSE.txt"],
    ["libphonenumber-js", "node_modules/libphonenumber-js/LICENSE.Apache", "vendor/licenses/libphonenumber-js-LICENSE.Apache.txt"],
];

const files = [];
for (const [packageName, source, destination] of copies) {
    const sourcePath = resolve(root, source);
    const destinationPath = resolve(root, destination);
    await mkdir(dirname(destinationPath), { recursive: true });
    await copyFile(sourcePath, destinationPath);
    const content = await readFile(destinationPath);
    files.push({
        package: packageName,
        version: packageJson.dependencies[packageName],
        path: destination,
        sha256: createHash("sha256").update(content).digest("hex"),
        bytes: content.byteLength,
    });
    console.log(`${source} -> ${destination}`);
}

await writeFile(
    resolve(root, "vendor/manifest.json"),
    `${JSON.stringify({ generatedBy: "npm run vendor", files }, null, 2)}\n`,
    "utf8"
);
console.log("Wrote vendor/manifest.json");
