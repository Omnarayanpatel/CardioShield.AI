# CardioShield AI
## AI-Powered Early Cardiovascular Risk Stratification Platform

**Project Type:** Final Year / College Submission Report  
**Domain:** Healthcare AI, Web Application, Risk Prediction  
**Repository:** CardioShield  
**Prepared For:** College Submission

---

## 1. Abstract

CardioShield AI is a healthcare-focused web platform that predicts cardiovascular risk using low-cost clinical inputs such as age, blood pressure, cholesterol, glucose, height, weight, smoking, alcohol intake, and physical activity. The system is designed to support early screening and decision-making for patients, doctors, and administrators.

The application combines a machine learning prediction engine with a role-based web interface. Patients can generate their own risk reports, doctors can manage only their assigned patients, and administrators can manage the complete hospital workflow. The platform also provides explainable outputs, downloadable reports, audit logs, and fairness reporting support.

---

## 2. Problem Statement

Cardiovascular disease is one of the leading causes of preventable mortality. In many hospitals and rural screening environments, advanced diagnostic tools may not be available at the first point of care. Healthcare workers need a fast, explainable, and low-cost way to identify patients at elevated risk.

The goal of CardioShield AI is to help clinicians and care teams:

- identify high-risk patients early,
- reduce manual screening effort,
- provide explainable prediction summaries,
- keep data access limited by role,
- and support secure patient-doctor hospital workflows.

---

## 3. Objectives

The main objectives of the project are:

- build an AI-powered cardiovascular risk prediction system,
- support role-based access for `admin`, `doctor`, and `patient`,
- allow doctors to manage only their own patients,
- provide downloadable prediction and history reports,
- maintain audit logs for critical actions,
- add fairness reporting support for model governance,
- and create a clean, responsive UI for hospital-style workflows.

---

## 4. Proposed Solution

CardioShield AI is a full-stack web application with:

- a React frontend for dashboard and form-based interaction,
- a FastAPI backend for prediction and authorization,
- a machine learning model for risk estimation,
- SQLAlchemy-based persistence for users, predictions, audit logs, and fairness reports,
- and secure JWT authentication.

The system supports the following roles:

- `patient` - can register themselves, predict risk, view their own history, and access their care plan.
- `doctor` - can view and manage only assigned patients, create patient accounts, and review scoped histories.
- `admin` - can manage the entire platform, users, predictions, and fairness reports.

---

## 5. Key Features

### 5.1 Authentication and Role Management

- JWT-based login and session handling
- patient self-registration
- doctor registration through invite code
- admin onboarding through bootstrap environment configuration
- role-based route protection in the frontend

### 5.2 Prediction Workflow

- accepts low-cost clinical inputs
- converts data into model features
- returns risk probability and risk category
- provides top risk factors and recommendation text
- saves each prediction in the database

### 5.3 Doctor Workflow

- doctor sees only assigned patients
- doctor can create new patient accounts
- doctor can edit or deactivate only their own patients
- doctor can view patient history with email visibility

### 5.4 Admin Workflow

- manage users, roles, and patient assignment
- view all predictions and export them
- access fairness report data
- view system-wide audit-related activity

### 5.5 Reporting and Export

- export history in CSV, JSON, or TXT
- export user list and prediction list
- export individual prediction reports
- export fairness report

### 5.6 UI/UX

- responsive landing page
- role-aware login and registration
- separate dashboards for admin, doctor, and patient
- clean contact page and health-tech branding

---

## 6. Technology Stack

### Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Recharts

### Backend

- FastAPI
- SQLAlchemy
- Pydantic
- Uvicorn

### Database

- PostgreSQL for deployment
- SQLite for local development and testing

### Machine Learning

- scikit-learn
- XGBoost
- LightGBM

### Authentication and Security

- JWT
- Passlib
- OAuth2-style bearer token flow

---

## 7. System Architecture

CardioShield AI follows a three-layer architecture:

1. **Presentation Layer**
   - React frontend
   - pages for landing, login, register, dashboards, history, prediction, and contact

2. **Application Layer**
   - FastAPI backend
   - authentication, authorization, prediction, export, and admin APIs

3. **Data Layer**
   - relational storage for users, predictions, audit logs, and fairness reports
   - model artifact loading for inference

### Major Components

- `frontend/src/pages`
- `backend/app`
- `model_training`
- `docs`

---

## 8. Database Design

The application uses the following main entities:

### 8.1 Patients Table

Stores user accounts for all roles.

Important fields:

- id
- name
- email
- password hash
- role
- doctor_id
- is_active
- created_at

### 8.2 Predictions Table

Stores each risk prediction request and model response.

Important fields:

- user_id
- user_email
- age
- gender
- height
- weight
- ap_hi
- ap_lo
- cholesterol
- gluc
- smoke
- alco
- active
- risk_probability
- risk_category
- confidence_low
- confidence_high
- top_risk_factors
- explanation_text
- recommendation
- escalation_required
- created_at

### 8.3 Audit Logs Table

Stores logs for actions such as:

- login
- register
- prediction creation
- user management
- report export

### 8.4 Fairness Reports Table

Stores fairness metrics for governance and audit support.

---

## 9. Machine Learning Approach

The prediction engine uses clinical values and derived features to estimate cardiovascular risk.

### Input Features

- age in days
- gender
- height
- weight
- systolic blood pressure
- diastolic blood pressure
- cholesterol
- glucose
- smoking status
- alcohol intake
- physical activity

### Derived Features

- BMI
- pulse pressure
- age and blood pressure interaction
- glucose and BMI interaction
- BMI risk category

### Output

- probability of cardiovascular risk
- low / moderate / high category
- confidence interval
- top contributing risk factors
- recommendation
- escalation flag

The system is designed to be explainable so users can understand why a prediction was produced.

---

## 10. Security and Access Control

Security is implemented at multiple levels:

- JWT-based authentication for protected routes
- role-based backend authorization
- route protection in frontend
- doctor access restricted to assigned patients
- admin-only control for system-wide operations
- audit logging for sensitive actions
- invite-code restriction for doctor registration

This ensures that doctors do not see patient data outside their assigned scope and patients only see their own records.

---

## 11. Deployment

The application is designed for deployment as:

- **Frontend:** static site deployment
- **Backend:** web service deployment
- **Database:** PostgreSQL

The local project can also run using:

- `uvicorn` for backend
- `npm run dev` for frontend

---

## 12. Testing and Verification

The application was verified through:

- backend compile checks
- frontend linting
- frontend production build
- role-based route validation
- prediction history filtering
- doctor-only patient scoping
- export endpoints

The system was also checked for runtime issues during local usage and UI refinement.

---

## 13. Future Scope

The project can be extended further with:

- SHAP-based prediction explanations
- multilingual UI
- SMS / WhatsApp alerts
- appointment scheduling
- doctor notes and follow-up management
- offline capture mode for rural clinics
- improved fairness dashboard
- dynamic charts for longitudinal risk tracking

---

## 14. Conclusion

CardioShield AI demonstrates how machine learning and modern web technologies can be combined to create a practical early cardiovascular risk screening platform. The project supports role-based workflows for patients, doctors, and administrators while keeping the system explainable, secure, and easy to use.

The platform is suitable for academic presentation because it includes:

- a real prediction workflow,
- secure role-based access,
- hospital-style patient ownership,
- dashboard-based interaction,
- and exportable results for clinical review.

---

## 15. Team Contribution

- **Backend, API, ML integration, fairness support:** Team Member 1
- **Frontend, UI/UX, deployment, documentation:** Team Member 2

---

## 16. References

- FastAPI Documentation
- React Documentation
- Tailwind CSS Documentation
- SQLAlchemy Documentation
- scikit-learn Documentation
- XGBoost Documentation
- LightGBM Documentation

---

## Appendix A. Important API Endpoints

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `POST /predict`
- `GET /history`
- `GET /history/export`
- `GET /doctor/patients`
- `POST /doctor/patients`
- `PATCH /doctor/patients/{patient_id}`
- `DELETE /doctor/patients/{patient_id}`
- `GET /admin/users`
- `PATCH /admin/users/{user_id}`
- `GET /admin/predictions`
- `GET /admin/fairness/report`
- `GET /health`

