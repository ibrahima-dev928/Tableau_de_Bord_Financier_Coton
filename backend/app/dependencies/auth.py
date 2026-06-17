from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from jose import JWTError
from app.database import get_db
from app.utils.security import decode_token
from app.models.user import User
from app.schemas.auth import TokenData
from sqlalchemy import select

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    token = credentials.credentials
    try:
        payload = decode_token(token)
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Token invalide")
        token_data = TokenData(email=email, role=payload.get("role"), zone_id=payload.get("zone_id"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide")
    
    result = await db.execute(select(User).where(User.email == token_data.email))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
    if not user.actif:
        raise HTTPException(status_code=403, detail="Compte désactivé")
    return user

def require_role(required_role: str):
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role != required_role and required_role != "Direction":
            # La Direction peut tout voir
            raise HTTPException(status_code=403, detail="Droits insuffisants")
        return current_user
    return role_checker