# TradeArena

Virtuele trading competitie platform.

## Setup

1. Clone deze repo
2. `npm install`
3. `npm start` — lokaal draaien
4. Push naar GitHub → Vercel deployt automatisch

## Config

API key staat in `src/App.jsx` in het CONFIG object.
Voor productie: zet `REACT_APP_TWELVEDATA_KEY` in Vercel environment variables.

## Markten
18 markten: Indices (US30, US100, US500, GER40, UK100, AEX) · 
Commodities (GOLD, OIL, SILVER) · Crypto (BTC, ETH) · 
Aandelen (NVIDIA, ASML, APPLE, TESLA) · Forex (EUR/USD, GBP/USD, EUR/GBP)
