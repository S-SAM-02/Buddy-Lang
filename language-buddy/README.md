# Language Buddy — Static Website

A colorful, kid‑friendly site for learning basic words in Indian languages with **flashcards**, **quizzes**, and a built‑in **voice assistant** (Web Speech API).

## Features
- Rainbow‑styled landing page
- Flashcards with flip + audio
- Multiple‑choice quiz with scoring
- Floating voice assistant (speech recognition + speech synthesis)
- Works offline (except Google Fonts) and deploys easily to **GitHub Pages**

## Folder Structure
```
language-buddy/
│  index.html
│  styles.css
│  app.js
├─ data/
│   └─ words.json
└─ assets/
    ├─ logo.svg
    ├─ mascot.svg
    └─ home.svg
```

## Run locally
Just open `index.html` in a modern browser (Chrome/Edge). For speech recognition, use **HTTPS** or `localhost` (browser requirement). You can also run a quick server:

```bash
# Python 3
python -m http.server 8080
# then open http://localhost:8080
```

## Deploy on GitHub Pages
1. Create a new repository, e.g., `language-buddy`.
2. Upload all files as‑is (keep the folder structure).
3. In the repo settings → **Pages**, set:
   - **Branch**: `main`
   - **Folder**: `/ (root)`
4. Wait for the site to build. Your site will be available at:
   `https://<your-username>.github.io/language-buddy/`

## Voice Assistant commands
- “start quiz”, “start learning”, “home”
- “next”, “flip”, “repeat”
- “select Hindi/Kannada/Telugu/Tamil”
- “restart” (quiz)

## Add or edit words
Open `data/words.json` and add items in the same format:
```json
{
  "hindi": [
    { "script": "नमस्ते", "pron": "/namaste/", "meaning": "Hello/Goodbye" }
  ]
}
```
Make sure each language has at least **4** words for the quiz.

## License
MIT — free to use and modify.
