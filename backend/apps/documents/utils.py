import requests
from pypdf import PdfReader
import docx

OLLAMA_EMBED_URL = "http://localhost:11434/api/embeddings"
EMBED_MODEL = "nomic-embed-text"


def extraire_texte(fichier, type_fichier: str) -> str:
    if type_fichier == "pdf":
        reader = PdfReader(fichier)
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    elif type_fichier == "docx":
        doc = docx.Document(fichier)
        return "\n".join(p.text for p in doc.paragraphs)
    else:
        return fichier.read().decode("utf-8", errors="ignore")


def decouper_en_chunks(texte: str, taille_mots: int = 300, chevauchement: int = 50) -> list[str]:
    mots = texte.split()
    chunks = []
    debut = 0
    while debut < len(mots):
        fin = debut + taille_mots
        chunk = " ".join(mots[debut:fin])
        if chunk.strip():
            chunks.append(chunk)
        debut += taille_mots - chevauchement
    return chunks


def generer_embedding(texte: str) -> list[float]:
    r = requests.post(OLLAMA_EMBED_URL, json={"model": EMBED_MODEL, "prompt": texte}, timeout=30)
    r.raise_for_status()
    return r.json()["embedding"]