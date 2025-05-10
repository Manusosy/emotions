# Archived Supabase Components

This directory contains Supabase-related components that have been archived after migrating to our custom authentication system. These files are kept for reference but should not be used in new code.

## Background

The Emotions App originally used Supabase for authentication and data storage. As part of a security improvement initiative, we migrated to a custom cookie-based authentication system to address issues like XSS vulnerabilities from localStorage token storage.

## Contents

- `client.ts`: The Supabase compatibility layer that was created during the transition to redirect Supabase calls to our new API client
- `services/`: Original Supabase service implementations that have been replaced with new API client services

## Migration Status

All components have been successfully migrated from Supabase to our custom API client. This archive is kept for reference purposes only and may be removed in the future.

For details on the migration strategy and implementation, see:
- `docs/auth-migration.md`
- `docs/auth-migration-summary.md`
- `docs/implementation-status.md` 