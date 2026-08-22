/**
 * Extracts an 11-char YouTube video id from a full URL, a share link,
 * or a bare id the user pastes in.
 */
export function extractYouTubeId(input) {
  if (!input) return null;
  const trimmed = input.trim();

  const idOnly = /^[a-zA-Z0-9_-]{11}$/;
  if (idOnly.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.slice(1).split("/")[0] || null;
    }
    if (url.hostname.includes("youtube.com")) {
      if (url.pathname === "/watch") return url.searchParams.get("v");
      if (url.pathname.startsWith("/embed/")) return url.pathname.split("/embed/")[1];
      if (url.pathname.startsWith("/shorts/")) return url.pathname.split("/shorts/")[1];
    }
  } catch {
    // Not a valid URL and not a bare id - fall through to null.
  }
  return null;
}
