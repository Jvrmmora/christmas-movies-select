// Moves from "the home is the account" to one account per person. Idempotent: safe to run twice.
//
//   pnpm migrate:accounts --delete-slug jvrmmora --rename-slug casa-montano --name "Casa Monama" [--profile Javier]
//   MONGODB_DB=christmas-movies-demo pnpm migrate:accounts …   # rehearse on the demo DB first
//
// 1. Deletes the home --delete-slug with everything it owns.
// 2. Renames the home --rename-slug to --name.
// 3. Gives every home an invite code.
// 4. Turns each home's e-mail + password into the first account of that home (same password).
//    --profile links that account to the existing profile with that name in the renamed home.
// 5. Drops the old sign-in fields (slug, e-mail, password, recovery code) and their indexes.
import { randomUUID } from "node:crypto";
import { parseArgs } from "node:util";
import { collections, getDb } from "../src/lib/db";
import { deleteHomeCascade } from "../src/lib/homes";
import { generateInviteCode } from "../src/lib/invite-code";

const { values } = parseArgs({
  options: {
    "delete-slug": { type: "string" },
    "rename-slug": { type: "string" },
    name: { type: "string" },
    profile: { type: "string" },
  },
});

/** What a home looked like before accounts; these fields only exist until this script runs. */
interface LegacyHome {
  _id: string;
  name: string;
  slug?: string;
  email?: string;
  passwordHash?: string;
  inviteCode?: string | null;
}

async function main() {
  const db = await getDb();
  const { homes, users, profiles, movies } = await collections();
  const legacy = db.collection<LegacyHome>("homes");
  console.log(`Base de datos: ${db.databaseName}\n`);

  const all = await legacy.find({}).toArray();
  for (const h of all) {
    const [p, m] = await Promise.all([profiles.countDocuments({ homeId: h._id }), movies.countDocuments({ ownerId: h._id })]);
    console.log(`· ${h.name} (${h.slug ?? "sin código"}) · ${h.email ?? "sin correo"} · ${p} perfiles · ${m} películas`);
  }
  console.log();

  const deleteSlug = values["delete-slug"]?.toLowerCase();
  if (deleteSlug) {
    const target = all.find((h) => h.slug === deleteSlug);
    if (target) {
      await deleteHomeCascade(target._id);
      console.log(`✓ Borrada "${target.name}" (${deleteSlug}) con sus perfiles, películas y calendario.`);
    } else if (all.some((h) => h.slug)) {
      throw new Error(`No hay casa con código "${deleteSlug}". Códigos: ${all.map((h) => h.slug).filter(Boolean).join(", ")}`);
    } else {
      console.log(`· "${deleteSlug}" ya no existe (migración ya aplicada).`);
    }
  }

  const renameSlug = values["rename-slug"]?.toLowerCase();
  const renamed = renameSlug ? all.find((h) => h.slug === renameSlug) : undefined;
  if (renameSlug) {
    if (!values.name?.trim()) throw new Error("--rename-slug necesita --name.");
    if (renamed) {
      await homes.updateOne({ _id: renamed._id }, { $set: { name: values.name.trim() } });
      console.log(`✓ "${renamed.name}" ahora se llama "${values.name.trim()}".`);
    } else if (all.some((h) => h.slug)) {
      throw new Error(`No hay casa con código "${renameSlug}".`);
    }
  }

  for (const h of await legacy.find({ inviteCode: { $not: { $type: "string" } } }).toArray()) {
    const inviteCode = generateInviteCode();
    await legacy.updateOne({ _id: h._id }, { $set: { inviteCode } });
    console.log(`✓ Código de invitación de "${h.name}": ${inviteCode}`);
  }

  for (const h of await legacy.find({ passwordHash: { $type: "string" } }).toArray()) {
    if (!h.email) {
      console.log(`! "${h.name}" no tiene correo: no se puede crear su cuenta. Regístrense de nuevo y únanse con el código.`);
      continue;
    }
    const existing = await users.findOne({ email: h.email });
    const now = new Date();
    const userId = existing?._id ?? randomUUID();
    if (existing) {
      console.log(`· La cuenta ${h.email} ya existe.`);
    } else {
      await users.insertOne({ _id: userId, email: h.email, passwordHash: h.passwordHash!, homeId: h._id, createdAt: now, lastActiveAt: now });
      console.log(`✓ Cuenta creada: ${h.email} → "${h.name}" (misma clave de antes).`);
    }
    if (values.profile && renamed?._id === h._id) {
      const name = values.profile.trim();
      const profile = await profiles.findOne({ homeId: h._id, name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } });
      if (!profile) console.log(`! No hay un perfil "${name}" en "${h.name}"; la cuenta lo elegirá al entrar ("¿Cuál eres tú?").`);
      else if (profile.userId) console.log(`· El perfil "${profile.name}" ya está ligado a una cuenta.`);
      else {
        await profiles.updateOne({ _id: profile._id }, { $set: { userId } });
        console.log(`✓ El perfil "${profile.name}" quedó ligado a ${h.email}.`);
      }
    }
  }

  // The old unique indexes would make every new home (which has no slug) collide with the next one.
  const indexes = await legacy.indexes();
  for (const name of ["slug_1", "email_1"]) {
    if (indexes.some((i) => i.name === name)) {
      await legacy.dropIndex(name);
      console.log(`✓ Índice ${name} eliminado.`);
    }
  }
  const res = await legacy.updateMany({}, { $unset: { slug: "", email: "", passwordHash: "", recoveryHash: "", reset: "" } });
  console.log(`✓ Campos de acceso viejos quitados de ${res.modifiedCount} casa(s).\nListo.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
