# Security and Secret Management

This project uses environment variables for secrets and runtime configuration. The goal is to keep sensitive data out of git and make it easy to run the app safely.

## What is ignored
- `.env` and all `.env.*` files are ignored in git
- generated credentials and certificate files like `*.pem`, `*.key`, `*.crt`, `*.p12`, `*.pfx`, `*.jks` are ignored
- local overrides like `.env.local` are ignored
- package manager lock files from `npm`/`yarn` are ignored when using `pnpm`

## What to store locally
Keep secrets in local `.env` files only. Do not commit them.

Examples are provided in:
- `.env.example`
- `artifacts/api-server/.env.example`
- `artifacts/agile-pm/.env.example`

Copy the appropriate example file to `.env` and fill in values for your own machine.

## If secrets were committed
If you have committed real credentials, rotate them immediately. Git history can still contain those values even after removing them from the latest commit.

## Recommended practices
- never paste real passwords, API keys, or database connection strings into source files
- use local environment files instead
- add any new secret or key files to `.gitignore`
- review `git status` before committing
- if you use a cloud provider, store credentials in a secure vault, not in code

## Local development safety
- keep local environment files private
- avoid sharing `.env` contents in screenshots or public repos
- use the example files for onboarding rather than copying real secrets
