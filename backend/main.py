import os
import shutil
from datetime import datetime
from typing import Optional

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

import database
import models
from pwdlib import PasswordHash

os.makedirs("uploads", exist_ok=True)

models.Base.metadata.create_all(bind=database.engine)


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

password_hash = PasswordHash.recommended()


def hoje_str() -> str:
    return datetime.now().strftime("%d/%m/%Y")


def normalizar_tipo_usuario(tipo_usuario: str) -> str:
    tipo = (tipo_usuario or "").strip().lower()
    if tipo not in {"aluno", "conteudista"}:
        raise HTTPException(status_code=400, detail="Tipo de usuário inválido")
    return tipo


def parse_duracao_para_minutos(duracao: str) -> int:
    texto = (duracao or "").strip().lower().replace(" ", "")
    if not texto:
        return 0

    if "h" in texto:
        partes = texto.split("h")
        horas = int(partes[0] or 0)
        minutos = 0
        if len(partes) > 1:
            sufixo = partes[1].replace("min", "")
            minutos = int(sufixo or 0)
        return horas * 60 + minutos

    return int(texto.replace("min", "") or 0)


def formatar_minutos(minutos: int) -> str:
    if minutos < 60:
        return f"{minutos} min"

    horas = minutos // 60
    resto = minutos % 60
    if resto == 0:
        return f"{horas}h"
    return f"{horas}h {resto}min"


def recalcular_totais_trilha(trilha: models.Trilha) -> None:
    modulos = sorted(trilha.modulos, key=lambda m: m.ordem)
    total_modulos = len(modulos)
    total_quizzes = sum((modulo.quizzes or 0) for modulo in modulos)
    total_aulas = sum((modulo.videos or 0) + (modulo.textos or 0) for modulo in modulos)
    total_minutos = sum(parse_duracao_para_minutos(modulo.duracao or "0 min") for modulo in modulos)

    trilha.aulas = total_aulas
    trilha.duracao_total = formatar_minutos(total_minutos) if total_modulos else "0 min"


def serializar_modulo(modulo: models.Modulo) -> dict:
    return {
        "id": modulo.id,
        "ordem": modulo.ordem,
        "titulo": modulo.titulo,
        "videos": modulo.videos,
        "textos": modulo.textos,
        "quizzes": modulo.quizzes,
        "duracao": modulo.duracao,
        "status": modulo.status,
        "videoAdicionado": modulo.video_adicionado,
        "textoAdicionado": modulo.texto_adicionado,
        "quizAdicionado": modulo.quiz_adicionado,
    }


def serializar_trilha(trilha: models.Trilha) -> dict:
    modulos = sorted(trilha.modulos, key=lambda m: m.ordem)
    total_modulos = len(modulos)
    total_quizzes = sum((modulo.quizzes or 0) for modulo in modulos)

    return {
        "id": trilha.id,
        "nome": trilha.nome,
        "descricao": trilha.descricao,
        "categoria": trilha.categoria,
        "nivel": trilha.nivel,
        "status": trilha.status,
        "visibilidade": trilha.visibilidade,
        "modulos": total_modulos,
        "aulas": trilha.aulas,
        "quizzes": total_quizzes,
        "duracaoTotal": trilha.duracao_total,
        "atualizadaEm": trilha.atualizada_em,
        "imagem": trilha.imagem,
    }


def garantir_coluna_users_tipo_usuario() -> None:
    inspector = inspect(database.engine)
    if not inspector.has_table("users"):
        return

    with database.engine.begin() as conn:
        colunas = conn.execute(text("PRAGMA table_info(users)")).fetchall()
        nomes = {coluna[1] for coluna in colunas}
        if "tipo_usuario" not in nomes:
            conn.execute(text("ALTER TABLE users ADD COLUMN tipo_usuario TEXT DEFAULT 'aluno'"))

        conn.execute(
            text(
                "UPDATE users SET tipo_usuario = 'aluno' "
                "WHERE tipo_usuario IS NULL OR TRIM(tipo_usuario) = ''"
            )
        )


def seed_trilhas_para_conteudista(db: Session, user: models.User) -> None:
    if user.tipo_usuario != "conteudista":
        return

    trilhas_base = [
        {
            "nome": "Utilização da urna eletrônica",
            "descricao": "Entenda de forma prática como utilizar a urna eletrônica.",
            "categoria": "Educação eleitoral",
            "nivel": "Básico",
            "status": "publicada",
            "visibilidade": "Pública",
            "imagem": "/images/trilhas/voto.svg",
            "atualizada_em": "13/05/2026",
            "modulos": [],
        },
        {
            "nome": "Funcionamento do processo eleitoral",
            "descricao": "Conheça as etapas, regras e instituições do processo eleitoral.",
            "categoria": "Processo Eleitoral",
            "nivel": "Intermediário",
            "status": "publicada",
            "visibilidade": "Pública",
            "imagem": "/images/trilhas/eleicoes.svg",
            "atualizada_em": "13/05/2026",
            "modulos": [
                {
                    "ordem": 1,
                    "titulo": "A importância do voto",
                    "videos": 1,
                    "textos": 1,
                    "quizzes": 1,
                    "duracao": "15 min",
                    "status": "publicado",
                    "video_adicionado": True,
                    "texto_adicionado": True,
                    "quiz_adicionado": True,
                },
                {
                    "ordem": 2,
                    "titulo": "Como funcionam as eleições no Brasil",
                    "videos": 1,
                    "textos": 1,
                    "quizzes": 1,
                    "duracao": "18 min",
                    "status": "publicado",
                    "video_adicionado": True,
                    "texto_adicionado": True,
                    "quiz_adicionado": True,
                },
                {
                    "ordem": 3,
                    "titulo": "O papel da Justiça Eleitoral",
                    "videos": 1,
                    "textos": 1,
                    "quizzes": 0,
                    "duracao": "12 min",
                    "status": "rascunho",
                    "video_adicionado": True,
                    "texto_adicionado": True,
                    "quiz_adicionado": False,
                },
                {
                    "ordem": 4,
                    "titulo": "Segurança e combate à desinformação",
                    "videos": 1,
                    "textos": 1,
                    "quizzes": 0,
                    "duracao": "20 min",
                    "status": "rascunho",
                    "video_adicionado": True,
                    "texto_adicionado": True,
                    "quiz_adicionado": False,
                },
            ],
        },
        {
            "nome": "Segurança nas eleições e combate às fake news",
            "descricao": "Boas práticas para combater desinformação e fortalecer a segurança eleitoral.",
            "categoria": "Segurança do Voto",
            "nivel": "Básico",
            "status": "rascunho",
            "visibilidade": "Privada",
            "imagem": "/images/trilhas/seguranca.svg",
            "atualizada_em": "13/05/2026",
            "modulos": [],
        },
    ]

    trilhas_atuais = db.query(models.Trilha).filter(models.Trilha.conteudista_id == user.id).all()
    nomes_desejados = {item["nome"] for item in trilhas_base}
    nomes_atuais = {item.nome for item in trilhas_atuais}
    categorias_desejadas = {item["nome"]: item["categoria"] for item in trilhas_base}
    categorias_atuais = {item.nome: item.categoria for item in trilhas_atuais}
    precisa_reset = (
        len(trilhas_atuais) != len(trilhas_base)
        or nomes_atuais != nomes_desejados
        or categorias_atuais != categorias_desejadas
    )

    if not precisa_reset:
        return

    for trilha_existente in trilhas_atuais:
        db.delete(trilha_existente)
    db.flush()

    for trilha_base in trilhas_base:
        trilha = models.Trilha(
            nome=trilha_base["nome"],
            descricao=trilha_base["descricao"],
            categoria=trilha_base["categoria"],
            nivel=trilha_base["nivel"],
            status=trilha_base["status"],
            visibilidade=trilha_base["visibilidade"],
            aulas=0,
            duracao_total="0 min",
            atualizada_em=trilha_base["atualizada_em"],
            imagem=trilha_base["imagem"],
            conteudista_id=user.id,
        )

        db.add(trilha)
        db.flush()

        for modulo_base in trilha_base["modulos"]:
            modulo = models.Modulo(
                trilha_id=trilha.id,
                ordem=modulo_base["ordem"],
                titulo=modulo_base["titulo"],
                videos=modulo_base["videos"],
                textos=modulo_base["textos"],
                quizzes=modulo_base["quizzes"],
                duracao=modulo_base["duracao"],
                status=modulo_base["status"],
                video_adicionado=modulo_base["video_adicionado"],
                texto_adicionado=modulo_base["texto_adicionado"],
                quiz_adicionado=modulo_base["quiz_adicionado"],
            )
            db.add(modulo)

        db.flush()
        db.refresh(trilha)
        recalcular_totais_trilha(trilha)

    db.commit()


class UserUpdate(BaseModel):
    apelido: str
    email: str
    telefone: Optional[str] = None
    senha_atual: Optional[str] = None
    nova_senha: Optional[str] = None


class TrilhaCreate(BaseModel):
    email_conteudista: str
    nome: str
    descricao: str
    categoria: str
    nivel: str
    imagem: Optional[str] = None
    status: str = "rascunho"
    visibilidade: str = "Pública"


class TrilhaUpdate(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None
    categoria: Optional[str] = None
    nivel: Optional[str] = None
    imagem: Optional[str] = None
    status: Optional[str] = None
    visibilidade: Optional[str] = None


class ModuloCreate(BaseModel):
    titulo: str
    videos: int = 0
    textos: int = 0
    quizzes: int = 0
    duracao: str = "0 min"
    status: str = "rascunho"
    videoAdicionado: bool = False
    textoAdicionado: bool = False
    quizAdicionado: bool = False


class ModuloUpdate(BaseModel):
    titulo: Optional[str] = None
    videos: Optional[int] = None
    textos: Optional[int] = None
    quizzes: Optional[int] = None
    duracao: Optional[str] = None
    status: Optional[str] = None
    videoAdicionado: Optional[bool] = None
    textoAdicionado: Optional[bool] = None
    quizAdicionado: Optional[bool] = None


garantir_coluna_users_tipo_usuario()


@app.post("/cadastro")
def criar_usuario(
    apelido: str,
    email: str,
    password: str,
    tipo_usuario: str = "aluno",
    db: Session = Depends(database.get_db),
):
    db_user = db.query(models.User).filter(models.User.email == email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado")

    tipo = normalizar_tipo_usuario(tipo_usuario)
    hashed_pwd = password_hash.hash(password)
    new_user = models.User(
        apelido=apelido,
        nome_completo=apelido,
        email=email,
        hashed_password=hashed_pwd,
        tipo_usuario=tipo,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "Usuário criado com sucesso!",
        "user": {
            "id": new_user.id,
            "apelido": new_user.apelido,
            "email": new_user.email,
            "tipo_usuario": new_user.tipo_usuario,
        },
    }


@app.post("/login")
def login(email: str, password: str, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()

    if not user or not password_hash.verify(password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Email ou senha incorretos")

    seed_trilhas_para_conteudista(db, user)

    return {
        "message": "Login realizado!",
        "token": f"token-falso-{user.id}",
        "user": {
            "id": user.id,
            "apelido": user.apelido,
            "email": user.email,
            "tipo_usuario": user.tipo_usuario,
        },
    }


@app.get("/perfil/{email}")
def buscar_perfil(email: str, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    return {
        "apelido": user.apelido,
        "email": user.email,
        "telefone": user.telefone,
        "nome_completo": user.nome_completo,
        "foto_perfil": user.foto_perfil,
        "tipo_usuario": user.tipo_usuario,
    }


@app.put("/perfil/atualizar/{email_atual}")
def atualizar_perfil(email_atual: str, dados: UserUpdate, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == email_atual).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    user.apelido = dados.apelido
    user.telefone = dados.telefone

    if dados.nova_senha and dados.senha_atual:
        if not password_hash.verify(dados.senha_atual, user.hashed_password):
            raise HTTPException(status_code=400, detail="Senha atual incorreta")
        user.hashed_password = password_hash.hash(dados.nova_senha)

    db.commit()
    return {"message": "Perfil atualizado com sucesso!"}


@app.post("/perfil/{email}/foto")
def upload_foto(email: str, file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    file_location = f"uploads/{email}_{file.filename}"

    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)

    user.foto_perfil = f"/{file_location}"
    db.commit()

    return {"foto_url": user.foto_perfil}


@app.get("/trilhas")
def listar_trilhas(email: str, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    seed_trilhas_para_conteudista(db, user)

    query = db.query(models.Trilha)
    if user.tipo_usuario == "conteudista":
        query = query.filter(models.Trilha.conteudista_id == user.id)

    trilhas = query.order_by(models.Trilha.id.asc()).all()
    return [serializar_trilha(trilha) for trilha in trilhas]


@app.get("/trilhas/{trilha_id}")
def buscar_trilha(trilha_id: int, db: Session = Depends(database.get_db)):
    trilha = db.query(models.Trilha).filter(models.Trilha.id == trilha_id).first()
    if not trilha:
        raise HTTPException(status_code=404, detail="Trilha não encontrada")

    return serializar_trilha(trilha)


@app.post("/trilhas")
def criar_trilha(payload: TrilhaCreate, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email_conteudista).first()
    if not user:
        raise HTTPException(status_code=404, detail="Conteudista não encontrado")
    if user.tipo_usuario != "conteudista":
        raise HTTPException(status_code=403, detail="Apenas conteudista pode criar trilhas")

    trilha = models.Trilha(
        nome=payload.nome,
        descricao=payload.descricao,
        categoria=payload.categoria,
        nivel=payload.nivel,
        status=payload.status,
        visibilidade=payload.visibilidade,
        aulas=0,
        duracao_total="0 min",
        atualizada_em=hoje_str(),
        imagem=payload.imagem or "/images/trilhas/eleicoes.svg",
        conteudista_id=user.id,
    )

    db.add(trilha)
    db.commit()
    db.refresh(trilha)
    return serializar_trilha(trilha)


@app.put("/trilhas/{trilha_id}")
def atualizar_trilha(trilha_id: int, payload: TrilhaUpdate, db: Session = Depends(database.get_db)):
    trilha = db.query(models.Trilha).filter(models.Trilha.id == trilha_id).first()
    if not trilha:
        raise HTTPException(status_code=404, detail="Trilha não encontrada")

    dados = payload.model_dump(exclude_unset=True)
    for chave, valor in dados.items():
        setattr(trilha, chave, valor)

    trilha.atualizada_em = hoje_str()
    db.commit()
    db.refresh(trilha)

    return serializar_trilha(trilha)


@app.delete("/trilhas/{trilha_id}")
def excluir_trilha(trilha_id: int, db: Session = Depends(database.get_db)):
    trilha = db.query(models.Trilha).filter(models.Trilha.id == trilha_id).first()
    if not trilha:
        raise HTTPException(status_code=404, detail="Trilha não encontrada")

    db.delete(trilha)
    db.commit()

    return {"message": "Trilha excluída com sucesso"}


@app.post("/trilhas/{trilha_id}/publicar")
def publicar_trilha(trilha_id: int, db: Session = Depends(database.get_db)):
    trilha = db.query(models.Trilha).filter(models.Trilha.id == trilha_id).first()
    if not trilha:
        raise HTTPException(status_code=404, detail="Trilha não encontrada")

    trilha.status = "publicada"
    trilha.atualizada_em = hoje_str()
    db.commit()
    db.refresh(trilha)

    return serializar_trilha(trilha)


@app.get("/trilhas/{trilha_id}/modulos")
def listar_modulos(trilha_id: int, db: Session = Depends(database.get_db)):
    trilha = db.query(models.Trilha).filter(models.Trilha.id == trilha_id).first()
    if not trilha:
        raise HTTPException(status_code=404, detail="Trilha não encontrada")

    modulos = (
        db.query(models.Modulo)
        .filter(models.Modulo.trilha_id == trilha_id)
        .order_by(models.Modulo.ordem.asc())
        .all()
    )
    return [serializar_modulo(modulo) for modulo in modulos]


@app.post("/trilhas/{trilha_id}/modulos")
def criar_modulo(trilha_id: int, payload: ModuloCreate, db: Session = Depends(database.get_db)):
    trilha = db.query(models.Trilha).filter(models.Trilha.id == trilha_id).first()
    if not trilha:
        raise HTTPException(status_code=404, detail="Trilha não encontrada")

    ultimo = (
        db.query(models.Modulo)
        .filter(models.Modulo.trilha_id == trilha_id)
        .order_by(models.Modulo.ordem.desc())
        .first()
    )
    proxima_ordem = (ultimo.ordem + 1) if ultimo else 1

    modulo = models.Modulo(
        trilha_id=trilha_id,
        ordem=proxima_ordem,
        titulo=payload.titulo,
        videos=payload.videos,
        textos=payload.textos,
        quizzes=payload.quizzes,
        duracao=payload.duracao,
        status=payload.status,
        video_adicionado=payload.videoAdicionado,
        texto_adicionado=payload.textoAdicionado,
        quiz_adicionado=payload.quizAdicionado,
    )

    db.add(modulo)
    db.flush()

    trilha.atualizada_em = hoje_str()
    db.refresh(trilha)
    recalcular_totais_trilha(trilha)
    db.commit()
    db.refresh(modulo)

    return serializar_modulo(modulo)


@app.put("/trilhas/{trilha_id}/modulos/{modulo_id}")
def atualizar_modulo(trilha_id: int, modulo_id: int, payload: ModuloUpdate, db: Session = Depends(database.get_db)):
    trilha = db.query(models.Trilha).filter(models.Trilha.id == trilha_id).first()
    if not trilha:
        raise HTTPException(status_code=404, detail="Trilha não encontrada")

    modulo = (
        db.query(models.Modulo)
        .filter(models.Modulo.id == modulo_id, models.Modulo.trilha_id == trilha_id)
        .first()
    )
    if not modulo:
        raise HTTPException(status_code=404, detail="Módulo não encontrado")

    dados = payload.model_dump(exclude_unset=True)
    mapeamento = {
        "videoAdicionado": "video_adicionado",
        "textoAdicionado": "texto_adicionado",
        "quizAdicionado": "quiz_adicionado",
    }

    for chave, valor in dados.items():
        atributo = mapeamento.get(chave, chave)
        setattr(modulo, atributo, valor)

    trilha.atualizada_em = hoje_str()
    db.flush()
    recalcular_totais_trilha(trilha)
    db.commit()
    db.refresh(modulo)

    return serializar_modulo(modulo)
