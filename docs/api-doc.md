# CardioShield AI API Documentation

Base URL: `http://127.0.0.1:8000`

## Auth

### `POST /auth/register`
Request JSON:
```json
{
  "name": "Asha Verma",
  "email": "asha@example.com",
  "password": "StrongPass123",
  "role": "patient"
}
```

Response:
```json
{
  "message": "Registration successful",
  "user_id": 1,
  "role": "patient",
  "account_status": "active"
}
```

### `POST /auth/login`
Accepts JSON or form payload.

Response:
```json
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "name": "Asha Verma",
    "email": "asha@example.com",
    "role": "patient",
    "is_active": true
  }
}
```

### `GET /auth/me`
Returns authenticated user profile.

## Prediction

### `POST /predict`
Auth required.

Request fields:
- `age` (days)
- `gender` (1/2)
- `height` (cm)
- `weight` (kg)
- `ap_hi` / `ap_lo`
- `cholesterol` (1/2/3)
- `gluc` (1/2/3)
- `smoke`, `alco`, `active` (0/1)

Response:
```json
{
  "risk_probability": 0.62,
  "risk_category": "Moderate",
  "confidence_interval": { "low": 0.54, "high": 0.70 },
  "cardio_flag": 1,
  "top_risk_factors": [
    "Elevated systolic blood pressure",
    "High glucose",
    "High BMI"
  ],
  "explanation_text": "Elevated systolic blood pressure, High glucose, High BMI contributed most to the predicted risk.",
  "recommendation": "Moderate risk identified. Recommend lifestyle modification and scheduled clinical review.",
  "escalation_required": false,
  "disclaimer": "Risk estimation tool — not diagnostic."
}
```

### `GET /history`
- Patient: own predictions.
- Admin: supports filters `patient_id`, `risk_category`, `start_date`, `end_date`.
- Additional filters: `escalation_required`, `min_probability`.
- Main text search: `q`

### `GET /history/export?format=csv|json|txt`
Exports scoped history in downloadable format.

### `GET /predictions/{prediction_id}/export?format=csv|json|txt`
Exports a single prediction report.

## Admin

### `GET /admin/users`
Admin only. Returns all users.

### `GET /admin/users/export?format=csv|json|txt`
Exports user table.

### `PATCH /admin/users/{user_id}`
Admin only.
```json
{
  "role": "patient",
  "is_active": true
}
```

### `GET /admin/predictions`
Admin only. Supports same filters as `/history`.
- Additional filters: `user_email`.
- Main text search: `q`

### `GET /admin/predictions/export?format=csv|json|txt`
Exports prediction table.

### `GET /admin/fairness/report`
Admin only. Returns latest fairness snapshot.

### `GET /admin/fairness/report/export?format=csv|json|txt`
Exports latest fairness report.

## Health

### `GET /health`
Returns service status and artifact readiness flags.
