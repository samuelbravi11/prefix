// Middleware per il controllo dello stato dell'utente
// - active: ok
// - other: not ok
export default function requireActiveUser(req, res, next) {
  console.log("[DEBUG] requireActiveUser - req.user:", req.user);
  console.log("[DEBUG] requireActiveUser - status:", req.user?.status);

  const { status } = req.user;

  if (status !== "active") {
    console.log("[DEBUG] requireActiveUser - BLOCCO: status non attivo");
    return res.status(403).json({
      message: "Utente non attivo",
      status
    });
  }

  console.log("[DEBUG] requireActiveUser - PERMESSO: status attivo");
  next();
}
