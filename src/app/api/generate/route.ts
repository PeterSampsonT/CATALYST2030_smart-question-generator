import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { topic, difficulty = 'Medium', previousWrongQuestion } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key missing in .env.local' }, { status: 500 });
    }

    let dynamicContext = `Generate a practice quiz question for a student on the topic "${topic}" at a "${difficulty}" difficulty level.`;

    if (previousWrongQuestion) {
      dynamicContext = `The student just answered a question incorrectly.
Topic: "${topic}"
Target Difficulty: "${difficulty}"
Previous Question answered wrong: "${previousWrongQuestion.question}"
Correct answer concept they missed: "${previousWrongQuestion.options[previousWrongQuestion.correctAnswer]}"

Generate a new, SIMILAR practice question that re-tests or reinforces the concept they missed in the previous question at the ${difficulty} level.`;
    }

    const prompt = `${dynamicContext}
Return ONLY valid JSON with no markdown formatting or extra text:
{
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "question": "Question text here",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "Brief explanation of the answer."
}`;

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
      return NextResponse.json(
        { error: data?.error?.message || 'Gemini API Error' },
        { status: response.status }
      );
    }

    let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('No content returned from Gemini');

    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const quizData = JSON.parse(rawText);

    return NextResponse.json(quizData);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error generating question' },
      { status: 500 }
    );
  }
}