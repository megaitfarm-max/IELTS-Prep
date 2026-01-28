import os
import time
import httpx
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

IELTS_TUTOR_SYSTEM_PROMPT = """You are an expert IELTS tutor with over 10 years of experience helping students achieve their target band scores. Your role is to:

1. **Answer Questions**: Provide clear, concise explanations about IELTS format, strategies, and tips.
2. **Grammar Help**: Explain grammar rules with examples relevant to IELTS writing and speaking.
3. **Vocabulary Building**: Suggest topic-specific vocabulary and collocations for IELTS.
4. **Writing Assistance**: Help brainstorm ideas, improve coherence, and enhance academic writing.
5. **Speaking Practice**: Suggest speaking topics, provide sample answers, and give pronunciation tips.
6. **Study Advice**: Recommend study plans, time management, and exam strategies.

Always be:
- Encouraging and supportive
- Specific with examples
- Focused on IELTS exam requirements
- Clear about band score criteria when relevant

Format your responses using markdown for readability. Use bullet points, numbered lists, and **bold** for emphasis when appropriate."""

class GroqChatService:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"
        
    async def send_message(
        self,
        message: str,
        conversation_history: Optional[list] = None,
        user_context: Optional[dict] = None
    ) -> Dict[str, Any]:
        """
        Send a message to Groq and get response
        
        Args:
            message: User's message
            conversation_history: List of previous messages in format [{"role": "user"/"assistant", "content": "..."}]
            
        Returns:
            Dict with response, tokens_used, and response_time_ms
        """
        try:
            start_time = time.time()
            
            # Build system prompt with user context
            system_prompt = IELTS_TUTOR_SYSTEM_PROMPT
            
            if user_context:
                context_info = f"\n\n**Student Information:**\n"
                if user_context.get('name'):
                    context_info += f"- Name: {user_context['name']}\n"
                if user_context.get('target_band'):
                    context_info += f"- Target Band Score: {user_context['target_band']}\n"
                if user_context.get('test_date'):
                    context_info += f"- Test Date: {user_context['test_date']}\n"
                if user_context.get('completed_lessons') is not None:
                    total = user_context.get('total_lessons', 0)
                    completed = user_context['completed_lessons']
                    context_info += f"- Progress: {completed}/{total} lessons completed\n"
                if user_context.get('modules'):
                    context_info += f"- Module Progress:\n"
                    for module, stats in user_context['modules'].items():
                        context_info += f"  - {module}: {stats['completed']}/{stats['total']} lessons\n"
                
                context_info += "\nUse this information to provide personalized, relevant advice based on the student's current progress and goals."
                system_prompt += context_info
            
            # Build messages array
            messages = [
                {"role": "system", "content": system_prompt}
            ]
            
            # Add conversation history if provided
            if conversation_history:
                messages.extend(conversation_history)
            
            # Add current message
            messages.append({"role": "user", "content": message})
            
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
                        "messages": messages,
                        "temperature": 0.7,
                        "max_tokens": 2000,
                        "top_p": 1.0
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
            
            end_time = time.time()
            response_time_ms = int((end_time - start_time) * 1000)
            
            # Extract response
            ai_response = data["choices"][0]["message"]["content"]
            tokens_used = data["usage"]["total_tokens"]
            
            return {
                "response": ai_response,
                "tokens_used": tokens_used,
                "response_time_ms": response_time_ms,
                "model": self.model
            }
            
        except Exception as e:
            print(f"Groq API Error: {str(e)}")
            raise Exception(f"Failed to get AI response: {str(e)}")

# Create singleton instance
openai_service = GroqChatService()
