const driver = require("./index-es5.js");
const examples = require("./examples.json");
const examples_es5 = require("./examples-es5.json");

/*..............
Test suites
..............*/
describe("Decode uplink ES5", () => {
  var totalExamples = examples.concat(examples_es5);
  totalExamples.forEach((example) => {
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

describe("Encode downlink ES5", () => {
  var totalExamples = examples.concat(examples_es5);
  totalExamples.forEach((example) => {
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
