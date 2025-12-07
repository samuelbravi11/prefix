import mongoose from "mongoose";

const requestLogSchema = new mongoose.Schema({
  userId: { type: String, required: false },
  method: String,
  path: String,
  ip: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model("RequestLog", requestLogSchema);