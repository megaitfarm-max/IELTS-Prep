import os
import time
import httpx
import re
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

WRITING_EXPERT_PROMPT = """You are an expert IELTS Writing examiner with 15+ years of experience.

CRITICAL: You MUST provide band scores in this EXACT format:
Task Achievement: [score]
Coherence and Cohesion: [score]
Lexical Resource: [score]
Grammatical Range and Accuracy: [score]

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

Be precise, constructive, and reference specific parts of the essay."""

class WritingAnalysisService:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"
        
    async def analyze_essay(
        self,
        essay: str,
        task_type: str,
        prompt: str
    ) -> Dict[str, Any]:
        """
        Analyze IELTS writing submission and provide detailed feedback
        
        Args:
            essay: User's essay text
            task_type: 'task1' or 'task2'
            prompt: The essay prompt/question
            
        Returns:
            Dict with band scores and detailed feedback
        """
        try:
            start_time = time.time()
            
            # Count words
            word_count = len(essay.split())
            
            # Build analysis prompt
            analysis_prompt = f"""Analyze this IELTS Writing {task_type.upper()} essay:

**Prompt:** {prompt}

**Essay:** {essay}

**Word Count:** {word_count}

Provide your analysis in this EXACT format:

BAND SCORES:
Task Achievement: [score 0-9]
Coherence and Cohesion: [score 0-9]
Lexical Resource: [score 0-9]
Grammatical Range and Accuracy: [score 0-9]
Overall Band: [score 0-9]

STRENGTHS:
1. [specific strength with example from essay]
2. [specific strength with example from essay]
3. [specific strength with example from essay]

WEAKNESSES:
1. [specific weakness with example from essay]
2. [specific weakness with example from essay]
3. [specific weakness with example from essay]

SUGGESTIONS:
1. [actionable suggestion]
2. [actionable suggestion]
3. [actionable suggestion]

GRAMMAR ERRORS:
- [list any significant grammar errors with corrections]

VOCABULARY:
- [vocabulary feedback and suggestions]
"""
            
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
                            {"role": "system", "content": WRITING_EXPERT_PROMPT},
                            {"role": "user", "content": analysis_prompt}
                        ],
                        "temperature": 0.3,  # Lower for more consistent scoring
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
            feedback = self._parse_feedback(ai_response, word_count)
            feedback["response_time_ms"] = response_time_ms
            feedback["model"] = self.model
            
            return feedback
            
        except Exception as e:
            print(f"Writing Analysis Error: {str(e)}")
            raise Exception(f"Failed to analyze essay: {str(e)}")
    
    def _parse_feedback(self, ai_response: str, word_count: int) -> Dict[str, Any]:
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
        
        task_achievement = extract_score([
            r'Task Achievement[:\s]+(\d+\.?\d*)',
            r'Task Achievement.*?(\d+\.?\d*)',
            r'TA[:\s]+(\d+\.?\d*)'
        ])
        
        coherence = extract_score([
            r'Coherence[:\s]+(\d+\.?\d*)',
            r'Coherence and Cohesion[:\s]+(\d+\.?\d*)',
            r'CC[:\s]+(\d+\.?\d*)'
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
        
        overall = extract_score([
            r'Overall Band[:\s]+(\d+\.?\d*)',
            r'Overall[:\s]+(\d+\.?\d*)'
        ])
        
        # Calculate average if any score is missing
        scores = [s for s in [task_achievement, coherence, lexical, grammatical] if s is not None]
        if len(scores) < 4:
            print(f"⚠️ WARNING: Only found {len(scores)}/4 criteria scores")
            # Assign default of 5.0 to missing scores
            task_achievement = task_achievement or 5.0
            coherence = coherence or 5.0
            lexical = lexical or 5.0
            grammatical = grammatical or 5.0
        
        # Calculate overall if not found
        if overall is None:
            overall = round((task_achievement + coherence + lexical + grammatical) / 4, 1)
        
        print(f"📊 Parsed Scores: Overall={overall}, TA={task_achievement}, CC={coherence}, LR={lexical}, GRA={grammatical}")
        
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
        suggestions_match = re.search(r'SUGGESTIONS:(.*?)(?:GRAMMAR ERRORS:|$)', ai_response, re.DOTALL | re.IGNORECASE)
        if suggestions_match:
            suggestion_lines = suggestions_match.group(1).strip().split('\n')
            for line in suggestion_lines:
                line = re.sub(r'^\d+\.\s*', '', line.strip())
                if line and len(line) > 10:
                    suggestions.append(line)
        
        # Default fallbacks
        if not strengths:
            strengths = ["Good attempt at addressing the task", "Reasonable organization", "Adequate vocabulary usage"]
        if not weaknesses:
            weaknesses = ["Could improve coherence", "Grammar needs attention", "Vocabulary range could be expanded"]
        if not suggestions:
            suggestions = ["Practice more varied sentence structures", "Use more linking words", "Proofread carefully"]
        
        # Word count feedback
        if word_count < 150 and "task1" in ai_response.lower():
            weaknesses.append(f"Word count is only {word_count}. Task 1 requires minimum 150 words.")
        elif word_count < 250 and "task2" in ai_response.lower():
            weaknesses.append(f"Word count is only {word_count}. Task 2 requires minimum 250 words.")
        
        return {
            "overall_score": overall,
            "task_achievement": task_achievement,
            "coherence_cohesion": coherence,
            "lexical_resource": lexical,
            "grammatical_range": grammatical,
            "strengths": strengths[:3],
            "weaknesses": weaknesses[:3],
            "suggestions": suggestions[:3],
            "grammar_errors": {"raw_feedback": ai_response},  # Store full response
            "vocabulary_suggestions": {"word_count": word_count}
        }

# Create singleton instance
writing_service = WritingAnalysisService()
