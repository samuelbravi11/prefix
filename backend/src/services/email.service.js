import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Invia OTP via email usando Resend.
 * - Non loggare mai otpCode in produzione.
*/
export async function sendEmailOtp({ to, otpCode, expiresAt }) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY");
  }
  if (!process.env.RESEND_FROM_EMAIL) {
    throw new Error("Missing RESEND_FROM_EMAIL");
  }

  console.log("[RESEND] sending OTP to:", to);

  const subject = "Codice di verifica PreFix";
  const text = `Il tuo codice OTP è: ${otpCode}\nScade alle: ${expiresAt.toISOString()}`;

  // HTML semplice (puoi abbellirlo dopo)
  const html = `
    <div style="font-family: Arial, sans-serif">
      <h2>Verifica email</h2>
      <p>Il tuo codice OTP è:</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 3px">${otpCode}</p>
      <p>Scade alle: <b>${expiresAt.toISOString()}</b></p>
    </div>
  `;

  const result = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to,
    subject,
    text,
    html,
  });

  // debug utile
  console.log("[RESEND] email sent:", { to, id: result?.data?.id });

  return result;
}
