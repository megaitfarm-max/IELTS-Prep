from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
import httpx
import json
from app.core.config import settings

router = APIRouter()


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    stream: bool = False


class ChatResponse(BaseModel):
    message: str
    conversation_id: Optional[str] = None


class ReadingFeedbackRequest(BaseModel):
    passage: str
    answers: Dict


class WritingFeedbackRequest(BaseModel):
    text: str
    task_number: int


async def call_ollama(prompt: str) -> str:
    """Helper function to call Ollama API."""
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": settings.OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False
                }
            )
            response.raise_for_status()
            result = response.json()
            return result.get("response", "")
    except Exception as e:
        print(f"Ollama API error: {e}")
        return ""


@router.post("/reading-feedback")
async def get_reading_feedback(request: ReadingFeedbackRequest):
    """Get AI feedback on reading comprehension using Ollama."""
    try:
        prompt = f"""You are an IELTS Reading examiner. Analyze the student's reading comprehension based on this passage and their answers.

Passage:
{request.passage}

Student's Answers:
{json.dumps(request.answers, indent=2)}

Provide detailed feedback in JSON format with the following structure:
{{
  "comprehension_feedback": "Overall assessment of comprehension (2-3 sentences)",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["area to improve 1", "area to improve 2", "area to improve 3"],
  "reading_strategies": ["strategy 1", "strategy 2"]
}}

Respond only with valid JSON."""

        ollama_response = await call_ollama(prompt)
        
        # Parse JSON from response
        try:
            feedback_data = json.loads(ollama_response)
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            feedback_data = {
                "comprehension_feedback": "Good attempt at understanding the passage.",
                "strengths": ["Basic comprehension demonstrated", "Attempted all questions"],
                "improvements": ["Work on identifying key details", "Practice skimming and scanning"],
                "reading_strategies": ["Read the questions first", "Highlight key information"]
            }
        
        return feedback_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/writing-feedback")
async def get_writing_feedback(request: WritingFeedbackRequest):
    """Get AI feedback on writing using Ollama with IELTS criteria."""
    try:
        task_context = "a graph/chart summary" if request.task_number == 1 else "an argumentative essay"
        
        prompt = f"""You are an IELTS Writing examiner. Evaluate this Task {request.task_number} response ({task_context}).

Text:
{request.text}

Provide detailed IELTS band scores (0-9 scale) and feedback in JSON format:
{{
  "task_achievement": 7.0,
  "coherence": 7.5,
  "grammar": 7.0,
  "vocabulary": 7.5,
  "overall_feedback": "Detailed 2-3 sentence evaluation of the essay",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "specific_examples": ["example of good usage", "example that needs improvement"]
}}

Be realistic but encouraging. Respond only with valid JSON."""

        ollama_response = await call_ollama(prompt)
        
        # Parse JSON from response
        try:
            feedback_data = json.loads(ollama_response)
        except json.JSONDecodeError:
            # Fallback scoring based on word count
            word_count = len(request.text.split())
            base_score = min(7.0, 5.0 + (word_count / 100))
            
            feedback_data = {
                "task_achievement": round(base_score, 1),
                "coherence": round(base_score + 0.2, 1),
                "grammar": round(base_score - 0.1, 1),
                "vocabulary": round(base_score + 0.3, 1),
                "overall_feedback": f"Your essay demonstrates good effort. Continue practicing to improve fluency and accuracy.",
                "strengths": ["Clear attempt at addressing the task", "Reasonable length"],
                "improvements": ["Develop ideas more fully", "Use more varied sentence structures"],
                "specific_examples": ["Good use of topic sentences", "Work on transition phrases"]
            }
        
        return feedback_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
