/*
 ██████╗  ██████╗ ██████╗     ██╗     ███████╗██╗   ██╗███████╗██╗
██╔════╝ ██╔═══██╗██╔══██╗    ██║     ██╔════╝██║   ██║██╔════╝██║
██║  ███╗██║   ██║██║  ██║    ██║     █████╗  ██║   ██║█████╗  ██║
██║   ██║██║   ██║██║  ██║    ██║     ██╔══╝  ╚██╗ ██╔╝██╔══╝  ██║
╚██████╔╝╚██████╔╝██████╔╝    ███████╗███████╗ ╚████╔╝ ███████╗███████╗
 ╚═════╝  ╚═════╝ ╚═════╝     ╚══════╝╚══════╝  ╚═══╝  ╚══════╝╚══════╝

 PRODUCTION VERSION — Camera Exercise Detection + Streak System + Firebase Auth
 
 ════════════════════════════════════════════════════════════════
 FIREBASE SETUP (Real Google Login ke liye):
 1. https://console.firebase.google.com → New Project banao
 2. Project Settings → Web App add karo → Config copy karo
 3. Authentication → Sign-in method → Google enable karo
 4. Neeche FIREBASE_CONFIG mein apna config paste karo
 ════════════════════════════════════════════════════════════════
*/

import { useState, useEffect, useRef, useCallback } from "react";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔥 FIREBASE CONFIG — Yahan apna config daalo
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyBiiXxuNvYeySHqMM6H79FIPrqkq711MIU",
  authDomain:        "god-level-system.firebaseapp.com",
  projectId:         "god-level-system",
  storageBucket:     "god-level-system.firebasestorage.app",
  messagingSenderId: "655164745862",
  appId:             "1:655164745862:web:cfc9deffae0d8793808907",
};
// Config add ho gaya — real Google Login active hai:
const FIREBASE_CONFIGURED = true;
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const RANKS = [
  { name:"E",   label:"E Rank",    color:"#9ca3af", glow:"#6b7280",  xpRequired:0,     xpNext:500   },
  { name:"D",   label:"D Rank",    color:"#86efac", glow:"#22c55e",  xpRequired:500,   xpNext:1200  },
  { name:"C",   label:"C Rank",    color:"#67e8f9", glow:"#06b6d4",  xpRequired:1700,  xpNext:2500  },
  { name:"B",   label:"B Rank",    color:"#93c5fd", glow:"#3b82f6",  xpRequired:4200,  xpNext:4000  },
  { name:"A",   label:"A Rank",    color:"#c4b5fd", glow:"#8b5cf6",  xpRequired:8200,  xpNext:6000  },
  { name:"S",   label:"S Rank",    color:"#fbbf24", glow:"#f59e0b",  xpRequired:14200, xpNext:10000 },
  { name:"SS",  label:"SS Rank",   color:"#fb923c", glow:"#f97316",  xpRequired:24200, xpNext:15000 },
  { name:"SSS", label:"SSS Rank",  color:"#f87171", glow:"#ef4444",  xpRequired:39200, xpNext:25000 },
  { name:"GOD", label:"GOD LEVEL", color:"#e879f9", glow:"#d946ef",  xpRequired:64200, xpNext:99999 },
];

const DEFAULT_QUESTS = [
  { id:1, name:"Push-ups",       target:10, category:"Strength",     xp:150, icon:"💪", difficulty:"Hard",   exerciseType:"pushup"  },
  { id:2, name:"Squats",         target:15, category:"Strength",     xp:100, icon:"🦵", difficulty:"Medium", exerciseType:"squat"   },
  { id:3, name:"Jumping Jacks",  target:20, category:"Agility",      xp:80,  icon:"⚡", difficulty:"Medium", exerciseType:"jumping" },
  { id:4, name:"Sit-ups",        target:10, category:"Strength",     xp:120, icon:"🏋️", difficulty:"Hard",   exerciseType:"situp"   },
  { id:5, name:"High Knees",     target:20, category:"Endurance",    xp:90,  icon:"🏃", difficulty:"Medium", exerciseType:"highknee"},
  { id:6, name:"Meditation",     target:1,  category:"Intelligence", xp:60,  icon:"🧠", difficulty:"Easy",   exerciseType:"timed"   },
  { id:7, name:"Water Intake",   target:1,  category:"Vitality",     xp:40,  icon:"💧", difficulty:"Easy",   exerciseType:"manual"  },
  { id:8, name:"Stretching",     target:1,  category:"Agility",      xp:50,  icon:"🤸", difficulty:"Easy",   exerciseType:"manual"  },
];

const INIT_ADMIN  = { username:"admin", password:"GODPRO555" };
const XP_MISS_DAY = 80;   // XP katega per missed day
const DAYS_RESET  = 7;     // 7 din baad full reset

const getRank   = (xp) => RANKS.reduce((c,r) => xp>=r.xpRequired?r:c, RANKS[0]);
const catColor  = { Strength:"#f87171", Endurance:"#fb923c", Agility:"#4ade80", Intelligence:"#93c5fd", Vitality:"#c4b5fd" };
const diffColor = { Easy:"#4ade80", Medium:"#fbbf24", Hard:"#f87171" };
const fmt = (d) => new Date(d).toLocaleString("en-IN",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});

// ════════════════════════════════════════════════════════
// GLOBAL STYLES
// ════════════════════════════════════════════════════════
const GS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Orbitron:wght@700;900&display=swap');
    @keyframes flt  {from{transform:translateY(0)}to{transform:translateY(-16px)}}
    @keyframes up   {from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}
    @keyframes pop  {0%{transform:scale(.3);opacity:0}65%{transform:scale(1.2)}100%{transform:scale(1);opacity:1}}
    @keyframes spin {from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
    @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
    @keyframes glow {0%,100%{box-shadow:0 0 10px #ef444433}50%{box-shadow:0 0 30px #ef4444aa}}
    *{box-sizing:border-box;margin:0;padding:0}
    input,select,textarea{outline:none}
    ::-webkit-scrollbar{width:4px}
    ::-webkit-scrollbar-track{background:#0a0a0f}
    ::-webkit-scrollbar-thumb{background:#8b5cf633;border-radius:99px}
    button:active{transform:scale(.97)}
  `}</style>
);

// ════════════════════════════════════════════════════════
// MICRO COMPONENTS
// ════════════════════════════════════════════════════════
const Particles = ({color="#8b5cf6"}) => (
  <div style={{position:"fixed",inset:0,pointerEvents:"none",overflow:"hidden",zIndex:0}}>
    {Array.from({length:14},(_,i)=>{
      const x=Math.random()*100,y=Math.random()*100,sz=Math.random()*2.5+1,d=Math.random()*5,dur=Math.random()*7+5;
      return <div key={i} style={{position:"absolute",left:`${x}%`,top:`${y}%`,width:sz,height:sz,borderRadius:"50%",background:`${color}44`,animation:`flt ${dur}s ${d}s infinite ease-in-out alternate`}}/>;
    })}
  </div>
);

const RankBadge = ({rank,size="md"}) => {
  const s={sm:{w:32,f:8},md:{w:52,f:13},lg:{w:84,f:24}}[size];
  return <div style={{width:s.w,height:s.w,borderRadius:"50%",border:`2px solid ${rank.color}`,boxShadow:`0 0 16px ${rank.glow}66`,display:"flex",alignItems:"center",justifyContent:"center",background:`radial-gradient(circle,${rank.glow}22,transparent 70%)`,fontWeight:900,fontSize:s.f,color:rank.color,fontFamily:"monospace",flexShrink:0}}>{rank.name}</div>;
};

const XPBar = ({cur,max,color,glow}) => (
  <div style={{height:6,background:"rgba(255,255,255,0.08)",borderRadius:99,overflow:"hidden"}}>
    <div style={{height:"100%",width:`${Math.min((cur/max)*100,100)}%`,background:`linear-gradient(90deg,${color}66,${color})`,boxShadow:`0 0 8px ${glow}`,borderRadius:99,transition:"width .8s cubic-bezier(.34,1.56,.64,1)"}}/>
  </div>
);

const StatBar = ({label,val,color}) => (
  <div style={{marginBottom:11}}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
      <span style={{fontSize:10,color:"#94a3b8",fontFamily:"monospace",letterSpacing:1}}>{label}</span>
      <span style={{fontSize:10,color,fontWeight:700,fontFamily:"monospace"}}>{val}</span>
    </div>
    <div style={{height:4,background:"rgba(255,255,255,0.06)",borderRadius:99,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${val}%`,background:color,borderRadius:99,transition:"width 1s ease"}}/>
    </div>
  </div>
);

const Tag  = ({children,color}) => <span style={{fontSize:9,padding:"2px 7px",borderRadius:99,background:`${color}20`,color}}>{children}</span>;
const Card = ({children,border,glow,style={}}) => (
  <div style={{background:glow?`radial-gradient(ellipse at top right,${glow}10,transparent 55%),rgba(255,255,255,0.02)`:"rgba(255,255,255,0.02)",border:`1px solid ${border?border+"30":"rgba(255,255,255,0.06)"}`,borderRadius:18,...style}}>{children}</div>
);
const Inp  = ({value,onChange,placeholder,type="text",style={}}) => (
  <input value={value} onChange={onChange} placeholder={placeholder} type={type}
    style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:11,padding:"10px 14px",color:"#e2e8f0",fontSize:13,fontFamily:"Rajdhani",marginBottom:10,...style}}/>
);

const GoogleIcon = () => (
  <svg width="17" height="17" viewBox="0 0 48 48" style={{flexShrink:0}}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

// Live Clock
const Clock = () => {
  const [t,setT] = useState(new Date());
  useEffect(()=>{ const i=setInterval(()=>setT(new Date()),1000); return()=>clearInterval(i); },[]);
  return (
    <div style={{fontSize:10,color:"#64748b",fontFamily:"monospace",textAlign:"right"}}>
      <div>{t.toLocaleDateString("en-IN",{weekday:"short",day:"2-digit",month:"short"})}</div>
      <div style={{color:"#94a3b8",fontWeight:700}}>{t.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}</div>
    </div>
  );
};

// Streak penalty banner
const PenaltyBanner = ({penalty,onDismiss}) => (
  <div style={{background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.35)",borderRadius:12,padding:"12px 16px",marginBottom:14,animation:"shake .4s ease",display:"flex",alignItems:"center",gap:12}}>
    <span style={{fontSize:22}}>💔</span>
    <div style={{flex:1}}>
      <div style={{fontSize:13,fontWeight:700,color:"#ef4444"}}>Streak Broken!</div>
      <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{penalty.msg}</div>
    </div>
    <button onClick={onDismiss} style={{background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:18}}>×</button>
  </div>
);

// ════════════════════════════════════════════════════════
// CAMERA EXERCISE COMPONENT
// Real camera + motion-based rep counting
// ════════════════════════════════════════════════════════
function CameraQuest({ quest, onComplete, onClose, rank }) {
  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const overlayRef  = useRef(null);
  const streamRef   = useRef(null);
  const animRef     = useRef(null);
  const stateRef    = useRef({ prevLuma:null, lumaHistory:[], repState:"up", repCount:0, lastPeak:0, lastValley:0 });

  const [facingMode, setFacing]  = useState("user");
  const [reps, setReps]          = useState(0);
  const [phase, setPhase]        = useState("idle"); // idle|countdown|active|done
  const [countdown, setCountdown]= useState(3);
  const [motionLevel, setMotion] = useState(0);
  const [camError, setCamErr]    = useState("");
  const [detecting, setDetecting]= useState(false);

  const target = quest.target;

  // Start camera
  const startCam = useCallback(async (facing) => {
    try {
      if(streamRef.current) streamRef.current.getTracks().forEach(t=>t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video:{ facingMode: facing, width:{ideal:640}, height:{ideal:480} },
        audio:false
      });
      streamRef.current = stream;
      if(videoRef.current){ videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setCamErr("");
    } catch(e) {
      setCamErr(e.name==="NotAllowedError"?"Camera permission denied. Please allow camera access.":"Camera not available on this device.");
    }
  },[]);

  useEffect(()=>{ startCam(facingMode); return()=>{ if(streamRef.current) streamRef.current.getTracks().forEach(t=>t.stop()); if(animRef.current) cancelAnimationFrame(animRef.current); }; },[facingMode]);

  const toggleCamera = () => {
    setFacing(f => f==="user"?"environment":"user");
    setReps(0); stateRef.current = { prevLuma:null, lumaHistory:[], repState:"up", repCount:0, lastPeak:0, lastValley:0 };
  };

  // Motion detection + rep counting algorithm
  const processFrame = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if(!video||!canvas||video.readyState<2){ animRef.current=requestAnimationFrame(processFrame); return; }

    const ctx = canvas.getContext("2d",{willReadFrequently:true});
    canvas.width  = video.videoWidth  || 320;
    canvas.height = video.videoHeight || 240;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Sample central region (body area)
    const rW = Math.floor(canvas.width * 0.6);
    const rH = Math.floor(canvas.height * 0.7);
    const rX = Math.floor((canvas.width - rW) / 2);
    const rY = Math.floor(canvas.height * 0.1);

    const imgData = ctx.getImageData(rX, rY, rW, rH);
    const data    = imgData.data;

    // Calculate weighted vertical center of motion (luminance)
    let lumaSum = 0, lumaWeightedY = 0, pixCount = 0;
    for(let y=0; y<rH; y+=3){
      for(let x=0; x<rW; x+=3){
        const i = (y*rW+x)*4;
        const luma = 0.299*data[i] + 0.587*data[i+1] + 0.114*data[i+2];
        if(luma>40){ // skip very dark pixels (background)
          lumaSum     += luma;
          lumaWeightedY += luma * y;
          pixCount++;
        }
      }
    }

    const avgY = pixCount>100 ? (lumaWeightedY/lumaSum)/rH : 0.5; // 0=top 1=bottom
    const s    = stateRef.current;

    s.lumaHistory.push(avgY);
    if(s.lumaHistory.length > 20) s.lumaHistory.shift();

    // Smooth signal
    const smoothY = s.lumaHistory.reduce((a,v)=>a+v,0)/s.lumaHistory.length;

    // Motion magnitude
    const motion = s.prevLuma!==null ? Math.abs(smoothY-(s.prevLuma)) : 0;
    s.prevLuma = smoothY;
    setMotion(Math.min(motion*800, 100));

    // Rep detection state machine
    // "up" = body high (push-up top / squat standing)
    // "down" = body low (push-up bottom / squat down)
    const UP_THRESH   = 0.42;
    const DOWN_THRESH = 0.55;

    if(s.repState==="up" && smoothY > DOWN_THRESH){
      s.repState = "down";
      s.lastValley = smoothY;
    } else if(s.repState==="down" && smoothY < UP_THRESH){
      s.repState = "up";
      s.repCount++;
      setReps(s.repCount);
      // Draw flash
      const oc = overlayRef.current;
      if(oc){ const ox=oc.getContext("2d"); ox.clearRect(0,0,oc.width,oc.height); ox.fillStyle="rgba(139,92,246,0.25)"; ox.fillRect(0,0,oc.width,oc.height); setTimeout(()=>ox.clearRect(0,0,oc.width,oc.height),200); }
    }

    // Draw overlay on video canvas
    const oc = overlayRef.current;
    if(oc){
      oc.width = canvas.width; oc.height = canvas.height;
      const ox = oc.getContext("2d");
      // Region outline
      ox.strokeStyle = s.repState==="down"?"#ef444488":"#8b5cf688";
      ox.lineWidth = 2;
      ox.strokeRect(rX, rY, rW, rH);
      // Position indicator
      const indicatorY = rY + smoothY*rH;
      ox.fillStyle = rank.color+"bb";
      ox.fillRect(rX, indicatorY-2, rW, 4);
    }

    animRef.current = requestAnimationFrame(processFrame);
  },[rank]);

  // Start exercise flow
  const startExercise = () => {
    setPhase("countdown");
    setCountdown(3);
    setReps(0);
    stateRef.current = { prevLuma:null, lumaHistory:[], repState:"up", repCount:0, lastPeak:0, lastValley:0 };
    let c=3;
    const timer = setInterval(()=>{
      c--;
      setCountdown(c);
      if(c<=0){
        clearInterval(timer);
        setPhase("active");
        setDetecting(true);
        processFrame();
      }
    },1000);
  };

  // Auto-complete when target hit
  useEffect(()=>{
    if(reps>=target && phase==="active"){
      cancelAnimationFrame(animRef.current);
      setDetecting(false);
      setPhase("done");
    }
  },[reps,target,phase]);

  const handleComplete = () => { if(streamRef.current) streamRef.current.getTracks().forEach(t=>t.stop()); onComplete(); };
  const handleClose    = () => { if(streamRef.current) streamRef.current.getTracks().forEach(t=>t.stop()); onClose(); };

  const pct = Math.min((reps/target)*100, 100);

  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"#000",display:"flex",flexDirection:"column"}}>
      <GS/>
      {/* Header */}
      <div style={{padding:"12px 16px",background:"rgba(0,0,0,0.8)",backdropFilter:"blur(10px)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <button onClick={handleClose} style={{background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:9,padding:"6px 12px",color:"#ef4444",fontSize:11,cursor:"pointer",fontFamily:"Rajdhani",fontWeight:700}}>✕ EXIT</button>
        <div style={{textAlign:"center"}}>
          <div style={{fontFamily:"Orbitron",fontSize:13,fontWeight:900,color:rank.color}}>{quest.icon} {quest.name.toUpperCase()}</div>
          <div style={{fontSize:9,color:"#64748b",letterSpacing:2}}>TARGET: {target} REPS · +{quest.xp} XP</div>
        </div>
        <button onClick={toggleCamera} style={{background:"rgba(139,92,246,0.15)",border:"1px solid rgba(139,92,246,0.3)",borderRadius:9,padding:"6px 12px",color:"#a78bfa",fontSize:18,cursor:"pointer"}}>
          {facingMode==="user"?"🤳":"📷"}
        </button>
      </div>

      {/* Camera View */}
      <div style={{position:"relative",flex:1,overflow:"hidden",background:"#000"}}>
        {camError ? (
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14,padding:24}}>
            <span style={{fontSize:48}}>📵</span>
            <div style={{fontSize:14,color:"#ef4444",textAlign:"center",fontFamily:"Rajdhani"}}>{camError}</div>
            <button onClick={()=>startCam(facingMode)} style={{padding:"10px 24px",background:"rgba(139,92,246,0.2)",border:"1px solid rgba(139,92,246,0.4)",borderRadius:11,color:"#a78bfa",cursor:"pointer",fontFamily:"Rajdhani",fontWeight:700}}>Retry</button>
          </div>
        ):(
          <>
            <video ref={videoRef} autoPlay playsInline muted style={{width:"100%",height:"100%",objectFit:"cover",transform:facingMode==="user"?"scaleX(-1)":"none"}}/>
            <canvas ref={canvasRef} style={{display:"none"}}/>
            <canvas ref={overlayRef} style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",transform:facingMode==="user"?"scaleX(-1)":"none"}}/>

            {/* Countdown overlay */}
            {phase==="countdown"&&(
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.55)"}}>
                <div style={{fontFamily:"Orbitron",fontSize:96,fontWeight:900,color:rank.color,textShadow:`0 0 40px ${rank.glow}`,animation:"pop .4s ease"}}>{countdown||"GO!"}</div>
              </div>
            )}

            {/* Active HUD */}
            {(phase==="active"||phase==="done")&&(
              <div style={{position:"absolute",inset:0,pointerEvents:"none"}}>
                {/* Rep counter top-center */}
                <div style={{position:"absolute",top:16,left:"50%",transform:"translateX(-50%)",textAlign:"center"}}>
                  <div style={{fontFamily:"Orbitron",fontSize:52,fontWeight:900,color:phase==="done"?"#4ade80":rank.color,textShadow:`0 0 30px ${rank.glow}`,lineHeight:1}}>{reps}</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.6)",letterSpacing:2}}>/ {target} REPS</div>
                </div>

                {/* Progress arc bottom */}
                <div style={{position:"absolute",bottom:16,left:"50%",transform:"translateX(-50%)",width:80,height:80}}>
                  <svg width="80" height="80" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5"/>
                    <circle cx="40" cy="40" r="34" fill="none" stroke={rank.color} strokeWidth="5"
                      strokeDasharray={`${2*Math.PI*34}`}
                      strokeDashoffset={`${2*Math.PI*34*(1-pct/100)}`}
                      strokeLinecap="round" transform="rotate(-90 40 40)"
                      style={{transition:"stroke-dashoffset .3s ease",filter:`drop-shadow(0 0 6px ${rank.glow})`}}/>
                    <text x="40" y="44" textAnchor="middle" fill={rank.color} fontSize="12" fontFamily="Orbitron" fontWeight="900">{Math.round(pct)}%</text>
                  </svg>
                </div>

                {/* Motion level bar */}
                <div style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",width:8,height:120,background:"rgba(255,255,255,0.1)",borderRadius:99,overflow:"hidden"}}>
                  <div style={{position:"absolute",bottom:0,width:"100%",height:`${motionLevel}%`,background:rank.color,borderRadius:99,transition:"height .1s ease"}}/>
                </div>

                {/* Phase label */}
                {phase==="done"&&(
                  <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.7)",pointerEvents:"all"}}>
                    <div style={{textAlign:"center",animation:"pop .5s ease"}}>
                      <div style={{fontSize:48,marginBottom:8}}>🎯</div>
                      <div style={{fontFamily:"Orbitron",fontSize:24,fontWeight:900,color:"#4ade80",marginBottom:4}}>QUEST DONE!</div>
                      <div style={{fontSize:14,color:"#fbbf24",marginBottom:24}}>+{quest.xp} XP Earned</div>
                      <button onClick={handleComplete} style={{padding:"14px 36px",background:"linear-gradient(135deg,rgba(74,222,128,0.3),rgba(74,222,128,0.15))",border:"1px solid rgba(74,222,128,0.5)",borderRadius:14,color:"#4ade80",fontSize:14,cursor:"pointer",fontFamily:"Orbitron",fontWeight:700,letterSpacing:2}}>CLAIM XP →</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Start button */}
            {phase==="idle"&&!camError&&(
              <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",padding:"0 24px 32px"}}>
                <div style={{background:"rgba(0,0,0,0.6)",borderRadius:14,padding:"14px 20px",marginBottom:16,textAlign:"center"}}>
                  <div style={{fontSize:12,color:"#94a3b8",marginBottom:4}}>📌 Instructions</div>
                  <div style={{fontSize:11,color:"#cbd5e1"}}>Position yourself so your full body is visible in the camera. Keep the phone stable.</div>
                </div>
                <div style={{display:"flex",gap:10,width:"100%",maxWidth:320}}>
                  <button onClick={toggleCamera} style={{flex:1,padding:"13px",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:13,color:"#e2e8f0",fontSize:12,cursor:"pointer",fontFamily:"Rajdhani",fontWeight:600}}>
                    {facingMode==="user"?"🤳 Front":"📷 Back"}
                  </button>
                  <button onClick={startExercise} style={{flex:2,padding:"13px",background:`linear-gradient(135deg,${rank.glow}44,${rank.glow}22)`,border:`1px solid ${rank.color}66`,borderRadius:13,color:rank.color,fontSize:13,cursor:"pointer",fontFamily:"Orbitron",fontWeight:700,letterSpacing:1,boxShadow:`0 0 20px ${rank.glow}33`}}>
                    ▶ START
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// AUTH SCREEN
// ════════════════════════════════════════════════════════
function Auth({ onLogin, adminCreds }) {
  const [mode,setMode]   = useState("login");
  const [name,setName]   = useState("");
  const [uname,setUname] = useState("");
  const [pass,setPass]   = useState("");
  const [conf,setConf]   = useState("");
  const [err,setErr]     = useState("");
  const [msg,setMsg]     = useState("");
  const [show,setShow]   = useState(false);
  const [gLoad,setGLoad] = useState(false);
  const [users,setUsers] = useState([
    {id:1,name:"Demo Player",username:"demo",password:"demo123",isGoogle:false,xp:1900,stats:{strength:24,agility:18,endurance:31,vitality:20,intelligence:15},history:[],lastActive:new Date().toDateString(),streak:7,pastProgress:[]},
  ]);

  const submit = () => {
    setErr(""); setMsg("");
    if(mode==="login"){
      if(uname===adminCreds.username&&pass===adminCreds.password) return onLogin({id:0,name:"Administrator",username:adminCreds.username,isAdmin:true});
      const u=users.find(u=>u.username===uname&&u.password===pass&&!u.isGoogle);
      if(u) return onLogin({...u,isAdmin:false});
      setErr("Invalid username or password.");
      return;
    }
    if(mode==="signup"){
      if(!name.trim()||!uname.trim()||!pass.trim()) return setErr("All fields required.");
      if(pass!==conf) return setErr("Passwords don't match.");
      if(users.find(u=>u.username===uname)||uname===adminCreds.username) return setErr("Username already taken.");
      const nu={id:Date.now(),name,username:uname,password:pass,isGoogle:false,xp:0,stats:{strength:10,agility:10,endurance:10,vitality:10,intelligence:10},history:[],lastActive:new Date().toDateString(),streak:0,pastProgress:[]};
      setUsers(u=>[...u,nu]);
      return onLogin({...nu,isAdmin:false});
    }
    if(mode==="forgot"){
      const u=users.find(u=>u.username===uname);
      if(!u) return setErr("Username not found.");
      if(u.isGoogle){ setMsg("Google account hai. myaccount.google.com pe jao password reset karne ke liye."); return; }
      if(!pass) return setErr("New password enter karo.");
      if(pass!==conf) return setErr("Passwords don't match.");
      setUsers(us=>us.map(x=>x.username===uname?{...x,password:pass}:x));
      setMsg("Password reset! Ab login karo."); setMode("login"); setPass(""); setConf(""); setUname("");
    }
  };

  // Firebase Google Sign-In — REAL LOGIN
  const googleLogin = async () => {
    setErr(""); setGLoad(true);
    try {
      const { initializeApp, getApps } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
      const { getAuth, signInWithPopup, GoogleAuthProvider } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
      const firebaseApp = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApps()[0];
      const auth     = getAuth(firebaseApp);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result   = await signInWithPopup(auth, provider);
      const gUser    = result.user;
      setGLoad(false);
      onLogin({
        id:          gUser.uid,
        name:        gUser.displayName || "Google User",
        username:    gUser.email.split("@")[0],
        email:       gUser.email,
        avatar:      gUser.photoURL,
        isGoogle:    true,
        xp:          0,
        stats:       { strength:10, agility:10, endurance:10, vitality:10, intelligence:10 },
        history:     [],
        lastActive:  new Date().toDateString(),
        streak:      0,
        pastProgress:[]
      });
    } catch(e) {
      setGLoad(false);
      if(e.code === "auth/popup-closed-by-user") return;
      if(e.code === "auth/popup-blocked") { setErr("Popup block ho gaya! Browser mein popups allow karo."); return; }
      setErr("Google login failed: " + (e.message || e.code));
    }
  };

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0a0a0f,#0d0d1a,#0a0a0f)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,position:"relative"}}>
      <GS/><Particles/>
      <div style={{width:"100%",maxWidth:365,position:"relative",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:26}}>
          <div style={{width:66,height:66,borderRadius:"50%",margin:"0 auto 13px",background:"radial-gradient(circle,#8b5cf633,transparent)",border:"2px solid #8b5cf6",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 32px #8b5cf666",fontSize:28}}>⚡</div>
          <div style={{fontFamily:"Orbitron",fontSize:19,fontWeight:900,background:"linear-gradient(90deg,#8b5cf6,#e879f9)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>GOD LEVEL</div>
          <div style={{fontSize:8,color:"#475569",letterSpacing:4,marginTop:2}}>SYSTEM v4.0</div>
        </div>

        {mode!=="forgot"&&(
          <div style={{display:"flex",gap:4,marginBottom:18,background:"rgba(255,255,255,0.03)",borderRadius:13,padding:4,border:"1px solid rgba(255,255,255,0.06)"}}>
            {[{id:"login",label:"Login"},{id:"signup",label:"Sign Up"}].map(t=>(
              <button key={t.id} onClick={()=>{setMode(t.id);setErr("");setMsg("");}} style={{flex:1,padding:"8px",border:"none",borderRadius:9,background:mode===t.id?"rgba(139,92,246,0.2)":"transparent",color:mode===t.id?"#a78bfa":"#64748b",fontSize:11,cursor:"pointer",fontFamily:"Rajdhani",fontWeight:700,transition:"all .2s"}}>{t.label}</button>
            ))}
          </div>
        )}

        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(139,92,246,0.14)",borderRadius:19,padding:20}}>
          {mode==="forgot"&&(
            <div style={{marginBottom:14}}>
              <button onClick={()=>{setMode("login");setErr("");setMsg("");}} style={{background:"none",border:"none",color:"#8b5cf6",cursor:"pointer",fontSize:11,fontFamily:"Rajdhani",fontWeight:600,marginBottom:12}}>← Back</button>
              <div style={{fontSize:9,color:"#a78bfa",letterSpacing:2,marginBottom:3}}>RESET PASSWORD</div>
              <div style={{fontSize:11,color:"#64748b"}}>Enter username to reset your password</div>
            </div>
          )}
          {mode==="signup"&&<Inp value={name} onChange={e=>setName(e.target.value)} placeholder="Your Name"/>}
          <Inp value={uname} onChange={e=>setUname(e.target.value)} placeholder="Username"/>
          {mode!=="forgot"&&(
            <div style={{position:"relative"}}>
              <Inp value={pass} onChange={e=>setPass(e.target.value)} placeholder="Password" type={show?"text":"password"} style={{paddingRight:42,marginBottom:mode==="signup"?10:0}}/>
              <button onClick={()=>setShow(s=>!s)} style={{position:"absolute",right:12,top:11,background:"none",border:"none",cursor:"pointer",fontSize:14,color:"#64748b"}}>{show?"🙈":"👁️"}</button>
            </div>
          )}
          {mode==="forgot"&&<><Inp value={pass} onChange={e=>setPass(e.target.value)} placeholder="New Password" type="password"/><Inp value={conf} onChange={e=>setConf(e.target.value)} placeholder="Confirm Password" type="password" style={{marginBottom:0}}/></>}
          {mode==="signup"&&<Inp value={conf} onChange={e=>setConf(e.target.value)} placeholder="Confirm Password" type="password" style={{marginBottom:0}}/>}

          {err&&<div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:9,padding:"8px 12px",marginTop:9,fontSize:11,color:"#ef4444"}}>⚠️ {err}</div>}
          {msg&&<div style={{background:"rgba(74,222,128,0.1)",border:"1px solid rgba(74,222,128,0.3)",borderRadius:9,padding:"8px 12px",marginTop:9,fontSize:11,color:"#4ade80"}}>✅ {msg}</div>}

          <button onClick={submit} style={{width:"100%",marginTop:13,padding:"12px",background:"linear-gradient(135deg,rgba(139,92,246,0.28),rgba(139,92,246,0.14))",border:"1px solid rgba(139,92,246,0.45)",borderRadius:13,color:"#c4b5fd",fontSize:12,cursor:"pointer",fontFamily:"Orbitron",fontWeight:700,letterSpacing:2}}>
            {mode==="login"?"ENTER SYSTEM":mode==="signup"?"CREATE HUNTER":"RESET PASSWORD"}
          </button>

          {mode==="login"&&<div style={{textAlign:"right",marginTop:8}}><button onClick={()=>{setMode("forgot");setErr("");setMsg("");}} style={{background:"none",border:"none",color:"#8b5cf6",cursor:"pointer",fontSize:10,fontFamily:"Rajdhani",fontWeight:600}}>Forgot Password?</button></div>}

          {mode!=="forgot"&&(
            <>
              <div style={{display:"flex",alignItems:"center",gap:10,margin:"14px 0"}}>
                <div style={{flex:1,height:1,background:"rgba(255,255,255,0.07)"}}/>
                <span style={{fontSize:9,color:"#475569",letterSpacing:1}}>OR</span>
                <div style={{flex:1,height:1,background:"rgba(255,255,255,0.07)"}}/>
              </div>
              <button onClick={googleLogin} disabled={gLoad} style={{width:"100%",padding:"11px",background:gLoad?"rgba(255,255,255,0.03)":"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.13)",borderRadius:13,color:"#e2e8f0",fontSize:12,cursor:gLoad?"default":"pointer",fontFamily:"Rajdhani",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                {gLoad?<><div style={{width:16,height:16,border:"2px solid rgba(255,255,255,0.15)",borderTopColor:"#8b5cf6",borderRadius:"50%",animation:"spin .7s linear infinite"}}/> Connecting...</>:<><GoogleIcon/> Continue with Google</>}
              </button>
              <div style={{fontSize:9,color:"#4ade80",textAlign:"center",marginTop:8}}>✅ Real Google Login Active</div>
            </>
          )}
        </div>
        <div style={{textAlign:"center",marginTop:11,fontSize:10,color:"#475569"}}>
          {mode==="login"&&<>No account? <span onClick={()=>{setMode("signup");setErr("");}} style={{color:"#8b5cf6",cursor:"pointer"}}>Sign Up</span></>}
          {mode==="signup"&&<>Have account? <span onClick={()=>{setMode("login");setErr("");}} style={{color:"#8b5cf6",cursor:"pointer"}}>Login</span></>}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// PLAYER APP
// ════════════════════════════════════════════════════════
function Player({ user, quests, onLogout }) {
  const [tab,setTab]         = useState("dash");
  const [xp,setXP]           = useState(user.xp);
  const [stats,setSt]        = useState(user.stats);
  const [done,setDone]       = useState([]);
  const [streak,setStreak]   = useState(user.streak||0);
  const [hist,setHist]       = useState(user.history||[]);
  const [pastProg,setPast]   = useState(user.pastProgress||[]);
  const [penalty,setPenalty] = useState(null);
  const [lvlUp,setLvlUp]     = useState(false);
  const [lvlRank,setLvlRnk]  = useState(null);
  const [camQuest,setCamQ]   = useState(null);
  // Password change
  const [showPass,setShowP]  = useState(false);
  const [cp,setCp]=useState(""); const [np,setNp]=useState(""); const [con,setCon]=useState(""); const [pErr,setPErr]=useState(""); const [pMsg,setPMsg]=useState("");

  const rank    = getRank(xp);
  const nxtRank = RANKS[RANKS.findIndex(r=>r.name===rank.name)+1];
  const xpIn    = xp - rank.xpRequired;

  // ── Streak check on load ───────────────────────────────
  useEffect(()=>{
    const today     = new Date().toDateString();
    const lastDate  = user.lastActive || today;
    if(lastDate===today) return;
    const diff = Math.floor((new Date(today)-new Date(lastDate))/(1000*60*60*24));
    if(diff<=0) return;
    if(diff>=DAYS_RESET){
      // Save current progress to history before reset
      setPast(p=>[...p,{ date:lastDate, xp, rank:rank.name, streak, completedQuests:hist.length }]);
      const lostXP = Math.min(xp, diff*XP_MISS_DAY);
      setXP(0); setStreak(0); setDone([]); setHist([]);
      setPenalty({ msg:`${diff} din se quest nahi kiya! Sab progress reset ho gaya. (-${lostXP} XP)`, type:"reset" });
    } else {
      const lostXP = Math.min(xp, diff*XP_MISS_DAY);
      setXP(x=>Math.max(0,x-lostXP));
      setStreak(0);
      setPenalty({ msg:`${diff} din miss kiya! -${lostXP} XP cut gaya. Streak reset.`, type:"penalty" });
    }
  },[]);

  const complete = (q) => {
    if(done.includes(q.id)) return;
    const prev=getRank(xp), nx=xp+q.xp, nr=getRank(nx);
    setXP(nx); setDone(d=>[...d,q.id]);
    setHist(h=>[{date:new Date().toISOString(),quest:q.name,xp:q.xp,icon:q.icon},...h]);
    setStreak(s=>s+1);
    const m={Strength:"strength",Agility:"agility",Endurance:"endurance",Vitality:"vitality",Intelligence:"intelligence"};
    if(m[q.category]) setSt(s=>({...s,[m[q.category]]:Math.min((s[m[q.category]]||10)+Math.floor(q.xp/20),100)}));
    if(nr.name!==prev.name){setLvlRnk(nr);setLvlUp(true);setTimeout(()=>setLvlUp(false),3000);}
  };

  const startCamQuest = (q) => {
    if(["manual","timed"].includes(q.exerciseType)){ complete(q); return; }
    setCamQ(q);
  };

  const handlePassChange = () => {
    setPErr(""); setPMsg("");
    if(user.isGoogle){ setPErr("Google account. Google pe ja ke password badlo."); return; }
    if(!cp||cp!==user.password){ setPErr("Current password galat hai."); return; }
    if(!np){ setPErr("New password daalo."); return; }
    if(np!==con){ setPErr("Passwords match nahi karte."); return; }
    user.password=np; setPMsg("Password changed! ✅");
    setTimeout(()=>{setShowP(false);setCp("");setNp("");setCon("");setPMsg("");},1800);
  };

  const navs=[{id:"dash",icon:"⚡",label:"Dashboard"},{id:"quests",icon:"⚔️",label:"Quests"},{id:"stats",icon:"📊",label:"Stats"},{id:"profile",icon:"👤",label:"Profile"},{id:"history",icon:"📜",label:"History"}];

  if(camQuest) return <CameraQuest quest={camQuest} rank={rank} onComplete={()=>{complete(camQuest);setCamQ(null);}} onClose={()=>setCamQ(null)}/>;

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0a0a0f,#0d0d1a,#0a0a0f)",color:"#e2e8f0",fontFamily:"'Rajdhani',monospace",position:"relative",overflow:"hidden"}}>
      <GS/><Particles/>

      {/* Level Up */}
      {lvlUp&&lvlRank&&(
        <div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.85)",backdropFilter:"blur(8px)"}}>
          <div style={{textAlign:"center",animation:"up .5s ease",padding:"44px 60px",background:`radial-gradient(circle,${lvlRank.glow}22,transparent 70%)`,border:`1px solid ${lvlRank.color}44`,borderRadius:24}}>
            <div style={{fontSize:9,color:"#94a3b8",letterSpacing:4,marginBottom:12}}>RANK UP!</div>
            <div style={{animation:"pop .6s .3s both"}}><RankBadge rank={lvlRank} size="lg"/></div>
            <div style={{fontFamily:"Orbitron",fontSize:26,fontWeight:900,color:lvlRank.color,marginTop:16,letterSpacing:2}}>{lvlRank.label}</div>
            <div style={{fontSize:11,color:"#64748b",marginTop:4}}>ACHIEVED</div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPass&&(
        <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.8)",backdropFilter:"blur(6px)",padding:20}} onClick={()=>setShowP(false)}>
          <div style={{width:"100%",maxWidth:340,background:"#0f0f1a",border:"1px solid rgba(139,92,246,0.25)",borderRadius:19,padding:20,animation:"up .3s ease"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:9,color:"#a78bfa",letterSpacing:2,marginBottom:12}}>CHANGE PASSWORD</div>
            {user.isGoogle?<a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" style={{display:"block",padding:"11px",background:"rgba(66,133,244,0.15)",border:"1px solid rgba(66,133,244,0.35)",borderRadius:11,color:"#60a5fa",fontSize:12,textAlign:"center",textDecoration:"none",fontFamily:"Rajdhani",fontWeight:700}}>🔗 Google Account Security</a>
            :<><Inp value={cp} onChange={e=>setCp(e.target.value)} placeholder="Current Password" type="password"/><Inp value={np} onChange={e=>setNp(e.target.value)} placeholder="New Password" type="password"/><Inp value={con} onChange={e=>setCon(e.target.value)} placeholder="Confirm" type="password" style={{marginBottom:0}}/>{pErr&&<div style={{color:"#ef4444",fontSize:10,marginTop:8}}>⚠️ {pErr}</div>}{pMsg&&<div style={{color:"#4ade80",fontSize:10,marginTop:8}}>{pMsg}</div>}<button onClick={handlePassChange} style={{width:"100%",marginTop:12,padding:"11px",background:"rgba(139,92,246,0.2)",border:"1px solid rgba(139,92,246,0.4)",borderRadius:11,color:"#c4b5fd",fontSize:12,cursor:"pointer",fontFamily:"Rajdhani",fontWeight:700,letterSpacing:1}}>UPDATE</button></>}
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{padding:"13px 16px 0",borderBottom:"1px solid rgba(255,255,255,0.06)",background:"rgba(0,0,0,0.3)",backdropFilter:"blur(20px)",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:11}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{fontFamily:"Orbitron",fontWeight:900,fontSize:14,background:"linear-gradient(90deg,#8b5cf6,#e879f9)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>GOD LEVEL</div>
          </div>
          <Clock/>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{background:"rgba(251,191,36,0.12)",border:"1px solid rgba(251,191,36,0.25)",borderRadius:9,padding:"3px 8px",fontSize:10,color:"#fbbf24"}}>🔥 {streak}</div>
            <RankBadge rank={rank} size="sm"/>
            <button onClick={onLogout} style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:7,padding:"4px 8px",color:"#ef4444",fontSize:9,cursor:"pointer",fontFamily:"Rajdhani"}}>EXIT</button>
          </div>
        </div>
        <div style={{display:"flex",gap:0}}>
          {navs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"5px 2px",border:"none",background:"transparent",cursor:"pointer",color:tab===t.id?rank.color:"#475569",borderBottom:`2px solid ${tab===t.id?rank.color:"transparent"}`,transition:"all .2s",fontSize:8,display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
              <span style={{fontSize:13}}>{t.icon}</span>
              <span style={{fontFamily:"Rajdhani",fontWeight:600}}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:16,position:"relative",zIndex:1,maxWidth:540,margin:"0 auto"}}>
        {penalty&&<PenaltyBanner penalty={penalty} onDismiss={()=>setPenalty(null)}/>}

        {/* DASHBOARD */}
        {tab==="dash"&&(
          <div style={{animation:"up .4s ease"}}>
            <Card border={rank.color} glow={rank.glow} style={{padding:20,marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
                <RankBadge rank={rank} size="lg"/>
                <div>
                  <div style={{fontSize:8,color:"#64748b",letterSpacing:3,marginBottom:2}}>CURRENT RANK</div>
                  <div style={{fontFamily:"Orbitron",fontSize:19,fontWeight:900,color:rank.color}}>{rank.label}</div>
                  <div style={{fontSize:9,color:"#94a3b8",marginTop:2}}>{xp.toLocaleString()} XP · {user.name}</div>
                </div>
              </div>
              {nxtRank?(<>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{fontSize:8,color:"#64748b"}}>To {nxtRank.label}</span>
                  <span style={{fontSize:8,color:rank.color,fontFamily:"monospace"}}>{xpIn}/{rank.xpNext}</span>
                </div>
                <XPBar cur={xpIn} max={rank.xpNext} color={rank.color} glow={rank.glow}/>
                <div style={{textAlign:"right",fontSize:7,color:"#475569",marginTop:3}}>{rank.xpNext-xpIn} XP needed</div>
              </>):<div style={{textAlign:"center",fontSize:11,color:rank.color,fontFamily:"Orbitron"}}>⚡ MAX RANK ACHIEVED</div>}
            </Card>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              {[
                {label:"Today's XP",value:done.reduce((s,id)=>s+(quests.find(q=>q.id===id)?.xp||0),0),icon:"⚡",color:"#fbbf24"},
                {label:"Streak",value:`${streak} days`,icon:"🔥",color:"#fb923c"},
                {label:"Quests",value:`${done.length}/${quests.length}`,icon:"✅",color:"#4ade80"},
                {label:"Rank",value:`#${RANKS.findIndex(r=>r.name===rank.name)+1}/9`,icon:"🏆",color:"#c4b5fd"},
              ].map((s,i)=>(
                <div key={i} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:12,display:"flex",alignItems:"center",gap:9}}>
                  <span style={{fontSize:22}}>{s.icon}</span>
                  <div><div style={{fontSize:15,fontWeight:700,color:s.color,fontFamily:"Orbitron"}}>{s.value}</div><div style={{fontSize:8,color:"#64748b",marginTop:1}}>{s.label}</div></div>
                </div>
              ))}
            </div>

            {/* Streak warning */}
            {streak===0&&(
              <div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:11,padding:"10px 14px",marginBottom:12,fontSize:11,color:"#ef4444"}}>
                ⚠️ Aaj koi quest nahi kiya! Miss karne pe {XP_MISS_DAY} XP katega. {DAYS_RESET} din miss = full reset!
              </div>
            )}

            <Card style={{padding:14,marginBottom:12}}>
              <div style={{fontSize:8,color:"#64748b",letterSpacing:2,marginBottom:10}}>TODAY'S MISSIONS</div>
              {quests.slice(0,4).map(q=>(
                <div key={q.id} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,0.04)",opacity:done.includes(q.id)?.4:1}}>
                  <span style={{fontSize:17}}>{q.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,fontWeight:600,color:done.includes(q.id)?"#475569":"#e2e8f0"}}>{q.name}</div>
                    <div style={{fontSize:8,color:catColor[q.category]}}>{q.category} · {q.target} reps</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:9,color:"#fbbf24",fontFamily:"monospace"}}>+{q.xp}</div>
                    {done.includes(q.id)&&<div style={{fontSize:8,color:"#4ade80"}}>✓</div>}
                  </div>
                </div>
              ))}
              <button onClick={()=>setTab("quests")} style={{width:"100%",marginTop:10,padding:"8px",border:`1px solid ${rank.color}44`,background:`${rank.glow}11`,borderRadius:9,color:rank.color,fontSize:9,cursor:"pointer",fontFamily:"Rajdhani",fontWeight:600,letterSpacing:1}}>VIEW ALL →</button>
            </Card>
          </div>
        )}

        {/* QUESTS */}
        {tab==="quests"&&(
          <div style={{animation:"up .4s ease"}}>
            <div style={{fontSize:8,color:"#64748b",letterSpacing:3,marginBottom:11}}>ACTIVE MISSIONS ({quests.length})</div>
            {quests.map(q=>{
              const d=done.includes(q.id);
              return(
                <div key={q.id} style={{background:d?"rgba(74,222,128,0.04)":"rgba(255,255,255,0.03)",border:`1px solid ${d?"#4ade8030":"rgba(255,255,255,0.07)"}`,borderRadius:14,padding:14,marginBottom:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:42,height:42,borderRadius:10,fontSize:21,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)"}}>{q.icon}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:d?"#64748b":"#e2e8f0",textDecoration:d?"line-through":"none"}}>{q.name}</div>
                      <div style={{display:"flex",gap:5,marginTop:3,flexWrap:"wrap"}}>
                        <Tag color={catColor[q.category]}>{q.category}</Tag>
                        <Tag color={diffColor[q.difficulty]}>{q.difficulty}</Tag>
                        <Tag color="#94a3b8">{q.target} reps</Tag>
                        {!["manual","timed"].includes(q.exerciseType)&&<Tag color="#e879f9">📷 Camera</Tag>}
                      </div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#fbbf24",fontFamily:"monospace"}}>+{q.xp}</div>
                      <div style={{fontSize:7,color:"#64748b"}}>XP</div>
                    </div>
                  </div>
                  <button onClick={()=>startCamQuest(q)} disabled={d} style={{width:"100%",marginTop:10,padding:"9px",border:d?"none":`1px solid ${rank.color}44`,background:d?"rgba(74,222,128,0.1)":`${rank.glow}22`,borderRadius:8,color:d?"#4ade80":rank.color,fontSize:11,cursor:d?"default":"pointer",fontFamily:"Rajdhani",fontWeight:700,letterSpacing:1,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
                    {d?"✓ COMPLETED":<>{!["manual","timed"].includes(q.exerciseType)&&"📷 "} START QUEST</>}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* STATS */}
        {tab==="stats"&&(
          <div style={{animation:"up .4s ease"}}>
            <Card border={rank.color} glow={rank.glow} style={{padding:20,marginBottom:12}}>
              <div style={{textAlign:"center",marginBottom:20}}>
                <RankBadge rank={rank} size="lg"/>
                <div style={{fontFamily:"Orbitron",fontSize:17,fontWeight:900,color:rank.color,marginTop:10}}>{user.name}</div>
                <div style={{fontSize:9,color:"#64748b",marginTop:2}}>{rank.label} Hunter</div>
              </div>
              <div style={{fontSize:8,color:"#64748b",letterSpacing:2,marginBottom:11}}>ATTRIBUTES</div>
              <StatBar label="STRENGTH"     val={stats.strength||10}     color="#f87171"/>
              <StatBar label="AGILITY"      val={stats.agility||10}      color="#4ade80"/>
              <StatBar label="ENDURANCE"    val={stats.endurance||10}    color="#fb923c"/>
              <StatBar label="VITALITY"     val={stats.vitality||10}     color="#c4b5fd"/>
              <StatBar label="INTELLIGENCE" val={stats.intelligence||10} color="#93c5fd"/>
            </Card>
            <Card style={{padding:16}}>
              <div style={{fontSize:8,color:"#64748b",letterSpacing:2,marginBottom:11}}>RANK PATH</div>
              <div style={{display:"flex",alignItems:"center",overflowX:"auto",paddingBottom:4}}>
                {RANKS.map((r,i)=>{
                  const isCur=r.name===rank.name,isPast=RANKS.indexOf(r)<RANKS.indexOf(rank);
                  return(
                    <div key={r.name} style={{display:"flex",alignItems:"center",flexShrink:0}}>
                      <div style={{textAlign:"center"}}>
                        <div style={{width:30,height:30,borderRadius:"50%",border:`2px solid ${isCur||isPast?r.color:"#1e293b"}`,display:"flex",alignItems:"center",justifyContent:"center",background:isCur?`${r.glow}33`:isPast?`${r.glow}11`:"#0f172a",boxShadow:isCur?`0 0 12px ${r.glow}88`:"none",fontSize:7,fontWeight:900,color:isCur||isPast?r.color:"#334155",fontFamily:"monospace"}}>{r.name}</div>
                        {isCur&&<div style={{fontSize:6,color:r.color,marginTop:2}}>YOU</div>}
                      </div>
                      {i<RANKS.length-1&&<div style={{width:14,height:2,background:isPast?`linear-gradient(90deg,${r.color},${RANKS[i+1].color})`:"#1e293b"}}/>}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* PROFILE */}
        {tab==="profile"&&(
          <div style={{animation:"up .4s ease"}}>
            <Card border={rank.color} glow={rank.glow} style={{padding:20,marginBottom:12,textAlign:"center"}}>
              <div style={{width:68,height:68,borderRadius:"50%",margin:"0 auto 12px",background:`linear-gradient(135deg,${rank.glow}44,${rank.glow}11)`,border:`3px solid ${rank.color}`,boxShadow:`0 0 26px ${rank.glow}66`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>{user.isGoogle?"🔵":"👤"}</div>
              <div style={{fontFamily:"Orbitron",fontSize:17,fontWeight:900,color:"#e2e8f0",marginBottom:2}}>{user.name}</div>
              <div style={{fontSize:10,color:rank.color,marginBottom:13}}>@{user.username} · {rank.label}</div>
              <div style={{display:"flex",justifyContent:"center",gap:20}}>
                {[{label:"Total XP",value:xp.toLocaleString()},{label:"Streak",value:`${streak}d 🔥`},{label:"Quests",value:hist.length}].map((s,i)=>(
                  <div key={i} style={{textAlign:"center"}}>
                    <div style={{fontSize:16,fontWeight:700,color:rank.color,fontFamily:"Orbitron"}}>{s.value}</div>
                    <div style={{fontSize:8,color:"#64748b"}}>{s.label}</div>
                  </div>
                ))}
              </div>
            </Card>
            <Card style={{padding:14,marginBottom:12}}>
              <div style={{fontSize:8,color:"#64748b",letterSpacing:2,marginBottom:11}}>ACCOUNT SETTINGS</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                <div><div style={{fontSize:11,fontWeight:600}}>Username</div><div style={{fontSize:9,color:"#64748b"}}>@{user.username} (locked 🔒)</div></div>
              </div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0"}}>
                <div><div style={{fontSize:11,fontWeight:600}}>Password</div><div style={{fontSize:9,color:"#64748b"}}>{user.isGoogle?"Via Google":"Change anytime"}</div></div>
                <button onClick={()=>setShowP(true)} style={{background:"rgba(139,92,246,0.15)",border:"1px solid rgba(139,92,246,0.3)",borderRadius:8,padding:"5px 11px",color:"#a78bfa",fontSize:9,cursor:"pointer",fontFamily:"Rajdhani",fontWeight:600}}>{user.isGoogle?"Via Google":"Change"}</button>
              </div>
            </Card>
            <Card style={{padding:14}}>
              <div style={{fontSize:8,color:"#64748b",letterSpacing:2,marginBottom:11}}>ACHIEVEMENTS</div>
              {[
                {name:"First Blood",desc:"Complete your first quest",icon:"⚔️",unlocked:hist.length>0},
                {name:"Iron Will",desc:"10 quests complete",icon:"🛡️",unlocked:hist.length>=10},
                {name:"7-Day Warrior",desc:"7 day streak",icon:"🔥",unlocked:streak>=7},
                {name:"Shadow Soldier",desc:"Reach C Rank",icon:"👥",unlocked:xp>=1700},
                {name:"Arise",desc:"Reach GOD LEVEL",icon:"🌌",unlocked:xp>=64200},
              ].map((a,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.04)",opacity:a.unlocked?1:.3}}>
                  <div style={{width:36,height:36,borderRadius:8,fontSize:17,display:"flex",alignItems:"center",justifyContent:"center",background:a.unlocked?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.02)"}}>{a.icon}</div>
                  <div style={{flex:1}}><div style={{fontSize:11,fontWeight:700,color:a.unlocked?"#e2e8f0":"#475569"}}>{a.name}</div><div style={{fontSize:9,color:"#64748b"}}>{a.desc}</div></div>
                  {a.unlocked&&<span style={{fontSize:12}}>✅</span>}
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* HISTORY */}
        {tab==="history"&&(
          <div style={{animation:"up .4s ease"}}>
            {/* Current session history */}
            <Card style={{padding:14,marginBottom:12}}>
              <div style={{fontSize:8,color:"#64748b",letterSpacing:2,marginBottom:11}}>📅 QUEST HISTORY</div>
              {hist.length===0
                ? <div style={{textAlign:"center",color:"#475569",fontSize:11,padding:"20px 0"}}>Abhi tak koi quest complete nahi hua.</div>
                : hist.map((h,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                    <span style={{fontSize:18}}>{h.icon||"⚡"}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,fontWeight:600,color:"#cbd5e1"}}>{h.quest}</div>
                      <div style={{fontSize:9,color:"#475569"}}>{fmt(h.date)}</div>
                    </div>
                    <div style={{fontSize:10,color:"#fbbf24",fontFamily:"monospace",fontWeight:700}}>+{h.xp} XP</div>
                  </div>
                ))
              }
            </Card>

            {/* Past progress (after resets) */}
            {pastProg.length>0&&(
              <Card style={{padding:14}}>
                <div style={{fontSize:8,color:"#ef4444",letterSpacing:2,marginBottom:11}}>🗂️ PAST PROGRESS (Reset Records)</div>
                {pastProg.map((p,i)=>(
                  <div key={i} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:11,padding:"12px 14px",marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                      <div style={{fontSize:10,color:"#94a3b8",fontFamily:"monospace"}}>Session #{pastProg.length-i}</div>
                      <Tag color="#ef4444">RESET</Tag>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                      {[{label:"XP Earned",val:p.xp?.toLocaleString()||"0"},{label:"Peak Rank",val:p.rank||"E"},{label:"Quests",val:p.completedQuests||0}].map((s,j)=>(
                        <div key={j} style={{textAlign:"center",background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"7px 4px"}}>
                          <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0",fontFamily:"Orbitron"}}>{s.val}</div>
                          <div style={{fontSize:8,color:"#64748b"}}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{fontSize:9,color:"#475569",marginTop:8,textAlign:"right"}}>{p.date}</div>
                  </div>
                ))}
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// ADMIN APP
// ════════════════════════════════════════════════════════
function Admin({ quests, setQuests, onLogout, adminCreds, setAdminCreds }) {
  const [tab,setTab]   = useState("quests");
  const [nq,setNQ]     = useState({name:"",target:10,category:"Strength",xp:100,icon:"💪",difficulty:"Medium",exerciseType:"pushup"});
  const [ann,setAnn]   = useState("");
  const [nu,setNu]     = useState(adminCreds.username);
  const [np,setNp]     = useState(""); const [nc,setNc]=useState("");
  const [cErr,setCErr] = useState(""); const [cMsg,setCMsg]=useState("");
  const [players]      = useState([
    {id:1,name:"Demo Player",username:"demo",xp:1900,rank:"C",streak:7,status:"Active",isGoogle:false},
    {id:2,name:"Rahul K",username:"rahul",xp:5200,rank:"B",streak:12,status:"Active",isGoogle:false},
    {id:3,name:"Google User",username:"googleuser",xp:400,rank:"E",streak:2,status:"Active",isGoogle:true},
  ]);

  const addQ = () => {
    if(!nq.name.trim()) return;
    setQuests(q=>[...q,{...nq,id:Date.now()}]);
    setNQ({name:"",target:10,category:"Strength",xp:100,icon:"💪",difficulty:"Medium",exerciseType:"pushup"});
  };

  const saveCreds = () => {
    setCErr(""); setCMsg("");
    if(!nu.trim()){ setCErr("Username cannot be empty."); return; }
    if(np&&np!==nc){ setCErr("Passwords don't match."); return; }
    setAdminCreds({username:nu,password:np||adminCreds.password});
    setNp(""); setNc("");
    setCMsg("Credentials updated! ✅"); setTimeout(()=>setCMsg(""),2500);
  };

  const navs=[{id:"quests",icon:"⚔️",label:"Quests"},{id:"players",icon:"👥",label:"Players"},{id:"announce",icon:"📢",label:"Announce"},{id:"settings",icon:"⚙️",label:"Settings"}];

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0a0005,#120010,#0a0005)",color:"#e2e8f0",fontFamily:"'Rajdhani',monospace",position:"relative",overflow:"hidden"}}>
      <GS/><Particles color="#ef4444"/>
      <div style={{padding:"13px 16px 0",borderBottom:"1px solid rgba(239,68,68,0.12)",background:"rgba(0,0,0,0.4)",backdropFilter:"blur(20px)",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:11}}>
          <div>
            <div style={{fontFamily:"Orbitron",fontWeight:900,fontSize:13,background:"linear-gradient(90deg,#ef4444,#f97316)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>ADMIN PANEL</div>
            <div style={{fontSize:7,color:"#64748b",letterSpacing:3}}>GOD LEVEL SYSTEM v4.0</div>
          </div>
          <Clock/>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:30,height:30,borderRadius:"50%",background:"rgba(239,68,68,0.2)",border:"2px solid rgba(239,68,68,0.5)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>🛡️</div>
            <button onClick={onLogout} style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:7,padding:"4px 8px",color:"#ef4444",fontSize:9,cursor:"pointer",fontFamily:"Rajdhani"}}>EXIT</button>
          </div>
        </div>
        <div style={{display:"flex",gap:0}}>
          {navs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"5px 2px",border:"none",background:"transparent",cursor:"pointer",color:tab===t.id?"#ef4444":"#475569",borderBottom:`2px solid ${tab===t.id?"#ef4444":"transparent"}`,transition:"all .2s",fontSize:8,display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
              <span style={{fontSize:12}}>{t.icon}</span>
              <span style={{fontFamily:"Rajdhani",fontWeight:600}}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:16,position:"relative",zIndex:1,maxWidth:540,margin:"0 auto"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:9,marginBottom:14}}>
          {[{label:"Players",value:players.length,icon:"👥",color:"#8b5cf6"},{label:"Quests",value:quests.length,icon:"⚔️",color:"#ef4444"},{label:"Active",value:2,icon:"🔥",color:"#fb923c"}].map((s,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${s.color}22`,borderRadius:12,padding:"12px 8px",textAlign:"center"}}>
              <div style={{fontSize:18}}>{s.icon}</div>
              <div style={{fontSize:18,fontWeight:700,color:s.color,fontFamily:"Orbitron",marginTop:2}}>{s.value}</div>
              <div style={{fontSize:8,color:"#64748b",marginTop:1}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* QUESTS */}
        {tab==="quests"&&(
          <div style={{animation:"up .4s ease"}}>
            <Card style={{padding:16,marginBottom:14}}>
              <div style={{fontSize:8,color:"#ef4444",letterSpacing:2,marginBottom:12}}>➕ ADD QUEST</div>
              <Inp value={nq.name} onChange={e=>setNQ(q=>({...q,name:e.target.value}))} placeholder="Quest name..."/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:10}}>
                <select value={nq.category} onChange={e=>setNQ(q=>({...q,category:e.target.value}))} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:9,padding:"9px",color:"#e2e8f0",fontSize:11,fontFamily:"Rajdhani"}}>
                  {["Strength","Agility","Endurance","Vitality","Intelligence"].map(o=><option key={o} value={o} style={{background:"#1e293b"}}>{o}</option>)}
                </select>
                <select value={nq.exerciseType} onChange={e=>setNQ(q=>({...q,exerciseType:e.target.value}))} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:9,padding:"9px",color:"#e2e8f0",fontSize:11,fontFamily:"Rajdhani"}}>
                  {["pushup","squat","jumping","situp","highknee","timed","manual"].map(o=><option key={o} value={o} style={{background:"#1e293b"}}>{o}</option>)}
                </select>
                <select value={nq.difficulty} onChange={e=>setNQ(q=>({...q,difficulty:e.target.value}))} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:9,padding:"9px",color:"#e2e8f0",fontSize:11,fontFamily:"Rajdhani"}}>
                  {["Easy","Medium","Hard"].map(o=><option key={o} value={o} style={{background:"#1e293b"}}>{o}</option>)}
                </select>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
                  <input type="number" value={nq.target} onChange={e=>setNQ(q=>({...q,target:Number(e.target.value)}))} placeholder="Reps" style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:9,padding:"9px",color:"#e2e8f0",fontSize:11,fontFamily:"Rajdhani",outline:"none"}}/>
                  <input type="number" value={nq.xp} onChange={e=>setNQ(q=>({...q,xp:Number(e.target.value)}))} placeholder="XP" style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:9,padding:"9px",color:"#e2e8f0",fontSize:11,fontFamily:"Rajdhani",outline:"none"}}/>
                </div>
              </div>
              <button onClick={addQ} style={{width:"100%",padding:"10px",background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.4)",borderRadius:10,color:"#ef4444",fontSize:11,cursor:"pointer",fontFamily:"Rajdhani",fontWeight:700,letterSpacing:1}}>+ ADD QUEST</button>
            </Card>
            <div style={{fontSize:8,color:"#64748b",letterSpacing:2,marginBottom:9}}>ALL QUESTS ({quests.length})</div>
            {quests.map(q=>(
              <div key={q.id} style={{display:"flex",alignItems:"center",gap:10,padding:12,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:11,marginBottom:7}}>
                <span style={{fontSize:18}}>{q.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,color:"#e2e8f0",fontWeight:600}}>{q.name}</div>
                  <div style={{display:"flex",gap:5,marginTop:3,flexWrap:"wrap"}}>
                    <Tag color={catColor[q.category]}>{q.category}</Tag>
                    <Tag color="#94a3b8">{q.target}r</Tag>
                    {!["manual","timed"].includes(q.exerciseType)&&<Tag color="#e879f9">📷</Tag>}
                  </div>
                </div>
                <div style={{fontSize:11,color:"#fbbf24",fontFamily:"monospace",fontWeight:700,marginRight:7}}>+{q.xp}</div>
                <button onClick={()=>setQuests(qs=>qs.filter(x=>x.id!==q.id))} style={{width:28,height:28,border:"1px solid rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.1)",borderRadius:7,color:"#ef4444",cursor:"pointer",fontSize:14}}>×</button>
              </div>
            ))}
          </div>
        )}

        {/* PLAYERS */}
        {tab==="players"&&(
          <div style={{animation:"up .4s ease"}}>
            {players.map(p=>{
              const r=RANKS.find(rk=>rk.name===p.rank)||RANKS[0];
              return(
                <div key={p.id} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:14,marginBottom:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:40,height:40,borderRadius:"50%",background:`${r.glow}33`,border:`2px solid ${r.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>{p.isGoogle?"🔵":"👤"}</div>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <div style={{fontSize:13,fontWeight:700}}>{p.name}</div>
                        {p.isGoogle&&<div style={{display:"inline-flex",alignItems:"center",background:"rgba(66,133,244,0.1)",border:"1px solid rgba(66,133,244,0.2)",borderRadius:99,padding:"1px 6px",fontSize:8,color:"#60a5fa"}}><GoogleIcon/></div>}
                      </div>
                      <div style={{fontSize:9,color:"#64748b"}}>@{p.username} · 🔥 {p.streak} streak</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:10,color:r.color,fontFamily:"Orbitron",fontWeight:700}}>{p.rank}</div>
                      <div style={{fontSize:9,color:"#64748b"}}>{p.xp.toLocaleString()} XP</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6,marginTop:10}}>
                    <button style={{flex:1,padding:"6px",background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.3)",borderRadius:7,color:"#8b5cf6",fontSize:9,cursor:"pointer",fontFamily:"Rajdhani",fontWeight:600}}>Edit XP</button>
                    <button style={{flex:1,padding:"6px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:7,color:"#ef4444",fontSize:9,cursor:"pointer",fontFamily:"Rajdhani",fontWeight:600}}>Ban</button>
                    <div style={{padding:"6px 10px",background:"rgba(74,222,128,0.1)",border:"1px solid rgba(74,222,128,0.3)",borderRadius:7,color:"#4ade80",fontSize:8,display:"flex",alignItems:"center"}}>{p.status}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ANNOUNCE */}
        {tab==="announce"&&(
          <div style={{animation:"up .4s ease"}}>
            <Card style={{padding:16,marginBottom:13}}>
              <div style={{fontSize:8,color:"#fbbf24",letterSpacing:2,marginBottom:11}}>📢 SEND ANNOUNCEMENT</div>
              <textarea value={ann} onChange={e=>setAnn(e.target.value)} placeholder="All players ke liye message..."
                style={{width:"100%",minHeight:80,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"10px 13px",color:"#e2e8f0",fontSize:12,fontFamily:"Rajdhani",resize:"vertical",outline:"none",marginBottom:10}}/>
              <button style={{width:"100%",padding:"10px",background:"rgba(251,191,36,0.15)",border:"1px solid rgba(251,191,36,0.4)",borderRadius:10,color:"#fbbf24",fontSize:11,cursor:"pointer",fontFamily:"Rajdhani",fontWeight:700,letterSpacing:1}}>📢 SEND TO ALL</button>
            </Card>
          </div>
        )}

        {/* SETTINGS */}
        {tab==="settings"&&(
          <div style={{animation:"up .4s ease"}}>
            <Card style={{padding:18,marginBottom:13}}>
              <div style={{fontSize:8,color:"#ef4444",letterSpacing:2,marginBottom:3}}>🛡️ ADMIN CREDENTIALS</div>
              <div style={{fontSize:10,color:"#64748b",marginBottom:14}}>Change username/password. No OTP needed.</div>
              <div style={{fontSize:9,color:"#94a3b8",marginBottom:5,fontFamily:"monospace"}}>USERNAME</div>
              <Inp value={nu} onChange={e=>setNu(e.target.value)} placeholder="Admin username"/>
              <div style={{fontSize:9,color:"#94a3b8",marginBottom:5,fontFamily:"monospace"}}>NEW PASSWORD <span style={{color:"#475569"}}>(empty = keep current)</span></div>
              <Inp value={np} onChange={e=>setNp(e.target.value)} placeholder="New password" type="password"/>
              <Inp value={nc} onChange={e=>setNc(e.target.value)} placeholder="Confirm" type="password" style={{marginBottom:0}}/>
              {cErr&&<div style={{color:"#ef4444",fontSize:10,marginTop:8}}>⚠️ {cErr}</div>}
              {cMsg&&<div style={{color:"#4ade80",fontSize:10,marginTop:8}}>{cMsg}</div>}
              <button onClick={saveCreds} style={{width:"100%",marginTop:12,padding:"11px",background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.4)",borderRadius:11,color:"#ef4444",fontSize:11,cursor:"pointer",fontFamily:"Rajdhani",fontWeight:700,letterSpacing:1}}>SAVE CREDENTIALS</button>
            </Card>

            <Card style={{padding:16}}>
              <div style={{fontSize:8,color:"#64748b",letterSpacing:2,marginBottom:12}}>STREAK SETTINGS</div>
              <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                <div><div style={{fontSize:11,fontWeight:600}}>XP Cut Per Miss Day</div><div style={{fontSize:9,color:"#64748b"}}>Currently {XP_MISS_DAY} XP</div></div>
                <Tag color="#ef4444">{XP_MISS_DAY} XP</Tag>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0"}}>
                <div><div style={{fontSize:11,fontWeight:600}}>Days Before Reset</div><div style={{fontSize:9,color:"#64748b"}}>Currently {DAYS_RESET} days</div></div>
                <Tag color="#f97316">{DAYS_RESET} days</Tag>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// ROOT
// ════════════════════════════════════════════════════════
export default function App() {
  const [user,setUser]         = useState(null);
  const [quests,setQuests]     = useState(DEFAULT_QUESTS);
  const [adminCreds,setAC]     = useState(INIT_ADMIN);

  if(!user) return <Auth onLogin={u=>setUser(u)} adminCreds={adminCreds}/>;
  if(user.isAdmin) return <Admin quests={quests} setQuests={setQuests} onLogout={()=>setUser(null)} adminCreds={adminCreds} setAdminCreds={setAC}/>;
  return <Player user={user} quests={quests} onLogout={()=>setUser(null)}/>;
}
