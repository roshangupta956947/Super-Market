# Fashion Cube

Full-stack e-commerce demo — Express backend (JWT auth, cart, orders, payment)
+ a self-contained vanilla-JS SPA frontend, backed by the DummyJSON product API.

## Setup

```bash
npm install
cp .env.example .env   # then edit .env and set a real JWT_SECRET
npm start               # or: npm run dev (nodemon)
```

Visit `http://localhost:5000`.

`data/*.json` (users, orders, carts) are created automatically on first run —
a demo user (`demo@user.com` / `demo123`) is seeded the first time the server
starts with an empty `data/users.json`.

## Structure

```
server.js              Express entry point — mounts all routes below
src/
  config/database.js   Simple JSON-file "database"
  controllers/          Route handlers (auth, products, cart, orders, payment)
  middleware/            JWT auth guard + centralized error handler
  models/                User / Cart / Order data-access layer
  routes/                Express routers, one per resource
  utils/dummyData.js     (unused fallback data generator)
frontend/
  index.html            App shell — loads utils.js, api.js, app.js only
  css/style.css
  js/
    utils.js            Formatting/validation helpers
    api.js              fetch() wrapper + typed API namespaces
    app.js              The entire SPA — routing, rendering, cart/wishlist/
                         checkout/payment/orders, all in one file
    _unused-legacy/      Earlier per-page modules (auth.js, cart.js, etc.)
                         NOT loaded by index.html — app.js replaced them.
                         Kept only for reference; safe to delete.
  pages/                 Static HTML mockups from an earlier iteration.
                         NOT fetched or used at runtime — app.js renders
                         every page's markup itself via JS. Kept only for
                         reference; safe to delete.
data/                    Auto-generated at runtime (empty in this zip)
```

## Notes / known gaps

- `admin.html` and `checkout.js` were never given real content during
  development, so they're **not included** in this zip — nothing in the
  app currently references them.
- Product currency is INR — prices are converted from DummyJSON's USD at a
  fixed rate in `src/controllers/productController.js` (`USD_TO_INR_RATE`).
- Products are restricted to fashion-relevant DummyJSON categories only
  (see `FASHION_CATEGORIES` in `productController.js`) — no groceries/
  electronics/etc.

## Deploying

- **All-in-one (recommended):** deploy just this repo to Render as a Web
  Service (`npm install` / `npm start`). It serves the frontend and API
  from the same origin — no CORS setup needed.
- **Split (frontend on Netlify, backend on Render):** deploy backend to
  Render, set `FRONTEND_URL` in Render's env vars to your Netlify URL,
  and uncomment/set `window.API_BASE_URL` at the top of `frontend/index.html`
  to your Render URL. Then deploy `frontend/` as a static site on Netlify.
