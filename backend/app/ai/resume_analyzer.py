from app.config import settings
import json
from groq import AsyncGroq

client = AsyncGroq(api_key=settings.GROQ_API_KEY) if settings.GROQ_API_KEY else None

async def analyze_resume(extracted_text: str, target_role: str = "Software Engineer"):
    """
    Analyzes the extracted resume text using an LLM.
    Returns structured feedback on weak points, missing keywords, and formatting.
    """
    
    # If using a stub when no API key is provided
    if not client:
        return {
            "score": 75,
            "fixes": [
                "Add more quantifiable achievements in your experience section.",
                "Missing keywords: React, Node.js, Next.js for a frontend role."
            ],
            "weak_topics": ["System Design", "Cloud Deployment"]
        }
    
    system_prompt = (
        "You are an expert technical recruiter and resume reviewer. "
        "Analyze the following resume text against the target role. "
        "Identify weak points, suggest specific formatting/content fixes, "
        "and return the result as a JSON object with keys: "
        "'score' (0-100), 'fixes' (list of strings), 'weak_topics' (list of strings)."
    )
    
    try:
        response = await client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Target Role: {target_role}\n\nResume:\n{extracted_text}"}
            ],
            response_format={"type": "json_object"}
        )
        result = json.loads(response.choices[0].message.content)
        return result
    except Exception as e:
        print(f"Error during resume analysis: {e}")
        return {"error": str(e)}
