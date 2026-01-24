```python
from fastapi import Depends, HTTPException, status

from .models import User
from .dependencies import get_current_user


def require_role(required_role: str):
    """Dependency factory that requires a specific role."""
    async def role_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {required_role}",
            )
        return current_user

    return role_checker


def require_admin():
    """Dependency that requires admin role."""
    return require_role("admin")
```