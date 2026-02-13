// src/config/logger.js
import { createLogger, format, transports } from 'winston';
import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';

// Usa variabile d'ambiente: se manca, non attivare il trasporto
const logtail = process.env.LOGTAIL_SOURCE_TOKEN 
  ? new Logtail(process.env.LOGTAIL_SOURCE_TOKEN)
  : null;

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    // Trasporto su FILE (sempre attivo, fallback)
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
    
    // Trasporto su BetterStack (solo se token presente)
    ...(logtail ? [new LogtailTransport(logtail)] : [])
  ]
});

// In produzione, aggiungi anche console per debug via PaaS
if (process.env.NODE_ENV !== 'development') {
  logger.add(new transports.Console({
    format: format.simple(),
  }));
}

export default logger;