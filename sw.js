/* DARCY FLOW — mantém uma cópia do painel no aparelho para abrir sem internet. */
const CACHE = 'darcy-flow-painel-v1';
const ESSENCIAIS = ['./', './index.html'];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ESSENCIAIS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((chaves) => Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (evento) => {
  const pedido = evento.request;
  if (pedido.method !== 'GET') return;
  const url = new URL(pedido.url);
  if (url.origin !== self.location.origin) return;

  evento.respondWith((async () => {
    try {
      const rede = await fetch(pedido);
      if (rede && rede.ok && (pedido.mode === 'navigate' || url.pathname.endsWith('index.html'))) {
        const copia = await caches.open(CACHE);
        await copia.put('./index.html', rede.clone());
      }
      return rede;
    } catch {
      const copia = await caches.open(CACHE);
      const guardado = await copia.match('./index.html');
      if (guardado) return guardado;
      return new Response(
        '<!doctype html><meta charset="utf-8"><title>DARCY FLOW</title><body style="font-family:system-ui;padding:24px"><h1>Sem internet</h1><p>Abra este endereço uma vez com internet para o painel ficar guardado no aparelho.</p></body>',
        { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } },
      );
    }
  })());
});
