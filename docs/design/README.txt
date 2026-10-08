WAAFA — Website, Waafas World and Admin · design prototype
==========================================================

OPEN IT
  1. Unzip the folder anywhere.
  2. Double-click index.html. It opens in your browser; no install, no server.
  3. Pick a section on the left. Desktop screens open full size in a new tab.
     Phone screens open in a 390 px phone frame (use Prev / Next).

  Works in Chrome, Edge, Firefox and Safari. Everything works offline.
  Video loops play muted; if your system asks for reduced motion you see
  the poster frame instead, which is how the live site should behave too.

PHOTOS AND VIDEO
  The design canvas cannot load outside photos, so every photo slot shows an
  original drawn scene as a stand-in. To see the real photos the site will use:

      cd photos
      node get-waafa-photos.mjs        (needs Node 18+ and internet)

  The script saves every photo with its credit in photos/ and the prototype
  shows them automatically the next time you open it. When you are online, the
  Unsplash originals load even without the script.
  Credits: photos/CREDITS.txt (Unsplash licence).
  Rule for the live site (from the PRD): real photos only, never AI-generated,
  painted or drawn scenes.

  The twelve video loops are in assets/ (MP4 and WebM). The route map,
  passport and product videos are motion graphics the site can use as they
  are; the scenery loops are stand-ins to replace with real footage.

WHAT'S INSIDE
  index.html      list of all screens with thumbnails
  view.html       phone viewer
  project/        every screen (.dc.html), waafa.css (all design tokens and
                  styles), deps.js (shared components) and support.js (the small
                  runtime that makes the screens work)
  photos.css      connects each photo slot to photos/, Unsplash, then the stand-in
  vendor/         React 18.3.1
  assets/         logo, Better Day product photos, flags, stand-in scenes,
                  video loops and their posters
  fonts/          Inter, Plus Jakarta Sans, Hind Siliguri (SIL OFL)
  photos/         real photos (after running the script) and credits
  thumbs/         screen thumbnails for the index
  handoff/        developer handoff for Claude Code: HANDOFF.md (routes,
                  components, 21st.dev effects, motion, build order, rules),
                  tokens.css (Tailwind v4 @theme) and screens.csv

FOR DEVELOPERS (Claude Code)
  Copy this folder into the repo as docs/design/ next to docs/PRD.md, then start
  with handoff/HANDOFF.md. Each route lists the screens to match.

FIGMA
  The Figma file (figma.com/design/KjT8dfjEAMR55wRR7ar1Ws) holds the design
  tokens as variables (colours, radius, spacing, sizes, with code names from
  tokens.css), the text and shadow styles, the core components (buttons, chips,
  badges, input, package card, logo and the phone tab bar with the Waafas World
  disc) and a Screens page with one section per part of the site.
  Every screen as an image is in the three Waafa-Screens zips (1 to 3): drag a
  folder's images onto its section in the Screens page. Figma shrinks images taller than 4096 px, so
  the few very tall pages also come in parts; stack those top to bottom.

NOTES
  Sample data throughout: names, numbers and references are placeholders.
  Live mode (Phase 2) screens use fixture data; at launch every travel search
  becomes a lead, and fares are confirmed by an expert before payment.
