/**
 * Drive the running Chrome over CDP, because the built-in browser daemon will
 * not start in this container even with Chromium installed.
 *
 * Chrome must already be listening on 9222. Launch it with TMPDIR=/tmp — the
 * scratch directory refuses the unix socket Chrome binds for its profile, and
 * Chrome then aborts with 'Failed to create a ProcessSingleton'.
 *
 * The script opens a target, walks the page and prints one JSON line per
 * assertion: the sections present, how many stages are locked, and whether the
 * waiting notice is still on the page — before and after a run.
 *
 *   bun scripts/live-flow-check.ts [url]
 */

const BASE = "http://127.0.0.1:9222";
const URL = process.argv[2] ?? "http://localhost:3000/";

type Pending = { resolve: (v: unknown) => void; reject: (e: Error) => void };

const target = await fetch(`${BASE}/json/new?${encodeURIComponent(URL)}`, { method: "PUT" }).then(
  (r) => r.json() as Promise<{ id: string; webSocketDebuggerUrl: string }>,
);

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise<void>((resolve, reject) => {
  ws.onopen = () => resolve();
  ws.onerror = (e) => reject(new Error(`ws error: ${String(e)}`));
});

let seq = 0;
const pending = new Map<number, Pending>();

ws.onmessage = (event) => {
  const msg = JSON.parse(String(event.data)) as { id?: number; result?: unknown; error?: unknown };
  if (msg.id === undefined) return;
  const slot = pending.get(msg.id);
  if (!slot) return;
  pending.delete(msg.id);
  if (msg.error) slot.reject(new Error(JSON.stringify(msg.error)));
  else slot.resolve(msg.result);
};

function send<T = unknown>(method: string, params: Record<string, unknown> = {}): Promise<T> {
  const id = ++seq;
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
    ws.send(JSON.stringify({ id, method, params }));
    setTimeout(() => {
      if (pending.delete(id)) reject(new Error(`${method} timed out`));
    }, 30000);
  });
}

async function evaluate(expression: string): Promise<string> {
  const res = await send<{ result: { value?: unknown; description?: string } }>("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  const v = res.result?.value;
  return typeof v === "string" ? v : (res.result?.description ?? JSON.stringify(v));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

await send("Page.enable");

// The client bundle hydrates well after the first paint, so wait for the run
// button to exist before reading or clicking — an early click is a silent no-op
// and reads exactly like a feature that does not work.
const READY = `(() => {
  const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('نفّذ'));
  return b ? 'ready' : 'waiting';
})()`;

let ready = "waiting";
for (let i = 1; i <= 60; i++) {
  await sleep(1000);
  ready = await evaluate(READY);
  if (ready === "ready") {
    console.log(`HYDRATED after ~${i}s`);
    break;
  }
}
if (ready !== "ready") {
  console.log("NOT HYDRATED — aborting rather than reporting a false failure");
  ws.close();
  process.exit(1);
}
await sleep(1000);

const READ = `(() => {
  const secs = [...document.querySelectorAll('section[id]')].map(e => e.id);
  const nav = document.querySelector('nav[aria-label="مراحل سير العمل"]');
  const locked = nav ? nav.querySelectorAll('[aria-disabled="true"]').length : -1;
  const links = nav ? [...nav.querySelectorAll('a')].map(a => a.getAttribute('href')) : null;
  return JSON.stringify({
    sections: secs,
    lockedInStepper: locked,
    stepLinks: links,
    headerNav: [...document.querySelectorAll('header nav a')].map(a => a.getAttribute('href')),
    lockNotice: document.body.innerText.includes('بقية الأقسام تُفتح بعد التنفيذ'),
    buttons: [...document.querySelectorAll('button')].map(b => b.textContent.trim()).filter(t => t && t.length < 40)
  });
})()`;

console.log("BEFORE " + (await evaluate(READ)));

console.log(
  "EXAMPLE " +
    (await evaluate(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('مثال'));
      if (!b) return 'no example button';
      b.click();
      return 'clicked: ' + b.textContent.trim();
    })()`)),
);
await sleep(1500);

console.log(
  "RUN " +
    (await evaluate(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('نفّذ'));
      if (!b) return 'no run button';
      const label = b.textContent.trim();
      b.click();
      return 'clicked: ' + label;
    })()`)),
);

let after = "";
for (let i = 1; i <= 45; i++) {
  await sleep(2000);
  after = await evaluate(READ);
  const n = (JSON.parse(after) as { sections: string[] }).sections.length;
  if (n >= 5) {
    console.log(`REVEALED after ~${i * 2}s`);
    break;
  }
  if (i % 5 === 0) console.log(`  t=${i * 2}s ` + after);
}

console.log("AFTER " + after);
console.log(
  "VERDICT " +
    (await evaluate(`(() => {
      const t = document.body.innerText;
      const nav = document.querySelector('nav[aria-label="مراحل سير العمل"]');
      return JSON.stringify({
        activeChip: t.includes('الحالة النشطة'),
        reason: t.includes('السبب'),
        evidence: t.includes('الدليل'),
        digest: (t.match(/[0-9a-f]{32}/) || [null])[0],
        lockedRemaining: nav ? nav.querySelectorAll('[aria-disabled="true"]').length : -1,
        stepLinks: nav ? [...nav.querySelectorAll('a')].map(a => a.getAttribute('href')) : null
      });
    })()`)),
);

ws.close();
await fetch(`${BASE}/json/close/${target.id}`);

// Top-level await needs this file to be a module, not a script.
export {};
