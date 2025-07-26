import streamlit as st
import fitz  # PyMuPDF
from PIL import Image
from pptx import Presentation
from pptx.util import Inches
import os

st.title("📄➡️📊 PDF to PowerPoint Converter")

uploaded_file = st.file_uploader("ارفع ملف PDF", type="pdf")

if uploaded_file:
    # قراءة الملف
    pdf_bytes = uploaded_file.read()
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    st.success(f"تم تحميل الملف بنجاح: {uploaded_file.name}")
    
    prs = Presentation()
    blank_slide_layout = prs.slide_layouts[6]  # شريحة فارغة

    for page_num, page in enumerate(doc, start=1):
        pix = page.get_pixmap(dpi=150)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

        img_path = f"page_{page_num}.png"
        img.save(img_path)

        slide = prs.slides.add_slide(blank_slide_layout)
        left = top = Inches(0)
        slide.shapes.add_picture(img_path, left, top, width=prs.slide_width)

        os.remove(img_path)

    output_name = uploaded_file.name.replace(".pdf", ".pptx")
    prs.save(output_name)

    with open(output_name, "rb") as f:
        st.download_button(
            "⬇️ تحميل العرض التقديمي",
            f,
            file_name=output_name,
            mime="application/vnd.openxmlformats-officedocument.presentationml.presentation"
        )