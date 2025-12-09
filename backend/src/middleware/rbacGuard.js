// middleware/rbacGuard.js

export default async function rbacGuard(req, res, next) {
  try {
    // 1. Estrai informazioni dalla richiesta
    const user = req.user; // messo da requireAuth
    const method = req.method;
    const path = req.originalUrl;

    // 2. Costruisci la richiesta da mandare al PDP decisionale
    const body = {
      userId: user.id,
      roles: user.roles,  // se non le hai nel token, il PDP le recupererà dal DB
      action: method,
      resource: path,
    };

    // 3. Chiamata al PDP interno
    const response = await fetch("http://127.0.0.1:4000/rbac/decide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const decision = await response.json();

    // 4. Se PDP nega, blocca la richiesta
    if (!decision.allow) {
      return res.status(403).json({
        message: "Accesso negato: permessi insufficienti",
        reason: decision.reason || "Not authorized",
      });
    }

    // 5. Tutto ok → passa al proxy verso il server interno
    next();

  } catch (error) {
    console.error("Errore in rbacGuard:", error);
    return res.status(500).json({
      message: "Errore RBAC interno",
    });
  }
}
