/**
 * @typedef {Object} DecodedUplink
 * @property {VoltDropDirectData} data - The open JavaScript object representing the decoded uplink payload when no errors occurred
 */

/**
 * Decode uplink
 * @param {Object} input - An object provided by the IoT Flow framework
 * @param {number[]} input.bytes - Array of bytes represented as numbers as it has been sent from the device
 * @param {number} input.fPort - The Port Field on which the uplink has been sent
 * @property {Object} variables - Object containing the configured device variable
 * @returns {DecodedUplink} The decoded object
 */
function decodeUplink(input) {
  const packetList = {
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
  const capacitorVoltageFactor = 5.0 / 255.0;
  const temperatureCelsiusFactor = 120.0 / 255.0;

  let result = {
    data: {},
  };
  const raw = Buffer.from(input.bytes);

  // Uplink payload must be 11 bytes long.
  if (raw.byteLength != 11) {
    throw new Error("Payload length must be 11 bytes");
  }

  // Packet ID - 1 byte
  const packetId = raw[0];
  switch (packetId) {
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
    case packetList.VD_DIRECT_AMPERAGE:
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
    case packetList.VD_DIRECT_ACT_ENERGY_CONF: // Intentional fall-through
    case packetList.VD_DIRECT_ACT_ENERGY_UNCONF:
      result.data = {
        // Total Forward Active Energy - 8 bytes
        // Sum of all phases active energy accumulated in Watt-Hours since last factory reset downlink.
        // 64-bit unsigned integer in network byte order (MSB/BE)
        //
        // NOTE: Due to the limitations of Javascript and JSON this codec only uses 53 bits
        // (max of standard number type) This still gives an effective range of 102,821 years
        // at 10 Mega-Watts which is more than the Voltdrop is reasonably capable of measuring.
        // Test and truncate the BigInt type into a normal number for JSON compatibility to the
        // ES5 version of the codec.
        activeEnergyAccumulation: Number(
          BigInt.asUintN(53, raw.readBigUInt64BE(1))
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
      throw new Error("Unsupported packet ID");
  }
  return result;
}

/**
 * @typedef {Object} EncodedDownlink
 * @property {number[]} bytes - Array of bytes represented as numbers as it will be sent to the device
 */

/**
 * Downlink encode
 * @param {Object} input - An object provided by the IoT Flow framework
 * @param {Object} input.data - The higher-level object representing your downlink
 * @property {Object} variables - Object containing the configured device variable
 * @returns {EncodedDownlink} The encoded object
 */
function encodeDownlink(input) {
  let result = {
    bytes: [],
  };

  let definedDownlinkVars = 0;
  if (typeof input.data.transmitIntervalSeconds !== "undefined") {
    definedDownlinkVars += 1;
  }
  if (typeof input.data.packetTransmitSchedule !== "undefined") {
    definedDownlinkVars += 1;
  }
  if (typeof input.data.factoryReset !== "undefined") {
    definedDownlinkVars += 1;
  }
  if (typeof input.data.softReset !== "undefined") {
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
    let downlink = Buffer.alloc(6);
    downlink.writeUInt16BE(0x0031, 0);
    downlink.writeUInt32BE(input.data.transmitIntervalSeconds, 2);
    result.bytes = Array.from(new Uint8Array(downlink.buffer));
    return result;
  }

  if (typeof input.data.packetTransmitSchedule !== "undefined") {
    if (input.data.packetTransmitSchedule.length < 1) {
      throw new Error(
        "Invalid downlink: Packet transmit schedule must contain at least one element"
      );
    }
    if (input.data.packetTransmitSchedule.length > 60) {
      throw new Error(
        "Invalid downlink: Packet transmit schedule cannot be longer than 60 elements"
      );
    }

    const validIDList = [0, 40, 41, 42, 43, 44, 45];
    let scheduleValid = false;
    let downlink = Buffer.alloc(input.data.packetTransmitSchedule.length + 3);
    downlink.writeUInt16BE(0x0030, 0);
    downlink.writeUInt8(input.data.packetTransmitSchedule.length, 2);
    for (
      let index = 0;
      index < input.data.packetTransmitSchedule.length;
      index++
    ) {
      let id = input.data.packetTransmitSchedule[index];
      if (!validIDList.includes(id)) {
        downlink.writeUInt8(0, index + 3);
      } else {
        downlink.writeUInt8(id, index + 3);
        if (id != 0) {
          // Enforce that there is at least one non-gap packet in schedule
          scheduleValid = true;
        }
      }
    }

    if (scheduleValid) {
      result.bytes = Array.from(new Uint8Array(downlink.buffer));
    } else {
      throw new Error(
        "Invalid downlink: Packet transmit schedule must contain at least one transmitting element"
      );
    }
    return result;
  }

  if (typeof input.data.factoryReset !== "undefined") {
    if (input.data.factoryReset === true) {
      result.bytes = [0x00, 0x46];
      return result;
    } else {
      throw new Error("Invalid downlink: valid factoryReset value is true");
    }
  }

  if (typeof input.data.softReset !== "undefined") {
    if (input.data.softReset === true) {
      result.bytes = [0x00, 0x5a];
      return result;
    } else {
      throw new Error("Invalid downlink: valid softReset value is true");
    }
  }

  throw new Error("Invalid downlink: invalid downlink parameter name");
}
