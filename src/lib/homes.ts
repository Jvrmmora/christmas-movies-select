import "server-only";
import { collections, LEGACY_HOME_ID } from "./db";
import { inactiveCutoff } from "./limits";

/** Removes a home and everything it owns. Children go first so a failure never leaves a home without its data hidden. */
export async function deleteHomeCascade(homeId: string): Promise<void> {
  const { homes, movies, calendars, settings, profiles } = await collections();
  await Promise.all([
    movies.deleteMany({ ownerId: homeId }),
    calendars.deleteMany({ ownerId: homeId }),
    settings.deleteMany({ ownerId: homeId }),
    profiles.deleteMany({ homeId }),
  ]);
  await homes.deleteOne({ _id: homeId });
}

/** Ids of homes nobody has opened for a year. The original home is never auto-deleted. */
export async function findInactiveHomeIds(now: Date = new Date()): Promise<string[]> {
  const { homes } = await collections();
  const docs = await homes
    .find({ lastActiveAt: { $lt: inactiveCutoff(now) }, _id: { $ne: LEGACY_HOME_ID } }, { projection: { _id: 1 } })
    .toArray();
  return docs.map((d) => d._id);
}
