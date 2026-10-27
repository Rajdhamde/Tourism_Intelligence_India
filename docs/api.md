# REST API Documentation: Tourism Intelligence India

Base URL: `/api/v1`

## 1. System Health
### `GET /health`
Returns system status, service name, version, and database connectivity.

**Response `200 OK`**:
```json
{
  "status": "healthy",
  "service": "Tourism Intelligence India",
  "version": "1.0.0",
  "database": "connected"
}
```

---

## 2. Destinations
### `GET /destinations`
Query destinations with filtering and pagination.

**Query Parameters**:
- `query` (string, optional): Full-text search on name, description, tags.
- `state` (string, optional): State filter (e.g. `Rajasthan`).
- `region` (string, optional): Region filter (`Himalayan`, `Northern`, `Western`, `Southern`, `Eastern`, `North-Eastern`).
- `category` (string, optional): Category filter.
- `budget_tier` (string, optional): Budget filter (`Budget`, `Moderate`, `Luxury`).
- `page` (int, default: 1): Page number.
- `page_size` (int, default: 12): Items per page.

### `GET /destinations/{destination_id}`
Retrieves complete factual details, coordinates, elevation, highlights, and verified visitor info.

### `GET /destinations/{destination_id}/nearby`
Calculates nearby attractions within geodesic radius (Haversine formula).
- `radius_km` (float, default: 450.0)
- `limit` (int, default: 5)

---

## 3. Recommendation Engine
### `POST /recommendations`
Calculates personalized multi-criteria recommendations for a user preference profile.

**Request Body**:
```json
{
  "nature_affinity": 0.85,
  "culture_affinity": 0.30,
  "adventure_affinity": 0.80,
  "relaxation_affinity": 0.30,
  "wildlife_affinity": 0.60,
  "budget_tier": "Moderate",
  "duration_days": 4.0,
  "target_month": "October",
  "top_k": 6
}
```

**Response `200 OK`**:
```json
{
  "predicted_tourist_cluster": 1,
  "cluster_label": "Adventure & Trekking Seekers",
  "target_travel_month": "October",
  "total_candidates_evaluated": 20,
  "recommendations": [
    {
      "destination_id": "dest_valley_of_flowers",
      "name": "Valley of Flowers National Park",
      "category": "Mountains & Trekking",
      "state": "Uttarakhand",
      "recommendation_score": 93.4,
      "component_scores": {
        "content_similarity": 95.2,
        "cluster_affinity": 90.0,
        "seasonality_match": 85.0,
        "popularity_signal": 88.0
      },
      "evidence_rationale": "Strong alignment with Adventure & Trekking Seekers preferences."
    }
  ]
}
```

---

## 4. Analytics
- `GET /analytics/overview`: Aggregate data warehouse KPIs.
- `GET /analytics/seasonality`: Monthly visit volume and average spend.
- `GET /analytics/clusters`: Segment percentages, average trip spend, and preferences.
- `GET /analytics/destinations`: Category popularity distribution.
- `GET /analytics/states`: Destination and visit volume per state.

---

## 5. Machine Learning & ETL
- `POST /ml/train`: Triggers K-Means training and hyperparameter search across $k \in [2, 7]$.
- `GET /ml/evaluation`: Returns Elbow curve inertia values and Silhouette scores.
- `POST /ml/predict-cluster`: Infers cluster label for arbitrary profile vector.
- `POST /etl/run`: Triggers ETL pipeline (Extract -> Validate -> Clean -> Load).
- `GET /etl/status`: Returns recent ETL execution audit logs.

---

## 6. AI Assistant
### `POST /assistant/chat`
Controlled agentic assistant with RAG tool execution and fallback.

**Request Body**:
```json
{
  "message": "Plan a 4-day trip to Rajasthan with heritage and palaces"
}
```
