"""Raw PCM audio serializer for browser WebSocket connections.

Handles raw 16-bit PCM audio frames directly without protobuf encoding.
The browser sends raw PCM bytes and receives raw PCM bytes (with optional WAV header).
"""

import struct

from pipecat.frames.frames import (
    Frame,
    InputAudioRawFrame,
    OutputAudioRawFrame,
)
from pipecat.serializers.base_serializer import FrameSerializer


class RawPCMSerializer(FrameSerializer):
    """Serializer that handles raw PCM 16-bit audio for browser WebSocket connections.

    - Deserialize: incoming binary data → InputAudioRawFrame
    - Serialize: OutputAudioRawFrame → raw PCM bytes
    """

    def __init__(self, sample_rate: int = 16000, num_channels: int = 1):
        super().__init__()
        self._sample_rate = sample_rate
        self._num_channels = num_channels

    async def serialize(self, frame: Frame) -> str | bytes | None:
        if isinstance(frame, OutputAudioRawFrame):
            return frame.audio
        return None

    async def deserialize(self, data: str | bytes) -> Frame | None:
        if isinstance(data, (bytes, bytearray)):
            return InputAudioRawFrame(
                audio=bytes(data),
                sample_rate=self._sample_rate,
                num_channels=self._num_channels,
            )
        return None
