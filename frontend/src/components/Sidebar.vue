<template>
  <div class="d-flex flex-column vh-100 text-white overflow-auto flex-shrink-0 sidebar-container">

    <!-- Contenitore principale con flex-grow per spingere il pulsante in basso -->
    <div class="flex-grow-1 d-flex flex-column">

      <!-- Barra vuota all'altezza della navbar -->
      <nav class="navbar p-0 mb-3 py-4 d-flex justify-content-center align-items-center sidebar-header">
        <h4 class="text-white navbar-brand mb-0 h5">PreFix</h4>
      </nav>

      <!-- Titolo Quick Access -->
      <ul class="nav flex-column mt-4">
        <li class="nav-item mb-2 px-3">
          <h6 class="text-uppercase small fw-semibold mb-0">Quick Access</h6>
        </li>
      </ul>

      <!-- Lista link route principali -->
      <ul class="nav flex-column mt-0 sidebar-menu">
        <li class="nav-item">
          <router-link to="/dashboard" class="nav-link sidebar-link" active-class="active-link"
            exact-active-class="active-link" @click="setPageTitle('Dashboard')">
            <div class="d-flex align-items-center">
              <i class="bi bi-bar-chart icon-azure me-3 flex-shrink-0"></i>
              <span class="sidebar-text">Dashboard</span>
            </div>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/calendar" class="nav-link sidebar-link" active-class="active-link" exact-active-class="active-link"
            @click="setPageTitle('Calendario Interventi')">
            <div class="d-flex align-items-center">
              <i class="bi bi-calendar-event icon-azure me-3 flex-shrink-0"></i>
              <span class="sidebar-text">Calendario Interventi</span>
            </div>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/Buildings-List" class="nav-link sidebar-link" active-class="active-link"
            exact-active-class="active-link" @click="setPageTitle('Edifici affidati')">
            <div class="d-flex align-items-center">
              <i class="bi bi-building icon-azure me-3 flex-shrink-0"></i>
              <span class="sidebar-text">Seleziona Edifici</span>
            </div>
          </router-link>
        </li>
      </ul>

      <!-- Titolo Sede -->
      <ul class="nav flex-column mt-4">
        <li class="nav-item mb-2 px-3">
          <h6 class="text-uppercase small fw-semibold mb-0">visualizzazioni</h6>
        </li>
      </ul>

      <!-- Lista link grafici con scroll -->
      <ul class="nav flex-column mt-0 sidebar-menu">
        <li class="nav-item">
          <a href="#pannello-riepilogativo" class="nav-link sidebar-link"
            :class="{ 'active-link': activeLink === 'pannello-riepilogativo' }"
            @click.prevent="goToGraph('pannello-riepilogativo')">
            <div class="d-flex align-items-center">
              <i class="bi bi-clipboard-data icon-azure me-3 flex-shrink-0"></i>
              <span class="sidebar-text">Pannello Riepilogativo</span>
            </div>
          </a>
        </li>
        <li class="nav-item">
          <a href="#grafico-linee" class="nav-link sidebar-link" :class="{ 'active-link': activeLink === 'grafico-linee' }"
            @click.prevent="goToGraph('grafico-linee')">
            <div class="d-flex align-items-center">
              <i class="bi bi-graph-up icon-azure me-3 flex-shrink-0"></i>
              <span class="sidebar-text">Grafico a linee</span>
            </div>
          </a>
        </li>
        <li class="nav-item">
          <a href="#grafico-torta" class="nav-link sidebar-link" :class="{ 'active-link': activeLink === 'grafico-torta' }"
            @click.prevent="goToGraph('grafico-torta')">
            <div class="d-flex align-items-center">
              <i class="bi bi-pie-chart icon-azure me-3 flex-shrink-0"></i>
              <span class="sidebar-text">Grafico a torta</span>
            </div>
          </a>
        </li>
        <li class="nav-item">
          <router-link to="/visualizzazione-tabellare" class="nav-link sidebar-link" active-class="active-link"
            exact-active-class="active-link" @click="setPageTitle('Visualizzazione Tabellare')">
            <div class="d-flex align-items-center">
              <i class="bi bi-table icon-azure me-3 flex-shrink-0"></i>
              <span class="sidebar-text">Visualizzazione Tabellare</span>
            </div>
          </router-link>
        </li>
      </ul>

      <!-- Titolo Account -->
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
        <li class="nav-item">
          <router-link to="/notifiche" class="nav-link sidebar-link" active-class="active-link"
            exact-active-class="active-link" @click="setPageTitle('Notifiche')">
            <div class="d-flex align-items-center">
              <i class="bi bi-bell icon-azure me-3 flex-shrink-0"></i>
              <span class="sidebar-text">Notifiche</span>
            </div>
          </router-link>
        </li>
      </ul>
    </div>

    <!-- Pulsante Logout sempre in basso -->
    <div class="p-3">
      <button class="btn w-100 sidebar-logout-btn d-flex align-items-center justify-content-center" @click="logout">
        <i class="bi bi-box-arrow-right icon-azure me-2"></i>
        <span>Logout</span>
      </button>
    </div>

  </div>
</template>

<style scoped>
.sidebar-container {
  width: 260px;
  background-color: #1F263E;
}

/* Link della sidebar - SPAZIATURA PIENA */
.sidebar-link {
  background-color: #1F263E;
  color: white;
  text-decoration: none;
  border-radius: 0;
  padding: 0.75rem 1rem;
  transition: all 0.2s ease;
  display: block;
  width: 100%;
  /* Rimuove tutti i margini */
  margin: 0;
  border-left: none;
  border-right: none;
}

/* Testo che si adatta */
.sidebar-text {
  flex-grow: 1;
  white-space: normal;
  word-wrap: break-word;
  overflow-wrap: break-word;
  min-width: 0;
}

/* Icone azzurre */
.icon-azure {
  color: #58a6ff !important;
  flex-shrink: 0;
}

/* Hover */
.sidebar-link:hover {
  background-color: #27314E;
}

/* LINK ATTIVO - RIEMPIE TUTTA LA LARGHEZZA */
.sidebar-link.active-link {
  background-color: #3A4668;
  font-weight: bold;
  /* Bordo SOLO a sinistra */
  border-left: 4px solid #58a6ff;
  border-right: none;
  color: white;
  /* Estende fino al bordo destro */
  margin-right: 0;
  padding-right: 1rem;
  /* Rimuove eventuali spazi extra */
  position: relative;
  left: 0;
  right: 0;
}

/* Colore icone nei link attivi */
.sidebar-link.active-link .icon-azure {
  color: white !important;
}

/* Contenitore per estendere fino al bordo */
.sidebar-menu {
  /* Rimuove padding e margin del contenitore */
  padding: 0;
  margin: 0;
  width: 100%;
}

/* Rimuove spaziature dagli item */
.sidebar-menu .nav-item {
  margin: 0;
  width: 100%;
}

/* Header */
.sidebar-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

/* Stile pulsante logout */
.sidebar-logout-btn {
  background-color: #27314E;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.6rem 0;
  transition: all 0.2s ease;
}

.sidebar-logout-btn:hover {
  background-color: #3A4668;
}

/* Assicura che tutto sia allineato correttamente */
.d-flex.align-items-center {
  min-height: 24px;
}
</style>


<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const props = defineProps({
  scrollContainer: Object
})

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const emit = defineEmits(['update-page-title', 'open-settings'])

// LOGOUT
async function logout() {
  try {
    await authStore.logout()
  } catch (err) {
    console.error("Errore logout:", err)
  }
}

// Link attivo dei grafici
const activeLink = ref('')

// Mappa dei titoli per le route
const routeTitles = {
  '/dashboard': 'Dashboard',
  '/calendar': 'Calendario Interventi',
  '/Buildings-List': 'Edifici affidati',
  '/visualizzazione-tabellare': 'Visualizzazione Tabellare'
}

// Funzione per aggiornare il titolo
function setPageTitle(title) {
  emit('update-page-title', title)
}

// Scroll al grafico selezionato con offset navbar
function scrollTo(id) {
  const el = document.getElementById(id)
  if (el && props.scrollContainer) {
    const navbar = document.querySelector('nav.navbar')
    const navbarHeight = navbar ? navbar.offsetHeight : 0
    props.scrollContainer.scrollTo({
      top: el.offsetTop - navbarHeight,
      behavior: 'smooth'
    })
    activeLink.value = id
  }
}

// Funzione principale per gestire click su grafici
function goToGraph(id) {
  if (route.path === '/dashboard') {
    scrollTo(id)
  } else {
    router.push({ path: '/dashboard', query: { focus: id } })
  }
}

// Evidenziazione fluida durante lo scroll
function onScroll() {
  if (!props.scrollContainer) return

  const scrollTop = props.scrollContainer.scrollTop
  const containerHeight = props.scrollContainer.clientHeight

  const sections = ['pannello-riepilogativo', 'grafico-linee', 'grafico-torta']
  let current = ''

  for (const id of sections) {
    const el = document.getElementById(id)
    if (!el) continue

    const elTop = el.offsetTop
    const elBottom = el.offsetTop + el.offsetHeight

    if (scrollTop + containerHeight / 2 >= elTop && scrollTop + containerHeight / 2 < elBottom) {
      current = id
      break
    }
  }

  activeLink.value = current
}

// Scroll automatico al grafico passato via query
function scrollToGraphFromQuery() {
  const graphId = route.query.focus
  if (graphId && props.scrollContainer) {
    const el = document.getElementById(graphId)
    if (el) {
      const navbar = document.querySelector('nav.navbar')
      const navbarHeight = navbar ? navbar.offsetHeight : 0
      props.scrollContainer.scrollTo({
        top: el.offsetTop - navbarHeight,
        behavior: 'smooth'
      })
      activeLink.value = graphId
      
      router.replace({ query: {} }) // rimuovo query per evitare scroll futuri indesiderati
    }
  }
}

// Aggiorna il titolo quando cambia la route
watch(() => route.path, (newPath) => {
  if (routeTitles[newPath]) {
    setPageTitle(routeTitles[newPath])
  }
  
  // Resetta activeLink se non siamo su dashboard
  if (newPath !== '/dashboard') {
    activeLink.value = ''
  } else {
    scrollToGraphFromQuery()
  }
}, { immediate: true })

// Watch per aggiornare event listener quando scrollContainer cambia
watch(() => props.scrollContainer, (newContainer, oldContainer) => {
  if (oldContainer) {
    oldContainer.removeEventListener('scroll', onScroll)
  }
  if (newContainer) {
    newContainer.addEventListener('scroll', onScroll)
    scrollToGraphFromQuery()
    onScroll() // evidenzia subito la sezione visibile
  }
}, { immediate: true })

// Cleanup al destroy
onUnmounted(() => {
  if (props.scrollContainer) {
    props.scrollContainer.removeEventListener('scroll', onScroll)
  }
})
</script>