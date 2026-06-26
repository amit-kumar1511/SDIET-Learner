import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendTeacherMail = async ({ to, password, subjectName }: { to: string; password: string; subjectName: string }) => {
  try {
    const info = await transporter.sendMail({
      from: `"SDIET Learner" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Teacher Role Assigned",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #2c3e50; text-align: center;">Welcome to College Portal 🎓</h2>
          <p style="font-size: 16px; color: #34495e;">You have been assigned as a teacher.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
            <p style="margin: 5px 0;"><b>Email:</b> ${to}</p>
            <p style="margin: 5px 0;"><b>Password:</b> ${password}</p>
            <p style="margin: 5px 0;"><b>Subject:</b> ${subjectName}</p>
          </div>
          <p style="font-size: 14px; color: #7f8c8d; margin-top: 20px;">Please login and change your password as soon as possible.</p>
        </div>
      `,
    });

    console.log("Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Mail error:", error);
    return false;
  }
};

export const sendAssignmentMail = async ({ to, branch, semester, subjects }: { to: string; branch: string; semester: number; subjects: string[] }) => {
  try {
    const info = await transporter.sendMail({
      from: `"SDIET Learner" <${process.env.EMAIL_USER}>`,
      to,
      subject: "New Subject/Branch Assigned",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #4f46e5; text-align: center;">New Teacher Assignment 📚</h2>
          <p style="font-size: 16px; color: #34495e;">Hello, you have been assigned new responsibilities in the College Portal.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>
          
          <div style="background-color: #f0f7ff; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <p style="margin: 5px 0; color: #1e40af;"><b>Branch:</b> ${branch}</p>
            <p style="margin: 5px 0; color: #1e40af;"><b>Semester:</b> ${semester}</p>
            <p style="margin: 15px 0 5px 0; font-weight: bold; color: #1e3a8a;">Assigned Subjects:</p>
            <ul style="margin: 5px 0; padding-left: 20px; color: #1e3a8a;">
              ${subjects.map(s => `<li>${s}</li>`).join('')}
            </ul>
          </div>

          <p style="font-size: 15px; color: #34495e; line-height: 1.5;">
            Please login to your dashboard to view the course materials and start interacting with your students.
          </p>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="font-size: 13px; color: #94a3b8;">Please check your dashboard for more details.</p>
          </div>
        </div>
      `,
    });

    console.log("Assignment Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Assignment Mail error:", error);
    return false;
  }
};

export const sendNoteMail = async ({ bcc, subjectName, type, title, branch, semester }: { bcc: string[]; subjectName: string; type: string; title: string, branch: string, semester: number }) => {
  try {
    const info = await transporter.sendMail({
      from: `"SDIET Learner" <${process.env.EMAIL_USER}>`,
      to: `"Students" <${process.env.EMAIL_USER}>`, // Hide recipients
      bcc,
      subject: `New ${type} Uploaded: ${subjectName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #4f46e5; text-align: center;">New ${type} Available 📚</h2>
          <p style="font-size: 16px; color: #34495e;">Hello Student, a new material has been uploaded for your subject.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>
          
          <div style="background-color: #f0f7ff; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <p style="margin: 5px 0; color: #1e40af;"><b>Subject:</b> ${subjectName}</p>
            <p style="margin: 5px 0; color: #1e40af;"><b>Type:</b> ${type}</p>
            <p style="margin: 5px 0; color: #1e40af;"><b>Title:</b> ${title}</p>
            <p style="margin: 5px 0; color: #1e40af;"><b>For:</b> ${branch} - Sem ${semester}</p>
          </div>

          <p style="font-size: 15px; color: #34495e; line-height: 1.5;">
            Please login to your College Portal dashboard to view the materials.
          </p>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="font-size: 13px; color: #94a3b8;">College Portal System</p>
          </div>
        </div>
      `,
    });

    console.log("Material Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Material Mail error:", error);
    return false;
  }
};

export const sendReminderMail = async ({ bcc, title, content, expiryDate }: { bcc: string[]; title: string; content: string; expiryDate: string }) => {
  try {
    const info = await transporter.sendMail({
      from: `"SDIET Learner" <${process.env.EMAIL_USER}>`,
      to: `"Students" <${process.env.EMAIL_USER}>`,
      bcc,
      subject: `Important Reminder: ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #d97706; text-align: center;">Important Reminder ⏰</h2>
          <p style="font-size: 16px; color: #34495e;">Hello Student, you have a new reminder from the faculty/admin.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>
          
          <div style="background-color: #fffbeb; border: 1px solid #fde68a; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #b45309;">${title}</h3>
            <p style="white-space: pre-wrap; color: #78350f; line-height: 1.5;">${content}</p>
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #fde68a; font-size: 14px; color: #92400e;">
              <strong>Expires on:</strong> ${expiryDate}
            </div>
          </div>

          <p style="font-size: 15px; color: #34495e; line-height: 1.5;">
            Please log in to your dashboard to review this reminder and take any necessary actions.
          </p>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="font-size: 13px; color: #94a3b8;">College Portal System</p>
          </div>
        </div>
      `,
    });

    console.log("Reminder Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Reminder Mail error:", error);
    return false;
  }
};

export const sendEventNoticeMail = async ({ bcc, type, title, description }: { bcc: string[]; type: 'Event' | 'Notice'; title: string; description: string }) => {
  try {
    const info = await transporter.sendMail({
      from: `"SDIET Learner" <${process.env.EMAIL_USER}>`,
      to: `"Students" <${process.env.EMAIL_USER}>`,
      bcc,
      subject: `New ${type}: ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #0ea5e9; text-align: center;">New Campus ${type} 📢</h2>
          <p style="font-size: 16px; color: #34495e;">Hello Student, a new ${type.toLowerCase()} has been announced on the portal.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>
          
          <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #0369a1;">${title}</h3>
            <p style="white-space: pre-wrap; color: #0c4a6e; line-height: 1.5;">${description}</p>
          </div>

          <p style="font-size: 15px; color: #34495e; line-height: 1.5;">
            Please log in to your dashboard to view complete details, including any attachments.
          </p>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="font-size: 13px; color: #94a3b8;">College Campus System</p>
          </div>
        </div>
      `,
    });

    console.log(`${type} Email sent:`, info.messageId);
    return true;
  } catch (error) {
    console.error(`${type} Mail error:`, error);
    return false;
  }
};

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const info = await transporter.sendMail({
      from: `"SDIET Learner" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log("Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};
