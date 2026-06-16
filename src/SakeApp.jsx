--- repo-SakeApp.jsx	2026-06-16 00:49:12.455624858 +0000
+++ SakeApp.jsx	2026-06-16 02:10:16.812592420 +0000
@@ -37,6 +37,48 @@
 };
 
 // ===== メインアプリ =====
+// ===== 都道府県（地方別）・酒米 マスタ =====
+const PREFECTURES_BY_REGION = {
+  '北海道・東北': ['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県'],
+  '関東': ['茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県'],
+  '中部': ['新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県'],
+  '近畿': ['三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県'],
+  '中国': ['鳥取県','島根県','岡山県','広島県','山口県'],
+  '四国': ['徳島県','香川県','愛媛県','高知県'],
+  '九州・沖縄': ['福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'],
+};
+const ALL_PREFECTURES = Object.values(PREFECTURES_BY_REGION).flat();
+const SAKE_RICE_OPTIONS = ['山田錦','五百万石','美山錦','雄町','愛山','出羽燦々','八反錦','亀の尾','秋田酒こまち','吟風','彗星','百万石乃白','越淡麗','ひとごこち','山田穂','渡船','きたしずく','風さやか','玉栄','強力'];
+const RICE_OTHER = 'その他';
+const RICE_UNKNOWN = '不明（後で入力）';
+
+const PrefectureSelect = ({ value, onChange }) => (
+  <select value={value || ''} onChange={onChange}>
+    <option value="">選択してください</option>
+    {Object.entries(PREFECTURES_BY_REGION).map(([region, prefs]) => (
+      <optgroup key={region} label={region}>
+        {prefs.map(p => <option key={p} value={p}>{p}</option>)}
+      </optgroup>
+    ))}
+  </select>
+);
+
+const RiceField = ({ value, onChange }) => {
+  const v = value || '';
+  const selVal = (SAKE_RICE_OPTIONS.includes(v) || v === RICE_OTHER || v === RICE_UNKNOWN) ? v : '';
+  return (
+    <>
+      <select value={selVal} onChange={(e) => onChange(e.target.value)} style={{ marginBottom: 8 }}>
+        <option value="">リストから選ぶ…</option>
+        {SAKE_RICE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
+        <option value={RICE_OTHER}>{RICE_OTHER}</option>
+        <option value={RICE_UNKNOWN}>{RICE_UNKNOWN}</option>
+      </select>
+      <input type="text" value={v} onChange={(e) => onChange(e.target.value)} placeholder="酒米を手入力（後から調べて入力もOK）" />
+    </>
+  );
+};
+
 const SakeApp = () => {
   const [currentScreen, setCurrentScreen] = useState('splash');
   const [isAuthenticated, setIsAuthenticated] = useState(false);
@@ -44,6 +86,8 @@
   const [sakes, setSakes] = useState([]);
   const [selectedSake, setSelectedSake] = useState(null);
   const [filterCategory, setFilterCategory] = useState('all');
+  const [filterRegion, setFilterRegion] = useState('all');
+  const [filterRice, setFilterRice] = useState('all');
   const [userName, setUserName] = useState('');
   const [showNameInput, setShowNameInput] = useState(false);
   const [editingReport, setEditingReport] = useState(null);
@@ -385,15 +429,22 @@
       if (!frontImage) { alert('表ラベルの写真を撮影してください'); return; }
       setAnalyzing(true);
       try {
-        const base64Data = frontImage.split(',')[1];
-        const response = await fetch('/api/vision', {
-          method: 'POST',
-          headers: { 'Content-Type': 'application/json' },
-          body: JSON.stringify({ image: base64Data })
-        });
-        const data = await response.json();
-        const text = data.responses?.[0]?.fullTextAnnotation?.text || '';
-        const lines = [...new Set(text.split('\n').map(l => l.trim()).filter(l => l.length > 0))];
+        const ocrLines = async (dataUrl) => {
+          const res = await fetch('/api/vision', {
+            method: 'POST',
+            headers: { 'Content-Type': 'application/json' },
+            body: JSON.stringify({ image: dataUrl.split(',')[1] })
+          });
+          const d = await res.json();
+          const t = d.responses?.[0]?.fullTextAnnotation?.text || '';
+          return t.split('\n').map(l => l.trim()).filter(l => l.length > 0);
+        };
+        let merged = await ocrLines(frontImage);
+        if (backImage) {
+          const back = await ocrLines(backImage);
+          merged = [...merged, ...back];
+        }
+        const lines = [...new Set(merged)];
         const categoryKeywords = ['純米大吟醸','純米吟醸','特別純米','純米酒','大吟醸','吟醸','特別本醸造','本醸造','普通酒'];
         let detectedCategory = '';
         for (const line of lines) {
@@ -401,11 +452,23 @@
             if (line.includes(cat) && !detectedCategory) detectedCategory = cat;
           }
         }
-        setAnalysisResult({ name: '', category: detectedCategory, brewery: '', lines });
+        let detectedPref = '';
+        for (const line of lines) {
+          for (const p of ALL_PREFECTURES) {
+            if (line.includes(p) && !detectedPref) detectedPref = p;
+          }
+        }
+        let detectedRice = '';
+        for (const line of lines) {
+          for (const r of SAKE_RICE_OPTIONS) {
+            if (line.includes(r) && !detectedRice) detectedRice = r;
+          }
+        }
+        setAnalysisResult({ name: '', category: detectedCategory, brewery: '', prefecture: detectedPref, sakeRice: detectedRice, lines });
       } catch (error) {
         console.error('Vision API error:', error);
         alert('❌ 解析に失敗しました。手動で入力してください。');
-        setAnalysisResult({ name: '', category: '', brewery: '', lines: [] });
+        setAnalysisResult({ name: '', category: '', brewery: '', prefecture: '', sakeRice: '', lines: [] });
       }
       setAnalyzing(false);
     };
@@ -419,6 +482,8 @@
         name: analysisResult.name.trim(),
         category: analysisResult.category,
         brewery: analysisResult.brewery.trim(),
+        prefecture: (analysisResult.prefecture || '').trim(),
+        sakeRice: analysisResult.sakeRice || '',
         frontImage,
         backImage,
         rating: 0,
@@ -426,7 +491,7 @@
         createdAt: new Date().toISOString()
       };
       await saveSake(newSake);
-      alert('✅ 登録が完了しました！\n\n📝 銘柄: ' + newSake.name + '\n🏷️ カテゴリー: ' + newSake.category + '\n🏭 蔵元: ' + newSake.brewery);
+      alert('✅ 登録が完了しました！\n\n📝 銘柄: ' + newSake.name + '\n🏷️ カテゴリー: ' + newSake.category + '\n🏭 蔵元: ' + newSake.brewery + (newSake.prefecture ? '\n📍 都道府県: ' + newSake.prefecture : '') + (newSake.sakeRice ? '\n🌾 酒米: ' + newSake.sakeRice : ''));
       setAnalysisResult(null); setFrontImage(null); setBackImage(null);
       setSaving(false);
     };
@@ -502,6 +567,8 @@
                           <div className="ocr-line-btns">
                             <button className="ocr-use-btn" onClick={() => setAnalysisResult({...analysisResult, name: line})}>銘柄名</button>
                             <button className="ocr-use-btn" onClick={() => setAnalysisResult({...analysisResult, brewery: line})}>蔵元</button>
+                            <button className="ocr-use-btn" onClick={() => { const p = ALL_PREFECTURES.find(pp => line.includes(pp)); setAnalysisResult({...analysisResult, prefecture: p || analysisResult.prefecture}); }}>都道府県</button>
+                            <button className="ocr-use-btn" onClick={() => { const r = SAKE_RICE_OPTIONS.find(rr => line.includes(rr)); setAnalysisResult({...analysisResult, sakeRice: r || line}); }}>酒米</button>
                           </div>
                         </div>
                       ))}
@@ -521,9 +588,17 @@
                     </select>
                   </div>
                   <div className="form-group">
-                    <label>蔵元（都道府県）</label>
+                    <label>蔵元</label>
                     <input type="text" value={analysisResult.brewery} onChange={(e) => setAnalysisResult({...analysisResult, brewery: e.target.value})} placeholder="上のテキストをタップ or 直接入力" />
                   </div>
+                  <div className="form-group">
+                    <label>都道府県</label>
+                    <PrefectureSelect value={analysisResult.prefecture} onChange={(e) => setAnalysisResult({...analysisResult, prefecture: e.target.value})} />
+                  </div>
+                  <div className="form-group">
+                    <label>酒米</label>
+                    <RiceField value={analysisResult.sakeRice} onChange={(val) => setAnalysisResult({...analysisResult, sakeRice: val})} />
+                  </div>
                 </div>
                 <div className="confirmation-buttons">
                   <button className="save-btn" onClick={saveSakeEntry} disabled={saving}>
@@ -586,6 +661,7 @@
                     <h4>{sake.name}</h4>
                     <p>{sake.category}</p>
                     <p>{sake.brewery}</p>
+                    {(sake.prefecture || sake.sakeRice) && <p style={{fontSize:'12px',color:'#888'}}>{[sake.prefecture, sake.sakeRice].filter(Boolean).join(' / ')}</p>}
                   </div>
                   <div className="admin-sake-actions">
                     <button className="edit-btn-small" onClick={() => setEditingSake({...sake})}>✏️ 編集</button>
@@ -606,7 +682,9 @@
                         {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                     </div>
-                    <div className="form-group"><label>蔵元（都道府県）</label><input type="text" value={editingSake.brewery} onChange={(e) => setEditingSake({...editingSake, brewery: e.target.value})} /></div>
+                    <div className="form-group"><label>蔵元</label><input type="text" value={editingSake.brewery || ''} onChange={(e) => setEditingSake({...editingSake, brewery: e.target.value})} /></div>
+                    <div className="form-group"><label>都道府県</label><PrefectureSelect value={editingSake.prefecture} onChange={(e) => setEditingSake({...editingSake, prefecture: e.target.value})} /></div>
+                    <div className="form-group"><label>酒米</label><RiceField value={editingSake.sakeRice} onChange={(val) => setEditingSake({...editingSake, sakeRice: val})} /></div>
                   </div>
                   <div className="modal-buttons">
                     <button className="modal-btn save-btn" onClick={updateSakeEntry}>更新</button>
@@ -644,9 +722,27 @@
       {id:'普通酒',name:'普通酒'},{id:'その他',name:'その他'},{id:'不明',name:'不明'}
     ];
     const knownCats = ['純米大吟醸','純米吟醸','特別本醸造','大吟醸','吟醸','純米酒','特別純米','本醸造','普通酒','その他','不明'];
-    const filteredSakes = filterCategory === 'all' ? sakes
-      : filterCategory === 'その他' ? sakes.filter(s => !knownCats.includes(s.category))
-      : sakes.filter(s => s.category === filterCategory);
+    const regionOf = (pref) => {
+      for (const [region, prefs] of Object.entries(PREFECTURES_BY_REGION)) {
+        if (prefs.includes(pref)) return region;
+      }
+      return '';
+    };
+    const matchesCategory = (s) => filterCategory === 'all' ? true
+      : filterCategory === 'その他' ? !knownCats.includes(s.category)
+      : s.category === filterCategory;
+    const filteredSakes = sakes.filter(s =>
+      matchesCategory(s)
+      && (filterRegion === 'all' || regionOf(s.prefecture) === filterRegion)
+      && (filterRice === 'all' || (s.sakeRice || '') === filterRice)
+    );
+    const presentRegions = Object.keys(PREFECTURES_BY_REGION).filter(r => sakes.some(s => regionOf(s.prefecture) === r));
+    const riceOrder = [...SAKE_RICE_OPTIONS, RICE_OTHER, RICE_UNKNOWN];
+    const presentRices = [...new Set(sakes.map(s => s.sakeRice).filter(Boolean))]
+      .sort((a, b) => {
+        const ia = riceOrder.indexOf(a), ib = riceOrder.indexOf(b);
+        return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
+      });
 
     return (
       <div className="screen sake-list-screen">
@@ -660,6 +756,22 @@
             <button key={cat.id} className={'category-tab ' + (filterCategory === cat.id ? 'active' : '')} onClick={() => setFilterCategory(cat.id)}>{cat.name}</button>
           ))}
         </div>
+        {presentRegions.length > 0 && (
+          <div className="category-tabs">
+            <button className={'category-tab ' + (filterRegion === 'all' ? 'active' : '')} onClick={() => setFilterRegion('all')}>地域：すべて</button>
+            {presentRegions.map(r => (
+              <button key={r} className={'category-tab ' + (filterRegion === r ? 'active' : '')} onClick={() => setFilterRegion(r)}>{r}</button>
+            ))}
+          </div>
+        )}
+        {presentRices.length > 0 && (
+          <div className="category-tabs">
+            <button className={'category-tab ' + (filterRice === 'all' ? 'active' : '')} onClick={() => setFilterRice('all')}>酒米：すべて</button>
+            {presentRices.map(r => (
+              <button key={r} className={'category-tab ' + (filterRice === r ? 'active' : '')} onClick={() => setFilterRice(r)}>{r}</button>
+            ))}
+          </div>
+        )}
         <div className="sake-list">
           {filteredSakes.length === 0 ? (
             <div className="no-reports" style={{marginTop:40}}><p>まだ銘柄が登録されていません</p></div>
@@ -682,6 +794,7 @@
                 {sake.reportCount > 0 && <span className="report-badge">評価済み</span>}
                 <h3>{sake.name}</h3>
                 <p>{sake.brewery}</p>
+                {(sake.prefecture || sake.sakeRice) && <p style={{fontSize:'12px',color:'#999',margin:'2px 0 0'}}>{[sake.prefecture, sake.sakeRice].filter(Boolean).join(' / ')}</p>}
                 {sake.rating > 0 && <div className="sake-rating">⭐ {sake.rating.toFixed(1)}</div>}
               </div>
               <ChevronLeft size={20} style={{transform:'rotate(180deg)', flexShrink:0}} />
@@ -721,7 +834,8 @@
               {selectedSake?.backImage && <div className="sake-preview-small"><img src={selectedSake.backImage} alt="裏" /></div>}
             </div>
             <h3 className="sake-name">{selectedSake?.name}</h3>
-            <p className="sake-meta">{selectedSake?.category} / {selectedSake?.brewery}</p>
+            <p className="sake-meta">{selectedSake?.category} / {selectedSake?.brewery}{selectedSake?.prefecture ? '（' + selectedSake.prefecture + '）' : ''}</p>
+            {selectedSake?.sakeRice && <p className="sake-meta">🌾 酒米: {selectedSake.sakeRice}</p>}
             {selectedSake?.rating > 0 && (
               <div className="sake-rating-large">⭐ {selectedSake.rating.toFixed(1)}点<span className="report-count">（{reports.length}件の評価）</span></div>
             )}
@@ -843,7 +957,7 @@
             )}
           </div>
           <h3 className="sake-name">{selectedSake?.name}</h3>
-          <p className="sake-meta">{selectedSake?.category} {selectedSake?.brewery}</p>
+          <p className="sake-meta">{selectedSake?.category} {selectedSake?.brewery}{selectedSake?.prefecture ? '（' + selectedSake.prefecture + '）' : ''}{selectedSake?.sakeRice ? ' / 🌾' + selectedSake.sakeRice : ''}</p>
           <div className="evaluation-section">
             <h4>味の構成</h4>
             <StarRating value={formData.sweetness} maxStars={5} onChange={v => setFormData({...formData, sweetness: v})} label="甘辛度" leftLabel="甘" rightLabel="辛" />
