# Guida completa installazione e avvio progetto PreFix

Questa guida spiega come:

1.  Installare Docker
2.  Installare Node.js e npm
3.  Installare dipendenze frontend
4.  Buildare frontend
5.  Avviare nginx, proxy, backend e AI
6.  Verificare che tutto funzioni

------------------------------------------------------------------------

# 1. Installare Docker

## Ubuntu / Debian

``` bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release

sudo mkdir -p /etc/apt/keyrings

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo   "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg]   https://download.docker.com/linux/ubuntu   $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update

sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Verifica:

``` bash
docker --version
docker compose version
```

------------------------------------------------------------------------

# 2. Dare permessi Docker (Linux)

``` bash
sudo usermod -aG docker $USER
newgrp docker
```

Test:

``` bash
docker run hello-world
```

------------------------------------------------------------------------

# 3. Installare Node.js e npm

``` bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
```

Verifica:

``` bash
sudo node -v
sudo npm -v
```

------------------------------------------------------------------------

# 4. Installare dipendenze frontend

Nota: esegui questi comandi se nella cartella /frontend/dist non trovi nessun elemento

``` bash
cd prefix/frontend
sudo rm -rf node_modules
sudo rm -f package-lock.json
sudo npm install
```

------------------------------------------------------------------------

# 5. Build frontend

``` bash
sudo npm run build
```

Verifica:

``` bash
ls dist/index.html
```

------------------------------------------------------------------------

# 6. Tornare nella root

``` bash
cd ..
```

------------------------------------------------------------------------

# 7. Build container

``` bash
docker compose build --no-cache
```

------------------------------------------------------------------------

# 8. Avviare

``` bash
docker compose up -d
```

------------------------------------------------------------------------

# 9. Verifica

``` bash
docker ps
```

------------------------------------------------------------------------

# 10. Accesso

Frontend:

http://localhost

------------------------------------------------------------------------

# 11. Logs

``` bash
docker compose logs -f nginx
```

------------------------------------------------------------------------

# 12. Troubleshooting

Se errore 403 nginx:

``` bash
cd frontend
npm install
npm run build
docker compose restart nginx
```

------------------------------------------------------------------------

# Fine