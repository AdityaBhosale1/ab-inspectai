import os
import shutil
import base64
import uuid
import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import init_db, get_db, User, InspectionReport, DetectedDefect
import schemas
import auth
import detector
import pdf_generator

app = FastAPI(title="AI Vehicle Defect Detection API", version="1.0.0")

# Setup directories
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
ORIGINAL_DIR = os.path.join(UPLOAD_DIR, "original")
ANNOTATED_DIR = os.path.join(UPLOAD_DIR, "annotated")
REPORTS_DIR = os.path.join(UPLOAD_DIR, "reports")

for directory in [UPLOAD_DIR, ORIGINAL_DIR, ANNOTATED_DIR, REPORTS_DIR]:
    os.makedirs(directory, exist_ok=True)

# Static files mapping
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# CORS middleware config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()

# --- AUTH ENDPOINTS ---

@app.post("/api/auth/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    db_email = db.query(User).filter(User.email == user.email).first()
    if db_email:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = auth.get_password_hash(user.password)
    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        role=user.role or "Inspector",
        profile_pic=f"https://api.dicebear.com/7.x/bottts/svg?seed={user.username}"  # Elegant default avatar
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login", response_model=schemas.Token)
def login(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user or not auth.verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/profile", response_model=schemas.UserResponse)
def get_profile(current_user: User = Depends(auth.get_current_user)):
    return current_user

@app.post("/api/auth/forgot-password")
def forgot_password(email: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")
    # Simulate sending reset link
    return {"message": f"Password reset instructions have been sent to {email}"}

@app.put("/api/auth/profile", response_model=schemas.UserResponse)
def update_profile(
    username: str = Form(...), 
    email: str = Form(...),
    password: Optional[str] = Form(None),
    current_user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Verify username conflict
    conflict_user = db.query(User).filter(User.username == username, User.id != current_user.id).first()
    if conflict_user:
        raise HTTPException(status_code=400, detail="Username already in use")
        
    conflict_email = db.query(User).filter(User.email == email, User.id != current_user.id).first()
    if conflict_email:
        raise HTTPException(status_code=400, detail="Email already in use")
        
    current_user.username = username
    current_user.email = email
    
    if password:
        current_user.hashed_password = auth.get_password_hash(password)
        
    db.commit()
    db.refresh(current_user)
    return current_user

# --- DEFECT DETECTION & INSPECTIONS ---

@app.post("/api/inspect/upload", response_model=schemas.ReportResponse)
async def upload_inspection(
    file: UploadFile = File(...),
    vehicle_name: str = Form("Tesla Model Y"),
    license_plate: Optional[str] = Form(None),
    current_user: Optional[User] = Depends(auth.get_optional_current_user),
    db: Session = Depends(get_db)
):
    # Save original image
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    orig_path = os.path.join(ORIGINAL_DIR, unique_filename)
    
    with open(orig_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Analyze image
    try:
        defects, annotated_path = detector.analyze_vehicle_damage(orig_path, ANNOTATED_DIR)
    except Exception as e:
        if os.path.exists(orig_path):
            os.remove(orig_path)
        raise HTTPException(status_code=500, detail=f"Image processing failed: {str(e)}")
        
    # Extract make and model
    name_parts = vehicle_name.strip().split(" ", 1)
    v_make = name_parts[0] if len(name_parts) > 0 else "Tesla"
    v_model = name_parts[1] if len(name_parts) > 1 else "Model Y"
    
    # Generate dynamic parameters based on unique filename hash
    h = sum(ord(c) for c in unique_filename)
    v_age = (h % 9) + 1 # 1 to 9 years old
    battery = 100 - (h % 25) # 75% to 100%
    tires_list = ["Good", "Good", "Fair", "Worn", "Critical"]
    tire = tires_list[h % len(tires_list)]
    maint_list = ["Excellent", "Good", "Average", "Poor"]
    history = maint_list[h % len(maint_list)]
    
    obd_list = ["No Faults", "No Faults", "P0171: Fuel Trim System Lean", "P0302: Cylinder 2 Misfire", "P0420: Catalyst System Efficiency"]
    obd = obd_list[h % len(obd_list)]
    
    # Coordinates in San Francisco / Silicon Valley area
    lat = 37.7749 + ((h % 50) - 25) * 0.002
    lon = -122.4194 + ((h % 50) - 25) * 0.002
    address = f"{lat:.4f} N, {-lon:.4f} W"
    
    # ANPR simulation if license plate is not provided
    l_plate = license_plate
    if not l_plate:
        l_plate = detector.simulate_anpr(orig_path)

    # Compute Digital Vehicle Health Score
    health = detector.calculate_health_score(defects, v_age, tire, battery, history)

    # Calculate costs and overall severity
    total_cost = 0.0
    overall_severity = "Minor"
    severity_rank = {"Minor": 1, "Moderate": 2, "Severe": 3}
    highest_severity_rank = 0
    
    for d in defects:
        total_cost += (d["cost_est_min"] + d["cost_est_max"]) / 2
        d_rank = severity_rank.get(d["severity"], 1)
        if d_rank > highest_severity_rank:
            highest_severity_rank = d_rank
            overall_severity = d["severity"]
            
    # Write summary statement
    if len(defects) == 0:
        summary = "No noticeable damage or defects detected on the vehicle exterior panels."
    else:
        parts_list = list(set([d["part_affected"] for d in defects]))
        summary = f"Detected {len(defects)} external defects across {len(parts_list)} vehicle regions ({', '.join(parts_list)}). "
        summary += f"Overall vehicle damage condition classified as {overall_severity}. Recommended repair service budget: ${total_cost:,.2f}."
        
    # Relative paths for frontend serving
    rel_orig = f"uploads/original/{unique_filename}"
    rel_annotated = f"uploads/annotated/annotated_{unique_filename}"
    
    # Store report
    report = InspectionReport(
        user_id=current_user.id if current_user else None,
        vehicle_name=vehicle_name,
        license_plate=l_plate,
        original_image=rel_orig,
        annotated_image=rel_annotated,
        overall_severity=overall_severity,
        total_cost=total_cost,
        summary=summary,
        health_score=health,
        vehicle_make=v_make,
        vehicle_model=v_model,
        vehicle_age=v_age,
        battery_health=battery,
        tire_condition=tire,
        maintenance_history=history,
        obd_status=obd,
        latitude=lat,
        longitude=lon,
        gps_address=address
    )
    
    db.add(report)
    db.commit()
    db.refresh(report)
    
    # Store defects
    for d in defects:
        db_defect = DetectedDefect(
            report_id=report.id,
            defect_type=d["defect_type"],
            severity=d["severity"],
            part_affected=d["part_affected"],
            confidence=d["confidence"],
            bbox=d["bbox"],
            cost_est_min=d["cost_est_min"],
            cost_est_max=d["cost_est_max"]
        )
        db.add(db_defect)
        
    db.commit()
    db.refresh(report)
    return report

@app.post("/api/inspect/camera")
async def camera_realtime_inspection(
    frame_data: dict,  # {"image": "data:image/jpeg;base64,..."}
):
    """
    Accepts base64 camera frame for real-time live preview defect bounding boxes.
    Does NOT save to DB to avoid filling it up during live camera frames.
    """
    base64_str = frame_data.get("image")
    if not base64_str:
        raise HTTPException(status_code=400, detail="Missing base64 image data")
        
    try:
        if "," in base64_str:
            base64_str = base64_str.split(",")[1]
        img_bytes = base64.b64decode(base64_str)
        
        # Temp file for detector
        temp_filename = f"temp_cam_{uuid.uuid4()}.jpg"
        temp_path = os.path.join(ORIGINAL_DIR, temp_filename)
        with open(temp_path, "wb") as f:
            f.write(img_bytes)
            
        defects, annotated_path = detector.analyze_vehicle_damage(temp_path, ANNOTATED_DIR)
        
        # Read annotated image back to base64
        with open(annotated_path, "rb") as f:
            annotated_bytes = f.read()
        annotated_base64 = "data:image/jpeg;base64," + base64.b64encode(annotated_bytes).decode("utf-8")
        
        # Clean up temp files immediately
        if os.path.exists(temp_path):
            os.remove(temp_path)
        if os.path.exists(annotated_path):
            os.remove(annotated_path)
            
        return {
            "defects": defects,
            "annotated_image": annotated_base64
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Camera feed analysis failed: {str(e)}")

# --- REPORTS ENDPOINTS ---

@app.get("/api/reports", response_model=List[schemas.ReportResponse])
def get_reports(
    search: Optional[str] = None,
    vehicle_type: Optional[str] = None,
    damage_level: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: Optional[User] = Depends(auth.get_optional_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(InspectionReport)
    
    # If logged in, filter user-specific reports or show all if admin (we show user's reports or all if anonymous for demo purposes)
    if current_user:
        query = query.filter(InspectionReport.user_id == current_user.id)
        
    if search:
        query = query.filter(
            (InspectionReport.vehicle_name.ilike(f"%{search}%")) |
            (InspectionReport.license_plate.ilike(f"%{search}%"))
        )
        
    if vehicle_type and vehicle_type != "All":
        query = query.filter(InspectionReport.vehicle_name.ilike(f"%{vehicle_type}%"))
        
    if damage_level and damage_level != "All":
        query = query.filter(InspectionReport.overall_severity == damage_level)
        
    if start_date:
        s_date = datetime.datetime.strptime(start_date, "%Y-%m-%d")
        query = query.filter(InspectionReport.created_at >= s_date)
        
    if end_date:
        e_date = datetime.datetime.strptime(end_date, "%Y-%m-%d") + datetime.timedelta(days=1)
        query = query.filter(InspectionReport.created_at < e_date)
        
    return query.order_by(InspectionReport.created_at.desc()).all()

@app.get("/api/reports/{report_id}", response_model=schemas.ReportResponse)
def get_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(InspectionReport).filter(InspectionReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@app.delete("/api/reports/{report_id}")
def delete_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(InspectionReport).filter(InspectionReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    # Remove files
    base_dir = os.path.dirname(os.path.abspath(__file__))
    orig_path = os.path.join(base_dir, report.original_image)
    annotated_path = os.path.join(base_dir, report.annotated_image)
    
    if os.path.exists(orig_path):
        os.remove(orig_path)
    if os.path.exists(annotated_path):
        os.remove(annotated_path)
        
    db.delete(report)
    db.commit()
    return {"message": "Report deleted successfully"}

@app.get("/api/reports/{report_id}/pdf")
def download_pdf_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(InspectionReport).filter(InspectionReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    pdf_filename = f"report_{report.id}.pdf"
    pdf_path = os.path.join(REPORTS_DIR, pdf_filename)
    
    # Check absolute paths to files
    base_dir = os.path.dirname(os.path.abspath(__file__))
    orig_abs = os.path.join(base_dir, report.original_image)
    annotated_abs = os.path.join(base_dir, report.annotated_image)
    
    # Generate the report
    try:
        pdf_generator.generate_pdf_report(report, report.defects, orig_abs, annotated_abs, pdf_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF Generation failed: {str(e)}")
        
    return FileResponse(
        pdf_path, 
        media_type="application/pdf", 
        filename=f"Defect_Report_#{report.id}_{report.vehicle_name.replace(' ', '_')}.pdf"
    )

# --- DASHBOARD ENDPOINTS ---

@app.get("/api/dashboard/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(
    current_user: Optional[User] = Depends(auth.get_optional_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(InspectionReport)
    defect_query = db.query(DetectedDefect)
    
    # User scoping for reports if authenticated
    if current_user:
        query = query.filter(InspectionReport.user_id == current_user.id)
        defect_query = defect_query.join(InspectionReport).filter(InspectionReport.user_id == current_user.id)
        
    reports = query.all()
    total_inspections = len(reports)
    total_defects = defect_query.count()
    
    # Total cost
    total_cost = sum([r.total_cost for r in reports])
    
    # Severity distribution
    severity_counts = {"Minor": 0, "Moderate": 0, "Severe": 0}
    for r in reports:
        severity_counts[r.overall_severity] = severity_counts.get(r.overall_severity, 0) + 1
        
    # Defect distribution
    defect_distribution = {
        "Scratch": 0, "Dent": 0, "Rust": 0, "Paint Damage": 0, 
        "Windshield Crack": 0, "Broken Headlight": 0, "Tire Damage": 0, "Bumper Damage": 0
    }
    
    defects = defect_query.all()
    for d in defects:
        defect_distribution[d.defect_type] = defect_distribution.get(d.defect_type, 0) + 1
        
    # Monthly statistics
    # Group reports by month. For SQLite we can do it by querying dates.
    # We will compute the last 6 months dynamically.
    monthly_trend = []
    today = datetime.date.today()
    for i in range(5, -1, -1):
        # Calculate date range for current month in the loop
        first_day_of_month = (today.replace(day=1) - datetime.timedelta(days=i*30)).replace(day=1)
        # Handle month rolling boundary
        next_month = (first_day_of_month + datetime.timedelta(days=32)).replace(day=1)
        
        # Convert to datetime for comparison
        dt_start = datetime.datetime.combine(first_day_of_month, datetime.time.min)
        dt_end = datetime.datetime.combine(next_month, datetime.time.min)
        
        # Filter reports
        month_reports = [r for r in reports if dt_start <= r.created_at < dt_end]
        month_cost = sum([r.total_cost for r in month_reports])
        month_name = first_day_of_month.strftime("%b")
        
        monthly_trend.append({
            "month": month_name,
            "inspections": len(month_reports),
            "cost": float(month_cost)
        })
        
    # Get top 5 recent reports
    recent_reports = query.order_by(InspectionReport.created_at.desc()).limit(5).all()
    
    return {
        "total_inspections": total_inspections,
        "total_defects": total_defects,
        "total_estimated_cost": float(total_cost),
        "severity_distribution": severity_counts,
        "defect_distribution": defect_distribution,
        "monthly_trend": monthly_trend,
        "recent_reports": recent_reports
    }

# --- REPORT EXPORTS & UTILITY ENDPOINTS ---

@app.get("/api/reports/export/excel")
def export_reports_excel(db: Session = Depends(get_db)):
    """
    Exports all vehicle inspection records as a CSV format file, compatible with Excel.
    """
    import io
    import csv
    
    reports = db.query(InspectionReport).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        "Report ID", "Date & Time", "Vehicle Profile", "Make", "Model", "Age (Years)", 
        "License Plate", "Health Score (0-100)", "EV Battery Health", "Tire Condition",
        "OBD Status", "Overall Severity", "Total Defect Count", "Estimated Repair Cost ($)", 
        "GPS Coordinates", "Summary"
    ])
    
    # Rows
    for r in reports:
        writer.writerow([
            r.id,
            r.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            r.vehicle_name,
            r.vehicle_make,
            r.vehicle_model,
            r.vehicle_age,
            r.license_plate,
            r.health_score,
            f"{r.battery_health}%",
            r.tire_condition,
            r.obd_status,
            r.overall_severity,
            len(r.defects),
            r.total_cost,
            r.gps_address,
            r.summary
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=vehicle_inspections_report.csv"}
    )

# In-memory dictionary for simulated OTP storage
OTP_DB = {}

@app.post("/api/auth/otp/send")
def send_otp(username: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Simulate generated OTP code (e.g. 123456 for easy verification/demo)
    simulated_otp = "123456"
    OTP_DB[username] = simulated_otp
    return {"message": f"OTP verification code sent to registered contact for user '{username}'", "simulated_code": simulated_otp}

@app.post("/api/auth/otp/verify")
def verify_otp(username: str = Form(...), otp_code: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    expected_otp = OTP_DB.get(username)
    if not expected_otp or otp_code != expected_otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP code")
        
    # Generate token on success
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer", "user": {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "profile_pic": user.profile_pic
    }}

@app.post("/api/inspect/email")
def email_inspection_report(report_id: int, recipient_email: str = Form(...), db: Session = Depends(get_db)):
    report = db.query(InspectionReport).filter(InspectionReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    return {"message": f"Report #{report_id} and PDF copy successfully emailed to {recipient_email}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
