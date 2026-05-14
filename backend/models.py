from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    apelido = Column(String)
    email = Column(String, unique=True, index=True)
    telefone = Column(String, nullable=True)
    hashed_password = Column(String)
    foto_perfil = Column(String, nullable=True)
    data_criacao = Column(DateTime(timezone=True), server_default=func.now())
    # Coluna definida explicitamente com valor inicial padrão
    tipo_usuario = Column(String, default="leitor") 

class Inscricao(Base):
    __tablename__ = "inscricoes"
    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, ForeignKey("users.email"))
    trilha_id = Column(String)
    progresso = Column(Integer, default=0)