import mongoose from "mongoose";

const OnboardingStatus = {
  EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
  TOTP_SETUP: "TOTP_SETUP",
  DONE: "DONE",
};

const RefreshTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true },
    fingerprintHash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const AuthSchema = new mongoose.Schema(
  {
    passwordHash: { type: String, required: true },
    passwordResetTokenHash: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null },
    lastPasswordChangeAt: { type: Date, default: null },
    refreshTokens: { type: [RefreshTokenSchema], default: [] },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    surname: { type: String, default: "" },

    email: { type: String, required: true, unique: true },

    roles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Role" }],

    buildingIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Building", index: true },
    ],

    status: {
      type: String,
      enum: ["pending", "active", "disabled"],
      default: "disabled",
      index: true,
    },

    fingerprintHash: { type: String, required: true },

    /**
     * NOTIFICATION PREFS (MVP)
     * Se false, l'utente NON riceve fan-out realtime e non gli vengono create nuove Notification a DB.
     */
    wantsNotifications: { type: Boolean, default: true, index: true },

    /**
     * Preferenze UI (MVP)
     * Struttura libera, usata dal frontend (tema, scheduler polling, ecc.).
     */
    preferences: { type: mongoose.Schema.Types.Mixed, default: {} },

    // --------------------
    // ONBOARDING
    // --------------------
    emailVerified: { type: Boolean, default: false, index: true },

    onboardingStatus: {
      type: String,
      enum: Object.values(OnboardingStatus),
      default: OnboardingStatus.EMAIL_VERIFICATION,
      index: true,
    },

    emailOtpHash: { type: String, default: null },
    emailOtpExpiresAt: { type: Date, default: null },

    totpEnabled: { type: Boolean, default: false },
    totpSecretEnc: { type: String, default: null },

    totpSetupTokenHash: { type: String, default: null },
    totpSetupTokenExpiresAt: { type: Date, default: null },

    tenantId: { type: String, required: true, index: true },
    isBootstrapAdmin: { type: Boolean, default: false, index: true },

    auth: { type: AuthSchema, required: true },
  },
  { timestamps: true }
);

export { OnboardingStatus, UserSchema };
