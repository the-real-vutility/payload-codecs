// This version of the index file contains a decodeUplink function that does not use
// the Buffer or ArrayBuffer or TypedArray Classes.
// This version is compatible with ES5
// Due to limitations in ES5, only a limited set of downlink values are permitted.
// Because of this, the decodeDownlink function is not implemented

/**
 * @typedef {Object} DecodedUplink
 * @property {HotDropDirectData} data - The open JavaScript object representing the decoded uplink payload when no errors occurred
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
  if (packetId !== 50) {
    result.errors.push("Payload packet ID is not equal to 50");
    delete result.data;
    return result;
  }

  // Constant factors for formulas
  var capacitorVoltageFactor = 5.0 / 255.0;
  var temperatureCelsiusFactor = 120.0 / 255.0;
  var deciToUnitFactor = 0.1;

  // Amp hour accumulation - 4 bytes
  // 32-bit unsigned integer in network byte order (MSB/BE) reported in deci-ampere-hour (dAh)
  var ampHourAccumulationDeciAmpere =
    ((rawBytesArray[1] << 24) +
      (rawBytesArray[2] << 16) +
      (rawBytesArray[3] << 8) +
      rawBytesArray[4]) >>>
    0;

  // Average amps - 2 bytes
  // 16-bit unsigned integer in network byte order (MSB/BE) reported in deci-ampere (dA),
  // this average represents the entire time since the last transmit (one entire transmit period)
  var averageAmpsDeciAmpere =
    ((rawBytesArray[5] << 8) + rawBytesArray[6]) >>> 0;

  // Max Offset - 1 byte
  // 8-bit unsigned integer representing the percent offset above the Average amps value.
  var maxOffset = rawBytesArray[7];

  // Min Offset - 1 byte
  // 8-bit unsigned integer representing the percent offset below the Average amps value.
  var minOffset = rawBytesArray[8];

  // Capacitor Voltage Scalar - 1 byte
  // 8-bit unsigned integer representing the capacitor voltage.
  // (as if the integer range from 0-255 is scaled to between 0.0V and 5.0V)
  var capacitorVoltageScalar = rawBytesArray[9];

  // Temperature Scalar
  // 8-bit unsigned integer representing the temperature.
  // (as if the integer range from 0-255 is scaled to between -40C and 80C)
  var temperatureScalar = rawBytesArray[10];

  // Calculated fields
  var maximumAmpsDeciAmpere =
    averageAmpsDeciAmpere * ((100 + maxOffset) / 100.0);
  var minimumAmpsDeciAmpere =
    averageAmpsDeciAmpere * ((100 - minOffset) / 100.0);
  var capacitorVoltage = capacitorVoltageFactor * capacitorVoltageScalar;
  var temperatureCelsius = temperatureCelsiusFactor * temperatureScalar - 40;

  if (minimumAmpsDeciAmpere < 0) {
    result.warnings.push("Minimum amps is less than 0.");
  }
  if (capacitorVoltage < 3.4) {
    result.warnings.push("Low capacitor voltage may reduce transmit interval.");
  }

  result.data = {
    ampHourAccumulation: ampHourAccumulationDeciAmpere * deciToUnitFactor,
    averageAmps: averageAmpsDeciAmpere * deciToUnitFactor,
    maximumAmps: maximumAmpsDeciAmpere * deciToUnitFactor,
    minimumAmps: minimumAmpsDeciAmpere * deciToUnitFactor,
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
  if (typeof input.data.measurementIntervalMs !== "undefined") {
    definedDownlinkVars += 1;
  }
  if (typeof input.data.lowPowerThreshold !== "undefined") {
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

  if (typeof input.data.measurementIntervalMs !== "undefined") {
    if (input.data.measurementIntervalMs < 200) {
      result.errors.push(
        "Invalid downlink: measurement interval cannot be less than 200 ms"
      );
      delete result.bytes;
      return result;
    }
    if (input.data.measurementIntervalMs > 10000) {
      result.errors.push(
        "Invalid downlink: measurement interval cannot be greater than 10000 ms"
      );
      delete result.bytes;
      return result;
    }

    var measurementInterval200MsDownlinkBytes = [
      0x4d, 0x00, 0x00, 0x00, 0x48, 0x43, 0x00, 0x00, 0x00, 0x00,
    ];
    var measurementInterval500MsDownlinkBytes = [
      0x4d, 0x00, 0x00, 0x00, 0xfa, 0x43, 0x00, 0x00, 0x00, 0x00,
    ];
    var measurementInterval1000MsDownlinkBytes = [
      0x4d, 0x00, 0x00, 0x00, 0x7a, 0x44, 0x00, 0x00, 0x00, 0x00,
    ];
    var measurementInterval2000MsDownlinkBytes = [
      0x4d, 0x00, 0x00, 0x00, 0xfa, 0x44, 0x00, 0x00, 0x00, 0x00,
    ];
    var measurementInterval10000MsDownlinkBytes = [
      0x4d, 0x00, 0x00, 0x40, 0x1c, 0x46, 0x00, 0x00, 0x00, 0x00,
    ];

    if (input.data.measurementIntervalMs === 200) {
      result.bytes = measurementInterval200MsDownlinkBytes;
    } else if (input.data.measurementIntervalMs === 500) {
      result.bytes = measurementInterval500MsDownlinkBytes;
    } else if (input.data.measurementIntervalMs === 1000) {
      result.bytes = measurementInterval1000MsDownlinkBytes;
    } else if (input.data.measurementIntervalMs === 2000) {
      result.bytes = measurementInterval2000MsDownlinkBytes;
    } else if (input.data.measurementIntervalMs === 10000) {
      result.bytes = measurementInterval10000MsDownlinkBytes;
    } else {
      result.errors.push(
        "Invalid downlink: measurement interval is not 200 ms, 500 ms, 1000 ms, 2000 ms, 10000 ms"
      );
      delete result.bytes;
      return result;
    }

    result.fPort = 3;
    return result;
  }

  if (typeof input.data.lowPowerThreshold !== "undefined") {
    var lowPowerTolerance = 0.000001;
    // Have leniant lower tolerance due to floating point
    if (input.data.lowPowerThreshold + lowPowerTolerance < 1.8) {
      result.errors.push(
        "Invalid downlink: low power threshold cannot be less than 1.8 v"
      );
      delete result.bytes;
      return result;
    }
    // Have leniant upper tolerance due to floating point
    if (input.data.lowPowerThreshold - lowPowerTolerance > 3.9) {
      result.errors.push(
        "Invalid downlink: low power threshold cannot be greater than 3.9 v"
      );
      delete result.bytes;
      return result;
    }

    var lowPowerThreshold3dot9VDownlinkBytes = [
      0x50, 0x00, 0x9a, 0x99, 0x79, 0x40, 0x00, 0x00, 0x00, 0x00,
    ];
    var lowPowerThreshold3dot4VDownlinkBytes = [
      0x50, 0x00, 0x9a, 0x99, 0x59, 0x40, 0x00, 0x00, 0x00, 0x00,
    ];
    var lowPowerThreshold2dot1VDownlinkBytes = [
      0x50, 0x00, 0x66, 0x66, 0x06, 0x40, 0x00, 0x00, 0x00, 0x00,
    ];
    var lowPowerThreshold1dot8VDownlinkBytes = [
      0x50, 0x00, 0x66, 0x66, 0xe6, 0x3f, 0x00, 0x00, 0x00, 0x00,
    ];

    if (
      input.data.lowPowerThreshold > 3.9 - lowPowerTolerance &&
      input.data.lowPowerThreshold < 3.9 + lowPowerTolerance
    ) {
      result.bytes = lowPowerThreshold3dot9VDownlinkBytes;
    } else if (
      input.data.lowPowerThreshold > 3.4 - lowPowerTolerance &&
      input.data.lowPowerThreshold < 3.4 + lowPowerTolerance
    ) {
      result.bytes = lowPowerThreshold3dot4VDownlinkBytes;
    } else if (
      input.data.lowPowerThreshold > 2.1 - lowPowerTolerance &&
      input.data.lowPowerThreshold < 2.1 + lowPowerTolerance
    ) {
      result.bytes = lowPowerThreshold2dot1VDownlinkBytes;
    } else if (
      input.data.lowPowerThreshold > 1.8 - lowPowerTolerance &&
      input.data.lowPowerThreshold < 1.8 + lowPowerTolerance
    ) {
      result.bytes = lowPowerThreshold1dot8VDownlinkBytes;
    } else {
      result.errors.push(
        "Invalid downlink: low power threshold is not 3.9, 3.4, 2.1, or 1.8"
      );
      delete result.bytes;
      return result;
    }
    result.fPort = 3;
    return result;
  }

  if (typeof input.data.factoryReset !== "undefined") {
    var factoryResetDownlinkBytes = [
      0x5a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
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

exports.decodeUplink = decodeUplink;
exports.encodeDownlink = encodeDownlink;
