import assert from 'node:assert/strict';
const origin = process.env.SMOKE_ORIGIN || 'http://localhost:3000';
const health = await fetch(`${origin}/api/health`);
assert.equal(health.status,200); assert.equal((await health.json()).database,'connected');
const me = await fetch(`${origin}/api/me`);
assert.ok([401,503].includes(me.status));
const unauth = await me.json();
assert.ok(['UNAUTHENTICATED','AUTH_NOT_CONFIGURED'].includes(unauth.error.code));
const cross = await fetch(`${origin}/api/players/00000000-0000-4000-8000-000000000000/purchases`,{
  method:'POST',headers:{ 'Content-Type':'application/json',Origin:'https://other.example' },body:JSON.stringify({ itemId:'tree' }),
});
assert.equal(cross.status,403); assert.equal((await cross.json()).error.code,'INVALID_ORIGIN');
console.log('HTTP smoke checks passed: database health, auth boundary, and cross-origin write rejection.');
