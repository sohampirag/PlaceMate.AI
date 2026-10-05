import asyncio
import os
import json
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.task import PipelineTask, PipelineParams
from pipecat.pipeline.runner import PipelineRunner
from pipecat.frames.frames import (
    EndFrame, 
    LLMMessagesAppendFrame, 
    TranscriptionFrame, 
    InterimTranscriptionFrame,
    TextFrame, 
    Frame,
    LLMFullResponseStartFrame,
    LLMFullResponseEndFrame,
    BotSpeakingFrame,
    UserSpeakingFrame,
    TTSTextFrame,
)
from pipecat.processors.frame_processor import FrameProcessor, FrameDirection
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import LLMContextAggregatorPair, LLMUserAggregatorParams
from pipecat.turns.user_turn_strategies import ExternalUserTurnStrategies

from pipecat.services.cartesia.tts import CartesiaTTSService
from pipecat.services.google.llm import GoogleLLMService
from app.voice.resilient_llm import ResilientGoogleLLMService
from pipecat.services.sarvam.stt import SarvamSTTService
from pipecat.transcriptions.language import Language
from app.config import settings

class UserTranscriptSender(FrameProcessor):
    def __init__(self, websocket):
        super().__init__()
        self.websocket = websocket
    
    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)
        
        # In newer Pipecat versions, interim frames might be InterimTranscriptionFrame
        if type(frame).__name__ in ("TranscriptionFrame", "InterimTranscriptionFrame"):
            text = getattr(frame, "text", "")
            if text:
                try:
                    await self.websocket.send_text(json.dumps({
                        "type": "transcript",
                        "speaker": "User",
                        "text": text,
                        "is_final": type(frame).__name__ == "TranscriptionFrame"
                    }))
                except Exception as e:
                    import traceback
                    traceback.print_exc()
                    print(f"Error sending user transcript: {e}")
        
        await self.push_frame(frame, direction)

class AgentTranscriptSender(FrameProcessor):
    def __init__(self, websocket):
        super().__init__()
        self.websocket = websocket
        self._text_buffer = []
    
    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)
        
        if isinstance(frame, LLMFullResponseStartFrame):
            self._text_buffer = []
        elif isinstance(frame, TextFrame) and not isinstance(frame, TTSTextFrame):
            # TTSTextFrame is Cartesia's word-by-word echo of the same text; skip it to avoid duplicates
            self._text_buffer.append(frame.text)
        elif isinstance(frame, LLMFullResponseEndFrame):
            text = "".join(self._text_buffer).strip()
            if text:
                try:
                    await self.websocket.send_text(json.dumps({
                        "type": "transcript",
                        "speaker": "Agent",
                        "text": text
                    }))
                except Exception:
                    pass
            self._text_buffer = []
            
        await self.push_frame(frame, direction)

def create_system_prompt(interview_type: str, target_role: str, user_name: str = "Candidate", resume_context: str = "") -> str:
    if interview_type == "Technical":
        return f"You are a friendly AI technical interviewer. The candidate's name is {user_name}. First, ask the user what specific role they want to interview for today. Wait for their response. Once they tell you, conduct a TECHNICAL interview for that role. Ask technical questions related to that role. Keep your responses concise and conversational. Do not give long monologues. IMPORTANT: ALWAYS reply in English ONLY. Never use Arabic or any other language. When you finish the interview, state that you will provide a performance report covering technical, aptitude, and HR aspects."
    else:
        return f"You are a friendly AI HR interviewer. The candidate's name is {user_name}. First, ask the user what specific role they want to interview for today. Wait for their response. Once they tell you, conduct an HR and behavioral interview for that role. Ask HR-related questions. Keep your responses concise and conversational. Do not give long monologues. IMPORTANT: ALWAYS reply in English ONLY. Never use Arabic or any other language. When you finish the interview, state that you will provide a performance report covering technical, aptitude, and HR aspects."

async def run_voice_pipeline(transport, websocket, interview_type: str, target_role: str, user_name: str = "Candidate", resume_context: str = ""):
    """
    Sets up and runs the Pipecat voice pipeline for a single WebSocket session.
    """
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not set.")

    # 1. LLM Service - Text based Google API
    system_prompt = create_system_prompt(interview_type, target_role, user_name, resume_context)
    # NOTE: gemini-1.5-flash / 2.0-flash / 2.5-flash are retired (404) -> the LLM
    # produced nothing, so the agent never spoke. Model is configurable via .env.
    llm = ResilientGoogleLLMService(
        api_key=settings.GEMINI_API_KEY,
        fallback_models=[m.strip() for m in settings.GEMINI_FALLBACK_MODELS.split(",")],
        settings=GoogleLLMService.Settings(
            model=settings.GEMINI_MODEL,
            system_instruction=system_prompt,
            # Pipecat defaults Gemini 3.x to thinking_level="minimal", which this model
            # rejects with 400 -> LLM becomes unusable and the agent stays silent.
            thinking=GoogleLLMService.ThinkingConfig(thinking_level="low"),
        )
    )
    
    # 2. TTS Service (Cartesia - Jacqueline 'Reassuring Agent')
    tts = CartesiaTTSService(
        api_key=settings.CARTESIA_API_KEY,
        settings=CartesiaTTSService.Settings(voice="9626c31c-bec5-4cca-baa8-f8ba9e84c8bc") # Jacqueline
    )

    # 3. STT Service (Sarvam)
    # vad_signals=True makes Sarvam detect speech start/end server-side and emit
    # ProposedUserStarted/StoppedSpeakingFrame. Without it (and without a local VAD)
    # Sarvam never finalizes transcripts and the user turn never ends.
    stt = SarvamSTTService(
        api_key=settings.SARVAM_API_KEY,
        settings=SarvamSTTService.Settings(language=Language.EN_IN, vad_signals=True)
    )

    context = LLMContext()
    
    # We DO NOT use SileroVADAnalyzer / Smart-Turn here to prevent the ONNX crash.
    # ExternalUserTurnStrategies lets Sarvam's VAD signals decide when a turn starts/stops.
    context_aggregator = LLMContextAggregatorPair(
        context=context,
        user_params=LLMUserAggregatorParams(
            user_turn_strategies=ExternalUserTurnStrategies()
        )
    )

    user_transcript = UserTranscriptSender(websocket)
    agent_transcript = AgentTranscriptSender(websocket)

    # Construct the pipeline
    pipeline = Pipeline([
        transport.input(),
        stt,
        user_transcript,
        context_aggregator.user(),
        llm,
        tts,
        agent_transcript,
        transport.output(),
        context_aggregator.assistant()
    ])

    task = PipelineTask(
        pipeline, 
        params=PipelineParams(
            audio_in_sample_rate=16000,
            audio_out_sample_rate=16000 # Cartesia outputs 16kHz audio natively
        ),
        enable_rtvi=False,  # Browser client uses raw PCM, not the RTVI protocol
        # Default 20s setup limit is too tight for cold Sarvam/Cartesia connects and
        # was ending the session automatically.
        setup_timeout_secs=60,
        start_timeout_secs=60,
        # Default idle timeout only resets on Bot/UserSpeakingFrame. Without local VAD,
        # UserSpeakingFrame never fires, so also count transcriptions as activity.
        idle_timeout_secs=600,
        idle_timeout_frames=(
            BotSpeakingFrame,
            UserSpeakingFrame,
            TranscriptionFrame,
            InterimTranscriptionFrame,
        ),
    )

    @transport.event_handler("on_client_connected")
    async def on_client_connected(transport, client):
        greeting_msg = [{"role": "user", "content": f"Please start the interview by greeting the candidate by their name (Hello {user_name}), asking them what role they are interviewing for today, and wait for their response."}]
        await task.queue_frames([LLMMessagesAppendFrame(greeting_msg, run_llm=True)])

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(transport, client):
        await task.cancel()

    runner = PipelineRunner(handle_sigint=False)
    await runner.run(task)
