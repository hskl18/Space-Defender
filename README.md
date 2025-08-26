## Space Defender

An arcade-style space shooter built with Next.js and React. Pilot your ship, dodge enemy fire, collect power-ups, and push for a high score as waves escalate in difficulty.

### Features

- **Fast gameplay**: Smooth movement and responsive shooting
- **Multiple enemy types**: asteroid, fighter, bomber, and boss encounters
- **Power-ups**: rapid fire, shield, multi-shot, health, and laser
- **Special attack**: powerful screen-clearing beam with cooldown
- **Effects**: particle explosions, HUD, and subtle screen shake
- **Progression**: score tracking and increasing waves

### Controls

- **← / →**: Move
- **SPACE**: Shoot
- **SHIFT**: Special attack
- **ESC**: Pause

### Getting Started

Prerequisites: Node.js 18+ (Node 20+ recommended) and npm.

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

Build for production:

```bash
npm run build
npm start
```

### Tech Stack

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**

### Project Structure

```
src/
  app/
    page.tsx          # Renders the game page
  components/
    Game.tsx          # Game logic and rendering
public/               # Static assets
```

### Deployment

This app is optimized for hosting on Vercel.

1. Push your repo to GitHub/GitLab/Bitbucket
2. Import the project in Vercel
3. Use default settings; framework will be detected automatically

### License

No license specified. Add one if you plan to distribute.
