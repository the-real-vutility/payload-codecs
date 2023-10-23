const driver = require("./index.js");
const examples = require("./examples.json");
const es5dot1driver = require("./index-es5.js");

/*..............
Test suites
..............*/

describe("Decode uplink index.js", () => {
  examples.forEach((example) => {
    if (example.type === "uplink") {
      it(example.description, () => {
        // Given
        const input = {
          bytes: Buffer.from(example.input.bytes, "hex"),
          fPort: example.input.fPort,
        };

        if (example.input.recvTime !== undefined) {
          input.recvTime = example.input.recvTime;
        }

        // When
        const result = driver.decodeUplink(input);

        // Then
        const expected = example.output;
        expect(result).toStrictEqual(expected);
      });
    }
  });
});

describe("Decode downlink index.js", () => {
  examples.forEach((example) => {
    if (example.type === "downlink-decode") {
      it(example.description, () => {
        // Given
        const input = {
          bytes: example.input.bytes,
          fPort: example.input.fPort,
        };

        if (example.input.recvTime !== undefined) {
          input.recvTime = example.input.recvTime;
        }

        // When
        const result = driver.decodeDownlink(input);

        // Then
        const expected = example.output;
        if (expected.data?.transmitIntervalSeconds) {
          expect(result.data.transmitIntervalSeconds).not.toBeUndefined();
          expect(result.data.transmitIntervalSeconds).toBeCloseTo(
            expected.data.transmitIntervalSeconds,
            6
          );
        } else {
          if (expected.data) {
            expect(result.data).toStrictEqual(expected.data);
          }
          if (expected.bytes) {
            expect(result.bytes).toStrictEqual(expected.bytes);
          }
          if (expected.errors) {
            expect(result.errors).toStrictEqual(expected.errors);
          }
          if (expected.fPort) {
            expect(result.fPort).toStrictEqual(expected.fPort);
          }
          if (expected.warnings) {
            expect(result.warnings).toStrictEqual(expected.warnings);
          }
        }
      });
    }
  });
});

describe("Encode downlink index.js", () => {
  examples.forEach((example) => {
    if (example.type === "downlink-encode") {
      it(example.description, () => {
        // When
        const result = driver.encodeDownlink(example.input);

        // Then
        const expected = example.output;
        expect(result).toStrictEqual(expected);
      });
    }
  });
});
