/* ADAPTER: Node <--> Python
  Gestisce le chiamate HTTP verso il server Python
*/

// chiamata al server python su route: URL/rules
export const callPythonTableQA = async (payload) => {
  const res = await fetch(`${process.env.PYTHON_SERVICE_URL}/rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return res.json()
}

// chiamata al server python su route: URL/predict
export const callPythonPredictiveAI = async (payload) => {
  const res = await fetch(`${process.env.PYTHON_SERVICE_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return res.json()
}
