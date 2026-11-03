from fastapi import APIRouter, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import select

from app.deps import CurrentUser, SessionDep
from app.models import User
from app.schemas.auth import LoginRequest, Token, UserCreate, UserRead
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(datos: UserCreate, session: SessionDep) -> User:
    existente = session.exec(select(User).where(User.email == datos.email)).first()
    if existente is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe una cuenta con ese correo")

    user = User(
        email=datos.email,
        full_name=datos.full_name,
        hashed_password=hash_password(datos.password),
    )
    session.add(user)
    try:
        session.commit()
    except IntegrityError:
        # Dos registros simultáneos con el mismo correo: gana el primero.
        session.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe una cuenta con ese correo")
    session.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(datos: LoginRequest, session: SessionDep) -> Token:
    user = session.exec(select(User).where(User.email == datos.email)).first()
    clave_ok = verify_password(datos.password, user.hashed_password if user else None)
    if user is None or not clave_ok or not user.is_active:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Correo o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return Token(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserRead)
def me(user: CurrentUser) -> User:
    return user
