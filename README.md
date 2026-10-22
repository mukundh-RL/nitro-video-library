# Nitro video system

A tactile, responsive video-library concept for Rocketlane Nitro. The desktop layout is a silver industrial workstation; viewports below 48rem adapt into a vertically oriented handheld device.

## Run locally

```bash
npm install
npm run dev
```

Create a production build with `npm run build`.

## GitHub Pages deployment

Publish this project in a public repository owned by `mukundh-RL`. In repository Settings → Pages, select **GitHub Actions** as the build source. The included workflow deploys pushes to `main` and can also be started manually from Actions. It derives the asset base path from GitHub Pages, so repository-subpath hosting works without changing the source.

Upload the source, package lockfile, public assets, and `.github` workflow. Do not upload `node_modules`, `dist`, `.git`, or the legacy `.openai` hosting metadata. GitHub builds the site independently of ChatGPT Sites. Videos still stream from Wistia; preserve that hosting and any required domain permissions.

After deployment, use the verified Pages URL as the `src` of a Webflow iframe with `allow="autoplay; fullscreen; picture-in-picture"`, `allowfullscreen`, a descriptive title, and a responsive height. Test playback and picture-in-picture on the published Webflow page, not only in the Designer. Keep the existing site available until the replacement is verified.

## Content and playback

The library retains 14 real Nitro videos and Wistia media IDs. The welcome screen scrolls into the full archive; categories open a large player and a horizontal thumbnail strip. Categories autoplay their first video when idle. All videos and the top-left player back button open the home-page video grid. Switching categories during playback keeps the existing video in picture-in-picture until another thumbnail is selected. Previous, play/pause, next, and back use Mixkit's Interface device click; category pads and video selections use the uploaded Cool interface click tone. The volume slider drives the green level indicator, and the speaker grille toggles mechanical sounds.

The October redesign follows Figma frames 6233:95357 and 6208:94935 in the Nitro workspace file. The room background and shadow overlay use the exact image layers 6313:96989 and 6313:96995. Category pads and video selections use the user-supplied Mixkit Cool interface click tone. Closing PiP preserves the current screen, category, and scroll position. Exact artwork and control assets are stored in public/design; shared Rocketlane tokens, components, and fonts are included in src/design-system so the project builds independently. Public asset paths respect Vite's BASE_URL for future hosting under a Webflow subpath.
