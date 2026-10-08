import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pipecat.transports.websocket.fastapi import (
    FastAPIWebsocketTransport,
    FastAPIWebsocketParams
)
from app.voice.raw_pcm_serializer import RawPCMSerializer
from app.voice.pipecat_pipeline import run_voice_pipeline

router = APIRouter()

import re

def sanitize_name(raw_name: str) -> str:
    if not raw_name:
        return "Candidate"
    # If it's an email, take the part before @
    name = raw_name.split('@')[0]
    # Replace dots and underscores with space
    name = name.replace('.', ' ').replace('_', ' ')
    # Remove digits and special characters
    name = re.sub(r'[^a-zA-Z\s]', '', name)
    # Strip and Title case
    name = name.strip().title()
    return name if name else "Candidate"

@router.websocket("/ws/interview")
async def websocket_interview_endpoint(websocket: WebSocket, type: str = "Technical", role: str = "Software Engineer", name: str = "Candidate"):
    """
    WebSocket endpoint for the real-time voice interview using Pipecat.
    """
    clean_name = sanitize_name(name)
    await websocket.accept()
    
    # Configure the Pipecat WebSocket transport
    transport = FastAPIWebsocketTransport(
        websocket=websocket,
        params=FastAPIWebsocketParams(
            audio_out_enabled=True,
            add_wav_header=False,
            audio_out_sample_rate=16000,
            audio_in_enabled=True,
            audio_in_sample_rate=16000,
            serializer=RawPCMSerializer(sample_rate=16000, num_channels=1),
        )
    )
    
    try:
        # Run the Pipecat pipeline
        await run_voice_pipeline(transport, websocket, interview_type=type, target_role=role, user_name=clean_name)
    except WebSocketDisconnect:
        print("WebSocket disconnected")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error in websocket pipeline: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
    finally:
        pass
