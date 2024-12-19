# Hotdrop Direct Codec Chirpstack V3

This codec targets Chirpstack V3 codecs. As a prerequisite, all data from Vutility Hotdrop devices must utilize the device profile that implements this codec.

### To use
- Create a device profile in Chirpstack for the Hotdrop.
- Copy the index.js file.
- Paste the index.js file into the Codec.

Once again, please ensure that only Vutility Hotdrop are utilizing this device profile.

| Function | Available | Notes |
| --- | --- | --- |
| `Decode`| ✅ | Equivalent to `decodeUplink`|
| `Encode`| ✅ | Equivalent to `encodeUplink`. Only some downlinks are supported. Check the extended info for more details. |

For more info on these functions please check the [ES5 readme](../index-es5-readme.md).
