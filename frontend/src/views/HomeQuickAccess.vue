<!-- src/views/HomeQuickAccess.vue -->
<template>
  <div class="flex-grow-1 overflow-auto p-4 bg-light">
    <div class="container-fluid">
      <div class="row justify-content-center mt-4">
        <div class="col-11">
          <div class="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h4 class="mb-1">Quick Access</h4>
              <div class="text-muted">Seleziona una funzionalità per iniziare.</div>
            </div>
          </div>

          <!-- GENERICHE -->
          <div class="mb-4">
            <h6 class="text-uppercase small fw-semibold text-muted mb-2">Funzionalità generiche</h6>

            <div class="row g-3">
              <div v-if="can('dashboard:view')" class="col-md-6 col-lg-4">
                <div class="card shadow-sm border-0 h-100 qa-card" @click="go('/dashboard')">
                  <div class="card-body">
                    <div class="d-flex align-items-center">
                      <div class="qa-icon me-3"><i class="bi bi-bar-chart"></i></div>
                      <div>
                        <div class="fw-semibold">Dashboard</div>
                        <div class="text-muted small">Pannello • Linee • Torta</div>
                      </div>
                    </div>
                    <div class="mt-3 small text-muted">Vista riepilogativa KPI e grafici principali.</div>
                  </div>
                </div>
              </div>

              <div v-if="canAny(['users:pending:view','users:active:view','users:pending:approve','users:status:update','users:role:update','users:building:view','users:building:update','users:read_info','requests:manage','roles:manage'])" class="col-md-6 col-lg-4">
                <div class="card shadow-sm border-0 h-100 qa-card" @click="go('/gestione-utenti')">
                  <div class="card-body">
                    <div class="d-flex align-items-center">
                      <div class="qa-icon me-3"><i class="bi bi-people"></i></div>
                      <div>
                        <div class="fw-semibold">Gestione utenti</div>
                        <div class="text-muted small">Stato/Ruolo • Assegnazioni • Info • Ruoli</div>
                      </div>
                    </div>
                    <div class="mt-3 small text-muted">Gestione completa utenti e permessi.</div>
                  </div>
                </div>
              </div>

              <div v-if="canAny(['buildings:view_all','buildings:view_associated','buildings:manage'])" class="col-md-6 col-lg-4">
                <div class="card shadow-sm border-0 h-100 qa-card" @click="go('/gestione-edifici')">
                  <div class="card-body">
                    <div class="d-flex align-items-center">
                      <div class="qa-icon me-3"><i class="bi bi-building"></i></div>
                      <div>
                        <div class="fw-semibold">Gestione edifici</div>
                        <div class="text-muted small">Lista • Modifica • Crea</div>
                      </div>
                    </div>
                    <div class="mt-3 small text-muted">Edifici esistenti e operazioni correlate.</div>
                  </div>
                </div>
              </div>

              <div v-if="canAny(['assets:view','assets:manage','rules:view','rules:manage'])" class="col-md-6 col-lg-4">
                <div class="card shadow-sm border-0 h-100 qa-card" @click="go('/oggetti-regole')">
                  <div class="card-body">
                    <div class="d-flex align-items-center">
                      <div class="qa-icon me-3"><i class="bi bi-box-seam"></i></div>
                      <div>
                        <div class="fw-semibold">Oggetti & Regole</div>
                        <div class="text-muted small">Crea • Visualizza • Modifica</div>
                      </div>
                    </div>
                    <div class="mt-3 small text-muted">Asset e regole di manutenzione.</div>
                  </div>
                </div>
              </div>

              <!-- ORA ATTIVA -->
              <div v-if="canAny(['interventions:view','interventions:bulk_upload','interventions:manage'])" class="col-md-6 col-lg-4">
                <div class="card shadow-sm border-0 h-100 qa-card" @click="go('/interventi')">
                  <div class="card-body">
                    <div class="d-flex align-items-center">
                      <div class="qa-icon me-3"><i class="bi bi-clipboard-check"></i></div>
                      <div>
                        <div class="fw-semibold">Report / Interventi</div>
                        <div class="text-muted small">Crea • Upload JSON • Tabellare</div>
                      </div>
                    </div>
                    <div class="mt-3 small text-muted">
                      Creazione interventi, upload JSON con preview e tabellare filtrabile.
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="!hasGeneric" class="col-12">
                <div class="alert alert-secondary mb-0">
                  Non hai permessi per le funzionalità generiche. Chiedi all’admin un ruolo con più permessi.
                </div>
              </div>
            </div>
          </div>

          <!-- SPECIFICHE -->
          <div class="mb-2">
            <h6 class="text-uppercase small fw-semibold text-muted mb-2">Funzionalità specifiche</h6>

            <div class="row g-3">
              <div v-if="can('events:view')" class="col-md-6 col-lg-4">
                <div class="card shadow-sm border-0 h-100 qa-card" @click="go('/calendar')">
                  <div class="card-body">
                    <div class="d-flex align-items-center">
                      <div class="qa-icon me-3"><i class="bi bi-calendar-event"></i></div>
                      <div>
                        <div class="fw-semibold">Calendario Interventi</div>
                        <div class="text-muted small">Vista calendario</div>
                      </div>
                    </div>
                    <div class="mt-3 small text-muted">Eventi programmati e manutenzioni.</div>
                  </div>
                </div>
              </div>

              <div v-if="can('buildings:view_associated')" class="col-md-6 col-lg-4">
                <div class="card shadow-sm border-0 h-100 qa-card" @click="go('/buildings-list')">
                  <div class="card-body">
                    <div class="d-flex align-items-center">
                      <div class="qa-icon me-3"><i class="pi pi-building"></i></div>
                      <div>
                        <div class="fw-semibold">Seleziona Edifici</div>
                        <div class="text-muted small">Filtro globale</div>
                      </div>
                    </div>
                    <div class="mt-3 small text-muted">Scegli edifici su cui lavorare.</div>
                  </div>
                </div>
              </div>

              <div v-if="can('notifications:view')" class="col-md-6 col-lg-4">
                <div class="card shadow-sm border-0 h-100 qa-card" @click="go('/notifiche')">
                  <div class="card-body">
                    <div class="d-flex align-items-center">
                      <div class="qa-icon me-3"><i class="bi bi-bell"></i></div>
                      <div>
                        <div class="fw-semibold">Notifiche</div>
                        <div class="text-muted small">Centro notifiche</div>
                      </div>
                    </div>
                    <div class="mt-3 small text-muted">Visualizza e gestisci notifiche.</div>
                  </div>
                </div>
              </div>

              <div v-if="!hasSpecific" class="col-12">
                <div class="alert alert-secondary mb-0">
                  Non hai permessi per le funzionalità specifiche. Chiedi all’admin un ruolo con più permessi.
                </div>
              </div>
            </div>
          </div>

          <div class="text-muted small mt-4">
            Le “funzionalità generiche” hanno sotto-sezioni accessibili dalla Sidebar.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { usePermissions } from "@/composables/usePermissions";

const router = useRouter();
const { hasPermission, hasAny } = usePermissions();

function go(path) {
  router.push(path);
}
function can(p) {
  return hasPermission(p);
}
function canAny(list) {
  return hasAny(list);
}

const hasGeneric = computed(() =>
  can("dashboard:view") ||
  canAny(["users:pending:view","users:active:view","users:pending:approve","users:status:update","users:role:update","users:building:view","users:building:update","users:read_info","requests:manage","roles:manage"]) ||
  canAny(["buildings:view_all","buildings:view_associated","buildings:manage"]) ||
  canAny(["assets:view","assets:manage","rules:view","rules:manage"]) ||
  canAny(["interventions:view","interventions:bulk_upload","interventions:manage"])
);

const hasSpecific = computed(() =>
  can("events:view") || can("buildings:view_associated") || can("notifications:view")
);
</script>

<style scoped>
.qa-card { cursor: pointer; border-radius: 0.75rem; transition: transform 0.12s ease, box-shadow 0.12s ease; }
.qa-card:hover { transform: translateY(-2px); box-shadow: 0 10px 22px rgba(0,0,0,0.08); }
.qa-icon {
  width: 42px; height: 42px; border-radius: 10px;
  background: rgba(88, 166, 255, 0.12);
  display: flex; align-items: center; justify-content: center;
  color: #58a6ff; font-size: 18px;
}
</style>
