import { items, siteTitle, siteSubtitle } from "./items.js";
import { firebaseConfig } from "./firebase-config.js";

const FIREBASE_VERSION = "10.14.1";
const LOCAL_KEY = "wishlist-purchased-v1";
const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="100%" height="100%" fill="#f4f1ea"/><text x="50%" y="50%" font-family="sans-serif" font-size="28" fill="#999" text-anchor="middle" dominant-baseline="middle">Image unavailable</text></svg>`
  );

const grid = document.getElementById("grid");
const cards = new Map(); // id -> { card, button }
let purchased = {}; // { id: true }
let setPurchased = () => {}; // replaced by the active storage backend

// ---------- helpers ----------
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function itemId(item) {
  return slugify(`${item.name} ${item.size || ""}`) || "item";
}

// ---------- rendering ----------
function buildCard(item, id) {
  const card = document.createElement("article");
  card.className = "card";

  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = "Purchased ✓";

  const link = document.createElement("a");
  link.className = "card-link";
  link.href = item.link;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.setAttribute("aria-label", `${item.name} — open product page`);

  const img = document.createElement("img");
  img.className = "card-image";
  img.src = item.image;
  img.alt = item.name;
  img.loading = "lazy";
  img.referrerPolicy = "no-referrer";
  img.addEventListener("error", () => {
    img.src = PLACEHOLDER;
  }, { once: true });

  const body = document.createElement("div");
  body.className = "card-body";

  const name = document.createElement("h2");
  name.className = "card-name";
  name.textContent = item.name;
  body.appendChild(name);

  if (item.size && String(item.size).trim()) {
    const size = document.createElement("p");
    size.className = "card-size";
    size.textContent = `Size: ${item.size}`;
    body.appendChild(size);
  }

  link.append(img, body);

  const button = document.createElement("button");
  button.type = "button";
  button.className = "toggle";
  button.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    setPurchased(id, !purchased[id]);
  });

  card.append(badge, link, button);
  cards.set(id, { card, button });
  return card;
}

function refresh() {
  for (const [id, { card, button }] of cards) {
    const isPurchased = Boolean(purchased[id]);
    card.classList.toggle("purchased", isPurchased);
    button.textContent = isPurchased ? "Undo — not purchased" : "Mark as purchased";
    button.setAttribute("aria-pressed", String(isPurchased));
  }
}

function renderAll() {
  document.getElementById("site-title").textContent = siteTitle;
  document.title = siteTitle;
  document.getElementById("site-subtitle").textContent = siteSubtitle;

  const seen = new Set();
  items.forEach((item) => {
    let id = itemId(item);
    while (seen.has(id)) id += "-2"; // safety net if two items share a name
    seen.add(id);
    grid.appendChild(buildCard(item, id));
  });
  document.getElementById("empty").hidden = items.length > 0;
  refresh();
}

// ---------- storage backends ----------
function useLocalStorage(showBanner) {
  try {
    purchased = JSON.parse(localStorage.getItem(LOCAL_KEY)) || {};
  } catch {
    purchased = {};
  }
  setPurchased = (id, value) => {
    if (value) purchased[id] = true;
    else delete purchased[id];
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(purchased));
    } catch {}
    refresh();
  };
  if (showBanner) document.getElementById("local-banner").hidden = false;
  refresh();
}

async function useFirebase() {
  const [{ initializeApp }, { getDatabase, ref, onValue, set, remove }] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-database.js`),
  ]);
  const db = getDatabase(initializeApp(firebaseConfig));

  setPurchased = (id, value) => {
    const itemRef = ref(db, `purchased/${id}`);
    // Update the screen immediately; the database listener keeps everyone in sync.
    if (value) purchased[id] = true;
    else delete purchased[id];
    refresh();
    return value ? set(itemRef, true) : remove(itemRef);
  };

  onValue(
    ref(db, "purchased"),
    (snapshot) => {
      purchased = snapshot.val() || {};
      refresh();
    },
    (error) => {
      console.error("Firebase read failed, falling back to this device only:", error);
      useLocalStorage(true);
    }
  );
}

// ---------- start ----------
async function init() {
  renderAll();
  const configured =
    firebaseConfig &&
    firebaseConfig.databaseURL &&
    !firebaseConfig.databaseURL.includes("YOUR_");
  if (!configured) {
    useLocalStorage(true);
    return;
  }
  try {
    await useFirebase();
  } catch (error) {
    console.error("Could not start Firebase:", error);
    useLocalStorage(true);
  }
}

init();
