// api/src/lib/google.ts
export function getGoogleApiKey(): string {
  return (
    process.env.GOOGLE_VEO3_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY ||
    ''
  );
}
export function hasGoogle(): boolean {
  return getGoogleApiKey().length > 0;
}
