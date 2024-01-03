# Hotdrop Direct Codec AWS Lambda Function

This codec targets a NodeJS AWS Lambda function. As a prerequisite, all data from Vutility HotDrop devices must invoke this Lambda function.

Please follow this documentation by AWS to validate this prerequisite has been fulfilled:
- https://docs.aws.amazon.com/iot/latest/developerguide/connect-iot-lorawan-destination-rules.html
- https://github.com/aws-samples/aws-iot-core-lorawan/tree/main/transform_binary_payload

To use this file, copy the index.js file and paste it into your Lambda function. After publishing the Lambda function, it will then begin decoding data.

Once again, please ensure that only Vutility HotDrop data is invoking this Lambda function.

| Function | Available | Notes |
| --- | --- | --- |
| `decodeUplink`| ✅ | This lambda function is only for decoding the raw payloads. |
| `encodeDownlink`| ❌ | |
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
    },
    "errors": [],
    "warnings": []
}
```


