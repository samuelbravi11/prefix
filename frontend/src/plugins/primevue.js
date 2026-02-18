// src/plugins/primevue.js
import PrimeVue from "primevue/config";
import ToastService from "primevue/toastservice";
import ConfirmationService from "primevue/confirmationservice";

import Button from "primevue/button";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import InputText from "primevue/inputtext";
import Dialog from "primevue/dialog";
import Dropdown from "primevue/dropdown";
import Tag from "primevue/tag";
import Toolbar from "primevue/toolbar";
import Toast from "primevue/toast";
import ConfirmDialog from "primevue/confirmdialog";

import TabView from "primevue/tabview";
import TabPanel from "primevue/tabpanel";
import MultiSelect from "primevue/multiselect";
import Textarea from "primevue/textarea";
import Checkbox from "primevue/checkbox";

// AGGIUNTE NECESSARIE (nuove viste)
import Calendar from "primevue/calendar";
import InputNumber from "primevue/inputnumber";
import Steps from "primevue/steps";

export default {
  install(app) {
    app.use(PrimeVue, { ripple: true, inputStyle: "outlined" });
    app.use(ToastService);
    app.use(ConfirmationService);

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
      ConfirmDialog,
      TabView,
      TabPanel,
      MultiSelect,
      Textarea,
      Checkbox,

      // nuove registrazioni
      Calendar,
      InputNumber,
      Steps,
    };

    Object.entries(components).forEach(([name, component]) => {
      app.component(name, component);
    });
  },
};
