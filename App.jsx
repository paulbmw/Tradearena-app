import { useState, useEffect, useRef, useCallback, useMemo } from "react";

/*
 ╔══════════════════════════════════════════════════════════════════════╗
 ║  TRADEARENA V3 — Complete Production App                            ║
 ║                                                                      ║
 ║  18 MARKTEN: US30 · US100 · US500 · GER40 · UK100 · AEX            ║
 ║              GOLD · OIL · SILVER · BTC · ETH                        ║
 ║              NVIDIA · ASML · APPLE · TESLA                          ║
 ║              EUR/USD · GBP/USD · EUR/GBP                            ║
 ║                                                                      ║
 ║  6 LEVELS: Rookie €10 → Amateur €25 → Semi-Pro €50                 ║
 ║            Pro €100 → Expert €250 → Master €500                     ║
 ║                                                                      ║
 ║  DATA: TwelveData API (swap API_KEY voor echte key)                 ║
 ║  BACKEND: Supabase ready                                             ║
 ║  PAYMENTS: Stripe ready                                              ║
 ╚══════════════════════════════════════════════════════════════════════╝
*/

// ─── CONFIG — SWAP DEZE WAARDEN IN VOOR PRODUCTIE ────────────────────────────
const CONFIG = {
  TWELVEDATA_KEY: "c7a40916e1f8415dad91c74d89e5d188",      // ← Jouw TwelveData API key
  SUPABASE_URL:   "demo",      // ← Jouw Supabase URL
  SUPABASE_KEY:   "demo",      // ← Jouw Supabase anon key
  STRIPE_KEY:     "demo",      // ← Jouw Stripe publishable key
  PLATFORM_FEE:   0.30,        // 30% platform fee
  PRIZE_PCT:      0.70,        // 70% naar prijzenpool
  CLOSE_HOUR:     17,          // Sluitingstijd competitie
  CLOSE_MIN:      30,
};

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;500;600;700;800&family=Syne+Mono&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#020207;--s1:#07070f;--s2:#0d0d1c;--s3:#131328;--s4:#191934;
  --g:#00e87a;--g2:#00b85e;--gbg:rgba(0,232,122,.07);--gbd:rgba(0,232,122,.2);
  --r:#ff3358;--r2:#ff6680;--rbg:rgba(255,51,88,.07);--rbd:rgba(255,51,88,.2);
  --gold:#ffcc00;--goldbg:rgba(255,204,0,.07);--goldbd:rgba(255,204,0,.22);
  --b:#00b4ff;--bbg:rgba(0,180,255,.07);--bbd:rgba(0,180,255,.2);
  --pur:#9d5cff;--purbg:rgba(157,92,255,.07);--purbd:rgba(157,92,255,.2);
  --t0:#fff;--t1:#dde0f5;--t2:#5c6080;--t3:#252540;
  --bd:rgba(255,255,255,.05);--bd2:rgba(255,255,255,.1);--bd3:rgba(255,255,255,.18);
  --fh:'Bebas Neue',sans-serif;--fb:'Syne',sans-serif;--fm:'Syne Mono',monospace;
}
html,body{background:var(--bg);color:var(--t1);font-family:var(--fb);-webkit-font-smoothing:antialiased;overscroll-behavior:none;}
.app{max-width:430px;margin:0 auto;min-height:100dvh;display:flex;flex-direction:column;position:relative;}
.app::before{content:'';position:fixed;inset:0;opacity:.015;pointer-events:none;z-index:0;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");}
.z1{position:relative;z-index:1;}
.scroll{flex:1;overflow-y:auto;z-index:1;padding-bottom:86px;}
.scroll::-webkit-scrollbar{display:none;}
.fi{animation:fi .2s ease;}
@keyframes fi{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}

/* HDR */
.hdr{position:sticky;top:0;z-index:60;height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 18px;background:rgba(2,2,7,.94);backdrop-filter:blur(32px);border-bottom:1px solid var(--bd);}
.logo{font-family:var(--fh);font-size:28px;letter-spacing:6px;line-height:1;}
.logo em{font-style:normal;color:var(--g);}
.hdr-r{display:flex;align-items:center;gap:8px;}
.saldo{display:flex;align-items:center;gap:6px;background:var(--gbg);border:1px solid var(--gbd);border-radius:20px;padding:5px 13px;cursor:pointer;transition:all .15s;}
.saldo:hover{border-color:var(--g);}
.saldo-amt{font-family:var(--fm);font-size:13px;color:var(--g);font-weight:700;}
.sdot{width:6px;height:6px;background:var(--g);border-radius:50%;animation:sdot 2s ease-in-out infinite;}
@keyframes sdot{0%,100%{opacity:1;}50%{opacity:.3;}}
.hbtn{width:34px;height:34px;background:var(--s1);border:1px solid var(--bd);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;cursor:pointer;position:relative;}
.hbtn:hover{border-color:var(--bd2);}
.ndot{position:absolute;top:5px;right:5px;width:7px;height:7px;background:var(--gold);border-radius:50%;border:1.5px solid var(--bg);}

/* NAV */
.nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;background:rgba(2,2,7,.97);backdrop-filter:blur(32px);border-top:1px solid var(--bd);display:flex;z-index:100;padding-bottom:env(safe-area-inset-bottom,4px);}
.nb{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:10px 4px 8px;border:none;background:none;cursor:pointer;color:var(--t3);transition:all .2s;font-family:var(--fb);}
.nb.on{color:var(--t0);}
.nb.on .nbi{filter:drop-shadow(0 0 8px currentColor);}
.nbi{font-size:20px;}
.nbl{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;}

/* UTILS */
.sec{padding:16px 18px;}
.lbl{font-family:var(--fm);font-size:10px;color:var(--t3);letter-spacing:3px;text-transform:uppercase;margin-bottom:12px;display:flex;align-items:center;gap:8px;}
.lbl::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,var(--bd2),transparent);}
.sp{height:12px;}
.ldot{width:6px;height:6px;border-radius:50%;animation:lp 1.4s ease-in-out infinite;flex-shrink:0;}
.lg{background:var(--g);}
.lr{background:var(--r);}
@keyframes lp{0%,100%{opacity:1;}50%{opacity:.2;}}
.btn{width:100%;padding:16px;border:none;border-radius:14px;font-family:var(--fh);font-size:22px;letter-spacing:3px;cursor:pointer;transition:all .2s;}
.btn-gold{background:var(--gold);color:#000;font-weight:700;}
.btn-gold:hover{transform:translateY(-2px);box-shadow:0 8px 36px rgba(255,204,0,.35);}
.btn-gold:disabled{opacity:.35;cursor:not-allowed;transform:none;box-shadow:none;}
.btn-ghost{background:transparent;border:1px solid var(--bd2);color:var(--t2);}
.btn-ghost:hover{border-color:var(--gold);color:var(--gold);}
.back-btn{background:none;border:none;color:var(--t2);font-family:var(--fb);font-size:13px;font-weight:600;cursor:pointer;margin-bottom:12px;display:flex;align-items:center;gap:5px;padding:0;}

/* TOAST */
.toast{position:fixed;bottom:94px;left:50%;transform:translateX(-50%);background:var(--s2);border:1px solid var(--bd3);border-radius:14px;padding:11px 18px;font-family:var(--fm);font-size:12px;color:var(--t0);z-index:400;white-space:nowrap;max-width:92%;animation:tIn .3s cubic-bezier(.34,1.56,.64,1);}
@keyframes tIn{from{opacity:0;transform:translateX(-50%) translateY(16px) scale(.9);}to{opacity:1;transform:translateX(-50%) translateY(0) scale(1);}}

/* LEVEL BADGE */
.lvbg{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:10px;font-family:var(--fm);font-size:10px;font-weight:700;letter-spacing:1px;}
.lv0{background:rgba(120,120,160,.1);color:#8888a8;border:1px solid rgba(120,120,160,.2);}
.lv1{background:var(--bbg);color:var(--b);border:1px solid var(--bbd);}
.lv2{background:var(--gbg);color:var(--g);border:1px solid var(--gbd);}
.lv3{background:var(--goldbg);color:var(--gold);border:1px solid var(--goldbd);}
.lv4{background:var(--rbg);color:var(--r);border:1px solid var(--rbd);}
.lv5{background:var(--purbg);color:var(--pur);border:1px solid var(--purbd);}

/* TICKER */
.ticker{overflow:hidden;border-bottom:1px solid var(--bd);background:var(--s1);}
.tick-in{display:flex;gap:22px;animation:tick 30s linear infinite;white-space:nowrap;width:max-content;padding:7px 0;}
@keyframes tick{from{transform:translateX(0);}to{transform:translateX(-50%);}}
.ti{font-family:var(--fm);font-size:11px;color:var(--t2);display:flex;align-items:center;gap:4px;}
.ti b{color:var(--t1);font-weight:500;}
.up{color:var(--g);}.dn{color:var(--r);}

/* CATEGORY FILTER */
.cat-filter{display:flex;gap:7px;padding:0 18px 14px;overflow-x:auto;}
.cat-filter::-webkit-scrollbar{display:none;}
.cat-btn{padding:6px 13px;border-radius:20px;border:1px solid var(--bd);background:var(--s1);color:var(--t3);font-family:var(--fm);font-size:10px;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;white-space:nowrap;transition:all .15s;}
.cat-btn:hover{border-color:var(--bd2);color:var(--t2);}
.cat-btn.on{background:var(--goldbg);border-color:var(--goldbd);color:var(--gold);}

/* MARKET CARD */
.mkt-card{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:var(--s1);border:1px solid var(--bd);border-radius:14px;margin-bottom:7px;cursor:pointer;transition:all .15s;position:relative;overflow:hidden;}
.mkt-card:hover{border-color:var(--bd2);}
.mkt-card.has-pos{border-color:rgba(0,232,122,.25);background:rgba(0,232,122,.03);}
.mkt-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;}
.cat-index .mkt-card::before{background:var(--b);}
.cat-commodity .mkt-card::before{background:var(--gold);}
.cat-crypto .mkt-card::before{background:var(--pur);}
.cat-stock .mkt-card::before{background:var(--r);}
.cat-forex .mkt-card::before{background:var(--g);}
.mkt-l{display:flex;align-items:center;gap:10px;}
.mkt-ic{width:38px;height:38px;background:var(--s2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
.mkt-nm{font-family:var(--fb);font-size:14px;font-weight:700;color:var(--t0);}
.mkt-sub{font-family:var(--fm);font-size:10px;color:var(--t3);margin-top:2px;}
.mkt-cat{font-family:var(--fm);font-size:9px;padding:2px 6px;border-radius:6px;margin-top:3px;display:inline-block;letter-spacing:1px;}
.pos-tag{font-family:var(--fm);font-size:10px;padding:2px 7px;border-radius:8px;margin-top:3px;display:inline-block;}
.pt-long{background:var(--gbg);color:var(--g);}
.pt-short{background:var(--rbg);color:var(--r);}
.mkt-r{text-align:right;}
.mkt-pr{font-family:var(--fm);font-size:15px;font-weight:700;color:var(--t1);}
.mkt-ch{font-family:var(--fm);font-size:12px;margin-top:2px;}
.mkt-chg-i{font-family:var(--fm);font-size:10px;color:var(--t3);margin-top:2px;}

/* DATA STATUS */
.data-status{display:flex;align-items:center;gap:6px;font-family:var(--fm);font-size:10px;padding:6px 18px;background:var(--s1);border-bottom:1px solid var(--bd);}
.ds-live{color:var(--g);}
.ds-demo{color:var(--gold);}

/* PORTFOLIO */
.port-card{background:linear-gradient(135deg,rgba(0,232,122,.08),rgba(0,180,255,.05));border:1px solid var(--gbd);border-radius:14px;padding:18px;margin-bottom:14px;position:relative;overflow:hidden;}
.port-glow{position:absolute;top:-40px;right:-40px;width:150px;height:150px;background:radial-gradient(circle,rgba(0,232,122,.08),transparent);pointer-events:none;}
.port-lbl{font-family:var(--fm);font-size:10px;color:var(--t2);letter-spacing:2px;margin-bottom:4px;}
.port-val{font-family:var(--fh);font-size:44px;letter-spacing:2px;}
.port-row{display:flex;align-items:center;gap:8px;margin-top:6px;}
.pnl-v{font-family:var(--fm);font-size:14px;font-weight:700;}
.pnl-pill{font-family:var(--fm);font-size:12px;padding:2px 8px;border-radius:8px;}
.pos-c{color:var(--g);}.neg-c{color:var(--r);}
.pos-pill{background:var(--gbg);color:var(--g);}
.neg-pill{background:var(--rbg);color:var(--r);}

/* MINI CHART */
.mini-chart{height:54px;display:flex;align-items:flex-end;gap:2px;padding:6px 0 0;margin-top:8px;}
.mc-bar{flex:1;border-radius:1px;min-height:2px;}
.mc-g{background:var(--g);}
.mc-r{background:var(--r);}

/* OPEN POSITION */
.opos{background:var(--s1);border:1px solid var(--bd);border-radius:14px;padding:14px;margin-bottom:8px;}
.opos-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
.opos-nm{font-family:var(--fb);font-size:14px;font-weight:700;color:var(--t0);}
.opos-dir{font-family:var(--fh);font-size:13px;letter-spacing:2px;padding:3px 10px;border-radius:8px;}
.odir-l{background:var(--gbg);color:var(--g);}
.odir-s{background:var(--rbg);color:var(--r);}
.opos-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-bottom:10px;}
.og{background:var(--s2);border-radius:8px;padding:8px 5px;text-align:center;}
.og-v{font-family:var(--fm);font-size:12px;font-weight:700;}
.og-l{font-family:var(--fm);font-size:9px;color:var(--t3);letter-spacing:1px;margin-top:2px;}
.close-pos{width:100%;padding:10px;background:var(--s3);border:1px solid var(--bd2);border-radius:8px;font-family:var(--fh);font-size:15px;letter-spacing:2px;color:var(--t2);cursor:pointer;transition:all .15s;}
.close-pos:hover{border-color:var(--r);color:var(--r);}

/* TRADE MODAL */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:200;display:flex;align-items:flex-end;justify-content:center;}
.modal{background:var(--s1);border:1px solid var(--bd2);border-radius:22px 22px 0 0;padding:20px 20px 44px;width:100%;max-width:430px;animation:sUp .3s cubic-bezier(.34,1.56,.64,1);}
@keyframes sUp{from{transform:translateY(100%);}to{transform:translateY(0);}}
.m-handle{width:40px;height:4px;background:var(--s3);border-radius:2px;margin:0 auto 20px;}
.dir-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;}
.dir-btn{padding:16px;border-radius:14px;border:2px solid transparent;cursor:pointer;text-align:center;transition:all .2s;}
.dir-long{background:var(--gbg);border-color:rgba(0,232,122,.2);}
.dir-long.sel,.dir-long:hover{border-color:var(--g);background:rgba(0,232,122,.12);}
.dir-short{background:var(--rbg);border-color:rgba(255,51,88,.2);}
.dir-short.sel,.dir-short:hover{border-color:var(--r);background:rgba(255,51,88,.12);}
.dir-lbl{font-family:var(--fh);font-size:26px;letter-spacing:3px;}
.dir-long .dir-lbl{color:var(--g);}
.dir-short .dir-lbl{color:var(--r);}
.dir-sub{font-family:var(--fm);font-size:11px;color:var(--t2);margin-top:4px;}
.size-chips{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px;}
.sz-chip{padding:8px 14px;background:var(--s3);border:1px solid var(--bd);border-radius:20px;font-family:var(--fm);font-size:12px;font-weight:700;color:var(--t2);cursor:pointer;transition:all .15s;}
.sz-chip:hover{border-color:var(--bd2);color:var(--t1);}
.sz-chip.on{background:var(--goldbg);border-color:var(--goldbd);color:var(--gold);}
.trade-sum{background:var(--s2);border-radius:8px;padding:12px 14px;margin-bottom:14px;}
.ts-row{display:flex;justify-content:space-between;padding:5px 0;font-size:13px;border-bottom:1px solid var(--bd);}
.ts-row:last-child{border-bottom:none;}
.ts-k{color:var(--t2);}.ts-v{font-family:var(--fm);font-weight:700;}
.m-btns{display:grid;grid-template-columns:1fr 1.4fr;gap:10px;}
.m-cancel{padding:15px;background:var(--s2);border:1px solid var(--bd);border-radius:14px;font-family:var(--fh);font-size:18px;letter-spacing:1px;color:var(--t2);cursor:pointer;}
.m-go{padding:15px;border:none;border-radius:14px;font-family:var(--fh);font-size:18px;letter-spacing:2px;cursor:pointer;transition:all .15s;}
.m-long{background:var(--g);color:#000;}
.m-long:hover{box-shadow:0 6px 24px rgba(0,232,122,.35);}
.m-short{background:var(--r);color:#fff;}
.m-short:hover{box-shadow:0 6px 24px rgba(255,51,88,.35);}
.m-disabled{background:var(--s3);color:var(--t3);}

/* ENTRY TIERS */
.tier-card{background:var(--s1);border:2px solid var(--bd);border-radius:14px;padding:16px;cursor:pointer;transition:all .2s;margin-bottom:8px;position:relative;}
.tier-card:hover{border-color:var(--bd2);}
.tier-card.sel{border-color:var(--gold);background:var(--goldbg);}
.tier-card.locked{opacity:.4;cursor:not-allowed;}
.tc-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;}
.tc-nm{font-family:var(--fh);font-size:20px;letter-spacing:2px;color:var(--t1);}
.tier-card.sel .tc-nm{color:var(--gold);}
.tc-fee{font-family:var(--fm);font-size:16px;font-weight:700;color:var(--t1);}
.tier-card.sel .tc-fee{color:var(--gold);}
.tc-desc{font-family:var(--fb);font-size:12px;color:var(--t2);line-height:1.4;margin-bottom:8px;}
.tc-meta{display:flex;gap:10px;flex-wrap:wrap;}
.tc-m{font-family:var(--fm);font-size:11px;color:var(--t3);}
.tc-m em{font-style:normal;color:var(--t2);}
.pop-tag{position:absolute;top:10px;right:10px;background:var(--gold);color:#000;font-family:var(--fh);font-size:11px;letter-spacing:1px;padding:3px 8px;border-radius:8px;}

/* LEADERBOARD */
.lb-podium{display:grid;grid-template-columns:1fr 1.2fr 1fr;gap:8px;align-items:flex-end;margin-bottom:16px;}
.pod{background:var(--s1);border:1px solid var(--bd);border-radius:14px;padding:14px 8px;text-align:center;position:relative;overflow:hidden;}
.pod1{border-color:rgba(255,204,0,.3);}
.pod1::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--gold);}
.pod-med{font-family:var(--fh);font-size:22px;margin-bottom:4px;}
.pod1 .pod-med{color:var(--gold);}
.pod-av{font-size:22px;margin-bottom:5px;}
.pod-nm{font-family:var(--fb);font-size:13px;font-weight:700;color:var(--t0);margin-bottom:3px;}
.pod-pnl{font-family:var(--fm);font-size:13px;font-weight:700;}
.pod-prize{font-family:var(--fh);font-size:14px;color:var(--gold);margin-top:3px;}
.lb-row{display:flex;align-items:center;gap:10px;background:var(--s1);border:1px solid var(--bd);border-radius:14px;padding:11px 14px;margin-bottom:7px;transition:all .15s;}
.lb-row:hover{border-color:var(--bd2);}
.lb-row.me{border-color:rgba(255,204,0,.3);background:var(--goldbg);}
.lb-rnk{font-family:var(--fh);font-size:20px;width:30px;text-align:center;color:var(--t3);}
.lb-av{font-size:22px;}
.lb-info{flex:1;min-width:0;}
.lb-nm{font-family:var(--fb);font-size:14px;font-weight:700;color:var(--t0);display:flex;align-items:center;gap:6px;}
.me-tag{font-family:var(--fm);font-size:9px;background:var(--goldbg);color:var(--gold);border:1px solid var(--goldbd);padding:2px 6px;border-radius:8px;}
.lb-sub{font-family:var(--fm);font-size:10px;color:var(--t3);margin-top:2px;}
.lb-r{text-align:right;flex-shrink:0;}
.lb-pnl{font-family:var(--fm);font-size:14px;font-weight:700;}
.lb-prize{font-family:var(--fh);font-size:14px;color:var(--gold);}

/* BEHAVIORAL */
.beh-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:14px;}
.beh-card{background:var(--s1);border:1px solid var(--bd);border-radius:14px;padding:14px;text-align:center;}
.beh-v{font-family:var(--fh);font-size:32px;letter-spacing:2px;}
.beh-l{font-family:var(--fm);font-size:10px;color:var(--t3);letter-spacing:1px;text-transform:uppercase;margin-top:4px;}
.err-item{display:flex;align-items:center;gap:10px;background:var(--s1);border:1px solid var(--bd);border-radius:14px;padding:12px 14px;margin-bottom:8px;}
.err-ic{font-size:20px;flex-shrink:0;}
.err-nm{font-family:var(--fb);font-size:13px;font-weight:700;color:var(--t1);}
.err-ds{font-family:var(--fm);font-size:11px;color:var(--t3);margin-top:2px;}
.err-sev{margin-left:auto;font-family:var(--fm);font-size:10px;padding:3px 8px;border-radius:8px;flex-shrink:0;}
.sev-h{background:var(--rbg);color:var(--r);}
.sev-m{background:var(--goldbg);color:var(--gold);}
.sev-l{background:var(--gbg);color:var(--g);}

/* SUCCESS */
.success{padding:40px 18px;display:flex;flex-direction:column;align-items:center;text-align:center;}
.s-ic{font-size:80px;animation:pop .5s cubic-bezier(.34,1.56,.64,1);}
@keyframes pop{from{transform:scale(0);}to{transform:scale(1);}}
.s-ttl{font-family:var(--fh);font-size:46px;letter-spacing:4px;margin-top:14px;margin-bottom:6px;color:var(--gold);}
.s-card{background:var(--s1);border:1px solid var(--bd);border-radius:14px;padding:14px;width:100%;margin-bottom:16px;text-align:left;}
.s-row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--bd);font-size:13px;}
.s-row:last-child{border-bottom:none;}
.s-k{color:var(--t2);}.s-v{font-family:var(--fm);font-weight:700;}
.share-row{display:flex;gap:8px;width:100%;margin-bottom:10px;}
.share-btn{flex:1;padding:11px;background:var(--s2);border:1px solid var(--bd2);border-radius:14px;font-family:var(--fh);font-size:13px;letter-spacing:1px;color:var(--t1);cursor:pointer;text-align:center;transition:all .15s;}
.share-btn:hover{border-color:var(--gold);color:var(--gold);}

/* PROFILE */
.wallet-card{background:linear-gradient(135deg,rgba(255,204,0,.07),rgba(0,232,122,.05));border:1px solid var(--goldbd);border-radius:14px;padding:20px;margin-bottom:14px;}
.wc-l{font-family:var(--fm);font-size:10px;color:var(--t2);letter-spacing:2px;margin-bottom:4px;}
.wc-a{font-family:var(--fh);font-size:46px;letter-spacing:2px;color:var(--gold);}
.wc-btns{display:flex;gap:8px;margin-top:14px;}
.wc-btn{flex:1;padding:11px;background:rgba(255,204,0,.08);border:1px solid var(--goldbd);border-radius:8px;font-family:var(--fh);font-size:16px;letter-spacing:2px;color:var(--gold);cursor:pointer;text-align:center;transition:all .15s;}
.wc-btn:hover{background:rgba(255,204,0,.14);}
.pstats{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-bottom:0;}
.ps{background:var(--s2);border-radius:8px;padding:10px 5px;text-align:center;}
.ps-v{font-family:var(--fh);font-size:20px;letter-spacing:1px;}
.ps-l{font-family:var(--fm);font-size:9px;color:var(--t3);letter-spacing:1px;text-transform:uppercase;margin-top:2px;}
.hist-row{display:flex;align-items:center;gap:10px;background:var(--s1);border:1px solid var(--bd);border-radius:14px;padding:11px 13px;margin-bottom:7px;}
.h-badge{width:52px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-family:var(--fh);font-size:12px;flex-shrink:0;}
.hb-w{background:var(--gbg);color:var(--g);}
.hb-l{background:var(--rbg);color:var(--r);}
.hb-v{background:var(--goldbg);color:var(--gold);}
.h-info{flex:1;font-family:var(--fb);font-size:13px;font-weight:600;color:var(--t1);line-height:1.3;}
.h-sub{font-family:var(--fm);font-size:10px;color:var(--t3);}
.h-amt{font-family:var(--fm);font-size:13px;font-weight:700;flex-shrink:0;}
.h-pos{color:var(--g);}.h-neg{color:var(--r);}.h-live{color:var(--gold);}

/* LEVEL UP */
.lvup-overlay{position:fixed;inset:0;z-index:500;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.93);animation:lvFadeIn .3s ease;}
@keyframes lvFadeIn{from{opacity:0;}to{opacity:1;}}
.lvup-icon{font-size:80px;animation:pop .5s cubic-bezier(.34,1.56,.64,1);}
.lvup-ttl{font-family:var(--fh);font-size:52px;letter-spacing:4px;margin-top:16px;}
.lvup-sub{font-family:var(--fm);font-size:14px;color:var(--t2);margin-top:8px;letter-spacing:2px;}
.lvup-name{font-family:var(--fh);font-size:28px;letter-spacing:3px;margin-top:20px;}
.lvup-desc{font-family:var(--fm);font-size:13px;color:var(--t2);margin-top:8px;text-align:center;padding:0 40px;line-height:1.6;}
.lvup-btn{margin-top:32px;padding:14px 48px;border:none;border-radius:14px;font-family:var(--fh);font-size:20px;letter-spacing:3px;cursor:pointer;}
`;

// ─── MARKET DATA ─────────────────────────────────────────────────────────────
const MARKETS = [
  // INDICES
  {id:"us30",  cat:"index",    icon:"🇺🇸", name:"US30",    full:"Dow Jones 30",       base:43500,  sym:"DJI"},
  {id:"us100", cat:"index",    icon:"🇺🇸", name:"US100",   full:"Nasdaq 100",         base:21450,  sym:"NDX"},
  {id:"us500", cat:"index",    icon:"🇺🇸", name:"US500",   full:"S&P 500",            base:5870,   sym:"SPX"},
  {id:"ger40", cat:"index",    icon:"🇩🇪", name:"GER40",   full:"DAX 40",             base:22810,  sym:"DAX"},
  {id:"uk100", cat:"index",    icon:"🇬🇧", name:"UK100",   full:"FTSE 100",           base:8724,   sym:"FTSE"},
  {id:"aex",   cat:"index",    icon:"🇳🇱", name:"AEX",     full:"Amsterdam Exchange", base:894,    sym:"AEX"},
  // COMMODITIES
  {id:"gold",  cat:"commodity",icon:"🥇",  name:"GOLD",    full:"Spot Gold USD",      base:2180,   sym:"XAU/USD"},
  {id:"oil",   cat:"commodity",icon:"🛢️",  name:"OIL",     full:"Brent Crude",        base:72.40,  sym:"UKOIL"},
  {id:"silver",cat:"commodity",icon:"🥈",  name:"SILVER",  full:"Spot Silver USD",    base:24.80,  sym:"XAG/USD"},
  // CRYPTO
  {id:"btc",   cat:"crypto",   icon:"₿",   name:"BTC",     full:"Bitcoin USD",        base:90420,  sym:"BTC/USD"},
  {id:"eth",   cat:"crypto",   icon:"Ξ",   name:"ETH",     full:"Ethereum USD",       base:3210,   sym:"ETH/USD"},
  // STOCKS
  {id:"nvda",  cat:"stock",    icon:"🎮",  name:"NVIDIA",  full:"NVIDIA Corp",        base:118,    sym:"NVDA"},
  {id:"asml",  cat:"stock",    icon:"💻",  name:"ASML",    full:"ASML Holding NV",    base:842,    sym:"ASML"},
  {id:"aapl",  cat:"stock",    icon:"🍎",  name:"APPLE",   full:"Apple Inc",          base:213,    sym:"AAPL"},
  {id:"tsla",  cat:"stock",    icon:"⚡",  name:"TESLA",   full:"Tesla Inc",          base:248,    sym:"TSLA"},
  // FOREX
  {id:"eurusd",cat:"forex",    icon:"💱",  name:"EUR/USD", full:"Euro / US Dollar",   base:1.0842, sym:"EUR/USD"},
  {id:"gbpusd",cat:"forex",    icon:"💷",  name:"GBP/USD", full:"Pound / US Dollar",  base:1.2640, sym:"GBP/USD"},
  {id:"eurgbp",cat:"forex",    icon:"🔄",  name:"EUR/GBP", full:"Euro / Pound",       base:0.8578, sym:"EUR/GBP"},
];

const LEVELS = [
  {id:0,name:"ROOKIE",  icon:"🌱",color:"#8888a8",cls:"lv0",fee:10, capital:1000,  spots:100,lvReq:0, maxWin:"€350",   desc:"Starten zonder druk. Perfect voor beginners."},
  {id:1,name:"AMATEUR", icon:"⚡",color:"#00b4ff",cls:"lv1",fee:25, capital:5000,  spots:75, lvReq:1, maxWin:"€875",   desc:"Meer kapitaal, meer kansen. Serieus beginnen."},
  {id:2,name:"SEMI-PRO",icon:"🎯",color:"#00e87a",cls:"lv2",fee:50, capital:10000, spots:50, lvReq:2, maxWin:"€1.750", desc:"Professioneel handelen op volle marktgrootte."},
  {id:3,name:"PRO",     icon:"💰",color:"#ffcc00",cls:"lv3",fee:100,capital:25000, spots:30, lvReq:3, maxWin:"€3.500", desc:"Grote kapitaalbasis. Bewezen track record."},
  {id:4,name:"EXPERT",  icon:"🔥",color:"#ff3358",cls:"lv4",fee:250,capital:50000, spots:15, lvReq:4, maxWin:"€8.750", desc:"Elite traders. Uitnodiging vereist."},
  {id:5,name:"MASTER",  icon:"👑",color:"#9d5cff",cls:"lv5",fee:500,capital:100000,spots:10, lvReq:5, maxWin:"€17.500",desc:"Absolute top. Maandelijks toernooi."},
];

const LB_DATA = [
  {rank:1,av:"🦅",name:"MarktHaai",  pnl:"+18.4%",amt:"+€4.600",prize:"€1.750",me:false},
  {rank:2,av:"🐺",name:"VanderWolf", pnl:"+14.2%",amt:"+€3.550",prize:"€875",  me:false},
  {rank:3,av:"⚡",name:"SnelleHand", pnl:"+11.8%",amt:"+€2.950",prize:"€525",  me:false},
  {rank:4,av:"👤",name:"Jij",        pnl:"+8.3%", amt:"+€2.075",prize:"€350",  me:true },
  {rank:5,av:"🎯",name:"DeltaT",     pnl:"+6.1%", amt:"+€1.525",prize:"€350",  me:false},
  {rank:6,av:"🌊",name:"TijdenG",    pnl:"+4.2%", amt:"+€1.050",prize:"—",     me:false},
  {rank:7,av:"🔥",name:"BrandP",     pnl:"+2.8%", amt:"+€700",  prize:"—",     me:false},
  {rank:8,av:"💎",name:"DiamondH",   pnl:"-1.4%", amt:"-€350",  prize:"—",     me:false},
];

const ERRORS = [
  {ic:"📈",nm:"Overleveraged",   ds:"3× te veel risico per trade",          sev:"h"},
  {ic:"😤",nm:"Revenge trading", ds:"Na verlies direct opnieuw instappen",  sev:"h"},
  {ic:"🔄",nm:"Recency bias",    ds:"Teveel gewicht op recente prijs",       sev:"m"},
  {ic:"⏰",nm:"Late exit",       ds:"Winnende positie te lang vasthouden",   sev:"m"},
  {ic:"🎯",nm:"Entry timing",    ds:"Sterke entry-selectie deze week ✓",     sev:"l"},
];

const CATS = ["Alle","Index","Commodity","Crypto","Stock","Forex"];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmtN   = n => n.toLocaleString("nl-NL");
const fmtEur = n => `€${Math.abs(n).toLocaleString("nl-NL",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fmtPr  = (n, sym) => {
  if(["EUR/USD","GBP/USD","EUR/GBP"].includes(sym)) return n.toFixed(4);
  if(n > 1000) return fmtN(Math.round(n));
  if(n > 100)  return n.toFixed(2);
  return n.toFixed(2);
};

function useToast(){
  const[t,setT]=useState(null);const r=useRef();
  const show=useCallback(msg=>{setT(msg);clearTimeout(r.current);r.current=setTimeout(()=>setT(null),2500);},[]);
  return[t,show];
}

// ─── LIVE PRICES HOOK ────────────────────────────────────────────────────────
// Simuleert TwelveData prijsbewegingen
// In productie: vervang door echte API calls naar TwelveData
function useLivePrices(){
  const[prices,setPrices] = useState(()=>Object.fromEntries(MARKETS.map(m=>[m.id,m.base])));
  const[isLive,setIsLive] = useState(false);
  const[lastUpdate,setLU] = useState(null);

  useEffect(()=>{
    // LIVE: TwelveData API
    const fetchPrices = async () => {
      try {
        const syms = MARKETS.map(m=>m.sym).join(",");
        const res  = await fetch(`https://api.twelvedata.com/price?symbol=${syms}&apikey=${CONFIG.TWELVEDATA_KEY}`);
        const data = await res.json();
        const next = {};
        MARKETS.forEach(m => { if(data[m.sym]?.price) next[m.id] = parseFloat(data[m.sym].price); });
        if(Object.keys(next).length > 0) {
          setPrices(p=>({...p,...next}));
          setIsLive(true);
          setLU(new Date().toLocaleTimeString("nl-NL"));
        }
      } catch(e) { console.log("API error, using demo prices"); }
    };
    fetchPrices();
    const iv = setInterval(fetchPrices, 60000);
    return () => clearInterval(iv);

    // FALLBACK: Simuleer prijsbewegingen als API niet beschikbaar is
    // const iv=setInterval(()=>{
      setPrices(p=>{
        const n={...p};
        MARKETS.forEach(m=>{
          const volatility = m.cat==="crypto"?.003:m.cat==="forex"?.0002:.001;
          n[m.id]=Math.max(.0001,p[m.id]+(Math.random()-.499)*p[m.id]*volatility);
        });
        return n;
      });
      setLU(new Date().toLocaleTimeString("nl-NL"));
    },1500);
    return()=>clearInterval(iv);
  },[]);

  return{prices,isLive,lastUpdate};
}

// ─── COUNTDOWN ───────────────────────────────────────────────────────────────
function useCountdown(){
  const[cd,setCd]=useState("");
  useEffect(()=>{
    const tick=()=>{
      const now=new Date();
      const close=new Date();
      close.setHours(CONFIG.CLOSE_HOUR,CONFIG.CLOSE_MIN,0,0);
      if(now>close) close.setDate(close.getDate()+1);
      const diff=close-now;
      const h=Math.floor(diff/3600000);
      const m=Math.floor((diff%3600000)/60000);
      const s=Math.floor((diff%60000)/1000);
      setCd(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
    };
    tick();
    const iv=setInterval(tick,1000);
    return()=>clearInterval(iv);
  },[]);
  return cd;
}

// ─── MINI CHART ──────────────────────────────────────────────────────────────
function MiniChart({positive}){
  const bars=useMemo(()=>Array.from({length:22},()=>({h:18+Math.random()*44,g:Math.random()>(positive?.38:.62)})),[positive]);
  return(
    <div className="mini-chart">
      {bars.map((b,i)=><div key={i} className={`mc-bar ${b.g?"mc-g":"mc-r"}`} style={{height:b.h+"%",flex:1}}/>)}
    </div>
  );
}

// ─── LEVEL BADGE ─────────────────────────────────────────────────────────────
function LvBadge({id}){
  const lv=LEVELS[id]||LEVELS[0];
  return <span className={`lvbg ${lv.cls}`}>{lv.icon} {lv.name}</span>;
}

// ─── TICKER ──────────────────────────────────────────────────────────────────
function Ticker({prices}){
  const items=[...MARKETS,...MARKETS];
  return(
    <div className="ticker">
      <div className="tick-in">
        {items.map((m,i)=>{
          const cur=prices[m.id]||m.base;
          const chg=((cur-m.base)/m.base*100);
          const isUp=chg>=0;
          return(
            <span key={i} className="ti">
              <b>{m.name}</b>
              <span>{fmtPr(cur,m.sym)}</span>
              <span className={isUp?"up":"dn"}>{isUp?"+":""}{chg.toFixed(2)}%</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── ENTRY FLOW ──────────────────────────────────────────────────────────────
function EntryFlow({userLevel,onStart,onBack,balance,setBalance}){
  const[tier,setTier]=useState(null);
  const[done,setDone]=useState(false);
  const[modal,setModal]=useState(false);

  if(done) return(
    <div className="fi"><div className="sec">
      <div className="success">
        <div className="s-ic">🚀</div>
        <div className="s-ttl">LIVE!</div>
        <div style={{marginBottom:16}}><LvBadge id={userLevel}/></div>
        <div className="s-card">
          {[["Tier",`${LEVELS[userLevel].icon} DAILY ${tier.name}`],["Inschrijfgeld",`€${tier.fee}`],["Virtueel kapitaal",`€${fmtN(tier.capital)}`],["Max winst",tier.maxWin],["Sluit",`Vandaag ${CONFIG.CLOSE_HOUR}:${String(CONFIG.CLOSE_MIN).padStart(2,"0")}`]].map(([k,v])=>(
            <div key={k} className="s-row"><span className="s-k">{k}</span><span className="s-v" style={k==="Max winst"?{color:"var(--gold)"}:{}}>{v}</span></div>
          ))}
        </div>
        <div style={{background:"var(--gbg)",border:"1px solid var(--gbd)",borderRadius:8,padding:"12px 14px",marginBottom:16,fontSize:13,color:"var(--t2)",lineHeight:1.6}}>
          🎯 <strong style={{color:"var(--t1)"}}>Start nu met handelen.</strong> Koop LONG of SHORT op alle 18 markten. Beste rendement wint de pool.
        </div>
        <div className="share-row">{["🐦 Tweet","💬 WhatsApp","📋 Kopieer"].map(s=><div key={s} className="share-btn">{s}</div>)}</div>
        <button className="btn btn-gold" style={{marginBottom:10}} onClick={()=>onStart(tier)}>START HANDELEN →</button>
        <button className="btn btn-ghost" style={{fontSize:16,padding:14}} onClick={onBack}>← Terug</button>
      </div>
    </div></div>
  );

  return(
    <div className="fi">
      <div style={{padding:"14px 18px 0"}}><button className="back-btn" onClick={onBack}>← Terug</button></div>
      <div className="sec">
        <div className="lbl">Kies jouw tier · {LEVELS.filter(l=>l.lvReq<=userLevel).length} beschikbaar</div>
        {LEVELS.map(t=>{
          const locked=t.lvReq>userLevel;
          return(
            <div key={t.id} className={`tier-card${tier?.id===t.id?" sel":""}${locked?" locked":""}`} onClick={()=>!locked&&setTier(t)}>
              {t.id===2&&!locked&&<div className="pop-tag">POPULAIR</div>}
              <div className="tc-top">
                <div className="tc-nm">{locked?`🔒 ${t.name}`:t.name}</div>
                <div className="tc-fee">€{t.fee}</div>
              </div>
              <div className="tc-desc">{locked?`Vereist level ${LEVELS[t.lvReq].name}`:t.desc}</div>
              {!locked&&(
                <div className="tc-meta">
                  <span className="tc-m"><em>Kapitaal:</em> €{fmtN(t.capital)}</span>
                  <span className="tc-m"><em>Pool:</em> {t.maxWin}</span>
                  <span className="tc-m"><em>Plekken:</em> {t.spots}</span>
                </div>
              )}
            </div>
          );
        })}
        <div style={{background:"var(--gbg)",border:"1px solid var(--gbd)",borderRadius:8,padding:"12px 14px",marginBottom:14,fontSize:13,color:"var(--t2)",lineHeight:1.6}}>
          ✅ <strong style={{color:"var(--t1)"}}>100% legaal.</strong> Inschrijfgeld voor een vaardigheidscompetitie. Identiek aan uFunded. Geen KSA-vergunning nodig.
        </div>
        {tier&&balance<tier.fee&&<div style={{background:"var(--rbg)",border:"1px solid var(--rbd)",borderRadius:8,padding:"9px 12px",marginBottom:10,fontFamily:"var(--fm)",fontSize:12,color:"var(--r)"}}>⚠️ Onvoldoende saldo — Storting vereist</div>}
        <button className={`btn${tier&&balance>=(tier?.fee||0)?" btn-gold":" btn-ghost"}`} disabled={!tier||balance<(tier?.fee||0)} onClick={()=>setModal(true)}>
          {tier?`INSCHRIJVEN — €${tier.fee}`:"KIES EEN TIER"}
        </button>
      </div>
      {modal&&(
        <div className="overlay" onClick={()=>setModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="m-handle"/>
            <div style={{fontFamily:"var(--fh)",fontSize:26,letterSpacing:2,textAlign:"center",marginBottom:4}}>BEVESTIG</div>
            <div style={{fontSize:13,color:"var(--t2)",textAlign:"center",marginBottom:18}}>Daily {tier?.name} · €{fmtN(tier?.capital)} virtueel kapitaal</div>
            <div className="trade-sum">
              {[["Tier",`${LEVELS[tier?.id||0].icon} ${tier?.name}`],["Inschrijfgeld",`€${tier?.fee}`],["Virtueel kapitaal",`€${fmtN(tier?.capital)}`],["Max te winnen",null],["Sluit",`${CONFIG.CLOSE_HOUR}:${String(CONFIG.CLOSE_MIN).padStart(2,"0")}`]].map(([k,v])=>(
                <div key={k} className="ts-row"><span className="ts-k">{k}</span><span className="ts-v" style={k==="Max te winnen"?{color:"var(--gold)"}:{}}>{k==="Max te winnen"?tier?.maxWin:v}</span></div>
              ))}
            </div>
            <div style={{fontSize:11,color:"var(--t3)",textAlign:"center",lineHeight:1.7,marginBottom:18}}>
              Inschrijfgeld is niet restitueerbaar. 70% naar prijzenpool, 30% platformfee. 18+
            </div>
            <div className="m-btns">
              <button className="m-cancel" onClick={()=>setModal(false)}>ANNULEER</button>
              <button className="m-go m-long" onClick={()=>{setBalance(b=>b-tier.fee);setModal(false);setDone(true);}}>BEVESTIG</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LIVE TRADING ─────────────────────────────────────────────────────────────
function LiveTrading({tier,userLevel,onBack,prices,isLive,lastUpdate}){
  const[positions,setPositions] = useState({});
  const[tradeM,setTradeM]       = useState(null);
  const[dir,setDir]             = useState(null);
  const[size,setSize]           = useState(1000);
  const[catFilter,setCatFilter] = useState("Alle");
  const[toast,showToast]        = useToast();
  const countdown               = useCountdown();
  const capital                 = tier?.capital||10000;

  const pnl=useMemo(()=>{
    let total=0;
    Object.entries(positions).forEach(([id,pos])=>{
      const cur=prices[id]||pos.entry;
      const chg=(cur-pos.entry)/pos.entry;
      total+=pos.dir==="long"?pos.size*chg:-pos.size*chg;
    });
    return total;
  },[positions,prices]);

  const portVal=capital+pnl;
  const pnlPct=(pnl/capital*100);
  const isPos=pnl>=0;

  const doTrade=()=>{
    if(!tradeM||!dir) return;
    setPositions(p=>({...p,[tradeM.id]:{...tradeM,entry:prices[tradeM.id]||tradeM.base,dir,size}}));
    showToast(`✅ ${dir==="long"?"▲ LONG":"▼ SHORT"} ${tradeM.name} @${fmtPr(prices[tradeM.id]||tradeM.base,tradeM.sym)}`);
    setTradeM(null);setDir(null);
  };

  const closePos=(id)=>{
    const pos=positions[id];if(!pos)return;
    const cur=prices[id]||pos.entry;
    const chg=(cur-pos.entry)/pos.entry;
    const profit=pos.dir==="long"?pos.size*chg:-pos.size*chg;
    showToast(`${profit>=0?"✅ ":""} ${fmtEur(profit)} gesloten`);
    setPositions(p=>{const n={...p};delete n[id];return n;});
  };

  const filteredMarkets=catFilter==="Alle"?MARKETS:MARKETS.filter(m=>m.cat===catFilter.toLowerCase());
  const openCount=Object.keys(positions).length;
  const sizes=[500,1000,2500,5000,Math.min(10000,capital)].filter((v,i,a)=>a.indexOf(v)===i&&v<=capital);

  return(
    <div className="fi">
      {/* TOP */}
      <div style={{background:"var(--s1)",borderBottom:"1px solid var(--bd)",padding:"16px 18px"}}>
        <button className="back-btn" onClick={onBack}>← Terug naar competities</button>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <LvBadge id={userLevel}/>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontFamily:"var(--fh)",fontSize:20,letterSpacing:2,color:"var(--r)",display:"flex",alignItems:"center",gap:6}}><div className="ldot lr"/>{countdown}</div>
          </div>
        </div>
        {/* PORTFOLIO */}
        <div className="port-card">
          <div className="port-glow"/>
          <div className="port-lbl">VIRTUEEL PORTFOLIO</div>
          <div className="port-val" style={{color:isPos?"var(--g)":"var(--r)"}}>€{fmtN(Math.round(portVal))}</div>
          <div className="port-row">
            <div className="pnl-v" style={{color:isPos?"var(--g)":"var(--r)"}}>{isPos?"+":""}{fmtEur(pnl)}</div>
            <div className={`pnl-pill ${isPos?"pos-pill":"neg-pill"}`}>{isPos?"+":""}{pnlPct.toFixed(2)}%</div>
            <div style={{marginLeft:"auto",fontFamily:"var(--fm)",fontSize:11,color:"var(--t3)"}}>{openCount} open positie{openCount!==1?"s":""}</div>
          </div>
          <MiniChart positive={isPos}/>
        </div>
        {/* RANK + POOL */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div style={{background:"rgba(255,204,0,.06)",border:"1px solid rgba(255,204,0,.15)",borderRadius:8,padding:"10px 13px",textAlign:"center"}}>
            <div style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--t2)",letterSpacing:2,marginBottom:4}}>JOUW RANK</div>
            <div style={{fontFamily:"var(--fh)",fontSize:22,letterSpacing:2,color:"var(--gold)"}}>#4 <span style={{fontSize:13,color:"var(--t3)"}}>van {tier?.spots}</span></div>
          </div>
          <div style={{background:"var(--gbg)",border:"1px solid var(--gbd)",borderRadius:8,padding:"10px 13px",textAlign:"center"}}>
            <div style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--t2)",letterSpacing:2,marginBottom:4}}>PRIJZENPOOL</div>
            <div style={{fontFamily:"var(--fh)",fontSize:22,letterSpacing:2,color:"var(--g)"}}>{tier?.maxWin}</div>
          </div>
        </div>
      </div>

      {/* DATA STATUS */}
      <div className="data-status">
        <div className={`ldot ${isLive?"lg":"lr"}`}/>
        <span className={isLive?"ds-live":"ds-demo"}>{isLive?"LIVE DATA":"DEMO DATA"}</span>
        {lastUpdate&&<span style={{color:"var(--t3)",marginLeft:4}}>bijgewerkt {lastUpdate}</span>}
        {!isLive&&<span style={{color:"var(--t3)",marginLeft:"auto"}}>API key instellen →</span>}
      </div>

      <div className="sec">
        {/* OPEN POSITIONS */}
        {openCount>0&&(
          <>
            <div className="lbl">🟢 Open posities ({openCount})</div>
            {Object.entries(positions).map(([id,pos])=>{
              const cur=prices[id]||pos.entry;
              const chg=(cur-pos.entry)/pos.entry;
              const profit=pos.dir==="long"?pos.size*chg:-pos.size*chg;
              const ip=profit>=0;
              return(
                <div key={id} className="opos">
                  <div className="opos-top">
                    <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:20}}>{pos.icon}</span><div className="opos-nm">{pos.name}</div></div>
                    <div className={`opos-dir ${pos.dir==="long"?"odir-l":"odir-s"}`}>{pos.dir==="long"?"▲ LONG":"▼ SHORT"}</div>
                  </div>
                  <div className="opos-grid">
                    <div className="og"><div className="og-v">€{fmtN(pos.size)}</div><div className="og-l">INZET</div></div>
                    <div className="og"><div className="og-v">{fmtPr(pos.entry,pos.sym)}</div><div className="og-l">ENTRY</div></div>
                    <div className="og"><div className="og-v">{fmtPr(cur,pos.sym)}</div><div className="og-l">HUIDIG</div></div>
                    <div className="og"><div className="og-v" style={{color:ip?"var(--g)":"var(--r)"}}>{ip?"+":""}{fmtEur(profit)}</div><div className="og-l">P&L</div></div>
                  </div>
                  <button className="close-pos" onClick={()=>closePos(id)}>POSITIE SLUITEN</button>
                </div>
              );
            })}
            <div className="sp"/>
          </>
        )}

        {/* MARKETS */}
        <div className="lbl">📊 18 markten — klik om te handelen</div>
        {/* CATEGORY FILTER */}
        <div style={{display:"flex",gap:7,marginBottom:14,overflowX:"auto",paddingBottom:4}}>
          {CATS.map(c=>(
            <button key={c} onClick={()=>setCatFilter(c)} style={{padding:"6px 13px",borderRadius:20,border:`1px solid ${catFilter===c?"var(--goldbd)":"var(--bd)"}`,background:catFilter===c?"var(--goldbg)":"var(--s1)",color:catFilter===c?"var(--gold)":"var(--t3)",fontFamily:"var(--fm)",fontSize:10,letterSpacing:"1.5px",cursor:"pointer",whiteSpace:"nowrap",transition:"all .15s"}}>
              {c.toUpperCase()}
            </button>
          ))}
        </div>
        {filteredMarkets.map(m=>{
          const hasPos=!!positions[m.id];
          const pos=positions[m.id];
          const cur=prices[m.id]||m.base;
          const chg=((cur-m.base)/m.base*100);
          const isUp=chg>=0;
          const catColors={"index":"var(--b)","commodity":"var(--gold)","crypto":"var(--pur)","stock":"var(--r)","forex":"var(--g)"};
          return(
            <div key={m.id} className={`mkt-card${hasPos?" has-pos":""}`} onClick={()=>{if(!hasPos){setTradeM(m);setDir(null);}}}>
              <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:catColors[m.cat],borderRadius:"14px 0 0 14px"}}/>
              <div className="mkt-l" style={{paddingLeft:6}}>
                <div className="mkt-ic">{m.icon}</div>
                <div>
                  <div className="mkt-nm">{m.name}</div>
                  <div className="mkt-sub">{m.full}</div>
                  {hasPos&&<div className={`pos-tag ${pos.dir==="long"?"pt-long":"pt-short"}`}>{pos.dir==="long"?"▲ LONG":"▼ SHORT"}</div>}
                  {!hasPos&&<div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--t3)",marginTop:3,letterSpacing:1}}>{m.cat.toUpperCase()}</div>}
                </div>
              </div>
              <div>
                <div className="mkt-pr">{fmtPr(cur,m.sym)}</div>
                <div className={`mkt-ch ${isUp?"up":"dn"}`}>{isUp?"+":""}{chg.toFixed(2)}%</div>
                {!hasPos&&<div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--t3)",textAlign:"right",marginTop:2}}>Klik om te handelen</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* TRADE MODAL */}
      {tradeM&&(
        <div className="overlay" onClick={()=>setTradeM(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="m-handle"/>
            <div style={{fontFamily:"var(--fh)",fontSize:26,letterSpacing:3,textAlign:"center",marginBottom:4}}>{tradeM.icon} {tradeM.name}</div>
            <div style={{fontFamily:"var(--fm)",fontSize:13,color:"var(--t2)",textAlign:"center",marginBottom:18}}>
              {fmtPr(prices[tradeM.id]||tradeM.base,tradeM.sym)} · {tradeM.full}
            </div>
            <div className="dir-row">
              <div className={`dir-btn dir-long${dir==="long"?" sel":""}`} onClick={()=>setDir("long")}>
                <div className="dir-lbl">▲ LONG</div>
                <div className="dir-sub">Verwacht stijging</div>
              </div>
              <div className={`dir-btn dir-short${dir==="short"?" sel":""}`} onClick={()=>setDir("short")}>
                <div className="dir-lbl">▼ SHORT</div>
                <div className="dir-sub">Verwacht daling</div>
              </div>
            </div>
            <div style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--t3)",letterSpacing:2,marginBottom:10}}>VIRTUELE INZET</div>
            <div className="size-chips">
              {sizes.map(v=>(
                <div key={v} className={`sz-chip${size===v?" on":""}`} onClick={()=>setSize(v)}>€{fmtN(v)}</div>
              ))}
            </div>
            <div className="trade-sum">
              {[
                ["Richting",    dir==="long"?"▲ LONG":dir==="short"?"▼ SHORT":"— Kies eerst"],
                ["Virtuele inzet", `€${fmtN(size)}`],
                ["Bij +1% beweging", dir?`${dir==="long"?"+":"-"}€${fmtN(Math.round(size*.01))}`:"—"],
                ["Max verlies",  `€${fmtN(size)}`],
              ].map(([k,v])=>(
                <div key={k} className="ts-row">
                  <span className="ts-k">{k}</span>
                  <span className="ts-v" style={k==="Bij +1% beweging"&&dir?{color:dir==="long"?"var(--g)":"var(--r)"}:{}}>{v}</span>
                </div>
              ))}
            </div>
            <div className="m-btns">
              <button className="m-cancel" onClick={()=>setTradeM(null)}>ANNULEER</button>
              <button
                className={`m-go${!dir?" m-disabled":dir==="long"?" m-long":" m-short"}`}
                disabled={!dir}
                onClick={doTrade}
              >
                {!dir?"KIES RICHTING":dir==="long"?"▲ LONG KOPEN":"▼ SHORT GAAN"}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast&&<div className="toast">{toast}</div>}
    </div>
  );
}

// ─── LEVEL UP SCREEN ─────────────────────────────────────────────────────────
function LevelUpScreen({newLvId,onClose}){
  const lv=LEVELS[newLvId];
  return(
    <div className="lvup-overlay">
      <div className="lvup-icon">{lv.icon}</div>
      <div className="lvup-ttl" style={{color:lv.color}}>LEVEL UP!</div>
      <div className="lvup-sub">Jouw trefzekerheid is bewezen</div>
      <div className="lvup-name" style={{color:lv.color}}>{lv.name}</div>
      <div className="lvup-desc">Inleg: €{lv.fee}/dag · Kapitaal: €{fmtN(lv.capital)} · Max winst: {lv.maxWin}</div>
      <button className="lvup-btn" style={{background:lv.color,color:newLvId===3||newLvId===0?"#000":"#fff"}} onClick={onClose}>DOORGAAN →</button>
    </div>
  );
}

// ─── HOME TAB ────────────────────────────────────────────────────────────────
function HomeTab({userLevel,prices,isLive,onEnter,activeTier,onResume}){
  const countdown=useCountdown();
  const[pot,setPot]=useState(24850);
  useEffect(()=>{const iv=setInterval(()=>setPot(p=>p+Math.floor(Math.random()*80+20)),3500);return()=>clearInterval(iv);},[]);
  const today=new Date().toLocaleDateString("nl-NL",{weekday:"long",day:"numeric",month:"long"});
  const lv=LEVELS[userLevel];

  return(
    <div className="fi">
      <div style={{padding:"20px 18px 0",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-60,right:-60,width:260,height:260,background:"radial-gradient(circle,rgba(0,232,122,.07),transparent 70%)",pointerEvents:"none"}}/>
        <div style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--t3)",letterSpacing:3,marginBottom:6}}>{today.toUpperCase()}</div>
        <div style={{fontFamily:"var(--fh)",fontSize:52,lineHeight:.88,letterSpacing:2,marginBottom:8}}>
          TRADE<br/><span style={{color:"var(--g)"}}>ARENA</span>
        </div>
        <div style={{fontSize:13,color:"var(--t2)",lineHeight:1.6,marginBottom:18}}>
          Handel met virtueel kapitaal op <strong style={{color:"var(--t1)"}}>18 echte markten</strong>. Beste rendement wint de pool. Dagelijks — elk level.
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:1,background:"var(--bd)",borderRadius:14,overflow:"hidden",border:"1px solid var(--bd)",marginBottom:18}}>
          {[["€"+fmtN(pot),"LIVE POOL",true],["6","LEVELS",false],[countdown,"SLUIT",false],["18","MARKTEN",false]].map(([v,l,hl])=>(
            <div key={l} style={{background:"var(--s1)",padding:"10px 5px",textAlign:"center"}}>
              <div style={{fontFamily:"var(--fh)",fontSize:hl?20:16,letterSpacing:1,color:hl?"var(--g)":l==="SLUIT"?"var(--r)":"var(--t0)"}}>{v}</div>
              <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--t3)",letterSpacing:2,marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}>
          <LvBadge id={userLevel}/>
          <div style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--t2)"}}>Jouw level · Inleg €{lv.fee}/dag · Max {lv.maxWin}</div>
        </div>
      </div>

      <Ticker prices={prices}/>

      <div className="sec">
        {activeTier ? (
          <>
            <div className="lbl">🟢 Actieve competitie</div>
            <div style={{background:"var(--gbg)",border:"1px solid var(--gbd)",borderRadius:14,padding:"14px 16px",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <LvBadge id={userLevel}/>
                <span style={{fontFamily:"var(--fh)",fontSize:18,letterSpacing:2,color:"var(--r)",display:"flex",alignItems:"center",gap:6}}><div className="ldot lr"/>{countdown}</span>
              </div>
              <button className="btn btn-gold" style={{fontSize:18}} onClick={onResume}>DOORGAAN MET HANDELEN →</button>
            </div>
          </>
        ):(
          <>
            <div className="lbl">Vandaag beschikbaar voor jou</div>
            {LEVELS.filter(l=>l.lvReq<=userLevel).map(l=>(
              <div key={l.id} onClick={onEnter} style={{background:"var(--s1)",border:`1px solid ${l.id===userLevel?"rgba(255,204,0,.2)":"var(--bd)"}`,borderRadius:14,marginBottom:8,overflow:"hidden",cursor:"pointer",transition:"border-color .15s"}}>
                <div style={{height:2,background:`linear-gradient(90deg,${l.color},transparent)`}}/>
                <div style={{padding:"12px 14px 0"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                    <LvBadge id={l.id}/>
                    {l.id===userLevel&&<span style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--gold)",background:"var(--goldbg)",border:"1px solid var(--goldbd)",borderRadius:8,padding:"2px 8px"}}>JOUW LEVEL</span>}
                  </div>
                  <div style={{fontFamily:"var(--fh)",fontSize:18,letterSpacing:2,color:"var(--t0)",marginBottom:3}}>DAILY {l.name}</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,marginBottom:10}}>
                    {[[`€${fmtN(l.capital)}`,"KAPITAAL",l.color],[`€${l.fee}`,"INSTAP","var(--t1)"],[l.maxWin,"MAX WIN","var(--gold)"],[`${l.spots}`,"PLEKKEN","var(--t1)"]].map(([v,lb,c])=>(
                      <div key={lb} style={{background:"var(--s2)",borderRadius:8,padding:"8px 5px",textAlign:"center"}}>
                        <div style={{fontFamily:"var(--fh)",fontSize:15,color:c}}>{v}</div>
                        <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--t3)",letterSpacing:1,marginTop:2}}>{lb}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{height:3,background:"var(--s3)"}}><div style={{height:"100%",width:`${35+l.id*9}%`,background:`linear-gradient(90deg,${l.color},transparent)`}}/></div>
                <div style={{padding:"9px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",borderTop:"1px solid var(--bd)"}}>
                  <span style={{fontFamily:"var(--fm)",fontSize:12,fontWeight:700}}><small style={{fontSize:10,color:"var(--t3)",fontWeight:400,marginRight:3}}>INSTAP</small>€{l.fee}</span>
                  <button style={{padding:"7px 14px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"var(--fh)",fontSize:14,letterSpacing:2,background:"var(--gold)",color:"#000",fontWeight:700}} onClick={e=>{e.stopPropagation();onEnter();}}>INSTAPPEN →</button>
                </div>
              </div>
            ))}
            <button className="btn btn-ghost" style={{fontSize:15,padding:13}} onClick={onEnter}>Alle tiers bekijken →</button>
          </>
        )}

        <div className="sp"/>
        <div className="lbl">📡 Live prijzen — {isLive?"echte data":"demo data"}</div>
        {MARKETS.slice(0,6).map(m=>{
          const cur=prices[m.id]||m.base;
          const chg=((cur-m.base)/m.base*100);
          const isUp=chg>=0;
          const catColors={"index":"var(--b)","commodity":"var(--gold)","crypto":"var(--pur)","stock":"var(--r)","forex":"var(--g)"};
          return(
            <div key={m.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:14,padding:"12px 14px",marginBottom:7,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:catColors[m.cat]}}/>
              <div style={{display:"flex",alignItems:"center",gap:10,paddingLeft:6}}>
                <div style={{width:34,height:34,background:"var(--s2)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{m.icon}</div>
                <div>
                  <div style={{fontFamily:"var(--fb)",fontSize:14,fontWeight:700,color:"var(--t0)"}}>{m.name}</div>
                  <div style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--t3)"}}>{m.full}</div>
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontFamily:"var(--fm)",fontSize:14,fontWeight:700,color:"var(--t1)"}}>{fmtPr(cur,m.sym)}</div>
                <div style={{fontFamily:"var(--fm)",fontSize:11,color:isUp?"var(--g)":"var(--r)"}}>{isUp?"+":""}{chg.toFixed(2)}%</div>
              </div>
            </div>
          );
        })}
        <div style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--t3)",textAlign:"center",padding:"8px 0"}}>+ 12 meer markten in de trading interface</div>
      </div>
    </div>
  );
}

// ─── RANKING TAB ─────────────────────────────────────────────────────────────
function RankingTab({userLevel}){
  const[selLv,setSelLv]=useState(userLevel);
  const lv=LEVELS[selLv];
  const pool=Math.round(lv.fee*lv.spots*CONFIG.PRIZE_PCT);
  const colors=["#8888a8","#00b4ff","#00e87a","#ffcc00","#ff3358","#9d5cff"];
  return(
    <div className="fi"><div className="sec">
      <div style={{display:"flex",gap:7,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
        {LEVELS.map(l=>(
          <div key={l.id} onClick={()=>setSelLv(l.id)} style={{padding:"6px 12px",borderRadius:20,border:`1px solid ${selLv===l.id?colors[l.id]:"var(--bd)"}`,background:selLv===l.id?`${colors[l.id]}18`:"var(--s1)",color:selLv===l.id?colors[l.id]:"var(--t3)",fontFamily:"var(--fm)",fontSize:10,letterSpacing:"1.5px",cursor:"pointer",whiteSpace:"nowrap",transition:"all .15s"}}>
            {l.icon} {l.name}
          </div>
        ))}
      </div>
      <div style={{background:`${colors[selLv]}10`,border:`1px solid ${colors[selLv]}40`,borderRadius:14,padding:14,marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontFamily:"var(--fh)",fontSize:18,letterSpacing:2,color:colors[selLv]}}>DAILY {lv.name}</div><div style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--t2)",marginTop:4}}>€{fmtN(lv.capital)} kapitaal · {lv.spots} spelers</div></div>
        <div style={{textAlign:"right"}}><div style={{fontFamily:"var(--fh)",fontSize:28,letterSpacing:2,color:colors[selLv]}}>€{fmtN(pool)}</div><div style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--t3)"}}>prijzenpool</div></div>
      </div>
      <div className="lbl">Top 3</div>
      <div className="lb-podium">
        {[LB_DATA[1],LB_DATA[0],LB_DATA[2]].map((p,i)=>(
          <div key={p.rank} className={`pod${i===1?" pod1":""}`}>
            <div className="pod-med">{["🥈","🥇","🥉"][i]}</div>
            <div className="pod-av">{p.av}</div>
            <div className="pod-nm">{p.name}</div>
            <div className="pod-pnl" style={{color:p.pnl.startsWith("+")?"var(--g)":"var(--r)"}}>{p.pnl}</div>
            <div className="pod-prize">{p.prize}</div>
          </div>
        ))}
      </div>
      <div className="lbl">Volledige ranglijst</div>
      {LB_DATA.map(p=>(
        <div key={p.rank} className={`lb-row${p.me?" me":""}`}>
          <div className="lb-rnk">{p.rank<=3?["🥇","🥈","🥉"][p.rank-1]:`#${p.rank}`}</div>
          <div className="lb-av">{p.av}</div>
          <div className="lb-info">
            <div className="lb-nm">{p.name}{p.me&&<span className="me-tag">JIJ</span>}</div>
            <div className="lb-sub">{p.amt} virtueel portfolio</div>
          </div>
          <div className="lb-r">
            <div className="lb-pnl" style={{color:p.pnl.startsWith("+")?"var(--g)":"var(--r)"}}>{p.pnl}</div>
            {p.prize!=="—"&&<div className="lb-prize">{p.prize}</div>}
          </div>
        </div>
      ))}
    </div></div>
  );
}

// ─── BEHAVIORAL TAB ──────────────────────────────────────────────────────────
function BehaviorTab(){
  const perfBars=[{l:"Win rate",v:63,c:"var(--g)"},{l:"Avg winner",v:78,c:"var(--b)"},{l:"Avg loser",v:45,c:"var(--r)"},{l:"Profit factor",v:72,c:"var(--gold)",d:"1.8×"},{l:"Max drawdown",v:38,c:"var(--r)",d:"-8.4%"},{l:"Sharpe ratio",v:65,c:"var(--pur)",d:"1.24"}];
  return(
    <div className="fi"><div className="sec">
      <div className="lbl">🧠 Jouw behavioral profiel</div>
      <div className="beh-grid">
        {[["63%","WIN RATE","var(--g)"],["1.8×","PROFIT FCT","var(--b)"],["4","WIN STREAK","var(--gold)"],["B+","BlackBox Score","var(--pur)"]].map(([v,l,c])=>(
          <div key={l} className="beh-card">
            <div className="beh-v" style={{color:c}}>{v}</div>
            <div className="beh-l">{l}</div>
          </div>
        ))}
      </div>
      <div className="lbl">Performance metrics</div>
      <div style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:14,padding:16,marginBottom:14}}>
        {perfBars.map(({l,v,c,d})=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
            <div style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--t2)",width:110,flexShrink:0}}>{l}</div>
            <div style={{flex:1,height:6,background:"var(--s3)",borderRadius:10,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(100,v)}%`,background:c,borderRadius:10}}/></div>
            <div style={{fontFamily:"var(--fm)",fontSize:11,fontWeight:700,color:c,width:36,textAlign:"right",flexShrink:0}}>{d||v+"%"}</div>
          </div>
        ))}
      </div>
      <div className="lbl">⚠️ Systematische fouten</div>
      {ERRORS.map(e=>(
        <div key={e.nm} className="err-item">
          <div className="err-ic">{e.ic}</div>
          <div><div className="err-nm">{e.nm}</div><div className="err-ds">{e.ds}</div></div>
          <div className={`err-sev sev-${e.sev}`}>{e.sev==="h"?"HOOG":e.sev==="m"?"MIDDEL":"GOED"}</div>
        </div>
      ))}
      <div className="sp"/>
      <div style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:14,padding:14}}>
        <div style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--t3)",letterSpacing:2,marginBottom:8}}>💡 AI COACH — PERSOONLIJK ADVIES</div>
        <div style={{fontSize:13,color:"var(--t2)",lineHeight:1.65}}>
          Je <strong style={{color:"var(--t1)"}}>profit factor van 1.8</strong> is goed maar je revenge trading patroon kost je gemiddeld <strong style={{color:"var(--r)"}}>2.3% rendement per week</strong>. Na een verliezende positie wacht je gemiddeld slechts 4 minuten voor je opnieuw instapt. Aanbeveling: wacht minimaal 30 minuten en analyseer eerst wat er mis ging.
        </div>
      </div>
    </div></div>
  );
}

// ─── PROFILE TAB ────────────────────────────────────────────────────────────
function ProfileTab({userLevel,balance,setBalance,showToast}){
  const lv=LEVELS[userLevel];
  const colors=["#8888a8","#00b4ff","#00e87a","#ffcc00","#ff3358","#9d5cff"];
  const hist=[
    {r:"win", c:"Daily SEMI-PRO",amt:+680, rank:"2e",  date:"Gisteren"},
    {r:"loss",c:"Daily AMATEUR", amt:-25,  rank:"7e",  date:"2 dagen"},
    {r:"win", c:"Daily PRO",     amt:+1420,rank:"1e 🏆",date:"3 dagen"},
    {r:"live",c:"Daily PRO",     amt:null, rank:"4e live",date:"Vandaag"},
    {r:"loss",c:"Daily SEMI-PRO",amt:-50,  rank:"9e",  date:"4 dagen"},
    {r:"win", c:"Daily ROOKIE",  amt:+210, rank:"1e 🏆",date:"5 dagen"},
  ];
  return(
    <div className="fi">
      <div style={{background:"var(--s1)",borderBottom:"1px solid var(--bd)",padding:"20px 18px"}}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
          <div style={{width:60,height:60,background:"var(--s2)",border:`2px solid ${colors[userLevel]}`,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>👤</div>
          <div>
            <div style={{fontFamily:"var(--fh)",fontSize:26,letterSpacing:2}}>Jij</div>
            <div style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--t3)",marginTop:2}}>TradeArena · Lid maart 2026</div>
            <div style={{marginTop:6}}><LvBadge id={userLevel}/></div>
          </div>
          <div style={{marginLeft:"auto",background:`${colors[userLevel]}12`,border:`1px solid ${colors[userLevel]}40`,borderRadius:8,padding:"8px 10px",textAlign:"center",flexShrink:0}}>
            <div style={{fontFamily:"var(--fh)",fontSize:22,color:colors[userLevel],letterSpacing:1}}>#4</div>
            <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--t3)"}}>RANK</div>
          </div>
        </div>
        <div className="pstats">
          {[["14","COMPS"],["63%","WIN RATE"],["€2.310","VERDIEND"],["3","STREAK"]].map(([v,l])=>(
            <div key={l} className="ps"><div className="ps-v" style={{color:l==="VERDIEND"?"var(--gold)":l==="WIN RATE"?"var(--g)":"var(--t0)"}}>{v}</div><div className="ps-l">{l}</div></div>
          ))}
        </div>
      </div>
      <div className="sec">
        {/* XP BALK */}
        <div style={{background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:14,padding:14,marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <div style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--t3)",letterSpacing:2}}>LEVEL PROGRESSIE</div>
            <div style={{fontFamily:"var(--fm)",fontSize:10,color:colors[userLevel]}}>42% naar {userLevel<5?LEVELS[userLevel+1].name:"MAX"}</div>
          </div>
          <div style={{height:8,background:"var(--s3)",borderRadius:10,overflow:"hidden",marginBottom:6}}>
            <div style={{height:"100%",width:"42%",background:`linear-gradient(90deg,${colors[userLevel]},${userLevel<5?colors[userLevel+1]:colors[5]})`,borderRadius:10}}/>
          </div>
          <div style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--t3)"}}>Speel 3 meer competities met 70%+ win rate om te levelen naar <strong style={{color:userLevel<5?colors[userLevel+1]:"var(--pur)"}}>{userLevel<5?LEVELS[userLevel+1].name:"MASTER"}</strong></div>
        </div>

        {/* WALLET */}
        <div className="wallet-card">
          <div className="wc-l">JOUW SALDO</div>
          <div className="wc-a">€{fmtN(balance)}</div>
          <div className="wc-btns">
            <div className="wc-btn" onClick={()=>{setBalance(b=>b+100);showToast("✅ €100 gestort");}}>+ STORTEN</div>
            <div className="wc-btn">OPNEMEN ↗</div>
          </div>
        </div>

        {/* HISTORY */}
        <div className="lbl">Competitie historie</div>
        {hist.map((h,i)=>(
          <div key={i} className="hist-row">
            <div className={`h-badge ${h.r==="win"?"hb-w":h.r==="loss"?"hb-l":"hb-v"}`}>
              {h.r==="win"?"WIN":h.r==="loss"?"VERLIES":"LIVE"}
            </div>
            <div>
              <div className="h-info">{h.c}</div>
              <div className="h-sub">{h.rank} · {h.date}</div>
            </div>
            <div className={`h-amt ${h.r==="win"?"h-pos":h.r==="loss"?"h-neg":"h-live"}`}>
              {h.amt===null?"—":h.amt>0?`+€${h.amt}`:`-€${Math.abs(h.amt)}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App(){
  const[tab,setTab]           = useState("home");
  const[view,setView]         = useState(null); // null | "entry" | "trading"
  const[activeTier,setAT]     = useState(null);
  const[userLevel,setULevel]  = useState(2);
  const[balance,setBalance]   = useState(1240);
  const[lvUpShow,setLvUp]     = useState(false);
  const[newLvId,setNewLvId]   = useState(null);
  const[toast,showToast]      = useToast();
  const{prices,isLive,lastUpdate} = useLivePrices();

  const handleStart = (tier) => {
    setAT(tier);
    setView("trading");
    // Simuleer level-up na 5 seconden (in productie: bij echte competitieafsluiting)
    // setTimeout(()=>{ setNewLvId(Math.min(5,userLevel+1)); setLvUp(true); }, 5000);
  };

  const TABS=[
    {id:"home",     icon:"⚡",lbl:"Arena"},
    {id:"ranking",  icon:"🏆",lbl:"Ranking"},
    {id:"behavior", icon:"🧠",lbl:"Gedrag"},
    {id:"profile",  icon:"👤",lbl:"Profiel"},
  ];

  return(
    <>
      <style>{CSS}</style>
      <div className="app">
        {lvUpShow&&newLvId&&<LevelUpScreen newLvId={newLvId} onClose={()=>{setULevel(newLvId);setLvUp(false);showToast(`🏆 Welcome to ${LEVELS[newLvId].name}!`);}}/>}
        <div className="hdr z1">
          <div className="logo">TRADE<em>ARENA</em></div>
          <div className="hdr-r">
            <div className="saldo" onClick={()=>{setTab("profile");setView(null);}}>
              <div className="sdot"/>
              <div className="saldo-amt">€{fmtN(balance)}</div>
            </div>
            <div className="hbtn" onClick={()=>showToast("🔔 Jouw Daily SEMI-PRO sluit over 2 uur")}>
              🔔<div className="ndot"/>
            </div>
          </div>
        </div>
        <div className="scroll">
          {view==="entry" && (
            <EntryFlow
              userLevel={userLevel}
              onStart={handleStart}
              onBack={()=>setView(null)}
              balance={balance}
              setBalance={setBalance}
            />
          )}
          {view==="trading" && activeTier && (
            <LiveTrading
              tier={activeTier}
              userLevel={userLevel}
              onBack={()=>setView(null)}
              prices={prices}
              isLive={isLive}
              lastUpdate={lastUpdate}
            />
          )}
          {!view && tab==="home" && (
            <HomeTab
              userLevel={userLevel}
              prices={prices}
              isLive={isLive}
              onEnter={()=>setView("entry")}
              activeTier={activeTier}
              onResume={()=>setView("trading")}
            />
          )}
          {!view && tab==="ranking"  && <RankingTab userLevel={userLevel}/>}
          {!view && tab==="behavior" && <BehaviorTab/>}
          {!view && tab==="profile"  && <ProfileTab userLevel={userLevel} balance={balance} setBalance={setBalance} showToast={showToast}/>}
        </div>
        <div className="nav z1">
          {TABS.map(n=>(
            <button key={n.id} className={`nb${tab===n.id&&!view?" on":""}`} onClick={()=>{setTab(n.id);setView(null);}}>
              <span className="nbi">{n.icon}</span>
              <span className="nbl">{n.lbl}</span>
            </button>
          ))}
        </div>
        {toast&&<div className="toast">{toast}</div>}
      </div>
    </>
  );
}
