import { test } from "node:test";
import assert from "node:assert/strict";
import { checkResume, MAX_RESUME_BYTES, RESUME_HELP, safeFilename, sniffResume } from "./resume.ts";

const bytes = (...parts: (number[] | string)[]) =>
  new Uint8Array(parts.flatMap((p) => (typeof p === "string" ? Array.from(p, (c) => c.charCodeAt(0)) : p)));
const PDF = bytes("%PDF-1.7\n", "rest");
const OLE2 = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
const utf16 = (s: string) => Array.from(s, (c) => `${c}\u0000`).join("");
const DOC = bytes(OLE2, "....", utf16("WordDocument"), "rest");
const XLS = bytes(OLE2, "....", utf16("Workbook"), "rest");
const DOCX = bytes([0x50, 0x4b, 0x03, 0x04], "....[Content_Types].xml....word/document.xml");
const XLSX = bytes([0x50, 0x4b, 0x03, 0x04], "....[Content_Types].xml....xl/workbook.xml");
const EXE = bytes("MZ", [0x90, 0x00], "This program cannot be run in DOS mode");

const file = (b: Uint8Array<ArrayBuffer>, name: string) => new File([b], name);

test("sniffResume reads the type from the bytes", () => {
  assert.equal(sniffResume(PDF), "pdf");
  assert.equal(sniffResume(DOC), "doc");
  assert.equal(sniffResume(DOCX), "docx");
  assert.equal(sniffResume(XLSX), null); // a zip, but not a Word document
  assert.equal(sniffResume(XLS), null); // OLE2, but not a Word document
  assert.equal(sniffResume(EXE), null);
  assert.equal(sniffResume(new Uint8Array()), null);
});

test("no file, or an empty file input, is no résumé", async () => {
  assert.deepEqual(await checkResume(null), { ok: true, resume: null });
  assert.deepEqual(await checkResume(""), { ok: true, resume: null });
  assert.deepEqual(await checkResume(new File([], "")), { ok: true, resume: null });
});

test("PDF, DOC and DOCX pass with a matching extension", async () => {
  for (const [b, name, kind] of [[PDF, "cv.pdf", "pdf"], [DOC, "CV.DOC", "doc"], [DOCX, "cv.docx", "docx"]] as const) {
    const r = await checkResume(file(b, name));
    assert.equal(r.ok && r.resume?.kind, kind);
  }
});

test("a renamed .exe, a zip posing as .docx, and a mismatched extension are refused", async () => {
  for (const f of [file(EXE, "cv.pdf"), file(XLSX, "cv.docx"), file(PDF, "cv.docx"), file(PDF, "cv.txt"), file(PDF, "cv")]) {
    assert.deepEqual(await checkResume(f), { ok: false, error: RESUME_HELP });
  }
});

test("the 4 MB limit holds at the boundary, and an empty named file counts as no résumé", async () => {
  const at = new Uint8Array(MAX_RESUME_BYTES); at.set(PDF);
  const over = new Uint8Array(MAX_RESUME_BYTES + 1); over.set(PDF);
  assert.equal((await checkResume(file(at, "cv.pdf"))).ok, true);
  assert.deepEqual(await checkResume(file(over, "cv.pdf")), { ok: false, error: RESUME_HELP });
  // An empty file input can arrive as a zero-byte file with a name; it is "no résumé", not an error.
  assert.deepEqual(await checkResume(new File([], "blob")), { ok: true, resume: null });
});

test("filenames lose paths, control characters and quotes", () => {
  assert.equal(safeFilename("C:\\Users\\me\\My CV.pdf", "pdf"), "My CV.pdf");
  assert.equal(safeFilename("../../etc/\"cv\"\n.pdf", "pdf"), "cv.pdf");
  assert.equal(safeFilename("", "docx"), "resume.docx");
});
