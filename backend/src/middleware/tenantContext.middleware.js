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
    const baseDomain = process.env.BASE_DOMAIN; // es "app.com"
    if (!baseDomain) throw new Error("Missing BASE_DOMAIN env");

    const host = normalizeHost(req.headers["x-forwarded-host"] || req.headers.host);
    const slug = extractTenantSlug(host, baseDomain);


    // 🔧 FALLBACK PER SVILUPPO
    if (!slug && process.env.NODE_ENV !== 'production') {
      slug = process.env.DEFAULT_DEV_TENANT_SLUG || 'demo';
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
    return res.status(500).json({ message: "Tenant context error", error: err.message });
  }
}
