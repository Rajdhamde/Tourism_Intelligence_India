import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.session import haversine_distance_km

client = TestClient(app)

def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "Tourism Intelligence India" in data["service"]

def test_list_destinations_pagination():
    response = client.get("/api/v1/destinations?page=1&page_size=5")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) <= 5
    assert data["total"] >= 20
    assert data["page"] == 1

def test_search_destinations_filter():
    response = client.get("/api/v1/destinations?query=Taj")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    found = any("Taj Mahal" in item["name"] for item in data["items"])
    assert found

def test_filter_by_state():
    response = client.get("/api/v1/destinations?state=Kerala")
    assert response.status_code == 200
    data = response.json()
    assert all(item["state"] == "Kerala" for item in data["items"])

def test_get_destination_detail_valid():
    response = client.get("/api/v1/destinations/dest_taj_mahal")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Taj Mahal"
    assert data["state"] == "Uttar Pradesh"
    assert "Ivory marble architecture" in data["highlights"]
    assert data["latitude"] > 0
    assert data["longitude"] > 0

def test_get_destination_detail_invalid():
    response = client.get("/api/v1/destinations/non_existent_dest_9999")
    assert response.status_code == 404

def test_spatial_nearby_calculation():
    # Test Haversine function directly: Delhi to Agra ~180-210 km
    delhi_lat, delhi_lon = 28.5244, 77.1855
    agra_lat, agra_lon = 27.1751, 78.0421
    dist = haversine_distance_km(delhi_lat, delhi_lon, agra_lat, agra_lon)
    assert 160 < dist < 210

    # Test API endpoint
    response = client.get("/api/v1/destinations/dest_taj_mahal/nearby?radius_km=300")
    assert response.status_code == 200
    nearby = response.json()
    assert isinstance(nearby, list)
    for place in nearby:
        assert place["distance_km"] <= 300

def test_recommendation_ranking():
    payload = {
        "nature_affinity": 0.9,
        "culture_affinity": 0.2,
        "adventure_affinity": 0.9,
        "relaxation_affinity": 0.3,
        "wildlife_affinity": 0.5,
        "budget_tier": "Moderate",
        "duration_days": 4.0,
        "top_k": 4
    }
    response = client.post("/api/v1/recommendations", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "recommendations" in data
    assert len(data["recommendations"]) == 4
    assert data["recommendations"][0]["recommendation_score"] >= data["recommendations"][-1]["recommendation_score"]
    assert "predicted_tourist_cluster" in data

def test_analytics_overview():
    response = client.get("/api/v1/analytics/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["total_destinations"] >= 20
    assert data["total_tracked_visits"] > 1000
    assert data["total_tourist_profiles"] >= 250
    assert data["avg_tourist_satisfaction"] > 0

def test_analytics_seasonality():
    response = client.get("/api/v1/analytics/seasonality")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 12
    assert any(item["season"] == "Winter" for item in data)

def test_ml_model_evaluation():
    response = client.get("/api/v1/ml/evaluation")
    assert response.status_code == 200
    data = response.json()
    assert "silhouette_score" in data
    assert "elbow_curve" in data
    assert len(data["elbow_curve"]) > 0

def test_ml_predict_cluster():
    payload = {
        "nature_affinity": 0.95,
        "culture_affinity": 0.1,
        "adventure_affinity": 0.9,
        "relaxation_affinity": 0.2,
        "wildlife_affinity": 0.8,
        "heritage_affinity": 0.1,
        "budget_tier": "moderate",
        "duration_days": 5.0
    }
    response = client.post("/api/v1/ml/predict-cluster", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "predicted_cluster" in data
    assert "cluster_label" in data

def test_assistant_chat():
    payload = {"message": "Tell me about Taj Mahal and what is nearby"}
    response = client.post("/api/v1/assistant/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "Taj Mahal" in data["response"]
    assert len(data["tool_calls"]) > 0
