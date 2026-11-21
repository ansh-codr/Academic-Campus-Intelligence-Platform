import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { BrandMark } from '@/components/common/BrandMark';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { ArrowRight, BookOpen, Building2, Menu, ShieldCheck, X } from 'lucide-react';
const links=[
  {label:'Home',href:'/'},
  {label:'Academic Intelligence',href:'/#academic'},
  {label:'Campus Intelligence',href:'/#campus'},
  {label:'Features',href:'/#features'},
  {label:'How It Works',href:'/#how-it-works'},
];
export const PublicLayout:React.FC=()=>{
  const [open,setOpen]=useState(false);
  const location=useLocation();
  useEffect(()=>{setOpen(false);if(location.hash){const id=location.hash.slice(1);requestAnimationFrame(()=>document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'}));} else {window.scrollTo({top:0,behavior:'auto'});}},[location.pathname,location.hash]);
  return <div className="min-h-screen flex flex-col bg-brand-offWhite dark:bg-brand-darkBg text-brand-navy dark:text-slate-100">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-white focus:text-blue-700 focus:px-4 focus:py-3 focus:rounded-xl">Skip to main content</a>
    <header className="sticky top-0 z-40 glass-nav shadow-[0_2px_16px_rgba(15,23,42,.035)]">
      <div className="max-w-7xl mx-auto h-[76px] px-4 sm:px-6 lg:px-8 flex justify-between items-center gap-5">
        <Link to="/" aria-label="SolveSphere AI home" className="shrink-0"><BrandMark /></Link>
        <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-6 xl:gap-8">
          {links.map(link=><Link key={link.label} to={link.href} className={'text-[12px] xl:text-[13px] font-semibold transition-colors hover:text-blue-600 dark:hover:text-cyan-300 '+(location.pathname==='/'&&location.hash===link.href.substring(1)?'text-blue-600 dark:text-cyan-300':'text-slate-600 dark:text-slate-300')}>{link.label}</Link>)}
        </nav>
        <div className="hidden md:flex items-center gap-2"><ThemeToggle variant="outline"/><Link to="/auth/login"><Button variant="ghost" size="sm">Log in</Button></Link><Link to="/auth/register"><Button variant="gradient" size="sm">Get Started <ArrowRight className="h-3.5 w-3.5"/></Button></Link><Link to="/auth/admin-login" aria-label="Admin portal" className="ml-1 text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300">Admin</Link></div>
        <div className="md:hidden flex gap-2 items-center"><ThemeToggle/><button type="button" aria-label={open?'Close menu':'Open menu'} aria-expanded={open} aria-controls="mobile-navigation" onClick={()=>setOpen(!open)} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">{open?<X size={19}/>:<Menu size={19}/>}</button></div>
      </div>
      {open && <nav id="mobile-navigation" aria-label="Mobile navigation" className="md:hidden px-4 pb-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex flex-col gap-1 pt-3">{links.map(link=><Link key={link.label} onClick={()=>setOpen(false)} to={link.href} className="px-3 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">{link.label}</Link>)}</div>
        <div className="grid grid-cols-2 gap-2 pt-3"><Link to="/auth/login" onClick={()=>setOpen(false)}><Button variant="outline" className="w-full">Log in</Button></Link><Link to="/auth/register" onClick={()=>setOpen(false)}><Button variant="gradient" className="w-full">Get Started</Button></Link></div>
        <Link to="/auth/admin-login" onClick={()=>setOpen(false)} className="block px-3 pt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">Administrator sign in</Link>
      </nav>}
    </header>
    <main id="main-content" className="flex-1"><Outlet/></main>
    <footer className="border-t border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#0e1729]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid md:grid-cols-[1.3fr_1fr_1fr] gap-9">
          <div className="max-w-sm"><BrandMark/><p className="mt-5 text-sm leading-7 text-slate-500 dark:text-slate-400">Your Problems. Our Smart Solutions. A thoughtfully connected workspace for academic progress and campus care.</p></div>
          <div><h2 className="mb-4 text-xs uppercase tracking-[.16em] font-extrabold text-slate-900 dark:text-slate-100">Explore</h2><div className="flex flex-col gap-3 text-sm text-slate-500 dark:text-slate-400"><Link to="/#academic" className="hover:text-blue-600">Academic Intelligence</Link><Link to="/#campus" className="hover:text-blue-600">Campus Intelligence</Link><Link to="/#how-it-works" className="hover:text-blue-600">How It Works</Link></div></div>
          <div><h2 className="mb-4 text-xs uppercase tracking-[.16em] font-extrabold text-slate-900 dark:text-slate-100">Your workspace</h2><div className="flex flex-col gap-3 text-sm text-slate-500 dark:text-slate-400"><Link to="/auth/login" className="hover:text-blue-600">Student sign in</Link><Link to="/auth/register" className="hover:text-blue-600">Create an account</Link><Link to="/auth/admin-login" className="hover:text-blue-600">Staff portal</Link></div></div>
        </div>
        <div className="border-t border-slate-100 dark:border-slate-800 mt-11 pt-6 flex flex-col sm:flex-row gap-3 justify-between text-xs text-slate-500 dark:text-slate-400"><span>© {new Date().getFullYear()} SolveSphere AI. Built for better campus days.</span><span className="flex gap-2 items-center"><ShieldCheck className="h-4 w-4 text-blue-500"/> Student & institutional workspaces</span></div>
      </div>
    </footer>
  </div>;
};
