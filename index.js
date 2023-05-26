const spi = require("spi-device");
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const spaceMouse = require("./spacemouse").spaceMouse;
const { logger, longLogger, copyLoggerFile } = require("./logger");
const deleteOldFiles = require("./delOldFiles");
const fs = require("fs");
const serialPort = require("./serialComm");


const errorDB = JSON.parse(fs.readFileSync("./errorDB.json"));
const warningDB = JSON.parse(fs.readFileSync("./warningDB.json"));

const Gpio = require("onoff").Gpio;
const gpioPinSpi = 5;
const gpioSpi = new Gpio(gpioPinSpi, "in", "both");
const gpioPinComm = 6;
const gpioComm = new Gpio(gpioPinComm, "in", "both");

let sliderTest = {};
let slidersData = [];

const messageLength = 88;

let sendData;
let id_button;
let interval;
let intervalEmit;
let batteryStatus;

let parity = [];
let debug = [];
let error = [];
let warning = [];
let motionOnGoing = [];
let onTargetPosition = [];
let driverState = [];
let workingMode = [];
let targetPosition = [];
let actualPosition = [];
let actualTorque = [];
let actualFrequency = [];
let errorCode = [];
let warningCode = [];
let axesX = [];
let axesY = [];
let axesZ = [];
let axesG = [];

const config = {
  mode: 0,
  //chipSelect: 2,
  maxSpeedHz: 100000,
  bitOrder: spi.ORDER_MSB_FIRST,
  bitsPerWord: 8,
};

const device = spi.open(1, 2, config, (err) => {
  if (err) throw err;
  console.log("Server is opened");
});

app.use("/css", express.static("css")); ////////CSS STYLE

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", (socket) => {
    socket.on('test', (serialData) => {
      console.log(`Received data from server: ${serialData}`);
      batteryStatus = serialData;
    });
  sendData = () => {
    const message = [
      {
        sendBuffer: Buffer.from([
          spaceMouse.x+100, spaceMouse.x >> 8,
          spaceMouse.y+100, spaceMouse.y >> 8,
          spaceMouse.z+100, spaceMouse.z >> 8,
          spaceMouse.a+100, spaceMouse.a >> 8,
          spaceMouse.b+100, spaceMouse.b >> 8,
          spaceMouse.c+100, spaceMouse.c >> 8,
          sliderTest.name, sliderTest.value,
          sliderTest.value, sliderTest.value,
          sliderTest.value,
          0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
          0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
          0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
          0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
          0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
          0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
          0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 
          0xff, 0xff, 0xff, 0xff,
        ]),
        receiveBuffer: Buffer.alloc(messageLength),
        byteLength: messageLength,
        speedHz: 100000,
      },
    ];

    let gpioValueSpi = gpioSpi.readSync();
    let gpioValueComm = gpioComm.readSync();
    // logger.log("info", `${gpioValue}, ${Date.now()}`);
    // console.log(`${gpioValueSpi},${Date.now()}`);
    // console.log(`${gpioValueComm},${Date.now()}`);
    if (gpioValueComm === 1) {
      const error = errorDB.errors.find((error) => error.id === 1 && error.group === 3);
      if (error) {
        const errorMessage = `Error ${error.id}: ${error.message}`;
        socket.emit("errorOccurred", errorMessage);
      }
    } else {
      if (gpioValueSpi === 1) {
        device.transfer(message, (err, message) => {
          logger.log(
            "info",
            `${Date.now()},${new Uint8Array(
              message[0].receiveBuffer
            )},${new Uint8Array(message[0].sendBuffer.slice(0, 17))}`
          );
          if (err) throw err;

          if (
            message[0].receiveBuffer[0] === 0xff &&
            message[0].receiveBuffer[1] === 0xff
          ) {
            for (let i = 0; i < messageLength - 2; i++) {
              message[0].receiveBuffer[i] = message[0].receiveBuffer[i + 2];
            }

            for (let i = 0; i < 4; i++) {
              let receiveData1 = message[0].receiveBuffer[i * 14];

              parity[i] = (receiveData1 & 0b10000000) >> 7;
              debug[i] = (receiveData1 & 0b01000000) >> 6;
              error[i] = (receiveData1 & 0b00001000) >> 3;
              warning[i] = (receiveData1 & 0b00000100) >> 2;
              motionOnGoing[i] = (receiveData1 & 0b00000010) >> 1;
              onTargetPosition[i] = receiveData1 & 0b00000001;

              let receiveData2 = message[0].receiveBuffer[i * 14 + 1];

              driverState[i] = (receiveData2 & 0b11110000) >> 4;
              workingMode[i] = receiveData2 & 0b00001111;
              actualPosition[i] = message[0].receiveBuffer.readInt16LE(
                i * 14 + 2
              );
              actualTorque[i] = message[0].receiveBuffer.readInt16LE(
                i * 14 + 4
              );
              actualFrequency[i] = Math.round(
                message[0].receiveBuffer.readFloatLE(i * 14 + 6)
              );

              errorCode[i] = message[0].receiveBuffer.readInt16LE(i * 14 + 10);
              warningCode[i] = message[0].receiveBuffer.readInt16LE(
                i * 14 + 12
              );
            }

            i = 4;
            let receiveData1 = message[0].receiveBuffer[i * 14];
            parity[i] = (receiveData1 & 0b10000000) >> 7;
            debug[i] = (receiveData1 & 0b01000000) >> 6;
            error[i] = (receiveData1 & 0b00001000) >> 3;
            warning[i] = (receiveData1 & 0b00000100) >> 2;
            motionOnGoing[i] = (receiveData1 & 0b00000010) >> 1;
            onTargetPosition[i] = receiveData1 & 0b00000001;

            let receiveData2 = message[0].receiveBuffer[i * 14 + 1];
            driverState[i] = (receiveData2 & 0b11110000) >> 4;
            workingMode[i] = receiveData2 & 0b00001111;
            for (let k = 0; k < 4; k++) {
              targetPosition[k] = message[0].receiveBuffer.readInt16LE(
                i * 14 + 2 + k * 2
              );
            }
            errorCode[i] = message[0].receiveBuffer.readInt16LE(i * 14 + 10);
            warningCode[i] = message[0].receiveBuffer.readInt16LE(i * 14 + 12);

            axesX = message[0].receiveBuffer.readFloatLE(70);
            axesY = message[0].receiveBuffer.readFloatLE(74);
            axesZ = message[0].receiveBuffer.readFloatLE(78);
            axesG = message[0].receiveBuffer.readFloatLE(82);

            let lastErrorCode;
            let lastWarningCode;

            if (error.some((elem) => elem !== 0 && elem !== ",")) {
              if (lastErrorCode !== errorCode) {
                copyLoggerFile();
                longLogger.error(`${Date.now()}, ${errorCode}`);
                lastErrorCode = errorCode;
              }
            }
            if (warning.some((elem) => elem !== 0 && elem !== ",")) {
              if (lastWarningCode !== warningCode) {
                longLogger.warn(`${Date.now()}, ${warningCode}`);
                lastWarningCode = warningCode;
              }
            }
          } else {
            for (let i = 0; i < messageLength; i++) {
              message[0].receiveBuffer[i] = 0;
            }
            // console.log(`Lost SPI Communication`);
          }
        });
      }
    }
  };
  
  interval = setInterval(sendData, 5);
  dataEmit = () => {
    io.emit("data", {
      parity: parity,
      debug: debug,
      error: error,
      warning: warning,
      motionOnGoing: motionOnGoing,
      onTargetPosition: onTargetPosition,
      driverState: driverState,
      workingMode: workingMode,
      targetPosition: targetPosition,
      actualPosition: actualPosition,
      actualTorque: actualTorque,
      actualFrequency: actualFrequency,
      errorCode: errorCode,
      warningCode: warningCode,
      axesX: axesX,
      axesY: axesY,
      axesZ: axesZ,
      axesG: axesG,
      errorDB,
      warningDB,
      batteryStatus,
    });
  };
  intervalEmit = setInterval(dataEmit, 100);
});


server.listen(3000, () => {
  console.log("Server started on port 3000");
});

setInterval(deleteOldFiles, 60 * 1000);
