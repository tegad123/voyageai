const axios = require('axios');
require('dotenv').config();

(async () => {
  try {
    const key = process.env.OPENAI_API_KEY;
    console.log('Using key:', key);
    const r = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      { model: 'gpt-3.5-turbo', messages: [{ role: 'user', content: 'ping' }], temperature: 0.7 },
      { headers: { Authorization: `Bearer ${key}` } }
    );
    console.log('Success:', r.data);
  } catch (e) {
    console.error('Error:', e.response?.status, e.response?.data);
  }
})(); 