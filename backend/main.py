import os
import shutil
import re
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import models, database
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

class UserUpdate(BaseModel):
    apelido: str
    email: str
    telefone: Optional[str] = None
    senha_atual: Optional[str] = None
    nova_senha: Optional[str] = None

def validar_complexidade_senha(password: str):
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="A senha deve ter no mínimo 8 caracteres.")
    if not re.search(r"[A-Z]", password):
        raise HTTPException(status_code=400, detail="A senha deve conter ao menos uma letra maiúscula.")
    if not re.search(r"[a-z]", password):
        raise HTTPException(status_code=400, detail="A senha deve conter ao menos uma letra minúscula.")
    if not re.search(r"\d", password):
        raise HTTPException(status_code=400, detail="A senha deve conter ao menos um número.")

@app.post("/cadastro")
def criar_usuario(apelido: str, email: str, password: str, db: Session = Depends(database.get_db)):
    validar_complexidade_senha(password)

    db_user = db.query(models.User).filter(models.User.email == email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    hashed_pwd = password_hash.hash(password)
    new_user = models.User(apelido=apelido, email=email, hashed_password=hashed_pwd)
    db.add(new_user)
    db.commit()
    return {"message": "Usuário criado com sucesso!"}

@app.post("/login")
def login(email: str, password: str, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not password_hash.verify(password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Email ou senha incorretos")
    return {"message": "Login realizado!", "token": "token-falso-de-teste"}

@app.get("/perfil/{email}")
def buscar_perfil(email: str, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    data_obj = getattr(user, 'data_criacao', None)
    data_formatada = data_obj.strftime("%d/%m/%Y") if data_obj else "--/--/----"
    
    return {
        "apelido": user.apelido,
        "email": user.email,
        "telefone": user.telefone,
        "foto_perfil": user.foto_perfil,
        "data_criacao": data_formatada
    }



@app.delete("/perfil/{email}/foto")
def remover_foto(email: str, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    user.foto_perfil = None
    db.commit()
    return {"message": "Foto removida com sucesso"}

@app.put("/perfil/atualizar/{email_atual}")
def atualizar_perfil(email_atual: str, dados: UserUpdate, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == email_atual).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    if not dados.apelido or not dados.apelido.strip():
        raise HTTPException(status_code=400, detail="O apelido é obrigatório e não pode ser vazio.")
    
    user.apelido = dados.apelido.strip()
    user.telefone = dados.telefone
    
    if dados.nova_senha:
        if not dados.senha_atual or not password_hash.verify(dados.senha_atual, user.hashed_password):
            raise HTTPException(status_code=400, detail="Senha atual incorreta ou não informada")
        
        validar_complexidade_senha(dados.nova_senha)
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

@app.get("/inscricoes/{email}")
def listar_inscricoes(email: str, db: Session = Depends(database.get_db)):
    # Retorna apenas os IDs das trilhas que o usuário já se inscreveu
    inscricoes = db.query(models.Inscricao).filter(models.Inscricao.user_email == email).all()
    return [i.trilha_id for i in inscricoes]

@app.post("/inscrever")
def inscrever_trilha(email: str, trilha_id: str, db: Session = Depends(database.get_db)):
    # Verifica se já existe a inscrição
    existe = db.query(models.Inscricao).filter(
        models.Inscricao.user_email == email, 
        models.Inscricao.trilha_id == trilha_id
    ).first()
    
    if existe:
        raise HTTPException(status_code=400, detail="Você já está inscrito nesta trilha.")
    
    nova_inscricao = models.Inscricao(user_email=email, trilha_id=trilha_id)
    db.add(nova_inscricao)
    db.commit()
    return {"message": "Inscrição realizada com sucesso!"}