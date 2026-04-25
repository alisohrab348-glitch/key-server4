const http = require("http");
const fs = require("fs");

const port = process.env.PORT || 3000;
const FILE = "keys.json";

let KEYS = {};
if (fs.existsSync(FILE)) {
  KEYS = JSON.parse(fs.readFileSync(FILE));
}

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

  // 🌐 MODERN UI PANEL
  if (path === "/") {
    return send(res, `
<!DOCTYPE html>
<html>
<head>
<title>Key Panel</title>
<style>
body{background:#0f172a;color:#fff;font-family:sans-serif;padding:20px}
.card{background:#1e293b;padding:20px;border-radius:10px}
input,button{padding:10px;margin:5px;border:none;border-radius:5px}
input{background:#334155;color:#fff}
button{background:#22c55e;color:#000;cursor:pointer}
.delete{background:#ef4444}
</style>
</head>
<body>

<h2>🔑 Key Management Panel</h2>

<div class="card">
<input id="key" placeholder="Enter key">
<input id="days" placeholder="Days (e.g 60)">
<button onclick="add()">Add Key</button>
</div>

<h3>📜 Keys List</h3>
<div id="list"></div>

<script>
async function add(){
  let k=document.getElementById("key").value;
  let d=document.getElementById("days").value;
  await fetch("/add?key="+k+"&days="+d);
  load();
}

async function del(key){
  await fetch("/delete?key="+key);
  load();
}

async function load(){
  let res=await fetch("/list");
  let data=await res.json();

  let html="";
  for(let k in data){
    html+=\`
    <div class="card">
      <b>\${k}</b><br>
      Expiry: \${new Date(data[k].expiry).toLocaleString()}<br>
      <button class="delete" onclick="del('\${k}')">Delete</button>
    </div>
    \`;
  }
  document.getElementById("list").innerHTML=html;
}
load();
</script>

</body>
</html>
    `, "text/html");
  }

  // ➕ ADD
  if (path === "/add") {
    let key = url.searchParams.get("key");
    let days = parseInt(url.searchParams.get("days") || "1");

    if (!key) return send(res, { error: "key required" });

    key = key.trim().toUpperCase();

    KEYS[key] = {
      expiry: Date.now() + days * 24 * 60 * 60 * 1000
    };

    save();
    return send(res, { status: "ADDED" });
  }

  // 🔍 VERIFY
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
