import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const distPath = join(__dirname, 'dist');

// Serve static files from the dist directory
app.use(express.static(distPath));

// WHY: SPA — all routes that don't match a static file should serve index.html
// so client-side routing works on refresh/direct navigation.
app.get('*', (_req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`ERA Foundation OS running on port ${PORT}`);
});
