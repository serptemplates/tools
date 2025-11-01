"use client";

import { useState, useEffect } from "react";
import { Card } from "@serp-extensions/ui/components/card";
import { Badge } from "@serp-extensions/ui/components/badge";

export default function CharacterCounter() {
  const [text, setText] = useState("");
  const [stats, setStats] = useState({
    characters: 0,
    charactersNoSpaces: 0,
    words: 0,
    sentences: 0,
    paragraphs: 0,
    lines: 0,
    readingTime: 0,
    speakingTime: 0,
  });

  useEffect(() => {
    // Calculate stats
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, "").length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0).length;
    const lines = text.split(/\n/).length;

    // Average reading speed: 200 words per minute
    const readingTime = Math.ceil(words / 200);
    // Average speaking speed: 150 words per minute
    const speakingTime = Math.ceil(words / 150);

    setStats({
      characters,
      charactersNoSpaces,
      words,
      sentences,
      paragraphs,
      lines,
      readingTime,
      speakingTime,
    });
  }, [text]);

  return (
    <section className="w-full bg-gradient-to-b from-gray-50 to-white py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Character Counter</h1>
          <p className="text-lg text-gray-600">
            Count characters, words, sentences, and paragraphs instantly
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Text Input Area */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type or paste your text here..."
                className="w-full h-96 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
              />
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setText("")}
                  className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(text);
                  }}
                  className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Copy
                </button>
                <button
                  onClick={async () => {
                    const clipText = await navigator.clipboard.readText();
                    setText(clipText);
                  }}
                  className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Paste
                </button>
              </div>
            </Card>
          </div>

          {/* Stats Panel */}
          <div className="space-y-4">
            {/* Main Stats */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 text-gray-900">Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Characters</span>
                  <Badge variant="secondary" className="font-mono">
                    {stats.characters.toLocaleString()}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Characters (no spaces)</span>
                  <Badge variant="secondary" className="font-mono">
                    {stats.charactersNoSpaces.toLocaleString()}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Words</span>
                  <Badge variant="secondary" className="font-mono">
                    {stats.words.toLocaleString()}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Sentences</span>
                  <Badge variant="secondary" className="font-mono">
                    {stats.sentences.toLocaleString()}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Paragraphs</span>
                  <Badge variant="secondary" className="font-mono">
                    {stats.paragraphs.toLocaleString()}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Lines</span>
                  <Badge variant="secondary" className="font-mono">
                    {stats.lines.toLocaleString()}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Time Estimates */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 text-gray-900">Time Estimates</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Reading time</span>
                  <Badge variant="secondary">
                    {stats.readingTime} min
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Speaking time</span>
                  <Badge variant="secondary">
                    {stats.speakingTime} min
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Common Limits */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 text-gray-900">Platform Limits</h3>
              <div className="space-y-2">
                <div className="text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Twitter</span>
                    <span className={stats.characters <= 280 ? "text-green-600" : "text-red-600"}>
                      {stats.characters}/280
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${stats.characters <= 280 ? "bg-green-500" : "bg-red-500"}`}
                      style={{ width: `${Math.min(100, (stats.characters / 280) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">SMS</span>
                    <span className={stats.characters <= 160 ? "text-green-600" : "text-red-600"}>
                      {stats.characters}/160
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${stats.characters <= 160 ? "bg-green-500" : "bg-red-500"}`}
                      style={{ width: `${Math.min(100, (stats.characters / 160) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}