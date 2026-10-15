# Open-source Three.js + MindAR WebAR

Three image targets, one active model, continuous background music and per-target looping audio. MIT-licensed libraries; no paid AR SDK or server.

## Requirements
- Node.js 20+
- Three GLB models in `public/models/model-0.glb` through `model-2.glb`
- Four MP3s: `public/audio/background.mp3` and `target-0.mp3` through `target-2.mp3`
- `public/targets/targets.mind`, compiled with https://hiukim.github.io/mind-ar-js-doc/tools/compile/ from three distinct images in order 0, 1, 2.

These binary assets are NOT included; the project will not start correctly until you supply them.

## Local development

```bash
npm install
npm run dev
```

Visit the displayed localhost URL on the computer. Phone camera testing requires HTTPS; use GitHub Pages for that.

## GitHub Pages
1. Create a public repository, upload this entire project including `.github/workflows/deploy.yml`.
2. Push to the `main` branch.
3. In Settings → Pages, set Source to **GitHub Actions**.
4. Wait for the workflow to finish. Open the published HTTPS URL on a phone.

`vite.config.js` sets the repository base path automatically in GitHub Actions. For custom domains or manual builds, change `base` as needed.

## Adjust content
Edit `src/config.js` for model paths, audio, scale and position. The compiled `.mind` target order must match indexes. Audio starts after a user gesture; browser policies vary. The current version switches audio immediately (no fade), and if the currently active target disappears it returns to scanning. With `maxTrack: 1`, only one target is tracked at a time.

## Notes
- Prefer textured, high-contrast target images without repetitive patterns.
- Keep GLBs optimized for mobile devices.
- The included code is a starter and has not been validated on physical Android/iOS devices.
- GitHub Pages hosting is proprietary, but the app and dependencies are open-source and portable to another HTTPS static host.
