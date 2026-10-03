// The flock: birds the user has collected, kept in this browser.
const KEY = 'whodatbird.flock.v1';

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
}
function write(flock) {
  try { localStorage.setItem(KEY, JSON.stringify(flock)); return true; }
  catch (e) {
    // Storage full (usually photos): retry without the newest snapshot.
    return false;
  }
}

export function getFlock() { return read(); }

/** Adds a sighting. Returns the bird's new count. */
export function addSighting(id, method, snapshot) {
  const flock = read();
  const now = new Date().toISOString();
  const prev = flock[id];
  flock[id] = {
    count: prev ? prev.count + 1 : 1,
    method: prev ? prev.method : method,
    firstSeen: prev ? prev.firstSeen : now,
    lastSeen: now,
    snapshot: snapshot || (prev && prev.snapshot) || null
  };
  if (!write(flock)) {
    flock[id].snapshot = prev ? prev.snapshot : null;
    write(flock);
  }
  return flock[id].count;
}

export function release(id) {
  const flock = read();
  delete flock[id];
  write(flock);
}
