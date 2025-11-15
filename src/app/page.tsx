"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Editor from "@monaco-editor/react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setGeneratedCode("");

    try {
      const ragResponse = await fetch("/api/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: prompt }),
      });

      if (!ragResponse.ok) {
        throw new Error("Failed to fetch from RAG endpoint.");
      }
      const { snippets } = await ragResponse.json();

      const generateResponse = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, snippets }),
      });

      if (!generateResponse.ok) {
        throw new Error("Failed to generate code.");
      }
      const { code } = await generateResponse.json();
      // The model sometimes returns the code wrapped in ```html ... ```, so we need to strip that.
      const cleanedCode = code.replace(/^```html\\n|```$/g, '');
      setGeneratedCode(cleanedCode);

    } catch (error) {
      console.error(error);
      // You can add a user-facing error message here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <div className="flex flex-col w-1/3 p-4">
        <h1 className="text-2xl font-bold mb-4">CodeForge AI</h1>
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the component you want to build..."
            className="flex-grow bg-gray-800 text-white border-gray-700"
          />
          <Button type="submit" disabled={isLoading} className="mt-4">
            {isLoading ? "Generating..." : "Generate Artifact"}
          </Button>
        </form>
      </div>
      <div className="flex flex-col w-2/3">
        <div className="flex-1 border-l border-gray-700">
          <Editor
            height="50vh"
            defaultLanguage="html"
            value={generatedCode}
            theme="vs-dark"
            options={{ readOnly: true }}
          />
        </div>
        <div className="flex-1 border-t border-gray-700">
          <iframe
            srcDoc={generatedCode}
            title="Preview"
            className="w-full h-full bg-white"
          />
        </div>
      </div>
    </div>
  );
}
