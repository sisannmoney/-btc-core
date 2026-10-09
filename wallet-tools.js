(() => {
  const STYLE_ID = "btc-wallet-tools-style";
  const PANEL_ID = "btc-wallet-panel";
  const BTN_ID = "btc-wallet-btn";

  if (document.getElementById(BTN_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    #${BTN_ID}{
      position:fixed;
      right:16px;
      bottom:90px;
      z-index:99998;
      border:1px solid #ffbf3f;
      background:rgba(10,10,12,.92);
      color:#ffd76a;
      padding:12px 16px;
      border-radius:18px;
      font-weight:800;
      letter-spacing:1px;
      box-shadow:0 0 20px rgba(255,180,40,.35);
    }

    #${PANEL_ID}{
      display:none;
      position:fixed;
      inset:0;
      z-index:99999;
      background:rgba(0,0,0,.72);
      backdrop-filter:blur(8px);
      padding:20px;
      overflow:auto;
    }

    #${PANEL_ID}.open{
      display:block;
    }

    .btc-wallet-card{
      max-width:520px;
      margin:45px auto;
      background:linear-gradient(
        180deg,
        rgba(28,24,18,.98),
        rgba(7,8,11,.98)
      );
      border:1px solid #dca83b;
      border-radius:24px;
      padding:20px;
      color:white;
      box-shadow:0 0 35px rgba(255,183,48,.25);
      font-family:-apple-system,BlinkMacSystemFont,sans-serif;
    }

    .btc-wallet-head{
      display:flex;
      justify-content:space-between;
      align-items:center;
      margin-bottom:18px;
    }

    .btc-wallet-title{
      font-size:20px;
      font-weight:900;
      color:#ffd76a;
      letter-spacing:2px;
    }

    .btc-wallet-close{
      border:0;
      background:#222;
      color:white;
      width:36px;
      height:36px;
      border-radius:50%;
      font-size:20px;
    }

    .btc-wallet-label{
      font-size:12px;
      color:#aaa;
      margin-top:14px;
      margin-bottom:6px;
    }

    .btc-wallet-input{
      width:100%;
      background:#11151b;
      color:white;
      border:1px solid #424854;
      border-radius:14px;
      padding:13px;
      font-size:16px;
      outline:none;
    }

    .btc-wallet-grid{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:10px;
      margin-top:18px;
    }

    .btc-wallet-stat{
      background:#101217;
      border:1px solid #2f333d;
      border-radius:16px;
      padding:13px;
    }

    .btc-wallet-stat small{
      color:#999;
      display:block;
      margin-bottom:5px;
    }

    .btc-wallet-stat strong{
      font-size:16px;
    }

    .btc-wallet-save{
      width:100%;
      margin-top:16px;
      border:1px solid #e8b84d;
      background:linear-gradient(180deg,#9c6b12,#604006);
      color:white;
      padding:14px;
      border-radius:16px;
      font-weight:900;
    }

    .btc-green{color:#37e98b}
    .btc-red{color:#ff5d72}
    .btc-gold{color:#ffd76a}
  `;
  document.head.appendChild(style);

  const button = document.createElement("button");
  button.id = BTN_ID;
  button.textContent = "₿ WALLET";
  document.body.appendChild(button);

  const panel = document.createElement("div");
  panel.id = PANEL_ID;
  panel.innerHTML = `
    <div class="btc-wallet-card">
      <div class="btc-wallet-head">
        <div class="btc-wallet-title">BTC // WALLET</div>
        <button class="btc-wallet-close">×</button>
      </div>

      <div class="btc-wallet-label">保有BTC</div>
      <input
        id="btcHolding"
        class="btc-wallet-input"
        type="number"
        step="0.00000001"
        placeholder="例 0.7248443"
      >

      <div class="btc-wallet-label">平均取得単価（1BTCあたり・円）</div>
      <input
        id="btcAvg"
        class="btc-wallet-input"
        type="number"
        placeholder="例 9790000"
      >

      <div class="btc-wallet-grid">
        <div class="btc-wallet-stat">
          <small>BTC現在価格</small>
          <strong id="btcNow">取得中…</strong>
        </div>

        <div class="btc-wallet-stat">
          <small>現在評価額</small>
          <strong id="btcValue">--</strong>
        </div>

        <div class="btc-wallet-stat">
          <small>取得総額</small>
          <strong id="btcCost">--</strong>
        </div>

        <div class="btc-wallet-stat">
          <small>含み損益</small>
          <strong id="btcPnl">--</strong>
        </div>

        <div class="btc-wallet-stat">
          <small>損益率</small>
          <strong id="btcPnlPct">--</strong>
        </div>
      </div>

      <div class="btc-wallet-label">
        将来のBTC価格
      </div>

      <input
        id="btcTarget"
        class="btc-wallet-input"
        type="number"
        placeholder="例 30000000"
      >

      <div class="btc-wallet-stat" style="margin-top:12px">
        <small>その価格になった時の評価額</small>
        <strong id="btcFuture" class="btc-gold">--</strong>
      </div>

      <button id="btcSave" class="btc-wallet-save">
        保存・再計算
      </button>
    </div>
  `;

  document.body.appendChild(panel);

  const yen = n =>
    Number.isFinite(n)
      ? "¥" + Math.round(n).toLocaleString("ja-JP")
      : "--";

  let currentPrice = 0;

  const holdingEl = panel.querySelector("#btcHolding");
  const avgEl = panel.querySelector("#btcAvg");
  const targetEl = panel.querySelector("#btcTarget");

  holdingEl.value = localStorage.getItem("btcHolding") || "";
  avgEl.value = localStorage.getItem("btcAvg") || "";
  targetEl.value = localStorage.getItem("btcTarget") || "30000000";

  async function fetchPrice() {
    try {
      const r = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=jpy"
      );

      const d = await r.json();
      currentPrice = Number(d.bitcoin.jpy);

      panel.querySelector("#btcNow").textContent =
        yen(currentPrice);

      calculate();
    } catch (e) {
      panel.querySelector("#btcNow").textContent =
        "取得失敗";
    }
  }

  function calculate() {
    const holding = Number(holdingEl.value) || 0;
    const avg = Number(avgEl.value) || 0;
    const target = Number(targetEl.value) || 0;

    const value = holding * currentPrice;
    const cost = holding * avg;
    const pnl = value - cost;
    const pnlPct =
      cost > 0 ? (pnl / cost) * 100 : 0;
    const future = holding * target;

    panel.querySelector("#btcValue").textContent = yen(value);
    panel.querySelector("#btcCost").textContent = yen(cost);

    const pnlEl = panel.querySelector("#btcPnl");
    pnlEl.textContent =
      (pnl >= 0 ? "+" : "") + yen(pnl);

    pnlEl.className =
      pnl >= 0 ? "btc-green" : "btc-red";

    const pctEl = panel.querySelector("#btcPnlPct");
    pctEl.textContent =
      (pnlPct >= 0 ? "+" : "") +
      pnlPct.toFixed(2) +
      "%";

    pctEl.className =
      pnlPct >= 0 ? "btc-green" : "btc-red";

    panel.querySelector("#btcFuture").textContent =
      yen(future);
  }

  button.onclick = () => {
    panel.classList.add("open");
    fetchPrice();
  };

  panel.querySelector(".btc-wallet-close").onclick =
    () => panel.classList.remove("open");

  panel.querySelector("#btcSave").onclick = () => {
    localStorage.setItem(
      "btcHolding",
      holdingEl.value
    );

    localStorage.setItem(
      "btcAvg",
      avgEl.value
    );

    localStorage.setItem(
      "btcTarget",
      targetEl.value
    );

    calculate();
  };

  holdingEl.oninput = calculate;
  avgEl.oninput = calculate;
  targetEl.oninput = calculate;
})();
