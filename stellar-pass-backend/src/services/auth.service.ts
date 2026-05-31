import { FastifyInstance } from 'fastify';
import pool from '../db/pool';
import { buildChallenge, verifyChallenge } from '../stellar/sep10';
import { NotFoundError, UnauthorizedError, ValidationError } from '../middleware/error-handler';
import type { AuthChallengeResponse, AuthTokenResponse } from '@stellar-pass/shared';

// Alias shared types for local use
type ChallengeResponse = AuthChallengeResponse;
type TokenResponse = AuthTokenResponse;

/**
 * Generate a SEP-10 challenge transaction for the given Stellar account.
 */
export async function getChallenge(account: string): Promise<ChallengeResponse> {
  if (!account || !account.startsWith('G') || account.length !== 56) {
    throw new ValidationError('Invalid Stellar account address');
  }

  const transaction = await buildChallenge(account);
  return { transaction };
}

/**
 * Verify a signed SEP-10 challenge and issue a JWT.
 * Creates the organizer record if it doesn't exist.
 */
export async function verifyAndIssueToken(
  fastify: FastifyInstance,
  signedTransaction: string,
): Promise<TokenResponse> {
  let account: string;
  try {
    account = await verifyChallenge(signedTransaction);
  } catch (err) {
    throw new UnauthorizedError('Invalid or expired challenge transaction');
  }

  // Upsert organizer
  const result = await pool.query(
    `INSERT INTO organizers (stellar_account, name)
     VALUES ($1, $2)
     ON CONFLICT (stellar_account) DO UPDATE SET stellar_account = EXCLUDED.stellar_account
     RETURNING id, stellar_account, name`,
    [account, `User ${account.slice(0, 8)}`],
  );

  const organizer = result.rows[0];

  const token = fastify.jwt.sign(
    { sub: organizer.stellar_account },
    { expiresIn: '24h' },
  );

  return { token, account: organizer.stellar_account };
}

/**
 * Get the current user profile from a JWT payload.
 */
export async function getCurrentUser(stellarAccount: string) {
  const result = await pool.query(
    `SELECT id, stellar_account, name, email, avatar_url, created_at
     FROM organizers
     WHERE stellar_account = $1`,
    [stellarAccount],
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  return result.rows[0];
}
