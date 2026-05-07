from sqlalchemy import Column, Integer, String
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    apelido = Column(String)
    nome_completo = Column(String)
    email = Column(String, unique=True, index=True)
    telefone = Column(String, nullable=True)
    foto_perfil = Column(String, nullable=True)
    hashed_password = Column(String)