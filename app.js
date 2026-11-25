const videos = window.SEKSawyVideos || [];
const grid = document.getElementById("videoGrid");
const categories = [...new Set(videos.map(v => v.category || "عام"))];
let activeFilter = "all";
let searchTerm = "";

function cardMarkup(video) {
  const safeTitle = escapeHTML(video.title);
  return `<article class="video-card" data-id="${escapeHTML(video.id)}" tabindex="0" role="link" aria-label="مشاهدة ${safeTitle}">
    <div class="thumb"><img src="${escapeAttr(video.image)}" alt="${safeTitle}" loading="lazy" onerror="this.style.display='none'"><div class="play-overlay"><span>▶</span></div><span class="duration">${escapeHTML(video.duration || "")}</span></div>
    <div class="card-info"><div class="channel-avatar">س</div><div><h3>${safeTitle}</h3><p>${escapeHTML(video.channel || "سكساوي")} · ${escapeHTML(video.views || "")}</p></div></div>
  </article>`;
}
function render() {
  const filtered = videos.filter(v => (activeFilter === "all" || v.category === activeFilter) &&
    (v.title + " " + (v.description || "") + " " + (v.channel || "")).toLowerCase().includes(searchTerm));
  grid.innerHTML = filtered.map(cardMarkup).join("");
  document.getElementById("videoCount").textContent = `${filtered.length} فيديو`;
  document.getElementById("emptyState").classList.toggle("hidden", filtered.length > 0);
  document.getElementById("sectionTitle").textContent = activeFilter === "all" ? (searchTerm ? "نتائج البحث" : "أحدث الفيديوهات") : activeFilter;
}
function goToVideo(id) { location.href = `watch.html?id=${encodeURIComponent(id)}`; }
grid.addEventListener("click", e => { const card = e.target.closest(".video-card"); if (card) goToVideo(card.dataset.id); });
grid.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("video-card")) goToVideo(e.target.dataset.id); });
document.getElementById("searchForm").addEventListener("submit", e => { e.preventDefault(); searchTerm = document.getElementById("searchInput").value.trim().toLowerCase(); render(); });
document.getElementById("searchInput").addEventListener("input", e => { searchTerm = e.target.value.trim().toLowerCase(); render(); });
document.querySelector('[data-filter="all"]').addEventListener("click", () => { activeFilter = "all"; render(); });
const categoryList = document.getElementById("categoryList");
categoryList.innerHTML = categories.map(c => `<button class="side-link" data-category="${escapeAttr(c)}"><span>◈</span>${escapeHTML(c)}</button>`).join("");
categoryList.addEventListener("click", e => { const b = e.target.closest("[data-category]"); if (b) { activeFilter = b.dataset.category; render(); }});
render();
function escapeHTML(s="") { return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function escapeAttr(s="") { return escapeHTML(s); }
