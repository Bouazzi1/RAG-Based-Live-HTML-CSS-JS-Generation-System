import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    console.log('Received request for code generation.');

    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY is not set.');
      return NextResponse.json(
        { error: 'Server configuration error: Missing API key.' },
        { status: 500 }
      );
    }

    const { prompt, snippets } = await req.json();
    console.log('Prompt:', prompt);
    console.log('Snippets:', snippets ? `${snippets.length} snippets received` : 'No snippets received');


    if (!prompt || !snippets) {
      return NextResponse.json(
        { error: 'Prompt and snippets are required' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert web developer specializing in Bootstrap. Your task is to create a single, complete HTML file based on a user's request and provided Bootstrap code snippets.

Instructions:
1.  Use the provided Bootstrap snippets as a reference.
2.  Generate a single HTML file.
3.  Embed all necessary CSS within a \`<style>\` tag in the \`<head>\`.
4.  Embed all necessary JavaScript within a \`<script>\` tag at the end of the \`<body>\`.
5.  The final output should be only the raw HTML code, without any extra explanations, markdown, or commentary.
6.  Ensure the generated code is responsive and follows best practices.
7.  Include the Bootstrap CSS and JS CDN links in the HTML head.`;

    const combinedSnippets = snippets.join('\\n\\n---\\n\\n');

    const userPrompt = `
User Request: "${prompt}"

---

Bootstrap Snippets:
${combinedSnippets}
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 4096,
      top_p: 1,
      stream: false,
    });

    const generatedCode = chatCompletion.choices[0]?.message?.content || '';
    console.log('Successfully generated code.');

    return NextResponse.json({ code: generatedCode });

  } catch (error) {
    console.error('Error generating code:', error);
    return NextResponse.json(
      { error: 'Failed to generate code' },
      { status: 500 }
    );
  }
}
