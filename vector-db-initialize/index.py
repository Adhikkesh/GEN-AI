import os
import time
from pathlib import Path
from google.cloud import aiplatform, firestore
from google.api_core.exceptions import NotFound
from vertexai.language_models import TextEmbeddingModel, TextEmbeddingInput
import vertexai

# ================= CONFIG =================
PROJECT_ID = "gen-ai-adhikkesh"
REGION = "us-central1"
INDEX_DISPLAY_NAME = "gen-ai"
KB_DIR = Path(__file__).parent.parent / "prototype" / "knowledge_base"
EMBEDDING_MODEL_NAME = "text-embedding-004"
EMBEDDING_DIMENSIONS = 768
CHUNK_SIZE = 1000  # characters

# ================= HELPERS =================
def chunk_text(text, chunk_size=CHUNK_SIZE):
    return [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]

# ================= CLIENTS =================
aiplatform.init(project=PROJECT_ID, location=REGION)
vertexai.init(project=PROJECT_ID, location=REGION)
firestore_client = firestore.Client()
embedding_model = TextEmbeddingModel.from_pretrained(EMBEDDING_MODEL_NAME)

# ================= INDEX HANDLING =================
print("🚀 Loading or creating Vertex AI Matching Engine index...")

# 1. Find existing index
all_indexes = aiplatform.MatchingEngineIndex.list()
matching_indexes = [idx for idx in all_indexes if idx.display_name == INDEX_DISPLAY_NAME]

if matching_indexes:
    index = matching_indexes[0]
    print(f"Found existing index: {index.resource_name}. Checking for deployments...")

    # 2. Find endpoints and undeploy using class method
    endpoints = aiplatform.MatchingEngineIndexEndpoint.list()
    for ep in endpoints:
        for dep in ep.deployed_indexes:
            if dep.index == index.resource_name:
                print(f"Undeploying index from endpoint {ep.resource_name} ...")
                ep.undeploy_index(deployed_index_id=dep.id)


    # 3. Delete index
    print("Deleting existing index...")
    index.delete()
    print("✅ Index deleted successfully.")

# 4. Create new streaming index
print("Creating new index with STREAM_UPDATE enabled...")
index = aiplatform.MatchingEngineIndex.create_tree_ah_index(
    display_name=INDEX_DISPLAY_NAME,
    dimensions=EMBEDDING_DIMENSIONS,
    approximate_neighbors_count=150,
    distance_measure_type="DOT_PRODUCT_DISTANCE",
    index_update_method="STREAM_UPDATE",
    leaf_node_embedding_count=500,
    leaf_nodes_to_search_percent=7,
)
print(f"✅ Created new index: {index.resource_name}")

# ================= MAIN =================
def upload_to_vector_db():
    files = [f for f in KB_DIR.glob("*.md")]
    print(f"📂 Found {len(files)} markdown documents to index.")

    datapoints = []

    for f in files:
        try:
            text = f.read_text(encoding="utf-8")
            file_id = f.stem
            print(f"• Processing {file_id}")

            chunks = chunk_text(text)

            for i, chunk in enumerate(chunks):
                chunk_id = f"{file_id}_part{i+1}"

                embedding_input = TextEmbeddingInput(
                    text=chunk, task_type="RETRIEVAL_DOCUMENT"
                )
                response = embedding_model.get_embeddings([embedding_input])
                embedding = response[0].values

                if not embedding:
                    print(f"  ✘ Skipped chunk {chunk_id}: failed to embed")
                    continue

                datapoints.append({
                    "datapoint_id": chunk_id,
                    "feature_vector": embedding
                })

                # Save text to Firestore
                firestore_client.collection("knowledge_documents").document(chunk_id).set({
                    "file": f.name,
                    "text": chunk,
                    "uploadedAt": firestore.SERVER_TIMESTAMP
                })

                time.sleep(0.3)

        except Exception as e:
            print(f"🔥 Error processing {f.name}: {e}")

    # Upload to Matching Engine
    if datapoints:
        print(f"⬆️ Uploading {len(datapoints)} embeddings to Vertex AI index...")
        index.upsert_datapoints(datapoints=datapoints)
        print("✅ Upload complete.")
    else:
        print("⚠️ No embeddings to upload.")

if __name__ == "__main__":
    upload_to_vector_db()
