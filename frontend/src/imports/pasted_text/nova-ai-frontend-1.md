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
   - Barre latérale de navigation (Dashboard, Roadmap, Courses, Projets,
     Tâches, Assistant IA, Historique, Paramètres) — PAS de "Documents" ni
     "Exercices" comme éléments séparés du menu (voir plus bas pourquoi)
   - Vue d'ensemble : statistiques de productivité (cartes simples), tâches du
     jour, dernières recommandations IA, accès rapide au chat
3. Page Projets : liste de projets sous forme de cartes, bouton "Nouveau projet"
   (voir spécification détaillée plus bas — création guidée + tâches)
4. Page Tâches : liste/tableau global avec filtres (statut, priorité, échéance,
   projet), possibilité d'ajouter/modifier/supprimer une tâche
5. Page Assistant IA : interface de chat, intégrant maintenant aussi
   l'upload de documents directement dans la conversation (voir plus bas)
6. Page Historique : liste chronologique des conversations et recommandations
7. Page Paramètres / Profil : préférences utilisateur, objectifs déclarés

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

### Page Tâches — Vue Kanban façon Jira/Trello
```
Crée (ou remplace la vue liste/tableau existante par) une vue Kanban pour la
page Tâches de Nova AI, dans l'esprit Jira/Trello, mais avec la charte
graphique sobre de l'application (pas les couleurs vives type Trello).

STRUCTURE : 3 colonnes fixes côte à côte
- "To Do" (à faire)
- "In Progress" (en cours)
- "Completed" (terminé)

En-tête de chaque colonne : un petit point coloré + le nom de la colonne +
le nombre de tâches entre parenthèses (ex. "● To Do  2").

CHAQUE TÂCHE EST UNE CARTE contenant :
- Le titre de la tâche (gras, une ou deux lignes max)
- Une ligne de métadonnées en dessous : un tag de catégorie (ex. "Learning",
  "Project", "Reading", "Code", "Exercises" — couleur pastel discrète propre
  à chaque catégorie) suivi d'un point puis du niveau de priorité (low /
  medium / high, avec un code couleur sobre : vert/orange/rouge en version
  pastel, pas criarde)
- La date d'échéance en petit texte gris, en bas de la carte (ex. "Jul 12")
- Les cartes ont un fond blanc, une ombre très légère, coins arrondis,
  et sont légèrement espacées verticalement dans leur colonne

INTERACTIONS :
- Glisser-déposer (drag & drop) d'une carte entre les colonnes pour changer
  son statut (ex. glisser une carte de "To Do" vers "In Progress")
- Clic sur une carte → ouvre un panneau/modal de détail avec : titre complet,
  description, projet associé (si la tâche vient d'un projet), priorité
  modifiable, échéance modifiable, bouton "Marquer terminée" qui déplace
  automatiquement la carte vers la colonne "Completed"
- Bouton "+" discret en haut de chaque colonne pour ajouter une tâche
  directement dans ce statut
- Filtre en haut de la page : par projet, par priorité, par tag — sous forme
  de petits boutons/chips cliquables, pas un formulaire de filtre lourd

DESIGN :
- Respecte la charte graphique définie (fond clair, une seule couleur
  d'accent, typographie Inter) — s'inspirer de la STRUCTURE de Jira/Trello
  (colonnes, cartes, drag & drop) mais garder la sobriété visuelle de Nova AI,
  pas les couleurs saturées typiques de ces outils
- Responsive : sur mobile, les colonnes deviennent des onglets/tabs
  horizontaux plutôt que d'être affichées côte à côte
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

### Assistant IA — Upload de documents intégré (remplace la page Documents séparée)
```
IMPORTANT : il n'y a plus de page "Documents" séparée dans la navigation.
L'upload de documents se fait maintenant DIRECTEMENT depuis la fenêtre de
chat de l'Assistant IA, pour que l'utilisateur puisse envoyer un fichier et
poser une question dessus dans le même geste, sans changer de page.

MODIFICATIONS DE L'INTERFACE DE CHAT :
- Ajoute une icône trombone/pièce-jointe à gauche de la zone de saisie du
  chat, à côté du champ texte
- Au clic (ou par glisser-déposer directement dans la fenêtre de chat),
  ouverture d'un sélecteur de fichier (PDF, Word, TXT — jusqu'à 50 Mo)
- Pendant l'upload et le traitement (découpage + embeddings), affiche une
  bulle spéciale dans le fil de conversation : une carte compacte avec
  l'icône du type de fichier, le nom du fichier, une barre de progression,
  puis le statut "Traité ✓" une fois terminé
- Une fois traité, le document reste "épinglé" en haut de la fenêtre de chat
  sous forme de petit badge/chip (ex. "📎 Memoire_M2.pdf") tant que la
  conversation porte dessus ; une croix permet de le retirer du contexte
- L'utilisateur peut envoyer plusieurs documents dans une même conversation :
  affiche-les comme plusieurs badges empilés horizontalement
- Si l'utilisateur pose une question sans document épinglé, le chat reste
  une conversation générale classique (pas de changement de comportement)

Respecte la charte graphique définie (sobre, une seule couleur d'accent,
pas d'icônes flashy).
```

---

### Page Onboarding — Entretien guidé (profil intelligent, 5 étapes)
```
Crée l'écran d'onboarding de Nova AI, affiché une seule fois juste après
l'inscription, avant l'accès au dashboard.

OBJECTIF FONCTIONNEL :
Collecter 5 informations pour construire le profil d'apprentissage de
l'utilisateur. Ces données seront envoyées à l'API Django
(POST /api/learning-profile/) pour générer ensuite sa roadmap.

FORMAT : ASSISTANT CONVERSATIONNEL PAS-À-PAS (une carte de dialogue centrée,
PAS un formulaire classique avec tous les champs affichés en même temps)
- En haut : logo Nova AI (icône ronde) + titre "Let's personalize your
  experience", avec en dessous le texte "Step X of 5"
- Une barre de progression segmentée en 5 tronçons sous le titre : les
  tronçons déjà passés se colorent (dégradé vert → violet au fur et à
  mesure), les tronçons à venir restent gris clair
- Une carte blanche centrée contenant :
  - Un petit avatar/icône Nova AI + le texte "Nova is asking..." en petit,
    couleur d'accent
  - La question en gras, taille plus grande
  - La liste des choix, sous forme de boutons pleine largeur empilés
    verticalement, coins arrondis, bordure fine grise ; l'option survolée/
    sélectionnée passe en fond légèrement teinté de la couleur d'accent
    avec une coche/rond violet à gauche
  - Boutons "Back" (discret, texte seul) et "Continue" (plein, couleur
    d'accent, dégradé subtil autorisé ici uniquement pour ce bouton
    d'action principal) en bas de la carte

LES 5 ÉTAPES EXACTES (contenu à respecter précisément) :

Étape 1/5 — "What do you want to learn?"
Choix (sélection unique) :
- Web Development
- Data Science & AI
- Mobile Development
- DevOps & Cloud
- UI/UX Design

Étape 2/5 — "What is your current level?"
Choix (sélection unique) :
- Complete Beginner
- Some Experience
- Intermediate
- Advanced

Étape 3/5 — "How many hours per week can you dedicate?"
Choix (sélection unique) :
- 1-3 hours
- 4-7 hours
- 8-15 hours
- 15+ hours

Étape 4/5 — "What is your preferred language?"
Choix (sélection unique) :
- English
- French
- Spanish
- Arabic
- German

Étape 5/5 — "What is your career objective?"
Choix (sélection unique) :
- Get a job as developer
- Freelance projects
- Build my own startup
- Level up at current job
- Personal interest

Après l'étape 5, au clic sur "Continue" (qui devient "Finish" ou reste
"Continue") : écran de confirmation "Merci [Prénom], on construit ton
parcours personnalisé..." avec indicateur de chargement, puis redirection
automatique vers la page Roadmap une fois la génération terminée côté
backend (POST /api/roadmap/generate/).

DESIGN :
- Fond de la page en dégradé très doux bleu clair / lavande (comme les
  captures de référence), la carte de dialogue elle-même reste blanche/nette
- Une seule couleur d'accent violet/indigo pour les boutons actifs et la
  progression (cohérent avec le reste de la charte graphique de l'app)
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
5. **Bouton "Continuer" (action principale, mis en avant en haut de la page)**
   - Ce bouton ramène l'utilisateur exactement là où il s'est arrêté,
     sans qu'il ait à chercher lui-même l'étape en cours dans la timeline
   - Comportement au clic :
     a) Le système identifie l'étape "en cours" (ou la première étape "à
        venir" si aucune n'est en cours)
     b) Si cette étape contient des cours dont le score aux exercices est
        insuffisant (ex. score < 70%), l'utilisateur est redirigé en
        priorité vers CES cours précis à repasser/compléter, avec un message
        clair : "Reprenons [Nom du cours] — ton score précédent était de X%,
        renforçons ce point avant de continuer"
     c) Si tous les cours de l'étape en cours sont suffisamment maîtrisés,
        l'utilisateur est redirigé vers le cours suivant non commencé
   - Le bouton doit donc TOUJOURS mener à une action concrète et précise
     (jamais juste "va voir la page Courses toi-même")

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

### Page Roadmap — Bloc Certification (visible en bas de la timeline, après la dernière étape)
```
Ajoute, tout en bas de la timeline verticale de la page Roadmap (après la
dernière étape du parcours), une carte spéciale de type "palier final" —
visuellement distincte des cartes d'étapes classiques, pour bien marquer
qu'il s'agit de l'aboutissement du parcours.

COMPORTEMENT SELON L'ÉTAT D'AVANCEMENT (3 états possibles) :

État 1 — Modules non terminés (la majorité du temps)
- La carte est visible mais grisée/verrouillée (icône cadenas)
- Texte : "Examen final — verrouillé"
- Sous-texte : "Termine les X modules restants pour débloquer l'examen final
  et obtenir ton certificat" (X = nombre de modules non terminés, calculé
  dynamiquement)
- Non cliquable

État 2 — Tous les modules terminés, examen pas encore passé
- La carte se déverrouille visuellement (couleur d'accent, icône trophée
  ou diplôme au lieu du cadenas)
- Texte : "Tu as terminé tous les modules ! Passe l'examen final."
- Bouton "Passer l'examen final" → redirige vers l'écran d'examen de la
  page Courses (voir spécification Examen final)

État 3 — Examen réussi, certificat obtenu
- La carte affiche un visuel de certificat (icône médaille/ruban), avec le
  texte "Certificat obtenu 🎓" et la date d'obtention
- Deux boutons : "Voir mon certificat" (ouvre le certificat en grand,
  format lisible — voir contrainte ci-dessous) et "Télécharger le PDF"

CONTRAINTE IMPORTANTE SUR LA LISIBILITÉ DU CERTIFICAT :
Le certificat affiché (à l'écran ET dans le PDF téléchargé) doit être
PARFAITEMENT LISIBLE, pas une image compressée ou un texte flou. Respecter :
- Fond blanc ou crème uni, texte en noir/gris foncé à fort contraste
- Typographie claire et suffisamment grande (le nom de l'utilisateur et le
  titre de la formation doivent être lisibles même en aperçu miniature)
- Mise en page classique de certificat : logo Nova AI en haut, "Certificat
  de réussite" en grand titre, nom complet de l'utilisateur en évidence,
  intitulé du parcours suivi, liste des compétences validées, date
  d'obtention, numéro unique du certificat en petit texte en bas, QR code
  de vérification dans un coin (taille suffisante pour rester scannable,
  ni trop petit ni pixelisé)
- Le certificat ne doit contenir AUCUN élément décoratif qui nuit à la
  lisibilité (pas de filigrane trop présent, pas de texte superposé à des
  images, pas de couleur de fond qui réduit le contraste)

Respecte la charte graphique générale (couleur d'accent cohérente), mais le
certificat lui-même peut avoir un style légèrement plus formel/solennel que
le reste de l'application, car c'est un document destiné à être partagé ou
montré à un tiers (recruteur, université).

STRUCTURE EXACTE DE LA MODALE "Voir mon certificat" (au clic sur le bouton) :
- Modale centrée, fond légèrement assombri derrière (overlay), croix de
  fermeture en haut à droite
- Bandeau supérieur en dégradé doux (couleur d'accent, ex. violet clair vers
  blanc), avec au centre : une icône badge/médaille dans un carré arrondi,
  puis le titre du parcours obtenu en gras et grand (ex. "React Developer"),
  puis "Nova AI" en dessous en plus petit et plus clair
- Corps blanc de la modale, en dessous du bandeau :
  - "Issued on" (petit texte gris) + la date en gras juste en dessous
  - Une icône QR code cliquable à droite de la date (ouvre/affiche le QR en
    grand au clic, pour vérification)
  - "Skills Validated" (petit texte gris) suivi des compétences validées
    sous forme de tags/pills arrondis (fond très clair teinté de la couleur
    d'accent, texte de la couleur d'accent)
  - En bas : deux boutons côte à côte — "Download PDF" (bouton plein,
    dégradé couleur d'accent, icône de téléchargement) et "Share" (bouton
    contour, blanc)
- Le bouton "Download PDF" doit déclencher le téléchargement direct du
  fichier PDF généré par le backend (GET /api/certificates/{id}/download),
  PAS une simple capture d'écran de la modale — le PDF téléchargé doit
  reprendre la même mise en page lisible que celle définie plus haut

AJOUT AUTOMATIQUE À L'HISTORIQUE :
Dès qu'un certificat est généré (examen réussi), un événement doit
apparaître automatiquement dans la page Historique de l'utilisateur, au
même titre que les conversations et recommandations déjà prévues. Cette
entrée doit :
- Avoir une icône distincte (médaille/badge) pour se différencier visuellement
  des entrées de conversation dans la liste chronologique
- Afficher : "Certificat obtenu : [Nom du parcours]" + la date d'obtention
- Être cliquable, et rouvrir directement la modale du certificat (même
  composant que celui accessible depuis la Roadmap) au clic
```

### Page Courses — Modules → Cours → Exercices → Examen final
```
Crée la page "Courses" de Nova AI, accessible depuis la barre latérale
(nouvel élément de navigation, entre "Roadmap" et "Projets", icône type
livre/graduation cap sobre).

OBJECTIF FONCTIONNEL :
Afficher la structure d'apprentissage complète générée par l'IA à partir de
la roadmap : une liste de MODULES, chaque module contenant plusieurs COURS,
et chaque cours se terminant par des EXERCICES. Une fois TOUS les modules
terminés, un EXAMEN FINAL débloque le CERTIFICAT.

HIÉRARCHIE À RESPECTER (important, structure à 3 niveaux) :
Roadmap
 └─ Module (ex. "Les bases de Django")
     └─ Cours (ex. "Les Models", "Les Vues", "Les Templates")
         └─ Exercices (à la fin de CHAQUE cours)
Puis, après le dernier module : Examen final → Certificat

1. VUE LISTE DES MODULES (écran principal de la page Courses)
   - Chaque module est une carte affichant : titre, nombre de cours inclus,
     statut global (verrouillé / en cours / terminé), barre de progression
     du module (ex. "2/4 cours terminés")
   - Un module est "verrouillé" (grisé, non cliquable) tant que le module
     précédent n'est pas terminé — respecter l'ordre de la roadmap
   - Le premier module non terminé est visuellement mis en avant (badge
     "En cours")

2. VUE D'UN MODULE (au clic sur une carte de module)
   - Liste des cours de ce module, dans l'ordre, sous forme de liste
     verticale simple (pas besoin de timeline ici, plus proche d'une liste
     de leçons style plateforme e-learning sobre)
   - Chaque ligne de cours affiche : titre, durée estimée, statut (à faire /
     en cours / terminé avec score obtenu aux exercices)
   - Un cours est cliquable uniquement si le précédent est terminé

3. VUE D'UN COURS (au clic sur un cours)
   - Contenu théorique du cours (texte généré par l'IA, structuré avec des
     sous-titres, exemples, blocs de code si pertinent)
   - Bouton "Passer aux exercices" en bas de page, visible seulement après
     avoir fait défiler le contenu (ou après un bouton "J'ai terminé la
     lecture")

4. VUE EXERCICES D'UN COURS
   - Une question à la fois (comme l'onboarding), QCM ou question ouverte
   - Feedback affiché immédiatement après chaque réponse (correct/incorrect
     + explication)
   - Écran de fin : score obtenu, bouton "Continuer" qui ramène soit au
     cours suivant, soit au module suivant si c'était le dernier cours

5. EXAMEN FINAL (débloqué uniquement quand TOUS les modules sont à 100%)
   - Écran d'introduction : "Tu as terminé tous les modules ! Passe l'examen
     final pour obtenir ton certificat.", nombre de questions, durée estimée,
     bouton "Commencer l'examen"
   - Interface d'examen : questions les unes après les autres, PAS de
     feedback immédiat par question (contrairement aux exercices de cours),
     un chronomètre visible en haut si pertinent
   - Écran de résultat final : score global, message de réussite/échec
     (seuil ex. 70% pour réussir), et si réussi → bouton "Voir mon
     certificat" qui redirige vers la page/modal du certificat généré

DESIGN :
- Respecte la charte graphique définie (fond clair, une seule couleur
  d'accent, typographie Inter, coins arrondis discrets)
- Style proche d'une plateforme e-learning professionnelle et sobre (type
  Coursera épuré), pas ludique/gamifié à l'excès
```

### Page Projets — Création guidée + redirection vers l'Assistant IA + gestion des tâches
```
Modifie la page Projets de Nova AI pour intégrer un flux de création plus
riche, connecté à l'Assistant IA.

1. CRÉATION D'UN NOUVEAU PROJET (au clic sur "Nouveau projet")
   Ouvre un formulaire (modal ou page dédiée) avec 3 champs :
   - Nom du projet (texte, obligatoire)
   - Description (zone de texte, obligatoire) — ce que le projet doit
     accomplir
   - Document de référence (optionnel) — upload PDF/Word/TXT, ex. un cahier
     des charges, une consigne d'université, un brief

   Bouton "Créer le projet" → au clic :
   - Le projet est créé (POST /api/projects/)
   - Si un document a été joint, il est uploadé et traité (comme pour le
     RAG dans l'Assistant IA)
   - L'utilisateur est automatiquement redirigé vers l'Assistant IA, avec
     ce projet (et son document éventuel) épinglé comme contexte — un badge
     "🗂 Projet : [Nom du projet]" apparaît en haut du chat, comme pour un
     document épinglé
   - Un premier message de Nova AI apparaît automatiquement dans le chat
     (pas besoin que l'utilisateur écrive en premier), du type : "J'ai bien
     noté ton projet [Nom]. D'après la description (et le document fourni),
     voici les grandes tâches que je te propose pour le réaliser, avec des
     échéances suggérées : [liste de tâches proposées]. Tu peux me demander
     de les ajuster, ou me poser des questions sur ce projet à tout moment."
   - L'utilisateur peut ensuite valider ces tâches proposées (bouton "Ajouter
     ces tâches à mon projet") ou continuer à discuter avec l'IA pour les
     affiner avant de les valider
   - Tant que ce projet est épinglé, l'utilisateur peut poser des questions
     spécifiques dessus (ex. "Comment structurer la partie backend ?"),
     l'IA répond en tenant compte du contexte du projet et de son document

2. VUE D'UN PROJET EXISTANT (au clic sur une carte de projet dans la liste)
   - En-tête : nom du projet, description, document de référence attaché
     (si présent, avec lien pour le consulter)
   - Liste des tâches liées à CE projet uniquement (pas toutes les tâches
     de l'utilisateur) : titre, échéance, priorité, statut
   - Chaque tâche a une case à cocher pour la marquer comme "Terminée"
     directement depuis cette vue, sans changer de page
   - Barre de progression du projet en haut (ex. "4/9 tâches terminées")
   - Bouton "Discuter de ce projet avec Nova AI" qui redirige vers le chat
     avec ce projet épinglé comme contexte (même comportement qu'à la
     création)
   - Bouton "Ajouter une tâche" pour en créer une manuellement sans passer
     par l'IA

DESIGN :
- Respecte la charte graphique définie (sobre, une seule couleur d'accent)
- Le badge de contexte (document OU projet épinglé dans le chat) doit avoir
  un style visuel cohérent entre les deux cas, pour que l'utilisateur
  comprenne intuitivement qu'il discute "à propos de quelque chose de précis"
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