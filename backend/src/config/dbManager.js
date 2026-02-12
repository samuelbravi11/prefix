// src/config/dbManager.js
import mongoose from "mongoose";

let baseConn = null;
const tenantConnCache = new Map();

/**
 * Connessione fisica unica al cluster.
 * IMPORTANT: MONGODB_URI deve includere SRV o standard URI e (opzionale) parametri.
 */
export async function initMongo() {
  if (baseConn?.readyState === 1) return baseConn;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI");

  baseConn = await mongoose
    .createConnection(uri, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 10000,
    })
    .asPromise();

  console.log("[Mongo] connected (base) to cluster");
  return baseConn;
}

/**
 * DB fisso per registry tenant.
 * Scegli UNO e usalo ovunque (qui: "platform")
 */
export function platformDb() {
  if (!baseConn) throw new Error("Mongo not initialized");
  return baseConn.useDb("platform", { useCache: true });
}

/**
 * DB per tenant (1 DB per azienda) via useDb su baseConn.
 * Non crea nuove connessioni fisiche.
 */
export function tenantDb(dbName) {
  if (!baseConn) throw new Error("Mongo not initialized");
  if (!dbName) throw new Error("Missing tenant dbName");

  if (tenantConnCache.has(dbName)) return tenantConnCache.get(dbName);

  const conn = baseConn.useDb(dbName, { useCache: true });
  tenantConnCache.set(dbName, conn);
  return conn;
}
