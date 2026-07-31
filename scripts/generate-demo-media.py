#!/usr/bin/env python3
"""Generate synthetic SMS Backup & Restore XML with demo media attachments.
All images sourced from Unsplash (CC0, free for personal/commercial use).
"""
import base64, os, time

SRC = '/tmp/demo-media'
OUT = '/tmp/smsviewer-code/examples/demo-media-messages.xml'

# Load all media files as base64
media = {}
for fname, ct in [
    ('photo_jpeg.jpg', 'image/jpeg'),
    ('thumb_jpeg.jpg', 'image/jpeg'),
    ('photo_small.jpg', 'image/jpeg'),
    ('photo_png.png', 'image/png'),
    ('thumb_png.png', 'image/png'),
    ('thumb2_png.png', 'image/png'),
    ('photo_gif.gif', 'image/gif'),
    ('anim_gif.gif', 'image/gif'),
    ('photo_webp.webp', 'image/webp'),
    ('photo_heic.heic', 'image/heic'),
    ('video_clip.mp4', 'video/mp4'),
    ('video_clip.3gp', 'video/3gpp'),
    ('audio_note.aac', 'audio/aac'),
    ('voice_note.aac', 'audio/aac'),
]:
    path = os.path.join(SRC, fname)
    if os.path.exists(path):
        with open(path, 'rb') as f:
            b64 = base64.b64encode(f.read()).decode('ascii')
        media[fname] = (b64, ct, os.path.getsize(path))

def part_xml(seq, fname, ct, text="null", name="null", cl=None):
    """Generate a <part> element."""
    b64, _, _ = media[fname]
    cl_attr = f' cl="{cl}"' if cl else ''
    return (
        f'      <part seq="{seq}" ct="{ct}" name="{name}" chset="null" cd="null" '
        f'fn="{fname}" cid="null"{cl_attr} ctt_s="null" ctt_t="null" '
        f'text="{text}" sub_id="2" data="{b64}" />\n'
    )

def mms_xml(date_ms, msg_box, address, contact, readable, parts, addrs):
    """Generate a complete <mms> element."""
    addr_xml = '\n'.join(
        f'        <addr addr="{a}" type="{t}" />'
        for a, t in addrs
    )
    return (
        f'  <mms date="{date_ms}" rr="null" sub="null" ct_t="null" read_status="null" '
        f'seen="1" msg_box="{msg_box}" address="{address}" sub_cs="null" resp_st="null" '
        f'retr_st="null" d_tm="null" text_only="1" exp="null" locked="0" m_id="null" '
        f'st="null" retr_txt_cs="null" retr_txt="null" '
        f'creator="com.google.android.apps.messaging" date_sent="{date_ms}" read="0" '
        f'm_size="null" rpt_a="null" ct_cls="null" pri="null" sub_id="-1" '
        f'tr_id="proto:{contact.replace(" ","")}" resp_txt="null" ct_l="null" '
        f'm_cls="null" d_rpt="null" v="null" '
        f'readable_date="{readable}" contact_name="{contact}">\n'
        f'    <parts>\n'
        f'      {part_xml(0, "dummy", "application/smil", cl="smil.txt")}\n'
        f'{parts}'
        f'    </parts>\n'
        f'    <addrs>\n'
        f'{addr_xml}\n'
        f'    </addrs>\n'
        f'  </mms>\n'
    )

def sms_xml(date_ms, msg_type, address, body, readable, contact):
    """Generate an <sms> element."""
    return (
        f'  <sms protocol="0" address="{address}" date="{date_ms}" type="{msg_type}" '
        f'subject="null" body="{body}" toa="null" sc_toa="null" service_center="null" '
        f'read="1" status="0" locked="0" date_sent="{date_ms}" sub_id="2" '
        f'readable_date="{readable}" contact_name="{contact}" />\n'
    )

# --- Smil dummy part will be handled inline, but we need a base64 placeholder
# Use a minimal SMIL XML
smil_data = base64.b64encode(
    b'<smil><head><layout><root-layout width="320" height="240"/></layout></head></smil>'
).decode('ascii')
media['dummy'] = (smil_data, 'application/smil', len(smil_data))

# Build the message timeline with timestamps
# Base timestamp: October 2025, spread across 3 days
base = 1728000000000  # some epoch ms
day = 86400000
now = base

def ts():
    global now
    now += 60000 + (now % 420000)  # 1-7 min intervals
    return str(now)

def readable(ts_ms):
    return time.strftime('%b %-d, %Y %-I:%M:%S %p',
                         time.localtime(int(ts_ms) / 1000))

lines = []
lines.append('<?xml version="1.0" encoding="UTF-8"?>\n')
lines.append(f'<smses count="40" backup_set="demo-media-{int(time.time())}">\n')

# ============================================================
# Thread 1: Alex Chen — JPEG landscape photo
# ============================================================
t1 = ts(); lines.append(sms_xml(t1, "1", "+15551234567", "Hey! Check out this sunset from the hike today", readable(t1), "Alex Chen"))
t2 = ts(); lines.append(mms_xml(t2, "1", "+15551234567", "Alex Chen", readable(t2),
    part_xml(1, "photo_jpeg.jpg", "image/jpeg", cl="sunset_view.jpg"),
    [("+15551234567", "137")]))
t3 = ts(); lines.append(sms_xml(t3, "2", "+15551234567", "Wow that's beautiful! Where was this?", readable(t3), "Alex Chen"))
t4 = ts(); lines.append(sms_xml(t4, "1", "+15551234567", "Mount Rainier trail — you should come next time!", readable(t4), "Alex Chen"))

# ============================================================
# Thread 2: Maria Santos — PNG screenshots
# ============================================================
now += day
t1 = ts(); lines.append(sms_xml(t1, "1", "+15552345678", "Can you help me read this error message?", readable(t1), "Maria Santos"))
t2 = ts(); lines.append(mms_xml(t2, "1", "+15552345678", "Maria Santos", readable(t2),
    part_xml(1, "photo_png.png", "image/png", cl="error_screenshot.png"),
    [("+15552345678", "137")]))
t3 = ts(); lines.append(sms_xml(t3, "2", "+15552345678", "It looks like a disk space warning — clear some temp files", readable(t3), "Maria Santos"))
t4 = ts(); lines.append(mms_xml(t4, "1", "+15552345678", "Maria Santos", readable(t4),
    part_xml(1, "thumb_png.png", "image/png", cl="detail_zoom.png"),
    [("+15552345678", "137")]))
t5 = ts(); lines.append(sms_xml(t5, "1", "+15552345678", "Here's a closer look at the specific error code", readable(t5), "Maria Santos"))

# ============================================================
# Thread 3: James Wilson — Animated GIF reaction
# ============================================================
now += day
t1 = ts(); lines.append(sms_xml(t1, "1", "+15553456789", "Happy birthday!!! 🎉🎂", readable(t1), "James Wilson"))
t2 = ts(); lines.append(mms_xml(t2, "2", "+15553456789", "James Wilson", readable(t2),
    part_xml(1, "anim_gif.gif", "image/gif", cl="birthday_reaction.gif"),
    [("+15553456789", "151")]))
t3 = ts(); lines.append(sms_xml(t3, "1", "+15553456789", "😂😂😂 that's absolutely perfect", readable(t3), "James Wilson"))
t4 = ts(); lines.append(sms_xml(t4, "2", "+15553456789", "Glad you like it! Had to find the right one 😄", readable(t4), "James Wilson"))

# ============================================================
# Thread 4: Sarah Johnson — WEBP web design preview
# ============================================================
now += day
t1 = ts(); lines.append(mms_xml(t1, "1", "+15554567890", "Sarah Johnson", readable(t1),
    part_xml(1, "photo_webp.webp", "image/webp", cl="hero_design.webp"),
    [("+15554567890", "137")]))
t2 = ts(); lines.append(sms_xml(t2, "1", "+15554567890", "New hero image concept — used WEBP for faster page loads", readable(t2), "Sarah Johnson"))
t3 = ts(); lines.append(sms_xml(t3, "2", "+15554567890", "Looks clean! File size is way smaller than the PNG version", readable(t3), "Sarah Johnson"))

# ============================================================
# Thread 5: David Kim — HEIC from iPhone (tests unsupported format)
# ============================================================
now += day
t1 = ts(); lines.append(mms_xml(t1, "1", "+15555678901", "David Kim", readable(t1),
    part_xml(1, "photo_heic.heic", "image/heic", cl="IMG_4827.HEIC"),
    [("+15555678901", "137")]))
t2 = ts(); lines.append(sms_xml(t2, "1", "+15555678901", "Sent from my iPhone — does this photo look right to you?", readable(t2), "David Kim"))
t3 = ts(); lines.append(sms_xml(t3, "2", "+15555678901", "I can't open HEIC in my browser... can you resend as JPEG?", readable(t3), "David Kim"))
t4 = ts(); lines.append(sms_xml(t4, "1", "+15555678901", "Ah right, here it is converted", readable(t4), "David Kim"))
t5 = ts(); lines.append(mms_xml(t5, "1", "+15555678901", "David Kim", readable(t5),
    part_xml(1, "thumb_jpeg.jpg", "image/jpeg", cl="IMG_4827.jpg"),
    [("+15555678901", "137")]))

# ============================================================
# Thread 6: Emily Davis — MP4 video clip
# ============================================================
now += day
t1 = ts(); lines.append(mms_xml(t1, "1", "+15556789012", "Emily Davis", readable(t1),
    part_xml(1, "video_clip.mp4", "video/mp4", cl="puppy_play.mp4"),
    [("+15556789012", "137")]))
t2 = ts(); lines.append(sms_xml(t2, "1", "+15556789012", "Quick video of the new puppy playing in the yard!", readable(t2), "Emily Davis"))
t3 = ts(); lines.append(sms_xml(t3, "2", "+15556789012", "So cute!! What breed?", readable(t3), "Emily Davis"))
t4 = ts(); lines.append(sms_xml(t4, "1", "+15556789012", "Golden retriever mix — 10 weeks old 🐕", readable(t4), "Emily Davis"))

# ============================================================
# Thread 7: Michael Brown — 3GP video from old phone
# ============================================================
now += day
t1 = ts(); lines.append(sms_xml(t1, "1", "+15557890123", "Found this old clip buried on my old flip phone 😂", readable(t1), "Michael Brown"))
t2 = ts(); lines.append(mms_xml(t2, "1", "+15557890123", "Michael Brown", readable(t2),
    part_xml(1, "video_clip.3gp", "video/3gpp", cl="VID_2008.3gp"),
    [("+15557890123", "137")]))
t3 = ts(); lines.append(sms_xml(t3, "2", "+15557890123", "The quality is... something! 3GP really takes me back", readable(t3), "Michael Brown"))

# ============================================================
# Thread 8: Lisa Park — Multi-image MMS (JPEG + PNG + GIF)
# ============================================================
now += day
t1 = ts(); lines.append(sms_xml(t1, "1", "+15558901234", "Here are the inspection photos from today's walkthrough", readable(t1), "Lisa Park"))
t2 = ts(); lines.append(mms_xml(t2, "1", "+15558901234", "Lisa Park", readable(t2),
    part_xml(1, "photo_small.jpg", "image/jpeg", cl="inspection_1.jpg")
    + part_xml(2, "photo_png.png", "image/png", cl="inspection_2.png")
    + part_xml(3, "photo_gif.gif", "image/gif", cl="floorplan.gif"),
    [("+15558901234", "137")]))
t3 = ts(); lines.append(sms_xml(t3, "2", "+15558901234", "Everything checks out — that floor plan GIF is really helpful", readable(t3), "Lisa Park"))

# ============================================================
# Thread 9: Tom Harris — AAC audio message
# ============================================================
now += day
t1 = ts(); lines.append(mms_xml(t1, "1", "+15559012345", "Tom Harris", readable(t1),
    part_xml(1, "audio_note.aac", "audio/aac", cl="meeting_recap.aac"),
    [("+15559012345", "137")]))
t2 = ts(); lines.append(sms_xml(t2, "1", "+15559012345", "Voice note from the quarterly review meeting — action items at the end", readable(t2), "Tom Harris"))
t3 = ts(); lines.append(sms_xml(t3, "2", "+15559012345", "Got it, listening now. I'll follow up on items 3 and 5", readable(t3), "Tom Harris"))

# ============================================================
# Thread 10: Rachel Green — Voice note
# ============================================================
now += day
t1 = ts(); lines.append(sms_xml(t1, "1", "+15550123456", "Quick question about the proposal draft", readable(t1), "Rachel Green"))
t2 = ts(); lines.append(mms_xml(t2, "1", "+15550123456", "Rachel Green", readable(t2),
    part_xml(1, "voice_note.aac", "audio/aac", cl="voice_question.aac"),
    [("+15550123456", "137")]))
t3 = ts(); lines.append(sms_xml(t3, "2", "+15550123456", "Section 4 needs the budget numbers updated — use the Q3 projections. Thanks! 🙏", readable(t3), "Rachel Green"))
t4 = ts(); lines.append(sms_xml(t4, "1", "+15550123456", "Will do, sending the revised version by EOD", readable(t4), "Rachel Green"))

# ============================================================
# Thread 11: Kevin O'Brien — Mixed thread with multiple types
# ============================================================
now += day
t1 = ts(); lines.append(sms_xml(t1, "1", "+15551239876", "Contractor sent over the renovation estimates", readable(t1), "Kevin O'Brien"))
t2 = ts(); lines.append(mms_xml(t2, "1", "+15551239876", "Kevin O'Brien", readable(t2),
    part_xml(1, "photo_small.jpg", "image/jpeg", cl="estimate_page1.jpg"),
    [("+15551239876", "137")]))
t3 = ts(); lines.append(sms_xml(t3, "1", "+15551239876", "And the materials list with pricing", readable(t3), "Kevin O'Brien"))
t4 = ts(); lines.append(mms_xml(t4, "1", "+15551239876", "Kevin O'Brien", readable(t4),
    part_xml(1, "photo_webp.webp", "image/webp", cl="materials_list.webp")
    + part_xml(2, "thumb2_png.png", "image/png", cl="materials_detail.png"),
    [("+15551239876", "137")]))
t5 = ts(); lines.append(sms_xml(t5, "2", "+15551239876", "These look reasonable. Let's move forward with option B", readable(t5), "Kevin O'Brien"))

# ============================================================
# Thread 12: Jennifer Lee — HEIC + video combo (mixed unsupported/supported)
# ============================================================
now += day
t1 = ts(); lines.append(sms_xml(t1, "1", "+15556543210", "From the tech conference today!", readable(t1), "Jennifer Lee"))
t2 = ts(); lines.append(mms_xml(t2, "1", "+15556543210", "Jennifer Lee", readable(t2),
    part_xml(1, "photo_heic.heic", "image/heic", cl="keynote_photo.HEIC")
    + part_xml(2, "video_clip.mp4", "video/mp4", cl="demo_clip.mp4"),
    [("+15556543210", "137")]))
t3 = ts(); lines.append(sms_xml(t3, "1", "+15556543210", "Keynote photo from my iPhone and a quick video of the robotics demo 🤖", readable(t3), "Jennifer Lee"))
t4 = ts(); lines.append(sms_xml(t4, "2", "+15556543210", "Incredible! That robot arm demo is wild — thanks for sharing!", readable(t4), "Jennifer Lee"))

lines.append('</smses>\n')

# Write the file
with open(OUT, 'w', encoding='utf-8') as f:
    f.writelines(lines)

size_mb = os.path.getsize(OUT) / (1024 * 1024)
print(f"Written {OUT}")
print(f"Size: {size_mb:.1f} MB")
print(f"Messages: ~40 SMS/MMS across 12 conversations")

# Count parts
import re
mms_count = sum(1 for l in lines if '<mms ' in l)
sms_count = sum(1 for l in lines if '<sms ' in l)
part_count = sum(1 for l in lines if '<part seq=' in l)
print(f"SMS: {sms_count}, MMS: {mms_count}, Parts: {part_count}")
