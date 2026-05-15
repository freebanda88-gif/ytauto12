import { NextResponse } from "next/server";
import config from "../../../../config.js";

export async function POST(request) {
  try {
    const { topic } = await request.json();

    if (!topic || !topic.trim()) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const apiKey = config.ANTHROPIC_API_KEY;

    if (!apiKey || apiKey.includes("APNI-KEY")) {
      return NextResponse.json(
        { error: "config.js mein ANTHROPIC_API_KEY set karo!" },
        { status: 500 }
      );
    }

    const promptText =
      "You are a YouTube scriptwriter for a FACELESS AI Tools channel targeting US audience.\n" +
      "Write a complete video script about: " + topic + "\n\n" +
      "Reply in EXACTLY this format:\n" +
      "TITLE: compelling title (include 2026, power words FREE/Best/Secret, max 65 chars)\n" +
      "DESCRIPTION: 3 SEO-rich sentences ending with call to action\n" +
      "TAGS: tag1, tag2, tag3, tag4, tag5, tag6, tag7, tag8, tag9, tag10, tag11, tag12\n" +
      "SCRIPT:\n" +
      "420-500 words. Shocking hook first. Never say 'In this video'. " +
      "Short punchy sentences. Sound like a smart friend. " +
      "End with: Subscribe and hit the bell - I drop free AI guides every week.";

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{ role: "user", content: promptText }],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg =
        err && err.error && err.error.message
          ? err.error.message
          : "Anthropic API error: HTTP " + res.status;
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const data = await res.json();
    const text =
      data.content && data.content[0] && data.content[0].text
        ? data.content[0].text
        : "";

    if (!text) {
      return NextResponse.json({ error: "Empty response from Claude" }, { status: 500 });
    }

    const titleMatch  = text.match(/TITLE:\s*(.+)/);
    const descMatch   = text.match(/DESCRIPTION:\s*([\s\S]+?)(?=TAGS:)/);
    const tagsMatch   = text.match(/TAGS:\s*([\s\S]+?)(?=SCRIPT:)/);
    const scriptMatch = text.match(/SCRIPT:\s*([\s\S]+)/);

    return NextResponse.json({
      title:  titleMatch  ? titleMatch[1].trim()  : topic,
      desc:   descMatch   ? descMatch[1].trim()   : "",
      tags:   tagsMatch   ? tagsMatch[1].trim()   : "",
      script: scriptMatch ? scriptMatch[1].trim() : text,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
