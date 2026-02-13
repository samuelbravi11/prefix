import { schedulerConfig } from '../config/scheduler.config.js'
import { getAllActiveAssets, updateRuleCheck, updateAICheck } from '../repositories/asset.repository.js'
import { getRulesByAsset } from '../repositories/rule.repository.js'
import { ruleCheckJob } from '../jobs/ruleCheck.job.js'
import { aiPredictiveCheckJob } from '../jobs/aiPredictive.job.js'
import { shouldRunPredictiveCheck, shouldRunRuleCheck } from "../scheduler/scheduler.utils.js"

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
    //console.log('[SCHEDULER] Tick')

    // trova tutti gli asset con stato attivo
    const assets = await getAllActiveAssets()
    //console.log("Assets trovati:\n", assets)
    // now fondamentale per sapere il momento in cui il sistema ha deciso di valutare questo bene
    const now = Date.now()

    // prelevo ogni bene sul database
    for (const asset of assets) {
      console.log("\n\n\n-----------------------------------\n\n\n")
      console.log("ASSET:\n", asset)
      // controllo se l'ultima chiamata regolistica ha superato una soglia di threshold
      const shouldCheckRules = shouldRunRuleCheck(asset, now, schedulerConfig.ruleThreshold)
      console.log("shouldCheckRules: ", shouldCheckRules)

      // se ho sforato --> chiamata al Job rule
      if (shouldCheckRules) {
        const ruleResult = await ruleCheckJob(asset, now)

        // aggiorno lastRuleCheck
        await updateRuleCheck(asset.id, now)

        // regola soddisfatta → evento creato --> STOP
        if (ruleResult.triggered) {
          console.log("Evento creato da AI regolistica")
          continue
        }
      }

      console.log("Controllo regolistico non superato")
      console.log("Procedo con controllo predittivo")
      // se il controllo regolistico non è stato superato --> chiamata AI predittiva
      const shouldCheckAI = shouldRunPredictiveCheck(asset, now, schedulerConfig.aiThreshold)
      console.log("shouldCheckAI: ", shouldCheckAI)
      
      // se supero threshold --> chiamata al Job AI-Predictive
      if (shouldCheckAI) {
        const aiResult = await aiPredictiveCheckJob(asset, now)

        // aggiorno lastAICheck
        await updateAICheck(asset.id, now)

        // decisione finale sempre qui
        if (aiResult.triggered) {
          console.log("Evento creato da AI predittiva")
          // evento creato dentro job o service
        }
      }
    }
  }, schedulerConfig.interval)
}
