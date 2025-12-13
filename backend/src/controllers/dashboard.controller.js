export async function getDashboard(req, res) {
    // Qui puoi usare req.user se vuoi (arriva dalla Guard)
    // Ma ricordati che --> Nessuna auth / RBAC qui dentro
    return res.json({
    message: "Dashboard overview",
    data: {
        totalUsers: 120,
        totalRequests: 45,
        openRequests: 12
    }
    });
}

export async function getStats(req, res) {
    return res.json({
    message: "Dashboard statistics",
    data: {
        requestsByStatus: {
        open: 12,
        in_progress: 20,
        closed: 13
        }
    }
    });
}
