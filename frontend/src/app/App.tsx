import React, { useState, useRef, useEffect } from "react";
import { login, register } from "./api/auth";
import { saveLearningProfile, generateRoadmap,  getRoadmap } from "./api/learning";
import { sendChatMessage } from "./api/chat";
import { uploadDocument, analyzeDocument } from "./api/documents";

import {
  LayoutDashboard, FolderOpen, CheckSquare, MessageSquare,
  Clock, Settings, Bell, Plus, Send, X, CheckCircle2, Circle,
  LogOut, Edit3, TrendingUp, BookOpen,
  ChevronRight, RotateCcw, AlertTriangle, Check, GripVertical,
  Map, GraduationCap, Paperclip, FileText, Lock,
  ChevronLeft, Award, ArrowRight, Play, Download, Trophy, QrCode, Share2,
} from "lucide-react";
import { getTasks, getProjects, createTask } from "./api/projects";
type Page = "dashboard" | "projects" | "tasks" | "chat" | "roadmap" | "courses" | "history" | "settings";
type TaskCategory = "Learning" | "Project" | "Reading" | "Code" | "Exercises" | "Other";

interface Task {
  id: number;
  title: string;
  description: string;
  project: string;
  projectId?: number;
  priority: "haute" | "moyenne" | "basse";
  status: "à faire" | "en cours" | "terminé";
  due: string;
  category: TaskCategory;
}

interface FileAttachment {
  id: number;
  name: string;
  type: string;
  size: string;
  progress: number;
  status: "uploading" | "processing" | "traité";
  documentId?: number;
}

interface ChatMessage {
  id: number;
  role: "user" | "assistant" | "file";
  text: string;
  time: string;
  file?: FileAttachment;
}

interface RoadmapStep {
  ordre: number;
  titre: string;
  description: string;
  duree_estimee_heures: number;
  prerequis: string[];
  status: "non_commencé" | "en_cours" | "terminé";
}

interface Exercise {
  id: string;
  question: string;
  type: "qcm" | "ouverte";
  options: string[];
  reponse_attendue: string;
  explication: string;
}

interface CourseLesson {
  id: string;
  titre: string;
  duree_min: number;
  status: "verrouillé" | "à faire" | "en cours" | "terminé";
  score?: number;
  content: string;
  exercises: Exercise[];
}

interface CourseModule {
  id: string;
  titre: string;
  description: string;
  status: "verrouillé" | "en cours" | "terminé";
  lessons: CourseLesson[];
}

interface LearningProfile {
  domain: string;
  niveau: string;
  disponibilite: string;
  langue: string;
  career: string;
}

interface Project {
  id: number;
  name: string;
  desc: string;
  taskCount: number;
  done: number;
  color: string;
  deadline: string;
}

interface PinnedProject {
  id: number;
  name: string;
  desc: string;
}

interface LearningPath {
  id: number;
  profile: LearningProfile;
  steps: RoadmapStep[];
  modules: CourseModule[];
  certificate?: { score: number; date: string };
}

interface CertHistoryItem {
  id: number;
  pathId: number;
  domain: string;
  date: string;
  score: number;
}

// ─── Static mock data ─────────────────────────────────────────────────────────

const CURRENT_USER = { name: "Sophie Martin", email: "sophie.martin@univ-paris.fr", role: "Étudiante M2", initials: "SM" };

const STATS = [
  { label: "Tâches complétées", value: "24", sub: "cette semaine",    delta: "+3 vs semaine passée" },
  { label: "Projets actifs",    value: "5",  sub: "en cours",         delta: "2 proches deadline"   },
  { label: "Progression",       value: "78%",sub: "objectifs du mois",delta: "+12% ce mois"         },
  { label: "Prochaine échéance",value: "10 juil.", sub: "Rapport de stage", delta: "dans 5 jours"  },
];

const INITIAL_TASKS: Task[] = [
  { id: 1, title: "Rédiger l'introduction du mémoire",   description: "Poser la problématique centrale et les objectifs du mémoire.", project: "Mémoire M2",      projectId: 1, priority: "haute",   status: "en cours", due: "2026-07-08", category: "Reading"   },
  { id: 2, title: "Préparer les slides de présentation", description: "Créer les diapositives pour la soutenance orale du mémoire.",  project: "Soutenance",       projectId: 4, priority: "haute",   status: "à faire",  due: "2026-07-10", category: "Project"   },
  { id: 3, title: "Relire et annoter le chapitre 3",     description: "Revue détaillée du chapitre sur les modèles de régression.",   project: "Mémoire M2",       projectId: 1, priority: "moyenne", status: "en cours", due: "2026-07-07", category: "Reading"   },
  { id: 4, title: "Envoyer le compte-rendu de réunion",  description: "Synthèse de la réunion hebdomadaire avec le responsable.",     project: "Stage DataVision", projectId: 2, priority: "basse",   status: "terminé",  due: "2026-07-05", category: "Other"     },
  { id: 5, title: "Mise à jour du README",               description: "Documenter les nouvelles fonctionnalités de l'interface.",     project: "Nova AI",          projectId: 3, priority: "moyenne", status: "à faire",  due: "2026-07-12", category: "Code"      },
  { id: 6, title: "Compléter la bibliographie annotée",  description: "Ajouter les références manquantes avec un résumé critique.",   project: "Mémoire M2",       projectId: 1, priority: "haute",   status: "à faire",  due: "2026-07-09", category: "Learning"  },
  { id: 7, title: "Exercices NumPy — broadcasting",      description: "Compléter les exercices pratiques sur le broadcasting.",       project: "Formation Python", projectId: 5, priority: "moyenne", status: "à faire",  due: "2026-07-14", category: "Exercises" },
];

const INITIAL_PROJECTS: Project[] = [
  { id: 1, name: "Mémoire M2",       desc: "Rédaction et soutenance du mémoire de fin d'études en IA appliquée", taskCount: 12, done: 7,  color: "#1E3A8A", deadline: "20 juil. 2026" },
  { id: 2, name: "Stage DataVision", desc: "Mission ML — intégration du pipeline de données et reporting",         taskCount: 8,  done: 5,  color: "#0F766E", deadline: "31 août 2026"  },
  { id: 3, name: "Nova AI",          desc: "Développement du frontend React de l'assistant de productivité",       taskCount: 15, done: 4,  color: "#6D28D9", deadline: "15 août 2026"  },
  { id: 4, name: "Soutenance",       desc: "Préparation des supports visuels et de la présentation orale",         taskCount: 6,  done: 1,  color: "#B45309", deadline: "10 juil. 2026" },
  { id: 5, name: "Formation Python", desc: "Cours avancé en ligne — pandas, scikit-learn, NLP, deep learning",    taskCount: 20, done: 14, color: "#0369A1", deadline: "1 sept. 2026"  },
];

const RECOMMENDATIONS = [
  { id: 1, text: "Votre deadline «Rapport de stage» est dans 5 jours. Bloquez 2h demain matin pour avancer la rédaction.", tag: "Priorité" },
  { id: 2, text: "3 tâches ouvertes sur Mémoire M2. Commencez par «Relire le chapitre 3» pour débloquer les suivantes.", tag: "Organisation" },
  { id: 3, text: "Vous êtes plus productif entre 9h et 11h d'après vos habitudes. Planifiez vos tâches difficiles sur ce créneau.", tag: "Habitudes" },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  { id: 1, role: "assistant", text: "Bonjour Sophie ! Je suis Nova AI, votre assistant de productivité personnelle. Je peux vous aider à organiser vos tâches, résumer vos documents, rédiger des textes ou répondre à vos questions. Par quoi commençons-nous ?", time: "09:12" },
];

const AI_REPLIES = [
  "D'après vos projets et habitudes actuelles, voici ma recommandation : privilégiez les tâches à forte priorité et deadline proche. Bloquez des créneaux de 90 minutes sans interruption, puis accordez-vous 15 minutes de pause. Souhaitez-vous que je génère un planning détaillé pour cette semaine ?",
  "Voici une structure que je vous propose pour ce document :\n\n1. Contexte et motivation — posez le problème en 2-3 phrases claires\n2. Problématique centrale — formulez votre question de recherche\n3. Objectifs — listez 3-4 points précis et vérifiables\n4. Plan du document — décrivez chaque partie en une phrase\n\nVoulez-vous que je vous aide à rédiger l'une de ces sections ?",
  "J'ai analysé votre charge de travail actuelle. Compte tenu de vos 5 tâches actives et de vos délais, je vous suggère de consacrer ce matin aux tâches prioritaires (9h-11h), puis l'après-midi aux tâches de priorité moyenne.",
  "En traitement du langage naturel, les modèles de type transformer ont profondément transformé le domaine depuis 2018. Pour votre mémoire, je vous recommande de citer Vaswani et al. (2017) «Attention Is All You Need» comme référence fondatrice. Souhaitez-vous d'autres références académiques ?",
  "Je ne dispose pas d'une information certaine sur ce point précis. Plutôt que de vous fournir une réponse approximative, je préfère vous orienter vers la documentation officielle ou un spécialiste du domaine.",
];

const MOCK_ROADMAP: RoadmapStep[] = [
  { ordre: 1, titre: "Fondamentaux du Machine Learning", description: "Comprendre les concepts de base : apprentissage supervisé, non supervisé, métriques d'évaluation et validation croisée.", duree_estimee_heures: 4, prerequis: [], status: "terminé" },
  { ordre: 2, titre: "Python pour la data science", description: "Maîtriser les bibliothèques essentielles : pandas, numpy, matplotlib, seaborn pour manipuler et visualiser les données.", duree_estimee_heures: 6, prerequis: ["Fondamentaux du Machine Learning"], status: "terminé" },
  { ordre: 3, titre: "Modèles de classification", description: "Régression logistique, arbres de décision, Random Forest, SVM — comprendre leurs hypothèses et savoir les appliquer.", duree_estimee_heures: 5, prerequis: ["Python pour la data science"], status: "terminé" },
  { ordre: 4, titre: "Modèles de régression", description: "Régression linéaire, Ridge, Lasso — interpréter et évaluer les résultats.", duree_estimee_heures: 4, prerequis: ["Modèles de classification"], status: "terminé" },
  { ordre: 5, titre: "NLP — Traitement du langage naturel", description: "Tokenisation, embeddings, classification de texte, introduction aux transformers avec HuggingFace.", duree_estimee_heures: 8, prerequis: ["Modèles de classification"], status: "terminé" },
  { ordre: 6, titre: "Projet de synthèse", description: "Appliquer l'ensemble des compétences acquises sur un jeu de données réel : prétraitement, modélisation, évaluation, rapport final.", duree_estimee_heures: 10, prerequis: ["Modèles de régression", "NLP"], status: "terminé" },
];

const MOCK_MODULES: CourseModule[] = [
  {
    id: "mod1", titre: "Fondamentaux du Machine Learning", description: "Les bases théoriques et pratiques du ML",
    status: "terminé",
    lessons: [
      { id: "m1l1", titre: "Types d'apprentissage", duree_min: 20, status: "terminé", score: 85, content: "Le Machine Learning se divise en trois grandes catégories :\n\n**Apprentissage supervisé** : le modèle apprend à partir de données étiquetées (paires entrée/sortie). Exemples : classification d'emails, prédiction de prix.\n\n**Apprentissage non supervisé** : le modèle identifie des structures cachées dans des données non étiquetées. Exemples : clustering de clients, réduction de dimensionnalité.\n\n**Apprentissage par renforcement** : un agent apprend en interagissant avec un environnement et en recevant des récompenses ou des pénalités.", exercises: [{ id: "m1l1e1", question: "Quelle méthode d'apprentissage utilise des données étiquetées ?", type: "qcm", options: ["Non supervisé", "Supervisé", "Par renforcement", "Semi-supervisé"], reponse_attendue: "Supervisé", explication: "L'apprentissage supervisé utilise des paires entrée/sortie pour entraîner le modèle." }] },
      { id: "m1l2", titre: "Métriques d'évaluation", duree_min: 25, status: "terminé", score: 72, content: "Les métriques permettent de quantifier la performance d'un modèle.\n\n**Accuracy** : proportion de prédictions correctes. Trompeuse sur des données déséquilibrées.\n\n**Précision** : parmi les exemples classifiés positifs, quelle fraction l'est réellement ?\n\n**Rappel** : parmi les vrais positifs, quelle fraction a été détectée ?\n\n**F1-Score** : moyenne harmonique de la précision et du rappel. Utile pour les classes déséquilibrées.", exercises: [{ id: "m1l2e1", question: "Quelle métrique est la plus adaptée pour un problème de classification déséquilibrée ?", type: "qcm", options: ["Accuracy", "F1-Score", "MSE", "R²"], reponse_attendue: "F1-Score", explication: "L'accuracy est trompeuse sur des données déséquilibrées. Le F1-Score combine précision et rappel." }] },
      { id: "m1l3", titre: "Validation croisée", duree_min: 30, status: "terminé", score: 90, content: "La validation croisée est une technique pour estimer la performance d'un modèle de manière robuste.\n\n**K-Fold** : les données sont divisées en k sous-ensembles. Le modèle est entraîné k fois, chaque fois en utilisant un sous-ensemble différent comme données de test.\n\n**Leave-One-Out (LOO)** : cas extrême du k-fold où k = n (nombre d'exemples). Très coûteux mais non biaisé.\n\n**Stratified K-Fold** : garantit que chaque fold contient la même proportion de classes que le jeu de données complet.", exercises: [{ id: "m1l3e1", question: "Quelle est la principale différence entre la validation croisée k-fold et un simple split train/test ?", type: "qcm", options: ["La validation croisée est plus rapide", "Elle évalue le modèle sur k partitions différentes", "Le split train/test utilise toutes les données", "La validation croisée ne nécessite pas de test"], reponse_attendue: "Elle évalue le modèle sur k partitions différentes", explication: "La validation croisée k-fold divise les données en k sous-ensembles et entraîne/évalue le modèle k fois, donnant une estimation plus robuste." }] },
    ],
  },
  {
    id: "mod2", titre: "Python pour la data science", description: "Maîtriser pandas, numpy, matplotlib",
    status: "en cours",
    lessons: [
      { id: "m2l1", titre: "Pandas — manipulation de données", duree_min: 35, status: "terminé", score: 65, content: "Pandas est la bibliothèque incontournable pour la manipulation de données tabulaires en Python.\n\n**DataFrame** : structure de données bidimensionnelle avec des colonnes typées. Similaire à une table SQL ou un tableur Excel.\n\n**Opérations essentielles :**\n```python\nimport pandas as pd\ndf = pd.read_csv('data.csv')\ndf.head()        # Premières lignes\ndf.describe()    # Statistiques descriptives\ndf.dropna()      # Supprimer les valeurs manquantes\ndf.groupby('col').mean()  # Agrégation\n```\n\n**Sélection de données :**\n- `df['col']` : sélectionner une colonne\n- `df.loc[idx, 'col']` : sélection par label\n- `df.iloc[0:5, :]` : sélection par position", exercises: [{ id: "m2l1e1", question: "Expliquez la différence entre df.loc et df.iloc dans pandas.", type: "ouverte", options: [], reponse_attendue: "loc utilise des labels/noms d'index, iloc utilise des positions entières (0, 1, 2...)", explication: "" }] },
      { id: "m2l2", titre: "NumPy & calcul matriciel", duree_min: 30, status: "en cours", content: "NumPy est la base du calcul scientifique en Python. Toutes les bibliothèques ML l'utilisent en interne.\n\n**Arrays NumPy :**\n```python\nimport numpy as np\narr = np.array([1, 2, 3])\nmatrix = np.zeros((3, 3))\nnp.dot(A, B)     # Produit matriciel\nnp.linalg.inv(A) # Inverse d'une matrice\n```\n\n**Avantages vs listes Python :**\n- Opérations vectorisées (beaucoup plus rapides)\n- Broadcasting : opérations entre arrays de formes différentes\n- Fonctions mathématiques optimisées", exercises: [{ id: "m2l2e1", question: "Qu'est-ce que le broadcasting dans NumPy ?", type: "qcm", options: ["L'envoi de données sur le réseau", "Des opérations entre arrays de formes compatibles sans copier les données", "Un type de boucle optimisée", "Une méthode de sérialisation"], reponse_attendue: "Des opérations entre arrays de formes compatibles sans copier les données", explication: "Le broadcasting permet d'effectuer des opérations entre arrays de tailles différentes en étendant implicitement la plus petite." }] },
      { id: "m2l3", titre: "Matplotlib & visualisation", duree_min: 25, status: "verrouillé", content: "", exercises: [] },
    ],
  },
  {
    id: "mod3", titre: "Modèles de classification", description: "Régression logistique, arbres de décision, SVM",
    status: "verrouillé",
    lessons: [
      { id: "m3l1", titre: "Régression logistique", duree_min: 30, status: "verrouillé", content: "", exercises: [] },
      { id: "m3l2", titre: "Arbres de décision", duree_min: 35, status: "verrouillé", content: "", exercises: [] },
      { id: "m3l3", titre: "Random Forest & SVM", duree_min: 40, status: "verrouillé", content: "", exercises: [] },
    ],
  },
];

const HISTORY_ITEMS = [
  { id: 1, type: "conversation",   title: "Résumé des tâches de la semaine",    date: "5 juil. 2026 — 09:14", preview: "Cette semaine, vous avez 5 tâches actives : Relire le chapitre 3, Rédiger l'introduction..." },
  { id: 2, type: "recommandation", title: "Planification du mémoire M2",        date: "4 juil. 2026 — 16:30", preview: "Je vous recommande de bloquer 3h par jour pour avancer la rédaction dans les temps impartis..." },
  { id: 3, type: "conversation",   title: "Aide à la rédaction — Introduction", date: "4 juil. 2026 — 14:22", preview: "Pour une introduction de mémoire M2, je suggère : contexte, problématique, objectifs, plan..." },
  { id: 4, type: "recommandation", title: "Analyse de vos habitudes de travail", date: "3 juil. 2026 — 10:05", preview: "D'après les 2 dernières semaines, vous êtes plus productif entre 9h et 11h le matin..." },
];

const NAV = [
  { id: "dashboard" as Page, label: "Dashboard",    icon: LayoutDashboard },
  { id: "roadmap"   as Page, label: "Roadmap",      icon: Map            },
  { id: "courses"   as Page, label: "Courses",      icon: GraduationCap  },
  { id: "projects"  as Page, label: "Projets",      icon: FolderOpen     },
  { id: "tasks"     as Page, label: "Tâches",       icon: CheckSquare    },
  { id: "chat"      as Page, label: "Assistant IA", icon: MessageSquare  },
  { id: "history"   as Page, label: "Historique",   icon: Clock          },
  { id: "settings"  as Page, label: "Paramètres",   icon: Settings       },
];

// ─── Kanban helpers ───────────────────────────────────────────────────────────

const CATEGORY_STYLES: Record<string, string> = {
  Learning:  "bg-blue-50 text-blue-700",
  Project:   "bg-violet-50 text-violet-700",
  Reading:   "bg-amber-50 text-amber-700",
  Code:      "bg-slate-100 text-slate-600",
  Exercises: "bg-emerald-50 text-emerald-700",
  Other:     "bg-gray-100 text-gray-500",
};

const PRIORITY_STYLES: Record<string, { dot: string; label: string }> = {
  haute:   { dot: "bg-red-400",     label: "High"   },
  moyenne: { dot: "bg-amber-400",   label: "Medium" },
  basse:   { dot: "bg-emerald-400", label: "Low"    },
};

const KANBAN_COLS: { id: Task["status"]; label: string; dot: string }[] = [
  { id: "à faire",  label: "To Do",       dot: "bg-slate-400"   },
  { id: "en cours", label: "In Progress", dot: "bg-blue-500"    },
  { id: "terminé",  label: "Completed",   dot: "bg-emerald-500" },
];

// ─── Onboarding data ──────────────────────────────────────────────────────────

const ONBOARDING_STEPS = [
  { question: "What do you want to learn?",              choices: ["Web Development", "Data Science & AI", "Mobile Development", "DevOps & Cloud", "UI/UX Design"] },
  { question: "What is your current level?",             choices: ["Complete Beginner", "Some Experience", "Intermediate", "Advanced"] },
  { question: "How many hours per week can you dedicate?", choices: ["1-3 hours", "4-7 hours", "8-15 hours", "15+ hours"] },
  { question: "What is your preferred language?",        choices: ["English", "French", "Spanish", "Arabic", "German"] },
  { question: "What is your career objective?",          choices: ["Get a job as developer", "Freelance projects", "Build my own startup", "Level up at current job", "Personal interest"] },
];

// ─── Micro-components ─────────────────────────────────────────────────────────

function PriorityBadge({ p }: { p: string }) {
  const cls = p === "haute" ? "bg-red-50 text-red-700 ring-red-100" : p === "moyenne" ? "bg-amber-50 text-amber-700 ring-amber-100" : "bg-slate-100 text-slate-500 ring-slate-200";
  return <span className={`text-xs font-medium px-2 py-0.5 rounded ring-1 ${cls}`}>{p.charAt(0).toUpperCase() + p.slice(1)}</span>;
}

function StatusBadge({ s }: { s: string }) {
  const cls = s === "terminé" ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : s === "en cours" ? "bg-blue-50 text-blue-700 ring-blue-100" : "bg-slate-100 text-slate-500 ring-slate-200";
  return <span className={`text-xs font-medium px-2 py-0.5 rounded ring-1 ${cls}`}>{s}</span>;
}

function ScoreBadge({ score }: { score: number }) {
  const cls = score >= 70 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700";
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded ${cls}`}>{score}%</span>;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ page, setPage, onLogout }: { page: Page; setPage: (p: Page) => void; onLogout: () => void }) {
  return (
    <aside className="w-60 shrink-0 bg-card border-r border-border flex flex-col h-screen sticky top-0">
      <div className="h-14 flex items-center px-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold leading-none">N</span>
          </div>
          <span className="font-semibold text-foreground tracking-tight">Nova AI</span>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(item => {
          const Icon = item.icon;
          const active = page === item.id;
          return (
            <button key={item.id} onClick={() => setPage(item.id)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left ${active ? "bg-secondary text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              <Icon size={15} strokeWidth={active ? 2 : 1.75} />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold shrink-0">{CURRENT_USER.initials}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{CURRENT_USER.name}</p>
            <p className="text-xs text-muted-foreground truncate">{CURRENT_USER.role}</p>
          </div>
          <button onClick={onLogout} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded" title="Déconnexion">
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─── TopBar ───────────────────────────────────────────────────────────────────

function TopBar({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="h-14 border-b border-border bg-card flex items-center px-6 gap-4 shrink-0">
      <h1 className="text-base font-semibold text-foreground flex-1">{title}</h1>
      <div className="flex items-center gap-2">
        {action}
        <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted">
          <Bell size={16} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full" />
        </button>
      </div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────

function Login({ onLogin }: { onLogin: (isNew: boolean, firstName: string) => void }) {
  const [isSignup, setIsSignup]   = useState(false);
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [firstName, setFirstName] = useState("");
  const [error, setError]         = useState("");

  const handle = async () => {
    if (!email || !password) { setError("Veuillez remplir tous les champs."); return; }
    if (isSignup && !firstName) { setError("Veuillez saisir votre prénom."); return; }
    setError("");
    try {
      if (isSignup) {
        await register(email, email, password);
        await login(email, password);
        onLogin(true, firstName);
      } else {
        await login(email, password);
        onLogin(false, "Sophie");
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
    }
  };
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-base leading-none">N</span>
          </div>
          <span className="text-xl font-semibold text-foreground tracking-tight">Nova AI</span>
        </div>
        <div className="bg-card rounded-xl border border-border shadow-sm p-8">
          <h2 className="text-lg font-semibold text-foreground mb-1">{isSignup ? "Créer un compte" : "Connexion"}</h2>
          <p className="text-sm text-muted-foreground mb-6">{isSignup ? "Rejoignez Nova AI pour commencer." : "Bon retour parmi nous."}</p>
          <div className="space-y-4">
            {isSignup && (
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Prénom</label>
                <input value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full bg-input-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25" placeholder="Sophie" />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Adresse e-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-input-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25" placeholder="vous@exemple.fr" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()} className="w-full bg-input-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25" placeholder="••••••••" />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button onClick={handle} className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors mt-2">
              {isSignup ? "Créer mon compte" : "Se connecter"}
            </button>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-5">
            {isSignup ? "Déjà un compte ? " : "Pas encore de compte ? "}
            <button onClick={() => { setIsSignup(!isSignup); setError(""); }} className="text-primary hover:underline underline-offset-2">
              {isSignup ? "Se connecter" : "Créer un compte"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── ONBOARDING ───────────────────────────────────────────────────────────────

function Onboarding({ firstName, onComplete }: { firstName: string; onComplete: (p: LearningProfile) => void }) {
  const [step, setStep]       = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(5).fill(""));
  const [visible, setVisible] = useState(true);
  const [building, setBuilding] = useState(false);

  const stepData   = ONBOARDING_STEPS[step];
  const selected   = answers[step];
  const canContinue = selected.length > 0;

  const transition = (fn: () => void) => {
    setVisible(false);
    setTimeout(() => { fn(); setVisible(true); }, 180);
  };

  const next = () => {
    if (step < 4) {
      transition(() => setStep(s => s + 1));
    } else {
      setBuilding(true);
      setTimeout(() => onComplete({ domain: answers[0], niveau: answers[1], disponibilite: answers[2], langue: answers[3], career: answers[4] }), 2500);
    }
  };

  const prev = () => { if (step > 0) transition(() => setStep(s => s - 1)); };

  const select = (choice: string) => {
    const next = [...answers];
    next[step] = choice;
    setAnswers(next);
  };

  if (building) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 60%, #F0F4FF 100%)" }}>
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-foreground font-medium">Thanks {firstName}, building your personalized path…</p>
          <p className="text-sm text-muted-foreground">This will just take a moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 60%, #F0F4FF 100%)" }}>
      {/* Logo + title */}
      <div className="mb-8 text-center">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mx-auto mb-3">
          <span className="text-white font-bold text-base">N</span>
        </div>
        <h1 className="text-lg font-semibold text-foreground">{"Let's personalize your experience"}</h1>
        <p className="text-sm text-muted-foreground mt-1">Step {step + 1} of 5</p>
      </div>

      {/* 5-segment progress bar */}
      <div className="w-full max-w-md flex gap-1.5 mb-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/60">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: i <= step ? "100%" : "0%", background: i <= step ? "linear-gradient(90deg, #10B981, #6366F1)" : "transparent" }}
            />
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="w-full max-w-md" style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(8px)", transition: "opacity 0.18s ease, transform 0.18s ease" }}>
        <div className="bg-white rounded-2xl shadow-lg border border-white/60 p-6">
          {/* Nova is asking… */}
          <div className="flex items-center gap-2 mb-5">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">N</span>
            </div>
            <span className="text-xs font-medium text-primary">Nova is asking…</span>
          </div>

          <h2 className="text-base font-semibold text-foreground mb-4">{stepData.question}</h2>

          {/* Choices */}
          <div className="space-y-2">
            {stepData.choices.map(choice => {
              const isSelected = selected === choice;
              return (
                <button
                  key={choice}
                  onClick={() => select(choice)}
                  className={`w-full flex items-center gap-3 border rounded-xl px-4 py-3 text-sm text-left transition-all ${isSelected ? "border-indigo-400 bg-indigo-50 text-indigo-800" : "border-gray-200 text-foreground hover:border-indigo-200 hover:bg-indigo-50/40"}`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${isSelected ? "border-indigo-500 bg-indigo-500" : "border-gray-300"}`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  {choice}
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-6">
            <button onClick={prev} className={`text-sm text-muted-foreground hover:text-foreground transition-colors ${step === 0 ? "invisible" : ""}`}>
              Back
            </button>
            <button
              onClick={next}
              disabled={!canContinue}
              className="px-6 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: canContinue ? "linear-gradient(135deg, #1E3A8A, #4F46E5)" : "#E5E7EB",
                color: canContinue ? "white" : "#9CA3AF",
                cursor: canContinue ? "pointer" : "not-allowed",
              }}
            >
              {step === 4 ? "Finish" : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

function Dashboard({ tasks, projects, setPage }: { tasks: Task[]; projects: Project[]; setPage: (p: Page) => void }) {
  const activeTasks = tasks.filter(t => t.status !== "terminé").slice(0, 4);
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Dashboard" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <div key={i} className="bg-card rounded-lg border border-border p-5 shadow-sm">
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">{s.label}</p>
              <p className="text-3xl font-semibold text-foreground mt-2 leading-none">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
              <p className="text-xs text-primary mt-3 font-medium">{s.delta}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg border border-border shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Tâches du jour</h2>
              <button onClick={() => setPage("tasks")} className="text-xs text-primary hover:underline underline-offset-2">Voir tout</button>
            </div>
            <div className="divide-y divide-border">
              {activeTasks.map(t => (
                <div key={t.id} className="flex items-start gap-3 px-5 py-3.5">
                  <div className={`mt-0.5 w-3.5 h-3.5 rounded-full border-2 shrink-0 ${t.status === "en cours" ? "border-primary bg-primary/20" : "border-muted-foreground/40"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{t.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.project} · {t.due}</p>
                  </div>
                  <PriorityBadge p={t.priority} />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Recommandations IA</h2>
              <button onClick={() => setPage("chat")} className="text-xs text-primary hover:underline underline-offset-2">Ouvrir le chat</button>
            </div>
            <div className="divide-y divide-border">
              {RECOMMENDATIONS.map(rec => (
                <div key={rec.id} className="px-5 py-4 flex items-start gap-3">
                  <span className="text-xs font-semibold text-primary bg-secondary px-1.5 py-0.5 rounded shrink-0 mt-0.5">{rec.tag}</span>
                  <p className="text-sm text-foreground leading-relaxed">{rec.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Projets actifs</h2>
            <button onClick={() => setPage("projects")} className="text-xs text-primary hover:underline underline-offset-2">Voir tout</button>
          </div>
          <div className="divide-y divide-border">
            {projects.slice(0, 3).map(p => {
              const pct = Math.round((p.done / p.taskCount) * 100);
              return (
                <div key={p.id} className="flex items-center gap-5 px-5 py-3.5">
                  <div className="w-1.5 h-8 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1.5">
                      <p className="text-sm font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.deadline}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1 bg-muted rounded-full"><div className="h-1 rounded-full" style={{ width: `${pct}%`, backgroundColor: p.color }} /></div>
                      <span className="text-xs text-muted-foreground font-mono w-12 text-right">{p.done}/{p.taskCount}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PROJECTS ─────────────────────────────────────────────────────────────────

function Projects({
  tasks, setTasks, projects, setProjects,
  onDiscussProject, setPage,
}: {
  tasks: Task[];
  setTasks: (t: Task[]) => void;
  projects: Project[];
  setProjects: (p: Project[]) => void;
  onDiscussProject: (p: Project) => void;
  setPage: (p: Page) => void;
}) {
  const [showNew, setShowNew]           = useState(false);
  const [selectedId, setSelectedId]     = useState<number | null>(null);
  const [newName, setNewName]           = useState("");
  const [newDesc, setNewDesc]           = useState("");
  const [newDeadline, setNewDeadline]   = useState("");
  const [newFile, setNewFile]           = useState<File | null>(null);
  const [creating, setCreating]         = useState(false);
  const [showAddTask, setShowAddTask]   = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedProject = projects.find(p => p.id === selectedId);
  const projectTasks = tasks.filter(t => t.projectId === selectedId);

  const handleCreate = () => {
    if (!newName.trim() || !newDesc.trim()) return;
    setCreating(true);
    setTimeout(() => {
      const newProject: Project = { id: Date.now(), name: newName, desc: newDesc, taskCount: 0, done: 0, color: "#1E3A8A", deadline: newDeadline || "—" };
      setProjects([...projects, newProject]);
      setShowNew(false);
      setCreating(false);
      onDiscussProject(newProject);
      setPage("chat");
    }, 800);
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: t.status === "terminé" ? "à faire" : "terminé" } : t));
  };

  if (selectedProject) {
    const pct = projectTasks.length > 0 ? Math.round((projectTasks.filter(t => t.status === "terminé").length / projectTasks.length) * 100) : 0;
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          title={selectedProject.name}
          action={
            <button onClick={() => setSelectedId(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-lg transition-colors">
              <ChevronLeft size={14} /> Retour
            </button>
          }
        />
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Header card */}
          <div className="bg-card rounded-lg border border-border shadow-sm p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground leading-relaxed">{selectedProject.desc}</p>
                <p className="text-xs text-muted-foreground mt-2">Échéance : <span className="text-foreground font-medium">{selectedProject.deadline}</span></p>
              </div>
              <button onClick={() => { onDiscussProject(selectedProject); setPage("chat"); }} className="flex items-center gap-1.5 bg-primary text-white text-sm px-3 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium shrink-0">
                <MessageSquare size={13} />
                Discuter avec Nova AI
              </button>
            </div>
            {projectTasks.length > 0 && (
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{projectTasks.filter(t => t.status === "terminé").length}/{projectTasks.length} tâches terminées</span>
                  <span className="font-semibold text-foreground">{pct}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-1.5 bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}
          </div>
          {/* Tasks */}
          <div className="bg-card rounded-lg border border-border shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Tâches du projet</h2>
              <button onClick={() => setShowAddTask(v => !v)} className="flex items-center gap-1.5 text-xs text-primary border border-primary/30 px-2.5 py-1.5 rounded-lg hover:bg-primary/5 transition-colors font-medium">
                <Plus size={12} /> Ajouter une tâche
              </button>
            </div>
            {showAddTask && (
              <div className="px-5 py-3 border-b border-border bg-muted/20 flex gap-2">
                <input
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && newTaskTitle.trim() && selectedId != null) {
                      const task: Task = { id: Date.now(), title: newTaskTitle.trim(), description: "", project: selectedProject?.name ?? "", projectId: selectedId, priority: "moyenne", status: "à faire", due: "", category: "Project" };
                      setTasks([...tasks, task]);
                      setProjects(projects.map(p => p.id === selectedId ? { ...p, taskCount: p.taskCount + 1 } : p));
                      setNewTaskTitle("");
                      setShowAddTask(false);
                    }
                  }}
                  placeholder="Titre de la tâche…"
                  className="flex-1 text-sm bg-card border border-border rounded-lg px-3 py-1.5 outline-none focus:border-primary transition-colors"
                  autoFocus
                />
                <button
                  onClick={() => {
                    if (newTaskTitle.trim() && selectedId != null) {
                      const task: Task = { id: Date.now(), title: newTaskTitle.trim(), description: "", project: selectedProject?.name ?? "", projectId: selectedId, priority: "moyenne", status: "à faire", due: "", category: "Project" };
                      setTasks([...tasks, task]);
                      setProjects(projects.map(p => p.id === selectedId ? { ...p, taskCount: p.taskCount + 1 } : p));
                      setNewTaskTitle("");
                      setShowAddTask(false);
                    }
                  }}
                  className="px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Ajouter
                </button>
                <button onClick={() => { setShowAddTask(false); setNewTaskTitle(""); }} className="px-3 py-1.5 text-muted-foreground text-sm hover:text-foreground transition-colors">Annuler</button>
              </div>
            )}
            {projectTasks.length === 0 && !showAddTask ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Aucune tâche pour ce projet.</div>
            ) : (
              <div className="divide-y divide-border">
                {projectTasks.map(t => (
                  <div key={t.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/20 transition-colors">
                    <button onClick={() => toggleTask(t.id)} className="text-muted-foreground hover:text-primary transition-colors shrink-0">
                      {t.status === "terminé" ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Circle size={16} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${t.status === "terminé" ? "line-through text-muted-foreground" : "text-foreground"}`}>{t.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t.due}</p>
                    </div>
                    <PriorityBadge p={t.priority} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Projets" action={
        <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 bg-primary text-white text-sm px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors font-medium">
          <Plus size={14} /> Nouveau projet
        </button>
      } />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(p => {
            const pct = Math.round((p.done / Math.max(p.taskCount, 1)) * 100);
            return (
              <div key={p.id} onClick={() => setSelectedId(p.id)} className="bg-card rounded-lg border border-border shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer group">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <h3 className="font-semibold text-foreground text-sm">{p.name}</h3>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 font-mono">{p.deadline}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-5 line-clamp-2">{p.desc}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{p.done} terminées sur {p.taskCount}</span>
                    <span className="font-semibold text-foreground">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                  </div>
                </div>
              </div>
            );
          })}
          <button onClick={() => setShowNew(true)} className="border-2 border-dashed border-border rounded-lg p-5 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors min-h-44">
            <Plus size={20} strokeWidth={1.5} />
            <span className="text-sm">Nouveau projet</span>
          </button>
        </div>
      </div>

      {/* New project modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-foreground">Nouveau projet</h2>
              <button onClick={() => setShowNew(false)} className="text-muted-foreground hover:text-foreground p-1 rounded"><X size={15} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Nom du projet <span className="text-red-500">*</span></label>
                <input value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-input-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25" placeholder="ex. Rapport de stage" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Description <span className="text-red-500">*</span></label>
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} className="w-full bg-input-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 resize-none" rows={3} placeholder="Décrivez ce que ce projet doit accomplir…" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Date d'échéance</label>
                <input type="date" value={newDeadline} onChange={e => setNewDeadline(e.target.value)} className="w-full bg-input-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Document de référence <span className="text-muted-foreground font-normal">(optionnel)</span></label>
                <button onClick={() => fileRef.current?.click()} className="w-full border border-dashed border-border rounded-lg py-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-2">
                  <Paperclip size={13} />
                  {newFile ? newFile.name : "Joindre un PDF, Word ou TXT"}
                </button>
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={e => setNewFile(e.target.files?.[0] || null)} />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowNew(false)} className="flex-1 py-2.5 text-sm border border-border rounded-lg text-foreground hover:bg-muted transition-colors">Annuler</button>
              <button onClick={handleCreate} disabled={!newName.trim() || !newDesc.trim() || creating} className={`flex-1 py-2.5 text-sm rounded-lg font-medium transition-colors ${newName.trim() && newDesc.trim() && !creating ? "bg-primary text-white hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"}`}>
                {creating ? "Création…" : "Créer le projet"}
              </button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">Nova AI analysera votre projet et proposera des tâches.</p>
          </div>
        </div>
      )}
    </div>
  );
}
// ─── NEW TASK MODAL ───────────────────────────────────────────────────────────

function NewTaskModal({
  defaultStatus, onClose, onCreate,
}: {
  defaultStatus: Task["status"];
  onClose: () => void;
  onCreate: (task: { title: string; description: string; status: Task["status"]; priority: Task["priority"]; category: TaskCategory; due: string }) => void;
}) {
  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus]           = useState<Task["status"]>(defaultStatus);
  const [priority, setPriority]       = useState<Task["priority"]>("moyenne");
  const [category, setCategory]       = useState<TaskCategory>("Other");
  const [due, setDue]                 = useState("");
  const [creating, setCreating]       = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setCreating(true);
    await onCreate({ title: title.trim(), description, status, priority, category, due });
    setCreating(false);
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-foreground">Nouvelle tâche</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded"><X size={15} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Titre <span className="text-red-500">*</span></label>
            <input
              value={title} onChange={e => setTitle(e.target.value)} autoFocus
              className="w-full bg-input-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
              placeholder="ex. Préparer la démo"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Description</label>
            <textarea
              value={description} onChange={e => setDescription(e.target.value)}
              className="w-full bg-input-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 resize-none"
              rows={2} placeholder="Détails de la tâche…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Priorité</label>
              <select value={priority} onChange={e => setPriority(e.target.value as Task["priority"])} className="w-full bg-input-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25">
                <option value="haute">Haute</option>
                <option value="moyenne">Moyenne</option>
                <option value="basse">Basse</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Statut</label>
              <select value={status} onChange={e => setStatus(e.target.value as Task["status"])} className="w-full bg-input-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25">
                <option value="à faire">À faire</option>
                <option value="en cours">En cours</option>
                <option value="terminé">Terminé</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Catégorie</label>
              <select value={category} onChange={e => setCategory(e.target.value as TaskCategory)} className="w-full bg-input-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25">
                <option value="Learning">Learning</option>
                <option value="Project">Project</option>
                <option value="Reading">Reading</option>
                <option value="Code">Code</option>
                <option value="Exercises">Exercises</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Échéance</label>
              <input type="date" value={due} onChange={e => setDue(e.target.value)} className="w-full bg-input-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25" />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm border border-border rounded-lg text-foreground hover:bg-muted transition-colors">Annuler</button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || creating}
            className={`flex-1 py-2.5 text-sm rounded-lg font-medium transition-colors ${title.trim() && !creating ? "bg-primary text-white hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
          >
            {creating ? "Création…" : "Créer la tâche"}
          </button>
        </div>
      </div>
    </div>
  );
}
// ─── TASKS — Kanban ───────────────────────────────────────────────────────────

function KanbanCard({ task, onDragStart, onDragEnd, onClick, isDragging }: {
  task: Task; onDragStart: () => void; onDragEnd: () => void; onClick: () => void; isDragging: boolean;
}) {
  const ps = PRIORITY_STYLES[task.priority];
  const catCls = CATEGORY_STYLES[task.category] ?? CATEGORY_STYLES.Other;
  const dateStr = task.due ? new Date(task.due).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
  return (
    <div
      draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={onClick}
      className={`bg-card rounded-lg border border-border shadow-sm p-3.5 cursor-pointer hover:shadow-md transition-all select-none ${isDragging ? "opacity-40 scale-95" : ""}`}
    >
      <p className="text-sm font-medium text-foreground mb-2.5 leading-snug line-clamp-2">{task.title}</p>
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${catCls}`}>{task.category}</span>
        <span className="text-muted-foreground/40 text-xs">·</span>
        <div className="flex items-center gap-1">
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${ps.dot}`} />
          <span className="text-xs text-muted-foreground">{ps.label}</span>
        </div>
      </div>
      {dateStr && <p className="text-xs text-muted-foreground">{dateStr}</p>}
    </div>
  );
}

function Tasks({ tasks, setTasks }: { tasks: Task[]; setTasks: (t: Task[]) => void }) {
  const [dragging, setDragging]           = useState<number | null>(null);
  const [dragOver, setDragOver]           = useState<Task["status"] | null>(null);
  const [selected, setSelected]           = useState<Task | null>(null);
  const [activeTab, setActiveTab]         = useState<Task["status"]>("à faire");
  const [filterProject, setFilterProject] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [showNewTask, setShowNewTask]     = useState<Task["status"] | null>(null);  // ← remplace addingCol/newTitle

  const allProjects = Array.from(new Set(tasks.map(t => t.project))).filter(Boolean);

  const filtered = tasks.filter(t => {
    if (filterProject !== "all" && t.project !== filterProject) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    return true;
  });

  const dropOnCol = (status: Task["status"]) => {
    if (dragging === null) return;
    setTasks(tasks.map(t => t.id === dragging ? { ...t, status } : t));
    setDragging(null); setDragOver(null);
  };

  const handleCreateTask = async (data: { title: string; description: string; status: Task["status"]; priority: Task["priority"]; category: TaskCategory; due: string }) => {
    try {
      const created = await createTask(data);
      setTasks([...tasks, created]);
      setShowNewTask(null);
    } catch (err) {
      console.error("Erreur création tâche:", err);
    }
  };

  const markDone = () => {
    if (!selected) return;
    setTasks(tasks.map(t => t.id === selected.id ? { ...t, status: "terminé" } : t));
    setSelected(prev => prev ? { ...prev, status: "terminé" } : null);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Tâches" action={
  <button onClick={() => setShowNewTask("à faire")} className="flex items-center gap-1.5 bg-primary text-white text-sm px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors font-medium">
    <Plus size={14} /> Nouvelle tâche
  </button>
} />

      {/* Filter chips */}
      <div className="px-6 py-3 border-b border-border bg-card flex items-center gap-2 flex-wrap">
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="text-xs border border-border rounded-full px-2.5 py-1 bg-background focus:outline-none text-foreground">
          <option value="all">All projects</option>
          {allProjects.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <span className="text-muted-foreground/40 text-xs">|</span>
        {(["all", "haute", "moyenne", "basse"] as const).map(p => (
          <button key={p} onClick={() => setFilterPriority(p)} className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${filterPriority === p ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
            {p === "all" ? "All priorities" : PRIORITY_STYLES[p].label}
          </button>
        ))}
      </div>

      {/* Mobile tabs */}
      <div className="md:hidden flex border-b border-border bg-card">
        {KANBAN_COLS.map(col => (
          <button onClick={() => setShowNewTask(col.id)} className="text-muted-foreground hover:text-primary transition-colors p-0.5 rounded">
  <Plus size={14} />
</button>
        ))}
      </div>

      {/* Board */}
      <div className="flex-1 overflow-hidden">
        {/* Desktop: 3 columns */}
        <div className="hidden md:grid md:grid-cols-3 gap-5 p-6 h-full">
          {KANBAN_COLS.map(col => {
            const colTasks = filtered.filter(t => t.status === col.id);
            const isOver = dragOver === col.id;
            return (
              <div
                key={col.id}
                className={`flex flex-col rounded-xl border transition-colors min-h-0 ${isOver ? "border-primary/40 bg-secondary/40" : "border-border bg-muted/30"}`}
                onDragOver={e => { e.preventDefault(); setDragOver(col.id); }}
                onDrop={() => dropOnCol(col.id)}
                onDragLeave={() => setDragOver(null)}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <span className="text-xs font-semibold text-foreground">{col.label}</span>
                    <span className="text-xs text-muted-foreground">({colTasks.length})</span>
                  </div>
                 <button onClick={() => setShowNewTask(col.id)} className="text-muted-foreground hover:text-primary transition-colors p-0.5 rounded">
                    <Plus size={14} />
                  </button>
                </div>

               

                <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                  {colTasks.map(task => (
                    <KanbanCard
                      key={task.id} task={task}
                      onDragStart={() => setDragging(task.id)}
                      onDragEnd={() => { setDragging(null); setDragOver(null); }}
                      onClick={() => setSelected(task)}
                      isDragging={dragging === task.id}
                    />
                  ))}
                 {colTasks.length === 0 && (
  <div className="flex items-center justify-center py-8 text-xs text-muted-foreground/50">Drop tasks here</div>
)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile: single tab */}
        <div className="md:hidden flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.filter(t => t.status === activeTab).map(task => (
            <KanbanCard key={task.id} task={task} onDragStart={() => {}} onDragEnd={() => {}} onClick={() => setSelected(task)} isDragging={false} />
          ))}
          {filtered.filter(t => t.status === activeTab).length === 0 && (
            <div className="text-center py-10 text-sm text-muted-foreground">No tasks here.</div>
          )}
        </div>
      </div>

      {/* Task detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <h2 className="text-base font-semibold text-foreground leading-snug">{selected.title}</h2>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground p-1 rounded shrink-0"><X size={15} /></button>
            </div>
            {selected.description && (
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{selected.description}</p>
            )}
            <div className="space-y-3 mb-5">
              {[
                ["Project",   selected.project || "—"],
                ["Category",  selected.category],
                ["Due date",  selected.due ? new Date(selected.due).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium text-foreground">{v}</span>
                </div>
              ))}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Priority</span>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${PRIORITY_STYLES[selected.priority].dot}`} />
                  <span className="font-medium text-foreground">{PRIORITY_STYLES[selected.priority].label}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge s={selected.status} />
              </div>
            </div>
{selected.status !== "terminé" && (
              <button onClick={markDone} className="w-full py-2.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center justify-center gap-1.5">
                <Check size={14} /> Mark as completed
              </button>
            )}
          </div>
        </div>
      )}

      {showNewTask && (
        <NewTaskModal
          defaultStatus={showNewTask}
          onClose={() => setShowNewTask(null)}
          onCreate={handleCreateTask}
        />
      )}
    </div>
  );
}

// ─── CHAT ─────────────────────────────────────────────────────────────────────

function Chat({ pinnedProject, onClearProject, tasks, setTasks, projects, setProjects }: {
  pinnedProject: PinnedProject | null;
  onClearProject: () => void;
  tasks: Task[];
  setTasks: (t: Task[]) => void;
  projects: Project[];
  setProjects: (p: Project[]) => void;
}) {
  const [messages, setMessages]           = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput]                 = useState("");
  const [isTyping, setIsTyping]           = useState(false);
  const [pinnedFiles, setPinnedFiles]     = useState<FileAttachment[]>([]);
  const [projectMsgId, setProjectMsgId]   = useState<number | null>(null);
  const [tasksAdded, setTasksAdded]       = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const PROPOSED_TASKS = [
    "Définir le périmètre et les livrables attendus",
    "Établir un planning avec des jalons intermédiaires",
    "Identifier les ressources et compétences nécessaires",
    "Rédiger la première version du plan d'action",
  ];

  // Auto-scroll
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  // Auto-message when project is pinned
  useEffect(() => {
    if (!pinnedProject) return;
    setTasksAdded(false);
    const msgId = Date.now();
    const autoMsg: ChatMessage = {
      id: msgId,
      role: "assistant",
      text: `J'ai bien noté votre projet "${pinnedProject.name}". D'après la description fournie, voici les grandes tâches que je vous propose pour le réaliser :\n\n• ${PROPOSED_TASKS.join("\n• ")}\n\nVoulez-vous que j'ajuste ces tâches, ou avez-vous des questions spécifiques sur ce projet ?`,
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    };
    setProjectMsgId(msgId);
    setMessages(prev => [...prev.filter(m => m.id !== -1), autoMsg]);
  }, [pinnedProject?.id]);

  const send = () => {
  if (!input.trim()) return;
  const userMsg: ChatMessage = { id: Date.now(), role: "user", text: input, time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) };
  setMessages(prev => [...prev, userMsg]);
  const messageText = input;
  setInput("");
  setIsTyping(true);

  const activeDoc = pinnedFiles.find(f => f.documentId);
  const call = activeDoc
    ? analyzeDocument(activeDoc.documentId!, messageText)
    : sendChatMessage(messageText);

  call
    .then((data) => {
      const reply: ChatMessage = { id: Date.now() + 1, role: "assistant", text: data.reponse, time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) };
      setMessages(prev => [...prev, reply]);
      setIsTyping(false);
    })
    .catch((err) => {
      console.error(err);
      const reply: ChatMessage = { id: Date.now() + 1, role: "assistant", text: err instanceof Error ? err.message : "Une erreur est survenue.", time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) };
      setMessages(prev => [...prev, reply]);
      setIsTyping(false);
    });
};

  const handleFile = async (file: File) => {
  const attachment: FileAttachment = { id: Date.now(), name: file.name, type: file.name.split(".").pop()?.toUpperCase() || "FILE", size: `${(file.size / 1024 / 1024).toFixed(1)} Mo`, progress: 40, status: "uploading" };
  const fileMsg: ChatMessage = { id: Date.now() + 1, role: "file", text: "", time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), file: attachment };
  setMessages(prev => [...prev, fileMsg]);

  try {
    const result = await uploadDocument(file);
    const traite = result.statut === "traite";
    setMessages(prev => prev.map(m => m.file?.id === attachment.id
      ? { ...m, file: { ...m.file!, progress: 100, status: traite ? "traité" : "processing", documentId: result.id } }
      : m
    ));
    if (traite) {
      setPinnedFiles(prev => [...prev, { ...attachment, status: "traité", documentId: result.id }]);
    }
  } catch (err) {
    console.error("Erreur upload document:", err);
    setMessages(prev => prev.map(m => m.file?.id === attachment.id
      ? { ...m, file: { ...m.file!, progress: 100, status: "erreur" } }
      : m
    ));
    setMessages(prev => [...prev, { id: Date.now() + 2, role: "assistant", text: err instanceof Error ? err.message : "Le document n'a pas pu être traité.", time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) }]);
  }
};

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Assistant IA" />

      {/* Pinned context bar */}
      {(pinnedProject || pinnedFiles.length > 0) && (
        <div className="border-b border-border bg-secondary/50 px-5 py-2.5 flex items-center gap-2 flex-wrap">
          {pinnedProject && (
            <div className="flex items-center gap-1.5 bg-card border border-border rounded-full px-3 py-1 text-xs text-foreground font-medium">
              <FolderOpen size={11} className="text-primary" />
              Projet : {pinnedProject.name}
              <button onClick={onClearProject} className="ml-0.5 text-muted-foreground hover:text-foreground transition-colors"><X size={10} /></button>
            </div>
          )}
          {pinnedFiles.map(f => (
            <div key={f.id} className="flex items-center gap-1.5 bg-card border border-border rounded-full px-3 py-1 text-xs text-foreground font-medium">
              <Paperclip size={11} className="text-primary" />
              {f.name}
              <button onClick={() => setPinnedFiles(prev => prev.filter(x => x.id !== f.id))} className="ml-0.5 text-muted-foreground hover:text-foreground transition-colors"><X size={10} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {messages.map(m => {
          if (m.role === "file" && m.file) {
            const f = m.file;
            return (
              <div key={m.id} className="flex justify-start">
                <div className="bg-card border border-border rounded-lg p-3 max-w-xs shadow-sm">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                      <FileText size={14} className="text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{f.name}</p>
                      <p className="text-xs text-muted-foreground">{f.size}</p>
                    </div>
                  </div>
                  {f.status !== "traité" ? (
                    <div className="space-y-1.5">
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-1 bg-primary rounded-full transition-all duration-300" style={{ width: `${f.progress}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground">{f.status === "processing" ? "Traitement en cours…" : `Chargement ${f.progress}%`}</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
                      <Check size={12} />
                      Traité avec succès
                    </div>
                  )}
                </div>
              </div>
            );
          }
          const isProjectMsg = m.id === projectMsgId && pinnedProject && !tasksAdded;
          return (
            <div key={m.id} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} w-full`}>
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0 mr-2.5 mt-0.5">N</div>
                )}
                <div className={`max-w-xl rounded-xl px-4 py-3 shadow-sm ${m.role === "user" ? "bg-primary text-white" : "bg-card border border-border text-foreground"}`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
                  <p className={`text-xs mt-1.5 ${m.role === "user" ? "text-white/60" : "text-muted-foreground"}`}>{m.time}</p>
                </div>
              </div>
              {isProjectMsg && (
                <div className="ml-9.5 mt-2">
                  <button
                    onClick={() => {
                      if (!pinnedProject) return;
                      const newTasks: Task[] = PROPOSED_TASKS.map((title, i) => ({
                        id: Date.now() + i, title, description: "", project: pinnedProject.name,
                        projectId: pinnedProject.id, priority: "moyenne" as const, status: "à faire" as const,
                        due: "", category: "Project" as TaskCategory,
                      }));
                      setTasks([...tasks, ...newTasks]);
                      setProjects(projects.map(p => p.id === pinnedProject.id ? { ...p, taskCount: p.taskCount + PROPOSED_TASKS.length } : p));
                      setTasksAdded(true);
                      const confirmMsg: ChatMessage = {
                        id: Date.now() + 100, role: "assistant",
                        text: `Parfait ! J'ai ajouté ${PROPOSED_TASKS.length} tâches à votre projet "${pinnedProject.name}". Vous pouvez les retrouver dans la page Projets ou dans le tableau Tâches. Souhaitez-vous les affiner ?`,
                        time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
                      };
                      setMessages(prev => [...prev, confirmMsg]);
                    }}
                    className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary border border-primary/25 px-3 py-2 rounded-lg hover:bg-primary/15 transition-colors font-medium"
                  >
                    <CheckCircle2 size={13} /> Ajouter ces tâches à mon projet
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {isTyping && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">N</div>
            <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1.5">
                {[0, 150, 300].map(d => (
                  <div key={d} className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card px-5 py-4">
        <div className="flex items-end gap-3">
          <button onClick={() => fileRef.current?.click()} className="p-2.5 text-muted-foreground hover:text-primary hover:bg-muted transition-colors rounded-lg shrink-0" title="Joindre un fichier">
            <Paperclip size={16} />
          </button>
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            className="flex-1 bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/25 max-h-32"
            placeholder="Posez votre question… (Entrée pour envoyer)"
            rows={1}
          />
          <button onClick={send} disabled={!input.trim()} className={`p-2.5 rounded-xl transition-colors shrink-0 ${input.trim() ? "bg-primary text-white hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"}`}>
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CERTIFICATE MODAL ────────────────────────────────────────────────────────

function CertificateModal({ path, onClose }: { path: LearningPath; onClose: () => void }) {
  const [showQr, setShowQr] = useState(false);
  if (!path.certificate) return null;

  const certId = `NOVA-${new Date().getFullYear()}-${String(path.id).slice(-6).padStart(6, "0")}`;
  const skills = path.modules.map(m => m.titre);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Gradient banner ── */}
        <div
          className="relative px-6 pt-8 pb-7 text-center"
          style={{ background: "linear-gradient(160deg, #1E3A8A 0%, #4F46E5 55%, #818CF8 100%)" }}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
          >
            <X size={13} className="text-white" />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
            <Award size={28} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-white leading-tight mb-1">{path.profile.domain}</h2>
          <p className="text-sm text-white/60 font-medium">Nova AI</p>
        </div>

        {/* ── White body ── */}
        <div className="px-6 py-5 space-y-4">

          {/* Issued on + QR icon */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">Issued on</p>
              <p className="text-sm font-semibold text-gray-900">{path.certificate.date}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Score : <span className="font-semibold text-gray-700">{path.certificate.score}%</span>
              </p>
            </div>
            <button
              onClick={() => setShowQr(v => !v)}
              className="shrink-0 w-12 h-12 border-2 border-gray-200 rounded-xl flex items-center justify-center hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
              title="Afficher le QR code de vérification"
            >
              <QrCode size={20} className="text-gray-400" />
            </button>
          </div>

          {/* QR expanded */}
          {showQr && (
            <div className="border border-gray-100 rounded-xl p-4 text-center bg-gray-50">
              <svg viewBox="0 0 21 21" className="w-28 h-28 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg">
                <rect width="21" height="21" fill="white"/>
                <rect x="0" y="0" width="7" height="7" fill="#1E3A8A"/><rect x="1" y="1" width="5" height="5" fill="white"/><rect x="2" y="2" width="3" height="3" fill="#1E3A8A"/>
                <rect x="14" y="0" width="7" height="7" fill="#1E3A8A"/><rect x="15" y="1" width="5" height="5" fill="white"/><rect x="16" y="2" width="3" height="3" fill="#1E3A8A"/>
                <rect x="0" y="14" width="7" height="7" fill="#1E3A8A"/><rect x="1" y="15" width="5" height="5" fill="white"/><rect x="2" y="16" width="3" height="3" fill="#1E3A8A"/>
                <rect x="8" y="6" width="1" height="1" fill="#1E3A8A"/><rect x="10" y="6" width="1" height="1" fill="#1E3A8A"/><rect x="12" y="6" width="1" height="1" fill="#1E3A8A"/>
                <rect x="6" y="8" width="1" height="1" fill="#1E3A8A"/><rect x="6" y="10" width="1" height="1" fill="#1E3A8A"/><rect x="6" y="12" width="1" height="1" fill="#1E3A8A"/>
                <rect x="8" y="8" width="2" height="2" fill="#1E3A8A"/><rect x="11" y="8" width="1" height="1" fill="#1E3A8A"/><rect x="13" y="8" width="2" height="1" fill="#1E3A8A"/>
                <rect x="8" y="11" width="1" height="2" fill="#1E3A8A"/><rect x="10" y="10" width="2" height="1" fill="#1E3A8A"/><rect x="13" y="10" width="1" height="2" fill="#1E3A8A"/>
                <rect x="8" y="14" width="1" height="1" fill="#1E3A8A"/><rect x="10" y="14" width="2" height="1" fill="#1E3A8A"/><rect x="13" y="14" width="1" height="1" fill="#1E3A8A"/>
                <rect x="15" y="8" width="1" height="1" fill="#1E3A8A"/><rect x="17" y="8" width="2" height="1" fill="#1E3A8A"/><rect x="20" y="8" width="1" height="1" fill="#1E3A8A"/>
                <rect x="15" y="10" width="2" height="1" fill="#1E3A8A"/><rect x="19" y="10" width="2" height="1" fill="#1E3A8A"/>
                <rect x="14" y="12" width="1" height="1" fill="#1E3A8A"/><rect x="16" y="12" width="1" height="1" fill="#1E3A8A"/><rect x="18" y="12" width="1" height="2" fill="#1E3A8A"/><rect x="20" y="12" width="1" height="1" fill="#1E3A8A"/>
                <rect x="15" y="14" width="1" height="1" fill="#1E3A8A"/><rect x="17" y="14" width="1" height="1" fill="#1E3A8A"/><rect x="20" y="14" width="1" height="1" fill="#1E3A8A"/>
                <rect x="8" y="16" width="2" height="1" fill="#1E3A8A"/><rect x="11" y="16" width="1" height="1" fill="#1E3A8A"/><rect x="14" y="16" width="1" height="2" fill="#1E3A8A"/><rect x="16" y="16" width="1" height="1" fill="#1E3A8A"/><rect x="19" y="16" width="2" height="1" fill="#1E3A8A"/>
                <rect x="8" y="18" width="1" height="1" fill="#1E3A8A"/><rect x="10" y="18" width="2" height="1" fill="#1E3A8A"/><rect x="13" y="18" width="1" height="1" fill="#1E3A8A"/><rect x="17" y="18" width="1" height="1" fill="#1E3A8A"/><rect x="20" y="18" width="1" height="1" fill="#1E3A8A"/>
                <rect x="9" y="20" width="2" height="1" fill="#1E3A8A"/><rect x="12" y="20" width="2" height="1" fill="#1E3A8A"/><rect x="16" y="20" width="1" height="1" fill="#1E3A8A"/><rect x="19" y="20" width="2" height="1" fill="#1E3A8A"/>
              </svg>
              <p className="text-[10px] text-gray-400 font-mono">{certId}</p>
              <p className="text-[9px] text-gray-300 mt-0.5">nova-ai.com/verify/{certId}</p>
            </div>
          )}

          {/* Skills Validated */}
          {skills.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Skills Validated</p>
              <div className="flex flex-wrap gap-1.5">
                {skills.map(s => (
                  <span
                    key={s}
                    className="text-xs px-2.5 py-1 rounded-full font-medium border"
                    style={{ background: "#EEF2FF", color: "#4F46E5", borderColor: "#C7D2FE" }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Cert number */}
          <p className="text-[9px] text-gray-300 tracking-widest text-center font-mono">{certId}</p>

          {/* Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => window.alert(`GET /api/certificates/${certId}/download`)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #1E3A8A, #4F46E5)" }}
            >
              <Download size={14} /> Download PDF
            </button>
            <button
              onClick={() => window.alert(`Lien copié : nova-ai.com/verify/${certId}`)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Share2 size={14} /> Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ROADMAP ──────────────────────────────────────────────────────────────────

type RoadmapView = "timeline" | "new_path" | "exam_intro" | "exam" | "exam_result";

function Roadmap({
  learningPaths, activePathId, setActivePathId, onAddPath, onCertificateEarned, setPage, setShowCert,
}: {
  learningPaths: LearningPath[];
  activePathId: number | null;
  setActivePathId: (id: number) => void;
  onAddPath: (p: LearningProfile) => void;
  onCertificateEarned: (pathId: number, score: number) => void;
  setPage: (p: Page) => void;
  setShowCert: (p: LearningPath | null) => void;
}) {
  const activePath = learningPaths.find(p => p.id === activePathId) ?? learningPaths[0] ?? null;
  const profile    = activePath?.profile ?? null;

  const [rView, setRView]             = useState<RoadmapView>("timeline");
  const [steps, setSteps]             = useState<RoadmapStep[]>(activePath?.steps ?? []);
  const [loading, setLoading]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [editingOrdre, setEditingOrdre] = useState<number | null>(null);
  const [editVal, setEditVal]         = useState("");
  const [dragIdx, setDragIdx]         = useState<number | null>(null);

  // Exam state
  const [examAnswers, setExamAnswers] = useState<Record<string, string>>({});
  const [examScore, setExamScore]     = useState(0);

  // New path mini-onboarding state
  const [newStep, setNewStep]         = useState(0);
  const [newAnswers, setNewAnswers]   = useState<string[]>(Array(5).fill(""));
  const [newVisible, setNewVisible]   = useState(true);
  const [buildingPath, setBuildingPath] = useState(false);

  useEffect(() => { setSteps(activePath?.steps ?? []); setRView("timeline"); }, [activePathId]);

  const completedCount = steps.filter(s => s.status === "terminé").length;
  const pct            = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;
  const totalHours     = steps.reduce((a, s) => a + s.duree_estimee_heures, 0);
  const hoursPerWeek   = profile ? parseInt(profile.disponibilite) || 4 : 4;
  const weeksEstimate  = profile ? Math.ceil(totalHours / hoursPerWeek) : null;
  const allStepsDone   = steps.length > 0 && completedCount === steps.length;
  const currentStep    = steps.find(s => s.status === "en_cours") || steps.find(s => s.status === "non_commencé");

  const allExercises = (activePath?.modules ?? MOCK_MODULES).flatMap(m => m.lessons.flatMap(l => l.exercises));

  const generate = () => {
    setLoading(true);
    generateRoadmap()
      .then((data) => { setSteps(data.steps); setLoading(false); setShowConfirm(false); })
      .catch((err) => { console.error(err); setLoading(false); });
  };
  
  const insertAfter = (idx: number) => {
    const ns: RoadmapStep = { ordre: idx + 2, titre: "Nouvelle étape", description: "Description à compléter.", duree_estimee_heures: 3, prerequis: [], status: "non_commencé" };
    const updated = [...steps.slice(0, idx + 1), ns, ...steps.slice(idx + 1)].map((s, i) => ({ ...s, ordre: i + 1 }));
    setSteps(updated); setEditingOrdre(idx + 2); setEditVal("Nouvelle étape");
  };

  const saveEdit = (ordre: number) => {
    setSteps(steps.map(s => s.ordre === ordre ? { ...s, titre: editVal } : s));
    setEditingOrdre(null);
  };

  const submitExam = () => {
    const correct = Object.entries(examAnswers).filter(([id, ans]) => {
      const ex = allExercises.find(e => e.id === id);
      return ex?.reponse_attendue === ans;
    }).length;
    const score = Math.round((correct / Math.max(Object.keys(examAnswers).length, 1)) * 100);
    setExamScore(score);
    if (score >= 70 && activePath) onCertificateEarned(activePath.id, score);
    setRView("exam_result");
  };

  const selectNewAnswer = (choice: string) => {
    const next = [...newAnswers]; next[newStep] = choice; setNewAnswers(next);
  };

  const nextNewStep = () => {
    if (newStep < 4) {
      setNewVisible(false);
      setTimeout(() => { setNewStep(s => s + 1); setNewVisible(true); }, 180);
    } else {
      setBuildingPath(true);
      setTimeout(() => {
        onAddPath({ domain: newAnswers[0], niveau: newAnswers[1], disponibilite: newAnswers[2], langue: newAnswers[3], career: newAnswers[4] });
        setRView("timeline"); setBuildingPath(false); setNewStep(0); setNewAnswers(Array(5).fill(""));
      }, 1500);
    }
  };

  // ── New path view ──
  if (rView === "new_path") {
    if (buildingPath) {
      return (
        <div className="flex-1 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 60%, #F0F4FF 100%)" }}>
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-foreground font-medium">Building your new learning path…</p>
          </div>
        </div>
      );
    }
    const stepData = ONBOARDING_STEPS[newStep];
    const selAns   = newAnswers[newStep];
    return (
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 60%, #F0F4FF 100%)" }}>
        <div className="h-14 border-b border-border/40 bg-white/60 backdrop-blur-sm flex items-center px-6 gap-4 shrink-0">
          <button onClick={() => { setRView("timeline"); setNewStep(0); setNewAnswers(Array(5).fill("")); }} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border border-border/60 px-3 py-1.5 rounded-lg bg-white/60 transition-colors">
            <ChevronLeft size={14} /> Back
          </button>
          <h1 className="text-base font-semibold text-foreground">New Learning Path</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md flex gap-1.5 mb-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/60">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: i <= newStep ? "100%" : "0%", background: i <= newStep ? "linear-gradient(90deg, #10B981, #6366F1)" : "transparent" }} />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mb-5">Step {newStep + 1} of 5</p>
          <div className="w-full max-w-md" style={{ opacity: newVisible ? 1 : 0, transform: newVisible ? "translateY(0)" : "translateY(8px)", transition: "opacity 0.18s ease, transform 0.18s ease" }}>
            <div className="bg-white rounded-2xl shadow-lg border border-white/60 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0"><span className="text-white text-xs font-bold">N</span></div>
                <span className="text-xs font-medium text-primary">Nova is asking…</span>
              </div>
              <h2 className="text-base font-semibold text-foreground mb-4">{stepData.question}</h2>
              <div className="space-y-2">
                {stepData.choices.map(choice => {
                  const isSel = selAns === choice;
                  return (
                    <button key={choice} onClick={() => selectNewAnswer(choice)} className={`w-full flex items-center gap-3 border rounded-xl px-4 py-3 text-sm text-left transition-all ${isSel ? "border-indigo-400 bg-indigo-50 text-indigo-800" : "border-gray-200 text-foreground hover:border-indigo-200 hover:bg-indigo-50/40"}`}>
                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${isSel ? "border-indigo-500 bg-indigo-500" : "border-gray-300"}`}>
                        {isSel && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      {choice}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between mt-6">
                <button onClick={() => { if (newStep > 0) { setNewVisible(false); setTimeout(() => { setNewStep(s => s - 1); setNewVisible(true); }, 180); } }} className={`text-sm text-muted-foreground hover:text-foreground transition-colors ${newStep === 0 ? "invisible" : ""}`}>Back</button>
                <button onClick={nextNewStep} disabled={!selAns} className="px-6 py-2.5 rounded-xl text-sm font-medium" style={{ background: selAns ? "linear-gradient(135deg, #1E3A8A, #4F46E5)" : "#E5E7EB", color: selAns ? "white" : "#9CA3AF", cursor: selAns ? "pointer" : "not-allowed" }}>
                  {newStep === 4 ? "Create path" : "Continue"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Exam intro view ──
  if (rView === "exam_intro") {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Final Exam" action={<button onClick={() => setRView("timeline")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-lg"><ChevronLeft size={14} />Roadmap</button>} />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-card border border-border rounded-xl shadow-sm p-8 text-center max-w-sm space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto"><GraduationCap size={22} className="text-primary" /></div>
            <h2 className="text-lg font-semibold text-foreground">All steps completed!</h2>
            <p className="text-sm text-muted-foreground">Pass the final exam to earn your certificate for <span className="font-semibold text-foreground">{profile?.domain}</span>. Pass rate: 70%.</p>
            <p className="text-xs text-muted-foreground">{allExercises.length} questions · ~20 min</p>
            <button onClick={() => { setExamAnswers({}); setRView("exam"); }} className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Start exam</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Exam result view ──
  if (rView === "exam_result") {
    const passed = examScore >= 70;
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Exam Result" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-card border border-border rounded-xl shadow-sm p-8 text-center max-w-sm space-y-5">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${passed ? "bg-emerald-50" : "bg-red-50"}`}>
              {passed ? <Check size={26} className="text-emerald-600" /> : <X size={26} className="text-red-500" />}
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{examScore}%</p>
              <p className="text-sm text-muted-foreground mt-1">{passed ? "Congratulations — you passed!" : "Score insufficient — 70% required."}</p>
            </div>
            {passed && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 justify-center">
                  <Award size={16} className="text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-800">Certificate earned!</span>
                </div>
                <p className="text-xs text-emerald-600">{profile?.domain}</p>
                <button
                  onClick={() => activePath && setShowCert(activePath)}
                  className="w-full mt-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Award size={14} /> View my certificate
                </button>
              </div>
            )}
            <div className="space-y-2">
              {!passed && <button onClick={() => { setExamAnswers({}); setRView("exam"); }} className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Retry</button>}
              <button onClick={() => setRView("timeline")} className="w-full border border-border py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors text-foreground">Back to Roadmap</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Exam view ──
  if (rView === "exam") {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title={`Final Exam — ${Object.keys(examAnswers).length}/${allExercises.length} answered`} />
        <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full space-y-4">
          {allExercises.map((ex, i) => (
            <div key={ex.id} className="bg-card border border-border rounded-lg p-5 shadow-sm">
              <p className="text-sm font-medium text-foreground mb-3">{i + 1}. {ex.question}</p>
              {ex.type === "qcm" ? (
                <div className="space-y-2">
                  {ex.options.map(opt => (
                    <button key={opt} onClick={() => setExamAnswers(prev => ({ ...prev, [ex.id]: opt }))} className={`w-full text-left text-sm px-3 py-2.5 rounded-lg border transition-colors ${examAnswers[ex.id] === opt ? "border-primary bg-secondary text-primary" : "border-border hover:border-primary/40"}`}>{opt}</button>
                  ))}
                </div>
              ) : (
                <textarea value={examAnswers[ex.id] || ""} onChange={e => setExamAnswers(prev => ({ ...prev, [ex.id]: e.target.value }))} rows={3} className="w-full bg-input-background border border-border rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/25" placeholder="Your answer…" />
              )}
            </div>
          ))}
          <button onClick={submitExam} disabled={Object.keys(examAnswers).length < allExercises.length} className={`w-full py-3 rounded-lg text-sm font-medium transition-colors ${Object.keys(examAnswers).length >= allExercises.length ? "bg-primary text-white hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"}`}>
            Submit exam
          </button>
        </div>
      </div>
    );
  }

  // ── Timeline view (main) ──
  if (learningPaths.length === 0) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Roadmap" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4 max-w-sm">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto"><Map size={20} className="text-primary" /></div>
            <h2 className="font-semibold text-foreground">Your roadmap will be generated after onboarding</h2>
            <p className="text-sm text-muted-foreground">Complete your learning profile to get a personalized path.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Roadmap" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-foreground font-medium">Nova AI builds your path…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar
        title="Roadmap"
        action={
          <div className="flex items-center gap-2">
            {learningPaths.length > 1 && (
              <select value={activePathId ?? learningPaths[0]?.id} onChange={e => setActivePathId(Number(e.target.value))} className="text-xs border border-border rounded-lg px-2.5 py-1.5 bg-card focus:outline-none text-foreground max-w-36 truncate">
                {learningPaths.map(p => <option key={p.id} value={p.id}>{p.profile.domain}</option>)}
              </select>
            )}
            <button onClick={() => setShowConfirm(true)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-lg transition-colors">
              <RotateCcw size={13} /> Régénérer
            </button>
          </div>
        }
      />
      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* Header info */}
        <div className="bg-card rounded-lg border border-border shadow-sm p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-1">Your path towards</p>
              <h2 className="text-lg font-semibold text-foreground">{profile?.domain || "Machine Learning"}</h2>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                {profile && <span>{profile.niveau}</span>}
                {weeksEstimate && <span>{weeksEstimate} weeks estimated</span>}
                <span>{totalHours}h content</span>
              </div>
            </div>
            {currentStep && (
              <button onClick={() => setPage("courses")} className="flex items-center gap-2 bg-primary text-white text-sm px-4 py-2.5 rounded-lg hover:bg-primary/90 transition-colors font-medium shrink-0">
                <Play size={13} /> Continue
              </button>
            )}
          </div>
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{completedCount}/{steps.length} steps completed</span>
              <span className="font-semibold text-foreground">{pct}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-1.5 bg-primary rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        {/* Low-score hint */}
        {currentStep && (() => {
          const mod = MOCK_MODULES.find(m => m.titre.toLowerCase().includes(currentStep.titre.split(" ")[0].toLowerCase()));
          const lowLesson = mod?.lessons.find(l => l.status === "terminé" && (l.score ?? 100) < 70);
          return lowLesson ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
              <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800"><span className="font-semibold">To reinforce:</span> your score on «{lowLesson.titre}» was {lowLesson.score}%. Nova AI will redirect you there first.</p>
            </div>
          ) : null;
        })()}

        {/* Timeline */}
        <div className="space-y-0">
          {steps.map((step, idx) => {
            const isCompleted = step.status === "terminé";
            const isCurrent   = step.status === "en_cours";
            return (
              <div key={step.ordre}>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center w-8 shrink-0">
                    <div className={`w-3 h-3 rounded-full border-2 shrink-0 z-10 ${isCompleted ? "bg-emerald-500 border-emerald-500" : isCurrent ? "bg-primary border-primary" : "bg-card border-muted-foreground/30"}`} />
                    {idx < steps.length - 1 && <div className={`w-0.5 flex-1 mt-1 ${isCompleted ? "bg-emerald-200" : "bg-muted"}`} style={{ minHeight: "3rem" }} />}
                  </div>
                  <div
                    className={`flex-1 mb-4 bg-card rounded-lg border shadow-sm p-4 transition-all ${isCurrent ? "border-primary/40 ring-1 ring-primary/10" : isCompleted ? "border-emerald-100" : "border-border"}`}
                    draggable
                    onDragStart={() => setDragIdx(idx)}
                    onDragOver={e => { e.preventDefault(); if (dragIdx !== null && dragIdx !== idx) { const arr = [...steps]; const [moved] = arr.splice(dragIdx, 1); arr.splice(idx, 0, moved); setSteps(arr.map((s, i) => ({ ...s, ordre: i + 1 }))); setDragIdx(idx); } }}
                    onDragEnd={() => setDragIdx(null)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-muted-foreground cursor-grab active:cursor-grabbing mt-0.5 shrink-0"><GripVertical size={14} /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">{String(step.ordre).padStart(2, "0")}</span>
                          {editingOrdre === step.ordre ? (
                            <input autoFocus value={editVal} onChange={e => setEditVal(e.target.value)} onBlur={() => saveEdit(step.ordre)} onKeyDown={e => e.key === "Enter" && saveEdit(step.ordre)} className="flex-1 text-sm font-medium bg-input-background border border-primary/30 rounded px-2 py-0.5 focus:outline-none" />
                          ) : (
                            <span className="text-sm font-medium text-foreground">{step.titre}</span>
                          )}
                          {isCompleted && <Check size={13} className="text-emerald-500 shrink-0" />}
                          {isCurrent && <span className="text-xs text-primary bg-secondary px-1.5 py-0.5 rounded font-medium">In progress</span>}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed ml-7">{step.description}</p>
                        <p className="text-xs text-muted-foreground mt-1.5 ml-7">{step.duree_estimee_heures}h estimated</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => { setEditingOrdre(step.ordre); setEditVal(step.titre); }} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-muted"><Edit3 size={12} /></button>
                        {(isCompleted || isCurrent) && (
                          <button onClick={() => setPage("courses")} className="flex items-center gap-1 text-xs text-primary hover:underline underline-offset-2 px-2 py-1 rounded hover:bg-secondary transition-colors">
                            Exercises <ChevronRight size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div className="flex gap-4 -mt-2 mb-0">
                    <div className="w-8 flex justify-center"><div className="w-px h-full" /></div>
                    <button onClick={() => insertAfter(idx)} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 py-1 transition-colors opacity-0 hover:opacity-100 hover:bg-muted px-2 rounded">
                      <Plus size={11} /> Insert step
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── 3-state certification block ── */}
        {activePath?.certificate ? (
          /* State 3 — Certificate earned */
          <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/60 shadow-sm p-5 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Award size={22} className="text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-sm font-semibold text-emerald-800">Certificat obtenu</h3>
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">{activePath.certificate.date}</span>
                </div>
                <p className="text-xs text-emerald-700">{profile?.domain} &nbsp;·&nbsp; Score : <span className="font-semibold">{activePath.certificate.score}%</span></p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCert(activePath)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
              >
                <Award size={14} /> Voir mon certificat
              </button>
              <button
                onClick={() => window.alert("Téléchargement PDF — intégration backend /api/certificate/download/ requise.")}
                className="flex-1 flex items-center justify-center gap-1.5 border border-emerald-300 text-emerald-700 hover:bg-emerald-100 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                <Download size={14} /> Télécharger le PDF
              </button>
            </div>
          </div>
        ) : allStepsDone ? (
          /* State 2 — All steps done, exam unlocked */
          <div className="rounded-xl border-2 border-primary/30 bg-card shadow-sm p-5 ring-1 ring-primary/10">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <GraduationCap size={22} className="text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground">Tu as terminé tous les modules !</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Passe l'examen final pour obtenir ton certificat <span className="font-medium text-foreground">{profile?.domain}</span>.</p>
              </div>
            </div>
            <button
              onClick={() => setRView("exam_intro")}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Passer l'examen final <ChevronRight size={14} />
            </button>
          </div>
        ) : (
          /* State 1 — Steps still pending */
          <div className="rounded-xl border-2 border-border bg-muted/20 shadow-sm p-5 opacity-70">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Lock size={18} className="text-muted-foreground/50" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground">Examen final — verrouillé</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Termine les <span className="font-semibold text-foreground">{steps.length - completedCount}</span> module{steps.length - completedCount > 1 ? "s" : ""} restant{steps.length - completedCount > 1 ? "s" : ""} pour débloquer l'examen final et obtenir ton certificat.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Other learning paths' certificates */}
        {learningPaths.filter(p => p.id !== activePath?.id && p.certificate).length > 0 && (
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
              <Award size={14} className="text-emerald-500" />
              <h2 className="text-sm font-semibold text-foreground">Autres certificats</h2>
            </div>
            <div className="divide-y divide-border">
              {learningPaths.filter(p => p.id !== activePath?.id && p.certificate).map(p => (
                <div key={p.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <Award size={14} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{p.profile.domain}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.certificate!.score}% · {p.certificate!.date}</p>
                  </div>
                  <button
                    onClick={() => setShowCert(p)}
                    className="shrink-0 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Award size={11} /> Voir
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Learn something new */}
        <button
          onClick={() => { setRView("new_path"); setNewStep(0); setNewAnswers(Array(5).fill("")); setNewVisible(true); }}
          className="w-full bg-card rounded-lg border-2 border-dashed border-border shadow-sm p-5 hover:border-primary/40 hover:bg-secondary/20 transition-colors group text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-secondary transition-colors">
              <Plus size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Learn something new</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Start a new learning path on a different topic — {learningPaths.length} active path{learningPaths.length !== 1 ? "s" : ""}.</p>
            </div>
          </div>
        </button>
      </div>

      {/* Confirm regen modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center shrink-0"><AlertTriangle size={16} className="text-amber-600" /></div>
              <h2 className="font-semibold text-foreground">Regenerate roadmap?</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-5">This will replace your current roadmap. Manual edits will be lost.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 text-sm border border-border rounded-lg text-foreground hover:bg-muted transition-colors">Cancel</button>
              <button onClick={generate} className="flex-1 py-2.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium">Regenerate</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ─── COURSES ─────────────────────────────────────────────────────────────────

type CoursesView = "modules" | "module" | "lesson" | "exercises" | "exam_intro" | "exam" | "certificate";

function Courses({ modules: initialModules }: { modules: CourseModule[] }) {
  const [modules, setModules]           = useState<CourseModule[]>(initialModules);
  const [view, setView]                 = useState<CoursesView>("modules");
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [lessonRead, setLessonRead]     = useState(false);
  const [exIdx, setExIdx]               = useState(0);
  const [answer, setAnswer]             = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [exScore, setExScore]           = useState(0);
  const [examAnswers, setExamAnswers]   = useState<Record<string, string>>({});
  const [examDone, setExamDone]         = useState(false);
  const [examScore, setExamScore]       = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Keep the page in sync when a roadmap is regenerated without changing its id.
  useEffect(() => { setModules(initialModules); }, [initialModules]);

  const selectedModule = modules.find(m => m.id === selectedModuleId);
  const selectedLesson = selectedModule?.lessons.find(l => l.id === selectedLessonId);
  const exercises      = selectedLesson?.exercises ?? [];

  const goToModule = (id: string) => {
    const mod = modules.find(m => m.id === id);
    if (!mod || mod.status === "verrouillé") return;
    setSelectedModuleId(id);
    setView("module");
  };

  const goToLesson = (lessonId: string) => {
    const lesson = selectedModule?.lessons.find(l => l.id === lessonId);
    if (!lesson || lesson.status === "verrouillé") return;
    setSelectedLessonId(lessonId);
    setLessonRead(false);
    setView("lesson");
  };

  const startExercises = () => {
    setExIdx(0);
    setAnswer("");
    setSelectedOption("");
    setShowFeedback(false);
    setExScore(0);
    setView("exercises");
  };

  const submitAnswer = () => {
    const ex = exercises[exIdx];
    const correct = ex.type === "qcm" ? selectedOption === ex.reponse_attendue : answer.trim().length > 20;
    if (correct) setExScore(s => s + 1);
    setShowFeedback(true);
  };

  const nextExercise = () => {
    if (exIdx + 1 < exercises.length) {
      setExIdx(exIdx + 1);
      setAnswer("");
      setSelectedOption("");
      setShowFeedback(false);
    } else {
      // Finish — mark lesson as done
      const finalScore = Math.round(((exScore + (showFeedback && (exercises[exIdx].type === "qcm" ? selectedOption === exercises[exIdx].reponse_attendue : answer.trim().length > 20) ? 1 : 0)) / exercises.length) * 100);
      setModules(prev => prev.map(mod => mod.id === selectedModuleId ? {
        ...mod,
        lessons: mod.lessons.map(l => l.id === selectedLessonId ? { ...l, status: "terminé" as const, score: finalScore } : l),
      } : mod));
      setView("module");
    }
  };

  const allModulesDone = modules.every(m => m.status === "terminé" || modules.indexOf(m) === modules.length - 1);

  const startExam = () => { setExamAnswers({}); setExamDone(false); setView("exam"); };

  const submitExam = () => {
    const allExercises = modules.flatMap(m => m.lessons.flatMap(l => l.exercises));
    const correct = Object.entries(examAnswers).filter(([id, ans]) => {
      const ex = allExercises.find(e => e.id === id);
      return ex?.reponse_attendue === ans;
    }).length;
    const total = Object.keys(examAnswers).length || 1;
    setExamScore(Math.round((correct / total) * 100));
    setExamDone(true);
  };

  // ── Views ──

  if (view === "certificate") {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Certificat" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-card border border-border rounded-xl shadow-sm p-10 text-center max-w-md space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
              <Award size={28} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Certificat de réussite</h2>
              <p className="text-sm text-muted-foreground mt-1">Nova AI certifie que</p>
              <p className="text-base font-semibold text-primary mt-1">{CURRENT_USER.name}</p>
              <p className="text-sm text-muted-foreground mt-1">a complété avec succès le parcours d'apprentissage</p>
            </div>
            <div className="border-t border-border pt-4 text-xs text-muted-foreground">
              Score à l'examen final : <span className="font-semibold text-foreground">{examScore}%</span> · {new Date().toLocaleDateString("fr-FR")}
            </div>
            <button onClick={() => setView("modules")} className="text-sm text-primary hover:underline underline-offset-2">Retour aux modules</button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "exam" || view === "exam_intro") {
    const allEx = modules.flatMap(m => m.lessons.flatMap(l => l.exercises));
    if (view === "exam_intro") {
      return (
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar title="Examen final" action={<button onClick={() => setView("modules")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-lg"><ChevronLeft size={14} />Retour</button>} />
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="bg-card border border-border rounded-xl shadow-sm p-8 text-center max-w-sm space-y-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto"><GraduationCap size={22} className="text-primary" /></div>
              <h2 className="text-lg font-semibold text-foreground">Tu as terminé tous les modules !</h2>
              <p className="text-sm text-muted-foreground">Passe l'examen final pour obtenir ton certificat. Seuil de réussite : 70%.</p>
              <div className="text-xs text-muted-foreground">{allEx.length} questions · durée estimée 20 min</div>
              <button onClick={startExam} className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Commencer l'examen</button>
            </div>
          </div>
        </div>
      );
    }

    if (examDone) {
      return (
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar title="Résultat — Examen final" />
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="bg-card border border-border rounded-xl shadow-sm p-8 text-center max-w-sm space-y-5">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${examScore >= 70 ? "bg-emerald-50" : "bg-red-50"}`}>
                {examScore >= 70 ? <Check size={26} className="text-emerald-600" /> : <X size={26} className="text-red-500" />}
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{examScore}%</p>
                <p className="text-sm text-muted-foreground mt-1">{examScore >= 70 ? "Félicitations, vous avez réussi !" : "Score insuffisant — seuil de 70% requis."}</p>
              </div>
              {examScore >= 70 ? (
                <button onClick={() => setView("certificate")} className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Voir mon certificat</button>
              ) : (
                <button onClick={() => setView("exam_intro")} className="w-full border border-border py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors">Réessayer</button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title={`Examen final — Question ${Object.keys(examAnswers).length + 1}/${allEx.length}`} />
        <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full space-y-4">
          {allEx.map((ex, i) => (
            <div key={ex.id} className="bg-card border border-border rounded-lg p-5 shadow-sm">
              <p className="text-sm font-medium text-foreground mb-3">{i + 1}. {ex.question}</p>
              {ex.type === "qcm" ? (
                <div className="space-y-2">
                  {ex.options.map(opt => (
                    <button key={opt} onClick={() => setExamAnswers(prev => ({ ...prev, [ex.id]: opt }))} className={`w-full text-left text-sm px-3 py-2.5 rounded-lg border transition-colors ${examAnswers[ex.id] === opt ? "border-primary bg-secondary text-primary" : "border-border hover:border-primary/40"}`}>{opt}</button>
                  ))}
                </div>
              ) : (
                <textarea value={examAnswers[ex.id] || ""} onChange={e => setExamAnswers(prev => ({ ...prev, [ex.id]: e.target.value }))} rows={3} className="w-full bg-input-background border border-border rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/25" placeholder="Votre réponse…" />
              )}
            </div>
          ))}
          <button onClick={submitExam} disabled={Object.keys(examAnswers).length < allEx.length} className={`w-full py-3 rounded-lg text-sm font-medium transition-colors ${Object.keys(examAnswers).length >= allEx.length ? "bg-primary text-white hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"}`}>
            Soumettre l'examen
          </button>
        </div>
      </div>
    );
  }

  if (view === "exercises" && selectedLesson) {
    const ex = exercises[exIdx];
    const isCorrect = ex.type === "qcm" ? selectedOption === ex.reponse_attendue : answer.trim().length > 20;
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title={`Exercices — ${selectedLesson.titre}`} action={
          <button onClick={() => setView("lesson")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-lg"><ChevronLeft size={14} />Leçon</button>
        } />
        <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full">
          {/* Progress */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-1.5 bg-primary rounded-full transition-all" style={{ width: `${(exIdx / exercises.length) * 100}%` }} />
            </div>
            <span className="text-xs text-muted-foreground">{exIdx + 1}/{exercises.length}</span>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 shadow-sm space-y-5">
            <p className="text-sm font-semibold text-foreground leading-relaxed">{ex.question}</p>
            {ex.type === "qcm" ? (
              <div className="space-y-2">
                {ex.options.map(opt => (
                  <button key={opt} onClick={() => !showFeedback && setSelectedOption(opt)} className={`w-full text-left text-sm px-4 py-3 rounded-lg border transition-colors ${showFeedback && opt === ex.reponse_attendue ? "border-emerald-400 bg-emerald-50 text-emerald-800" : showFeedback && opt === selectedOption && opt !== ex.reponse_attendue ? "border-red-300 bg-red-50 text-red-700" : selectedOption === opt ? "border-primary bg-secondary text-primary" : "border-border hover:border-primary/40"}`}>
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <textarea value={answer} onChange={e => !showFeedback && setAnswer(e.target.value)} rows={4} className="w-full bg-input-background border border-border rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/25" placeholder="Votre réponse…" />
            )}

            {showFeedback && (
              <div className={`rounded-lg p-4 text-sm space-y-1 ${isCorrect ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}>
                <p className={`font-semibold ${isCorrect ? "text-emerald-700" : "text-amber-700"}`}>{isCorrect ? "Correct !" : "Pas tout à fait…"}</p>
                {ex.explication && <p className={`text-xs leading-relaxed ${isCorrect ? "text-emerald-600" : "text-amber-600"}`}>{ex.explication}</p>}
                {!isCorrect && ex.type === "qcm" && <p className="text-xs text-amber-600">Bonne réponse : <span className="font-medium">{ex.reponse_attendue}</span></p>}
              </div>
            )}

            {!showFeedback ? (
              <button onClick={submitAnswer} disabled={ex.type === "qcm" ? !selectedOption : !answer.trim()} className={`w-full py-2.5 text-sm rounded-lg font-medium transition-colors ${(ex.type === "qcm" ? selectedOption : answer.trim()) ? "bg-primary text-white hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"}`}>
                Valider
              </button>
            ) : (
              <button onClick={nextExercise} className="w-full py-2.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center justify-center gap-1.5">
                {exIdx + 1 < exercises.length ? "Question suivante" : "Terminer les exercices"} <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === "lesson" && selectedLesson) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title={selectedLesson.titre} action={
          <button onClick={() => setView("module")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-lg"><ChevronLeft size={14} />Module</button>
        } />
        <div className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full space-y-5">
          <div className="bg-card rounded-lg border border-border shadow-sm p-6" ref={contentRef} onScroll={e => { const el = e.currentTarget; if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) setLessonRead(true); }}>
            {selectedLesson.content.split("\n\n").map((paragraph, i) => {
              if (paragraph.startsWith("```")) {
                const code = paragraph.replace(/```\w*\n?/, "").replace(/```$/, "");
                return <pre key={i} className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto my-4 text-foreground">{code}</pre>;
              }
              const formatted = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
              return <p key={i} className="text-sm text-foreground leading-relaxed mb-3" dangerouslySetInnerHTML={{ __html: formatted }} />;
            })}
          </div>
          {selectedLesson.exercises.length > 0 && (
            <div>
              {!lessonRead && <p className="text-xs text-muted-foreground text-center mb-3">Faites défiler le contenu pour accéder aux exercices.</p>}
              <button onClick={startExercises} disabled={!lessonRead} className={`w-full py-3 rounded-lg text-sm font-medium transition-colors ${lessonRead ? "bg-primary text-white hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"}`}>
                Passer aux exercices
              </button>
            </div>
          )}
          {selectedLesson.exercises.length === 0 && (
            <button onClick={() => setView("module")} className="w-full py-3 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-colors">
              Retour au module
            </button>
          )}
        </div>
      </div>
    );
  }

  if (view === "module" && selectedModule) {
    const completedLessons = selectedModule.lessons.filter(l => l.status === "terminé").length;
    const modulePct = Math.round((completedLessons / selectedModule.lessons.length) * 100);
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title={selectedModule.titre} action={
          <button onClick={() => setView("modules")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-lg"><ChevronLeft size={14} />Modules</button>
        } />
        <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-2xl mx-auto w-full">
          {/* Module progress */}
          <div className="bg-card rounded-lg border border-border shadow-sm p-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>{completedLessons}/{selectedModule.lessons.length} cours terminés</span>
              <span className="font-semibold text-foreground">{modulePct}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-1.5 bg-primary rounded-full transition-all" style={{ width: `${modulePct}%` }} />
            </div>
          </div>

          {/* Lessons list */}
          <div className="bg-card rounded-lg border border-border shadow-sm divide-y divide-border overflow-hidden">
            {selectedModule.lessons.map((lesson, idx) => {
              const isLocked   = lesson.status === "verrouillé";
              const isDone     = lesson.status === "terminé";
              const prevDone   = idx === 0 || selectedModule.lessons[idx - 1].status === "terminé";
              const canOpen    = !isLocked && (idx === 0 || prevDone);
              return (
                <button key={lesson.id} onClick={() => canOpen && goToLesson(lesson.id)} disabled={!canOpen} className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors ${canOpen ? "hover:bg-muted/30" : "opacity-60 cursor-not-allowed"}`}>
                  <div className="shrink-0">
                    {isDone ? <CheckCircle2 size={18} className="text-emerald-500" /> : isLocked ? <Lock size={16} className="text-muted-foreground/40" /> : <Play size={16} className="text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{lesson.titre}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{lesson.duree_min} min</p>
                  </div>
                  {lesson.score !== undefined && <ScoreBadge score={lesson.score} />}
                  {canOpen && !isDone && <ChevronRight size={14} className="text-muted-foreground shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Module list view ──
  const allModulesTerminated = modules.every(m => m.status === "terminé");
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Courses" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-2xl mx-auto w-full">
        {modules.map((mod, idx) => {
          const isLocked = mod.status === "verrouillé";
          const isDone   = mod.status === "terminé";
          const isCurrent = !isDone && !isLocked;
          const completedL = mod.lessons.filter(l => l.status === "terminé").length;
          const pct = Math.round((completedL / mod.lessons.length) * 100);
          return (
            <div key={mod.id} onClick={() => goToModule(mod.id)} className={`bg-card rounded-lg border border-border shadow-sm p-5 transition-all ${isLocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:shadow-md"} ${isCurrent ? "border-primary/40 ring-1 ring-primary/10" : ""}`}>
              <div className="flex items-start gap-4">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isDone ? "bg-emerald-50" : isCurrent ? "bg-primary/10" : "bg-muted"}`}>
                  {isDone ? <CheckCircle2 size={18} className="text-emerald-500" /> : isLocked ? <Lock size={16} className="text-muted-foreground/40" /> : <BookOpen size={18} className="text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-sm font-semibold text-foreground">{mod.titre}</h3>
                    {isCurrent && <span className="text-xs font-medium text-primary bg-secondary px-1.5 py-0.5 rounded">En cours</span>}
                    {isDone && <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Terminé</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{mod.description} · {mod.lessons.length} cours</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{completedL}/{mod.lessons.length} cours terminés</span>
                      <span className="font-semibold text-foreground">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-1.5 rounded-full transition-all ${isDone ? "bg-emerald-500" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Final exam card */}
        <div className={`bg-card rounded-lg border shadow-sm p-5 transition-all ${allModulesTerminated ? "border-primary/40 cursor-pointer hover:shadow-md" : "border-border opacity-50 cursor-not-allowed"}`} onClick={() => allModulesTerminated && setView("exam_intro")}>
          <div className="flex items-center gap-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${allModulesTerminated ? "bg-primary/10" : "bg-muted"}`}>
              <GraduationCap size={18} className={allModulesTerminated ? "text-primary" : "text-muted-foreground/40"} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">Examen final</h3>
              <p className="text-xs text-muted-foreground">{allModulesTerminated ? "Disponible — obtenez votre certificat" : "Se débloque après tous les modules"}</p>
            </div>
            {allModulesTerminated ? <ChevronRight size={14} className="text-muted-foreground" /> : <Lock size={14} className="text-muted-foreground/40" />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── HISTORY ──────────────────────────────────────────────────────────────────

function History({
  certHistory,
  learningPaths,
  onViewCert,
}: {
  certHistory: CertHistoryItem[];
  learningPaths: LearningPath[];
  onViewCert: (path: LearningPath) => void;
}) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Historique" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-card rounded-lg border border-border shadow-sm divide-y divide-border overflow-hidden max-w-2xl">
          {/* Certificate entries — newest first, at top */}
          {certHistory.slice().reverse().map(cert => {
            const path = learningPaths.find(p => p.id === cert.pathId);
            return (
              <div
                key={cert.id}
                onClick={() => path && onViewCert(path)}
                className="flex items-start gap-4 px-5 py-4 hover:bg-muted/20 transition-colors cursor-pointer"
              >
                <div className="mt-0.5 p-2 rounded-lg shrink-0 bg-amber-50">
                  <Award size={13} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Certificat obtenu : {cert.domain}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{cert.date}</p>
                  <p className="text-xs text-primary mt-1.5">Cliquer pour voir le certificat</p>
                </div>
                <ChevronRight size={14} className="text-muted-foreground mt-1 shrink-0" />
              </div>
            );
          })}
          {/* Static history */}
          {HISTORY_ITEMS.map(item => (
            <div key={item.id} className="flex items-start gap-4 px-5 py-4 hover:bg-muted/20 transition-colors cursor-pointer">
              <div className={`mt-0.5 p-2 rounded-lg shrink-0 ${item.type === "conversation" ? "bg-secondary" : "bg-emerald-50"}`}>
                {item.type === "conversation" ? <MessageSquare size={13} className="text-primary" /> : <TrendingUp size={13} className="text-emerald-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.date}</p>
                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{item.preview}</p>
              </div>
              <ChevronRight size={14} className="text-muted-foreground mt-1 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────

function AppSettings({ profile }: { profile: LearningProfile | null }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Paramètres" />
      <div className="flex-1 overflow-y-auto p-6 space-y-5 max-w-xl">
        <div className="bg-card rounded-lg border border-border shadow-sm p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Profil</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-base font-semibold">{CURRENT_USER.initials}</div>
              <div>
                <p className="text-sm font-medium text-foreground">{CURRENT_USER.name}</p>
                <p className="text-xs text-muted-foreground">{CURRENT_USER.email}</p>
              </div>
            </div>
          </div>
        </div>
        {profile && (
          <div className="bg-card rounded-lg border border-border shadow-sm p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Profil d'apprentissage</h2>
            <dl className="space-y-3">
              {[["Goal", profile.domain], ["Level", profile.niveau], ["Weekly time", profile.disponibilite], ["Language", profile.langue], ["Career objective", profile.career]].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="text-xs font-medium text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
        <div className="bg-card rounded-lg border border-border shadow-sm p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Préférences</h2>
          {[["Notifications e-mail", true], ["Rappels hebdomadaires", true], ["Suggestions IA automatiques", false]].map(([label, val]) => (
            <div key={label as string} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
              <span className="text-sm text-foreground">{label as string}</span>
              <div className={`w-9 h-5 rounded-full relative transition-colors ${val ? "bg-primary" : "bg-muted"}`}>
                <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${val ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [firstName, setFirstName]             = useState("");
  const [learningPaths, setLearningPaths]     = useState<LearningPath[]>([]);
  const [activePathId, setActivePathId]       = useState<number | null>(null);
  const [page, setPage]                       = useState<Page>("dashboard");
const [tasks, setTasks]                     = useState<Task[]>([]);
const [projects, setProjects]               = useState<Project[]>([]);  const [pinnedProject, setPinnedProject]     = useState<PinnedProject | null>(null);
  const [showCert, setShowCert]               = useState<LearningPath | null>(null);
  const [certHistory, setCertHistory]         = useState<CertHistoryItem[]>([]);

  const activePath = learningPaths.find(p => p.id === activePathId) ?? learningPaths[0] ?? null;
useEffect(() => {
  if (!isAuthenticated) return;
  getTasks().then(setTasks).catch(err => console.error("Erreur chargement tâches:", err));
  getProjects().then(setProjects).catch(err => console.error("Erreur chargement projets:", err));
  getRoadmap()
  .then((data) => {
    const path: LearningPath = {
      id: data.id,
      profile: { domain: "", niveau: "", disponibilite: "", langue: "", career: "" },
      steps: data.steps,
      modules: data.modules,
    };
    setLearningPaths([path]);
    setActivePathId(path.id);
  })
  .catch(() => {
    // Pas de roadmap existante = utilisateur pas encore passé par l'onboarding, rien à faire
  });

}, [isAuthenticated]);
  if (!isAuthenticated) {
    return (
      <Login onLogin={(isNew, fName) => {
        setFirstName(fName);
        setIsAuthenticated(true);
        if (isNew) setNeedsOnboarding(true);
      }} />
    );
  }

  if (needsOnboarding) {
    return (
      <Onboarding
        firstName={firstName}
        onComplete={async (p) => {
          try {
            await saveLearningProfile(p);
            const roadmapData = await generateRoadmap();
            const newPath: LearningPath = {
              id: Date.now(),
              profile: p,
              steps: roadmapData.steps,
              modules: roadmapData.modules,
            };
            setLearningPaths([newPath]);
            setActivePathId(newPath.id);
          } catch (err) {
            console.error("Erreur génération roadmap:", err);
          } finally {
            setNeedsOnboarding(false);
            setPage("roadmap");
          }
        }}
      />
    );
  }

  const handleAddPath = async (p: LearningProfile) => {
    try {
      await saveLearningProfile(p);
      const roadmapData = await generateRoadmap();
      const newPath: LearningPath = {
        id: Date.now(),
        profile: p,
        steps: roadmapData.steps,
        modules: roadmapData.modules,
      };
      setLearningPaths(prev => [...prev, newPath]);
      setActivePathId(newPath.id);
    } catch (err) {
      console.error("Erreur génération roadmap:", err);
    }
  };

  const handleCertificateEarned = (pathId: number, score: number) => {
    const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const domain = learningPaths.find(p => p.id === pathId)?.profile.domain ?? "Learning";
    setLearningPaths(prev => prev.map(p => p.id === pathId ? { ...p, certificate: { score, date } } : p));
    setCertHistory(prev => [...prev, { id: Date.now(), pathId, domain, date, score }]);
  };

  const handleDiscussProject = (p: Project) => {
    setPinnedProject({ id: p.id, name: p.name, desc: p.desc });
    setPage("chat");
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar page={page} setPage={setPage} onLogout={() => { setIsAuthenticated(false); setNeedsOnboarding(false); setLearningPaths([]); setActivePathId(null); setPinnedProject(null); }} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {page === "dashboard" && <Dashboard tasks={tasks} projects={projects} setPage={setPage} />}
        {page === "roadmap"   && (
          <Roadmap
            learningPaths={learningPaths}
            activePathId={activePathId}
            setActivePathId={setActivePathId}
            onAddPath={handleAddPath}
            onCertificateEarned={handleCertificateEarned}
            setPage={setPage}
            setShowCert={setShowCert}
          />
        )}
        {page === "courses"   && <Courses key={activePathId ?? 0} modules={activePath?.modules?.length ? activePath.modules : MOCK_MODULES} />}
        {page === "projects"  && (
          <Projects
            tasks={tasks} setTasks={setTasks}
            projects={projects} setProjects={setProjects}
            onDiscussProject={handleDiscussProject}
            setPage={setPage}
          />
        )}
        {page === "tasks"    && <Tasks tasks={tasks} setTasks={setTasks} />}
        {page === "chat"     && <Chat pinnedProject={pinnedProject} onClearProject={() => setPinnedProject(null)} tasks={tasks} setTasks={setTasks} projects={projects} setProjects={setProjects} />}
        {page === "history"  && (
          <History
            certHistory={certHistory}
            learningPaths={learningPaths}
            onViewCert={setShowCert}
          />
        )}
        {page === "settings" && <AppSettings profile={activePath?.profile ?? null} />}
      </main>
      {showCert && <CertificateModal path={showCert} onClose={() => setShowCert(null)} />}
    </div>
  );
}
