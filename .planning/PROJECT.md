# AgriProfit — Agricultural Intelligence Platform

## What This Is

AgriProfit is a farmer-facing intelligence platform that turns 10 years of APMC market prices, 40 years of rainfall, 10 years of daily weather, and block-level soil health data (NPK/pH) into actionable signals: price forecasts, crop recommendations by soil profile, seasonal sell windows, and cross-mandi arbitrage alerts. It sits on top of an existing FastAPI + PostgreSQL + Next.js platform with a working transport logistics engine.

## Core Value

A farmer in any district can ask "what should I grow and when should I sell it?" and get a data-backed answer — not a guess.

## Requirements

### Validated

<!-- Existing platform capabilities — already shipped and working. -->

- ✓ FastAPI backend with SQLAlchemy + PostgreSQL + Alembic — existing
- ✓ Next.js frontend (partially built) — existing
- ✓ Transport logistics engine (freight, spoilage, risk, OSRM routing) — existing
- ✓ Data sync infrastructure (APScheduler + data.gov.in API client) — existing
- ✓ 25.1M rows Agmarknet daily prices (2015–2025) loaded in DB + parquet — existing
- ✓ 598 passing tests — existing
- ✓ OTP authentication + JWT session management — existing
- ✓ Role-based access (user / admin) — existing

### Active

<!-- New ML/data intelligence features — building toward these. -->

- [ ] District name harmonisation across all 4 datasets (prices, rainfall, weather, soil)
- [ ] Seasonal price calendar — best month to sell commodity X in state Y (10yr aggregation)
- [ ] Price forecasting engine — XGBoost baseline per commodity+district, 7–30 day horizon
- [ ] Rainfall feature engineering — monthly deficit/surplus as price model input (95% district coverage)
- [ ] Crop recommendation engine — soil NPK/pH deficiency profile → crop suitability + fertiliser advice
- [ ] LSTM price forecasting — sequence model for volatile commodities (onion, tomato, potato)
- [ ] Mandi arbitrage dashboard — real-time price differentials across mandis for same commodity
- [ ] Weather-enhanced price model — temperature + humidity features for 260 weather-covered districts
- [ ] FastAPI ML endpoints — serve forecasts, recommendations, arbitrage signals
- [ ] Next.js dashboards — seasonal calendar, price chart with forecast, crop advisor UI, arbitrage map

### Out of Scope

- Crop yield prediction — no production volume data (area planted, tonnes harvested)
- MSP / policy impact modeling — no government policy event timeline
- Real-time live prices — API client exists but wiring to ML model out of scope for this milestone
- React Native mobile — separate completed project (AgriProfit Mobile, all 6 phases done)
- Individual farm-level advice — no farm boundary or field-level data

## Context

### Data Assets (all in C:\Users\alame\Desktop\repo-root\data\)

| Dataset | Rows | Coverage | Format |
|---|---|---|---|
| Agmarknet daily prices | 25.1M | 314 commodities, 32 states, 571 districts, 2015–2025 | PostgreSQL + parquet |
| Soil health (NPK/pH) | 84,794 | 31 states, 731 districts, 6,895 blocks, 3 cycles | parquet |
| Rainfall monthly | 306,646 | 33 states, 616 districts, 1985–2026 | parquet |
| Weather daily | 1,095,442 | 290 districts, 2016–2025 (split across 2 CSVs) | CSV |

### Cross-dataset Join Quality

| Join | Exact match | After fuzzy |
|---|---|---|
| Price ↔ Rainfall | 543/571 (95%) | ~560 |
| Price ↔ Soil | 464/571 (81%) | ~488 |
| Price ↔ Weather | 237/571 (41%) | ~261 |

### Key Data Insights

- Tomato seasonal CV = 34%, Onion = 26%, Wheat = 2% — high vegetable volatility makes ML valuable
- 69.7% of blocks nationwide are LOW in Nitrogen; 86.9% LOW in pH — soil deficiency is widespread
- Soil data missing only for Chandigarh, Delhi NCT, Puducherry (tiny UTs, negligible farmland)
- Weather data only covers ~46% of price districts after fuzzy matching — tiered feature strategy needed

### Tech Stack for ML Layer

- Python: pandas, scikit-learn, XGBoost, statsmodels, PyTorch (LSTM)
- Models: serialised to disk (joblib/torch.save), loaded by FastAPI at startup
- New DB tables: `district_name_map`, `seasonal_price_stats`, `forecast_cache`, `soil_crop_suitability`
- New Alembic migrations for each new table

## Constraints

- **Tech stack**: Python ML models served via existing FastAPI — no new microservices
- **Database**: PostgreSQL only — no separate vector DB or feature store for v1
- **Coverage**: Soil recommendation available only for 31 states; weather features only for ~260 districts — UI must communicate coverage gaps
- **Data freshness**: Price data ends 2025-10-30; forecasts are retrospective validation + near-term projection, not live
- **Performance**: Price data is 25M rows — all queries MUST include date filters; full-table scans cause 60s+ timeouts (learned from existing transport engine work)

## Key Decisions

| Decision | Rationale | Outcome |
|---|---|---|
| XGBoost before LSTM | Tabular model is faster to train, validate, and serve; provides baseline to beat | — Pending |
| District fuzzy matching as Phase 1 | All cross-dataset features depend on this; must unlock before any ML | — Pending |
| Seasonal calendar as first user-facing feature | Pure aggregation, zero model risk, immediate farmer value | — Pending |
| Block-level soil distributions (not field-level) | Only available granularity; must communicate as "block average" to users | — Pending |
| Tiered weather coverage | 260/571 districts have weather; use rainfall for the rest rather than dropping rows | — Pending |

---
*Last updated: 2026-03-01 after initialization*
