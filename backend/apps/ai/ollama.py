import json
import os

import requests
from django.conf import settings


class OllamaError(RuntimeError):
    """Ollama cannot answer the current request."""


def _base_url():
    return os.getenv("OLLAMA_BASE_URL", settings.OLLAMA_BASE_URL).rstrip("/")


def _model():
    return os.getenv("OLLAMA_MODEL", settings.OLLAMA_MODEL)


def generate(prompt, *, system=None, temperature=0.3):
    payload = {"model": _model(), "prompt": prompt, "stream": False, "options": {"temperature": temperature}}
    if system:
        payload["system"] = system
    try:
        response = requests.post(f"{_base_url()}/api/generate", json=payload, timeout=120)
        response.raise_for_status()
        answer = response.json().get("response", "").strip()
    except (requests.RequestException, ValueError) as exc:
        raise OllamaError("Ollama est indisponible ou le modèle configuré n'est pas installé.") from exc
    if not answer:
        raise OllamaError("Ollama a renvoyé une réponse vide.")
    return answer


def embed(text):
    model = os.getenv("OLLAMA_EMBED_MODEL", settings.OLLAMA_EMBED_MODEL)
    try:
        response = requests.post(f"{_base_url()}/api/embed", json={"model": model, "input": text}, timeout=60)
        if response.status_code == 404:
            response = requests.post(f"{_base_url()}/api/embeddings", json={"model": model, "prompt": text}, timeout=60)
        response.raise_for_status()
        data = response.json()
    except (requests.RequestException, ValueError) as exc:
        raise OllamaError("Impossible de créer les embeddings. Vérifiez Ollama et nomic-embed-text.") from exc
    vector = (data.get("embeddings") or [data.get("embedding")])[0]
    if not isinstance(vector, list):
        raise OllamaError("Ollama n'a pas renvoyé d'embedding valide.")
    return vector


def generate_json(prompt, *, system):
    raw = generate(prompt, system=system, temperature=0.2)
    try:
        return json.loads(raw[raw.index("{"):raw.rindex("}") + 1])
    except (ValueError, json.JSONDecodeError) as exc:
        raise OllamaError("Ollama n'a pas renvoyé le JSON demandé.") from exc
