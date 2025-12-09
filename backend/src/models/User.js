//Definizione struttura dati di User con mongoose

import mongoose from "mongoose";

const RefreshTokenSchema = new mongoose.Schema({
  //mi salvo l'hash del token per sicurezza --> il backend non deve mai salvare token in chiaro --> sicurezza in caso di data breach
  //lato client salvo il token in un httpOnly cookie --> prevenzione attacco XSS
  //lato server salvo l'hash del token
  //quando il client invia il token lo hasho e confronto gli hash
  //ogni token è legato ad un device tramite fingerprintHash --> login su più dispositivi sicuro
  //in questo modo posso invalidare i token di un device specifico
  //allo stesso tempo se un malintenzionato ruba un token (difficile poiché è criptato durante l'invio e salvato su HttpOnly Cookie lato client) non può usarlo senza la fingerprint e inoltre nel caso di attacco il JWT sarebbe uguale ma il fingerprintHash diverso quindi mismatch
  tokenHash: { type: String, required: true },
  //fingerprintHash: { type: String, required: true }, // legato al device
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

  role: {
    type: String,
    enum: ["local_admin", "central_admin", "contractor"],
    default: "local_admin"
  },

  /*
  securityNumber: {
    type: String,
    required: true,
    unique: true,
  },
  */

  fingerprintHash: {
    type: String,
    required: true
  },

  /*
  deviceFingerprint: {
    type: String,
    default: "",
  },
  */

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



/*
  fingerprintHash: String,
  deviceFingerprint: String,
*/



/*
UserSchema.post("save", function(doc) {
  console.log("Saved doc:", doc.email);
});
*/

// Middleware per aggiornare updatedAt
UserSchema.pre("save", function () {
  this.updatedAt = new Date();
});


const User = mongoose.model("User", UserSchema);

export default User;