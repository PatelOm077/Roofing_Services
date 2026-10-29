# Halvorsen Roof & Air — website

Demo website for a roofing + heating & AC contractor (Fort Worth, TX). Plain static site: HTML, CSS and a little vanilla JS, no build step. Designed phone-first.

- `index.html`: home: hero video, roof time-lapse + before/after slider, quote teaser, services, owner, reviews, service areas
- `quote.html`: free quote + call back in one step-by-step flow (service, home size, urgency, ballpark price, call time, name, mobile). Links like `quote.html?s=storm` start with a service picked.
- `about.html`: family story, timeline, values, crew
- `contact.html`: contact cards, call-back teaser, office hours, FAQ
- `assets/`: photos, videos, `style.css`, `site.js`, favicon
- `netlify.toml`: Netlify config (publishes the repo root)

Quote requests post to Netlify Forms (`quote`) once form detection is enabled for the site. Every push to `main` redeploys on Netlify.
