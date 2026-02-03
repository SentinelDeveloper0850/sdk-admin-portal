export const logout = () => {
  // Call server to clear HttpOnly cookie
  fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
};
