'''Templates de roadmap statiques, sélectionnés selon l'objectif de l'utilisateur.
Sera remplacé par une génération Ollama à l'étape 5.'''

ROADMAP_TEMPLATES = {
    "data_science": {
        "keywords": ["data", "machine learning", "ia", "ai", "science"],
        "steps": [
            {"ordre": 1, "titre": "Fondamentaux du Machine Learning",
             "description": "Apprentissage supervisé, non supervisé, métriques.",
             "duree_estimee_heures": 4, "prerequis": [], "status": "non_commencé"},
            {"ordre": 2, "titre": "Python pour la data science",
             "description": "pandas, numpy, matplotlib, seaborn.",
             "duree_estimee_heures": 6,
             "prerequis": ["Fondamentaux du Machine Learning"], "status": "non_commencé"},
            {"ordre": 3, "titre": "Modèles de classification",
             "description": "Régression logistique, arbres, Random Forest, SVM.",
             "duree_estimee_heures": 5,
             "prerequis": ["Python pour la data science"], "status": "non_commencé"},
        ],
        "modules": [
            {"id": "mod1", "titre": "Fondamentaux du Machine Learning",
             "description": "Les bases théoriques et pratiques", "status": "en cours",
             "lessons": [
                {"id": "m1l1", "titre": "Types d'apprentissage", "duree_min": 20,
                 "status": "à faire", "content": "", "exercises": []},
             ]},
        ],
    },
    "web_dev": {
        "keywords": ["web", "frontend", "backend", "développement web"],
        "steps": [
            {"ordre": 1, "titre": "Bases du HTML/CSS",
             "description": "Structurer et styliser une page web.",
             "duree_estimee_heures": 3, "prerequis": [], "status": "non_commencé"},
            {"ordre": 2, "titre": "JavaScript moderne",
             "description": "ES6+, DOM, fetch API.",
             "duree_estimee_heures": 6,
             "prerequis": ["Bases du HTML/CSS"], "status": "non_commencé"},
        ],
        "modules": [],
    },
    "default": {
        "keywords": [],
        "steps": [
            {"ordre": 1, "titre": "Introduction au domaine choisi",
             "description": "Poser les bases théoriques essentielles.",
             "duree_estimee_heures": 3, "prerequis": [], "status": "non_commencé"},
            {"ordre": 2, "titre": "Pratique guidée",
             "description": "Exercices d'application progressifs.",
             "duree_estimee_heures": 5,
             "prerequis": ["Introduction au domaine choisi"], "status": "non_commencé"},
        ],
        "modules": [],
    },
}


def select_template(objective: str) -> dict:
    '''Choisit un template selon des mots-clés trouvés dans l'objectif de l'utilisateur.'''
    objective_lower = objective.lower()
    for key, template in ROADMAP_TEMPLATES.items():
        if key == "default":
            continue
        if any(kw in objective_lower for kw in template["keywords"]):
            return template
    return ROADMAP_TEMPLATES["default"]
