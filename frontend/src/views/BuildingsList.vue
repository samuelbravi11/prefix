<template>
  <div class="flex-grow-1 overflow-auto p-4 bg-light">
    <div class="container-fluid">
      <div class="row justify-content-center mt-4">
        <div class="col-11">
          <div class="card shadow-sm">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Elenco edifici comunali</h5>
              <Button
                label="Visualizza"
                icon="pi pi-eye"
                :disabled="selectedBuildings.length === 0"
                @click="onVisualizza"
              />
            </div>

            <div class="card-body">
              <DataTable
                v-model:selection="selectedBuildings"
                :value="buildings"
                dataKey="id"
                selectionMode="multiple"
                responsiveLayout="scroll"
                stripedRows
                paginator
                :rows="10"
                size="small"
              >
                <Column selectionMode="multiple" headerStyle="width: 3rem" />

                <Column field="name" header="Nome edificio" sortable />
                <Column field="address" header="Indirizzo" sortable />
                <Column field="category" header="Categoria" sortable />

                <Column header="Stato">
                  <template #body="slotProps">
                    <span
                      class="badge"
                      :class="slotProps.data.active ? 'bg-success' : 'bg-secondary'"
                    >
                      {{ slotProps.data.active ? 'Attivo' : 'Inattivo' }}
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
import { ref } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'

const buildings = ref([
  {
    id: 1,
    name: 'Municipio Centrale',
    address: 'Piazza Roma 1',
    category: 'Amministrativo',
    active: true
  },
  {
    id: 2,
    name: 'Scuola Primaria Dante',
    address: 'Via Dante 12',
    category: 'Scuola',
    active: true
  },
  {
    id: 3,
    name: 'Magazzino Comunale',
    address: 'Via Industriale 5',
    category: 'Deposito',
    active: false
  }
])

const selectedBuildings = ref([])

const onVisualizza = () => {
  console.log('Edifici selezionati:', selectedBuildings.value)
}
</script>

<style scoped>
.card {
  border-radius: 0.75rem;
}
</style>