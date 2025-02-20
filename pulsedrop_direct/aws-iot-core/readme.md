# PulseDrop Direct Codec AWS Lambda Function

## In Progress:: yet to be tested in AWS

This codec targets a NodeJS AWS Lambda function. As a prerequisite, all data from Vutility PulseDrop devices must invoke this Lambda function.

Please follow this documentation by AWS to validate this prerequisite has been fulfilled:
- https://docs.aws.amazon.com/iot/latest/developerguide/connect-iot-lorawan-destination-rules.html
- https://github.com/aws-samples/aws-iot-core-lorawan/tree/main/transform_binary_payload

To use this file, copy the index.js file and paste it into your Lambda function. After publishing the Lambda function, it will then begin decoding data.

Once again, please ensure that only Vutility PulseDrop data is invoking this Lambda function.

| Function | Available | Notes |
| --- | --- | --- |
| `decodeUplink`| ✅ | This lambda function is only for decoding the raw payloads. |
| `encodeDownlink`| ❌ | |
| `decodeDownlink`| ❌ | |


## `decodeUplink`

Every decoded packet will contain the following measurements in a json object.

Note: Pulsedrop is available in conventional pulse counter and digital Advanced Meter Interface (AMI) variants. *(\*Still in development, contact Vutility sales)* The same data packet is used for both.

| Name | Description | Units |
| --- | --- | :---: |
| `pulseCount` | The total pulses counted **or** digital AMI meter reading. | Count |
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
### Digital AMI Error Flags
Pulsedrops operating in Advanced Meter Interface (AMI) mode use a digital interface to directly read data from the attached meter. In the event that the meter does not respond or the data cannot be decoded by the Pulsedrop, the resulting data packet will contain error flags indicating the issue.

In the event that a packet contains an error flag, the codec will indicate the issue in the "errors" field of the json packet and repeat the last known good data from the meter. (or zero if no previous read)

| Error Flag | Cause | Resolution |
| --- | --- | --- |
| No response from meter | Poor or incorrect meter connections, dead meter battery. | Check meter connections and if meter is operational. |
| Invalid response from meter | PulseDrop didn't understand the meter data. | Check compatibility of meter with PulseDrop |

Example:
```
"output":
{
    "data":
    {
        "pulseCount": 0,
        "capacitorVoltage": 3.8627450980392157,
        "temperatureCelsius": 18.823529411764703
    },
    "errors": ["No response from meter"],
    "warnings": []
}
```

For additional information on the decoded values and types for the PulseDrop direct measurements [check the uplink.schema.json file](/pulsedrop_direct/uplink.schema.json)

For additional information on downlinks, check the [base PulseDrop codec README](/pulsedrop_direct/index-readme.md).