import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import json
import cv2
import base64

import os
dest = os.path.join(os.path.dirname(__file__), "backend", "storage", "test_face.jpg")
img = cv2.imread(dest)
_, buf = cv2.imencode('.jpg', img)
b64_img = 'data:image/jpeg;base64,' + base64.b64encode(buf).decode()

# 1. Register Person
reg_payload = json.dumps({
    "username": "somchai_01",
    "display_name": "สมชาย ใจดี",
    "role": "OPERATOR",
    "angle_label": "front",
    "image_base64": b64_img
}).encode("utf-8")

req = urllib.request.Request("http://127.0.0.1:8000/api/v1/faces/register", data=reg_payload, headers={"Content-Type": "application/json"})
res = urllib.request.urlopen(req)
print("Registration Response:", json.loads(res.read().decode()))

# 2. Simulate consecutive frames
rec_payload = json.dumps({
    "image_base64": b64_img,
    "camera_id": "cam_main"
}).encode("utf-8")

for frame_idx in range(1, 5):
    req_rec = urllib.request.Request("http://127.0.0.1:8000/api/v1/recognition/recognize", data=rec_payload, headers={"Content-Type": "application/json"})
    res_rec = urllib.request.urlopen(req_rec)
    r = json.loads(res_rec.read().decode())
    print(f"Frame {frame_idx}: status={r['status']}, confidence={r['confidence']}, hits={r['confirmation_count']}/{r['confirmation_target']}, confirmed={r['confirmed']}, voice_triggered={r['voice_triggered']}, text={r['voice_text']}")

# 3. Check Attendance
req_att = urllib.request.urlopen("http://127.0.0.1:8000/api/v1/attendance/today")
print("Today Attendance:", json.loads(req_att.read().decode()))
