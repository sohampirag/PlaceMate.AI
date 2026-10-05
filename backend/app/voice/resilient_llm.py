"""Gemini LLM service that survives transient 503/429 "high demand" errors.

Pipecat's GoogleLLMService treats a 503 as a non-fatal error: it logs it and drops
the turn, so the agent simply stays silent. This subclass wraps the streaming call
so overloaded models are retried and, if still unavailable, the request falls back
to the next model in the list.
"""

import asyncio

from google.genai import errors as genai_errors
from loguru import logger
from pipecat.services.google.llm import GoogleLLMService

_RETRYABLE_CODES = {429, 500, 503, 504}


class ResilientGoogleLLMService(GoogleLLMService):
    def __init__(self, *, fallback_models: list[str] | None = None, **kwargs):
        self._fallback_models = [m for m in (fallback_models or []) if m]
        super().__init__(**kwargs)

    def create_client(self):
        super().create_client()
        models_api = self._client.aio.models
        original_stream = models_api.generate_content_stream
        fallbacks = self._fallback_models

        async def resilient_stream(*, model, contents, config, **kw):
            candidates = [model] + [m for m in fallbacks if m != model]
            last_error: Exception | None = None
            for idx, candidate in enumerate(candidates):
                for attempt in range(2):
                    try:
                        stream = await original_stream(model=candidate, contents=contents, config=config, **kw)
                        # The request is sent lazily; pull the first chunk so errors surface here.
                        iterator = stream.__aiter__()
                        first = await iterator.__anext__()
                    except StopAsyncIteration:
                        first, iterator = None, None
                    except genai_errors.APIError as e:
                        if getattr(e, "code", None) not in _RETRYABLE_CODES:
                            raise
                        last_error = e
                        logger.warning(f"Gemini model {candidate} unavailable ({e.code}), attempt {attempt + 1}")
                        await asyncio.sleep(0.5 * (attempt + 1))
                        continue

                    if idx > 0:
                        logger.warning(f"Gemini fell back to model {candidate}")

                    async def _replay(first=first, iterator=iterator):
                        if first is not None:
                            yield first
                        if iterator is not None:
                            async for chunk in iterator:
                                yield chunk

                    return _replay()
            raise last_error  # type: ignore[misc]

        models_api.generate_content_stream = resilient_stream
