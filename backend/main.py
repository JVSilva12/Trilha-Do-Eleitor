from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models, database
from pwdlib import PasswordHash

# Cria as tabelas
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

password_hash = PasswordHash.recommended()

from models import UserOut, UserUpdate

@app.post("/cadastro")
def criar_usuario(
    apelido: str,
    email: str,
    password: str,
    telefone: str | None = None,
    imagem_perfil: str | None = None,
    db: Session = Depends(database.get_db)
):
    db_user = db.query(models.User).filter(models.User.email == email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    hashed_pwd = password_hash.hash(password)
    new_user = models.User(
        apelido=apelido,
        email=email,
        telefone=telefone,
        imagem_perfil=imagem_perfil,
        hashed_password=hashed_pwd
    )
    db.add(new_user)
    db.commit()
    return {"message": "Usuário criado com sucesso!"}


# Endpoint para buscar perfil do usuário
@app.get("/usuario/{user_id}", response_model=UserOut)
def get_usuario(user_id: int, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user

# Endpoint para editar perfil do usuário
@app.put("/usuario/{user_id}")
def update_usuario(user_id: int, dados: UserUpdate, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if dados.apelido is not None:
        user.apelido = dados.apelido
    if dados.telefone is not None:
        user.telefone = dados.telefone
    if dados.imagem_perfil is not None:
        user.imagem_perfil = dados.imagem_perfil
    if dados.email is not None:
        # Verifica se o novo email já existe
        if db.query(models.User).filter(models.User.email == dados.email, models.User.id != user_id).first():
            raise HTTPException(status_code=400, detail="Email já cadastrado")
        user.email = dados.email
    if dados.senha:
        user.hashed_password = password_hash.hash(dados.senha)
    db.commit()
    db.refresh(user)
    return {"message": "Perfil atualizado com sucesso!"}

@app.post("/login")
def login(email: str, password: str, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user or not password_hash.verify(password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Email ou senha incorretos")
    
    return {"message": "Login realizado!", "token": "token-falso-de-teste"}