import os
import cv2
import numpy as np
import datetime
from sqlalchemy.orm import Session
from database import init_db, SessionLocal, User, InspectionReport, DetectedDefect
import detector
import pdf_generator

def create_dummy_image(path):
    # Create a 640x480 silver image representing a side profile of a car
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    img[:] = (200, 200, 200) # Silver car body
    
    # Draw some shapes/lines representing car structures
    cv2.rectangle(img, (100, 200), (540, 380), (120, 120, 120), -1) # Main body
    cv2.circle(img, (200, 380), 50, (30, 30, 30), -1) # Front wheel
    cv2.circle(img, (440, 380), 50, (30, 30, 30), -1) # Rear wheel
    
    # Draw a mock scratch (high contrast line)
    cv2.line(img, (150, 230), (280, 240), (40, 40, 40), 2) # Scratch on door
    # Draw a mock dent/anomaly
    cv2.circle(img, (380, 260), 20, (100, 100, 100), -1) # Dent on rear door
    
    cv2.imwrite(path, img)
    print(f"Created dummy car image at {path}")

def run_tests():
    print("Starting Backend Components E2E Unit Tests...")
    
    # Create dummy images folder inside backend if needed
    test_dir = os.path.dirname(os.path.abspath(__file__))
    orig_path = os.path.join(test_dir, "test_car.jpg")
    output_dir = os.path.join(test_dir, "uploads", "annotated")
    os.makedirs(output_dir, exist_ok=True)
    
    create_dummy_image(orig_path)
    
    # 1. DB Init Test
    print("Testing DB Init...")
    init_db()
    db: Session = SessionLocal()
    print("DB connection and table initialization successful!")
    
    # 2. Defect Detection Engine Test
    print("Testing CV Defect Detection Engine...")
    defects, annotated_path = detector.analyze_vehicle_damage(orig_path, output_dir)
    print(f"Detections count: {len(defects)}")
    print(f"Annotated file saved at: {annotated_path}")
    
    for i, d in enumerate(defects):
        print(f"  [{i+1}] Type: {d['defect_type']} | Part: {d['part_affected']} | Severity: {d['severity']} | Conf: {d['confidence']}% | Cost: ${d['cost_est_min']}-${d['cost_est_max']}")
        
    # 3. PDF Generator Test
    print("Testing PDF Generation...")
    
    # Simulate DB report item
    report = InspectionReport(
        id=9999,
        vehicle_name="Tesla Model S (Test)",
        license_plate="TEST-AI-99",
        original_image="test_car.jpg",
        annotated_image=annotated_path,
        overall_severity="Medium",
        total_cost=1250.00,
        summary="Automated test inspection report.",
        created_at=datetime.datetime.now()
    )
    
    # Create list of DetectedDefect model items
    db_defects = []
    for d in defects:
        db_defects.append(DetectedDefect(
            defect_type=d["defect_type"],
            part_affected=d["part_affected"],
            severity=d["severity"],
            confidence=d["confidence"],
            cost_est_min=d["cost_est_min"],
            cost_est_max=d["cost_est_max"]
        ))
        
    pdf_out = os.path.join(test_dir, "uploads", "test_report.pdf")
    pdf_generator.generate_pdf_report(report, db_defects, orig_path, annotated_path, pdf_out)
    print(f"PDF successfully generated at: {pdf_out}")
    
    # Cleanup temporary test_car.jpg
    if os.path.exists(orig_path):
        os.remove(orig_path)
        
    print("E2E Unit Tests completed successfully!")

if __name__ == "__main__":
    run_tests()
