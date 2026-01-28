"""
Password reset router for handling forgot password and reset password functionality.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib
import secrets
import hashlib
import random
import string

from app.core.database import get_db
from app.models.user import User
from app.core.security import get_password_hash
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = None
    code: str = None
    new_password: str


# In-memory storage for reset tokens and codes (in production, use Redis or database)
# Format: {token_hash: {"user_id": int, "expires_at": datetime, "code": str}}
reset_tokens = {}


def generate_reset_code() -> str:
    """Generate a 6-digit verification code."""
    return ''.join(random.choices(string.digits, k=6))


def send_reset_email(to_email: str, code: str, token: str) -> bool:
    """Send password reset email with code and link."""
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'Reset Your IELTS Prep Password'
        msg['From'] = settings.SMTP_EMAIL
        msg['To'] = to_email
        
        # HTML email body
        html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0;">🎓 IELTS Prep</h1>
                </div>
                
                <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #1f2937; margin-top: 0;">Reset Your Password</h2>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">
                        We received a request to reset your password. Use the verification code below:
                    </p>
                    
                    <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                        <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">Your verification code:</p>
                        <h1 style="color: #667eea; font-size: 36px; letter-spacing: 8px; margin: 0; font-weight: bold;">
                            {code}
                        </h1>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px; margin: 25px 0;">
                        Or click the button below to reset your password:
                    </p>
                    
                    <div style="text-align: center; margin: 25px 0;">
                        <a href="http://localhost:5173/reset-password?token={token}" 
                           style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    
                    <p style="color: #9ca3af; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                        This code will expire in <strong>1 hour</strong>. If you didn't request this, please ignore this email.
                    </p>
                </div>
            </body>
        </html>
        """
        
        # Plain text alternative
        text = f"""
        Reset Your IELTS Prep Password
        
        We received a request to reset your password.
        
        Your verification code: {code}
        
        Or use this link: http://localhost:5173/reset-password?token={token}
        
        This code will expire in 1 hour. If you didn't request this, please ignore this email.
        """
        
        part1 = MIMEText(text, 'plain')
        part2 = MIMEText(html, 'html')
        
        msg.attach(part1)
        msg.attach(part2)
        
        # Send email
        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
            server.send_message(msg)
        
        print(f"✅ Password reset email sent to {to_email}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send email: {str(e)}")
        return False


def generate_reset_token(user_id: int) -> tuple[str, str]:
    """Generate a secure reset token and 6-digit code."""
    token = secrets.token_urlsafe(32)
    code = generate_reset_code()
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    
    # Store token with expiration (1 hour) and code
    reset_tokens[token_hash] = {
        "user_id": user_id,
        "expires_at": datetime.utcnow() + timedelta(hours=1),
        "code": code
    }
    
    # Also store by code for code-based verification
    reset_tokens[f"code_{code}_{user_id}"] = {
        "user_id": user_id,
        "expires_at": datetime.utcnow() + timedelta(hours=1),
        "token_hash": token_hash
    }
    
    # Clean up expired tokens
    cleanup_expired_tokens()
    
    return token, code


def cleanup_expired_tokens():
    """Remove expired tokens from storage."""
    now = datetime.utcnow()
    expired = [key for key, data in reset_tokens.items() if data.get("expires_at") and data["expires_at"] < now]
    for key in expired:
        del reset_tokens[key]


def verify_reset_token(token: str = None, code: str = None, user_id: int = None) -> int:
    """Verify reset token or code and return user_id if valid."""
    
    # Verify by code
    if code:
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID required for code verification"
            )
        
        code_key = f"code_{code}_{user_id}"
        
        if code_key not in reset_tokens:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification code"
            )
        
        code_data = reset_tokens[code_key]
        
        # Check if code is expired
        if code_data["expires_at"] < datetime.utcnow():
            del reset_tokens[code_key]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification code has expired"
            )
        
        return code_data["user_id"]
    
    # Verify by token
    if token:
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        
        if token_hash not in reset_tokens:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        token_data = reset_tokens[token_hash]
        
        # Check if token is expired
        if token_data["expires_at"] < datetime.utcnow():
            del reset_tokens[token_hash]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset token has expired"
            )
        
        return token_data["user_id"]
    
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Either token or code must be provided"
    )


@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Request a password reset. Generates a reset code and token, then sends via email.
    """
    # Find user by email
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        # Return success even if user not found (security best practice)
        return {
            "message": "If an account with that email exists, a password reset code has been sent.",
            "success": True
        }
    
    if not user.is_active:
        return {
            "message": "If an account with that email exists, a password reset code has been sent.",
            "success": True
        }
    
    # Generate reset token and code
    token, code = generate_reset_token(user.id)
    
    # Send email with code and link
    email_sent = send_reset_email(user.email, code, token)
    
    if email_sent:
        print(f"✅ Password reset email sent to {user.email}")
        print(f"   Code: {code}")
        print(f"   Reset URL: http://localhost:5173/reset-password?token={token}")
    else:
        print(f"⚠️ Failed to send email, but code is available")
        print(f"   Code: {code}")
    
    return {
        "message": "If an account with that email exists, a password reset code has been sent.",
        "success": True,
        "user_id": user.id  # Needed for code verification
    }


@router.post("/reset-password")
async def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Reset password using either verification code or reset token.
    """
    # Verify token or code and get user_id
    try:
        if request.code:
            # For code verification, we need to find user by trying all stored codes
            user_id = None
            for key in list(reset_tokens.keys()):
                if key.startswith(f"code_{request.code}_"):
                    code_data = reset_tokens[key]
                    if code_data["expires_at"] >= datetime.utcnow():
                        user_id = code_data["user_id"]
                        break
            
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid or expired verification code"
                )
        elif request.token:
            user_id = verify_reset_token(token=request.token)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either token or code must be provided"
            )
    except HTTPException as e:
        raise e
    
    # Get user
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is deactivated"
        )
    
    # Validate new password
    if len(request.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
        )
    
    # Update password
    user.hashed_password = get_password_hash(request.new_password)
    db.commit()
    
    # Remove used token and associated code
    if request.token:
        token_hash = hashlib.sha256(request.token.encode()).hexdigest()
        if token_hash in reset_tokens:
            # Get code and remove both
            token_data = reset_tokens.get(token_hash, {})
            code = token_data.get("code")
            if code:
                code_key = f"code_{code}_{user_id}"
                if code_key in reset_tokens:
                    del reset_tokens[code_key]
            del reset_tokens[token_hash]
    elif request.code:
        # Remove code and associated token
        code_key = f"code_{request.code}_{user_id}"
        if code_key in reset_tokens:
            code_data = reset_tokens[code_key]
            token_hash = code_data.get("token_hash")
            if token_hash and token_hash in reset_tokens:
                del reset_tokens[token_hash]
            del reset_tokens[code_key]
    
    print(f"✅ Password successfully reset for {user.email}")
    
    return {
        "message": "Password has been successfully reset. You can now login with your new password.",
        "success": True
    }


@router.get("/reset-token-info/{token}")
async def get_reset_token_info(token: str):
    """
    Get information about a reset token (for debugging).
    Remove this endpoint in production.
    """
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    
    if token_hash not in reset_tokens:
        return {"valid": False, "message": "Token not found"}
    
    token_data = reset_tokens[token_hash]
    is_expired = token_data["expires_at"] < datetime.utcnow()
    
    return {
        "valid": not is_expired,
        "user_id": token_data["user_id"],
        "expires_at": token_data["expires_at"].isoformat(),
        "is_expired": is_expired
    }
