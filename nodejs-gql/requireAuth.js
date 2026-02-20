// requireAuth.js
export function requireAuth(user) {
  if (!user) {
    throw new Error("Unauthorized");
  }
}
