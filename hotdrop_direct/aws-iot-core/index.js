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
  if (packetId !== 50) {
    result.errors.push("Payload packet ID is not equal to 50");
    delete result.data;
    return result;
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

exports.decodeUplink = decodeUplink;
