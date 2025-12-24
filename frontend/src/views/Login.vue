<template>
  <div class="container-fluid vh-100">
    <div class="row h-100">
      <!-- Colonna sinistra: Login -->

      <div class="col-md-9 d-flex flex-column vh-100">
        <!-- Navbar in cima -->
        <nav class="navbar navbar-expand-lg navbar-light w-100">
          <div class="container-fluid">
            <div>
              <img src="../assets/images/logo.png" class="me-2" style="height: 30px" />
              <a class="navbar-brand" href="#">PreFix</a>
            </div>
            <div class="d-flex">
              <p class="mt-3">
                Non hai un account?
                <router-link to="/register">Registrati</router-link>
              </p>
            </div>
          </div>
        </nav>

        <!-- Login form -->
        <div class="d-flex justify-content-center align-items-center flex-grow-1">
          <div class="custom-width text-center">
            <h2 class="mb-4">Account Login</h2>
            <p class="mb-4">Please log in to continue to your account</p>
            <form @submit.prevent="login">
              <div class="mb-3">
                <input type="text" v-model="email" class="form-control" placeholder="Email" />
              </div>
              <div class="mb-3">
                <input type="password" v-model="password" class="form-control" placeholder="Password" />
              </div>
              <button type="submit" class="btn btn-primary w-100">
                Log In
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- Colonna destra: Immagine -->
      <div class="col-md-3 d-none d-md-block p-0" style="height:100vh; background-color:#1F263E;">
        <img :src="bgImage" class="w-100 h-100" style="object-fit: contain; object-position:center;">
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";
import { login as loginService } from "@/api/authService.js";
import bgImage from "../assets/images/login_image.jpg";


const email = ref("");
const password = ref("");
const router = useRouter();
const authStore = useAuthStore();

async function login() {
  if (!email.value || !password.value) {
    alert("Inserisci email e password");
    return;
  }

  try {
    // login --> ricevo SOLO il token
    const response = await loginService(email.value, password.value);
    
    console.group("=== DEBUG TOKEN FLOW ===");
    console.log("1. Token ricevuto dal backend:");
    console.log("   Tipo:", typeof response.data.accessToken);
    console.log("   Lunghezza:", response.data.accessToken.length);
    console.log("   Valore:", response.data.accessToken);
    console.log("   Inizia con 'eyJ'?", response.data.accessToken.startsWith('eyJ'));
    
    // Controlla se è un JWT valido
    const parts = response.data.accessToken.split('.');
    console.log("   Parti JWT:", parts.length);
    if (parts.length === 3) {
      try {
        const header = JSON.parse(atob(parts[0]));
        const payload = JSON.parse(atob(parts[1]));
        console.log("   Header:", header);
        console.log("   Payload:", payload);
      } catch (e) {
        console.log("   ERRORE: Non è un JWT valido!", e);
      }
    }

    // salva token
    localStorage.setItem("accessToken", response.data.accessToken);
    const salvato = localStorage.getItem("accessToken");
    // Codifica in base64 per sicurezza
    const encodedToken = btoa(response.data.accessToken); // Solo se il token non è già base64
    console.log("Salvato:", salvato, "Encoded:", encodedToken);

    console.log("2. Token salvato in localStorage:");
    console.log("   Tipo:", typeof salvato);
    console.log("   Lunghezza:", salvato?.length);
    console.log("   Valore:", salvato);
    console.log("   Uguale all'originale?", salvato === response.data.accessToken);
    console.groupEnd();

    // recupera utente reale
    await authStore.fetchMe();
    console.log("Auth store dopo fetchMe:", {
      isAuthenticated: authStore.isAuthenticated,
      user: authStore.user
    });

    // entro nel layout autenticato
    router.push("/");

  } catch (error) {
    console.error("Errore login:", error);

    if (error.response?.status === 401) {
      alert("Email o password errati");
    } else if (error.response?.status === 403) {
      alert("Utente non ancora attivo");
    } else {
      alert("Errore durante il login");
    }
  }
}
</script>
