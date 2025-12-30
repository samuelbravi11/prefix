// Header usato per identificare le richieste provenienti ESCLUSIVAMENTE dal proxy/guard.
// export const INTERNAL_PROXY_HEADER = "x-internal-proxy";
// export const INTERNAL_PROXY_VALUE = "true";

/* Middleware da usare NEL PROXY (Guard)
  Aggiunge l’header alle richieste: x-internal-proxy: true.
  Il server interno lo usa per rifiutare accessi diretti e fidarsi solo del proxy
  Questa è la fiducia tra proxy e server.
*/
/* --> FUNZIONE SPOSTATA SU proxyApp.js
export function withInternalProxyHeader(proxyReq, req, res) {
  console.log("[PROXY HEADER DEBUG] Setting header for request to:", req.originalUrl);
  console.log("[PROXY HEADER DEBUG] Request headers:", req.headers);
  proxyReq.setHeader(INTERNAL_PROXY_HEADER, INTERNAL_PROXY_VALUE);
  
  // Log degli header che stiamo inviando
  const headers = proxyReq.getHeaders();
  console.log("[PROXY HEADER DEBUG] Headers being sent:", headers);
}
*/

/* Middleware da usare NEL SERVER INTERNO
  Blocca ogni accesso diretto (browser, curl, postman, ecc.)
*/
/* --> FUNZIONE SPOSTATA SU app.js
export function requireInternalProxy(req, res, next) {
  const internalHeader = req.headers[INTERNAL_PROXY_HEADER];
  console.log("[INTERNAL SECURITY] Header ricevuto:", internalHeader, "(atteso:", INTERNAL_PROXY_VALUE + ")");
  
  if (internalHeader !== INTERNAL_PROXY_VALUE) {
    console.log("[INTERNAL SECURITY] ACCESSO DIRETTO BLOCCATO!");
    return res.status(403).json({
      message: "Accesso diretto al server interno vietato",
      receivedHeader: internalHeader,
      expected: INTERNAL_PROXY_VALUE
    });
  }
  console.log("[INTERNAL SECURITY] Accesso consentito via proxy");
  next();
}
*/
