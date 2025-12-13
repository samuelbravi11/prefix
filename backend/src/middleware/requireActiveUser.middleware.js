// Middleware per il controllo dello stato dell'utente
// - active: ok
// - other: not ok
export default function requireActiveUser(req, res, next) {
  const { status } = req.user;

  if (status !== "active") {
    return res.status(403).json({
      message: "Utente non attivo",
      status
    });
  }

  next();
}
