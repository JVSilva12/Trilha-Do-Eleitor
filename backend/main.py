import os
import shutil
import re
import smtplib
from contextlib import asynccontextmanager
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import models, database
from pwdlib import PasswordHash

# Garante a existência do diretório de uploads local
os.makedirs("uploads", exist_ok=True)

# GERENCIADOR DE CICLO DE VIDA (Lifespan) - Executa ações na inicialização e encerramento
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicializa as tabelas mapeadas no banco de dados SQLite automaticamente
    models.Base.metadata.create_all(bind=database.engine)
    
    # Executa a Carga Inicial Pedagógica na inicialização do servidor
    db = database.SessionLocal()
    try:
        total_trilhas = db.query(models.Trilha).count()
        if total_trilhas == 0:
            trilhas_padrao = [
                models.Trilha(
                    id=1,
                    nome="Urna Eletrônica",
                    descricao="Aprenda a utilizar a urna eletrônica de forma simples e prática.",
                    categoria="Educação eleitoral",
                    nivel="Básico",
                    imagem="urna",
                    status="publicada",
                    visibilidade="Pública"
                ),
                models.Trilha(
                    id=2,
                    nome="Processo Eleitoral",
                    descricao="Aprenda como funciona o processo eleitoral em território brasileiro.",
                    categoria="Cidadania",
                    nivel="Intermediário",
                    imagem="processo",
                    status="publicada",
                    visibilidade="Pública"
                ),
                models.Trilha(
                    id=3,
                    nome="Combate às Fake News",
                    descricao="Aprenda a identificar notícias falsas e saiba como combatê-las.",
                    categoria="Segurança Informacional",
                    nivel="Avançado",
                    imagem="fakenews",
                    status="publicada",
                    visibilidade="Pública"
                )
            ]
            db.add_all(trilhas_padrao)
            db.commit()
            print("✓ Carga inicial das 3 trilhas padrão realizada com sucesso via Lifespan!")
    except Exception as e:
        print(f"Erro na carga inicial: {e}")
    finally:
        db.close()
        
    yield # Divide o momento da inicialização do encerramento do app

# Inicializa o FastAPI passando o manipulador de ciclo de vida
app = FastAPI(lifespan=lifespan)

# Configuração de CORS (Essencial para comunicação com o React em localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Disponibiliza os arquivos da pasta 'uploads' através de URLs estáticas
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Motor recomendado pelo FastAPI para criptografia de senhas (Argon2)
password_hash = PasswordHash.recommended()

# Configurações do E-mail Administrativo do Grupo
EMAIL_ADM = "trilhadoeleitor.adm@gmail.com"
# COLOQUE AQUI AS 16 LETRAS DA SENHA DE APLICATIVO DO GMAIL (SEM ESPAÇOS)
EMAIL_PASSWORD = "qyld xtgg nijt vids" 

# --- MODELOS PYDANTIC PARA VALIDAÇÃO DE ENTRADA/SAÍDA ---

class UserUpdate(BaseModel):
    apelido: str
    email: str
    telefone: Optional[str] = None
    senha_atual: Optional[str] = None
    nova_senha: Optional[str] = None

class TrilhaSchema(BaseModel):
    id: Optional[int] = None
    nome: str
    descricao: str
    categoria: str
    nivel: str
    imagem: Optional[str] = None
    status: Optional[str] = "rascunho"
    visibilidade: Optional[str] = "Pública"

    class Config:
        from_attributes = True

# Schemas Pydantic reestruturados para suportar os blocos dinâmicos intercalados
class BlocoSchema(BaseModel):
    tipo: str  # 'texto', 'imagem', 'video'
    valor: str
    ordem: int

class TeoriaCreateSchema(BaseModel):
    trilha_id: int
    titulo: str
    blocos: List[BlocoSchema] = []

class TeoriaResponseSchema(BaseModel):
    id: int
    trilha_id: int
    titulo: str
    blocos: List[BlocoSchema] = []

    class Config:
        from_attributes = True

class QuizSchema(BaseModel):
    id: Optional[int] = None
    trilha_id: int
    enunciado: str
    alternativa_a: str
    alternativa_b: str
    alternativa_c: str
    alternativa_d: str
    resposta_correta: str

    class Config:
        from_attributes = True

# --- FUNÇÕES AUXILIARES DE SUPORTE ---

def validar_complexidade_senha(password: str):
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="A senha deve ter no mínimo 8 caracteres.")
    if not re.search(r"[A-Z]", password):
        raise HTTPException(status_code=400, detail="A senha deve conter ao menos uma letra maiúscula.")
    if not re.search(r"[a-z]", password):
        raise HTTPException(status_code=400, detail="A senha deve conter ao menos uma letra minúscula.")
    if not re.search(r"\d", password):
        raise HTTPException(status_code=400, detail="A senha deve conter ao menos um número.")

def enviar_email_real(nome_usuario: str, email_usuario: str):
    try:
        mensagem = MIMEMultipart()
        mensagem["From"] = EMAIL_ADM
        mensagem["To"] = EMAIL_ADM
        mensagem["Subject"] = f"🔔 Nova Solicitação de Conteudista: {nome_usuario}"

        base_url = "http://localhost:8000/admin/aprovar"
        link_aprovacao = f"{base_url}?email={email_usuario}"

        corpo_html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                <h2 style="color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Solicitação de Upgrade de Conta</h2>
                <p>O seguinte usuário solicitou permissões de <strong>Conteudista</strong> na plataforma Trilhas do Eleitor:</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p style="margin: 5px 0;"><strong>Apelido:</strong> {nome_usuario}</p>
                    <p style="margin: 5px 0;"><strong>E-mail:</strong> {email_usuario}</p>
                </div>
                <p>Para autorizar esse usuário a publicar novos conteúdos e questionários, clique no link abaixo:</p>
                <p style="text-align: center; margin-top: 25px;">
                    <a href="{link_aprovacao}" style="display: inline-block; padding: 12px 30px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(34, 197, 94, 0.2);">Aprovar Novo Conteudista</a>
                </p>
                <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;">
                <p style="font-size: 11px; color: #777; text-align: center;">Este é um e-mail automatizado gerado pelo sistema Trilhas do Eleitor.</p>
            </body>
        </html>
        """
        mensagem.attach(MIMEText(corpo_html, "html"))

        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(EMAIL_ADM, EMAIL_PASSWORD)
        server.sendmail(EMAIL_ADM, EMAIL_ADM, msg=mensagem.as_string())
        server.quit()
        print("E-mail administrativo enviado com sucesso!")
    except Exception as e:
        print(f"Falha ao enviar e-mail por SMTP: {e}")

# --- ROTAS DE AUTENTICAÇÃO E CADASTRO ---

@app.post("/cadastro")
def criar_usuario(apelido: str, email: str, password: str, db: Session = Depends(database.get_db)):
    validar_complexidade_senha(password)

    db_user = db.query(models.User).filter(models.User.email == email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    hashed_pwd = password_hash.hash(password)
    new_user = models.User(apelido=apelido, email=email, hashed_password=hashed_pwd, tipo_usuario="leitor")
    db.add(new_user)
    db.commit()
    return {"message": "Usuário criado com sucesso!"}

@app.post("/login")
def login(email: str, password: str, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not password_hash.verify(password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Email ou senha incorretos")
    return {"message": "Login realizado!", "token": "token-falso-de-teste"}


# --- ROTAS DO PERFIL DO USUÁRIO ---

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
        "data_criacao": data_formatada,
        "tipo_usuario": getattr(user, 'tipo_usuario', 'leitor')
    }

@app.put("/perfil/atualizar/{email_atual}")
def atualizar_perfil(email_atual: str, dados: UserUpdate, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == email_atual).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    if not dados.apelido or not dados.apelido.strip():
        raise HTTPException(status_code=400, detail="O apelido é obrigatório.")
    
    user.apelido = dados.apelido.strip()
    user.telefone = dados.telefone
    
    if dados.nova_senha:
        if not dados.senha_atual or not password_hash.verify(dados.senha_atual, user.hashed_password):
            raise HTTPException(status_code=400, detail="Senha atual incorreta")
        
        validar_complexidade_senha(dados.nova_senha)
        user.hashed_password = password_hash.hash(dados.nova_senha)
    
    db.commit()
    return {"message": "Perfil atualizado com sucesso!"}


# --- ROTAS DE GESTÃO DA FOTO DE PERFIL ---

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

@app.delete("/perfil/{email}/foto")
def remover_foto(email: str, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    user.foto_perfil = None
    db.commit()
    return {"message": "Foto removida com sucesso"}


# --- ROTAS DO SISTEMA DE TRILHAS (INSCRIÇÕES DOS ALUNOS) ---

@app.get("/inscricoes/{email}")
def listar_inscricoes(email: str, db: Session = Depends(database.get_db)):
    inscricoes = db.query(models.Inscricao).filter(models.Inscricao.user_email == email).all()
    return [int(i.trilha_id) for i in inscricoes if i.trilha_id.isdigit()]

@app.post("/inscrever")
def inscrever_trilha(email: str, trilha_id: int, db: Session = Depends(database.get_db)):
    trilha = db.query(models.Trilha).filter(models.Trilha.id == trilha_id).first()
    if not trilha:
        raise HTTPException(status_code=404, detail="Trilha educativa não encontrada.")

    existe = db.query(models.Inscricao).filter(
        models.Inscricao.user_email == email, 
        models.Inscricao.trilha_id == str(trilha_id)
    ).first()
    
    if existe:
        raise HTTPException(status_code=400, detail="Você já está inscrito nesta trilha.")
    
    nova_inscricao = models.Inscricao(user_email=email, trilha_id=str(trilha_id))
    db.add(nova_inscricao)
    db.commit()
    return {"message": "Inscrição realizada!"}


# --- ROTAS DO GERENCIADOR DE TRILHAS (CRUD PRINCIPAL DO CONTEUDISTA) ---

@app.get("/trilhas", response_model=List[TrilhaSchema])
def listar_todas_trilhas(db: Session = Depends(database.get_db)):
    return db.query(models.Trilha).all()

@app.post("/trilhas", response_model=TrilhaSchema)
def cadastrar_nova_trilha(trilha: TrilhaSchema, db: Session = Depends(database.get_db)):
    nova_trilha = models.Trilha(
        nome=trilha.nome,
        descricao=trilha.descricao,
        categoria=trilha.categoria,
        nivel=trilha.nivel,
        imagem=trilha.imagem,
        status=trilha.status,
        visibilidade=trilha.visibilidade
    )
    db.add(nova_trilha)
    db.commit()
    db.refresh(nova_trilha)
    return nova_trilha

@app.delete("/trilhas/{trilha_id}")
def deletar_trilha_pedagogica(trilha_id: int, db: Session = Depends(database.get_db)):
    trilha = db.query(models.Trilha).filter(models.Trilha.id == trilha_id).first()
    if not trilha:
        raise HTTPException(status_code=404, detail="Trilha educativa não encontrada.")
    db.delete(trilha)
    db.commit()
    return {"message": "Trilha educativa excluída de forma definitiva!"}


# --- ROTA DE ARQUIVOS INTERNOS: SALVA ARQUIVOS DO COMPUTADOR PARA AS TRILHAS ---

@app.post("/trilhas/upload-imagem")
def upload_imagem_teoria(file: UploadFile = File(...)):
    try:
        nome_arquivo = f"teoria_{file.filename.replace(' ', '_')}"
        file_location = f"uploads/{nome_arquivo}"
        
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
            
        return {"url_imagem": f"http://127.0.0{file_location}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao salvar arquivo físico: {str(e)}")


# --- ROTAS DE PROMOÇÃO PEDAGÓGICA (AULAS EM BLOCOS INTERCALADOS E PERGUNTAS DE QUIZ) ---

@app.post("/trilhas/{trilha_id}/teoria", response_model=TeoriaResponseSchema)
def salvar_teoria_trilha(trilha_id: int, teoria: TeoriaCreateSchema, db: Session = Depends(database.get_db)):
    db_teoria = db.query(models.ConteudoTeoria).filter(models.ConteudoTeoria.trilha_id == trilha_id).first()
    if db_teoria:
        db_teoria.titulo = teoria.titulo
        db_teoria.blocos.clear() # Limpa a sequência antiga para reescrever os novos inputs ordenados
    else:
        db_teoria = models.ConteudoTeoria(trilha_id=trilha_id, titulo=teoria.titulo)
        db.add(db_teoria)
    db.commit()

    # Adiciona cada bloco sequencial (Texto, Imagem ou Vídeo) mapeado na interface gráfica
    for b in teoria.blocos:
        if b.valor.strip():
            novo_bloco = models.BlocoTeoria(tipo=b.tipo, valor=b.valor.strip(), ordem=b.ordem)
            db_teoria.blocos.append(novo_bloco)

    db.commit()
    db.refresh(db_teoria)

    return {
        "id": db_teoria.id,
        "trilha_id": db_teoria.trilha_id,
        "titulo": db_teoria.titulo,
        "blocos": [{"tipo": blk.tipo, "valor": blk.valor, "ordem": blk.ordem} for blk in db_teoria.blocos]
    }

@app.get("/trilhas/{trilha_id}/teoria", response_model=TeoriaResponseSchema)
def buscar_teoria_trilha(trilha_id: int, db: Session = Depends(database.get_db)):
    teoria = db.query(models.ConteudoTeoria).filter(models.ConteudoTeoria.trilha_id == trilha_id).first()
    if not teoria: 
        raise HTTPException(status_code=404, detail="Conteúdo teórico ainda não cadastrado para esta trilha.")
    
    return {
        "id": teoria.id,
        "trilha_id": teoria.trilha_id,
        "titulo": teoria.titulo,
        "blocos": [{"tipo": blk.tipo, "valor": blk.valor, "ordem": blk.ordem} for blk in teoria.blocos]
    }

@app.post("/trilhas/{trilha_id}/quiz", response_model=QuizSchema)
def adicionar_pergunta_quiz(trilha_id: int, quiz: QuizSchema, db: Session = Depends(database.get_db)):
    nova_questao = models.PerguntaQuiz(
        trilha_id=trilha_id,
        enunciado=quiz.enunciado,
        alternativa_a=quiz.alternativa_a,
        alternativa_b=quiz.alternativa_b,
        alternativa_c=quiz.alternativa_c,
        alternativa_d=quiz.alternativa_d,
        resposta_correta=quiz.resposta_correta
    )
    db.add(nova_questao)
    db.commit()
    db.refresh(nova_questao)
    return nova_questao

@app.get("/trilhas/{trilha_id}/quiz", response_model=List[QuizSchema])
def listar_perguntas_quiz(trilha_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.PerguntaQuiz).filter(models.PerguntaQuiz.trilha_id == trilha_id).all()


# --- ROTAS ADMINISTRATIVAS (MODERAÇÃO CONTEUDISTA COM REDIRECIONAMENTO HTML) ---

@app.post("/perfil/{email}/solicitar-conteudista")
def solicitar_conteudista(email: str, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    if getattr(user, 'tipo_usuario', 'leitor') == "conteudista":
        raise HTTPException(status_code=400, detail="Você já é um conteudista.")
    if getattr(user, 'tipo_usuario', 'leitor') == "pendente":
        raise HTTPException(status_code=400, detail="Sua solicitação já está em análise.")
        
    user.tipo_usuario = "pendente"
    db.commit()
    
    background_tasks.add_task(enviar_email_real, user.apelido, email)
    return {"message": "Solicitação enviada com sucesso! Aguarde a moderação dos administradores."}

@app.get("/admin/aprovar", response_class=HTMLResponse)
def aprovar_conteudista(email: str, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        return "<html><body style='font-family: Arial; text-align: center; padding-top: 50px;'><h2 style='color: #ef4444;'>❌ Erro: Usuário não encontrado.</h2></body></html>"
    
    user.tipo_usuario = "conteudista"
    db.commit()
    
    return f"""
    <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding-top: 60px; background-color: #f8fafc; color: #333;">
            <div style="max-width: 450px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                <h2 style="color: #22c55e; margin-bottom: 10px;">✓ Sucesso Total!</h2>
                <p style="font-size: 16px; margin: 0 0 20px 0;">O usuário <strong>{user.apelido}</strong> foi promovido.</p>
                <span style="display: inline-block; padding: 6px 16px; background-color: #dbeafe; color: #1e40af; border-radius: 20px; font-weight: bold; font-size: 13px;">Cargo: Conteudista Oficial</span>
                <p style="font-size: 12px; color: #64748b; margin-top: 25px;">O painel do usuário no React atualizará automaticamente em instantes.</p>
            </div>
        </body>
    </html>
    """