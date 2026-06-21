const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Claude API 프록시
app.post('/api/chat', async (req, res) => {
  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      req.body,
      {
        headers: {
          'x-api-key': req.headers['x-api-key'],
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Server error' });
  }
});

// Brave Search 프록시
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: '검색어 없음' });
    const response = await axios.get(
      'https://api.search.brave.com/res/v1/web/search',
      {
        params: { q: query, count: 5, search_lang: 'ko', country: 'KR' },
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': 'BSAx74lLbLsOrwW7-RsjHETzkjyHRYK'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: '검색 실패: ' + error.message });
  }
});

// ElevenLabs TTS 프록시
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice_id } = req.body;
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice_id || 'pNInz6obpgDQGcFmaJgB'}/stream`,
      {
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true }
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': 'sk_e038db2230e926d3671bc70308a2b5584d6aa4cd8256d973'
        },
        responseType: 'arraybuffer'
      }
    );
    res.set('Content-Type', 'audio/mpeg');
    res.send(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: 'TTS 실패: ' + error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('JARVIS 서버 실행중: http://localhost:' + PORT);
});
