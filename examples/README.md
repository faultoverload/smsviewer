# Demo Media Messages

This directory contains a synthetic SMS Backup & Restore XML file for
demonstrating the MMS media loading feature.

## `demo-media-messages.xml`

A fictional backup with 12 conversation threads containing 15 MMS messages
with embedded media attachments. All images are sourced from
[Unsplash](https://unsplash.com) (CC0 - free for personal and commercial use).

### Media types covered

| Type | Content Type | Renders inline? | Notes |
|------|-------------|----------------|-------|
| JPEG | `image/jpeg` | ✅ Yes | Standard photos |
| PNG | `image/png` | ✅ Yes | Screenshots |
| GIF | `image/gif` | ✅ Yes | Animated reactions |
| WEBP | `image/webp` | ✅ Yes | Modern web format |
| **HEIC** | `image/heic` | ❌ No | iOS format — shows download link |
| MP4 | `video/mp4` | ✅ Yes | Video with controls |
| 3GPP | `video/3gpp` | ✅ Yes | Legacy phone video |
| AAC | `audio/aac` | 🎵 Download | Audio attachment |

### Conversation threads

1. **Alex Chen** — JPEG landscape photo
2. **Maria Santos** — PNG screenshots
3. **James Wilson** — Animated GIF reaction
4. **Sarah Johnson** — WEBP design preview
5. **David Kim** — HEIC from iPhone (tests unsupported format fallback)
6. **Emily Davis** — MP4 video clip
7. **Michael Brown** — 3GP video from old phone
8. **Lisa Park** — Multi-image MMS (JPEG + PNG + GIF)
9. **Tom Harris** — AAC audio message
10. **Rachel Green** — Voice note
11. **Kevin O'Brien** — Mixed media (JPEG + WEBP + PNG)
12. **Jennifer Lee** — HEIC + video combo (mixed supported/unsupported)

### Usage

1. Open smsviewer with media import enabled (toggle ON)
2. Select `demo-media-messages.xml`
3. Browse conversations to see inline images and video
4. Open the David Kim or Jennifer Lee threads to see the HEIC download fallback

### Regenerating

The individual source images are from [Lorem Picsum](https://picsum.photos)
(Unsplash CC0). To rebuild:

```bash
python3 scripts/generate-demo-media.py
```

### License

All images: [Unsplash License](https://unsplash.com/license) —
free for personal and commercial use. No attribution required, but appreciated.
