const HID = require("node-hid");
const path = require("path");

let device;
let checkDeviceInterval;
let spaceMouse = { x: 0, y: 0, z: 0, a: 0, b: 0, c: 0 };

function checkDevice() {
  // Find the device path of the SpaceMouse Compact
  const devices = HID.devices();
  const deviceInfo = devices.find((d) => d.product === "SpaceMouse Compact");

  if (deviceInfo) {
    clearInterval(checkDeviceInterval);
    // Open the device
    device = new HID.HID(deviceInfo.path);
    listenToDevice();
    console.log("SpaceMouse is ON")
  }
}

function listenToDevice() {
  let i = 0;

  // Listen for data events
  device.on("data", (data) => {
    const offset = 1;
    if (i === 0) {
      spaceMouse.x = data.readInt16LE(offset) / 3.5;
      spaceMouse.y = -data.readInt16LE(offset + 2) / 3.5;
      spaceMouse.z = -data.readInt16LE(offset + 4) / 3.5;
      i = 1;
    } else {
      spaceMouse.a = -data.readInt16LE(offset) / 3.5;
      spaceMouse.b = -data.readInt16LE(offset + 2) / 3.5;
      spaceMouse.c = data.readInt16LE(offset + 4) / 3.5;
      i = 0;
    }
  });

  device.on("error", (err) => {
    console.error("SpaceMouse" ,err);
    checkDeviceInterval = setInterval(checkDevice, 1000);
  });
}

checkDeviceInterval = setInterval(checkDevice, 1000);

module.exports = { spaceMouse };

