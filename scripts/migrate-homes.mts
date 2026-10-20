// Turns the original single-password dashboard into the first home. Idempotent: safe to run twice.
//
//   pnpm migrate:homes --slug casa-montano --name "Casa Montaño"
//   MONGODB_DB=christmas-movies-demo pnpm migrate:homes --slug demo --name Demo   # rehearse on the demo DB
//
// The home keeps _id "household", the ownerId already stored on every movie and calendar,
// so no existing document is rewritten. Its password is the current APP_PASSWORD.
import { parseArgs } from "node:util";
import { collections, getDb, LEGACY_HOME_ID } from "../src/lib/db";
import { hashSecret } from "../src/lib/password";
import { formatRecoveryCode, generateRecoveryCode } from "../src/lib/invite";
import { starterAvatar } from "../src/lib/avatar";
import { splitDisplayName } from "../src/lib/display-name";
import { homeInputSchema } from "../src/lib/validation";

const { values } = parseArgs({
  options: { slug: { type: "string" }, name: { type: "string" } },
});

async function main() {
  const password = process.env.APP_PASSWORD;
  if (!password) throw new Error("Falta APP_PASSWORD: será la clave de la primera casa.");

  const parsed = homeInputSchema.safeParse({ name: values.name, slug: values.slug, password });
  if (!parsed.success) {
    throw new Error(`Revisa --slug y --name: ${parsed.error.issues.map((i) => i.message).join("; ")}`);
  }
  const input = parsed.data;

  const dbName = (await getDb()).databaseName;
  const { homes, profiles, settings, movies } = await collections();
  console.log(`Base de datos: ${dbName}`);

  const existing = await homes.findOne({ _id: LEGACY_HOME_ID });
  if (existing) {
    console.log(`La casa "${existing.name}" (${existing.slug}) ya existe; no se cambia su clave.`);
  } else {
    const slugTaken = await homes.findOne({ slug: input.slug });
    if (slugTaken) throw new Error(`El código "${input.slug}" ya lo usa otra casa.`);
    const recovery = generateRecoveryCode();
    const now = new Date();
    await homes.insertOne({
      _id: LEGACY_HOME_ID,
      slug: input.slug,
      name: input.name,
      passwordHash: await hashSecret(input.password),
      recoveryHash: await hashSecret(recovery),
      inviteCode: null,
      createdAt: now,
      lastActiveAt: now,
    });
    console.log(`Casa creada: "${input.name}" (código ${input.slug}), clave = APP_PASSWORD.`);
    console.log(`\n  CÓDIGO DE RECUPERACIÓN (guárdalo, no se vuelve a mostrar): ${formatRecoveryCode(recovery)}\n`);
  }

  if ((await profiles.countDocuments({ homeId: LEGACY_HOME_ID })) === 0) {
    const greeting = await settings.findOne({ ownerId: LEGACY_HOME_ID });
    const names = splitDisplayName(greeting?.displayName ?? "");
    if (names.length === 0) names.push("Familia");
    const base = Date.now();
    await profiles.insertMany(
      names.map((name, i) => ({
        _id: crypto.randomUUID(),
        homeId: LEGACY_HOME_ID,
        name,
        avatar: starterAvatar(i),
        createdAt: new Date(base + i),
      })),
    );
    console.log(`Perfiles creados: ${names.join(", ")}`);
  } else {
    console.log("La casa ya tiene perfiles; no se crean más.");
  }

  console.log(`Películas de la casa: ${await movies.countDocuments({ ownerId: LEGACY_HOME_ID })} (intactas).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
