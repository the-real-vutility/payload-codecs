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
  let result = {
    data: {},
    errors: [],
    warnings: [],
  };
  const raw = Buffer.from(input.bytes);

  // Uplink payload must be 11 bytes long.
  if (raw.byteLength != 11) {
    result.errors.push("Payload length must be 11 bytes");
    delete result.data;
    return result;
  }

  // Packet ID - 1 byte
  const packetId = raw[0];
  if (packetId !== 28) {
    result.errors.push("Payload packet ID is not equal to 28");
    delete result.data;
    return result;
  }

  // Constant factors for formulas
  const capacitorVoltageFactor = 5.0 / 255.0;
  const temperatureCelsiusFactor = 120.0 / 255.0;
  const noResponseErrorFlag = 0x01;
  const invalidResponseErrorFlag = 0x02;

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

  if (capacitorVoltage < 2.5) {
    result.warnings.push(
      "Low capacitor voltage indicates depleted battery. System may cease operation soon."
    );
  }

  // Digital AMI error flags
  const errorFlags = raw[10];
  if (errorFlags & noResponseErrorFlag) {
    result.errors.push(
      "No response from meter"
    );
  }
  if (errorFlags & invalidResponseErrorFlag) {
    result.errors.push(
      "Invalid response from meter"
    );
  }

  result.data = {
    pulseCount: pulseCount,
    capacitorVoltage: capacitorVoltage,
    temperatureCelsius: temperatureCelsius,
  };

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

    // Check if decoder has returned any warnings
    if (decoded.warnings.length > 0) {
      console.log("Warnings:" + decoded.warnings);
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
