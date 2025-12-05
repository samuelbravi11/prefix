import mongoose from "mongoose";

// Schema per i refresh token
const RefreshTokenSchema = new mongoose.Schema(
  {
    tokenHash: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// Schema per autenticazione
const AuthSchema = new mongoose.Schema(
  {
    passwordHash: {
      type: String,
      required: true,
    },
    passwordResetTokenHash: {
      type: String,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    },
    lastPasswordChangeAt: {
      type: Date,
      default: null,
    },
    refreshTokens: {
      type: [RefreshTokenSchema],
      default: [],
    },
  },
  { _id: false }
);

// Schema utente
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  surname: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  role: {
    type: String,
    required: true,
    enum: ["local_admin", "central_admin", "contractor"],
  },

  securityNumber: {
    type: String,
    required: true,
    unique: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },

  auth: {
    type: AuthSchema,
    required: true,
  },
});

// Middleware per aggiornare updatedAt
UserSchema.pre("save", function () {
  this.updatedAt = new Date();
});

// Export ES Module
export default mongoose.model("User", UserSchema);