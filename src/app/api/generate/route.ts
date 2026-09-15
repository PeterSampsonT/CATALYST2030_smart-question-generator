import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { topic, difficulty = 'Medium' } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key missing in .env.local' },
        { status: 500 }
      );
    }

    const prompt = `Generate a practice quiz question for a student on the topic "${topic}" at a "${difficulty}" difficulty level.
Return ONLY valid JSON with no markdown formatting or extra text:
{
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "question": "Question text here",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "Brief explanation of the answer."
}`;

    // Updated model: gemini-3.6-flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API Error:', data);
      return NextResponse.json(
        { error: data?.error?.message || 'Gemini API Error' },
        { status: response.status }
      );
    }

    let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error('No content returned from Gemini');
    }

    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const quizData = JSON.parse(rawText);

    return NextResponse.json(quizData);
  } catch (error: any) {
    console.error('Server Route Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error generating question' },
      { status: 500 }
    );
  }
}