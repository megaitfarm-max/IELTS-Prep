from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

# Conversation Schemas
class ConversationBase(BaseModel):
    title: Optional[str] = None

class ConversationCreate(ConversationBase):
    pass

class ConversationResponse(ConversationBase):
    id: int
    conversation_id: UUID
    user_id: int
    created_at: datetime
    updated_at: datetime
    message_count: Optional[int] = 0

    class Config:
        from_attributes = True

# Message Schemas
class MessageBase(BaseModel):
    message: str = Field(..., min_length=1, max_length=5000)

class MessageCreate(MessageBase):
    conversation_id: Optional[UUID] = None

class MessageResponse(BaseModel):
    id: int
    conversation_id: UUID
    message: str
    response: str
    ai_model: str
    tokens_used: Optional[int] = None
    response_time_ms: Optional[int] = None
    helpful: Optional[bool] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=5000)
    conversation_id: Optional[UUID] = None
    user_context: Optional[dict] = None

class ChatResponse(BaseModel):
    conversation_id: UUID
    message: str
    response: str
    ai_model: str
    tokens_used: Optional[int] = None
    response_time_ms: Optional[int] = None
    created_at: datetime

class FeedbackRequest(BaseModel):
    message_id: int
    helpful: bool
