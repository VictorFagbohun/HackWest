import { z } from 'zod';
import type { LocationCode } from './game-rules';
import { AppError } from './errors';

/** Browser / API GPS sample submitted with quest verification. */
export const ClientLocation = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyMeters: z.number().positive().max(5000).optional(),
}).strict();
export type ClientLocation = z.infer<typeof ClientLocation>;

type CampusSite = {
  code: LocationCode;
  label: string;
  /** Short visual cues Gemini should look for. */
  visualCues: string;
  latitude: number;
  longitude: number;
  /** Acceptable distance from the pin (meters). */
  radiusMeters: number;
};

/**
 * Texas Tech University campus pins for demo geofencing.
 * Coordinates are approximate building centers; radii are intentionally generous for GPS noise.
 */
export const campusSites: Record<LocationCode, CampusSite> = {
  LIBRARY: {
    code: 'LIBRARY',
    label: 'Texas Tech University Library',
    visualCues: 'library stacks, study tables, books, reading rooms, or clear library signage',
    latitude: 33.58155,
    longitude: -101.87465,
    radiusMeters: 180,
  },
  REC_CENTER: {
    code: 'REC_CENTER',
    label: 'Texas Tech Student Recreation Center',
    visualCues: 'gym equipment, weights, courts, track, locker-room exterior, or Rec Center signage',
    latitude: 33.58535,
    longitude: -101.87205,
    radiusMeters: 200,
  },
  CAREER_CENTER: {
    code: 'CAREER_CENTER',
    label: 'Texas Tech University Career Center',
    visualCues: 'career-office lobby, advising desks, career-center signage, or professional-services suite',
    latitude: 33.58455,
    longitude: -101.87805,
    radiusMeters: 160,
  },
  STUDENT_UNION: {
    code: 'STUDENT_UNION',
    label: 'Texas Tech Student Union Building',
    visualCues: 'student-union atrium, food court, event hall, or Student Union Building signage',
    latitude: 33.58395,
    longitude: -101.87425,
    radiusMeters: 180,
  },
  HACKATHON: {
    code: 'HACKATHON',
    label: 'TTU Innovation Hub at Research Park',
    visualCues:
      'Innovation Hub building or signage, hackathon event floor, laptops, team tables, sponsor banners, check-in desk, or coworking / startup workspace inside the Hub',
    // 3911 4th St, Lubbock, TX 79415
    latitude: 33.59132,
    longitude: -101.8994,
    // Indoor GPS at the Hub is noisy; keep a wide but still on-site radius.
    radiusMeters: 280,
  },
};

const EARTH_RADIUS_M = 6_371_000;

export function distanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function geoChecksDisabled() {
  return process.env.GEO_CHECK_DISABLED === '1' || process.env.GEO_CHECK_DISABLED === 'true';
}

/** Demo mode: keep GPS/Gemini code paths, but approve without real checks. */
export function verificationBypassEnabled() {
  if (process.env.QUEST_VERIFY_BYPASS === '0' || process.env.QUEST_VERIFY_BYPASS === 'false') return false;
  return (
    process.env.QUEST_VERIFY_BYPASS === '1'
    || process.env.QUEST_VERIFY_BYPASS === 'true'
    || process.env.NODE_ENV !== 'production'
  );
}

/** Max reported GPS uncertainty accepted before treating the fix as too weak. */
export const MAX_LOCATION_ACCURACY_M = 120;

/**
 * Ensures the player is physically near the quest's campus site.
 * Skipped only when GEO_CHECK_DISABLED is set (local demos away from campus).
 */
export function assertAtCampusLocation(locationCode: string | null | undefined, location: ClientLocation | undefined) {
  if (verificationBypassEnabled() || geoChecksDisabled()) return;
  if (!locationCode) {
    throw new AppError(409, 'LOCATION_NOT_CONFIGURED', 'This quest has no campus location to verify against.');
  }
  const site = campusSites[locationCode as LocationCode];
  if (!site) {
    throw new AppError(409, 'LOCATION_NOT_CONFIGURED', 'This quest location is not configured for GPS checks.');
  }
  if (!location) {
    throw new AppError(400, 'LOCATION_REQUIRED', 'Share your current location to verify this quest.');
  }
  if (location.accuracyMeters !== undefined && location.accuracyMeters > MAX_LOCATION_ACCURACY_M) {
    throw new AppError(
      422,
      'LOCATION_INACCURATE',
      `GPS accuracy is too low (${Math.round(location.accuracyMeters)}m). Move outdoors or wait for a better fix, then try again.`,
    );
  }
  const distance = distanceMeters(location, site);
  if (distance > site.radiusMeters) {
    throw new AppError(
      422,
      'LOCATION_TOO_FAR',
      `You are about ${Math.round(distance)}m from ${site.label}. Move closer (within ${site.radiusMeters}m) to verify this quest.`,
    );
  }
}

export function siteForQuest(locationCode: string | null | undefined): CampusSite | null {
  if (!locationCode) return null;
  return campusSites[locationCode as LocationCode] ?? null;
}
