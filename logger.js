const winston = require('winston');
const { combine, timestamp, printf, json } = winston.format;
const fs = require('fs');
const path = require('path');

const currentDate = new Date();
const year = currentDate.getFullYear();
const month = ('0' + (currentDate.getMonth() + 1)).slice(-2);
const day = ('0' + currentDate.getDate()).slice(-2);
const hours = ('0' + currentDate.getHours()).slice(-2);
const minutes = ('0' + currentDate.getMinutes()).slice(-2);

const localDateTime = year + '-' + month + '-' + day + '_' + hours + '-' + minutes;  

const logFormat = printf(({ level, message }) => {
  return `[${level.toUpperCase()}]:${message}`;
});
const logger = winston.createLogger({
  level: 'info',
    format: combine(
      timestamp({
        format: 'YYYY-MM-DD HH:mm:ss:'
    }),
      logFormat
    ),
  transports: [
    new winston.transports.File({
      filename: `logs/${localDateTime}.log`,
      maxsize: 1024 * 1024 * 10, // 10MB
      timestamp: true
    })
  ]
});

const longLogger = winston.createLogger({
    level: 'info',
    format: combine(
      timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
      logFormat
    ),
    transports: [
      new winston.transports.File({
        filename: './longTermLog/longTermLog.log', 
        maxsize: 1024 * 1024 * 100, // 100MB
        timestamp: true,
        tailable: true
      })
    ]
  });


  
  setInterval(() => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = ('0' + (currentDate.getMonth() + 1)).slice(-2);
    const day = ('0' + currentDate.getDate()).slice(-2);
    const hours = ('0' + currentDate.getHours()).slice(-2);
    const minutes = ('0' + currentDate.getMinutes()).slice(-2);

    const localDateTime = year + '-' + month + '-' + day + '_' + hours + '-' + minutes;  
    
    logger.removeAllListeners();
    logger.add(new winston.transports.File({
      filename: `logs/${localDateTime}.log`,
      maxsize: 1024 * 1024 * 10, // 10MB
      timestamp: true
    }));

  }, 60000);


  function copyLoggerFile() {
    const srcPath = path.join(__dirname, `logs/${localDateTime}.log`);
    const destPath = path.join(__dirname, `longTermLog/${localDateTime}.log`);
    fs.stat(destPath, (err, stats) => {
      if (err) {
        fs.copyFile(srcPath, destPath, (err) => {
          logger.removeAllListeners();
          if (err) throw err;
          logger.add(new winston.transports.File({
            filename: `logs/${localDateTime}.log`,
            maxsize: 1024 * 1024 * 10, // 10MB
            timestamp: true
          }));
          console.log('File copied successfully!');
        });
      } else {
        // console.log('File already exists');
      }
    });
  }

module.exports = { logger, longLogger, copyLoggerFile };