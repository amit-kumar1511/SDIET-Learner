import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import { StudentPlan } from '../models/StudentPlan.js';
import { User } from '../models/User.js';
import crypto from 'crypto';
import PDFDocument from 'pdfkit';

// Helper to parse HTML rich text to PDFKit format
const parseHtmlToPdf = (doc: any, html: string) => {
  if (!html) return;
  // Simple tag splitter
  const tokens = html.split(/(<\/?[a-zA-Z0-9]+[^>]*>)/g);
  let isBold = false;
  let isItalic = false;
  let isUnderline = false;
  
  for (const token of tokens) {
    if (token.startsWith('<')) {
      const tagContent = token.replace(/[<>]/g, '').trim();
      const tagName = tagContent.split(' ')[0].toLowerCase();
      
      if (tagName === 'b' || tagName === 'strong') {
        isBold = !token.startsWith('</');
      } else if (tagName === 'i' || tagName === 'em') {
        isItalic = !token.startsWith('</');
      } else if (tagName === 'u') {
        isUnderline = !token.startsWith('</');
      } else if (tagName === 'li') {
        if (!token.startsWith('</')) {
          doc.text('  • ', { continued: true });
        } else {
          doc.moveDown(0.2);
        }
      } else if (tagName === 'p' || tagName === 'div') {
        if (token.startsWith('</')) {
          doc.moveDown(0.4);
        }
      } else if (tagName === 'br') {
        doc.moveDown(0.2);
      }
    } else {
      if (!token) continue;
      const text = token
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
      
      let font = 'Helvetica';
      if (isBold && isItalic) {
        font = 'Helvetica-BoldOblique';
      } else if (isBold) {
        font = 'Helvetica-Bold';
      } else if (isItalic) {
        font = 'Helvetica-Oblique';
      }
      
      doc.font(font).fontSize(10);
      doc.text(text, { continued: true, underline: isUnderline });
    }
  }
  // Complete the current text line
  doc.text('', { continued: false });
};

// Consolidated PDF Builder
const generatePdfStream = (plans: any[], student: any, res: Response, titleLabel: string) => {
  try {
    const doc = new PDFDocument({ margin: 40 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline'); // inline preview
    
    doc.pipe(res);
    
    // Header Box
    doc.fillColor('#4f46e5').rect(0, 0, 612, 100).fill();
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(20).text('SDIET STUDENT ACADEMIC PORTAL', 40, 30);
    doc.fontSize(11).text((titleLabel || 'Student Plan').toUpperCase(), 40, 58);
    
    // Student Info Table
    doc.fillColor('#000000');
    doc.y = 120;
    const infoY = doc.y;
    
    doc.rect(40, infoY, 532, 60).fillColor('#f8fafc').rect(40, infoY, 532, 60).strokeColor('#cbd5e1').stroke();
    doc.fillColor('#1e293b');
    
    doc.font('Helvetica-Bold').fontSize(9).text('Student Name:', 55, infoY + 12);
    doc.font('Helvetica').text((student && student.name) || 'N/A', 130, infoY + 12);
    
    doc.font('Helvetica-Bold').text('Branch / Sem:', 55, infoY + 32);
    doc.font('Helvetica').text(`${(student && student.branch) || 'N/A'} - Semester ${(student && student.semester) || 'N/A'}`, 130, infoY + 32);
    
    doc.font('Helvetica-Bold').text('Email Address:', 310, infoY + 12);
    doc.font('Helvetica').text((student && student.email) || 'N/A', 390, infoY + 12);
    
    doc.font('Helvetica-Bold').text('Generated On:', 310, infoY + 32);
    doc.font('Helvetica').text(new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(), 390, infoY + 32);
    
    let currentY = infoY + 80;
    
    if (!plans || plans.length === 0) {
      doc.y = currentY;
      doc.font('Helvetica-Oblique').fontSize(11).text('No plans available to display.', 40, doc.y);
    } else {
      plans.forEach((plan, index) => {
        if (!plan) return;
        if (currentY > 620) {
          doc.addPage();
          currentY = 40;
        }
        
        doc.y = currentY;
        
        // Category Badge Text Map
        const catMap: any = {
          today: 'Today Plan',
          seven_days: '7 Days Plan',
          one_month: '1 Month Plan',
          six_months: '6 Months Plan',
          one_year: '1 Year Plan',
          custom: 'Custom Plan'
        };
        
        // Title bar
        doc.fillColor('#334155').rect(40, doc.y, 532, 22).fill();
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10).text(`${index + 1}. ${plan.title || 'Untitled Plan'}`, 48, doc.y + 6);
        
        const categoryStr = plan.category ? (catMap[plan.category] || plan.category) : 'Plan';
        doc.text(categoryStr.toUpperCase(), 430, doc.y + 6, { align: 'right', width: 130 });
        
        // Meta row
        doc.fillColor('#000000');
        doc.y += 22;
        const metaY = doc.y + 10;
        
        doc.font('Helvetica-Bold').fontSize(8.5).text('Start Date:', 48, metaY);
        doc.font('Helvetica').text(plan.startDate ? new Date(plan.startDate).toLocaleDateString() : 'N/A', 105, metaY);
        
        doc.font('Helvetica-Bold').text('Target Date:', 185, metaY);
        doc.font('Helvetica').text(plan.targetDate ? new Date(plan.targetDate).toLocaleDateString() : 'N/A', 245, metaY);
        
        doc.font('Helvetica-Bold').text('Status:', 350, metaY);
        
        // Status formatting
        const statusColors: any = {
          pending: '#d97706', // dark amber
          in_progress: '#2563eb', // dark blue
          completed: '#16a34a' // dark green
        };
        const statusLabels: any = {
          pending: 'Pending',
          in_progress: 'In Progress',
          completed: 'Completed'
        };
        
        doc.fillColor(statusColors[plan.status] || '#000000').font('Helvetica-Bold').text(statusLabels[plan.status] || plan.status || 'Pending', 390, metaY);
        doc.fillColor('#1e293b');
        
        // Description Section
        doc.y = metaY + 20;
        doc.font('Helvetica-Bold').fontSize(9).text('PLAN CONTENT:', 48, doc.y);
        doc.y += 12;
        
        doc.x = 48;
        parseHtmlToPdf(doc, plan.content || '');
        
        // Draw horizontal line separator
        doc.y += 15;
        doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(40, doc.y).lineTo(572, doc.y).stroke();
        
        currentY = doc.y + 20;
      });
    }
    
    doc.end();
  } catch (err: any) {
    console.error("Error generating PDF:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error generating PDF', error: err.message });
    } else {
      res.end();
    }
  }
};

// @desc    Create new plan
// @route   POST /api/student/plans
// @access  Private (Student only)
export const createPlan = asyncHandler(async (req: any, res: Response) => {
  const { title, category, startDate, targetDate, content, plainTextContent, status } = req.body;
  
  const plan = await StudentPlan.create({
    studentId: req.user._id,
    title,
    category,
    startDate,
    targetDate,
    content,
    plainTextContent,
    status
  });
  
  res.status(201).json(plan);
});

// @desc    Get all plans for logged-in student
// @route   GET /api/student/plans
// @access  Private (Student only)
export const getPlans = asyncHandler(async (req: any, res: Response) => {
  const plans = await StudentPlan.find({ studentId: req.user._id }).sort({ createdAt: -1 });
  res.json(plans);
});

// @desc    Get single plan
// @route   GET /api/student/plans/:id
// @access  Private (Student only)
export const getPlanById = asyncHandler(async (req: any, res: Response) => {
  const plan = await StudentPlan.findOne({ _id: req.params.id, studentId: req.user._id });
  if (!plan) {
    res.status(404);
    throw new Error('Plan not found or unauthorized');
  }
  res.json(plan);
});

// @desc    Update plan
// @route   PUT /api/student/plans/:id
// @access  Private (Student only)
export const updatePlan = asyncHandler(async (req: any, res: Response) => {
  const plan = await StudentPlan.findOne({ _id: req.params.id, studentId: req.user._id });
  
  if (!plan) {
    res.status(404);
    throw new Error('Plan not found or unauthorized');
  }
  
  const { title, category, startDate, targetDate, content, plainTextContent, status } = req.body;
  
  plan.title = title !== undefined ? title : plan.title;
  plan.category = category !== undefined ? category : plan.category;
  plan.startDate = startDate !== undefined ? startDate : plan.startDate;
  plan.targetDate = targetDate !== undefined ? targetDate : plan.targetDate;
  plan.content = content !== undefined ? content : plan.content;
  plan.plainTextContent = plainTextContent !== undefined ? plainTextContent : plan.plainTextContent;
  plan.status = status !== undefined ? status : plan.status;
  
  await plan.save();
  res.json(plan);
});

// @desc    Delete plan
// @route   DELETE /api/student/plans/:id
// @access  Private (Student only)
export const deletePlan = asyncHandler(async (req: any, res: Response) => {
  const plan = await StudentPlan.findOne({ _id: req.params.id, studentId: req.user._id });
  
  if (!plan) {
    res.status(404);
    throw new Error('Plan not found or unauthorized');
  }
  
  await plan.deleteOne();
  res.json({ message: 'Plan removed' });
});

// @desc    Download single plan PDF
// @route   GET /api/student/plans/:id/pdf
// @access  Private (Student only)
export const downloadSinglePlanPDF = asyncHandler(async (req: any, res: Response) => {
  const plan = await StudentPlan.findOne({ _id: req.params.id, studentId: req.user._id });
  if (!plan) {
    res.status(404);
    throw new Error('Plan not found or unauthorized');
  }
  
  const student = await User.findById(req.user._id);
  generatePdfStream([plan], student, res, `Student Plan: ${plan.title}`);
});

// @desc    Download all plans PDF
// @route   GET /api/student/plans/pdf/all
// @access  Private (Student only)
export const downloadAllPlansPDF = asyncHandler(async (req: any, res: Response) => {
  const plans = await StudentPlan.find({ studentId: req.user._id }).sort({ createdAt: -1 });
  const student = await User.findById(req.user._id);
  generatePdfStream(plans, student, res, 'All Student Plans & Targets');
});

// @desc    Download category-wise plans PDF
// @route   GET /api/student/plans/pdf/category/:category
// @access  Private (Student only)
export const downloadCategoryPlansPDF = asyncHandler(async (req: any, res: Response) => {
  const plans = await StudentPlan.find({ 
    studentId: req.user._id, 
    category: req.params.category 
  }).sort({ createdAt: -1 });
  
  const student = await User.findById(req.user._id);
  generatePdfStream(plans, student, res, `${req.params.category} Plan Summary`);
});

// @desc    Generate shareable read-only PDF link
// @route   POST /api/student/plans/:id/share-link
// @access  Private (Student only)
export const generateShareLink = asyncHandler(async (req: any, res: Response) => {
  const plan = await StudentPlan.findOne({ _id: req.params.id, studentId: req.user._id });
  
  if (!plan) {
    res.status(404);
    throw new Error('Plan not found or unauthorized');
  }
  
  if (!plan.shareToken) {
    plan.shareToken = crypto.randomBytes(16).toString('hex');
  }
  
  plan.isShared = true;
  await plan.save();
  
  res.json({ 
    shareToken: plan.shareToken,
    shareUrl: `/api/share/plans/${plan.shareToken}` 
  });
});

// @desc    Open shared plan PDF using token
// @route   GET /api/share/plans/:shareToken
// @access  Public (No auth needed)
export const getSharedPlanPDF = asyncHandler(async (req: Request, res: Response) => {
  const plan = await StudentPlan.findOne({ 
    shareToken: req.params.shareToken, 
    isShared: true 
  }).populate('studentId', 'name branch semester email');
  
  if (!plan) {
    res.status(404);
    throw new Error('Shared plan not found or sharing has been disabled');
  }
  
  const student = plan.studentId;
  generatePdfStream([plan], student, res, 'Shared Student Plan (Read-Only)');
});
