"""
Upload service for handling file storage.

Supports local file storage with option to extend to cloud storage (S3, etc.)
"""
import os
import uuid
import aiofiles
from pathlib import Path
from datetime import datetime, timezone
from fastapi import UploadFile, HTTPException, status

from app.core.config import settings
from sqlalchemy.orm import Session

# Allowed image types
ALLOWED_IMAGE_TYPES = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/gif": [".gif"],
    "image/webp": [".webp"],
}

# Max file size: 5MB
MAX_FILE_SIZE = 5 * 1024 * 1024

# Upload directory (relative to backend root)
UPLOAD_DIR = Path("uploads")
IMAGE_UPLOAD_DIR = UPLOAD_DIR / "images"


def get_upload_dir() -> Path:
    """Get the upload directory path, creating it if necessary."""
    upload_path = IMAGE_UPLOAD_DIR
    upload_path.mkdir(parents=True, exist_ok=True)
    return upload_path


def validate_image_file(file: UploadFile) -> None:
    """
    Validate uploaded image file.

    Raises HTTPException if validation fails.
    """
    # Check content type
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        allowed = ", ".join(ALLOWED_IMAGE_TYPES.keys())
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Invalid file type '{file.content_type}'. Allowed types: {allowed}",
        )

    # Check filename
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required",
        )


def get_file_extension(content_type: str, filename: str) -> str:
    """Get appropriate file extension based on content type."""
    # Try to get from content type
    extensions = ALLOWED_IMAGE_TYPES.get(content_type, [])
    if extensions:
        return extensions[0]

    # Fallback to original extension
    _, ext = os.path.splitext(filename)
    return ext.lower() if ext else ".jpg"


def generate_unique_filename(original_filename: str, content_type: str) -> str:
    """Generate a unique filename for storage."""
    ext = get_file_extension(content_type, original_filename)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    unique_id = uuid.uuid4().hex[:8]
    return f"{timestamp}_{unique_id}{ext}"


async def save_upload_file(file: UploadFile) -> tuple[str, str]:
    """
    Save uploaded file to disk.

    Returns:
        tuple: (filename, file_path)
    """
    # Validate file
    validate_image_file(file)

    # Generate unique filename
    filename = generate_unique_filename(file.filename or "image", file.content_type or "image/jpeg")

    # Get upload directory
    upload_dir = get_upload_dir()
    file_path = upload_dir / filename

    # Read and validate file size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        size_mb = len(contents) / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large ({size_mb:.2f}MB). Maximum size is 5MB.",
        )

    # Save file
    async with aiofiles.open(file_path, "wb") as out_file:
        await out_file.write(contents)

    return filename, str(file_path)


def get_file_url(filename: str) -> str:
    """
    Get the URL for accessing an uploaded file.

    In production, this would return a CDN URL or S3 presigned URL.
    For local development, returns a relative path served by the static files middleware.
    """
    # For local development, serve from /uploads/images/
    return f"/uploads/images/{filename}"


def delete_file(filename: str) -> bool:
    """
    Delete an uploaded file.

    Returns True if file was deleted, False if not found.
    Raises ValueError if path traversal is detected.
    """
    # Prevent path traversal attacks
    if '..' in filename or '/' in filename or '\\' in filename:
        raise ValueError("Invalid filename")
    
    file_path = (IMAGE_UPLOAD_DIR / filename).resolve()
    # Ensure the resolved path is still within upload directory
    if not str(file_path).startswith(str(IMAGE_UPLOAD_DIR.resolve())):
        raise ValueError("Invalid filename")
    
    if file_path.exists():
        file_path.unlink()
        return True
    return False


class UploadService:
    """Service class for upload operations."""

    @staticmethod
    async def upload_image(file: UploadFile, user_id=None, db: Session = None) -> dict:
        """
        Upload an image file.

        Args:
            file: The uploaded file
            user_id: UUID of the uploading user (for ownership tracking)
            db: Database session (for ownership tracking)

        Returns:
            dict: { url: str, filename: str, size: int }
        """
        filename, file_path = await save_upload_file(file)
        url = get_file_url(filename)

        # Get file size
        size = os.path.getsize(file_path)

        # Track ownership if user_id and db provided
        if user_id and db:
            from app.models import UploadedFile
            upload_record = UploadedFile(
                filename=filename,
                original_filename=file.filename,
                content_type=file.content_type,
                file_size=f"{size / 1024:.1f} KB" if size < 1024 * 1024 else f"{size / (1024 * 1024):.2f} MB",
                user_id=user_id,
            )
            db.add(upload_record)
            db.commit()

        return {
            "url": url,
            "filename": filename,
            "size": size,
        }

    @staticmethod
    def delete_image(filename: str, user_id=None, db: Session = None, is_admin: bool = False) -> bool:
        """
        Delete an uploaded image.
        
        Args:
            filename: File to delete
            user_id: User requesting deletion
            db: Database session
            is_admin: If True, skip ownership check
            
        Returns:
            True if deleted, False if not found
            
        Raises:
            PermissionError: If user doesn't own the file and isn't admin
        """
        # Check ownership if db provided and not admin
        if db and user_id and not is_admin:
            from app.models import UploadedFile
            record = db.query(UploadedFile).filter(
                UploadedFile.filename == filename
            ).first()
            if record and record.user_id != user_id:
                raise PermissionError("You can only delete your own uploads")
        
        result = delete_file(filename)
        
        # Remove from database if exists
        if result and db:
            from app.models import UploadedFile
            db.query(UploadedFile).filter(
                UploadedFile.filename == filename
            ).delete()
            db.commit()
        
        return result

    @staticmethod
    def get_image_url(filename: str) -> str:
        """Get URL for an uploaded image."""
        return get_file_url(filename)
