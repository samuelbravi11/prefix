/* ADAPTER: Node <--> Python
  Gestisce le chiamate HTTP verso il server Python
*/

/*
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
*/ // Se python va giù --> errore


function withTimeout(ms) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return { ctrl, clear: () => clearTimeout(id) };
}

async function safeFetchJson(url, payload, timeoutMs = 15000) {
  const { ctrl, clear } = withTimeout(timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });

    const text = await res.text();
    if (!res.ok) throw new Error(`Python ${res.status}: ${text.slice(0, 300)}`);

    return text ? JSON.parse(text) : {};
  } finally {
    clear();
  }
}

export const callPythonTableQA = (payload) =>
  safeFetchJson(`${process.env.PYTHON_SERVICE_URL}/rule-check`, payload);

export const callPythonPredictiveAI = (payload) =>
  safeFetchJson(`${process.env.PYTHON_SERVICE_URL}/predictive-check`, payload);