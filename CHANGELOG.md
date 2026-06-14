# Changelog

All notable changes to Stellar Pass will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Shared package: API version constant, EURC stablecoin support, query parameter types
- Backend: Request ID middleware for distributed tracing
- Backend: Structured request logging with timing metrics
- Indexer: Prometheus-compatible metrics endpoint (`/metrics`)
- Indexer: Enhanced health endpoint with component status
- Contracts: Comprehensive NatSpec documentation for all Soroban contracts
- Docker: Production docker-compose with resource limits and health checks
- Docker: `.dockerignore` files for backend and indexer
- Documentation: CONTRIBUTING.md with setup and conventions
- Documentation: Architecture overview and API reference

### Fixed
- Frontend: API client routes now match backend `/api/v1/` prefix
- Frontend: Status constants aligned with backend schema (draft/on_sale/sold_out/cancelled/past)
- Backend: Import validation schemas from `@stellar-pass/shared` instead of redefining
- Backend: Fix `client_query` bug in checkin service (was using undefined helper)
- Backend: Fix `require('crypto')` to use top-level import

### Changed
- Frontend: API client now uses TypeScript generics for type-safe responses
- Backend: Error responses include `requestId` for debugging
- Indexer: Health endpoint returns 503 when components are unhealthy

## [0.1.0] - 2026-05-31

### Added
- Initial monorepo structure with pnpm workspaces
- Stellar Pass Backend (Fastify API server)
- Stellar Pass Frontend (Next.js 14 web application)
- Stellar Pass Indexer (Stellar blockchain event processor)
- Stellar Pass Shared (types, constants, validation)
- Soroban smart contracts: Ticket NFT, POAP Badge, Resale Escrow
- Docker Compose for local development
- Netlify deployment configuration
