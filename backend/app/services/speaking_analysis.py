import os
import time
import httpx
import re
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

SPEAKING_COACH_PROMPT = """You are an expert IELTS Speaking examiner with 15+ years of experience.

CRITICAL: You MUST provide band scores in this EXACT format:
Fluency and Coherence: [score]
Lexical Resource: [score]
Grammatical Range and Accuracy: [score]
Pronunciation: [score]

Where [score] is a number from 0.0 to 9.0 (e.g., 6.5, 7.0, 8.5)

Then provide:
STRENGTHS:
1. [specific strength with example]
2. [specific strength with example]
3. [specific strength with example]

WEAKNESSES:
1. [specific weakness with example]
2. [specific weakness with example]
3. [specific weakness with example]

SUGGESTIONS:
1. [actionable suggestion]
2. [actionable suggestion]
3. [actionable suggestion]

Be precise, constructive, and reference specific parts of the response."""

class SpeakingAnalysisService:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"
        
    async def analyze_speaking(
        self,
        transcription: str,
        part_number: int,
        prompt_text: str,
        duration_seconds: int,
        word_count: int
    ) -> Dict[str, Any]:
        """
        Analyze IELTS speaking response and provide detailed feedback
        
        Args:
            transcription: Transcribed speech text
            part_number: 1, 2, or 3
            prompt_text: The question or topic
            duration_seconds: Duration of speech
            word_count: Number of words spoken
            
        Returns:
            Dict with band scores and detailed feedback
        """
        try:
            start_time = time.time()
            
            # Calculate speaking rate (words per minute)
            speaking_rate = (word_count / duration_seconds * 60) if duration_seconds > 0 else 0
            
            # Build analysis prompt
            analysis_prompt = f"""Analyze this IELTS Speaking Part {part_number} response:

**Prompt/Question:** {prompt_text}

**Candidate's Response:** {transcription}

**Speech Statistics:**
- Duration: {duration_seconds} seconds
- Word count: {word_count} words
- Speaking rate: {speaking_rate:.1f} words per minute

Provide your analysis in this EXACT format:

BAND SCORES:
Fluency and Coherence: [score 0-9]
Lexical Resource: [score 0-9]
Grammatical Range and Accuracy: [score 0-9]
Pronunciation: [score 0-9]
Overall Band: [score 0-9]

STRENGTHS:
1. [specific strength with example from response]
2. [specific strength with example from response]
3. [specific strength with example from response]

WEAKNESSES:
1. [specific weakness with example from response]
2. [specific weakness with example from response]
3. [specific weakness with example from response]

SUGGESTIONS:
1. [actionable suggestion for improvement]
2. [actionable suggestion for improvement]
3. [actionable suggestion for improvement]

Consider the IELTS Speaking criteria:
- Fluency and Coherence: flow, hesitations, coherence, discourse markers
- Lexical Resource: vocabulary range, appropriacy, paraphrasing
- Grammatical Range and Accuracy: sentence complexity, accuracy
- Pronunciation: individual sounds, word stress, intonation, rhythm"""
            
            # Call Groq API
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.base_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": SPEAKING_COACH_PROMPT},
                            {"role": "user", "content": analysis_prompt}
                        ],
                        "temperature": 0.3,
                        "max_tokens": 2000
                    },
                    timeout=60.0
                )
                response.raise_for_status()
                data = response.json()
            
            end_time = time.time()
            response_time_ms = int((end_time - start_time) * 1000)
            
            # Parse AI response
            ai_response = data["choices"][0]["message"]["content"]
            feedback = self._parse_feedback(ai_response, speaking_rate, duration_seconds)
            feedback["response_time_ms"] = response_time_ms
            feedback["model"] = self.model
            
            return feedback
            
        except Exception as e:
            print(f"Speaking Analysis Error: {str(e)}")
            raise Exception(f"Failed to analyze speaking: {str(e)}")
    
    def _parse_feedback(self, ai_response: str, speaking_rate: float, duration: int) -> Dict[str, Any]:
        """Parse structured feedback from AI response"""
        
        print(f"=== AI Response Preview ===")
        print(ai_response[:500])
        print("="*50)
        
        # Extract band scores using multiple regex patterns
        def extract_score(patterns):
            for pattern in patterns:
                match = re.search(pattern, ai_response, re.IGNORECASE | re.MULTILINE)
                if match:
                    try:
                        score = float(match.group(1))
                        return min(9.0, max(0.0, score))
                    except:
                        continue
            return None
        
        fluency = extract_score([
            r'Fluency and Coherence[:\s]+(\d+\.?\d*)',
            r'Fluency[:\s]+(\d+\.?\d*)',
            r'FC[:\s]+(\d+\.?\d*)'
        ])
        
        lexical = extract_score([
            r'Lexical Resource[:\s]+(\d+\.?\d*)',
            r'Lexical[:\s]+(\d+\.?\d*)',
            r'LR[:\s]+(\d+\.?\d*)'
        ])
        
        grammatical = extract_score([
            r'Grammatical[:\s]+(\d+\.?\d*)',
            r'Grammar[:\s]+(\d+\.?\d*)',
            r'Grammatical Range and Accuracy[:\s]+(\d+\.?\d*)',
            r'GRA[:\s]+(\d+\.?\d*)'
        ])
        
        pronunciation = extract_score([
            r'Pronunciation[:\s]+(\d+\.?\d*)',
            r'P[:\s]+(\d+\.?\d*)'
        ])
        
        overall = extract_score([
            r'Overall Band[:\s]+(\d+\.?\d*)',
            r'Overall[:\s]+(\d+\.?\d*)'
        ])
        
        # Assign default of 5.0 to missing scores
        fluency = fluency or 5.0
        lexical = lexical or 5.0
        grammatical = grammatical or 5.0
        pronunciation = pronunciation or 5.0
        
        # Calculate overall if not found
        if overall is None:
            overall = round((fluency + lexical + grammatical + pronunciation) / 4, 1)
        
        print(f"📊 Parsed Scores: Overall={overall}, FC={fluency}, LR={lexical}, GRA={grammatical}, P={pronunciation}")
        
        # Extract strengths
        strengths = []
        strengths_match = re.search(r'STRENGTHS:(.*?)(?:WEAKNESSES:|$)', ai_response, re.DOTALL | re.IGNORECASE)
        if strengths_match:
            strength_lines = strengths_match.group(1).strip().split('\n')
            for line in strength_lines:
                line = re.sub(r'^\d+\.\s*', '', line.strip())
                if line and len(line) > 10:
                    strengths.append(line)
        
        # Extract weaknesses
        weaknesses = []
        weaknesses_match = re.search(r'WEAKNESSES:(.*?)(?:SUGGESTIONS:|$)', ai_response, re.DOTALL | re.IGNORECASE)
        if weaknesses_match:
            weakness_lines = weaknesses_match.group(1).strip().split('\n')
            for line in weakness_lines:
                line = re.sub(r'^\d+\.\s*', '', line.strip())
                if line and len(line) > 10:
                    weaknesses.append(line)
        
        # Extract suggestions
        suggestions = []
        suggestions_match = re.search(r'SUGGESTIONS:(.*?)$', ai_response, re.DOTALL | re.IGNORECASE)
        if suggestions_match:
            suggestion_lines = suggestions_match.group(1).strip().split('\n')
            for line in suggestion_lines:
                line = re.sub(r'^\d+\.\s*', '', line.strip())
                if line and len(line) > 10:
                    suggestions.append(line)
        
        # Default fallbacks
        if not strengths:
            strengths = ["Good attempt at answering the question", "Maintained reasonable fluency", "Used appropriate vocabulary"]
        if not weaknesses:
            weaknesses = ["Could improve coherence", "Grammar needs attention", "Pronunciation could be clearer"]
        if not suggestions:
            suggestions = ["Practice speaking regularly", "Use more linking words", "Focus on sentence structure"]
        
        # Speaking rate feedback
        if speaking_rate < 100:
            weaknesses.append(f"Speaking rate is quite slow ({speaking_rate:.1f} words/min). Aim for 130-150 words/min.")
        elif speaking_rate > 200:
            weaknesses.append(f"Speaking rate is very fast ({speaking_rate:.1f} words/min). Slow down for better clarity.")
        
        # Duration feedback
        if duration < 30:
            weaknesses.append(f"Response was very brief ({duration}s). Try to elaborate more on your answers.")
        
        return {
            "overall_score": overall,
            "fluency_coherence": fluency,
            "lexical_resource": lexical,
            "grammatical_range": grammatical,
            "pronunciation": pronunciation,
            "strengths": strengths[:3],
            "weaknesses": weaknesses[:3],
            "suggestions": suggestions[:3],
            "filler_words": {"speaking_rate": speaking_rate, "duration": duration},
            "grammar_errors": {"raw_feedback": ai_response[:500]},
            "vocabulary_analysis": {"word_count": 0}
        }

# Create singleton instance
speaking_service = SpeakingAnalysisService()
