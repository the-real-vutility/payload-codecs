# Voltdrop Direct Codec ES5

This codec targets ES5. If the desired environment does not support newer javascript versions, use this file.

| Function | Available | Notes |
| --- | --- | --- |
| `decodeUplink`| ✅ | |
| `encodeDownlink`| ✅ | Only the downlinks at the bottom of this readme are supported. |
| `decodeDownlink`| ❌ | |



## `decodeUplink`

There are four standard packet types that the Voltdrop direct can transmit. These deliver
various data measurements that can be returned in a json object. Most values are averaged
over the interval since the specific packet was last transmitted.

### Phase Voltage and Power Factor
| Name | Description | Units |
| --- | --- | :---: |
| `voltageL1` | Average RMS voltage on Phase A (L1) since last transmit | V |
| `voltageL2` | Average RMS voltage on Phase B (L2) since last transmit| V |
| `voltageL3` | Average RMS voltage on Phase C (L3) since last transmit| V |
| `powerFactorL1` | Percentage power factor of Phase A (L1) | % |
| `powerFactorL2` | Percentage power factor of Phase A (L1) | % |
| `powerFactorL3` | Percentage power factor of Phase A (L1) | % |
| `capacitorVoltage` | The capacitor voltage at time of transmit. | V |

### Phase Amperage and Max Amperage
| Name | Description | Units |
| --- | --- | :---: |
| `currentL1` | Average RMS amps on Phase A (L1) since last transmit. | A |
| `currentL2` | Average RMS amps on Phase B (L2) since last transmit. | A |
| `currentL3` | Average RMS amps on Phase B (L3) since last transmit. | A |
| `maxCurrentL1` | Maximum amps on Phase A (L1) since last transmit. | A |
| `maxCurrentL2` | Maximum amps on Phase B (L2) since last transmit. | A |
| `maxCurrentL3` | Maximum amps on Phase C (L3) since last transmit. | A |
| `temperatureCelsius` | The temperature at time of transmit. | °C |

### Active Energy Accumulation
| Name | Description | Units |
| --- | --- | :---: |
| `activeEnergyAccumulation` | The total active energy watt-hour accumulation. | Wh |
| `averagePowerFactor` | The average power factor across all phases since last transmit. | % |

### Apparent Energy Accumulation
| Name | Description | Units |
| --- | --- | :---: |
| `apparentEnergyAccumulation` | The total apparent energy volt-amp-hour accumulation. | VAh |
| `averagePowerFactor` | The average power factor across all phases since last transmit. | % |


Example:
```
"output":
{
    "data":
    {
        "voltageL1": 407.9246743245653289,
        "voltageL2": 408.1257843246778490,
        "voltageL3": 408.3678136385328544,
        "powerFactorL1": 89,
        "powerFactorL2": 96,
        "powerFactorL3": 92,
        "capacitorVoltage": 3.8627450980392157,
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
| `packetTransmitSchedule` (Not supported by ES5 codec)|

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

#### Packet Transmit Schedule

`packetTransmitSchedule` is is not supported by the ES5-compliant codec.

## Example Downlinks

| Factory Reset | Raw Packet (Hex) | Base64 Encoding | Default |
| --- | --- | --- | :---: |
| N/A | [46, 00, 00, 00, 00, 00, 00, 00, 00, 00] | RgAAAAAAAAAAAA== | N/A |


| Transmit Interval (s) | Raw Packet (Hex) | Base64 Encoding | Default |
| --- | --- | --- | :---: |
| 60 | [31, 00, 00, 00, 70, 42, 00, 00, 00, 00] | MQAAAHBCAAAAAA== | ✅ |
| 120 | [31, 00, 00, 00, F0, 42, 00, 00, 00, 00] | MQAAAPBCAAAAAA== | ❌ |
| 300 | [31, 00, 00, 00, 96, 43, 00, 00, 00, 00] | MQAAAJZDAAAAAA== | ❌ |
| 1500 | [31, 00, 00, 00, 61, 44, 00, 00, 00, 00] | MQAAAGFEAAAAAA== | ❌ |
| 3000 | [31, 00, 00, 00, E1, 44, 00, 00, 00, 00] | MQAAAOFEAAAAAA== | ❌ |
