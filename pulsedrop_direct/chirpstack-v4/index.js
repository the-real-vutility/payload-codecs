/**
 * @typedef {Object} DecodedUplink
 * @property {PulseDropDirectData} data - The open JavaScript object representing the decoded uplink payload when no errors occurred
 */

/**
 * Decode uplink
 * @param {Object} input - An object provided by the IoT Flow framework
 * @param {number[]} input.bytes - Array of bytes represented as numbers as it has been sent from the device
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
    throw new Error("Payload length must be 11 bytes");
  }

  // Packet ID - 1 byte
  const packetId = raw[0];
  if (packetId !== 28) {
    throw new Error("Payload packet ID is not equal to 28");
  }

  // Constant factors for formulas
  const capacitorVoltageFactor = 5.0 / 255.0;
  const temperatureCelsiusFactor = 120.0 / 255.0;

  // Capacitor Voltage Scalar - 1 byte
  // 8-bit unsigned integer representing the capacitor voltage.
  // (as if the integer range from 0-255 is scaled to between 0.0V and 5.0V)
  const capacitorVoltageScalar = raw[1];

  // Temperature Scalar
  // 8-bit unsigned integer representing the temperature.
  // (as if the integer range from 0-255 is scaled to between -40C and 80C)
  const temperatureScalar = raw[2];

  // Pulse Count - 4 bytes
  // 32-bit unsigned integer in network byte order (MSB/BE)
  const pulseCount = raw.readUInt32BE(3);

  // Calculated fields
  const capacitorVoltage = capacitorVoltageFactor * capacitorVoltageScalar;
  const temperatureCelsius = temperatureCelsiusFactor * temperatureScalar - 40;

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
    var downlink = Buffer.alloc(10);
    downlink.writeUInt16LE(0x0054, 0);
    downlink.writeFloatLE(input.data.transmitIntervalSeconds, 2);
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
