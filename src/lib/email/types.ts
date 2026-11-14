// The email sender's shape, kept apart from ./index.ts (which imports server-only and the SDK) so pure modules and
// `node --test` can depend on it.

/** A plain-text email. `replyTo` lets the recipient answer the person who filled in the form. */
export type EmailMessage = { from: string; to: string; replyTo: string; subject: string; text: string; idempotencyKey: string };
export type SendResult = { ok: boolean };
export type SendEmail = (message: EmailMessage) => Promise<SendResult>;
