import "server-only";
import { toCountry, type CountryCode } from "./countries";
import { collections, LEGACY_HOME_ID } from "./db";
import { inactiveCutoff } from "./limits";

/** The country a home looks up where to watch in. Homes made before countries existed count as the legacy one. */
export async function getHomeCountry(homeId: string): Promise<CountryCode> {
  const { homes } = await collections();
  const home = await homes.findOne({ _id: homeId }, { projection: { country: 1 } });
  return toCountry(home?.country);
}

/**
 * Removes a home and everything it owns. Children go first so a failure never leaves a home without its data hidden.
 * The accounts stay: they go back to "create or join a home" the next time they open the app.
 */
export async function deleteHomeCascade(homeId: string): Promise<void> {
  const { homes, users, movies, calendars, settings, profiles } = await collections();
  await Promise.all([
    movies.deleteMany({ ownerId: homeId }),
    calendars.deleteMany({ ownerId: homeId }),
    settings.deleteMany({ ownerId: homeId }),
    profiles.deleteMany({ homeId }),
    users.updateMany({ homeId }, { $set: { homeId: null } }),
  ]);
  await homes.deleteOne({ _id: homeId });
}

/** Remembers that this home has been shown the starter classics, so the inicio stops sending it there. */
export async function markStarterOffered(homeId: string): Promise<void> {
  const { homes } = await collections();
  await homes.updateOne({ _id: homeId, starterOfferedAt: { $exists: false } }, { $set: { starterOfferedAt: new Date() } });
}

/** The home behind an invite code (only its name, for "You were invited to…"), or null when the code is wrong. */
export async function findHomeByInvite(code: string | null): Promise<{ name: string; inviteCode: string } | null> {
  if (!code) return null;
  const { homes } = await collections();
  const home = await homes.findOne({ inviteCode: code }, { projection: { name: 1, inviteCode: 1 } });
  return home ? { name: home.name, inviteCode: home.inviteCode } : null;
}

/** Ids of homes nobody has opened for a year. The original home is never auto-deleted. */
export async function findInactiveHomeIds(now: Date = new Date()): Promise<string[]> {
  const { homes } = await collections();
  const docs = await homes
    .find({ lastActiveAt: { $lt: inactiveCutoff(now) }, _id: { $ne: LEGACY_HOME_ID } }, { projection: { _id: 1 } })
    .toArray();
  return docs.map((d) => d._id);
}
