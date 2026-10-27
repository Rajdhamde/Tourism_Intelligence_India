# Data Dictionary: Tourism Intelligence India Data Warehouse

## 1. Fact Tables

### 1.1 `fact_tourism_visits`
Represents recorded tourist visit occurrences, travel group sizes, duration, spend, and satisfaction ratings.

| Column | Data Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| `visit_id` | INTEGER | PRIMARY KEY | Unique surrogate identifier for the visit record. |
| `tourist_key` | INTEGER | FOREIGN KEY (`dim_tourists`) | Reference to visiting tourist profile. |
| `destination_key` | INTEGER | FOREIGN KEY (`dim_destinations`) | Reference to visited destination record. |
| `date_key` | INTEGER | FOREIGN KEY (`dim_dates`) | Integer date surrogate key (`YYYYMMDD`). |
| `trip_key` | INTEGER | FOREIGN KEY (`dim_trips`) | Reference to trip context template. |
| `visit_duration_days` | FLOAT | NOT NULL | Stay duration in days at this specific destination. |
| `estimated_spend_inr` | FLOAT | NOT NULL | Total expenditure incurred (INR). |
| `satisfaction_score` | FLOAT | NOT NULL | Post-visit satisfaction rating ($1.0 - 5.0$). |
| `travel_party_size` | INTEGER | NOT NULL | Number of travelers in the party. |
| `visit_count` | INTEGER | DEFAULT 1 | Additive measure for total visits aggregation. |
| `is_synthetic` | BOOLEAN | DEFAULT TRUE | Academic benchmark flag separating synthetic records from official statistics. |

### 1.2 `fact_destination_interactions`
Captures digital touchpoints and exploration telemetry across the 3D map and directory.

| Column | Data Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| `interaction_id` | INTEGER | PRIMARY KEY | Unique surrogate key. |
| `tourist_key` | INTEGER | NULLABLE FK | Linked tourist key (if authenticated/known). |
| `session_id` | VARCHAR(64) | INDEXED | Web session identifier for anonymous sessions. |
| `destination_key` | INTEGER | FOREIGN KEY (`dim_destinations`) | Target destination. |
| `date_key` | INTEGER | FOREIGN KEY (`dim_dates`) | Date of interaction. |
| `interaction_type` | VARCHAR(32) | NOT NULL | Action type: `view`, `click`, `search`, `save`, `3d_explore`. |
| `dwell_time_seconds` | FLOAT | DEFAULT 10.0 | Time spent inspecting the card or 3D terrain. |
| `source_channel` | VARCHAR(64) | NOT NULL | Channel: `web_3d_explorer`, `recommendation_card`, `directory_search`. |

---

## 2. Dimension Tables

### 2.1 `dim_destinations`
Stores spatial coordinates, terrain elevations, categories, ratings, and media links.

| Column | Data Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| `destination_key` | INTEGER | PRIMARY KEY | Surrogate dimension key. |
| `destination_id` | VARCHAR(64) | UNIQUE | Natural business key (e.g. `dest_taj_mahal`). |
| `name` | VARCHAR(128) | NOT NULL | Official name of destination. |
| `category` | VARCHAR(64) | NOT NULL | Canonical category. |
| `state` | VARCHAR(64) | NOT NULL | Indian state or Union Territory. |
| `region` | VARCHAR(64) | NOT NULL | Geographic zone (`Himalayan`, `Northern`, `Western`, `Southern`, `Eastern`, `North-Eastern`). |
| `latitude` | FLOAT | NOT NULL | WGS-84 decimal latitude. |
| `longitude` | FLOAT | NOT NULL | WGS-84 decimal longitude. |
| `elevation_m` | FLOAT | DEFAULT 0.0 | Terrain elevation above sea level in meters. |
| `rating` | FLOAT | DEFAULT 4.5 | Average visitor rating ($1.0 - 5.0$). |
| `popularity_score` | FLOAT | DEFAULT 80.0 | Composite popularity index ($0 - 100$). |
| `cover_image` | VARCHAR(512) | NOT NULL | Verified open media URL. |
| `image_attribution` | VARCHAR(256) | NOT NULL | License & attribution source. |

### 2.2 `dim_tourists`
Holds continuous feature preference signals utilized for unsupervised clustering and behavior mining.

| Column | Data Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| `tourist_key` | INTEGER | PRIMARY KEY | Surrogate tourist key. |
| `tourist_id` | VARCHAR(64) | UNIQUE | Pseudonymous tourist identifier. |
| `nature_affinity` | FLOAT | $[0.0, 1.0]$ | Preference weight for alpine & nature reserves. |
| `culture_affinity` | FLOAT | $[0.0, 1.0]$ | Preference weight for monuments & temples. |
| `adventure_affinity`| FLOAT | $[0.0, 1.0]$ | Preference weight for treks & action sports. |
| `relaxation_affinity`| FLOAT | $[0.0, 1.0]$ | Preference weight for beaches & tranquil retreats. |
| `assigned_cluster` | INTEGER | DEFAULT -1 | Cluster ID assigned by K-Means model. |
| `cluster_label` | VARCHAR(64) | NOT NULL | Data-driven segment label. |

### 2.3 `dim_dates`
Calendar dimension covering all dates between 2024 and 2026.

| Column | Data Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| `date_key` | INTEGER | PRIMARY KEY | Integer date representation (`20261027`). |
| `full_date` | VARCHAR(10) | UNIQUE | ISO date (`YYYY-MM-DD`). |
| `day` | INTEGER | $1 - 31$ | Day of the month. |
| `month` | INTEGER | $1 - 12$ | Month number. |
| `month_name` | VARCHAR(16) | NOT NULL | Month name in English. |
| `quarter` | INTEGER | $1 - 4$ | Calendar quarter. |
| `year` | INTEGER | NOT NULL | Calendar year. |
| `season` | VARCHAR(32) | NOT NULL | Season: `Winter`, `Summer`, `Monsoon`, `Post-Monsoon`. |
| `is_weekend` | BOOLEAN | NOT NULL | True if Saturday or Sunday. |
