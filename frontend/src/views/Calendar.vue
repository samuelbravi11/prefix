<template>
  <div class="flex-grow-1 overflow-auto p-4 bg-light">
    <div class="container-fluid">
      <div class="row justify-content-center mt-4">
        <div class="col-11">
          <div class="card shadow-sm">
            <div class="card-body">
              <FullCalendar
                ref="calendarRef"
                :options="calendarOptions"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import bootstrapPlugin from '@fullcalendar/bootstrap'

// Eventi di esempio
const events = [
  { title: 'Evento A', start: '2025-12-29T10:00:00', end: '2025-12-29T12:00:00' },
  { title: 'Evento B', start: '2025-12-29T14:00:00', end: '2025-12-29T16:00:00' },
]

const calendarRef = ref(null)
const monthHeight = 650 // Altezza fissa per tutte le viste

const calendarOptions = {
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, bootstrapPlugin],
  initialView: 'dayGridMonth',
  themeSystem: 'bootstrap5',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  },
  events: events,
  editable: false,
  selectable: false,
  navLinks: true,
  height: monthHeight,
  eventClick: (info) => {
    alert(`Hai cliccato su: ${info.event.title}`)
  },
  // Evidenzia il giorno corrente in azzurro
  dayCellDidMount: (args) => {
    const today = new Date()
    if (
      args.date.getFullYear() === today.getFullYear() &&
      args.date.getMonth() === today.getMonth() &&
      args.date.getDate() === today.getDate()
    ) {
      args.el.style.backgroundColor = '#e6f7ff' // azzurro chiaro
      //args.el.style.borderRadius = '0.3rem' // opzionale per arrotondare la cella
    }
  }
}
</script>

<style scoped>
.card {
  border-radius: 0.75rem;
}
</style>
