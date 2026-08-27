// Validación de contraseña: lógica pura sin dependencias, reutilizable
// desde el registro (/auth) y el reset de contraseña (/auth/reset-password).
// El rechazo real de contraseñas débiles o comprometidas lo hace Supabase
// Auth con su configuración; esta capa es solo UX.

export type PasswordChecks = {
  minLength: boolean; // >= 8
  lower: boolean; // /[a-z]/
  upper: boolean; // /[A-Z]/
  digit: boolean; // /[0-9]/
  symbol: boolean; // /[^A-Za-z0-9]/
};

export function checkPassword(pw: string): PasswordChecks {
  return {
    minLength: pw.length >= 8,
    lower: /[a-z]/.test(pw),
    upper: /[A-Z]/.test(pw),
    digit: /[0-9]/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  };
}

export function isPasswordValid(pw: string): boolean {
  const c = checkPassword(pw);
  return c.minLength && c.lower && c.upper && c.digit && c.symbol;
}
