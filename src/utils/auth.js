const SESSION_KEY = 'usaco-arena:v1:session';

const EXPECTED_CRED_SIG = '394b9ef4-685b287c';
const EXPECTED_USER_SIG = '2e6284b4-491a2624';

function digestA(input) {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function digestB(input) {
  let h = 5381;
  for (let i = 0; i < input.length; i += 1) {
    h = Math.imul(h, 33) ^ input.charCodeAt(i);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function sign(value) {
  return `${digestA(value)}-${digestB(value)}`;
}

export function verifyCredentials(username, password) {
  const cleanUser = String(username ?? '').trim();
  const cleanPass = String(password ?? '');
  return sign(`usaco-arena::${cleanUser}::${cleanPass}::v1`) === EXPECTED_CRED_SIG;
}

export function getSavedSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      parsed.authenticated === true &&
      typeof parsed.username === 'string' &&
      sign(`usaco-user::${parsed.username}::v1`) === EXPECTED_USER_SIG
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveSession(username) {
  const session = {
    username: String(username).trim(),
    authenticated: true,
    signedInAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore storage errors
  }
  return session;
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore storage errors
  }
}
