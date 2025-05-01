
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from lib.api.gemini import generateGeminiResponse
from lib.rag.retriever import retrieveContext

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConversationMessage(BaseModel):
    message: str
    userId: str
    conversationHistory: Optional[List[dict]] = []

@app.post("/api/conversation")
async def process_conversation(conversation: ConversationMessage):
    try:
        if not conversation.message:
            raise HTTPException(status_code=400, detail="Message is required")
        
        if not conversation.userId:
            raise HTTPException(status_code=400, detail="User ID is required")
        
        # Retrieve context from RAG system
        context = await retrieveContext(conversation.userId, conversation.message)
        
        # Format conversation history
        formatted_history = "\n\n".join([
            f"User: {exchange.get('userMessage', '')}\nAI: {exchange.get('aiResponse', '')}"
            for exchange in (conversation.conversationHistory or [])
        ])
        
        # Create prompt
        prompt = f"""
You are having a conversation with someone who wants to talk to {conversation.userId}. 
Use the following information about {conversation.userId} to inform your responses:

{context}

Previous conversation:
{formatted_history}

Current message: {conversation.message}

Respond in a conversational and empathetic manner, as if you are {conversation.userId}.
"""
        
        # Generate response using Gemini
        response = await generateGeminiResponse(prompt)
        
        return {
            "response": response,
            "userId": conversation.userId,
            "timestamp": str(datetime.datetime.utcnow().isoformat())
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000, ssl_keyfile=None, ssl_certfile=None)
