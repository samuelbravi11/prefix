// src/utils/tenantModels.js
import mongoose from "mongoose";

// CENTRAL
import { TenantSchema } from "../models/Tenant.js";

// TENANT SCHEMAS
import { UserSchema } from "../models/User.js";
import { RoleSchema } from "../models/Role.js";
import { PermissionSchema } from "../models/Permission.js";
import { BuildingSchema } from "../models/Building.js";
import { AssetSchema } from "../models/Asset.js";
import { RuleSchema } from "../models/Rule.js";
import { AiresultSchema } from "../models/Airesult.js";
import { EventSchema } from "../models/Event.js";
import { InterventionSchema } from "../models/Intervention.js";
import { NotificationSchema } from "../models/Notification.js";
import { RequestSchema } from "../models/Request.js";
import { AuditLogSchema } from "../models/AuditLog.js";
import { BootstrapTokenSchema } from "../models/BootstrapToken.js";
import { CategorySchema } from "../models/Category.js";

// central db (registry tenants)
const centralConnection = mongoose.connection.useDb("central");
const Tenant =
  centralConnection.models.Tenant ||
  centralConnection.model("Tenant", TenantSchema);

// cache tenant connections
const tenantCache = new Map(); // tenantId -> { conn, models, tenantId, dbName }

function ensureTenantModels(conn) {
  return {
    Permission: conn.models.Permission || conn.model("Permission", PermissionSchema),
    Role: conn.models.Role || conn.model("Role", RoleSchema),
    User: conn.models.User || conn.model("User", UserSchema),

    Building: conn.models.Building || conn.model("Building", BuildingSchema),
    Asset: conn.models.Asset || conn.model("Asset", AssetSchema),
    Rule: conn.models.Rule || conn.model("Rule", RuleSchema),

    // Uniforma il nome al ref nei tuoi schema: "Airesult"
    Airesult: conn.models.Airesult || conn.model("Airesult", AiresultSchema),

    Event: conn.models.Event || conn.model("Event", EventSchema),
    Intervention: conn.models.Intervention || conn.model("Intervention", InterventionSchema),

    Notification: conn.models.Notification || conn.model("Notification", NotificationSchema),
    Request: conn.models.Request || conn.model("Request", RequestSchema),
    AuditLog: conn.models.AuditLog || conn.model("AuditLog", AuditLogSchema),

    BootstrapToken: conn.models.BootstrapToken || conn.model("BootstrapToken", BootstrapTokenSchema),
    Category: conn.models.Category || conn.model("Category", CategorySchema),
  };
}

function buildDbUri(mongoUri, dbName) {
  const uri = new URL(mongoUri);
  uri.pathname = `/${dbName}`;
  return uri.toString();
}

async function getOrCreateTenantConnection({ tenantId, dbName }) {
  const cached = tenantCache.get(tenantId);
  if (cached?.conn?.readyState === 1 && cached?.models) return cached;

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("Missing MONGODB_URI");

  const dbUri = buildDbUri(mongoUri, dbName);

  const conn = await mongoose.createConnection(dbUri).asPromise();
  const models = ensureTenantModels(conn);

  const entry = { tenantId, dbName, conn, models };
  tenantCache.set(tenantId, entry);
  return entry;
}

export async function buildCtxFromReq(req) {
  if (!req?.tenant?.tenantId || !req?.tenant?.dbName) {
    throw new Error("Tenant context missing on req. Did you mount tenantContext middleware?");
  }

  const { tenantId, dbName } = req.tenant;
  const { conn, models } = await getOrCreateTenantConnection({ tenantId, dbName });

  return { tenant: req.tenant, tenantId, dbName, conn, models };
}

export async function buildCtxFromTenant(tenant) {
  if (!tenant?.tenantId || !tenant?.dbName) {
    throw new Error("Invalid tenant object. Expected { tenantId, dbName }");
  }

  const { tenantId, dbName } = tenant;
  const { conn, models } = await getOrCreateTenantConnection({ tenantId, dbName });

  return { tenant, tenantId, dbName, conn, models };
}

export async function listActiveTenants() {
  return Tenant.find({ status: "active" })
    .select("tenantId dbName slug status")
    .lean();
}

export async function getTenantModels(req) {
  const ctx = await buildCtxFromReq(req);
  return ctx.models;
}