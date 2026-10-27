import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.destination import Destination
from backend.app.models.warehouse import FactDestinationInteraction

router = APIRouter()

class InteractionCreate(BaseModel):
    destination_id: str
    interaction_type: str = "view"  # view, click, search, save, 3d_explore
    session_id: Optional[str] = None
    tourist_id: Optional[str] = None
    dwell_time_seconds: float = 10.0
    source_channel: str = "web_3d_explorer"

@router.post("")
def record_interaction(interaction: InteractionCreate, db: Session = Depends(get_db)):
    """
    Records a tourist interaction (view, click, 3D explore, save) in the FactDestinationInteraction warehouse table.
    """
    dest = db.query(Destination).filter(Destination.destination_id == interaction.destination_id).first()
    if not dest:
        raise HTTPException(status_code=404, detail="Destination not found.")

    sess_id = interaction.session_id or f"anon_{uuid.uuid4().hex[:10]}"
    date_key = int(datetime.utcnow().strftime("%Y%m%d"))

    inter = FactDestinationInteraction(
        session_id=sess_id,
        destination_key=dest.destination_key,
        date_key=date_key,
        interaction_type=interaction.interaction_type,
        dwell_time_seconds=interaction.dwell_time_seconds,
        source_channel=interaction.source_channel
    )
    db.add(inter)
    db.commit()

    return {
        "status": "RECORDED",
        "interaction_id": inter.interaction_id,
        "destination_id": dest.destination_id,
        "interaction_type": inter.interaction_type
    }
