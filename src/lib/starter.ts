/** The starter classics are offered once, to a home that has no movies yet and hasn't seen them. */
export function shouldOfferStarter(movieCount: number, alreadyOffered: boolean): boolean {
  return movieCount === 0 && !alreadyOffered;
}
