from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
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
    tipo_usuario = Column(String, default="leitor") 

class Inscricao(Base):
    __tablename__ = "inscricoes"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, ForeignKey("users.email"))
    trilha_id = Column(String)
    progresso = Column(Integer, default=0)

class Trilha(Base):
    __tablename__ = "trilhas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, index=True)
    descricao = Column(String)
    categoria = Column(String)
    nivel = Column(String)
    imagem = Column(String, nullable=True)
    status = Column(String, default="rascunho") 
    visibilidade = Column(String, default="Pública")

class ConteudoTeoria(Base):
    __tablename__ = "conteudos_teoria"

    id = Column(Integer, primary_key=True, index=True)
    trilha_id = Column(Integer, ForeignKey("trilhas.id", ondelete="CASCADE"))
    titulo = Column(String)
    
    # Relacionamento de 1 para Muitos com a tabela de blocos dinâmicos
    # O parametro order_by garante que o SQLite devolva os blocos na sequência exata definida
    blocos = relationship(
        "BlocoTeoria", 
        back_populates="teoria", 
        cascade="all, delete-orphan", 
        order_by="BlocoTeoria.ordem"
    )

# TABELA CO-RELACIONAL: ARMAZENA CADA ELEMENTO INTERCALADO DA AULA
class BlocoTeoria(Base):
    __tablename__ = "blocos_teoria"

    id = Column(Integer, primary_key=True, index=True)
    teoria_id = Column(Integer, ForeignKey("conteudos_teoria.id", ondelete="CASCADE"))
    tipo = Column(String)  # 'texto', 'imagem' ou 'video'
    valor = Column(Text)   # Guarda o texto da aula OU o link/URL da mídia
    ordem = Column(Integer) # Índice numérico sequencial da linha (0, 1, 2, etc)

    teoria = relationship("ConteudoTeoria", back_populates="blocos")

class PerguntaQuiz(Base):
    __tablename__ = "perguntas_quiz"

    id = Column(Integer, primary_key=True, index=True)
    trilha_id = Column(Integer, ForeignKey("trilhas.id", ondelete="CASCADE"))
    enunciado = Column(Text)
    alternativa_a = Column(String)
    alternativa_b = Column(String)
    alternativa_c = Column(String)
    alternativa_d = Column(String)
    resposta_correta = Column(String) # Guarda a letra maiúscula do gabarito: 'A', 'B', 'C' ou 'D'