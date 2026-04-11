import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const songsDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'src/features/lyrics/songs'
);

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
  });
}

function localSongsApi() {
  return {
    name: 'local-songs-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? '';
        if (!url.startsWith('/api/songs')) return next();

        res.setHeader('Content-Type', 'application/json');
        const songId = decodeURIComponent(url.replace(/^\/api\/songs\/?/, '').split('?')[0]);

        try {
          if (req.method === 'GET' && !songId) {
            const songs = fs
              .readdirSync(songsDir)
              .filter((f) => f.endsWith('.json'))
              .map((f) => {
                const song = JSON.parse(
                  fs.readFileSync(path.join(songsDir, f), 'utf-8')
                );
                return { id: song.id, title: song.title, artist: song.artist };
              });
            res.end(JSON.stringify(songs));
          } else if (req.method === 'GET' && songId) {
            const filePath = path.join(songsDir, `${songId}.json`);
            if (fs.existsSync(filePath)) {
              res.end(fs.readFileSync(filePath, 'utf-8'));
            } else {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'Not found' }));
            }
          } else if (req.method === 'PUT' && songId) {
            const body = await readBody(req);
            fs.writeFileSync(
              path.join(songsDir, `${songId}.json`),
              JSON.stringify(JSON.parse(body), null, 2)
            );
            res.end(JSON.stringify({ ok: true }));
          } else if (req.method === 'DELETE' && songId) {
            const filePath = path.join(songsDir, `${songId}.json`);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            res.end(JSON.stringify({ ok: true }));
          } else {
            next();
          }
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(err) }));
        }
      });
    }
  };
}

export default defineConfig({
  site: 'https://jocywolff.com',
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
    sitemap({
      filter: (page) => !page.includes('/lyrics-editor'),
    }),
  ],
  vite: {
    plugins: [localSongsApi()],
  },
});
