// The candidate form's optional résumé: size, extension and content type, checked on the server before it is forwarded
// to Ezekia. Nothing is stored here; Ezekia virus-scans files on intake (help-centre "API Integration", cited in #14).
// Type is decided by the file's first bytes, not its name or the browser's MIME type (OWASP File Upload Cheat Sheet:
// https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html, "File Signature Validation").

/** 4 MB: a Vercel Function rejects request bodies over 4.5 MB (https://vercel.com/docs/functions/limitations), and the
 * form's other fields and multipart overhead share that budget. next.config.ts sets the Server Action limit to match. */
export const MAX_RESUME_BYTES = 4 * 1024 * 1024;

export const RESUME_HELP = "Please attach a PDF, DOC or DOCX file up to 4 MB.";

export type ResumeKind = "pdf" | "doc" | "docx";
export type Resume = { file: Blob; filename: string; kind: ResumeKind };
export type ResumeResult = { ok: true; resume: Resume | null } | { ok: false; error: string };

const EXT: Record<string, ResumeKind> = { pdf: "pdf", doc: "doc", docx: "docx" };

const PDF = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"
const OLE2 = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]; // Compound File Binary, used by .doc
const ZIP = [0x50, 0x4b, 0x03, 0x04]; // local file header, used by .docx
const WORD_STREAM = Array.from("WordDocument", (c) => `${c}\u0000`).join(""); // UTF-16LE

const startsWith = (b: Uint8Array, sig: number[]) => b.length >= sig.length && sig.every((v, i) => b[i] === v);

/** A byte-string search. Zip entry names are stored as plain bytes in the local headers and central directory. */
function contains(b: Uint8Array, needle: string): boolean {
  const n = Array.from(needle, (c) => c.charCodeAt(0));
  outer: for (let i = 0; i <= b.length - n.length; i++) {
    for (let j = 0; j < n.length; j++) if (b[i + j] !== n[j]) continue outer;
    return true;
  }
  return false;
}

/** The kind the bytes say, or null. A DOCX is a zip holding `[Content_Types].xml` and parts under `word/`. */
export function sniffResume(b: Uint8Array): ResumeKind | null {
  if (startsWith(b, PDF)) return "pdf";
  // OLE2 is also the container for .xls, .ppt and .msg. In a Word file "The WordDocument stream MUST be present"
  // ([MS-DOC] 2.1.1: https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-doc/d7fae142-670d-4cd5-869a-708366984a71),
  // and directory entry names are "encoded in UTF-16" ([MS-CFB] 2.6.1:
  // https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-cfb/60fe8611-66c3-496b-b70d-a504c94c9ace). Little-endian
  // is stated only for the header's integer fields ([MS-CFB] 2.2) [unverified for names], and is what Word writes in practice.
  if (startsWith(b, OLE2)) return contains(b, WORD_STREAM) ? "doc" : null;
  if (startsWith(b, ZIP) && contains(b, "[Content_Types].xml") && contains(b, "word/")) return "docx";
  return null;
}

/** The file's own name, without any path, control characters or quotes, capped at 120 characters. */
export function safeFilename(name: string, kind: ResumeKind): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const clean = base.replace(/[\u0000-\u001f\u007f"<>|*?:]/g, "").trim().slice(-120);
  return clean || `resume.${kind}`;
}

/** Checks the form's `resume` entry. An empty file input (no file chosen) is "no résumé", not an error. It reaches a
 * Server Action as a zero-byte file that may carry a name (observed 2026-11-13 on this form under `next start`), so any
 * zero-byte entry counts as none: it has no content to forward anyway. */
export async function checkResume(entry: FormDataEntryValue | null): Promise<ResumeResult> {
  if (entry === null || typeof entry === "string" || entry.size === 0) return { ok: true, resume: null };
  if (entry.size > MAX_RESUME_BYTES) return { ok: false, error: RESUME_HELP };

  const ext = EXT[(entry.name.split(".").pop() ?? "").toLowerCase()];
  if (!ext) return { ok: false, error: RESUME_HELP };
  const kind = sniffResume(new Uint8Array(await entry.arrayBuffer()));
  // The name must agree with the content: a renamed .exe, or a .pdf that is really a zip, is refused.
  if (kind !== ext) return { ok: false, error: RESUME_HELP };

  return { ok: true, resume: { file: entry, filename: safeFilename(entry.name, kind), kind } };
}
