# RINOMINA QUESTO FILE IN .env

# QUESTO E' UN FILE DI ESEMPIO

MONGO_URI=mongodb+srv://admin:mfwaulc8dkOQz2kX@PreFixClusterDB.qrw3tse.mongodb.net/PreFix?retryWrites=true&w=majority
DB_NAME=PreFix
PROXY_INTERNAL_URL=http://127.0.0.1:5000


ACCESS_EXP=15m
REFRESH_EXP=1d
BCRYPT_SALT_ROUNDS=12


# ogni quanto lo scheduler si sveglia
SCHEDULER_INTERVAL_MS=600000    # 60 secondi --> da cambiare a 10 minuti (600000)
# ogni quanto fare chiamate per il controllo delle regole
RULE_CHECK_THRESHOLD_MS=86400000    # 24h
# ogni quanto fare il controllo per analisi AI predittiva
AI_CHECK_THRESHOLD_MS=2592000000    # 30 giorni
# url servizio python per l'AI
PYTHON_SERVICE_URL=http://localhost:8000


# per firmare nuovi access token
JWT_SECRET=1b0c3f7e9812cbb098aaa099efad9912b2cceb8e9f849f2fb421c33b9bf44e1b
# per firmare nuovi refresh token
REFRESH_TOKEN_SECRET=crTCRvL1uCOWJbFvNVJDq8koed6pIM2Y