# Cahier des Charges — Nova AI

**Nom du projet :** Nova AI – Intelligent Productivity Assistant
**Version :** 2.0
**Date :** Juillet 2026
**Type :** Projet académique / professionnel — durée 2 mois
**Équipe :** 4 personnes

---

## 1. Présentation du projet

### 1.1 Contexte
Nova AI est un assistant intelligent destiné à aider les étudiants et les professionnels à organiser leur travail, gérer leurs tâches et obtenir des réponses intelligentes basées sur leurs propres documents et informations. Le projet combine intelligence artificielle, automatisation et une application web moderne.

### 1.2 Positionnement produit
Contrairement à un assistant conversationnel généraliste (type ChatGPT), Nova AI se positionne comme un **compagnon d'accompagnement personnalisé dans la durée**. Il ne se contente pas de répondre aux questions ponctuelles : il apprend progressivement les habitudes, les objectifs et les préférences de l'utilisateur pour :
- l'aider à organiser ses tâches et son temps,
- suggérer des actions pertinentes selon son contexte,
- suivre l'évolution de ses progrès dans le temps,
- répondre à des questions sur ses propres documents (PDF, Word).

### 1.3 Différenciation par rapport aux solutions existantes

| Critère | Chatbot généraliste (ex. ChatGPT) | Nova AI |
|---|---|---|
| Mémoire des préférences | Limitée à la session ou générique | Construite et affinée dans la durée |
| Rôle | Répond à la demande | Accompagne, suggère, relance |
| Suivi de progrès | Absent | Intégré (objectifs, tâches, habitudes) |
| Connaissance des documents personnels | Non | Oui (upload + questions sur le contenu) |
| Automatisation | Absente | Intégrée (rappels, rapports, notifications) |
| Personnalisation | Faible | Centrale au produit |

### 1.4 Pourquoi ce projet a de la valeur académique et professionnelle
Ce projet démontre la maîtrise de plusieurs compétences recherchées :
- développement Full Stack (React + Django) ;
- modélisation et gestion d'une base de données relationnelle (PostgreSQL) ;
- automatisation de workflows (n8n) ;
- intégration d'un LLM local (Llama 3 / Mistral via Ollama) ;
- et, en option, une architecture de recherche documentaire (RAG), technologie très demandée actuellement en entreprise.

---

## 2. Stack technique

| Couche | Technologie | Rôle |
|---|---|---|
| Frontend | React.js + Tailwind CSS | Interface utilisateur, dashboard, chat |
| Backend | Django + Django REST Framework | API REST, logique métier, authentification |
| Base de données | **PostgreSQL** | Stockage structuré de toutes les données de l'application |
| IA | Ollama (Llama 3 ou Mistral) | Moteur conversationnel local, résumé, génération de texte |
| Automatisation | n8n | Emails, rappels, rapports, notifications |

---

## 3. Où et comment PostgreSQL est utilisé

PostgreSQL est **la base de données centrale** de tout le projet — Django s'y connecte via son ORM (Object-Relational Mapping), donc aucune requête SQL brute n'est nécessaire dans la majorité des cas.

### 3.1 Rôle de PostgreSQL dans l'architecture
- Django (backend) est configuré pour utiliser PostgreSQL comme moteur de base de données (au lieu du SQLite par défaut, non adapté à la production).
- Chaque modèle Django (`models.py`) correspond à une table PostgreSQL, créée automatiquement via les migrations Django (`makemigrations` / `migrate`).
- Toutes les données persistantes de l'application (utilisateurs, tâches, projets, documents, conversations) sont stockées dans PostgreSQL — rien n'est stocké côté frontend.

### 3.2 Ce que PostgreSQL stocke concrètement
- Les comptes utilisateurs et leurs profils (préférences, objectifs déclarés)
- Les projets et tâches créés par chaque utilisateur (avec statut, priorité, échéance)
- Les métadonnées des documents téléversés (nom, type, chemin de stockage, date)
- L'historique des conversations avec l'assistant IA
- Les notifications générées (rappels, rapports hebdomadaires)
- Les recommandations générées par l'IA (pour analyse et amélioration continue)

### 3.3 Extension recommandée : pgvector (si RAG implémenté)
Si l'équipe implémente la fonctionnalité de recherche dans les documents (RAG — Retrieval-Augmented Generation), PostgreSQL peut aussi stocker les **embeddings vectoriels** des documents via l'extension `pgvector`. Cela évite d'ajouter une base de données vectorielle séparée (comme Pinecone ou Chroma) et garde toute la donnée dans un seul système, ce qui simplifie l'architecture pour un projet de 2 mois.

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE document_chunks (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id),
    content TEXT,
    embedding VECTOR(384)  -- dimension selon le modèle d'embedding utilisé
);
```

### 3.4 Configuration Django → PostgreSQL (exemple)
```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'nova_ai_db',
        'USER': 'nova_admin',
        'PASSWORD': 'à définir en variable d'environnement',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```
⚠️ Le mot de passe et les identifiants doivent être stockés dans un fichier `.env` (jamais en dur dans le code) et exclus du dépôt Git via `.gitignore`.

---

## 4. Modèle de données (schéma PostgreSQL)

| Table | Champs principaux | Relations |
|---|---|---|
| **Users** | id, email, mot_de_passe (hashé), date_creation | 1—1 avec Profiles |
| **Profiles** | id, user_id, objectifs, préférences, habitudes_apprises (JSON) | appartient à Users |
| **Projects** | id, user_id, nom, description, date_creation | 1—N avec Tasks |
| **Tasks** | id, project_id, titre, priorité, statut, date_limite | appartient à Projects |
| **Documents** | id, user_id, nom_fichier, type, chemin_stockage, date_upload | 1—N avec DocumentChunks |
| **DocumentChunks** (si RAG) | id, document_id, contenu, embedding (vector) | appartient à Documents |
| **ChatHistory** | id, user_id, message, réponse, date | appartient à Users |
| **Notifications** | id, user_id, type, contenu, statut_lu, date | appartient à Users |

---

## 5. Fonctionnalités

### 5.1 Authentification
- Inscription
- Connexion / Déconnexion
- Gestion du profil utilisateur (objectifs, préférences)

### 5.2 Dashboard
Après connexion, l'utilisateur voit :
- statistiques de productivité
- tâches en cours
- projets actifs
- recommandations générées par l'IA
- dernières conversations avec l'assistant

### 5.3 Gestion des tâches
- Ajouter / Modifier / Supprimer
- Priorité, date limite, statut

### 5.4 Gestion des projets
Chaque utilisateur peut créer plusieurs projets (ex. Université, Stage, Personnel), chacun regroupant ses propres tâches.

### 5.5 Assistant IA (via Ollama / Llama 3)
L'utilisateur peut demander à Nova AI de :
- expliquer un concept
- générer un email
- résumer un PDF
- corriger un texte
- traduire
- proposer un planning
- répondre à des questions générales

### 5.6 Téléversement de documents
- Formats acceptés : PDF, Word, TXT
- Nova AI peut répondre à des questions sur le contenu des documents (fonctionnalité RAG en option)
- Exemple : *« Résume ce document »* ou *« Que dit ce PDF sur Django ? »*

### 5.7 Recommandations intelligentes
Selon les tâches, projets et préférences de l'utilisateur, Nova AI propose :
- quelles tâches commencer en priorité
- un planning conseillé
- des conseils d'organisation

### 5.8 Automatisation avec n8n
- Rappel des tâches par email
- Notification avant une échéance
- Rapport hebdomadaire de productivité
- Sauvegarde automatique
- Création automatique d'événements

### 5.9 Historique
- Historique des conversations
- Historique des recommandations

### 5.10 Recherche
Recherche transversale dans : projets, tâches, documents

---

## 6. Fonctionnalités optionnelles (si le temps le permet)
- Recherche sémantique dans les PDF (RAG complet avec pgvector)
- Reconnaissance vocale (entrée)
- Synthèse vocale (lecture des réponses)
- Tableau de bord avec graphiques de productivité (ex. Chart.js / Recharts)
- Calendrier intégré

---

## 7. Architecture technique

```
                    ┌─────────────┐
                    │   React.js   │  (Frontend + Tailwind CSS)
                    └──────┬──────┘
                           │ API REST (JSON)
                    ┌──────▼──────┐
                    │   Django    │
                    │   + DRF     │
                    └──────┬──────┘
             ┌─────────────┼──────────────┐
             ▼             ▼              ▼
      ┌─────────────┐ ┌─────────┐  ┌───────────┐
      │ PostgreSQL  │ │ Ollama  │  │    n8n    │
      │ (données +  │ │(Llama 3 │  │(emails,   │
      │  vecteurs)  │ │/Mistral)│  │notif, auto)│
      └─────────────┘ └─────────┘  └───────────┘
```

---

## 8. Exigences non fonctionnelles

### 8.1 Sécurité et confidentialité
- Mots de passe hashés (jamais stockés en clair)
- Variables sensibles (clés, mots de passe DB) dans `.env`, hors du dépôt Git
- Chiffrement des communications (HTTPS/TLS en production)
- Accès aux documents restreint au propriétaire uniquement

### 8.2 Performance
- Temps de réponse cible : < 3 secondes pour une requête standard au LLM
- Le modèle Llama 3/Mistral tournant localement via Ollama : prévoir un serveur avec GPU si possible, sinon un modèle plus léger (ex. Mistral 7B quantisé)

### 8.3 Scalabilité
- Séparation claire frontend / backend / IA / automatisation (chaque brique peut évoluer indépendamment)

---

## 9. Répartition de l'équipe (4 personnes)

| Étudiant | Responsabilités |
|---|---|
| **Étudiant 1** | Frontend React — Authentification, Dashboard, Interface |
| **Étudiant 2** | Backend Django — API REST, Authentification, Base de données PostgreSQL |
| **Étudiant 3** | IA — Intégration d'Ollama, Chat, Résumé de documents |
| **Étudiant 4** | Automatisation — n8n, Emails, Notifications, Rappels |

---

## 10. Planning indicatif (2 mois / 8 semaines)

| Semaine | Étape |
|---|---|
| 1 | Cadrage, modélisation de la base de données, setup des environnements (React, Django, PostgreSQL) |
| 2 | Authentification (frontend + backend) et connexion PostgreSQL |
| 3 | Dashboard + gestion des tâches et projets |
| 4 | Intégration Ollama (chat basique) |
| 5 | Téléversement de documents + résumé |
| 6 | Automatisation n8n (rappels, notifications) |
| 7 | Recommandations intelligentes + historique + recherche |
| 8 | Tests, corrections, fonctionnalités optionnelles (RAG, vocal), préparation de la soutenance |

---

## 11. Livrables attendus
1. Cahier des charges (ce document)
2. Schéma de base de données PostgreSQL (diagramme entité-relation)
3. Maquettes de l'interface (React + Tailwind)
4. Code source (frontend, backend, intégration IA, automatisation)
5. Documentation technique (installation, configuration, API)
6. Support de soutenance

---

## 12. Points ouverts à valider
- [ ] Modèle Llama 3 ou Mistral — lequel selon les ressources matérielles disponibles ?
- [ ] Implémentation du RAG complet ou report en fonctionnalité optionnelle ?
- [ ] Hébergement du projet (local pour la démo, ou cloud — ex. Render/Railway pour Django, Vercel pour React) ?
- [ ] Formats de notification n8n (email uniquement, ou aussi SMS/push) ?

---

*Document évolutif — à ajuster au fil de l'avancement du projet.*