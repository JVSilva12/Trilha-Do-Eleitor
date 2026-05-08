from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    apelido = Column(String)
    email = Column(String, unique=True, index=True)
    telefone = Column(String, nullable=True)
    foto_perfil = Column(String, nullable=True)
    data_criacao = Column(DateTime(timezone=True), server_default=func.now())
    hashed_password = Column(String)