# Dot&Dash

### A Morse Code Speed Trainer

Dot&Dash is a browser-based Morse code trainer inspired by the speed and feedback loop of tools like Monkeytype.

Practice encoding and decoding Morse code while tracking **WPM, accuracy, mistakes, streaks, achievements, and progress over time**.

[**Live Demo**](YOUR_LIVE_DEMO_URL)

![Dot\&Dash](docs/screenshot.png)

---

## ✨ Features

* **Real-time WPM & accuracy** tracking
* **Multiple practice modes**

  * Letters
  * Words
  * Sentences
  * Numbers
  * Mixed
* **Morse audio training** with Farnsworth timing
* **Progress tracking** across practice sessions
* **17 achievements** to unlock
* **Daily challenges**
* **Weak-symbol tracking** to identify characters that need more practice
* **Profile & statistics dashboard** with charts
* **CSV export** for your practice data
* **Authentication** with Supabase
* **Cross-device synchronization**
* **Server-side statistics validation**

---

## 🖥️ Two Versions

Dot&Dash started as a lightweight single-page prototype and was later expanded into a full-stack application.

### Prototype

`docs/index.html`

A completely self-contained Morse code trainer that runs directly in the browser.

* Zero dependencies
* No backend required
* Local-only statistics
* Can be hosted directly with GitHub Pages

### Full-Stack Version

`src/`

The main application is built with **Next.js + Supabase** and adds:

* User accounts
* Persistent database storage
* Cross-device synchronization
* Server-side statistics
* Achievements
* Profile analytics
* Daily challenge infrastructure

---

## 🧠 How It Works

The practice engine generates Morse training content using a shuffle-bag system and procedural generation.

During a test, Dot&Dash tracks:

* Characters typed
* Correct and incorrect inputs
* Timing
* WPM
* Accuracy
* Per-symbol mistakes

Completed tests are sent to the backend, where the user's statistics and achievements are updated.

The Morse engine and audio engine are implemented as independent TypeScript modules, keeping the core training logic separate from the UI.

---

## 🛠️ Tech Stack

| Technology        | Purpose                              |
| ----------------- | ------------------------------------ |
| **Next.js**       | Application framework                |
| **React**         | UI                                   |
| **TypeScript**    | Application logic                    |
| **Tailwind CSS**  | Styling                              |
| **Supabase**      | Authentication & PostgreSQL database |
| **Recharts**      | Statistics visualisation             |
| **Web Audio API** | Morse audio generation               |

---

## 📁 Project Structure

```text
dot-dash/
├── docs/
│   └── index.html              # Standalone browser prototype
│
├── src/
│   ├── app/
│   │   ├── practice/           # Main practice interface
│   │   ├── profile/            # Statistics & achievements
│   │   ├── login/              # Authentication
│   │   ├── signup/             # Account creation
│   │   └── api/
│   │       ├── tests/           # Test submission & statistics
│   │       ├── stats/           # User statistics
│   │       └── daily/           # Daily challenge data
│   │
│   ├── components/             # Reusable UI components
│   ├── hooks/
│   │   └── usePracticeEngine.ts
│   │
│   └── lib/
│       ├── morse.ts             # Morse data & generation
│       ├── audio.ts             # Web Audio / Farnsworth timing
│       ├── achievements.ts      # Achievement definitions
│       └── supabase/             # Supabase clients
│
├── supabase/
│   └── schema.sql               # Database schema & RLS policies
│
├── .env.example
├── next.config.mjs
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Requirements

* Node.js 18+
* npm
* A Supabase project

### 1. Clone the repository

```bash
git clone https://github.com/skillissueguykagit/dot-dash.git
cd dot-dash
```

### 2. Create a Supabase project

Create a project on [Supabase](https://supabase.com/).

Then open the **SQL Editor** and run:

```text
supabase/schema.sql
```

This creates the required tables, Row Level Security policies, and profile trigger.

### 3. Configure environment variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these in your Supabase project's API settings.

### 4. Install dependencies

```bash
npm install
```

### 5. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## ☁️ Deployment

### Next.js application

The full-stack version can be deployed to **Vercel**.

1. Import the repository into Vercel.
2. Add:

   * `NEXT_PUBLIC_SUPABASE_URL`
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy.

Supabase handles authentication and database storage separately.

### Prototype

The standalone prototype in `docs/index.html` can be deployed using GitHub Pages.

Enable GitHub Pages for the repository using:

```text
Settings → Pages → Deploy from a branch
Branch: main
Folder: /docs
```

---

## 🗺️ Roadmap

The following features have their underlying logic implemented or partially implemented but still need UI integration:

* [ ] Reverse mode
* [ ] Custom symbol practice
* [ ] Weak-symbol practice mode
* [ ] Daily challenge interface
* [ ] Ghost replay
* [ ] Morse code cheat sheet
* [ ] Theme switcher
* [ ] Global leaderboard
* [ ] Daily leaderboard
* [ ] Achievement toast notifications

---

## 📊 Statistics

Dot&Dash tracks more than a single WPM score.

The profile system records:

* Best WPM
* Average accuracy
* Practice streaks
* Cumulative symbol mistakes
* Test history
* Achievement progress
* Weakest Morse symbols

This makes the trainer useful for identifying **which parts of Morse code you actually struggle with**, rather than simply measuring how fast you can type.

---

## 🔐 Security

Authentication and persistent data are handled through Supabase.

The application uses:

* Supabase Auth
* Server-side API routes
* PostgreSQL
* Row Level Security
* Server-side statistic aggregation

Sensitive environment variables should be stored in `.env.local` and must never be committed to the repository.

---

## 📄 License

Dot&Dash is released under the **MIT License**.

See [`LICENSE`](LICENSE) for details.

---

## 👤 Author

**Mayank Pradhan**

GitHub: [@skillissueguykagit](https://github.com/skillissueguykagit)
