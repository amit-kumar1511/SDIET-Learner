import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Calendar, 
  Bell, 
  ChevronRight, 
  CheckCircle2, 
  Users, 
  ShieldCheck, 
  Zap, 
  ChevronDown,
  Github,
  Twitter,
  Linkedin,
  Mail,
  GraduationCap,
  MessageCircle,
  Briefcase,
  Sparkles,
  ArrowRight,
  HelpCircle,
  MapPin,
  Clock,
  ThumbsUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { InstallPWAFooterButton } from '../components/InstallPWAFooterButton';

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-200 dark:border-slate-800/80">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex justify-between items-center text-left focus:outline-none group"
      >
        <span className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-100 transition-colors"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LandingPage = () => {
  const { user } = useAuth();

  const faqs = [
    {
      question: "How do I access study materials?",
      answer: "Once you log in, you can navigate to the Subjects section. From there, select your branch and semester to see all available notes, PYQs, and assignments."
    },
    {
      question: "Are the notes verified by teachers?",
      answer: "Yes! Most of the content on SDIET Learner is uploaded and verified by the respective subject teachers to ensure accuracy and quality."
    },
    {
      question: "Can I ask doubts directly to teachers?",
      answer: "Absolutely. Each subject page has a dedicated Doubt Chat where you can post your queries, and teachers can respond to them in real-time."
    },
    {
      question: "Is there a mobile app available?",
      answer: "SDIET Learner is a progressive web application, meaning it works perfectly on all mobile browsers and can be added to your home screen for an app-like experience."
    }
  ];

  const features = [
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Course syllabus guidance",
      desc: "Easily understandable syllabus breakdowns to keep you on track."
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Student's doubts",
      desc: "Dedicated space to ask doubts and get solved files from teachers."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Real-time alerts",
      desc: "Immediate notifications for notice board updates and events."
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: "Lab Manual logs",
      desc: "Laboratory guides with step-by-step practical screenshots."
    },
    {
      icon: <Briefcase className="w-6 h-6" />,
      title: "Placement Resources",
      desc: "Interview preparation materials, templates, and resume guidelines."
    },
    {
      icon: <GraduationCap className="w-6 h-6" />,
      title: "Previous Year Papers",
      desc: "Solved PYQs arranged unit-wise for quick exam revision."
    }
  ];



  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" as any }
    }
  };

  return (
    <div className="bg-slate-50 text-slate-800 dark:bg-[#050814] dark:text-slate-100 min-h-screen relative overflow-hidden font-sans selection:bg-indigo-500/30 selection:text-indigo-200 transition-colors duration-300">
      
      {/* Background grids and glowing radial gradients */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />
      <div className="absolute top-[-10%] left-[-20%] w-[60%] h-[50%] rounded-full bg-violet-600/10 dark:bg-violet-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[50%] h-[60%] rounded-full bg-indigo-600/5 dark:bg-indigo-600/8 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-20%] w-[60%] h-[50%] rounded-full bg-purple-700/5 dark:bg-purple-700/8 blur-[140px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6 sm:px-12 md:px-20 lg:px-32 w-full flex flex-col items-center text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-500/20 mb-8 backdrop-blur-sm cursor-default"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-700 dark:text-indigo-300">
            For Satyug Darshan (SDIET) Students
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-5xl leading-[1.08] mb-6"
        >
          Teacher-Verified <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 dark:from-violet-400 dark:via-indigo-300 dark:to-purple-400">
            Study Materials
          </span> for SDIET Students
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed mb-10 font-medium"
        >
          Access solved notes, practical lab manuals, PYQs, and announcements directly approved by your course coordinators & subject teachers.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-16"
        >
          <Link
            to={user ? "/dashboard" : "/login"}
            className="w-full sm:w-auto px-10 py-4.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold rounded-2xl transition-all duration-300 shadow-[0_0_30px_rgba(99,102,241,0.2)] hover:shadow-[0_0_40px_rgba(99,102,241,0.4)] flex items-center justify-center space-x-2 group text-sm uppercase tracking-wider"
          >
            <span>Enter Portal</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Rated status badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="inline-flex items-center space-x-2.5 bg-white dark:bg-slate-950/55 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800/80 mb-16 backdrop-blur-md shadow-sm"
        >
          <div className="flex -space-x-1.5">
            {[1, 2, 3, 4].map((x) => (
              <div key={x} className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 border border-white dark:border-slate-950 flex items-center justify-center text-[8px] font-black text-indigo-600 dark:text-indigo-400">
                {x}
              </div>
            ))}
          </div>
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
            Trusted & Used by <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">2,000+ Students</span>
          </span>
        </motion.div>

        {/* Benefit tags */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl"
        >
          {[
            "Created by Faculty",
            "Unit-wise Roadmap",
            "Lab Manuals Included",
            "Download Sheets"
          ].map((tag, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="flex items-center space-x-3 bg-white dark:bg-slate-950/45 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-900 backdrop-blur-sm hover:bg-slate-100/50 dark:hover:bg-slate-900/30 transition-colors shadow-sm"
            >
              <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0 text-indigo-600 dark:text-indigo-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{tag}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Curriculum Grid Section */}
      <section className="py-24 px-6 sm:px-12 md:px-20 lg:px-32 w-full z-10 relative">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400">Services and learning assistance</span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mt-3 mb-6">Simple and meaningful curriculum</h2>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Benefit from excellent learner support order in all our recommended categories:</p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feat, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ y: -6, borderColor: 'rgba(99,102,241,0.25)' }}
              className="bg-white/80 dark:bg-slate-950/40 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-900/60 backdrop-blur-md shadow-lg dark:shadow-xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all flex flex-col relative group overflow-hidden"
            >
              {/* Subtle hover background highlight */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-indigo-500/0 group-hover:from-indigo-500/5 group-hover:to-transparent transition-all duration-300" />
              
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                {feat.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{feat.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-medium">{feat.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Syllabus breakdown roadmap highlight */}
      <section className="py-12 px-6 sm:px-12 md:px-20 lg:px-32 w-full z-10 relative">
        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Syllabus Roadmap Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-8 bg-white/80 dark:bg-slate-950/40 p-8 md:p-12 rounded-[2.5rem] border border-slate-200 dark:border-slate-900/60 backdrop-blur-md flex flex-col sm:flex-row justify-between sm:items-center gap-8 relative overflow-hidden shadow-lg dark:shadow-xl"
          >
            <div className="space-y-4 max-w-lg z-10">
              <div className="w-12 h-12 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-purple-600 dark:text-purple-400 block">Syllabus Breakdowns</span>
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">Syllabus Roadmap</h3>
              <p className="text-slate-650 dark:text-slate-400 text-sm font-medium leading-relaxed">
                Align your syllabus unit by unit with our curated structure. We cover engineering disciplines, science, humanities, and coding roadmaps.
              </p>
            </div>
            
            <div className="z-10 flex-shrink-0">
              <Link
                to="/subjects"
                className="inline-flex items-center px-6 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all font-bold text-sm uppercase tracking-wider group shadow-sm"
              >
                <span>Explore Syllabus</span>
                <ChevronRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

          {/* Sub-actions container */}
          <div className="lg:col-span-4 grid grid-rows-2 gap-4">
            
            {/* Office Hours */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ borderColor: 'rgba(99,102,241,0.2)' }}
              className="bg-white/80 dark:bg-slate-950/40 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-900/60 backdrop-blur-md flex items-center justify-between group cursor-pointer shadow-lg dark:shadow-xl"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Office Hours</h4>
                  <p className="text-xs text-slate-500">Connect with educators</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 dark:text-slate-600 group-hover:translate-x-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all" />
            </motion.div>

            {/* Testimonials */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ borderColor: 'rgba(168,85,247,0.2)' }}
              className="bg-white/80 dark:bg-slate-950/40 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-900/60 backdrop-blur-md flex items-center justify-between group cursor-pointer shadow-lg dark:shadow-xl"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ThumbsUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Testimonials</h4>
                  <p className="text-xs text-slate-500">What our peers say</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 dark:text-slate-600 group-hover:translate-x-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-all" />
            </motion.div>

          </div>
        </div>
      </section>



      {/* FAQ Section */}
      <section className="py-24 px-6 sm:px-12 md:px-20 lg:px-32 w-full max-w-5xl mx-auto z-10 relative">
        <div className="text-center mb-16">
          <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400">Frequently asked questions</span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mt-3">Got Questions?</h2>
        </div>
        <div className="space-y-1 bg-white/80 dark:bg-slate-950/30 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-900/60 backdrop-blur-md shadow-lg dark:shadow-xl">
          {faqs.map((faq, i) => (
            <FAQItem key={i} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 sm:px-12 md:px-20 lg:px-32 w-full z-10 relative text-center">
        <div className="bg-gradient-to-b from-indigo-50 to-slate-100/50 dark:from-indigo-950/20 dark:to-slate-950/60 border border-indigo-100 dark:border-indigo-500/10 p-12 md:p-20 rounded-[3.5rem] backdrop-blur-xl relative overflow-hidden shadow-lg dark:shadow-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-indigo-600/10 blur-[80px] pointer-events-none" />
          
          <h2 className="text-3xl md:text-6xl font-black text-slate-900 dark:text-white mb-6">Start learning smarter today.</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Join thousands of Satyug Darshan engineering and management students who are already using the platform to secure high notes and clear doubts.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-10 py-4.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all duration-300 text-sm uppercase tracking-wider flex items-center justify-center"
            >
              Create Account
            </Link>
            <Link
              to={user ? "/dashboard" : "/login"}
              className="w-full sm:w-auto px-10 py-4.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-900/60 dark:hover:bg-slate-900/100 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-800 font-extrabold rounded-2xl transition-all duration-300 text-sm uppercase tracking-wider flex items-center justify-center"
            >
              Access Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-100 dark:bg-slate-950/80 pt-24 pb-12 border-t border-slate-200 dark:border-slate-900 backdrop-blur-md z-10 relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-20">
            <div className="col-span-2 space-y-6">
              <Link to="/" className="flex items-center space-x-2.5">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/10">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col leading-[0.8]">
                  <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">SDIET</span>
                  <span className="text-[10px] uppercase tracking-[0.4em] font-extrabold text-indigo-600 dark:text-indigo-400 ml-0.5">Learner</span>
                </div>
              </Link>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-sm font-medium">
                An online study materials portal built to offer course roadmaps, PYQs, and interactive support systems to Satyug Darshan Engineering & Management students.
              </p>
              <div className="flex space-x-3 pt-2">
                {[Twitter, Github, Linkedin, Mail].map((Icon, i) => (
                  <a key={i} href="#" className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-indigo-500/30 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-200 shadow-sm">
                    <Icon className="w-4.5 h-4.5" />
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-6">Platform</h4>
              <ul className="space-y-3.5 text-sm font-medium">
                {['Subjects', 'Notes', 'Events', 'Notices'].map((item) => (
                  <li key={item}>
                    <Link to={`/${item.toLowerCase()}`} className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors duration-150">{item}</Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-6">Support</h4>
              <ul className="space-y-3.5 text-sm font-medium">
                {['Help Center', 'Doubt Chat', 'Contact Us', 'Feedback'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors duration-150">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-6">Legal</h4>
              <ul className="space-y-3.5 text-sm font-medium">
                {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors duration-150">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="pt-10 border-t border-slate-200 dark:border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-500">
            <p>
              © 2026 SDIET Learner Portal. All rights reserved.
            </p>
            <div className="flex items-center space-x-4">
              <InstallPWAFooterButton />
              <div className="flex items-center space-x-2">
                <span>Made with</span>
                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                <span>for SDIETians</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
