# Vunachain - EUDR Compliance & Supply Chain Traceability

Vunachain is a high-performance platform designed to empower agricultural cooperatives with blockchain-based traceability and EUDR (European Union Deforestation Regulation) compliance tools.

> **Last Updated:** February 8, 2026 | **Status:** ✅ Production

## 📖 Documentation

- **[PROJECT_AUDIT.md](./PROJECT_AUDIT.md)** — **MASTER DOCUMENT**: Comprehensive project audit, architecture, API reference, and implementation guides.
- **[Vunachain_backend/DOCUMENTATION_INDEX.md](./Vunachain_backend/DOCUMENTATION_INDEX.md)** — Additional CMS/Sanity setup context.

## 📁 Project Structure

This repository is organized as a monorepo containing the following components:

- **`/apps/landing`**: A modern React (Vite) frontend for the public landing page, ROI calculator, and blog.
- **`/apps/backend`**: A robust Django REST API for lead capture, analytics, and data management.
- **`/apps/cms`**: Sanity.io Studio for dynamic content management.

---

## 🚀 Quick Start

### 1. Backend Setup (Django)
```bash
cd apps/backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
*Backend runs on `http://localhost:8000`*

### 2. Frontend Setup (React)
```bash
cd apps/landing
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000`*

---

## 🛠️ Key Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion.
- **Backend**: Django 5.0, Django REST Framework, GeoDjango (PostGIS).
- **Compliance**: EUDR Regulation, Kenya Tea Act 2020.
- **CMS**: Sanity.io (Headless CMS).
- **Analytics**: Google Tag Manager & Custom Behavioral Logging.

---

## 🚢 Production Deployment

- **Frontend**: Deployed on **Vercel** (`vunachain.com`).
- **Backend**: Deployed on **Railway** (`vunachainbackend-production.up.railway.app`).

**Connectivity Note**: In production, the frontend connects directly to the Railway API to ensure maximum reliability and bypass CORS/Proxy overhead.

**Production Stability**: The dashboard and administrative routes are automatically hidden in production to prevent unauthorized access while the main site handles public landing traffic.

---

## 📄 License

&copy; 2026 Vunachain. All rights reserved.
