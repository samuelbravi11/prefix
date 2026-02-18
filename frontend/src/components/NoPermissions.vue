<!-- src/components/NoPermissions.vue -->
<template>
  <div class="container-fluid py-4">
    <div class="row justify-content-center">
      <div class="col-11 col-md-9 col-lg-7">
        <div class="card shadow-sm border-0">
          <div class="card-body p-4">
            <div class="d-flex align-items-start gap-3">
              <div class="icon-wrap">
                <i class="bi bi-shield-lock-fill"></i>
              </div>

              <div class="flex-grow-1">
                <h5 class="mb-1">Accesso limitato</h5>
                <p class="text-muted mb-3">
                  {{ hint }}
                </p>

                <div class="small text-muted">
                  Se ritieni sia un errore, contatta l’amministratore del tenant.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="text-muted small mt-3">
          L’app mostra automaticamente solo le funzionalità per cui hai i permessi.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  hint: {
    type: String,
    default: "Non hai i permessi necessari per visualizzare questa sezione.",
  },
});
</script>

<style scoped>
.icon-wrap {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(88, 166, 255, 0.12);
  color: #58a6ff;
  font-size: 20px;
}
</style>
