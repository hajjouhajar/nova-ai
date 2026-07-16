from pypdf import PdfReader
import docx

from apps.ai.ollama import embed


def extraire_texte(fichier, type_fichier: str) -> str:
    if type_fichier == "pdf":
        reader = PdfReader(fichier)
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    if type_fichier == "docx":
        document = docx.Document(fichier)
        return "\n".join(paragraph.text for paragraph in document.paragraphs)
    return fichier.read().decode("utf-8", errors="ignore")


def decouper_en_chunks(texte: str, taille_mots: int = 300, chevauchement: int = 50) -> list[str]:
    mots = texte.split()
    return [" ".join(mots[index:index + taille_mots]) for index in range(0, len(mots), taille_mots - chevauchement) if mots[index:index + taille_mots]]


def generer_embedding(texte: str) -> list[float]:
    return embed(texte)
