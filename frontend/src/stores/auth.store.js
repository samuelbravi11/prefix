import { defineStore } from "pinia";
import axios from "axios";

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
    // chiamata DOPO login o al refresh pagina
    async fetchMe() {
      this.loading = true;
      const token = localStorage.getItem("accessToken");
      
      console.log("DEBUG: Token per fetchMe:", token ? token.substring(0, 50) + "..." : "Nessun token");
  
      if (!token) {
        this.user = null;
        this.isAuthenticated = false;
        this.loading = false;
        return;
      }
      
      try {
        console.log("DEBUG: Chiamando /auth/me...");
        // Usa axios diretta per /auth/me
        const response = await axios.get("/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("DEBUG: Risposta da /auth/me:", response.data);
        this.user = response.data;
        this.isAuthenticated = true;
      } catch (err) {
        console.error("DEBUG: Errore fetchMe - URL chiamata:", err.config?.url);
        console.error("DEBUG: Errore fetchMe - Base URL:", err.config?.baseURL);
        console.error("DEBUG: Errore fetchMe - Headers:", err.config?.headers);
        console.error("DEBUG: Errore fetchMe - Risposta backend:", err.response?.data);
        
        this.user = null;
        this.isAuthenticated = false;
        localStorage.removeItem("accessToken");
      } finally {
        this.loading = false;
      }
    },

    /*
    // imposta lo stato di autenticazione e i dati utente dopo login --> il backend restituisce i dati utente dopo login, il token JWT è già stato ricevuto
    loginSuccess(token) {
      localStorage.setItem("accessToken", token);
    },
    */

    // logout --> rimuove il token JWT dallo storage e resetta lo stato di autenticazione e i dati utente
    // src/stores/auth.store.js - logout action
    async logout() {
      try {
        await fetch("/auth/logout", {
          method: "POST",
          credentials: "include",
          headers: {
            'Content-Type': 'application/json',
          }
        });
      } catch (error) {
        console.error("Errore durante logout API:", error);
      } finally {
        // PULISCI TUTTO
        this.user = null;
        this.isAuthenticated = false;
        localStorage.removeItem("accessToken");
        localStorage.removeItem("fingerprintHash"); // <-- AGGIUNGI
        
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }
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
  }
});
