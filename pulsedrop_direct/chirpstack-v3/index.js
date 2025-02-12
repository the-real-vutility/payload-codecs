// This version of the index file contains a decodeUplink function that does not use
// the Buffer or ArrayBuffer or TypedArray Classes.
// This version is compatible with ES5
// Due to limitations in ES5, only a limited set of downlink values are permitted.
// Because of this, the decodeDownlink function is not implemented


/**
 * Decode uplink
 * @param {number} fPort - The Port Field on which the uplink has been sent
 * @param {number[]} bytes - Array of bytes represented as numbers as it has been sent from the device
 * @param {variables} variables - variables contains the device variables e.g. {"calibration": "3.5"}. Both key/value are type string
 * @returns {VoltDropDirectData} The decoded object
 */
function Decode(fPort, bytes, variables) {
  var result = {
    data: {}
  };
  var rawBytesArray = bytes;
  // Uplink payload must be 11 bytes long.
  if (rawBytesArray.length != 11) {
    throw new Error("Payload length must be 11 bytes");
  }

  // Packet ID - 1 byte
  var packetId = rawBytesArray[0];
  if (packetId !== 28) {
    throw new Error("Payload packet ID is not equal to 28");
  }

  // Constant factors for formulas
  var capacitorVoltageFactor = 5.0 / 255.0;
  var temperatureCelsiusFactor = 120.0 / 255.0;
  var noResponseErrorFlag = 0x01;
  var invalidResponseErrorFlag = 0x02;

  // Capacitor Voltage Scalar - 1 byte
  // 8-bit unsigned integer representing the capacitor voltage.
  // (as if the integer range from 0-255 is scaled to between 0.0V and 5.0V)
  var capacitorVoltageScalar = rawBytesArray[1];

  // Temperature Scalar
  // 8-bit unsigned integer representing the temperature.
  // (as if the integer range from 0-255 is scaled to between -40C and 80C)
  var temperatureScalar = rawBytesArray[2];

  // PulseCount - 4 bytes
  // 32-bit unsigned integer in network byte order (MSB/BE)
  var pulseCount =
    ((rawBytesArray[3] << 24) +
      (rawBytesArray[4] << 16) +
      (rawBytesArray[5] << 8) +
      rawBytesArray[6]) >>>
    0;

  // Calculated fields
  var capacitorVoltage = capacitorVoltageFactor * capacitorVoltageScalar;
  var temperatureCelsius = temperatureCelsiusFactor * temperatureScalar - 40;

  // Digital AMI error flags
  const errorFlags = rawBytesArray[10];
  if (errorFlags & noResponseErrorFlag) {
    throw new Error("No response from meter");
  }
  if (errorFlags & invalidResponseErrorFlag) {
    throw new Error("Invalid response from meter");
  }

  result.data = {
    pulseCount: pulseCount,
    capacitorVoltage: capacitorVoltage,
    temperatureCelsius: temperatureCelsius,
  };

  return result.data;
}

/**
 * Downlink encode
 * @param {number} fPort - The Port Field on which the downlink must be sent
 * @param {Object} input - The higher-level object representing your downlink
 * @param {variables} variables - variables contains the device variables e.g. {"calibration": "3.5"}. Both key/value are type string
 * @returns {number[]} Array of bytes represented as numbers as it will be sent to the device
 */
function Encode(fPort, input, variables) {
  var result = {
    bytes: []
  };

  var definedDownlinkVars = 0;
  if (typeof input.data.transmitIntervalSeconds !== "undefined") {
    definedDownlinkVars += 1;
  }
  if (typeof input.data.factoryReset !== "undefined") {
    definedDownlinkVars += 1;
  }

  if (definedDownlinkVars > 1) {
    throw new Error("Invalid downlink: More than one downlink type defined");
  }

  if (typeof input.data.transmitIntervalSeconds !== "undefined") {
    if (input.data.transmitIntervalSeconds < 60) {
      throw new Error(
        "Invalid downlink: transmit interval cannot be less than 1 min"
      );
    }
    if (input.data.transmitIntervalSeconds > 1800) {
      throw new Error(
        "Invalid downlink: transmit interval cannot be greater than 30 min"
      );
    }

    var transmitInterval1MinDownlinkBytes = [
      0x54, 0x00, 0x00, 0x00, 0x70, 0x42, 0x00, 0x00, 0x00, 0x00,
    ];
    var transmitInterval2MinDownlinkBytes = [
      0x54, 0x00, 0x00, 0x00, 0xf0, 0x42, 0x00, 0x00, 0x00, 0x00,
    ];
    var transmitInterval5MinDownlinkBytes = [
      0x54, 0x00, 0x00, 0x00, 0x96, 0x43, 0x00, 0x00, 0x00, 0x00,
    ];
    var transmitInterval15MinDownlinkBytes = [
      0x54, 0x00, 0x00, 0x00, 0x61, 0x44, 0x00, 0x00, 0x00, 0x00,
    ];
    var transmitInterval30MinDownlinkBytes = [
      0x54, 0x00, 0x00, 0x00, 0xe1, 0x44, 0x00, 0x00, 0x00, 0x00,
    ];

    if (input.data.transmitIntervalSeconds === 60) {
      result.bytes = transmitInterval1MinDownlinkBytes;
    } else if (input.data.transmitIntervalSeconds === 120) {
      result.bytes = transmitInterval2MinDownlinkBytes;
    } else if (input.data.transmitIntervalSeconds === 300) {
      result.bytes = transmitInterval5MinDownlinkBytes;
    } else if (input.data.transmitIntervalSeconds === 900) {
      result.bytes = transmitInterval15MinDownlinkBytes;
    } else if (input.data.transmitIntervalSeconds === 1800) {
      result.bytes = transmitInterval30MinDownlinkBytes;
    } else {
      throw new Error(
        "Invalid downlink: transmit interval is not 1 min, 2 mins, 5 mins, 15 mins or 30 mins"
      );
    }
    return result.bytes;
  }

  if (typeof input.data.factoryReset !== "undefined") {
    var factoryResetDownlinkBytes = [
      0x46, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ];
    if (input.data.factoryReset === true) {
      result.bytes = factoryResetDownlinkBytes;
      return result.bytes;
    } else {
      throw new Error("Invalid downlink: valid factoryReset value is true");
    }
  }

  throw new Error("Invalid downlink: invalid downlink parameter name");
}
