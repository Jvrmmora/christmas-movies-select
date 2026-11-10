import "server-only";
import { ObjectId } from "mongodb";
import { parseKey, seasonFor } from "./calendar";
import { collections } from "./db";
import { signUnsubscribe } from "./jwt";
import { sendTodayReminder } from "./mailer";
import { primaryOffer } from "./platforms";
import { MAX_REMINDERS_PER_RUN, movieSummary, reminderDateKey, safeImageUrl, safeWebUrl } from "./reminders";

export interface ReminderRun {
  sent: number;
  failed: number;
  /** Opted-in accounts with nothing to send today: no movie on today's door, or already watched. */
  skipped: number;
  /** Stopped at MAX_REMINDERS_PER_RUN; the rest get nothing today. */
  capped: boolean;
}

/**
 * Sends today's «Hoy toca» to every account that asked for it, one e-mail each.
 * A day is claimed per account before sending, so a retried run never sends twice; a failed send gives the claim back.
 */
export async function runDailyReminders({ now, origin }: { now: Date; origin: string }): Promise<ReminderRun> {
  const { users, calendars, movies } = await collections();
  const today = reminderDateKey(now);
  const season = seasonFor(parseKey(today));
  const run: ReminderRun = { sent: 0, failed: 0, skipped: 0, capped: false };

  const recipients = await users
    .find({ reminders: true, homeId: { $type: "string" }, lastReminderOn: { $ne: today } }, { projection: { email: 1, homeId: 1 } })
    .toArray();
  const byHome = new Map<string, typeof recipients>();
  for (const u of recipients) byHome.set(u.homeId!, [...(byHome.get(u.homeId!) ?? []), u]);

  for (const [homeId, accounts] of byHome) {
    const calendar = await calendars.findOne({ ownerId: homeId, season });
    const movieId = calendar?.assignments?.[today];
    const movie = movieId && ObjectId.isValid(movieId) ? await movies.findOne({ _id: new ObjectId(movieId), ownerId: homeId }) : null;
    if (!movie || movie.watched) {
      run.skipped += accounts.length;
      continue;
    }

    const offer = primaryOffer(movie.streaming ?? []);
    const url = safeWebUrl(offer?.url);
    const platform = offer && url ? { name: offer.name, url } : null;
    for (const account of accounts) {
      if (run.sent + run.failed >= MAX_REMINDERS_PER_RUN) {
        run.capped = true;
        return run;
      }
      const claim = await users.updateOne({ _id: account._id, lastReminderOn: { $ne: today } }, { $set: { lastReminderOn: today } });
      if (!claim.modifiedCount) continue;
      try {
        await sendTodayReminder(account.email, {
          title: movie.title,
          summary: movieSummary(movie),
          posterUrl: safeImageUrl(movie.posterUrl),
          platform,
          appUrl: origin,
          unsubscribeUrl: `${origin}/baja?t=${await signUnsubscribe(account._id)}`,
        });
        run.sent++;
      } catch (err) {
        console.error("[recordatorio] no se pudo enviar", err);
        await users.updateOne({ _id: account._id }, { $unset: { lastReminderOn: "" } });
        run.failed++;
      }
    }
  }
  return run;
}
