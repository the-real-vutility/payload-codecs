// This version of the index file contains a decodeUplink function that does not use
// the Buffer or ArrayBuffer or TypedArray Classes.
// This version is compatible with ES5
// Due to limitations in ES5, only a limited set of downlink values are permitted.
// Because of this, the decodeDownlink function is not implemented

/**
 * @typedef {Object} DecodedUplink
 * @property {PulseDropDirectData} data - The open JavaScript object representing the decoded uplink payload when no errors occurred
 * @property {string[]} errors - A list of error messages while decoding the uplink payload
 * @property {string[]} warnings - A list of warning messages that do not prevent the driver from decoding the uplink payload
 */

/**
 * Decode uplink
 * @param {Object} input - An object provided by the IoT Flow framework
 * @param {number[]} input.bytes - Array of bytes represented as numbers as it has been sent from the device
 * @param {number} input.fPort - The Port Field on which the uplink has been sent
 * @param {Date} input.recvTime - The uplink message time recorded by the LoRaWAN network server
 * @returns {DecodedUplink} The decoded object
 */
function decodeUplink(input) {
  var result = {
    data: {},
    errors: [],
    warnings: [],
  };
  var rawBytesArray = input.bytes;
  // Uplink payload must be 11 bytes long.
  if (rawBytesArray.length != 11) {
    result.errors.push("Payload length must be 11 bytes");
    delete result.data;
    return result;
  }

  // Packet ID - 1 byte
  var packetId = rawBytesArray[0];
  if (packetId !== 28) {
    result.errors.push("Payload packet ID is not equal to 28");
    delete result.data;
    return result;
  }

  // Constant factors for formulas
  var capacitorVoltageFactor = 5.0 / 255.0;
  var temperatureCelsiusFactor = 120.0 / 255.0;

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

  if (capacitorVoltage < 2.5) {
    result.warnings.push(
      "Low capacitor voltage indicates depleted battery. System may cease operation soon."
    );
  }

  result.data = {
    pulseCount: pulseCount,
    capacitorVoltage: capacitorVoltage,
    temperatureCelsius: temperatureCelsius,
  };

  return result;
}

/**
 * @typedef {Object} EncodedDownlink
 * @property {number[]} bytes - Array of bytes represented as numbers as it will be sent to the device
 * @property {number} fPort - The Port Field on which the downlink must be sent
 * @property {string[]} errors - A list of error messages while encoding the downlink object
 * @property {string[]} warnings - A list of warning messages that do not prevent the driver from encoding the downlink object
 */

/**
 * Downlink encode
 * @param {Object} input - An object provided by the IoT Flow framework
 * @param {Object} input.data - The higher-level object representing your downlink
 * @returns {EncodedDownlink} The encoded object
 */
function encodeDownlink(input) {
  var result = {
    bytes: [],
    errors: [],
    warnings: [],
  };

  var definedDownlinkVars = 0;
  if (typeof input.data.transmitIntervalSeconds !== "undefined") {
    definedDownlinkVars += 1;
  }
  if (typeof input.data.factoryReset !== "undefined") {
    definedDownlinkVars += 1;
  }

  if (definedDownlinkVars > 1) {
    result.errors.push("Invalid downlink: More than one downlink type defined");
    delete result.bytes;
    return result;
  }

  if (typeof input.data.transmitIntervalSeconds !== "undefined") {
    if (input.data.transmitIntervalSeconds < 60) {
      result.errors.push(
        "Invalid downlink: transmit interval cannot be less than 1 min"
      );
      delete result.bytes;
      return result;
    }
    if (input.data.transmitIntervalSeconds > 1800) {
      result.errors.push(
        "Invalid downlink: transmit interval cannot be greater than 30 min"
      );
      delete result.bytes;
      return result;
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
      result.errors.push(
        "Invalid downlink: transmit interval is not 1 min, 2 mins, 5 mins, 15 mins or 30 mins"
      );
      delete result.bytes;
      return result;
    }
    result.fPort = 3;
    return result;
  }

  if (typeof input.data.factoryReset !== "undefined") {
    var factoryResetDownlinkBytes = [
      0x46, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ];
    if (input.data.factoryReset === true) {
      result.bytes = factoryResetDownlinkBytes;
      result.fPort = 3;
      return result;
    } else {
      result.errors.push("Invalid downlink: valid factoryReset value is true");
      delete result.bytes;
      return result;
    }
  }

  result.errors.push("Invalid downlink: invalid downlink parameter name");
  delete result.bytes;
  return result;
}
