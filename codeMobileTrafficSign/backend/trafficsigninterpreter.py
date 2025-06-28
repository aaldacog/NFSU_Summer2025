# IMPORT LIBRARIES
from fastapi import FastAPI, UploadFile, File, Request
import openai
# base64 help to pass the image to LLM instead of the URL
import base64
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

client = openai.OpenAI(api_key="HERE_YOUR_API_KEY")

@app.post("/analyze-traffic-sign")
async def analyze_traffic_sign(request: Request, image: UploadFile = File(...)):
    try:
        # Debug: Log request details
        logger.info(f"=== REQUEST RECEIVED ===")
        logger.info(f"Content-Type: {request.headers.get('content-type')}")
        logger.info(f"Content-Length: {request.headers.get('content-length')}")
        logger.info(f"Image filename: {image.filename}")
        logger.info(f"Image content-type: {image.content_type}")
        logger.info(f"Image size: {image.size}")
        
        # Read image bytes
        image_bytes = await image.read()
        logger.info(f"Image bytes length: {len(image_bytes)}")
        
        # Check if image is empty
        if len(image_bytes) == 0:
            logger.error("ERROR: Image bytes are empty!")
            return {"error": "No image data received"}
        
        # Convert to base64
        base64_string = base64.b64encode(image_bytes).decode('utf-8')
        logger.info(f"Base64 string length: {len(base64_string)}")
        
        # Prepare data URL (detect image type)
        if image.content_type == "image/jpeg" or image.filename.lower().endswith(('.jpg', '.jpeg')):
            data_url = f"data:image/jpeg;base64,{base64_string}"
        else:
            data_url = f"data:image/png;base64,{base64_string}"
        
        logger.info(f"Data URL prepared: {data_url[:50]}...")
        
        # Call GPT-4o Vision API
        logger.info("Calling OpenAI API...")
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Please analyze the image. Identify the U.S. traffic sign and describe its official name, use, and regulation according to MUTCD standards."},
                        {"type": "image_url", "image_url": {"url": data_url}}
                    ]
                }
            ]
        )
        
        description = response.choices[0].message.content
        logger.info(f"OpenAI response received: {description}")
        
        return {"description": description}
        
    except Exception as e:
        logger.error(f"ERROR in analyze_traffic_sign: {str(e)}")
        return {"error": f"Server error: {str(e)}"}

# Add a simple test endpoint
@app.get("/test")
async def test_endpoint():
    logger.info(f"=== REQUEST RECEIVED in TEST ===")
    return {"message": "FastAPI server is running!"}