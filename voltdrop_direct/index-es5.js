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
  var packetList = {
    VD_DIRECT_VOLTAGE_PF        : 40,
    VD_DIRECT_AMPERAGE          : 41,
    VD_DIRECT_ACT_ENERGY_CONF   : 42,
    VD_DIRECT_ACT_ENERGY_UNCONF : 43,
    VD_DIRECT_APP_ENERGY_CONF   : 44,
    VD_DIRECT_APP_ENERGY_UNCONF : 45,
  };

  // Constant factors for formulas
  var capacitorVoltageFactor = 5.0 / 255.0;
  var temperatureCelsiusFactor = 120.0 / 255.0;

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
  switch (packetId) {
    case packetList.VD_DIRECT_VOLTAGE_PF:
      result.data = {
        // Average Phase Voltages - 2 bytes each
        // 16-bit unsigned integers in network byte order (MSB/BE) with 10 integer and 6 fractional bits
        voltageL1: (((rawBytesArray[1] << 8) + rawBytesArray[2]) >>> 0) / 64.0,
        voltageL2: (((rawBytesArray[3] << 8) + rawBytesArray[4]) >>> 0) / 64.0,
        voltageL3: (((rawBytesArray[5] << 8) + rawBytesArray[6]) >>> 0) / 64.0,
        // Phase Power Factors - 1 byte each, 8-bit signed integers as percentage
        powerFactorL1: rawBytesArray[7] << 24 >> 24,
        powerFactorL2: rawBytesArray[8] << 24 >> 24,
        powerFactorL3: rawBytesArray[9] << 24 >> 24,
        // Capacitor Voltage Scalar - 1 byte
        // 8-bit unsigned integer representing the capacitor voltage.
        // (as if the integer range from 0-255 is scaled to between 0.0V and 5.0V)
        capacitorVoltage: rawBytesArray[10] * capacitorVoltageFactor
      };
      if (result.data.capacitorVoltage < 3.4) {
        result.warnings.push("Low capacitor voltage may reduce transmit interval.");
      }
    break;
    case packetList.VD_DIRECT_AMPERAGE:
      let currentL1 = (((rawBytesArray[1] << 8) + rawBytesArray[2]) >>> 0) / 16.0;
      let currentL2 = (((rawBytesArray[3] << 8) + rawBytesArray[4]) >>> 0) / 16.0;
      let currentL3 = (((rawBytesArray[5] << 8) + rawBytesArray[6]) >>> 0) / 16.0;
      result.data = {
        // Average Phase Current - 2 bytes each
        // 16-bit unsigned integers in network byte order (MSB/BE) with 12 integer and 4 fractional bits
        currentL1: currentL1,
        currentL2: currentL2,
        currentL3: currentL3,
        // Maximum Phase Current - 1 byte each
        // 8-bit unsigned integer with 3 integer and 5 fractional bits (expressed as percentage in addition to 100%)
        maxCurrentL1: (rawBytesArray[7] / 32.0 + 1.0) * currentL1,
        maxCurrentL2: (rawBytesArray[8] / 32.0 + 1.0) * currentL2,
        maxCurrentL3: (rawBytesArray[9] / 32.0 + 1.0) * currentL3,
        // Temperature Scalar
        // 8-bit unsigned integer representing the temperature.
        // (as if the integer range from 0-255 is scaled to between -40C and 80C)
        temperatureCelsius: rawBytesArray[10] * temperatureCelsiusFactor - 40.0
      };
    break;
    case packetList.VD_DIRECT_ACT_ENERGY_CONF: // Intentional fall-through
    case packetList.VD_DIRECT_ACT_ENERGY_UNCONF:
      result.data = {
        // Total Forward Active Energy - 8 bytes
        // Sum of all phases active energy accumulated in Watt-Hours since last factory reset downlink.
        // 64-bit unsigned integer in network byte order (MSB/BE)
        //
        // NOTE: Due to the limitations of Javascript and JSON this codec only uses 2^53 bits
        // This still gives an effective range of 102,821 years at 10 Mega-Watts which is more than the
        // Voltdrop is reasonably capable of measuring.
        // Javascript cannot handle bit-shifts above 16 without truncation so they have been replaced by
        // equivalent multipliers. rawBytesArray[1] is above the 53-bit limit and intentionally ignored.
        activeEnergyAccumulation: (((rawBytesArray[2] & 0x1F) * 281474976710656) +
                                    (rawBytesArray[3] * 1099511627776) +
                                    (rawBytesArray[4] * 4294967296) +
                                    (rawBytesArray[5] * 16777216) +
                                    (rawBytesArray[6] << 16) +
                                    (rawBytesArray[7] << 8) +
                                     rawBytesArray[8]),
        // Average Power Factor over all Phases - 2 bytes
        // 16-bit signed integer in network byte order (MSB/BE) expressed as percentage with 8 integer and 7 fractional bits
        averagePowerFactor: (((rawBytesArray[9] << 8) + rawBytesArray[10]) << 16 >> 16) / 128.0,
      };
    break;
    case packetList.VD_DIRECT_APP_ENERGY_CONF: // Intentional fall-through
    case packetList.VD_DIRECT_APP_ENERGY_UNCONF:
      result.data = {
        // Total Forward Active Energy - 8 bytes
        // Sum of all phases apparent energy accumulated in Volt-Amps since last factory reset downlink.
        // 64-bit unsigned integer in network byte order (MSB/BE)
        //
        // NOTE: See info about activeEnergyAccumulation and 53 bit numeric limitation
        apparentEnergyAccumulation:  (((rawBytesArray[2] & 0x1F) * 281474976710656) +
                                       (rawBytesArray[3] * 1099511627776) +
                                       (rawBytesArray[4] * 4294967296) +
                                       (rawBytesArray[5] * 16777216) +
                                       (rawBytesArray[6] << 16) +
                                       (rawBytesArray[7] << 8) +
                                        rawBytesArray[8]),
        // Average Power Factor over all Phases - 2 bytes
        // 16-bit signed integer in network byte order (MSB/BE) expressed as percentage with 8 integer and 7 fractional bits
        averagePowerFactor: (((rawBytesArray[9] << 8) + rawBytesArray[10]) << 16 >> 16) / 128.0,
      };
    break;
    default:
      result.errors.push("Unsupported packet ID");
      delete result.data;
      return result;
  }
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
  if (typeof input.data.packetTransmitSchedule !== "undefined") {
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
      0x31, 0x00, 0x00, 0x00, 0x70, 0x42, 0x00, 0x00, 0x00, 0x00,
    ];
    var transmitInterval2MinDownlinkBytes = [
      0x31, 0x00, 0x00, 0x00, 0xf0, 0x42, 0x00, 0x00, 0x00, 0x00,
    ];
    var transmitInterval5MinDownlinkBytes = [
      0x31, 0x00, 0x00, 0x00, 0x96, 0x43, 0x00, 0x00, 0x00, 0x00,
    ];
    var transmitInterval15MinDownlinkBytes = [
      0x31, 0x00, 0x00, 0x00, 0x61, 0x44, 0x00, 0x00, 0x00, 0x00,
    ];
    var transmitInterval30MinDownlinkBytes = [
      0x31, 0x00, 0x00, 0x00, 0xe1, 0x44, 0x00, 0x00, 0x00, 0x00,
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

exports.decodeUplink = decodeUplink;
exports.encodeDownlink = encodeDownlink;
