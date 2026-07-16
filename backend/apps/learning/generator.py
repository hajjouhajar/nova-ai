from apps.ai.ollama import OllamaError, generate_json


SYSTEM_PROMPT = "Tu es un ingénieur pédagogique. Réponds exclusivement par un objet JSON valide, sans Markdown. Les cours doivent être précis et dans la langue demandée."


def _fallback(profile):
    domain = profile.domain.strip() or "the selected domain"
    language = profile.langue.strip() or "English"
    labels = {
        "French": ("Fondations de", "Pratique guidée de", "Projet appliqué en", "Cours d'introduction à"),
        "Spanish": ("Fundamentos de", "Práctica guiada de", "Proyecto aplicado en", "Curso de introducción a"),
        "German": ("Grundlagen von", "Angeleitete Praxis in", "Angewandtes Projekt in", "Einführungskurs zu"),
        "Arabic": ("أساسيات", "تطبيق عملي موجّه في", "مشروع تطبيقي في", "مقدمة في"),
        "English": ("Foundations of", "Guided practice in", "Applied project in", "Introduction to"),
    }.get(language, ("Foundations of", "Guided practice in", "Applied project in", "Introduction to"))
    titles = [f"{labels[0]} {domain}", f"{labels[1]} {domain}", f"{labels[2]} {domain}"]
    steps = [
        {"ordre": i + 1, "titre": title, "description": f"Module pour un niveau {profile.niveau}, enseigné en {language}.", "duree_estimee_heures": 4, "prerequis": [] if i == 0 else [titles[i - 1]], "status": "non_commencé"}
        for i, title in enumerate(titles)
    ]
    modules = [
        {"id": f"mod{i + 1}", "titre": title, "description": steps[i]["description"], "status": "à faire", "lessons": [{"id": f"m{i + 1}l1", "titre": title, "duree_min": 45, "status": "à faire", "content": f"{labels[3]} {domain}.", "exercises": []}]}
        for i, title in enumerate(titles)
    ]
    return {"steps": steps, "modules": modules}


def generate_roadmap(profile):
    prompt = f'''Crée un parcours d'apprentissage personnalisé.
Domaine: {profile.domain}
Niveau: {profile.niveau}
Disponibilité hebdomadaire: {profile.disponibilite}
Langue obligatoire: {profile.langue}
Objectif professionnel: {profile.career or "non précisé"}

Retourne exactement un objet ayant cette structure, avec 3 à 6 étapes et un module par étape:
{{"steps":[{{"ordre":1,"titre":"...","description":"...","duree_estimee_heures":4,"prerequis":[],"status":"non_commencé"}}],"modules":[{{"id":"mod1","titre":"...","description":"...","status":"à faire","lessons":[{{"id":"m1l1","titre":"...","duree_min":30,"status":"à faire","content":"cours détaillé dans la langue demandée","exercises":[{{"id":"m1l1e1","question":"...","type":"qcm","options":["..."],"reponse_attendue":"...","explication":"..."}}]}}]}}]}}'''
    try:
        data = generate_json(prompt, system=SYSTEM_PROMPT)
        if not isinstance(data.get("steps"), list) or not isinstance(data.get("modules"), list) or not data["modules"]:
            raise OllamaError("Structure de roadmap incomplète.")
        return data
    except OllamaError:
        return _fallback(profile)
