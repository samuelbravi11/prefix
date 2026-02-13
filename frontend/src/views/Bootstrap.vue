<template>
  <div v-if="loading" class="loading">
    <p>Caricamento, attendere...</p>
  </div>
  <div v-else-if="error" class="error">
    <p style="color: red;">❌ {{ error }}</p>
  </div>
  <div v-else-if="step === 'email'" class="step">
    <h2>Verifica email</h2>
    <p>Inserisci il codice OTP inviato a {{ email }}</p>
    <input v-model="otpCode" placeholder="Codice a 6 cifre" />
    <button @click="verifyEmail">Verifica</button>
  </div>
  <div v-else-if="step === 'totp_setup'" class="step">
    <h2>Configura TOTP</h2>
    <p>Scansiona il QR code con Google Authenticator</p>
    <img :src="qrCode" alt="QR Code" style="width: 200px; height: 200px;" />
    <button @click="confirmTotpSetup">Ho scannerizzato, continua</button>
  </div>
  <div v-else-if="step === 'totp_verify'" class="step">
    <h2>Verifica TOTP</h2>
    <p>Inserisci il codice a 6 cifre dall'app</p>
    <input v-model="totpCode" placeholder="Codice TOTP" />
    <button @click="verifyTotp">Verifica</button>
  </div>
  <div v-else-if="step === 'completed'" class="success">
    <h2>✅ Registrazione completata!</h2>
    <p>Il tuo account è ora attivo. Puoi effettuare il login.</p>
    <router-link to="/login">Vai al login</router-link>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'Bootstrap',
  data() {
    return {
      loading: true,
      error: null,
      step: null,
      registrationToken: null,
      email: '',
      otpCode: '',
      totpSetupToken: '',
      qrCode: '',
      totpCode: '',
    };
  },
  created() {
    // Estrai token dalla query string
    const urlParams = new URLSearchParams(window.location.search);
    this.registrationToken = urlParams.get('token');
    if (!this.registrationToken) {
      this.error = 'Token di registrazione mancante';
      this.loading = false;
      return;
    }
    this.startBootstrap();
  },
  methods: {
    async startBootstrap() {
      try {
        // Recupera i dati dell'utente in attesa (opzionale)
        // Per ora assumiamo che il backend abbia inviato una email con OTP
        // Passiamo direttamente allo step di verifica email
        this.step = 'email';
        this.loading = false;
      } catch (err) {
        this.error = err.message;
        this.loading = false;
      }
    },
    async verifyEmail() {
      this.loading = true;
      try {
        const res = await axios.post(
          '/auth/verify-email',
          { code: this.otpCode },
          {
            headers: {
              Authorization: `Bearer ${this.registrationToken}`,
            },
          }
        );
        // Vai allo step successivo
        this.step = 'totp_setup';
        await this.setupTotp();
      } catch (err) {
        this.error = err.response?.data?.message || err.message;
      } finally {
        this.loading = false;
      }
    },
    async setupTotp() {
      this.loading = true;
      try {
        const res = await axios.post(
          '/auth/totp/setup',
          {},
          {
            headers: {
              Authorization: `Bearer ${this.registrationToken}`,
            },
          }
        );
        this.totpSetupToken = res.data.totpSetupToken;
        this.qrCode = res.data.qrCodeDataUrl;
        this.step = 'totp_verify';
      } catch (err) {
        this.error = err.response?.data?.message || err.message;
      } finally {
        this.loading = false;
      }
    },
    confirmTotpSetup() {
      // L'utente ha cliccato "Ho scannerizzato" – non c'è azione API,
      // passiamo direttamente alla verifica.
      this.step = 'totp_verify';
    },
    async verifyTotp() {
      this.loading = true;
      try {
        const res = await axios.post(
          '/auth/totp/verify',
          {
            totpSetupToken: this.totpSetupToken,
            code: this.totpCode,
          },
          {
            headers: {
              Authorization: `Bearer ${this.registrationToken}`,
            },
          }
        );
        this.step = 'completed';
      } catch (err) {
        this.error = err.response?.data?.message || err.message;
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>