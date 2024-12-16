/**
 * @typedef {Object} DecodedUplink
 * @property {HotDropDirectData} data - The open JavaScript object representing the decoded uplink payload when no errors occurred
 */

/**
 * Decode uplink
 * @param {Object} input - An object provided by chirpstack
 * @param {number[]} input.bytes - Array of bytes represented as numbers as it has been sent from the device
 * @param {number} input.fPort - The Port Field on which the uplink has been sent
 * @param {Object} input.variables - Object containing the configured device variables.
 * @returns {DecodedUplink} The decoded object
 */
function decodeUplink(input) {
  let result = {
    data: {},
  };
  const raw = Buffer.from(input.bytes);

  // Uplink payload must be 11 bytes long.
  if (raw.byteLength != 11) {
    throw new Error("Uplink payload must be 11 bytes long. Are you using a HotDrop device?");
  }

  // Packet ID - 1 byte
  const packetId = raw[0];
  if (packetId !== 50) {
    throw new Error("Uplink payload must begin with hex 50 byte. Is this a HotDrop Direct Device?");
  }

  // Constant factors for formulas
  const capacitorVoltageFactor = 5.0 / 255.0;
  const temperatureCelsiusFactor = 120.0 / 255.0;
  const deciToUnitFactor = 0.1;

  // Amp hour accumulation - 4 bytes
  // 32-bit unsigned integer in network byte order (MSB/BE) reported in deci-ampere-hour (dAh)
  const ampHourAccumulationDeciAmpere = raw.readUInt32BE(1);

  // Average amps - 2 bytes
  // 16-bit unsigned integer in network byte order (MSB/BE) reported in deci-ampere (dA),
  // this average represents the entire time since the last transmit (one entire transmit period)
  const averageAmpsDeciAmpere = raw.readUInt16BE(5);

  // Max Offset - 1 byte
  // 8-bit unsigned integer representing the percent offset above the Average amps value.
  const maxOffset = raw[7];

  // Min Offset - 1 byte
  // 8-bit unsigned integer representing the percent offset below the Average amps value.
  const minOffset = raw[8];

  // Capacitor Voltage Scalar - 1 byte
  // 8-bit unsigned integer representing the capacitor voltage.
  // (as if the integer range from 0-255 is scaled to between 0.0V and 5.0V)
  const capacitorVoltageScalar = raw[9];

  // Temperature Scalar
  // 8-bit unsigned integer representing the temperature.
  // (as if the integer range from 0-255 is scaled to between -40C and 80C)
  const temperatureScalar = raw[10];

  // Calculated fields
  const maximumAmpsDeciAmpere =
    averageAmpsDeciAmpere * ((100 + maxOffset) / 100.0);
  const minimumAmpsDeciAmpere =
    averageAmpsDeciAmpere * ((100 - minOffset) / 100.0);
  const capacitorVoltage = capacitorVoltageFactor * capacitorVoltageScalar;
  const temperatureCelsius = temperatureCelsiusFactor * temperatureScalar - 40;

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
 * @param {Object} input.variables - Object containing the configured device variables.
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
    throw new Error("Invalid downlink: More than one downlink type defined");
  }

  if (typeof input.data.transmitIntervalSeconds !== "undefined") {
    if (input.data.transmitIntervalSeconds < 60) {
      throw new Error("Invalid downlink: transmit interval cannot be less than 1 min");
    }
    if (input.data.transmitIntervalSeconds > 1800) {
      throw new Error("Invalid downlink: transmit interval cannot be greater than 30 min");
    }
    var downlink = Buffer.alloc(10);
    downlink.writeUInt16LE(0x0054, 0);
    downlink.writeFloatLE(input.data.transmitIntervalSeconds, 2);
    downlink.writeFloatLE(0, 6);
    result.bytes = Array.from(new Uint8Array(downlink.buffer));
    return result;
  }

  if (typeof input.data.measurementIntervalMs !== "undefined") {
    if (input.data.measurementIntervalMs < 200) {
      throw new Error("Invalid downlink: measurement interval cannot be less than 200 ms");
    }
    if (input.data.measurementIntervalMs > 10000) {
      throw new Error("Invalid downlink: measurement interval cannot be greater than 10000 ms");
    }

    var downlink = Buffer.alloc(10);
    downlink.writeUInt16LE(0x004d, 0);
    downlink.writeFloatLE(input.data.measurementIntervalMs, 2);
    downlink.writeFloatLE(0, 6);
    result.bytes = Array.from(new Uint8Array(downlink.buffer));
    return result;
  }

  if (typeof input.data.lowPowerThreshold !== "undefined") {
    var lowPowerTolerance = 0.000001;
    // Have leniant lower tolerance due to floating point
    if (input.data.lowPowerThreshold + lowPowerTolerance < 2.1) {
      throw new Error("Invalid downlink: low power threshold cannot be less than 2.1 v");
    }
    // Have leniant upper tolerance due to floating point
    if (input.data.lowPowerThreshold - lowPowerTolerance > 3.9) {
      throw new Error("Invalid downlink: low power threshold cannot be greater than 3.9 v");
    }

    var downlink = Buffer.alloc(10);
    downlink.writeUInt16LE(0x0050, 0);
    downlink.writeFloatLE(input.data.lowPowerThreshold, 2);
    downlink.writeFloatLE(0, 6);
    result.bytes = Array.from(new Uint8Array(downlink.buffer));
    return result;
  }

  if (typeof input.data.factoryReset !== "undefined") {
    if (input.data.factoryReset === true) {
      result.bytes = [
        0x46, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      ];
      return result;
    } else {
      throw new Error("Invalid downlink: valid factoryReset value is true");
    }
  }

  throw new Error("Invalid downlink: invalid downlink parameter name");
}

exports.decodeUplink = decodeUplink;
exports.encodeDownlink = encodeDownlink;
