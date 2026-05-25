from datetime import datetime, timezone
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import oauth2_scheme
from app.models.user import User


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, settings.SECRET_KEY,
                             algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception

        token_type = payload.get("type")
        if token_type != "access":
            raise credentials_exception

        token_iat = payload.get("iat")
        if token_iat is None:
            raise credentials_exception
        token_iat_datetime = datetime.fromtimestamp(token_iat, tz=timezone.utc)

    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(int(user_id) == User.id).first()
    if user is None:
        raise credentials_exception

    if user.password_updated_at > token_iat_datetime:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Password changed recently, please login again",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user
