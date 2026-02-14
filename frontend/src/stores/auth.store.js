import { defineStore } from "pinia";
import authApi from "@/services/authApi";

// store globale pinia per gestione autenticazione utente, che rappresenta:
// - i dati dell’utente loggato (user)
// - lo stato di autenticazione (isAuthenticated)
// - azioni per login, logout, inizializzazione da storage
export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    isAuthenticated: false,
    loading: true,
  }),

  actions: {
    async fetchMe() {
      this.loading = true;

      const token = localStorage.getItem("accessToken");

      if (!token) {
        this.user = null;
        this.isAuthenticated = false;
        this.loading = false;
        return;
      }

      try {
        console.log("DEBUG: Chiamando /auth/me...");

        const response = await authApi.get("/me");

        console.log("DEBUG: Risposta:", response.data);

        this.user = response.data;
        this.isAuthenticated = true;

      } catch (err) {

        console.error("fetchMe error:", err.response?.data);

        this.user = null;
        this.isAuthenticated = false;

        localStorage.removeItem("accessToken");

      } finally {

        this.loading = false;

      }
    },

    async logout() {
      try {

        await authApi.post("/logout", {
          fingerprintHash: localStorage.getItem("fingerprintHash"),
        });

      } catch (err) {

        console.error("logout error", err);

      } finally {

        this.user = null;
        this.isAuthenticated = false;

        localStorage.removeItem("accessToken");
        localStorage.removeItem("fingerprintHash");

        window.location.href = "/login";

      }
    },
  },
});

/* IMPORTANTE: inizializza lo store da localStorage all’avvio dell’app
- se c’è un token JWT nello storage, imposta isAuthenticated a true
- NON imposta i dati utente (user) perché non li abbiamo
- per avere i dati utente bisogna chiamare /auth/me dopo l’inizializzazione

Il problema di trovare un token nello storage e assumere che l’utente sia autenticato è che:
- NON verifica nulla
- NON sa chi è l’utente
- NON controlla scadenza

Quindi lo stato iniziale dopo initFromStorage è "autenticato parzialmente", e bisogna chiamare /auth/me per completare l’autenticazione
TODO: in futuro potremmo decodificare il JWT per estrarre i dati utente senza chiamare /auth/me oppure chiamare /auth/me automaticamente dentro initFromStorage. Questo oltre che a usare Cookye HttpOnly per memorizzare il token.

Per ora ha senso così com’è perché:
- il token JWT è memorizzato in localStorage (non sicuro, ma semplice)
- tutta la logica di verifica utente è gestita nel backend
- frontend non decide nulla di critico

Serve solo a mantenere UI coerente, riavviare socket automaticamente e non buttare fuori l’utente al refresh
*/
/* RISOLTA PERCHE' ORA USIAMO L'ENDPOINT /auth/me DOPO IL REFRESH
  **************************************************************
initFromStorage() {
  const token = localStorage.getItem("accessToken");
  if (token) {
    // senza /auth/me non puoi ricostruire l’utente
    // quindi:
    // - o decodifichi il JWT
    // - o rimani "autenticato parzialmente" (autenticato dal punto di vista UI, ma non ho il profilo completo)
    this.isAuthenticated = true; // autenticazione parziale
  }
}
*/
