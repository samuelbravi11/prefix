// src/plugins/primevue.js - VERSIONE MINIMA
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'

// Componenti BASE per iniziare
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import Tag from 'primevue/tag'
import Toolbar from 'primevue/toolbar'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

export default {
  install(app) {
    app.use(PrimeVue, {
      ripple: true,
      inputStyle: 'outlined'
    })
    
    app.use(ToastService)
    app.use(ConfirmationService)
    
    // Registra componenti base
    const components = {
      Button,
      DataTable,
      Column,
      InputText,
      Dialog,
      Dropdown,
      Tag,
      Toolbar,
      Toast,
      ConfirmDialog
    }
    
    Object.entries(components).forEach(([name, component]) => {
      app.component(name, component)
    })
  }
}