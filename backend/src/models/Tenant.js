import mongoose from "mongoose";

const TenantSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, unique: true, index: true },
  slug: { type: String, required: true, unique: true, index: true },
  dbName: { type: String, required: true, unique: true, index: true },
  status: { type: String, enum: ["provisioning", "active", "suspended"], default: "provisioning", index: true },
}, { timestamps: true });

export { TenantSchema };
