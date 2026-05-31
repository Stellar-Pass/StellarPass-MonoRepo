import pool from '../db/pool';
import { NotFoundError, ForbiddenError } from '../middleware/error-handler';
import type { AnalyticsResponse } from '@stellar-pass/shared';

// Use shared type as the canonical analytics shape
type AnalyticsData = AnalyticsResponse;

/**
 * Get full analytics for an event.
 */
export async function getEventAnalytics(
  eventId: string,
  organizerWallet: string,
): Promise<AnalyticsData> {
  // Verify organizer owns the event
  const eventResult = await pool.query(
    `SELECT e.id, e.poap_enabled
     FROM events e
     JOIN organizers o ON o.id = e.organizer_id
     WHERE e.id = $1 AND o.stellar_account = $2`,
    [eventId, organizerWallet],
  );

  if (eventResult.rows.length === 0) {
    throw new NotFoundError('Event not found or you are not the organizer');
  }

  // Total tickets and sold count
  const ticketStats = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE status IN ('active', 'used')) as tickets_sold,
       COUNT(*) as tickets_total
     FROM tickets
     WHERE event_id = $1`,
    [eventId],
  );

  // Revenue by currency
  const revenueResult = await pool.query(
    `SELECT
       COALESCE(purchase_currency, 'USDC') as currency,
       COALESCE(SUM(purchase_price), 0) as total
     FROM tickets
     WHERE event_id = $1 AND status IN ('active', 'used')
     GROUP BY purchase_currency`,
    [eventId],
  );

  const revenue: Record<string, number> = {};
  for (const row of revenueResult.rows) {
    revenue[row.currency] = parseFloat(row.total);
  }

  // Check-in rate
  const checkInResult = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'used') as checked_in,
       COUNT(*) FILTER (WHERE status IN ('active', 'used')) as total
     FROM tickets
     WHERE event_id = $1`,
    [eventId],
  );

  const checkedIn = parseInt(checkInResult.rows[0].checked_in, 10);
  const totalTickets = parseInt(checkInResult.rows[0].total, 10);
  const checkInRate = totalTickets > 0 ? (checkedIn / totalTickets) * 100 : 0;

  // POAP claim rate
  let poapClaimRate = 0;
  if (eventResult.rows[0].poap_enabled) {
    const poapResult = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE pb.id IS NOT NULL) as claimed,
         COUNT(*) as eligible
       FROM tickets t
       LEFT JOIN poap_badges pb ON pb.ticket_id = t.id
       WHERE t.event_id = $1 AND t.status = 'used'`,
      [eventId],
    );
    const claimed = parseInt(poapResult.rows[0].claimed, 10);
    const eligible = parseInt(poapResult.rows[0].eligible, 10);
    poapClaimRate = eligible > 0 ? (claimed / eligible) * 100 : 0;
  }

  // Sales over time (last 30 days)
  const salesOverTime = await pool.query(
    `SELECT
       DATE(created_at) as date,
       COUNT(*) as count
     FROM tickets
     WHERE event_id = $1 AND created_at > NOW() - INTERVAL '30 days'
     GROUP BY DATE(created_at)
     ORDER BY date`,
    [eventId],
  );

  // Check-ins over time (by hour)
  const checkInsOverTime = await pool.query(
    `SELECT
       TO_CHAR(checked_in_at, 'HH24:00') as hour,
       COUNT(*) as count
     FROM tickets
     WHERE event_id = $1 AND checked_in_at IS NOT NULL
     GROUP BY TO_CHAR(checked_in_at, 'HH24:00')
     ORDER BY hour`,
    [eventId],
  );

  return {
    tickets_sold: parseInt(ticketStats.rows[0].tickets_sold, 10),
    tickets_total: parseInt(ticketStats.rows[0].tickets_total, 10),
    revenue,
    check_in_rate: Math.round(checkInRate * 100) / 100,
    poap_claim_rate: Math.round(poapClaimRate * 100) / 100,
    top_referrers: [], // Would require tracking referrer data
    geographic_distribution: {}, // Would require geo data from ticket buyers
    sales_over_time: salesOverTime.rows.map((r: { date: string; count: string }) => ({
      date: r.date,
      count: parseInt(r.count, 10),
    })),
    check_ins_over_time: checkInsOverTime.rows.map((r: { hour: string; count: string }) => ({
      hour: r.hour,
      count: parseInt(r.count, 10),
    })),
  };
}
