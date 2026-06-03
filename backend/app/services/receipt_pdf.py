"""
PDF receipt generation service using ReportLab.
"""
import io
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
import qrcode
from reportlab.platypus import Image as RLImage

from app.utils.helpers import amount_to_words, format_currency


def _to_float(val: Any) -> float:
    """Safely convert Decimal/None to float."""
    if val is None:
        return 0.0
    if isinstance(val, Decimal):
        return float(val)
    return float(val)


def generate_receipt_pdf(
    payment: Any,
    student: Any,
    fee_structure: Any,
    college_settings: Any,
) -> io.BytesIO:
    """
    Generate a professional PDF receipt and return it as a BytesIO object.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
    )

    def watermark(canvas, doc):
        canvas.saveState()
        canvas.setFont('Helvetica-Bold', 60)
        canvas.setFillGray(0.9)
        canvas.translate(doc.width / 2 + doc.leftMargin, doc.height / 2 + doc.bottomMargin)
        canvas.rotate(45)
        canvas.drawCentredString(0, 0, "PAYMENT RECEIPT")
        canvas.restoreState()

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "CollegeTitle",
        parent=styles["Title"],
        fontSize=18,
        spaceAfter=2,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#1a237e"),
        fontName="Helvetica-Bold",
    )
    subtitle_style = ParagraphStyle(
        "CollegeSubtitle",
        parent=styles["Normal"],
        fontSize=9,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#424242"),
        spaceAfter=2,
    )
    receipt_title_style = ParagraphStyle(
        "ReceiptTitle",
        parent=styles["Title"],
        fontSize=14,
        alignment=TA_CENTER,
        textColor=colors.white,
        fontName="Helvetica-Bold",
        spaceBefore=4,
        spaceAfter=4,
    )
    label_style = ParagraphStyle(
        "Label",
        parent=styles["Normal"],
        fontSize=9,
        textColor=colors.HexColor("#616161"),
    )
    value_style = ParagraphStyle(
        "Value",
        parent=styles["Normal"],
        fontSize=10,
        fontName="Helvetica-Bold",
    )
    footer_style = ParagraphStyle(
        "Footer",
        parent=styles["Normal"],
        fontSize=7,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#9e9e9e"),
    )

    elements = []

    # ---- College Header ----
    college_name = college_settings.college_name if college_settings else "National Institute of Technology"
    college_address = college_settings.address if college_settings else ""
    college_phone = college_settings.phone if college_settings else ""
    college_email = college_settings.email if college_settings else ""

    elements.append(Paragraph(college_name, title_style))
    elements.append(Paragraph(college_address, subtitle_style))
    contact_line = f"Phone: {college_phone} | Email: {college_email}"
    elements.append(Paragraph(contact_line, subtitle_style))
    elements.append(Spacer(1, 4 * mm))

    # ---- Receipt Title Banner ----
    banner_data = [[Paragraph("PAYMENT RECEIPT", receipt_title_style)]]
    banner_table = Table(banner_data, colWidths=[doc.width])
    banner_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#1a237e")),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(banner_table)
    elements.append(Spacer(1, 4 * mm))

    # ---- Receipt Info Row ----
    receipt_number = payment.receipt_number if payment else "N/A"
    payment_date = str(payment.payment_date) if payment else "N/A"

    info_data = [
        [
            Paragraph(f"<b>Receipt No:</b> {receipt_number}", styles["Normal"]),
            Paragraph(f"<b>Date:</b> {payment_date}", ParagraphStyle("R", parent=styles["Normal"], alignment=TA_RIGHT)),
        ]
    ]
    info_table = Table(info_data, colWidths=[doc.width / 2, doc.width / 2])
    info_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 3 * mm))

    # ---- Horizontal Rule ----
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e0e0e0")))
    elements.append(Spacer(1, 3 * mm))

    # ---- Student Details ----
    student_name = student.name if student else "N/A"
    roll_number = student.roll_number if student else "N/A"
    course_name = student.course.name if student and student.course else "N/A"
    branch_name = student.branch if student else "N/A"
    semester = student.semester if student else "N/A"
    batch = student.batch if student else "N/A"

    student_data = [
        [Paragraph("<b>Student Name</b>", label_style), Paragraph(str(student_name), value_style),
         Paragraph("<b>Roll Number</b>", label_style), Paragraph(str(roll_number), value_style)],
        [Paragraph("<b>Course</b>", label_style), Paragraph(str(course_name), value_style),
         Paragraph("<b>Branch</b>", label_style), Paragraph(str(branch_name), value_style)],
        [Paragraph("<b>Semester</b>", label_style), Paragraph(str(semester), value_style),
         Paragraph("<b>Batch</b>", label_style), Paragraph(str(batch), value_style)],
    ]
    col_w = doc.width / 4
    student_table = Table(student_data, colWidths=[col_w, col_w, col_w, col_w])
    student_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f5f5f5")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#e0e0e0")),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e0e0e0")),
    ]))
    elements.append(student_table)
    elements.append(Spacer(1, 5 * mm))

    # ---- Fee Breakdown Table ----
    fee_rows = [
        [Paragraph("<b>S.No</b>", ParagraphStyle("CH", parent=styles["Normal"], fontSize=9, alignment=TA_CENTER)),
         Paragraph("<b>Fee Head</b>", ParagraphStyle("CH", parent=styles["Normal"], fontSize=9)),
         Paragraph("<b>Amount (₹)</b>", ParagraphStyle("CH", parent=styles["Normal"], fontSize=9, alignment=TA_RIGHT))],
    ]

    fee_items = []
    if fee_structure:
        fee_items = [
            ("Tuition Fee", _to_float(fee_structure.tuition_fee)),
            ("Examination Fee", _to_float(fee_structure.exam_fee)),
            ("Library Fee", _to_float(fee_structure.library_fee)),
            ("Hostel Fee", _to_float(fee_structure.hostel_fee)),
            ("Transport Fee", _to_float(fee_structure.transport_fee)),
            ("Laboratory Fee", _to_float(fee_structure.lab_fee)),
            ("Admission Fee", _to_float(fee_structure.admission_fee)),
            ("Miscellaneous Fee", _to_float(fee_structure.misc_fee)),
        ]
    fee_items = [(name, amt) for name, amt in fee_items if amt > 0]

    right_style = ParagraphStyle("RS", parent=styles["Normal"], fontSize=9, alignment=TA_RIGHT)
    center_style = ParagraphStyle("CS", parent=styles["Normal"], fontSize=9, alignment=TA_CENTER)
    normal_9 = ParagraphStyle("N9", parent=styles["Normal"], fontSize=9)

    for i, (name, amt) in enumerate(fee_items, 1):
        fee_rows.append([
            Paragraph(str(i), center_style),
            Paragraph(name, normal_9),
            Paragraph(format_currency(amt), right_style),
        ])

    fee_table = Table(fee_rows, colWidths=[1.5 * cm, doc.width - 5.5 * cm, 4 * cm])
    fee_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a237e")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("ALIGN", (2, 0), (2, -1), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#bdbdbd")),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e0e0e0")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#fafafa")]),
    ]))
    elements.append(fee_table)
    elements.append(Spacer(1, 3 * mm))

    # ---- Payment Summary ----
    payment_amount = _to_float(payment.amount) if payment else 0
    late_fine = _to_float(payment.late_fine) if payment else 0
    discount = _to_float(payment.discount) if payment else 0
    scholarship = _to_float(payment.scholarship_adjustment) if payment else 0
    net_amount = payment_amount + late_fine - discount - scholarship

    bold_right = ParagraphStyle("BR", parent=styles["Normal"], fontSize=10, alignment=TA_RIGHT, fontName="Helvetica-Bold")
    bold_left = ParagraphStyle("BL", parent=styles["Normal"], fontSize=10, fontName="Helvetica-Bold")

    summary_rows = [
        [Paragraph("Payment Amount", normal_9), Paragraph(format_currency(payment_amount), right_style)],
    ]
    if late_fine > 0:
        summary_rows.append([Paragraph("Late Fine", normal_9), Paragraph(f"+ {format_currency(late_fine)}", right_style)])
    if discount > 0:
        summary_rows.append([Paragraph("Discount", normal_9), Paragraph(f"- {format_currency(discount)}", right_style)])
    if scholarship > 0:
        summary_rows.append([Paragraph("Scholarship Adjustment", normal_9), Paragraph(f"- {format_currency(scholarship)}", right_style)])

    summary_rows.append([
        Paragraph("<b>Net Amount Paid</b>", bold_left),
        Paragraph(f"<b>{format_currency(payment_amount)}</b>", bold_right),
    ])

    summary_table = Table(summary_rows, colWidths=[doc.width - 4 * cm, 4 * cm])
    summary_table.setStyle(TableStyle([
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LINEABOVE", (0, -1), (-1, -1), 1, colors.HexColor("#1a237e")),
        ("LINEBELOW", (0, -1), (-1, -1), 2, colors.HexColor("#1a237e")),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 3 * mm))

    # ---- Amount in Words ----
    words = amount_to_words(payment_amount)
    elements.append(Paragraph(f"<b>Amount in Words:</b> {words}", styles["Normal"]))
    elements.append(Spacer(1, 3 * mm))

    # ---- Payment Details ----
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e0e0e0")))
    elements.append(Spacer(1, 2 * mm))

    mode = payment.payment_mode.value if payment and hasattr(payment.payment_mode, "value") else str(payment.payment_mode) if payment else "N/A"
    txn_id = payment.transaction_id or "N/A" if payment else "N/A"
    cheque = payment.cheque_number or "N/A" if payment else "N/A"

    pay_detail_data = [
        [Paragraph("<b>Payment Mode:</b>", label_style), Paragraph(mode.upper(), value_style),
         Paragraph("<b>Transaction ID:</b>", label_style), Paragraph(txn_id, value_style)],
    ]
    if payment and payment.cheque_number:
        pay_detail_data.append([
            Paragraph("<b>Cheque No:</b>", label_style), Paragraph(cheque, value_style),
            Paragraph("", label_style), Paragraph("", value_style),
        ])
    if payment and payment.remarks:
        pay_detail_data.append([
            Paragraph("<b>Remarks:</b>", label_style),
            Paragraph(str(payment.remarks), ParagraphStyle("RM", parent=styles["Normal"], fontSize=9)),
            Paragraph("", label_style), Paragraph("", value_style),
        ])

    pay_table = Table(pay_detail_data, colWidths=[col_w, col_w, col_w, col_w])
    pay_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    elements.append(pay_table)
    elements.append(Spacer(1, 15 * mm))

    # ---- Signature & QR Area ----
    # Generate QR Code
    qr_data = f"Receipt: {receipt_number}\nAmount: {format_currency(payment_amount)}\nStudent: {student_name}"
    qr = qrcode.make(qr_data)
    qr_img_buffer = io.BytesIO()
    qr.save(qr_img_buffer, format="PNG")
    qr_img_buffer.seek(0)
    qr_image = RLImage(qr_img_buffer, width=2.5*cm, height=2.5*cm)

    sig_data = [
        [qr_image, Paragraph("", styles["Normal"]), Paragraph("_________________________", ParagraphStyle("SL", parent=styles["Normal"], alignment=TA_CENTER))],
        [Paragraph("", styles["Normal"]), Paragraph("", styles["Normal"]), Paragraph("<b>Authorized Signatory</b>", ParagraphStyle("AS", parent=styles["Normal"], alignment=TA_CENTER, fontSize=9))],
    ]
    sig_table = Table(sig_data, colWidths=[3*cm, doc.width * 0.6 - 3*cm, doc.width * 0.4])
    sig_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ]))
    elements.append(sig_table)
    elements.append(Spacer(1, 10 * mm))

    # ---- Footer ----
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e0e0e0")))
    now = datetime.now().strftime("%d-%b-%Y %I:%M:%S %p")
    elements.append(Paragraph(f"This is a computer-generated receipt. Generated on {now}.", footer_style))
    elements.append(Paragraph("For any queries, please contact the Accounts Section.", footer_style))

    doc.build(elements, onFirstPage=watermark, onLaterPages=watermark)
    buffer.seek(0)
    return buffer
