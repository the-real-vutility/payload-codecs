# Voltdrop Direct Codec

| Function | Available | Notes |
| --- | --- | --- |
| `decodeUplink`| ✅ | |
| `encodeDownlink`| ✅ | |
| `decodeDownlink`| ✅ | |


## `decodeUplink`

There are four standard packet types that the Voltdrop direct can transmit. These deliver
various data measurements that can be returned in a json object. Most values are averaged
over the interval since the specific packet was last transmitted.

#### Phase Voltage and Power Factor (Packet #40)
| Name | Description | Units |
| --- | --- | :---: |
| `voltageL1` | Average RMS voltage on Phase A (L1) since last transmit | V |
| `voltageL2` | Average RMS voltage on Phase B (L2) since last transmit| V |
| `voltageL3` | Average RMS voltage on Phase C (L3) since last transmit| V |
| `powerFactorL1` | Percentage power factor of Phase A (L1) | % |
| `powerFactorL2` | Percentage power factor of Phase A (L1) | % |
| `powerFactorL3` | Percentage power factor of Phase A (L1) | % |
| `capacitorVoltage` | The capacitor voltage at time of transmit. | V |

#### Phase Amperage and Max Amperage (Packet #41)
| Name | Description | Units |
| --- | --- | :---: |
| `currentL1` | Average RMS amps on Phase A (L1) since last transmit. | A |
| `currentL2` | Average RMS amps on Phase B (L2) since last transmit. | A |
| `currentL3` | Average RMS amps on Phase B (L3) since last transmit. | A |
| `maxCurrentL1` | Maximum amps on Phase A (L1) since last transmit. | A |
| `maxCurrentL2` | Maximum amps on Phase B (L2) since last transmit. | A |
| `maxCurrentL3` | Maximum amps on Phase C (L3) since last transmit. | A |
| `temperatureCelsius` | The temperature at time of transmit. | °C |

#### Active Energy Accumulation (Packets #43-44)
| Name | Description | Units |
| --- | --- | :---: |
| `activeEnergyAccumulation` | The total active energy watt-hour accumulation. | Wh |
| `averagePowerFactor` | The average power factor across all phases since last transmit. | % |

#### Apparent Energy Accumulation (Packets #45-46)
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

## `encodeDownlink` and `decodeDownlink`

To encode a downlink, use **one and only one** of the following downlinks as a field in a json object as input to the `encodeDownlink` function.

| Downlinks |
| --- |
| `factoryReset` |
| `transmitIntervalSeconds` |
| `packetTransmitSchedule` |

To decode a downlink for debug or testing purposes, format the downlink bytes and pass as input to the `decodeDownlink` function. The output will be a json object of one of the downlinks.

Example:
```
"input":
{
    "bytes": [50, 255, 255, 255, 255, 255, 255, 255, 100, 255, 255],
    "fPort": 2,
    "recvTime": "2023-05-02T20:00:00.000+00:00"
}
```

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
"data"
{
    "transmitIntervalSeconds": 60
}
```

#### Packet Transmit Schedule

`packetTransmitSchedule` is an array of packet ID's describing the type and ordering of packets to be sent by the Voltdrop device. The next specified packet will be sent each transmission interval and the schedule will advance forward, repeating when the end is reached. Up to 60 elements can be specified (1 hour at default transmit interval).

The following packet identifiers are used when specifying a Voltdrop schedule. Confirmed reception packets require that the LoRaWAN gateway sends acknowledgement that the data was received. In the event that acknowledgement is not received, the Voltdrop will attempt up to seven retries of the transmission at 1Hz intervals.

| Name | Packet ID Decimal/(Hex) | Confirmed Reception | Description |
| --- | :---: | :---: | --- |
| Phase Voltage and Power Factor  | 40 (0x28) | ❌ | Discrete phase average voltage and power factors. |
| Phase Amperage and Max Amperage | 41 (0x29) | ❌ | Discrete phase average and maximum currents. |
| Active Energy Accumulation      | 42 (0x2B) | ✅ | Total active energy accumulation and average power factor. |
| Active Energy Accumulation      | 43 (0x2C) | ❌ | Total active energy accumulation and average power factor. Unconfirmed variant of previous packet. |
| Apparent Energy Accumulation    | 44 (0x2D) | ✅ | Total apparent energy accumulation and average power factor.|
| Apparent Energy Accumulation    | 45 (0x2E) | ❌ | Total apparent energy accumulation and average power factor. Unconfirmed variant of previous packet. |
| None (Transmit Gap)             | 0 (0x00)  | ❌ | Used to introduce delays/gaps in the transmit schedule. |

Example:
```
"data"
{
    "packetTransmitSchedule": [40, 41, 40, 41, 40, 41, 40, 41, 40, 41, 40, 41, 40, 41, 43],
}
```

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

| Packet Schedule | Raw Packet (Hex) | Base64 Encoding | Default |
| --- | --- | --- | :---: |
| Alternating voltage and current packets on 1 minute intervals with confirmed active energy once every 15 minutes. | [31, 00, 0F, 28, 29, 28, 29, 28, 29, 28, 29, 28, 29, 28, 29, 28, 29, 2B] | MQAPKCkoKSgpKCkoKSgpKCkr | ✅ |
| Voltage and unconfirmed active energy once every 10 minutes. | [31, 00, 0A, 28, 2E, 00, 00, 00, 00, 00, 00, 00, 00] | MQAKKC4AAAAAAAAAAA== | ❌ |
