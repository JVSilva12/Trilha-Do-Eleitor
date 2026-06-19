import os
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Em produção, defina a variável de ambiente DATABASE_URL com a connection string
# do Postgres (ex: postgresql://usuario:senha@host:5432/nomedobanco).
# Sem essa variável, o projeto continua usando SQLite localmente (./usuarios.db).
SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./usuarios.db")

# Alguns provedores (ex: Render) fornecem a URL com prefixo "postgres://", mas o
# SQLAlchemy moderno exige "postgresql://". Corrige automaticamente se for o caso.
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace(
        "postgres://", "postgresql://", 1
    )

connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)

@event.listens_for(engine, "connect")
def ativar_foreign_keys(dbapi_connection, connection_record):
    if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()