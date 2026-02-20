# Permessi (RBAC)

Questa applicazione usa un modello RBAC (Role Based Access Control):

- **Tutti i ruoli** includono un set di **permessi base**.
- I **permessi privilegiati** vengono assegnati solo a ruoli specifici (es. `admin`) da chi ha i permessi per gestire i ruoli.
- Alcune azioni **pubbliche/implicite** (es. registrazione) possono non richiedere un permesso assegnato.

## Permessi base

- `area_riservata:access` — accesso area riservata e lettura profilo (`GET /api/v1/users/me`).
- `preferences:manage` — lettura/salvataggio preferenze utente (`GET/PUT /api/v1/preferences/me`).
- `auth:login` — login e refresh (utente registrato).
- `auth:logout` — logout.
- `notifications:view` — visualizza notifiche e contatore non lette.
- `notifications:manage` — segna notifiche come lette / mark-all-read.
- `buildings:view` — visualizza edifici associati.
- `assets:view` — visualizza beni/asset.
- `interventions:view` — visualizza interventi (tabella/lista).

## Permessi privilegiati

### Gestione utenti

- `users:active:view` — elenca utenti attivi/gestibili.
- `users:pending:view` — elenca utenti in stato pending.
- `users:approve` — approva utenti pending.
- `users:update_role` — modifica ruolo utente.
- `users:update_status` — modifica status utente.
- `users:buildings:view` — visualizza associazioni utenti↔edifici.
- `users:buildings:update` — modifica associazioni utenti↔edifici.
- `users:info:view` — visualizza dati/insights utente.

### Ruoli e permessi

- `roles:view` — visualizza ruoli.
- `roles:manage` — crea/modifica/elimina ruoli.
- `permissions:view` — elenca permessi disponibili.

### Scheduler

- `scheduler:view` — legge stato scheduler.
- `scheduler:manage` — avvia/ferma scheduler.

### Regole e richieste

- `rules:view` — visualizza regole.
- `rules:manage` — gestisce regole.
- `requests:view` — visualizza richieste.
- `requests:manage` — gestisce richieste.

### Interventi / edifici (gestione)

- `interventions:manage` — crea/aggiorna/elimina interventi.
- `interventions:bulk_upload` — bulk upload (preview/commit).
- `buildings:manage` — crea/modifica/elimina edifici.
- `buildings:assign` — assegna edifici.

### Dashboard

- `dashboard:view` — visualizza statistiche dashboard.
