// Schema per tutte le azioni svolti da utenti (es. admin_locale, mario_rossi, dashboard:view)

import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema({
  entityType: {
    type: String,
    required: true,
    index: true
  },

  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },

  action: {
    type: String,
    required: true,
    index: true
  },

  byUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
    default: null,
    index: true
  },

  timestamp: {
    type: Date,
    default: Date.now
  },

  details: {
    type: Object,
    default: {}
  }

}, {
  versionKey: false
});

// TTL index: elimina automaticamente i documenti dopo 30 giorni
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 }); // 30 giorni

// export default mongoose.model("AuditLog", AuditLogSchema);
export { AuditLogSchema };