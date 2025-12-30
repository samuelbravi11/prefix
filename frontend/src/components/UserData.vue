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
import { ref, watch } from 'vue'
import axios from 'axios'
import Dialog from 'primevue/dialog'

// Props per v-model
const props = defineProps({ show: Boolean })
const emit = defineEmits(['update:show'])

// Ref locale sincronizzato con il genitore
const showLocal = ref(props.show)
watch(() => props.show, val => showLocal.value = val)
watch(showLocal, val => emit('update:show', val))

// Campi UserData
const nome = ref('')
const email = ref('')
const surname = ref('')
const status = ref('')
const roleName = ref('')

// Funzione per caricare dati utente
const fetchUserData = async () => {
    try {
        const token = localStorage.getItem('accessToken')
        const response = await axios.get('/api/v1/users/me', {
            headers: { Authorization: `Bearer ${token}` }
        })
        const user = response.data.user
        nome.value = user.name
        surname.value = user.surname
        email.value = user.email
        status.value = user.status
        roleName.value = user.roles?.[0]?.roleName || 'N/D'
    } catch (err) {
        console.error('Errore caricamento dati utente:', err)
        alert('Impossibile caricare i dati utente')
    }
}

// Quando il dialog si apre, fetchiamo i dati
watch(showLocal, (val) => {
    if (val) fetchUserData()
})

const formatRoleName = (role) => {
    if (!role) return ''
    // Sostituisci "_" con spazio e metti in maiuscolo la prima lettera di ogni parola
    return role
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}
</script>
