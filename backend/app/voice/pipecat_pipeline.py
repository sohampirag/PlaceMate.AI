import asyncio
import os
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.task import PipelineTask
from pipecat.pipeline.runner import PipelineRunner
from pipecat.frames.frames import EndFrame, LLMMessagesAppendFrame, TranscriptionFrame, TextFrame, Frame
from pipecat.processors.frame_processor import FrameProcessor, FrameDirection
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.services.cartesia.tts import CartesiaTTSService
from pipecat.services.google.llm import GoogleLLMService
import json
from app.config import settings

from pipecat.services.sarvam.stt import SarvamSTTService

class TranscriptSender(FrameProcessor):
    def __init__(self, websocket):
        super().__init__()
        self.websocket = websocket
    
    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)
        if isinstance(frame, TranscriptionFrame):
            try:
                await self.websocket.send_text(json.dumps({
                    "type": "transcript",
                    "speaker": "User",
                    "text": frame.text
                }))
            except Exception:
                pass
        elif isinstance(frame, TextFrame):
            try:
                await self.websocket.send_text(json.dumps({
                    "type": "transcript",
                    "speaker": "Agent",
                    "text": frame.text
                }))
            except Exception:
                pass


def create_system_prompt(interview_type: str, target_role: str, resume_context: str = "") -> str:
    if interview_type == "Technical":
        return f"You are a technical interviewer for the {target_role} role. Ask technical questions. The user's background: {resume_context}. Keep responses concise and conversational."
    else:
        return f"You are an HR interviewer for the {target_role} role. Ask behavioral and cultural fit questions. The user's background: {resume_context}. Keep responses concise and conversational."

async def run_voice_pipeline(transport, websocket, interview_type: str, target_role: str, resume_context: str = ""):
    """
    Sets up and runs the Pipecat voice pipeline for a single WebSocket session.
    """

    # 1. LLM Service (Using valid gemini-3.8-flash model)
    llm = GoogleLLMService(
        api_key=settings.GEMINI_API_KEY,
        settings=GoogleLLMService.Settings(model="gemini-3.8-flash")
    )

    # 2. TTS Service (Cartesia)
    tts = CartesiaTTSService(
        api_key=settings.CARTESIA_API_KEY,
        settings=CartesiaTTSService.Settings(voice="a0e99841-438c-4a64-b3a0-ea9227ef3c6a")
    )

    # 3. STT Service (Sarvam)
    from pipecat.transcriptions.language import Language
    stt = SarvamSTTService(
        api_key=settings.SARVAM_API_KEY,
        settings=SarvamSTTService.Settings(language=Language.EN_IN)
    )

    system_prompt = create_system_prompt(interview_type, target_role, resume_context)

    messages = [
        {"role": "system", "content": system_prompt},
    ]
    
    from pipecat.processors.aggregators.llm_response_universal import LLMContextAggregatorPair
    context = LLMContext(messages=messages)
    context_aggregator = LLMContextAggregatorPair(context=context)

    # Transcript Sender
    transcript_sender = TranscriptSender(websocket)

    # Construct the pipeline
    pipeline = Pipeline([
        transport.input(),
        stt,
        transcript_sender,
        context_aggregator.user(),
        llm,
        tts,
        transport.output(),
        context_aggregator.assistant()
    ])

    task = PipelineTask(pipeline, params=PipelineTask.Params(allow_interruptions=True))

    # Wait for the transport to be ready, then greet the user.
    @transport.event_handler("on_client_connected")
    async def on_client_connected(transport, client):
        messages.append({"role": "system", "content": "Please start the interview by greeting the candidate."})
        await task.queue_frames([LLMMessagesAppendFrame(messages, run_llm=True)])

    # Since websocket is already connected before run_voice_pipeline is called in fastapi
    # we can just queue the frame immediately to prompt the LLM for initial greeting:
    greeting = [{"role": "system", "content": "Please start the interview by greeting the candidate."}]
    await task.queue_frames([LLMMessagesAppendFrame(greeting, run_llm=True)])

    runner = PipelineRunner()
    await runner.run(task)
