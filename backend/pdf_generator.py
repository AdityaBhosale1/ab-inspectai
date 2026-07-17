import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def generate_pdf_report(report_data, defects_list, original_img_path, annotated_img_path, output_pdf_path):
    """
    Generates a highly polished, professional PDF report of the vehicle inspection.
    Includes metadata, total costs, visual annotation printout, and damage tables.
    """
    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=letter,
        rightMargin=40, leftMargin=40,
        topMargin=40, bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles matching our dark blue / silver theme
    primary_color = colors.HexColor("#111111")  # Dark charcoal
    accent_color = colors.HexColor("#dc2626")   # Premium Automotive Red
    text_dark = colors.HexColor("#1e293b")
    text_muted = colors.HexColor("#64748b")
    bg_light = colors.HexColor("#f8fafc")
    border_color = colors.HexColor("#cbd5e1")
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=colors.white,
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor("#94a3b8"),
        spaceAfter=0
    )
    
    h2_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=primary_color,
        spaceBefore=14,
        spaceAfter=8
    )
    
    body_style = ParagraphStyle(
        'BodyTextDark',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=10,
        textColor=text_dark,
        leading=14
    )
    
    bold_body_style = ParagraphStyle(
        'BodyTextDarkBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )
    
    meta_label_style = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=primary_color
    )
    
    meta_val_style = ParagraphStyle(
        'MetaValue',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=text_dark
    )

    story = []
    
    # 1. Header Banner
    header_data = [
        [
            Paragraph("AI VEHICLE DEFECT INSPECTION", title_style),
            Paragraph("<b>INSPECTION ID:</b> #RPT-{:04d}".format(report_data.id), ParagraphStyle('RightSub', parent=subtitle_style, alignment=2, textColor=colors.white))
        ],
        [
            Paragraph("COMMERCIAL DAMAGE ASSESSMENT REPORT", subtitle_style),
            Paragraph("<b>Generated:</b> {}".format(report_data.created_at.strftime("%Y-%m-%d %H:%M:%S")), ParagraphStyle('RightSub2', parent=subtitle_style, alignment=2))
        ]
    ]
    
    header_table = Table(header_data, colWidths=[4.0*inch, 3.5*inch])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), primary_color),
        ('PADDING', (0,0), (-1,-1), 12),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 16),
        ('TOPPADDING', (0,0), (-1,-1), 16),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 15))
    
    # 2. Metadata Block (2 columns)
    severity_color = "#10b981" # green
    if report_data.overall_severity in ["Moderate", "Medium"]:
        severity_color = "#f59e0b" # orange
    elif report_data.overall_severity in ["Severe", "High"]:
        severity_color = "#ef4444" # red
        
    h_score = getattr(report_data, 'health_score', 100)
    if h_score is None:
        h_score = 100
        
    if h_score >= 90:
        h_rating = "Excellent"
        h_color = "#10b981"
    elif h_score >= 70:
        h_rating = "Good"
        h_color = "#dc2626"
    elif h_score >= 50:
        h_rating = "Needs Maintenance"
        h_color = "#f59e0b"
    else:
        h_rating = "Critical"
        h_color = "#ef4444"

    v_make = getattr(report_data, 'vehicle_make', None) or "Tesla"
    v_model = getattr(report_data, 'vehicle_model', None) or "Model Y"
    v_age = getattr(report_data, 'vehicle_age', None) or 2
    v_battery = getattr(report_data, 'battery_health', None) or 96
    v_tire = getattr(report_data, 'tire_condition', None) or "Good"
    v_obd = getattr(report_data, 'obd_status', None) or "No Faults"

    meta_left = [
        [Paragraph("Vehicle Profile:", meta_label_style), Paragraph(f"{v_make} {v_model}", meta_val_style)],
        [Paragraph("License Plate:", meta_label_style), Paragraph(report_data.license_plate or "N/A", meta_val_style)],
        [Paragraph("Vehicle Age:", meta_label_style), Paragraph(f"{v_age} Years", meta_val_style)],
        [Paragraph("EV Battery Health:", meta_label_style), Paragraph(f"{v_battery}%", meta_val_style)],
        [Paragraph("Tire Condition:", meta_label_style), Paragraph(v_tire, meta_val_style)],
    ]
    
    meta_right = [
        [Paragraph("Digital Health Score:", meta_label_style), Paragraph(f"<font color='{h_color}'><b>{h_score}/100</b> ({h_rating})</font>", meta_val_style)],
        [Paragraph("OBD Diagnostics:", meta_label_style), Paragraph(v_obd, meta_val_style)],
        [Paragraph("Overall Severity:", meta_label_style), Paragraph(f"<font color='{severity_color}'><b>{report_data.overall_severity}</b></font>", meta_val_style)],
        [Paragraph("Total Defects Found:", meta_label_style), Paragraph(str(len(defects_list)), meta_val_style)],
        [Paragraph("Estimated Repair Cost:", meta_label_style), Paragraph(f"<b>${report_data.total_cost:,.2f}</b>", ParagraphStyle('CostVal', parent=meta_val_style, textColor=accent_color, fontName='Helvetica-Bold', fontSize=12))],
    ]
    
    meta_table_l = Table(meta_left, colWidths=[1.5*inch, 2.05*inch])
    meta_table_l.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    
    meta_table_r = Table(meta_right, colWidths=[1.6*inch, 1.95*inch])
    meta_table_r.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    
    # Combine left and right meta into one layout table
    meta_layout = Table([[meta_table_l, meta_table_r]], colWidths=[3.65*inch, 3.65*inch])
    meta_layout.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg_light),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('PADDING', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(meta_layout)
    story.append(Spacer(1, 15))
    
    # 3. Visual Defect Analysis (Annotated Image)
    story.append(Paragraph("Visual Defect Analysis", h2_style))
    if os.path.exists(annotated_img_path):
        try:
            # We want to maintain ratio. Max width 6.8 inches.
            # Using Pillow to inspect dimensions
            from PIL import Image as PILImage
            img_pil = PILImage.open(annotated_img_path)
            orig_w, orig_h = img_pil.size
            max_w = 6.8 * inch
            ratio = max_w / orig_w
            disp_w = max_w
            disp_h = orig_h * ratio
            
            # If height is too tall, scale down further
            max_h = 3.2 * inch
            if disp_h > max_h:
                ratio = max_h / orig_h
                disp_w = orig_w * ratio
                disp_h = max_h
                
            defect_img = Image(annotated_img_path, width=disp_w, height=disp_h)
            defect_img.hAlign = 'CENTER'
            
            # Place image inside a nice padded border
            img_layout = Table([[defect_img]], colWidths=[7.3*inch])
            img_layout.setStyle(TableStyle([
                ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f1f5f9")),
                ('BOX', (0,0), (-1,-1), 1, border_color),
                ('PADDING', (0,0), (-1,-1), 8),
            ]))
            story.append(img_layout)
        except Exception as e:
            story.append(Paragraph(f"Error rendering image: {e}", body_style))
    else:
        story.append(Paragraph("Visual representation not available.", body_style))
        
    story.append(Spacer(1, 15))
    
    # 4. Detected Defects Table
    story.append(Paragraph("Damage Assessment Details", h2_style))
    
    # Table headers
    table_content = [
        [
            Paragraph("<b>Defect / Damage Type</b>", ParagraphStyle('Th', parent=body_style, textColor=colors.white)),
            Paragraph("<b>Affected Part</b>", ParagraphStyle('Th', parent=body_style, textColor=colors.white)),
            Paragraph("<b>Severity</b>", ParagraphStyle('Th', parent=body_style, textColor=colors.white)),
            Paragraph("<b>Confidence</b>", ParagraphStyle('Th', parent=body_style, textColor=colors.white)),
            Paragraph("<b>Estimated Repair Cost Range</b>", ParagraphStyle('Th', parent=body_style, textColor=colors.white))
        ]
    ]
    
    # Table rows
    for defect in defects_list:
        sev_color = "#10b981"
        if defect.severity in ["Moderate", "Medium"]:
            sev_color = "#d97706"
        elif defect.severity in ["Severe", "High"]:
            sev_color = "#dc2626"
            
        table_content.append([
            Paragraph(defect.defect_type, body_style),
            Paragraph(defect.part_affected, body_style),
            Paragraph(f"<font color='{sev_color}'><b>{defect.severity}</b></font>", body_style),
            Paragraph(f"{defect.confidence}%", body_style),
            Paragraph(f"${defect.cost_est_min:,.0f} - ${defect.cost_est_max:,.0f}", bold_body_style)
        ])
        
    defects_table = Table(table_content, colWidths=[1.8*inch, 1.3*inch, 1.0*inch, 1.0*inch, 2.2*inch])
    defects_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        # Alternate row backgrounds
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, bg_light])
    ]))
    story.append(defects_table)
    story.append(Spacer(1, 15))
    
    # 5. Technical Recommendations
    story.append(Paragraph("System Repair Recommendations", h2_style))
    
    rec_text = "Based on our AI model inspection, we recommend the following repair procedures:<br/>"
    recs_seen = set()
    for defect in defects_list:
        from detector import COST_DATABASE
        # Fetch recommendation text
        rec_info = COST_DATABASE.get(defect.defect_type, {}).get("recommendation", "Standard body repair procedures.")
        if rec_info not in recs_seen:
            recs_seen.add(rec_info)
            rec_text += f"• <b>{defect.defect_type} ({defect.part_affected}):</b> {rec_info}<br/>"
            
    summary_styled = Paragraph(rec_text, body_style)
    summary_box = Table([[summary_styled]], colWidths=[7.3*inch])
    summary_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#fef2f2")), # Soft red accent background
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#fca5a5")),
        ('PADDING', (0,0), (-1,-1), 12),
    ]))
    
    # Use KeepTogether to ensure the recommendation panel doesn't orphan awkwardly
    story.append(KeepTogether([summary_box]))
    
    # 6. Build PDF document with Developed By Aditya Bhosale footer on all pages
    def draw_page_decorations(canvas, doc):
        canvas.saveState()
        canvas.setFont('Helvetica-Bold', 8)
        canvas.setFillColor(colors.HexColor("#64748b"))
        canvas.drawString(40, 20, "Developed By Aditya Bhosale")
        canvas.drawRightString(letter[0] - 40, 20, f"Page {doc.page} | AI Vehicle Defect Detection System")
        canvas.restoreState()

    doc.build(story, onFirstPage=draw_page_decorations, onLaterPages=draw_page_decorations)
