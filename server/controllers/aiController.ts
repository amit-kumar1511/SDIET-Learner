import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { AISession } from '../models/AISession.js';
import { AIChatHistory } from '../models/AIChatHistory.js';
import { Note } from '../models/Note.js';
import { Subject } from '../models/Subject.js';
import { generateTeacherResponse, extractTextFromPdf, extractTextFromImage } from '../utils/gemini.js';

// @desc    Create new AI Teacher Session
// @route   POST /api/ai/sessions
// @access  Private
export const startAISession = asyncHandler(async (req: any, res: Response) => {
  const { subjectId, semester, topic, mode } = req.body;

  if (!subjectId || !semester || !topic || !mode) {
    res.status(400);
    throw new Error('Please provide subjectId, semester, topic, and mode');
  }

  const subject = await Subject.findById(subjectId);
  if (!subject) {
    res.status(404);
    throw new Error('Subject not found');
  }

  // Create active session
  const session = await AISession.create({
    userId: req.user._id,
    subjectId,
    semester,
    topic,
    mode,
    title: `${topic} (${mode})`,
    isActive: true,
  });

  // Seeds a welcoming starting message by AI Dr. Aisha
  const welcomeContent = `Hello! I am Dr. Aisha, your AI specialized tutor. Welcome to our session on **${topic}** for the subject **${subject.name}**. 
  
I have updated my knowledge base with all matching uploaded nodes for this subject! Let me know if you would like me to explain this topic, summarize it, quiz you (Viva / MCQ), or help with custom queries. How would you like to start?`;

  const welcomeMessage = await AIChatHistory.create({
    userId: req.user._id,
    sessionId: session._id,
    sender: 'model',
    content: welcomeContent,
  });

  res.status(201).json({
    session,
    welcomeMessage,
  });
});



// @desc    Get single AI session with chat messages
// @route   GET /api/ai/sessions/:sessionId
// @access  Private
export const getAISessionDetail = asyncHandler(async (req: any, res: Response) => {
  const { sessionId } = req.params;
  const session = await AISession.findOne({ _id: sessionId, userId: req.user._id })
    .populate('subjectId', 'name');

  if (!session) {
    res.status(404);
    throw new Error('AI Session not found or unauthorized');
  }

  const messages = await AIChatHistory.find({ sessionId }).sort({ createdAt: 1 });
  res.json({ session, messages });
});

// @desc    End/Close an AI tutor session
// @route   PATCH /api/ai/sessions/:sessionId/end
// @access  Private
export const endAISession = asyncHandler(async (req: any, res: Response) => {
  const { sessionId } = req.params;
  const session = await AISession.findOneAndUpdate(
    { _id: sessionId, userId: req.user._id },
    { isActive: false },
    { new: true }
  );

  if (!session) {
    res.status(404);
    throw new Error('AI Session not found');
  }

  res.json(session);
});

// @desc    Clear chat history for an AI session
// @route   DELETE /api/ai/sessions/:sessionId/chat
// @access  Private
export const clearAIChat = asyncHandler(async (req: any, res: Response) => {
  const { sessionId } = req.params;
  const session = await AISession.findOne({ _id: sessionId, userId: req.user._id });

  if (!session) {
    res.status(404);
    throw new Error('AI Session not found');
  }

  await AIChatHistory.deleteMany({ sessionId });

  // Re-seed original welcoming starting message
  const welcomeContent = `System: Chat cleared! Ask me anything about the notes context of this subject.`;
  const welcomeMessage = await AIChatHistory.create({
    userId: req.user._id,
    sessionId: session._id,
    sender: 'model',
    content: welcomeContent,
  });

  res.json({ message: 'Chat history cleared successfully', welcomeMessage });
});

// @desc    Send details to Gemini and get teacher explanation
// @route   POST /api/ai/chat
// @access  Private
export const sendAIChatMessage = asyncHandler(async (req: any, res: Response) => {
  const { sessionId, prompt } = req.body;

  if (!sessionId || !prompt) {
    res.status(400);
    throw new Error('Please provide sessionId and prompt');
  }

  const session = await AISession.findOne({ _id: sessionId, userId: req.user._id })
    .populate('subjectId');

  if (!session) {
    res.status(404);
    throw new Error('AI Session not found');
  }

  const subject = session.subjectId as any;
  if (!subject) {
    res.status(404);
    throw new Error('Subject mapped to session not found');
  }

  // Fetch subject notes and compile PDF/image extracted text as knowledge context
  const notes = await Note.find({ subjectId: subject._id });
  
  // Lazy / On-the-fly text extraction for any previously uploaded notes missing extracted text
  for (const n of notes) {
    if (!n.extractedText || n.extractedText.trim().length === 0) {
      try {
        console.log(`On-the-fly text extraction starting for Note: "${n.title}" (type: ${n.fileType}) from path/url: ${n.fileUrl}`);
        let text = '';
        if (n.fileType === 'pdf') {
          text = await extractTextFromPdf(n.fileUrl);
        } else if (n.fileType === 'image') {
          text = await extractTextFromImage(n.fileUrl);
        }
        
        if (text && text.trim().length > 0) {
          n.extractedText = text;
          await Note.updateOne({ _id: n._id }, { $set: { extractedText: text } });
          console.log(`On-the-fly text extraction successful for Note: "${n.title}"! Saved to database.`);
        }
      } catch (err) {
        console.error(`Failed on-the-fly text extraction for Note: "${n.title}":`, err);
      }
    }
  }

  let knowledgeBase = '';
  if (notes && notes.length > 0) {
    const textsArray = notes
      .filter((n) => n.extractedText && n.extractedText.trim().length > 0)
      .map((n) => `--- Note (${n.fileType || 'Document'}): ${n.title} ---\n${n.extractedText}\n`);
    
    knowledgeBase = textsArray.join('\n');
  }

  // Fetch past 15 messages for local session history context memory
  const rawHistory = await AIChatHistory.find({ sessionId }).sort({ createdAt: -1 }).limit(15);
  // Sort ascending for chronological ordering
  const history = rawHistory.reverse().map((msg) => ({
    sender: msg.sender as 'user' | 'model',
    content: msg.content,
  }));

  // Save student's user message first
  const userMessage = await AIChatHistory.create({
    userId: req.user._id,
    sessionId: session._id,
    sender: 'user',
    content: prompt,
  });

  let aiResponseText = '';
  try {
    // Fire Gemini API
    aiResponseText = await generateTeacherResponse({
      mode: session.mode as any,
      subjectName: subject.name,
      topic: session.topic,
      contextNotesText: knowledgeBase,
      prompt,
      history,
    });
  } catch (err: any) {
    console.error('Gemini call failure:', err);
    aiResponseText = `I encountered an unexpected issue while consulting my knowledge files. Error: ${err.message || 'Unknown error'}`;
  }

  // Save AI's response message
  const aiMessage = await AIChatHistory.create({
    userId: req.user._id,
    sessionId: session._id,
    sender: 'model',
    content: aiResponseText,
  });

  res.status(200).json({
    userMessage,
    aiMessage,
  });
});
