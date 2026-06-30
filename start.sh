#!/bin/bash

# Arrêter le script en cas d'erreur
set -e

# Se placer dans le dossier racine du projet
cd "$(dirname "$0")"
ROOT_DIR=$(pwd)

echo "=========================================================="
echo "   Démarrage de ATM AI Dashboard (secondAIProjectThales)"
echo "=========================================================="

# 1. Vérification et installation des dépendances du Frontend
echo -e "\n[1/3] Configuration du Frontend (Next.js)..."
cd "$ROOT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    echo "-> Installation des dépendances npm pour le frontend..."
    npm install
else
    echo "-> Les dépendances du frontend sont déjà installées."
fi

# 2. Vérification et installation des dépendances du Backend
echo -e "\n[2/3] Configuration du Backend (FastAPI)..."
cd "$ROOT_DIR/backend"
if [ ! -d ".venv" ]; then
    echo "-> Création de l'environnement virtuel (.venv)..."
    python3 -m venv .venv
fi
echo "-> Installation des dépendances Python..."
.venv/bin/pip install -r requirements.txt

# 3. Démarrage des serveurs en parallèle
echo -e "\n[3/3] Démarrage des serveurs..."
echo "----------------------------------------------------------"
echo "  Frontend : http://localhost:3000"
echo "  Backend  : http://localhost:8000"
echo "----------------------------------------------------------"
echo "Appuyez sur CTRL+C pour arrêter les deux serveurs à tout moment."
echo ""

# Fonction de nettoyage pour tuer les processus en tâche de fond lors du CTRL+C
cleanup() {
    echo -e "\n\n-> Arrêt des serveurs backend et frontend..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Lancement du Backend (FastAPI)
cd "$ROOT_DIR"
PYTHONPATH=. ./backend/.venv/bin/uvicorn backend.main:app --host 127.0.0.1 --port 8000 > /dev/null 2>&1 &
BACKEND_PID=$!

# Lancement du Frontend (Next.js)
cd "$ROOT_DIR/frontend"
npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!

# Attendre la fin des deux processus
wait
