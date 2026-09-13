import { z } from 'zod';
import { AppError, invariant } from './errors';

export function requireSameOrigin(request: Request) {
  const expected = new URL(process.env.APP_BASE_URL || request.url).origin;
  invariant(request.headers.get('origin') === expected,403,'INVALID_ORIGIN','Send writes from the Campus Quest app.');
}
export async function readJson(request: Request, maxBytes = 16384): Promise<unknown> {
  invariant(request.headers.get('content-type')?.split(';')[0].trim() === 'application/json',415,'INVALID_CONTENT_TYPE','Use application/json.');
  const reader = request.body?.getReader();
  invariant(reader,400,'INVALID_JSON','A JSON body is required.');
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const chunk = await reader.read(); if (chunk.done) break;
      length += chunk.value.length;
      if (length > maxBytes) { await reader.cancel(); throw new AppError(413,'BODY_TOO_LARGE','Request is too large.'); }
      chunks.push(chunk.value);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch (error) {
    if (error instanceof SyntaxError) throw new AppError(400,'INVALID_JSON','Invalid JSON body.');
    throw error;
  } finally { reader.releaseLock(); }
}
export function errorResponse(error: unknown) {
  if (error instanceof z.ZodError) return Response.json({ success:false,error:{ code:'INVALID_INPUT',message:'Request fields are missing or invalid.' } },{ status:400 });
  if (error instanceof AppError) return Response.json({ success:false,error:{ code:error.code,message:error.message } },{ status:error.status });
  // Log only a classification, never connection strings, auth claims, or evidence.
  console.error('API request failed',error instanceof Error ? error.name : 'UnknownError');
  return Response.json({ success:false,error:{ code:'INTERNAL_ERROR',message:'The request could not be completed.' } },{ status:500 });
}
export function decodePhoto(data: string,mimeType: string): Buffer {
  invariant(/^[A-Za-z0-9+/]+={0,2}$/.test(data) && data.length % 4 === 0,400,'INVALID_IMAGE','Use a base64 encoded image.');
  const bytes = Buffer.from(data,'base64');
  invariant(bytes.length > 0 && bytes.length <= 3 * 1024 * 1024,413,'IMAGE_TOO_LARGE','Photos must be at most 3 MB.');
  const valid = (mimeType === 'image/jpeg' && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    || (mimeType === 'image/png' && bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))
    || (mimeType === 'image/webp' && bytes.subarray(0,4).toString() === 'RIFF' && bytes.subarray(8,12).toString() === 'WEBP');
  invariant(valid,400,'INVALID_IMAGE','Photo content does not match its image type.');
  return bytes;
}
