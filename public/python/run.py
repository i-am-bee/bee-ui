import asyncio
import json
import pathlib
import pyodide.code
import micropip
import traceback
import streamlit as st
import runpy

def format_traceback_with_locals(exc, skip_frames=0):
    traceback_segments = traceback.format_exception(exc)
    traceback_string = traceback_segments[0].rstrip() + "\n"
    tb = exc.__traceback__
    while tb is not None:
        if skip_frames > 0:
            skip_frames -= 1
            tb = tb.tb_next
            continue
        traceback_segment = traceback.format_tb(tb)[0]
        traceback_string += traceback_segment
        if traceback_segment.startswith("  File \"app.py\","):
            traceback_string += "  -> local variables: " + str({k: v for k, v in tb.tb_frame.f_locals.items() if not k.startswith("__")}) + "\n"
        tb = tb.tb_next
    traceback_string += traceback_segments[-1]
    return traceback_string

@st.fragment
def error_fragment(error_text):
    root = st.empty()
    with root.container(border=True):
        st.write("🤯 An error occurred while executing the app.")
        if st.button("Try to fix this error", icon="🛠️", type="primary"):
            with root.container(border=True):
                st.components.v1.html(
                    f"""
                    // This iframe is hidden using CSS. Do not remove this comment.
                    <script>
                    window.parent.postMessage({json.dumps({"type": "reportError", "errorText": error_text})}, "*")
                    </script>
                    """
                )
                st.write("🛠️ The error is being fixed...")
                return
        st.expander("Error details").code(error_text, language=None)

async def run():
    source = pathlib.Path("app.py").read_text()
    await asyncio.gather(
        *(micropip.install(library) for library in pyodide.code.find_imports(source)),
        return_exceptions=True,
    )
    try:
        runpy.run_path("app.py", run_name="__main__")
    except Exception as e:
        error_fragment(format_traceback_with_locals(e, skip_frames=4))

__all__ = ["run"]