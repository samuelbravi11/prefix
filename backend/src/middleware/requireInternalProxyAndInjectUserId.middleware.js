// src/middleware/requireInternalProxyAndInjectUserId.middleware.js

/**
 * Blocca accessi diretti al server interno:
 * - consente solo se header "x-internal-proxy" === "true"
 * - salva su req.user._id lo userId passato dal proxy (x-user-id), se presente
 *
 * Nota:
 * - NON verifica JWT qui (lo fa il proxy).
 * - Il server interno riceve solo un “sigillo di fiducia” + userId.
 */
export default function requireInternalProxyAndInjectUserId(req, res, next) { 
  // Header di fiducia: se manca -> accesso diretto vietato
  const required = process.env.INTERNAL_PROXY_SECRET;
  if (req.headers["x-internal-proxy"] !== "true") {
    return res.status(403).json({ error: "Direct access forbidden" });
  }
  if (required) {
    const got = req.headers["x-internal-secret"];
    if (!got || String(got) !== String(required)) {
      return res.status(403).json({ error: "Direct access forbidden" });
    }
  }

  // Il proxy passa solo l'id utente
  const userId = req.headers["x-user-id"];
  if (userId) {
    // Non sovrascrivere altri campi se già presenti
    req.user = { ...(req.user || {}), _id: userId };
  }

  return next();
}
