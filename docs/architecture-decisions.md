# Architecture Decisions

## AD-001: Backend-first migration strategy
Adopt a detached backend (`apps/api`, later `apps/agent` and workers) while preserving existing UI behavior during incremental migration.

## AD-002: Secretless frontend target
Remove production BYOK patterns and route all provider operations through backend APIs.

## AD-003: Durable artifact-centric job model
All media operations move to durable jobs with storage-backed artifacts and logs.
