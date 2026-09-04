import { Resend } from "resend";
import { env } from "@/lib/env";

/**
 * Magic-link delivery through Resend. Plain HTML, one link, short copy: the
 * email is a key, not a newsletter. Throws when Resend is not configured so
 * the auth layer surfaces a clear error instead of a silent no-op.
 */
export async function sendMagicLinkEmail(input: { email: string; url: string }): Promise<void> {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM) {
    throw new Error("Magic link email is not configured (RESEND_API_KEY, RESEND_FROM)");
  }
  const resend = new Resend(env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: env.RESEND_FROM,
    to: input.email,
    subject: "Your F1lytics sign-in link",
    text: `Sign in to F1lytics Lock In: ${input.url}\n\nThe link works once and expires in 15 minutes. If you did not request it, ignore this email.`,
    html: `<!doctype html><html><body style="margin:0;background:#0C0C0E;color:#F4F4F5;font-family:ui-monospace,Menlo,monospace;padding:32px">
<div style="max-width:520px;margin:0 auto;border:1px solid #27272A;background:#141418;padding:28px">
<div style="font-size:11px;letter-spacing:0.22em;color:#FF1801;font-weight:700">F1LYTICS · LOCK IN</div>
<h1 style="font-size:24px;margin:14px 0 8px;letter-spacing:-0.01em">Your sign-in link</h1>
<p style="font-size:14px;line-height:1.6;color:#B4B4BD;margin:0 0 20px">One tap and you are in. The link works once and expires in 15 minutes.</p>
<a href="${input.url}" style="display:inline-block;background:#FF1801;color:#08080A;text-decoration:none;font-weight:700;font-size:12px;letter-spacing:0.18em;padding:14px 22px">SIGN IN</a>
<p style="font-size:11px;color:#84848F;margin:24px 0 0;line-height:1.6">If you did not request this, ignore the email. Nothing happens until the link is opened.</p>
</div></body></html>`,
  });
  if (error) throw new Error(`Resend rejected the magic link email: ${error.message}`);
}
