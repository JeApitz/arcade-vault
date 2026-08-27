"use client";

import { checkPassword, type PasswordChecks } from "@/app/lib/password";

const PASSWORD_RULES: { key: keyof PasswordChecks; label: string }[] = [
  { key: "minLength", label: "Al menos 8 caracteres" },
  { key: "lower", label: "Una letra minúscula" },
  { key: "upper", label: "Una letra mayúscula" },
  { key: "digit", label: "Un dígito" },
  { key: "symbol", label: "Un símbolo" },
];

export function PasswordChecklist({ password }: { password: string }) {
  const checks = checkPassword(password);
  return (
    <ul
      className="mono"
      style={{ listStyle: "none", padding: 0, margin: "0 0 10px", fontSize: 12 }}
    >
      {PASSWORD_RULES.map(({ key, label }) => {
        const ok = checks[key];
        return (
          <li
            key={key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: ok ? "var(--green, #4ade80)" : "var(--ink-faint)",
            }}
          >
            <span aria-hidden>{ok ? "✓" : "✗"}</span>
            <span>{label}</span>
          </li>
        );
      })}
    </ul>
  );
}
