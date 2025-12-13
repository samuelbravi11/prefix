import mongoose from "mongoose";

const RoleHierarchySchema = new mongoose.Schema({
  parentRole: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
    required: true
  },
  childRole: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
    required: true
  }
}, {
  timestamps: true
});

RoleHierarchySchema.index(
  { parentRole: 1, childRole: 1 },
  { unique: true }
);

const RoleHierarchy = mongoose.model("RoleHierarchy", RoleHierarchySchema);
export default RoleHierarchy;
