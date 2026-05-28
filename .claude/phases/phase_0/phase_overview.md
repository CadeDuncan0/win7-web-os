# Phase 0 — Environment & Infrastructure

**Status:** `complete`

**Start Date:** 04-03-2026

**End Date:** 04-16-2026

---

## Flags

| Flag            | Value          |
| --------------- | -------------- |
| Phase           | 0              |
| Status          | complete       |
| Tasks Complete  | 18 / 18        |
| Blocking Issues | None           |
| Current Task    | Phase Complete |

---

## Goal

Establish a complete, reproducible development environment and green CI/CD pipeline before any
product code is written. Phase 0 is complete when any developer can clone the repo and be fully
operational in under ten minutes.

---

## Required Tooling

| Tool           | Purpose                                                 |
| -------------- | ------------------------------------------------------- |
| Node.js (LTS)  | Host-level runtime — required for Cursor IDE extensions |
| Git            | Version control                                         |
| Cursor IDE     | Primary development environment                         |
| Docker Desktop | Local containerized runtime                             |
| Postman        | GraphQL endpoint validation and request collections     |
| GitHub         | Remote repository, branch protection, Actions CI/CD     |
| Vercel         | Production deployment target                            |
| Supabase       | Database, Auth, Storage, GraphQL provisioning           |

---

## Task List

- Task 1
  - Create Accounts for All Required Services
  - GitHub · Vercel · Supabase
  - Provision all third-party service accounts before any local setup begins

- Task 2
  - Install Required Software
  - Node.js · Git · Cursor IDE
  - Install and verify all host-level dependencies

- Task 3
  - Create GitHub Repository
  - GitHub
  - Initialize `windows7-portfolio` repo with branch protection on `main`

- Task 4
  - Initialize Next.js Project
  - Next.js 14 · TypeScript · App Router
  - Scaffold project with TypeScript, App Router, and `src/` directory structure

- Task 5
  - Install and Configure ESLint
  - ESLint · eslint-config-next · eslint-plugin-import · TypeScript
  - Flat config (`eslint.config.mjs`), custom rules: no-console, import/order, no-unused-vars, curly

- Task 6
  - Install and Configure Prettier
  - Prettier · eslint-config-prettier
  - Format rules enforced; conflict resolution with ESLint via eslint-config-prettier

- Task 7
  - Configure Cursor IDE Settings and Plugins
  - Cursor IDE
  - Install all required extensions; enable format-on-save, set Prettier as default formatter

- Task 8
  - Set Up Husky Pre-Commit Hooks
  - Husky · lint-staged
  - Block commits with lint or format violations; npx prefix required on Windows

- Task 9
  - Set Up Commit-lint
  - commitlint · @commitlint/config-conventional · Husky
  - Enforce Conventional Commits on all commit messages via commit-msg hook

- Task 10
  - Scaffold Redux Toolkit Store
  - Redux Toolkit · React-Redux · TypeScript
  - Store with typed hooks, three placeholder slices: windowSlice, sessionSlice, desktopSlice

- Task 11
  - Set Up Supabase Project
  - Supabase · @supabase/supabase-js
  - Provision project, configure env variables, initialize JS client in src/lib/supabase.ts

- Task 12
  - Create Supabase Database Schema
  - Supabase · PostgreSQL
  - Define public.projects table, enable RLS, add permissive dev read policy, seed one row

- Task 13
  - Enable and Validate Supabase GraphQL Endpoint
  - GraphQL · pg_graphql · Postman
  - Validate endpoint with Postman; confirm Relay Connection Spec response shape; add NEXT_PUBLIC_GRAPHQL_URL

- Task 14
  - Install and Configure Apollo Client
  - Apollo Client · GraphQL · TypeScript
  - SetContextLink + HttpLink chain; ReduxProviderWrapper + ApolloProviderWrapper in src/components/providers/

- Task 15
  - Set Up Docker for Local Development
  - Docker · Node.js
  - Dockerfile + docker-compose.yml; volume mounts for hot reload; env variable passthrough

- Task 16
  - Set Up GitHub Actions CI Pipeline
  - GitHub Actions · ESLint · Prettier · Next.js
  - ci.yml: lint → format check → build on every PR to main; secrets configured

- Task 17
  - Set Up Vercel Deployment
  - Vercel · GitHub Actions · Next.js
  - Link repo to Vercel; configure env variables in dashboard; confirm auto-deploy on main merge

- Task 18
  - Validate Phase 0 Complete
  - All Phase 0 tooling
  - Full checklist validation: dev server, lint, format, commit hooks, Supabase query, Docker boot, CI green, Vercel live

---

## Task Status

| Task | Name                        | Status      |
| ---- | --------------------------- | ----------- |
| 1    | Create Accounts             | ✅ Complete |
| 2    | Install Software            | ✅ Complete |
| 3    | Create GitHub Repository    | ✅ Complete |
| 4    | Initialize Next.js Project  | ✅ Complete |
| 5    | Configure ESLint            | ✅ Complete |
| 6    | Configure Prettier          | ✅ Complete |
| 7    | Configure Cursor IDE        | ✅ Complete |
| 8    | Husky Pre-Commit Hooks      | ✅ Complete |
| 9    | Commit-lint                 | ✅ Complete |
| 10   | Redux Toolkit Store         | ✅ Complete |
| 11   | Supabase Project Setup      | ✅ Complete |
| 12   | Supabase Database Schema    | ✅ Complete |
| 13   | GraphQL Endpoint Validation | ✅ Complete |
| 14   | Apollo Client Configuration | ✅ Complete |
| 15   | Docker Local Environment    | ✅ Complete |
| 16   | GitHub Actions CI Pipeline  | ⬜ Pending  |
| 17   | Vercel Deployment           | ✅ Complete |
| 18   | Phase 0 Validation          | ✅ Complete |
