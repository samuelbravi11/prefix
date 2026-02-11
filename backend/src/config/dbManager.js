// src/config/dbManager.js
import mongoose from "mongoose";

let baseConn = null;
const tenantConnCache = new Map(); // dbName -> Connection

/**
 * Inizializza la connessione base al cluster.
 * Usa la URI del cluster (mongodb+srv://... o mongodb://... replica set).
 */
export async function initMongo() {
  if (baseConn?.readyState === 1) return baseConn;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI");

  // createConnection ritorna una Connection; asPromise() aspetta l'open
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
 * DB fisso per dati platform/central registry.
 */
export function platformDb() {
  if (!baseConn || baseConn.readyState !== 1) {
    throw new Error("Mongo not initialized. Call initMongo() first.");
  }

  return baseConn.useDb("platform", { useCache: true });
}

/**
 * DB tenant (1 DB per azienda).
 */
export function tenantDb(dbName) {
  if (!baseConn || baseConn.readyState !== 1) {
    throw new Error("Mongo not initialized. Call initMongo() first.");
  }
  if (!dbName) throw new Error("Missing tenant dbName");

  const key = String(dbName);

  // cache lato app (extra) + useCache lato mongoose
  const cached = tenantConnCache.get(key);
  if (cached?.readyState === 1) return cached;

  const conn = baseConn.useDb(key, { useCache: true });
  tenantConnCache.set(key, conn);

  return conn;
}