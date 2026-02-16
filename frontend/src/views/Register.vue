<template>
  <div class="container-fluid vh-100 bg-light">
    <div class="row h-100 g-0">

      <!-- Colonna sinistra: Registrazione -->
      <div class="col-md-9 d-flex flex-column h-100">

        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center p-4 border-bottom">
          <div class="d-flex align-items-center">
            <img src="../assets/images/logo.png" class="me-3" style="height: 35px" alt="Logo" />
            <h4 class="mb-0 text-dark fw-bold">PreFix</h4>
          </div>
          <div>
            <span class="text-muted me-2">Hai già un account?</span>
            <router-link to="/login" class="text-primary text-decoration-none fw-medium">
              Accedi
            </router-link>
          </div>
        </div>

        <!-- Contenuto -->
        <div class="d-flex justify-content-center align-items-center flex-grow-1 p-4">
          <div class="w-100" style="max-width: 400px">

            <!-- Titolo -->
            <div class="text-center mb-5">
              <h1 class="fw-bold text-dark mb-3">
                <span v-if="step === 'form'">Registrati su PreFix</span>
                <span v-else-if="step === 'email'">Verifica Email</span>
                <span v-else-if="step === 'totp_setup'">Configura TOTP</span>
                <span v-else-if="step === 'totp_verify'">Verifica TOTP</span>
                <span v-else>Completato</span>
              </h1>
              <p class="text-muted">
                <span v-if="step === 'form'">Crea un account per iniziare a utilizzare la piattaforma</span>
                <span v-else-if="step === 'email'">Inserisci il codice OTP inviato alla tua email</span>
                <span v-else-if="step === 'totp_setup'">Scansiona il QR code con Google Authenticator / Authy</span>
                <span v-else-if="step === 'totp_verify'">Inserisci il codice a 6 cifre della tua app Authenticator</span>
                <span v-else>Registrazione completata</span>
              </p>
            </div>

            <!-- STEP 1: FORM REGISTRAZIONE -->
            <form v-if="step === 'form'" @submit.prevent="doRegister">
              <div class="mb-3">
                <label class="form-label fw-medium text-dark mb-2">Nome</label>
                <div class="input-group">
                  <span class="input-group-text bg-white border-end-0">
                    <i class="bi bi-person text-muted"></i>
                  </span>
                  <input
                    type="text"
                    v-model="name"
                    class="form-control border-start-0"
                    placeholder="Il tuo nome"
                    required
                  />
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label fw-medium text-dark mb-2">Cognome</label>
                <div class="input-group">
                  <span class="input-group-text bg-white border-end-0">
                    <i class="bi bi-person-badge text-muted"></i>
                  </span>
                  <input
                    type="text"
                    v-model="surname"
                    class="form-control border-start-0"
                    placeholder="Il tuo cognome"
                  />
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label fw-medium text-dark mb-2">Email</label>
                <div class="input-group">
                  <span class="input-group-text bg-white border-end-0">
                    <i class="bi bi-envelope text-muted"></i>
                  </span>
                  <input
                    type="email"
                    v-model="email"
                    class="form-control border-start-0"
                    placeholder="nome@esempio.com"
                    required
                  />
                </div>
              </div>

              <div class="mb-4">
                <label class="form-label fw-medium text-dark mb-2">Password</label>
                <div class="input-group">
                  <span class="input-group-text bg-white border-end-0">
                    <i class="bi bi-lock text-muted"></i>
                  </span>
                  <input
                    :type="showPassword ? 'text' : 'password'"
                    v-model="password"
                    class="form-control border-start-0"
                    placeholder="Crea una password"
                    required
                  />
                  <button
                    type="button"
                    class="input-group-text bg-white border-start-0"
                    @click="showPassword = !showPassword"
                  >
                    <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                class="btn btn-primary w-100 py-3 fw-medium"
                :disabled="loading"
              >
                <span v-if="loading">
                  <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                  Registrazione in corso...
                </span>
                <span v-else>
                  <i class="bi bi-person-plus me-2"></i>
                  Registrati
                </span>
              </button>
            </form>

            <!-- STEP 2: OTP EMAIL -->
            <div v-else-if="step === 'email'">
              <div class="mb-4">
                <label class="form-label fw-medium text-dark mb-2">Codice OTP Email</label>
                <div class="input-group">
                  <span class="input-group-text bg-white border-end-0">
                    <i class="bi bi-envelope-check text-muted"></i>
                  </span>
                  <input
                    v-model="otpCode"
                    class="form-control border-start-0"
                    placeholder="123456"
                    inputmode="numeric"
                    autocomplete="one-time-code"
                    required
                  />
                </div>
              </div>

              <button
                class="btn btn-primary w-100 py-3 fw-medium"
                :disabled="loading"
                @click="verifyEmail"
              >
                <span v-if="loading">
                  <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                  Verifica in corso...
                </span>
                <span v-else>
                  <i class="bi bi-check2-circle me-2"></i>
                  Verifica Email
                </span>
              </button>

              <button
                class="btn btn-link w-100 mt-2 text-decoration-none"
                :disabled="loading"
                @click="resetFlow"
              >
                Ricomincia
              </button>
            </div>

            <!-- STEP 3: TOTP SETUP -->
            <div v-else-if="step === 'totp_setup'">
              <div class="text-center mb-4">
                <img v-if="qrCodeDataUrl" :src="qrCodeDataUrl" alt="QR Code" style="width: 200px; height: 200px;" />
              </div>

              <button
                class="btn btn-primary w-100 py-3 fw-medium"
                :disabled="loading || !totpSetupToken"
                @click="goTotpVerify"
              >
                <i class="bi bi-shield-check me-2"></i>
                Ho scannerizzato, continua
              </button>

              <button
                class="btn btn-link w-100 mt-2 text-decoration-none"
                :disabled="loading"
                @click="resetFlow"
              >
                Ricomincia
              </button>
            </div>

            <!-- STEP 4: TOTP VERIFY -->
            <div v-else-if="step === 'totp_verify'">
              <div class="mb-4">
                <label class="form-label fw-medium text-dark mb-2">Codice TOTP</label>
                <div class="input-group">
                  <span class="input-group-text bg-white border-end-0">
                    <i class="bi bi-shield-lock text-muted"></i>
                  </span>
                  <input
                    v-model="totpCode"
                    class="form-control border-start-0"
                    placeholder="123456"
                    inputmode="numeric"
                    autocomplete="one-time-code"
                    required
                  />
                </div>
              </div>

              <button
                class="btn btn-primary w-100 py-3 fw-medium"
                :disabled="loading"
                @click="verifyTotp"
              >
                <span v-if="loading">
                  <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                  Verifica in corso...
                </span>
                <span v-else>
                  <i class="bi bi-check2-circle me-2"></i>
                  Verifica TOTP
                </span>
              </button>

              <button
                class="btn btn-link w-100 mt-2 text-decoration-none"
                :disabled="loading"
                @click="resetFlow"
              >
                Ricomincia
              </button>
            </div>

            <!-- STEP 5: COMPLETATO -->
            <div v-else class="text-center">
              <div class="alert alert-success">
                ✅ Registrazione completata.
                <div class="mt-2">
                  Il tuo account è stato creato e il TOTP è configurato.
                  <br />
                  Ora <b>attendi l'approvazione</b> di un admin (stato: pending).
                </div>
              </div>

              <router-link to="/login" class="btn btn-primary w-100 py-3 fw-medium">
                Vai al login
              </router-link>
            </div>

          </div>
        </div>

        <!-- Footer -->
        <div class="border-top p-3 text-center">
          <p class="text-muted small mb-0">
            © 2024 PreFix. Tutti i diritti riservati.
          </p>
        </div>
      </div>

      <!-- Colonna destra: Immagine -->
      <div class="col-md-3 d-none d-md-block p-0 bg-dark" style="height: 100vh;">
        <img
          :src="bgImage"
          class="w-100 h-100"
          style="object-fit: contain; object-position: center;"
          alt="Background"
        />
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import bgImage from "../assets/images/login_image.jpg";
import {
  register as registerService,
  verifyEmailOtp,
  totpSetup,
  totpVerify,
} from "../api/authService.js";

const router = useRouter();

const email = ref("");
const password = ref("");
const name = ref("");
const surname = ref("");
const showPassword = ref(false);
const loading = ref(false);

// step state
const step = ref("form"); // form | email | totp_setup | totp_verify | done

// onboarding data
const registrationToken = ref(null);
const otpCode = ref("");
const qrCodeDataUrl = ref("");
const totpSetupToken = ref("");
const totpCode = ref("");

function resetFlow() {
  step.value = "form";
  registrationToken.value = null;
  otpCode.value = "";
  qrCodeDataUrl.value = "";
  totpSetupToken.value = "";
  totpCode.value = "";
  sessionStorage.removeItem("registrationToken");
}

async function doRegister() {
  if (!email.value || !password.value || !name.value) {
    alert("Compila tutti i campi obbligatori");
    return;
  }

  loading.value = true;

  try {
    const res = await registerService({
      email: email.value,
      password: password.value,
      name: name.value,
      surname: surname.value,
    });

    registrationToken.value = res.data.registrationToken;
    sessionStorage.setItem("registrationToken", registrationToken.value);

    step.value = "email";
    alert("Registrazione avviata. Controlla la mail e inserisci l'OTP.");
  } catch (err) {
    console.error(err);

    let errorMessage = "Errore durante la registrazione";
    if (err.response?.status === 409) errorMessage = "Email già registrata";
    else if (err.response?.data?.message) errorMessage = err.response.data.message;

    alert(errorMessage);
  } finally {
    loading.value = false;
  }
}

async function verifyEmail() {
  const token = registrationToken.value || sessionStorage.getItem("registrationToken");
  if (!token) {
    alert("Token onboarding mancante. Ricomincia la registrazione.");
    return resetFlow();
  }
  if (!otpCode.value) {
    alert("Inserisci il codice OTP");
    return;
  }

  loading.value = true;
  try {
    await verifyEmailOtp({ registrationToken: token, code: otpCode.value });

    // subito dopo setup TOTP
    const setupRes = await totpSetup({ registrationToken: token });

    qrCodeDataUrl.value = setupRes.data.qrCodeDataUrl;
    totpSetupToken.value = setupRes.data.totpSetupToken;

    step.value = "totp_setup";
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || "OTP non valido o scaduto");
  } finally {
    loading.value = false;
  }
}

function goTotpVerify() {
  step.value = "totp_verify";
}

async function verifyTotp() {
  const token = registrationToken.value || sessionStorage.getItem("registrationToken");
  if (!token) {
    alert("Token onboarding mancante. Ricomincia la registrazione.");
    return resetFlow();
  }
  if (!totpSetupToken.value) {
    alert("TOTP setup token mancante. Ricomincia la registrazione.");
    return resetFlow();
  }
  if (!totpCode.value) {
    alert("Inserisci il codice TOTP");
    return;
  }

  loading.value = true;
  try {
    await totpVerify({
      registrationToken: token,
      totpSetupToken: totpSetupToken.value,
      code: totpCode.value,
    });

    step.value = "done";
    sessionStorage.removeItem("registrationToken");
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || "Codice TOTP non valido");
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
/* Solo 1 regola CSS personale! */
.bg-dark {
  background-color: #1F263E !important;
}

/* Nessun altro CSS necessario */
</style>