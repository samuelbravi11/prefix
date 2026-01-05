<template>
  <div class="flex-grow-1 overflow-auto p-4 bg-light">
    <div class="container-fluid">
      <div class="row justify-content-center mt-4">
        <div class="col-11">
          <div class="card shadow-sm">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">
                <i class="bi bi-calendar-week me-2"></i>
                Calendario Eventi
              </h5>
              <div class="d-flex align-items-center gap-2">
                <span v-if="loading" class="text-muted">
                  <i class="bi bi-arrow-repeat me-2"></i>Caricamento...
                </span>
                <span v-if="selectedBuildingsStore.selectedIds.length > 0 && !loading" 
                      class="text-muted">
                  
                  {{ getSelectedBuildingsText() }}
                </span>
                <Button 
                  v-if="allBuildings.length > 0"
                  label="Cambia edifici" 
                  icon="pi pi-building" 
                  size="small"
                  @click="goToBuildingsList"
                  :disabled="loading"
                />
              </div>
            </div>
            <div class="card-body">
              <FullCalendar
                ref="calendarRef"
                :options="calendarOptions"
              />
            </div>
            <div class="card-footer text-muted small">
              <div v-if="allBuildings.length > 0 && selectedBuildingsStore.selectedIds.length > 0">
                <div class="d-flex align-items-center mb-2">
                  
                  <strong>Legenda edifici selezionati:</strong>
                </div>
                <div class="d-flex flex-wrap gap-2 mt-2">
                  <div v-for="building in filteredBuildings" :key="building.id" class="d-flex align-items-center">
                    <span class="color-dot me-1" :style="{ backgroundColor: getEventColor(building.id) }"></span>
                    <span>{{ building.name }}</span>
                  </div>
                </div>
              </div>
              <div v-else-if="allBuildings.length > 0" class="text-center py-2">
                <i class="bi bi-building me-1"></i>
                Nessun edificio selezionato
              </div>
              <div v-else class="text-center py-2">
                <i class="bi bi-hourglass-split me-1"></i>
                Caricamento edifici...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import bootstrapPlugin from '@fullcalendar/bootstrap'
import axios from 'axios'
import { useSelectedBuildingsStore } from '@/stores/selectedBuildings'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'

// Router e store
const router = useRouter()
const selectedBuildingsStore = useSelectedBuildingsStore()

// Refs
const loading = ref(false)
const allBuildings = ref([])
const calendarRef = ref(null)

// Computed
const filteredBuildings = computed(() => {
  return allBuildings.value.filter(b => 
    selectedBuildingsStore.selectedIds.includes(b.id)
  )
})

// Token di autenticazione
const token = localStorage.getItem('accessToken')

// Testo per mostrare gli edifici selezionati
const getSelectedBuildingsText = () => {
  const selectedIds = selectedBuildingsStore.selectedIds
  if (selectedIds.length === 0) return "Nessun edificio selezionato"
  
  const selectedBuildingsNames = filteredBuildings.value.map(b => b.name)
  
  if (selectedBuildingsNames.length === 0) return "Edifici selezionati non trovati"
  
  const truncated = selectedBuildingsNames.length > 2 
    ? `${selectedBuildingsNames.slice(0, 2).join(', ')} e altri ${selectedBuildingsNames.length - 2}`
    : selectedBuildingsNames.join(', ')
  
  return truncated
}

// Vai alla lista edifici
const goToBuildingsList = () => {
  router.push('/buildings-list')
}

// Carica la lista completa degli edifici
const fetchBuildings = async () => {
  try {
    const response = await axios.get('/api/v1/buildings', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    allBuildings.value = response.data.map(b => ({
      id: b._id,
      name: b.name,
      address: b.address,
      city: b.city || 'N/D'
    }))
  } catch (err) {
    console.error('Errore caricamento edifici:', err)
  }
}

// Funzione per caricare gli eventi dall'API
const fetchEvents = async () => {
  const selectedIds = selectedBuildingsStore.selectedIds
  
  if (selectedIds.length === 0) {
    calendarOptions.events = []
    if (calendarRef.value?.getApi) {
      calendarRef.value.getApi().removeAllEvents()
    }
    return
  }

  loading.value = true
  try {
    const buildingIdsParam = selectedIds.map(id => encodeURIComponent(id)).join(',')
    
    const response = await axios.get(`/api/v1/events?buildingIds=${buildingIdsParam}&view=future`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    // Mappatura eventi
    const events = response.data.map(event => {
      const building = allBuildings.value.find(b => b.id === event.buildingId)
      const buildingName = building ? building.name : `Edificio ${event.buildingId.substring(0, 6)}...`
      const ruleCount = event.data?.dueRuleIds?.length || 0
      
      // Determina icona e titolo
      let iconClass = 'bi-calendar-event'
      let eventType = 'Evento'
      
      if (event.reason === 'rule_based') {
        iconClass = 'bi-tools'
        eventType = 'Manutenzione'
      }
      
      const title = `${eventType}: ${buildingName}`
      
      return {
        id: event._id,
        title: title,
        start: event.scheduledAt,
        end: event.scheduledAt,
        buildingId: event.buildingId,
        buildingName: buildingName,
        reason: event.reason,
        status: event.status,
        color: getEventColor(event.buildingId),
        extendedProps: {
          building: buildingName,
          description: event.data?.explanation || 'Nessuna descrizione disponibile',
          reason: event.reason,
          status: event.status,
          scheduledAt: new Date(event.scheduledAt).toLocaleString('it-IT'),
          ruleCount: ruleCount,
          assetId: event.assetId,
          iconClass: iconClass,
          eventType: eventType
        }
      }
    })

    // Ordina per data
    events.sort((a, b) => new Date(a.start) - new Date(b.start))
    
    // Aggiorna eventi del calendario
    calendarOptions.events = events
    
    // Refresh calendario
    if (calendarRef.value?.getApi) {
      const calendarApi = calendarRef.value.getApi()
      calendarApi.removeAllEvents()
      events.forEach(event => calendarApi.addEvent(event))
    }
    
  } catch (err) {
    console.error('Errore caricamento eventi:', err)
    alert('Impossibile caricare gli eventi')
  } finally {
    loading.value = false
  }
}

// Funzione per generare colori
const getEventColor = (buildingId) => {
  if (!buildingId) return '#0d6efd'
  
  const colors = [
    '#0d6efd', // primary
    '#6f42c1', // purple
    '#d63384', // pink
    '#fd7e14', // orange
    '#198754', // success
    '#dc3545', // danger
    '#0dcaf0', // info
    '#20c997', // teal
    '#ffc107', // warning
    '#6c757d', // secondary
  ]
  
  const hash = buildingId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc)
  }, 0)
  
  return colors[Math.abs(hash) % colors.length]
}

// Configurazione del calendario
const calendarOptions = {
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, bootstrapPlugin],
  initialView: 'dayGridMonth',
  themeSystem: 'bootstrap5',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  },
  events: [],
  editable: false,
  selectable: false,
  navLinks: true,
  height: 650,
  eventClick: (info) => {
    const event = info.event
    const ext = event.extendedProps
    
    // Costruisci dettagli con Bootstrap Icons come testo
    const details = [
      `${event.title}`,
      `Edificio: ${ext.building}`,
      `Data: ${ext.scheduledAt}`,
      `Descrizione: ${ext.description}`,
      `Stato: ${ext.status}`
    ].filter(line => line !== null).join('\n')
    
    alert(details)
  },
  dayCellDidMount: (args) => {
    const today = new Date()
    if (
      args.date.getFullYear() === today.getFullYear() &&
      args.date.getMonth() === today.getMonth() &&
      args.date.getDate() === today.getDate()
    ) {
      args.el.style.backgroundColor = '#e6f7ff'
    }
  },
  eventDidMount: (info) => {
    const event = info.event
    const ext = event.extendedProps
    
    const tooltip = `${event.title}\nEdificio: ${ext.building}\nData: ${ext.scheduledAt}`
    info.el.setAttribute('title', tooltip)
    
    if (ext.reason === 'rule_based') {
      info.el.style.borderLeft = '4px solid #dc3545'
    }
  },
  locale: 'it',
  buttonText: {
    today: 'Oggi',
    month: 'Mese',
    week: 'Settimana',
    day: 'Giorno'
  },
  nowIndicator: true,
  slotLabelFormat: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }
}

// Watch per cambiamenti edifici selezionati
watch(() => [...selectedBuildingsStore.selectedIds], () => {
  fetchEvents()
}, { deep: true })

// Carica edifici e eventi al mount
onMounted(async () => {
  await fetchBuildings()
  fetchEvents()
})

// Funzione per aggiornare manualmente
const refreshEvents = () => {
  fetchEvents()
}

defineExpose({
  refreshEvents
})
</script>

<style scoped>
.card {
  border-radius: 0.75rem;
}

.color-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 4px;
}

/* Stili per il calendario */
:deep(.fc-event) {
  cursor: pointer;
  transition: transform 0.2s;
}

:deep(.fc-event:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

:deep(.fc-day-today) {
  background-color: #e6f7ff !important;
}

:deep(.fc-toolbar) {
  flex-wrap: wrap;
}

:deep(.fc-toolbar-title) {
  font-size: 1.5rem;
  font-weight: 600;
}
</style>