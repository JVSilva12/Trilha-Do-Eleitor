import os
import shutil
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

@app.post("/cadastro")
def criar_usuario(apelido: str, email: str, password: str, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    hashed_pwd = password_hash.hash(password)
    new_user = models.User(apelido=apelido, nome_completo=apelido, email=email, hashed_password=hashed_pwd)
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
    return {
        "apelido": user.apelido,
        "email": user.email,
        "telefone": user.telefone,
        "nome_completo": user.nome_completo,
        "foto_perfil": user.foto_perfil 
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