import { callPythonTableQA } from '../services/python.service.js'
import { createMaintenanceEvent } from '../services/event.service.js'
import { updateRuleCheck } from "../repositories/asset.repository.js";

/* RULE JOB
  L'unità di lavoro specifica che deve essere eseguita al fine di effettuare un controllo regolistico
*/
export const ruleCheckJob = async (asset) => {
  // se il bene non ha regole esco
  if (!asset.rules || asset.rules.length === 0) {
    return { triggered: false }
  }

  // chiama Table Question Answering sul server python
  const response = await callPythonTableQA({
    // input: regole + ultima manutenzione
    // output: bool creazione evento
    rules: asset.rules,
    lastMaintenance: asset.lastMaintenanceAt,
  })

  // qua il job decise se creare o no l'evento --> la logica di creazione evento è sulla parte di business logic (createMaintenanceEvent)
  // se output true --> creo evento
  if (response.shouldCreateEvent) {
    await createMaintenanceEvent({
      assetId: asset.id,
      reason: 'RULE_BASED',
      data: response,
    });

    await updateRuleCheck(asset._id);
    return { triggered: true }
  }

  await updateRuleCheck(asset._id);
  return { triggered: false }
}
