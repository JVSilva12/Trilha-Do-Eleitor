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

@app.post("/cadastro")
def criar_usuario(apelido: str, email: str, password: str, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    hashed_pwd = password_hash.hash(password)
    new_user = models.User(apelido=apelido,email=email, hashed_password=hashed_pwd)
    db.add(new_user)
    db.commit()
    return {"message": "Usuário criado com sucesso!"}

@app.post("/login")
def login(email: str, password: str, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user or not password_hash.verify(password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Email ou senha incorretos")
    
    return {"message": "Login realizado!", "token": "token-falso-de-teste"}