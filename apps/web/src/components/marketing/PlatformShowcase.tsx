import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Activity, ArrowUpRight, BookOpen, Bot, Check, CheckCircle2, CircleDot, Clock3, GraduationCap, Layers3, MessageCircle, ShieldCheck, Sparkles, Ticket, TrendingUp, Wifi } from 'lucide-react';

type Preview='academic'|'campus';
const demos = {
  academic: [
    {name:'Foundation in AI',code:'CS101',percentage:68,color:'from-blue-600 to-cyan-400'},
    {name:'Design Thinking',code:'DT102',percentage:82,color:'from-violet-500 to-indigo-400'},
    {name:'Digital Electronics',code:'EC103',percentage:46,color:'from-cyan-500 to-teal-400'},
  ],
  campus: [
    {name:'Library Wi-Fi',code:'NET-218',percentage:85,color:'from-blue-600 to-cyan-400'},
    {name:'Lecture hall AC',code:'OPS-104',percentage:55,color:'from-amber-500 to-orange-400'},
    {name:'Lab lighting',code:'OPS-122',percentage:100,color:'from-emerald-500 to-teal-400'},
  ]
};
export const PlatformShowcase:React.FC=()=>{
  const [preview,setPreview]=useState<Preview>('academic');
  const reduce=useReducedMotion();
  return <motion.div initial={reduce?false:{opacity:0,y:20,scale:.975}} animate={{opacity:1,y:0,scale:1}} transition={{duration:.7,delay:.15}} className="relative w-full max-w-[620px] mx-auto lg:max-w-none" aria-label="Interactive SolveSphere platform interface preview">
    <div className="absolute -inset-5 sm:-inset-8 rounded-[50px] bg-gradient-to-br from-blue-400/20 via-cyan-200/15 to-indigo-300/20 blur-[55px]" aria-hidden="true"/>
    <div className="relative overflow-hidden rounded-[27px] border border-white/80 dark:border-slate-700/75 bg-white dark:bg-[#111a2d] shadow-[0_35px_110px_rgba(14,42,92,.21)]">
      <div className="h-11 px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-[#0d1627]">
        <div className="flex gap-1.5" aria-hidden="true"><span className="w-2.5 h-2.5 bg-rose-400 rounded-full"/><span className="w-2.5 h-2.5 bg-amber-400 rounded-full"/><span className="w-2.5 h-2.5 bg-emerald-400 rounded-full"/></div>
        <span className="font-mono text-[10px] tracking-tight text-slate-400">solvesphere.ai / workspace preview</span>
        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400"><CircleDot className="h-3 w-3"/> Demo</span>
      </div>
      <div className="grid grid-cols-[60px_1fr] sm:grid-cols-[78px_1fr] min-h-[395px]">
        <div className="flex flex-col items-center gap-4 border-r border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[#0d1627] py-5">
          <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white grid place-items-center"><Sparkles size={17}/></span>
          <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-cyan-300 grid place-items-center"><Layers3 size={17}/></div>
          <div className="h-9 w-9 rounded-xl text-slate-400 grid place-items-center"><BookOpen size={17}/></div>
          <div className="h-9 w-9 rounded-xl text-slate-400 grid place-items-center"><MessageCircle size={17}/></div>
          <div className="mt-auto h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-400 to-cyan-400 text-white text-xs font-bold grid place-items-center">S</div>
        </div>
        <div className="p-4 sm:p-6 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><p className="text-[10px] font-bold uppercase tracking-[.19em] text-blue-600 dark:text-cyan-300">WORKSPACE OVERVIEW</p><h2 className="mt-1 text-lg sm:text-xl font-extrabold tracking-tight text-slate-950 dark:text-white">Your campus, simplified.</h2></div>
            <span className="flex items-center gap-1 rounded-full border border-emerald-100 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-[10px] px-2.5 py-1 text-emerald-700 dark:text-emerald-300"><Check size={11}/> Sample view</span>
          </div>
          <div role="tablist" aria-label="Product preview" className="mt-5 flex gap-2">
            <button role="tab" aria-selected={preview==='academic'} onClick={()=>setPreview('academic')} className={'rounded-lg px-3 py-2 text-[11px] font-bold transition-colors '+(preview==='academic'?'bg-blue-600 text-white':'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300')}>Academic</button>
            <button role="tab" aria-selected={preview==='campus'} onClick={()=>setPreview('campus')} className={'rounded-lg px-3 py-2 text-[11px] font-bold transition-colors '+(preview==='campus'?'bg-blue-600 text-white':'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300')}>Campus</button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 px-3.5 py-3"><span className="text-[10px] text-slate-500 dark:text-slate-400">{preview==='academic'?'Subjects tracked':'Tickets reviewed'}</span><p className="mt-1 flex items-center gap-2 text-xl font-extrabold text-slate-900 dark:text-white">{preview==='academic'?'06':'24'}<TrendingUp size={14} className="text-emerald-500"/></p></div>
            <div className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 px-3.5 py-3"><span className="text-[10px] text-slate-500 dark:text-slate-400">{preview==='academic'?'Learning momentum':'Issues resolved'}</span><p className="mt-1 flex items-center gap-2 text-xl font-extrabold text-slate-900 dark:text-white">{preview==='academic'?'76%':'19'}<Activity size={14} className="text-blue-500"/></p></div>
          </div>
          <div className="mt-4 border border-slate-100 dark:border-slate-700 rounded-2xl p-3.5">
            <div className="flex justify-between items-center"><h3 className="text-[12px] font-extrabold text-slate-900 dark:text-white">{preview==='academic'?'Course progression':'Campus support queue'}</h3><ArrowUpRight size={14} className="text-slate-400"/></div>
            <div className="mt-4 space-y-3">{demos[preview].map((d)=><div key={d.code}><div className="mb-1.5 flex items-center justify-between gap-2"><span className="truncate text-[11px] font-semibold text-slate-700 dark:text-slate-200">{d.name}</span><span className="text-[10px] font-mono text-slate-400">{d.code}</span></div><div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700"><div className={'h-full rounded-full bg-gradient-to-r '+d.color} style={{width:d.percentage+'%'}}/></div></div>)}</div>
          </div>
        </div>
      </div>
    </div>
    <motion.div aria-hidden="true" animate={reduce?{}:{y:[0,-7,0]}} transition={{repeat:Infinity,duration:5,ease:'easeInOut'}} className="hidden sm:flex absolute -right-3 lg:-right-6 top-[28%] items-center gap-2 rounded-2xl border border-white/70 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 shadow-xl px-3.5 py-3"><span className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 grid place-items-center text-blue-600 dark:text-cyan-300"><Bot size={18}/></span><span><strong className="block text-xs text-slate-900 dark:text-white">StudyMate AI</strong><span className="text-[10px] text-slate-500 dark:text-slate-400">Guided study preview</span></span></motion.div>
    <div className="hidden sm:flex absolute -left-4 lg:-left-8 bottom-12 gap-2 items-center px-3.5 py-3 rounded-2xl border border-white/70 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 shadow-xl" aria-hidden="true"><span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 grid place-items-center"><ShieldCheck size={17}/></span><span><strong className="block text-xs text-slate-900 dark:text-white">One connected place</strong><span className="text-[10px] text-slate-500">Study. Report. Stay informed.</span></span></div>
  </motion.div>;
};
