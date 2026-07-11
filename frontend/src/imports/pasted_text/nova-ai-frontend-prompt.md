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

## Conseils d'utilisation
- Génère d'abord l'écran principal (dashboard) pour valider la direction
  artistique avant de dupliquer le style sur les autres pages.
- Si l'outil utilisé propose des bibliothèques de composants (shadcn/ui, etc.),
  précise-le dans le prompt pour rester cohérent.
- Garde toujours la même palette et la même police d'un écran à l'autre — copie
  le bloc "DIRECTION ARTISTIQUE" dans chaque prompt complémentaire si tu génères
  les pages séparément.