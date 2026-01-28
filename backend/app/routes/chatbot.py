from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from uuid import UUID
import uuid

from app.core.database import get_db
from app.models.user import User
from app.models.chat_conversation import ChatConversation
from app.models.chat_message import ChatMessage
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ConversationResponse,
    MessageResponse,
    FeedbackRequest
)
from app.services.openai_service import openai_service
from app.core.auth import get_current_user

router = APIRouter(prefix="/api/v1/chat", tags=["chatbot"])

@router.post("/", response_model=ChatResponse)
async def send_chat_message(
    chat_request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send a message to the AI chatbot and get a response
    """
    try:
        # Get or create conversation
        if chat_request.conversation_id:
            conversation = db.query(ChatConversation).filter(
                ChatConversation.conversation_id == chat_request.conversation_id,
                ChatConversation.user_id == current_user.id
            ).first()
            
            if not conversation:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Conversation not found"
                )
        else:
            # Create new conversation
            conversation = ChatConversation(
                user_id=current_user.id,
                conversation_id=uuid.uuid4(),
                title=chat_request.message[:50] + ("..." if len(chat_request.message) > 50 else "")
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)
        
        # Get conversation history (last 10 messages)
        previous_messages = db.query(ChatMessage).filter(
            ChatMessage.conversation_id == conversation.conversation_id
        ).order_by(ChatMessage.created_at.desc()).limit(10).all()
        
        # Build conversation history for OpenAI
        conversation_history = []
        for msg in reversed(previous_messages):
            conversation_history.append({"role": "user", "content": msg.message})
            conversation_history.append({"role": "assistant", "content": msg.response})
        
        # Get AI response
        ai_result = await openai_service.send_message(
            message=chat_request.message,
            conversation_history=conversation_history,
            user_context=chat_request.user_context
        )
        
        # Save message to database
        new_message = ChatMessage(
            conversation_id=conversation.conversation_id,
            user_id=current_user.id,
            message=chat_request.message,
            response=ai_result["response"],
            ai_model=ai_result["model"],
            tokens_used=ai_result["tokens_used"],
            response_time_ms=ai_result["response_time_ms"]
        )
        db.add(new_message)
        db.commit()
        db.refresh(new_message)
        
        return ChatResponse(
            conversation_id=conversation.conversation_id,
            message=chat_request.message,
            response=ai_result["response"],
            ai_model=ai_result["model"],
            tokens_used=ai_result["tokens_used"],
            response_time_ms=ai_result["response_time_ms"],
            created_at=new_message.created_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process chat message: {str(e)}"
        )

@router.get("/conversations", response_model=List[ConversationResponse])
async def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all conversations for the current user
    """
    conversations = db.query(
        ChatConversation,
        func.count(ChatMessage.id).label("message_count")
    ).outerjoin(
        ChatMessage,
        ChatConversation.conversation_id == ChatMessage.conversation_id
    ).filter(
        ChatConversation.user_id == current_user.id
    ).group_by(
        ChatConversation.id
    ).order_by(
        ChatConversation.updated_at.desc()
    ).all()
    
    result = []
    for conversation, message_count in conversations:
        result.append(ConversationResponse(
            id=conversation.id,
            conversation_id=conversation.conversation_id,
            user_id=conversation.user_id,
            title=conversation.title,
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
            message_count=message_count
        ))
    
    return result

@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_conversation_messages(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all messages in a specific conversation
    """
    # Verify conversation belongs to user
    conversation = db.query(ChatConversation).filter(
        ChatConversation.conversation_id == conversation_id,
        ChatConversation.user_id == current_user.id
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    messages = db.query(ChatMessage).filter(
        ChatMessage.conversation_id == conversation_id
    ).order_by(ChatMessage.created_at.asc()).all()
    
    return messages

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a conversation and all its messages
    """
    conversation = db.query(ChatConversation).filter(
        ChatConversation.conversation_id == conversation_id,
        ChatConversation.user_id == current_user.id
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    db.delete(conversation)
    db.commit()
    
    return {"message": "Conversation deleted successfully"}

@router.post("/feedback")
async def submit_feedback(
    feedback: FeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit feedback (thumbs up/down) for a message
    """
    message = db.query(ChatMessage).filter(
        ChatMessage.id == feedback.message_id,
        ChatMessage.user_id == current_user.id
    ).first()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    message.helpful = feedback.helpful
    db.commit()
    
    return {"message": "Feedback recorded"}
