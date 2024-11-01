import time
import json
from llama_index import Document
from reconfox.models import Domain, People
from reconfox.tool.ai_assistant import ollama_helper
from reconfox.tool.ai_assistant import llama_index_helper
from reconfox.reconfox_config import AI_METHOD

def summarizeProfile(domain_id):
    domain = Domain.objects.get(id=domain_id).domain
    queryset = People.objects.filter(domain_id=domain_id, ocupation_summary__contains="This profile doesn't have a description yet")

    if AI_METHOD == "LOCAL":
        prompt = "Summarize the ocupation of the person in just 150 words given the following data: "
        for entry in queryset.iterator():
            try:
                raw_data = entry.raw_metadata
                entry.ocupation_summary = ollama_helper.ollama_flexible_prompt(prompt + raw_data)
                entry.save()
            except Exception as e:
                print(f"Error inesperado: {str(e)}")
    else: #REMOTE
        prompt = "Provide a brief description (150 words) and the job title inside " + domain + "for each person based on the following metadata. Return the response as JSON with each person's name, description and job title:\n\n"
        documents = []
        for entry in queryset.iterator():
            raw_data = entry.raw_metadata
            prompt += f"Name: {entry.name}\nMetadata: {entry.raw_metadata}\n\n"
            document_text = f"Person Name: {entry.name}\nMetadata: {raw_data}"
            doc = Document(
                        text=document_text,
                        extra_info={"name": entry.name, "source": entry.source})
            documents.append(doc)
            prompt += "Return the output as JSON in this format:\n" \
                    "{\n  \"people\": [\n    {\"name\": \"Name1\", \"description\": \"Description1\", \"job_title\": \"JobTitle1\"},"\
                    "{\"name\": \"Name2\", \"description\": \"Description2\", \"job_title\": \"JobTitle2\"},\n    ...\n  ]\n}"
            response = llama_index_helper.query_index(prompt,documents)

            try:
                data = json.loads(response)["people"][0]
                print(data)
                entry.ocupation_summary = data["description"]
                entry.job_title = data["job_title"]
                entry.save()

            except json.JSONDecodeError as e:
                print(f"Error decoding JSON response: {e}")
                data = []
            break

        