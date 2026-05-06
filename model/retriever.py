# retriever.py
from vectorstore import vector_store

retriever = vector_store.as_retriever(
    search_kwargs={"k": 4}
)