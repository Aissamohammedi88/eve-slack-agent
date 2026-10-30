;;; Directory Local Variables            -*- no-byte-compile: t -*-
;;; For more information see (info "(emacs) Directory Variables")

;; ══════════════════════════════════════════════════════════════════════════════
;; EVE-SLACK-AGENT — Emacs Project Configuration
;; Author: Aissa Mohammedi (DGK)
;; Standard: NEXUS-OPEN-3.0
;; ══════════════════════════════════════════════════════════════════════════════

(
 ;; ─── RÈGLES GLOBALES (Appliquées à tous les modes) ──────────────────────────
 (nil
  . (
     ;; 1. Typographie : Pas de tabulations, 4 espaces par défaut, ligne max 100 chars.
     (indent-tabs-mode . nil)
     (tab-width . 4)
     (fill-column . 100)
     
     ;; 2. Environnement virtuel Python : Ajoute automatiquement ./.venv/bin au PATH
     ;; Cela permet à Emacs de trouver le bon interpréteur, ruff, mypy, etc.
     (eval . (when (file-directory-p (expand-file-name ".venv/bin" (dir-locals-find-file default-directory)))
               (setenv "VIRTUAL_ENV" (expand-file-name ".venv" (dir-locals-find-file default-directory)))
               (setq exec-path (append (list (expand-file-name ".venv/bin" (dir-locals-find-file default-directory))) exec-path))))
     
     ;; 3. Formatage à la sauvegarde (si tu utilises apheleia ou format-all)
     ;; Force l'utilisation de Ruff pour Python et Prettier pour JS.
     (eval . (when (fboundp 'apheleia-global-mode)
               (setq-local apheleia-formatters '((python . "ruff format -")))))
     
     ;; 4. Commande de compilation par défaut (M-x compile)
     ;; Détecte automatiquement le type de projet pour lancer le bon build.
     (compile-command . "make test")
     )
  )

 ;; ─── CONFIGURATION PYTHON ───────────────────────────────────────────────────
 (python-mode
  . (
     (python-indent-offset . 4)
     (python-shell-interpreter . "python3")
     ;; Force l'utilisation de Ruff pour le linting au lieu de flake8
     (flycheck-python-flake8-executable . "ruff")
     )
  )
 (python-ts-mode
  . (
     (python-indent-offset . 4)
     (python-shell-interpreter . "python3")
     )
  )

 ;; ─── CONFIGURATION JAVASCRIPT / TYPESCRIPT ──────────────────────────────────
 (js-mode
  . (
     (js-indent-level . 2)
     (js2-basic-offset . 2)
     (prettier-js-command . "npx prettier")
     )
  )
 (typescript-mode
  . (
     (typescript-indent-level . 2)
     )
  )
 (js-ts-mode
  . (
     (js-indent-level . 2)
     )
  )
 (tsx-ts-mode
  . (
     (typescript-indent-level . 2)
     )
  )

 ;; ─── CONFIGURATION YAML (Pour les workflows GitHub et configs Slack) ────────
 (yaml-mode
  . (
     (yaml-indent-offset . 2)
     )
  )

 ;; ─── CONFIGURATION MARKDOWN (Pour la documentation Eve) ─────────────────────
 (markdown-mode
  . (
     (fill-column . 80)
     )
  )
)
