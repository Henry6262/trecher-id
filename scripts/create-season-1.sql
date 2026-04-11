-- Create Season 1 of the Trencher Cup
-- Real dates: 4-week qualification, then 2-week tournament

-- Phase 1: Qualification (4 weeks)
-- May 12 - Jun 9, 2026
-- Phase 2: Group Stage (48 hours)
-- Jun 12-14, 2026
-- Phase 3: R16 (48 hours)
-- Jun 16-18, 2026
-- Phase 4: QF (48 hours)
-- Jun 20-22, 2026
-- Phase 5: SF (48 hours)
-- Jun 24-26, 2026
-- Phase 6: Final (72 hours)
-- Jun 28 - Jul 1, 2026

INSERT INTO "CupSeason" (
  id, name, slug, status,
  "qualificationStart", "qualificationEnd",
  "groupStart", "groupEnd",
  "r16Start", "r16End",
  "qfStart", "qfEnd",
  "sfStart", "sfEnd",
  "finalStart", "finalEnd",
  "prizePoolUsd", "prizePoolToken", "participantCount",
  "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  'Season 1',
  'season-1',
  'qualifying',
  '2026-05-12T00:00:00Z'::timestamptz,
  '2026-06-09T23:59:59Z'::timestamptz,
  '2026-06-12T00:00:00Z'::timestamptz,
  '2026-06-14T23:59:59Z'::timestamptz,
  '2026-06-16T00:00:00Z'::timestamptz,
  '2026-06-18T23:59:59Z'::timestamptz,
  '2026-06-20T00:00:00Z'::timestamptz,
  '2026-06-22T23:59:59Z'::timestamptz,
  '2026-06-24T00:00:00Z'::timestamptz,
  '2026-06-26T23:59:59Z'::timestamptz,
  '2026-06-28T00:00:00Z'::timestamptz,
  '2026-07-01T23:59:59Z'::timestamptz,
  10000,
  'WEB3ME',
  0,
  now(),
  now()
ON CONFLICT (slug) DO NOTHING;

-- Verify
SELECT id, name, slug, status, "prizePoolUsd", "prizePoolToken", "qualificationStart", "qualificationEnd", "finalStart", "finalEnd"
FROM "CupSeason" WHERE slug = 'season-1';
