from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    apelido = Column(String, nullable=False)
    nome_completo = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    telefone = Column(String, nullable=True)
    foto_perfil = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    tipo_usuario = Column(String, nullable=False, default="aluno")

    trilhas = relationship("Trilha", back_populates="conteudista", cascade="all, delete-orphan")


class Trilha(Base):
    __tablename__ = "trilhas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    descricao = Column(String, nullable=False, default="")
    categoria = Column(String, nullable=False)
    nivel = Column(String, nullable=False)
    status = Column(String, nullable=False, default="rascunho")
    visibilidade = Column(String, nullable=False, default="Pública")
    aulas = Column(Integer, nullable=False, default=0)
    duracao_total = Column(String, nullable=False, default="0 min")
    atualizada_em = Column(String, nullable=False)
    imagem = Column(String, nullable=False, default="/images/trilhas/eleicoes.svg")

    conteudista_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    conteudista = relationship("User", back_populates="trilhas")
    modulos = relationship("Modulo", back_populates="trilha", cascade="all, delete-orphan")


class Modulo(Base):
    __tablename__ = "modulos"

    id = Column(Integer, primary_key=True, index=True)
    trilha_id = Column(Integer, ForeignKey("trilhas.id"), nullable=False, index=True)
    ordem = Column(Integer, nullable=False)
    titulo = Column(String, nullable=False)
    videos = Column(Integer, nullable=False, default=0)
    textos = Column(Integer, nullable=False, default=0)
    quizzes = Column(Integer, nullable=False, default=0)
    duracao = Column(String, nullable=False, default="0 min")
    status = Column(String, nullable=False, default="rascunho")
    video_adicionado = Column(Boolean, nullable=False, default=False)
    texto_adicionado = Column(Boolean, nullable=False, default=False)
    quiz_adicionado = Column(Boolean, nullable=False, default=False)

    trilha = relationship("Trilha", back_populates="modulos")
