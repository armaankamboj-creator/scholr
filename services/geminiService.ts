import { GoogleGenAI, Type, Schema, Chat } from "@google/genai";
import { StudyNote, ClassLevel, Subject, ChapterCategory } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to enforce superscript replacements
const replaceSuperscripts = (text: string): string => {
  const map: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', 
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻'
  };
  // Matches ^ followed by numbers or signs (e.g., ^2, ^-1, ^10)
  return text.replace(/\^([0-9+\-]+)/g, (_, match) => {
    return match.split('').map((c: string) => map[c] || c).join('');
  });
};

// Retry helper for API calls
const retryAPI = async <T>(operation: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    if (retries > 0 && (
      error.status === 429 || 
      error.status === 503 ||
      error.message?.includes('429') || 
      error.message?.includes('RESOURCE_EXHAUSTED') ||
      error.message?.includes('quota')
    )) {
      console.warn(`API Rate limit hit. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryAPI(operation, retries - 1, delay * 2); // Exponential backoff
    }
    throw error;
  }
};

const noteSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    topic: { type: Type.STRING, description: "The specific topic name" },
    subject: { type: Type.STRING, description: "The subject name" },
    classLevel: { type: Type.STRING, description: "The class level" },
    introduction: { type: Type.STRING, description: "A comprehensive and engaging introduction to the topic." },
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          heading: { type: Type.STRING },
          contentPoints: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Detailed knowledge points. Break down the concept into 4-6 distinct, detailed points. Each point must be 2-3 sentences long." 
          },
          bulletPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Short, punchy key takeaways for this section." },
          importantTerms: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Definitions or important keywords." },
          imageDescription: { type: Type.STRING, description: "A highly descriptive visual prompt to generate an educational diagram or illustration for this specific section." }
        },
        required: ["heading", "contentPoints", "bulletPoints"]
      }
    },
    summary: { type: Type.STRING, description: "A detailed summary of the entire topic." },
    examTips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific strategies to answer questions on this topic." },
    solvedQuestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING, description: "A challenging exam-style question." },
          solution: { type: Type.STRING, description: "A step-by-step detailed solution to the question." }
        },
        required: ["question", "solution"]
      }
    },
    commonMistakes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Common errors or misconceptions students have about this topic." },
    realWorldApplications: { type: Type.ARRAY, items: { type: Type.STRING }, description: "How this topic is applied in real life." }
  },
  required: ["topic", "subject", "classLevel", "introduction", "sections", "summary", "examTips", "solvedQuestions", "commonMistakes", "realWorldApplications"]
};

export const generateNotes = async (
  classLevel: ClassLevel,
  subject: Subject,
  topic: string
): Promise<StudyNote> => {
  
  // Using gemini-3-flash-preview for significantly faster generation without losing structural quality
  const prompt = `
    You are an elite academic tutor for CBSE NCERT ${classLevel} ${subject}.
    Create a MASTER CLASS STUDY NOTE for: "${topic}".
    
    CRITICAL:
    1. **SUPERSCRIPTS**: Use Unicode (x², cm³, 10⁻⁶) for all math/units. NO carets (^).
    2. **FORMAT**: Structured "Content Points" (2-3 sentences each). NO long paragraphs.
    3. **DEPTH**: Exhaustive, textbook-quality, 100% NCERT aligned.
    4. **STRUCTURE**:
       - 5-7 distinct sections.
       - "Solved Questions" (3-5 complex exam problems with step-by-step solutions).
       - "Common Mistakes".
       - "Real World Applications".
    5. **VISUALS**: specific, clear image prompts.
  `;

  return retryAPI(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: noteSchema,
        systemInstruction: "You are Scholr, a world-class AI educator. You provide deep, comprehensive educational material formatted as clean, readable points. You always use Unicode superscripts (², ³, ⁻¹) for math.",
      }
    });

    if (response.text) {
      const processedText = replaceSuperscripts(response.text);
      return JSON.parse(processedText) as StudyNote;
    } else {
      throw new Error("Empty response from AI");
    }
  });
};

export const generateImage = async (imagePrompt: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `Educational diagram: ${imagePrompt}. Clean, white background, high definition.` }]
      },
      config: {
        imageConfig: { aspectRatio: '16:9' }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.warn("Error generating image:", error);
    return null;
  }
};

export const getChapters = async (classLevel: ClassLevel, subject: Subject): Promise<ChapterCategory[]> => {
  const prompt = `
    List all official NCERT chapter names for ${classLevel} ${subject}.
    Categorize them strictly:
    - Science (8-10): Physics, Chemistry, Biology.
    - Social Science: History, Geography, Political Science, Economics.
    - Others: Single 'Chapters' category.
    Format: JSON { "categories": [{ "category": "...", "chapters": ["..."] }] }
  `;

  return retryAPI(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            categories: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  chapters: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["category", "chapters"]
              }
            }
          }
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return data.categories || [];
    }
    return [];
  });
};

export const getTutorChat = (): Chat => {
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: "You are the 'Scholr AI Tutor'. You are a friendly, encouraging, and highly knowledgeable tutor for CBSE students (Class 8-12). Answer questions clearly, use simple examples, and keep definitions aligned with NCERT standards. IMPORTANT: Always use Unicode superscripts (e.g. x², cm³) instead of carets for exponents.",
    }
  });
};

export const analyzeSyllabus = async (fileBase64: string, mimeType: string): Promise<string> => {
  // Use gemini-3-flash-preview as it is multimodal and generally has better quota handling for analysis tasks
  return retryAPI(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: fileBase64
            }
          },
          {
            text: "You are a strategic academic advisor. Analyze this syllabus/document. 1) Identify the most critical, high-weightage topics. 2) Create a concise, strategic study plan to help the student ACE their exam (score 100%). 3) Give 3 specific 'Pro Tips'. Format the output in clean Markdown using **bold** for importance and bullet points."
          }
        ]
      }
    });
    
    if (!response.text) throw new Error("No analysis generated");
    return response.text;
  }, 3, 2000).catch(error => {
     console.error("Analysis failed after retries:", error);
     if (error.status === 429 || error.message?.includes('429')) {
       throw new Error("High traffic. We are automatically retrying, but if this persists, please try again in a few minutes.");
     }
     throw error;
  });
};