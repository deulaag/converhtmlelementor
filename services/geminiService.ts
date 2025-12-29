import { GoogleGenAI } from "@google/genai";

const SYSTEM_PROMPT = `
You are a High-End Frontend Architect Expert in Elementor compatible designs.
MISSION: Create Landing Page sections based on user requests.

CONTEXT: The project is for the Brazilian market. All generated text content MUST be in Portuguese (Brazil).

RULES:
1. Atomic CSS: All CSS must be in a <style> block inside the specific section/div. Use unique IDs (e.g., #hero-section-123).
2. Zero Frameworks: NO Tailwind, NO Bootstrap. Pure Vanilla CSS.
3. Design 2026: Use Glassmorphism, Bento Grids, Giant Typography, Dark Mode, and Neon Glows.
4. Images: Use only absolute public URLs (e.g., https://picsum.photos/seed/xyz/800/600).
5. Output: Return ONLY the raw HTML string including the <style> block. Do not wrap in markdown code blocks.
6. Layout: Create distinct sections (header, hero, features, footer) as siblings if possible.
`;

export const generateLandingPage = async (prompt: string, imageFile?: File | null): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");

  const ai = new GoogleGenAI({ apiKey });
  
  // Choose model based on input
  const model = imageFile ? 'gemini-2.5-flash-image' : 'gemini-3-flash-preview';

  let contents: any;

  if (imageFile) {
    const base64Data = await fileToBase64(imageFile);
    contents = {
      parts: [
        {
          inlineData: {
            mimeType: imageFile.type,
            data: base64Data
          }
        },
        { text: SYSTEM_PROMPT + "\n\nUser Request: " + prompt }
      ]
    };
  } else {
    contents = {
      parts: [
        { text: SYSTEM_PROMPT + "\n\nUser Request: " + prompt }
      ]
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        maxOutputTokens: 4000,
        temperature: 0.7,
      }
    });

    let html = response.text || "";
    // Clean up if the model adds markdown
    html = html.replace(/```html/g, '').replace(/```/g, '');
    return html;
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data url prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};
