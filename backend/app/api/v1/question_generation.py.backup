"""
AI-powered dynamic question generation for IELTS tests using Ollama
Generates unique questions with YouTube transcript caching in database
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import json
import re
import httpx
from sqlalchemy.orm import Session
from youtube_transcript_api import YouTubeTranscriptApi
from app.core.config import settings
from app.core.database import get_db
from app.models.transcript import VideoTranscript

router = APIRouter()

class QuestionGenerationRequest(BaseModel):
    module_type: str  # listening, reading, writing, speaking
    content: str  # Audio transcript, reading passage, or topic
    difficulty: str  # easy, medium, hard
    num_questions: int = 10
    question_types: Optional[List[str]] = None  # fill, mcq, tf

class YouTubeTranscriptRequest(BaseModel):
    video_id: str

class GeneratedQuestion(BaseModel):
    type: str
    question: str
    options: Optional[List[str]] = None
    difficulty: str

async def call_ollama(prompt: str) -> dict:
    """Call Ollama API to generate content"""
    try:
        print(f"🤖 Calling Ollama with model {settings.OLLAMA_MODEL}")
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": settings.OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json"
                }
            )
            
            if response.status_code != 200:
                print(f"❌ Ollama error: {response.status_code}")
                return None
            
            result = response.json()
            response_text = result.get('response', '')
            
            print(f"✅ Ollama response received")
            
            # Parse JSON response
            try:
                parsed = json.loads(response_text)
                print(f"✅ Parsed {len(parsed.get('questions', []))} questions")
                return parsed
            except json.JSONDecodeError:
                print(f"❌ JSON parse error")
                print(f"📝 Response: {response_text[:300]}")
                return None
                
    except Exception as e:
        print(f"❌ Ollama error: {type(e).__name__}: {e}")
        return None

@router.post("/generate-questions")
async def generate_questions(request: QuestionGenerationRequest):
    """Generate dynamic IELTS questions using Gemini AI"""
    
    question_types_str = ", ".join(request.question_types) if request.question_types else "fill-in-the-blank, multiple choice, true/false"
    
    if request.module_type == "listening":
        prompt = f"""You are an expert IELTS test creator. Generate {request.num_questions} listening comprehension questions based on this audio transcript.

Transcript:
{request.content}

Requirements:
- Difficulty level: {request.difficulty}
- Question types: {question_types_str}
- Questions should test understanding of main ideas, specific details, and implied information
- For fill-in-the-blank: focus on key facts, numbers, names
- For multiple choice: 4 options, only 1 correct
- For true/false: include "not given" option

Return ONLY valid JSON in this format:
{{
  "questions": [
    {{"type": "fill", "question": "The speaker's name is ___", "difficulty": "easy"}},
    {{"type": "mcq", "question": "What is the main topic?", "options": ["A", "B", "C", "D"], "difficulty": "medium"}},
    {{"type": "tf", "question": "The event is in the morning", "difficulty": "easy"}}
  ]
}}"""

    elif request.module_type == "reading":
        prompt = f"""You are an expert IELTS test creator. Generate {request.num_questions} reading comprehension questions based on this passage.

Passage:
{request.content}

Requirements:
- Difficulty level: {request.difficulty}
- Question types: {question_types_str}
- Test vocabulary, inference, main ideas, and details
- For true/false: include "not given" as an option
- For multiple choice: 4 plausible options
- For fill-in-the-blank: test key concepts

Return ONLY valid JSON in this format:
{{
  "questions": [
    {{"type": "tf", "question": "The author argues that...", "difficulty": "medium"}},
    {{"type": "mcq", "question": "What does the word 'X' mean?", "options": ["A", "B", "C", "D"], "difficulty": "hard"}},
    {{"type": "fill", "question": "The main cause is ___", "difficulty": "easy"}}
  ]
}}"""

    elif request.module_type == "writing":
        prompt = f"""You are an expert IELTS test creator. Generate {request.num_questions} writing task prompts.

Topic area: {request.content}
Difficulty: {request.difficulty}

Requirements:
- Include both Task 1 (data description) and Task 2 (essay) prompts
- Task 1: describe graphs, charts, diagrams, or processes
- Task 2: opinion essays, discussion essays, problem/solution, advantages/disadvantages
- Prompts should be clear and realistic

Return ONLY valid JSON in this format:
{{
  "questions": [
    {{"type": "task1", "question": "The graph shows... Summarize the information...", "difficulty": "medium"}},
    {{"type": "task2", "question": "Some people believe... Discuss both views...", "difficulty": "hard"}}
  ]
}}"""

    elif request.module_type == "speaking":
        prompt = f"""You are an expert IELTS speaking examiner. Generate {request.num_questions} speaking questions.

Topic area: {request.content}
Difficulty: {request.difficulty}

Requirements:
- Part 1: Personal questions (easy)
- Part 2: Long turn / cue card (medium)
- Part 3: Abstract discussion (hard)
- Questions should encourage extended responses

Return ONLY valid JSON in this format:
{{
  "questions": [
    {{"type": "part1", "question": "Do you enjoy...?", "difficulty": "easy"}},
    {{"type": "part2", "question": "Describe a time when you...", "difficulty": "medium"}},
    {{"type": "part3", "question": "How has society changed regarding...?", "difficulty": "hard"}}
  ]
}}"""
    
    else:
        raise HTTPException(status_code=400, detail="Invalid module type")
    
    # Call Gemini
    result = await call_gemini(prompt)
    
    if not result or "questions" not in result:
        # Fallback: return default questions
        return {
            "questions": generate_fallback_questions(request.module_type, request.num_questions),
            "generated_by": "fallback",
            "message": "AI unavailable, using fallback questions"
        }
    
    return {
        "questions": result["questions"],
        "generated_by": "gemini",
        "model": settings.GEMINI_MODEL
    }


def generate_fallback_questions(module_type: str, num: int) -> List[dict]:
    """Fallback questions if Ollama fails"""
    fallback = {
        "listening": [
            {"type": "fill", "question": "The speaker mentions ___", "difficulty": "easy"},
            {"type": "mcq", "question": "What is the main topic?", "options": ["A", "B", "C", "D"], "difficulty": "medium"}
        ],
        "reading": [
            {"type": "tf", "question": "The passage discusses...", "difficulty": "easy"},
            {"type": "mcq", "question": "According to the text...", "options": ["A", "B", "C", "D"], "difficulty": "medium"}
        ],
        "writing": [
            {"type": "task1", "question": "Describe the chart showing...", "difficulty": "medium"},
            {"type": "task2", "question": "Discuss the advantages and disadvantages of...", "difficulty": "hard"}
        ],
        "speaking": [
            {"type": "part1", "question": "Tell me about your hometown", "difficulty": "easy"},
            {"type": "part2", "question": "Describe a memorable experience", "difficulty": "medium"}
        ]
    }
    
    base_questions = fallback.get(module_type, fallback["listening"])
    return (base_questions * (num // len(base_questions) + 1))[:num]


@router.post("/generate-speaking-response")
async def generate_speaking_response(question: str, user_answer: str):
    """Generate AI examiner response for speaking test"""
    
    prompt = f"""You are an IELTS speaking examiner conducting a test. The candidate just answered your question.

Your question: {question}
Candidate's answer: {user_answer}

Provide:
1. A natural follow-up question or comment (like a real examiner would)
2. Brief feedback on their response (encouraging tone)

Return ONLY valid JSON:
{{
  "follow_up": "That's interesting. Can you tell me more about...",
  "feedback": "Good answer with relevant details.",
  "next_question": "Let's move on to..."
}}"""
    
    result = await call_gemini(prompt)
    
    if not result:
        return {
            "follow_up": "Thank you. Let's continue.",
            "feedback": "Good response.",
            "next_question": "Tell me more about your experience."
        }
    
    return result


@router.post("/fetch-youtube-transcript")
async def fetch_youtube_transcript(request: YouTubeTranscriptRequest):
    """Fetch transcript from YouTube video"""
    try:
        print(f"📺 Fetching transcript for video: {request.video_id}")
        
        # Get transcript
        transcript_list = YouTubeTranscriptApi.get_transcript(request.video_id)
        
        # Combine all text segments
        full_transcript = " ".join([entry['text'] for entry in transcript_list])
        
        print(f"✅ Fetched transcript: {len(full_transcript)} characters")
        
        return {
            "video_id": request.video_id,
            "transcript": full_transcript,
            "length": len(full_transcript),
            "segments": len(transcript_list)
        }
    except Exception as e:
        print(f"❌ Error fetching transcript: {e}")
        raise HTTPException(
            status_code=400, 
            detail=f"Could not fetch transcript: {str(e)}"
        )
