# Contributing to Stellar Pass

Thank you for your interest in contributing to Stellar Pass!

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [pnpm](https://pnpm.io/) v8+
- [Rust](https://www.rust-lang.org/) (for Soroban contracts)
- [Docker](https://www.docker.com/) (for local development)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Stellar-Pass/StellarPass-MonoRepo.git
   cd StellarPass-MonoRepo
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start infrastructure**
   ```bash
   docker compose up -d postgres redis
   ```

4. **Set up environment variables**
   ```bash
   cp stellar-pass-backend/.env.example stellar-pass-backend/.env
   cp stellar-pass-indexer/.env.example stellar-pass-indexer/.env
   cp stellar-pass-frontend/.env.example stellar-pass-frontend/.env
   ```

5. **Build shared package**
   ```bash
   pnpm build:shared
   ```

6. **Run all services**
   ```bash
   pnpm dev
   ```

## Project Structure

```
StellarPass-MonoRepo/
├── stellar-pass-shared/      # Shared types, constants, validation
├── stellar-pass-backend/     # Fastify API server
├── stellar-pass-frontend/    # Next.js web application
├── stellar-pass-indexer/     # Stellar blockchain event indexer
├── stellar-pass-contracts/   # Soroban smart contracts (Rust)
├── docker-compose.yml        # Development infrastructure
└── docker-compose.prod.yml   # Production configuration
```

## Branch Naming

- `feat/` — New features
- `fix/` — Bug fixes
- `docs/` — Documentation
- `refactor/` — Code restructuring
- `test/` — Test additions
- `chore/` — Maintenance

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Scopes:** `shared`, `backend`, `frontend`, `indexer`, `contracts`, `docker`

**Examples:**
```
feat(backend): add webhook retry with exponential backoff
fix(frontend): align API routes with backend v1 prefix
docs(contracts): add NatSpec documentation to ticket contract
```

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with conventional commits
3. Push your branch and create a PR
4. Ensure CI passes
5. Request review from a maintainer
6. Squash and merge after approval

## Questions?

Open an issue or reach out to the maintainers!
