import mongoose from "mongoose";

const InterventionSchema = new mongoose.Schema(
  {
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: true,
      index: true,
    },

    type: {
      type: String,
      required: true,
      enum: ["maintenance", "inspection", "failure", "repair"],
    },

    outcome: {
      type: String,
      enum: ["ok", "ko", "partial"],
    },

    severity: {
      type: String,
      enum: ["low", "medium", "high"],
    },

    description: {
      type: String,
      trim: true,
    },

    performedAt: {
      type: Date,
      required: true,
      index: true,
    },

    durationMinutes: {
      type: Number,
      min: 0,
    },

    // eventuale collegamento a evento calendario
    calendarEventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CalendarEvent",
    },
  },
  {
    timestamps: true,
  }
);

export const Intervention = mongoose.model(
  "Intervention",
  InterventionSchema
);
