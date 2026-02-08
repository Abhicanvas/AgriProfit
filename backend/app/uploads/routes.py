"""
Upload routes for file handling.

Provides endpoints for uploading and managing files.
"""
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status
from pydantic import BaseModel, ConfigDict

from app.auth.security import get_current_user, require_role
from app.models import User
from app.uploads.service import UploadService
from app.database.session import get_db
from sqlalchemy.orm import Session

router = APIRouter(prefix="/uploads", tags=["Uploads"])


class ImageUploadResponse(BaseModel):
    """Response schema for image upload."""
    url: str
    filename: str
    size: int

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "url": "/uploads/images/20260129_123456_abc12345.jpg",
                "filename": "20260129_123456_abc12345.jpg",
                "size": 245678
            }
        }
    )


class DeleteResponse(BaseModel):
    """Response schema for delete operation."""
    success: bool
    message: str


@router.post(
    "/image",
    response_model=ImageUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload Image",
    description="Upload an image file. Requires authentication. Accepts JPG, PNG, GIF, WebP up to 5MB.",
    responses={
        201: {"description": "Image uploaded successfully", "model": ImageUploadResponse},
        400: {"description": "Invalid request"},
        401: {"description": "Not authenticated"},
        413: {"description": "File too large (max 5MB)"},
        415: {"description": "Unsupported file type"},
    }
)
async def upload_image(
    file: UploadFile = File(..., description="Image file to upload"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ImageUploadResponse:
    """
    Upload an image file.

    - **file**: Image file (JPG, PNG, GIF, WebP)
    - Max size: 5MB
    - Returns URL to access the uploaded image

    Requires authentication. File ownership is tracked.
    """
    result = await UploadService.upload_image(file, user_id=current_user.id, db=db)
    return ImageUploadResponse(**result)


@router.delete(
    "/image/{filename}",
    response_model=DeleteResponse,
    summary="Delete Image (Admin)",
    description="Delete an uploaded image. Requires admin role until ownership tracking is implemented.",
    responses={
        200: {"description": "Image deleted successfully"},
        401: {"description": "Not authenticated"},
        403: {"description": "Admin role required"},
        404: {"description": "Image not found"},
    }
)
async def delete_image(
    filename: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DeleteResponse:
    """
    Delete an uploaded image.

    Users can delete their own uploads. Admins can delete any upload.

    - **filename**: Name of the file to delete
    """
    is_admin = current_user.role == "admin"
    try:
        deleted = UploadService.delete_image(
            filename, 
            user_id=current_user.id, 
            db=db, 
            is_admin=is_admin
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )

    return DeleteResponse(success=True, message="Image deleted successfully")
