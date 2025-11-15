import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    // For now, we'll hardcode the URL. Later, we can implement a search
    // or a mapping from keywords to URLs.
    const bootstrapDocsUrl = `https://getbootstrap.com/docs/5.3/components/${query}/`;

    const { data: html } = await axios.get(bootstrapDocsUrl);
    const $ = cheerio.load(html);

    const codeSnippets: string[] = [];
    $('.bd-example').each((_i, el) => {
      const code = $(el).html();
      if (code) {
        codeSnippets.push(code.trim());
      }
    });

    return NextResponse.json({ snippets: codeSnippets });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to fetch or parse documentation' },
      { status: 500 }
    );
  }
}
