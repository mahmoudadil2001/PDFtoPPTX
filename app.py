import os
import importlib.util
import streamlit as st
from ppt_generator import create_ppt  # عدلنا الاستيراد هنا ليتوافق مع اسم الدالة الصحيح

LECTURES_DIR = "lectures"

def list_lecture_files():
    # يعرض فقط ملفات بايثون داخل مجلد المحاضرات
    return [f for f in os.listdir(LECTURES_DIR) if f.endswith(".py")]

def load_lecture_module(filename):
    path = os.path.join(LECTURES_DIR, filename)
    spec = importlib.util.spec_from_file_location("lecture", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

st.set_page_config(page_title="Dental PPT Generator", page_icon="🦷")
st.title("🦷 Dental PowerPoint Generator")

lectures = list_lecture_files()

if not lectures:
    st.warning("❌ لا توجد محاضرات في مجلد 'lectures/'")
else:
    selected = st.selectbox("اختر المحاضرة", lectures)

    if st.button("إنشاء PowerPoint"):
        module = load_lecture_module(selected)
        title = getattr(module, "title", "Lecture")
        slides = getattr(module, "slides", [])

        output_name = f"{title.replace(' ', '_')}.pptx"

        # استدعاء دالة توليد الباوربوينت
        create_ppt(title, slides, output_name)

        st.success(f"تم إنشاء ملف PowerPoint: {output_name}")

        # زر تحميل الملف الناتج
        with open(output_name, "rb") as file:
            st.download_button(
                label="⬇️ حمل ملف PowerPoint",
                data=file,
                file_name=output_name,
                mime="application/vnd.openxmlformats-officedocument.presentationml.presentation"
            )
