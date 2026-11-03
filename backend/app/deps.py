"""Dependencias compartidas por todos los routers.

Uso en cualquier ruta protegida:

    from app.deps import CurrentUser, SessionDep

    @router.get("/algo")
    def algo(user: CurrentUser, session: SessionDep): ...
"""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session

from app.database import get_session
from app.models import User
from app.security import decode_access_token

SessionDep = Annotated[Session, Depends(get_session)]

_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    session: SessionDep,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> User:
    no_autenticado = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autenticado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise no_autenticado
    user_id = decode_access_token(credentials.credentials)
    if user_id is None:
        raise no_autenticado
    user = session.get(User, user_id)
    if user is None or not user.is_active:
        raise no_autenticado
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
