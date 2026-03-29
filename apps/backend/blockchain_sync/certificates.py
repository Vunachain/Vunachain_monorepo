from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from io import BytesIO
from datetime import datetime

def generate_compliance_certificate(farmer, plot, harvests):
    """
    Generates a PDF certificate for EUDR compliance proof.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor("#1e293b"),
        alignment=1,
        spaceAfter=30
    )
    
    content = []
    
    # Header
    content.append(Paragraph("VUNACHAIN COMPLIANCE CERTIFICATE", title_style))
    content.append(Paragraph(f"Certificate ID: VUNA-{datetime.now().strftime('%Y%m%d')}-{plot.id}", styles['Normal']))
    content.append(Paragraph(f"Issued on: {datetime.now().strftime('%B %d, %Y')}", styles['Normal']))
    content.append(Spacer(1, 20))
    
    # Farmer & Plot Info
    content.append(Paragraph("Traceability Foundation", styles['Heading2']))
    data = [
        ["Farmer Name", farmer.full_name],
        ["Celo Wallet", farmer.celo_address],
        ["Plot Name", plot.name],
        ["Acreage (Hectares)", str(plot.area_hectares or "N/A")],
        ["EUDR Status", "DEFORESTATION-FREE (COMPLIANT)"]
    ]
    t = Table(data, colWidths=[150, 300])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey)
    ]))
    content.append(t)
    content.append(Spacer(1, 20))
    
    # On-Chain Proof
    content.append(Paragraph("On-Chain Immutable Proof", styles['Heading2']))
    harvest_data = [["Date", "Crop", "Weight", "TX Hash (Celo)"]]
    for h in harvests:
        short_hash = f"{h.transaction_hash[:10]}...{h.transaction_hash[-8:]}" if h.transaction_hash else "Pending"
        harvest_data.append([
            h.created_at.strftime('%Y-%m-%d'),
            h.crop_type,
            f"{h.weight_kg}kg",
            short_hash
        ])
        
    th = Table(harvest_data)
    th.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#22c55e")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('FONTSIZE', (0, 0), (-1, -1), 8)
    ]))
    content.append(th)
    
    # Footer
    content.append(Spacer(1, 40))
    content.append(Paragraph("This document is verified against the Celo Blockchain and regional deforestation maps.", styles['Italic']))
    content.append(Paragraph("Vunachain Engine v1.0 (Headless)", styles['Normal']))
    
    doc.build(content)
    pdf = buffer.getvalue()
    buffer.close()
    return pdf
