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

The diagnostic packets are sent under specific conditions and detailed descriptions of their content are documented in a later section.

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

#### Active Energy Accumulation (Packets #42-43)
| Name | Description | Units |
| --- | --- | :---: |
| `activeEnergyAccumulation` | The total active energy watt-hour accumulation. | Wh |
| `averagePowerFactor` | The average power factor across all phases since last transmit. | % |

#### Apparent Energy Accumulation (Packets #44-45)
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
| `softReset` |
| `factoryReset` |
| `transmitIntervalSeconds` |
| `packetTransmitSchedule` *(Not supported by ES5 codec)*|

#### Soft Reset

`softReset` reboots the device and causes it to rejoin the LoRaWAN network.
Does not affect device configuration or accumulated energy counters. Valid value is `true`.

Example:
```
"data":
{
    "softReset": true
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

`transmitIntervalSeconds` is the amount of time between packet transmits. The only valid values are the values under 'Example Downlinks'.

Example:
```
"data":
{
    "transmitIntervalSeconds": 60
}
```

#### Packet Transmit Schedule

`packetTransmitSchedule` is not supported by the ES5-compliant codec.

## Example Downlinks

| Factory Reset | Raw Packet (Hex) | Base64 Encoding | Default |
| --- | --- | --- | :---: |
| N/A | [00, 46] | AEY= | N/A |

| Transmit Interval Seconds | Raw Packet (Hex) | Base64 Encoding | Default |
| --- | --- | --- | :---: |
| 60 (1 minute)| [00, 31, 00, 00, 00, 3C] | ADEAAAA8 | ✅ |
| 120 (2 minutes)| [00, 31, 00, 00, 00, 78] | ADEAAAB4 | ❌ |
| 300 (5 minutes)| [00, 31, 00, 00, 01, 2C] | ADEAAAEs | ❌ |
| 900 (15 minutes)| [00, 31, 00, 00, 03, 84] | ADEAAAOE | ❌ |
| 1800 (30 minutes)| [00, 31, 00, 00, 07, 08] | ADEAAAcI | ❌ |

## Diagnostic Packet Detailed Information

### Startup Diagnostic (Packet #46)
**NOTE:** In the event that the LoRaWAN core cannot communicate with the metering hardware, the `Reader Firmware Hash` field will read as `0xFFFF` and the core will restart repeatedly until the situation is resolved. Check the snap-together connection between the LoRaWAN core and metering hardware. Contact Vutility if a device loop resets and sends the startup diagnostic repeatedly.

| Reset Reason | Description |
| --- | --- |
| Power Loss | The system is starting up after power has been applied. (typical) |
| Hardware Reset | The system was reset due to diagnostic hardware. |
| Watchdog Timer | The system was reset due to incorrect software operation. |
| Unknown Software Request | The system was reset due to an untraceable software request. (i.e. via software updater) |
| CPU Lock-Up | The system was reset due to a hardware fault. |
| Hard-Fault | The system was reset due to execution of an invalid operation. |
| Application Request | The system was reset due to a traceable software request (i.e. via soft reset downlink) |
| Factory Reset | The system was reset after clearing parameters due to receiving the factory reset downlink. |
| Reader Non-Responsive | The system was reset due to failing communications with the metering hardware. |
| Failed Link-Check | The system was reset after failing multiple LoRaWAN link check requests to the gateway. |
| Assertion Failure | The system was reset due to a failed assertion in software. |

In the event that a "Watchdog Timer", "Hard-Fault", or "Assertion Failure" reset occurs, please contact Vutility and provide the raw startup diagnostic data (including reserved bytes) for analysis.

### Operational Diagnostic (Packet #47)

"Immediate" transmit types are sent directly when the error condition occurs. "Periodic" types are checked and sent on a 5 minute cooldown interval that resets whenever the diagnostic packet is sent.

| Error Condition | Transmit Behavior | Description | User Action |
| --- | :---: | --- | --- |
| Invalid Downlink | Immediate | The previous downlink was invalid and has been discarded. | Verify and resend the downlink. |
| Core Voltage Drop | Immediate | The LoRaWAN core capacitor energy storage has fallen below typical operating levels. The system is likely to power-down soon. | Check that the VoltDrop is connected and powered correctly. |
| EEPROM Fail | Immediate | The LoRaWAN core persistent storage has failed. Accumulated energy readings may be lost or corrupted if the device restarts or loses power. | Log energy readings and contact Vutility.|
| Reader Timeout | Periodic | The core failed to receive a response from the metering hardware. The failed register address is reported in the “Register ID” field of the diagnostic packet. | Spurious errors my be ignored if data flow is not impacted. Persistent errors of this type typically indicate issues with the snap-together connection between the LoRaWAN core and metering hardware. Check that the core has not come loose. The system will repeatedly restart if the hardware cannot communicate. Contact Vutility if error is persistent. |
| Reader NACK | Periodic | The core received a negative response from the metering hardware. The failed register address is reported in the “Register ID” field of the diagnostic packet. | Spurious errors may be ignored if data flow is not impacted. Persistent errors of this type typically indicate incompatible firmware versions between the LoRaWAN core and metering hardware. Contact Vutility if error is persistent. |
| Reader Overvoltage | Periodic | The metering hardware experienced voltage above rated limits for a non-transient amount of time. This error is permanent once triggered. | This condition is primarily caused by using the VoltDrop with an unsupported delta-type circuit. (including high-leg delta circuits with neutral line) Contact Vutility. |
| Reader Not Calibrated | Periodic | The metering hardware does not contain calibration constants required for operation.  | Contact Vutility |
| Phase Sequence Error | Periodic | The phase relationships between inputs do not match expected for a 3-phase AC Wye system.  | Check ordering and connections of A,B,C phases. Incorrect ordering of phases does not impact measurements, but this error may also indicate installation issues such as a single phase connected to multiple inputs. |