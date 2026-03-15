# Roam Energy – Marketing Page

A static marketing and information site for **Roam Energy**: solar and sustainable energy solutions for African homes, businesses, and communities. The page highlights products, projects, and contact options and supports the Roam mobility and energy ecosystem.

## What’s included

* **Home** – Hero, about, and key value propositions
* **Products** – Solar and energy product overview
* **Projects** – Showcase of deployments and use cases
* **About** – Company mission and sustainable energy focus
* **Contact** – Get in touch

## Tech stack

* **Static HTML** – No build step required
* **Tailwind CSS** (CDN) – Styling
* **Vanilla JavaScript** – Interactivity and mobile menu
* **AOS** – Scroll animations
* **Swiper** – Carousels where used
* **Font Awesome** – Icons

## Project structure

```
roam-energy-page/
└── Energy V1/
    ├── index.html      Home page
    ├── products.html   Products page
    ├── projects.html  Projects page (or section)
    ├── style.css      Custom styles
    ├── script.js      Main JS (e.g. nav, AOS init)
    ├── products.js    Products-specific logic
    ├── projects.js    Projects-specific logic
    ├── products.css
    ├── projects.css
    └── ROAM_LOGO.png  (or Roam_Logo.png) – Logo asset
```

## Running locally

No build or install step. Serve the `Energy V1` folder with any static server.

**Option 1 – VS Code Live Server**  
Right-click `Energy V1/index.html` and choose “Open with Live Server”.

**Option 2 – Node (npx)**  
From the repo root:

```bash
cd "roam-energy-page/Energy V1"
npx serve .
```

Then open the URL shown (e.g. http://localhost:3000).

**Option 3 – Python**  
From `Energy V1`:

```bash
# Python 3
python -m http.server 8000
# Open http://localhost:8000
```

## Deployment

Deploy the **Energy V1** directory as a static site:

* **Netlify** – Drag and drop the `Energy V1` folder or connect the repo and set publish directory to `roam-energy-page/Energy V1`
* **Vercel** – Set root to `roam-energy-page/Energy V1` and deploy as static
* **GitHub Pages** – Configure source to use the branch/folder that contains `Energy V1`, or copy `Energy V1` contents into the repo root for Pages
* **Any static host** – Upload the contents of `Energy V1` to the server’s web root

No environment variables or server-side config are required.

## Customization

* **Copy and assets** – Edit the HTML files and any referenced images (e.g. `ROAM_LOGO.png`) in `Energy V1`
* **Styles** – Adjust `style.css`, `products.css`, and `projects.css`; Tailwind is loaded via CDN in the HTML
* **Scripts** – Update `script.js`, `products.js`, and `projects.js` for behavior and content

## License

Use as specified for the Roam Energy project.
