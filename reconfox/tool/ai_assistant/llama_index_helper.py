import openai
from llama_index import VectorStoreIndex
from reconfox.reconfox_config import OPENAI_API_KEY

openai.api_key = OPENAI_API_KEY

def query_index(query_text, documents):
    index = VectorStoreIndex.from_documents(documents, embed_model="text-embedding-3-large")
    query_engine = index.as_query_engine()
    response = query_engine.query(query_text)
    return response.response

def query(query_text, query_engine):
    response = query_engine.query(query_text)
    return response.response