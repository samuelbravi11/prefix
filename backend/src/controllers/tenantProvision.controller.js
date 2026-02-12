import crypto from "crypto";
import { sha256 } from "../services/crypto.service.js";
import { platformDb } from "../config/dbManager.js";
import { TenantSchema } from "../models/Tenant.js";
import { BootstrapTokenSchema } from "../models/BootstrapToken.js";

function randomToken() {
  return crypto.randomBytes(32).toString("hex"); // 64 chars
}

export async function createTenantAndInvite(req, res) {
  try {
    console.log('[DEBUG] PLATFORM_SEED_KEY env:', process.env.PLATFORM_SEED_KEY);
    console.log('[DEBUG] x-platform-seed-key header:', req.headers['x-platform-seed-key']);

    const seedKey = req.headers["x-platform-seed-key"];
    if (!seedKey || seedKey !== process.env.PLATFORM_SEED_KEY) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!process.env.BOOTSTRAP_TOKEN_PEPPER) {
      return res.status(500).json({ message: "Missing BOOTSTRAP_TOKEN_PEPPER" });
    }
    if (!process.env.BASE_DOMAIN) {
      return res.status(500).json({ message: "Missing BASE_DOMAIN" });
    }

    const { slug, email } = req.body;
    if (!slug || !email) {
      return res.status(400).json({
        message: "Missing fields",
        required: ["slug", "email"],
      });
    }

    const normalizedSlug = String(slug).toLowerCase().trim();
    const normalizedEmail = String(email).toLowerCase().trim();

    const pdb = platformDb();

    const Tenant = pdb.models.Tenant || pdb.model("Tenant", TenantSchema);
    const BootstrapToken =
      pdb.models.BootstrapToken || pdb.model("BootstrapToken", BootstrapTokenSchema);

    const tenantId = crypto.randomUUID();
    const dbName = `t_${tenantId.replaceAll("-", "")}`;

    // (opzionale ma consigliato) evita slug duplicati
    const exists = await Tenant.findOne({ slug: normalizedSlug }).select("_id").lean();
    if (exists) {
      return res.status(409).json({ message: "Slug already in use" });
    }

    // crea tenant
    await Tenant.create({
      tenantId,
      slug: normalizedSlug,
      dbName,
      status: "provisioning",
    });

    // token 24h
    const token = randomToken();
    const tokenHash = sha256(token + process.env.BOOTSTRAP_TOKEN_PEPPER);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await BootstrapToken.create({
      tenantId,
      email: normalizedEmail,
      tokenHash,
      expiresAt,
      usedAt: null,
    });

    return res.status(201).json({
      tenantId,
      dbName,
      slug: normalizedSlug,
      bootstrapLink: `https://${normalizedSlug}.${process.env.BASE_DOMAIN}/bootstrap?token=${encodeURIComponent(token)}`,
    });
  } catch (err) {
    return res.status(500).json({ message: "Create tenant error", error: err.message });
  }
}