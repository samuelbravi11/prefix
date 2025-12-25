# setup.ps1 - Script di setup per ambiente Python su Windows
# Usage: Esegui PowerShell come Amministratore, poi: .\setup.ps1

# Imposta politica di esecuzione per la sessione corrente
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

# Colori per output
$ErrorActionPreference = "Stop"

function Write-Info {
    Write-Host "[INFO] $($args[0])" -ForegroundColor Cyan
}

function Write-Success {
    Write-Host "[SUCCESS] $($args[0])" -ForegroundColor Green
}

function Write-Warning {
    Write-Host "[WARNING] $($args[0])" -ForegroundColor Yellow
}

function Write-Error {
    Write-Host "[ERROR] $($args[0])" -ForegroundColor Red
    exit 1
}

# Banner
Write-Host ""
Write-Host "╔══════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║    Python Environment Setup Script   ║" -ForegroundColor Blue
Write-Host "╚══════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

# ========== 1. VERIFICA PYTHON ==========
Write-Info "Verifica installazione Python..."

try {
    $pythonVersion = (python --version 2>&1).ToString()
    if (-not $pythonVersion -or $pythonVersion -match "not recognized") {
        Write-Error "Python non trovato. Installa Python 3.10+ da python.org"
    }
} catch {
    Write-Error "Python non trovato. Installa Python 3.10+ da python.org"
}

# Estrai numero versione
if ($pythonVersion -match "Python (\d+\.\d+\.\d+)") {
    $version = $matches[1]
} else {
    Write-Error "Impossibile determinare versione Python"
}

# Verifica versione minima
$requiredVersion = [Version]"3.10.0"
$currentVersion = [Version]$version

if ($currentVersion -lt $requiredVersion) {
    Write-Error "Python 3.10.0+ richiesto. Trovato $version"
}

Write-Success "Python $version trovato"

# ========== 2. RIMOZIONE AMBIENTE ESISTENTE ==========
if (Test-Path .venv) {
    Write-Warning "Ambiente virtuale esistente trovato"
    $response = Read-Host "Rimuovere ambiente virtuale esistente? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Info "Rimozione ambiente virtuale..."
        Remove-Item -Recurse -Force .venv -ErrorAction SilentlyContinue
        Write-Success "Ambiente virtuale rimosso"
    }
}

# ========== 3. CREAZIONE AMBIENTE VIRTUALE ==========
Write-Info "Creazione ambiente virtuale..."

try {
    python -m venv .venv
    if (-not (Test-Path .venv)) {
        Write-Error "Fallita creazione ambiente virtuale"
    }
} catch {
    Write-Error "Errore creazione ambiente virtuale: $_"
}

Write-Success "Ambiente virtuale creato in .venv\"

# ========== 4. ATTIVAZIONE AMBIENTE ==========
Write-Info "Attivazione ambiente virtuale..."

$activateScript = ".\venv\Scripts\Activate.ps1"
if (-not (Test-Path $activateScript)) {
    Write-Error "File di attivazione non trovato: $activateScript"
}

try {
    & $activateScript
} catch {
    Write-Error "Fallita attivazione ambiente virtuale: $_"
}

# Verifica attivazione
$pythonPath = (Get-Command python).Source
if (-not $pythonPath -or -not $pythonPath.Contains(".venv")) {
    Write-Error "Ambiente virtuale non attivato correttamente"
}

Write-Success "Ambiente virtuale attivato: $(python --version)"

# ========== 5. AGGIORNAMENTO PIP ==========
Write-Info "Aggiornamento pip, setuptools, wheel..."

try {
    python -m pip install --upgrade pip setuptools wheel
} catch {
    Write-Error "Fallito aggiornamento pip: $_"
}

Write-Success "Pip aggiornato: $(pip --version)"

# ========== 6. INSTALLAZIONE DIPENDENZE ==========
# Controlla che ci sia almeno un file di dipendenze
$hasDeps = $false
if (Test-Path "requirements.txt") { $hasDeps = $true }
if (Test-Path "pyproject.toml") { $hasDeps = $true }
if (Test-Path "Pipfile") { $hasDeps = $true }

if (-not $hasDeps) {
    Write-Warning "Nessun file di dipendenze trovato (requirements.txt, pyproject.toml, Pipfile)"
    Write-Info "Creazione requirements.txt vuoto..."
    "# Python dependencies" | Out-File -FilePath "requirements.txt" -Encoding UTF8
}

# Installa da requirements.txt (priorità)
if (Test-Path "requirements.txt") {
    Write-Info "Installazione dipendenze da requirements.txt..."
    
    if ((Get-Content "requirements.txt" -Raw).Trim() -eq "") {
        Write-Warning "requirements.txt è vuoto"
    } else {
        try {
            pip install -r requirements.txt
            Write-Success "Dipendenze da requirements.txt installate"
        } catch {
            Write-Error "Fallita installazione dipendenze da requirements.txt: $_"
        }
    }
}

# Installa da pyproject.toml (se esiste)
if (Test-Path "pyproject.toml") {
    Write-Info "Installazione dipendenze da pyproject.toml..."
    
    $content = Get-Content "pyproject.toml" -Raw
    if ($content -match "\[project\]" -or $content -match "\[tool\.poetry\]") {
        try {
            pip install -e .
            Write-Success "Progetto installato in modalità sviluppo"
        } catch {
            Write-Warning "Fallita installazione da pyproject.toml: $_"
        }
    }
}

# ========== 7. INSTALLAZIONE PRE-COMMIT ==========
if (Test-Path ".pre-commit-config.yaml") {
    Write-Info "Installazione pre-commit hooks..."
    
    try {
        # Controlla se pre-commit è installato
        $preCommitInstalled = $false
        try { pre-commit --version > $null 2>&1; $preCommitInstalled = $true } catch {}
        
        if (-not $preCommitInstalled) {
            pip install pre-commit
        }
        
        pre-commit install
        Write-Success "Pre-commit hooks installati"
    } catch {
        Write-Warning "Fallita installazione pre-commit: $_"
    }
}

# ========== 8. VERIFICA FINALE ==========
Write-Info "Verifica finale installazione..."

Write-Host ""
Write-Host "══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ SETUP COMPLETATO CON SUCCESSO!" -ForegroundColor Green
Write-Host "══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Informazioni ambiente:" -ForegroundColor Cyan
Write-Host "   Python: $(python --version)" -ForegroundColor White
Write-Host "   Pip:    $(pip --version)" -ForegroundColor White
Write-Host "   Path:   $((Get-Command python).Source)" -ForegroundColor White
Write-Host ""
Write-Host "📦 Pacchetti installati:" -ForegroundColor Cyan
pip list --format=columns | Select-Object -First 25
$packageCount = (pip list --format=freeze | Measure-Object).Count
if ($packageCount -gt 25) {
    Write-Host "   ... e $($packageCount - 25) altri" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "📝 COMANDI UTILI:" -ForegroundColor Yellow
Write-Host "   Attiva ambiente:    .\venv\Scripts\Activate.ps1" -ForegroundColor Green
Write-Host "   Disattiva:          deactivate" -ForegroundColor Green
Write-Host "   Aggiorna dipendenze:pip install -r requirements.txt" -ForegroundColor Green
Write-Host "   Aggiungi dipendenza:pip install <package> && pip freeze > requirements.txt" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  NOTA: Salva sempre le dipendenze:" -ForegroundColor Cyan
Write-Host "   pip freeze > requirements.txt" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Puoi iniziare a sviluppare!" -ForegroundColor Green