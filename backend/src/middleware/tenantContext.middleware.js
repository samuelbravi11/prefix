import { platformDb, tenantDb } from "../config/dbManager.js";
import { TenantSchema } from "../models/Tenant.js";

function normalizeHost(h) {
  return String(h || "").toLowerCase().trim().replace(/:\d+$/, "");
}

function extractTenantSlug(host, baseDomain) {
  // baseDomain es: app.com
  if (!host.endsWith(baseDomain)) return null;

  const parts = host.split(".");
  const baseParts = baseDomain.split(".");
  if (parts.length <= baseParts.length) return null; // no subdomain

  // tenantSlug = prima parte (acme.app.com -> acme)
  return parts[0];
}

export default async function tenantContext(req, res, next) {
  try {
    // Le route di provisioning piattaforma non dipendono da un tenant e devono funzionare
    // anche senza subdomain (es: http://localhost/api/v1/platform/tenants)
    if (req.path?.startsWith("/api/v1/platform")) {
      req.tenant = null;
      return next();
    }

    const baseDomain = process.env.BASE_DOMAIN;
    if (!baseDomain) throw new Error("Missing BASE_DOMAIN env");

    const host = normalizeHost(req.headers["x-forwarded-host"] || req.headers.host);
    let slug = extractTenantSlug(host, baseDomain);

    // 🔧 FALLBACK PER SVILUPPO
    if (!slug && process.env.NODE_ENV === 'development') {
      slug = process.env.DEFAULT_DEV_TENANT_SLUG || 'test12';
      console.warn(`[DEV] No tenant subdomain, using default slug: ${slug}`);
    }

    // se vuoi anche "app.com" senza subdomain (landing), gestiscilo qui:
    if (!slug) {
      req.tenant = null;
      return next();
    }

    const pdb = platformDb();
    const Tenant = pdb.models.Tenant || pdb.model("Tenant", TenantSchema);

    const t = await Tenant.findOne({ slug, status: { $ne: "suspended" } }).lean();
    if (!t) return res.status(404).json({ message: "Tenant not found", slug });

    req.tenant = {
      tenantId: t.tenantId,
      slug: t.slug,
      dbName: t.dbName,
    };

    return next();
  } catch (err) {
    console.error(err.stack);
    return res.status(500).json({
      message: "Tenant context error",
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}