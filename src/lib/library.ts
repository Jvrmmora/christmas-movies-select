import "server-only";
import { collections } from "./db";
import { buildLibraryIndex, type LibraryIndex } from "./library-match";

/** Light read of the household's library, for duplicate checks and suggestions. */
export async function getLibraryIndex(ownerId: string): Promise<LibraryIndex> {
  const { movies } = await collections();
  const docs = await movies
    .find({ ownerId }, { projection: { title: 1, originalTitle: 1, year: 1, externalIds: 1 } })
    .toArray();
  return buildLibraryIndex(
    docs.map((d) => ({ id: d._id.toHexString(), title: d.title, originalTitle: d.originalTitle ?? "", year: d.year, externalIds: d.externalIds })),
  );
}
