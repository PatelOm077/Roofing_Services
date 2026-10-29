# Halvorsen Roof & Air — website

Demo website for a roofing + heating & AC contractor (Fort Worth, TX). Plain static site: HTML, CSS and a little vanilla JS, no build step.

- `index.html`: home, with the step-by-step free estimate, before/after slider, hero video and roof time-lapse
- `about.html`: family story, timeline, values, crew
- `contact.html`: contact cards, step-by-step callback request, office hours, FAQ
- `assets/`: photos, videos, `site.css`, `site.js`, favicon
- `netlify.toml`: Netlify config (publishes the repo root)

Estimate and callback requests are saved with Netlify Forms (`estimate` and `callback`). Every push to `main` redeploys on Netlify.
