from pydantic import BaseModel

class MaintenanceEvent(BaseModel):
    asset_id: str
    reason: str
    priority: str
    scheduled_date: str
    source: str  # RULE | AI
