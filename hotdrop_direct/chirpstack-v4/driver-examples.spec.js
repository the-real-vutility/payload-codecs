const driver = require("./index.js");
const examples_chirpstackv4 = require("./examples-chirpstack-v4-handler.json");

/*..............
Test suites
..............*/

describe("chirpstack-v4", () => {
  examples_chirpstackv4.forEach((example) => {
    if (example.type === "chirpstack-v4-uplink") {
      if (example.expectException !== undefined && example.expectException) {
        it(example.description, () => {
          const t = () => driver.decodeUplink(example.input);
          expect(t).toThrow();
        });
      }
      else {
        it(example.description, () => {
          // Given
          const input = example.input;

          // When
          const result = driver.decodeUplink(input);

          // Then
          const expected = example.output;
          expect(result).toStrictEqual(expected);
        });
      }
    }
  });
});

describe("Encode downlink index.js", () => {
  examples_chirpstackv4.forEach((example) => {
    if (example.type === "chirpstack-downlink-encode") {

      if (example.expectException !== undefined && example.expectException) {
        it(example.description, () => {
          const t = () => driver.encodeDownlink(example.input);
          expect(t).toThrow();
        });
      }
      else {
        it(example.description, () => {
          // When
          const result = driver.encodeDownlink(example.input);

          // Then
          const expected = example.output;
          expect(result).toStrictEqual(expected);
        });
      }
    }
  });
});

