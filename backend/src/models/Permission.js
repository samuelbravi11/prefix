import mongoose from "mongoose";

const PermissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  description: {
    type: String,
    default: ""
  }
}, {
  timestamps: true
});

// const Permission = mongoose.model("Permission", PermissionSchema);
export { PermissionSchema };
