import '../config/env.js';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { StudentPlan } from '../models/StudentPlan.js';
import { downloadAllPlansPDF } from '../controllers/studentPlanController.js';
import { Writable } from 'stream';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined in environment variables");
  process.exit(1);
}

// Simple mock response
class MockResponse extends Writable {
  statusCode = 200;
  headers: Record<string, string> = {};
  buffers: Buffer[] = [];
  
  setHeader(name: string, value: string) {
    this.headers[name] = value;
    return this;
  }
  
  _write(chunk: any, encoding: string, callback: (error?: Error | null) => void) {
    this.buffers.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding as any));
    callback();
  }
  
  getBuffer() {
    return Buffer.concat(this.buffers);
  }
  
  status(code: number) {
    this.statusCode = code;
    return this;
  }
  
  json(body: any) {
    console.log("JSON response sent:", body);
    this.emit('end');
    return this;
  }
}

async function test() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI!);
    console.log("Connected!");

    // Find any student
    let student = await User.findOne({ role: 'STUDENT' });
    if (!student) {
      student = await User.findOne({});
    }
    
    if (!student) {
      console.error("No student/user found in DB to test with.");
      process.exit(1);
    }
    
    console.log(`Using student: ${student.name} (${student._id})`);
    
    // Find or create a plan
    let plan = await StudentPlan.findOne({ studentId: student._id });
    if (!plan) {
      console.log("Creating a dummy plan...");
      plan = await StudentPlan.create({
        studentId: student._id,
        title: "Test Revision Plan",
        category: "seven_days",
        startDate: new Date(),
        targetDate: new Date(Date.now() + 7*24*60*60*1000),
        content: "<div>This is <b>bold</b> and <i>italic</i> notes.<ul><li>Task 1</li><li>Task 2</li></ul></div>",
        plainTextContent: "This is bold and italic notes. Task 1 Task 2",
        status: "in_progress"
      });
    }
    
    console.log(`Using plan: ${plan.title} (${plan._id})`);
    
    // Mock req and res
    const req: any = {
      method: 'GET',
      url: '/api/student/plans/pdf/all',
      user: student,
      params: {}
    };
    
    const res = new MockResponse();
    
    console.log("Calling downloadAllPlansPDF...");
    
    const runController = () => new Promise<void>((resolve, reject) => {
      res.on('finish', () => {
        console.log("Response stream finished!");
        resolve();
      });
      res.on('error', (err) => {
        reject(err);
      });
      
      downloadAllPlansPDF(req, res as any, (err: any) => {
        if (err) reject(err);
      });
    });
    
    await runController();
    
    console.log("Controller completed successfully!");
    const data = res.getBuffer();
    console.log(`Generated PDF byte size: ${data.length}`);
    console.log("Headers:", res.headers);
    process.exit(0);
  } catch (err) {
    console.error("Test failed with error:", err);
    process.exit(1);
  }
}

test();
