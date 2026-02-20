<template>
  <div class="d-flex flex-column vh-100 text-white overflow-auto flex-shrink-0 sidebar-container">
    <div class="flex-grow-1 d-flex flex-column">
      <!-- Header -->
      <nav class="navbar p-0 mb-3 py-4 d-flex justify-content-center align-items-center sidebar-header">
        <h4 class="text-white navbar-brand mb-0 h5">PreFix</h4>
      </nav>

      <!-- Quick Access -->
      <ul class="nav flex-column mt-4">
        <li class="nav-item mb-2 px-3">
          <h6 class="text-uppercase small fw-semibold mb-0">Quick Access</h6>
        </li>
      </ul>

      <ul class="nav flex-column mt-0 sidebar-menu">
        <li class="nav-item">
          <router-link
            to="/home"
            class="nav-link sidebar-link"
            active-class="active-link"
            exact-active-class="active-link"
            @click="setPageTitle('Quick Access')"
          >
            <div class="d-flex align-items-center">
              <i class="bi bi-grid icon-azure me-3 flex-shrink-0"></i>
              <span class="sidebar-text">Home</span>
            </div>
          </router-link>
        </li>

        <!-- Dashboard (generica) -->
        <li v-if="can('dashboard:view')" class="nav-item">
          <router-link
            to="/dashboard"
            class="nav-link sidebar-link"
            active-class="active-link"
            exact-active-class="active-link"
            @click="setPageTitle('Dashboard')"
          >
            <div class="d-flex align-items-center">
              <i class="bi bi-bar-chart icon-azure me-3 flex-shrink-0"></i>
              <span class="sidebar-text">Dashboard</span>
            </div>
          </router-link>
        </li>

        <!-- Calendario interventi (specifica) -->
        <li v-if="can('events:view')" class="nav-item">
          <router-link
            to="/calendar"
            class="nav-link sidebar-link"
            active-class="active-link"
            exact-active-class="active-link"
            @click="setPageTitle('Calendario Interventi')"
          >
            <div class="d-flex align-items-center">
              <i class="bi bi-calendar-event icon-azure me-3 flex-shrink-0"></i>
              <span class="sidebar-text">Calendario Interventi</span>
            </div>
          </router-link>
        </li>

        <!-- Seleziona edifici associati (specifica) -->
        <li v-if="can('buildings:view_associated')" class="nav-item">
          <router-link
            to="/buildings-list"
            class="nav-link sidebar-link"
            active-class="active-link"
            exact-active-class="active-link"
            @click="setPageTitle('Edifici affidati')"
          >
            <div class="d-flex align-items-center">
              <i class="pi pi-building icon-azure me-3 flex-shrink-0"></i>
              <span class="sidebar-text">Seleziona Edifici</span>
            </div>
          </router-link>
        </li>

        <!-- Oggetti & Regole (generica) -->
        <li
          v-if="canAny(['assets:view','assets:manage','assets:create','rules:view','rules:manage','rules:create'])"
          class="nav-item"
        >
          <router-link
            to="/oggetti-regole"
            class="nav-link sidebar-link"
            active-class="active-link"
            exact-active-class="active-link"
            @click="setPageTitle('Oggetti & Regole')"
          >
            <div class="d-flex align-items-center">
              <i class="bi bi-box-seam icon-azure me-3 flex-shrink-0"></i>
              <span class="sidebar-text">Oggetti & Regole</span>
            </div>
          </router-link>
        </li>

        <!-- Gestione utenti (generica - include anche Ruoli) -->
        <li
          v-if="canAny(['users:active:view','users:update_status','users:update_role','users:approve','requests:manage','users:info:view','roles:manage'])"
          class="nav-item"
        >
          <router-link
            to="/gestione-utenti"
            class="nav-link sidebar-link"
            active-class="active-link"
            exact-active-class="active-link"
            @click="setPageTitle('Gestione utenti')"
          >
            <div class="d-flex align-items-center">
              <i class="bi bi-people icon-azure me-3 flex-shrink-0"></i>
              <span class="sidebar-text">Gestione utenti</span>
            </div>
          </router-link>
        </li>

        <!-- Gestione edifici (generica) -->
        <li v-if="canAny(['buildings:view_all','buildings:view','buildings:manage','buildings:create'])" class="nav-item">
          <router-link
            to="/gestione-edifici"
            class="nav-link sidebar-link"
            active-class="active-link"
            exact-active-class="active-link"
            @click="setPageTitle('Gestione Edifici')"
          >
            <div class="d-flex align-items-center">
              <i class="bi bi-building icon-azure me-3 flex-shrink-0"></i>
              <span class="sidebar-text">Gestione edifici</span>
            </div>
          </router-link>
        </li>

        <!-- Interventi (generica) -->
        <li v-if="canAny(['interventions:view','interventions:create','interventions:bulk_upload','interventions:manage'])" class="nav-item">
          <router-link
            to="/interventi"
            class="nav-link sidebar-link"
            active-class="active-link"
            exact-active-class="active-link"
            @click="setPageTitle('Interventi')"
          >
            <div class="d-flex align-items-center">
              <i class="bi bi-clipboard-check icon-azure me-3 flex-shrink-0"></i>
              <span class="sidebar-text">Interventi</span>
            </div>
          </router-link>
        </li>
      </ul>

      <!-- Visualizzazioni: SOLO se siamo in una pagina "generica" -->
      <template v-if="showVisualizzazioni">
        <ul class="nav flex-column mt-4">
          <li class="nav-item mb-2 px-3">
            <h6 class="text-uppercase small fw-semibold mb-0">visualizzazioni</h6>
          </li>
        </ul>

        <ul class="nav flex-column mt-0 sidebar-menu">
          <!-- DASHBOARD -->
          <template v-if="route.path === '/dashboard' && can('dashboard:view')">
            <li class="nav-item">
              <a
                href="#pannello-riepilogativo"
                class="nav-link sidebar-link"
                :class="{ 'active-link': activeLink === 'pannello-riepilogativo' }"
                @click.prevent="goToGraph('pannello-riepilogativo')"
              >
                <div class="d-flex align-items-center">
                  <i class="bi bi-clipboard-data icon-azure me-3 flex-shrink-0"></i>
                  <span class="sidebar-text">Pannello</span>
                </div>
              </a>
            </li>

            <li class="nav-item">
              <a
                href="#grafico-linee"
                class="nav-link sidebar-link"
                :class="{ 'active-link': activeLink === 'grafico-linee' }"
                @click.prevent="goToGraph('grafico-linee')"
              >
                <div class="d-flex align-items-center">
                  <i class="bi bi-graph-up icon-azure me-3 flex-shrink-0"></i>
                  <span class="sidebar-text">Grafico linee</span>
                </div>
              </a>
            </li>

            <li class="nav-item">
              <a
                href="#grafico-torta"
                class="nav-link sidebar-link"
                :class="{ 'active-link': activeLink === 'grafico-torta' }"
                @click.prevent="goToGraph('grafico-torta')"
              >
                <div class="d-flex align-items-center">
                  <i class="bi bi-pie-chart icon-azure me-3 flex-shrink-0"></i>
                  <span class="sidebar-text">Grafico torta</span>
                </div>
              </a>
            </li>
          </template>

          <!-- UTENTI -->
          <template v-if="route.path === '/gestione-utenti'">
            <li v-if="canAny(['users:active:view','users:update_status','users:update_role','users:approve'])" class="nav-item">
              <a
                href="#gestione-stato-ruolo"
                class="nav-link sidebar-link"
                :class="{ 'active-link': activeLink === 'gestione-stato-ruolo' }"
                @click.prevent="goToGraph('gestione-stato-ruolo')"
              >
                <div class="d-flex align-items-center">
                  <i class="bi bi-person-check icon-azure me-3 flex-shrink-0"></i>
                  <span class="sidebar-text">Stato e ruolo</span>
                </div>
              </a>
            </li>

            <li v-if="canAny(['requests:manage','users:buildings:update','users:buildings:view'])" class="nav-item">
              <a
                href="#assegnazione-edifici"
                class="nav-link sidebar-link"
                :class="{ 'active-link': activeLink === 'assegnazione-edifici' }"
                @click.prevent="goToGraph('assegnazione-edifici')"
              >
                <div class="d-flex align-items-center">
                  <i class="bi bi-diagram-3 icon-azure me-3 flex-shrink-0"></i>
                  <span class="sidebar-text">Assegnazione edifici</span>
                </div>
              </a>
            </li>

            <li v-if="can('users:info:view')" class="nav-item">
              <a
                href="#info-utenti"
                class="nav-link sidebar-link"
                :class="{ 'active-link': activeLink === 'info-utenti' }"
                @click.prevent="goToGraph('info-utenti')"
              >
                <div class="d-flex align-items-center">
                  <i class="bi bi-search icon-azure me-3 flex-shrink-0"></i>
                  <span class="sidebar-text">Info utenti</span>
                </div>
              </a>
            </li>

            <li v-if="can('roles:manage')" class="nav-item">
              <a
                href="#crea-ruolo"
                class="nav-link sidebar-link"
                :class="{ 'active-link': activeLink === 'crea-ruolo' }"
                @click.prevent="goToGraph('crea-ruolo')"
              >
                <div class="d-flex align-items-center">
                  <i class="bi bi-shield-lock icon-azure me-3 flex-shrink-0"></i>
                  <span class="sidebar-text">Ruoli</span>
                </div>
              </a>
            </li>
          </template>

          <!-- EDIFICI -->
          <template v-if="route.path === '/gestione-edifici'">
            <li class="nav-item">
              <a
                href="#visualizza-edifici"
                class="nav-link sidebar-link"
                :class="{ 'active-link': activeLink === 'visualizza-edifici' }"
                @click.prevent="goToGraph('visualizza-edifici')"
              >
                <div class="d-flex align-items-center">
                  <i class="bi bi-table icon-azure me-3 flex-shrink-0"></i>
                  <span class="sidebar-text">Lista edifici</span>
                </div>
              </a>
            </li>

            <li v-if="canAny(['buildings:create','buildings:manage'])" class="nav-item">
              <a
                href="#crea-edificio"
                class="nav-link sidebar-link"
                :class="{ 'active-link': activeLink === 'crea-edificio' }"
                @click.prevent="goToGraph('crea-edificio')"
              >
                <div class="d-flex align-items-center">
                  <i class="bi bi-plus-circle icon-azure me-3 flex-shrink-0"></i>
                  <span class="sidebar-text">Crea edificio</span>
                </div>
              </a>
            </li>
          </template>

          <!-- OGGETTI & REGOLE -->
          <template v-if="route.path === '/oggetti-regole'">
            <li v-if="canAny(['assets:create','assets:manage'])" class="nav-item">
              <a
                href="#crea-oggetto"
                class="nav-link sidebar-link"
                :class="{ 'active-link': activeLink === 'crea-oggetto' }"
                @click.prevent="goToGraph('crea-oggetto')"
              >
                <div class="d-flex align-items-center">
                  <i class="bi bi-plus-square icon-azure me-3 flex-shrink-0"></i>
                  <span class="sidebar-text">Crea oggetto</span>
                </div>
              </a>
            </li>

            <li v-if="canAny(['rules:create','rules:manage'])" class="nav-item">
              <a
                href="#crea-regola"
                class="nav-link sidebar-link"
                :class="{ 'active-link': activeLink === 'crea-regola' }"
                @click.prevent="goToGraph('crea-regola')"
              >
                <div class="d-flex align-items-center">
                  <i class="bi bi-plus-square-dotted icon-azure me-3 flex-shrink-0"></i>
                  <span class="sidebar-text">Crea regola</span>
                </div>
              </a>
            </li>

            <li v-if="canAny(['assets:view','assets:manage'])" class="nav-item">
              <a
                href="#visualizza-oggetti"
                class="nav-link sidebar-link"
                :class="{ 'active-link': activeLink === 'visualizza-oggetti' }"
                @click.prevent="goToGraph('visualizza-oggetti')"
              >
                <div class="d-flex align-items-center">
                  <i class="bi bi-box icon-azure me-3 flex-shrink-0"></i>
                  <span class="sidebar-text">Oggetti</span>
                </div>
              </a>
            </li>

            <li v-if="canAny(['rules:view','rules:manage'])" class="nav-item">
              <a
                href="#visualizza-regole"
                class="nav-link sidebar-link"
                :class="{ 'active-link': activeLink === 'visualizza-regole' }"
                @click.prevent="goToGraph('visualizza-regole')"
              >
                <div class="d-flex align-items-center">
                  <i class="bi bi-list-check icon-azure me-3 flex-shrink-0"></i>
                  <span class="sidebar-text">Regole</span>
                </div>
              </a>
            </li>
          </template>

          <!-- INTERVENTI -->
          <template v-if="route.path === '/interventi'">
            <li v-if="canAny(['interventions:create','interventions:manage'])" class="nav-item">
              <a
                href="#crea-intervento"
                class="nav-link sidebar-link"
                :class="{ 'active-link': activeLink === 'crea-intervento' }"
                @click.prevent="goToGraph('crea-intervento')"
              >
                <div class="d-flex align-items-center">
                  <i class="bi bi-plus-circle icon-azure me-3 flex-shrink-0"></i>
                  <span class="sidebar-text">Crea intervento</span>
                </div>
              </a>
            </li>

            <li v-if="canAny(['interventions:bulk_upload','interventions:manage'])" class="nav-item">
              <a
                href="#carica-interventi"
                class="nav-link sidebar-link"
                :class="{ 'active-link': activeLink === 'carica-interventi' }"
                @click.prevent="goToGraph('carica-interventi')"
              >
                <div class="d-flex align-items-center">
                  <i class="bi bi-upload icon-azure me-3 flex-shrink-0"></i>
                  <span class="sidebar-text">Carica (bulk)</span>
                </div>
              </a>
            </li>

            <li v-if="canAny(['interventions:view','interventions:manage'])" class="nav-item">
              <a
                href="#tabella-interventi"
                class="nav-link sidebar-link"
                :class="{ 'active-link': activeLink === 'tabella-interventi' }"
                @click.prevent="goToGraph('tabella-interventi')"
              >
                <div class="d-flex align-items-center">
                  <i class="bi bi-table icon-azure me-3 flex-shrink-0"></i>
                  <span class="sidebar-text">Tabella</span>
                </div>
              </a>
            </li>
          </template>
        </ul>
      </template>

      <!-- Account -->
      <ul class="nav flex-column mt-4">
        <li class="nav-item mb-2 px-3">
          <h6 class="text-uppercase small fw-semibold mb-0">Account</h6>
        </li>
      </ul>

      <ul class="nav flex-column mt-0 sidebar-menu">
        <li class="nav-item">
          <a href="#" class="nav-link sidebar-link" @click.prevent="$emit('open-settings')">
            <div class="d-flex align-items-center">
              <i class="bi bi-gear icon-azure me-3 flex-shrink-0"></i>
              <span class="sidebar-text">Impostazioni</span>
            </div>
          </a>
        </li>

        <li v-if="can('notifications:view')" class="nav-item">
          <router-link
            to="/notifiche"
            class="nav-link sidebar-link"
            active-class="active-link"
            exact-active-class="active-link"
            @click="setPageTitle('Notifiche')"
          >
            <div class="d-flex align-items-center">
              <i class="bi bi-bell icon-azure me-3 flex-shrink-0"></i>
              <span class="sidebar-text">Notifiche</span>
            </div>
          </router-link>
        </li>
      </ul>
    </div>

    <!-- Logout -->
    <div class="p-3">
      <button class="btn w-100 sidebar-logout-btn d-flex align-items-center justify-content-center" @click="logout">
        <i class="bi bi-box-arrow-right icon-azure me-2"></i>
        <span>Logout</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";
import { usePermissions } from "@/composables/usePermissions";

defineEmits(["open-settings"]);

const route = useRoute();
const authStore = useAuthStore();
const { hasPermission, hasAny } = usePermissions();

const activeLink = ref(null);
const scrollEl = ref(null);

const showVisualizzazioni = computed(() => {
  return ["/dashboard", "/gestione-utenti", "/gestione-edifici", "/oggetti-regole", "/interventi"].includes(route.path);
});

function can(p) {
  return hasPermission(p);
}
function canAny(list) {
  return hasAny(list);
}

function setPageTitle(_title) {
  // hook se vuoi aggiornare un titolo centralizzato
}

function goToGraph(id) {
  activeLink.value = id;
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function logout() {
  authStore.logout();
}

function onScroll() {
  if (!showVisualizzazioni.value) return;

  const ids = [
    "pannello-riepilogativo",
    "grafico-linee",
    "grafico-torta",
    "gestione-stato-ruolo",
    "assegnazione-edifici",
    "info-utenti",
    "crea-ruolo",
    "visualizza-edifici",
    "crea-edificio",
    "crea-oggetto",
    "crea-regola",
    "visualizza-oggetti",
    "visualizza-regole",
    "crea-intervento",
    "carica-interventi",
    "tabella-interventi",
  ];

  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) continue;

    const rect = el.getBoundingClientRect();
    if (rect.top < 160 && rect.bottom > 160) {
      activeLink.value = id;
      break;
    }
  }
}

onMounted(() => {
  scrollEl.value = document.getElementById("main-scroll");
  if (scrollEl.value) {
    scrollEl.value.addEventListener("scroll", onScroll, { passive: true });
  } else {
    window.addEventListener("scroll", onScroll, { passive: true });
  }
  onScroll();
});

onBeforeUnmount(() => {
  if (scrollEl.value) scrollEl.value.removeEventListener("scroll", onScroll);
  window.removeEventListener("scroll", onScroll);
});

watch(
  () => route.path,
  () => {
    // aggiorna subito highlight quando cambi sezione
    setTimeout(onScroll, 0);
  }
);
</script>

<style scoped>
.sidebar-container {
  width: 260px;
  background-color: #1f263e;
}

.sidebar-link {
  background-color: #1f263e;
  color: white;
  text-decoration: none;
  border-radius: 0;
  padding: 0.75rem 1rem;
  transition: all 0.2s ease;
  display: block;
  width: 100%;
  margin: 0;
}

.sidebar-text {
  flex-grow: 1;
  white-space: normal;
  overflow-wrap: break-word;
  min-width: 0;
}

.icon-azure {
  color: #58a6ff !important;
  flex-shrink: 0;
}

.sidebar-link:hover {
  background-color: #27314e;
}

.sidebar-link.active-link {
  background-color: #3a4668;
  font-weight: bold;
  border-left: 4px solid #58a6ff;
  color: white;
}

.sidebar-logout-btn {
  background-color: rgba(255, 255, 255, 0.06);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.sidebar-logout-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>
