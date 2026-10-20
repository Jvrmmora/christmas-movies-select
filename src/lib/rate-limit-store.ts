import "server-only";
import { collections } from "./db";
import { createLimiter, type RateStore } from "./rate-limit";

/** Fixed windows stored in MongoDB; the TTL index on expiresAt cleans up after them. */
const mongoStore: RateStore = {
  async hit(key, windowMs) {
    const { rateLimits } = await collections();
    // The TTL monitor only runs about once a minute, so drop a stale window ourselves first.
    await rateLimits.deleteOne({ _id: key, expiresAt: { $lte: new Date() } });
    const doc = await rateLimits.findOneAndUpdate(
      { _id: key },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(Date.now() + windowMs) } },
      { upsert: true, returnDocument: "after" },
    );
    if (!doc) throw new Error("No se pudo registrar el intento");
    return { count: doc.count, resetsAt: doc.expiresAt };
  },
  async peek(key) {
    const { rateLimits } = await collections();
    const doc = await rateLimits.findOne({ _id: key, expiresAt: { $gt: new Date() } });
    return doc ? { count: doc.count, resetsAt: doc.expiresAt } : null;
  },
  async reset(key) {
    const { rateLimits } = await collections();
    await rateLimits.deleteOne({ _id: key });
  },
};

export const limiter = createLimiter(mongoStore);
