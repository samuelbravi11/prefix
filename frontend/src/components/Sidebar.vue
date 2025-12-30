<template>
  <div class="d-flex flex-column vh-100 text-white overflow-auto flex-shrink-0"
    style="width: 240px; background-color: #1F263E;">

    <!-- Contenitore principale con flex-grow per spingere il pulsante in basso -->
    <div class="flex-grow-1 d-flex flex-column ">

      <!-- Barra vuota all'altezza della navbar -->
      <nav class="navbar p-0 mb-3 py-4 d-flex justify-content-center align-items-center"
        style="border-bottom: 0.5px solid white;">
        <h4 class="text-white navbar-brand mb-0 h5">PreFix</h4>
      </nav>

      <!-- Titolo Quick Access -->
      <ul class="nav flex-column mt-4 ps-4">
        <li class="nav-item mb-2">
          <h4>Quick Access</h4>
        </li>
      </ul>

      <!-- Lista link route principali -->
      <ul class="nav flex-column mt-0 sidebar-menu">
        <li class="nav-item">
          <router-link to="/dashboard" class="nav-link ps-5" active-class="active-link"
            exact-active-class="active-link">
            Dashboard
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/calendar" class="nav-link ps-5" active-class="active-link" exact-active-class="active-link">
            Calendario Interventi
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/Buildings-List" class="nav-link ps-5" active-class="active-link"
            exact-active-class="active-link">
            Edifici affidati
          </router-link>
        </li>
      </ul>

      <!-- Titolo Sede -->
      <ul class="nav flex-column mt-4 ps-4">
        <li class="nav-item mb-2">
          <h4>Povo 1</h4>
        </li>
      </ul>

      <!-- Lista link grafici con scroll -->
      <ul class="nav flex-column mt-0 sidebar-menu">
        <li class="nav-item">
          <a href="#pannello-riepilogativo" class="nav-link ps-5"
            :class="{ 'active-link': activeLink === 'pannello-riepilogativo' }"
            @click.prevent="goToGraph('pannello-riepilogativo')">
            Pannello Riepilogativo
          </a>
        </li>
        <li class="nav-item">
          <a href="#grafico-linee" class="nav-link ps-5" :class="{ 'active-link': activeLink === 'grafico-linee' }"
            @click.prevent="goToGraph('grafico-linee')">
            Grafico a linee
          </a>
        </li>
        <li class="nav-item">
          <a href="#grafico-torta" class="nav-link ps-5" :class="{ 'active-link': activeLink === 'grafico-torta' }"
            @click.prevent="goToGraph('grafico-torta')">
            Grafico a torta
          </a>
        </li>
        <li class="nav-item">
          <router-link to="/visualizzazione-tabellare" class="nav-link ps-5" active-class="active-link"
            exact-active-class="active-link">
            Visualizzazione Tabellare
          </router-link>
        </li>
      </ul>

      <!-- Titolo Sede -->
      <ul class="nav flex-column mt-4 ps-4">
        <li class="nav-item mb-2">
          <h4>Account</h4>
        </li>
      </ul>
      <ul class="nav flex-column mt-0 sidebar-menu">
        <li class="nav-item">
          <a href="#" class="nav-link ps-5" @click.prevent="$emit('open-settings')">
            Impostazioni
          </a>
        </li>
      </ul>
    </div>

    <!-- Pulsante Logout sempre in basso -->
    <div class="p-3">
      <button class="btn w-100 sidebar-logout-btn" @click="logout">
        Logout
      </button>
    </div>

  </div>
</template>

<style scoped>
/* Link della sidebar */
.sidebar-menu .nav-link {
  background-color: #1F263E;
  color: white;
  text-decoration: none;
  border-radius: 0;
  padding-left: 10px;
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
  transition: background-color 0.2s ease;
}

/* Hover */
.sidebar-menu .nav-link:hover {
  background-color: #27314E;
}

/* Link attivo */
.nav-link.active-link {
  background-color: #3A4668;
  font-weight: bold;
  border-left: 4px solid #58a6ff;
  padding-left: 6px;
  color: white;
  /* forza testo bianco */
}

/* Stile pulsante logout */
.sidebar-logout-btn {
  background-color: #27314E;
  color: white;
  border: none;
  border-radius: 0;
  padding: 0.5rem 0;
  transition: background-color 0.2s ease;
}

.sidebar-logout-btn:hover {
  background-color: #3A4668;
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

// Watch sulla route per resettare activeLink se non siamo su dashboard
watch(() => route.path, (newPath) => {
  if (newPath !== '/dashboard') {
    activeLink.value = ''
  } else {
    scrollToGraphFromQuery()
  }
})

// Cleanup al destroy
onUnmounted(() => {
  if (props.scrollContainer) {
    props.scrollContainer.removeEventListener('scroll', onScroll)
  }
})
</script>
