export async function getAllRequests(req, res) {
  return res.json({
    message: "Lista richieste",
    data: [
      { id: 1, title: "Manutenzione edificio A", status: "open" },
      { id: 2, title: "Controllo impianto B", status: "in_progress" }
    ]
  });
}

export async function getRequestById(req, res) {
  const { id } = req.params;

  return res.json({
    message: `Dettaglio richiesta ${id}`,
    data: {
      id,
      title: "Manutenzione edificio A",
      status: "open"
    }
  });
}

export async function createRequest(req, res) {
  const payload = req.body;

  return res.status(201).json({
    message: "Richiesta creata",
    data: payload
  });
}

export async function updateRequest(req, res) {
  const { id } = req.params;
  const payload = req.body;

  return res.json({
    message: `Richiesta ${id} aggiornata`,
    data: payload
  });
}
