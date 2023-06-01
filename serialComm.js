const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { io } = require("socket.io-client");
const socket = io('http://localhost:3001');

const port = new SerialPort({
  path: '/dev/ttyS0',
  baudRate: 921600
});

const parser = new ReadlineParser();
port.pipe(parser);



parser.on('data', (line) => {
  if (!line.startsWith('#') || !line.includes(':') || !line.endsWith('*')) {
      console.error('Error: Message does not contain "#", ":" or "*"');
  } else {
    const [address, value] = line.split(':');
    const formattedAddress = address.slice(1);
    const formattedValue = value.slice(0, -1);

    switch (formattedAddress) {
      case '100':
        console.log("Battery status:", formattedValue,"%");
        let serialData;
        serialData = formattedValue
        socket.emit('serialComm', serialData);
        console.log("Send data to server", serialData)
        break;
      case '130':

          console.log(`We have received -> ${formattedAddress}: ${formattedValue}`)
        break;
      case '131':

        break;
      case '132':

        break;
      case '133':

        break;
      case '134':

        break;
      case '135':

        break;
      case '136':

        break;
      case '137':

        break;
      case '138':

        break;
      case '139':

        break;
      case '140':

        break;
      case '141':

        break;
      case '142':

        break;
      case '143':

        break;
      case '144':

        break;
      case '145':

        break;
      case '146':

        break;
      default:
        console.error('Error: Invalid address');
    }
  }
});

port.on('open', () => {
  console.log('Port is open'); 
});

port.on('error', (err) => {
  console.error('Port error:', err.message);
});




