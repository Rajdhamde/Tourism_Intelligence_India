# Architecture: Tourism Intelligence India

## 1. System Topology
**Tourism Intelligence India** is an enterprise data warehouse and intelligent exploration platform designed for tourist behaviour mining, spatial destination exploration, and personalized multi-criteria recommendation.

```
                      ┌────────────────────────────────────────┐
                      │          React 18 + Vite SPA           │
                      │  MapLibre GL 3D Map + Recharts + Icons  │
                      └──────────────────┬─────────────────────┘
                                         │ HTTPS / JSON API
                                         ▼
                      ┌────────────────────────────────────────┐
                      │            FastAPI Backend             │
                      │       Pydantic v2 + REST Routers       │
                      └─────┬────────────┬─────────────┬───────┘
                            │            │             │
        ┌───────────────────┘            │             └───────────────────┐
        ▼                                ▼                                 ▼
┌─────────────────┐             ┌─────────────────┐             ┌─────────────────┐
│   ETL Engine    │             │  ML Clustering  │             │   AI Assistant  │
│ Extract/Cleanse │             │  & Recommender  │             │ Controlled RAG  │
│  Validate/Load  │             │ K-Means & Cosine│             │ Tool Execution  │
└───────┬─────────┘             └────────┬────────┘             └────────┬────────┘
        │                                │                               │
        └────────────────────────┬───────┴───────────────────────────────┘
                                 ▼
                ┌──────────────────────────────────┐
                │   Star-Schema Data Warehouse     │
                │  PostgreSQL/PostGIS or SQLite3   │
                │ FactTourismVisit / Interactions  │
                │ DimTourist, Geography, Date, etc.│
                └──────────────────────────────────┘
```

## 2. Component Design

### 2.1 Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite.
- **Styling**: Vanilla Tailwind CSS with custom HSL/HEX design tokens tailored for dark-navy (`#080D1A`), deep-teal (`#0D9488`), emerald (`#10B981`), and warm ivory typography.
- **Geospatial Engine**: MapLibre GL JS supporting 3D camera pitch ($0^\circ$ to $60^\circ$), bearing rotation, and digital elevation model (DEM) terrain hillshading. Includes graceful topological fallback.
- **Analytics Visualization**: Recharts delivering responsive BarCharts, LineCharts, and PieCharts for monthly visit volume, spend trends, cluster shares, and ML elbow/silhouette curves.
- **Routing & Client State**: React Router DOM v6 with dynamic query param synchronization (`?focus=dest_id`).

### 2.2 Backend Architecture
- **Framework**: Python 3.12+ with FastAPI.
- **Schema Validation**: Pydantic v2 schemas for all requests, responses, and spatial filters.
- **ORM & Data Layer**: SQLAlchemy 2.0 with indexed surrogate keys and declarative star-schema models.
- **Spatial Geometry**: Great-circle Haversine formula implemented in pure Python/SQL for lightning-fast radius searches, compatible with SQLite3 and PostgreSQL/PostGIS.

### 2.3 Tourism Data Warehouse
- Follows Ralph Kimball's dimensional modeling star schema.
- Grain:
  - `FactTourismVisit`: One record per tourist trip per destination.
  - `FactDestinationInteraction`: One record per user action (view, click, 3D explore, save).
- Conformed Dimensions:
  - `DimTourist`: Pseudonymous profiles with continuous affinity signals ($[0.0, 1.0]$) and cluster IDs.
  - `DimDestination`: Verified geographical locations, elevations, categories, ratings, and media.
  - `DimDate`: Calendar dimension with quarters, seasons, months, and weekend flags.
  - `DimTrip`: Trip purpose, party structure, transport, and budget band.
  - `DimGeography`: State, region zone, capital, and primary language.

### 2.4 Machine Learning Pipelines
- Unsupervised K-Means clustering with Elbow curve and Silhouette score evaluations across $k \in [2, 7]$.
- Multi-criteria hybrid recommendation combining:
  1. Content cosine similarity ($40\%$)
  2. Cluster tourist affinity ($25\%$)
  3. Seasonality match ($15\%$)
  4. Log-damped popularity signals ($20\%$)
- Controlled Agentic AI travel assistant executing backend tools with RAG knowledge grounding and non-LLM safety fallbacks.
