# Hotdrop Direct Codec Chirpstack V4

This codec targets Chirpstack V4 codecs. As a prerequisite, all data from Vutility HotDrop devices must utilize the device profile that implements this codec.

### To use
- Create a device profile in Chirpstack for the HotDrop.
- Copy the index.js file, EXCEPT the final two export lines at the bottom.
- Under 'Codec' in the HotDrop device profile, select 'JavaScript functions' and paste the file into the 'Codec functions' input box.
- Click 'Submit' at the bottom of the page.

Once again, please ensure that only Vutility HotDrops are utilizing this device profile.

| Function | Available | Notes |
| --- | --- | --- |
| `decodeUplink`| ✅ | |
| `encodeDownlink`| ✅ | |
| `decodeDownlink`| ❌ | |


## `decodeUplink`

Every decoded packet will contain the following measurements in a json object.

| Name | Description | Units |
| --- | --- | :---: |
| `ampHourAccumulation` | The total amphour accumulation. | Ah |
| `averageAmps` | The average amps since the last transmit. | A |
| `maximumAmps` | The maximum amps since the last transmit. | A |
| `minimumAmps` | The minimum amps since the last transmit. | A |
| `capacitorVoltage` | The capacitor voltage at time of transmit. | V |
| `temperatureCelsius` | The temperature at time of transmit. | °C |

Example: 
```
"output": 
{
    "data": 
    {
        "ampHourAccumulation": 356,
        "averageAmps": 12,
        "maximumAmps": 25.32,
        "minimumAmps": 2.52,
        "capacitorVoltage": 3.8627450980392157,
        "temperatureCelsius": 18.823529411764703
    }
}
```

For additional information on the decoded values and types for the HotDrop direct measurements [check the uplink.schema.json file](/hotdrop_direct/uplink.schema.json)

## `encodeDownlink`

To encode a downlink, use **one and only one** of the following downlinks as a field in a json object as input to the `encodeDownlink` function.

| Downlinks |
| --- |
| `factoryReset` |
| `transmitIntervalSeconds` |
| `measurementIntervalMs` |
| `lowPowerThreshold` |

#### Factory Reset

`factoryReset` sets the device to factory defaults. Valid value is `true`.

Example:
```
"data": 
{
    "factoryReset": true
}
```

#### Transmit Interval

`transmitIntervalSeconds` is the amount of time between packet transmits.
The minimum value is 60 seconds, the maximum value is 3000 seconds.

Example:
```
"data": 
{
    "transmitIntervalSeconds": 60
}
```

#### Measurement Interval
`measurementIntervalMs` is the amount of time between measurement readings.
The minimum value is 200 ms, the maximum value is 10000 ms.

Example:
```
"data": 
{
    "measurementIntervalMs": 1000
}
```


##### Low Power Threshold
`lowPowerThreshold` is the capacitor voltage at which the hotdrop will change into low power mode.
The minimum value is 2.1 volts, the maximum value is 3.9 volts.

Example:
```
"data": 
{
    "lowPowerThreshold": 3.4
}
```

## Example Downlinks

| Factory Reset | Raw Packet | Base64 Encoding | Default |
| --- | --- | --- | :---: |
| N/A | [46, 00, 00, 00, 00, 00, 00, 00, 00, 00] | RgAAAAAAAAAAAA== | N/A |

| Transmit Interval (s) | Raw Packet | Base64 Encoding | Default |
| --- | --- | --- | :---: |
| 60 | [54, 00, 00, 00, 70, 42, 00, 00, 00, 00] | VAAAAHBCAAAAAA== | ✅ |
| 120 | [54, 00, 00, 00, F0, 42, 00, 00, 00, 00] | VAAAAPBCAAAAAA== | ❌ |
| 300 | [54, 00, 00, 00, 96, 43, 00, 00, 00, 00] | VAAAAJZDAAAAAA== | ❌ |
| 1500 | [54, 00, 00, 00, 61, 44, 00, 00, 00, 00] | VAAAAGFEAAAAAA== | ❌ |
| 3000 | [54, 00, 00, 00, E1, 44, 00, 00, 00, 00] | VAAAAOFEAAAAAA== | ❌ |

| Measurement Interval (ms) | Raw Packet | Base64 Encoding | Default |
| --- | --- | --- | :---: |
| 200 | [4D, 00, 00, 00, 48, 43, 00, 00, 00, 00] | TQAAAEhDAAAAAA== | ❌ |
| 500 | [4D, 00, 00, 00, FA, 43, 00, 00, 00, 00] | TQAAAPpDAAAAAA== | ❌ |
| 1000 | [4D, 00, 00, 00, 7A, 44, 00, 00, 00, 00] | TQAAAHpEAAAAAA== | ✅ |
| 2000 | [4D, 00, 00, 00, FA, 44, 00, 00, 00, 00] | TQAAAPpEAAAAAA== | ❌ |
| 10000 | [4D, 00, 00, 40, 1C, 46, 00, 00, 00, 00] | TQAAQBxGAAAAAA== | ❌ |

| Low Power Threshold (v) | Raw Packet | Base64 Encoding | Default |
| --- | --- | --- | :---: |
| 3.9 | [50, 00, 9A, 99, 79, 40, 00, 00, 00, 00] | UACamXlAAAAAAA== | ❌ |
| 3.4 | [50, 00, 9A, 99, 59, 40, 00, 00, 00, 00] | UACamVlAAAAAAA== | ✅ |
| 2.1 | [50, 00, 66, 66, 06, 40, 00, 00, 00, 00] | UABmZgZAAAAAAA== | ❌ |
