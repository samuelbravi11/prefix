<template>
  <div class="container-fluid py-4">
    <div class="card shadow-sm border-0">
      

      <div class="card-body p-4">
        <!-- Filtri -->
        <div class="row mb-4">
          <div class="col-md-6">
            <div class="d-flex align-items-center">
              <span class="fw-medium text-dark me-3">Filtra:</span>
              <div class="btn-group btn-group-sm">
                <button v-for="f in filters" :key="f.value" @click="activeFilter = f.value"
                  :class="['btn', activeFilter === f.value ? 'btn-primary' : 'btn-outline-secondary']">
                  <i :class="f.icon + ' me-1'"></i>{{ f.label }}
                </button>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="d-flex justify-content-end gap-3">
              <div class="input-group input-group-sm w-auto">
                <span class="input-group-text bg-transparent"><i class="bi bi-search"></i></span>
                <input type="text" class="form-control" placeholder="Cerca..." v-model="searchQuery">
              </div>
              <select v-model="selectedType" class="form-select form-select-sm w-auto">
                <option value="">Tutte le tipologie</option>
                <option v-for="t in notificationTypeOptions" :key="t.value" :value="t.value">{{ t.label }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Contenuto -->
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary"></div>
          <p class="text-muted mt-2">Caricamento notifiche...</p>
        </div>

        <div v-else-if="filteredNotifications.length === 0" class="text-center py-5">
          <i class="bi bi-bell-slash text-muted fs-1 mb-3"></i>
          <p class="text-muted mb-1">Nessuna notifica trovata</p>
          <small class="text-muted">{{ searchQuery || selectedType ? 'Prova con altri filtri' : 'Tutto sotto controllo!' }}</small>
        </div>

        <div v-else class="table-responsive">
          <table class="table table-hover align-middle">
            <thead class="table-light">
              <tr>
                <th @click="sortBy('read')" style="width: 100px;">Stato <i class="bi bi-arrow-down-up ms-1 small"></i></th>
                <th @click="sortBy('type')" style="width: 120px;">Tipo <i class="bi bi-arrow-down-up ms-1 small"></i></th>
                <th @click="sortBy('priority')" style="width: 100px;">Priorità <i class="bi bi-arrow-down-up ms-1 small"></i></th>
                <th @click="sortBy('title')">Notifica <i class="bi bi-arrow-down-up ms-1 small"></i></th>
                <th @click="sortBy('createdAt')" style="width: 150px;">Data <i class="bi bi-arrow-down-up ms-1 small"></i></th>
                <th style="width: 120px;">Azioni</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="n in filteredNotifications" :key="n._id" :class="n.read ? '' : 'table-primary'">
                <td>
                  <span :class="['badge', n.read ? 'bg-success bg-opacity-10 text-success' : 'bg-primary bg-opacity-10 text-primary']">
                    <i :class="n.read ? 'bi bi-envelope-open me-1' : 'bi bi-envelope me-1'"></i>{{ n.read ? 'Letta' : 'Nuova' }}
                  </span>
                </td>
                <td>
                  <div class="d-flex align-items-center">
                    <div :class="['p-2 rounded me-2', getTypeClass(n.type).bgClass]">
                      <i :class="[getTypeClass(n.type).icon, getTypeClass(n.type).textClass]"></i>
                    </div>
                    <small>{{ getTypeLabel(n.type) }}</small>
                  </div>
                </td>
                <td><span :class="['badge', getPriorityClass(n.priority)]">{{ n.priority }}</span></td>
                <td>
                  <div :class="n.read ? 'text-dark' : 'fw-bold text-dark'">{{ n.title }}</div>
                  <small class="text-muted">{{ n.message }}</small>
                </td>
                <td><small class="text-muted">{{ formatDate(n.createdAt) }}</small></td>
                <td>
                  <div class="d-flex gap-1">
                    <button v-if="!n.read" @click="markAsRead(n._id)" class="btn btn-sm btn-outline-success"
                      :disabled="markingAsReadId === n._id" title="Segna come letta">
                      <i v-if="markingAsReadId !== n._id" class="bi bi-check"></i>
                      <span v-else class="spinner-border spinner-border-sm"></span>
                    </button>
                    <button @click="viewDetails(n)" class="btn btn-sm btn-outline-info" title="Dettagli">
                      <i class="bi bi-eye"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div class="border-top pt-3 mt-4">
          <div class="d-flex justify-content-between align-items-center">
            <small class="text-muted">
              <i class="bi bi-info-circle me-1"></i>
              Mostrate {{ filteredNotifications.length }} di {{ notifications.length }} notifiche
            </small>
            <div class="d-flex gap-2">
              <button @click="markAllAsRead" class="btn btn-sm btn-outline-primary" :disabled="unreadCount === 0 || loading">
                <i class="bi bi-check-all me-1"></i> Segna tutte come lette
              </button>
              <button @click="refreshNotifications" class="btn btn-sm btn-outline-secondary" :disabled="loading">
                <i class="bi bi-arrow-clockwise me-1"></i> Aggiorna
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5)" @click.self="showModal = false">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">Dettagli Notifica</h5>
            <button type="button" class="btn-close" @click="showModal = false"></button>
          </div>
          <div class="modal-body">
            <div v-if="selectedNotification" class="row g-3">
              <div class="col-12"><label class="text-muted small">Titolo</label><p class="fw-semibold mb-0">{{ selectedNotification.title }}</p></div>
              <div class="col-12"><label class="text-muted small">Messaggio</label><p class="mb-0">{{ selectedNotification.message }}</p></div>
              <div class="col-md-6">
                <label class="text-muted small">Tipo</label>
                <div class="d-flex align-items-center">
                  <div :class="['p-2 rounded me-2', getTypeClass(selectedNotification.type).bgClass]">
                    <i :class="[getTypeClass(selectedNotification.type).icon, getTypeClass(selectedNotification.type).textClass]"></i>
                  </div>
                  <span>{{ getTypeLabel(selectedNotification.type) }}</span>
                </div>
              </div>
              <div class="col-md-6">
                <label class="text-muted small">Priorità</label>
                <span :class="['badge', getPriorityClass(selectedNotification.priority)]">{{ selectedNotification.priority }}</span>
              </div>
              <div class="col-md-6">
                <label class="text-muted small">Stato</label>
                <span :class="['badge', selectedNotification.read ? 'bg-success bg-opacity-10 text-success' : 'bg-primary bg-opacity-10 text-primary']">
                  {{ selectedNotification.read ? 'Letta' : 'Non letta' }}
                </span>
              </div>
              <div class="col-md-6"><label class="text-muted small">Data</label><p class="mb-0">{{ formatDateTime(selectedNotification.createdAt) }}</p></div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showModal = false">Chiudi</button>
            <button v-if="selectedNotification && !selectedNotification.read" type="button" class="btn btn-primary"
              @click="markAsRead(selectedNotification._id); showModal = false" :disabled="markingAsReadId === selectedNotification._id">
              <span v-if="markingAsReadId === selectedNotification._id" class="spinner-border spinner-border-sm me-1"></span>
              Segna come letta
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

// Stato
const notifications = ref([])
const loading = ref(false)
const activeFilter = ref('all')
const searchQuery = ref('')
const selectedType = ref('')
const sortField = ref('createdAt')
const sortOrder = ref(-1)
const showModal = ref(false)
const selectedNotification = ref(null)
const markingAsReadId = ref(null)

// Config
const filters = [
  { value: 'all', label: 'Tutte', icon: 'bi-list' },
  { value: 'unread', label: 'Non lette', icon: 'bi-envelope' },
  { value: 'read', label: 'Lette', icon: 'bi-envelope-open' }
]

const types = {
  'CREAZIONE_INTERVENTO': { label: 'Creazione Intervento', icon: 'bi-tools', bgClass: 'bg-primary bg-opacity-10', textClass: 'text-primary' },
  'MANUTENZIONE_PROGRAMMATA': { label: 'Manutenzione', icon: 'bi-calendar-check', bgClass: 'bg-info bg-opacity-10', textClass: 'text-info' },
  'SCADENZA': { label: 'Scadenza', icon: 'bi-clock-history', bgClass: 'bg-warning bg-opacity-10', textClass: 'text-warning' },
  'ALLARME': { label: 'Allarme', icon: 'bi-exclamation-triangle', bgClass: 'bg-danger bg-opacity-10', textClass: 'text-danger' },
  'SISTEMA': { label: 'Sistema', icon: 'bi-gear', bgClass: 'bg-secondary bg-opacity-10', textClass: 'text-secondary' }
}

const notificationTypeOptions = Object.entries(types).map(([value, config]) => ({ label: config.label, value }))

// Computed
const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

const filteredNotifications = computed(() => {
  let filtered = [...notifications.value]
  
  if (activeFilter.value === 'unread') filtered = filtered.filter(n => !n.read)
  if (activeFilter.value === 'read') filtered = filtered.filter(n => n.read)
  if (selectedType.value) filtered = filtered.filter(n => n.type === selectedType.value)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    filtered = filtered.filter(n => n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q))
  }

  filtered.sort((a, b) => {
    const aVal = a[sortField.value], bVal = b[sortField.value]
    if (sortField.value === 'createdAt') return sortOrder.value === 1 ? new Date(aVal) - new Date(bVal) : new Date(bVal) - new Date(aVal)
    return sortOrder.value === 1 ? (aVal < bVal ? -1 : 1) : (aVal > bVal ? -1 : 1)
  })

  return filtered
})

// Funzioni
const getTypeClass = (type) => types[type] || types.SISTEMA
const getTypeLabel = (type) => types[type]?.label || type

const getPriorityClass = (priority) => ({
  'high': 'bg-danger bg-opacity-10 text-danger',
  'medium': 'bg-warning bg-opacity-10 text-warning', 
  'low': 'bg-info bg-opacity-10 text-info'
}[priority] || 'bg-secondary bg-opacity-10 text-secondary')

const formatDate = (dateString) => {
  const date = new Date(dateString), now = new Date()
  const diffMins = Math.floor((now - date) / 60000)
  if (diffMins < 60) return `${diffMins} min fa`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} ore fa`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays} giorni fa`
  return date.toLocaleDateString('it-IT')
}

const formatDateTime = (dateString) => new Date(dateString).toLocaleString('it-IT', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
})

const sortBy = (field) => {
  if (sortField.value === field) sortOrder.value = sortOrder.value === 1 ? -1 : 1
  else { sortField.value = field; sortOrder.value = -1 }
}

// API
const fetchNotifications = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('accessToken')
    const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/v1/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    notifications.value = response.data
  } catch (error) {
    console.error('Errore caricamento notifiche:', error)
    alert('Impossibile caricare le notifiche')
  } finally {
    loading.value = false
  }
}

const markAsRead = async (id) => {
  markingAsReadId.value = id
  try {
    const token = localStorage.getItem('accessToken')
    await axios.patch(`http://localhost:5000/api/v1/notifications/${id}/read`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const index = notifications.value.findIndex(n => n._id === id)
    if (index !== -1) notifications.value[index].read = true
    if (selectedNotification.value?._id === id) selectedNotification.value.read = true
  } catch (error) {
    console.error('Errore segnatura notifica:', error)
    alert('Impossibile segnare la notifica come letta')
  } finally {
    markingAsReadId.value = null
  }
}

const markAllAsRead = async () => {
  try {
    const token = localStorage.getItem('accessToken')
    await axios.patch('http://localhost:5000/api/v1/notifications/read-all', {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    notifications.value.forEach(n => { n.read = true })
    alert('Tutte le notifiche segnate come lette')
  } catch (error) {
    console.error('Errore segnatura tutte:', error)
    alert('Impossibile segnare tutte le notifiche')
  }
}

const viewDetails = (notification) => {
  selectedNotification.value = notification
  showModal.value = true
}

const refreshNotifications = () => fetchNotifications()

onMounted(fetchNotifications)
</script>

<style scoped>
.card { border-radius: 12px; }
.table th { cursor: pointer; user-select: none; }
.table th:hover { background-color: rgba(0,0,0,0.02); }
.table-primary { --bs-table-bg: rgba(13, 110, 253, 0.05); }
.badge { border-radius: 20px; padding: 5px 10px; font-size: 0.85em; }
.btn-sm { border-radius: 6px; padding: 0.25rem 0.5rem; }
</style>