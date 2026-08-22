/**
 * A stable participant id per browser tab, stored in sessionStorage.
 * This lets a page refresh rejoin as "the same" participant instead of
 * spawning a duplicate entry in the participant list.
 */
export function getParticipantId() {
  let id = sessionStorage.getItem("wp_participant_id");
  if (!id) {
    id = `p_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
    sessionStorage.setItem("wp_participant_id", id);
  }
  return id;
}

export function getSavedUsername() {
  return sessionStorage.getItem("wp_username") || "";
}

export function saveUsername(username) {
  sessionStorage.setItem("wp_username", username);
}
