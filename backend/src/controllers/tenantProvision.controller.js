import crypto from "crypto";
import { sha256 } from "../services/crypto.service.js";
import { platformDb } from "../config/dbManager.js";
import { TenantSchema } from "../models/Tenant.js";
import { BootstrapTokenSchema } from "../models/BootstrapToken.js";

function randomToken() {
  return crypto.randomBytes(32).toString("hex"); // 64 chars
}

function normalizeSlug(slug) {
  return String(slug || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createTenantAndInvite(req, res) {
  try {
    // Il controllo del seed è già fatto dal middleware requirePlatformKey
    // Qui non lo ripetiamo e non lo logghiamo.

    if (!process.env.BOOTSTRAP_TOKEN_PEPPER) {
      return res.status(500).json({ message: "Missing BOOTSTRAP_TOKEN_PEPPER" });
    }
    if (!process.env.BASE_DOMAIN) {
      return res.status(500).json({ message: "Missing BASE_DOMAIN" });
    }

    const { slug, email } = req.body || {};
    if (!slug || !email) {
      return res.status(400).json({
        message: "Missing fields",
        required: ["slug", "email"],
      });
    }

    const normalizedSlug = normalizeSlug(slug);
    if (!normalizedSlug || normalizedSlug.length < 3) {
      return res.status(400).json({ message: "Invalid slug" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    if (!normalizedEmail.includes("@")) {
      return res.status(400).json({ message: "Invalid email" });
    }

    const pdb = platformDb();
    const Tenant = pdb.models.Tenant || pdb.model("Tenant", TenantSchema);
    const BootstrapToken =
      pdb.models.BootstrapToken || pdb.model("BootstrapToken", BootstrapTokenSchema);

    // evita slug duplicati
    const exists = await Tenant.findOne({ slug: normalizedSlug }).select("_id").lean();
    if (exists) {
      return res.status(409).json({ message: "Slug already in use" });
    }

    const tenantId = crypto.randomUUID();
    const dbName = `t_${tenantId.replace(/-/g, "")}`;

    // crea tenant
    await Tenant.create({
      tenantId,
      slug: normalizedSlug,
      dbName,
      status: "provisioning",
    });

    // bootstrap token valido 24h (monouso)
    const token = randomToken();
    const tokenHash = sha256(token + process.env.BOOTSTRAP_TOKEN_PEPPER);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await BootstrapToken.create({
      tenantId,
      email: normalizedEmail,
      tokenHash,
      expiresAt,
      usedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const bootstrapLink = `https://${normalizedSlug}.${process.env.BASE_DOMAIN}/bootstrap?token=${encodeURIComponent(
      token
    )}`;

    return res.status(201).json({
      tenantId,
      dbName,
      slug: normalizedSlug,
      bootstrapLink,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Create tenant error",
      error: err.message,
    });
  }
}
