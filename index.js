const http = require("http");
const fs = require("fs");

const port = process.env.PORT || 3000;

// 📁 file database
const FILE = "keys.json";

// load keys
let KEYS = {};
if (fs.existsSync(FILE)) {
  KEYS = JSON.parse(fs.readFileSync(FILE));
}

// save keys
function save() {
  fs.writeFileSync(FILE, JSON.stringify(KEYS, null, 2));
}

function send(res, data, type = "application/json") {
  res.writeHead(200, { "Content-Type": type });
  res.end(type === "application/json" ? JSON.stringify(data) : data);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  // 🏠 PANEL UI
  if (path === "/") {
    return send(res, `
      <html>
      <body style="background:#111;color:#fff;font-family:sans-serif;padding:20px">
      <h2>🔑 Key Panel</h2>

      <input id="key" placeholder="Key">
      <input id="days" placeholder="Days">
      <button onclick="add()">Add</button>

      <pre id="list"></pre>

      <script>
      async function add(){
        let k=document.getElementById("key").value;
        let d=document.getElementById("days").value;
        await fetch("/add?key="+k+"&days="+d);
        load();
      }
      async function load(){
        let r=await fetch("/list");
        let d=await r.json();
        document.getElementById("list").innerText=JSON.stringify(d,null,2);
      }
      load();
      </script>
      </body>
      </html>
    `, "text/html");
  }

  // ➕ ADD KEY
  if (path === "/add") {
    let key = url.searchParams.get("key");
    let days = parseInt(url.searchParams.get("days") || "1");

    if (!key) return send(res, { error: "key required" });

    key = key.trim().toUpperCase();

    KEYS[key] = {
      expiry: Date.now() + days * 24 * 60 * 60 * 1000
    };

    save();

    return send(res, { status: "ADDED", key, days });
  }

  // 🔍 VERIFY (app use)
  if (path === "/verify") {
    let key = url.searchParams.get("key");
    if (!key) return send(res, { status: "INVALID" });

    key = key.trim().toUpperCase();

    if (!KEYS[key]) return send(res, { status: "INVALID" });

    if (Date.now() > KEYS[key].expiry) {
      return send(res, { status: "EXPIRED" });
    }

    return send(res, {
      status: "SUCCESS",
      access: "GRANTED"
    });
  }

  // 📜 LIST
  if (path === "/list") {
    return send(res, KEYS);
  }

  // ❌ DELETE
  if (path === "/delete") {
    let key = url.searchParams.get("key");
    key = key?.trim().toUpperCase();
    delete KEYS[key];
    save();
    return send(res, { status: "DELETED" });
  }

  send(res, { error: "Not Found" });
});

server.listen(port, "0.0.0.0", () => {
  console.log("Server running...");
});
