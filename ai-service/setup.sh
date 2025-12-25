#!/bin/bash
# setup.sh - Script di setup per ambiente Python su Linux/Mac
# Usage: chmod +x setup.sh && ./setup.sh

set -euo pipefail  # Fail on error, undefined variables, and pipe failures

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funzioni di logging
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════╗"
echo "║    Python Environment Setup Script   ║"
echo "╚══════════════════════════════════════╝"
echo -e "${NC}"

# ========== 1. VERIFICA PYTHON ==========
log_info "Verifica installazione Python..."

if ! command -v python3 &> /dev/null; then
    log_error "Python3 non trovato. Installa Python 3.10+"
fi

# Verifica versione
PYTHON_VERSION=$(python3 --version | awk '{print $2}')
REQUIRED_VERSION="3.10.0"

# Comparazione versioni
if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    log_error "Python $REQUIRED_VERSION+ richiesto. Trovato $PYTHON_VERSION"
fi

log_success "Python $PYTHON_VERSION trovato"

# ========== 2. RIMOZIONE AMBIENTE ESISTENTE ==========
if [ -d ".venv" ]; then
    log_warning "Ambiente virtuale esistente trovato"
    read -p "Rimuovere ambiente virtuale esistente? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Rimozione ambiente virtuale..."
        rm -rf .venv
        log_success "Ambiente virtuale rimosso"
    fi
fi

# ========== 3. CREAZIONE AMBIENTE VIRTUALE ==========
log_info "Creazione ambiente virtuale..."

# Crea ambiente virtuale
if ! python3 -m venv .venv --prompt "$(basename "$PWD")"; then
    log_error "Fallita creazione ambiente virtuale"
fi

log_success "Ambiente virtuale creato in .venv/"

# ========== 4. ATTIVAZIONE AMBIENTE ==========
log_info "Attivazione ambiente virtuale..."

if [ ! -f ".venv/bin/activate" ]; then
    log_error "File di attivazione non trovato"
fi

# Carica l'ambiente virtuale
source .venv/bin/activate

if [ -z "${VIRTUAL_ENV:-}" ]; then
    log_error "Fallita attivazione ambiente virtuale"
fi

log_success "Ambiente virtuale attivato: $(python --version)"

# ========== 5. AGGIORNAMENTO PIP ==========
log_info "Aggiornamento pip, setuptools, wheel..."

if ! python -m pip install --upgrade pip setuptools wheel; then
    log_error "Fallito aggiornamento pip"
fi

log_success "Pip aggiornato: $(pip --version)"

# ========== 6. INSTALLAZIONE DIPENDENZE ==========
# Controlla che ci sia almeno un file di dipendenze
if [ ! -f "requirements.txt" ] && [ ! -f "pyproject.toml" ] && [ ! -f "Pipfile" ]; then
    log_warning "Nessun file di dipendenze trovato (requirements.txt, pyproject.toml, Pipfile)"
    log_info "Creazione requirements.txt vuoto..."
    echo "# Python dependencies" > requirements.txt
fi

# Installa da requirements.txt (priorità)
if [ -f "requirements.txt" ]; then
    log_info "Installazione dipendenze da requirements.txt..."
    
    if [ ! -s "requirements.txt" ]; then
        log_warning "requirements.txt è vuoto"
    else
        if ! pip install -r requirements.txt; then
            log_error "Fallita installazione dipendenze da requirements.txt"
        fi
        log_success "Dipendenze da requirements.txt installate"
    fi
fi

# Installa da pyproject.toml (se esiste)
if [ -f "pyproject.toml" ]; then
    log_info "Installazione dipendenze da pyproject.toml..."
    
    # Controlla se è un progetto pip-installabile
    if grep -q "\[project\]" pyproject.toml || grep -q "\[tool.poetry\]" pyproject.toml; then
        if ! pip install -e .; then
            log_warning "Fallita installazione da pyproject.toml"
        else
            log_success "Progetto installato in modalità sviluppo"
        fi
    fi
fi

# ========== 7. INSTALLAZIONE PRE-COMMIT ==========
if [ -f ".pre-commit-config.yaml" ]; then
    log_info "Installazione pre-commit hooks..."
    
    if ! command -v pre-commit &> /dev/null; then
        pip install pre-commit
    fi
    
    if pre-commit install; then
        log_success "Pre-commit hooks installati"
    else
        log_warning "Fallita installazione pre-commit"
    fi
fi

# ========== 8. VERIFICA FINALE ==========
log_info "Verifica finale installazione..."

echo ""
echo -e "${BLUE}══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ SETUP COMPLETATO CON SUCCESSO!${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════${NC}"
echo ""
echo "📊 Informazioni ambiente:"
echo "   Python: $(python --version)"
echo "   Pip:    $(pip --version)"
echo "   Path:   $(which python)"
echo ""
echo "📦 Pacchetti installati:"
pip list --format=columns | head -20
if [ $(pip list --format=freeze | wc -l) -gt 20 ]; then
    echo "   ... e $(($(pip list --format=freeze | wc -l)-20)) altri"
fi
echo ""
echo -e "${YELLOW}📝 COMANDI UTILI:${NC}"
echo "   Attiva ambiente:    ${GREEN}source .venv/bin/activate${NC}"
echo "   Disattiva:          ${GREEN}deactivate${NC}"
echo "   Aggiorna dipendenze:${GREEN}pip install -r requirements.txt${NC}"
echo "   Aggiungi dipendenza:${GREEN}pip install <package> && pip freeze > requirements.txt${NC}"
echo ""
echo -e "${BLUE}⚠️  NOTA:${NC} Salva sempre le dipendenze:"
echo "   pip freeze > requirements.txt"
echo ""
echo -e "${GREEN}🎉 Puoi iniziare a sviluppare!${NC}"