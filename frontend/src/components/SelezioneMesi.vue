<template>
  <div class="d-flex gap-3 mb-3">
    <span
      class="pb-2"
      :class="selected === 'mese' ? 'text-primary border-bottom border-2 border-primary' : 'text-muted'"
      style="cursor: pointer"
      @click="selectPeriod('mese')"
    >
      Ultimo mese
    </span>

    <span
      class="pb-2"
      :class="selected === 'trimestre' ? 'text-primary border-bottom border-2 border-primary' : 'text-muted'"
      style="cursor: pointer"
      @click="selectPeriod('trimestre')"
    >
      Ultimo trimestre
    </span>

    <span
      class="pb-2"
      :class="selected === 'anno' ? 'text-primary border-bottom border-2 border-primary' : 'text-muted'"
      style="cursor: pointer"
      @click="selectPeriod('anno')"
    >
      Ultimo anno
    </span>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

// Props: periodo selezionato dal genitore
const props = defineProps({
  selected: {
    type: String,
    default: 'anno'
  }
})

// Eventi verso il genitore
const emit = defineEmits(['periodSelected'])

// Funzione per emettere l'evento quando cambia periodo
function selectPeriod(period) {
  emit('periodSelected', period)
}
</script>
