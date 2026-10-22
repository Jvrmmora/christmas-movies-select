import "server-only";
import nodemailer from "nodemailer";
import { RESET_TTL_MINUTES } from "./reset-code";

// Any SMTP account works. Gmail: smtp.gmail.com, port 465, and an "app password" as SMTP_PASS.
function config() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  const port = Number(process.env.SMTP_PORT) || 465;
  return { host, port, user, pass, from: process.env.SMTP_FROM || `"Navidad en casa" <${user}>` };
}

/** In development an unset SMTP just prints the code in the terminal, so the flow can be tried without an account. */
export function canSendMail(): boolean {
  return !!config() || process.env.NODE_ENV !== "production";
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export async function sendResetCode(to: string, code: string): Promise<void> {
  const cfg = config();
  if (!cfg) {
    console.info(`[mail] Código para ${to}: ${code} (SMTP sin configurar, no se envió)`);
    return;
  }
  const transport = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: { user: cfg.user, pass: cfg.pass },
  });
  await transport.sendMail({
    from: cfg.from,
    to,
    subject: `${code} es tu código de Navidad en casa`,
    text: `Tu código para cambiar la clave de tu cuenta (${to}) es ${code}.\n\nVence en ${RESET_TTL_MINUTES} minutos. Si no lo pediste tú, ignora este correo: nadie puede entrar sin él.`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:420px;margin:auto;color:#1c1c1e">
  <h2 style="margin:0 0 8px">🎄 Navidad en casa</h2>
  <p>Tu código para cambiar la clave de <strong>${escapeHtml(to)}</strong>:</p>
  <p style="font-size:34px;letter-spacing:8px;font-weight:700;margin:16px 0">${code}</p>
  <p style="color:#6b6b70;font-size:14px">Vence en ${RESET_TTL_MINUTES} minutos. Si no lo pediste tú, ignora este correo: nadie puede entrar sin él.</p>
</div>`,
  });
}
