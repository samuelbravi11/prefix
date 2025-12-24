import { schedulerConfig } from '../config/scheduler.config.js'
import { getAllActiveAssets, updateRuleCheck, updateAICheck } from '../repositories/asset.repository.js'
import { ruleCheckJob } from '../jobs/ruleCheck.job.js'
import { aiPredictiveCheckJob } from '../jobs/aiPredictive.job.js'

/* Lo Scheduler
  E' il componente software che decide quando e come eseguire i Job.
  Avvia un loop temporizzato che:
  - non blocca il server
  - gira in background
  - sopravvive finché Node è attivo
*/

/* LOGICA CHIAMATE AI
  per ogni bene sul database:
  - prelevo dati riguardanti l'ultima chiamata regolistica
  - se lastRuleCheck supera una soglia di threshold effettuo un controllo regolistico (dove le regole sono definite dall'utente)
  - se il controllo ritorna NULL o se non esiste una regola per quel bene --> avvio una chiamata ad un altro modello AI per la predizione del prossimo evento di manutenzione
  - se almeno uno dei 2 ritorna l'evento --> creo evento calendario

  In questo modo definisco una gerarchia dove il controllo regolistico è il preferito e viene chiamato più spesso,
  Le chiamate AI predittive verranno fatte se il controllo regolistico non ha avuto successo e se la soglia ha superato il threshold molto più alto del threshold regolistico
*/
export const startScheduler = () => {
  console.log('[SCHEDULER] Started')

  // avvia una chiamata asincrona su setInterval ogni tot minuti (definito su .env)
  setInterval(async () => {
    console.log('[SCHEDULER] Tick')

    const assets = await getAllActiveAssets()
    const now = Date.now()

    // prelevo ogni bene sul database
    for (const asset of assets) {
      // controllo se l'ultima chiamata regolistica ha superato una soglia di threshold
      const shouldCheckRules =
        !asset.lastRuleCheckAt ||
        now - asset.lastRuleCheckAt > schedulerConfig.ruleThreshold

      // se ho sforato --> chiamata al Job rule
      if (shouldCheckRules) {
        const ruleResult = await ruleCheckJob(asset)
        // aggiorno lastRuleCheck
        await updateRuleCheck(asset.id, now)

        // regola soddisfatta → evento creato --> STOP
        if (ruleResult.triggered) {
          continue
        }
      }

      // se il controllo regolistico non è stato superato --> chiamata AI predittiva
      const shouldCheckAI =
        !asset.lastAICheckAt ||
        now - asset.lastAICheckAt > schedulerConfig.aiThreshold

      // se supero threshold --> chiamata al Job AI-Predictive
      if (shouldCheckAI) {
        const aiResult = await aiPredictiveCheckJob(asset)
        // aggiorno lastAICheck
        await updateAICheck(asset.id, now)

        // decisione finale sempre qui
        if (aiResult.triggered) {
          // evento creato dentro job o service
        }
      }
    }
  }, schedulerConfig.interval)
}
