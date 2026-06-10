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
    
    # Colunas de carimbo de data/hora automatizadas pelo SQLite
    data_criacao = Column(DateTime(timezone=True), server_default=func.now())
    data_atualizacao = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class ConteudoTeoria(Base):
    __tablename__ = "conteudos_teoria"

    id = Column(Integer, primary_key=True, index=True)
    trilha_id = Column(Integer, ForeignKey("trilhas.id", ondelete="CASCADE"))
    titulo = Column(String)
    ordem_modulo = Column(Integer, default=0) # Define a sequência do módulo na trilha
    tipo_conteudo = Column(String, default="teoria")  # 'teoria' ou 'pratica'
    
    # Relacionamento que traz os blocos do módulo específico ordenados
    blocos = relationship(
        "BlocoTeoria", 
        back_populates="teoria", 
        cascade="all, delete-orphan", 
        order_by="BlocoTeoria.ordem"
    )

# Tabela que armazena cada elemento (parágrafo, foto ou link de vídeo) do módulo
class BlocoTeoria(Base):
    __tablename__ = "blocos_teoria"

    id = Column(Integer, primary_key=True, index=True)
    teoria_id = Column(Integer, ForeignKey("conteudos_teoria.id", ondelete="CASCADE"))
    tipo = Column(String)  # 'texto', 'imagem' ou 'video'
    valor = Column(Text)   # Guarda o bloco de texto ou a URL da mídia
    ordem = Column(Integer) # Índice de ordenação na linha temporal da aula

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
    resposta_correta = Column(String) # 'A', 'B', 'C' ou 'D'

class ProgressoModulo(Base):
    __tablename__ = "progresso_modulos"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, ForeignKey("users.email", ondelete="CASCADE"))
    trilha_id = Column(Integer, ForeignKey("trilhas.id", ondelete="CASCADE"))
    modulo_id = Column(Integer, ForeignKey("conteudos_teoria.id", ondelete="CASCADE"))

class NoticiaJogo(Base):
    __tablename__ = "noticias_jogo"

    id = Column(Integer, primary_key=True, index=True)
    modulo_id = Column(Integer, ForeignKey("conteudos_teoria.id", ondelete="CASCADE"))
    ordem = Column(Integer, default=0)
    imagem = Column(String, nullable=True)  # URL ou caminho da imagem
    eh_fato = Column(Integer, default=1)  # 1 = verdadeira, 0 = falsa
    explicacao = Column(Text)  # Explicação da resposta