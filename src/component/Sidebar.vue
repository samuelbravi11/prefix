<template>
    <div class="d-flex flex-column vh-100 text-white" style="width: 240px; background-color: #1F263E;">

        <!-- Contenitore principale con flex-grow per spingere il pulsante in basso -->
        <div class="flex-grow-1 d-flex flex-column">

            <!-- Barra vuota all'altezza della navbar -->
            <nav class="navbar p-0 mb-3 py-4 d-flex justify-content-center align-items-center"
                style="border-bottom: 0.5px solid white;">
                <h4 class="text-white navbar-brand mb-0 h5">PreFix</h4>
            </nav>

            <!-- Titolo Quick Access -->
            <ul class="nav flex-column mt-4 ps-4">
                <li class="nav-item mb-2">
                    <h4>Quick Access</h4>
                </li>
            </ul>

            <!-- Lista link -->
            <ul class="nav flex-column mt-0 sidebar-menu">
                <li class="nav-item">
                    <router-link to="/dashboard" class="nav-link ps-5"
                        active-class="active-link">Dashboard</router-link>
                </li>
                <li class="nav-item">
                    <router-link to="/interventi" class="nav-link ps-5"
                        active-class="active-link">Interventi</router-link>
                </li>
                <li class="nav-item">
                    <router-link to="/logout" class="nav-link ps-5" active-class="active-link">Logout</router-link>
                </li>
            </ul>

            <!-- Titolo Sede -->
            <ul class="nav flex-column mt-4 ps-4">
                <li class="nav-item mb-2">
                    <h4>Povo 1</h4>
                </li>
            </ul>

            <!-- Lista con combo box -->
            <ul class="nav flex-column mt-4 sidebar-menu">
                <li class="nav-item mb-2">
                    <select class="form-select sidebar-select ps-5">
                        <option value="" disabled selected>Grafici</option>
                        <option value="1">Grafico a torta</option>
                        <option value="2">Grafico a linee</option>
                    </select>
                </li>
                <li class="nav-item">
                    <router-link to="/tabellare" class="nav-link ps-5" active-class="active-link">Visualizzazione
                        Tabellare</router-link>
                </li>
            </ul>
            <!-- Titolo Sede -->
            <ul class="nav flex-column mt-4 ps-4">
                <li class="nav-item mb-2">
                    <h4>Account</h4>
                </li>
            </ul>
            <ul class="nav flex-column mt-0 sidebar-menu">
                <li class="nav-item">
                    <router-link to="/notifiche" class="nav-link ps-5"
                        active-class="active-link">Notifiche</router-link>
                </li>
                <li class="nav-item">
                    <router-link to="/impostazioni" class="nav-link ps-5"
                        active-class="active-link">Impostazioni</router-link>
                </li>
            </ul>
        </div>
        

        <!-- Pulsante Logout sempre in basso -->
        <div class="p-3">
            <button class="btn w-100 sidebar-logout-btn">Logout</button>
        </div>

    </div>
</template>

<style scoped>
/* Link della sidebar */
.sidebar-menu .nav-link {
    background-color: #1F263E;
    color: white;
    text-decoration: none;
    border-radius: 0;
    padding-left: 10px;
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
    transition: background-color 0.2s ease;
}

/* Hover */
.sidebar-menu .nav-link:hover {
    background-color: #27314E;
}

/* Link attivo */
.sidebar-menu .nav-link.active-link {
    background-color: #3A4668;  /* leggermente più chiaro */
    font-weight: bold;
    border-left: 4px solid #58a6ff; /* bordo colorato a sinistra */
    padding-left: 6px; /* riduci padding sinistro per il bordo */
}
/* Stile combo box coerente con la sidebar */
.sidebar-select {
    background-color: #1F263E;
    color: white;
    border: none;
    border-radius: 0;
    padding-left: 10px;
    margin-bottom: 0;
    transition: background-color 0.2s ease;
}

.sidebar-select:focus {
    outline: none;
    background-color: #27314E;
    box-shadow: none;
}

.sidebar-select option {
    background-color: #1F263E;
    color: white;
}

/* Stile pulsante logout */
.sidebar-logout-btn {
    background-color: #27314E;
    color: white;
    border: none;
    border-radius: 0;
    padding: 0.5rem 0;
    transition: background-color 0.2s ease;
}

.sidebar-logout-btn:hover {
    background-color: #3A4668;
}
</style>
