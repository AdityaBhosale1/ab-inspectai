from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role: Optional[str] = "Inspector"

class UserResponse(UserBase):
    id: int
    profile_pic: Optional[str] = None
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

# Defect Schemas
class DefectBase(BaseModel):
    defect_type: str
    severity: str
    part_affected: str
    confidence: float
    bbox: str
    cost_est_min: float
    cost_est_max: float

class DefectCreate(DefectBase):
    pass

class DefectResponse(DefectBase):
    id: int
    report_id: int

    class Config:
        from_attributes = True

# Report Schemas
class ReportBase(BaseModel):
    vehicle_name: str
    license_plate: Optional[str] = None

class ReportCreate(ReportBase):
    original_image: str
    annotated_image: str
    overall_severity: str
    total_cost: float
    summary: str
    health_score: int
    vehicle_make: Optional[str] = "Tesla"
    vehicle_model: Optional[str] = "Model Y"
    vehicle_age: Optional[int] = 2
    battery_health: Optional[int] = 96
    tire_condition: Optional[str] = "Good"
    maintenance_history: Optional[str] = "Excellent"
    obd_status: Optional[str] = "No Faults"
    latitude: Optional[float] = 37.7749
    longitude: Optional[float] = -122.4194
    gps_address: Optional[str] = "37.7749 N, 122.4194 W"

class ReportResponse(ReportBase):
    id: int
    user_id: Optional[int] = None
    original_image: str
    annotated_image: str
    overall_severity: str
    total_cost: float
    summary: Optional[str] = None
    health_score: int
    vehicle_make: Optional[str] = "Tesla"
    vehicle_model: Optional[str] = "Model Y"
    vehicle_age: Optional[int] = 2
    battery_health: Optional[int] = 96
    tire_condition: Optional[str] = "Good"
    maintenance_history: Optional[str] = "Excellent"
    obd_status: Optional[str] = "No Faults"
    latitude: Optional[float] = 37.7749
    longitude: Optional[float] = -122.4194
    gps_address: Optional[str] = "37.7749 N, 122.4194 W"
    created_at: datetime
    defects: List[DefectResponse] = []

    class Config:
        from_attributes = True

# Dashboard Stats Response
class StatCard(BaseModel):
    value: float or int
    change: float  # percentage change or simple representation
    label: str

class DashboardStats(BaseModel):
    total_inspections: int
    total_defects: int
    total_estimated_cost: float
    severity_distribution: dict  # {"Low": x, "Medium": y, "High": z}
    defect_distribution: dict    # {"Scratch": a, "Dent": b, ...}
    monthly_trend: List[dict]     # [{"month": "Jan", "inspections": 10, "cost": 2500}]
    recent_reports: List[ReportResponse]
