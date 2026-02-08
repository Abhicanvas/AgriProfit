# Project Proposal: AgriProfit (Begu)

Date: February 6, 2026

## Abstract
AgriProfit is a cloud-based SaaS platform that helps farmers across India make better market decisions using historical commodity price analytics, lightweight price forecasting, transport cost comparison, and community discussions. The system delivers a single backend API consumed by both web (Next.js) and mobile (React Native) clients. It integrates government price data and large historical datasets to provide timely insights, improve price transparency, and reduce information asymmetry for farmers.

## Project Details
Languages expected to be used: Python, TypeScript, JavaScript, SQL, HTML, CSS

OS used: Windows 10 or 11 for development, Linux (Ubuntu) for deployment via Docker

Packages used (Backend): fastapi, uvicorn, SQLAlchemy, pydantic, pydantic-settings, python-jose, passlib, bcrypt, psycopg2-binary, redis, slowapi, APScheduler, alembic, httpx, requests, python-dotenv, pytest

Packages used (Frontend): next, react, @tanstack/react-query, axios, recharts, react-hook-form, zod, zustand, tailwindcss, radix-ui, vitest, eslint

Packages used (Optional data integration): pandas, pyarrow

Backend storage technique: Relational database storage using PostgreSQL with normalized tables accessed via SQLAlchemy ORM. Redis is used for caching, rate limiting, and session-related data. Historical price data can also be loaded from a parquet file for analytics workloads.

Libraries / External Libraries: Twilio or Fast2SMS (OTP delivery), data.gov.in API (daily price sync), Agmarknet historical dataset (parquet), Nominatim geocoding, Redis, PostgreSQL

## Social and Ethical Relevance
AgriProfit improves market transparency and empowers small farmers to negotiate better prices by providing accessible, localized price intelligence. Ethical considerations include protecting user privacy, avoiding overconfidence in forecasts by presenting clear disclaimers, and ensuring that alerts or analytics do not mislead users during volatile market conditions. The platform also encourages community knowledge sharing, which can reduce exploitation by intermediaries and support more sustainable farming decisions.

## SDG Goals Addressed
- SDG 2: Zero Hunger. Better market decisions can improve farmer income stability and food supply resilience.
- SDG 8: Decent Work and Economic Growth. Helps farmers optimize selling decisions and reduce transport cost waste.
- SDG 9: Industry, Innovation and Infrastructure. Uses digital tools and data to modernize agricultural decision-making.
- SDG 12: Responsible Consumption and Production. Supports more informed supply-chain and selling practices.
