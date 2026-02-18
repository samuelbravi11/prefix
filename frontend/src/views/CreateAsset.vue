<template>
  <div class="card shadow-sm border-0">
    <div class="card-body">
      <Toast />

      <div class="d-flex align-items-start justify-content-between gap-3 mb-3">
        <div>
          <h4 class="mb-1">Crea oggetto</h4>
          <div class="text-muted small">
            Seleziona uno o più edifici associati, poi inserisci i dati dell’oggetto.
          </div>
        </div>

        <Button
          label="Ricarica edifici"
          icon="pi pi-refresh"
          size="small"
          class="p-button-text"
          :loading="loadingBuildings"
          @click="loadBuildings"
        />
      </div>

      <div class="row g-3 align-items-end">
        <div class="col-12 col-lg-8">
          <label class="form-label">Edifici associati (selezione multipla)</label>
          <MultiSelect
            v-model="selectedBuildingIds"
            :options="buildingOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleziona edifici..."
            class="w-100"
            display="chip"
            :loading="loadingBuildings"
          />
          <div class="text-muted small mt-1">
            L’oggetto verrà creato per tutti gli edifici selezionati.
          </div>
        </div>

        <div class="col-12 col-lg-4 d-flex gap-2 justify-content-end flex-wrap">
          <Button
            label="Continua"
            icon="pi pi-arrow-right"
            size="small"
            :disabled="selectedBuildingIds.length === 0"
            @click="openDialog"
          />
          <Button
            label="Annulla"
            icon="pi pi-times"
            size="small"
            class="p-button-text"
            :disabled="selectedBuildingIds.length === 0"
            @click="resetSelection"
          />
        </div>
      </div>

      <!-- Dialog creazione asset -->
      <Dialog
        v-model:visible="dialogVisible"
        header="Nuovo oggetto"
        modal
        :style="{ width: '720px', maxWidth: '96vw' }"
      >
        <div class="row g-3">
          <div class="col-12 col-md-6">
            <label class="form-label">Nome</label>
            <InputText v-model="form.name" class="w-100" />
          </div>

          <div class="col-12 col-md-6">
            <label class="form-label">Categoria</label>
            <InputText v-model="form.category" class="w-100" />
          </div>

          <div class="col-12">
            <label class="form-label">Descrizione</label>
            <Textarea v-model="form.description" class="w-100" rows="3" autoResize />
          </div>
        </div>

        <template #footer>
          <Button label="Annulla" class="p-button-text" icon="pi pi-times" @click="closeDialog" />
          <Button label="Conferma" icon="pi pi-check" :loading="saving" @click="submit" />
        </template>
      </Dialog>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import { useToast } from "primevue/usetoast";

import Toast from "primevue/toast";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import MultiSelect from "primevue/multiselect";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";

// usa gli export reali dei tuoi service
import { fetchMyBuildings } from "@/services/buildings.service";
import { createAsset } from "@/services/assets.service";

const toast = useToast();

const loadingBuildings = ref(false);
const buildingOptions = ref([]);
const selectedBuildingIds = ref([]);

const dialogVisible = ref(false);
const saving = ref(false);

const form = reactive({
  name: "",
  category: "",
  description: "",
});

function resetSelection() {
  selectedBuildingIds.value = [];
}

function openDialog() {
  dialogVisible.value = true;
}

function closeDialog() {
  dialogVisible.value = false;
}

async function loadBuildings() {
  loadingBuildings.value = true;
  try {
    const res = await fetchMyBuildings();
    const data = res?.data || [];

    buildingOptions.value = data.map((b) => ({
      label: `${b.name}${b.city ? " — " + b.city : ""}`,
      value: b._id || b.id,
    }));
  } catch (e) {
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: "Impossibile caricare edifici associati",
      life: 3500,
    });
  } finally {
    loadingBuildings.value = false;
  }
}

async function submit() {
  if (!selectedBuildingIds.value.length) return;

  saving.value = true;

  try {
    // massima compatibilità: crea 1 asset per ogni edificio selezionato
    const tasks = selectedBuildingIds.value.map((buildingId) => {
      return createAsset({
        buildingId,
        name: form.name,
        category: form.category,
        description: form.description,
      });
    });

    const results = await Promise.allSettled(tasks);
    const ok = results.filter((r) => r.status === "fulfilled").length;
    const ko = results.filter((r) => r.status === "rejected").length;

    if (ok > 0 && ko === 0) {
      toast.add({ severity: "success", summary: "Creato", detail: `Creati ${ok} oggetti`, life: 2500 });
    } else if (ok > 0 && ko > 0) {
      toast.add({
        severity: "warn",
        summary: "Parziale",
        detail: `Creati ${ok} oggetti, ${ko} falliti`,
        life: 3500,
      });
    } else {
      toast.add({ severity: "error", summary: "Errore", detail: "Creazione oggetto fallita", life: 3500 });
    }

    closeDialog();

    form.name = "";
    form.category = "";
    form.description = "";
    selectedBuildingIds.value = [];
  } catch (e) {
    toast.add({ severity: "error", summary: "Errore", detail: "Creazione oggetto fallita", life: 3500 });
  } finally {
    saving.value = false;
  }
}

onMounted(loadBuildings);
</script>
