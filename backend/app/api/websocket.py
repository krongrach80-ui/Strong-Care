import json
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.database import AsyncSessionLocal
from app.services.face_service import face_service
from app.services.recognition_service import recognition_service

router = APIRouter(tags=['WebSocket'])

@router.websocket('/ws/live')
async def websocket_live_recognition(websocket: WebSocket):
    await websocket.accept()
    print('[WebSocket] Client connected for live recognition.')

    try:
        while True:
            data_text = await websocket.receive_text()
            try:
                msg = json.loads(data_text)
            except Exception:
                continue

            msg_type = msg.get('type')
            if msg_type == 'ping':
                await websocket.send_text(json.dumps({'type': 'pong'}))
                continue

            if msg_type == 'frame':
                image_b64 = msg.get('image')
                camera_id = msg.get('camera_id', 'webcam_0')

                if not image_b64:
                    continue

                img_bgr = face_service.decode_base64_image(image_b64)
                
                async with AsyncSessionLocal() as db:
                    result = await recognition_service.process_frame(
                        db=db,
                        image_bgr=img_bgr,
                        camera_id=camera_id,
                        record_db=True
                    )

                result['type'] = 'recognition_result'
                await websocket.send_text(json.dumps(result))

    except WebSocketDisconnect:
        print('[WebSocket] Client disconnected cleanly.')
    except Exception as e:
        print(f'[WebSocket] Error: {e}')
