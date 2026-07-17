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


def is_available(timeout: int = 3) -> bool:
    """Return True if the Ollama server is reachable AND the configured model is installed."""
    try:
        resp = requests.get(f"{_base_url()}/api/tags", timeout=timeout)
        resp.raise_for_status()
        installed_models = [m.get("name", "") for m in resp.json().get("models", [])]
        configured = _model()
        # Accept exact match or match without tag (e.g. "tinyllama" matches "tinyllama:latest")
        return any(
            configured == m or configured.split(":")[0] == m.split(":")[0]
            for m in installed_models
        )
    except requests.RequestException:
        return False


def generate(prompt, *, system=None, temperature=0.3, _retry=2, timeout=300):
    payload = {
        "model": _model(),
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": temperature,
            "num_ctx": 4096,       # fenêtre de contexte suffisante pour les documents
            "num_predict": 1024,   # longueur max de la réponse
            "keep_alive": "10m",   # garde le modèle en mémoire 10 min entre les appels
        },
    }
    if system:
        payload["system"] = system

    for attempt in range(1, _retry + 1):
        try:
            # Timeout augmenté à 300s pour mistral sur documents longs
            response = requests.post(f"{_base_url()}/api/generate", json=payload, timeout=timeout)
            response.raise_for_status()
            answer = response.json().get("response", "").strip()
            if answer:
                return answer
            raise OllamaError("Ollama a renvoyé une réponse vide.")
        except requests.Timeout as exc:
            if attempt < _retry:
                import time
                time.sleep(3)
                continue
            raise OllamaError(
                "Le modèle a mis trop longtemps à répondre. "
                "Réessayez dans quelques secondes."
            ) from exc
        except (requests.RequestException, ValueError) as exc:
            if attempt < _retry:
                import time
                time.sleep(5)   # attend 5s que le modèle se recharge
                continue
            raise OllamaError("Ollama est indisponible ou le modèle configuré n'est pas installé.") from exc


def embed(text):
    model = os.getenv("OLLAMA_EMBED_MODEL", settings.OLLAMA_EMBED_MODEL)
    try:
        response = requests.post(
            f"{_base_url()}/api/embed",
            json={"model": model, "input": text},
            timeout=120,
        )
        if response.status_code == 404:
            response = requests.post(
                f"{_base_url()}/api/embeddings",
                json={"model": model, "prompt": text},
                timeout=120,
            )
        response.raise_for_status()
        data = response.json()
    except (requests.RequestException, ValueError) as exc:
        raise OllamaError("Impossible de créer les embeddings. Vérifiez Ollama et nomic-embed-text.") from exc
    vector = (data.get("embeddings") or [data.get("embedding")])[0]
    if not isinstance(vector, list):
        raise OllamaError("Ollama n'a pas renvoyé d'embedding valide.")
    return vector


def generate_json(prompt, *, system, timeout=300):
    raw = generate(prompt, system=system, temperature=0.2, timeout=timeout)
    try:
        return json.loads(raw[raw.index("{"):raw.rindex("}") + 1])
    except (ValueError, json.JSONDecodeError) as exc:
        raise OllamaError("Ollama n'a pas renvoyé le JSON demandé.") from exc
