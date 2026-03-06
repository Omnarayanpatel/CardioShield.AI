# CardioShield AI
AI-Powered Early Cardiovascular Risk Stratification Platform

## Team Members and Roles
- Team Member 1: Backend and API development/ML pipeline and fairness evaluation
- Team Member 2: Frontend and UX/Deployment and documentation

## Problem Statement
CardioShield AI provides low-cost, explainable cardiovascular risk estimation for underserved and rural populations. The system helps healthcare workers identify high-risk patients early for timely specialist referral.

## Tech Stack Used
- Frontend: React, Vite, Tailwind CSS, Recharts
- Backend: FastAPI, SQLAlchemy, PostgreSQL/SQLite
- ML: scikit-learn, XGBoost, LightGBM
- Auth: JWT (`python-jose`), Passlib

## Repository Structure
```text
NavKalpana-TeamCode/
  frontend/
  backend/
  docs/
    architecture.png
    api-doc.md
    presentation.pptx
  model_training/
  README.md
```

## Installation Steps

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `POST /predict`
- `GET /history`
- `GET /admin/users`
- `PATCH /admin/users/{user_id}`
- `GET /admin/predictions`
- `GET /admin/fairness/report`
- `GET /health`

Detailed request/response docs: [`docs/api-doc.md`](docs/api-doc.md)

## Screenshots
- Add landing page screenshot
- Add patient dashboard screenshot
- Add admin dashboard screenshot
- Add prediction result screenshot

## Future Improvements
- Full SHAP visual explanations in UI
- Automated fairness report generation from training pipeline
- Offline-first rural mode with local sync queue
- Role-specific multilingual UI
- Render/Railway production deployment pipeline
