// Reads the text out of an uploaded PDF with pdf.js (vendor/pdfjs, Apache-2.0).
// pdf.js is imported only when a PDF is actually uploaded, so normal page loads stay light.
// Errors are thrown as Error("password" | "scanned" | "notpdf") so the UI can explain them.

const LIB_URL = new URL("../vendor/pdfjs/pdf.min.mjs", import.meta.url).href;
const WORKER_URL = new URL("../vendor/pdfjs/pdf.worker.min.mjs", import.meta.url).href;
const CMAP_URL = new URL("../vendor/pdfjs/cmaps/", import.meta.url).href;

let libPromise = null;

/** Load the vendored pdf.js once and point it at its worker. */
export function loadPdfJs() {
  if (!libPromise) {
    libPromise = import(LIB_URL).then((lib) => {
      lib.GlobalWorkerOptions.workerSrc = WORKER_URL;
      return lib;
    });
    libPromise.catch(() => (libPromise = null));
  }
  return libPromise;
}

/**
 * Turn pdf.js text items from one page into lines. A new line starts when the
 * vertical position changes or the item ends a line (hasEOL).
 */
export function itemsToText(items) {
  const lines = [];
  let line = "";
  let lastY = null;
  for (const it of items || []) {
    if (typeof it.str !== "string") continue; // marked-content markers have no text
    const y = Array.isArray(it.transform) ? it.transform[5] : lastY;
    if (lastY !== null && y !== null && Math.abs(y - lastY) > 2) {
      lines.push(line.trim());
      line = "";
    }
    line += it.str;
    if (it.hasEOL) {
      lines.push(line.trim());
      line = "";
      lastY = null;
    } else {
      lastY = y;
    }
  }
  lines.push(line.trim());
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Extract the text of a PDF given as a Blob/File or bytes. */
export async function pdfToText(file, lib) {
  const pdfjs = lib || (await loadPdfJs());
  const data = file instanceof Uint8Array ? file : new Uint8Array(await file.arrayBuffer());
  const task = pdfjs.getDocument({ data, cMapUrl: CMAP_URL, cMapPacked: true, isEvalSupported: false, disableFontFace: true });
  const pages = [];
  try {
    const doc = await task.promise;
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      pages.push(itemsToText(content.items));
      page.cleanup();
    }
  } catch (err) {
    if (err && err.name === "PasswordException") throw new Error("password");
    if (err && err.name === "InvalidPDFException") throw new Error("notpdf");
    throw err;
  } finally {
    await task.destroy();
  }
  const text = pages.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!text) throw new Error("scanned");
  return text;
}
