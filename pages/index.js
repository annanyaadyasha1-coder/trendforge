import { useState, useRef, useEffect } from "react";
import Head from "next/head";

const PLATFORMS = [
  { id:"youtube",   label:"YouTube",   emoji:"▶️", color:"#FF3B5C", tagline:"Direct from YouTube Trending API", dataSource:"YouTube Data API v3", sourceNote:"Trends pulled live from YouTube's own trending algorithm. Real view counts, engagement stats and publish times.", sourceBadge:"YouTube API v3", badgeColor:"#FF3B5C", honest:null },
  { id:"instagram", label:"Instagram", emoji:"📸", color:"#E1306C", tagline:"Via Google Search Signals",        dataSource:"Google Trends + Rising Queries", sourceNote:"Instagram has no public trending API. We use Google Search signals as a proxy — when people search a topic heavily, it's usually trending on Instagram too. This is the same method used by many professional trend tools.", sourceBadge:"Google Trends Proxy", badgeColor:"#FF9F0A", honest:"Instagram has no public API. These trends are detected via Google Search interest — a reliable proxy used across the industry, but not direct Instagram data." },
  { id:"both",      label:"Both",      emoji:"🚀", color:"#BF5AF2", tagline:"YouTube API + Google Trends",     dataSource:"YouTube Data API v3 + Google Trends", sourceNote:"Combines YouTube's native trending data with Google Search signals for the broadest trend picture. YouTube results are direct API data. Google signals serve as the Instagram proxy.", sourceBadge:"YouTube + Google", badgeColor:"#BF5AF2", honest:"YouTube trends are native API data. Instagram signals are detected via Google Search interest — a reliable proxy, but not direct Instagram data." },
];

const TIME_WINDOWS = [
  { id:"6",  emoji:"🚀", label:"Last 6 Hours",  sub:"First-mover edge",  color:"#32D74B" },
  { id:"24", emoji:"⚡", label:"Last 24 Hours", sub:"Best signal/noise", color:"#FF9F0A" },
  { id:"48", emoji:"🌊", label:"Last 48 Hours", sub:"Wider trend net",   color:"#0A84FF" },
];

const CREATOR_STAGES = [
  { id:"starter", emoji:"🌱", label:"Just Starting", sub:"0–500 followers"   },
  { id:"growing", emoji:"🌿", label:"Growing",        sub:"500–10K followers" },
  { id:"scaling", emoji:"🌳", label:"Scaling",        sub:"10K+ followers"    },
];

const LANGUAGES = [
  { id:"english",   label:"🇬🇧 English"   },
  { id:"hindi",     label:"🇮🇳 Hindi"      },
  { id:"tamil",     label:"🌟 Tamil"       },
  { id:"telugu",    label:"🌟 Telugu"      },
  { id:"malayalam", label:"🌟 Malayalam"   },
  { id:"odia",      label:"🌟 Odia"        },
  { id:"bengali",   label:"🌟 Bengali"     },
  { id:"marathi",   label:"🌟 Marathi"     },
  { id:"kannada",   label:"🌟 Kannada"     },
  { id:"punjabi",   label:"🌟 Punjabi"     },
  { id:"other",     label:"🌐 Other"       },
];

const NICHE_GROUPS = [
  { group:"🎥 Lifestyle & Vlogging", niches:["Daily Vlogging","Travel Vlogging","City & Urban Life","Van Life & Nomad","Couple / Family Vlog","Day-in-my-Life","Study With Me / Work With Me","Moving Abroad / Expat Life"] },
  { group:"💪 Health & Wellness",    niches:["Fitness & Gym","Running & Marathon","Mental Health & Wellness","Yoga & Mindfulness","Weight Loss Journey","Nutrition & Meal Prep"] },
  { group:"💄 Beauty & Fashion",     niches:["Beauty & Skincare","Makeup & GRWM","Fashion & Outfit Ideas","Sustainable Fashion","Men's Grooming & Style"] },
  { group:"🍳 Food & Cooking",       niches:["Home Cooking & Recipes","Restaurant Reviews","Street Food","Baking & Desserts","Vegan & Plant-Based"] },
  { group:"💰 Business & Money",     niches:["Business & Entrepreneurship","Personal Finance & Investing","Side Hustles","Real Estate","Crypto & Web3"] },
  { group:"🎮 Tech & Gaming",        niches:["Tech Reviews & Gadgets","Gaming & Esports","AI & Productivity","Coding & Dev Life"] },
  { group:"🎭 Entertainment",        niches:["Comedy & Skits","Pop Culture & Reactions","Music","Sports","True Crime"] },
  { group:"📚 Education & Self-Dev", niches:["Education & Explainers","Motivation & Mindset","Parenting & Family","Relationships & Dating","DIY & Home Decor","Pets & Animals"] },
  { group:"🎬 Film & Animation",     niches:["Film & Animation","Movie Reviews","Anime","Cartoons & Animation","Film Analysis"] },
];

const REGIONS = [
  { id:"global",         label:"🌍 Global"              },
  { id:"us",             label:"🇺🇸 United States"      },
  { id:"uk",             label:"🇬🇧 United Kingdom"     },
  { id:"uae",            label:"🇦🇪 UAE / Gulf"         },
  { id:"india",          label:"🇮🇳 India"              },
  { id:"nigeria",        label:"🇳🇬 Nigeria / W.Africa"  },
  { id:"australia",      label:"🇦🇺 Australia"          },
  { id:"canada",         label:"🇨🇦 Canada"             },
  { id:"brazil",         label:"🇧🇷 Brazil"             },
  { id:"europe",         label:"🇪🇺 Europe"             },
  { id:"southeast_asia", label:"🌏 Southeast Asia"      },
  { id:"latam",          label:"🌎 Latin America"       },
];

const OUTPUT_SECTIONS = [
  { key:"trendBrief",           icon:"🔥", label:"Trend Brief & Opportunity"  },
  { key:"videoIdeas",           icon:"💡", label:"3 Video Ideas"              },
  { key:"viralHooks",           icon:"🎣", label:"5 Viral Hooks"              },
  { key:"captions",             icon:"✍️",  label:"Captions & Hashtags"       },
  { key:"script",               icon:"📜", label:"30–60s Script"              },
  { key:"visualIdeas",          icon:"🎨", label:"Visual Concepts"            },
  { key:"shootingDirection",    icon:"🎬", label:"Shooting Direction"         },
  { key:"competitorGap",        icon:"🔭", label:"Competitor Gap"             },
  { key:"audioFormat",          icon:"🎵", label:"Format & Algorithm"         },
  { key:"performancePrediction",icon:"📊", label:"Performance Prediction"     },
  { key:"calendar",             icon:"📅", label:"7-Day Calendar"             },
  { key:"youtubeTitles",        icon:"🏆", label:"YouTube Titles (SEO)"       },
  { key:"youtubeDescription",   icon:"📝", label:"YouTube Description"        },
  { key:"youtubeTags",          icon:"🏷️",  label:"YouTube Tags"               },
];

const TIER_META = {
  1:{ badge:"🥇 First Mover", color:"#32D74B", bg:"rgba(50,215,75,0.08)",  border:"rgba(50,215,75,0.3)",  urgency:"Post within 4–6 hours — maximum first-mover advantage."  },
  2:{ badge:"⚡ Sweet Spot",  color:"#FF9F0A", bg:"rgba(255,159,10,0.08)", border:"rgba(255,159,10,0.3)", urgency:"Still time to win — differentiate your angle now."         },
  3:{ badge:"🌊 Late Wave",   color:"#0A84FF", bg:"rgba(10,132,255,0.08)", border:"rgba(10,132,255,0.3)", urgency:"Niche down hard — broad takes are already oversaturated."  },
  4:{ badge:"⚠️ Fading",      color:"#FF453A", bg:"rgba(255,69,58,0.08)",  border:"rgba(255,69,58,0.3)",  urgency:"Skip this — pivot to the next adjacent trend instead."     },
};

const SK = "trendforge_kits_v3";
const loadKits   = ()  => { try { return JSON.parse(localStorage.getItem(SK)||"[]"); } catch { return []; } };
const persistKit = kit => { try { const u=[kit,...loadKits()].slice(0,20); localStorage.setItem(SK,JSON.stringify(u)); return u; } catch { return []; } };
const removeKit  = id  => { try { const u=loadKits().filter(k=>k.id!==id); localStorage.setItem(SK,JSON.stringify(u)); return u; } catch { return []; } };

function Spinner({ text }) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:18,padding:"52px 0"}}>
      <div style={{position:"relative",width:64,height:64}}>
        <div style={{position:"absolute",inset:0,borderRadius:"50%",border:"2.5px solid transparent",borderTopColor:"#FF3B5C",borderRightColor:"#FF9F0A",animation:"spin 0.9s linear infinite"}}/>
        <div style={{position:"absolute",inset:10,borderRadius:"50%",border:"2.5px solid transparent",borderTopColor:"#BF5AF2",borderLeftColor:"#32D74B",animation:"spin 0.6s linear infinite reverse"}}/>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>⚡</div>
      </div>
      <p style={{color:"#555",fontSize:11,letterSpacing:2,textTransform:"uppercase"}}>{text}</p>
    </div>
  );
}

function CopyBtn({ text }) {
  const [c,setC]=useState(false);
  return (
    <button onClick={()=>{navigator.clipboard?.writeText(text);setC(true);setTimeout(()=>setC(false),2000)}}
      style={{background:c?"rgba(50,215,75,0.1)":"rgba(255,255,255,0.05)",border:`1px solid ${c?"rgba(50,215,75,0.35)":"rgba(255,255,255,0.1)"}`,color:c?"#32D74B":"#555",borderRadius:7,padding:"4px 12px",fontSize:10,cursor:"pointer",fontWeight:600,transition:"all 0.2s",flexShrink:0}}>
      {c?"✓ Copied":"Copy"}
    </button>
  );
}

function Tag({label,color="#555",bg="rgba(255,255,255,0.05)",border="rgba(255,255,255,0.1)"}) {
  return <span style={{background:bg,border:`1px solid ${border}`,color,borderRadius:6,padding:"3px 9px",fontSize:10,fontWeight:700,letterSpacing:0.8,textTransform:"uppercase",whiteSpace:"nowrap"}}>{label}</span>;
}

function RelevanceBadge({score=50}) {
  const c=score>=70?"#32D74B":score>=40?"#FF9F0A":"#FF453A";
  const l=score>=70?"✓ Niche Match":score>=40?"~ Partial Match":"⚠ Low Match";
  return <Tag label={l} color={c} bg={`${c}15`} border={`${c}44`}/>;
}

function DataSourceBanner({platform}) {
  const p=PLATFORMS.find(x=>x.id===platform);
  if(!p||!p.honest) return null;
  return (
    <div style={{background:"rgba(255,159,10,0.06)",border:"1px solid rgba(255,159,10,0.2)",borderRadius:14,padding:"14px 18px",marginTop:16,display:"flex",gap:12,alignItems:"flex-start"}}>
      <span style={{fontSize:18,flexShrink:0}}>ℹ️</span>
      <div>
        <div style={{fontSize:12,fontWeight:700,color:"#FF9F0A",marginBottom:4}}>How Instagram trends are detected</div>
        <div style={{fontSize:12,color:"#888",lineHeight:1.65}}>{p.honest}</div>
        <div style={{marginTop:8,fontSize:11,color:"#666"}}>Why this still works: Google search spikes and Instagram trends move together. This is the same signal method used by tools like BuzzSumo and Semrush.</div>
      </div>
    </div>
  );
}

function SourcePill({source,platform}) {
  const isProxy=source?.toLowerCase().includes("google")&&platform!=="youtube";
  return (
    <span style={{background:isProxy?"rgba(255,159,10,0.08)":"rgba(255,59,92,0.08)",border:`1px solid ${isProxy?"rgba(255,159,10,0.25)":"rgba(255,59,92,0.25)"}`,color:isProxy?"#FF9F0A":"#FF3B5C",borderRadius:6,padding:"2px 8px",fontSize:9,fontWeight:700,letterSpacing:0.8,textTransform:"uppercase",whiteSpace:"nowrap"}}>
      {isProxy?"📡 Google Proxy":"▶️ YouTube API"}
    </span>
  );
}

function OutputCard({section,text}) {
  return (
    <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 18px",background:"rgba(255,255,255,0.03)",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}><span style={{fontSize:16}}>{section.icon}</span><span style={{fontSize:12,fontWeight:700,color:"#ccc"}}>{section.label}</span></div>
        <CopyBtn text={text}/>
      </div>
      <div style={{padding:"16px 18px",fontSize:13.5,lineHeight:1.85,color:"#999",whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{text}</div>
    </div>
  );
}

function StepBar({step}) {
  const idx=["idle","fetchingTrends","error"].includes(step)?0:step==="pickTrend"?1:2;
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",marginBottom:36}}>
      {["Setup","Live Trends","Content Kit"].map((s,i)=>(
        <div key={s} style={{display:"flex",alignItems:"center"}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:i<=idx?"linear-gradient(135deg,#FF3B5C,#FF9F0A)":"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:i<=idx?"#fff":"#444",transition:"all 0.3s"}}>{i+1}</div>
            <span style={{fontSize:10,color:i<=idx?"#aaa":"#444",fontWeight:600}}>{s}</span>
          </div>
          {i<2&&<div style={{width:56,height:1.5,background:i<idx?"linear-gradient(90deg,#FF3B5C,#FF9F0A)":"rgba(255,255,255,0.08)",margin:"0 8px",marginBottom:18,transition:"background 0.3s"}}/>}
        </div>
      ))}
    </div>
  );
}

function TrendCard({trend,index,selected,onClick,disabled,onDismiss,activePlatform}) {
  const tm=TIER_META[trend.tier]||TIER_META[2];
  return (
    <div onClick={()=>!disabled&&onClick()} style={{background:selected?tm.bg:"rgba(255,255,255,0.025)",border:`1.5px solid ${selected?tm.border:"rgba(255,255,255,0.07)"}`,borderRadius:16,padding:"16px 18px",cursor:disabled?"not-allowed":"pointer",transition:"all 0.18s",opacity:disabled&&!selected?0.45:1,position:"relative"}}>
      {!selected&&<button onClick={e=>{e.stopPropagation();onDismiss(trend.title);}} title="Not relevant" style={{position:"absolute",top:12,right:12,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:8,width:30,height:30,cursor:"pointer",color:"#3a3a3a",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",zIndex:2}}>👎</button>}
      <div style={{display:"flex",gap:13,paddingRight:selected?0:38}}>
        <div style={{width:32,height:32,borderRadius:10,background:`${tm.color}18`,border:`1px solid ${tm.color}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:tm.color,flexShrink:0}}>{index+1}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:5}}>
            <span style={{fontWeight:700,fontSize:14,color:"#eee"}}>{trend.title}</span>
            <Tag label={tm.badge} color={tm.color} bg={tm.bg} border={tm.border}/>
            {trend.hoursOld!=null&&<Tag label={`~${trend.hoursOld}h ago`} color="#555"/>}
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:7}}>
            <RelevanceBadge score={trend.nicheRelevance||50}/>
            <SourcePill source={trend.source} platform={activePlatform}/>
          </div>
          <div style={{fontSize:12,color:"#555",lineHeight:1.55,marginBottom:6}}>{trend.why}</div>
          <div style={{fontSize:11,color:tm.color,fontWeight:600}}>{tm.urgency}</div>
        </div>
        {selected&&<div style={{background:tm.bg,color:tm.color,border:`1px solid ${tm.border}`,borderRadius:7,padding:"3px 10px",fontSize:10,fontWeight:700,flexShrink:0}}>✓ Active</div>}
      </div>
      {trend.saturation!=null&&(
        <div style={{marginTop:12,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.05)"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
            <span style={{fontSize:10,color:"#444",fontWeight:600,letterSpacing:0.5,textTransform:"uppercase"}}>Saturation</span>
            <span style={{fontSize:10,color:trend.saturation<40?"#32D74B":trend.saturation<70?"#FF9F0A":"#FF453A",fontWeight:700}}>{trend.saturation}%</span>
          </div>
          <div style={{height:4,background:"rgba(255,255,255,0.06)",borderRadius:2,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${trend.saturation}%`,background:trend.saturation<40?"linear-gradient(90deg,#32D74B,#30CF60)":trend.saturation<70?"linear-gradient(90deg,#FF9F0A,#FFCC02)":"linear-gradient(90deg,#FF453A,#FF6B35)",borderRadius:2}}/>
          </div>
          {trend.opportunityScore!=null&&<div style={{textAlign:"right",marginTop:5}}><span style={{fontSize:10,color:tm.color,fontWeight:700}}>Opportunity: {trend.opportunityScore}/100</span></div>}
        </div>
      )}
      {trend.stats&&(
        <div style={{display:"flex",gap:14,marginTop:10,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.04)",flexWrap:"wrap"}}>
          {trend.stats.views>0&&<span style={{fontSize:11,color:"#3a3a3a"}}>👁 {trend.stats.views.toLocaleString()} views</span>}
          {trend.stats.likes>0&&<span style={{fontSize:11,color:"#3a3a3a"}}>👍 {trend.stats.likes.toLocaleString()}</span>}
          {trend.stats.searches>0&&<span style={{fontSize:11,color:"#3a3a3a"}}>🔍 {trend.stats.searches.toLocaleString()}+ searches</span>}
          {trend.stats.relativeValue>0&&<span style={{fontSize:11,color:"#3a3a3a"}}>📈 {trend.stats.relativeValue>=5000?"Breakout":`+${trend.stats.relativeValue}%`}</span>}
        </div>
      )}
    </div>
  );
}

function SavedPanel({kits,onLoad,onDelete,onClose}) {
  if(!kits.length) return (
    <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:20,padding:"32px",textAlign:"center"}}>
      <div style={{fontSize:36,marginBottom:12}}>📭</div>
      <div style={{color:"#555",fontSize:13,marginBottom:20}}>No saved kits yet. Generate a content kit and tap "Save Kit" to store it here.</div>
      <button onClick={onClose} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"10px 20px",color:"#666",fontSize:13,fontWeight:700,cursor:"pointer"}}>← Back</button>
    </div>
  );
  return (
    <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:20,padding:"24px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div>
          <div style={{fontSize:10,color:"#BF5AF2",letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:5}}>💾 Saved Kits</div>
          <h2 style={{fontSize:16,fontWeight:800,color:"#eee"}}>{kits.length} kit{kits.length!==1?"s":""} saved</h2>
        </div>
        <button onClick={onClose} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"8px 14px",color:"#666",fontSize:12,fontWeight:700,cursor:"pointer"}}>← Back</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {kits.map(kit=>{
          const tm=TIER_META[kit.trend?.tier]||TIER_META[2];
          const p=PLATFORMS.find(x=>x.id===kit.platform)||PLATFORMS[0];
          return (
            <div key={kit.id} style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"14px 16px"}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6}}>
                    <Tag label={tm.badge} color={tm.color} bg={tm.bg} border={tm.border}/>
                    <Tag label={p.emoji+" "+p.label} color={p.color} bg={`${p.color}15`} border={`${p.color}35`}/>
                    <Tag label={kit.niche} color="#666"/>
                  </div>
                  <div style={{fontWeight:700,fontSize:13,color:"#ddd",marginBottom:3}}>"{kit.trend?.title}"</div>
                  <div style={{fontSize:11,color:"#3a3a3a"}}>Saved {new Date(kit.savedAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
                </div>
                <div style={{display:"flex",gap:6,flexShrink:0}}>
                  <button onClick={()=>onLoad(kit)} style={{background:"rgba(191,90,242,0.08)",border:"1px solid rgba(191,90,242,0.25)",borderRadius:8,padding:"7px 12px",color:"#BF5AF2",fontSize:11,fontWeight:700,cursor:"pointer"}}>Load</button>
                  <button onClick={()=>onDelete(kit.id)} style={{background:"rgba(255,69,58,0.06)",border:"1px solid rgba(255,69,58,0.2)",borderRadius:8,padding:"7px 10px",color:"#FF453A",fontSize:11,cursor:"pointer"}}>✕</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TrendForgePage() {
  const [platform,setPlatform]=useState("youtube");
  const [niche,setNiche]=useState("Daily Vlogging");
  const [customNiche,setCustomNiche]=useState("");
  const [nicheDescription,setNicheDescription]=useState("");
  const [mappingNiche,setMappingNiche]=useState(false);
  const [mappedResult,setMappedResult]=useState(null);
  const [region,setRegion]=useState("global");
  const [creatorStage,setCreatorStage]=useState("starter");
  const [language,setLanguage]=useState("english");
  const [timeWindow,setTimeWindow]=useState("24");
  const [step,setStep]=useState("idle");
  const [trends,setTrends]=useState([]);
  const [trendMeta,setTrendMeta]=useState(null);
  const [selectedTrend,setSelectedTrend]=useState(null);
  const [outputs,setOutputs]=useState({});
  const [generatingKey,setGeneratingKey]=useState("");
  const [errorMsg,setErrorMsg]=useState("");
  const [errorHint,setErrorHint]=useState("");
  const [dismissed,setDismissed]=useState([]);
  const [savedKits,setSavedKits]=useState([]);
  const [showSaved,setShowSaved]=useState(false);
  const [kitSaved,setKitSaved]=useState(false);
  const pickerRef=useRef(null);
  const resultsRef=useRef(null);

  useEffect(()=>{setSavedKits(loadKits());},[]);

  const activePlatform=PLATFORMS.find(p=>p.id===platform)||PLATFORMS[0];
  const activeNiche=customNiche.trim()||niche;
  const regionLabel=REGIONS.find(r=>r.id===region)?.label||"Global";
  const activeLanguage=LANGUAGES.find(l=>l.id===language)?.label||"English";
  const activeStage=CREATOR_STAGES.find(s=>s.id===creatorStage)||CREATOR_STAGES[0];
  const isBusy=step==="fetchingTrends"||step==="generating";
  const visible=trends.filter(t=>!dismissed.includes(t.title));
  const selectedTm=selectedTrend?(TIER_META[selectedTrend.tier]||TIER_META[2]):null;

  function doReset() {
    setStep("idle");
    setOutputs({});
    setSelectedTrend(null);
    setTrends([]);
    setKitSaved(false);
    setErrorMsg("");
    setErrorHint("");
    setDismissed([]);
    window.scrollTo({top:0,behavior:"smooth"});
  }

  async function doMapNiche() {
    if (!nicheDescription.trim()) return;
    setMappingNiche(true);
    setMappedResult(null);
    try {
      const res = await fetch("/api/mapNiche", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ description: nicheDescription }),
      });
      const data = await res.json();
      if (res.ok && data.matchedNiche) {
        setMappedResult(data);
        setNiche(data.matchedNiche);
        setCustomNiche(data.refinedLabel || "");
      } else {
        setMappedResult({ error: data.error || "Could not map niche" });
      }
    } catch {
      setMappedResult({ error: "Network error" });
    }
    setMappingNiche(false);
  }

  function acceptMappedNiche() {
    setNicheDescription("");
    setMappedResult(null);
  }

  function rejectMappedNiche() {
    setMappedResult(null);
    setNiche("Daily Vlogging");
    setCustomNiche("");
  }

  async function doFetchTrends() {
    setStep("fetchingTrends");
    setTrends([]);setSelectedTrend(null);setOutputs({});
    setErrorMsg("");setErrorHint("");setDismissed([]);setKitSaved(false);
    try {
      const res=await fetch(`/api/trends?${new URLSearchParams({window:timeWindow,region,niche:activeNiche,platform})}`);
      const data=await res.json();
      if(!res.ok){setErrorMsg(data.error||"Failed");setErrorHint(data.hint||"");setStep("error");return;}
      setTrends(data.trends||[]);setTrendMeta(data.meta||null);setStep("pickTrend");
      setTimeout(()=>pickerRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),150);
    } catch {
      setErrorMsg("Network error — cannot reach /api/trends.");
      setErrorHint("Make sure the dev server is running.");
      setStep("error");
    }
  }

  async function doGenerate(trend) {
    setSelectedTrend(trend);setStep("generating");setOutputs({});setKitSaved(false);
    setTimeout(()=>resultsRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),150);
    const body={trend,platform:activePlatform.label,niche:activeNiche,region:regionLabel,creatorStage,language:activeLanguage};
    for(const sec of OUTPUT_SECTIONS){
      setGeneratingKey(sec.key);
      try{
        const res=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...body,sectionKey:sec.key})});
        const d=await res.json();
        setOutputs(p=>({...p,[sec.key]:res.ok&&d.content?d.content:`⚠️ ${d.error||"Failed"}`}));
      } catch { setOutputs(p=>({...p,[sec.key]:"⚠️ Network error."})); }
    }
    setGeneratingKey("");setStep("done");
  }

  function doSaveKit(){
    const kit={id:Date.now().toString(),savedAt:new Date().toISOString(),trend:selectedTrend,platform,niche:activeNiche,region:regionLabel,stage:creatorStage,language:activeLanguage,window:timeWindow,outputs};
    setSavedKits(persistKit(kit));setKitSaved(true);setTimeout(()=>setKitSaved(false),3000);
  }

  function doLoadKit(kit){
    setPlatform(kit.platform||"youtube");setSelectedTrend(kit.trend);setOutputs(kit.outputs);setStep("done");setShowSaved(false);
    setTimeout(()=>resultsRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),200);
  }

  return (
    <>
      <Head>
        <title>TrendForge — Instagram & YouTube Trend Intelligence</title>
        <meta name="description" content="Real-time YouTube trends via YouTube API. Instagram trends via Google Search signals."/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
      </Head>
      <div style={{minHeight:"100vh",background:"#080809",position:"relative",overflow:"hidden"}}>
        <div style={{position:"fixed",top:-300,right:-200,width:700,height:700,background:"radial-gradient(circle,rgba(255,59,92,0.05) 0%,transparent 65%)",pointerEvents:"none",zIndex:0}}/>
        <div style={{position:"fixed",bottom:-200,left:-300,width:650,height:650,background:"radial-gradient(circle,rgba(191,90,242,0.04) 0%,transparent 65%)",pointerEvents:"none",zIndex:0}}/>
        <div style={{position:"relative",zIndex:1,maxWidth:800,margin:"0 auto",padding:"44px 20px 100px"}}>

          <div style={{textAlign:"center",marginBottom:40,animation:"fadeUp 0.5s ease both"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:22,flexWrap:"wrap"}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(255,59,92,0.07)",border:"1px solid rgba(255,59,92,0.18)",borderRadius:100,padding:"5px 16px"}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:"#FF3B5C",animation:"pulse 1.4s ease infinite"}}/>
                <span style={{fontSize:10,color:"#FF3B5C",letterSpacing:2.5,fontWeight:700,textTransform:"uppercase"}}>Live · YouTube API + Google Trends</span>
              </div>
              <button onClick={()=>setShowSaved(!showSaved)} style={{display:"inline-flex",alignItems:"center",gap:7,background:"rgba(191,90,242,0.07)",border:"1px solid rgba(191,90,242,0.2)",borderRadius:100,padding:"5px 16px",cursor:"pointer",color:"#BF5AF2",fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>
                💾 Saved Kits {savedKits.length>0&&<span style={{background:"rgba(191,90,242,0.2)",borderRadius:100,padding:"1px 7px"}}>{savedKits.length}</span>}
              </button>
            </div>
            <h1 style={{fontSize:"clamp(40px,8vw,64px)",fontWeight:900,letterSpacing:-2.5,lineHeight:0.95,background:"linear-gradient(135deg,#fff 0%,#444 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:16}}>TrendForge</h1>
            <p style={{color:"#444",fontSize:14.5,lineHeight:1.7,maxWidth:480,margin:"0 auto"}}>Spot what's trending on YouTube and Instagram. Get a complete content kit — hooks, script, captions, visual plan and 7-day calendar — in under 5 minutes.</p>
          </div>

          {showSaved&&<div style={{marginBottom:18,animation:"fadeUp 0.3s ease both"}}><SavedPanel kits={savedKits} onLoad={doLoadKit} onDelete={id=>{setSavedKits(removeKit(id));}} onClose={()=>setShowSaved(false)}/></div>}

          {!showSaved&&(
            <>
              <StepBar step={step}/>

              {/* SETTINGS PANEL — always visible, collapses when busy */}
              <div style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:24,padding:"28px",marginBottom:18,animation:"fadeUp 0.5s ease 0.06s both"}}>

                {/* Edit Settings bar — shown after results generated */}
                {["generating","done"].includes(step)&&(
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,padding:"12px 16px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12}}>
                    <div>
                      <span style={{fontSize:12,color:"#666",fontWeight:600}}>⚙️ Settings locked while kit is active</span>
                      <div style={{fontSize:11,color:"#444",marginTop:2}}>{activeNiche} · {regionLabel} · {activeLanguage}</div>
                    </div>
                    <button onClick={doReset} style={{background:"rgba(255,59,92,0.08)",border:"1px solid rgba(255,59,92,0.25)",borderRadius:10,padding:"8px 16px",color:"#FF3B5C",fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
                      ⚙️ Edit Settings
                    </button>
                  </div>
                )}

                {/* Hide controls when generating/done */}
                {!["generating","done"].includes(step)&&(
                  <>
                    <div style={{marginBottom:20}}>
                      <label style={{display:"block",fontSize:10,color:"#444",letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:12}}>Platform</label>
                      <div style={{display:"flex",gap:8}}>
                        {PLATFORMS.map(p=>(
                          <button key={p.id} onClick={()=>!isBusy&&setPlatform(p.id)} style={{flex:1,background:platform===p.id?`${p.color}18`:"rgba(255,255,255,0.03)",border:`1.5px solid ${platform===p.id?`${p.color}66`:"rgba(255,255,255,0.07)"}`,borderRadius:12,padding:"13px 8px",cursor:isBusy?"not-allowed":"pointer",color:platform===p.id?p.color:"#555",fontWeight:700,fontSize:13,transition:"all 0.18s",textAlign:"center"}}>
                            <div style={{fontSize:18,marginBottom:3}}>{p.emoji}</div>
                            <div>{p.label}</div>
                            <div style={{fontSize:9,fontWeight:500,opacity:0.65,marginTop:2,lineHeight:1.3}}>{p.tagline}</div>
                          </button>
                        ))}
                      </div>
                      <div style={{marginTop:12,padding:"10px 14px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:10,display:"flex",alignItems:"flex-start",gap:10}}>
                        <span style={{fontSize:13,flexShrink:0}}>🔌</span>
                        <div style={{fontSize:11,color:"#555",lineHeight:1.6}}>
                          <span style={{color:activePlatform.badgeColor,fontWeight:700}}>{activePlatform.sourceBadge}:</span>{" "}{activePlatform.sourceNote}
                        </div>
                      </div>
                      <DataSourceBanner platform={platform}/>
                    </div>

                    <div style={{marginBottom:24}}>
                      <label style={{display:"block",fontSize:10,color:"#444",letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:12}}>⏱ Time Window</label>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                        {TIME_WINDOWS.map(tw=>(
                          <button key={tw.id} onClick={()=>!isBusy&&setTimeWindow(tw.id)} style={{background:timeWindow===tw.id?`${tw.color}18`:"rgba(255,255,255,0.03)",border:`1.5px solid ${timeWindow===tw.id?`${tw.color}66`:"rgba(255,255,255,0.07)"}`,borderRadius:11,padding:"12px 8px",cursor:isBusy?"not-allowed":"pointer",color:timeWindow===tw.id?tw.color:"#555",fontWeight:700,fontSize:12,transition:"all 0.18s",textAlign:"center"}}>
                            <div style={{fontSize:15,marginBottom:2}}>{tw.emoji}</div>
                            <div>{tw.label}</div>
                            <div style={{fontSize:10,fontWeight:400,opacity:0.6,marginTop:1}}>{tw.sub}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{marginBottom:16}}>
                      <label style={{display:"block",fontSize:10,color:"#444",letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:12}}>Your Niche</label>

                      {/* Smart niche mapper */}
                      <div style={{background:"rgba(191,90,242,0.05)",border:"1px solid rgba(191,90,242,0.15)",borderRadius:12,padding:"14px 16px",marginBottom:12}}>
                        <div style={{fontSize:11,color:"#BF5AF2",fontWeight:700,marginBottom:8}}>✨ Tell us what you do — we'll find your niche</div>
                        <div style={{display:"flex",gap:8}}>
                          <input
                            type="text"
                            value={nicheDescription}
                            onChange={e=>setNicheDescription(e.target.value)}
                            onKeyDown={e=>e.key==="Enter"&&!mappingNiche&&doMapNiche()}
                            placeholder="e.g. I make couple vlogs with my husband, we travel India..."
                            disabled={isBusy||mappingNiche}
                            style={{flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(191,90,242,0.2)",borderRadius:9,padding:"10px 14px",color:"#ddd",fontSize:12.5}}
                          />
                          <button
                            onClick={doMapNiche}
                            disabled={isBusy||mappingNiche||!nicheDescription.trim()}
                            style={{background:mappingNiche?"rgba(255,255,255,0.04)":"rgba(191,90,242,0.15)",border:"1px solid rgba(191,90,242,0.3)",borderRadius:9,padding:"10px 16px",color:mappingNiche?"#444":"#BF5AF2",fontSize:12,fontWeight:700,cursor:(!nicheDescription.trim()||mappingNiche)?"not-allowed":"pointer",whiteSpace:"nowrap"}}
                          >
                            {mappingNiche?"Mapping...":"→ Find Niche"}
                          </button>
                        </div>

                        {/* Mapping result */}
                        {mappedResult&&!mappedResult.error&&(
                          <div style={{marginTop:12,background:"rgba(50,215,75,0.05)",border:"1px solid rgba(50,215,75,0.2)",borderRadius:9,padding:"12px 14px"}}>
                            <div style={{fontSize:11,color:"#32D74B",fontWeight:700,marginBottom:4}}>✓ Niche matched!</div>
                            <div style={{fontSize:13,color:"#ddd",fontWeight:700,marginBottom:3}}>{mappedResult.refinedLabel}</div>
                            <div style={{fontSize:11,color:"#666",marginBottom:3}}>Category: {mappedResult.matchedNiche}</div>
                            <div style={{fontSize:11,color:"#555",marginBottom:10}}>{mappedResult.reason}</div>
                            <div style={{display:"flex",gap:8}}>
                              <button onClick={acceptMappedNiche} style={{flex:1,background:"rgba(50,215,75,0.1)",border:"1px solid rgba(50,215,75,0.3)",borderRadius:8,padding:"8px",color:"#32D74B",fontSize:11,fontWeight:700,cursor:"pointer"}}>✓ Yes, that's me</button>
                              <button onClick={rejectMappedNiche} style={{flex:1,background:"rgba(255,69,58,0.06)",border:"1px solid rgba(255,69,58,0.2)",borderRadius:8,padding:"8px",color:"#FF453A",fontSize:11,fontWeight:700,cursor:"pointer"}}>✗ Pick manually</button>
                            </div>
                          </div>
                        )}
                        {mappedResult?.error&&(
                          <div style={{marginTop:10,fontSize:11,color:"#FF453A"}}>⚠️ {mappedResult.error} — please pick manually below.</div>
                        )}
                      </div>

                      {/* Manual dropdown */}
                      <div style={{position:"relative"}}>
                        <select value={niche} onChange={e=>{setNiche(e.target.value);setCustomNiche("");setMappedResult(null);}} disabled={isBusy} style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:11,padding:"12px 40px 12px 16px",color:"#ccc",fontSize:13,cursor:"pointer"}}>
                          {NICHE_GROUPS.map(g=>(
                            <optgroup key={g.group} label={g.group} style={{background:"#151515",color:"#888"}}>
                              {g.niches.map(n=><option key={n} value={n} style={{background:"#151515",color:"#ccc"}}>{n}</option>)}
                            </optgroup>
                          ))}
                        </select>
                        <span style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",color:"#444",pointerEvents:"none",fontSize:11}}>▾</span>
                      </div>
                    </div>

                    <div style={{marginBottom:24}}>
                      <input type="text" value={customNiche} onChange={e=>setCustomNiche(e.target.value)} placeholder="Or type your own niche: e.g. Sustainable Vlogging, Dog Training..." disabled={isBusy} style={{width:"100%",background:"rgba(255,255,255,0.03)",border:`1.5px solid ${customNiche?"rgba(255,59,92,0.3)":"rgba(255,255,255,0.07)"}`,borderRadius:11,padding:"12px 16px",color:"#ddd",fontSize:13,transition:"border-color 0.2s"}}/>
                    </div>

                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                      <div>
                        <label style={{display:"block",fontSize:10,color:"#444",letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:12}}>📍 Region</label>
                        <div style={{position:"relative"}}>
                          <select value={region} onChange={e=>setRegion(e.target.value)} disabled={isBusy} style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:11,padding:"12px 36px 12px 14px",color:"#ccc",fontSize:12.5,cursor:"pointer"}}>
                            {REGIONS.map(r=><option key={r.id} value={r.id} style={{background:"#151515"}}>{r.label}</option>)}
                          </select>
                          <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",color:"#444",pointerEvents:"none",fontSize:11}}>▾</span>
                        </div>
                      </div>
                      <div>
                        <label style={{display:"block",fontSize:10,color:"#444",letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:12}}>🗣️ Language</label>
                        <div style={{position:"relative"}}>
                          <select value={language} onChange={e=>setLanguage(e.target.value)} disabled={isBusy} style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:11,padding:"12px 36px 12px 14px",color:"#ccc",fontSize:12.5,cursor:"pointer"}}>
                            {LANGUAGES.map(l=><option key={l.id} value={l.id} style={{background:"#151515"}}>{l.label}</option>)}
                          </select>
                          <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",color:"#444",pointerEvents:"none",fontSize:11}}>▾</span>
                        </div>
                      </div>
                    </div>

                    <div style={{marginBottom:28}}>
                      <label style={{display:"block",fontSize:10,color:"#444",letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:12}}>Creator Stage</label>
                      <div style={{display:"flex",gap:8}}>
                        {CREATOR_STAGES.map(s=>(
                          <button key={s.id} onClick={()=>!isBusy&&setCreatorStage(s.id)} style={{flex:1,background:creatorStage===s.id?"rgba(191,90,242,0.1)":"rgba(255,255,255,0.03)",border:`1.5px solid ${creatorStage===s.id?"rgba(191,90,242,0.4)":"rgba(255,255,255,0.07)"}`,borderRadius:11,padding:"12px 8px",cursor:isBusy?"not-allowed":"pointer",color:creatorStage===s.id?"#BF5AF2":"#555",fontWeight:700,fontSize:12,transition:"all 0.18s",textAlign:"center"}}>
                            <div style={{fontSize:15,marginBottom:2}}>{s.emoji}</div>
                            <div>{s.label}</div>
                            <div style={{fontSize:10,fontWeight:400,opacity:0.6,marginTop:1}}>{s.sub}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button onClick={doFetchTrends} disabled={isBusy} style={{width:"100%",padding:"16px",background:isBusy?"rgba(255,255,255,0.04)":"linear-gradient(135deg,#FF3B5C 0%,#FF9F0A 100%)",backgroundSize:"200% 200%",animation:!isBusy?"glow 3s ease infinite":"none",border:"none",borderRadius:13,color:isBusy?"#333":"#fff",fontSize:15,fontWeight:800,cursor:isBusy?"not-allowed":"pointer",transition:"opacity 0.2s"}}>
                      {step==="fetchingTrends"?`🔍 Fetching from ${activePlatform.dataSource}...`:`⚡ Find ${timeWindow}h ${activePlatform.label} Trends — ${regionLabel}`}
                    </button>
                  </>
                )}
              </div>

              {step==="error"&&<div style={{background:"rgba(255,59,92,0.06)",border:"1px solid rgba(255,59,92,0.2)",borderRadius:14,padding:"18px 22px",marginBottom:18}}><div style={{color:"#FF3B5C",fontSize:14,fontWeight:700,marginBottom:errorHint?8:0}}>{errorMsg}</div>{errorHint&&<div style={{color:"#FF453A",fontSize:12,opacity:0.8}}>{errorHint}</div>}</div>}
              {step==="fetchingTrends"&&<Spinner text={`Fetching from ${activePlatform.dataSource} · ${activeNiche} · ${regionLabel}...`}/>}

              {["pickTrend","generating","done"].includes(step)&&trends.length>0&&(
                <div ref={pickerRef} style={{animation:"fadeUp 0.4s ease both",marginBottom:18}}>
                  <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:24,padding:"24px"}}>
                    <div style={{marginBottom:18}}>
                      <div style={{fontSize:10,color:"#FF3B5C",letterSpacing:2.5,textTransform:"uppercase",fontWeight:700,marginBottom:7}}>🔥 Trends · {activeNiche} · {activePlatform.label} · {regionLabel} · Last {timeWindow}h</div>
                      <h2 style={{fontSize:17,fontWeight:800,color:"#eee",marginBottom:8}}>{["generating","done"].includes(step)?"Kit generating below ↓":"Pick a trend — tap to build your full content kit"}</h2>
                      {trendMeta&&(
                        <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:10,padding:"10px 14px",marginBottom:14}}>
                          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                            <span style={{fontSize:10,color:"#444"}}>Data sources:</span>
                            {trendMeta.sources?.map(s=><span key={s} style={{fontSize:10,color:s.includes("Google")?"#FF9F0A":"#FF3B5C",fontWeight:700}}>{s.includes("YouTube")?"▶️":"📡"} {s}</span>)}
                            <span style={{fontSize:10,color:"#333",marginLeft:"auto"}}>Fetched {new Date(trendMeta.fetchedAt).toLocaleTimeString()}</span>
                          </div>
                          {(platform==="instagram"||platform==="both")&&<div style={{marginTop:6,fontSize:10,color:"#555",lineHeight:1.5}}>📡 Google Proxy trends = strong signal this topic is circulating on Instagram right now.</div>}
                        </div>
                      )}
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{Object.values(TIER_META).map(tm=><Tag key={tm.badge} label={tm.badge} color={tm.color} bg={tm.bg} border={tm.border}/>)}</div>
                    </div>
                    {step==="pickTrend"&&<div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:8}}><span>👎</span><span style={{fontSize:11,color:"#3a3a3a"}}>Tap 👎 on any trend that's not relevant — it vanishes instantly.</span></div>}
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {visible.length===0?<div style={{textAlign:"center",padding:"28px 0",color:"#444",fontSize:13}}>All trends dismissed. <button onClick={doFetchTrends} style={{background:"none",border:"none",color:"#FF9F0A",cursor:"pointer",fontWeight:700,fontSize:13,padding:0}}>Refresh →</button></div>
                      :visible.map((trend,i)=><TrendCard key={trend.title} trend={trend} index={i} selected={selectedTrend?.title===trend.title} disabled={isBusy} activePlatform={platform} onClick={()=>doGenerate(trend)} onDismiss={t=>setDismissed(p=>[...p,t])}/>)}
                    </div>
                    {step==="pickTrend"&&visible.length>0&&<p style={{marginTop:14,fontSize:11,color:"#333",textAlign:"center"}}>Tap any trend → full kit generates instantly · 🥇 Tier 1 = most opportunity</p>}
                  </div>
                </div>
              )}

              {["generating","done"].includes(step)&&selectedTrend&&(
                <div ref={resultsRef} style={{animation:"fadeUp 0.4s ease both"}}>
                  <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:24,padding:"24px"}}>
                    <div style={{marginBottom:20}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:8}}>
                        <div style={{fontSize:10,color:"#32D74B",letterSpacing:2,textTransform:"uppercase",fontWeight:700}}>✨ Content Kit</div>
                        {selectedTm&&<Tag label={selectedTm.badge} color={selectedTm.color} bg={selectedTm.bg} border={selectedTm.border}/>}
                        <Tag label={activePlatform.emoji+" "+activePlatform.label} color={activePlatform.color} bg={`${activePlatform.color}15`} border={`${activePlatform.color}35`}/>
                        <Tag label={`${selectedTrend.saturation}% saturated`} color={selectedTrend.saturation<40?"#32D74B":selectedTrend.saturation<70?"#FF9F0A":"#FF453A"}/>
                        <Tag label={activeStage.emoji+" "+activeStage.label} color="#BF5AF2" bg="rgba(191,90,242,0.08)" border="rgba(191,90,242,0.25)"/>
                        <Tag label={"🗣️ "+activeLanguage} color="#0A84FF" bg="rgba(10,132,255,0.08)" border="rgba(10,132,255,0.25)"/>
                        <RelevanceBadge score={selectedTrend.nicheRelevance||50}/>
                      </div>
                      <h2 style={{fontSize:16,fontWeight:800,color:"#eee",marginBottom:4}}>"{selectedTrend.title}"</h2>
                      <p style={{fontSize:12,color:"#444"}}>{selectedTrend.momentum} · ~{selectedTrend.hoursOld}h old · {regionLabel} · {activePlatform.label} · {activeLanguage}</p>
                      {selectedTm&&<p style={{fontSize:12,color:selectedTm.color,marginTop:5,fontWeight:600}}>⏰ {selectedTm.urgency}</p>}
                      <div style={{marginTop:10,padding:"8px 12px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:9,display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:11}}>🔌</span>
                        <span style={{fontSize:10,color:"#444"}}>Trend detected via <span style={{color:activePlatform.badgeColor,fontWeight:700}}>{activePlatform.sourceBadge}</span>{activePlatform.honest&&<span style={{color:"#3a3a3a"}}> · {activePlatform.honest}</span>}</span>
                      </div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {OUTPUT_SECTIONS.map(sec=>{
                        const text=outputs[sec.key];
                        const isGen=generatingKey===sec.key;
                        const isPend=!text&&!isGen&&step==="generating";
                        return (
                          <div key={sec.key}>
                            {isPend&&<div style={{background:"rgba(255,255,255,0.015)",border:"1px solid rgba(255,255,255,0.04)",borderRadius:13,padding:"14px 16px",display:"flex",alignItems:"center",gap:9}}><span style={{fontSize:15}}>{sec.icon}</span><span style={{fontSize:12,color:"#2a2a2a"}}>{sec.label}</span></div>}
                            {isGen&&<div style={{background:"rgba(255,159,10,0.05)",border:"1px solid rgba(255,159,10,0.15)",borderRadius:13,padding:"14px 16px",display:"flex",alignItems:"center",gap:9}}><span style={{fontSize:15,animation:"pulse 0.7s ease infinite"}}>{sec.icon}</span><span style={{fontSize:12,color:"#FF9F0A"}}>Writing {sec.label}...</span></div>}
                            {text&&<OutputCard section={sec} text={text}/>}
                          </div>
                        );
                      })}
                    </div>
                    {step==="done"&&(
                      <div style={{marginTop:24,paddingTop:20,borderTop:"1px solid rgba(255,255,255,0.05)"}}>
                        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                          <button onClick={doReset} style={{flex:1,minWidth:120,padding:"13px",background:"rgba(255,59,92,0.08)",border:"1px solid rgba(255,59,92,0.25)",borderRadius:11,color:"#FF3B5C",fontSize:13,fontWeight:700,cursor:"pointer"}}>⚙️ Edit Settings</button>
                          <button onClick={()=>{setStep("pickTrend");setOutputs({});setSelectedTrend(null);setKitSaved(false);}} style={{flex:1,minWidth:120,padding:"13px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:11,color:"#666",fontSize:13,fontWeight:700,cursor:"pointer"}}>← Try Another</button>
                          <button onClick={doSaveKit} style={{flex:1,minWidth:120,padding:"13px",background:kitSaved?"rgba(50,215,75,0.1)":"rgba(191,90,242,0.1)",border:`1px solid ${kitSaved?"rgba(50,215,75,0.3)":"rgba(191,90,242,0.3)"}`,borderRadius:11,color:kitSaved?"#32D74B":"#BF5AF2",fontSize:13,fontWeight:700,cursor:"pointer",transition:"all 0.2s"}}>{kitSaved?"✓ Kit Saved!":"💾 Save Kit"}</button>
                          <button onClick={doFetchTrends} style={{flex:1,minWidth:120,padding:"13px",background:"linear-gradient(135deg,#FF3B5C,#FF9F0A)",backgroundSize:"200% 200%",animation:"glow 3s ease infinite",border:"none",borderRadius:11,color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer"}}>🔄 New Trends</button>
                        </div>
                        <p style={{textAlign:"center",marginTop:12,fontSize:10,color:"#2a2a2a"}}>
                          {platform==="youtube"&&"YouTube Data API v3"}
                          {platform==="instagram"&&"Google Trends (Instagram proxy) — search interest signals, not native Instagram data"}
                          {platform==="both"&&"YouTube Data API v3 + Google Trends (Instagram proxy)"}
                          {" · "}{new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
