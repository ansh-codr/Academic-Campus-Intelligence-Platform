import { useEffect, useState } from 'react';
type Theme = 'light' | 'dark';
const KEY='solvesphere-theme', EVENT='solvesphere-theme-change';
function readTheme():Theme {
  if(typeof window==='undefined')return 'light';
  const stored=localStorage.getItem(KEY);
  if(stored==='light'||stored==='dark')return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
}
export function useTheme(){
  const [theme,setTheme]=useState<Theme>(readTheme);
  useEffect(()=>{document.documentElement.classList.toggle('dark',theme==='dark');localStorage.setItem(KEY,theme);window.dispatchEvent(new Event(EVENT));},[theme]);
  useEffect(()=>{const sync=()=>setTheme(readTheme());window.addEventListener('storage',sync);window.addEventListener(EVENT,sync);return ()=>{window.removeEventListener('storage',sync);window.removeEventListener(EVENT,sync);};},[]);
  return {theme,toggleTheme:()=>setTheme(v=>v==='light'?'dark':'light'),setTheme};
}
