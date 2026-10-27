# Import all models for Alembic/SQLAlchemy metadata registration
from backend.app.db.session import Base
from backend.app.models.destination import Destination
from backend.app.models.warehouse import (
    DimTourist,
    DimDate,
    DimTrip,
    DimGeography,
    FactTourismVisit,
    FactDestinationInteraction,
    ETLLog,
    MLModelMetadata
)

__all__ = [
    "Base",
    "Destination",
    "DimTourist",
    "DimDate",
    "DimTrip",
    "DimGeography",
    "FactTourismVisit",
    "FactDestinationInteraction",
    "ETLLog",
    "MLModelMetadata",
]
