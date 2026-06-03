# The Weeds Website — Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Get the Weeds band website into version control, deployed on Netlify, and documented for future Claude Code sessions.

**Architecture:** Static single-page site (plain HTML + Tailwind CDN + GSAP). No build step. Edit files and push — Netlify auto-deploys from `main`. Light parchment theme is default; dark theme archived.

**Tech Stack:** HTML, Tailwind CDN, GSAP ScrollTrigger, Git, GitHub (personal account), Netlify

---

### Task 1: Reorganize theme files

**Files:**
- Rename: `index.html` → `index-dark.html`
- Rename: `index-standalone.html` → `index.html`

- [ ] **Step 1: Rename dark theme to archive**

```bash
cd /Users/christopherbeem/weeds-website
mv index.html index-dark.html
```

- [ ] **Step 2: Promote light theme to default**

```bash
mv index-standalone.html index.html
```

- [ ] **Step 3: Verify files**

```bash
ls *.html
```

Expected output:
```
index-dark.html
index-offline.html
index.html
```

---

### Task 2: Initialize git repository

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Initialize git**

```bash
cd /Users/christopherbeem/weeds-website
git init
```

Expected: `Initialized empty Git repository in /Users/christopherbeem/weeds-website/.git/`

- [ ] **Step 2: Create .gitignore**

```bash
cat > .gitignore << 'EOF'
.DS_Store
*.DS_Store
node_modules/
.env
EOF
```

- [ ] **Step 3: Stage all files**

```bash
git add .
```

- [ ] **Step 4: Initial commit**

```bash
git commit -m "Initial commit — The Weeds website, light theme default"
```

Expected: commit hash and file count summary.

---

### Task 3: Create GitHub repo (user-guided)

This task requires action on GitHub.com. Claude will guide you through each step.

- [ ] **Step 1: Go to GitHub.com**

Open https://github.com/new in your browser.

- [ ] **Step 2: Fill in repo settings**

| Field | Value |
|---|---|
| Repository name | `weeds-website` |
| Description | `The Weeds — Celtic folk trio website` |
| Visibility | Public or Private (your call) |
| Initialize with README | **No** (we already have our own files) |
| .gitignore | **None** |
| License | **None** |

Click **Create repository**.

- [ ] **Step 3: Copy the repo URL**

On the next screen, GitHub shows the repo URL. Copy the SSH version:
```
git@github.com:YOUR_USERNAME/weeds-website.git
```

Tell Claude the URL so the next task can proceed.

---

### Task 4: Connect local repo to GitHub and push

**Requires:** SSH URL from Task 3, Step 3.

- [ ] **Step 1: Add remote** (replace URL with actual URL from user)

```bash
cd /Users/christopherbeem/weeds-website
git remote add origin git@github.com:YOUR_USERNAME/weeds-website.git
```

- [ ] **Step 2: Set main branch and push**

```bash
git branch -M main
git push -u origin main
```

Expected: files upload, ends with `Branch 'main' set up to track remote branch 'main' from 'origin'.`

- [ ] **Step 3: Verify on GitHub**

Open the repo URL in the browser and confirm files are visible.

---

### Task 5: Connect Netlify (user-guided)

- [ ] **Step 1: Go to Netlify**

Open https://app.netlify.com and log in with your personal Netlify account (create one free at netlify.com if needed).

- [ ] **Step 2: Add new site**

Click **Add new site → Import an existing project**.

- [ ] **Step 3: Connect to GitHub**

Select **GitHub**, authorize if prompted, then find and select `weeds-website`.

- [ ] **Step 4: Configure build settings**

| Field | Value |
|---|---|
| Branch to deploy | `main` |
| Base directory | *(leave blank)* |
| Build command | *(leave blank)* |
| Publish directory | `.` (a single dot) |

Click **Deploy site**.

- [ ] **Step 5: Rename the Netlify subdomain (optional)**

In Site settings → Domain management → Options → Edit site name, set it to something like `the-weeds` so the URL is `the-weeds.netlify.app`.

- [ ] **Step 6: Confirm deploy**

Wait ~30 seconds, then open the Netlify URL and confirm the site loads with the light parchment theme.

---

### Task 6: Create DESIGN.md

**Files:**
- Create: `DESIGN.md`

- [ ] **Step 1: Write DESIGN.md**

```bash
cat > /Users/christopherbeem/weeds-website/DESIGN.md << 'EOF'
# The Weeds — Design Reference

## Design Tokens

| Token   | Value     | Usage                        |
|---------|-----------|------------------------------|
| grove   | #1b2b1d   | Dark accents, nav background |
| moss    | #2d4a31   | Mid greens                   |
| fern    | #4a7c52   | Interactive elements, links  |
| amber   | #8c6030   | Warm accents                 |
| parch   | #f5f1ea   | Page background              |
| linen   | #ede9e0   | Section backgrounds          |
| ink     | #1a1a18   | Body text                    |
| stone   | #7a7870   | Muted/secondary text         |
| rule    | #dedad2   | Borders and dividers         |

## Typography

| Role         | Font               |
|--------------|--------------------|
| Heading      | Cormorant Garamond |
| Body         | Inter              |

## Theme Files

| File              | Purpose                          |
|-------------------|----------------------------------|
| index.html        | Live site — light parchment theme |
| index-dark.html   | Archived dark theme              |
| index-offline.html| Font-embedded offline version    |

## Assets

| File                      | Purpose        |
|---------------------------|----------------|
| assets/images/band-photo.jpg | Hero/OG image |

## Stack

Plain HTML + Tailwind CDN + GSAP ScrollTrigger. No build step.
Edit index.html and push to deploy.
EOF
```

- [ ] **Step 2: Commit**

```bash
cd /Users/christopherbeem/weeds-website
git add DESIGN.md
git commit -m "Add DESIGN.md with design tokens and file reference"
git push
```

---

### Task 7: Create Claude Code skill file

**Files:**
- Create: `~/.claude/skills/weeds-website.md`

- [ ] **Step 1: Write skill file**

Create `~/.claude/skills/weeds-website.md` with the following content (replace `YOUR_USERNAME` and Netlify subdomain once known):

```markdown
# The Weeds Website

## Overview

Single-page static site for The Weeds, a Celtic folk trio from Carmel, California.
Built with plain HTML + Tailwind CDN + GSAP ScrollTrigger. No build step — edit `index.html` and push.

**Project root:** `/Users/christopherbeem/weeds-website/`
**Main file:** `index.html`
**Live URL:** `[netlify-subdomain].netlify.app` (no custom domain yet)
**GitHub:** `git@github.com:YOUR_USERNAME/weeds-website.git`

## Design System

| Token   | Value     | Usage                        |
|---------|-----------|------------------------------|
| grove   | #1b2b1d   | Dark accents, nav background |
| moss    | #2d4a31   | Mid greens                   |
| fern    | #4a7c52   | Interactive elements, links  |
| amber   | #8c6030   | Warm accents                 |
| parch   | #f5f1ea   | Page background              |
| linen   | #ede9e0   | Section backgrounds          |
| ink     | #1a1a18   | Body text                    |
| stone   | #7a7870   | Muted/secondary text         |
| rule    | #dedad2   | Borders and dividers         |

Heading font: Cormorant Garamond | Body font: Inter

## Theme Files

| File               | Purpose                          |
|--------------------|----------------------------------|
| index.html         | Live site — light parchment theme |
| index-dark.html    | Archived dark theme (not deployed) |
| index-offline.html | Font-embedded offline version    |

## Deploying Changes

Netlify auto-deploys from the `main` branch on GitHub. Push and it's live in ~30 seconds.

```bash
cd /Users/christopherbeem/weeds-website
git add index.html          # or other changed files
git commit -m "description"
git push
```

## Open Items

- Band feedback on light vs dark theme pending
- No custom domain yet — using Netlify subdomain
- No booking/contact form wired up
```

- [ ] **Step 2: Verify skill file exists**

```bash
ls ~/.claude/skills/weeds-website.md
```

- [ ] **Step 3: Commit docs to repo**

```bash
cd /Users/christopherbeem/weeds-website
git add docs/
git commit -m "Add setup spec and implementation plan"
git push
```
