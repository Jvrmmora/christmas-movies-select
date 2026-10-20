/**
 * Demo data in a separate database (name must contain "demo"): a home with four profiles, the movie
 * list credited to them, a few watched, favorites and a filled advent calendar starting a few days ago.
 *   pnpm demo            → load  (sign in with home code "casa-demo" and password "navidad")
 *   pnpm demo --limpiar  → delete the demo data
 */
import { randomUUID } from "node:crypto";
import { collections, LEGACY_HOME_ID, getDb } from "../src/lib/db";
import { generateRecoveryCode } from "../src/lib/invite";
import { hashSecret } from "../src/lib/password";
import type { Avatar } from "../src/lib/avatar";
import { seasonEnd, seasonFor, toKey } from "../src/lib/calendar";
import { seedList } from "./seed-list.mjs";

const dbName = process.env.MONGODB_DB ?? "";
if (!dbName.includes("demo")) {
  console.error(`MONGODB_DB="${dbName}" no contiene "demo". Por seguridad no escribo ahí.`);
  process.exit(1);
}

const DEMO_HOME = { slug: "casa-demo", name: "Casa Demo", password: "navidad" };
const DEMO_PROFILES: { name: string; avatar: Avatar }[] = [
  { name: "Ana", avatar: { character: "santi", bg: "pine", accessory: "none" } },
  { name: "Leo", avatar: { character: "rudolfo", bg: "snow", accessory: "none" } },
  { name: "Sofi", avatar: { character: "pino", bg: "plum", accessory: "gafas" } },
  { name: "Mateo", avatar: { character: "jengi", bg: "night", accessory: "gorro" } },
];

async function main() {
  if (process.argv.includes("--limpiar")) {
    // Delete documents rather than dropDatabase: a least-privilege Atlas user can't drop databases.
    const db = await getDb();
    for (const c of await db.listCollections().toArray()) await db.collection(c.name).deleteMany({});
    console.log(`Datos de demo borrados de ${dbName}.`);
    return;
  }

  await seedList();
  const { movies, calendars, homes, profiles } = await collections();
  const ownerId = LEGACY_HOME_ID;
  const all = await movies.find({ ownerId }).sort({ createdAt: 1 }).toArray();

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5);
  const assignments: Record<string, string> = {};
  all.forEach((m, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    assignments[toKey(d)] = m._id.toHexString();
  });

  // The five days before today are already watched; a couple of favorites.
  const watchedIds = all.slice(0, 5).map((m) => m._id);
  await movies.updateMany({ ownerId }, { $set: { watched: false, watchedAt: null, favorite: false } });
  await movies.updateMany({ _id: { $in: watchedIds } }, { $set: { watched: true, watchedAt: new Date() } });
  await movies.updateMany({ _id: { $in: [all[0]._id, all[14]._id, all[20]._id].filter(Boolean) } }, { $set: { favorite: true } });
  await movies.updateOne({ _id: all[0]._id }, { $set: { myRating: 5 } });

  const season = seasonFor(today);
  await calendars.updateOne(
    { ownerId, season },
    { $set: { preset: "custom", startDate: toKey(start), endDate: seasonEnd(season), assignments, surprise: false, updatedAt: new Date() } },
    { upsert: true },
  );

  // One home with four profiles; every movie is credited to someone so the calendar shows their avatars.
  const now = new Date();
  await homes.updateOne(
    { _id: ownerId },
    {
      $setOnInsert: {
        slug: DEMO_HOME.slug,
        name: DEMO_HOME.name,
        passwordHash: await hashSecret(DEMO_HOME.password),
        recoveryHash: await hashSecret(generateRecoveryCode()),
        inviteCode: null,
        createdAt: now,
      },
      $set: { lastActiveAt: now },
    },
    { upsert: true },
  );
  await profiles.deleteMany({ homeId: ownerId });
  const people = DEMO_PROFILES.map((p, i) => ({ _id: randomUUID(), homeId: ownerId, name: p.name, avatar: p.avatar, createdAt: new Date(now.getTime() + i) }));
  await profiles.insertMany(people);
  // The last movie stays uncredited, like one saved before profiles existed.
  await movies.bulkWrite(
    all.slice(0, -1).map((m, i) => ({
      updateOne: {
        filter: { _id: m._id },
        update: { $set: { suggestedBy: people[i % people.length]._id, addedBy: people[(i + 1) % people.length]._id, updatedBy: people[(i + 1) % people.length]._id } },
      },
    })),
  );
  console.log(`Demo lista en ${dbName}: ${all.length} películas, ${watchedIds.length} vistas, calendario desde ${toKey(start)}.`);
  console.log(`Entren con el código de casa "${DEMO_HOME.slug}" y la clave "${DEMO_HOME.password}".`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
