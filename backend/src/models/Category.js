import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },

    description: {
      type: String
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export { CategorySchema };
