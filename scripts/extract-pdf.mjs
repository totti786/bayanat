import { readFile } from "node:fs/promises";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const file = process.argv[2];
const data = await readFile(file);
const pdf = await getDocument({ data: new Uint8Array(data) }).promise;

console.log("=== pages:", pdf.numPages, "===");
for (let i = 1; i <= pdf.numPages; i++) {
  const page = await pdf.getPage(i);
  const text = await page.getTextContent();
  const joined = text.items
    .map((it) => it.str)
    .join(" | ");
  console.log(`--- page ${i} ---`);
  console.log(joined.slice(0, 3000));
}
