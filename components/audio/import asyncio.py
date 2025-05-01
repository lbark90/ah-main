import asyncio
import logging

async def process_message(message, websocket):
    try:
        sentence = message.get("sentence")
        voice_id = message.get("voice_id")
        
        if not sentence or not voice_id:
            logging.error("Invalid message format: missing sentence or voice_id")
            return
        
        audio_stream = stream_audio_from_text(sentence, voice_id, websocket)
        async for message_type, message_data in audio_stream:
            # Handle the streaming data
            if message_type == "audio_chunk":
                await websocket.send(message_data)
            elif message_type == "error":
                logging.error(f"Error in audio stream: {message_data}")
                break
    except Exception as e:
        logging.error(f"Error processing message: {e}")

async def stream_audio_from_text(sentence, voice_id, websocket):
    try:
        # Simulate streaming audio chunks
        for i in range(5):  # Example: 5 chunks
            await asyncio.sleep(0.5)  # Simulate delay
            yield "audio_chunk", f"Audio chunk {i} for sentence '{sentence}' with voice_id '{voice_id}'"
    except Exception as e:
        yield "error", str(e)