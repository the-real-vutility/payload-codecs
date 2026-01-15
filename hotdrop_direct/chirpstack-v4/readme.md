# Hotdrop Direct Codec Chirpstack V4

This codec targets Chirpstack V4 codecs. As a prerequisite, all data from Vutility Hotdrop devices must utilize the device profile that implements this codec.

### To use
- Create a device profile for the Hotdrop.
- Copy the [index.js](../index.js) file for the Hotdrop.
- Under `Codec` in the device profile, select `JavaScript functions` and paste the file into the `Codec functions` input box.
- Click `Submit` at the bottom of the page.

Once again, please ensure that only Vutility Hotdrop are utilizing this device profile.

| Function | Available | Notes |
| --- | --- | --- |
| `decodeUplink`| ✅ | |
| `encodeDownlink`| ✅ | |
| `decodeDownlink`| ✅ | |

For more info on these functions please check the [Standard readme](../index-readme.md).
