<template>
  <div class="flex-grow-1 overflow-auto p-4 bg-light">
    <div class="container-fluid">
      <div class="row justify-content-center mt-4">
        <div class="col-11">
          <div class="card shadow-sm border-0">
            <div class="card-body">
              <h5 class="mb-2">Visualizzazione tabellare spostata</h5>
              <p class="text-muted mb-3">
                La visualizzazione tabellare degli interventi è stata spostata nella sezione <b>Report / Interventi</b>.
              </p>
              <Button label="Vai a Interventi" icon="pi pi-arrow-right" @click="go" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import Button from "primevue/button";

const router = useRouter();
const go = () => router.push("/interventi");
</script>
