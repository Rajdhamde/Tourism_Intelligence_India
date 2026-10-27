import json
import math
import random
import os
from pathlib import Path
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from backend.app.core.config import settings
from backend.app.models.warehouse import DimTourist, MLModelMetadata

FEATURE_NAMES = [
    "nature_affinity",
    "culture_affinity",
    "adventure_affinity",
    "relaxation_affinity",
    "wildlife_affinity",
    "heritage_affinity",
    "budget_normalized",
    "duration_normalized"
]

BUDGET_TIER_MAP = {
    "budget": 0.2,
    "low": 0.2,
    "moderate": 0.5,
    "mid": 0.5,
    "luxury": 0.9,
    "premium": 0.9
}


def euclidean_distance(v1: List[float], v2: List[float]) -> float:
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(v1, v2)))


class StandardScaler:
    def __init__(self):
        self.means: List[float] = []
        self.stds: List[float] = []

    def fit_transform(self, X: List[List[float]]) -> List[List[float]]:
        if not X:
            return []
        n_samples = len(X)
        n_features = len(X[0])

        self.means = [0.0] * n_features
        for row in X:
            for j in range(n_features):
                self.means[j] += row[j]
        self.means = [m / n_samples for m in self.means]

        self.stds = [0.0] * n_features
        for row in X:
            for j in range(n_features):
                self.stds[j] += (row[j] - self.means[j]) ** 2
        self.stds = [math.sqrt(s / n_samples) if s > 1e-9 else 1.0 for s in self.stds]

        return self.transform(X)

    def transform(self, X: List[List[float]]) -> List[List[float]]:
        transformed = []
        for row in X:
            transformed_row = [
                (row[j] - self.means[j]) / (self.stds[j] if self.stds[j] > 1e-9 else 1.0)
                for j in range(len(row))
            ]
            transformed.append(transformed_row)
        return transformed

    def to_dict(self) -> Dict[str, Any]:
        return {"means": self.means, "stds": self.stds}

    def from_dict(self, data: Dict[str, Any]):
        self.means = data.get("means", [])
        self.stds = data.get("stds", [])


class PureKMeans:
    def __init__(self, n_clusters: int = 5, max_iter: int = 100, random_state: int = 42):
        self.n_clusters = n_clusters
        self.max_iter = max_iter
        self.random_state = random_state
        self.centroids: List[List[float]] = []
        self.labels_: List[int] = []
        self.inertia_: float = 0.0

    def fit(self, X: List[List[float]]):
        if not X:
            return self

        random.seed(self.random_state)
        n_samples = len(X)
        n_features = len(X[0])
        k = min(self.n_clusters, n_samples)

        # K-Means++ initialization
        centroids = [X[random.randint(0, n_samples - 1)]]
        while len(centroids) < k:
            distances = []
            for point in X:
                min_d = min(euclidean_distance(point, c) ** 2 for c in centroids)
                distances.append(min_d)
            total_dist = sum(distances)
            if total_dist == 0:
                centroids.append(random.choice(X))
                continue
            probs = [d / total_dist for d in distances]
            cum_probs = []
            cum = 0.0
            for p in probs:
                cum += p
                cum_probs.append(cum)
            r = random.random()
            for idx, cp in enumerate(cum_probs):
                if r <= cp:
                    centroids.append(X[idx])
                    break
            if len(centroids) < len(cum_probs) and len(centroids) == len(centroids[:-1]):
                centroids.append(random.choice(X))

        self.centroids = [list(c) for c in centroids]

        # Iterations
        for _ in range(self.max_iter):
            # Assignment
            clusters = [[] for _ in range(k)]
            labels = []
            for pt in X:
                dists = [euclidean_distance(pt, c) for c in self.centroids]
                best_c = dists.index(min(dists))
                labels.append(best_c)
                clusters[best_c].append(pt)

            # Update centroids
            new_centroids = []
            for c_idx in range(k):
                pts = clusters[c_idx]
                if not pts:
                    new_centroids.append(self.centroids[c_idx])
                else:
                    mean_pt = [sum(p[j] for p in pts) / len(pts) for j in range(n_features)]
                    new_centroids.append(mean_pt)

            # Check convergence
            shifts = [euclidean_distance(c1, c2) for c1, c2 in zip(self.centroids, new_centroids)]
            self.centroids = new_centroids
            if max(shifts) < 1e-4:
                break

        # Final assignments and inertia
        self.labels_ = []
        self.inertia_ = 0.0
        for pt in X:
            dists = [euclidean_distance(pt, c) for c in self.centroids]
            best_c = dists.index(min(dists))
            self.labels_.append(best_c)
            self.inertia_ += dists[best_c] ** 2

        return self

    def predict(self, X: List[List[float]]) -> List[int]:
        preds = []
        for pt in X:
            dists = [euclidean_distance(pt, c) for c in self.centroids]
            preds.append(dists.index(min(dists)))
        return preds


def compute_silhouette_score(X: List[List[float]], labels: List[int]) -> float:
    """
    Computes mean silhouette score across all samples:
    s(i) = (b(i) - a(i)) / max(a(i), b(i))
    """
    n_samples = len(X)
    if n_samples <= 1:
        return 0.0

    unique_labels = list(set(labels))
    if len(unique_labels) <= 1:
        return 0.0

    cluster_points = {label: [] for label in unique_labels}
    for idx, (pt, label) in enumerate(zip(X, labels)):
        cluster_points[label].append(idx)

    # Subsample if dataset is large to compute quickly
    sample_indices = list(range(n_samples))
    if n_samples > 300:
        random.seed(42)
        sample_indices = random.sample(sample_indices, 300)

    scores = []
    for i in sample_indices:
        pt = X[i]
        label = labels[i]
        same_cluster_indices = [idx for idx in cluster_points[label] if idx != i]

        if not same_cluster_indices:
            scores.append(0.0)
            continue

        # a(i): mean intra-cluster distance
        a_i = sum(euclidean_distance(pt, X[j]) for j in same_cluster_indices) / len(same_cluster_indices)

        # b(i): mean nearest other cluster distance
        b_i = float("inf")
        for other_label in unique_labels:
            if other_label == label:
                continue
            other_indices = cluster_points[other_label]
            if not other_indices:
                continue
            dist_to_other = sum(euclidean_distance(pt, X[j]) for j in other_indices) / len(other_indices)
            if dist_to_other < b_i:
                b_i = dist_to_other

        if b_i == float("inf"):
            scores.append(0.0)
        else:
            denom = max(a_i, b_i)
            s_i = (b_i - a_i) / denom if denom > 1e-9 else 0.0
            scores.append(s_i)

    return round(sum(scores) / len(scores), 4) if scores else 0.0


class TouristBehaviourMiner:
    def __init__(self, db: Session):
        self.db = db
        self.scaler = StandardScaler()
        self.model: PureKMeans = PureKMeans(n_clusters=5)
        self.model_path = Path(settings.MODELS_DIR) / "kmeans_model.json"
        self.cluster_labels: Dict[int, str] = {}
        self.cluster_summaries: List[Dict[str, Any]] = []
        self.evaluation_results: Dict[str, Any] = {}

    def extract_features(self, tourists: List[DimTourist]) -> Tuple[List[List[float]], List[DimTourist]]:
        X = []
        valid_tourists = []
        for t in tourists:
            budget_val = BUDGET_TIER_MAP.get(str(t.preferred_budget_tier).lower(), 0.5)
            # Duration normalized by max typical duration 10 days
            duration_val = min(1.0, max(0.1, (t.trip_duration_preference_days or 3.0) / 10.0))

            row = [
                float(t.nature_affinity or 0.5),
                float(t.culture_affinity or 0.5),
                float(t.adventure_affinity or 0.5),
                float(t.relaxation_affinity or 0.5),
                float(t.wildlife_affinity or 0.5),
                float(t.heritage_affinity or 0.5),
                budget_val,
                duration_val
            ]
            X.append(row)
            valid_tourists.append(t)
        return X, valid_tourists

    def train_and_evaluate(self, k_range: List[int] = None) -> Dict[str, Any]:
        """
        Trains K-Means model, evaluates multiple cluster counts via Elbow and Silhouette scores,
        assigns empirical cluster labels, persists model artifact, and updates DimTourist records.
        """
        if k_range is None:
            k_range = [2, 3, 4, 5, 6, 7]

        tourists = self.db.query(DimTourist).all()
        if not tourists:
            raise ValueError("No tourists found in DimTourist. Run ETL pipeline first.")

        X_raw, valid_tourists = self.extract_features(tourists)
        X_scaled = self.scaler.fit_transform(X_raw)

        # 1. Elbow & Silhouette Evaluation across k_range
        elbow_curve = []
        best_k = 5
        best_silhouette = -1.0

        for k in k_range:
            km = PureKMeans(n_clusters=k, random_state=42)
            km.fit(X_scaled)
            sil = compute_silhouette_score(X_scaled, km.labels_)
            elbow_curve.append({
                "k": k,
                "inertia": round(km.inertia_, 2),
                "silhouette_score": sil
            })
            if sil > best_silhouette:
                best_silhouette = sil
                best_k = k

        # Choose k=5 or best_k
        chosen_k = 5 if 5 in k_range else best_k
        self.model = PureKMeans(n_clusters=chosen_k, random_state=42)
        self.model.fit(X_scaled)
        final_silhouette = compute_silhouette_score(X_scaled, self.model.labels_)

        # 2. Derive Empirical Labels from Centroid Features
        self.cluster_labels = self._generate_cluster_labels(self.model.centroids, self.scaler)
        
        # 3. Compute Cluster Summaries
        self.cluster_summaries = self._compute_cluster_summaries(valid_tourists, self.model.labels_)

        # 4. Update DimTourist records with assigned cluster and empirical label
        for t, label_id in zip(valid_tourists, self.model.labels_):
            t.assigned_cluster = label_id
            t.cluster_label = self.cluster_labels.get(label_id, f"Segment {label_id}")
        self.db.commit()

        # 5. Persist Model and Evaluation Results
        self.evaluation_results = {
            "algorithm": "KMeans",
            "n_clusters": chosen_k,
            "silhouette_score": final_silhouette,
            "inertia": round(self.model.inertia_, 2),
            "elbow_curve": elbow_curve,
            "features": FEATURE_NAMES,
            "cluster_labels": self.cluster_labels,
            "cluster_summaries": self.cluster_summaries,
            "total_profiles_analyzed": len(valid_tourists)
        }

        self._save_model()

        # Record in MLModelMetadata table
        meta = MLModelMetadata(
            model_name="tourist_segmentation_kmeans",
            algorithm="KMeans",
            n_clusters=chosen_k,
            silhouette_score=final_silhouette,
            inertia=self.model.inertia_,
            metrics_json=json.dumps(self.evaluation_results),
            cluster_definitions_json=json.dumps(self.cluster_summaries)
        )
        self.db.add(meta)
        self.db.commit()

        return self.evaluation_results

    def _generate_cluster_labels(self, centroids: List[List[float]], scaler: StandardScaler) -> Dict[int, str]:
        """
        Examines unscaled centroid coordinates to assign meaningful, empirical labels
        (e.g., Nature & Wildlife Explorers, Heritage & Cultural Travellers, etc.)
        """
        labels = {}
        for c_idx, c in enumerate(centroids):
            # Unscale centroid back to raw feature space
            unscaled = [
                c[j] * scaler.stds[j] + scaler.means[j] if j < len(scaler.means) else c[j]
                for j in range(len(c))
            ]
            nat = unscaled[0]
            cul = unscaled[1]
            adv = unscaled[2]
            rel = unscaled[3]
            wild = unscaled[4]
            budg = unscaled[6]

            # Highest dominant characteristic
            scores = {
                "Himalayan & Nature Explorers": nat * 1.2 + adv * 0.8,
                "Culture & Heritage Travellers": cul * 1.3,
                "Adventure & Trekking Seekers": adv * 1.3 + nat * 0.7,
                "Coastal & Relaxation Vacationers": rel * 1.4,
                "Budget Urban & Street Explorers": (1.0 - budg) * 1.2 + cul * 0.6
            }
            # Pick best match not yet assigned, or highest
            sorted_labels = sorted(scores.items(), key=lambda x: x[1], reverse=True)
            chosen_name = None
            for name, _ in sorted_labels:
                if name not in labels.values():
                    chosen_name = name
                    break
            if not chosen_name:
                chosen_name = sorted_labels[0][0] + f" ({c_idx + 1})"
            labels[c_idx] = chosen_name

        return labels

    def _compute_cluster_summaries(self, tourists: List[DimTourist], labels: List[int]) -> List[Dict[str, Any]]:
        clusters = {}
        for t, l in zip(tourists, labels):
            clusters.setdefault(l, []).append(t)

        summaries = []
        for l, t_list in clusters.items():
            n = len(t_list)
            avg_nature = sum(t.nature_affinity or 0.5 for t in t_list) / n
            avg_culture = sum(t.culture_affinity or 0.5 for t in t_list) / n
            avg_adventure = sum(t.adventure_affinity or 0.5 for t in t_list) / n
            avg_relaxation = sum(t.relaxation_affinity or 0.5 for t in t_list) / n
            avg_spend = sum(t.avg_spend_per_trip or 10000.0 for t in t_list) / n
            avg_duration = sum(t.trip_duration_preference_days or 3.0 for t in t_list) / n

            # Primary category preferences
            pref_cats = []
            if avg_nature > 0.6:
                pref_cats.append("Mountains & Trekking")
                pref_cats.append("National Parks & Wildlife")
            if avg_culture > 0.6:
                pref_cats.append("Heritage & Monuments")
                pref_cats.append("Temples & Cultural Attractions")
            if avg_relaxation > 0.6:
                pref_cats.append("Beaches & Islands")
                pref_cats.append("Hill Stations")
            if not pref_cats:
                pref_cats.append("Cities & Urban Attractions")

            summaries.append({
                "cluster_id": l,
                "cluster_label": self.cluster_labels.get(l, f"Segment {l}"),
                "member_count": n,
                "member_percentage": round((n / len(tourists)) * 100, 1),
                "avg_spend_inr": round(avg_spend, 2),
                "avg_duration_days": round(avg_duration, 1),
                "feature_profile": {
                    "nature": round(avg_nature, 2),
                    "culture": round(avg_culture, 2),
                    "adventure": round(avg_adventure, 2),
                    "relaxation": round(avg_relaxation, 2)
                },
                "preferred_categories": list(set(pref_cats)),
                "description": f"Characterized by high affinity for {self.cluster_labels.get(l, 'travel')} with average trip spend of ₹{int(avg_spend):,}."
            })

        return sorted(summaries, key=lambda x: x["cluster_id"])

    def _save_model(self):
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        data = {
            "scaler": self.scaler.to_dict(),
            "centroids": self.model.centroids,
            "n_clusters": self.model.n_clusters,
            "cluster_labels": self.cluster_labels,
            "cluster_summaries": self.cluster_summaries,
            "evaluation_results": self.evaluation_results
        }
        with open(self.model_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def load_model(self) -> bool:
        if not self.model_path.exists():
            return False
        with open(self.model_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.scaler.from_dict(data.get("scaler", {}))
        self.model.centroids = data.get("centroids", [])
        self.model.n_clusters = data.get("n_clusters", 5)
        self.cluster_labels = {int(k): v for k, v in data.get("cluster_labels", {}).items()}
        self.cluster_summaries = data.get("cluster_summaries", [])
        self.evaluation_results = data.get("evaluation_results", {})
        return True

    def predict_tourist_cluster(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predicts cluster assignment for a new user questionnaire or profile input.
        """
        if not self.model.centroids:
            if not self.load_model():
                self.train_and_evaluate()

        budget_val = BUDGET_TIER_MAP.get(str(profile.get("budget_tier", "moderate")).lower(), 0.5)
        duration_val = min(1.0, max(0.1, float(profile.get("duration_days", 3.0)) / 10.0))

        features = [
            float(profile.get("nature_affinity", 0.5)),
            float(profile.get("culture_affinity", 0.5)),
            float(profile.get("adventure_affinity", 0.5)),
            float(profile.get("relaxation_affinity", 0.5)),
            float(profile.get("wildlife_affinity", 0.5)),
            float(profile.get("heritage_affinity", 0.5)),
            budget_val,
            duration_val
        ]

        scaled_features = self.scaler.transform([features])[0]
        cluster_id = self.model.predict([scaled_features])[0]
        cluster_label = self.cluster_labels.get(cluster_id, f"Segment {cluster_id}")

        summary = next((s for s in self.cluster_summaries if s["cluster_id"] == cluster_id), None)

        return {
            "predicted_cluster": cluster_id,
            "cluster_label": cluster_label,
            "cluster_summary": summary,
            "input_features": dict(zip(FEATURE_NAMES, features))
        }
