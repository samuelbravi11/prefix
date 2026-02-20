export function getCookieOptions(req, { httpOnly = true, maxAge, path = "/" } = {}) {
  // dietro nginx/proxy: usa X-Forwarded-Proto
  const xfProto = String(req.headers["x-forwarded-proto"] || "").toLowerCase();
  const isHttps = xfProto === "https";

  const baseDomain = process.env.BASE_DOMAIN; // es: lvh.me
  const cookieDomainEnv = process.env.COOKIE_DOMAIN; // opzionale
  const domain =
    cookieDomainEnv && cookieDomainEnv.trim().length > 0
      ? cookieDomainEnv.trim()
      : (process.env.NODE_ENV === "development" ? undefined : (baseDomain ? `.${baseDomain}` : undefined));

  // In HTTP: SameSite=None viene rifiutato se Secure non è true.
  // Quindi in dev/http -> Lax + secure false.
  const sameSite = isHttps ? "None" : "Lax";
  const secure = isHttps;

  const opts = {
    httpOnly,
    secure,
    sameSite,
    path,
  };

  if (typeof maxAge === "number") opts.maxAge = maxAge;
  if (domain) opts.domain = domain;

  return opts;
}