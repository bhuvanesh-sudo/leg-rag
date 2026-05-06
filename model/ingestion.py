import os
import fitz

from langchain_text_splitters import RecursiveCharacterTextSplitter
pdf_path = "dset1.pdf"

def load_pdf_text(pdf_path):

    doc = fitz.open(pdf_path)

    text = ""

    for page in doc:
        text += page.get_text()

    return text


def load_and_split():

    path = os.path.join(os.path.dirname(__file__), "dset1.pdf")

    text = load_pdf_text(path)

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )

    return splitter.split_text(text)

