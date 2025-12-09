<template>
  <div class="container-fluid vh-100">
    <div class="row h-100">

      <!-- Colonna sinistra -->
      <div class="col-md-9 d-flex flex-column vh-100">

        <!-- Navbar -->
        <nav class="navbar navbar-expand-lg navbar-light w-100">
          <div class="container-fluid">
            <div>
              <img src="../assets/images/logo.png" class="me-2" style="height: 30px" />
              <a class="navbar-brand" href="#">PreFix</a>
            </div>
            <div class="d-flex">
              <p class="mt-3">
                Hai già un account?
                <router-link to="/">Accedi</router-link>
              </p>
            </div>
          </div>
        </nav>

        <!-- Form Registrazione -->
        <div class="d-flex justify-content-center align-items-center flex-grow-1">
          <div class="custom-width text-center">
            <h2 class="mb-4">Registrazione account</h2>
            <p class="mb-4">Crea un account per iniziare</p>

            <form @submit.prevent="doRegister">
              
              <div class="mb-3">
                <input type="text" v-model="name" class="form-control" placeholder="Nome" />
              </div>

              <div class="mb-3">
                <input type="email" v-model="email" class="form-control" placeholder="Email" />
              </div>

              <div class="mb-3">
                <input type="password" v-model="password" class="form-control" placeholder="Password" />
              </div>

              <button type="submit" class="btn btn-primary w-100">
                Registrati
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- Colonna destra immagine -->
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
import { register as registerService } from "../api/authService.js";

const email = ref("");
const password = ref("");
const name = ref("");
const router = useRouter();

async function doRegister() {
  if (!email.value || !password.value || !name.value) {
    alert("Compila tutti i campi");
    return;
  }

  try {
    const response = await registerService(email.value, password.value, name.value);

    // token presente → accedi direttamente
    if (response.data?.accessToken) {
      localStorage.setItem("authToken", response.data.accessToken);
      router.push("/dashboard");
    } else {
      alert("Registrazione avvenuta, ora accedi");
      router.push("/");
    }

  } catch (error) {
    console.error(error);
    alert("Errore durante la registrazione");
  }
}
</script>



<style scoped>
.object-fit-cover {
  object-fit: cover;
}

.custom-width {
  width: 400px;
  margin: 0 auto;
}
</style>