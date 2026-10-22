// Sets the e-mail that receives password-reset codes for one home (the homes made before sign-up asked for it).
// Usage: pnpm set:email --slug casa-montano --email familia@correo.com
import { parseArgs } from "node:util";
import { collections } from "../src/lib/db";
import { homeEmailSchema, homeSlugSchema } from "../src/lib/validation";

const { values } = parseArgs({ options: { slug: { type: "string" }, email: { type: "string" } } });
const slug = homeSlugSchema.safeParse(values.slug);
const email = homeEmailSchema.safeParse(values.email);
if (!slug.success || !email.success) {
  console.error("Uso: pnpm set:email --slug <código de la casa> --email <correo>");
  process.exit(1);
}

const { homes } = await collections();
const res = await homes.updateOne({ slug: slug.data }, { $set: { email: email.data } }).catch((err) => {
  if (err?.code === 11000) {
    console.error("Ese correo ya lo usa otra casa.");
    process.exit(1);
  }
  throw err;
});
console.log(res.matchedCount ? `Listo: ${slug.data} → ${email.data}` : `No existe una casa con el código ${slug.data}.`);
process.exit(res.matchedCount ? 0 : 1);
