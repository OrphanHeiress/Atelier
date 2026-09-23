/* Atelier — the working surface of Alisa's art agent.
   Local-first: everything is stored in this browser only. */

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const money = (n) => "$" + Math.round(n).toLocaleString();
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

/* ================= PRIVATE GATE =================
   Casual privacy, not cryptographic security: the page source is still
   readable by anyone determined. It keeps the workspace out of casual view.
   Real protection = Netlify SSO (ask Jinx to enable it). */
const GATE_HASH = "00bddb36a62f5719e4711f0209a8cfffdda5f6c96770c1082799601b5bcb169f"; // sha-256

async function sha256(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function showApp() {
  const gate = document.getElementById("gate");
  const app = document.getElementById("app");
  if (gate) gate.hidden = true;
  if (app) app.hidden = false;
  init();
}

async function tryGate() {
  const input = document.getElementById("gate-pass");
  const msg = document.getElementById("gate-msg");
  if (!input) return;
  const ok = (await sha256(input.value.trim().toLowerCase())) === GATE_HASH;
  if (ok) {
    try { sessionStorage.setItem("atelier.unlocked", "1"); } catch {}
    showApp();
  } else {
    if (msg) msg.textContent = "That's not it. Try again.";
    input.value = "";
    input.focus();
  }
}

/* NOTE: this is CALLED at the very bottom of the file, not here.
   Calling it inline would run showApp() -> init() -> renderWorks() while
   WORKS is still in its temporal dead zone, breaking the app for any
   returning visitor whose session is already unlocked. */
function gateInit() {
  const unlocked = (() => { try { return sessionStorage.getItem("atelier.unlocked") === "1"; } catch { return false; } })();
  if (unlocked) { showApp(); return; }
  const btn = document.getElementById("gate-go");
  const inp = document.getElementById("gate-pass");
  if (btn) btn.addEventListener("click", tryGate);
  if (inp) {
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") tryGate(); });
    inp.focus();
  }
}

/* ---------------- Tabs ---------------- */
$$(".tab").forEach((t) => t.addEventListener("click", () => {
  $$(".tab").forEach((x) => x.classList.remove("active"));
  $$(".view").forEach((v) => v.classList.remove("active"));
  t.classList.add("active");
  $("#" + t.dataset.view).classList.add("active");
}));

/* ================= PORTFOLIO ================= */
/* Story drafts written from the work itself. These are starting points —
   edit them until they sound like you. A story is worth 30–150% on price. */
const WORKS = [
  {
    file: "works/gallery01-a9861849.jpg", title: "", note: "",
    story: "She isn't posing. She's reading, and she's forgotten that anyone might be watching. That's the whole drawing — someone completely inside her own head, at ease in there.",
  },
  {
    file: "works/gallery01-ba89e3fc.jpg", title: "", note: "",
    story: "A glass of wine, a hand at her chin, a thought she hasn't finished. She isn't waiting for anyone. She's just sitting with it.",
  },
  {
    file: "works/gallery01-aabb1c2a.jpg", title: "", note: "",
    story: "Eyes closed, face turned away. This is one of the most private drawings I've made — a moment that was never meant to be watched.",
  },
  {
    file: "works/gallery01-983967f5.jpg", title: "", note: "",
    story: "The old gods were also just bodies in a room. He isn't a statue here. He's a face with vines in his hair, and he doesn't need us to look at him.",
  },
  {
    file: "works/gallery01-bcb759d1.jpg", title: "", note: "",
    story: "Everyone knows what happened to Medusa. I painted her anyway — not as a monster, not as a victim, but as someone who has stopped caring what the story says about her.",
  },
  {
    file: "works/gallery03-c9abc75a.jpg", title: "", note: "",
    story: "Her body is the book. She has read it, she keeps reading it, and she doesn't need anyone else's notes in the margin.",
  },
];

let captions = load("atelier.captions", {});

function renderWorks() {
  const box = $("#works");
  if (!box) return;
  box.innerHTML = "";
  WORKS.forEach((w, i) => {
    const c = captions[w.file] || { title: "", note: "", story: w.story || "" };
    const fig = document.createElement("figure");
    fig.className = "work";
    fig.innerHTML = `
      <div class="frame"><img src="${w.file}" alt="${c.title || "Untitled work"}" loading="lazy"></div>
      <figcaption>
        <input class="cap-title" data-i="${i}" placeholder="Untitled — tap to name" value="${(c.title || "").replace(/"/g, "&quot;")}">
        <input class="cap-note" data-i="${i}" placeholder="medium · size  (tap to add)" value="${(c.note || "").replace(/"/g, "&quot;")}">
        <textarea class="cap-story" data-i="${i}" rows="4" placeholder="Story — what the figure is doing, and why the piece exists">${c.story || w.story || ""}</textarea>
        <button class="copy plain mini-copy" data-i="${i}">Copy listing</button>
      </figcaption>`;
    box.appendChild(fig);
  });
  box.querySelectorAll("textarea.cap-story").forEach((ta) => ta.addEventListener("input", () => {
    const f = WORKS[+ta.dataset.i].file;
    captions[f] = captions[f] || { title: "", note: "", story: "" };
    captions[f].story = ta.value;
    save("atelier.captions", captions);
  }));
  box.querySelectorAll(".mini-copy").forEach((b) => b.addEventListener("click", async () => {
    const i = +b.dataset.i;
    const f = WORKS[i].file;
    const c = captions[f] || {};
    const text = [
      (c.title || "[title]"),
      (c.note || "[medium, size]"),
      "",
      (c.story || WORKS[i].story || ""),
      "",
      "Alisa Rigolin",
    ].join("\n");
    try { await navigator.clipboard.writeText(text); b.textContent = "Copied"; }
    catch { b.textContent = "Select + copy"; }
    setTimeout(() => (b.textContent = "Copy listing"), 1500);
  }));
  box.querySelectorAll(".cap-title").forEach((inp) => inp.addEventListener("input", () => {
    const f = WORKS[+inp.dataset.i].file;
    captions[f] = captions[f] || { title: "", note: "", story: "" };
    captions[f].title = inp.value;
    save("atelier.captions", captions);
    renderWorksNote();
  }));
  box.querySelectorAll(".cap-note").forEach((inp) => inp.addEventListener("input", () => {
    const f = WORKS[+inp.dataset.i].file;
    captions[f] = captions[f] || { title: "", note: "", story: "" };
    captions[f].note = inp.value;
    save("atelier.captions", captions);
    renderWorksNote();
  }));
  renderWorksNote();
}

function renderWorksNote() {
  const el = $("#works-note");
  if (!el) return;
  const named = Object.values(captions).filter((c) => c && c.title && c.title.trim()).length;
  el.textContent = named === 0
    ? "Nothing named yet. Tap a caption to start — your titles save automatically on this device."
    : `${named} of ${WORKS.length} named. Send me the finished list and I'll build a designer-ready lookbook PDF.`;
}

/* ================= PRICING ================= */
function computePrice() {
  const w = +$("#p-w").value, h = +$("#p-h").value;
  const units = $("#p-units").value;
  const stage = +$("#p-stage").value;
  const method = $("#p-method").value;
  const rate = +$("#p-rate").value;
  const hours = +$("#p-hours").value;
  const hr = +$("#p-hr").value;
  const mat = +$("#p-mat").value;
  const frame = +$("#p-frame").value;
  const surface = $("#p-surface").value;

  const win = units === "cm" ? w / 2.54 : w;
  const hin = units === "cm" ? h / 2.54 : h;
  const area = win * hin;
  const lin = win + hin;

  let base = 0;
  if (method === "psi") base = area * rate;
  else if (method === "lin") base = lin * rate * 1.6;
  else base = hours * hr + mat * 2;

  const taper = area > 1200 ? 0.85 : area > 600 ? 0.94 : 1;
  const surfaceAdj = surface === "paper" ? 1.08 : 1;

  const retail = Math.round((base * stage * taper * surfaceAdj) / 5) * 5 + frame;
  const trade = Math.round((retail * 0.8) / 5) * 5;
  // floor = what you must charge: materials + labour, doubled for margin
  const floor = Math.round(((mat + frame) + hours * hr) * 2 / 5) * 5;
  return { retail, trade, floor, keepD: trade, keepG: Math.round(retail * 0.5), psi: area ? retail / area : 0, win, hin };
}
function renderPrice() {
  const r = computePrice();
  $("#p-out").textContent = money(r.retail);
  $("#p-trade").textContent = money(r.trade);
  $("#p-keep-d").textContent = money(r.keepD);
  $("#p-keep-g").textContent = money(r.keepG);
  const psi = $("#p-psi");
  if (psi) psi.textContent = "$" + r.psi.toFixed(2);
  const fl = $("#p-floor");
  if (fl) fl.textContent = money(r.floor);
  const diff = r.keepD - r.keepG;
  const overFloor = r.retail - r.floor;
  $("#p-note").textContent = diff > 0
    ? `Floor ${money(r.floor)} · you're ${money(overFloor)} above it. A designer nets you ${money(diff)} more than a gallery — and pays half up front.`
    : "";
}
["p-w","p-h","p-units","p-stage","p-method","p-rate","p-hours","p-hr","p-mat","p-frame","p-surface"]
  .forEach((id) => { const el = $("#" + id); if (el) el.addEventListener("input", renderPrice); });

let prices = load("atelier.prices", []);
const addBtn = $("#p-add");
if (addBtn) addBtn.addEventListener("click", () => {
  const r = computePrice();
  prices.push({
    title: $("#p-title").value || "Untitled",
    size: `${r.win % 1 ? r.win.toFixed(1) : r.win}×${r.hin % 1 ? r.hin.toFixed(1) : r.hin}`,
    retail: r.retail, trade: r.trade, psi: r.psi,
  });
  save("atelier.prices", prices);
  $("#p-title").value = "";
  renderPriceList();
});
function renderPriceList() {
  const tb = $("#price-table tbody");
  if (!tb) return;
  tb.innerHTML = "";
  $("#price-empty").style.display = prices.length ? "none" : "block";
  prices.forEach((p, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${p.title}</td><td>${p.size}"</td><td>${money(p.retail)}</td>
      <td>${money(p.trade)}</td><td>$${p.psi.toFixed(2)}</td><td class="rm" data-i="${i}">✕</td>`;
    tb.appendChild(tr);
  });
  tb.querySelectorAll(".rm").forEach((b) => b.addEventListener("click", () => {
    prices.splice(+b.dataset.i, 1); save("atelier.prices", prices); renderPriceList();
  }));
}

/* ================= PIPELINE ================= */
const SEED_LEADS = [
  ["Holloway Studios", "commission program", "Chicago", true],
  ["Lauren Coburn", "designer", "Chicago", true],
  ["Celestial Art Curation", "curator", "Chicago", true],
  ["Epic Interiors / PS Art Projects", "designer", "Chicago", false],
  ["Kate Boyce Studio", "designer", "Chicago", false],
  ["Studio Sven", "designer", "Chicago", false],
  ["Studio W Interiors", "designer", "Chicago", false],
  ["Chicago Art Source", "art source", "Chicago", false],
  ["Friedman Fine Art", "gallery", "Chicago", false],
  ["SOW", "shop / wholesale", "Chicago", false],
  ["Fulton Street Collective", "member store", "Chicago", false],
  ["Recycled Modern", "shop", "Chicago", false],
  ["McCormick Gallery", "gallery", "Chicago", false],
  ["Artist Replete", "shop", "Chicago", false],
  ["Chicago Truborn", "shop", "Chicago", false],
  ["Delia LaJeunesse Art Consulting", "art library", "Los Angeles", true],
  ["Emily Colvin / Projects at Large", "art rental", "Los Angeles", true],
  ["Art Solutions", "staging/hospitality", "Los Angeles", true],
  ["deKor LA", "trade program", "Los Angeles", true],
  ["Meredith Gough", "designer + consultant", "Los Angeles", false],
  ["Vanessa Villegas Art Advisory", "advisor", "Los Angeles", false],
  ["Von Gal Von Creative", "creative", "Los Angeles", false],
  ["NAKAJEEM", "shop", "Los Angeles", false],
  ["Callie Humphrey", "designer", "Los Angeles", false],
  ["Kevin Barry Art Advisory", "advisor", "Los Angeles", false],
  ["Julianne Alexandra / JA studio", "studio + gallery", "Los Angeles", false],
  ["Artspace Warehouse", "buyer / consign", "Los Angeles", false],
  ["Casa Victoria", "consignment", "Los Angeles", false],
  ["Perennial LA", "shop", "Los Angeles", false],
  ["CLAVO Space", "represents artists", "Los Angeles", false],
  ["Modern Resale", "resale", "Los Angeles", false],
  ["Harbinger", "trade showroom", "Los Angeles", false],
  ["The Agency Art House", "staging rental", "Los Angeles", false],
  ["HolmeStage", "staging rental", "Los Angeles", false],
  ["Staging LA", "staging rental", "Los Angeles", false],
  ["Two Faced Gallery + Studio", "gallery", "Los Angeles", false],
  ["La Luz de Jesus", "gallery", "Los Angeles", false],
  ["The Art Spread", "gallery (75/25)", "Los Angeles", false],
  ["Abelardo Gallery", "gallery", "Los Angeles", false],
];
const STATUSES = ["NOT","DRAFTED","SENT","REPLIED","WON","PASS"];
const STATUS_LABEL = { NOT:"Not contacted", DRAFTED:"Drafted", SENT:"Sent", REPLIED:"Replied", WON:"Won", PASS:"Pass" };

let leads = load("atelier.leads", null);
if (!leads) {
  leads = SEED_LEADS.map(([name, type, city, top]) => ({ name, type, city, top, status: "NOT" }));
  save("atelier.leads", leads);
}
let cityFilter = "all";
$$("#filters .chip").forEach((c) => c.addEventListener("click", () => {
  $$("#filters .chip").forEach((x) => x.classList.remove("active"));
  c.classList.add("active"); cityFilter = c.dataset.city; renderLeads();
}));
function renderLeads() {
  const tb = $("#leads-table tbody");
  if (!tb) return;
  tb.innerHTML = "";
  leads
    .filter((l) => cityFilter === "all" ? true : cityFilter === "Top fit" ? l.top : l.city === cityFilter)
    .forEach((l) => {
      const idx = leads.indexOf(l);
      const tr = document.createElement("tr");
      tr.innerHTML = `<td data-label="Lead">${l.name}${l.top ? " ★" : ""}</td><td data-label="Type">${l.type}</td>
        <td data-label="City">${l.city}</td>
        <td><span class="status s-${l.status}" data-i="${idx}">${STATUS_LABEL[l.status]}</span></td>`;
      tb.appendChild(tr);
    });
  tb.querySelectorAll(".status").forEach((s) => s.addEventListener("click", () => {
    const i = +s.dataset.i;
    leads[i].status = STATUSES[(STATUSES.indexOf(leads[i].status) + 1) % STATUSES.length];
    save("atelier.leads", leads); renderLeads(); renderTops();
  }));
}

/* ================= MOVES (the decision surface) ================= */
const MOVES = [
  {
    id: "leads",
    title: "Contact the five warmest leads",
    what: "Short, personal intros to Holloway Studios, Lauren Coburn, Delia LaJeunesse, Emily Colvin, and deKor LA.",
    why: "They already source from independent artists, so you're not cold. One good designer reorders 4–10× a year.",
    effort: "1 hour",
  },
  {
    id: "terms",
    title: "Lock your price list and trade terms",
    what: "One price everywhere, 20% to the trade, 50% deposit / 50% on delivery, non-exclusive.",
    why: "You can't quote confidently until the numbers are fixed. This is the thing that makes every later conversation easier.",
    effort: "30 min",
  },
  {
    id: "lookbook",
    title: "Finish the lookbook",
    what: "Titles and dimensions for each work, then I build a single sendable page.",
    why: "Outreach needs something to point at. A lookbook turns 'here's my site' into 'here's this work, for this room.'",
    effort: "1 hour (yours) + mine",
  },
  {
    id: "site",
    title: "Fix the Carrd — one small edit",
    what: "Change 'first to bid' → 'first access to new releases.' Add titles to the works.",
    why: "'Bid' implies an auction. Without demand an auction broadcasts that there isn't any — and quietly lowers your prices.",
    effort: "15 min",
  },
  {
    id: "list",
    title: "Start an email list",
    what: "Any simple signup. Even ten people to begin.",
    why: "Email drives 42% of creator sales — more than every social platform combined. It's the one channel nobody can take from you.",
    effort: "20 min",
  },
  {
    id: "room",
    title: "Photograph one piece in a room",
    what: "One work, on a real wall, in real light. You already did this once with the classical head.",
    why: "Room context converts 2–3× better than flat scans. It signals 'collection' instead of 'poster.'",
    effort: "30 min",
  },
  {
    id: "coa",
    title: "Make a certificate of authenticity template",
    what: "Your name, title, year, medium, dimensions, 'one of a kind,' photo, inventory number, signature.",
    why: "You ship one with every original. It's part of what buyers pay for, and it protects your resale value.",
    effort: "45 min",
  },
  {
    id: "myth",
    title: "Decide the mythic series",
    what: "Medusa, David, the faun. Are they one series with the women, or a separate, older one?",
    why: "Two mythic pieces already exist. Naming it makes it deliberate instead of accidental — and gives designers a story.",
    effort: "thinking time",
  },
];
const MOVE_STATES = ["considering", "deploying", "done", "skip"];
const MOVE_LABEL = { considering: "Considering", deploying: "Deploying", done: "Done", skip: "Skip" };

let moveState = load("atelier.moves", {});
function renderMoves() {
  const box = $("#moves");
  if (!box) return;
  box.innerHTML = "";
  MOVES.forEach((m) => {
    const st = moveState[m.id] || "considering";
    const el = document.createElement("div");
    el.className = "move" + (st === "done" ? " is-done" : st === "skip" ? " is-skip" : "");
    el.innerHTML = `
      <div class="move-head">
        <h3>${m.title}</h3>
        <span class="effort">${m.effort}</span>
      </div>
      <p class="move-what">${m.what}</p>
      <p class="move-why">${m.why}</p>
      <button class="state s-${st}" data-id="${m.id}">${MOVE_LABEL[st]}</button>`;
    box.appendChild(el);
  });
  box.querySelectorAll("button.state").forEach((b) => b.addEventListener("click", () => {
    const id = b.dataset.id;
    const cur = MOVE_STATES.indexOf(moveState[id] || "considering");
    moveState[id] = MOVE_STATES[(cur + 1) % MOVE_STATES.length];
    save("atelier.moves", moveState);
    renderMoves();
  }));
  const deploying = MOVES.filter((m) => moveState[m.id] === "deploying").length;
  const doneN = MOVES.filter((m) => moveState[m.id] === "done").length;
  const note = $("#moves-note");
  if (note) note.textContent = (deploying || doneN)
    ? `${deploying} in progress · ${doneN} done. Tell me which you're deploying and I'll do my half.`
    : "Tell me which one you're deploying and I'll do my half.";
}
function renderTops() {
  const el = $("#agent-tops");
  if (el) el.innerHTML = leads.filter((l) => l.top).map((l) => `<li><strong>${l.name}</strong> — ${l.type} (${l.city})</li>`).join("");
  const fc = $("#first-contacts");
  if (fc) fc.innerHTML = leads.filter((l) => l.top).map((l) => `<li><strong>${l.name}</strong> — ${l.type} (${l.city})</li>`).join("");
}

/* ================= LINE SHEET ================= */
function renderLineSheet() {
  const worksBox = $("#ls-works");
  const tb = $("#ls-table tbody");
  if (!worksBox || !tb) return;

  // visual works grid, from captions
  worksBox.innerHTML = "";
  // visual works grid, from captions
  const named = WORKS.filter((w) => (captions[w.file] || {}).title);
  const show = named.length ? named : WORKS;
  show.forEach((w) => {
    const c = captions[w.file] || {};
    const fig = document.createElement("figure");
    fig.className = "ls-work";
    fig.innerHTML = `
      <img src="${w.file}" alt="${c.title || "Untitled"}" loading="lazy">
      <figcaption>
        <strong>${c.title || "Untitled"}</strong>
        ${c.note ? `<span>${c.note}</span>` : ""}
      </figcaption>`;
    worksBox.appendChild(fig);
  });

  // pricing table
  tb.innerHTML = "";
  prices.forEach((p) => {
    const tr = document.createElement("tr");
    const t = Math.round((p.retail * 0.8) / 5) * 5;
    tr.innerHTML = `<td>${p.title}</td><td>${p.size}"</td><td>${money(p.retail)}</td><td>${money(t)}</td>`;
    tb.appendChild(tr);
  });
  $("#ls-empty").style.display = prices.length ? "none" : "block";
  $("#ls-table").style.display = prices.length ? "table" : "none";

  const st = $("#ls-status");
  if (st) {
    const nW = named.length, nP = prices.length;
    st.textContent = (nW === 0 && nP === 0)
      ? "Nothing to show yet — name your pieces in Portfolio and price them in Price."
      : `${nW} named work${nW === 1 ? "" : "s"} · ${nP} priced. Open the PDF and check it reads the way you'd want a designer to see it.`;
  }
}

const lsPrint = $("#ls-print");
if (lsPrint) lsPrint.addEventListener("click", () => window.print());

/* ================= DATA EXPORT / IMPORT ================= */
const EXPORT_KEYS = ["atelier.leads", "atelier.prices", "atelier.moves", "atelier.captions", "atelier.ai"];

function exportData() {
  const payload = { app: "atelier", version: 1, exported: new Date().toISOString(), data: {} };
  EXPORT_KEYS.forEach((k) => {
    const v = localStorage.getItem(k);
    if (v !== null) { try { payload.data[k] = JSON.parse(v); } catch { payload.data[k] = v; } }
  });
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `atelier-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $("#d-status").textContent = "Exported. Keep that file somewhere safe.";
}
function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(reader.result);
      const data = payload && payload.data ? payload.data : payload;
      if (!data || typeof data !== "object") throw new Error("Unrecognised file");
      let n = 0;
      Object.keys(data).forEach((k) => {
        if (EXPORT_KEYS.includes(k)) { localStorage.setItem(k, JSON.stringify(data[k])); n++; }
      });
      if (!n) throw new Error("No Atelier data found in that file");
      $("#d-status").textContent = `Imported ${n} section(s). Reloading…`;
      setTimeout(() => location.reload(), 900);
    } catch (e) {
      $("#d-status").textContent = "Couldn't read that file: " + e.message;
    }
  };
  reader.readAsText(file);
}
const dExport = $("#d-export"), dImport = $("#d-import"), dFile = $("#d-file");
if (dExport) dExport.addEventListener("click", exportData);
if (dImport && dFile) {
  dImport.addEventListener("click", () => dFile.click());
  dFile.addEventListener("change", (e) => { if (e.target.files[0]) importData(e.target.files[0]); e.target.value = ""; });
}

/* ---------------- copy buttons ---------------- */
$$("button.copy.plain").forEach((b) => b.addEventListener("click", async () => {
  const src = document.getElementById(b.dataset.copyTarget);
  if (!src) return;
  const text = (src.value && src.value !== "Placeholder")
    ? src.value
    : $$(".statement p").map((p) => p.textContent.trim()).join("\n\n");
  try { await navigator.clipboard.writeText(text); b.textContent = "Copied"; }
  catch { b.textContent = "Select + copy"; }
  setTimeout(() => (b.textContent = "Copy statement"), 1500);
}));

/* ---------------- jump buttons ---------------- */
$$("[data-goto]").forEach((b) => b.addEventListener("click", () => {
  const target = b.dataset.goto;
  const tab = document.querySelector(`.tab[data-view="${target}"]`);
  if (tab) tab.click();
  window.scrollTo({ top: 0, behavior: "smooth" });
}));

/* ---------------- init (runs after the gate unlocks) ---------------- */
function init() {
  renderWorks();
  renderPrice(); renderPriceList(); renderLeads(); renderTops(); renderLineSheet();
}

/* ---------------- boot (must be last: everything above is initialised) ---------------- */
gateInit();
