// models/Request.js
import mongoose from "mongoose";

const RequestSchema = new mongoose.Schema(
  {
    // tipo richiesta (discriminante logico)
    requestType: {
      type: String,
      enum: ["ASSIGN_ROLE", "ASSIGN_BUILDING"],
      required: true,
      index: true,
    },

    // utente su cui si richiede l’azione
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // payload variabile in base al tipo
    payload: {
      role: { type: String }, // ASSIGN_ROLE
      buildingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Building", // ASSIGN_BUILDING
      },
    },

    // chi ha creato la richiesta
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // stato workflow
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
      index: true,
    },

    // admin che ha deciso
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    decidedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Request", RequestSchema);
