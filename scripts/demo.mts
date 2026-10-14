/**
 * Demo data in a separate database (name must contain "demo"): the movie list,
 * a few watched, favorites and a filled advent calendar starting a few days ago.
 *   pnpm demo            → load
 *   pnpm demo --limpiar  → delete the demo data
 */
import { collections, DEFAULT_OWNER, getDb } from "../src/lib/db";
import { seasonEnd, seasonFor, toKey } from "../src/lib/calendar";
import { seedList } from "./seed-list.mjs";

const dbName = process.env.MONGODB_DB ?? "";
if (!dbName.includes("demo")) {
  console.error(`MONGODB_DB="${dbName}" no contiene "demo". Por seguridad no escribo ahí.`);
  process.exit(1);
}

async function main() {
  if (process.argv.includes("--limpiar")) {
    // Delete documents rather than dropDatabase: a least-privilege Atlas user can't drop databases.
    const db = await getDb();
    for (const c of await db.listCollections().toArray()) await db.collection(c.name).deleteMany({});
    console.log(`Datos de demo borrados de ${dbName}.`);
    return;
  }

  await seedList();
  const { movies, calendars, settings } = await collections();
  const ownerId = DEFAULT_OWNER;
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
  await settings.updateOne({ ownerId }, { $set: { displayName: "Ana y Leo", updatedAt: new Date() } }, { upsert: true });
  console.log(`Demo lista en ${dbName}: ${all.length} películas, ${watchedIds.length} vistas, calendario desde ${toKey(start)}.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
