"use client";

import { createContext, useContext, useMemo } from "react";
import { Avatar, GhostAvatar } from "@/components/avatars/avatar";
import type { Profile } from "@/lib/types";

interface ProfilesValue {
  profiles: Profile[];
  /** Who is watching on this device. */
  current: Profile;
  byId: Map<string, Profile>;
}

const ProfilesContext = createContext<ProfilesValue | null>(null);

/** Each page's data loader provides this next to its own data, so profiles load in the same round trip. */
export function ProfilesProvider({ profiles, current, children }: { profiles: Profile[]; current: Profile; children: React.ReactNode }) {
  const value = useMemo(() => ({ profiles, current, byId: new Map(profiles.map((p) => [p.id, p])) }), [profiles, current]);
  return <ProfilesContext.Provider value={value}>{children}</ProfilesContext.Provider>;
}

export function useProfiles(): ProfilesValue {
  const value = useContext(ProfilesContext);
  if (!value) throw new Error("useProfiles necesita un <ProfilesProvider>");
  return value;
}

/** A person's avatar by id; a neutral snowflake when they have left the home. */
export function ProfileAvatar({ id, size = 24, className = "" }: { id: string; size?: number; className?: string }) {
  const { byId } = useProfiles();
  const profile = byId.get(id);
  return profile ? <Avatar avatar={profile.avatar} size={size} className={className} /> : <GhostAvatar size={size} className={className} />;
}

export function profileName(byId: Map<string, Profile>, id: string | null | undefined): string | null {
  if (!id) return null;
  return byId.get(id)?.name ?? "alguien que ya no está";
}
