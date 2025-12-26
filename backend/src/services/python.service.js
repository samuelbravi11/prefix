/* ADAPTER: Node <--> Python
  Gestisce le chiamate HTTP verso il server Python
*/

// chiamata al server python su route: URL/rules
export const callPythonTableQA = async (payload) => {
  console.log("EFFETTUO CHIAMATA AL SERVIZIO PYTHON (AI REGOLISTICA)");
  const res = await fetch(`${process.env.PYTHON_SERVICE_URL}/rule-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return res.json()
}

// chiamata al server python su route: URL/predict
export const callPythonPredictiveAI = async (payload) => {
  console.log("EFFETTUO CHIAMATA AL SERVIZIO PYTHON (AI PREDITTIVA)");
  const res = await fetch(`${process.env.PYTHON_SERVICE_URL}/predictive-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return res.json()
}
