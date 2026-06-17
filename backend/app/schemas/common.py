from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

class BaseResponse(BaseModel):
    id: UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None