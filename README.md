# Vutility Payload Codecs

This repository holds JavaScript payload codecs for Vutility devices. These codecs follow an API as specified by the [LoRa Alliance.](https://resources.lora-alliance.org/document/ts013-1-0-0-payload-codec-api). Optionally, codecs may also include a version or versions of the index.js file targetted towards different ES versions. Below is a table with the supported devices and packets.

## Codecs
| Device | Codec | Codec Info | Description | Uplink Decode | Downlink Encode | Downlink Decode
| --- | --- | --- | --- | :---: | :---: | :---: |
| `hotdrop direct` | [index.js](hotdrop_direct/index.js) | [readme](hotdrop_direct/index-readme.md) | HotDrop Direct Codec | ✅ | ✅ | ✅
| `hotdrop direct` | [index-es5.js](hotdrop_direct/index-es5.js) | [readme](hotdrop_direct/index-es5-readme.md)  | ES5 Compatible HotDrop Direct Codec | ✅ | ✅* | ❌
| `hotdrop direct` | [index.js](hotdrop_direct/aws-iot-core/index.js) | [readme](hotdrop_direct/aws-iot-core/readme.md)  | Decoding Lambda Function (AWS) | ✅ | ❌ | ❌
| `pulsedrop direct` | [index.js](pulsedrop_direct/index.js) | [readme](pulsedrop_direct/index-readme.md) | PulseDrop Direct Codec | ✅ | ✅ | ✅
| `pulsedrop direct` | [index-es5.js](pulsedrop_direct/index-es5.js) | [readme](pulsedrop_direct/index-es5-readme.md)  | ES5 Compatible PulseDrop Direct Codec | ✅ | ✅* | ❌
| `voltdrop direct` | [index.js](voltdrop_direct/index.js) | [readme](voltdrop_direct/index-readme.md) | VoltDrop Direct Codec | ✅ | ✅ | ✅
| `voltdrop direct` | [index-es5.js](voltdrop_direct/index-es5.js) | [readme](voltdrop_direct/index-es5-readme.md)  | ES5 Compatible VoltDrop Direct Codec | ✅ | ✅* | ❌

*\*Limited options for encoded downlinks.*

### Development Notes
 - Framework: node.js
 - Testing Framework: [jest](https://jestjs.io/)
 - Coding Standards:
    - 100% code coverage for `index.js` files.
    - No external package references in `index.js` files.
    - Use [@typedef](https://jsdoc.app/tags-typedef.html) to define JavaScript object fields.
 - Dependencies
    - [Node.js](https://nodejs.org/en/download) v16.17.0 or higher
    - [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) v9.5.1 or higher

To check your node and npm versions, run the following commands:

```
node -v
npm -v
```

To update npm to the latest version, run the following command:

```
npm install -g npm
```

### Testing

- Change working folder to the codec file to test. e.g. `hotdrop_direct`.
- To execute tests, run the following command:

```
cd hotdrop_direct
// The following line only needs to be run once.
npm install
npm test
```

- Sample output

```
> codec_hdd@1.0.0 test
> jest --collectCoverage

 PASS  ./driver-examples.spec.js
  Decode uplink
    √ standard uplink, empty (4 ms)
    √ standard uplink, whole numbers (1 ms)
    √ standard uplink, fractional numbers (1 ms)
    √ warning: minimum amps below 0
    √ Error: uplink length greater than 11 bytes (1 ms)
    √ Error: uplink length less than 11 bytes (1 ms)
    √ Error: packet type is not 50 (1 ms)
  Decode downlink
    √ downlink transmit interval (1 min) [default configuration] (2 ms)
    √ downlink transmit interval (2 min)
    √ downlink transmit interval (5 min)
    √ downlink transmit interval (15 min) (1 ms)
    √ downlink transmit interval (30 min) (1 ms)
    √ Warning: downlink transmit interval negative
    √ Error: downlink transmit interval negative
    √ Error: downlink transmit interval greater than 30 m
    √ measurement interval (200 ms)
    √ measurement interval (500 ms) (1 ms)
    √ measurement interval (1000 ms) [default configuration] (1 ms)
    √ measurement interval (2000 ms)
    √ measurement interval (10000 ms)
    √ Warning: reserved bytes not 0
    √ Error: downlink measurement interval less than 0
    √ Error: downlink measurement interval greater than 10000 ms (5 ms)
    √ low power threshold (3.9 v)
    √ low power threshold (3.4 v) [default configuration] (1 ms)
    √ low power threshold (2.1 v)
    √ low power threshold (1.8 v) (1 ms)
    √ Warning: low power threshold reserved bytes not 0 (1 ms)
    √ Error: low power threshold less than 0 v (1 ms)
    √ Error: low power threshold greater than or equal to 5 v (1 ms)
    √ factory reset (1 ms)
    √ Error: factory reset reserved bytes not 0 (1 ms)
    √ Error: downlink not 10 bytes (1 ms)
    √ Error: downlink not 10 bytes (1 ms)
  Encode downlink
    √ downlink transmit interval (1 min) [default configuration] (1 ms)
    √ downlink transmit interval (2 min)
    √ downlink transmit interval (5 min)
    √ downlink transmit interval (15 min) (1 ms)
    √ downlink transmit interval (30 min) (1 ms)
    √ Error: downlink transmit interval less than 0
    √ Error: downlink transmit interval greater than 30 min
    √ measurement interval (200 ms) (1 ms)
    √ measurement interval (500 ms)
    √ measurement interval (1000 ms) [default configuration]
    √ measurement interval (2000 ms) (1 ms)
    √ measurement interval (10000 ms) (1 ms)
    √ Error: downlink measurement interval less than 0
    √ Error: downlink measurement interval greater than 10000 ms (1 ms)
    √ low power threshold (3.9 v)
    √ low power threshold (3.4 v) [default configuration]
    √ low power threshold (2.1 v)
    √ low power threshold (1.8 v) (1 ms)
    √ Error: low power threshold less than 0 v
    √ Error: low power threshold greater than or equal to 5 v
    √ factory reset (1 ms)
    √ Error: factory reset is false
    √ Error: invalid data field
    √ Error: More than one downlink defined (1 ms)
    √ Error: More than one downlink defined
    √ Error: More than one downlink defined (1 ms)

----------|---------|----------|---------|---------|-------------------
| File       | % Stmts   | % Branch   | % Funcs   | % Lines   | Uncovered Line #s   |
| ---------- | --------- | ---------- | --------- | --------- | ------------------- |
| All files  | 100       | 100        | 100       | 100       |
| index.js   | 100       | 100        | 100       | 100       |
| ---------- | --------- | ---------- | --------- | --------- | ------------------- |
Test Suites: 1 passed, 1 total
Tests:       60 passed, 60 total
Snapshots:   0 total
Time:        1.368 s
Ran all test suites.
```

- A report will automatically be generated in the `coverage` folder for further review.
