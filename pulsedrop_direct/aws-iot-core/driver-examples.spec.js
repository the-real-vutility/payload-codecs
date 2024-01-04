const driver = require("./index.js");
const examples = require("../examples.json");
const examples_aws = require("./examples-aws-handler.json");

/*..............
Test suites
..............*/

describe("aws handler", () => {
  examples_aws.forEach((example) => {
    if (example.type === "aws-uplink") {
      it(example.description, async () => {
        // Given
        const input = example.input;

        // When
        const result = await driver.handler(input);

        // Then
        const expected = example.output;
        expect(result).toStrictEqual(expected);
      });
    }
  });
});

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
