from core.config import settings

async def synthesize(text: str, language: str = "en-US") -> bytes:
    try:
        from google.cloud import texttospeech
        client = texttospeech.TextToSpeechClient()
        input_text = texttospeech.SynthesisInput(text=text[:5000])
        voice = texttospeech.VoiceSelectionParams(
            language_code=language,
            ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
        )
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )
        response = client.synthesize_speech(
            input=input_text, voice=voice, audio_config=audio_config
        )
        return response.audio_content
    except Exception as e:
        print(f"Google TTS failed: {e} — falling back to gTTS")
        return await gtts_fallback(text, language)

async def gtts_fallback(text: str, language: str = "en") -> bytes:
    from gtts import gTTS
    import io
    lang_code = "ur" if language.startswith("ur") else "en"
    tts = gTTS(text=text[:5000], lang=lang_code)
    buf = io.BytesIO()
    tts.write_to_fp(buf)
    buf.seek(0)
    return buf.read()

async def detect_and_synthesize(text: str) -> bytes:
    urdu_chars = any('\u0600' <= c <= '\u06ff' for c in text)
    language = "ur-PK" if urdu_chars else "en-US"
    return await synthesize(text, language)
