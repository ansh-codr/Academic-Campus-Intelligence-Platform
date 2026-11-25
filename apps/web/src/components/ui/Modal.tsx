import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
interface ModalProps { isOpen:boolean; onClose:()=>void; title:string; description?:string; children:React.ReactNode; maxWidth?:'sm'|'md'|'lg'|'xl'|'2xl'; }
const widths={sm:'max-w-sm',md:'max-w-md',lg:'max-w-lg',xl:'max-w-xl','2xl':'max-w-2xl'};
export const Modal:React.FC<ModalProps>=({isOpen,onClose,title,description,children,maxWidth='lg'})=>{
  const dialogRef=useRef<HTMLDivElement>(null);
  const closeRef=useRef<HTMLButtonElement>(null);
  const onCloseRef=useRef(onClose);
  onCloseRef.current=onClose;
  const titleId=useId(),descId=useId();

  useEffect(()=>{
    if(!isOpen)return;
    const active=document.activeElement as HTMLElement|null;
    const previousOverflow=document.body.style.overflow;
    document.body.style.overflow='hidden';

    // Only set initial focus if focus is not already inside the dialog
    if(!dialogRef.current?.contains(document.activeElement)){
      closeRef.current?.focus();
    }

    const handleKey=(e:KeyboardEvent)=>{
      if(e.key==='Escape'){e.preventDefault();onCloseRef.current();}
      if(e.key!=='Tab')return;
      const focusable=Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')||[]);
      if(!focusable.length)return;
      const first=focusable[0],last=focusable[focusable.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    };
    window.addEventListener('keydown',handleKey);
    return ()=>{window.removeEventListener('keydown',handleKey);document.body.style.overflow=previousOverflow;active?.focus();};
  },[isOpen]);
  if(!isOpen)return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div aria-hidden="true" className="fixed inset-0 bg-slate-950/65 backdrop-blur-md" onClick={onClose}/>
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description?descId:undefined} className={cn('relative z-10 w-full max-h-[calc(100vh-2rem)] overflow-hidden rounded-[26px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#141e31] shadow-2xl',widths[maxWidth])}>
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 px-6 py-5"><div><h2 id={titleId} className="text-lg font-extrabold text-slate-950 dark:text-white">{title}</h2>{description&&<p id={descId} className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}</div><button ref={closeRef} type="button" onClick={onClose} aria-label="Close dialog" className="shrink-0 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><X className="w-5 h-5"/></button></div>
      <div className="p-6 max-h-[calc(100vh-10rem)] overflow-y-auto">{children}</div>
    </div>
  </div>;
};
