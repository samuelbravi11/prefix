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
import bgImage from "../assets/images/login_image.jpg";
import { login as loginService } from "../api/authService.js"; //importa funzione login

const email = ref("");
const password = ref("");
const router = useRouter();

async function login() {
  if (!email.value || !password.value) {
    alert("Inserisci email e password");
    return;
  }

  try {
    const response = await loginService(email.value, password.value);

    const token = response.data.accessToken;
    localStorage.setItem("authToken", token);

    router.push("/dashboard");
  } catch (error) {
    alert("Email o password errati");
    console.error(error);
  }
}
</script>


<style scoped></style>
