import mongoose from "mongoose";

const BootstrapTokenSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    email: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// TTL: elimina automaticamente dopo scadenza
BootstrapTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export { BootstrapTokenSchema };