import { GoogleGenAI } from '@google/genai';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as pdfParse from 'pdf-parse';

let aiInstance: GoogleGenAI | null = null;

export function getAIClient(): GoogleGenAI {
  if (!aiInstance) {
    let key = process.env.GEMINI_API_KEY?.trim();
    const fallbackKey = 'AIzaSyD3S-ZA_zz19-sXoH_8qvjb9ApWBnORddU';
    
    // Fallback if key is missing, a placeholder, or doesn't start with Gemini prefix 'AIzaSy'
    if (!key || key.includes('MY_GEMINI_API_KEY') || !key.startsWith('AIzaSy')) {
      key = fallbackKey;
    }
    
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

export async function extractTextFromPdf(fileUrl: string): Promise<string> {
  try {
    console.log(`Starting PDF text extraction from: ${fileUrl}`);
    let pdfBuffer: Buffer;
    if (fileUrl.startsWith('http')) {
      const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
      pdfBuffer = Buffer.from(response.data);
    } else {
      const localPath = path.isAbsolute(fileUrl) ? fileUrl : path.join(process.cwd(), fileUrl);
      pdfBuffer = fs.readFileSync(localPath);
    }

    const fn = (pdfParse as any).default || pdfParse;
    const parsedData = await fn(pdfBuffer);
    const extracted = parsedData.text || '';
    console.log(`PDF text extraction success. Length: ${extracted.length}`);
    return extracted;
  } catch (err: any) {
    console.error(`Error extracting text from PDF at ${fileUrl}:`, err);
    return '';
  }
}

export async function extractTextFromImage(fileUrl: string): Promise<string> {
  const client = getAIClient();
  try {
    console.log(`Starting Image text extraction (OCR) via Gemini from: ${fileUrl}`);
    let imageBuffer: Buffer;
    if (fileUrl.startsWith('http')) {
      const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
      imageBuffer = Buffer.from(response.data);
    } else {
      const localPath = path.isAbsolute(fileUrl) ? fileUrl : path.join(process.cwd(), fileUrl);
      imageBuffer = fs.readFileSync(localPath);
    }

    let mimeType = 'image/jpeg';
    if (fileUrl.toLowerCase().endsWith('.png')) {
      mimeType = 'image/png';
    } else if (fileUrl.toLowerCase().endsWith('.webp')) {
      mimeType = 'image/webp';
    } else if (fileUrl.toLowerCase().endsWith('.gif')) {
      mimeType = 'image/gif';
    }

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType,
            data: imageBuffer.toString('base64'),
          },
        },
        'Extract all educational/academic notes, handwriting, tables, definitions, diagrams text, or standard text from this study sheet image. Transcribe it beautifully and accurately in readable markdown format. Do not add any conversational meta commentary - output only the extracted content. If the image contains zero legible words, return an empty string.',
      ],
    });

    const text = response.text?.trim() || '';
    console.log(`Image Gemini OCR success. Length: ${text.length}`);
    return text;
  } catch (err: any) {
    console.error(`Error extracting text from Image at ${fileUrl}:`, err);
    return '';
  }
}

interface GenerateParams {
  mode: 'Explain Topic' | 'Quick Summary' | 'Viva Questions' | 'MCQ Generator' | 'Revision Mode';
  subjectName: string;
  topic: string;
  contextNotesText: string;
  prompt: string;
  history: Array<{ sender: 'user' | 'model'; content: string }>;
}

export async function generateTeacherResponse({
  mode,
  subjectName,
  topic,
  contextNotesText,
  prompt,
  history,
}: GenerateParams): Promise<string> {
  const client = getAIClient();

  const truncatedContext = contextNotesText && contextNotesText.trim().length > 0 
    ? contextNotesText.slice(0, 120000) 
    : 'NO_CONTEXT_AVAILABLE';

  const systemInstruction = `You are a warm, highly-supportive, and engaging AI college teacher named Dr. Aisha.
Your task is to conduct a personalized dynamic tutoring session with the student on the subject: "${subjectName}", specifically focusing on the topic: "${topic}".

STRICT RULE:
- You must answer ONLY from the provided notes text context.
- If the context notes text is "NO_CONTEXT_AVAILABLE", or if the context notes do not contain sufficient information to explain the requested topic/question, you MUST answer exactly: "This topic is not available in uploaded notes." and nothing else.
- Do not make up answers, do not use external internet knowledge if the information isn't in the uploaded notes.

Teaching Modes Behavior:
1. Explain Topic: Provide a clear, structured, and pedagogical explanation of the concepts, complete with easy-to-understand examples and analogy-based teaching from the notes.
2. Quick Summary: Summarize the key points in an elegant, quick, highly-scannable bulleted fashion.
3. Viva Questions: Generate 5 relevant practical or oral questions based on the notes context to test the student's understanding, without printing answers immediately unless they ask.
4. MCQ Generator: Generate 4 interactive multiple-choice questions from the notes, with a clean format including options (A, B, C, D) and hide answers at the bottom.
5. Revision Mode: Provide a summary of the core equations, definitions, or bullet-point summaries of formulas for rapid study.

Your response MUST be formatted in clean, human-readable Markdown with bolding, lists, and headers where appropriate. Do not output raw JSON. Always respond in simple, empathetic, encouraging academic language.`;

  // Format previous history into Gemini contents format
  const chatContents = history.map((msg) => ({
    role: msg.sender === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));

  // Append context explanation alongside prompt
  let finalPrompt = `[Teaching Mode: ${mode}]
[Topic: ${topic}]
[Subject: ${subjectName}]

--- UPLOADED NOTES CONTEXT START ---
${truncatedContext}
--- UPLOADED NOTES CONTEXT END ---

Student's Message/Question: ${prompt}

Remember: If the target topic is missing or unaddressed in the context notes above, reply with exactly: "This topic is not available in uploaded notes."`;

  chatContents.push({
    role: 'user',
    parts: [{ text: finalPrompt }],
  });

  const response = await client.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: chatContents as any,
    config: {
      systemInstruction,
      temperature: 0.2, // lower temperature to strictly adhere to notes context
    },
  });

  return response.text || '';
}
