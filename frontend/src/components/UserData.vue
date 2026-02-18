<template>
    <Dialog header="UserData" v-model:visible="showLocal" modal :closable="true">
        <div class="p-2">
            <p>Qui puoi visualizzare i dati dell’utente.</p>

            <div class="mb-2">
                <label class="fw-bold text-primary">Nome e Cognome:</label>
                <p class="form-control-plaintext">{{ nome + ' ' + surname }}</p>
            </div>

            <div class="mb-2">
                <label class="fw-bold text-primary">Email:</label>
                <p class="form-control-plaintext">{{ email }}</p>
            </div>
            <div class="mb-2">
                <label class="fw-bold text-primary">Ruolo:</label>
                <p class="form-control-plaintext">{{ formatRoleName(roleName) }}</p>
            </div>
            <div class="mb-2">
                <label class="fw-bold text-primary me-2">Stato:</label>
                <span class="badge ms-2 d-inline-block align-middle" :class="status === 'active' ? 'bg-success' : 'bg-danger'">
                    {{ status === 'active' ? 'Attivo' : 'Inattivo' }}
                </span>
            </div>
        </div>
    </Dialog>
</template>

<script setup>
import { onMounted, ref } from "vue";
import api from "@/services/api";

const user = ref(null);

onMounted(async () => {
  try {
    const res = await api.get("/users/me");
    user.value = res.data?.user || null;
  } catch (e) {
    user.value = null;
  }
});
</script>