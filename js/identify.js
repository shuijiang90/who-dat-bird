// Gary's brain. DEMO MODE: results are made up.
//
// To plug in real identification later, replace `identify` with a call to a
// real service (e.g. a vision model for photos/doodles, BirdNET for sounds).
// It receives { method, image, audio, description } and must resolve to
// { birdId, confidence }.

import { BIRDS } from './birds.js';
import { getFlock } from './store.js';

export const DEMO_MODE = true;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function fromDescription(d = {}) {
  const text = (d.text || '').toLowerCase();
  if (d.size === 'Huge' || /duck|quack|pond|lake/.test(text)) return 'mallard';
  if (d.colour === 'Red / orange' || /red|orange|robin/.test(text)) return 'robin';
  if (d.colour === 'Blue' || /blue|yellow/.test(text)) return 'bluetit';
  if (d.colour === 'Black & white' || /magpie|shiny|stole/.test(text)) return 'magpie';
  if (d.colour === 'Black' || /black/.test(text)) return 'blackbird';
  if (d.colour === 'Brown' || /brown|sparrow/.test(text)) return 'sparrow';
  return null;
}

export async function identify(input) {
  await wait(1800 + Math.random() * 800); // Gary is thinking. Allegedly.
  let birdId = input.method === 'describe' ? fromDescription(input.description) : null;
  if (!birdId) {
    // Prefer birds not collected yet so the gallery fills up.
    const flock = getFlock();
    const fresh = BIRDS.filter((b) => !flock[b.id]);
    const pool = fresh.length ? fresh : BIRDS;
    birdId = pool[Math.floor(Math.random() * pool.length)].id;
  }
  const confidence = 60 + Math.floor(Math.random() * 40);
  return { birdId, confidence };
}
