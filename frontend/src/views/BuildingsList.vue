<template>
  <div class="flex-grow-1 overflow-auto p-4 bg-light">
    <div class="container-fluid">
      <div class="row justify-content-center mt-4">
        <div class="col-11">
          <div class="card shadow-sm">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Elenco edifici comunali</h5>
              <Button label="Visualizza" icon="pi pi-eye" :disabled="selectedBuildings.length === 0"
                @click="onVisualizza" />
            </div>

            <div class="card-body">
              <DataTable v-model:selection="selectedBuildings" :value="buildings" dataKey="id" selectionMode="multiple"
                responsiveLayout="scroll" stripedRows paginator :rows="10" size="small">
                <Column selectionMode="multiple" headerStyle="width: 3rem" />

                <Column field="name" header="Nome edificio" sortable />
                <Column field="address" header="Indirizzo" sortable />
                <Column field="city" header="Città" sortable />

                <Column header="Stato">
                  <template #body="slotProps">
                    <span class="badge" :class="isOpenNow(slotProps.data.openingHours) ? 'bg-success' : 'bg-secondary'">
                      {{ isOpenNow(slotProps.data.openingHours) ? 'Aperto' : 'Chiuso' }}
                    </span>
                  </template>
                </Column>
              </DataTable>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'

const token = localStorage.getItem('accessToken')

const buildings = ref([])

const selectedBuildings = ref([])

const fetchBuildings = async () => {
  try {
    const response = await axios.get('/api/v1/buildings', {
      headers: {
        Authorization: `Bearer ${token}`,  // JWT preso dal login
        'Content-Type': 'application/json'
      }
    })

    // Mappiamo i dati per adattarli alla DataTable
    buildings.value = response.data.map(b => ({
      id: b._id,
      name: b.name,
      address: b.address,
      city: b.city || 'N/D',   // fallback se category non esiste
      openingHours: b.openingHours
    }))
  } catch (err) {
    console.error('Errore caricamento edifici:', err)
    alert('Impossibile caricare la lista edifici')
  }
}

onMounted(() => {
  fetchBuildings()
})

const onVisualizza = () => {
  console.log('Edifici selezionati:', selectedBuildings.value)
}

const isOpenNow = (openingHours = {}) => {
  const now = new Date()
  const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  const today = dayMap[now.getDay()]

  const intervals = openingHours[today] || []
  if (!intervals.length) return false

  const currentTime = now.toTimeString().slice(0, 5)
  return intervals.some(([start, end]) => start <= currentTime && currentTime <= end)
}

</script>



<style scoped>
.card {
  border-radius: 0.75rem;
}
</style>