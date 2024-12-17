# Pulsedrop Direct Codec Chirpstack V4

This codec targets Chirpstack V4 codecs. As a prerequisite, all data from Vutility Pulsedrop devices must utilize the device profile that implements this codec.

### To use
- Create a device profile in Chirpstack for the Pulsedrop.
- Copy the index.js file, EXCEPT the final two export lines at the bottom.
- Under 'Codec' in the Pulsedrop device profile, select 'JavaScript functions' and paste the file into the 'Codec functions' input box.
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
    }
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

`transmitIntervalSeconds` is the amount of time between packet transmits.
The minimum value is 60 seconds, the maximum value is 3000 seconds.

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
| N/A | [46, 00, 00, 00, 00, 00, 00, 00, 00, 00] | RgAAAAAAAAAAAA== | N/A |


| Transmit Interval (s) | Raw Packet | Base64 Encoding | Default |
| --- | --- | --- | :---: |
| 60 | [54, 00, 00, 00, 70, 42, 00, 00, 00, 00] | VAAAAHBCAAAAAA== | ✅ |
| 120 | [54, 00, 00, 00, F0, 42, 00, 00, 00, 00] | VAAAAPBCAAAAAA== | ❌ |
| 300 | [54, 00, 00, 00, 96, 43, 00, 00, 00, 00] | VAAAAJZDAAAAAA== | ❌ |
| 1500 | [54, 00, 00, 00, 61, 44, 00, 00, 00, 00] | VAAAAGFEAAAAAA== | ❌ |
| 3000 | [54, 00, 00, 00, E1, 44, 00, 00, 00, 00] | VAAAAOFEAAAAAA== | ❌ |

