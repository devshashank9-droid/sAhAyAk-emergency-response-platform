import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { medicalInfo, bloodGroup, age, language = "English" } = await req.json();
    
    const prompt = `You are an AI emergency triage assistant. A first responder is helping a patient.
    Patient details: Age ${age || 'Unknown'}, Blood: ${bloodGroup || 'Unknown'}, Medical History: ${medicalInfo || 'None reported'}.
    Write a maximum 2-sentence tactical, life-saving action plan for the responder based ONLY on these conditions. 
    Make it highly actionable, urgent, and simple. Do not use markdown or pleasantries. 
    Translate the final response into ${language}.`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ summary: "API Key missing." }, { status: 500 });
    }

    // Array of models to try in descending order of priority
    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash'];
    let aiText = null;
    let lastError = null;

    // Loop through the models. If one returns a 503, it instantly tries the next one.
    for (const model of modelsToTry) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              maxOutputTokens: 80, 
              temperature: 0.2 
            },
            safetySettings: [
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" }
            ]
          })
        });
        
        const data = await response.json();

        // If the model succeeds, extract the text and break the loop
        if (data.candidates && data.candidates.length > 0) {
          aiText = data.candidates[0].content.parts[0].text;
          break; 
        } else if (data.error) {
          console.warn(`[Fallback Circuit] ${model} failed: ${data.error.message}`);
          lastError = data.error.message;
        }

      } catch (e) {
        console.warn(`[Fallback Circuit] Failed to connect to ${model}`);
      }
    }

    if (!aiText) {
      console.error("ALL MODELS FAILED OR BLOCKED:", lastError);
      return NextResponse.json({ summary: "AI Triage network overloaded. Follow standard first aid protocols." }, { status: 503 });
    }

    return NextResponse.json({ summary: aiText });

  } catch (error) {
    console.error("SERVER ERROR:", error);
    return NextResponse.json({ summary: "AI Triage unavailable. Follow standard first aid protocols." }, { status: 500 });
  }
}