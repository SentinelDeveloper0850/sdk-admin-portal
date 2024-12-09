export const logout = () => {
  // Clear the auth token from cookies
  document.cookie =
    "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";

  // Optionally clear from localStorage (if used)
  localStorage.removeItem("auth-token");
};
