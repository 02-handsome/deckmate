import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
    The starter enables Cache Components, which asks every route to be
    prerenderable unless it opts out. No screen in DeckMate can be: the
    feed is ranked against the signed-in user, the profile is theirs, and
    the request page decides what to reveal from who is asking. Each one
    reads cookies on every request by design.

    Turning this off once is honest about that. The alternative — an
    `export const instant = false` on all eight routes — says the same
    thing eight times and invites someone to forget it on the ninth.
  */
  cacheComponents: false,
};

export default nextConfig;
