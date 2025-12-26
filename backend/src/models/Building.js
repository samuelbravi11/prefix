import mongoose from "mongoose";

const openingSlotSchema = new mongoose.Schema(
  {
    from: { type: String, required: true }, // "08:00"
    to: { type: String, required: true }    // "18:00"
  },
  { _id: false }
);

const buildingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    address: {
      type: String
    },

    city: {
      type: String
    },

    openingHours: {
      mon: [openingSlotSchema],
      tue: [openingSlotSchema],
      wed: [openingSlotSchema],
      thu: [openingSlotSchema],
      fri: [openingSlotSchema],
      sat: [openingSlotSchema],
      sun: [openingSlotSchema]
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Building", buildingSchema);
