// Defines our logger configuration to save logs as JSON

import winston from 'winston';

const logFile = winston.transports.File;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),

    // Automatically log errors to error.log
    new logFile({ 
      filename: 'error.log', 
      level: 'error' 
    }),

    // Automatically log all info to info.log
    // for user report logs
    new logFile({ 
      filename: 'info.log', 
      level: 'info' 
    })
  ]
});

export default logger;