import { TEAMS } from "../constants";
import type { Member } from "../types";

interface AvatarProps {
  member: Member;
  size?: "small" | "medium" | "large";
}

export function Avatar({ member, size = "medium" }: AvatarProps) {
  const team = TEAMS.find((t) => t.id === member.team);
  const className = size === "medium" ? "avatar" : `avatar ${size}`;

  if (member.avatarUrl) {
    return <img src={member.avatarUrl} alt={member.name} className={className} title={member.name} />;
  }

  return (
    <span className={className} style={{ background: team?.color }} title={member.name}>
      {member.ini}
    </span>
  );
}
