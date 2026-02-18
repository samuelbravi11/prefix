<!-- src/views/CreateBuilding.vue -->
<template>
  <div class="card shadow-sm border-0">
    <div class="card-body">
      <Toast />

      <div class="d-flex align-items-start justify-content-between gap-3 mb-3">
        <div>
          <h4 class="mb-1">Crea edificio</h4>
          <div class="text-muted small">
            Inserisci i dati necessari e conferma per creare un nuovo edificio.
          </div>
        </div>
      </div>

      <!-- FORM SEMPRE VISIBILE -->
      <div class="row g-3">
        <div class="col-12 col-md-6">
          <label class="form-label">Nome</label>
          <InputText v-model="form.name" class="w-100" placeholder="Es. Sede Centrale" />
        </div>

        <div class="col-12 col-md-6">
          <label class="form-label">Città</label>
          <InputText v-model="form.city" class="w-100" placeholder="Es. Milano" />
        </div>

        <div class="col-12">
          <label class="form-label">Indirizzo</label>
          <InputText v-model="form.address" class="w-100" placeholder="Es. Via Roma 10" />
        </div>

        <!-- azioni -->
        <div class="col-12 d-flex justify-content-end gap-2 mt-2">
          <Button
            label="Annulla"
            icon="pi pi-times"
            size="small"
            class="p-button-text"
            :disabled="saving"
            @click="resetForm"
          />
          <Button
            label="Conferma"
            icon="pi pi-check"
            size="small"
            :loading="saving"
            :disabled="!canSubmit"
            @click="submitCreate"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { useToast } from "primevue/usetoast";

import Toast from "primevue/toast";
import Button from "primevue/button";
import InputText from "primevue/inputtext";

import { createBuilding as apiCreateBuilding } from "@/services/buildings.service";

const emit = defineEmits(["created"]);

const toast = useToast();
const saving = ref(false);

const form = reactive({
  name: "",
  city: "",
  address: "",
});

const canSubmit = computed(() => {
  return (
    String(form.name || "").trim().length >= 2 &&
    String(form.city || "").trim().length >= 2 &&
    String(form.address || "").trim().length >= 3
  );
});

function resetForm() {
  form.name = "";
  form.city = "";
  form.address = "";
}

async function submitCreate() {
  if (!canSubmit.value) {
    toast.add({
      severity: "warn",
      summary: "Dati mancanti",
      detail: "Compila nome, città e indirizzo.",
      life: 2500,
    });
    return;
  }

  saving.value = true;
  try {
    await apiCreateBuilding({
      name: form.name.trim(),
      city: form.city.trim(),
      address: form.address.trim(),
    });

    toast.add({
      severity: "success",
      summary: "Creato",
      detail: "Edificio creato correttamente",
      life: 2200,
    });

    resetForm();
    emit("created"); // permette al parent di ricaricare la tabella edifici
  } catch (e) {
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: "Creazione edificio fallita",
      life: 3500,
    });
  } finally {
    saving.value = false;
  }
}
</script>
