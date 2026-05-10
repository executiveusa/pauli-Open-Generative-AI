# Model Provider Matrix (Planned)

| Capability | Primary | Fallback 1 | Fallback 2 | Paid Gate |
|---|---|---|---|---|
| text-to-image | local | Hugging Face | Muapi/stub | fal allowed only when allowPaid=true |
| image-to-video | local/LTX | ComfyUI | Muapi/stub | fal allowed only when allowPaid=true |
| text-to-video | local/LTX | ComfyUI | Muapi/stub | fal allowed only when allowPaid=true |
| lipsync | Muapi/local | ComfyUI (future) | stub | paid route policy enforced |
| visualizer | FFmpeg local | stub | n/a | free |
| mix/master | FFmpeg local | optional plugins | stub | free |
