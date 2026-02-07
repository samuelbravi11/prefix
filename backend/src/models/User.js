import mongoose from "mongoose";

/**
 * Enum onboarding: stato “tecnico” di registrazione.
 * NON sostituisce lo status business (pending/active) che serve per approvazione Admin.
 */
const OnboardingStatus = {
  EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
  TOTP_SETUP: "TOTP_SETUP",
  DONE: "DONE",
};


const RefreshTokenSchema = new mongoose.Schema({
  //mi salvo l'hash del token per sicurezza --> il backend non deve mai salvare token in chiaro --> sicurezza in caso di data breach
  //lato client salvo il token in un httpOnly cookie --> prevenzione attacco XSS
  //lato server salvo l'hash del token
  //quando il client invia il token lo hasho e confronto gli hash
  //ogni token è legato ad un device tramite fingerprintHash --> login su più dispositivi sicuro
  //in questo modo posso invalidare i token di un device specifico
  //allo stesso tempo se un malintenzionato ruba un token (difficile poiché è criptato durante l'invio e salvato su HttpOnly Cookie lato client) non può usarlo senza la fingerprint e inoltre nel caso di attacco il JWT sarebbe uguale ma il fingerprintHash diverso quindi mismatch
  tokenHash: { type: String, required: true },
  fingerprintHash: { type: String, required: true }, // legato al device
  createdAt: { type: Date, default: Date.now }
}, { _id: false });


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
    default: "",
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  roles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role"
  }],

  buildingIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Building",
    index: true
  }],

  /**
   * STATUS BUSINESS:
   * - pending: registrato + TOTP ok, in attesa approvazione Admin Centrale
   * - active: approvato
   * - suspended/disabled: stati di blocco
  */
  status: {
    type: String,
    enum: ["pending", "active", "suspended", "disabled"],
    default: "disabled", // <-- IMPORTANTE: durante onboarding lo teniamo disabled
    index: true,
  },

  fingerprintHash: {
    type: String,
    required: true
  },


  // --------------------
  // ONBOARDING REGISTRAZIONE
  // --------------------
  emailVerified: {
    type: Boolean,
    default: false,
    index: true,
  },

  onboardingStatus: {
    type: String,
    enum: Object.values(OnboardingStatus),
    default: OnboardingStatus.EMAIL_VERIFICATION,
    index: true,
  },

  /**
   * OTP email: salviamo SOLO hash + scadenza (mai codice in chiaro)
   */
  emailOtpHash: { type: String, default: null },
  emailOtpExpiresAt: { type: Date, default: null },

  /**
   * TOTP:
   * - secret cifrato a riposo (AES-GCM)
   * - enabled true solo dopo verify
   */
  totpEnabled: { type: Boolean, default: false },
  totpSecretEnc: { type: String, default: null }, // base64 payload cifrato

  /**
   * Token a vita breve per legare setup->verify (opzionale ma consigliato)
   * - salviamo hash + scadenza
   */
  totpSetupTokenHash: { type: String, default: null },
  totpSetupTokenExpiresAt: { type: Date, default: null },


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
}, { 
  //serve per avere createdAt e updatedAt automatici
  timestamps: true 
});


// Middleware per aggiornare updatedAt
UserSchema.pre("save", function () {
  this.updatedAt = new Date();
});


const User = mongoose.model("User", UserSchema);

export { OnboardingStatus };
export default User;