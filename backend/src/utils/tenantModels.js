// src/utils/tenantModels.js
import { platformDb, tenantDb } from "../config/dbManager.js";

// CENTRAL (platform) schema
import { TenantSchema } from "../models/Tenant.js";

// TENANT schemas
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

/**
 * Registra i modelli tenant su una connessione (useDb).
 */
function ensureTenantModels(conn) {
  return {
    Permission: conn.models.Permission || conn.model("Permission", PermissionSchema),
    Role: conn.models.Role || conn.model("Role", RoleSchema),
    User: conn.models.User || conn.model("User", UserSchema),

    Building: conn.models.Building || conn.model("Building", BuildingSchema),
    Asset: conn.models.Asset || conn.model("Asset", AssetSchema),
    Rule: conn.models.Rule || conn.model("Rule", RuleSchema),

    AIResult: conn.models.AIResult || conn.model("AIResult", AiresultSchema),
    Event: conn.models.Event || conn.model("Event", EventSchema),
    Intervention: conn.models.Intervention || conn.model("Intervention", InterventionSchema),

    Notification: conn.models.Notification || conn.model("Notification", NotificationSchema),
    Request: conn.models.Request || conn.model("Request", RequestSchema),
    AuditLog: conn.models.AuditLog || conn.model("AuditLog", AuditLogSchema),

    BootstrapToken: conn.models.BootstrapToken || conn.model("BootstrapToken", BootstrapTokenSchema),
    Category: conn.models.Category || conn.model("Category", CategorySchema),
  };
}

/**
 * Restituisce i modelli tenant per la richiesta.
 */
export function getTenantModels(req) {
  if (!req?.tenant?.dbName) {
    throw new Error("Tenant context missing on req (req.tenant.dbName).");
  }

  const conn = tenantDb(req.tenant.dbName);
  return ensureTenantModels(conn);
}

/**
 * Costruisce un contesto tenant completo (per servizi, job, ecc.).
 */
export async function buildCtxFromReq(req) {
  if (!req?.tenant?.tenantId || !req?.tenant?.dbName) {
    throw new Error("Tenant context missing on req.");
  }

  const conn = tenantDb(req.tenant.dbName);
  return {
    tenant: req.tenant,
    tenantId: req.tenant.tenantId,
    dbName: req.tenant.dbName,
    conn,
    models: ensureTenantModels(conn),
  };
}

/**
 * Costruisce un contesto da un oggetto tenant (per background).
 */
export async function buildCtxFromTenant(tenant) {
  if (!tenant?.tenantId || !tenant?.dbName) {
    throw new Error("Invalid tenant object. Expected { tenantId, dbName }");
  }

  const conn = tenantDb(tenant.dbName);
  return {
    tenant,
    tenantId: tenant.tenantId,
    dbName: tenant.dbName,
    conn,
    models: ensureTenantModels(conn),
  };
}

/**
 * Elenco tenant attivi.
 */
export async function listActiveTenants() {
  const pdb = platformDb();
  const Tenant = pdb.models.Tenant || pdb.model("Tenant", TenantSchema);
  return Tenant.find({ status: "active" }).select("tenantId dbName slug status").lean();
}