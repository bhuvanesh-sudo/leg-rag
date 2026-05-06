import os
from langchain_classic.chains import RetrievalQA
from retriever import retriever
from llm import GroqLLM
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("API_KEY")
if API_KEY is None:
    print("Error loading API Key.")
else:
    llm = GroqLLM(api_key=API_KEY)

qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=retriever,
    chain_type="stuff",  
    return_source_documents=True
)