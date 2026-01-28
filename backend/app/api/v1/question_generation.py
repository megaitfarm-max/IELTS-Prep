"""
AI-powered dynamic question generation for IELTS tests using Groq (primary), with Gemini and Ollama fallback
With YouTube transcript caching in database - NO REPEATED API CALLS!
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import json
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

async def call_groq(prompt: str) -> dict:
    """Call Groq API to generate content - FAST & POWERFUL!"""
    try:
        print(f"⚡ Calling Groq with model {settings.GROQ_MODEL}")
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": settings.GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": "You are an expert IELTS test creator. Return only valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 2000,
                    "response_format": {"type": "json_object"}
                }
            )
            
            if response.status_code != 200:
                error_text = response.text[:200]
                print(f"❌ Groq HTTP {response.status_code}: {error_text}")
                return None
            
            result = response.json()
            response_text = result["choices"][0]["message"]["content"]
            
            print(f"✅ Groq response received")
            
            try:
                parsed = json.loads(response_text)
                print(f"✅ Parsed {len(parsed.get('questions', []))} questions from Groq")
                return parsed
            except json.JSONDecodeError as e:
                print(f"❌ JSON error: {str(e)[:100]}")
                return None
                
    except Exception as e:
        print(f"❌ Groq error: {type(e).__name__}: {e}")
        return None

async def call_gemini(prompt: str) -> dict:
    """Call Gemini API as fallback"""
    try:
        print(f"🔷 Calling Gemini with model {settings.GEMINI_MODEL}")
        from google import genai
        
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt
        )
        
        response_text = response.text
        print(f"✅ Gemini response received")
        
        try:
            parsed = json.loads(response_text)
            print(f"✅ Parsed {len(parsed.get('questions', []))} questions from Gemini")
            return parsed
        except json.JSONDecodeError as e:
            print(f"❌ Gemini JSON error: {str(e)[:100]}")
            return None
            
    except Exception as e:
        print(f"❌ Gemini error: {type(e).__name__}: {e}")
        return None

async def call_ollama(prompt: str) -> dict:
    """Call Ollama API as final fallback"""
    try:
        print(f"🦙 Calling Ollama with model {settings.OLLAMA_MODEL}")
        
        async with httpx.AsyncClient(timeout=90.0) as client:
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
                print(f"❌ Ollama HTTP {response.status_code}")
                return None
            
            result = response.json()
            response_text = result.get("response", "")
            
            print(f"✅ Ollama response received")
            
            try:
                parsed = json.loads(response_text)
                print(f"✅ Parsed {len(parsed.get('questions', []))} questions from Ollama")
                return parsed
            except json.JSONDecodeError as e:
                print(f"❌ JSON error: {str(e)[:100]}")
                return None
                
    except Exception as e:
        print(f"❌ Ollama error: {type(e).__name__}: {e}")
        return None

@router.post("/generate-questions")
async def generate_questions(request: QuestionGenerationRequest):
    """Generate dynamic IELTS questions using AI with smart fallback (Groq → Gemini → Ollama → Fallback)"""
    
    question_types_str = ", ".join(request.question_types) if request.question_types else "fill-in-the-blank, multiple choice, true/false"
    
    if request.module_type == "listening":
        prompt = f"""You are an expert IELTS test creator. Create {request.num_questions} listening comprehension questions that are DIRECTLY BASED ON the transcript content below. 

IMPORTANT: Every question MUST be answerable from the transcript. DO NOT create generic questions. Use specific details, facts, names, and information from the transcript.

Transcript:
{request.content}

Requirements:
- Difficulty level: {request.difficulty}
- Question types: {question_types_str}
- Questions MUST test understanding of ACTUAL content in the transcript above
- For fill-in-the-blank: use specific facts, numbers, names, or quotes from the transcript
- For multiple choice: create questions about specific details mentioned in the transcript, with 4 options (A, B, C, D)
- For true/false: verify statements against the actual transcript content

Return ONLY valid JSON in this exact format:
{{
  "questions": [
    {{"type": "fill", "question": "According to the speaker, ___ is more important than knowledge", "difficulty": "medium"}},
    {{"type": "mcq", "question": "What does the speaker say about imagination?", "options": ["A) It is everything", "B) It is useless", "C) It is optional", "D) It is dangerous"], "difficulty": "medium"}},
    {{"type": "tf", "question": "The speaker believes that imagination is the preview of life's coming attractions", "options": ["True", "False", "Not Given"], "difficulty": "medium"}}
  ]
}}"""
    
    elif request.module_type == "reading":
        prompt = f"""Create {request.num_questions} IELTS reading comprehension questions based DIRECTLY on the passage content below.

IMPORTANT: Every question MUST be answerable from the passage. Use specific information, facts, and details from the text.

Passage:
{request.content}

Requirements:
- Difficulty: {request.difficulty}
- Question types: {question_types_str}
- Questions MUST test understanding of the ACTUAL passage above
- Test main ideas, specific details, inference, and vocabulary from the passage
- For fill-in-the-blank: use specific facts or terms from the passage
- For multiple choice: create questions about details in the passage with 4 options
- For true/false: verify statements against the passage content

Return ONLY valid JSON:
{{
  "questions": [
    {{"type": "fill", "question": "The passage states that climate change has increased global temperatures by ___ degrees", "difficulty": "medium"}},
    {{"type": "mcq", "question": "According to the passage, what is the main impact of climate change?", "options": ["A) Rising sea levels", "B) Lower temperatures", "C) More forests", "D) Less pollution"], "difficulty": "medium"}},
    {{"type": "tf", "question": "The passage mentions that the Paris Agreement was adopted in 2015", "options": ["True", "False", "Not Given"], "difficulty": "easy"}}
  ]
}}"""
    
    else:
        prompt = f"Generate {request.num_questions} {request.module_type} questions at {request.difficulty} difficulty. Return valid JSON with questions array."
    
    # Smart fallback chain: Groq → Gemini → Ollama → Fallback
    result = None
    provider = None
    model = None
    
    # Try Groq first (FAST!)
    if settings.AI_PROVIDER == "groq" or not result:
        result = await call_groq(prompt)
        if result:
            provider = "groq"
            model = settings.GROQ_MODEL
    
    # Try Gemini if Groq fails
    if not result and settings.GEMINI_API_KEY:
        print("⚠️ Groq failed, trying Gemini...")
        result = await call_gemini(prompt)
        if result:
            provider = "gemini"
            model = settings.GEMINI_MODEL
    
    # Try Ollama if both fail
    if not result:
        print("⚠️ Gemini failed, trying Ollama...")
        result = await call_ollama(prompt)
        if result:
            provider = "ollama"
            model = settings.OLLAMA_MODEL
    
    # Return result or fallback
    if result and "questions" in result:
        return {
            "questions": result["questions"],
            "generated_by": provider,
            "model": model
        }
    else:
        # Final fallback
        print("⚠️ All AI providers failed, returning fallback questions")
        fallback_questions = generate_fallback_questions(request.module_type, request.num_questions)
        return {
            "questions": fallback_questions,
            "generated_by": "fallback",
            "message": "AI unavailable, using fallback questions"
        }

@router.post("/fetch-youtube-transcript")
async def fetch_youtube_transcript(request: YouTubeTranscriptRequest, db: Session = Depends(get_db)):
    """
    Fetch YouTube video transcript with DATABASE CACHING
    👍 Checks DB first - NO REPEATED API CALLS!
    💾 Saves to DB - future requests are INSTANT!
    """
    try:
        video_id = request.video_id
        print(f"📺 Checking transcript for video: {video_id}")
        
        # 👍 CHECK DATABASE FIRST - NO REPEATED API CALLS!
        cached_transcript = db.query(VideoTranscript).filter(
            VideoTranscript.video_id == video_id
        ).first()
        
        if cached_transcript:
            print(f"✅ Using CACHED transcript from database (no API call)")
            return {
                "video_id": cached_transcript.video_id,
                "transcript": cached_transcript.transcript,
                "length": len(cached_transcript.transcript),
                "cached": True,
                "fetched_at": str(cached_transcript.fetched_at)
            }
        
        # Not in cache - fetch from YouTube ONLY ONCE
        print(f"🔄 Fetching NEW transcript from YouTube (will cache)...")
        transcript_result = YouTubeTranscriptApi().fetch(video_id)
        
        # Combine all text segments
        full_transcript = " ".join([snippet.text for snippet in transcript_result])
        last_snippet = list(transcript_result)[-1] if transcript_result else None
        duration = int(last_snippet.start + last_snippet.duration) if last_snippet else 0
        
        # 💾 SAVE TO DATABASE - next time use cached!
        new_transcript = VideoTranscript(
            video_id=video_id,
            video_url=f"https://www.youtube.com/watch?v={video_id}",
            transcript=full_transcript,
            duration=duration
        )
        db.add(new_transcript)
        db.commit()
        db.refresh(new_transcript)
        
        print(f"✅ Transcript SAVED to database - future calls will be INSTANT!")
        
        return {
            "video_id": video_id,
            "transcript": full_transcript,
            "length": len(full_transcript),
            "cached": False,
            "segments": len(list(transcript_result))
        }
        
    except Exception as e:
        print(f"❌ Error fetching transcript: {e}")
        raise HTTPException(
            status_code=400, 
            detail=f"Could not fetch transcript: {str(e)}"
        )

def generate_fallback_questions(module_type: str, num_questions: int) -> List[dict]:
    """Generate basic fallback questions when AI is unavailable"""
    questions = []
    
    for i in range(num_questions):
        if i % 3 == 0:
            questions.append({
                "type": "fill",
                "question": f"Fill in the blank: The {module_type} content mentions ___",
                "difficulty": "medium"
            })
        elif i % 3 == 1:
            questions.append({
                "type": "mcq",
                "question": f"What is discussed in this {module_type} section?",
                "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
                "difficulty": "medium"
            })
        else:
            questions.append({
                "type": "tf",
                "question": f"The {module_type} content is related to IELTS preparation",
                "difficulty": "easy"
            })
    
    return questions

@router.post("/generate-speaking-response")
async def generate_speaking_response(question: str, user_response: str):
    """Generate AI examiner follow-up question"""
    
    prompt = f"""You are an IELTS speaking examiner. Based on the candidate's response, generate a natural follow-up question.

Question asked: {question}
Candidate's response: {user_response}

Generate a follow-up question that:
- Explores the topic deeper
- Tests language ability
- Sounds natural and conversational

Return ONLY valid JSON:
{{
  "follow_up_question": "Can you elaborate on that point?",
  "feedback": "Good response"
}}"""
    
    result = await call_ollama(prompt)
    
    if result:
        return result
    else:
        return {
            "follow_up_question": "That's interesting. Can you tell me more about that?",
            "feedback": "Continue speaking naturally."
        }
