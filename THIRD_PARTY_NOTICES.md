# Third-party notices

`src/edge-drm-v2.ts` and its compiled module are adapted from
[rany2/edge-tts 7.3.1](https://github.com/rany2/edge-tts/tree/7.3.1),
`src/edge_tts/drm.py` (blob `707dc7724b63242624b9b62175556fa1fdcb7fad`),
copyright rany and contributors, licensed under LGPLv3.
The adaptation replaces the Python digest implementation with a separate
TypeScript module, retaining the protocol constants and calculations.
Its source and the upstream license are included in the npm package, under
`src/edge-drm-v2.ts` and `LICENSES/edge-tts-LGPLv3.txt`.
You may modify and replace this module under LGPLv3; no replacement lock is used.
The remaining original dsh-voice code remains under the repository's MIT license.
