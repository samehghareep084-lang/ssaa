const videos = window.SEKSawyVideos || [];
const params = new URLSearchParams(location.search);
const video = videos.find(v => v.id === params.get("id")) || videos[0];
const $ = id => document.getElementById(id);
let db = null;
let visitorId = localStorage.getItem("seksawy_visitor_id");
if (!visitorId) { visitorId = (crypto.randomUUID ? crypto.randomUUID() : "v-" + Date.now() + Math.random()); localStorage.setItem("seksawy_visitor_id", visitorId); }
const cfg = window.SEKSAWY_CONFIG || {};
if (window.supabase && cfg.supabaseUrl && cfg.supabaseAnonKey) db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);

function escapeHTML(s="") { return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function toast(message) { const el=$("toast"); el.textContent=message; el.classList.add("show"); setTimeout(()=>el.classList.remove("show"),2600); }
function initVideo() {
  if (!video) { toast("الفيديو غير موجود"); return; }
  document.title = `${video.title} | سكساوي`;
  $("watchTitle").textContent = video.title;
  $("watchCategory").textContent = video.category || "عام";
  $("watchViews").textContent = video.views || "مشاهدة";
  $("watchDate").textContent = video.channel || "سكساوي";
  $("watchDescription").textContent = video.description || "لا يوجد وصف لهذا الفيديو.";
  if (video.video) { $("videoPlayer").src = video.video; $("playerPlaceholder").classList.add("hidden"); }
  else { $("videoPlayer").style.display="none"; }
  const related = videos.filter(v=>v.id!==video.id).slice(0,5);
  $("relatedVideos").innerHTML = related.map(v=>`<a class="related-card" href="watch.html?id=${encodeURIComponent(v.id)}"><img src="${escapeHTML(v.image)}" alt=""><div><h3>${escapeHTML(v.title)}</h3><p>${escapeHTML(v.channel||"سكساوي")}</p></div></a>`).join("");
}
async function loadReactions() {
  if (!db) { $("likeCount").textContent="—"; $("dislikeCount").textContent="—"; return; }
  const {data,error}=await db.from("reactions").select("reaction").eq("video_id",video.id);
  if(error){console.warn(error);return;}
  const likes=data.filter(x=>x.reaction==="like").length, dislikes=data.filter(x=>x.reaction==="dislike").length;
  $("likeCount").textContent=likes; $("dislikeCount").textContent=dislikes;
  const mine=await db.from("reactions").select("reaction").eq("video_id",video.id).eq("visitor_id",visitorId).maybeSingle();
  $("likeBtn").classList.toggle("selected",mine.data?.reaction==="like");
  $("dislikeBtn").classList.toggle("selected",mine.data?.reaction==="dislike");
}
async function react(type) {
  if(!db){toast("فعّل Supabase لحفظ الإعجابات بين الزوار");return;}
  const {data:existing}=await db.from("reactions").select("id,reaction").eq("video_id",video.id).eq("visitor_id",visitorId).maybeSingle();
  let result;
  if(existing?.reaction===type) result=await db.from("reactions").delete().eq("id",existing.id);
  else result=await db.from("reactions").upsert({video_id:video.id,visitor_id:visitorId,reaction:type},{onConflict:"video_id,visitor_id"});
  if(result.error){toast("حصلت مشكلة، جرّب تاني");console.error(result.error);return;}
  await loadReactions();
}
async function loadComments() {
  if(!db){$("commentCount").textContent="قاعدة التعليقات غير مفعّلة";$("commentsList").innerHTML='<p class="muted-note">اربط Supabase عشان التعليقات تتحفظ وتظهر لكل الزوار.</p>';return;}
  const {data,error}=await db.from("comments").select("id,name,body,created_at").eq("video_id",video.id).order("created_at",{ascending:false}).limit(100);
  if(error){console.error(error);return;}
  $("commentCount").textContent=`${data.length} تعليق`;
  $("commentsList").innerHTML=data.map(c=>`<article class="comment"><div class="comment-avatar">${escapeHTML((c.name||"ز").slice(0,1))}</div><div class="comment-body"><strong>${escapeHTML(c.name||"زائر")}</strong><small>${new Date(c.created_at).toLocaleString("ar-EG")}</small><p>${escapeHTML(c.body)}</p></div></article>`).join("") || '<p class="muted-note">لسه مفيش تعليقات. كن أول واحد يعلّق!</p>';
}
$("likeBtn").addEventListener("click",()=>react("like"));
$("dislikeBtn").addEventListener("click",()=>react("dislike"));
$("shareBtn").addEventListener("click",async()=>{
  const url=location.href;
  try { if(navigator.share) await navigator.share({title:video.title,url}); else {await navigator.clipboard.writeText(url);toast("تم نسخ رابط الفيديو");} }
  catch(e){ if(e.name!=="AbortError") toast("انسخ رابط الصفحة من المتصفح"); }
});
$("commentForm").addEventListener("submit",async e=>{
  e.preventDefault();
  if(!db){toast("فعّل Supabase الأول لحفظ التعليقات");return;}
  const body=$("commentText").value.trim(), name=$("commentName").value.trim()||"زائر";
  if(!body)return;
  const {error}=await db.from("comments").insert({video_id:video.id,name,body});
  if(error){toast("لم يتم نشر التعليق");console.error(error);return;}
  $("commentText").value=""; await loadComments(); toast("تم نشر تعليقك");
});
initVideo();
loadReactions();
loadComments();
function escapeAttr(s=""){return escapeHTML(s);}
