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
    required: true,
    index: true
  },

  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },

  details: {
    type: Object,
    default: {}
  }

}, {
  versionKey: false
});

export default mongoose.model("AuditLog", AuditLogSchema);
