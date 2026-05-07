from sqlalchemy import Column, Integer, String
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    apelido = Column(String)
    telefone = Column(String)
    imagem_perfil = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)


# Schemas Pydantic
from pydantic import BaseModel

class UserOut(BaseModel):
    id: int
    apelido: str
    telefone: str | None = None
    imagem_perfil: str | None = None
    email: str
    class Config:
        orm_mode = True

class UserUpdate(BaseModel):
    apelido: str | None = None
    telefone: str | None = None
    imagem_perfil: str | None = None
    email: str | None = None
    senha: str | None = None