const driver = require("./index.js");
const examples = require("./examples.json");

/*..............
Test suites
..............*/

describe("Voltdrop chirpstack-v3 uplink", () => {
  examples.forEach((example) => {
    if (example.type === "uplink") {
      if (example.expectException !== undefined && example.expectException) {
        it(example.description, () => {
          const t = () => driver.Decode(0, example.input.bytes, {});
          expect(t).toThrow(example.errorMessage);
        });
      }
      else {
        it(example.description, () => {
          // Given

          // When
          const result = driver.Decode(0, example.input.bytes, {});

          // Then
          const expected = example.output.data;
          expect(result).toStrictEqual(expected);
        });
      }
    }
  });
});

describe("Voltdrop chirpstack-v3 Encode downlink", () => {
  examples.forEach((example) => {
    if (example.type === "downlink-encode") {

      if (example.expectException !== undefined && example.expectException) {
        it(example.description, () => {
          const t = () => driver.Encode(0, example.input, {});
          expect(t).toThrow(example.errorMessage);
        });
      }
      else {
        it(example.description, () => {
          // When
          const result = driver.Encode(0, example.input, {});

          // Then
          const expected = example.output.bytes;
          expect(result).toStrictEqual(expected);
        });
      }
    }
  });
});

