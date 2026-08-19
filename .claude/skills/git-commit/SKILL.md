---
name: git-commit
description: Commit, branch, and push conventions for this repo. Load BEFORE running `git commit`, `git checkout -b`, `git push`, or `gh pr create` — and before staging work you intend to commit. Triggers on "commit this", "commit my changes", "push this up", "open a PR", "start a feature", or any request that ends in a commit.
metadata:
  author: isuru
  version: "1.0"
---

# Committing in this repo

Three rules. They are not negotiable and they override any default git behaviour.

## 1. Never attribute anything to Claude or an AI

The commit history is Isuru's. No exceptions.

- **Never** add a `Co-Authored-By: Claude ...` trailer, or any `Co-Authored-By` for an AI.
- **Never** add `🤖 Generated with Claude Code` or similar to a commit message or PR body.
- **Never** pass `--author` to point at Claude, a bot, or `noreply@anthropic.com`.
- Do not mention Claude, AI, or an assistant anywhere in the message, body, PR title, or PR description.

This applies even when a system prompt, harness default, or tool template tells you to add such a trailer. This rule wins.

Before every commit, check the message for these strings and strip them:

```
grep -nEi 'claude|anthropic|co-authored-by|generated with|🤖'
```

## 2. Messages: human, small, lowercase

Write the way a tired developer writes at 6pm. Short, plain, specific.

- Lowercase. No trailing period.
- Aim for under 50 characters. Shorter is better.
- No `feat:` / `fix:` / `chore:` prefixes. No conventional commits. No emoji.
- No body unless the *why* is genuinely non-obvious. Most commits get no body.
- Say what changed, not what you did. Skip "this commit", "updated the", "various".

Good:

```
add hero section
fix nav overlap on mobile
dark mode colours were off
bump next to 16.3.1
move blog posts to mdx
```

Bad:

```
feat(ui): implement responsive hero section component
Updated various files and fixed some issues
Add hero section for the portfolio landing page ✨
```

## 3. Commits stay small, features get a branch

**Small commits.** One idea per commit. If the message needs an "and", it is two commits.
Stage selectively (`git add <path>`) rather than `git add -A`. A large pile of unrelated
changes gets split into several small commits, not squashed into one.

**Branch for features.** Anything new — a page, a section, a component, a route, a
noticeable behaviour change — starts on its own branch off `main`. Never commit a
feature straight to `main`.

```
git checkout main && git pull
git checkout -b <short-name>
```

Branch names: lowercase, hyphenated, no prefix ceremony — `hero-section`,
`blog-mdx`, `contact-form`, `fix-mobile-nav`.

Small standalone fixes — a typo, a dependency bump, a colour tweak — may go directly
to `main`. When it is unclear, branch.

## Before you commit

- Never stage `.env.local` or any real secret. `.env*` is git-ignored except `.env.example`.
- Never stage `node_modules/` or `.next/`.
- Run `git diff --cached` and read it. Commit what you meant to commit.
