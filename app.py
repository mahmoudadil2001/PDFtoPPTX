import os
import importlib.util
import streamlit as st
from ppt_generator import create_ppt

LECTURES_DIR = "lectures"

def list_lecture_files():
    # يعرض فقط ملفات .py بدون الملفات التي تبدأ بـ __ أو تحتوي على مسافات
    return [f for f in os.listdir(LECTURES_DIR) if f.endswith(".py") and not f.startswith("__") and " " not in f]

def load_lecture_module(filename):
    path = os.path.join(LECTURES_DIR, filename)
    spec = importlib.util.spec_from_file_location("lecture_module", path)
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

        st.write(f"📄 يتم الآن إنشاء PowerPoint من: `{selected}` بعنوان: `{title}`")

        create_ppt(title, slides, output_name)

        st.success(f"✅ تم إنشاء ملف PowerPoint: {output_name}")

        with open(output_name, "rb") as file:
            st.download_button(
                label="⬇️ حمل ملف PowerPoint",
                data=file,
                file_name=output_name,
                mime="application/vnd.openxmlformats-officedocument.presentationml.presentation"
            )
