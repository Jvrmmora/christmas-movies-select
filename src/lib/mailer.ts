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

interface Mail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/** Sends one e-mail, or prints it in the terminal when SMTP isn't set up (development). */
async function send(mail: Mail, devNote: string): Promise<void> {
  const cfg = config();
  if (!cfg) {
    console.info(`[mail] ${devNote} (SMTP sin configurar, no se envió)`);
    return;
  }
  const transport = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: { user: cfg.user, pass: cfg.pass },
  });
  await transport.sendMail({ from: cfg.from, ...mail });
}

/** The shared look of every e-mail: brand line on top, plain system font, narrow column. */
function layout(body: string): string {
  return `<div style="font-family:system-ui,sans-serif;max-width:420px;margin:auto;color:#1c1c1e">
  <h2 style="margin:0 0 8px">🎄 Navidad en casa</h2>
${body}
</div>`;
}

const button = (href: string, label: string) =>
  `<p style="margin:20px 0"><a href="${escapeHtml(href)}" style="display:inline-block;background:#c8102e;color:#fff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:12px">${escapeHtml(label)}</a></p>`;

export async function sendResetCode(to: string, code: string): Promise<void> {
  await send(
    {
      to,
      subject: `${code} es tu código de Navidad en casa`,
      text: `Tu código para cambiar la clave de tu cuenta (${to}) es ${code}.\n\nVence en ${RESET_TTL_MINUTES} minutos. Si no lo pediste tú, ignora este correo: nadie puede entrar sin él.`,
      html: layout(`  <p>Tu código para cambiar la clave de <strong>${escapeHtml(to)}</strong>:</p>
  <p style="font-size:34px;letter-spacing:8px;font-weight:700;margin:16px 0">${code}</p>
  <p style="color:#6b6b70;font-size:14px">Vence en ${RESET_TTL_MINUTES} minutos. Si no lo pediste tú, ignora este correo: nadie puede entrar sin él.</p>`),
    },
    `Código para ${to}: ${code}`,
  );
}

/**
 * Right after sign-up. `next` is where step 2 continues (with the invite code when they came from a link);
 * `homeName` is the home that invited them, if any.
 */
export async function sendWelcome(to: string, next: string, homeName?: string): Promise<void> {
  const intro = (name: string) =>
    homeName
      ? `Ya tienes tu cuenta. Te invitaron a ${name}: entra, únete y elige tu perfil para ver juntos las películas de esta Navidad.`
      : "Ya tienes tu cuenta. Ahora crea la casa de tu familia, o únete a una con su código de invitación, y arma la lista de películas de esta Navidad.";
  await send(
    {
      to,
      subject: homeName ? `Bienvenido a Navidad en casa: te esperan en ${homeName}` : "Bienvenido a Navidad en casa 🎄",
      text: `¡Hola!\n\n${intro(homeName ?? "")}\n\nSigue aquí: ${next}\n\nEntras siempre con este correo (${to}) y tu clave. Si la olvidas, te enviamos un código a este correo.`,
      html: layout(`  <p>¡Hola!</p>
  <p>${intro(`<strong>${escapeHtml(homeName ?? "")}</strong>`)}</p>
${button(next, homeName ? `Unirme a ${homeName}` : "Seguir")}
  <p>Con Navidad en casa tienen dónde ver cada película en Colombia, cuáles ya vieron y un calendario de adviento con una película por día hasta Nochebuena.</p>
  <p style="color:#6b6b70;font-size:14px">Entras siempre con este correo (${escapeHtml(to)}) y tu clave. Si la olvidas, te enviamos un código a este correo.</p>`),
    },
    `Bienvenida para ${to} → ${next}`,
  );
}
