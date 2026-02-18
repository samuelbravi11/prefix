<template>
  <div class="container" style="max-width: 520px; padding: 32px;">
    <h2 class="mb-3">Bootstrap Admin</h2>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-if="step === 'form'">
      <p class="text-muted">
        Completa la creazione dell’admin. Poi riceverai un OTP email e configurerai il TOTP.
      </p>

      <div class="mb-3">
        <label class="form-label">Nome</label>
        <input v-model="name" class="form-control" placeholder="Nome" />
      </div>
      <div class="mb-3">
        <label class="form-label">Cognome</label>
        <input v-model="surname" class="form-control" placeholder="Cognome" />
      </div>
      <div class="mb-3">
        <label class="form-label">Password</label>
        <input v-model="password" type="password" class="form-control" placeholder="Password" />
      </div>

      <button class="btn btn-primary w-100" :disabled="loading" @click="startBootstrap">
        <span v-if="loading">Avvio...</span>
        <span v-else>Avvia bootstrap</span>
      </button>
    </div>

    <div v-else-if="step === 'email'">
      <p>Inserisci l’OTP email ricevuto.</p>
      <input v-model="otpCode" class="form-control mb-3" placeholder="123456" />
      <button class="btn btn-primary w-100" :disabled="loading" @click="verifyEmail">
        <span v-if="loading">Verifica...</span>
        <span v-else>Verifica email</span>
      </button>
    </div>

    <div v-else-if="step === 'totp_setup'">
      <p>Scansiona il QR con Authenticator.</p>
      <div class="text-center mb-3">
        <img v-if="qrCodeDataUrl" :src="qrCodeDataUrl" style="width: 220px; height: 220px;" />
      </div>
      <button class="btn btn-primary w-100" :disabled="loading || !totpSetupToken" @click="step = 'totp_verify'">
        Ho scannerizzato, continua
      </button>
    </div>

    <div v-else-if="step === 'totp_verify'">
      <p>Inserisci il codice TOTP.</p>
      <input v-model="totpCode" class="form-control mb-3" placeholder="123456" />
      <button class="btn btn-primary w-100" :disabled="loading" @click="verifyTotp">
        <span v-if="loading">Verifica...</span>
        <span v-else>Verifica TOTP</span>
      </button>
    </div>

    <div v-else>
      <div class="alert alert-success">
        Bootstrap completato. L’admin è attivo.
      </div>
      <router-link to="/login" class="btn btn-primary w-100">Vai al login</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  bootstrapStart,
  verifyEmailOtp,
  totpSetup,
  totpVerify,
} from "@/api/authService.js";

const router = useRouter();

const loading = ref(false);
const error = ref(null);

const step = ref("form"); // form | email | totp_setup | totp_verify | done

const bootstrapToken = ref(null);

const name = ref("");
const surname = ref("");
const password = ref("");

const registrationToken = ref(null);

const otpCode = ref("");
const qrCodeDataUrl = ref("");
const totpSetupToken = ref("");
const totpCode = ref("");

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  bootstrapToken.value = urlParams.get("token");
  if (!bootstrapToken.value) {
    error.value = "Token bootstrap mancante nella query string (?token=...)";
  }
});

async function startBootstrap() {
  if (!bootstrapToken.value) return;
  if (!name.value || !password.value) {
    error.value = "Nome e password sono obbligatori";
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const res = await bootstrapStart({
      token: bootstrapToken.value,
      name: name.value,
      surname: surname.value,
      password: password.value,
    });

    registrationToken.value = res.data.registrationToken;
    step.value = "email";
  } catch (err) {
    error.value = err.response?.data?.message || err.message;
  } finally {
    loading.value = false;
  }
}

async function verifyEmail() {
  loading.value = true;
  error.value = null;
  try {
    await verifyEmailOtp({
      registrationToken: registrationToken.value,
      code: otpCode.value,
    });

    const setupRes = await totpSetup({ registrationToken: registrationToken.value });
    qrCodeDataUrl.value = setupRes.data.qrCodeDataUrl;
    totpSetupToken.value = setupRes.data.totpSetupToken;

    step.value = "totp_setup";
  } catch (err) {
    error.value = err.response?.data?.message || err.message;
  } finally {
    loading.value = false;
  }
}

async function verifyTotp() {
  loading.value = true;
  error.value = null;
  try {
    await totpVerify({
      registrationToken: registrationToken.value,
      totpSetupToken: totpSetupToken.value,
      code: totpCode.value,
    });

    step.value = "done";
  } catch (err) {
    error.value = err.response?.data?.message || err.message;
  } finally {
    loading.value = false;
  }
}
</script>
