<template>
  <Dialog header="Impostazioni" v-model:visible="showLocal" modal :closable="true">
    <!-- Contenuto del popup -->
    <div class="p-2">
      <p>Qui puoi modificare le impostazioni dell’utente.</p>

      <!-- Esempio campi impostazioni -->
      <div class="mb-2">
        <label>Nome:</label>
        <input type="text" v-model="nome" class="form-control" />
      </div>

      <div class="mb-2">
        <label>Email:</label>
        <input type="email" v-model="email" class="form-control" />
      </div>
    </div>

    <template #footer>
      <Button label="Chiudi" class="p-button-text" @click="close" />
      <Button label="Salva" icon="pi pi-check" @click="save" />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

// Props per v-model
const props = defineProps({
  show: Boolean
})
const emit = defineEmits(['update:show'])

// Ref locale sincronizzato con il genitore
const showLocal = ref(props.show)
watch(() => props.show, val => showLocal.value = val)
watch(showLocal, val => emit('update:show', val))

// Campi impostazioni
const nome = ref('non ancora implementato')
const email = ref('non ancora implementato')

// Chiudi popup
function close() {
  showLocal.value = false
}

// Salva dati
function save() {
  console.log('Salvate impostazioni:', { nome: nome.value, email: email.value })
  close()
}
</script>
