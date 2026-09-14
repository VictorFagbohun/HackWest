import { test } from 'node:test';
import assert from 'node:assert/strict';
import { levelForXp } from '../lib/game-rules';
import { decodePhoto, readJson, requireSameOrigin } from '../lib/http';
import {
  assertAtCampusLocation,
  campusSites,
  distanceMeters,
} from '../lib/campus-locations';

test('cumulative level boundaries include rewards that skip several levels', () => {
  for (const [xp,level] of [[0,1],[99,1],[100,2],[299,2],[300,3],[599,3],[600,4],[1500,6]]) assert.equal(levelForXp(xp),level);
});
test('writes reject cross-origin requests and missing Origin', () => {
  process.env.APP_BASE_URL = 'http://localhost:3000';
  assert.throws(() => requireSameOrigin(new Request('http://localhost:3000/api/me')), /Campus Quest/);
  assert.throws(() => requireSameOrigin(new Request('http://localhost:3000/api/me',{ headers:{ Origin:'https://other.example' } })), /Campus Quest/);
  requireSameOrigin(new Request('http://localhost:3000/api/me',{ headers:{ Origin:'http://localhost:3000' } }));
});
test('JSON reader limits actual streamed bytes and rejects malformed JSON', async () => {
  const request = (body: string) => new Request('http://localhost',{ method:'POST',headers:{ 'Content-Type':'application/json' },body });
  await assert.rejects(readJson(request('{"large":"abcdef"}'),8), /too large/);
  await assert.rejects(readJson(request('{')), /Invalid JSON/);
  assert.deepEqual(await readJson(request('{"ok":true}')), { ok:true });
});
test('photo input rejects mismatched formats and non-base64 data', () => {
  assert.throws(() => decodePhoto(Buffer.from('not a jpeg').toString('base64'),'image/jpeg'), /does not match/);
  assert.throws(() => decodePhoto('https://example.com/photo','image/jpeg'), /base64/);
});
test('campus geofence accepts nearby GPS and rejects far or inaccurate fixes', () => {
  const previous = process.env.GEO_CHECK_DISABLED;
  delete process.env.GEO_CHECK_DISABLED;
  try {
    const site = campusSites.LIBRARY;
    assertAtCampusLocation('LIBRARY', {
      latitude: site.latitude,
      longitude: site.longitude,
      accuracyMeters: 25,
    });
    assert.throws(
      () => assertAtCampusLocation('LIBRARY', {
        latitude: site.latitude + 0.05,
        longitude: site.longitude,
        accuracyMeters: 20,
      }),
      /Move closer/,
    );
    assert.throws(
      () => assertAtCampusLocation('LIBRARY', {
        latitude: site.latitude,
        longitude: site.longitude,
        accuracyMeters: 250,
      }),
      /accuracy is too low/,
    );
    assert.throws(() => assertAtCampusLocation('LIBRARY', undefined), /Share your current location/);
    assert.ok(distanceMeters(site, site) < 1);
  } finally {
    if (previous === undefined) delete process.env.GEO_CHECK_DISABLED;
    else process.env.GEO_CHECK_DISABLED = previous;
  }
});
