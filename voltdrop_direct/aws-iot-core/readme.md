# VoltDrop Direct Codec AWS Lambda Function

## In Progress:: yet to be tested in AWS

This codec targets a NodeJS AWS Lambda function. As a prerequisite, all data from Vutility VoltDrop devices must invoke this Lambda function.

Please follow this documentation by AWS to validate this prerequisite has been fulfilled:
- https://docs.aws.amazon.com/iot/latest/developerguide/connect-iot-lorawan-destination-rules.html
- https://github.com/aws-samples/aws-iot-core-lorawan/tree/main/transform_binary_payload

To use this file, copy the index.js file and paste it into your Lambda function. After publishing the Lambda function, it will then begin decoding data.

Once again, please ensure that only Vutility VoltDrop data is invoking this Lambda function.

| Function | Available | Notes |
| --- | --- | --- |
| `decodeUplink`| ✅ | This lambda function is only for decoding the raw payloads. |
| `encodeDownlink`| ❌ | |
| `decodeDownlink`| ❌ | |


## `decodeUplink`

There are four standard packet types that the Voltdrop direct can transmit. These deliver
various data measurements that can be returned in a json object. Most values are averaged
over the interval since the specific packet was last transmitted.

The diagnostic packets are sent under specific conditions and detailed descriptions of their content are documented in a later section.

### Phase Voltage and Power Factor (Packet #40)
| Name | Description | Units |
| --- | --- | :---: |
| `voltageL1` | Average RMS voltage on Phase A (L1) since last transmit | V |
| `voltageL2` | Average RMS voltage on Phase B (L2) since last transmit| V |
| `voltageL3` | Average RMS voltage on Phase C (L3) since last transmit| V |
| `powerFactorL1` | Percentage power factor of Phase A (L1) | % |
| `powerFactorL2` | Percentage power factor of Phase A (L1) | % |
| `powerFactorL3` | Percentage power factor of Phase A (L1) | % |
| `capacitorVoltage` | The capacitor voltage at time of transmit. | V |

### Phase Amperage and Max Amperage (Packet #41)
| Name | Description | Units |
| --- | --- | :---: |
| `currentL1` | Average RMS amps on Phase A (L1) since last transmit. | A |
| `currentL2` | Average RMS amps on Phase B (L2) since last transmit. | A |
| `currentL3` | Average RMS amps on Phase B (L3) since last transmit. | A |
| `maxCurrentL1` | Maximum amps on Phase A (L1) since last transmit. | A |
| `maxCurrentL2` | Maximum amps on Phase B (L2) since last transmit. | A |
| `maxCurrentL3` | Maximum amps on Phase C (L3) since last transmit. | A |
| `temperatureCelsius` | The temperature at time of transmit. | °C |

### Active Energy Accumulation (Packets #42-43)
| Name | Description | Units |
| --- | --- | :---: |
| `activeEnergyAccumulation` | The total active energy watt-hour accumulation. | Wh |
| `averagePowerFactor` | The average power factor across all phases since last transmit. | % |

### Apparent Energy Accumulation (Packets #44-45)
| Name | Description | Units |
| --- | --- | :---: |
| `apparentEnergyAccumulation` | The total apparent energy volt-amp-hour accumulation. | VAh |
| `averagePowerFactor` | The average power factor across all phases since last transmit. | % |

### Startup Diagnostic (Packet #46)
The startup diagnostic is sent the first time the system joins a LoRaWAN network after a reset has occurred.
| Name | Description | Units |
| --- | --- | :---: |
| `resetReason` | Indicates the reason the system processor was reset | N/A |
| `coreFirmwareHash` | Software version identifier for VoltDrop LoRaWAN hardware | N/A |
| `readerFirmwareHash` | Software version identifier for VoltDrop metering hardware | N/A |

### Operational Diagnostic (Packet #47)
The operational diagnostic is sent when certain error conditions occur. Depending on the severity and type of error the packet may be scheduled on periodic intervals or sent immediately.
| Name | Description | Units |
| --- | --- | :---: |
| `systemErrorConditions` | Lists error conditions indicated by diagnostic | N/A |
| `registerID` | ID of register that triggered the error condition (applies to timeout / NACK errors only) | N/A |


#### Example Decoded Voltage Packet
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

For additional information on downlinks, check the [base VoltDrop codec README](/voltdrop_direct/index-readme.md).