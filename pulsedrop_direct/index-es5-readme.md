# PulseDrop Direct Codec ES5

This codec targets ES5. If the desired environment does not support newer javascript versions, use this file.

| Function | Available | Notes |
| --- | --- | --- |
| `decodeUplink`| ✅ | |
| `encodeDownlink`| ✅ | Only the downlinks at the bottom of this readme are supported. |
| `decodeDownlink`| ❌ | |


## `decodeUplink`

Every decoded packet will contain the following measurements in a json object.

| Name | Description | Units |
| --- | --- | :---: |
| `pulseCount` | The total pulses counted by device. | Count |
| `capacitorVoltage` | The capacitor voltage at time of transmit. | V |
| `temperatureCelsius` | The temperature at time of transmit. | °C |

Example:
```
"output":
{
    "data":
    {
        "pulseCount": 39823,
        "capacitorVoltage": 3.8627450980392157,
        "temperatureCelsius": 18.823529411764703
    },
    "errors": [],
    "warnings": []
}
```

## `encodeDownlink`

To encode a downlink, use **one and only one** of the following downlinks as a field in a json object as input to the `encodeDownlink` function.

| Downlinks |
| --- |
| `factoryReset` |
| `transmitIntervalSeconds` |

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

`transmitIntervalSeconds` is the amount of time between packet transmits. The only valid values are the values under 'Example Downlinks'.

Example:
```
"data":
{
    "transmitIntervalSeconds": 60
}
```

## Example Downlinks

| Factory Reset | Raw Packet | Base64 Encoding | Default |
| --- | --- | --- | :---: |
| N/A | [5A, 00, 00, 00, 00, 00, 00, 00, 00, 00] | RgAAAAAAAAAAAA== | N/A |


| Transmit Interval (s) | Raw Packet | Base64 Encoding | Default |
| --- | --- | --- | :---: |
| 60 | [54, 00, 00, 00, 70, 42, 00, 00, 00, 00] | VAAAAHBCAAAAAA== | ✅ |
| 120 | [54, 00, 00, 00, F0, 42, 00, 00, 00, 00] | VAAAAPBCAAAAAA== | ❌ |
| 300 | [54, 00, 00, 00, 96, 43, 00, 00, 00, 00] | VAAAAJZDAAAAAA== | ❌ |
| 1500 | [54, 00, 00, 00, 61, 44, 00, 00, 00, 00] | VAAAAGFEAAAAAA== | ❌ |
| 3000 | [54, 00, 00, 00, E1, 44, 00, 00, 00, 00] | VAAAAOFEAAAAAA== | ❌ |
