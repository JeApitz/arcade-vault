import type { User } from "@supabase/supabase-js";

function getUsername(user: User): string {
  const meta = user.user_metadata ?? {};
  return meta.username || meta.full_name || meta.name || user.email || "?";
}

export function getDisplayName(user: User): string {
  return getUsername(user);
}

export default function UserAvatar({ user, size = 32 }: { user: User; size?: number }) {
  const meta = user.user_metadata ?? {};
  const avatarUrl: string | undefined = meta.avatar_url || meta.picture;
  const name = getUsername(user);
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  if (avatarUrl) {
     
    return (
      <img
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          border: "1px solid var(--cyan)",
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, var(--cyan), var(--magenta))",
        color: "#0a0a12",
        fontFamily: "var(--pixel)",
        fontSize: size * 0.4,
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}
