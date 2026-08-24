# Impact - Landing page

Landing page pour l'application Impact, publiée sur GitHub Pages.

## Structure

- `Impact - Landing.dc.html` — source éditable de la page (design canvas).
- `index.html` — build statique généré, publié sur GitHub Pages. Ne pas éditer à la main.
- `build.js` — script qui génère `index.html` à partir du fichier `.dc.html`.
- `assets/` — images, logo, badges stores.

## Générer le build

Après toute modification de `Impact - Landing.dc.html` :

```bash
node build.js
```

Cela régénère `index.html` en fichier autonome (HTML/CSS statique), prêt à être publié sur GitHub Pages.
