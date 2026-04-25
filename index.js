const http = require("http");

const port = process.env.PORT || 3000;

// 🔑 simple key store
const KEYS = {
  VIP123: {
    hwid: null,
    expiry: Date.now() + 24 * 60 * 60 * 1000
  }
};

const server = http.createServer((req, res) => {
  // ⭐ Proper URL parse (IMPORTANT)
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname; // <-- clean path मिलेगा

  // 🔍 Debug (logs में दिखेगा)
  console.log("PATH:", path);

  // ✅ VERIFY ROUTE (exact match)
  if (path === "/verify" || path === "/verify/") {
    const key = url.searchParams.get("key");
    const hwid = url.searchParams.get("hwid");

    if (!KEYS[key]) {
      return send(res, { status: "INVALID" });
    }

    const data = KEYS[key];

    if (data.hwid && data.hwid !== hwid) {
      return send(res, { status: "WRONG_DEVICE" });
    }

    if (Date.now() > data.expiry) {
      return send(res, { status: "EXPIRED" });
    }

    return send(res, {
      status: "SUCCESS",
      timeLeft: "24h",
      used: 1,
      max: 1
    });
  }

  // 🏠 ROOT (test के लिए)
  if (path === "/") {
    return send(res, { status: "SERVER_OK" });
  }

  // ❌ fallback
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not Found", path }));
});

function send(res, obj) {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(obj));
}

server.listen(port, "0.0.0.0", () => {
  console.log("Server running...");
});
