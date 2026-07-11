# Prompt Front-End — Nova AI

Ce prompt est destiné à être utilisé avec un outil de génération de code (Claude, v0.dev, Lovable, ou directement Claude Code) pour construire l'interface React + Tailwind CSS de Nova AI. Copie-le tel quel, ou adapte-le écran par écran.

---

## Prompt principal (vue d'ensemble du projet)

```
Crée le front-end d'une application web appelée "Nova AI", un assistant intelligent
de productivité personnelle destiné aux étudiants et professionnels.

CONTEXTE PRODUIT :
Nova AI aide l'utilisateur à organiser ses tâches et projets, discuter avec un
assistant IA (basé sur Llama 3 via Ollama), téléverser des documents (PDF/Word)
et obtenir des recommandations personnalisées basées sur ses habitudes.

STACK TECHNIQUE :
- React.js (composants fonctionnels + hooks)
- Tailwind CSS (uniquement les classes utilitaires de base, pas de plugin custom)
- Appels API REST vers un backend Django (endpoints au format /api/...)

DIRECTION ARTISTIQUE (professionnelle, pas "template SaaS générique") :
- Palette : fond neutre clair (blanc cassé / gris très clair #F7F8FA), une couleur
  d'accent unique et sobre (bleu profond #1E3A8A ou violet foncé #4C1D95 — choisir
  UNE seule couleur d'accent et s'y tenir), texte en gris anthracite (#1F2937),
  pas de dégradés criards, pas d'emoji dans l'interface
- Typographie : une police sans-serif professionnelle (Inter ou similaire),
  hiérarchie claire (titres en semi-bold, corps en regular), respiration
  généreuse entre les blocs (padding/margin cohérents, pas de contenu collé)
- Composants : coins légèrement arrondis (rounded-lg, pas rounded-full partout),
  ombres discrètes (shadow-sm), pas de bordures épaisses ni de couleurs vives
  juxtaposées
- Éviter absolument : l'esthétique "IA générique" (fond violet/bleu dégradé,
  icônes robot, étincelles ✨ partout) — Nova AI doit ressembler à un outil de
  productivité professionnel (type Notion, Linear, Asana), pas à un gadget IA

ÉCRANS À CRÉER :
1. Page de connexion / inscription (formulaire épuré, centré, sans distraction)
2. Dashboard principal :
   - Barre latérale de navigation (Dashboard, Projets, Tâches, Assistant IA,
     Documents, Historique, Paramètres)
   - Vue d'ensemble : statistiques de productivité (cartes simples), tâches du
     jour, dernières recommandations IA, accès rapide au chat
3. Page Projets : liste de projets sous forme de cartes, bouton "Nouveau projet"
4. Page Tâches : liste/tableau avec filtres (statut, priorité, échéance),
   possibilité d'ajouter/modifier/supprimer une tâche
5. Page Assistant IA : interface de chat (historique des messages à gauche ou
   en haut, zone de saisie en bas, réponses de l'IA clairement différenciées
   des messages utilisateur)
6. Page Documents : zone de téléversement (drag & drop), liste des documents
   avec statut de traitement
7. Page Historique : liste chronologique des conversations et recommandations
8. Page Paramètres / Profil : préférences utilisateur, objectifs déclarés

CONTRAINTES TECHNIQUES :
- Composants réutilisables (Button, Card, Input, Sidebar, ChatBubble, TaskItem)
- Responsive (mobile et desktop)
- États de chargement et messages d'erreur gérés proprement (pas d'écran blanc)
- Pas de données en dur : prévoir des props/état pour brancher les vraies
  données de l'API Django plus tard
- Un seul fichier par composant, code lisible et commenté en français
```

---

## Prompts complémentaires (à utiliser écran par écran si besoin)

### Page de connexion
```
Crée une page de connexion/inscription pour Nova AI. Design épuré et centré,
formulaire avec email + mot de passe, lien "Créer un compte" / "Déjà un compte ?",
validation des champs, message d'erreur clair en cas d'échec. Respecte la charte
graphique définie (fond clair, une seule couleur d'accent, typographie Inter).
```

### Interface de chat IA
```
Crée l'interface de chat de l'assistant IA de Nova AI. Les messages de l'utilisateur
sont alignés à droite avec un fond de la couleur d'accent ; les réponses de l'IA
sont alignées à gauche avec un fond neutre. Zone de saisie fixe en bas avec bouton
d'envoi. Ajoute un indicateur "Nova AI est en train d'écrire..." pendant le chargement.
Prévoir un état vide (aucune conversation) avec un message d'accueil sobre.
```

### Dashboard
```
Crée le dashboard principal de Nova AI. En haut : 3-4 cartes de statistiques
(tâches complétées, projets actifs, taux de progression, prochaine échéance).
En dessous : deux colonnes — à gauche la liste des tâches du jour, à droite les
recommandations générées par l'IA. Design sobre, pas de graphiques inutiles.
```

---

### Page Documents — Action "Analyser" (fonctionnalité RAG)
```
Sur la page Documents de Nova AI, ajoute une action "Analyser" (icône bulle de
chat) sur chaque ligne du tableau des fichiers, à côté des icônes existantes
(œil, poubelle). Comportement :

- L'icône "Analyser" n'est cliquable QUE si le statut du document est "traité"
  (grisée/désactivée si le statut est "en traitement...")
- Au clic, l'utilisateur est redirigé vers la page Assistant IA, avec ce
  document automatiquement sélectionné comme contexte de la conversation
- Un badge/chip visible en haut de la fenêtre de chat indique clairement :
  "📄 Discussion à propos de : [nom du document]" avec une petite croix pour
  quitter ce contexte et revenir à une conversation générale

Ajoute aussi, sur la page Assistant IA elle-même, un sélecteur déroulant
"Discuter à propos de :" en haut de la fenêtre de chat, listant uniquement
les documents dont le statut est "traité" (option "Aucun document" par défaut
pour une conversation générale). Cela permet à l'utilisateur de choisir un
document sans repasser par la page Documents.

Respecte la même charte graphique que le reste de l'application (sobre,
une seule couleur d'accent, pas d'icônes flashy).
```

---

### Page Onboarding — Entretien guidé (profil intelligent)
```
Crée l'écran d'onboarding de Nova AI, affiché une seule fois juste après
l'inscription, avant l'accès au dashboard.

OBJECTIF FONCTIONNEL :
Collecter 4 informations pour construire le profil d'apprentissage de
l'utilisateur : son objectif, son niveau actuel, sa disponibilité hebdomadaire
et sa langue préférée. Ces données seront envoyées à l'API Django
(POST /api/learning-profile/) pour générer ensuite sa roadmap.

FORMAT : ASSISTANT CONVERSATIONNEL PAS-À-PAS (PAS un formulaire classique
avec tous les champs affichés en même temps)
- Une seule question affichée à la fois, au centre de l'écran, avec une
  barre de progression discrète en haut (ex. "Étape 2 sur 4")
- Chaque question a un design différent adapté à sa nature :
  1. "Quel est ton objectif ?" → champ texte libre avec placeholder
     (ex. "Devenir développeur Backend Django", "Préparer un examen de SQL")
  2. "Quel est ton niveau actuel ?" → 3-4 cartes cliquables
     (Débutant / Intermédiaire / Avancé / Expert), une seule sélectionnable
  3. "Combien d'heures peux-tu consacrer par semaine ?" → slider ou boutons
     de plages (ex. "1-3h", "4-7h", "8-15h", "15h+")
  4. "Quelle langue préfères-tu ?" → sélecteur simple (Français / Arabe /
     Anglais), avec icônes drapeau discrètes
- Bouton "Suivant" désactivé tant que la question actuelle n'a pas de réponse
- Bouton "Précédent" discret pour revenir en arrière et corriger une réponse
- Dernière étape : écran de confirmation "Merci [Prénom], on construit ton
  parcours personnalisé..." avec un indicateur de chargement, avant la
  redirection automatique vers la page Roadmap une fois la génération
  terminée côté backend (POST /api/roadmap/generate/)

DESIGN :
- Respecte la charte graphique définie (fond clair, une seule couleur
  d'accent, typographie Inter, coins arrondis discrets)
- Écran centré, sans barre latérale visible (l'utilisateur n'a pas encore
  accès au reste de l'application tant que l'onboarding n'est pas terminé)
- Transition douce entre chaque question (pas de rechargement brutal de page)
- Pas de possibilité de "passer" l'onboarding — il est obligatoire une fois,
  mais chaque réponse reste modifiable plus tard depuis la page Paramètres
```

### Page Roadmap — Parcours personnalisé généré
```
Crée la page "Roadmap" de Nova AI, accessible depuis la barre latérale
(nouvel élément de navigation à ajouter : "Roadmap", entre "Dashboard" et
"Projets", avec une icône de type chemin/jalons).

OBJECTIF FONCTIONNEL :
Afficher le parcours généré automatiquement par l'IA à partir du profil de
l'utilisateur (liste d'étapes ordonnées, avec durée estimée), et permettre
de le modifier manuellement.

STRUCTURE DE L'ÉCRAN :
1. En-tête : titre de l'objectif déclaré par l'utilisateur (ex. "Ton parcours
   vers : Développeur Backend Django"), durée totale estimée en semaines,
   et un bouton discret "Régénérer le parcours" (avec confirmation avant
   action, car ça écrase la roadmap existante)
2. Corps : une **timeline verticale** (pas un simple tableau) représentant
   les étapes dans l'ordre :
   - Chaque étape est une carte avec : numéro d'ordre, titre, description
     courte, durée estimée, statut (à venir / en cours / terminée)
   - L'étape "en cours" est visuellement mise en avant (bordure ou fond
     légèrement différent avec la couleur d'accent)
   - Les étapes "terminées" ont une icône de validation (check) discrète
   - Une ligne verticale relie les étapes pour créer l'effet de progression
     (comme un chemin), sans être trop chargée visuellement
3. Actions par étape :
   - Bouton "Voir les exercices" (redirige vers les exercices liés à cette
     étape une fois qu'elle est atteinte)
   - Icône crayon pour modifier manuellement le titre/la durée d'une étape
   - Icône poignée (drag handle) pour réordonner les étapes manuellement
     par glisser-déposer
   - Bouton "+" discret entre deux étapes pour en insérer une nouvelle
     manuellement
4. Barre de progression globale en haut de la timeline (ex. "3/8 étapes
   terminées — 37%")

ÉTATS À GÉRER :
- État de chargement pendant la génération initiale par l'IA (spinner +
  texte "Nova AI construit ton parcours...")
- État d'erreur si la génération échoue (bouton "Réessayer")

DESIGN :
- Respecte la charte graphique définie (fond clair, une seule couleur
  d'accent, typographie Inter, ombres discrètes)
- Pas de dégradés ni d'icônes "IA générique" — la timeline doit ressembler
  à un outil de gestion de projet professionnel (type Linear/Notion), pas à
  un gadget ludique
```

---

## Conseils d'utilisation

- Génère d'abord l'écran principal (dashboard) pour valider la direction
  artistique avant de dupliquer le style sur les autres pages.
- Si l'outil utilisé propose des bibliothèques de composants (shadcn/ui, etc.),
  précise-le dans le prompt pour rester cohérent.
- Garde toujours la même palette et la même police d'un écran à l'autre — copie
  le bloc "DIRECTION ARTISTIQUE" dans chaque prompt complémentaire si tu génères
  les pages séparément.