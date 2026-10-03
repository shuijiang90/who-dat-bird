# Who Dat Bird?

A silly bird-identification web app. Gary, a self-appointed pigeon expert, names the birds you show him and keeps a gallery ("My flock") of everything you've collected.

**Status: demo mode.** All the screens work for real: camera, microphone, drawing, gallery, saving. But Gary's answers are made up for now. See [Plugging in real identification](#plugging-in-real-identification).

## What it does

- **Four ways to show Gary a bird:**
  - **Snap it:** live camera with the rear lens, or upload a photo.
  - **Tweet it:** record the song with the microphone, with a live level meter.
  - **Describe it:** size, colour and vibe chips, plus free text.
  - **Doodle it:** draw it with your finger.
- **Gary's verdict:** the bird's name, Latin name and Gary's confidence, with your photo or doodle attached. You can then save the bird or tell Gary he's wrong.
- **My flock gallery:**
  - Every bird you've found, with locked "???" slots for the rest and a progress bar.
  - Tap a bird to see how many times you've spotted it, how you caught it, and your photo or doodle.
  - Each bird has a **Play song** button.
  - You can release a bird to remove it from the gallery.
- **Installable and offline:** the app can be added to your phone's home screen and works offline.

## Run it

There's no build step and there are no dependencies. Serve the folder with any static server:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

The camera and microphone only work over `https://` or on `localhost`.

## Project layout

```
index.html            app shell
styles.css            all styling
js/app.js             screens, navigation, camera / mic / drawing
js/birds.js           bird list + illustrations (add birds here)
js/identify.js        Gary's brain — demo mode lives here
js/sounds.js          bird songs (synthesised placeholders)
js/store.js           the flock, saved in localStorage
sw.js                 offline cache
manifest.webmanifest  install-to-home-screen settings
```

## Plugging in real identification

Replace `identify()` in `js/identify.js`. It receives an object like this:

```js
{ method: 'photo' | 'sound' | 'describe' | 'draw',
  image,        // small JPEG data URL (photo or doodle)
  audio,        // Blob of the recording (sound)
  description } // { size, colour, vibe, text }
```

It must resolve to `{ birdId, confidence }`, where `birdId` is one of the ids in `js/birds.js`.

Good options:

- **Photos, descriptions and doodles:** a vision-capable LLM API, called through a small backend so your API key stays secret.
- **Sounds:** BirdNET.

Set `DEMO_MODE = false` to hide the "Gary is guessing" note.

## Real bird songs

The songs are synthesised chirps for now. To use a real recording:

1. Add `sounds/<bird id>.mp3`.
2. Add that id to `RECORDINGS` in `js/sounds.js`.
3. Check the recording's licence first. Sites like xeno-canto list one for every recording.
