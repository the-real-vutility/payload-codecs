/**
 * @typedef {Object} DecodedUplink
 * @property {VoltDropDirectData} data - The open JavaScript object representing the decoded uplink payload when no errors occurred
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
  const packetList = {
    VD_DIRECT_CONSOLIDATED_VOLTAGE_AMPERAGE: 38,
    VD_DIRECT_VOLTAGE_ANGLE: 39,
    VD_DIRECT_VOLTAGE_PF: 40,
    VD_DIRECT_AMPERAGE: 41,
    VD_DIRECT_ACT_ENERGY_CONF: 42,
    VD_DIRECT_ACT_ENERGY_UNCONF: 43,
    VD_DIRECT_APP_ENERGY_CONF: 44,
    VD_DIRECT_APP_ENERGY_UNCONF: 45,
    VD_DIRECT_STARTUP_DIAG: 46,
    VD_DIRECT_OPERATIONAL_DIAG: 47,
  };

  // Constant factors for formulas
  const phaseAngleFactor = 360.0 / 255.0;
  const capacitorVoltageFactor = 5.0 / 255.0;
  const temperatureCelsiusFactor = 120.0 / 255.0;

  let result = {
    data: {},
    errors: [],
    warnings: [],
  };
  const raw = Buffer.from(input.bytes);

  // Packet must minimally contain an ID byte
  if (raw.byteLength != 0) {
    const packetId = raw[0];
    switch (packetId) {
      // The consolidated packet is larger than typical
      case packetList.VD_DIRECT_CONSOLIDATED_VOLTAGE_AMPERAGE:
        expectedLength = 21;
        break;
      default: // All other packets are currently 11 bytes long
        expectedLength = 11;
      break;
    }

    if (raw.byteLength != expectedLength) {
      result.errors.push("Invalid payload length for data type");
      delete result.data;
      return result;
    }
 } else {
    result.errors.push("Empty payload");
    delete result.data;
    return result;
 }

  // Packet ID - 1 byte
  const packetId = raw[0];
  switch (packetId) {
    case packetList.VD_DIRECT_CONSOLIDATED_VOLTAGE_AMPERAGE: {
      let currentL1 = raw.readUInt16BE(11) / 16.0;
      let currentL2 = raw.readUInt16BE(13) / 16.0;
      let currentL3 = raw.readUInt16BE(15) / 16.0;
      result.data = {
        // Average Phase Voltages - 2 bytes each
        // 16-bit unsigned integers in network byte order (MSB/BE) with 10 integer and 6 fractional bits
        voltageL1: raw.readUInt16BE(1) / 64.0,
        voltageL2: raw.readUInt16BE(3) / 64.0,
        voltageL3: raw.readUInt16BE(5) / 64.0,
        // Phase Angle Scalars - 1 byte each
        // 8-bit unsigned integer representing the phase angle between voltage and current.
        // (as if the integer range from 0-255 is scaled to between 0° and 358.59375°)
        phaseAngleL1: raw[7] * phaseAngleFactor,
        phaseAngleL2: raw[8] * phaseAngleFactor,
        phaseAngleL3: raw[9] * phaseAngleFactor,
        // Capacitor Voltage Scalar - 1 byte
        // 8-bit unsigned integer representing the capacitor voltage.
        // (as if the integer range from 0-255 is scaled to between 0.0V and 5.0V)
        capacitorVoltage: raw[10] * capacitorVoltageFactor,
        // Average Phase Current - 2 bytes each
        // 16-bit unsigned integers in network byte order (MSB/BE) with 12 integer and 4 fractional bits
        currentL1: currentL1,
        currentL2: currentL2,
        currentL3: currentL3,
        // Maximum Phase Current - 1 byte each
        // 8-bit unsigned integer with 3 integer and 5 fractional bits (expressed as percentage in addition to 100%)
        maxCurrentL1: (raw[17] / 32.0 + 1.0) * currentL1,
        maxCurrentL2: (raw[18] / 32.0 + 1.0) * currentL2,
        maxCurrentL3: (raw[19] / 32.0 + 1.0) * currentL3,
        // Temperature Scalar
        // 8-bit unsigned integer representing the temperature.
        // (as if the integer range from 0-255 is scaled to between -40C and 80C)
        temperatureCelsius: raw[20] * temperatureCelsiusFactor - 40.0,
      };
      break;
    }
    case packetList.VD_DIRECT_VOLTAGE_ANGLE:
      result.data = {
        // Average Phase Voltages - 2 bytes each
        // 16-bit unsigned integers in network byte order (MSB/BE) with 10 integer and 6 fractional bits
        voltageL1: raw.readUInt16BE(1) / 64.0,
        voltageL2: raw.readUInt16BE(3) / 64.0,
        voltageL3: raw.readUInt16BE(5) / 64.0,
        // Phase Angle Scalars - 1 byte each
        // 8-bit unsigned integer representing the phase angle between voltage and current.
        // (as if the integer range from 0-255 is scaled to between 0° and 358.59375°)
        phaseAngleL1: raw[7] * phaseAngleFactor,
        phaseAngleL2: raw[8] * phaseAngleFactor,
        phaseAngleL3: raw[9] * phaseAngleFactor,
        // Capacitor Voltage Scalar - 1 byte
        // 8-bit unsigned integer representing the capacitor voltage.
        // (as if the integer range from 0-255 is scaled to between 0.0V and 5.0V)
        capacitorVoltage: raw[10] * capacitorVoltageFactor,
      };
      break;
    case packetList.VD_DIRECT_VOLTAGE_PF:
      result.data = {
        // Average Phase Voltages - 2 bytes each
        // 16-bit unsigned integers in network byte order (MSB/BE) with 10 integer and 6 fractional bits
        voltageL1: raw.readUInt16BE(1) / 64.0,
        voltageL2: raw.readUInt16BE(3) / 64.0,
        voltageL3: raw.readUInt16BE(5) / 64.0,
        // Phase Power Factors - 1 byte each, 8-bit signed integers as percentage
        powerFactorL1: raw.readInt8(7),
        powerFactorL2: raw.readInt8(8),
        powerFactorL3: raw.readInt8(9),
        // Capacitor Voltage Scalar - 1 byte
        // 8-bit unsigned integer representing the capacitor voltage.
        // (as if the integer range from 0-255 is scaled to between 0.0V and 5.0V)
        capacitorVoltage: raw[10] * capacitorVoltageFactor,
      };
      break;
    case packetList.VD_DIRECT_AMPERAGE: {
      let currentL1 = raw.readUInt16BE(1) / 16.0;
      let currentL2 = raw.readUInt16BE(3) / 16.0;
      let currentL3 = raw.readUInt16BE(5) / 16.0;
      result.data = {
        // Average Phase Current - 2 bytes each
        // 16-bit unsigned integers in network byte order (MSB/BE) with 12 integer and 4 fractional bits
        currentL1: currentL1,
        currentL2: currentL2,
        currentL3: currentL3,
        // Maximum Phase Current - 1 byte each
        // 8-bit unsigned integer with 3 integer and 5 fractional bits (expressed as percentage in addition to 100%)
        maxCurrentL1: (raw[7] / 32.0 + 1.0) * currentL1,
        maxCurrentL2: (raw[8] / 32.0 + 1.0) * currentL2,
        maxCurrentL3: (raw[9] / 32.0 + 1.0) * currentL3,
        // Temperature Scalar
        // 8-bit unsigned integer representing the temperature.
        // (as if the integer range from 0-255 is scaled to between -40C and 80C)
        temperatureCelsius: raw[10] * temperatureCelsiusFactor - 40.0,
      };
      break;
    }
    case packetList.VD_DIRECT_ACT_ENERGY_CONF: // Intentional fall-through
    case packetList.VD_DIRECT_ACT_ENERGY_UNCONF:
      result.data = {
        // Total Forward Active Energy - 8 bytes
        // Sum of all phases active energy accumulated in Watt-Hours since last factory reset downlink.
        // 64-bit signed integer in network byte order (MSB/BE)
        //
        // NOTE: Due to the limitations of Javascript and JSON this codec only uses 53 bits
        // (max of standard number type) This still gives an effective range of 102,821 years
        // at 10 Mega-Watts which is more than the Voltdrop is reasonably capable of measuring.
        activeEnergyAccumulation: Number(
          BigInt.asIntN(53, raw.readBigInt64BE(1))
        ),
        // Average Power Factor over all Phases - 2 bytes
        // 16-bit signed integer in network byte order (MSB/BE) expressed as percentage with 8 integer and 7 fractional bits
        averagePowerFactor: raw.readInt16BE(9) / 128.0,
      };
      break;
    case packetList.VD_DIRECT_APP_ENERGY_CONF: // Intentional fall-through
    case packetList.VD_DIRECT_APP_ENERGY_UNCONF:
      result.data = {
        // Total Forward Active Energy - 8 bytes
        // Sum of all phases active energy accumulated in Watt-Hours since last factory reset downlink.
        // 64-bit unsigned integer in network byte order (MSB/BE)
        //
        // NOTE: See info about activeEnergyAccumulation and 53 bit numeric limitation
        apparentEnergyAccumulation: Number(
          BigInt.asUintN(53, raw.readBigUInt64BE(1))
        ),
        // Average Power Factor over all Phases - 2 bytes
        // 16-bit signed integer in network byte order (MSB/BE) expressed as percentage with 8 integer and 7 fractional bits
        averagePowerFactor: raw.readInt16BE(9) / 128.0,
      };
      break;
    case packetList.VD_DIRECT_STARTUP_DIAG:
      let resetReason = "Invalid";
      switch (raw.readUInt8(1)) {
        case 0:
          resetReason = "Power Loss";
          break;
        case 1:
          resetReason = "Hardware Reset";
          break;
        case 2:
          resetReason = "Watchdog Timer";
          break;
        case 3:
          resetReason = "Unknown Software Request";
          break;
        case 4:
          resetReason = "CPU Lock-Up";
          break;
        case 5:
          resetReason = "Hard-Fault";
          break;
        case 6:
          resetReason = "Application Request";
          break;
        case 7:
          resetReason = "Factory Reset";
          break;
        case 8:
          resetReason = "Reader Non-Responsive";
          break;
        case 9:
          resetReason = "Failed Link-Check";
          break;
        case 10:
          resetReason = "Assertion Failure";
          break;
      }
      // Format hashes to hexadecimal and pad to correct length if leading zeroes are needed
      let coreFirmwareHash = raw.readUInt32BE(2).toString(16).toUpperCase();
      coreFirmwareHash =
        "0".repeat(Math.max(0, 8 - coreFirmwareHash.length)) + coreFirmwareHash;
      let readerFirmwareHash = raw.readUInt16BE(6).toString(16).toUpperCase();
      readerFirmwareHash =
        "0".repeat(Math.max(0, 4 - readerFirmwareHash.length)) +
        readerFirmwareHash;
      result.data = {
        resetReason: resetReason,
        coreFirmwareHash: "0x" + coreFirmwareHash,
        readerFirmwareHash: "0x" + readerFirmwareHash,
      };
      break;
    case packetList.VD_DIRECT_OPERATIONAL_DIAG:
      const systemErrorConditionsList = [
        "Invalid Downlink",
        "Core Voltage Drop",
        "EEPROM Fail",
        "Reader Timeout",
        "Reader NACK",
        "Reader Overvoltage",
        "Reader Not Calibrated",
        "Phase Sequence Error",
        "Transmit Duty-Cycle Restricted",
      ];
      let rawErrorConditions = raw.readUInt16BE(1);
      let systemErrorConditions = [];
      for (let idx = 0; idx < systemErrorConditionsList.length; idx++) {
        if (rawErrorConditions & (1 << idx)) {
          systemErrorConditions.push(systemErrorConditionsList[idx]);
        }
      }
      result.data = {
        systemErrorConditions: systemErrorConditions,
        registerID: "0x" + raw.readUInt16BE(3).toString(16).toUpperCase(),
      };
      break;
    default:
      result.errors.push("Unsupported packet ID");
      delete result.data;
      return result;
  }
  return result;
}

// Handler
exports.handler = async function (event, context) {
  var input_base64 = event.PayloadData;
  var input_fPort = event.WirelessMetadata.LoRaWAN.FPort;

  console.log("Parsing payload: " + input_base64);

  let bytes = [...Buffer.from(input_base64, "base64")];

  try {
    var decoded = decodeUplink({
      bytes: bytes,
      fPort: input_fPort,
      recvTime: null,
    });

    // Check if decoder has returned any errors
    if (decoded.errors.length > 0) {
      console.log("Error decoding:" + decoded.errors);
      throw "Error decoding:" + decoded.errors;
    }

    result = decoded.data;
    result.status = 200;
    console.log("Returning result " + JSON.stringify(result));

    return result;
  } catch (e) {
    // Perform exception handling
    console.log(e);

    result = {
      status: 500,
      errorMessage: e,
    };
    return result;
  }
};
