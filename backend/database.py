import os
import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./database.db")

# Handle SQLite specific threading requirements
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    profile_pic = Column(String(255), nullable=True)
    role = Column(String(50), nullable=False, default="Inspector")  # Admin, Inspector, Manager
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    reports = relationship("InspectionReport", back_populates="user", cascade="all, delete-orphan")

class InspectionReport(Base):
    __tablename__ = "inspection_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    vehicle_name = Column(String(100), nullable=False, default="Unknown Vehicle")
    license_plate = Column(String(50), nullable=True)
    original_image = Column(String(255), nullable=False)
    annotated_image = Column(String(255), nullable=False)
    overall_severity = Column(String(20), nullable=False)  # Low, Medium, High
    total_cost = Column(Float, nullable=False, default=0.0)
    summary = Column(Text, nullable=True)
    health_score = Column(Integer, nullable=False, default=100)  # 0 to 100
    vehicle_make = Column(String(50), nullable=True, default="Tesla")
    vehicle_model = Column(String(50), nullable=True, default="Model Y")
    vehicle_age = Column(Integer, nullable=True, default=2)
    battery_health = Column(Integer, nullable=True, default=96)
    tire_condition = Column(String(20), nullable=True, default="Good")
    maintenance_history = Column(String(20), nullable=True, default="Excellent")
    obd_status = Column(String(50), nullable=True, default="No Faults")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    gps_address = Column(String(100), nullable=True, default="37.7749 N, 122.4194 W")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="reports")
    defects = relationship("DetectedDefect", back_populates="report", cascade="all, delete-orphan")

class DetectedDefect(Base):
    __tablename__ = "detected_defects"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("inspection_reports.id", ondelete="CASCADE"), nullable=False)
    defect_type = Column(String(50), nullable=False)  # Scratch, Dent, Rust, Paint Damage, Windshield Crack, Broken Headlight, Bumper Damage, Tire Damage
    severity = Column(String(20), nullable=False)     # Low, Medium, High
    part_affected = Column(String(50), nullable=False) # Hood, Door, Windshield, Fender, Bumper, Tire, Light
    confidence = Column(Float, nullable=False)
    bbox = Column(String(100), nullable=False)         # JSON-string of [x_min, y_min, x_max, y_max] or similar
    cost_est_min = Column(Float, nullable=False)
    cost_est_max = Column(Float, nullable=False)

    report = relationship("InspectionReport", back_populates="defects")

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
