import { MongoClient } from "mongodb";

const OLD_URI =
  "mongodb+srv://root:MTvoTeTUPOaQXo4A@3pimediosdev.cos95ph.mongodb.net/christmas-movies?retryWrites=true&w=majority";
const NEW_URI =
  "mongodb+srv://root:FLFJbbXirqyK3WOn@cluster0.knqm9.mongodb.net/christmas-movies?retryWrites=true&w=majority";

const COLLECTIONS = [
  "movies",
  "calendars",
  "settings",
  "homes",
  "profiles",
  "invites",
  "rate_limits",
];

async function migrateCluster() {
  const oldClient = new MongoClient(OLD_URI);
  const newClient = new MongoClient(NEW_URI);

  try {
    console.log("📡 Conectando a clusters...");
    await oldClient.connect();
    await newClient.connect();

    const oldDb = oldClient.db("christmas-movies");
    const newDb = newClient.db("christmas-movies");

    console.log("\n📋 Migrando colecciones:");

    for (const collection of COLLECTIONS) {
      const oldColl = oldDb.collection(collection);
      const newColl = newDb.collection(collection);

      const count = await oldColl.countDocuments();
      if (count === 0) {
        console.log(`  ⏭️  ${collection}: sin datos`);
        continue;
      }

      const docs = await oldColl.find({}).toArray();
      await newColl.deleteMany({}); // Limpia primero
      const result = await newColl.insertMany(docs);

      console.log(`  ✅ ${collection}: ${result.insertedCount} documentos`);
    }

    console.log(
      "\n✨ Migración completada. Ahora actualiza Vercel con la nueva MONGODB_URI"
    );
  } catch (error) {
    console.error("❌ Error en migración:", error);
    process.exit(1);
  } finally {
    await oldClient.close();
    await newClient.close();
  }
}

migrateCluster();
