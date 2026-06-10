import os
import shutil
import re
import smtplib
from datetime import datetime
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

# =========================================================================
# 1. INICIALIZAÇÃO DE DIRETÓRIOS E CONFIGURAÇÕES DE AMBIENTE LOCAL
# =========================================================================

# Garante a existência do diretório de uploads local na máquina do desenvolvedor
os.makedirs("uploads", exist_ok=True)

# Motor padrão recomendado pelo FastAPI para criptografia e verificação de senhas (Argon2)
password_hash = PasswordHash.recommended()

# Configurações Oficiais de Credenciais do E-mail Administrativo do Grupo
EMAIL_ADM = "trilhadoeleitor.adm@gmail.com"
# Token estrito de 16 letras de segurança gerado pelo painel de senhas de app do Google
EMAIL_PASSWORD = "qyld xtgg nijt vids" 


# =========================================================================
# 2. GERENCIADOR DE CICLO DE VIDA (LIFESPAN) - SUBSTITUI O ANTIGO STARTUP
# =========================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Controlador reativo do ciclo de vida da aplicação FastAPI.
    Garante o mapeamento inicial de DDL e a injeção do banco pedagógico inicial.
    """
    # Cria fisicamente as tabelas mapeadas no models.py dentro do arquivo usuarios.db se não existirem
    models.Base.metadata.create_all(bind=database.engine)
    
    # Estabelece uma sessão isolada temporária para a carga semente de dados (Seed)
    db = database.SessionLocal()
    try:
        total_trilhas = db.query(models.Trilha).count()
        if total_trilhas == 0:
            print("→ Banco de dados vazio detectado. Iniciando injeção semente de trilhas...")
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
            
            # Adiciona módulo com jogo fake news para a Trilha "Combate às Fake News" na seção de Prática
            modulo_jogo = models.ConteudoTeoria(
                trilha_id=3,  # Trilha "Combate às Fake News"
                titulo="Detetive da Informação - Prática Interativa",
                ordem_modulo=0,
                tipo_conteudo="pratica"  # Tipo prática
            )
            db.add(modulo_jogo)
            db.flush()  # Obtém o ID do módulo
            
            # Cria um bloco do tipo 'jogo' que renderizará o JogoFakeNews
            bloco_jogo = models.BlocoTeoria(
                teoria_id=modulo_jogo.id,
                tipo="jogo",
                valor="fake-news-detector",
                ordem=0
            )
            db.add(bloco_jogo)
            
            # Adiciona notícias de exemplo para o jogo
            noticias_exemplo = [
                models.NoticiaJogo(
                    modulo_id=modulo_jogo.id,
                    ordem=1,
                    imagem="https://via.placeholder.com/400x300?text=Noticia+1",
                    eh_fato=1,
                    explicacao="Esta notícia é um FATO. A urna eletrônica brasileira utiliza tecnologia de voto eletrônico desde 1996 e é considerada segura por especialistas internacionais."
                ),
                models.NoticiaJogo(
                    modulo_id=modulo_jogo.id,
                    ordem=2,
                    imagem="https://via.placeholder.com/400x300?text=Noticia+2",
                    eh_fato=0,
                    explicacao="Esta notícia é FAKE. Não existem evidências científicas de que as urnas eletrônicas possam ser facilmente hackeadas. Os testes de segurança ocorrem regularmente."
                ),
                models.NoticiaJogo(
                    modulo_id=modulo_jogo.id,
                    ordem=3,
                    imagem="https://via.placeholder.com/400x300?text=Noticia+3",
                    eh_fato=1,
                    explicacao="Esta notícia é um FATO. O voto impresso é uma medida adicional de segurança que foi implementada para aumentar ainda mais a confiança no processo eleitoral."
                )
            ]
            db.add_all(noticias_exemplo)
            db.commit()
            print("✓ Módulo de jogo fake news adicionado à Trilha 'Urna Eletrônica'!")
    except Exception as e:
        print(f"❌ Falha crítica ao processar a carga semente do banco: {e}")
        db.rollback()
    finally:
        db.close()
        
    yield # Divide o momento da inicialização do encerramento físico do servidor uvicorn


# Inicialização formal do FastAPI injetando o manipulador de contexto assíncrono
app = FastAPI(
    title="Trilha do Eleitor API",
    description="Backend estruturado e relacional para gerenciamento pedagógico de trilhas",
    version="3.0.0",
    lifespan=lifespan
)


# =========================================================================
# 3. CONFIGURAÇÃO POLÍTICA DE SEGURANÇA E CORS (REACT VITE LOCALHOST)
# =========================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================================
# 4. MODELOS PYDANTIC (SCHEMAS DE VALIDAÇÃO E DATA TRANSFER OBJECTS)
# =========================================================================

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
    data_criacao: Optional[str] = None
    data_atualizacao: Optional[str] = None

    class Config:
        from_attributes = True

class BlocoSchema(BaseModel):
    tipo: str  # 'texto', 'imagem' ou 'video'
    valor: str
    ordem: int

class TeoriaCreateSchema(BaseModel):
    id: Optional[int] = None
    trilha_id: int
    titulo: str
    ordem_modulo: Optional[int] = 0
    blocos: List[BlocoSchema] = []

class TeoriaResponseSchema(BaseModel):
    id: int
    trilha_id: int
    titulo: str
    ordem_modulo: int
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

class NoticiasJogoSchema(BaseModel):
    id: Optional[int] = None
    modulo_id: int
    ordem: int
    imagem: Optional[str] = None
    eh_fato: int
    explicacao: str

    class Config:
        from_attributes = True


# =========================================================================
# 5. FUNÇÕES TÉCNICAS AUXILIARES (VALIDAÇÃO E DISPARO DE PROMOÇÃO)
# =========================================================================

def validar_complexidade_senha(password: str):
    """
    Validador estrito de força de senha baseado em Regex.
    Exige tamanho mínimo, letras maiúsculas, minúsculas e inteiros numéricos.
    """
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="A senha deve ter no mínimo 8 caracteres.")
    if not re.search(r"[A-Z]", password):
        raise HTTPException(status_code=400, detail="A senha deve conter ao menos uma letra maiúscula.")
    if not re.search(r"[a-z]", password):
        raise HTTPException(status_code=400, detail="A senha deve conter ao menos uma letra minúscula.")
    if not re.search(r"\d", password):
        raise HTTPException(status_code=400, detail="A senha deve conter ao menos um número.")

def enviar_email_real(nome_usuario: str, email_usuario: str):
    """
    Gerenciador SMTP do Google para envio assíncrono de moderação.
    Cria uma mensagem MIME estruturada com link absoluto de aprovação local.
    """
    try:
        mensagem = MIMEMultipart()
        mensagem["From"] = EMAIL_ADM
        mensagem["To"] = EMAIL_ADM
        mensagem["Subject"] = f"🔔 Nova Solicitação de Conteudista: {nome_usuario}"

        # Endereço absoluto local injetado com query parameters limpos para clique na mesma máquina
        base_url = "http://localhost:8000/admin/aprovar"
        link_aprovacao = f"{base_url}?email={email_usuario}"

        corpo_html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                <h2 style="color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Solicitação de Upgrade de Conta</h2>
                <p>O seguinte usuário solicitou permissões de <strong>Conteudista</strong> na plataforma Trilha do Eleitor:</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p style="margin: 5px 0;"><strong>Apelido:</strong> {nome_usuario}</p>
                    <p style="margin: 5px 0;"><strong>E-mail:</strong> {email_usuario}</p>
                </div>
                <p>Para autorizar esse usuário a publicar novos conteúdos e questionários, clique no link abaixo:</p>
                <p style="text-align: center; margin-top: 25px;">
                    <a href="{link_aprovacao}" style="display: inline-block; padding: 12px 30px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(34, 197, 94, 0.2);">Aprovar Novo Conteudista</a>
                </p>
                <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;">
                <p style="font-size: 11px; color: #777; text-align: center;">Este é um e-mail automatizado gerado pelo sistema Trilha do Eleitor.</p>
            </body>
        </html>
        """
        mensagem.attach(MIMEText(corpo_html, "html"))

        # Conexão estrita com a porta TLS segura do servidor do Gmail do Google
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(EMAIL_ADM, EMAIL_PASSWORD)
        server.sendmail(EMAIL_ADM, EMAIL_ADM, msg=mensagem.as_string())
        server.quit()
        print("E-mail administrativo enviado com sucesso para a caixa corporativa!")
    except Exception as e:
        print(f"Falha ao enviar e-mail por SMTP: {e}")


# =========================================================================
# 6. ROTAS DO NÚCLEO DE AUTENTICAÇÃO E CONTROLE DE ACESSO (CADASTRO / LOGIN)
# =========================================================================

@app.post("/cadastro", summary="Cria uma nova conta de eleitor")
def criar_usuario(apelido: str, email: str, password: str, db: Session = Depends(database.get_db)):
    validar_complexidade_senha(password)
    db_user = db.query(models.User).filter(models.User.email == email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado na plataforma.") 
    
    hashed_pwd = password_hash.hash(password)
    new_user = models.User(apelido=apelido, email=email, hashed_password=hashed_pwd, tipo_usuario="leitor")
    db.add(new_user)
    db.commit()
    return {"message": "Usuário criado com sucesso!"}

@app.post("/login", summary="Valida credenciais do usuário")
def login(email: str, password: str, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not password_hash.verify(password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Email ou senha incorretos")
    return {"message": "Login realizado!", "token": "token-falso-de-teste"}


# =========================================================================
# 7. ROTAS DE GESTÃO DO PERFIL DO USUÁRIO E ARQUIVOS CADASTRAIS
# =========================================================================

@app.get("/perfil/{email}", summary="Busca dados detalhados do perfil")
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

@app.put("/perfil/atualizar/{email_atual}", summary="Atualiza dados textuais do perfil")
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
            raise HTTPException(status_code=400, detail="Senha atual informada está incorreta.")
        
        validar_complexidade_senha(dados.nova_senha)
        user.hashed_password = password_hash.hash(dados.nova_senha)
    
    db.commit()
    return {"message": "Perfil updated com sucesso!"}

@app.post("/perfil/{email}/foto", summary="Realiza upload físico da foto de perfil")
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

@app.delete("/perfil/{email}/foto", summary="Remove a foto cadastrada voltando para iniciais")
def remover_foto(email: str, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    user.foto_perfil = None
    db.commit()
    return {"message": "Foto removida com sucesso de forma definitiva"}


# =========================================================================
# 8. ROTAS DO SISTEMA DE INSCRIÇÕES E PROGRESSO DOS ALUNOS/ELEITORES
# =========================================================================

@app.get("/inscricoes/{email}", summary="Lista trilhas em que o aluno está inscrito")
def listar_inscricoes(email: str, db: Session = Depends(database.get_db)):
    inscricoes = db.query(models.Inscricao).filter(models.Inscricao.user_email == email).all()
    return [int(i.trilha_id) for i in inscricoes if i.trilha_id.isdigit()]

@app.post("/inscrever", summary="Cria um vínculo de matrícula na trilha")
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
    return {"message": "Inscrição realizada com sucesso!"}

@app.post("/trilhas/{trilha_id}/concluir-modulo/{modulo_id}", summary="Marca um módulo teórico como lido e concluído pelo aluno")
def concluir_modulo_estudante(trilha_id: int, modulo_id: int, email: str, db: Session = Depends(database.get_db)):
    # Verifica se já existe o registro para evitar duplicidade
    existe = db.query(models.ProgressoModulo).filter(
        models.ProgressoModulo.user_email == email,
        models.ProgressoModulo.trilha_id == trilha_id,
        models.ProgressoModulo.modulo_id == modulo_id
    ).first()
    
    if not existe:
        novo_progresso = models.ProgressoModulo(user_email=email, trilha_id=trilha_id, modulo_id=modulo_id)
        db.add(novo_progresso)
        db.commit()
    return {"message": "Módulo concluído com sucesso!"}

@app.get("/trilhas/{trilha_id}/progresso/{email}", summary="Calcula a porcentagem real de progresso do aluno na trilha")
def obter_progresso_trilha(trilha_id: int, email: str, db: Session = Depends(database.get_db)):
    # 1. Busca os IDs de todos os módulos que ATUALMENTE existem nessa trilha
    ids_modulos_atuais = {
        row.id for row in
        db.query(models.ConteudoTeoria.id)
          .filter(models.ConteudoTeoria.trilha_id == trilha_id)
          .all()
    }
    total_modulos = len(ids_modulos_atuais)

    # Se a trilha não tiver nenhum módulo cadastrado ainda, o progresso padrão é 100% para liberar o fluxo
    if total_modulos == 0:
        return {"porcentagem": 100, "concluidos": 0, "totais": 0, "liberado_quiz": True}

    # 2. Busca os registros de progresso filtrando apenas módulos que ainda existem.
    #    Isso evita que registros órfãos (de módulos excluídos) ou registros de
    #    trilhas antigas (módulos adicionados depois) distorçam o cálculo,
    #    impedindo porcentagens acima de 100% ou travamento indevido do quiz.
    registros_concluidos = db.query(models.ProgressoModulo).filter(
        models.ProgressoModulo.user_email == email,
        models.ProgressoModulo.trilha_id == trilha_id,
        models.ProgressoModulo.modulo_id.in_(ids_modulos_atuais)
    ).all()

    concluidos_ids = [r.modulo_id for r in registros_concluidos]
    concluidos = len(concluidos_ids)

    # 3. Calcula a porcentagem com base apenas nos módulos existentes
    porcentagem = min(int((concluidos / total_modulos) * 100), 100)

    return {
        "porcentagem": porcentagem,
        "concluidos": concluidos,
        "totais": total_modulos,
        "concluidos_ids": concluidos_ids,  # Lista de IDs lidos — usada pelo frontend para exibir ✓/✕
        "liberado_quiz": concluidos >= total_modulos  # Garante que todos os módulos atuais foram lidos
    }


# =========================================================================
# 9. ROTAS DO GERENCIADOR DE TRILHAS (CRUD PRINCIPAL DE MÓDULOS GLOBAIS)
# =========================================================================

@app.get("/trilhas", response_model=List[TrilhaSchema], summary="Lista todas as trilhas com timestamps")
def listar_todas_trilhas(db: Session = Depends(database.get_db)):
    trilhas = db.query(models.Trilha).all()
    for t in trilhas:
        if t.data_criacao:
            t.data_criacao = t.data_criacao.isoformat()
        if t.data_atualizacao:
            t.data_atualizacao = t.data_atualizacao.isoformat()
    return trilhas

@app.post("/trilhas", response_model=TrilhaSchema, summary="Cria um novo esqueleto de trilha corrigido")
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
    db.refresh(nova_trilha) # CORREÇÃO: Traz as propriedades geradas de forma nativa pelo SQLite
    
    # Faz o parser dos carimbos datetime para strings ISO aceitas pelo Pydantic Schema antes de responder
    if nova_trilha.data_criacao:
        nova_trilha.data_criacao = nova_trilha.data_criacao.isoformat()
    if nova_trilha.data_atualizacao:
        nova_trilha.data_atualizacao = nova_trilha.data_atualizacao.isoformat()
        
    return nova_trilha

@app.patch("/trilhas/{trilha_id}/imagem", summary="Atualiza somente a imagem de capa de uma trilha")
def atualizar_imagem_trilha(trilha_id: int, payload: dict, db: Session = Depends(database.get_db)):
    trilha = db.query(models.Trilha).filter(models.Trilha.id == trilha_id).first()
    if not trilha:
        raise HTTPException(status_code=404, detail="Trilha não encontrada.")
    trilha.imagem = payload.get("imagem")
    db.commit()
    return {"message": "Imagem de capa atualizada com sucesso!", "imagem": trilha.imagem}

@app.delete("/trilhas/{trilha_id}", summary="Exclui uma trilha e limpa mídias em cascata")
def deletar_trilha_pedagogica(trilha_id: int, db: Session = Depends(database.get_db)):
    trilha = db.query(models.Trilha).filter(models.Trilha.id == trilha_id).first()
    if not trilha:
        raise HTTPException(status_code=404, detail="Trilha educativa não encontrada.")
    db.delete(trilha)
    db.commit()
    return {"message": "Trilha educativa excluída de forma definitiva!"}

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.post("/trilhas/upload-imagem", summary="Upload de imagens locais do computador para as lições corrigido")
def upload_imagem_teoria(file: UploadFile = File(...)):
    try:
        nome_arquivo = f"teoria_{file.filename.replace(' ', '_')}"
        file_location = f"uploads/{nome_arquivo}"
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
            
        # CORREÇÃO: Inclusão explícita da porta :8000/ mapeada na rede localhost
        return {"url_imagem": f"http://127.0.0.1:8000/{file_location}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =========================================================================
# 10. ENDPOINTS REESTRUTURADOS DO PASSO 3: SUPORTE A MÚLTIPLOS MÓDULOS
# =========================================================================

@app.get("/trilhas/{trilha_id}/modulos", response_model=List[TeoriaResponseSchema], summary="Lista os capítulos/módulos de uma trilha")
def listar_modulos_da_trilha(trilha_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.ConteudoTeoria).filter(models.ConteudoTeoria.trilha_id == trilha_id).order_by(models.ConteudoTeoria.ordem_modulo).all()

@app.get("/modulos/{modulo_id}", response_model=TeoriaResponseSchema, summary="Busca dados estruturados de um módulo específico")
def buscar_modulo_especifico(modulo_id: int, db: Session = Depends(database.get_db)):
    modulo = db.query(models.ConteudoTeoria).filter(models.ConteudoTeoria.id == modulo_id).first()
    if not modulo:
        raise HTTPException(status_code=404, detail="Módulo didático não encontrado.")
    return modulo

@app.post("/trilhas/{trilha_id}/teoria", response_model=TeoriaResponseSchema, summary="Salva ou atualiza um módulo pedagógico em blocos")
def salvar_modulo_teoria(trilha_id: int, teoria: TeoriaCreateSchema, db: Session = Depends(database.get_db)):
    db_teoria = None
    if teoria.id:
        db_teoria = db.query(models.ConteudoTeoria).filter(models.ConteudoTeoria.id == teoria.id).first()
    
    if db_teoria:
        db_teoria.titulo = teoria.titulo
        db_teoria.ordem_modulo = teoria.ordem_modulo
        db_teoria.blocos.clear()
    else:
        proxima_ordem = teoria.ordem_modulo
        if not proxima_ordem:
            total_existente = db.query(models.ConteudoTeoria).filter(models.ConteudoTeoria.trilha_id == trilha_id).count()
            proxima_ordem = total_existente
        
        db_teoria = models.ConteudoTeoria(trilha_id=trilha_id, titulo=teoria.titulo, ordem_modulo=proxima_ordem)
        db.add(db_teoria)
    
    db.commit()
    for b in teoria.blocos:
        if b.valor.strip():
            novo_bloco = models.BlocoTeoria(tipo=b.tipo, valor=b.valor.strip(), ordem=b.ordem)
            db_teoria.blocos.append(novo_bloco)
            
    # PASSO 1 REATIVO: Força a atualização do timestamp automático na trilha pai informando a modificação recente
    trilha_pai = db.query(models.Trilha).filter(models.Trilha.id == trilha_id).first()
    if trilha_pai:
        trilha_pai.data_atualizacao = datetime.now()
        
    db.commit()
    db.refresh(db_teoria)
    return {
        "id": db_teoria.id,
        "trilha_id": db_teoria.trilha_id,
        "titulo": db_teoria.titulo,
        "ordem_modulo": db_teoria.ordem_modulo,
        "blocos": [{"tipo": blk.tipo, "valor": blk.valor, "ordem": blk.ordem} for blk in db_teoria.blocos]
    }

@app.delete("/modulos/{modulo_id}", summary="Exclui um módulo de lição textual")
def deletar_modulo_teoria(modulo_id: int, db: Session = Depends(database.get_db)):
    modulo = db.query(models.ConteudoTeoria).filter(models.ConteudoTeoria.id == modulo_id).first()
    if not modulo:
        raise HTTPException(status_code=404, detail="Módulo didático não encontrado.")
    db.delete(modulo)
    db.commit()
    return {"message": "Módulo teórico removido com sucesso!"}

@app.get("/modulos/{modulo_id}/noticias-jogo", response_model=List[NoticiasJogoSchema], summary="Obtém as notícias do jogo fake news para um módulo")
def obter_noticias_jogo(modulo_id: int, db: Session = Depends(database.get_db)):
    noticias = db.query(models.NoticiaJogo).filter(models.NoticiaJogo.modulo_id == modulo_id).order_by(models.NoticiaJogo.ordem).all()
    return noticias


# =========================================================================
# 11. ENDPOINTS COMPLETOS DO QUIZ (CADASTRO, EDIÇÃO E EXCLUSÃO DO PASSO 2)
# =========================================================================

@app.get("/trilhas/{trilha_id}/quiz", response_model=List[QuizSchema], summary="Lista o caderno de questões de uma trilha")
def listar_perguntas_quiz(trilha_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.PerguntaQuiz).filter(models.PerguntaQuiz.trilha_id == trilha_id).all()

@app.post("/trilhas/{trilha_id}/quiz", response_model=QuizSchema, summary="Adiciona uma nova pergunta ao questionário")
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

@app.delete("/quiz/{pergunta_id}", summary="PASSO 2: Remove uma questão do Quiz")
def deletar_pergunta_quiz(pergunta_id: int, db: Session = Depends(database.get_db)):
    questao = db.query(models.PerguntaQuiz).filter(models.PerguntaQuiz.id == pergunta_id).first()
    if not questao:
        raise HTTPException(status_code=404, detail="Questão do Quiz não encontrada.")
    db.delete(questao)
    db.commit()
    return {"message": "Questão removida do Quiz com sucesso!"}

@app.put("/quiz/{pergunta_id}", response_model=QuizSchema, summary="PASSO 2: Atualiza dados de uma questão existente")
def atualizar_pergunta_quiz(pergunta_id: int, dados: QuizSchema, db: Session = Depends(database.get_db)):
    questao = db.query(models.PerguntaQuiz).filter(models.PerguntaQuiz.id == pergunta_id).first()
    if not questao:
        raise HTTPException(status_code=404, detail="Questão do Quiz não encontrada.")
    
    questao.enunciado = dados.enunciado.strip()
    questao.alternativa_a = dados.alternativa_a.strip()
    questao.alternativa_b = dados.alternativa_b.strip()
    questao.alternativa_c = dados.alternativa_c.strip()
    questao.alternativa_d = dados.alternativa_d.strip()
    questao.resposta_correta = dados.resposta_correta
    
    db.commit()
    db.refresh(questao)
    return questao


# =========================================================================
# 12. ROTAS ADMINISTRATIVAS E MODERAÇÃO CORPORATIVA (UPGRADE CONTEUDISTA)
# =========================================================================

@app.post("/perfil/{email}/solicitar-conteudista", summary="Inicia a moderação enviando e-mail para a banca")
def solicitar_conteudista(email: str, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db)):
    """
    Inicia o fluxo de upgrade de privilégios do eleitor comum para conteudista.
    Muda o status para 'pendente' e enfileira o envio do e-mail administrativo.
    """
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    
    if getattr(user, 'tipo_usuario', 'leitor') == "conteudista":
        raise HTTPException(status_code=400, detail="Você já é um conteudista oficial.")
    if getattr(user, 'tipo_usuario', 'leitor') == "pendente":
        raise HTTPException(status_code=400, detail="Sua solicitação já está em análise de moderação.")
        
    user.tipo_usuario = "pendente"
    db.commit()
    
    # Enfileira a tarefa em background para evitar travamento na requisição do React
    background_tasks.add_task(enviar_email_real, user.apelido, email)
    return {"message": "Solicitação enviada com sucesso! Aguarde a moderação administrativa."}

@app.get("/admin/aprovar", response_class=HTMLResponse, summary="Rota capturada pelo clique no e-mail do Gmail")
def aprovar_conteudista(email: str, db: Session = Depends(database.get_db)):
    """
    Endpoint em HTML puro interceptado pelo clique do administrador no Gmail.
    Promove o usuário para 'conteudista' diretamente no banco SQLite.
    """
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        return "<html><body style='font-family:Arial;text-align:center;padding-top:50px;'><h2 style='color:#ef4444;'>❌ Erro: Usuário não localizado.</h2></body></html>"
    
    user.tipo_usuario = "conteudista"
    db.commit()
    
    return f"""
    <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding-top: 60px; background-color: #f8fafc; color: #333;">
            <div style="max-width: 450px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                <h2 style="color: #22c55e; margin-bottom: 10px;">✓ Sucesso Total!</h2>
                <p style="font-size: 16px; margin: 0 0 20px 0;">O usuário <strong>{user.apelido}</strong> foi promovido com sucesso.</p>
                <span style="display: inline-block; padding: 6px 16px; background-color: #dbeafe; color: #1e40af; border-radius: 20px; font-weight: bold; font-size: 13px;">Cargo: Conteudista Oficial</span>
                <p style="font-size: 12px; color: #64748b; margin-top: 25px;">A tela reativa do React sincronizará o botão em segundo plano em até 4 segundos.</p>
            </div>
        </body>
    </html>
    """

# =========================================================================
# 13. EXECUÇÃO FÍSICA DO SERVIDOR LOCAL (BLINDAGEM DA PORTA DE REDE)
# =========================================================================

# GERENCIADOR GLOBAL DE EXCEÇÕES (Garante estabilidade contra inputs corrompidos do React)
@app.exception_handler(Exception)
async def gerenciador_erros_global(request, exc):
    """
    Intercepta qualquer erro de execução (runtime error) não tratado no backend.
    Evita o travamento do servidor Uvicorn e retorna um log limpo para o console.
    """
    print(f"❌ Erro interno interceptado na requisição {request.url.path}: {str(exc)}")
    return HTMLResponse(
        status_code=500,
        content=f"""
        <html>
            <body style="font-family: Arial; text-align: center; padding-top: 50px; background-color: #fef2f2;">
                <h2 style="color: #ef4444;">⚠️ Instabilidade no Servidor Local (500)</h2>
                <p style="color: #475569;">Verifique as chaves estrangeiras ou reinicie o arquivo usuarios.db.</p>
                <pre style="background: #cbd5e1; padding: 15px; border-radius: 8px; max-width: 600px; margin: 20px auto; text-align: left; font-size: 12px;">{str(exc)}</pre>
            </body>
        </html>
        """
    )

if __name__ == "__main__":
    import uvicorn
    # Executa a aplicação amarrada estritamente ao barramento local IPv4 de loopback
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)