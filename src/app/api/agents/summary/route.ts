import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({
  attendanceData: z.string(),
  gradesData: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { attendanceData, gradesData } = schema.parse(body);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not configured' },
        { status: 500 }
      );
    }

    const prompt = `You are an academic advisor. Analyze this student data and generate a parent-friendly progress report.

Attendance: ${attendanceData}
Grades: ${gradesData}

Return valid JSON only: { "summary": string, "riskLevel": "low"|"medium"|"high"|"none", "recommendations": string[] }`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error: ${res.status} - ${err}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(content);

    return NextResponse.json({ text: content, object: parsed });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Agent failed',
      },
      { status: 500 }
    );
  }
}
