import{m as Wt,B as ye,g as k,k as zt,n as V,l as tt,p as z,q,r as we,u as G,v as U,w as wt,x as je,y as Pe,z as C,A as Ee,D as ut,E as Ie,F as Ut,G as jt,I as Qt,J as bt,L as Ae,C as Be,d as Yt,H as Le,e as Me,T as Se,M as Te,N as Ne,O as De}from"./index-NTvR9Jlh.js";import{r as $e}from"./renderInlineComposer-BX98fI5A.js";function Xt(i){return Array.isArray(i)?i:i.results}function S(i){return encodeURIComponent(String(i))}function ze(i={}){const t=[];return i.card&&t.push(`card=${encodeURIComponent(i.card)}`),i.entity_type&&t.push(`entity_type=${encodeURIComponent(i.entity_type)}`),i.entity_id&&t.push(`entity_id=${encodeURIComponent(i.entity_id)}`),t.length?`?${t.join("&")}`:""}class Fe{constructor(t){this.http=t}getBoards(){return this.http.get("/boards/").pipe(Wt(Xt))}createBoard(t){return this.http.post("/boards/",t)}updateBoard(t,e){return this.http.patch(`/boards/${S(t)}/`,e)}deleteBoard(t){return this.http.delete(`/boards/${S(t)}/`)}createColumn(t){return this.http.post("/columns/",t)}updateColumn(t,e){return this.http.patch(`/columns/${S(t)}/`,e)}deleteColumn(t){return this.http.delete(`/columns/${S(t)}/`)}createCard(t){return this.http.post("/cards/",t)}updateCard(t,e){return this.http.patch(`/cards/${S(t)}/`,e)}deleteCard(t){return this.http.delete(`/cards/${S(t)}/`)}getCardChecklists(t){return this.http.get(`/cards/${S(t)}/checklists/`)}createCardChecklist(t,e){return this.http.post(`/cards/${S(t)}/checklists/`,e)}updateCardChecklist(t,e){return this.http.patch(`/card-checklists/${S(t)}/`,e)}deleteCardChecklist(t){return this.http.delete(`/card-checklists/${S(t)}/`)}createCardCheckItem(t,e){return this.http.post(`/card-checklists/${S(t)}/items/`,e)}updateCardCheckItem(t,e){return this.http.patch(`/card-check-items/${S(t)}/`,e)}deleteCardCheckItem(t){return this.http.delete(`/card-check-items/${S(t)}/`)}getCardEntityLinks(t={}){return this.http.get(`/card-entity-links/${ze(t)}`).pipe(Wt(Xt))}createCardEntityLink(t){return this.http.post("/card-entity-links/",t)}deleteCardEntityLink(t){return this.http.delete(`/card-entity-links/${S(t)}/`)}createCardPlacement(t){return this.http.post("/card-placements/",t)}updateCardPlacement(t,e){return this.http.patch(`/card-placements/${S(t)}/`,e)}deleteCardPlacement(t){return this.http.delete(`/card-placements/${S(t)}/`)}}function j(i){return i.placement_id??i.id}function Vt(i){const t=i.pos??i.order??0,e=Number(t);return Number.isFinite(e)?e:0}function Oe(i,t){return Vt(i)-Vt(t)||j(i).localeCompare(j(t))||i.id.localeCompare(t.id)}const Tt="boards-session-selected-board";function be(i){if(typeof i!="string")return null;const t=i.trim();return t.length>0?t:null}function Jt(i,t){return t!==null&&i.some(e=>e.id===t)}function qe(){try{return be(sessionStorage.getItem(Tt))}catch{return null}}function Zt(i){try{const t=be(i);if(t){sessionStorage.setItem(Tt,t);return}sessionStorage.removeItem(Tt)}catch{}}function Re(i,t){var a;if(Jt(i,t))return t;const e=qe();return Jt(i,e)?e:((a=i[0])==null?void 0:a.id)??null}const Ke=["lastOpenedAt","last_opened_at","lastActivityAt","last_activity_at","updatedAt","updated_at","createdAt","created_at"];function yt(i){const t=i.meta;return t&&typeof t=="object"&&!Array.isArray(t)?t:null}function Ft(i){return{...yt(i)??{}}}function He(i,t){const e=yt(i);if(!e)return!1;for(const a of t){const o=e[a];if(typeof o=="boolean")return o}return!1}function vt(i){return He(i,["favorite","favourite","starred"])}function Pt(i){const t=yt(i);if(!t)return null;for(const e of Ke){const a=t[e],o=typeof a=="string"||typeof a=="number"?new Date(a).getTime():null;if(typeof o=="number"&&Number.isFinite(o))return o}return null}function Nt(i){const t=yt(i);if(!t)return null;const e=t.group;if(e&&typeof e=="object"&&!Array.isArray(e)){const r=e,n=typeof r.id=="string"?r.id.trim():"",s=typeof r.name=="string"?r.name.trim():"";if(n||s)return{id:n||s,name:s||n}}const a=typeof t.groupId=="string"?t.groupId.trim():typeof t.group_id=="string"?t.group_id.trim():"",o=typeof t.groupName=="string"?t.groupName.trim():typeof t.group_name=="string"?t.group_name.trim():"";return!a&&!o?null:{id:a||o,name:o||a}}function Ge(i,t){return{...Ft(i),favorite:t}}function We(i,t){return{...Ft(i),lastOpenedAt:t}}function Ue(i,t){const e=Ft(i);if(!t)return delete e.group,delete e.groupId,delete e.groupName,delete e.group_id,delete e.group_name,e;const a=t.id.trim()||t.name.trim(),o=t.name.trim()||t.id.trim();return e.group={id:a,name:o},e.groupId=a,e.groupName=o,e.group_id=a,e.group_name=o,e}function Dt(i){const t=new Map;return i.forEach(e=>{const a=Nt(e);!a||t.has(a.id)||t.set(a.id,a)}),Array.from(t.values()).sort((e,a)=>e.name.localeCompare(a.name))}function Qe(i,t){const a=i.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"group",o=new Set(Dt(t).map(s=>s.id));if(!o.has(a))return a;let r=2,n=`${a}-${r}`;for(;o.has(n);)r+=1,n=`${a}-${r}`;return n}function Ye(i,t){return{...i,...t.title!==void 0?{title:t.title}:{},...t.order!==void 0?{order:t.order}:{}}}function Xe(i,t){return{...i,...t.title!==void 0?{title:t.title}:{},...t.description!==void 0?{description:t.description}:{},...t.completedAt!==void 0?{completedAt:t.completedAt}:{},...t.tag_ids!==void 0?{tag_ids:t.tag_ids}:{}}}function Ve(i){return i.before_column!==void 0||i.after_column!==void 0||i.position!==void 0}function Je(i,t,e){if(e.position==="start")return[t,...i];if(e.position==="end")return[...i,t];const a=e.before_column?i.findIndex(r=>r.id===e.before_column):-1;if(a>=0)return[...i.slice(0,a+1),t,...i.slice(a+1)];const o=e.after_column?i.findIndex(r=>r.id===e.after_column):-1;return o>=0?[...i.slice(0,o),t,...i.slice(o)]:[...i,t]}function Ze(i,t){const e=i.columns.find(r=>r.id===t.columnId);if(!e)return i;const a=Ye(e,t.patch);if(!Ve(t.patch))return{...i,columns:i.columns.map(r=>r.id===t.columnId?a:r)};const o=i.columns.filter(r=>r.id!==t.columnId);return{...i,columns:Je(o,a,t.patch)}}function ta(i,t,e){if(e.position==="top")return[t,...i];if(e.position==="bottom")return[...i,t];const a=e.before_placement?i.findIndex(r=>j(r)===e.before_placement):-1;if(a>=0)return[...i.slice(0,a+1),t,...i.slice(a+1)];const o=e.after_placement?i.findIndex(r=>j(r)===e.after_placement):-1;return o>=0?[...i.slice(0,o),t,...i.slice(o)]:[...i,t]}function ea(i,t){for(const e of i)for(const a of e.columns){const o=a.cards.find(r=>j(r)===t);if(o)return o}return null}function he(i,t){return i.map(e=>({...e,columns:e.columns.map(a=>({...a,cards:a.cards.filter(o=>j(o)!==t)}))}))}function aa(i,t,e){if(e.archived===!0)return he(i,t);const a=ea(i,t);if(!a)return i;const o=e.column??a.column;return i.map(r=>({...r,columns:r.columns.map(n=>{const s=n.cards.filter(c=>j(c)!==t);return n.id!==o?{...n,cards:s}:{...n,cards:ta(s,a,e).map(c=>j(c)===t?{...c,column:o}:c)}})}))}function oa(i,t){return i.map(e=>({...e,columns:e.columns.map(a=>({...a,cards:a.cards.filter(o=>o.id!==t)}))}))}function ra(i,t){return i.map(e=>({...e,columns:e.columns.filter(a=>a.id!==t)}))}function ia(i,t){return t.type==="create-column"?i.map(e=>e.id===t.boardId?{...e,columns:[...e.columns,t.column]}:e):t.type==="patch-column"?i.map(e=>Ze(e,t)):t.type==="delete-column"?ra(i,t.columnId):t.type==="create-card"?i.map(e=>({...e,columns:e.columns.map(a=>a.id===t.columnId?{...a,cards:[...a.cards,t.card]}:a)})):t.type==="patch-card-placement"?aa(i,t.placementId,t.patch):t.type==="delete-card-placement"?he(i,t.placementId):t.type==="delete-card"?oa(i,t.cardId):i.map(e=>({...e,columns:e.columns.map(a=>({...a,cards:a.cards.map(o=>o.id===t.cardId?Xe(o,t.patch):o)}))}))}function na(i,t){return t.length===0?i:t.reduce((e,a)=>ia(e,a),i)}const ot="majom.boards.exchange",rt="1.0";function sa(){return{mode:"merge",missingFieldPolicy:"keep_existing",matchStrategy:"title",unknownFieldPolicy:"warn_and_ignore"}}const da=new Set(["schema","version","scope","title","id","exportedAt"]);function ca(i){var n;const t=i.replace(/\r\n/g,`
`).split(`
`);if(((n=t[0])==null?void 0:n.trim())!=="---")return{fields:{},body:i,diagnostics:[]};const e=t.findIndex((s,c)=>c>0&&s.trim()==="---");if(e<0)return{fields:{},body:i,diagnostics:[{level:"warning",code:"markdown_front_matter_unclosed",message:"Markdown front matter was not closed and was ignored.",path:"frontMatter"}]};const a=t.slice(1,e),o={},r=[];for(const s of a){const c=s.indexOf(":");if(c<0)continue;const d=s.slice(0,c).trim(),m=s.slice(c+1).trim().replace(/^"|"$/g,"");d&&(o[d]=m,da.has(d)||r.push({level:"warning",code:"unknown_front_matter_field",message:`Unknown front matter field "${d}" will be ignored.`,path:`frontMatter.${d}`}))}return{fields:o,body:t.slice(e+1).join(`
`),diagnostics:r}}function J(i,t,e,a){if(i===void 0)return a.push({level:"warning",code:"missing_title",message:`Missing title at ${e}; using "${t}".`,path:e}),t;const o=i.trim();return o||(a.push({level:"warning",code:"empty_title",message:`Empty title at ${e}; using "${t}".`,path:e}),t)}function la(i,t){var n;const a=(((n=i[t])==null?void 0:n.trim())??"").replace(/^Description:\s*/i,"").trim();if(a)return a;const o=[];for(let s=t+1;s<i.length;s+=1){const c=i[s]??"";if(/^#{1,6}\s/.test(c)||/^[A-Za-z][A-Za-z0-9 _-]*:\s*/.test(c))break;o.push(c)}return o.join(`
`).trim()||void 0}function te(i,t,e,a){let o;const r=[];let n=null;const s=Math.max(t+1,0);for(let c=s;c<i.length;c+=1){const d=i[c]??"",m=d.trim();if(/^##\s+Column:/.test(d)||/^###\s+Card:/.test(d))break;if(!m)continue;if(/^Description:/i.test(m)){o=la(i,c),n=null;continue}const u=/^Checklist:\s*(.*)$/i.exec(m);if(u){const h=r.length;n={title:J(u[1],"Checklist",`${e}.checklists[${h}].title`,a),items:[]},r.push(n);continue}const b=/^-\s*\[( |x|X)\]\s*(.*)$/.exec(m);if(b){n||(n={title:"Checklist",items:[]},r.push(n),a.push({level:"warning",code:"check_item_without_checklist",message:'A checklist item appeared before any checklist title; using "Checklist".',path:`${e}.checklists[${r.length-1}]`}));const h=n.items.length;n.items.push({title:J(b[2],"Untitled item",`${e}.checklists[${r.length-1}].items[${h}].title`,a),state:b[1].toLowerCase()==="x"?"complete":"incomplete"})}}return{...o?{description:o}:{},...r.length>0?{checklists:r}:{}}}function Et(i,t){return{schema:ot,version:rt,format:"markdown",scope:i,exportedAt:new Date().toISOString(),payload:t}}function ma(i,t){const e=ca(i),a=e.body.replace(/\r\n/g,`
`).split(`
`),o=[...e.diagnostics];if(t==="card"){const c=a.findIndex(b=>b.startsWith("### Card:")||b.startsWith("# Card:")),d=c>=0?a[c]:void 0,m=J(d==null?void 0:d.replace(/^#{1,3}\s*Card:/,""),"Untitled card","payload.title",o),u=te(a,c>=0?c:-1,"payload",o);return{envelope:Et(t,{...e.fields.id?{id:e.fields.id}:{},title:m,...u}),diagnostics:o}}const r=[];let n=null;for(const[c,d]of a.entries()){if(d.startsWith("## Column:")){n={title:J(d.replace("## Column:",""),"Untitled column",`payload.columns[${r.length}].title`,o),cards:[]},r.push(n);continue}if(d.startsWith("### Card:")){n||(n={title:"Imported",cards:[]},r.push(n),o.push({level:"warning",code:"card_without_column",message:'A card heading appeared before any column; using "Imported".',path:`body.line${c+1}`}));const m=Math.max(r.length-1,0),u=n.cards.length,b=J(d.replace("### Card:",""),"Untitled card",`payload.columns[${m}].cards[${u}].title`,o),h=te(a,c,`payload.columns[${m}].cards[${u}]`,o);n.cards.push({title:b,...h})}}if(t==="column"){const c=r[0]??{title:J(e.fields.title,"Untitled column","payload.title",o),cards:[]};return{envelope:Et(t,c),diagnostics:o}}const s={...e.fields.id?{id:e.fields.id}:{},title:J(e.fields.title,"Untitled board","payload.title",o),columns:r};return{envelope:Et(t,s),diagnostics:o}}function pa(i,t=[]){return{scope:i,canApply:t.every(e=>e.level!=="error"),counts:{create:0,update:0,skip:0,conflict:0},items:[],diagnostics:t,warnings:t.filter(e=>e.level==="warning").map(e=>e.message),errors:t.filter(e=>e.level==="error").map(e=>e.message)}}const ct={board:new Set(["id","title","columns"]),column:new Set(["id","title","cards"]),card:new Set(["id","title","description","checklists"]),checklist:new Set(["id","title","items"]),checkItem:new Set(["id","title","state"])},ua=new Set(["complete","incomplete"]);function it(i){return typeof i=="object"&&i!==null&&!Array.isArray(i)}function ba(i,t,e,a,o){i.push({level:t.policies.unknownFieldPolicy==="strict_error"?"error":"warning",code:e,message:a,...o?{path:o}:{}})}function ha(i,t,e){return i.push({level:"warning",code:"missing_title",message:`Missing title at ${t}; using "${e}".`,path:t}),e}function lt(i,t,e,a){if(typeof i!="string")return ha(a,e,t);const o=i.trim();return o||(a.push({level:"warning",code:"empty_title",message:`Empty title at ${e}; using "${t}".`,path:e}),t)}function mt(i,t,e,a,o){for(const r of Object.keys(i))t.has(r)||ba(o,a,"unknown_payload_field",`Unknown payload field "${r}" will be ignored.`,`${e}.${r}`)}function fe(i,t,e,a){if(!it(i))return a.push({level:"error",code:"invalid_card_payload",message:`Card payload at ${t} must be an object.`,path:t}),{title:"Untitled card"};mt(i,ct.card,t,e,a);const o=Array.isArray(i.checklists)?i.checklists:[];i.checklists!==void 0&&!Array.isArray(i.checklists)&&a.push({level:"warning",code:"invalid_checklists_field",message:`Checklists at ${t}.checklists must be an array and were ignored.`,path:`${t}.checklists`});const r=o.map((n,s)=>fa(n,`${t}.checklists[${s}]`,e,a));return{...typeof i.id=="string"?{id:i.id}:{},title:lt(i.title,"Untitled card",`${t}.title`,a),...typeof i.description=="string"?{description:i.description}:{},...r.length>0?{checklists:r}:{}}}function fa(i,t,e,a){if(!it(i))return a.push({level:"error",code:"invalid_checklist_payload",message:`Checklist payload at ${t} must be an object.`,path:t}),{title:"Checklist",items:[]};mt(i,ct.checklist,t,e,a);const o=Array.isArray(i.items)?i.items:[];return i.items!==void 0&&!Array.isArray(i.items)&&a.push({level:"warning",code:"invalid_check_items_field",message:`Checklist items at ${t}.items must be an array and were ignored.`,path:`${t}.items`}),{...typeof i.id=="string"?{id:i.id}:{},title:lt(i.title,"Checklist",`${t}.title`,a),items:o.map((r,n)=>ga(r,`${t}.items[${n}]`,e,a))}}function ga(i,t,e,a){if(!it(i))return a.push({level:"error",code:"invalid_check_item_payload",message:`Checklist item payload at ${t} must be an object.`,path:t}),{title:"Untitled item",state:"incomplete"};mt(i,ct.checkItem,t,e,a);const o=typeof i.state=="string"&&ua.has(i.state)?i.state:"incomplete";return i.state!==void 0&&o!==i.state&&a.push({level:"warning",code:"invalid_check_item_state",message:`Checklist item state at ${t}.state must be "complete" or "incomplete"; using "incomplete".`,path:`${t}.state`}),{...typeof i.id=="string"?{id:i.id}:{},title:lt(i.title,"Untitled item",`${t}.title`,a),state:o}}function ge(i,t,e,a){if(!it(i))return a.push({level:"error",code:"invalid_column_payload",message:`Column payload at ${t} must be an object.`,path:t}),{title:"Untitled column",cards:[]};mt(i,ct.column,t,e,a);const o=Array.isArray(i.cards)?i.cards:[];return i.cards!==void 0&&!Array.isArray(i.cards)&&a.push({level:"warning",code:"invalid_cards_field",message:`Cards at ${t}.cards must be an array and were ignored.`,path:`${t}.cards`}),{...typeof i.id=="string"?{id:i.id}:{},title:lt(i.title,"Untitled column",`${t}.title`,a),cards:o.map((r,n)=>fe(r,`${t}.cards[${n}]`,e,a))}}function ka(i,t,e,a){if(!it(i))return a.push({level:"error",code:"invalid_board_payload",message:`Board payload at ${t} must be an object.`,path:t}),{title:"Untitled board",columns:[]};mt(i,ct.board,t,e,a);const o=Array.isArray(i.columns)?i.columns:[];return i.columns!==void 0&&!Array.isArray(i.columns)&&a.push({level:"warning",code:"invalid_columns_field",message:`Columns at ${t}.columns must be an array and were ignored.`,path:`${t}.columns`}),{...typeof i.id=="string"?{id:i.id}:{},title:lt(i.title,"Untitled board",`${t}.title`,a),columns:o.map((r,n)=>ge(r,`${t}.columns[${n}]`,e,a))}}function _a(i,t){return{schema:ot,version:rt,format:i.format,scope:i.scope,exportedAt:new Date().toISOString(),payload:t}}function xa(i){const t=[];let e;try{e=JSON.parse(i.raw)}catch{return{envelope:null,diagnostics:[{level:"error",code:"invalid_json",message:"Import source is not valid JSON.",path:"source"}]}}if(!it(e))return{envelope:null,diagnostics:[{level:"error",code:"invalid_json_root",message:"JSON import root must be an object.",path:"source"}]};const a="payload"in e?e.payload:e;"payload"in e||t.push({level:"warning",code:"missing_envelope",message:"JSON import has no exchange envelope; treating root as payload.",path:"source"}),e.schema!==void 0&&e.schema!==ot&&t.push({level:"error",code:"schema_mismatch",message:"JSON import schema is not supported.",path:"schema"}),e.version!==void 0&&e.version!==rt&&t.push({level:"error",code:"version_mismatch",message:"JSON import version is not supported.",path:"version"}),e.scope!==void 0&&e.scope!==i.scope&&t.push({level:"error",code:"scope_mismatch",message:`JSON import scope "${String(e.scope)}" does not match "${i.scope}".`,path:"scope"});const o=i.scope==="board"?ka(a,"payload",i,t):i.scope==="column"?ge(a,"payload",i,t):fe(a,"payload",i,t);return{envelope:_a(i,o),diagnostics:t}}function ke(i){if(i.format==="markdown"){const t=ma(i.raw,i.scope);return i.policies.unknownFieldPolicy!=="strict_error"?t:{...t,diagnostics:t.diagnostics.map(e=>e.code.startsWith("unknown_")?{...e,level:"error"}:e)}}return xa(i)}function F(i,t){i.items.push(t),i.counts[t.action]+=1,t.action==="conflict"&&(i.canApply=!1)}function va(i,t){const e=i.trim().toLowerCase();return t.filter(a=>a.title.trim().toLowerCase()===e)}function Q(i){return Object.entries(i).filter(([,t])=>t!==void 0).map(([t])=>t)}function It(i){const t=[];for(const e of i)for(const a of e.columns??[])t.push(...a.cards??[]);return t}function Ca(i){const t=[];for(const e of i)t.push(...e.columns??[]);return t}function ee(i,t,e){F(i,{action:"create",entity:"card",title:t.title,path:e,reason:"card-import",source:{...t.id?{id:t.id}:{},explicitFields:Q(t)}});for(const[a,o]of(t.checklists??[]).entries()){const r=`${e}.checklists[${a}]`;F(i,{action:"create",entity:"checklist",title:o.title,path:r,reason:"checklist-import",source:{...o.id?{id:o.id}:{},explicitFields:Q(o)}});for(const[n,s]of(o.items??[]).entries())F(i,{action:"create",entity:"checkItem",title:s.title,path:`${r}.items[${n}]`,reason:"check-item-import",source:{...s.id?{id:s.id}:{},explicitFields:Q(s)}})}}function ya(i,t){for(const e of i){const a=(e.columns??[]).find(o=>o.id===t);if(a)return a}return null}function ae(i,t,e,a,o){const r=va(i,t);return r.length>1?(F(o,{action:"conflict",entity:e,title:i,path:a,reason:"ambiguous-title-match"}),null):r[0]??null}function At(i,t,e){return t.policies.mode==="create"?"create":e?"update":t.policies.mode==="replace"?(F(i,{action:"conflict",entity:t.scope,title:"Import target",path:"target",reason:"replace-target-not-found"}),null):"create"}function wa(i,t){var s,c,d;const e=ke(t),a=pa(t.scope,e.diagnostics);if(!e.envelope||a.errors.length>0)return F(a,{action:"conflict",entity:t.scope,title:"Import source",path:"source",reason:"invalid-source"}),a;if(t.scope==="board"){const m=e.envelope.payload,u=m.id!==void 0?i.find(h=>h.id===m.id)??null:t.policies.matchStrategy==="title"?ae(m.title,i,"board","payload",a):null;if(a.counts.conflict>0)return a;const b=At(a,t,u);if(!b)return a;F(a,{action:b,entity:"board",title:m.title,path:"payload",reason:u?"matched-by-title":"new-board",...u?{targetId:u.id}:{},source:{...m.id?{id:m.id}:{},explicitFields:Q(m)}});for(const[h,f]of(m.columns??[]).entries()){F(a,{action:"create",entity:"column",title:f.title,path:`payload.columns[${h}]`,reason:"column-import",source:{...f.id?{id:f.id}:{},explicitFields:Q(f)}});for(const[g,x]of(f.cards??[]).entries())ee(a,x,`payload.columns[${h}].cards[${g}]`)}return a}if(t.scope==="column"){const m=e.envelope.payload;if((s=t.target)!=null&&s.boardId&&!i.some(f=>{var g;return f.id===((g=t.target)==null?void 0:g.boardId)}))return F(a,{action:"conflict",entity:"board",title:t.target.boardId,path:"target.boardId",reason:"target-board-not-found"}),a;const u=m.id!==void 0?Ca(i).find(h=>h.id===m.id)??null:null,b=At(a,t,u);if(!b)return a;F(a,{action:b,entity:"column",title:m.title,path:"payload",reason:"column-import",...u?{targetId:u.id}:{},source:{...m.id?{id:m.id}:{},explicitFields:Q(m)}});for(const[h,f]of(m.cards??[]).entries())ee(a,f,`payload.cards[${h}]`);return a}const o=e.envelope.payload,r=((c=t.target)==null?void 0:c.cardId)!==void 0?It(i).find(m=>{var u;return m.id===((u=t.target)==null?void 0:u.cardId)})??null:o.id!==void 0?It(i).find(m=>m.id===o.id)??null:t.policies.matchStrategy==="title"?ae(o.title,It(i),"card","payload",a):null;if(a.counts.conflict>0)return a;if((d=t.target)!=null&&d.columnId&&!ya(i,t.target.columnId))return F(a,{action:"conflict",entity:"column",title:t.target.columnId,path:"target.columnId",reason:"target-column-not-found"}),a;const n=At(a,t,r);if(!n)return a;if(F(a,{action:n,entity:"card",title:o.title,path:"payload",reason:"card-import",...r?{targetId:r.id}:{},source:{...o.id?{id:o.id}:{},explicitFields:Q(o)}}),n==="create")for(const[m,u]of(o.checklists??[]).entries()){const b=`payload.checklists[${m}]`;F(a,{action:"create",entity:"checklist",title:u.title,path:b,reason:"checklist-import",source:{...u.id?{id:u.id}:{},explicitFields:Q(u)}});for(const[h,f]of(u.items??[]).entries())F(a,{action:"create",entity:"checkItem",title:f.title,path:`${b}.items[${h}]`,reason:"check-item-import",source:{...f.id?{id:f.id}:{},explicitFields:Q(f)}})}return a}function oe(i){const t=(i==null?void 0:i.trim())??"";return t.length>0?t:void 0}function _e(i){const t=i.checklists??[];return{id:i.id,title:i.title.trim()||"Untitled card",...oe(i.description)?{description:oe(i.description)}:{},...t.length>0?{checklists:t.map(e=>({id:e.id,title:e.title.trim()||"Checklist",items:(e.items??[]).map(a=>({id:a.id,title:a.title.trim()||"Untitled item",state:a.state}))}))}:{}}}function xe(i){return{id:i.id,title:i.title.trim()||"Untitled column",cards:(i.cards??[]).map(_e)}}function ja(i){return{id:i.id,title:i.title.trim()||"Untitled board",columns:(i.columns??[]).map(xe)}}function Pa(i,t,e,a=new Date().toISOString()){return{schema:ot,version:rt,format:i,scope:t,exportedAt:a,payload:e}}function Ea(i){return`${JSON.stringify(i,null,2)}
`}function ht(i){return JSON.stringify(i)}function Ia(i){const t=i.payload;return["---",`schema: ${i.schema}`,`version: ${ht(i.version)}`,`scope: ${i.scope}`,`title: ${ht(t.title)}`,`exportedAt: ${ht(i.exportedAt)}`,...t.id?[`id: ${ht(t.id)}`]:[],"---"]}function Aa(i,t){t&&i.push("","Description:",t)}function ve(i,t){i.push(`### Card: ${t.title}`),Aa(i,t.description);for(const e of t.checklists??[]){i.push("",`Checklist: ${e.title}`);for(const a of e.items??[]){const o=a.state==="complete"?"x":" ";i.push(`- [${o}] ${a.title}`)}}}function re(i,t){i.push(`## Column: ${t.title}`);for(const e of t.cards)i.push(""),ve(i,e)}function Ba(i){const t=Ia(i);if(i.scope==="board"){const e=i.payload;for(const a of e.columns)t.push(""),re(t,a);return`${t.join(`
`).trimEnd()}
`}return i.scope==="column"?(re(t,i.payload),`${t.join(`
`).trimEnd()}
`):(ve(t,i.payload),`${t.join(`
`).trimEnd()}
`)}function Ot(i){return i.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"untitled"}function qt(i,t,e){const a=Pa(i,t,e);return i==="json"?Ea(a):Ba(a)}function La(i,t){const e=ja(i);return{format:t,scope:"board",fileName:`board-${Ot(e.title)}.${t==="json"?"json":"md"}`,content:qt(t,"board",e)}}function Ma(i,t){const e=xe(i);return{format:t,scope:"column",fileName:`column-${Ot(e.title)}.${t==="json"?"json":"md"}`,content:qt(t,"column",e)}}function Sa(i,t){const e=_e(i);return{format:t,scope:"card",fileName:`card-${Ot(e.title)}.${t==="json"?"json":"md"}`,content:qt(t,"card",e)}}const ie={boards:[],selectedBoardId:null,status:"idle",error:null};function ne(i){const t=Number(i??0);return Number.isFinite(t)?t:0}function Ta(i,t){const e=i.pos??i.order??0,a=t.pos??t.order??0;return ne(e)-ne(a)||i.id.localeCompare(t.id)}function se(i){return i.map(t=>({...t,columns:[...t.columns??[]].sort(Ta).map(e=>({...e,cards:[...e.cards??[]].sort(Oe)}))})).sort((t,e)=>t.id.localeCompare(e.id))}class Na{constructor(t,e={}){this.api=t,this.stateSubject=new ye(ie),this.state$=this.stateSubject.asObservable(),this.confirmedBoards=ie.boards,this.pendingMutations=[],this.mutationSequence=0,this.tempIdSequence=0,this.boardMetaMutationVersions=new Map,this.now=e.now??(()=>new Date),this.createTempIdValue=e.createTempId??(a=>(this.tempIdSequence+=1,`temp:${a}:${this.tempIdSequence}`))}get snapshot(){return this.stateSubject.value}destroy(){this.stateSubject.complete()}selectBoard(t){this.snapshot.boards.some(e=>e.id===t)&&(Zt(t),this.patchState({selectedBoardId:t,error:null}),this.patchBoardMeta(t,e=>We(e,this.now().toISOString())))}previewImport(t){return wa(this.snapshot.boards,t)}async exportData(t){const e=new Map;this.patchState({status:"loading",error:null});try{const a=await this.createExportData(t,e);return this.patchState({status:"idle",error:null}),a}catch{return this.patchState({status:"error",error:"boards.errors.load"}),null}}async createExportData(t,e){if(t.scope==="board"){const o=t.boardId?this.findBoard(t.boardId):this.getSelectedBoard();return o?La(await this.hydrateBoardForExport(o,e),t.format):null}if(t.scope==="column"){const o=t.columnId?this.findColumn(t.columnId):null;return o?Ma(await this.hydrateColumnForExport(o,e),t.format):null}const a=t.cardId?this.findCard(t.cardId):null;return a?Sa(await this.hydrateCardForExport(a,e),t.format):null}async applyImport(t){if(t.policies.mode!=="create"||!this.previewImport(t).canApply)return null;const a=ke(t);return a.envelope?this.runMutationResult(async()=>{var o,r;return t.scope==="board"?this.applyBoardCreateImport(a.envelope.payload):t.scope==="column"?this.applyColumnCreateImport(a.envelope.payload,(o=t.target)==null?void 0:o.boardId):this.applyCardCreateImport(a.envelope.payload,(r=t.target)==null?void 0:r.columnId)}):null}async load(){this.patchState({status:"loading",error:null});try{await this.reloadPreservingSelection(),this.patchState({status:"idle",error:null})}catch{this.patchState({status:"error",error:"boards.errors.load"})}}async createBoard(t){const e=t.trim();e&&await this.runMutation(async()=>{const a=await k(this.api.createBoard({title:e}));await this.reload(a.id)})}async deleteBoard(t){await this.runMutation(async()=>{await k(this.api.deleteBoard(t)),await this.reload(null)})}async patchBoard(t,e){this.findBoard(t)&&await this.runMutation(async()=>{await k(this.api.updateBoard(t,e)),await this.reload(t)})}toggleBoardStar(t){this.patchBoardMeta(t,e=>Ge(e,!vt(e)))}updateBoardGroup(t,e){this.patchBoardMeta(t,a=>Ue(a,e))}async createColumn(t,e){const a=e.trim();if(!a)return;const o=this.findBoard(t);o&&await this.runOptimisticMutation({id:this.createMutationId(),type:"create-column",boardId:t,column:{id:this.createTempIdValue("column"),board:t,title:a,order:o.columns.length,cards:[]}},async()=>{await k(this.api.createColumn({board:t,title:a,position:"end"}))},()=>this.reload(t))}async deleteColumn(t){this.findColumn(t)&&await this.runOptimisticMutation({id:this.createMutationId(),type:"delete-column",columnId:t},async()=>{await k(this.api.deleteColumn(t))})}async patchColumn(t,e){this.findColumn(t)&&await this.runOptimisticMutation({id:this.createMutationId(),type:"patch-column",columnId:t,patch:e},async()=>{await k(this.api.updateColumn(t,e))})}async createCard(t,e,a){const o=e.trim();if(!o)return;const r=this.findColumn(t);if(!r)return;const n=a.trim();await this.runOptimisticMutation({id:this.createMutationId(),type:"create-card",columnId:t,card:{id:this.createTempIdValue("card"),placement_id:this.createTempIdValue("placement"),column:t,title:o,description:n,order:r.cards.length}},async()=>{await k(this.api.createCard({column:t,title:o,description:n,position:"bottom"}))})}async patchCard(t,e){this.findCard(t)&&await this.runOptimisticMutation({id:this.createMutationId(),type:"patch-card",cardId:t,patch:e},async()=>{await k(this.api.updateCard(t,e))})}async loadCardChecklists(t){if(!this.findCard(t))return[];try{return await k(this.api.getCardChecklists(t))}catch{return this.patchState({error:"boards.errors.load"}),[]}}async createCardChecklist(t,e){const a=e.trim();return!a||!this.findCard(t)?null:this.runMutationResult(async()=>{const o=await k(this.api.createCardChecklist(t,{title:a,position:"bottom"}));return await this.reloadPreservingSelection(),o})}async deleteCardChecklist(t){await this.runMutation(async()=>{await k(this.api.deleteCardChecklist(t)),await this.reloadPreservingSelection()})}async createCardCheckItem(t,e){const a=e.trim();return a?this.runMutationResult(async()=>{const o=await k(this.api.createCardCheckItem(t,{title:a,position:"bottom"}));return await this.reloadPreservingSelection(),o}):null}async patchCardCheckItem(t,e){return this.runMutationResult(async()=>{const a=await k(this.api.updateCardCheckItem(t,e));return await this.reloadPreservingSelection(),a})}async deleteCardCheckItem(t){await this.runMutation(async()=>{await k(this.api.deleteCardCheckItem(t)),await this.reloadPreservingSelection()})}async createCardEntityLink(t,e,a){if(!this.findCard(t))return null;const o={card:t,entity_type:e,entity_id:a};return this.runMutationResult(async()=>{const r=await k(this.api.createCardEntityLink(o));return await this.reloadPreservingSelection(),r})}async deleteCardEntityLink(t){await this.runMutation(async()=>{await k(this.api.deleteCardEntityLink(t)),await this.reloadPreservingSelection()})}async createCardMirror(t,e,a){!this.findCard(t)||!this.findColumn(e)||await this.runMutation(async()=>{await k(this.api.createCardPlacement({card:t,column:e,...a})),await this.reloadPreservingSelection()})}async patchCardPlacement(t,e){this.findCardPlacement(t)&&await this.runOptimisticMutation({id:this.createMutationId(),type:"patch-card-placement",placementId:t,patch:e},async()=>{await k(this.api.updateCardPlacement(t,e))})}async deleteCardPlacement(t){this.findCardPlacement(t)&&await this.runOptimisticMutation({id:this.createMutationId(),type:"delete-card-placement",placementId:t},async()=>{await k(this.api.deleteCardPlacement(t))})}async deleteCard(t){this.findCard(t)&&await this.runOptimisticMutation({id:this.createMutationId(),type:"delete-card",cardId:t},async()=>{await k(this.api.deleteCard(t))})}async applyBoardCreateImport(t){const e=await k(this.api.createBoard({title:t.title})),a=[],o=[],r=[],n=[];for(const s of t.columns??[]){const c=await k(this.api.createColumn({board:e.id,title:s.title,position:"end"}));a.push(c.id);const d=await this.createImportedCards(c.id,s.cards??[]);o.push(...d.cardIds),r.push(...d.checklistIds),n.push(...d.checkItemIds)}return await this.reload(e.id),{scope:"board",created:{boardId:e.id,columnIds:a,cardIds:o,checklistIds:r,checkItemIds:n}}}async applyColumnCreateImport(t,e){const a=e??this.snapshot.selectedBoardId??void 0;if(!a||!this.findBoard(a))throw new Error("Missing import target board");const o=await k(this.api.createColumn({board:a,title:t.title,position:"end"})),r=await this.createImportedCards(o.id,t.cards??[]);return await this.reload(a),{scope:"column",created:{columnIds:[o.id],cardIds:r.cardIds,checklistIds:r.checklistIds,checkItemIds:r.checkItemIds}}}async applyCardCreateImport(t,e){if(!e||!this.findColumn(e))throw new Error("Missing import target column");const a=await this.createImportedCard(e,t);return await this.reloadPreservingSelection(),{scope:"card",created:{columnIds:[],cardIds:[a.card.id],checklistIds:a.checklistIds,checkItemIds:a.checkItemIds}}}async createImportedCards(t,e){const a=[],o=[],r=[];for(const n of e){const s=await this.createImportedCard(t,n);a.push(s.card.id),o.push(...s.checklistIds),r.push(...s.checkItemIds)}return{cardIds:a,checklistIds:o,checkItemIds:r}}async createImportedCard(t,e){const a=await k(this.api.createCard({column:t,title:e.title,description:e.description??"",position:"bottom"})),o=[],r=[];for(const n of e.checklists??[]){const s=await k(this.api.createCardChecklist(a.id,{title:n.title,position:"bottom"}));o.push(s.id);for(const c of n.items??[]){const d=await k(this.api.createCardCheckItem(s.id,{title:c.title,state:c.state??"incomplete",position:"bottom"}));r.push(d.id)}}return{card:a,checklistIds:o,checkItemIds:r}}async hydrateBoardForExport(t,e){return{...t,columns:await Promise.all((t.columns??[]).map(a=>this.hydrateColumnForExport(a,e)))}}async hydrateColumnForExport(t,e){return{...t,cards:await Promise.all((t.cards??[]).map(a=>this.hydrateCardForExport(a,e)))}}async hydrateCardForExport(t,e){return{...t,checklists:await this.loadCardChecklistsForExport(t.id,e)}}loadCardChecklistsForExport(t,e){const a=e.get(t);if(a)return a;const o=k(this.api.getCardChecklists(t));return e.set(t,o),o}async runMutation(t){this.patchState({status:"saving",error:null});try{await t(),this.patchState({status:"idle",error:null})}catch{this.patchState({status:"error",error:"boards.errors.save"})}}async runMutationResult(t){this.patchState({status:"saving",error:null});try{const e=await t();return this.patchState({status:"idle",error:null}),e}catch{return this.patchState({status:"error",error:"boards.errors.save"}),null}}async runOptimisticMutation(t,e,a=()=>this.reloadPreservingSelection()){this.pendingMutations=[...this.pendingMutations,t],this.publishProjectedState({status:"saving",error:null});try{await e(),this.pendingMutations=this.pendingMutations.filter(o=>o.id!==t.id),await a(),this.publishProjectedState({status:"idle",error:null})}catch{this.pendingMutations=this.pendingMutations.filter(o=>o.id!==t.id),this.publishProjectedState({status:"error",error:"boards.errors.save"})}}createMutationId(){return this.mutationSequence+=1,`boards-mutation-${this.mutationSequence}`}async reloadPreservingSelection(){await this.reload(this.snapshot.selectedBoardId)}async reload(t){const e=se(await k(this.api.getBoards()));this.confirmedBoards=e;const a=Re(e,t);Zt(a),this.publishProjectedState({selectedBoardId:a})}findBoard(t){return this.snapshot.boards.find(e=>e.id===t)??null}getSelectedBoard(){return this.snapshot.selectedBoardId?this.findBoard(this.snapshot.selectedBoardId):null}patchBoardMeta(t,e){const a=this.findBoard(t);if(!a)return;const o=(this.boardMetaMutationVersions.get(t)??0)+1;this.boardMetaMutationVersions.set(t,o);const r=a.meta??null,n=e(a);this.replaceBoardMeta(t,n),k(this.api.updateBoard(t,{meta:n})).then(s=>{this.boardMetaMutationVersions.get(t)===o&&this.replaceBoardMeta(t,s.meta??n)}).catch(()=>{this.boardMetaMutationVersions.get(t)===o&&(this.replaceBoardMeta(t,r),this.patchState({error:"boards.errors.save"}))})}replaceBoardMeta(t,e){this.confirmedBoards=se(this.confirmedBoards.map(a=>a.id===t?{...a,meta:e??null}:a)),this.publishProjectedState({error:null})}findColumn(t){for(const e of this.snapshot.boards){const a=e.columns.find(o=>o.id===t);if(a)return a}return null}findCardPlacement(t){for(const e of this.snapshot.boards)for(const a of e.columns){const o=a.cards.find(r=>j(r)===t);if(o)return o}return null}findCard(t){for(const e of this.snapshot.boards)for(const a of e.columns){const o=a.cards.find(r=>r.id===t);if(o)return o}return null}patchState(t){this.stateSubject.next({...this.snapshot,...t})}publishProjectedState(t={}){this.stateSubject.next({...this.snapshot,...t,boards:na(this.confirmedBoards,this.pendingMutations)})}}function Ct(i){return[...new Set([...i].filter(Da))].sort((t,e)=>t-e)}function et(i){var t;return Ct(i.tag_ids??((t=i.tags)==null?void 0:t.map(e=>e.id))??[])}function de(i,t){const e=Ct(i),a=Ct(t);return e.length===a.length&&e.every((o,r)=>o===a[r])}function Da(i){return typeof i=="number"&&Number.isFinite(i)}function Ce({columnId:i,cards:t,movingPlacementId:e,insertionIndex:a}){const o=t.filter(d=>j(d)!==e),r=Math.max(0,Math.min(a,o.length)),n=r>0?o[r-1]:null,s=r<o.length?o[r]:null,c={column:i};return n&&(c.before_placement=j(n)),s&&(c.after_placement=j(s)),!n&&!s&&(c.position="bottom"),c}function $a(i,t,e){const a=i.filter(u=>j(u)!==t),o=i.findIndex(u=>j(u)===t);if(o<0)return!0;const r=o>0?i[o-1]:null,n=o<i.length-1?i[o+1]:null,s=r?j(r):null,c=n?j(n):null,d=e.before_placement??null,m=e.after_placement??null;return a.length===0?!1:s!==d||c!==m}function za({columns:i,movingColumnId:t,insertionIndex:e}){const a=i.filter(c=>c.id!==t),o=Math.max(0,Math.min(e,a.length)),r=o>0?a[o-1]:null,n=o<a.length?a[o]:null,s={};return r&&(s.before_column=r.id),n&&(s.after_column=n.id),!r&&!n&&(s.position="end"),s}function Fa(i,t,e){const a=i.filter(d=>d.id!==t),o=i.findIndex(d=>d.id===t);if(o<0)return!0;if(a.length===0)return!1;const r=o>0?i[o-1]:null,n=o<i.length-1?i[o+1]:null,s=(r==null?void 0:r.id)??null,c=(n==null?void 0:n.id)??null;return s!==(e.before_column??null)||c!==(e.after_column??null)}const Oa=4,ce=44,le=18;function qa(i){return i.view??window}function me(i,t){for(const e of i.boards)if(e.columns.some(a=>a.id===t))return e.columns;return null}class Ra{constructor(t){this.options=t,this.pending=null,this.active=null,this.eventWindow=null,this.suppressNextClick=!1,this.mounted=!1,this.handleClick=e=>{this.suppressNextClick&&(this.suppressNextClick=!1,e.preventDefault(),e.stopPropagation())},this.handlePointerDown=e=>{if(e.button!==0||e.isPrimary===!1)return;const a=e.target,o=a==null?void 0:a.closest('[data-board-column-draggable="true"]');if(!o||!this.options.root.contains(o)||a!=null&&a.closest('[data-board-drag-ignore="true"], [data-board-card-draggable="true"], input, textarea, select'))return;const r=o.dataset.boardColumnId,n=this.options.getState();!n||!r||!me(n,r)||(this.pending={pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,sourceColumnElement:o,columnId:r},this.addWindowListeners(qa(e)))},this.handlePointerMove=e=>{const a=this.pending;if(!a||e.pointerId!==a.pointerId)return;if(!this.active){const r=e.clientX-a.startX,n=e.clientY-a.startY;if(Math.hypot(r,n)<Oa)return;this.startDrag(a,e)}const o=this.active;o&&(e.preventDefault(),this.movePreview(o,e.clientX,e.clientY),this.updateDropTarget(o,e.clientX),this.autoScroll(e.clientX))},this.handlePointerUp=e=>{this.pending&&e.pointerId!==this.pending.pointerId||(this.removeWindowListeners(),this.pending=null,this.finishActiveDrag(!0))},this.handlePointerCancel=e=>{this.pending&&e.pointerId!==this.pending.pointerId||this.cancelDrag()},this.handleWindowBlur=()=>{this.cancelDrag()}}mount(){this.mounted||(this.mounted=!0,this.options.root.addEventListener("pointerdown",this.handlePointerDown,!0),this.options.root.addEventListener("click",this.handleClick,!0))}unmount(){this.mounted&&(this.mounted=!1,this.cancelDrag(),this.options.root.removeEventListener("pointerdown",this.handlePointerDown,!0),this.options.root.removeEventListener("click",this.handleClick,!0))}cancelDrag(){this.removeWindowListeners(),this.pending=null,this.finishActiveDrag(!1)}startDrag(t,e){var c,d;const a=this.options.getState(),o=a?me(a,t.columnId):null;if(!o)return;(d=(c=this.options).onDragStart)==null||d.call(c);const r=t.sourceColumnElement.getBoundingClientRect(),n=t.sourceColumnElement.cloneNode(!0);n.classList.add("majom-boards__column-drag-preview"),n.style.width=`${r.width}px`,n.style.height=`${r.height}px`,n.style.left=`${r.left}px`,n.style.top=`${r.top}px`;const s=document.createElement("div");s.className="majom-boards__column-drag-placeholder",s.style.width=`${r.width}px`,s.style.height=`${r.height}px`,t.sourceColumnElement.classList.add("is-dragging"),document.body.append(n),this.active={...t,offsetX:e.clientX-r.left,offsetY:e.clientY-r.top,preview:n,placeholder:s,sourceColumns:o,target:null},this.options.root.classList.add("is-column-dragging"),this.movePreview(this.active,e.clientX,e.clientY),this.updateDropTarget(this.active,e.clientX)}movePreview(t,e,a){t.preview.style.left=`${e-t.offsetX}px`,t.preview.style.top=`${a-t.offsetY}px`}updateDropTarget(t,e){const a=this.resolveInsertionIndex(t.columnId,e);if(t.target=za({columns:t.sourceColumns,movingColumnId:t.columnId,insertionIndex:a}),!this.hasActiveTargetChanged(t)){t.placeholder.remove();return}this.placePlaceholder(t,a)}hasActiveTargetChanged(t){return!!(t.target&&Fa(t.sourceColumns,t.columnId,t.target))}resolveInsertionIndex(t,e){const a=Array.from(this.options.root.querySelectorAll('[data-board-column-draggable="true"]')).filter(r=>r.dataset.boardColumnId!==t),o=a.findIndex(r=>{const n=r.getBoundingClientRect();return e<n.left+n.width/2});return o>=0?o:a.length}placePlaceholder(t,e){const a=this.options.root.querySelector('[data-board-canvas="true"]');if(!a)return;const o=Array.from(a.querySelectorAll('[data-board-column-draggable="true"]')).filter(n=>n.dataset.boardColumnId!==t.columnId),r=a.querySelector('[data-board-column-composer="true"]');a.insertBefore(t.placeholder,o[e]??r??null)}autoScroll(t){const e=this.options.root.querySelector('[data-board-canvas="true"]');if(!e)return;const a=e.getBoundingClientRect();t<a.left+ce?e.scrollLeft-=le:t>a.right-ce&&(e.scrollLeft+=le)}finishActiveDrag(t){const e=this.active;e&&(this.active=null,e.preview.remove(),e.placeholder.remove(),e.sourceColumnElement.classList.remove("is-dragging"),this.options.root.classList.remove("is-column-dragging"),this.suppressNextClick=!0,t&&this.hasActiveTargetChanged(e)&&this.options.onDrop(e.columnId,e.target))}addWindowListeners(t){this.eventWindow=t,t.addEventListener("pointermove",this.handlePointerMove,!0),t.addEventListener("pointerup",this.handlePointerUp,!0),t.addEventListener("pointercancel",this.handlePointerCancel,!0),t.addEventListener("blur",this.handleWindowBlur,!0)}removeWindowListeners(){const t=this.eventWindow??window;this.eventWindow=null,t.removeEventListener("pointermove",this.handlePointerMove,!0),t.removeEventListener("pointerup",this.handlePointerUp,!0),t.removeEventListener("pointercancel",this.handlePointerCancel,!0),t.removeEventListener("blur",this.handleWindowBlur,!0)}}const Ka=4,ft=44,gt=18;function Ha(i){return i.view??window}function pe(i,t){for(const e of i.boards){const a=e.columns.find(o=>o.id===t);if(a)return a.cards}return null}function Ga(i,t){for(const e of i.boards)for(const a of e.columns)if(a.cards.some(o=>j(o)===t))return a.id;return null}class Wa{constructor(t){this.options=t,this.pending=null,this.active=null,this.eventWindow=null,this.suppressNextClick=!1,this.mounted=!1,this.handleClick=e=>{this.suppressNextClick&&(this.suppressNextClick=!1,e.preventDefault(),e.stopPropagation())},this.handlePointerDown=e=>{if(e.button!==0||e.isPrimary===!1)return;const a=e.target,o=a==null?void 0:a.closest('[data-board-card-draggable="true"]');if(!o||!this.options.root.contains(o)||a!=null&&a.closest('[data-board-drag-ignore="true"], input, textarea, select'))return;const r=o.dataset.boardCardPlacementId,n=this.options.getState();if(!n||!r)return;const s=Ga(n,r);s!==null&&(this.pending={pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,sourceCardElement:o,placementId:r,sourceColumnId:s},this.addWindowListeners(Ha(e)))},this.handlePointerMove=e=>{const a=this.pending;if(!a||e.pointerId!==a.pointerId)return;if(!this.active){const r=e.clientX-a.startX,n=e.clientY-a.startY;if(Math.hypot(r,n)<Ka)return;this.startDrag(a,e)}const o=this.active;o&&(e.preventDefault(),this.movePreview(o,e.clientX,e.clientY),this.updateDropTarget(o,e.clientX,e.clientY),this.autoScroll(e.clientX,e.clientY))},this.handlePointerUp=e=>{this.pending&&e.pointerId!==this.pending.pointerId||(this.removeWindowListeners(),this.pending=null,this.finishActiveDrag(!0))},this.handlePointerCancel=e=>{this.pending&&e.pointerId!==this.pending.pointerId||this.cancelDrag()},this.handleWindowBlur=()=>{this.cancelDrag()}}mount(){this.mounted||(this.mounted=!0,this.options.root.addEventListener("pointerdown",this.handlePointerDown,!0),this.options.root.addEventListener("click",this.handleClick,!0))}unmount(){this.mounted&&(this.mounted=!1,this.cancelDrag(),this.options.root.removeEventListener("pointerdown",this.handlePointerDown,!0),this.options.root.removeEventListener("click",this.handleClick,!0))}cancelDrag(){this.removeWindowListeners(),this.pending=null,this.finishActiveDrag(!1)}startDrag(t,e){var c,d;const a=this.options.getState();if(!a)return;const o=pe(a,t.sourceColumnId);if(!o)return;(d=(c=this.options).onDragStart)==null||d.call(c);const r=t.sourceCardElement.getBoundingClientRect(),n=t.sourceCardElement.cloneNode(!0);n.classList.add("majom-boards__card-drag-preview"),n.style.width=`${r.width}px`,n.style.height=`${r.height}px`,n.style.left=`${r.left}px`,n.style.top=`${r.top}px`;const s=document.createElement("div");s.className="majom-boards__card-drag-placeholder",s.style.height=`${r.height}px`,t.sourceCardElement.classList.add("is-dragging"),document.body.append(n),this.active={...t,offsetX:e.clientX-r.left,offsetY:e.clientY-r.top,preview:n,placeholder:s,sourceColumnCards:o,targetColumnId:null,target:null},this.options.root.classList.add("is-card-dragging"),this.movePreview(this.active,e.clientX,e.clientY),this.updateDropTarget(this.active,e.clientX,e.clientY)}movePreview(t,e,a){t.preview.style.left=`${e-t.offsetX}px`,t.preview.style.top=`${a-t.offsetY}px`}updateDropTarget(t,e,a){const o=this.options.getState();if(!o)return;const r=this.findTargetColumn(e);if(!r)return;const n=r.dataset.boardColumnId;if(!n)return;const s=pe(o,n),c=r.querySelector('[data-board-cards-container="true"]');if(!s||!c)return;const d=this.resolveInsertionIndex(r,t.placementId,a);if(t.targetColumnId=n,t.target=Ce({columnId:n,cards:s,movingPlacementId:t.placementId,insertionIndex:d}),!this.hasActiveTargetChanged(t)){t.placeholder.remove();return}this.placePlaceholder(c,t,d)}hasActiveTargetChanged(t){return!t.target||t.targetColumnId===null?!1:!(t.targetColumnId===t.sourceColumnId)||$a(t.sourceColumnCards,t.placementId,t.target)}findTargetColumn(t){const e=Array.from(this.options.root.querySelectorAll("[data-board-column-id]"));if(e.length===0)return null;const a=e.find(o=>{const r=o.getBoundingClientRect();return t>=r.left&&t<=r.right});return a||e.reduce((o,r)=>{if(!o)return r;const n=r.getBoundingClientRect(),s=o.getBoundingClientRect(),c=Math.abs(t-(n.left+n.width/2)),d=Math.abs(t-(s.left+s.width/2));return c<d?r:o},null)}resolveInsertionIndex(t,e,a){const o=Array.from(t.querySelectorAll("[data-board-card-placement-id]")).filter(n=>n.dataset.boardCardPlacementId!==e),r=o.findIndex(n=>{const s=n.getBoundingClientRect();return a<s.top+s.height/2});return r>=0?r:o.length}placePlaceholder(t,e,a){const r=Array.from(t.querySelectorAll("[data-board-card-placement-id]")).filter(n=>n.dataset.boardCardPlacementId!==e.placementId)[a]??null;t.insertBefore(e.placeholder,r)}autoScroll(t,e){const a=this.options.root.querySelector('[data-board-canvas="true"]');if(a){const c=a.getBoundingClientRect();t<c.left+ft?a.scrollLeft-=gt:t>c.right-ft&&(a.scrollLeft+=gt)}const o=this.active;if(!(o!=null&&o.targetColumnId))return;const r=Array.from(this.options.root.querySelectorAll("[data-board-column-id]")).find(c=>c.dataset.boardColumnId===o.targetColumnId),n=r==null?void 0:r.querySelector('[data-board-cards-container="true"]');if(!n)return;const s=n.getBoundingClientRect();e<s.top+ft?n.scrollTop-=gt:e>s.bottom-ft&&(n.scrollTop+=gt)}finishActiveDrag(t){const e=this.active;e&&(this.active=null,e.preview.remove(),e.placeholder.remove(),e.sourceCardElement.classList.remove("is-dragging"),this.options.root.classList.remove("is-card-dragging"),this.suppressNextClick=!0,!(!t||!e.target||e.targetColumnId===null)&&this.hasActiveTargetChanged(e)&&this.options.onDrop(e.placementId,e.target))}addWindowListeners(t){this.eventWindow=t,t.addEventListener("pointermove",this.handlePointerMove,!0),t.addEventListener("pointerup",this.handlePointerUp,!0),t.addEventListener("pointercancel",this.handlePointerCancel,!0),t.addEventListener("blur",this.handleWindowBlur,!0)}removeWindowListeners(){const t=this.eventWindow??window;this.eventWindow=null,t.removeEventListener("pointermove",this.handlePointerMove,!0),t.removeEventListener("pointerup",this.handlePointerUp,!0),t.removeEventListener("pointercancel",this.handlePointerCancel,!0),t.removeEventListener("blur",this.handleWindowBlur,!0)}}const ue="majom-boards-view-styles",p={root:"majom-boards",shell:"majom-boards__shell",header:"majom-boards__header",titleBlock:"majom-boards__title-block",titleRow:"majom-boards__title-row",title:"majom-boards__title",titleButton:"majom-boards__title-button",titleEditInput:"majom-boards__title-edit-input",boardPickerButton:"majom-boards__board-picker-button",boardPickerButtonContent:"majom-boards__board-picker-button-content",headerActions:"majom-boards__header-actions",headerMenuButton:"majom-boards__header-menu-button",boardPickerPopover:"majom-boards-board-picker",boardPickerSearchWrap:"majom-boards-board-picker__search-wrap",boardPickerSearchIcon:"majom-boards-board-picker__search-icon",boardPickerSearchInput:"majom-boards-board-picker__search-input",boardPickerChips:"majom-boards-board-picker__chips",boardPickerChip:"majom-boards-board-picker__chip",boardPickerChipSelected:"majom-boards-board-picker__chip is-selected",boardPickerSections:"majom-boards-board-picker__sections",boardPickerSection:"majom-boards-board-picker__section",boardPickerSectionTitle:"majom-boards-board-picker__section-title",boardPickerSectionToggle:"majom-boards-board-picker__section-toggle",boardPickerSectionIconCollapsed:"majom-boards-board-picker__section-icon--collapsed",boardPickerGrid:"majom-boards-board-picker__grid",boardPickerCard:"majom-boards-board-picker__card",boardPickerCardSelected:"majom-boards-board-picker__card is-selected",boardPickerCardButton:"majom-boards-board-picker__card-button",boardPickerCreateCard:"majom-boards-board-picker__create-card",boardPickerStarButton:"majom-boards-board-picker__star-button",boardPickerStarButtonActive:"majom-boards-board-picker__star-button is-active",boardPickerActionsButton:"majom-boards-board-picker__actions-button",boardPickerActionsMenu:"majom-boards-board-picker-actions",boardPickerActionsInputRow:"majom-boards-board-picker-actions__input-row",boardPickerActionsInput:"majom-boards-board-picker-actions__input",boardPickerCover:"majom-boards-board-picker__cover",boardPickerCoverA:"majom-boards-board-picker__cover--a",boardPickerCoverB:"majom-boards-board-picker__cover--b",boardPickerCoverC:"majom-boards-board-picker__cover--c",boardPickerCoverD:"majom-boards-board-picker__cover--d",boardPickerCoverE:"majom-boards-board-picker__cover--e",boardPickerCoverF:"majom-boards-board-picker__cover--f",boardPickerCoverInitial:"majom-boards-board-picker__cover-initial",boardPickerCardTitle:"majom-boards-board-picker__card-title",boardPickerEmpty:"majom-boards-board-picker__empty",primaryButton:"majom-boards__button majom-boards__button--primary",quietButton:"majom-boards__button majom-boards__button--quiet",iconButton:"majom-boards__icon-button",body:"majom-boards__body",canvas:"majom-boards__canvas",column:"majom-boards__column",columnHeader:"majom-boards__column-header",columnTitleButton:"majom-boards__column-title-button",columnTitleInput:"majom-boards__column-title-input",columnTitle:"majom-boards__column-title",columnMenuButton:"majom-boards__column-menu-button",cards:"majom-boards__cards",card:"majom-boards__card",cardCompleted:"majom-boards__card is-complete",cardMirror:"majom-boards__card--mirror",cardOpenButton:"majom-boards__card-open",cardCompleteToggle:"majom-boards__card-complete-toggle",cardCompleteToggleCompleted:"majom-boards__card-complete-toggle is-complete",cardSourceLabel:"majom-boards__card-source-label",cardTags:"majom-boards__card-tags",cardTag:"majom-boards__card-tag",cardTitle:"majom-boards__card-title",cardBadges:"majom-boards__card-badges",cardBadgePlain:"majom-boards__card-badge majom-boards__card-badge--plain",cardBadgeNeutral:"majom-boards__card-badge majom-boards__card-badge--neutral",cardBadgeTask:"majom-boards__card-badge majom-boards__card-badge--task",cardBadgeStory:"majom-boards__card-badge majom-boards__card-badge--story",cardBadgeGoal:"majom-boards__card-badge majom-boards__card-badge--goal",cardComposer:"majom-boards__card-composer",cardComposerCollapsed:"majom-boards__card-composer-collapsed",cardComposerExpanded:"majom-boards__card-composer-expanded",cardComposerTextarea:"majom-boards__card-composer-textarea",composerActions:"majom-boards__composer-actions",composerCancelButton:"majom-boards__composer-cancel",columnComposerCollapsedPanel:"majom-boards__column-composer majom-boards__column-composer--collapsed",columnComposerExpandedPanel:"majom-boards__column-composer majom-boards__column-composer--expanded",columnComposerCollapsed:"majom-boards__column-composer-collapsed",columnComposerExpanded:"majom-boards__column-composer-expanded",listComposerTextarea:"majom-boards__list-composer-textarea",empty:"majom-boards__empty",emptyContent:"majom-boards__empty-content",emptyTitle:"majom-boards__empty-title",emptyCopy:"majom-boards__empty-copy",messageWrapper:"majom-boards__message-wrapper",messageLabel:"majom-boards__message-label"},l={container:"majom-boards-modal",body:"majom-boards-modal__body",cardBack:"majom-boards-cardback",hiddenShellPart:"majom-boards-cardback__hidden-shell-part",topbar:"majom-boards-cardback__topbar",topbarStart:"majom-boards-cardback__topbar-start",listBadge:"majom-boards-cardback__list-badge",sourceLabel:"majom-boards-cardback__source-label",movePopover:"majom-boards-cardback__move-popover",movePopoverHeader:"majom-boards-cardback__move-popover-header",movePopoverTitle:"majom-boards-cardback__move-popover-title",movePopoverBody:"majom-boards-cardback__move-popover-body",movePopoverContent:"majom-boards-cardback__move-popover-content",moveTabs:"majom-boards-cardback__move-tabs",moveTab:"majom-boards-cardback__move-tab",moveTabSelected:"majom-boards-cardback__move-tab is-selected",moveSectionTitle:"majom-boards-cardback__move-section-title",moveFields:"majom-boards-cardback__move-fields",moveField:"majom-boards-cardback__move-field",moveLabel:"majom-boards-cardback__move-label",moveSelect:"majom-boards-cardback__move-select",moveActions:"majom-boards-cardback__move-actions",moveButton:"majom-boards-cardback__move-button",listActionsPopover:"majom-boards-list-actions",listActionsHeader:"majom-boards-list-actions__header",listActionsTitle:"majom-boards-list-actions__title",listActionsBody:"majom-boards-list-actions__body",listActionsList:"majom-boards-list-actions__list",listActionsItem:"majom-boards-list-actions__item",listActionsButton:"majom-boards-list-actions__button",listActionsDivider:"majom-boards-list-actions__divider",listActionsSection:"majom-boards-list-actions__section",listActionsSectionButton:"majom-boards-list-actions__section-button",listActionsUpgrade:"majom-boards-list-actions__upgrade",listActionsUpgradeTitle:"majom-boards-list-actions__upgrade-title",listActionsUpgradeCopy:"majom-boards-list-actions__upgrade-copy",importModal:"majom-boards-import-modal",importLayout:"majom-boards-import__layout",importReview:"majom-boards-import__review",importPanel:"majom-boards-import__panel",importSidePanel:"majom-boards-import__side-panel",importField:"majom-boards-import__field",importSourceHeader:"majom-boards-import__source-header",importGuide:"majom-boards-import__guide",importGuideActions:"majom-boards-import__guide-actions",importGuideButton:"majom-boards-import__guide-button",importGuideHelp:"majom-boards-import__guide-help",importLabel:"majom-boards-import__label",importSource:"majom-boards-import__source",importSelect:"majom-boards-import__select",importPreviewPanel:"majom-boards-import__preview",importReviewHeader:"majom-boards-import__review-header",importReviewEyebrow:"majom-boards-import__review-eyebrow",importReviewHeadline:"majom-boards-import__review-headline",importPreviewTitle:"majom-boards-import__preview-title",importEmpty:"majom-boards-import__empty",importPlanGroups:"majom-boards-import__plan-groups",importPlanGroup:"majom-boards-import__plan-group",importPlanGroupHeader:"majom-boards-import__plan-group-header",importPlanGroupTitle:"majom-boards-import__plan-group-title",importItems:"majom-boards-import__items",importItem:"majom-boards-import__item",importItemEntity:"majom-boards-import__item-entity",importItemMain:"majom-boards-import__item-main",importItemMeta:"majom-boards-import__item-meta",importDiagnostics:"majom-boards-import__diagnostics",importDiagnosticWarning:"majom-boards-import__diagnostic majom-boards-import__diagnostic--warning",importDiagnosticError:"majom-boards-import__diagnostic majom-boards-import__diagnostic--error",importMessage:"majom-boards-import__message",importActions:"majom-boards-import__actions",importActionButtonPrimary:"majom-boards-import__action-button majom-boards-import__action-button--primary",importActionButtonSecondary:"majom-boards-import__action-button majom-boards-import__action-button--secondary",exportModal:"majom-boards-export-modal",exportContent:"majom-boards-export__content",exportMeta:"majom-boards-export__meta",exportOutput:"majom-boards-export__output",cardActionsPopover:"majom-boards-card-actions",cardActionsBody:"majom-boards-card-actions__body",cardActionsList:"majom-boards-card-actions__list",cardActionsItem:"majom-boards-card-actions__item",cardActionsButton:"majom-boards-card-actions__button",cardActionsDivider:"majom-boards-card-actions__divider",topbarActions:"majom-boards-cardback__topbar-actions",iconButton:"majom-boards-cardback__icon-button",layout:"majom-boards-cardback__layout",main:"majom-boards-cardback__main",aside:"majom-boards-cardback__aside",section:"majom-boards-cardback__section",sectionIcon:"majom-boards-cardback__section-icon",sectionMain:"majom-boards-cardback__section-main",sectionHeader:"majom-boards-cardback__section-header",sectionTitle:"majom-boards-cardback__section-title",sectionActions:"majom-boards-cardback__section-actions",titleSection:"majom-boards-cardback__title-section",doneButton:"majom-boards-cardback__done-button",doneButtonCompleted:"majom-boards-cardback__done-button is-complete",titleEditor:"majom-boards-cardback__title-editor",quickActions:"majom-boards-cardback__quick-actions",quickActionList:"majom-boards-cardback__quick-action-list",quickActionButton:"majom-boards-cardback__quick-action-button",labelsHost:"majom-boards-cardback__labels-host",labelsSection:"majom-boards-cardback__labels-section",labelsTitle:"majom-boards-cardback__labels-title",labelsList:"majom-boards-cardback__labels-list",labelSwatch:"majom-boards-cardback__label-swatch",labelAddButton:"majom-boards-cardback__label-add-button",labelPickerPopover:"majom-boards-cardback__label-picker-popover",entityLinksHost:"majom-boards-cardback__entity-links-host",entityLinksMessage:"majom-boards-cardback__entity-links-message",entityLinksList:"majom-boards-cardback__entity-links-list",entityLinkItem:"majom-boards-cardback__entity-link-item",entityLinkIcon:"majom-boards-cardback__entity-link-icon",entityLinkContent:"majom-boards-cardback__entity-link-content",entityLinkTitle:"majom-boards-cardback__entity-link-title",entityLinkMeta:"majom-boards-cardback__entity-link-meta",entityLinkMenuTriggerButton:"majom-boards-cardback__entity-link-menu-trigger",entityLinkMenuPopover:"majom-boards-cardback__entity-link-menu",entityLinkMenuList:"majom-boards-cardback__entity-link-menu-list",entityLinkMenuItem:"majom-boards-cardback__entity-link-menu-item",entityLinkMenuButton:"majom-boards-cardback__entity-link-menu-button",entityLinkMenuDangerButton:"majom-boards-cardback__entity-link-menu-button majom-boards-cardback__entity-link-menu-button--danger",entityLinkPicker:"majom-boards-cardback__entity-link-picker",entityLinkPickerField:"majom-boards-cardback__entity-link-picker-field",entityLinkPickerInput:"majom-boards-cardback__entity-link-picker-input",entityLinkPickerResults:"majom-boards-cardback__entity-link-picker-results",entityLinkPickerList:"majom-boards-cardback__entity-link-picker-list",entityLinkPickerButton:"majom-boards-cardback__entity-link-picker-button",checklistPopover:"majom-boards-cardback__checklist-popover",checklistPopoverHeader:"majom-boards-cardback__checklist-popover-header",checklistPopoverTitle:"majom-boards-cardback__checklist-popover-title",checklistPopoverClose:"majom-boards-cardback__checklist-popover-close",checklistPopoverForm:"majom-boards-cardback__checklist-popover-form",checklistPopoverLabel:"majom-boards-cardback__checklist-popover-label",checklistPopoverInput:"majom-boards-cardback__checklist-popover-input",checklistPopoverActions:"majom-boards-cardback__checklist-popover-actions",checklistPopoverSubmit:"majom-boards-cardback__checklist-popover-submit",checklistsHost:"majom-boards-cardback__checklists-host",checklistsMessage:"majom-boards-cardback__checklists-message",checklistsList:"majom-boards-cardback__checklists-list",checklist:"majom-boards-cardback__checklist",checklistActions:"majom-boards-cardback__checklist-actions",checklistActionButton:"majom-boards-cardback__checklist-action-button",checklistProgressRow:"majom-boards-cardback__checklist-progress-row",checklistProgress:"majom-boards-cardback__checklist-progress",checklistProgressTrack:"majom-boards-cardback__checklist-progress-track",checklistProgressBar:"majom-boards-cardback__checklist-progress-bar",checkItemList:"majom-boards-cardback__checkitem-list",checkItem:"majom-boards-cardback__checkitem",checkItemCheckbox:"majom-boards-cardback__checkitem-checkbox",checkItemTitle:"majom-boards-cardback__checkitem-title",checkItemTitleComplete:"majom-boards-cardback__checkitem-title is-complete",checkItemTitleInput:"majom-boards-cardback__checkitem-title-input",checkItemMenuTriggerButton:"majom-boards-cardback__checkitem-menu-trigger",checkItemMenuPopover:"majom-boards-cardback__checkitem-menu",checkItemMenuList:"majom-boards-cardback__checkitem-menu-list",checkItemMenuItem:"majom-boards-cardback__checkitem-menu-item",checkItemMenuButton:"majom-boards-cardback__checkitem-menu-button",checkItemCollapsedComposer:"majom-boards-cardback__checkitem-collapsed-composer",checkItemComposer:"majom-boards-cardback__checkitem-composer",checkItemComposerInput:"majom-boards-cardback__checkitem-composer-input",checkItemComposerActions:"majom-boards-cardback__checkitem-composer-actions",checkItemComposerPrimaryActions:"majom-boards-cardback__checkitem-composer-primary-actions",checkItemComposerMetaActions:"majom-boards-cardback__checkitem-composer-meta-actions",checkItemMetaButton:"majom-boards-cardback__checkitem-meta-button",descriptionEditor:"majom-boards-cardback__description-editor",placeholderPanel:"majom-boards-cardback__placeholder-panel",editorActions:"majom-boards-cardback__editor-actions",activityInput:"majom-boards-cardback__activity-input",activityList:"majom-boards-cardback__activity-list",activityItem:"majom-boards-cardback__activity-item",avatar:"majom-boards-cardback__avatar",quickEditorOverlay:"majom-boards-quick-editor-overlay",quickEditor:"majom-boards-quick-editor",quickEditorForm:"majom-boards-quick-editor__form",quickEditorCard:"majom-boards-quick-editor__card",quickEditorCardMirror:"majom-boards-quick-editor__card--mirror",quickEditorCardInner:"majom-boards-quick-editor__card-inner",quickEditorTitle:"majom-boards-quick-editor__title",quickEditorSave:"majom-boards-quick-editor__save",quickEditorActions:"majom-boards-quick-editor__actions",quickEditorButtons:"majom-boards-quick-editor__buttons",quickEditorButton:"majom-boards-quick-editor__button",quickEditorDangerItem:"majom-boards-quick-editor__danger-item",quickEditorDangerButton:"majom-boards-quick-editor__button--danger"},Ua=`
:root {
  --mb-shadow-card: 0 1px 1px rgba(9, 30, 66, 0.25), 0 0 0 1px rgba(9, 30, 66, 0.06);
  --mb-shadow-list: 0 1px 1px rgba(9, 30, 66, 0.16), 0 0 1px rgba(9, 30, 66, 0.31);
}

.majom-boards {
  --mb-text: #172b4d;
  --mb-board-column-title-text: #44546f;
  --mb-board-card-title-text: #292A2E;
  --mb-muted: #44546f;
  --mb-subtle: #626f86;
  --mb-list: #f1f2f4;
  --mb-card: #ffffff;
  --mb-card-hover: #f7f8f9;
  --mb-blue: #0c66e4;
  --mb-blue-hover: #0055cc;
  --mb-danger: #ae2e24;
  --mb-danger-soft: #ffeceb;
  --mb-on-wallpaper-text: var(--workspace-dynamic-text-color, #172b4d);
  --mb-on-wallpaper-icon: var(--workspace-dynamic-icon-color, #172b4d);
  --mb-on-wallpaper-bg: var(--workspace-dynamic-header-bg, rgba(255, 255, 255, 0.24));
  --mb-on-wallpaper-button-bg: var(--workspace-dynamic-button-bg, rgba(9, 30, 66, 0.1));
  --mb-on-wallpaper-button-bg-hover: var(--workspace-dynamic-button-bg-hover, rgba(9, 30, 66, 0.16));
  --mb-on-wallpaper-button-bg-active: var(--workspace-dynamic-button-bg-active, rgba(9, 30, 66, 0.22));
  --mb-header-text: var(--mb-on-wallpaper-text);
  --mb-header-icon: var(--mb-on-wallpaper-icon);
  --mb-header-bg: var(--mb-on-wallpaper-bg);
  --mb-header-button-bg: var(--mb-on-wallpaper-button-bg);
  --mb-header-button-bg-hover: var(--mb-on-wallpaper-button-bg-hover);
  --mb-header-button-bg-active: var(--mb-on-wallpaper-button-bg-active);
  --mb-button-hover: rgba(9, 30, 66, 0.14);
  --mb-button-active: rgba(9, 30, 66, 0.2);
  --mb-list-button-hover: rgba(9, 30, 66, 0.08);
  --mb-list-button-active: rgba(9, 30, 66, 0.14);
  width: 100%;
  height: 100%;
  overflow: hidden;
  color: var(--mb-text);
  background: transparent;
}

.majom-boards *,
.majom-boards *::before,
.majom-boards *::after {
  box-sizing: border-box;
}

.majom-boards__shell {
  display: flex;
  min-height: 0;
  height: 100%;
  flex-direction: column;
}

.majom-boards__header {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: 8px;
  padding: 8px 12px;
  background: var(--mb-header-bg);
  color: var(--mb-header-text);
  backdrop-filter: blur(10px);
}

.majom-boards__title-block {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 6px;
}

.majom-boards__title-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 4px;
}

.majom-boards__title {
  margin: 0;
  overflow: hidden;
  color: var(--mb-header-text);
  font-size: 18px;
  font-weight: 700;
  line-height: 24px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.majom-boards__title-button {
  display: block;
  max-width: 280px;
  min-width: 0;
  border: 0;
  border-radius: 6px;
  padding: 4px 8px;
  overflow: hidden;
  color: inherit;
  background: transparent;
  font: inherit;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: text;
}

.majom-boards__title-button:hover,
.majom-boards__title-button:focus-visible {
  background: var(--mb-header-button-bg-hover);
  outline: none;
}

.majom-boards__title-edit-input {
  max-width: 320px;
  min-width: min(260px, 70vw);
  height: 32px;
  color: var(--mb-text);
  font: inherit;
}

.majom-boards__board-picker-button,
.majom-boards__header-menu-button {
  height: 32px;
  border-radius: 6px;
  color: var(--mb-header-icon) !important;
  background: transparent !important;
}

.majom-boards__board-picker-button:hover,
.majom-boards__board-picker-button:focus-visible,
.majom-boards__board-picker-button:active,
.majom-boards__board-picker-button[aria-expanded="true"],
.majom-boards__header-menu-button:hover,
.majom-boards__header-menu-button:focus-visible,
.majom-boards__header-menu-button:active,
.majom-boards__header-menu-button[aria-expanded="true"],
.majom-boards__header-menu-button[data-boards-header-menu-open="true"] {
  color: var(--mb-header-icon) !important;
  background: var(--mb-header-button-bg-active) !important;
}

.majom-boards__board-picker-button {
  width: 50px;
}

.majom-boards__board-picker-button-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.majom-boards__header-actions {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 6px;
}

.majom-boards__header-menu-button {
  display: inline-flex;
  width: 32px;
  min-width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 6px;
  padding: 0 !important;
  color: var(--mb-header-icon) !important;
  background: transparent !important;
  cursor: pointer;
}

.majom-boards .majom-boards__header .majom-boards__header-menu-button {
  color: var(--mb-header-icon) !important;
  background: transparent !important;
}

.majom-boards .majom-boards__header .majom-boards__header-menu-button:hover,
.majom-boards .majom-boards__header .majom-boards__header-menu-button:focus-visible,
.majom-boards .majom-boards__header .majom-boards__header-menu-button:active,
.majom-boards .majom-boards__header .majom-boards__header-menu-button[aria-expanded="true"],
.majom-boards .majom-boards__header .majom-boards__header-menu-button[data-boards-header-menu-open="true"] {
  color: var(--mb-header-icon) !important;
  background: var(--mb-header-button-bg-active) !important;
}

.majom-boards__body {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
}

.majom-boards-board-picker {
  --mb-board-picker-bg: #f7f8f9;
  --mb-board-picker-card-bg: #ffffff;
  --mb-board-picker-card-bg-hover: #ffffff;
  --mb-board-picker-create-card-bg: #f1f2f4;
  --mb-board-picker-create-card-bg-hover: #e6e8ec;
  --mb-board-picker-inline-padding: 16px;
  width: min(560px, calc(100vw - 24px));
  max-height: min(640px, calc(100vh - 24px));
  overflow: hidden;
  border-radius: 10px;
  background: var(--mb-board-picker-bg);
  color: var(--mb-text);
  box-shadow:
    0 16px 40px rgba(9, 30, 66, 0.2),
    0 0 0 1px rgba(9, 30, 66, 0.12);
}

.majom-boards-board-picker__search-wrap {
  position: relative;
  padding: 16px var(--mb-board-picker-inline-padding) 10px;
}

.majom-boards-board-picker__search-icon {
  position: absolute;
  top: 50%;
  left: calc(var(--mb-board-picker-inline-padding) + 12px);
  color: var(--mb-muted);
  pointer-events: none;
  transform: translateY(-35%);
}

.majom-boards-board-picker__search-input {
  height: 36px;
  border-radius: 6px;
  padding-left: 32px;
}

.majom-boards-board-picker__chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 0 var(--mb-board-picker-inline-padding) 14px;
}

.majom-boards-board-picker__chip {
  height: 28px;
  flex: 0 0 auto;
  border: 1px solid rgba(9, 30, 66, 0.14);
  border-radius: 7px;
  padding: 0 10px;
  color: #566277;
  background: #ffffff;
  font-size: 14px;
  font-weight: 600;
  line-height: 26px;
  cursor: pointer;
}

.majom-boards-board-picker__chip:hover {
  background: #f7f8f9;
}

.majom-boards-board-picker__chip.is-selected {
  border-color: #0c66e4;
  color: #0c66e4;
  background: #e9f2ff;
}

.majom-boards-board-picker__sections {
  max-height: min(480px, calc(100vh - 154px));
  overflow-y: auto;
}

.majom-boards-board-picker__section {
  padding: 10px var(--mb-board-picker-inline-padding) 20px;
}

.majom-boards-board-picker__section-title {
  margin: 0 0 12px;
}

.majom-boards-board-picker__section-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 0;
  border-radius: 6px;
  padding: 2px 4px;
  color: var(--mb-muted);
  background: transparent;
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
  cursor: pointer;
}

.majom-boards-board-picker__section-toggle:hover,
.majom-boards-board-picker__section-toggle:focus-visible {
  background: var(--mb-list-button-hover);
  outline: none;
}

.majom-boards-board-picker__section-toggle svg {
  transition: transform 120ms ease;
}

.majom-boards-board-picker__section-icon--collapsed {
  transform: rotate(-90deg);
}

.majom-boards-board-picker__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
  gap: 10px;
}

.majom-boards-board-picker__card {
  position: relative;
  min-width: 0;
  border: 0;
  border-radius: 7px;
  overflow: hidden;
  color: var(--mb-text);
  background: var(--mb-board-picker-card-bg);
  box-shadow: var(--mb-shadow-card);
}

.majom-boards-board-picker__grid .majom-boards-board-picker__card:hover,
.majom-boards-board-picker__grid .majom-boards-board-picker__card:focus-within,
.majom-boards-board-picker__grid .majom-boards-board-picker__card.is-selected:hover,
.majom-boards-board-picker__grid .majom-boards-board-picker__card.is-selected:focus-within {
  background: var(--mb-board-picker-card-bg-hover);
  box-shadow:
    0 1px 2px rgba(9, 30, 66, 0.3),
    0 0 0 2px rgba(12, 102, 228, 0.42);
}

.majom-boards-board-picker__card-button {
  display: block;
  width: 100%;
  min-width: 0;
  border: 0;
  padding: 0;
  color: inherit;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.majom-boards-board-picker__card-button:focus-visible {
  outline: none;
}

.majom-boards-board-picker__create-card {
  display: flex;
  min-width: 0;
  min-height: 110px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 7px;
  padding: 18px 16px;
  color: var(--mb-muted);
  background: var(--mb-board-picker-create-card-bg);
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  text-align: center;
  cursor: pointer;
  box-shadow: var(--mb-shadow-card);
  white-space: normal;
}

.majom-boards-board-picker__grid .majom-boards-board-picker__create-card:hover,
.majom-boards-board-picker__grid .majom-boards-board-picker__create-card:focus-visible {
  background: var(--mb-board-picker-create-card-bg-hover);
  outline: none;
  box-shadow:
    0 1px 2px rgba(9, 30, 66, 0.3),
    0 0 0 2px rgba(12, 102, 228, 0.42);
}

.majom-boards-board-picker__star-button {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 26px;
  min-width: 26px;
  height: 26px;
  color: rgba(255, 255, 255, 0.9) !important;
  background: rgba(9, 30, 66, 0.28) !important;
  opacity: 0;
}

.majom-boards-board-picker__card:hover .majom-boards-board-picker__star-button,
.majom-boards-board-picker__card:focus-within .majom-boards-board-picker__star-button,
.majom-boards-board-picker__star-button.is-active {
  opacity: 1;
}

.majom-boards-board-picker__star-button:hover,
.majom-boards-board-picker__star-button:focus-visible,
.majom-boards-board-picker__star-button.is-active {
  color: #facc15 !important;
  background: rgba(9, 30, 66, 0.42) !important;
}

.majom-boards-board-picker__actions-button {
  position: absolute;
  top: 6px;
  right: 38px;
  width: 26px;
  min-width: 26px;
  height: 26px;
  color: rgba(255, 255, 255, 0.9) !important;
  background: rgba(9, 30, 66, 0.28) !important;
  opacity: 0;
}

.majom-boards-board-picker__card:hover .majom-boards-board-picker__actions-button,
.majom-boards-board-picker__card:focus-within .majom-boards-board-picker__actions-button {
  opacity: 1;
}

.majom-boards-board-picker__actions-button:hover,
.majom-boards-board-picker__actions-button:focus-visible {
  color: #ffffff !important;
  background: rgba(9, 30, 66, 0.42) !important;
}

.majom-boards-board-picker-actions {
  min-width: 220px;
  overflow: hidden;
  border-radius: 10px;
}

.majom-boards-board-picker-actions__input-row {
  padding: 8px 10px;
}

.majom-boards-board-picker-actions__input {
  width: 100%;
}

.majom-boards-board-picker__cover {
  display: flex;
  height: 42px;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.92);
}

.majom-boards-board-picker__cover--a {
  background: linear-gradient(135deg, #a33a32, #d65f45);
}

.majom-boards-board-picker__cover--b {
  background: linear-gradient(135deg, #0f766e, #38bdf8);
}

.majom-boards-board-picker__cover--c {
  background: linear-gradient(135deg, #6d5dfc, #f0abfc);
}

.majom-boards-board-picker__cover--d {
  background: linear-gradient(135deg, #334155, #94a3b8);
}

.majom-boards-board-picker__cover--e {
  background: linear-gradient(135deg, #047857, #facc15);
}

.majom-boards-board-picker__cover--f {
  background: linear-gradient(135deg, #be123c, #fb7185);
}

.majom-boards-board-picker__cover-initial {
  font-size: 24px;
  font-weight: 800;
  line-height: 1;
  text-transform: uppercase;
}

.majom-boards-board-picker__card-title {
  display: -webkit-box;
  min-height: 42px;
  padding: 7px 8px 8px;
  overflow: hidden;
  color: var(--mb-text);
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.majom-boards-board-picker__empty {
  padding: 18px 8px 8px;
  color: var(--mb-muted);
  font-size: 14px;
  line-height: 20px;
  text-align: center;
}

.majom-boards__canvas {
  display: flex;
  min-height: 0;
  flex: 1;
  align-items: flex-start;
  gap: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 12px 16px 16px;
}

.majom-boards__column,
.majom-boards__column-composer {
  width: 272px;
  flex: 0 0 272px;
  border-radius: 10px;
  background: var(--mb-list);
  box-shadow: var(--mb-shadow-list);
}

.majom-boards__column {
  display: flex;
  height: auto;
  max-height: 100%;
  min-height: 0;
  align-self: flex-start;
  flex-direction: column;
}

.majom-boards__column-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
  padding: 10px 8px 0px 12px;
}

.majom-boards__column-title-button {
  min-width: 0;
  flex: 1;
  border: 0;
  border-radius: 4px;
  padding: 4px 6px;
  color: inherit;
  background: transparent;
  text-align: left;
}

.majom-boards__column-title-button:hover,
.majom-boards__column-title-button:focus-visible {
  background: rgba(9, 30, 66, 0.08);
  outline: none;
}

.majom-boards__column-title {
  display: block;
  min-width: 0;
  overflow: hidden;
  color: var(--mb-board-column-title-text);
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.majom-boards__column-title-input {
  width: 100%;
  min-width: 0;
  min-height: 32px;
  border: 0;
  border-radius: 4px;
  padding: 5px 8px;
  color: var(--mb-board-column-title-text);
  background: #ffffff;
  box-shadow: inset 0 0 0 2px var(--mb-blue);
  font: inherit;
  font-size: 16px;
  font-weight: 700;
  line-height: 20px;
}

.majom-boards__column-title-input:focus {
  outline: none;
}

.majom-boards__column-menu-button {
  color: var(--mb-muted);
  background: transparent;
  box-shadow: none;
}

.majom-boards__cards {
  display: flex;
  min-height: 0;
  flex: 0 1 auto;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  padding: 8px;
}

.majom-boards__card {
  position: relative;
  border-radius: 8px;
  background: var(--mb-card);
  box-shadow: var(--mb-shadow-card);
  color: var(--mb-text);
  transition: background-color 150ms ease, box-shadow 150ms ease;
  touch-action: none;
}

.majom-boards__card:hover,
.majom-boards__card:focus-within {
  background: var(--mb-card-hover);
  box-shadow:
    0 1px 2px rgba(9, 30, 66, 0.3),
    0 0 0 2px rgba(12, 102, 228, 0.42);
}

.majom-boards__card--mirror:hover,
.majom-boards__card--mirror:focus-within {
  box-shadow:
    0 1px 2px rgba(9, 30, 66, 0.3),
    0 0 0 2px rgba(12, 102, 228, 0.62);
}

.majom-boards__card-open {
  display: block;
  width: 100%;
  border: 0;
  border-radius: 8px;
  padding: 8px 10px;
  color: inherit;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: padding-left 150ms ease;
}

.majom-boards__card:hover .majom-boards__card-open,
.majom-boards__card:focus-within .majom-boards__card-open,
.majom-boards__card.is-complete .majom-boards__card-open {
  padding-left: 34px;
}

.majom-boards__card-complete-toggle {
  position: absolute;
  top: 7px;
  left: 7px;
  z-index: 2;
  display: inline-flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 999px;
  padding: 0;
  color: #626f86;
  background: transparent;
  opacity: 0;
  pointer-events: none;
  cursor: pointer;
  transition: opacity 120ms ease, background-color 120ms ease, color 120ms ease;
}

.majom-boards__card:hover .majom-boards__card-complete-toggle,
.majom-boards__card:focus-within .majom-boards__card-complete-toggle,
.majom-boards__card-complete-toggle:focus-visible,
.majom-boards__card-complete-toggle.is-complete {
  opacity: 1;
  pointer-events: auto;
}

.majom-boards__card-complete-toggle:hover,
.majom-boards__card-complete-toggle:focus-visible {
  background: #dcdfe4;
  color: #172b4d;
}

.majom-boards__card-complete-toggle.is-complete {
  color: #ffffff;
}

.majom-boards__card.is-dragging {
  opacity: 0.32;
}

.majom-boards__card-drag-preview {
  position: fixed;
  z-index: 360;
  pointer-events: none;
  background: var(--mb-card);
  transform: rotate(2deg);
  opacity: 0.94;
  box-shadow:
    0 12px 28px rgba(9, 30, 66, 0.28),
    0 0 0 1px rgba(9, 30, 66, 0.08);
}

.majom-boards__card-drag-placeholder {
  flex: 0 0 auto;
  border-radius: 8px;
  background: rgba(9, 30, 66, 0.12);
  box-shadow: inset 0 0 0 1px rgba(9, 30, 66, 0.08);
}

.majom-boards.is-card-dragging {
  cursor: grabbing;
  user-select: none;
}

.majom-boards.is-card-dragging .majom-boards__card-open {
  cursor: grabbing;
}

.majom-boards__column.is-dragging {
  opacity: 0.32;
}

.majom-boards__column-drag-preview {
  position: fixed;
  z-index: 350;
  pointer-events: none;
  transform: rotate(1deg);
  opacity: 0.96;
  box-shadow:
    0 16px 32px rgba(9, 30, 66, 0.28),
    0 0 0 1px rgba(9, 30, 66, 0.08);
}

.majom-boards__column-drag-placeholder {
  flex: 0 0 auto;
  border-radius: 12px;
  background: rgba(9, 30, 66, 0.16);
  box-shadow: inset 0 0 0 1px rgba(9, 30, 66, 0.08);
}

.majom-boards.is-column-dragging {
  cursor: grabbing;
  user-select: none;
}

.majom-boards__card-source-label {
  display: inline-flex;
  max-width: 100%;
  margin-bottom: 6px;
  border-radius: 4px;
  padding: 2px 6px;
  overflow: hidden;
  color: #0c66e4;
  background: #e9f2ff;
  font-size: 11px;
  font-weight: 700;
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.majom-boards__card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 6px;
}

.majom-boards__card-tag {
  display: block;
  width: 48px;
  max-width: 100%;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  font-size: 0;
  line-height: 0;
}

.majom-boards__card-tag:nth-child(n + 5) {
  width: 32px;
}

.majom-boards__card-open:focus-visible,
.majom-boards__input:focus-visible,
.majom-boards__textarea:focus-visible,
.majom-boards-modal__title-input:focus-visible,
.majom-boards-modal__description:focus-visible {
  outline: 2px solid rgba(12, 102, 228, 0.36);
  outline-offset: 2px;
}

.majom-boards__card-title {
  margin: 0;
  color: var(--mb-board-card-title-text);
  font: normal 400 0.875rem/1.25rem "Atlassian Sans", ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Ubuntu, "Helvetica Neue", sans-serif;
  overflow-wrap: anywhere;
}

.majom-boards__card-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.majom-boards__card-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 20px;
  border-radius: 4px;
  padding: 2px 6px;
  color: var(--mb-muted);
  background: #f1f2f4;
  font-size: 11px;
  font-weight: 700;
  line-height: 16px;
}

.majom-boards__card-badge--plain {
  padding: 2px 0;
  background: transparent;
  color: #8590a2;
}

.majom-boards__card-badge--neutral {
  color: #44546f;
  background: #f1f2f4;
}

.majom-boards__card-badge--task {
  color: #44546f;
  background: #f1f2f4;
}

.majom-boards__card-badge--story {
  color: #146c43;
  background: #dcfce7;
}

.majom-boards__card-badge--goal {
  color: #7e22ce;
  background: #f3e8ff;
}

.majom-boards__card-composer {
  flex-shrink: 0;
  padding: 0 8px 8px;
}

.majom-boards__card-composer-expanded {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.majom-boards__card-composer-collapsed {
  width: 100%;
  justify-content: flex-start;
  border-radius: 8px;
  color: var(--mb-muted);
}

.majom-boards__card-composer-collapsed:hover,
.majom-boards__card-composer-collapsed:focus-visible {
  color: var(--mb-text);
  background: var(--mb-list-button-hover);
}

.majom-boards__card-composer-collapsed:active {
  background: var(--mb-list-button-active);
}

.majom-boards__card-composer-textarea {
  width: 100%;
  height: 56px;
  min-height: 56px;
  max-height: 160px;
  border: 0;
  border-radius: 8px;
  padding: 8px 12px;
  resize: none;
  color: var(--mb-text);
  background: var(--mb-card);
  box-shadow: var(--mb-shadow-card);
  font: inherit;
  font-size: 16px;
  line-height: 20px;
  overflow-y: auto;
}

.majom-boards__card-composer-textarea:focus-visible {
  outline: 2px solid rgba(12, 102, 228, 0.36);
  outline-offset: 2px;
}

.majom-boards__column-composer {
  display: flex;
  height: fit-content;
  flex-direction: column;
  gap: 8px;
}

.majom-boards__column-composer--expanded {
  padding: 8px;
  background: rgba(241, 242, 244, 0.9);
}

.majom-boards__column-composer--collapsed {
  padding: 0;
  background: var(--mb-on-wallpaper-bg);
  box-shadow: none;
  backdrop-filter: blur(10px);
}

.majom-boards__column-composer-collapsed {
  width: 100%;
  min-height: 44px;
  justify-content: flex-start;
  border-radius: 8px;
  gap: 8px;
  color: var(--mb-on-wallpaper-text) !important;
  background: transparent !important;
  font-weight: 600;
}

.majom-boards__column-composer-collapsed:hover,
.majom-boards__column-composer-collapsed:focus-visible {
  color: var(--mb-on-wallpaper-text) !important;
  background: var(--mb-on-wallpaper-button-bg-hover) !important;
}

.majom-boards__column-composer-collapsed:active {
  color: var(--mb-on-wallpaper-text) !important;
  background: var(--mb-on-wallpaper-button-bg-active) !important;
}

.majom-boards__column-composer-expanded {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.majom-boards__list-composer-textarea {
  width: 100%;
  height: 32px;
  min-height: 32px;
  max-height: 120px;
  border: 0;
  border-radius: 8px;
  padding: 6px 12px;
  resize: none;
  color: var(--mb-text);
  background: var(--mb-card);
  box-shadow: var(--mb-shadow-card);
  font: inherit;
  font-size: 16px;
  font-weight: 700;
  line-height: 20px;
  overflow-y: auto;
}

.majom-boards__list-composer-textarea:focus-visible {
  outline: 2px solid rgba(12, 102, 228, 0.36);
  outline-offset: 2px;
}

.majom-boards__input,
.majom-boards__textarea {
  width: 100%;
  border: 0;
  border-radius: 8px;
  color: var(--mb-text);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: inset 0 0 0 1px rgba(9, 30, 66, 0.16), 0 1px 1px rgba(9, 30, 66, 0.08);
  font: inherit;
  font-size: 16px;
}

.majom-boards__input {
  height: 40px;
  min-height: 40px;
  padding: 8px 12px;
}

.majom-boards__textarea {
  min-height: 72px;
  resize: vertical;
  padding: 10px 12px;
  line-height: 20px;
}

.majom-boards__input::placeholder,
.majom-boards__textarea::placeholder,
.majom-boards__card-composer-textarea::placeholder,
.majom-boards__list-composer-textarea::placeholder,
.majom-boards-modal__description::placeholder,
.majom-boards-modal__title-input::placeholder {
  color: var(--mb-subtle);
}

.majom-boards__composer-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.majom-boards__composer-cancel {
  color: var(--mb-muted);
}

.majom-boards__button,
.majom-boards__icon-button {
  border-radius: 8px;
  box-shadow: none;
}

.majom-boards__button--primary {
  background: var(--mb-blue);
  color: #fff;
}

.majom-boards__button--primary:hover {
  background: var(--mb-blue-hover);
  color: #fff;
}

.majom-boards__button--quiet {
  color: var(--mb-muted);
  background: transparent;
}

.majom-boards__button--quiet:hover,
.majom-boards__icon-button:hover {
  color: var(--mb-text);
  background: var(--mb-button-hover);
}

.majom-boards__button--danger,
.majom-boards__icon-button--danger {
  color: var(--mb-danger);
  background: transparent;
}

.majom-boards__button--danger:hover,
.majom-boards__icon-button--danger:hover {
  color: #5d1f1a;
  background: var(--mb-danger-soft);
}

.majom-boards__empty,
.majom-boards__message-wrapper {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.majom-boards__empty-content {
  max-width: 420px;
  text-align: center;
}

.majom-boards__empty-title {
  margin: 0;
  color: var(--mb-text);
  font-size: 18px;
  font-weight: 700;
  line-height: 24px;
}

.majom-boards__empty-copy,
.majom-boards__message-label {
  margin: 8px 0 0;
  color: var(--mb-muted);
  font-size: 14px;
  line-height: 22px;
}

.majom-boards-modal {
  --mb-text: #172b4d;
  --mb-muted: #44546f;
  --mb-subtle: #626f86;
  --mb-blue: #0c66e4;
  --mb-blue-hover: #0055cc;
  --mb-danger: #ae2e24;
  --mb-danger-soft: #ffeceb;
  --mb-button-hover: rgba(9, 30, 66, 0.14);
  width: min(72rem, calc(100vw - 2rem));
  max-width: min(72rem, calc(100vw - 2rem));
  border-radius: 12px;
  padding: 0;
  background: #ffffff;
}

.majom-boards-modal__body {
  display: flex;
  flex-direction: column;
  min-height: 0;
  gap: 0;
  padding: 0;
  overflow: hidden;
}

.majom-boards-modal__meta {
  margin: -4px 0 0;
  color: var(--mb-muted, #44546f);
  font-size: 13px;
  line-height: 18px;
}

.majom-boards-modal__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.majom-boards-modal__label {
  color: var(--mb-muted, #44546f);
  font-size: 12px;
  font-weight: 700;
  line-height: 16px;
}

.majom-boards-modal__title-input,
.majom-boards-modal__description {
  width: 100%;
  border: 0;
  border-radius: 8px;
  color: var(--mb-text, #172b4d);
  background: #f7f8f9;
  box-shadow: inset 0 0 0 1px rgba(9, 30, 66, 0.14);
  font: inherit;
  font-size: 16px;
}

.majom-boards-modal__title-input {
  min-height: 44px;
  padding: 10px 12px;
  font-weight: 700;
}

.majom-boards-modal__description {
  min-height: 180px;
  resize: vertical;
  padding: 12px;
  line-height: 22px;
}

.majom-boards-modal__hint {
  margin: 0;
  color: var(--mb-subtle, #626f86);
  font-size: 12px;
  line-height: 18px;
}

.majom-boards-cardback__hidden-shell-part {
  display: none !important;
}

.majom-boards-cardback {
  display: flex;
  min-height: min(720px, calc(100vh - 5rem));
  max-height: min(780px, calc(100vh - 3rem));
  flex-direction: column;
  overflow: hidden;
  color: var(--mb-text, #172b4d);
  background: #ffffff;
}

.majom-boards-cardback__topbar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid rgba(9, 30, 66, 0.14);
  padding: 10px 12px;
  background: #ffffff;
}

.majom-boards-cardback__topbar-start,
.majom-boards-cardback__topbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.majom-boards-cardback__list-badge {
  display: inline-flex;
  max-width: 280px;
  min-height: 32px;
  align-items: center;
  gap: 6px;
  border: 0;
  border-radius: 6px;
  padding: 6px 10px;
  color: var(--mb-muted, #44546f);
  background: #dfe1e6;
  font-size: 13px;
  font-weight: 700;
  line-height: 18px;
}

.majom-boards-cardback__list-badge:hover,
.majom-boards-cardback__list-badge[aria-expanded='true'] {
  background: #cfd3da;
}

.majom-boards-cardback__source-label {
  display: inline-flex;
  max-width: min(360px, 48vw);
  border-radius: 4px;
  padding: 4px 8px;
  overflow: hidden;
  color: #0c66e4;
  background: #e9f2ff;
  font-size: 12px;
  font-weight: 700;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.majom-boards-cardback__move-popover {
  display: flex;
  width: min(360px, calc(100vw - 24px));
  max-height: calc(100vh - 24px);
  flex-direction: column;
  overflow: hidden;
  border-radius: 8px;
  background: #ffffff;
  box-shadow:
    0 8px 18px rgba(9, 30, 66, 0.18),
    0 0 0 1px rgba(9, 30, 66, 0.12);
}

.majom-boards-cardback__move-popover-header {
  display: grid;
  min-height: 48px;
  grid-template-columns: 32px minmax(0, 1fr) 32px;
  align-items: center;
  padding: 8px;
}

.majom-boards-cardback__move-popover-title {
  grid-column: 2;
  margin: 0;
  color: var(--mb-text, #172b4d);
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
  text-align: center;
}

.majom-boards-cardback__move-popover-header > button {
  grid-column: 3;
}

.majom-boards-cardback__move-popover-body {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
}

.majom-boards-cardback__move-popover-content {
  min-height: 0;
  overflow-y: auto;
  padding: 0 12px;
}

.majom-boards-cardback__move-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0 0 14px;
  border-bottom: 1px solid rgba(9, 30, 66, 0.14);
}

.majom-boards-cardback__move-tab {
  min-height: 36px;
  border: 0;
  border-bottom: 2px solid transparent;
  color: var(--mb-muted, #44546f);
  background: transparent;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
}

.majom-boards-cardback__move-tab.is-selected {
  border-bottom-color: var(--mb-blue, #0c66e4);
  color: var(--mb-blue, #0c66e4);
}

.majom-boards-cardback__move-section-title {
  margin: 0 0 10px;
  color: var(--mb-text, #172b4d);
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
}

.majom-boards-cardback__move-fields {
  display: grid;
  gap: 10px;
  margin-bottom: 12px;
}

.majom-boards-cardback__move-field {
  display: grid;
  gap: 4px;
}

.majom-boards-cardback__move-label {
  color: var(--mb-muted, #44546f);
  font-size: 12px;
  font-weight: 700;
  line-height: 16px;
}

.majom-boards-cardback__move-select {
  width: 100%;
  min-height: 40px;
  border: 0;
  border-radius: 4px;
  padding: 8px 34px 8px 10px;
  color: var(--mb-text, #172b4d);
  background: #ffffff;
  box-shadow: inset 0 0 0 2px rgba(9, 30, 66, 0.14);
  font: inherit;
  font-size: 16px;
  line-height: 20px;
}

.majom-boards-cardback__move-select:focus {
  box-shadow: inset 0 0 0 2px var(--mb-blue, #0c66e4);
  outline: none;
}

.majom-boards-cardback__move-actions {
  display: flex;
  flex-shrink: 0;
  padding: 12px;
  background: #ffffff;
}

.majom-boards-cardback__move-button {
  min-height: 36px;
  border-radius: 4px;
  padding: 8px 14px;
}

.majom-boards-list-actions {
  width: min(304px, calc(100vw - 24px));
  overflow: hidden;
  border-radius: 8px;
  background: #ffffff;
  box-shadow:
    0 8px 18px rgba(9, 30, 66, 0.18),
    0 0 0 1px rgba(9, 30, 66, 0.12);
}

.majom-boards-list-actions__header {
  display: grid;
  min-height: 48px;
  grid-template-columns: 32px minmax(0, 1fr) 32px;
  align-items: center;
  padding: 8px;
}

.majom-boards-list-actions__title {
  grid-column: 2;
  margin: 0;
  color: var(--mb-text, #172b4d);
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
  text-align: center;
}

.majom-boards-list-actions__header > button {
  grid-column: 3;
}

.majom-boards-list-actions__body {
  max-height: min(720px, calc(100vh - 96px));
  overflow-y: auto;
  padding: 0 0 8px;
}

.majom-boards-list-actions__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.majom-boards-list-actions__item {
  margin: 0;
}

.majom-boards-list-actions__button,
.majom-boards-list-actions__section-button {
  width: 100%;
  min-height: 32px;
  justify-content: flex-start;
  border-radius: 0;
  padding: 6px 12px;
  color: var(--mb-text, #172b4d);
  background: transparent;
  box-shadow: none;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
}

.majom-boards-list-actions__button:hover:not(:disabled),
.majom-boards-list-actions__section-button:hover:not(:disabled) {
  background: #f1f2f4;
}

.majom-boards-list-actions__button:disabled {
  color: var(--mb-subtle, #626f86);
  opacity: 1;
}

.majom-boards-list-actions__divider {
  height: 1px;
  margin: 8px 0;
  background: rgba(9, 30, 66, 0.14);
}

.majom-boards-list-actions__section {
  padding: 0 0 4px;
}

.majom-boards-list-actions__section-button {
  min-height: 36px;
  font-weight: 700;
}

.majom-boards-list-actions__section-button svg {
  margin-left: auto;
}

.majom-boards-list-actions__upgrade {
  margin: 4px 12px 8px;
  border-radius: 8px;
  padding: 12px;
  color: var(--mb-text, #172b4d);
  background: #f7f8f9;
  box-shadow: inset 0 0 0 1px rgba(9, 30, 66, 0.1);
}

.majom-boards-list-actions__upgrade-title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  line-height: 18px;
}

.majom-boards-list-actions__upgrade-copy {
  margin: 4px 0 0;
  color: var(--mb-muted, #44546f);
  font-size: 12px;
  line-height: 18px;
}

.majom-boards-import-modal {
  width: min(1080px, calc(100vw - 24px));
  max-width: min(1080px, calc(100vw - 24px));
}

.majom-boards-import__layout {
  display: grid;
  min-height: min(560px, calc(100vh - 168px));
  grid-template-columns: minmax(0, 1fr) minmax(300px, 360px);
  gap: 16px;
  overflow: hidden;
  padding: 16px;
}

.majom-boards-import__review {
  display: flex;
  min-height: min(560px, calc(100vh - 168px));
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
  padding: 16px;
}

.majom-boards-import__panel,
.majom-boards-import__side-panel,
.majom-boards-import__preview {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  gap: 12px;
}

.majom-boards-import__side-panel {
  overflow-y: auto;
  padding-right: 2px;
}

.majom-boards-import__field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.majom-boards-import__source-header {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.majom-boards-import__guide {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0;
  background: transparent;
}

.majom-boards-import__guide-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.majom-boards-import__guide-help {
  flex: 0 0 auto;
  cursor: help;
}

.majom-boards-import__guide-button {
  min-height: 32px;
  border: 1px solid rgba(9, 30, 66, 0.16);
  border-radius: 6px;
  padding: 5px 9px;
  color: var(--mb-text, #172b4d);
  background: #ffffff;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  line-height: 16px;
  cursor: pointer;
}

.majom-boards-import__guide-button:hover:not(:disabled) {
  border-color: rgba(9, 30, 66, 0.3);
  background: #f1f2f4;
}

.majom-boards-import__guide-button:focus-visible {
  outline: 2px solid rgba(12, 102, 228, 0.38);
  outline-offset: 2px;
}

.majom-boards-import__label {
  color: var(--mb-muted, #44546f);
  font-size: 12px;
  font-weight: 700;
  line-height: 16px;
}

.majom-boards-import__source {
  min-height: min(470px, calc(100vh - 300px));
  overflow: auto;
  resize: vertical;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 16px;
  line-height: 22px;
}

.majom-boards-import__select {
  width: 100%;
  min-height: 40px;
  border: 0;
  border-radius: 6px;
  padding: 8px 34px 8px 10px;
  color: var(--mb-text, #172b4d);
  background: #ffffff;
  box-shadow: inset 0 0 0 2px rgba(9, 30, 66, 0.14);
  font: inherit;
  font-size: 16px;
  line-height: 20px;
}

.majom-boards-import__select:focus {
  box-shadow: inset 0 0 0 2px var(--mb-blue, #0c66e4);
  outline: none;
}

.majom-boards-import__preview {
  position: sticky;
  top: 0;
  z-index: 1;
  max-height: min(340px, calc(100vh - 260px));
  overflow-y: auto;
  border-radius: 8px;
  padding: 0;
  background: #ffffff;
}

.majom-boards-import__review .majom-boards-import__preview {
  position: static;
  max-height: none;
  flex: 1 1 auto;
}

.majom-boards-import__review-header {
  margin-bottom: 14px;
}

.majom-boards-import__review-eyebrow,
.majom-boards-import__review-headline {
  margin: 0;
}

.majom-boards-import__review-eyebrow {
  color: var(--mb-muted, #44546f);
  font-size: 11px;
  font-weight: 800;
  line-height: 14px;
  text-transform: uppercase;
}

.majom-boards-import__review-headline {
  margin-top: 3px;
  color: var(--mb-text, #172b4d);
  font-size: 22px;
  font-weight: 800;
  line-height: 28px;
}

.majom-boards-import__preview-title {
  margin: 0;
  color: var(--mb-text, #172b4d);
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
}

.majom-boards-import__empty {
  margin: 0;
  color: var(--mb-muted, #44546f);
  font-size: 13px;
  line-height: 20px;
}

.majom-boards-import__plan-groups {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.majom-boards-import__plan-group {
  min-width: 0;
}

.majom-boards-import__plan-group-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.majom-boards-import__plan-group-title {
  margin: 0;
  color: var(--mb-text, #172b4d);
  font-size: 13px;
  font-weight: 800;
  line-height: 18px;
}

.majom-boards-import__items,
.majom-boards-import__diagnostics {
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.majom-boards-import__item,
.majom-boards-import__diagnostic {
  padding: 9px 0;
  background: transparent;
}

.majom-boards-import__item {
  display: grid;
  grid-template-columns: 86px minmax(0, 1fr);
  align-items: start;
  gap: 12px;
  border-top: 1px solid rgba(9, 30, 66, 0.1);
}

.majom-boards-import__items .majom-boards-import__item:last-child {
  border-bottom: 1px solid rgba(9, 30, 66, 0.1);
}

.majom-boards-import__item-entity {
  width: fit-content;
  max-width: 100%;
  border-radius: 4px;
  padding: 2px 6px;
  color: var(--mb-muted, #44546f);
  background: #f1f2f4;
  font-size: 11px;
  font-weight: 800;
  line-height: 15px;
  text-transform: uppercase;
}

.majom-boards-import__item-main,
.majom-boards-import__item-meta {
  display: block;
  min-width: 0;
  overflow-wrap: anywhere;
}

.majom-boards-import__item-main {
  color: var(--mb-text, #172b4d);
  font-size: 13px;
  font-weight: 700;
  line-height: 18px;
}

.majom-boards-import__item-meta {
  margin-top: 2px;
  color: var(--mb-muted, #44546f);
  font-size: 12px;
  line-height: 16px;
}

.majom-boards-import__diagnostic {
  border-radius: 6px;
  padding: 8px 10px;
  background: #f7f8f9;
  font-size: 12px;
  line-height: 17px;
  overflow-wrap: anywhere;
}

.majom-boards-import__diagnostic--warning {
  color: #7f5f01;
  background: #fff7d6;
}

.majom-boards-import__diagnostic--error {
  color: #ae2e24;
  background: #ffeceb;
}

.majom-boards-import__message {
  margin: 0 0 10px;
}

.majom-boards-import__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.majom-boards-import__action-button {
  min-height: 40px;
  min-width: 112px;
  border: 1px solid rgba(9, 30, 66, 0.2);
  border-radius: 6px;
  padding: 8px 14px;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
  cursor: pointer;
}

.majom-boards-import__action-button--secondary {
  color: var(--mb-text, #172b4d);
  background: #ffffff;
  box-shadow: 0 1px 1px rgba(9, 30, 66, 0.08);
}

.majom-boards-import__action-button--secondary:hover:not(:disabled) {
  background: #f7f8f9;
  border-color: rgba(9, 30, 66, 0.32);
}

.majom-boards-import__action-button--primary {
  border-color: #0c66e4;
  color: #ffffff;
  background: #0c66e4;
  box-shadow: 0 1px 2px rgba(9, 30, 66, 0.18);
}

.majom-boards-import__action-button--primary:hover:not(:disabled) {
  border-color: #0055cc;
  background: #0055cc;
}

.majom-boards-import__action-button:focus-visible {
  outline: 2px solid rgba(12, 102, 228, 0.38);
  outline-offset: 2px;
}

.majom-boards-import__action-button:disabled {
  border-color: #dcdfe4;
  color: #7e8794;
  background: #f1f2f4;
  box-shadow: none;
  cursor: not-allowed;
}

.majom-boards-export-modal {
  width: min(820px, calc(100vw - 24px));
  max-width: min(820px, calc(100vw - 24px));
}

.majom-boards-export__content {
  display: flex;
  min-height: min(520px, calc(100vh - 168px));
  flex-direction: column;
  gap: 10px;
  padding: 16px;
}

.majom-boards-export__meta {
  margin: 0;
  color: var(--mb-muted, #44546f);
  font-size: 13px;
  font-weight: 700;
  line-height: 18px;
  overflow-wrap: anywhere;
}

.majom-boards-export__output {
  min-height: 440px;
  resize: vertical;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 16px;
  line-height: 22px;
}

.majom-boards-card-actions {
  width: min(232px, calc(100vw - 24px));
  overflow: hidden;
  border-radius: 8px;
  background: #ffffff;
  box-shadow:
    0 8px 18px rgba(9, 30, 66, 0.18),
    0 0 0 1px rgba(9, 30, 66, 0.12);
}

.majom-boards-card-actions__body {
  max-height: min(640px, calc(100vh - 96px));
  overflow-y: auto;
  padding: 8px 0;
}

.majom-boards-card-actions__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.majom-boards-card-actions__item {
  margin: 0;
}

.majom-boards-card-actions__button {
  width: 100%;
  min-height: 34px;
  justify-content: flex-start;
  gap: 8px;
  border-radius: 0;
  padding: 7px 12px;
  color: var(--mb-text, #172b4d);
  background: transparent;
  box-shadow: none;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
}

.majom-boards-card-actions__button:hover:not(:disabled) {
  background: #f1f2f4;
}

.majom-boards-card-actions__button:disabled {
  color: var(--mb-subtle, #626f86);
  opacity: 1;
}

.majom-boards-card-actions__divider {
  height: 1px;
  margin: 8px 0;
  background: rgba(9, 30, 66, 0.14);
}

.majom-boards-cardback__icon-button {
  color: var(--mb-muted, #44546f);
  background: transparent;
  box-shadow: none;
}

.majom-boards-cardback__icon-button:hover {
  color: var(--mb-text, #172b4d);
  background: var(--mb-button-hover);
}

.majom-boards-cardback__layout {
  display: grid;
  min-height: 0;
  flex: 1;
  grid-template-columns: minmax(0, 1fr);
  overflow: hidden;
}

.majom-boards-cardback__main {
  min-width: 0;
  overflow-y: auto;
  padding: 8px 12px 20px;
}

.majom-boards-cardback__aside {
  display: none;
  min-width: 0;
  overflow-y: auto;
  border-left: 1px solid rgba(9, 30, 66, 0.12);
  background: #f7f8f9;
  padding: 12px;
}

.majom-boards-cardback__section {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  gap: 12px;
  padding: 12px 0;
}

.majom-boards-cardback__title-section {
  padding-top: 4px;
}

.majom-boards-cardback__section-icon {
  display: flex;
  min-height: 32px;
  align-items: flex-start;
  justify-content: center;
  padding-top: 5px;
  color: var(--mb-subtle, #626f86);
}

.majom-boards-cardback__section-main {
  min-width: 0;
}

.majom-boards-cardback__section-header {
  display: flex;
  min-height: 32px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.majom-boards-cardback__section-title {
  margin: 0;
  color: var(--mb-text, #172b4d);
  font-size: 16px;
  font-weight: 700;
  line-height: 24px;
}

.majom-boards-cardback__section-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.majom-boards-cardback__done-button {
  display: inline-flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 999px;
  padding: 0;
  color: var(--mb-subtle, #626f86);
  background: transparent;
  box-shadow: none;
  cursor: pointer;
  transition: background-color 120ms ease, color 120ms ease;
}

.majom-boards-cardback__done-button:hover,
.majom-boards-cardback__done-button:focus-visible {
  color: var(--mb-text, #172b4d);
  background: #dcdfe4;
}

.majom-boards-cardback__done-button.is-complete {
  color: #ffffff;
}

.majom-boards__completion-mark {
  position: relative;
  display: block;
  width: 18px;
  height: 18px;
  border: 2px solid currentColor;
  border-radius: 999px;
  background: #ffffff;
}

.majom-boards__card-complete-toggle.is-complete .majom-boards__completion-mark,
.majom-boards-cardback__done-button.is-complete .majom-boards__completion-mark {
  border-color: #22a06b;
  background: #22a06b;
}

.majom-boards__card-complete-toggle.is-complete .majom-boards__completion-mark::after,
.majom-boards-cardback__done-button.is-complete .majom-boards__completion-mark::after {
  position: absolute;
  left: 5px;
  top: 2px;
  width: 5px;
  height: 9px;
  border: solid #ffffff;
  border-width: 0 2px 2px 0;
  content: '';
  transform: rotate(45deg);
}

.majom-boards-cardback__title-editor {
  box-sizing: border-box;
  width: 100%;
  min-height: 46px;
  border: 0;
  border-radius: 8px;
  padding: 8px 10px;
  resize: vertical;
  color: var(--mb-text, #172b4d);
  background: transparent;
  font: inherit;
  font-size: 24px;
  font-weight: 700;
  line-height: 30px;
}

.majom-boards-cardback__title-editor:focus-visible {
  background: #ffffff;
  box-shadow: inset 0 0 0 2px rgba(12, 102, 228, 0.55);
  outline: none;
}

.majom-boards-cardback__quick-actions {
  padding-top: 0;
}

.majom-boards-cardback__quick-action-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.majom-boards-cardback__quick-action-button {
  min-height: 36px;
  justify-content: flex-start;
  gap: 8px;
  border-radius: 8px;
  color: var(--mb-muted, #44546f);
  background: #e9ebee;
  box-shadow: none;
}

.majom-boards-cardback__quick-action-button:hover:not(:disabled) {
  color: var(--mb-text, #172b4d);
  background: #dfe1e6;
}

.majom-boards-cardback__quick-action-button:disabled {
  opacity: 0.72;
  cursor: not-allowed;
}

.majom-boards-cardback__labels-host:empty {
  display: none;
}

.majom-boards-cardback__labels-section {
  padding: 6px 0 12px 44px;
}

.majom-boards-cardback__labels-title {
  margin: 0 0 6px;
  color: var(--mb-muted, #44546f);
  font-size: 13px;
  font-weight: 700;
  line-height: 18px;
}

.majom-boards-cardback__labels-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.majom-boards-cardback__label-swatch {
  min-width: 60px;
  max-width: 180px;
  height: 32px;
  border: 0;
  border-radius: 5px;
  padding: 0 10px;
  overflow: hidden;
  box-shadow: none;
  font-size: 14px;
  font-weight: 500;
  line-height: 18px;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.majom-boards-cardback__label-swatch:hover,
.majom-boards-cardback__label-swatch:focus-visible {
  filter: brightness(0.96);
  outline: 2px solid rgba(12, 102, 228, 0.36);
  outline-offset: 2px;
}

.majom-boards-cardback__label-add-button {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  color: var(--mb-muted, #44546f);
  background: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(9, 30, 66, 0.18);
}

.majom-boards-cardback__label-add-button:hover,
.majom-boards-cardback__label-add-button[aria-expanded='true'] {
  color: var(--mb-text, #172b4d);
  background: #f7f8f9;
}

.majom-boards-cardback__label-picker-popover {
  width: min(304px, calc(100vw - 24px));
  overflow: hidden;
  border-radius: 8px;
  background: #ffffff;
  box-shadow:
    0 8px 18px rgba(9, 30, 66, 0.18),
    0 0 0 1px rgba(9, 30, 66, 0.12);
}

.majom-boards-cardback__entity-links-host {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.majom-boards-cardback__entity-links-message {
  margin: 0;
  color: var(--mb-muted, #44546f);
  font-size: 13px;
  line-height: 20px;
}

.majom-boards-cardback__entity-links-list,
.majom-boards-cardback__entity-link-picker-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.majom-boards-cardback__entity-link-item {
  position: relative;
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) 28px;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  border-radius: 6px;
  padding: 4px 6px;
}

.majom-boards-cardback__entity-link-item:hover,
.majom-boards-cardback__entity-link-item:focus-within {
  background: #f7f8f9;
}

.majom-boards-cardback__entity-link-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--mb-muted, #44546f);
}

.majom-boards-cardback__entity-link-content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 1px;
}

.majom-boards-cardback__entity-link-title {
  overflow: hidden;
  color: var(--mb-text, #172b4d);
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.majom-boards-cardback__entity-link-meta {
  overflow: hidden;
  color: var(--mb-muted, #44546f);
  font-size: 12px;
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.majom-boards-cardback__entity-link-menu-trigger {
  width: 28px;
  height: 28px;
  color: var(--mb-subtle, #626f86);
  opacity: 0;
  background: transparent;
  box-shadow: none;
}

.majom-boards-cardback__entity-link-item:hover .majom-boards-cardback__entity-link-menu-trigger,
.majom-boards-cardback__entity-link-item:focus-within .majom-boards-cardback__entity-link-menu-trigger,
.majom-boards-cardback__entity-link-menu-trigger[aria-expanded='true'] {
  opacity: 1;
}

.majom-boards-cardback__entity-link-menu-trigger:hover,
.majom-boards-cardback__entity-link-menu-trigger[aria-expanded='true'] {
  color: var(--mb-text, #172b4d);
  background: #f1f2f4;
}

.majom-boards-cardback__entity-link-menu {
  width: min(232px, calc(100vw - 24px));
  overflow: hidden;
  border-radius: 8px;
  background: #ffffff;
  box-shadow:
    0 8px 18px rgba(9, 30, 66, 0.18),
    0 0 0 1px rgba(9, 30, 66, 0.12);
}

.majom-boards-cardback__entity-link-menu-list {
  margin: 0;
  padding: 6px 0;
  list-style: none;
}

.majom-boards-cardback__entity-link-menu-item {
  margin: 0;
}

.majom-boards-cardback__entity-link-menu-button {
  width: 100%;
  min-height: 34px;
  justify-content: flex-start;
  gap: 8px;
  border-radius: 0;
  color: var(--mb-text, #172b4d);
  background: transparent;
  box-shadow: none;
  font-size: 14px;
  font-weight: 400;
}

.majom-boards-cardback__entity-link-menu-button:hover:not(:disabled) {
  background: #f1f2f4;
}

.majom-boards-cardback__entity-link-menu-button--danger {
  color: #ae2e24;
}

.majom-boards-cardback__entity-link-menu-button--danger:hover:not(:disabled) {
  color: #7f1d1d;
  background: #fbeae5;
}

.majom-boards-cardback__entity-link-picker {
  display: grid;
  gap: 14px;
}

.majom-boards-cardback__entity-link-picker-field {
  display: grid;
  gap: 6px;
}

.majom-boards-cardback__entity-link-picker-input {
  width: 100%;
  font-size: 16px;
}

.majom-boards-cardback__entity-link-picker-results {
  min-height: 48px;
}

.majom-boards-cardback__entity-link-picker-button {
  display: grid;
  width: 100%;
  min-height: 44px;
  grid-template-columns: 24px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  border: 0;
  border-radius: 6px;
  padding: 6px 8px;
  color: var(--mb-text, #172b4d);
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.majom-boards-cardback__entity-link-picker-button:hover:not(:disabled),
.majom-boards-cardback__entity-link-picker-button:focus-visible {
  background: #f1f2f4;
  outline: none;
}

.majom-boards-cardback__entity-link-picker-button:disabled {
  color: var(--mb-subtle, #626f86);
  cursor: not-allowed;
}

.majom-boards-cardback__checklist-popover {
  width: min(382px, calc(100vw - 24px));
  border-radius: 8px;
  background: #ffffff;
  box-shadow:
    0 8px 18px rgba(9, 30, 66, 0.18),
    0 0 0 1px rgba(9, 30, 66, 0.12);
}

.majom-boards-cardback__checklist-popover-header {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) 32px;
  align-items: center;
  padding: 12px 12px 8px;
}

.majom-boards-cardback__checklist-popover-title {
  grid-column: 2;
  margin: 0;
  overflow: hidden;
  color: var(--mb-muted, #44546f);
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.majom-boards-cardback__checklist-popover-close {
  grid-column: 3;
  width: 32px;
  height: 32px;
  color: var(--mb-subtle, #626f86);
}

.majom-boards-cardback__checklist-popover-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 16px 16px;
}

.majom-boards-cardback__checklist-popover-label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--mb-muted, #44546f);
  font-size: 12px;
  font-weight: 700;
  line-height: 16px;
}

.majom-boards-cardback__checklist-popover-input {
  width: 100%;
  font-size: 16px;
}

.majom-boards-cardback__checklist-popover-actions {
  display: flex;
  justify-content: flex-start;
}

.majom-boards-cardback__checklist-popover-submit {
  min-width: 94px;
  min-height: 40px;
  border-radius: 6px;
  background: #0c66e4;
  color: #ffffff;
  font-weight: 700;
  box-shadow: none;
}

.majom-boards-cardback__checklist-popover-submit:hover:not(:disabled) {
  background: #0055cc;
  color: #ffffff;
}

.majom-boards-cardback__checklists-host {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.majom-boards-cardback__checklists-host[hidden] {
  display: none;
}

.majom-boards-cardback__checklists-message {
  color: var(--mb-muted, #44546f);
  font-size: 13px;
  line-height: 20px;
}

.majom-boards-cardback__checklists-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.majom-boards-cardback__checklist {
  grid-template-columns: 24px minmax(0, 1fr);
  row-gap: 8px;
  padding-top: 12px;
  padding-bottom: 18px;
}

.majom-boards-cardback__checklist > .majom-boards-cardback__section-icon {
  color: var(--mb-text, #172b4d);
}

.majom-boards-cardback__checklist-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.majom-boards-cardback__checklist-title {
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--mb-text, #172b4d);
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
}

.majom-boards-cardback__checklist-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.majom-boards-cardback__checklist-action-button {
  min-height: 40px;
  border-radius: 8px;
  color: var(--mb-muted, #44546f);
  background: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(9, 30, 66, 0.14);
}

.majom-boards-cardback__checklist-action-button:hover:not(:disabled) {
  color: var(--mb-text, #172b4d);
  background: #f7f8f9;
}

.majom-boards-cardback__checklist-progress-row {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: 24px minmax(0, 1fr);
  align-items: center;
  column-gap: 12px;
}

.majom-boards-cardback__checklist-progress {
  color: var(--mb-muted, #44546f);
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
}

.majom-boards-cardback__checkitem-menu-trigger {
  position: absolute;
  right: 2px;
  width: 28px;
  height: 28px;
  color: var(--mb-subtle, #626f86);
  opacity: 0;
  background: transparent;
  box-shadow: none;
}

.majom-boards-cardback__checkitem:hover .majom-boards-cardback__checkitem-menu-trigger,
.majom-boards-cardback__checkitem:focus-within .majom-boards-cardback__checkitem-menu-trigger,
.majom-boards-cardback__checkitem-menu-trigger[aria-expanded='true'] {
  opacity: 1;
}

.majom-boards-cardback__checkitem-menu-trigger:hover,
.majom-boards-cardback__checkitem-menu-trigger[aria-expanded='true'] {
  color: var(--mb-text, #172b4d);
  background: #f1f2f4;
}

.majom-boards-cardback__checkitem-menu {
  width: min(220px, calc(100vw - 24px));
  overflow: hidden;
  border-radius: 8px;
  background: #ffffff;
  box-shadow:
    0 8px 18px rgba(9, 30, 66, 0.18),
    0 0 0 1px rgba(9, 30, 66, 0.12);
}

.majom-boards-cardback__checkitem-menu-list {
  margin: 0;
  padding: 6px 0;
  list-style: none;
}

.majom-boards-cardback__checkitem-menu-item {
  margin: 0;
}

.majom-boards-cardback__checkitem-menu-button {
  width: 100%;
  min-height: 34px;
  justify-content: flex-start;
  border-radius: 0;
  color: var(--mb-text, #172b4d);
  background: transparent;
  box-shadow: none;
  font-size: 14px;
  font-weight: 400;
}

.majom-boards-cardback__checkitem-menu-button:hover:not(:disabled) {
  color: #ae2e24;
  background: #fbeae5;
}

.majom-boards-cardback__checklist-progress-track {
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: #dfe1e6;
}

.majom-boards-cardback__checklist-progress-bar {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #30313a;
  transition: width 150ms ease;
}

.majom-boards-cardback__checkitem-list {
  display: flex;
  grid-column: 1 / -1;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.majom-boards-cardback__checkitem {
  display: grid;
  position: relative;
  grid-template-columns: 24px minmax(0, 1fr);
  align-items: center;
  column-gap: 12px;
  min-height: 32px;
}

.majom-boards-cardback__checkitem-checkbox {
  width: 24px;
  height: 32px;
}

.majom-boards-cardback__checkitem-title {
  display: block;
  width: 100%;
  min-width: 0;
  min-height: 32px;
  border: 0;
  border-radius: 6px;
  padding: 6px 38px 6px 8px;
  overflow-wrap: anywhere;
  color: var(--mb-text, #172b4d);
  background: transparent;
  font-size: 14px;
  line-height: 20px;
  text-align: left;
  cursor: text;
}

.majom-boards-cardback__checkitem-title:hover,
.majom-boards-cardback__checkitem-title:focus-visible {
  background: #f1f2f4;
  outline: none;
}

.majom-boards-cardback__checkitem-title.is-complete {
  color: var(--mb-subtle, #626f86);
  text-decoration: line-through;
}

.majom-boards-cardback__checkitem-title-input {
  width: 100%;
  min-width: 0;
  min-height: 32px;
  border: 0;
  border-radius: 6px;
  padding: 6px 38px 6px 8px;
  color: var(--mb-text, #172b4d);
  background: #ffffff;
  box-shadow: inset 0 0 0 2px var(--mb-blue, #0c66e4);
  font: inherit;
  font-size: 16px;
  line-height: 20px;
}

.majom-boards-cardback__checkitem-title-input:focus {
  outline: none;
}

.majom-boards-cardback__checkitem-collapsed-composer {
  grid-column: 2;
  align-self: flex-start;
  justify-self: start;
  min-height: 40px;
  border-radius: 8px;
  color: var(--mb-muted, #44546f);
  background: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(9, 30, 66, 0.14);
}

.majom-boards-cardback__checkitem-composer {
  display: flex;
  grid-column: 2;
  flex-direction: column;
  gap: 8px;
}

.majom-boards-cardback__checkitem-composer-input {
  width: 100%;
  min-height: 40px;
  border: 0;
  border-radius: 8px;
  padding: 8px 12px;
  color: var(--mb-text, #172b4d);
  background: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(9, 30, 66, 0.34);
  font: inherit;
  min-width: 0;
  font-size: 16px;
  line-height: 20px;
}

.majom-boards-cardback__checkitem-composer-input:focus-visible {
  outline: 2px solid rgba(12, 102, 228, 0.36);
  outline-offset: 2px;
}

.majom-boards-cardback__checkitem-composer-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.majom-boards-cardback__checkitem-composer-primary-actions,
.majom-boards-cardback__checkitem-composer-meta-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.majom-boards-cardback__checkitem-meta-button {
  gap: 6px;
  color: var(--mb-muted, #44546f);
  background: transparent;
  box-shadow: none;
}

.majom-boards-cardback__description-editor {
  width: 100%;
  min-height: 180px;
  border: 0;
  border-radius: 8px;
  padding: 12px;
  resize: vertical;
  color: var(--mb-text, #172b4d);
  background: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(9, 30, 66, 0.14);
  font: inherit;
  font-size: 16px;
  line-height: 22px;
}

.majom-boards-cardback__placeholder-panel {
  border-radius: 8px;
  padding: 14px 16px;
  color: var(--mb-muted, #44546f);
  background: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(9, 30, 66, 0.08);
  font-size: 13px;
  line-height: 20px;
}

.majom-boards-cardback__editor-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}

.majom-boards-cardback__activity-input {
  width: 100%;
  min-height: 40px;
  justify-content: flex-start;
  color: var(--mb-muted, #44546f);
  background: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(9, 30, 66, 0.12);
}

.majom-boards-cardback__activity-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
}

.majom-boards-cardback__activity-item {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  gap: 10px;
  color: var(--mb-muted, #44546f);
  font-size: 13px;
  line-height: 20px;
}

.majom-boards-cardback__avatar {
  display: inline-flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  color: #ffffff;
  background: #44546f;
  font-size: 12px;
  font-weight: 700;
}

.majom-boards-cardback__description-editor:focus-visible {
  outline: 2px solid rgba(12, 102, 228, 0.36);
  outline-offset: 2px;
}

.majom-boards-quick-editor-overlay {
  position: fixed;
  inset: 0;
  z-index: 280;
  background: rgba(9, 30, 66, 0.52);
}

.majom-boards-quick-editor {
  position: fixed;
}

.majom-boards-quick-editor [role="dialog"] {
  position: relative;
  width: 256px;
}

.majom-boards-quick-editor__form {
  display: flex;
  width: 256px;
  flex-direction: column;
  gap: 8px;
}

.majom-boards-quick-editor__card {
  width: 256px;
  overflow: hidden;
  border-radius: 8px;
  background: #ffffff;
  box-shadow:
    0 8px 18px rgba(9, 30, 66, 0.22),
    0 1px 1px rgba(9, 30, 66, 0.2),
    0 0 0 1px rgba(9, 30, 66, 0.08);
}

.majom-boards-quick-editor__card--mirror {
  box-shadow:
    0 8px 18px rgba(9, 30, 66, 0.22),
    0 1px 1px rgba(9, 30, 66, 0.2),
    0 0 0 2px rgba(12, 102, 228, 0.46);
}

.majom-boards-quick-editor__card-inner {
  padding: 10px 12px;
}

.majom-boards-quick-editor__title {
  width: 100%;
  min-height: 56px;
  border: 0;
  border-radius: 6px;
  padding: 0;
  resize: vertical;
  color: var(--mb-text, #172b4d);
  background: transparent;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
}

.majom-boards-quick-editor__title:focus-visible {
  background: #ffffff;
  box-shadow: inset 0 0 0 2px rgba(12, 102, 228, 0.55);
  outline: none;
}

.majom-boards-quick-editor__save {
  width: fit-content;
  min-width: 64px;
  min-height: 32px;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 14px;
  line-height: 20px;
}

.majom-boards-quick-editor__actions {
  position: absolute;
  top: 0;
  left: calc(100% + 8px);
  max-height: calc(100vh - 24px);
  overflow-y: auto;
}

.majom-boards-quick-editor__buttons {
  display: flex;
  width: max-content;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.majom-boards-quick-editor__button {
  min-height: 32px;
  justify-content: flex-start;
  gap: 6px;
  border-radius: 4px;
  padding: 6px 10px;
  color: #292a2e;
  background: #f7f8f9;
  box-shadow:
    0 2px 6px rgba(9, 30, 66, 0.24),
    0 0 0 1px rgba(9, 30, 66, 0.12);
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
}

.majom-boards-quick-editor__button:hover:not(:disabled) {
  color: #172b4d;
  background: #ffffff;
}

.majom-boards-quick-editor__button:disabled {
  color: #292a2e;
  opacity: 1;
}

.majom-boards-quick-editor__danger-item {
  margin-top: 4px;
}

.majom-boards-quick-editor__button--danger {
  color: #ae2e24;
  background: #fff7f6;
  box-shadow:
    0 2px 6px rgba(9, 30, 66, 0.18),
    0 0 0 1px rgba(174, 46, 36, 0.18);
}

.majom-boards-quick-editor__button--danger:hover:not(:disabled) {
  color: #5d1f1a;
  background: #ffeceb;
}

.majom-boards-quick-editor__new-badge {
  margin-left: 6px;
  border-radius: 4px;
  padding: 1px 5px;
  color: #5d1f80;
  background: #e9d1ff;
  font-size: 11px;
  font-weight: 800;
  line-height: 14px;
}

@media (max-width: 640px) {
  .majom-boards-import__layout {
    min-height: 0;
    grid-template-columns: minmax(0, 1fr);
  }

  .majom-boards-import__source {
    min-height: 260px;
  }

  .majom-boards-export__content {
    min-height: 0;
  }

  .majom-boards-export__output {
    min-height: 300px;
  }

  .majom-boards-import__item {
    grid-template-columns: minmax(0, 1fr);
    gap: 6px;
  }

  .majom-boards-quick-editor [role="dialog"] {
    width: min(256px, calc(100vw - 24px));
  }

  .majom-boards-quick-editor__form,
  .majom-boards-quick-editor__card {
    width: 100%;
  }

  .majom-boards-quick-editor__actions {
    top: calc(100% + 8px);
    left: 0;
    max-height: calc(100vh - 220px);
  }
}

@media (min-width: 768px) {
  .majom-boards__header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .majom-boards__title-block {
    flex-direction: row;
    align-items: center;
    gap: 12px;
  }

  .majom-boards__header-actions {
    flex-direction: row;
    align-items: center;
    flex-wrap: nowrap;
  }

  .majom-boards__input,
  .majom-boards__textarea,
  .majom-boards__card-composer-textarea,
  .majom-boards__list-composer-textarea,
  .majom-boards-modal__title-input,
  .majom-boards-modal__description,
  .majom-boards-import__source,
  .majom-boards-import__select,
  .majom-boards-export__output {
    font-size: 14px;
  }

  .majom-boards-cardback__layout {
    grid-template-columns: minmax(0, 1fr) 320px;
  }

  .majom-boards-cardback__main {
    padding: 8px 20px 24px;
  }

  .majom-boards-cardback__aside {
    display: block;
  }

  .majom-boards-cardback__title-editor,
  .majom-boards-cardback__description-editor {
    font-size: 14px;
  }

  .majom-boards-cardback__title-editor {
    font-size: 24px;
  }
}
`;function Qa(){if(typeof document>"u"||document.getElementById(ue))return;const i=document.createElement("style");i.id=ue,i.textContent=Ua,document.head.appendChild(i)}const Ya=1,Xa=16384,Bt=[p.boardPickerCoverA,p.boardPickerCoverB,p.boardPickerCoverC,p.boardPickerCoverD,p.boardPickerCoverE,p.boardPickerCoverF],Va={starred:!1,yourBoards:!1},Ja={formWidth:256,actionsWidth:220,actionsGap:8,viewportMargin:12,minVisibleHeight:220},Za={board:"boards.import.entity.board",column:"boards.import.entity.column",card:"boards.import.entity.card",checklist:"boards.import.entity.checklist",checkItem:"boards.import.entity.checkItem"},to={create:"boards.import.group.create",update:"boards.import.group.update",skip:"boards.import.group.skip",conflict:"boards.import.group.conflict"};function dt(i){return i.mirror_source!=null}function kt(i){return i.completedAt!=null}function Y(i,t){const e=i.textContent??"";i.textContent="";const a=q(t,{size:16,strokeWidth:2});a.setAttribute("aria-hidden","true");const o=document.createElement("span");o.textContent=e,i.append(a,o)}function eo(i,t,e){const a=i.getButtonElement();a.className=p.headerMenuButton;const o=q(t,{size:16,strokeWidth:2});o.setAttribute("aria-hidden","true"),a.replaceChildren(o),a.title=e,a.setAttribute("aria-label",e)}function ao(i,t){const e=i.getButtonElement();e.classList.remove("!bg-slate-100","!text-slate-800"),e.dataset.boardsHeaderMenuOpen=t?"true":"false"}function oo(i){var a;const t=i,e=t.commentsCount??t.commentCount??t.comments_count??((a=t.comments)==null?void 0:a.length)??0;return Number.isFinite(e)&&e>0?e:0}function _t(i){return{id:i.id,title:i.title,color:i.color}}function ro(i){const t=Array.from(i.id).reduce((e,a)=>e+a.charCodeAt(0),0);return Bt[t%Bt.length]??Bt[0]}function io(i){return i.title.trim().charAt(0)||"?"}function no(i){const t=i.trim().replace(/^#/,"");if(!/^[0-9a-f]{6}$/i.test(t))return"#172b4d";const e=parseInt(t.slice(0,2),16),a=parseInt(t.slice(2,4),16),o=parseInt(t.slice(4,6),16);return(.299*e+.587*a+.114*o)/255>.58?"#172b4d":"#ffffff"}function so(i){const t=i.checklist_summary,e=Number((t==null?void 0:t.total)??0),a=Number((t==null?void 0:t.completed)??0);return{total:Number.isFinite(e)?e:0,completed:Number.isFinite(a)?a:0}}function $t(i){return i.entity_links??[]}function co(i){return $t(i).reduce((t,e)=>(t[e.entity_type]+=1,t),{task:0,story:0,goal:0})}function Lt(i){return i==="task"?"check-box":i==="story"?"bookmark":"goal-circle"}function xt(i){return i==="task"?"boards.cardLinks.task":i==="story"?"boards.cardLinks.story":"boards.cardLinks.goal"}function at(i){var t,e;return((e=(t=i.entity)==null?void 0:t.title)==null?void 0:e.trim())||i.entity_id}class lo{constructor(t,e){this.root=t,this.state=null,this.columnTitleTextarea=null,this.expandedCardComposerColumnId=null,this.isColumnComposerExpanded=!1,this.editingBoardTitleId=null,this.boardTitleEditInput=null,this.editingColumnTitleId=null,this.columnTitleEditInput=null,this.headerMenu=null,this.boardPickerPopover=null,this.importPreviewOverlay=null,this.exportOutputOverlay=null,this.quickEditorOverlay=null,this.activeCardPlacementId=null,this.cardModalOverlay=null,this.moveCardPopover=null,this.listActionsPopover=null,this.cardActionsPopover=null,this.cardLabelsPopover=null,this.cardChecklistPopover=null,this.cardCheckItemMenuPopover=null,this.cardEntityLinkMenuPopover=null,this.cardModalDraftTagIds=null,this.cardModalRequestedTagIds=null,this.cardModalLabelsHost=null,this.cardModalQuickActionList=null,this.cardModalChecklistHost=null,this.cardChecklistPanelState=null,this.cardChecklistLoadVersion=0,this.hiddenCheckedChecklistIds=new Set,this.expandedCheckItemComposerIds=new Set,this.tagItems=[],this.tagCatalogStatus="idle",this.lastNotifiedErrorKey=null,this.cardDrafts=new Map,Qa(),this.runtime=e.runtime??zt(),this.tagCatalog=e.tagCatalog??null,this.entityCatalog=e.entityCatalog??null,this.handlers=e.handlers,this.dragController=new Wa({root:this.root,getState:()=>this.state,onDrop:(a,o)=>this.handlers.onPatchCardPlacement(a,o),onDragStart:()=>this.closeTransientBoardOverlays()}),this.columnDragController=new Ra({root:this.root,getState:()=>this.state,onDrop:(a,o)=>this.handlers.onPatchColumn(a,o),onDragStart:()=>this.closeTransientBoardOverlays()}),this.dragController.mount(),this.columnDragController.mount(),this.disposeRuntimeSubscription=this.runtime.subscribe(()=>this.refreshFromRuntime(),{emitCurrent:!1}),this.root.className=p.root}render(t){const e=this.boardPickerPopover?{...this.boardPickerPopover.viewState,collapsedSections:{...this.boardPickerPopover.viewState.collapsedSections}}:null;this.state=t,this.notifyStateError(t.error),this.ensureTagCatalogLoaded(),this.dragController.cancelDrag(),this.columnDragController.cancelDrag(),this.cardDrafts.clear(),this.unmountHeaderMenu(),this.closeBoardPickerPopover(),this.closeListActionsPopover(),this.closeCardActionsPopover(),this.closeMoveCardPopover(),this.closeCardChecklistPopover(),this.closeCardCheckItemMenuPopover(),this.closeCardEntityLinkMenuPopover(),this.closeQuickCardEditor(),this.root.replaceChildren(this.renderShell(t)),this.syncCardModal(t),e&&requestAnimationFrame(()=>{const a=this.root.querySelector('[data-testid="board-picker-button"]');a&&!a.disabled&&this.openBoardPickerPopover(a,t,e)})}destroy(){this.disposeRuntimeSubscription(),this.dragController.unmount(),this.columnDragController.unmount(),this.unmountHeaderMenu(),this.closeBoardPickerPopover(),this.closeCardLabelsPopover(),this.closeCardChecklistPopover(),this.closeCardCheckItemMenuPopover(),this.closeCardEntityLinkMenuPopover(),this.closeListActionsPopover(),this.closeCardActionsPopover(),this.closeMoveCardPopover(),this.closeQuickCardEditor(),this.closeImportPreviewModal(),this.closeExportOutputModal(),this.closeCardModal(),this.cardDrafts.clear(),this.root.replaceChildren()}notifyStateError(t){if(!t){this.lastNotifiedErrorKey=null;return}t!==this.lastNotifiedErrorKey&&(this.lastNotifiedErrorKey=t,V(this.runtime.i18n.t(t),"error"))}refreshFromRuntime(){this.state&&this.render(this.state)}closeTransientBoardOverlays(){this.closeBoardPickerPopover(),this.closeListActionsPopover(),this.closeCardActionsPopover(),this.closeCardLabelsPopover(),this.closeCardChecklistPopover(),this.closeCardCheckItemMenuPopover(),this.closeCardEntityLinkMenuPopover(),this.closeMoveCardPopover(),this.closeQuickCardEditor()}ensureTagCatalogLoaded(){!this.tagCatalog||this.tagCatalogStatus!=="idle"||(this.tagCatalogStatus="loading",this.tagCatalog.loadTags().then(t=>{this.tagItems=t.map(_t),this.tagCatalogStatus="ready",this.rerenderCurrentState()}).catch(()=>{this.tagItems=[],this.tagCatalogStatus="error",this.rerenderCurrentState()}))}getTagPickerErrorMessage(){return this.tagCatalogStatus==="error"?this.runtime.i18n.t("boards.cardBack.tagsLoadFailed"):null}renderShell(t){const e=document.createElement("section");if(e.className=p.shell,e.append(this.renderHeader(t)),t.status==="loading"&&t.boards.length===0)return e.append(this.renderMessage(this.runtime.i18n.t("boards.loading"))),e;if(t.boards.length===0)return e.append(this.renderEmptyState()),e;const a=this.getSelectedBoard(t);return e.append(a?this.renderBoard(a,t):this.renderMessage(this.runtime.i18n.t("boards.empty"))),e}renderHeader(t){const e=document.createElement("header");e.className=p.header;const a=this.getSelectedBoard(t),o=document.createElement("div");o.className=p.titleBlock;const r=document.createElement("div");r.className=p.titleRow,r.append(this.renderBoardTitle(a,t)),t.boards.length>0&&r.append(this.renderBoardPickerButton(a,t)),o.append(r);const n=document.createElement("div");return n.className=p.headerActions,n.append(this.renderHeaderMenu(a,t)),e.append(o,n),e}renderBoardTitle(t,e){const a=document.createElement("h1");if(a.className=p.title,!t||this.editingBoardTitleId!==t.id){const o=document.createElement("button");return o.type="button",o.className=p.titleButton,o.textContent=(t==null?void 0:t.title)??this.runtime.i18n.t("boards.title"),o.disabled=!t||e.status==="saving",o.title=this.runtime.i18n.t("boards.actions.renameBoard"),o.setAttribute("aria-label",this.runtime.i18n.t("boards.actions.renameBoard")),o.addEventListener("click",()=>{t&&this.startBoardTitleEdit(t.id)}),a.append(o),a}return this.boardTitleEditInput=tt({variant:"inline",type:"text",value:t.title,autoComplete:"off",maxLength:512,className:p.titleEditInput,onKeyDown:o=>{if(o.key==="Enter"){o.preventDefault(),this.finishBoardTitleEdit(t,!0);return}o.key==="Escape"&&(o.preventDefault(),this.finishBoardTitleEdit(t,!1))}}),this.boardTitleEditInput.setAttribute("aria-label",this.runtime.i18n.t("boards.boardTitlePlaceholder")),this.boardTitleEditInput.addEventListener("blur",()=>{this.finishBoardTitleEdit(t,!0)}),a.append(this.boardTitleEditInput),requestAnimationFrame(()=>{var o,r;(o=this.boardTitleEditInput)==null||o.focus(),(r=this.boardTitleEditInput)==null||r.select()}),a}renderBoardPickerButton(t,e){const a=this.runtime.i18n.t("boards.boardPicker.open"),o=z({icon:"kanban",tone:"text",size:"sm",className:p.boardPickerButton,title:a,ariaLabel:a,disabled:!t||e.status==="saving"}),r=document.createElement("span");r.className=p.boardPickerButtonContent;const n=q("kanban",{size:16,strokeWidth:2});n.setAttribute("aria-hidden","true");const s=q("chevron-down",{size:14,strokeWidth:2});return s.setAttribute("aria-hidden","true"),r.append(n,s),we(o,r),o.setAttribute("aria-haspopup","dialog"),o.setAttribute("aria-expanded","false"),o.setAttribute("data-testid","board-picker-button"),o.addEventListener("click",c=>{var d;if(c.stopPropagation(),((d=this.boardPickerPopover)==null?void 0:d.trigger)===o){this.closeBoardPickerPopover();return}this.openBoardPickerPopover(o,e)}),o}openBoardPickerPopover(t,e,a){this.closeTransientBoardOverlays();const o=a?{query:a.query,activeFilter:a.activeFilter,collapsedSections:{...a.collapsedSections}}:{query:"",activeFilter:"all",collapsedSections:{...Va}},r=this.getSelectedBoard(e),n=G({elevated:!0,className:`${p.boardPickerPopover} hidden`});n.setAttribute("data-testid","board-picker-popover");const s=document.createElement("div");s.className=p.boardPickerSearchWrap;const c=q("magnifying-glass",{size:18,strokeWidth:2});c.setAttribute("aria-hidden","true"),c.classList.add(p.boardPickerSearchIcon);const d=tt({type:"search",autoComplete:"off",placeholder:this.runtime.i18n.t("boards.boardPicker.searchPlaceholder"),className:p.boardPickerSearchInput,onInput:g=>{o.query=g.trim().toLowerCase(),h()},onKeyDown:g=>{g.key==="Escape"&&(g.preventDefault(),this.closeBoardPickerPopover())}});d.setAttribute("aria-label",this.runtime.i18n.t("boards.boardPicker.searchLabel")),d.value=o.query,s.append(c,d);const m=document.createElement("div");m.className=p.boardPickerChips;const u=()=>{m.replaceChildren(...this.getBoardPickerFilterOptions().map(g=>this.renderBoardPickerChip({label:g.label,selected:o.activeFilter===g.value,onClick:()=>{o.activeFilter=g.value,u(),h(),d.focus()}})))},b=document.createElement("div");b.className=p.boardPickerSections;const h=()=>{b.replaceChildren();const g=this.getBoardPickerVisibleBoards(e.boards,o.activeFilter,o.query),x=this.getBoardPickerGroupedBoards(g);if(o.activeFilter==="all"){const v=g.filter(vt);v.length>0&&b.append(this.renderBoardPickerSection({id:"starred",label:this.runtime.i18n.t("boards.boardPicker.starred"),boards:v,selectedBoardId:r==null?void 0:r.id,viewState:o,allowEmpty:!1,onToggle:h}))}x.groups.forEach(v=>{b.append(this.renderBoardPickerSection({id:`group:${v.id}`,label:v.name,boards:v.boards,allBoards:e.boards,selectedBoardId:r==null?void 0:r.id,viewState:o,allowEmpty:!1,onToggle:h}))}),(x.ungrouped.length>0||x.groups.length===0||g.length===0)&&b.append(this.renderBoardPickerSection({id:"yourBoards",label:this.runtime.i18n.t("boards.boardPicker.yourBoards"),boards:x.groups.length>0?x.ungrouped:g,allBoards:e.boards,selectedBoardId:r==null?void 0:r.id,viewState:o,allowEmpty:!0,showCreateBoardCard:o.activeFilter==="all",onToggle:h}))};n.append(s,m,b);const f=new U({container:t,panel:n,positioning:"viewport",panelZIndex:290,onOpenChange:g=>{var x;t.setAttribute("aria-expanded",g?"true":"false"),!g&&((x=this.boardPickerPopover)==null?void 0:x.menu)===f&&this.closeBoardPickerPopover()}});f.mount(),this.boardPickerPopover={menu:f,panel:n,trigger:t,viewState:o,actionsMenu:null},u(),h(),f.openAt({anchor:t,placement:"bottom-start",fallbackPlacements:["bottom-end","top-start","top-end"],gap:8,margin:12,lockPlacementAfterOpen:!0}),requestAnimationFrame(()=>d.focus())}getBoardPickerFilterOptions(){return[{value:"all",label:this.runtime.i18n.t("boards.boardPicker.all")},{value:"starred",label:this.runtime.i18n.t("boards.boardPicker.starred")},{value:"recent",label:this.runtime.i18n.t("boards.boardPicker.recent")}]}getBoardPickerVisibleBoards(t,e,a){const o=a.trim().toLowerCase(),r=t.filter(n=>o&&!n.title.toLowerCase().includes(o)?!1:e==="starred"?vt(n):e==="recent"?Pt(n)!==null:!0);return e!=="recent"?r:[...r].sort((n,s)=>(Pt(s)??0)-(Pt(n)??0))}getBoardPickerGroupedBoards(t){const e=new Map,a=[];return t.forEach(o=>{const r=Nt(o);if(!r){a.push(o);return}const n=e.get(r.id);if(n){n.boards.push(o);return}e.set(r.id,{...r,boards:[o]})}),{groups:Array.from(e.values()).sort((o,r)=>o.name.localeCompare(r.name)),ungrouped:a}}renderBoardPickerChip(t){const e=document.createElement("button");return e.type="button",e.className=t.selected?p.boardPickerChipSelected:p.boardPickerChip,e.textContent=t.label,e.addEventListener("click",t.onClick),e}renderBoardPickerSection(t){const e=t.viewState.collapsedSections[t.id],a=document.createElement("section");a.className=p.boardPickerSection,a.dataset.boardPickerSection=t.id;const o=document.createElement("h2");o.className=p.boardPickerSectionTitle;const r=document.createElement("button");r.type="button",r.className=p.boardPickerSectionToggle,r.setAttribute("aria-expanded",e?"false":"true");const n=q("chevron-down",{size:16,strokeWidth:2});n.setAttribute("aria-hidden","true"),n.classList.toggle(p.boardPickerSectionIconCollapsed,e);const s=document.createElement("span");s.textContent=t.label,r.append(n,s),r.addEventListener("click",()=>{t.viewState.collapsedSections[t.id]=!e,t.onToggle()}),o.append(r);const c=document.createElement("div");if(c.className=p.boardPickerGrid,c.hidden=e,t.boards.length===0&&t.allowEmpty){const d=document.createElement("p");d.className=p.boardPickerEmpty,d.textContent=this.runtime.i18n.t("boards.boardPicker.noResults"),c.append(d)}else t.boards.forEach(d=>{c.append(this.renderBoardPickerCard(d,t.selectedBoardId,t.allBoards))});return t.showCreateBoardCard&&c.append(this.renderBoardPickerCreateCard()),a.append(o,c),a}renderBoardPickerCreateCard(){const t=document.createElement("button");return t.type="button",t.className=p.boardPickerCreateCard,t.textContent=this.runtime.i18n.t("boards.boardPicker.createBoard"),t.addEventListener("click",()=>{this.closeBoardPickerPopover(),this.handlers.onCreateBoard(this.runtime.i18n.t("boards.defaultBoardTitle"))}),t}renderBoardPickerCard(t,e,a){const o=t.id===e,r=vt(t),n=document.createElement("div");n.className=o?p.boardPickerCardSelected:p.boardPickerCard;const s=document.createElement("button");s.type="button",s.className=p.boardPickerCardButton,s.setAttribute("aria-label",t.title),s.setAttribute("aria-current",o?"true":"false"),s.dataset.boardPickerBoardId=t.id,s.addEventListener("click",()=>{this.closeBoardPickerPopover(),this.handlers.onSelectBoard(t.id)});const c=document.createElement("div");c.className=`${p.boardPickerCover} ${ro(t)}`.trim();const d=document.createElement("span");d.className=p.boardPickerCoverInitial,d.textContent=io(t),c.append(d);const m=document.createElement("span");m.className=p.boardPickerCardTitle,m.textContent=t.title,s.append(c,m);const u=z({icon:r?"star-solid":"star",tone:"text",size:"sm",className:r?p.boardPickerStarButtonActive:p.boardPickerStarButton,title:this.runtime.i18n.t(r?"boards.boardPicker.unstar":"boards.boardPicker.star"),ariaLabel:this.runtime.i18n.t(r?"boards.boardPicker.unstar":"boards.boardPicker.star"),onClick:h=>{h.stopPropagation(),this.handlers.onToggleBoardStar(t.id)}});u.setAttribute("aria-pressed",r?"true":"false");const b=z({icon:"ellipsis-horizontal",tone:"text",size:"sm",className:p.boardPickerActionsButton,title:this.runtime.i18n.t("boards.boardPicker.actions"),ariaLabel:this.runtime.i18n.t("boards.boardPicker.actions"),onClick:h=>{h.stopPropagation(),this.openBoardPickerActionsMenu(t,a,b)}});return n.append(s,u,b),n}openBoardPickerActionsMenu(t,e,a){var s;const o=this.boardPickerPopover;if(!o)return;if(((s=o.actionsMenu)==null?void 0:s.boardId)===t.id){this.closeBoardPickerActionsMenu();return}this.closeBoardPickerActionsMenu();const r=G({elevated:!0,className:`${p.boardPickerActionsMenu} hidden`});r.addEventListener("mousedown",c=>c.stopPropagation());const n=new U({container:a,panel:r,positioning:"viewport",panelZIndex:310,onOpenChange:c=>{var d,m;!c&&((m=(d=this.boardPickerPopover)==null?void 0:d.actionsMenu)==null?void 0:m.menu)===n&&this.closeBoardPickerActionsMenu()}});o.panel.append(r),n.mount(),o.actionsMenu={menu:n,panel:r,boardId:t.id},this.renderBoardPickerActionsMenu(t,e),n.openAt({anchor:a,placement:"right-start",fallbackPlacements:["left-start","bottom-end","top-end"],gap:4,margin:8,lockPlacementAfterOpen:!0})}renderBoardPickerActionsMenu(t,e,a="menu"){var n;const o=(n=this.boardPickerPopover)==null?void 0:n.actionsMenu;if(!o)return;if(o.panel.replaceChildren(),a==="createGroup"){o.panel.append(this.renderBoardPickerCreateGroupInput(t,e));return}const r=Nt(t);Dt(e).filter(s=>s.id!==(r==null?void 0:r.id)).forEach(s=>{o.panel.append(wt({label:this.runtime.i18n.t("boards.boardPicker.moveToGroup",{group:s.name}),onClick:c=>{c.stopPropagation(),this.handlers.onUpdateBoardGroup(t.id,s),this.closeBoardPickerActionsMenu()}}))}),r&&o.panel.append(wt({label:this.runtime.i18n.t("boards.boardPicker.removeFromGroup"),onClick:s=>{s.stopPropagation(),this.handlers.onUpdateBoardGroup(t.id,null),this.closeBoardPickerActionsMenu()}})),o.panel.childElementCount>0&&o.panel.append(je({tone:"soft"})),o.panel.append(wt({label:this.runtime.i18n.t("boards.boardPicker.createGroup"),onClick:s=>{s.stopPropagation(),this.renderBoardPickerActionsMenu(t,e,"createGroup")}}))}renderBoardPickerCreateGroupInput(t,e){const a=document.createElement("div");a.className=p.boardPickerActionsInputRow;const o=tt({variant:"inline",value:"",type:"text",className:p.boardPickerActionsInput});o.placeholder=this.runtime.i18n.t("boards.boardPicker.newGroupPlaceholder");let r=!1;const n=s=>{if(r)return;r=!0;const c=s?o.value.trim():"";if(!c){this.renderBoardPickerActionsMenu(t,e);return}const m=Dt(e).find(u=>u.name.toLowerCase()===c.toLowerCase())??{id:Qe(c,e),name:c};this.handlers.onUpdateBoardGroup(t.id,m),this.closeBoardPickerActionsMenu()};return o.addEventListener("blur",()=>n(!0)),o.addEventListener("keydown",s=>{s.key==="Enter"?(s.preventDefault(),n(!0)):s.key==="Escape"&&(s.preventDefault(),n(!1))}),a.append(o),requestAnimationFrame(()=>o.focus()),a}renderHeaderMenu(t,e){let a;return a=new Pe({label:this.runtime.i18n.t("boards.actions.menu"),ariaLabel:this.runtime.i18n.t("boards.actions.menu"),title:this.runtime.i18n.t("boards.actions.menu"),variant:"plain",size:"md",buttonClassName:p.headerMenuButton,placement:"bottom-end",fallbackPlacements:["bottom-start","top-end","top-start"],onOpenChange:o=>ao(a,o),items:[{id:"create-board",label:this.runtime.i18n.t("boards.actions.createBoard"),disabled:e.status==="saving",onSelect:()=>{this.handlers.onCreateBoard(this.runtime.i18n.t("boards.defaultBoardTitle"))}},{id:"import-board",label:this.runtime.i18n.t("boards.import.actions.importBoard"),disabled:!t||e.status==="saving",onSelect:()=>{this.openImportPreviewModal({scope:"board",titleKey:"boards.import.title.board"})}},{id:"export-board-markdown",label:this.runtime.i18n.t("boards.export.actions.boardMarkdown"),disabled:!t,onSelect:()=>{t&&this.openExportOutputModal({titleKey:"boards.export.title.board",request:{scope:"board",format:"markdown",boardId:t.id}})}},{id:"export-board-json",label:this.runtime.i18n.t("boards.export.actions.boardJson"),disabled:!t,onSelect:()=>{t&&this.openExportOutputModal({titleKey:"boards.export.title.board",request:{scope:"board",format:"json",boardId:t.id}})}},{id:"delete-board",label:this.runtime.i18n.t("boards.actions.deleteBoard"),disabled:!t||e.status==="saving",onSelect:()=>{t&&this.handlers.onDeleteBoard(t.id)}}]}),eo(a,"ellipsis-horizontal",this.runtime.i18n.t("boards.actions.menu")),this.headerMenu=a,a.mount(),a.element}renderBoard(t,e){const a=document.createElement("div");a.className=p.body;const o=document.createElement("div");return o.className=p.canvas,o.setAttribute("aria-label",t.title),o.dataset.boardCanvas="true",t.columns.forEach(r=>{o.append(this.renderColumn(t,r,e))}),o.append(this.renderColumnComposer(t,e)),a.append(o),a}renderColumn(t,e,a){const o=document.createElement("section");o.className=p.column,o.dataset.boardColumnId=String(e.id),o.dataset.boardColumnDraggable="true";const r=document.createElement("header");r.className=p.columnHeader,r.append(this.renderColumnTitle(e,a));const n=z({icon:"ellipsis-horizontal",tone:"text",size:"sm",className:`${p.iconButton} ${p.columnMenuButton}`,title:this.runtime.i18n.t("boards.listActions.title"),ariaLabel:this.runtime.i18n.t("boards.listActions.title"),disabled:a.status==="saving"});n.setAttribute("aria-haspopup","dialog"),n.setAttribute("aria-expanded","false"),n.setAttribute("data-testid","list-actions-menu-button"),n.dataset.boardDragIgnore="true",n.addEventListener("click",c=>{var d;if(c.stopPropagation(),((d=this.listActionsPopover)==null?void 0:d.trigger)===n){this.closeListActionsPopover();return}this.openListActionsPopover(n,t,e)}),r.append(n);const s=document.createElement("div");return s.className=p.cards,s.dataset.boardCardsContainer="true",e.cards.forEach(c=>s.append(this.renderCard(c))),o.append(r,s,this.renderCardComposer(e,a)),o}renderColumnTitle(t,e){if(this.editingColumnTitleId===t.id)return this.columnTitleEditInput=document.createElement("input"),this.columnTitleEditInput.className=p.columnTitleInput,this.columnTitleEditInput.type="text",this.columnTitleEditInput.value=t.title,this.columnTitleEditInput.maxLength=512,this.columnTitleEditInput.autocomplete="off",this.columnTitleEditInput.setAttribute("aria-label",this.runtime.i18n.t("boards.columnTitlePlaceholder")),this.columnTitleEditInput.addEventListener("keydown",r=>{if(r.key==="Enter"){r.preventDefault(),this.finishColumnTitleEdit(t,!0);return}r.key==="Escape"&&(r.preventDefault(),this.finishColumnTitleEdit(t,!1))}),this.columnTitleEditInput.addEventListener("blur",()=>{this.finishColumnTitleEdit(t,!0)}),requestAnimationFrame(()=>{var r,n;(r=this.columnTitleEditInput)==null||r.focus(),(n=this.columnTitleEditInput)==null||n.select()}),this.columnTitleEditInput;const a=document.createElement("button");a.type="button",a.className=p.columnTitleButton,a.disabled=e.status==="saving",a.title=this.runtime.i18n.t("boards.actions.renameColumn"),a.setAttribute("aria-label",this.runtime.i18n.t("boards.actions.renameColumn")),a.addEventListener("click",()=>this.startColumnTitleEdit(t.id));const o=document.createElement("span");return o.className=p.columnTitle,o.textContent=t.title,a.append(o),a}openListActionsPopover(t,e,a){this.closeListActionsPopover();const o=G({elevated:!0,className:`${l.listActionsPopover} hidden`});o.setAttribute("role","dialog"),o.setAttribute("aria-modal","false"),o.setAttribute("aria-labelledby","list-actions-menu"),o.setAttribute("data-testid","list-actions-popover"),o.addEventListener("mousedown",m=>m.stopPropagation());const r=document.createElement("header");r.className=l.listActionsHeader;const n=document.createElement("h2");n.id="list-actions-menu",n.className=l.listActionsTitle,n.textContent=this.runtime.i18n.t("boards.listActions.title");const s=z({icon:"x-mark",tone:"text",size:"sm",className:l.iconButton,ariaLabel:this.runtime.i18n.t("common.close"),title:this.runtime.i18n.t("common.close"),onClick:()=>this.closeListActionsPopover()});r.append(n,s);const c=document.createElement("div");c.className=l.listActionsBody,c.append(this.renderListActionList([this.createListActionButton({labelKey:"boards.listActions.addCard",testId:"list-actions-add-card-button",onClick:()=>{this.closeListActionsPopover(),this.expandCardComposer(a.id)}}),this.createListActionButton({labelKey:"boards.import.actions.importColumn",testId:"list-actions-import-column-button",onClick:()=>{this.closeListActionsPopover(),this.openImportPreviewModal({scope:"column",titleKey:"boards.import.title.column",target:{boardId:e.id,columnId:a.id}})}}),this.createListActionButton({labelKey:"boards.export.actions.columnMarkdown",testId:"list-actions-export-column-markdown-button",onClick:()=>{this.closeListActionsPopover(),this.openExportOutputModal({titleKey:"boards.export.title.column",request:{scope:"column",format:"markdown",columnId:a.id}})}}),this.createListActionButton({labelKey:"boards.export.actions.columnJson",testId:"list-actions-export-column-json-button",onClick:()=>{this.closeListActionsPopover(),this.openExportOutputModal({titleKey:"boards.export.title.column",request:{scope:"column",format:"json",columnId:a.id}})}}),this.createListActionButton({labelKey:"boards.listActions.copyList",testId:"list-actions-copy-list-button",disabled:!0}),this.createListActionButton({labelKey:"boards.listActions.moveList",testId:"list-actions-move-list-button",disabled:!0}),this.createListActionButton({labelKey:"boards.listActions.moveAllCards",testId:"list-actions-move-all-cards-button",disabled:!0}),this.createListActionButton({labelKey:"boards.listActions.sortBy",disabled:!0}),this.createListActionButton({labelKey:"boards.listActions.watch",testId:"list-actions-watch-list-button",disabled:!0})]),this.renderListActionsDivider(),this.renderListActionsColorSection(),this.renderListActionsDivider(),this.renderListActionList([this.createListActionButton({labelKey:"boards.listActions.archiveList",testId:"list-actions-archive-list-button",onClick:()=>{this.closeListActionsPopover(),this.handlers.onDeleteColumn(a.id)}}),this.createListActionButton({labelKey:"boards.listActions.deleteList",testId:"list-actions-delete-list-button",onClick:()=>{this.closeListActionsPopover(),this.handlers.onDeleteColumn(a.id)}}),this.createListActionButton({labelKey:"boards.listActions.archiveAllCards",disabled:!0})])),o.append(r,c);let d;d=new U({container:t,panel:o,positioning:"viewport",panelZIndex:290,onOpenChange:m=>{var u;t.setAttribute("aria-expanded",m?"true":"false"),!m&&((u=this.listActionsPopover)==null?void 0:u.menu)===d&&this.closeListActionsPopover()}}),d.mount(),this.listActionsPopover={menu:d,panel:o,trigger:t},d.openAt({anchor:t,placement:"bottom-end",fallbackPlacements:["bottom-start","top-end","top-start"],gap:8,margin:12,lockPlacementAfterOpen:!0})}renderListActionList(t){const e=document.createElement("ul");return e.className=l.listActionsList,t.forEach(a=>{const o=document.createElement("li");o.className=l.listActionsItem,o.append(a),e.append(o)}),e}createListActionButton(t){const e=C({text:this.runtime.i18n.t(t.labelKey),tone:"text",size:"md",className:l.listActionsButton,disabled:t.disabled,onClick:t.onClick});return t.testId&&e.setAttribute("data-testid",t.testId),e}renderListActionsDivider(){const t=document.createElement("div");return t.className=l.listActionsDivider,t.setAttribute("role","separator"),t}renderListActionsColorSection(){const t=document.createElement("section");t.className=l.listActionsSection;const e=C({text:this.runtime.i18n.t("boards.listActions.changeListColor"),tone:"text",size:"md",className:l.listActionsSectionButton,disabled:!0}),a=q("chevron-up",{size:16,strokeWidth:2});a.setAttribute("aria-hidden","true"),e.append(a);const o=document.createElement("div");o.className=l.listActionsUpgrade;const r=document.createElement("p");r.className=l.listActionsUpgradeTitle,r.textContent=this.runtime.i18n.t("boards.listActions.colorUpgradeTitle");const n=document.createElement("p");return n.className=l.listActionsUpgradeCopy,n.textContent=this.runtime.i18n.t("boards.listActions.colorUpgradeBody"),o.append(r,n),t.append(e,o),t}renderCard(t){const e=j(t),a=kt(t),o=document.createElement("article"),r=a?p.cardCompleted:p.card;o.className=dt(t)?`${r} ${p.cardMirror}`:r,o.dataset.boardCardId=String(t.id),o.dataset.boardCardPlacementId=String(e),o.dataset.boardCardDraggable="true",o.addEventListener("contextmenu",b=>{b.preventDefault(),b.stopPropagation(),this.openQuickCardEditor(e,o.getBoundingClientRect())});const n=document.createElement("button");n.type="button",n.className=p.cardOpenButton,n.dataset.boardCardOpen=String(e),n.setAttribute("aria-label",this.runtime.i18n.t("boards.actions.openCard")),n.addEventListener("click",()=>this.openCardModal(e));const s=document.createElement("h3");s.className=p.cardTitle,s.textContent=t.title;const c=this.createCardCompletionToggle(t,{className:a?p.cardCompleteToggleCompleted:p.cardCompleteToggle,testId:"board-card-completion-toggle"}),d=this.renderCardMirrorSourceLabel(t,p.cardSourceLabel),m=this.renderCardFrontTags(t);d&&n.append(d),m&&n.append(m),n.append(s);const u=this.renderCardFrontBadges(t);return u&&n.append(u),o.append(c,n),o}createCardCompletionToggle(t,e){const a=kt(t),o=this.runtime.i18n.t(a?"boards.cardBack.markIncomplete":"boards.cardBack.markComplete",{title:t.title}),r=this.runtime.i18n.t(a?"boards.cardBack.markIncompleteHint":"boards.cardBack.markCompleteHint"),n=document.createElement("button");n.type="button",n.className=e.className,n.title=r,n.dataset.testid=e.testId,n.dataset.boardDragIgnore="true",n.setAttribute("aria-label",o),n.setAttribute("aria-pressed",a?"true":"false");const s=document.createElement("span");return s.className="majom-boards__completion-mark",s.setAttribute("aria-hidden","true"),n.append(s),n.addEventListener("pointerdown",c=>{c.stopPropagation()}),n.addEventListener("click",c=>{c.preventDefault(),c.stopPropagation(),this.toggleCardCompletion(t)}),n}toggleCardCompletion(t){const e={completedAt:kt(t)?null:new Date};this.handlers.onPatchCard(t.id,e)}renderCardFrontTags(t){var a;if(!((a=t.tags)!=null&&a.length))return null;const e=document.createElement("div");return e.className=p.cardTags,e.setAttribute("data-testid","board-card-tags"),t.tags.forEach(o=>{e.append(this.createCardTagChip(o,p.cardTag))}),e}createCardTagChip(t,e){const a=document.createElement("span");return a.className=e,a.title=t.title,a.setAttribute("aria-label",t.title),a.setAttribute("role","img"),a.setAttribute("data-testid","compact-card-label"),a.style.backgroundColor=t.color,a}renderCardFrontBadges(t){const e=document.createElement("div");e.className=p.cardBadges,t.description.trim()&&e.append(this.createCardFrontBadge("bars-3-bottom-left",this.runtime.i18n.t("boards.cardDescriptionLabel"),void 0,"plain"));const a=oo(t);a>0&&e.append(this.createCardFrontBadge("chat-bubble-bottom-center-text",this.runtime.i18n.t("boards.cardBack.comments"),String(a),"neutral"));const o=so(t);o.total>0&&e.append(this.createCardFrontBadge("check-box",this.runtime.i18n.t("boards.cardBack.checklist"),`${o.completed}/${o.total}`,"neutral"));const r=co(t);return[{type:"goal",tone:"goal",labelKey:"boards.cardLinks.goalBadge"},{type:"story",tone:"story",labelKey:"boards.cardLinks.storyBadge"},{type:"task",tone:"task",labelKey:"boards.cardLinks.taskBadge"}].forEach(s=>{const c=r[s.type];c<=0||e.append(this.createCardFrontBadge(Lt(s.type),this.runtime.i18n.t(s.labelKey),String(c),s.tone))}),e.childElementCount>0?e:null}renderCardMirrorSourceLabel(t,e){if(!t.mirror_source)return null;const a=t.mirror_source,o=this.runtime.i18n.t("boards.cardMirror.sourceLocation",{board:a.board_title,list:a.column_title}),r=document.createElement("span");return r.className=e,r.setAttribute("data-testid","card-mirror-source-label"),r.textContent=o,r.title=this.runtime.i18n.t("boards.cardMirror.sourceLabel",{source:o}),r.setAttribute("aria-label",r.title),r}createCardFrontBadge(t,e,a,o="neutral"){const r=document.createElement("span"),n={plain:p.cardBadgePlain,neutral:p.cardBadgeNeutral,task:p.cardBadgeTask,story:p.cardBadgeStory,goal:p.cardBadgeGoal};r.className=n[o],r.title=e,r.setAttribute("aria-label",a?`${e}: ${a}`:e);const s=q(t,{size:16,strokeWidth:2});if(s.setAttribute("aria-hidden","true"),r.append(s),a){const c=document.createElement("span");c.textContent=a,r.append(c)}return r}renderCardComposer(t,e){return $e({expanded:this.expandedCardComposerColumnId===t.id,collapsedLabel:this.runtime.i18n.t("boards.actions.createCard"),submitLabel:this.runtime.i18n.t("boards.actions.createCard"),cancelLabel:this.runtime.i18n.t("boards.actions.cancelNewCard"),placeholder:this.runtime.i18n.t("boards.cardComposerPlaceholder"),ariaLabel:this.runtime.i18n.t("boards.cardTitleLabel"),classNames:{root:p.cardComposer,collapsedButton:p.cardComposerCollapsed,expandedForm:p.cardComposerExpanded,textarea:p.cardComposerTextarea,actions:p.composerActions,submitButton:p.primaryButton,cancelButton:p.composerCancelButton},disabled:e.status==="saving",rows:2,textareaTestId:"list-card-composer-textarea",focusOnRender:!0,dragIgnoreDatasetKey:"boardDragIgnore",onExpand:()=>this.expandCardComposer(t.id),onTextareaCreated:a=>this.cardDrafts.set(t.id,{title:a}),onSubmit:()=>this.submitCard(t.id),onCancel:()=>this.collapseCardComposer()}).element}renderColumnComposer(t,e){const a=document.createElement("aside");if(a.className=this.isColumnComposerExpanded?p.columnComposerExpandedPanel:p.columnComposerCollapsedPanel,a.dataset.boardColumnComposer="true",!this.isColumnComposerExpanded){const n=C({text:this.runtime.i18n.t("boards.addColumnPanelTitle"),tone:"text",size:"md",fullWidth:!0,className:p.columnComposerCollapsed,disabled:e.status==="saving",onClick:()=>this.expandColumnComposer()});return n.setAttribute("data-testid","list-composer-button"),n.setAttribute("data-drag-scroll-disabled","true"),Y(n,"plus"),a.append(n),a}const o=document.createElement("form");o.className=p.columnComposerExpanded,o.setAttribute("data-focus-lock-disabled","false"),o.addEventListener("submit",n=>{n.preventDefault(),this.submitColumnTitle(t.id)}),this.columnTitleTextarea=document.createElement("textarea"),this.columnTitleTextarea.className=p.listComposerTextarea,this.columnTitleTextarea.placeholder=this.runtime.i18n.t("boards.columnTitlePlaceholder"),this.columnTitleTextarea.name=this.runtime.i18n.t("boards.columnTitlePlaceholder"),this.columnTitleTextarea.dir="auto",this.columnTitleTextarea.rows=1,this.columnTitleTextarea.maxLength=512,this.columnTitleTextarea.spellcheck=!1,this.columnTitleTextarea.setAttribute("data-testid","list-name-textarea"),this.columnTitleTextarea.setAttribute("autocomplete","off"),this.columnTitleTextarea.setAttribute("aria-label",this.runtime.i18n.t("boards.columnTitlePlaceholder")),this.columnTitleTextarea.addEventListener("keydown",n=>{n.key!=="Enter"||n.shiftKey||(n.preventDefault(),this.submitColumnTitle(t.id))});const r=document.createElement("div");return r.className=p.composerActions,r.append(C({text:this.runtime.i18n.t("boards.actions.createColumn"),tone:"primary",size:"sm",type:"submit",className:p.primaryButton,disabled:e.status==="saving"}),z({icon:"x-mark",tone:"text",size:"md",type:"button",title:this.runtime.i18n.t("boards.actions.cancelNewColumn"),ariaLabel:this.runtime.i18n.t("boards.actions.cancelNewColumn"),className:p.composerCancelButton,onClick:()=>this.collapseColumnComposer()})),o.append(this.columnTitleTextarea,r),a.append(o),requestAnimationFrame(()=>{var n;return(n=this.columnTitleTextarea)==null?void 0:n.focus()}),a}renderEmptyState(){const t=document.createElement("div");t.className=p.empty;const e=document.createElement("div");e.className=p.emptyContent;const a=document.createElement("h2");a.className=p.emptyTitle,a.textContent=this.runtime.i18n.t("boards.emptyTitle");const o=document.createElement("p");return o.className=p.emptyCopy,o.textContent=this.runtime.i18n.t("boards.emptyBody"),e.append(a,o),t.append(e),t}renderMessage(t){const e=document.createElement("div");e.className=p.messageWrapper;const a=document.createElement("p");return a.className=p.messageLabel,a.textContent=t,e.append(a),e}openQuickCardEditor(t,e){if(!this.state)return;const a=this.findCardLocation(t,this.state);if(!a)return;this.closeQuickCardEditor();const o=document.createElement("div");o.className=l.quickEditorOverlay,o.addEventListener("pointerdown",n=>{n.target===o&&this.closeQuickCardEditor()}),o.addEventListener("keydown",n=>{n.key==="Escape"&&(n.preventDefault(),this.closeQuickCardEditor())});const r=this.renderQuickCardEditor(a);this.positionQuickCardEditor(r,e),o.append(r),document.body.append(o),this.quickEditorOverlay=o,requestAnimationFrame(()=>{var n;(n=r.querySelector('[data-testid="quick-card-editor-card-title"]'))==null||n.focus()})}renderQuickCardEditor(t){const{card:e}=t,a=document.createElement("div");a.className=l.quickEditor,a.setAttribute("data-elevation","1"),a.addEventListener("pointerdown",h=>h.stopPropagation());const o=document.createElement("div");o.setAttribute("role","dialog"),o.setAttribute("aria-modal","true"),o.setAttribute("aria-label",this.runtime.i18n.t("boards.quickEditor.menuLabel")),o.setAttribute("data-testid","quick-card-editor-menu");const r=document.createElement("form");r.className=l.quickEditorForm,r.addEventListener("submit",h=>{h.preventDefault(),this.saveQuickCardEditor(e,c)});const n=G({elevated:!0,className:dt(e)?`${l.quickEditorCard} ${l.quickEditorCardMirror}`:l.quickEditorCard});n.setAttribute("data-testid","quick-card-editor-card-front");const s=document.createElement("div");s.className=l.quickEditorCardInner;const c=document.createElement("textarea");c.className=l.quickEditorTitle,c.setAttribute("data-testid","quick-card-editor-card-title"),c.dir="auto",c.setAttribute("aria-label",this.runtime.i18n.t("boards.quickEditor.editCardName")),c.value=e.title,c.rows=2,c.addEventListener("keydown",h=>{h.key!=="Enter"||h.shiftKey||(h.preventDefault(),this.saveQuickCardEditor(e,c))});const d=this.renderCardFrontBadges(e),m=this.renderCardMirrorSourceLabel(e,p.cardSourceLabel);m&&s.append(m),s.append(c),d&&s.append(d),n.append(s);const u=C({text:this.runtime.i18n.t("common.save"),tone:"primary",size:"md",className:`${p.primaryButton} ${l.quickEditorSave}`,type:"submit"}),b=()=>{u.disabled=c.value.trim().length===0};return c.addEventListener("input",b),b(),r.append(n,u),o.append(r,this.renderQuickCardEditorActions(t)),a.append(o),a}renderQuickCardEditorActions(t){const{board:e,column:a,card:o,placementId:r}=t,n=document.createElement("div");n.className=l.quickEditorActions;const s=document.createElement("ul");return s.className=l.quickEditorButtons,s.setAttribute("data-testid","quick-card-editor-buttons"),[{testId:"quick-card-editor-open-card",labelKey:"boards.quickEditor.openCard",icon:"rectangle-stack",onClick:()=>{this.closeQuickCardEditor(),this.openCardModal(r)}},{testId:"quick-card-editor-edit-labels",labelKey:"boards.quickEditor.editLabels",icon:"tag",onClick:()=>{this.closeQuickCardEditor(),this.openCardModal(r)}},{testId:"quick-card-editor-move",labelKey:"boards.quickEditor.move",icon:"arrow-right",onClick:d=>{this.openMoveCardPopover(d.currentTarget,e,a,o,"move")}},{testId:"mirror-new-button",labelKey:"boards.quickEditor.mirror",icon:"rectangle-stack",onClick:d=>{this.openMoveCardPopover(d.currentTarget,e,a,o,"mirror")}},{testId:"quick-card-editor-archive",labelKey:dt(o)?"boards.quickEditor.removeFromBoard":"boards.quickEditor.archive",icon:"archive-box",onClick:()=>{this.closeQuickCardEditor(),this.archiveOrRemoveCard(o,r)}},{testId:"quick-card-editor-delete-card",labelKey:"boards.actions.deleteCard",icon:"trash",danger:!0,onClick:()=>void this.deleteSharedCardFromQuickEditor(o)}].forEach(d=>{const m=document.createElement("li");d.danger&&(m.className=l.quickEditorDangerItem);const u=C({text:this.runtime.i18n.t(d.labelKey),tone:d.danger?"danger":"text",size:"md",className:d.danger?`${l.quickEditorButton} ${l.quickEditorDangerButton}`:l.quickEditorButton,onClick:d.onClick});u.setAttribute("data-testid",d.testId),Y(u,d.icon),m.append(u),s.append(m)}),n.append(s),n}positionQuickCardEditor(t,e){const{formWidth:a,actionsWidth:o,actionsGap:r,viewportMargin:n,minVisibleHeight:s}=Ja,c=Math.min(Math.max(e.left,n),Math.max(n,window.innerWidth-a-o-r-n)),d=Math.min(Math.max(e.top,n),Math.max(n,window.innerHeight-s-n));t.style.left=`${c}px`,t.style.top=`${d}px`}saveQuickCardEditor(t,e){const a=e.value.trim();a&&(this.closeQuickCardEditor(),a!==t.title&&this.handlers.onPatchCard(t.id,{title:a}))}openCardModal(t){if(!this.state)return;const e=this.findCardLocation(t,this.state);e&&(this.activeCardPlacementId=t,this.cardModalDraftTagIds=et(e.card),this.cardModalRequestedTagIds=[...this.cardModalDraftTagIds],this.hiddenCheckedChecklistIds.clear(),this.expandedCheckItemComposerIds.clear(),this.cardChecklistPanelState={cardId:e.card.id,status:"idle",checklists:[],error:null},this.renderCardModal(e),this.loadCardModalChecklists(e.card.id))}syncCardModal(t){if(this.activeCardPlacementId===null)return;const e=this.findCardLocation(this.activeCardPlacementId,t);if(!e){this.closeCardModal();return}this.renderCardModal(e)}renderCardModal(t){var h;this.closeCardLabelsPopover(),this.closeCardChecklistPopover(),this.closeCardCheckItemMenuPopover(),this.closeCardEntityLinkMenuPopover(),this.closeMoveCardPopover(),(h=this.cardModalOverlay)==null||h.remove(),this.cardModalOverlay=null,this.cardModalLabelsHost=null,this.cardModalQuickActionList=null,this.cardModalChecklistHost=null;const{board:e,column:a,card:o}=t;this.cardModalDraftTagIds===null&&(this.cardModalDraftTagIds=et(o)),this.cardModalRequestedTagIds===null&&(this.cardModalRequestedTagIds=et(o));const{overlay:r,container:n,header:s,divider:c,body:d}=Ee(o.title,{onClose:()=>this.closeCardModal(),hideCloseButton:!0,intent:"form",presentation:"dialog",zIndex:270});s.classList.add(l.hiddenShellPart),c.classList.add(l.hiddenShellPart),n.classList.add(l.container),n.addEventListener("keydown",f=>{f.stopPropagation()}),d.className=l.body;const m=document.createElement("textarea");m.className=l.titleEditor,m.dataset.boardCardModalTitle="true",m.dir="auto",m.rows=Ya,m.maxLength=Xa,m.value=o.title,m.setAttribute("aria-label",o.title);const u=document.createElement("textarea");u.className=l.descriptionEditor,u.dataset.boardCardModalDescription="true",u.value=o.description,u.placeholder=this.runtime.i18n.t("boards.cardDescriptionPlaceholder"),u.setAttribute("aria-label",this.runtime.i18n.t("boards.cardDescriptionLabel"));const b=document.createElement("div");b.className=l.cardBack,b.append(this.renderCardBackTopbar(e,a,o),this.renderCardBackLayout(e,a,o,m,u)),d.append(b),n.setAttribute("aria-labelledby","card-back-name"),n.setAttribute("data-focus-lock","cardback"),this.cardModalOverlay=r}renderCardBackTopbar(t,e,a){const o=document.createElement("header");o.className=l.topbar;const r=document.createElement("div");r.className=l.topbarStart;const n=document.createElement("button");n.type="button",n.className=l.listBadge,n.setAttribute("data-testid","card-back-list-button"),n.title=e.title,n.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.changeList",{column:e.title})),n.setAttribute("aria-haspopup","dialog"),n.setAttribute("aria-expanded","false"),n.addEventListener("click",b=>{var h;if(b.stopPropagation(),((h=this.moveCardPopover)==null?void 0:h.trigger)===n){this.closeMoveCardPopover();return}this.openMoveCardPopover(n,t,e,a)});const s=document.createElement("span");s.textContent=e.title;const c=q("chevron-down",{size:14,strokeWidth:2});c.setAttribute("aria-hidden","true"),n.append(s,c),r.append(n);const d=this.renderCardMirrorSourceLabel(a,l.sourceLabel);d&&r.append(d);const m=document.createElement("div");m.className=l.topbarActions;const u=z({icon:"ellipsis-vertical",tone:"text",size:"md",className:l.iconButton,ariaLabel:this.runtime.i18n.t("boards.cardBack.actions"),title:this.runtime.i18n.t("boards.cardBack.actions")});return u.setAttribute("aria-haspopup","dialog"),u.setAttribute("aria-expanded","false"),u.setAttribute("data-testid","card-back-actions-button"),u.addEventListener("click",b=>{var h;if(b.stopPropagation(),((h=this.cardActionsPopover)==null?void 0:h.trigger)===u){this.closeCardActionsPopover();return}this.openCardActionsPopover(u,t,e,a)}),m.append(u,z({icon:"x-mark",tone:"text",size:"md",className:l.iconButton,ariaLabel:this.runtime.i18n.t("common.close"),title:this.runtime.i18n.t("common.close"),onClick:()=>this.closeCardModal()})),o.append(r,m),o}openCardActionsPopover(t,e,a,o){this.closeCardActionsPopover();const r=G({elevated:!0,className:`${l.cardActionsPopover} hidden`});r.setAttribute("role","dialog"),r.setAttribute("aria-modal","false"),r.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.actions")),r.setAttribute("data-testid","card-back-actions-popover"),r.addEventListener("mousedown",d=>d.stopPropagation());const n=document.createElement("div");n.className=l.cardActionsBody;const s=document.createElement("ul");s.className=l.cardActionsList,s.append(this.renderCardActionItem({testId:"card-back-move-card-button",labelKey:"boards.quickEditor.move",icon:"arrow-right",disabled:!0}),this.renderCardActionItem({testId:"card-back-copy-card-button",labelKey:"boards.quickEditor.copyCard",icon:"square-2-stack",disabled:!0}),this.renderCardActionItem({testId:"card-back-mirror-card-button",labelKey:"boards.quickEditor.mirror",icon:"rectangle-stack",onClick:()=>{this.closeCardActionsPopover(),this.openMoveCardPopover(t,e,a,o,"mirror")}}),this.renderCardActionItem({testId:"card-back-link-entity-button",labelKey:"boards.cardLinks.link",icon:"link",onClick:()=>{this.closeCardActionsPopover(),this.openCardEntityLinkModal(o)}}),this.renderCardActionItem({testId:"card-back-import-card-button",labelKey:"boards.import.actions.importCard",icon:"arrow-down",onClick:()=>{this.closeCardActionsPopover(),this.openImportPreviewModal({scope:"card",titleKey:"boards.import.title.card",target:{cardId:o.id,columnId:a.id,boardId:e.id}})}}),this.renderCardActionItem({testId:"card-back-export-card-markdown-button",labelKey:"boards.export.actions.cardMarkdown",icon:"document",onClick:()=>{this.closeCardActionsPopover(),this.openExportOutputModal({titleKey:"boards.export.title.card",request:{scope:"card",format:"markdown",cardId:o.id}})}}),this.renderCardActionItem({testId:"card-back-export-card-json-button",labelKey:"boards.export.actions.cardJson",icon:"document",onClick:()=>{this.closeCardActionsPopover(),this.openExportOutputModal({titleKey:"boards.export.title.card",request:{scope:"card",format:"json",cardId:o.id}})}}),this.renderCardActionItem({testId:"card-back-create-task-button",labelKey:"boards.cardLinks.createTask",icon:"check-box",onClick:()=>void this.createEntityFromCard(o,"task")}),this.renderCardActionItem({testId:"card-back-create-story-button",labelKey:"boards.cardLinks.createStory",icon:"document",onClick:()=>void this.createEntityFromCard(o,"story")}),this.renderCardActionItem({testId:"card-back-create-goal-button",labelKey:"boards.cardLinks.createGoal",icon:"goal-circle",onClick:()=>void this.createEntityFromCard(o,"goal")}),this.renderCardActionsDivider(),this.renderCardActionItem({testId:"card-back-archive-button",labelKey:dt(o)?"boards.quickEditor.removeFromBoard":"boards.quickEditor.archive",icon:"archive-box",onClick:()=>{this.closeCardActionsPopover(),this.closeCardModal(),this.archiveOrRemoveCard(o,j(o))}}),this.renderCardActionItem({testId:"card-back-delete-card-button",labelKey:"boards.actions.deleteCard",icon:"trash",onClick:()=>void this.deleteSharedCardFromDetails(o)})),n.append(s),r.append(n);let c;c=new U({container:t,panel:r,positioning:"viewport",panelZIndex:300,onOpenChange:d=>{var m;t.setAttribute("aria-expanded",d?"true":"false"),!d&&((m=this.cardActionsPopover)==null?void 0:m.menu)===c&&this.closeCardActionsPopover()}}),c.mount(),this.cardActionsPopover={menu:c,panel:r,trigger:t},c.openAt({anchor:t,placement:"bottom-end",fallbackPlacements:["bottom-start","top-end","top-start"],gap:8,margin:12,lockPlacementAfterOpen:!0})}renderCardActionItem(t){const e=document.createElement("li");e.className=l.cardActionsItem;const a=C({text:this.runtime.i18n.t(t.labelKey),tone:"text",size:"md",className:l.cardActionsButton,disabled:t.disabled,onClick:t.onClick});return a.setAttribute("data-testid",t.testId),Y(a,t.icon),e.append(a),e}renderCardActionsDivider(){const t=document.createElement("li");return t.className=l.cardActionsDivider,t.setAttribute("role","separator"),t}openImportPreviewModal(t){this.closeImportPreviewModal(),this.closeTransientBoardOverlays();let e="markdown";const a={...sa(),mode:"create"};let o=null,r=null,n=!1,s="edit",c="idle",d=null;const{overlay:m,container:u,body:b,footer:h}=ut(this.runtime.i18n.t(t.titleKey),{intent:"info",zIndex:370,onClose:()=>this.closeImportPreviewModal()});u.classList.add(l.importModal),m.setAttribute("data-testid","boards-import-preview-modal");const f=document.createElement("div");f.className=l.importLayout,f.setAttribute("data-testid","boards-import-edit-mode");const g=document.createElement("section");g.className=l.importReview,g.setAttribute("data-testid","boards-import-review-mode");const x=document.createElement("section");x.className=l.importPanel;let v=null;const N=new Ie({value:e,size:"sm",fullWidth:!0,ariaLabel:this.runtime.i18n.t("boards.import.format"),options:[{id:"markdown",value:"markdown",label:this.runtime.i18n.t("boards.import.formatMarkdown")},{id:"json",value:"json",label:this.runtime.i18n.t("boards.import.formatJson")}],onChange:w=>{e=w,_(),v==null||v.refresh(),E()}}),L=document.createElement("section");L.className=l.importField;const D=document.createElement("div");D.className=l.importSourceHeader;const $=document.createElement("label");$.className=l.importLabel,$.htmlFor="boards-import-source",$.textContent=this.runtime.i18n.t("boards.import.source");const y=new Ut({id:"boards-import-source",rows:14,placeholder:this.runtime.i18n.t("boards.import.sourcePlaceholder"),className:l.importSource,onInput:()=>{_(),E()}}).createElement();y.spellcheck=!1,y.autocomplete="off",y.wrap="off";const M=document.createElement("section");M.className=l.importPanel,M.append(this.createImportSelect({id:"boards-import-mode",labelKey:"boards.import.mode",value:a.mode,options:[["merge","boards.import.mode.merge"],["create","boards.import.mode.create"],["replace","boards.import.mode.replace"]],onChange:w=>{a.mode=w,_(),E()}}),this.createImportSelect({id:"boards-import-match",labelKey:"boards.import.match",value:a.matchStrategy,options:[["title","boards.import.match.title"],["id","boards.import.match.id"],["external_ref","boards.import.match.externalRef"]],onChange:w=>{a.matchStrategy=w,_(),E()}}),this.createImportSelect({id:"boards-import-missing",labelKey:"boards.import.missingFields",value:a.missingFieldPolicy,options:[["keep_existing","boards.import.missing.keepExisting"],["use_defaults","boards.import.missing.useDefaults"],["clear_on_replace","boards.import.missing.clearOnReplace"]],onChange:w=>{a.missingFieldPolicy=w,_(),E()}}),this.createImportSelect({id:"boards-import-unknown",labelKey:"boards.import.unknownFields",value:a.unknownFieldPolicy,options:[["warn_and_ignore","boards.import.unknown.warn"],["strict_error","boards.import.unknown.strict"]],onChange:w=>{a.unknownFieldPolicy=w,_(),E()}}));const T=document.createElement("section");T.className=l.importPreviewPanel,T.setAttribute("data-testid","boards-import-preview-panel"),this.renderImportPreviewPlan(T,null),g.append(T);const P=jt({className:l.importMessage,ariaLive:"polite"});v=this.createImportFormatGuide({scope:t.scope,getFormat:()=>e,onInsertTemplate:()=>{y.value=this.getImportTemplate(t.scope,e),_(),E(),y.focus()},onCopyAiPrompt:()=>{this.copyImportAiPrompt(t.scope,e)},onClear:()=>{y.value="",_(),E(),y.focus()}}),D.append($,v.element),L.append(D,y),x.replaceChildren(N.element,L);const W=document.createElement("aside");W.className=l.importSidePanel,W.append(M),f.append(x,W);const Z=document.createElement("div");Z.className=l.importActions,Z.setAttribute("data-testid","boards-import-action-row");const O=document.createElement("button");O.type="button",O.className=l.importActionButtonSecondary,O.textContent=this.runtime.i18n.t("boards.import.preview"),O.setAttribute("data-testid","boards-import-preview-button");const A=document.createElement("button");A.type="button",A.className=l.importActionButtonPrimary,A.textContent=this.runtime.i18n.t("boards.import.apply"),A.disabled=!0,A.setAttribute("data-testid","boards-import-apply-button");const R=document.createElement("button");R.type="button",R.className=l.importActionButtonSecondary,R.textContent=this.runtime.i18n.t("boards.import.backToEdit"),R.setAttribute("data-testid","boards-import-back-button"),R.addEventListener("click",()=>{s="edit",I(),E(),requestAnimationFrame(()=>y.focus())});const K=document.createElement("button");K.type="button",K.className=l.importActionButtonSecondary,K.textContent=this.runtime.i18n.t("common.close"),K.addEventListener("click",()=>this.closeImportPreviewModal());const nt=async()=>{const w=y.value.trim();if(!w)return;const B={raw:w,format:e,scope:t.scope,target:t.target,policies:{...a}};c="previewing",E();try{const H=await this.handlers.onPreviewImport(B);o=B,r=H,n=!0,d=null,this.renderImportPreviewPlan(T,H,B.policies.mode==="create"),s="review",I()}catch{o=null,r=null,d={messageKey:"boards.import.previewFailed",tone:"error"},this.renderImportPreviewPlan(T,null)}finally{c="idle",E()}},X=async()=>{if(!(!o||!(r!=null&&r.canApply))&&o.policies.mode==="create"){c="applying",E();try{if(!await this.handlers.onApplyImport(o)){d={messageKey:"boards.import.applyFailed",tone:"error"};return}this.closeImportPreviewModal(),V(this.runtime.i18n.t("boards.import.applied"),"success")}catch{d={messageKey:"boards.import.applyFailed",tone:"error"}}finally{c="idle",E()}}},pt=()=>{this.renderImportPreviewPlan(T,null)};function _(){o=null,r=null,d=null,pt()}const I=()=>{b.replaceChildren(s==="review"?g:f)},E=()=>{var Gt;const w=y.value.trim().length>0,B=c!=="idle",H=o!==null,Rt=(r==null?void 0:r.canApply)===!0,Kt=(o==null?void 0:o.policies.mode)==="create",st=s==="review";O.disabled=B||!w,A.disabled=B||!st||!H||!Rt||!Kt,O.hidden=st,R.hidden=!st,A.hidden=!st,O.className=l.importActionButtonPrimary,A.className=A.disabled?l.importActionButtonSecondary:l.importActionButtonPrimary,O.textContent=this.runtime.i18n.t(n?"boards.import.previewUpdate":"boards.import.preview"),c==="previewing"?P.show(this.runtime.i18n.t("boards.import.previewing"),"info"):c==="applying"?P.show(this.runtime.i18n.t("boards.import.applying"),"info"):d?P.show(this.runtime.i18n.t(d.messageKey),d.tone):w?st?H?Rt?Kt?P.clear():P.show(this.runtime.i18n.t("boards.import.unsupportedMode"),"warning"):P.show(this.runtime.i18n.t("boards.import.blockedByPlan"),"error"):P.show(this.runtime.i18n.t("boards.import.previewRequired"),"info"):H?P.clear():P.show(this.runtime.i18n.t("boards.import.previewRequired"),"info"):P.show(this.runtime.i18n.t("boards.import.needSource"),"info");const Ht=A.disabled?(Gt=P.element.textContent)==null?void 0:Gt.trim():"";Ht?A.title=Ht:A.removeAttribute("title")};O.addEventListener("click",()=>void nt()),A.addEventListener("click",()=>void X()),Z.append(K,R,O,A),h.replaceChildren(P.element,Z),I(),E(),this.importPreviewOverlay=m,requestAnimationFrame(()=>y.focus())}createImportField(t,e){const a=document.createElement("label");a.className=l.importField,a.htmlFor=e;const o=document.createElement("span");return o.className=l.importLabel,o.textContent=this.runtime.i18n.t(t),a.append(o),a}createImportSelect(t){const e=this.createImportField(t.labelKey,t.id),a=document.createElement("select");a.id=t.id,a.className=l.importSelect;for(const[o,r]of t.options)a.append(this.createSelectOption(o,this.runtime.i18n.t(r)));return a.value=t.value,a.addEventListener("change",()=>{t.onChange(a.value)}),e.append(a),e}createImportFormatGuide(t){const e=document.createElement("section");e.className=l.importGuide,e.setAttribute("data-testid","boards-import-format-guide");const a=z({icon:"light-bulb",size:"sm",tone:"text",className:l.importGuideHelp,ariaLabel:this.runtime.i18n.t("boards.import.guide.title"),title:this.runtime.i18n.t("boards.import.guide.title")});a.setAttribute("data-testid","boards-import-format-help");const o=document.createElement("div");o.className=l.importGuideActions,o.append(a,this.createImportGuideButton("boards.import.guide.insertTemplate","boards-import-insert-template-button",t.onInsertTemplate),this.createImportGuideButton("boards.import.guide.copyAiPrompt","boards-import-copy-ai-prompt-button",t.onCopyAiPrompt),this.createImportGuideButton("boards.import.guide.clear","boards-import-clear-source-button",t.onClear));const r=()=>{const n=t.getFormat();a.title=this.getImportGuideTooltip(n),a.setAttribute("aria-label",this.runtime.i18n.t("boards.import.guide.title"))};return e.append(o),r(),{element:e,refresh:r}}getImportGuideTooltip(t){return[this.runtime.i18n.t("boards.import.guide.title"),this.runtime.i18n.t(t==="markdown"?"boards.import.guide.markdownSummary":"boards.import.guide.jsonSummary"),this.runtime.i18n.t(t==="markdown"?"boards.import.guide.markdownRequired":"boards.import.guide.jsonRequired"),this.runtime.i18n.t("boards.import.guide.optional"),this.runtime.i18n.t("boards.import.guide.partial"),this.runtime.i18n.t("boards.import.guide.createOnly")].join(`
`)}createImportGuideButton(t,e,a){const o=document.createElement("button");return o.type="button",o.className=l.importGuideButton,o.textContent=this.runtime.i18n.t(t),o.setAttribute("data-testid",e),o.addEventListener("click",a),o}getImportTemplate(t,e){return e==="json"?JSON.stringify({schema:ot,version:rt,scope:t,payload:this.getJsonImportTemplatePayload(t)},null,2):t==="column"?["## Column: Backlog","","### Card: First task","Description:","Optional description.","","### Card: Second task"].join(`
`):t==="card"?["### Card: First task","Description:","Optional description.","","Checklist: Steps","- [ ] First step","- [ ] Second step"].join(`
`):["---",'title: "Project board"',"---","","## Column: Backlog","","### Card: First task","Description:","Short task description.","","Checklist: Setup","- [ ] Prepare data","- [x] Confirm format"].join(`
`)}getJsonImportTemplatePayload(t){const e={title:"First task",description:"Optional description.",checklists:[{title:"Steps",items:[{title:"First step",state:"incomplete"},{title:"Second step",state:"complete"}]}]};if(t==="card")return e;const a={title:"Backlog",cards:[e]};return t==="column"?a:{title:"Project board",columns:[a]}}getImportAiPrompt(t,e){const a=t==="board"?"board":t==="column"?"list":"card";return e==="json"?[`Generate a Majom Boards JSON import for one ${a}.`,`Use schema "${ot}" and version "${rt}".`,"Use this shape:",this.getImportTemplate(t,"json"),"Return only valid JSON."].join(`

`):[`Generate a Majom Boards Markdown import for one ${a}.`,"Use this format:","- YAML front matter with title for board imports","- ## Column: column name","- ### Card: card title","- Description: optional multiline description","- Checklist: optional checklist title","- - [ ] unchecked item","- - [x] completed item","Missing optional fields are allowed.","Return only Markdown.","",this.getImportTemplate(t,"markdown")].join(`
`)}async copyImportAiPrompt(t,e){var o;const a=this.getImportAiPrompt(t,e);try{if((o=navigator.clipboard)!=null&&o.writeText)await navigator.clipboard.writeText(a);else{const r=document.createElement("textarea");r.value=a,r.style.position="fixed",r.style.left="-9999px",document.body.append(r),r.select(),document.execCommand("copy"),r.remove()}V(this.runtime.i18n.t("boards.import.aiPromptCopied"),"success")}catch{V(this.runtime.i18n.t("boards.import.aiPromptCopyFailed"),"warning")}}renderImportPreviewPlan(t,e,a=!0){if(t.replaceChildren(),!e){const c=document.createElement("h3");c.className=l.importPreviewTitle,c.textContent=this.runtime.i18n.t("boards.import.previewTitle");const d=document.createElement("p");d.className=l.importEmpty,d.textContent=this.runtime.i18n.t("boards.import.previewEmpty"),t.append(c,d);return}const o=document.createElement("header");o.className=l.importReviewHeader;const r=document.createElement("div"),n=document.createElement("p");n.className=l.importReviewEyebrow,n.textContent=this.runtime.i18n.t("boards.import.previewTitle");const s=document.createElement("h3");if(s.className=l.importReviewHeadline,s.textContent=this.runtime.i18n.t(e.canApply?a?"boards.import.status.ready":"boards.import.status.previewOnly":"boards.import.status.blocked"),r.append(n,s),o.append(r),t.append(o),e.items.length>0){const c=document.createElement("div");c.className=l.importPlanGroups,["create","update","skip","conflict"].forEach(d=>{const m=e.items.filter(g=>g.action===d).slice(0,40);if(m.length===0)return;const u=document.createElement("section");u.className=`${l.importPlanGroup} majom-boards-import__plan-group--${d}`;const b=document.createElement("header");b.className=l.importPlanGroupHeader;const h=document.createElement("h4");h.className=l.importPlanGroupTitle,h.textContent=this.runtime.i18n.t(to[d]),b.append(h);const f=document.createElement("ul");f.className=l.importItems,m.forEach(g=>{const x=document.createElement("li");x.className=l.importItem;const v=document.createElement("span");v.className=l.importItemEntity,v.textContent=this.runtime.i18n.t(Za[g.entity]);const N=document.createElement("span"),L=document.createElement("span");L.className=l.importItemMain,L.textContent=g.title,N.append(L);const D=this.getImportPlanItemMeta(g);if(D){const $=document.createElement("span");$.className=l.importItemMeta,$.textContent=D,N.append($)}x.append(v,N),f.append(x)}),u.append(b,f),c.append(u)}),t.append(c)}if(e.diagnostics.length>0){const c=document.createElement("ul");c.className=l.importDiagnostics,e.diagnostics.slice(0,20).forEach(d=>{const m=document.createElement("li");m.className=d.level==="error"?l.importDiagnosticError:l.importDiagnosticWarning,m.textContent=d.path?`${d.path}: ${d.message}`:d.message,c.append(m)}),t.append(c)}}getImportPlanItemMeta(t){if(t.action==="create")return null;const e={"ambiguous-title-match":this.runtime.i18n.t("boards.import.reason.ambiguousTitle"),"invalid-source":this.runtime.i18n.t("boards.import.reason.invalidSource"),"matched-by-title":this.runtime.i18n.t("boards.import.reason.matchedByTitle"),"replace-target-not-found":this.runtime.i18n.t("boards.import.reason.replaceTargetNotFound"),"target-board-not-found":this.runtime.i18n.t("boards.import.reason.targetBoardNotFound"),"target-column-not-found":this.runtime.i18n.t("boards.import.reason.targetColumnNotFound")};return t.reason?e[t.reason]??t.path:t.targetId?this.runtime.i18n.t("boards.import.reason.existingTarget"):t.path}closeImportPreviewModal(){var t;(t=this.importPreviewOverlay)==null||t.remove(),this.importPreviewOverlay=null}async openExportOutputModal(t){this.closeExportOutputModal(),this.closeImportPreviewModal();const e=await this.handlers.onExportData(t.request);if(!e){V(this.runtime.i18n.t("boards.export.failed"),"error");return}const{overlay:a,container:o,body:r,footer:n}=ut(this.runtime.i18n.t(t.titleKey),{intent:"info",zIndex:380,onClose:()=>this.closeExportOutputModal()});o.classList.add(l.exportModal),a.setAttribute("data-testid","boards-export-output-modal");const s=document.createElement("div");s.className=l.exportContent;const c=document.createElement("p");c.className=l.exportMeta,c.textContent=`${e.fileName} · ${e.format.toUpperCase()}`;const d=new Ut({rows:18,value:e.content,className:l.exportOutput}).createElement();d.readOnly=!0,d.setAttribute("data-testid","boards-export-output"),d.addEventListener("focus",()=>d.select()),s.append(c,d),r.replaceChildren(s);const m=Qt({variant:"confirm"}),u=document.createElement("button");u.type="button",u.className=bt("default"),u.textContent=this.runtime.i18n.t("common.close"),u.addEventListener("click",()=>this.closeExportOutputModal());const b=document.createElement("button");b.type="button",b.className=bt("wide"),b.textContent=this.runtime.i18n.t("boards.export.copy"),b.setAttribute("data-testid","boards-export-copy-button"),b.addEventListener("click",()=>{this.copyExportContent(e,d)}),m.append(u,b),n.replaceChildren(m),this.exportOutputOverlay=a,requestAnimationFrame(()=>d.focus())}async copyExportContent(t,e){var a;try{(a=navigator.clipboard)!=null&&a.writeText?await navigator.clipboard.writeText(t.content):(e.select(),document.execCommand("copy")),V(this.runtime.i18n.t("boards.export.copied"),"success")}catch{e.select(),V(this.runtime.i18n.t("boards.export.copyFailed"),"warning")}}closeExportOutputModal(){var t;(t=this.exportOutputOverlay)==null||t.remove(),this.exportOutputOverlay=null}archiveOrRemoveCard(t,e){if(dt(t)){this.handlers.onDeleteCardPlacement(e);return}this.handlers.onDeleteCard(t.id)}createPlacementTargetFromPosition(t,e,a){return Ce({columnId:t.id,cards:t.cards,movingPlacementId:a??"",insertionIndex:e-1})}openMoveCardPopover(t,e,a,o,r="move"){var pt;const n=((pt=this.state)==null?void 0:pt.boards)??[e],s=j(o);let c=e.id,d=a.id,m=a.cards.findIndex(_=>j(_)===s);m=m>=0?m+1:1;const u=r==="mirror"?"boards.cardMirror.title":"boards.cardMove.title",b=r==="mirror"?"boards.cardMirror.create":"boards.cardMove.move";this.closeMoveCardPopover();const h=G({elevated:!0,className:`${l.movePopover} hidden`});h.setAttribute("role","dialog"),h.setAttribute("aria-modal","false"),h.setAttribute("aria-labelledby","move-card-popover"),h.setAttribute("data-testid","move-card-popover"),h.addEventListener("mousedown",_=>_.stopPropagation());const f=document.createElement("header");f.className=l.movePopoverHeader;const g=document.createElement("h2");g.id="move-card-popover",g.className=l.movePopoverTitle,g.textContent=this.runtime.i18n.t(u);const x=z({icon:"x-mark",tone:"text",size:"sm",className:l.iconButton,ariaLabel:this.runtime.i18n.t("common.close"),title:this.runtime.i18n.t("common.close"),onClick:()=>this.closeMoveCardPopover()});f.append(g,x);const v=document.createElement("div");v.className=l.movePopoverBody;const N=document.createElement("div");N.className=l.movePopoverContent;const L=document.createElement("div");L.className=l.moveTabs,L.setAttribute("role","tablist"),L.append(this.renderMoveCardTab("boards.cardMove.inbox",!1),this.renderMoveCardTab("boards.cardMove.board",!0));const D=document.createElement("h3");D.className=l.moveSectionTitle,D.textContent=this.runtime.i18n.t("boards.cardMove.selectDestination");const $=document.createElement("div");$.className=l.moveFields;const y=this.createMoveSelectField({id:"move-card-board-select",label:this.runtime.i18n.t("boards.cardMove.board")}),M=this.createMoveSelectField({id:"move-card-list-select",label:this.runtime.i18n.t("boards.cardMove.list")}),T=this.createMoveSelectField({id:"move-card-board-list-position-select",label:this.runtime.i18n.t("boards.cardMove.position")}),P=()=>n.find(_=>_.id===c)??null,W=()=>{var _;return((_=P())==null?void 0:_.columns.find(I=>I.id===d))??null},Z=()=>{var _;return r!=="mirror"?!1:((_=W())==null?void 0:_.cards.some(I=>I.id===o.id))??!1},O=()=>{const _=W();return _?r==="mirror"?_.cards.length+1:_.id===a.id?_.cards.length:_.cards.length+1:0};let A;const R=()=>{var w;y.select.replaceChildren(...n.map(B=>this.createSelectOption(B.id,B.title,B.id===c)));const _=P(),I=(_==null?void 0:_.columns)??[];I.some(B=>B.id===d)||(d=((w=I[0])==null?void 0:w.id)??""),M.select.replaceChildren(...I.map(B=>this.createSelectOption(B.id,B.title,B.id===d)));const E=O();m=Math.min(Math.max(m,1),E||1),T.select.replaceChildren(...Array.from({length:E},(B,H)=>this.createSelectOption(H+1,String(H+1),H+1===m))),Z()?K.show(this.runtime.i18n.t("boards.cardMirror.duplicateDestination"),"warning"):W()?K.clear():K.show(this.runtime.i18n.t("boards.cardMirror.noDestination"),"error"),A.disabled=!W()},K=jt({tone:"error",className:"mb-3"});y.select.addEventListener("change",()=>{var _,I;c=y.select.value,d=((I=(_=n.find(E=>E.id===c))==null?void 0:_.columns[0])==null?void 0:I.id)??"",m=1,R()}),M.select.addEventListener("change",()=>{d=M.select.value,m=d===a.id?m:1,R()}),T.select.addEventListener("change",()=>{m=Number(T.select.value)}),A=C({text:this.runtime.i18n.t(b),tone:"primary",size:"md",className:l.moveButton,onClick:()=>{const _=W();if(!_)return;const I=this.createPlacementTargetFromPosition(_,m,r==="move"?s:void 0),E=a.cards.findIndex(w=>j(w)===s);if(this.closeMoveCardPopover(),r==="mirror"){this.closeQuickCardEditor();const{column:w,...B}=I;this.handlers.onCreateCardMirror(o.id,w,B);return}if(_.id===a.id&&m-1===E){this.closeQuickCardEditor();return}this.closeQuickCardEditor(),this.handlers.onPatchCardPlacement(s,I)}}),A.setAttribute("data-testid","move-card-popover-move-button");const nt=document.createElement("div");nt.className=l.moveActions,nt.append(A),$.append(y.field,M.field,T.field),N.append(L,D,$,K.element),v.append(N,nt),h.append(f,v);let X;X=new U({container:t,panel:h,positioning:"viewport",panelZIndex:300,onOpenChange:_=>{var I;t.setAttribute("aria-expanded",_?"true":"false"),!_&&((I=this.moveCardPopover)==null?void 0:I.menu)===X&&this.closeMoveCardPopover()}}),X.mount(),this.moveCardPopover={menu:X,panel:h,trigger:t},R(),X.openAt({anchor:t,placement:"bottom-start",fallbackPlacements:["bottom-end","top-start","top-end"],gap:8,margin:12,lockPlacementAfterOpen:!0})}renderMoveCardTab(t,e){const a=document.createElement("button");return a.type="button",a.className=e?l.moveTabSelected:l.moveTab,a.setAttribute("role","tab"),a.setAttribute("aria-selected",e?"true":"false"),a.disabled=!e,a.textContent=this.runtime.i18n.t(t),a}createMoveSelectField(t){const e=document.createElement("label");e.className=l.moveField,e.htmlFor=t.id;const a=document.createElement("span");a.className=l.moveLabel,a.textContent=t.label;const o=document.createElement("select");return o.id=t.id,o.className=l.moveSelect,o.setAttribute("data-testid",`${t.id}-select`),e.append(a,o),{field:e,select:o}}createSelectOption(t,e,a){const o=document.createElement("option");return o.value=String(t),o.textContent=e,o.selected=a,o}renderCardBackLayout(t,e,a,o,r){const n=document.createElement("div");n.className=l.layout;const s=document.createElement("main");s.className=l.main,s.setAttribute("data-auto-scrollable","true"),s.append(this.renderCardBackTitleSection(a,o),this.renderCardBackQuickActions(a),this.renderCardBackLabelsHost(a),...this.renderCardBackEntityLinksSection(a),this.renderCardBackDescriptionSection(a,o,r),this.renderCardBackChecklistsSection(a),this.renderCardBackAttachmentsSection());const c=this.renderCardBackAside(t,e);return n.append(s,c),n}renderCardBackTitleSection(t,e){const a=document.createElement("section");a.className=`${l.section} ${l.titleSection}`,a.setAttribute("data-testid","card-back-header");const o=document.createElement("div");o.className=l.sectionIcon;const r=this.createCardCompletionToggle(t,{className:kt(t)?l.doneButtonCompleted:l.doneButton,testId:"card-back-completion-toggle"});o.append(r);const n=document.createElement("div");n.className=l.sectionMain;const s=document.createElement("hgroup"),c=document.createElement("h2");return c.id="card-back-name",c.className=l.hiddenShellPart,c.textContent=t.title,s.append(c,e),n.append(s),a.append(o,n),a}renderCardBackQuickActions(t){const e=document.createElement("section");e.className=`${l.section} ${l.quickActions}`;const a=document.createElement("div");a.className=l.sectionIcon;const o=document.createElement("div");o.className=l.sectionMain;const r=document.createElement("ul");return r.className=l.quickActionList,this.cardModalQuickActionList=r,this.populateCardBackQuickActions(r,t),o.append(r),e.append(a,o),e}populateCardBackQuickActions(t,e){t.replaceChildren();const a=[{labelKey:"boards.cardBack.add",icon:"plus",disabled:!0}];this.getCardModalDraftTagItems(e).length===0&&a.push({labelKey:"boards.cardBack.labels",icon:"tag",onClick:o=>this.openCardLabelsPopover(o,e)}),a.push({labelKey:"boards.cardLinks.link",icon:"link",onClick:()=>this.openCardEntityLinkModal(e)},{labelKey:"boards.cardLinks.createTask",icon:"check-box",onClick:()=>void this.createEntityFromCard(e,"task")},{labelKey:"boards.cardLinks.createStory",icon:"document",onClick:()=>void this.createEntityFromCard(e,"story")},{labelKey:"boards.cardLinks.createGoal",icon:"goal-circle",onClick:()=>void this.createEntityFromCard(e,"goal")},{labelKey:"boards.cardBack.dates",icon:"calendar",disabled:!0},{labelKey:"boards.cardBack.checklist",icon:"check-box",onClick:o=>this.openCardChecklistPopover(o,e)}),a.forEach(o=>{const r=document.createElement("li"),n=o.disabled===!0?this.createUnavailableCardBackButton(o.labelKey,o.icon):this.createAvailableCardBackButton({labelKey:o.labelKey,icon:o.icon,onClick:o.onClick});r.append(n),t.append(r)})}renderCardBackLabelsHost(t){const e=document.createElement("div");return e.className=l.labelsHost,e.setAttribute("data-testid","card-back-labels-host"),this.cardModalLabelsHost=e,this.populateCardBackLabelsHost(e,t),e}populateCardBackLabelsHost(t,e){t.replaceChildren();const a=this.getCardModalDraftTagItems(e);if(a.length===0)return;const o=document.createElement("section");o.className=l.labelsSection,o.setAttribute("aria-labelledby","card-back-labels-title");const r=document.createElement("h3");r.id="card-back-labels-title",r.className=l.labelsTitle,r.textContent=this.runtime.i18n.t("boards.cardBack.labels");const n=document.createElement("div");n.setAttribute("role","group"),n.setAttribute("aria-labelledby",r.id);const s=document.createElement("div");s.className=l.labelsList,s.setAttribute("data-testid","card-back-labels-container"),a.forEach(c=>{s.append(this.createCardBackLabelSwatch(c))}),s.append(this.createCardBackAddLabelButton(e)),n.append(s),o.append(r,n),t.append(o)}createCardBackLabelSwatch(t){const e=document.createElement("button");return e.type="button",e.className=l.labelSwatch,e.style.backgroundColor=t.color,e.style.color=no(t.color),e.textContent=t.title,e.title=t.title,e.setAttribute("aria-label",t.title),e.setAttribute("data-testid","card-label"),e.dataset.tagId=String(t.id),e}createCardBackAddLabelButton(t){const e=z({icon:"plus",tone:"text",size:"md",className:l.labelAddButton,ariaLabel:this.runtime.i18n.t("boards.cardBack.addLabel"),title:this.runtime.i18n.t("boards.cardBack.addLabel"),onClick:()=>this.openCardLabelsPopover(e,t)});return e.setAttribute("data-testid","card-back-add-label-button"),e.dataset.role="goal-tag-picker-trigger",e.setAttribute("aria-haspopup","dialog"),e.setAttribute("aria-expanded","false"),e}createAvailableCardBackButton(t){const e=C({text:this.runtime.i18n.t(t.labelKey),tone:"text",size:"md",className:l.quickActionButton,onClick:()=>t.onClick(e)});return e.setAttribute("aria-haspopup","dialog"),e.setAttribute("aria-expanded","false"),Y(e,t.icon),e}getCardModalDraftTagIds(t){return this.cardModalDraftTagIds===null&&(this.cardModalDraftTagIds=et(t)),this.cardModalDraftTagIds}getCardModalDraftTagItems(t){var r;const e=this.getCardModalDraftTagIds(t),a=new Set(e),o=new Map;return(r=t.tags)==null||r.forEach(n=>o.set(n.id,_t(n))),this.tagItems.forEach(n=>o.set(n.id,n)),e.map(n=>o.get(n)).filter(n=>!!n&&a.has(n.id))}refreshCardModalLabelControls(t){this.cardModalLabelsHost&&this.populateCardBackLabelsHost(this.cardModalLabelsHost,t),this.cardModalQuickActionList&&this.populateCardBackQuickActions(this.cardModalQuickActionList,t)}patchCardModalTagIds(t,e){const a=Ct(e),o=this.cardModalRequestedTagIds??et(t);de(a,o)||(this.cardModalRequestedTagIds=a,this.handlers.onPatchCard(t.id,{tag_ids:a}))}openCardLabelsPopover(t,e){this.closeCardLabelsPopover();const a=G({elevated:!0,className:`${l.labelPickerPopover} hidden`});a.setAttribute("role","dialog"),a.setAttribute("aria-modal","false"),a.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.labels")),a.setAttribute("data-testid","card-back-label-picker-popover"),a.addEventListener("mousedown",n=>n.stopPropagation());const o=new Ae({variant:"labels",items:this.tagItems,selectedIds:this.getCardModalDraftTagIds(e),loading:this.tagCatalogStatus==="loading",errorMessage:this.getTagPickerErrorMessage(),placeholder:this.runtime.i18n.t("boards.cardBack.tagsPlaceholder"),searchPlaceholder:this.runtime.i18n.t("boards.cardBack.tagsSearchPlaceholder"),copy:{title:this.runtime.i18n.t("boards.cardBack.labels"),editTitle:this.runtime.i18n.t("boards.cardBack.editLabel"),createTitle:this.runtime.i18n.t("boards.cardBack.createLabel"),searchPlaceholder:this.runtime.i18n.t("boards.cardBack.tagsSearchPlaceholder"),labelsLegend:this.runtime.i18n.t("boards.cardBack.labels"),createButton:this.runtime.i18n.t("boards.cardBack.createNewLabel"),colorblindButton:this.runtime.i18n.t("boards.cardBack.enableColorblindMode"),titleLabel:this.runtime.i18n.t("boards.cardBack.labelTitle"),colorLegend:this.runtime.i18n.t("boards.cardBack.selectColor"),removeColor:this.runtime.i18n.t("boards.cardBack.removeColor"),save:this.runtime.i18n.t("common.save"),delete:this.runtime.i18n.t("common.delete"),close:this.runtime.i18n.t("boards.cardBack.closeLabelsPopover"),back:this.runtime.i18n.t("boards.cardBack.returnToLabels")},onRequestClose:()=>this.closeCardLabelsPopover(),onCreate:(n,s)=>this.createTagFromCardBack(n,s),onUpdate:(n,s)=>this.updateTagFromCardBack(n,s),onDelete:n=>this.deleteTagFromCardBack(n),onChange:n=>{this.cardModalDraftTagIds=n,this.refreshCardModalLabelControls(e),this.patchCardModalTagIds(e,n)}});o.element.setAttribute("data-testid","card-back-tag-picker"),a.append(o.element);let r;r=new U({container:t,panel:a,positioning:"viewport",panelZIndex:310,onOpenChange:n=>{var s;t.setAttribute("aria-expanded",n?"true":"false"),!n&&((s=this.cardLabelsPopover)==null?void 0:s.menu)===r&&this.closeCardLabelsPopover()}}),r.mount(),this.cardLabelsPopover={menu:r,panel:a,picker:o,trigger:t},r.openAt({anchor:t,placement:"bottom-start",fallbackPlacements:["bottom-end","top-start","top-end"],gap:8,margin:12,lockPlacementAfterOpen:!0}),window.requestAnimationFrame(()=>o.focusSearch())}openCardChecklistPopover(t,e){this.closeCardChecklistPopover();const a=G({elevated:!0,className:`${l.checklistPopover} hidden`});a.setAttribute("role","dialog"),a.setAttribute("aria-modal","false"),a.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.addChecklist")),a.setAttribute("data-testid","card-back-checklist-popover"),a.addEventListener("mousedown",h=>h.stopPropagation());const o=document.createElement("header");o.className=l.checklistPopoverHeader;const r=document.createElement("h3");r.className=l.checklistPopoverTitle,r.textContent=this.runtime.i18n.t("boards.cardBack.addChecklist");const n=z({icon:"x-mark",tone:"text",size:"sm",className:l.checklistPopoverClose,ariaLabel:this.runtime.i18n.t("common.close"),title:this.runtime.i18n.t("common.close"),onClick:()=>this.closeCardChecklistPopover()});o.append(r,n);const s=document.createElement("form");s.className=l.checklistPopoverForm;const c=document.createElement("label");c.className=l.checklistPopoverLabel,c.textContent=this.runtime.i18n.t("boards.cardBack.checklistTitle");const d=tt({variant:"default",value:this.runtime.i18n.t("boards.cardBack.defaultChecklistTitle"),className:l.checklistPopoverInput});c.append(d);const m=document.createElement("div");m.className=l.checklistPopoverActions;const u=C({text:this.runtime.i18n.t("boards.cardBack.add"),tone:"primary",size:"md",className:l.checklistPopoverSubmit});u.type="submit",m.append(u),s.append(c,m),s.addEventListener("submit",h=>{h.preventDefault(),this.createCardModalChecklist(e,d.value)}),a.append(o,s);let b;b=new U({container:t,panel:a,positioning:"viewport",panelZIndex:310,onOpenChange:h=>{var f;t.setAttribute("aria-expanded",h?"true":"false"),!h&&((f=this.cardChecklistPopover)==null?void 0:f.menu)===b&&this.closeCardChecklistPopover()}}),b.mount(),this.cardChecklistPopover={menu:b,panel:a,trigger:t},b.openAt({anchor:t,placement:"bottom-start",fallbackPlacements:["bottom-end","top-start","top-end"],gap:8,margin:12,lockPlacementAfterOpen:!0}),window.requestAnimationFrame(()=>{d.focus(),d.select()})}async createTagFromCardBack(t,e){if(!this.tagCatalog)return null;try{const a=await this.tagCatalog.createTag(t,e),o=_t(a);return this.upsertTagItem(o),o}catch{throw new Error(this.runtime.i18n.t("boards.cardBack.tagsCreateFailed"))}}async updateTagFromCardBack(t,e){if(!this.tagCatalog)return null;try{const a=await this.tagCatalog.updateTag(t,e),o=_t(a);return this.upsertTagItem(o),o}catch{throw new Error(this.runtime.i18n.t("boards.cardBack.tagsUpdateFailed"))}}async deleteTagFromCardBack(t){if(this.tagCatalog)try{await this.tagCatalog.deleteTag(t),this.tagItems=this.tagItems.filter(a=>a.id!==t);const{card:e}=this.findActiveCardLocation();this.cardModalDraftTagIds=this.getCardModalDraftTagIds(e).filter(a=>a!==t)}catch{throw new Error(this.runtime.i18n.t("boards.cardBack.tagsDeleteFailed"))}}upsertTagItem(t){if(this.tagItems.findIndex(a=>a.id===t.id)>=0){this.tagItems=this.tagItems.map(a=>a.id===t.id?t:a);return}this.tagItems=[...this.tagItems,t]}renderCardBackEntityLinksSection(t){const e=$t(t);if(e.length===0)return[];const a=this.createCardBackSection("link",this.runtime.i18n.t("boards.cardLinks.title")),o=a.querySelector(`.${l.sectionMain}`),r=a.querySelector(`.${l.sectionHeader}`);if(!o||!r)return[a];const n=document.createElement("div");n.className=l.sectionActions,n.append(C({text:this.runtime.i18n.t("boards.cardLinks.link"),tone:"text",size:"md",className:p.quietButton,onClick:()=>this.openCardEntityLinkModal(t)})),r.append(n);const s=document.createElement("div");s.className=l.entityLinksHost,s.setAttribute("data-testid","card-entity-links");const c=document.createElement("ul");return c.className=l.entityLinksList,e.forEach(d=>{c.append(this.renderCardEntityLinkItem(t,d))}),s.append(c),o.append(s),[a]}renderCardEntityLinkItem(t,e){var m;const a=document.createElement("li");a.className=l.entityLinkItem;const o=document.createElement("span");o.className=l.entityLinkIcon,o.append(q(Lt(e.entity_type),{size:16}));const r=document.createElement("span");r.className=l.entityLinkContent;const n=document.createElement("span");n.className=l.entityLinkTitle,n.textContent=at(e);const s=document.createElement("span");s.className=l.entityLinkMeta;const c=this.runtime.i18n.t(xt(e.entity_type));s.textContent=(m=e.entity)!=null&&m.status?`${c} - ${e.entity.status}`:c,r.append(n,s);const d=z({icon:"ellipsis-vertical",tone:"text",size:"sm",className:l.entityLinkMenuTriggerButton,ariaLabel:this.runtime.i18n.t("boards.cardLinks.actions",{title:at(e)}),title:this.runtime.i18n.t("boards.cardBack.actions")});return d.setAttribute("aria-haspopup","dialog"),d.setAttribute("aria-expanded","false"),d.setAttribute("data-testid","card-entity-link-menu-button"),d.addEventListener("click",u=>{var b;if(u.stopPropagation(),((b=this.cardEntityLinkMenuPopover)==null?void 0:b.trigger)===d){this.closeCardEntityLinkMenuPopover();return}this.openCardEntityLinkMenuPopover(d,t,e)}),a.append(o,r,d),a}openCardEntityLinkMenuPopover(t,e,a){this.closeCardEntityLinkMenuPopover();const o=G({elevated:!0,className:`${l.entityLinkMenuPopover} hidden`});o.setAttribute("role","dialog"),o.setAttribute("aria-modal","false"),o.setAttribute("aria-label",this.runtime.i18n.t("boards.cardLinks.actions",{title:at(a)})),o.setAttribute("data-testid","card-entity-link-menu-popover"),o.addEventListener("mousedown",s=>s.stopPropagation());const r=document.createElement("ul");r.className=l.entityLinkMenuList,r.append(this.renderCardEntityLinkMenuItem({labelKey:"boards.cardLinks.openAction",ariaLabel:this.runtime.i18n.t("boards.cardLinks.open",{title:at(a)}),icon:"arrow-right",onClick:()=>{this.closeCardEntityLinkMenuPopover(),this.openLinkedEntity(a)}}),this.renderCardEntityLinkMenuItem({labelKey:"boards.cardLinks.unlinkAction",ariaLabel:this.runtime.i18n.t("boards.cardLinks.unlink",{title:at(a)}),icon:"link-slash",onClick:()=>{this.closeCardEntityLinkMenuPopover(),this.unlinkCardEntity(e,a)}}),this.renderCardEntityLinkMenuItem({labelKey:"boards.cardLinks.deleteEntity",ariaLabel:this.runtime.i18n.t("boards.cardLinks.deleteEntityLabel",{title:at(a)}),icon:"trash",danger:!0,onClick:()=>{this.closeCardEntityLinkMenuPopover(),this.deleteLinkedEntity(e,a)}})),o.append(r);let n;n=new U({container:t,panel:o,positioning:"viewport",panelZIndex:320,onOpenChange:s=>{var c;t.setAttribute("aria-expanded",s?"true":"false"),!s&&((c=this.cardEntityLinkMenuPopover)==null?void 0:c.menu)===n&&this.closeCardEntityLinkMenuPopover()}}),n.mount(),this.cardEntityLinkMenuPopover={menu:n,panel:o,trigger:t},n.openAt({anchor:t,placement:"bottom-end",fallbackPlacements:["bottom-start","top-end","top-start"],gap:4,margin:12,lockPlacementAfterOpen:!0})}renderCardEntityLinkMenuItem(t){const e=document.createElement("li");e.className=l.entityLinkMenuItem;const a=C({text:this.runtime.i18n.t(t.labelKey),tone:"text",size:"md",className:t.danger?l.entityLinkMenuDangerButton:l.entityLinkMenuButton,onClick:t.onClick});return a.setAttribute("aria-label",t.ariaLabel),Y(a,t.icon),e.append(a),e}async unlinkCardEntity(t,e){await Promise.resolve(this.handlers.onDeleteCardEntityLink(e.id)),await this.refreshOpenCardEntityLinks(t.id)}async deleteLinkedEntity(t,e){await Promise.resolve(this.handlers.onDeleteLinkedEntity(t,e)),await this.refreshOpenCardEntityLinks(t.id)}async createEntityFromCard(t,e){await Promise.resolve(this.handlers.onCreateCardEntityFromCard(t,e)),await this.refreshOpenCardEntityLinks(t.id)}async refreshOpenCardEntityLinks(t){const e=this.activeCardPlacementId&&this.state?this.findCardLocation(this.activeCardPlacementId,this.state):null;!e||e.card.id!==t||this.renderCardModal(e)}openLinkedEntity(t){window.dispatchEvent(new CustomEvent("boardLinkedEntityOpenRequested",{detail:{entityType:t.entity_type,entityId:t.entity_id}}))}openCardEntityLinkModal(t){let e=null;const{overlay:a,container:o,body:r}=ut(this.runtime.i18n.t("boards.cardLinks.linkToEntity"),{zIndex:360,onClose:()=>e==null?void 0:e.remove()});e=a,o.setAttribute("data-testid","card-entity-link-modal");const n=document.createElement("div");n.className=l.entityLinkPicker;const s=document.createElement("label");s.className=l.entityLinkPickerField;const c=document.createElement("span");c.className=l.moveLabel,c.textContent=this.runtime.i18n.t("boards.cardLinks.selectType");const d=document.createElement("select");d.className=l.moveSelect,["task","story","goal"].forEach(y=>{const M=document.createElement("option");M.value=y,M.textContent=this.runtime.i18n.t(xt(y)),d.append(M)}),s.append(c,d);const u=document.createElement("label");u.className=l.entityLinkPickerField;const b=document.createElement("span");b.className=l.moveLabel,b.textContent=this.runtime.i18n.t("boards.cardLinks.search");const h=tt({variant:"default",className:l.entityLinkPickerInput,placeholder:this.runtime.i18n.t("boards.cardLinks.searchPlaceholder"),disabled:!this.entityCatalog});u.append(b,h);const f=document.createElement("div");f.className=l.entityLinkPickerResults,f.setAttribute("data-testid","card-entity-link-results"),n.append(s,u,f),r.append(n),document.body.append(a);let g=this.entityCatalog?"idle":"error",x=[],v=0,N=null;const L=()=>{if(f.replaceChildren(),g==="loading"){f.append(this.createEntityLinkPickerMessage(this.runtime.i18n.t("boards.cardLinks.loading")));return}if(g==="error"){f.append(this.createEntityLinkPickerMessage(this.runtime.i18n.t("boards.cardLinks.loadFailed")));return}if(x.length===0){f.append(this.createEntityLinkPickerMessage(this.runtime.i18n.t("boards.cardLinks.noResults")));return}const y=new Set($t(t).map(P=>`${P.entity_type}:${P.entity_id}`)),M=document.createElement("ul");M.className=l.entityLinkPickerList;const T=d.value;x.forEach(P=>{M.append(this.renderEntityLinkPickerResult({card:t,entityType:T,item:P,disabled:y.has(`${T}:${P.id}`),close:()=>a.remove()}))}),f.append(M)},D=async()=>{const y=++v;g="loading",L();try{if(x=await this.searchCardEntityCatalog(d.value,h.value),y!==v)return;g="ready",L()}catch{if(y!==v)return;x=[],g="error",L()}},$=()=>{N!==null&&window.clearTimeout(N),N=window.setTimeout(()=>{N=null,D()},180)};d.addEventListener("change",()=>{x=[],D()}),h.addEventListener("input",$),L(),this.entityCatalog&&(D(),h.focus())}createEntityLinkPickerMessage(t){const e=document.createElement("p");return e.className=l.entityLinksMessage,e.textContent=t,e}renderEntityLinkPickerResult(t){const e=document.createElement("li"),a=document.createElement("button");a.type="button",a.className=l.entityLinkPickerButton,a.disabled=t.disabled,a.setAttribute("data-testid","card-entity-link-result"),a.addEventListener("click",async()=>{a.disabled=!0,await Promise.resolve(this.handlers.onCreateCardEntityLink(t.card.id,t.entityType,t.item.id)),t.close(),await this.refreshOpenCardEntityLinks(t.card.id)});const o=q(Lt(t.entityType),{size:16});o.setAttribute("aria-hidden","true");const r=document.createElement("span");r.className=l.entityLinkContent;const n=document.createElement("span");n.className=l.entityLinkTitle,n.textContent=t.item.title;const s=document.createElement("span");return s.className=l.entityLinkMeta,s.textContent=t.item.status?`${this.runtime.i18n.t(xt(t.entityType))} - ${t.item.status}`:this.runtime.i18n.t(xt(t.entityType)),r.append(n,s),a.append(o,r),e.append(a),e}searchCardEntityCatalog(t,e){return this.entityCatalog?t==="task"?this.entityCatalog.searchTasks(e):t==="story"?this.entityCatalog.searchStories(e):this.entityCatalog.searchGoals(e):Promise.resolve([])}renderCardBackChecklistsSection(t){const e=document.createElement("div");return e.className=l.checklistsHost,e.setAttribute("data-testid","card-back-checklists-host"),this.cardModalChecklistHost=e,this.populateCardBackChecklistsHost(t),e}populateCardBackChecklistsHost(t){var n;const e=this.cardModalChecklistHost;if(!e)return;e.replaceChildren();const a=((n=this.cardChecklistPanelState)==null?void 0:n.cardId)===t.id?this.cardChecklistPanelState:null,o=!a||a.status==="idle"&&a.checklists.length===0||a.status==="ready"&&a.checklists.length===0&&!a.error;if(e.hidden=o,o)return;if((a==null?void 0:a.status)==="loading"){const s=this.createCardBackSection("check-box",this.runtime.i18n.t("boards.cardBack.checklist")),c=s.querySelector(`.${l.sectionMain}`),d=document.createElement("div");d.className=l.checklistsMessage,d.textContent=this.runtime.i18n.t("boards.cardBack.checklistsLoading"),c==null||c.append(d),e.append(s);return}if(a!=null&&a.error){const s=this.createCardBackSection("check-box",this.runtime.i18n.t("boards.cardBack.checklist")),c=s.querySelector(`.${l.sectionMain}`),d=jt({tone:"error"});d.show(this.runtime.i18n.t(a.error)),c==null||c.append(d.element),e.append(s)}const r=(a==null?void 0:a.checklists)??[];if(r.length>0){const s=document.createElement("div");s.className=l.checklistsList,r.forEach(c=>{s.append(this.renderCardChecklist(t,c))}),e.append(s)}}renderCardChecklist(t,e){const a=e.items.filter(v=>v.state==="complete").length,o=e.items.length,r=o===0?0:Math.round(a/o*100),n=this.hiddenCheckedChecklistIds.has(e.id),s=n?e.items.filter(v=>v.state!=="complete"):e.items,c=document.createElement("div");c.className=l.checklistActions,a>0&&c.append(C({text:n?this.runtime.i18n.t("boards.cardBack.showCheckedItems",{count:a}):this.runtime.i18n.t("boards.cardBack.hideCheckedItems"),tone:"text",size:"md",className:l.checklistActionButton,onClick:()=>this.toggleChecklistCheckedItems(t,e.id)}));const d=C({text:this.runtime.i18n.t("common.delete"),tone:"text",size:"md",className:l.checklistActionButton,onClick:()=>this.deleteCardModalChecklist(t.id,e.id)});d.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.deleteChecklist",{title:e.title})),c.append(d);const m=this.createCardBackSection("check-box",e.title,c);if(m.classList.add(l.checklist),m.setAttribute("data-testid","card-checklist"),!m.querySelector(`.${l.sectionMain}`))return m;const b=document.createElement("div");b.className=l.checklistProgressRow;const h=document.createElement("span");h.className=l.checklistProgress,h.textContent=`${r}%`;const f=document.createElement("div");f.className=l.checklistProgressTrack;const g=document.createElement("span");g.className=l.checklistProgressBar,g.style.width=`${r}%`,f.append(g),b.append(h,f);const x=document.createElement("ul");return x.className=l.checkItemList,s.forEach(v=>{x.append(this.renderCardChecklistItem(t,v))}),m.append(b),m.append(x,this.renderCheckItemComposer(t,e)),m}renderCardChecklistItem(t,e){const a=document.createElement("li");a.className=l.checkItem,a.setAttribute("data-testid","card-check-item");const o=new Be({checked:e.state==="complete",ariaLabel:e.title,className:l.checkItemCheckbox,onChange:s=>{this.patchCardModalCheckItem(t.id,e.id,{state:s?"complete":"incomplete"})}}),r=this.renderCardChecklistItemTitle(t,e),n=z({icon:"ellipsis-vertical",tone:"text",size:"sm",className:l.checkItemMenuTriggerButton,ariaLabel:this.runtime.i18n.t("boards.cardBack.checkItemActions",{title:e.title}),title:this.runtime.i18n.t("boards.cardBack.actions")});return n.setAttribute("aria-haspopup","dialog"),n.setAttribute("aria-expanded","false"),n.setAttribute("data-testid","card-check-item-menu-button"),n.addEventListener("click",s=>{var c;if(s.stopPropagation(),((c=this.cardCheckItemMenuPopover)==null?void 0:c.trigger)===n){this.closeCardCheckItemMenuPopover();return}this.openCardCheckItemMenuPopover(n,t,e)}),a.append(o.getElement(),r,n),a}openCardCheckItemMenuPopover(t,e,a){this.closeCardCheckItemMenuPopover();const o=G({elevated:!0,className:`${l.checkItemMenuPopover} hidden`});o.setAttribute("role","dialog"),o.setAttribute("aria-modal","false"),o.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.checkItemActions",{title:a.title})),o.setAttribute("data-testid","card-check-item-menu-popover"),o.addEventListener("mousedown",d=>d.stopPropagation());const r=document.createElement("ul");r.className=l.checkItemMenuList;const n=document.createElement("li");n.className=l.checkItemMenuItem;const s=C({text:this.runtime.i18n.t("common.delete"),tone:"text",size:"md",className:l.checkItemMenuButton,onClick:()=>{this.closeCardCheckItemMenuPopover(),this.deleteCardModalCheckItem(e.id,a.id)}});s.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.deleteCheckItem",{title:a.title})),Y(s,"trash"),n.append(s),r.append(n),o.append(r);let c;c=new U({container:t,panel:o,positioning:"viewport",panelZIndex:320,onOpenChange:d=>{var m;t.setAttribute("aria-expanded",d?"true":"false"),!d&&((m=this.cardCheckItemMenuPopover)==null?void 0:m.menu)===c&&this.closeCardCheckItemMenuPopover()}}),c.mount(),this.cardCheckItemMenuPopover={itemId:a.id,menu:c,panel:o,trigger:t},c.openAt({anchor:t,placement:"bottom-end",fallbackPlacements:["bottom-start","top-end","top-start"],gap:4,margin:12,lockPlacementAfterOpen:!0})}renderCardChecklistItemTitle(t,e){const a=document.createElement("button");return a.type="button",a.className=e.state==="complete"?l.checkItemTitleComplete:l.checkItemTitle,a.textContent=e.title,a.addEventListener("click",()=>{this.startCardChecklistItemTitleEdit(t,e,a)}),a}startCardChecklistItemTitleEdit(t,e,a){const o=document.createElement("input");o.type="text",o.className=l.checkItemTitleInput,o.value=e.title,o.setAttribute("aria-label",e.title);let r=!1;const n=()=>{a.isConnected||o.replaceWith(a)},s=()=>{if(r)return;r=!0;const d=o.value.trim();if(!d||d===e.title){n();return}this.patchCardModalCheckItem(t.id,e.id,{title:d})},c=()=>{r||(r=!0,n())};o.addEventListener("keydown",d=>{d.key==="Enter"&&(d.preventDefault(),s()),d.key==="Escape"&&(d.preventDefault(),c())}),o.addEventListener("blur",s),a.replaceWith(o),window.requestAnimationFrame(()=>{o.focus(),o.select()})}renderCheckItemComposer(t,e){if(!this.expandedCheckItemComposerIds.has(e.id))return C({text:this.runtime.i18n.t("boards.cardBack.checkItemPlaceholder"),tone:"text",size:"md",className:l.checkItemCollapsedComposer,onClick:()=>this.expandCheckItemComposer(t,e.id)});const a=document.createElement("form");a.className=l.checkItemComposer;const o=tt({variant:"default",className:l.checkItemComposerInput,placeholder:this.runtime.i18n.t("boards.cardBack.checkItemPlaceholder")});o.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.checkItemPlaceholder")),o.addEventListener("keydown",m=>{m.key==="Enter"&&(m.preventDefault(),a.requestSubmit()),m.key==="Escape"&&this.collapseCheckItemComposer(t,e.id)});const r=document.createElement("div");r.className=l.checkItemComposerActions;const n=document.createElement("div");n.className=l.checkItemComposerPrimaryActions;const s=C({text:this.runtime.i18n.t("boards.cardBack.addItem"),tone:"primary",size:"md",className:p.primaryButton});s.type="submit";const c=C({text:this.runtime.i18n.t("common.cancel"),tone:"text",size:"md",className:p.quietButton,onClick:()=>this.collapseCheckItemComposer(t,e.id)});c.type="button",n.append(s,c);const d=document.createElement("div");return d.className=l.checkItemComposerMetaActions,d.append(this.createCheckItemMetaButton("plus","boards.cardBack.assign"),this.createCheckItemMetaButton("calendar","boards.cardBack.dueDate")),r.append(n,d),a.addEventListener("submit",m=>{m.preventDefault(),this.createCardModalCheckItem(t.id,e.id,o.value)}),a.append(o,r),window.requestAnimationFrame(()=>o.focus()),a}createCheckItemMetaButton(t,e){const a=C({text:this.runtime.i18n.t(e),tone:"text",size:"md",className:l.checkItemMetaButton,disabled:!0});return Y(a,t),a}setCardChecklistPanelState(t){this.cardChecklistPanelState=t;const e=this.activeCardPlacementId&&this.state?this.findCardLocation(this.activeCardPlacementId,this.state):null;(e==null?void 0:e.card.id)===t.cardId&&this.populateCardBackChecklistsHost(e.card)}async loadCardModalChecklists(t){var a;const e=++this.cardChecklistLoadVersion;this.setCardChecklistPanelState({cardId:t,status:"loading",checklists:((a=this.cardChecklistPanelState)==null?void 0:a.cardId)===t?this.cardChecklistPanelState.checklists:[],error:null});try{const o=await Promise.resolve(this.handlers.onLoadCardChecklists(t));if(e!==this.cardChecklistLoadVersion||this.activeCardPlacementId===null)return;this.setCardChecklistPanelState({cardId:t,status:"ready",checklists:o,error:null})}catch{if(e!==this.cardChecklistLoadVersion)return;this.setCardChecklistPanelState({cardId:t,status:"error",checklists:[],error:"boards.cardBack.checklistsLoadFailed"})}}focusCardChecklistComposer(){var e;const t=(e=this.cardChecklistPopover)==null?void 0:e.panel.querySelector("input");t==null||t.focus()}toggleChecklistCheckedItems(t,e){this.hiddenCheckedChecklistIds.has(e)?this.hiddenCheckedChecklistIds.delete(e):this.hiddenCheckedChecklistIds.add(e),this.populateCardBackChecklistsHost(t)}expandCheckItemComposer(t,e){this.expandedCheckItemComposerIds.add(e),this.populateCardBackChecklistsHost(t)}collapseCheckItemComposer(t,e){this.expandedCheckItemComposerIds.delete(e),this.populateCardBackChecklistsHost(t)}async createCardModalChecklist(t,e){const a=(e==null?void 0:e.trim())??"";if(!a){this.focusCardChecklistComposer();return}await this.runCardChecklistMutation(t.id,async()=>{await Promise.resolve(this.handlers.onCreateCardChecklist(t.id,a))}),this.closeCardChecklistPopover()}async deleteCardModalChecklist(t,e){await this.runCardChecklistMutation(t,async()=>{await Promise.resolve(this.handlers.onDeleteCardChecklist(e))})}async createCardModalCheckItem(t,e,a){const o=a.trim();o&&(await this.runCardChecklistMutation(t,async()=>{await Promise.resolve(this.handlers.onCreateCardCheckItem(e,o))}),this.expandedCheckItemComposerIds.delete(e))}async patchCardModalCheckItem(t,e,a){await this.runCardChecklistMutation(t,async()=>{await Promise.resolve(this.handlers.onPatchCardCheckItem(e,a))})}async deleteCardModalCheckItem(t,e){await this.runCardChecklistMutation(t,async()=>{await Promise.resolve(this.handlers.onDeleteCardCheckItem(e))})}async runCardChecklistMutation(t,e){const a=this.cardChecklistPanelState;this.setCardChecklistPanelState({cardId:t,status:"saving",checklists:(a==null?void 0:a.cardId)===t?a.checklists:[],error:null});try{await e(),await this.loadCardModalChecklists(t)}catch{this.setCardChecklistPanelState({cardId:t,status:"error",checklists:(a==null?void 0:a.cardId)===t?a.checklists:[],error:"boards.cardBack.checklistsSaveFailed"})}}renderCardBackDescriptionSection(t,e,a){const o=this.createCardBackSection("document",this.runtime.i18n.t("boards.cardDescriptionLabel")),r=o.querySelector(`.${l.sectionMain}`);if(!r)return o;r.append(a);const n=document.createElement("div");n.className=l.editorActions;const s=C({text:this.runtime.i18n.t("common.save"),tone:"primary",size:"md",className:p.primaryButton,onClick:()=>this.saveCardModal(t,e,a)}),c=()=>{s.disabled=e.value.trim().length===0};return e.addEventListener("input",c),c(),n.append(C({text:this.runtime.i18n.t("common.cancel"),tone:"text",size:"md",className:p.quietButton,onClick:()=>this.closeCardModal()}),s),r.append(n),o}async deleteSharedCardFromQuickEditor(t){await this.deleteSharedCard(t,()=>this.closeQuickCardEditor())}async deleteSharedCardFromDetails(t){await this.deleteSharedCard(t,()=>{this.closeCardActionsPopover(),this.closeCardModal()})}async deleteSharedCard(t,e){await this.confirmSharedCardDeletion()&&(e(),this.handlers.onDeleteCard(t.id))}confirmSharedCardDeletion(){return this.openDeleteCardConfirmationDialog()}openDeleteCardConfirmationDialog(){return new Promise(t=>{let e=!1;const a=h=>{e||(e=!0,t(h))},o=()=>r.remove(),{overlay:r,container:n,body:s,footer:c}=ut(this.runtime.i18n.t("boards.actions.deleteCard"),{intent:"confirm",zIndex:360,onClose:()=>{a(!1),o()}}),d=document.createElement("p");d.className="text-sm leading-relaxed text-slate-600",d.id=`delete-card-confirm-message-${Math.random().toString(36).slice(2,9)}`,d.textContent=this.runtime.i18n.t("boards.cardMirror.deleteSharedConfirm"),n.setAttribute("aria-describedby",d.id),s.append(d);const m=Qt({variant:"confirm"}),u=C({text:this.runtime.i18n.t("common.cancel"),tone:"text",size:"md",className:bt("default"),onClick:()=>{a(!1),o()}});u.setAttribute("data-testid","delete-card-cancel-button"),m.append(u);const b=C({text:this.runtime.i18n.t("boards.actions.deleteCard"),tone:"destructive",size:"md",className:bt("wide"),onClick:()=>{a(!0),o()}});b.setAttribute("data-testid","delete-card-confirm-button"),m.append(b),c.append(m),n.addEventListener("keydown",h=>{h.stopPropagation(),h.key==="Escape"&&(h.preventDefault(),a(!1),o())})})}renderCardBackAttachmentsSection(){const t=this.createCardBackSection("link",this.runtime.i18n.t("boards.cardBack.attachments"),C({text:this.runtime.i18n.t("boards.cardBack.add"),tone:"text",size:"sm",className:p.quietButton,disabled:!0})),e=t.querySelector(`.${l.sectionMain}`);if(!e)return t;const a=document.createElement("div");return a.className=l.placeholderPanel,a.textContent=this.runtime.i18n.t("boards.cardBack.noAttachments"),e.append(a),t}renderCardBackAside(t,e){const a=document.createElement("aside");a.className=l.aside,a.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.comments"));const o=this.createCardBackSection("chat-bubble-left",this.runtime.i18n.t("boards.cardBack.comments"),C({text:this.runtime.i18n.t("boards.cardBack.showDetails"),tone:"text",size:"sm",className:p.quietButton,disabled:!0})),r=o.querySelector(`.${l.sectionMain}`);if(!r)return a;r.append(C({text:this.runtime.i18n.t("boards.cardBack.writeComment"),tone:"text",size:"md",className:l.activityInput,disabled:!0}));const n=document.createElement("ul");n.className=l.activityList;const s=document.createElement("li");s.className=l.activityItem;const c=document.createElement("span");c.className=l.avatar,c.textContent="M",c.setAttribute("aria-hidden","true");const d=document.createElement("span");return d.textContent=this.runtime.i18n.t("boards.cardBack.activityCreated",{board:t.title,column:e.title}),s.append(c,d),n.append(s),r.append(n),a.append(o),a}createCardBackSection(t,e,a){const o=document.createElement("section");o.className=l.section;const r=document.createElement("div");r.className=l.sectionIcon;const n=q(t,{size:20,strokeWidth:2});n.setAttribute("aria-hidden","true"),r.append(n);const s=document.createElement("div");s.className=l.sectionMain;const c=document.createElement("div");c.className=l.sectionHeader;const d=document.createElement("h3");d.className=l.sectionTitle,d.textContent=e;const m=document.createElement("div");return m.className=l.sectionActions,a&&m.append(a),c.append(d,m),s.append(c),o.append(r,s),o}createUnavailableCardBackButton(t,e){const a=C({text:this.runtime.i18n.t(t),tone:"text",size:"md",className:l.quickActionButton,disabled:!0});return Y(a,e),a}saveCardModal(t,e,a){const o=e.value.trim();if(!o)return;const r=a.value,n=this.getCardModalDraftTagIds(t),s={};o!==t.title&&(s.title=o),r!==t.description&&(s.description=r);const c=this.cardModalRequestedTagIds??et(t);de(n,c)||(s.tag_ids=n),this.closeCardModal(),(s.title!==void 0||s.description!==void 0||s.tag_ids!==void 0)&&this.handlers.onPatchCard(t.id,s)}closeCardModal(){var t;this.closeCardActionsPopover(),this.closeCardLabelsPopover(),this.closeCardChecklistPopover(),this.closeCardCheckItemMenuPopover(),this.closeMoveCardPopover(),this.cardModalDraftTagIds=null,this.cardModalRequestedTagIds=null,this.cardModalLabelsHost=null,this.cardModalQuickActionList=null,this.cardModalChecklistHost=null,this.cardChecklistPanelState=null,this.cardChecklistLoadVersion+=1,this.activeCardPlacementId=null,(t=this.cardModalOverlay)==null||t.remove(),this.cardModalOverlay=null}closeCardLabelsPopover(){const t=this.cardLabelsPopover;t&&(this.cardLabelsPopover=null,t.trigger.setAttribute("aria-expanded","false"),t.menu.close(),t.menu.unmount(),t.picker.destroy(),t.panel.remove())}closeCardChecklistPopover(){const t=this.cardChecklistPopover;t&&(this.cardChecklistPopover=null,t.trigger.setAttribute("aria-expanded","false"),t.menu.close(),t.menu.unmount(),t.panel.remove())}closeCardCheckItemMenuPopover(){const t=this.cardCheckItemMenuPopover;t&&(this.cardCheckItemMenuPopover=null,t.trigger.setAttribute("aria-expanded","false"),t.menu.close(),t.menu.unmount(),t.panel.remove())}closeCardEntityLinkMenuPopover(){const t=this.cardEntityLinkMenuPopover;t&&(this.cardEntityLinkMenuPopover=null,t.trigger.setAttribute("aria-expanded","false"),t.menu.close(),t.menu.unmount(),t.panel.remove())}closeMoveCardPopover(){const t=this.moveCardPopover;t&&(this.moveCardPopover=null,t.trigger.setAttribute("aria-expanded","false"),t.menu.close(),t.menu.unmount(),t.panel.remove())}closeCardActionsPopover(){const t=this.cardActionsPopover;t&&(this.cardActionsPopover=null,t.trigger.setAttribute("aria-expanded","false"),t.menu.close(),t.menu.unmount(),t.panel.remove())}closeListActionsPopover(){const t=this.listActionsPopover;t&&(this.listActionsPopover=null,t.trigger.setAttribute("aria-expanded","false"),t.menu.close(),t.menu.unmount(),t.panel.remove())}closeBoardPickerPopover(){const t=this.boardPickerPopover;t&&(this.closeBoardPickerActionsMenu(),this.boardPickerPopover=null,t.trigger.setAttribute("aria-expanded","false"),t.menu.close(),t.menu.unmount(),t.panel.remove())}closeBoardPickerActionsMenu(){var e;const t=(e=this.boardPickerPopover)==null?void 0:e.actionsMenu;t&&(this.boardPickerPopover.actionsMenu=null,t.menu.close(),t.menu.unmount(),t.panel.remove())}closeQuickCardEditor(){var t;(t=this.quickEditorOverlay)==null||t.remove(),this.quickEditorOverlay=null}getSelectedBoard(t){return t.boards.find(e=>e.id===t.selectedBoardId)??t.boards[0]??null}findCardLocation(t,e){for(const a of e.boards)for(const o of a.columns){const r=o.cards.find(n=>j(n)===t);if(r)return{board:a,column:o,card:r,placementId:t}}return null}submitColumnTitle(t){var a;const e=((a=this.columnTitleTextarea)==null?void 0:a.value.trim())??"";e&&(this.handlers.onCreateColumn(t,e),this.columnTitleTextarea&&(this.columnTitleTextarea.value=""),this.isColumnComposerExpanded=!1)}startBoardTitleEdit(t){this.editingBoardTitleId=t,this.rerenderCurrentState()}finishBoardTitleEdit(t,e){var o;if(this.editingBoardTitleId!==t.id)return;const a=((o=this.boardTitleEditInput)==null?void 0:o.value.trim())??"";if(this.editingBoardTitleId=null,this.boardTitleEditInput=null,e&&a.length>0&&a!==t.title){this.handlers.onPatchBoard(t.id,{title:a});return}this.rerenderCurrentState()}startColumnTitleEdit(t){this.editingColumnTitleId=t,this.rerenderCurrentState()}finishColumnTitleEdit(t,e){var o;if(this.editingColumnTitleId!==t.id)return;const a=((o=this.columnTitleEditInput)==null?void 0:o.value.trim())??"";if(this.editingColumnTitleId=null,this.columnTitleEditInput=null,e&&a.length>0&&a!==t.title){this.handlers.onPatchColumn(t.id,{title:a});return}this.rerenderCurrentState()}expandCardComposer(t){this.expandedCardComposerColumnId=t,this.rerenderCurrentState()}collapseCardComposer(){this.expandedCardComposerColumnId=null,this.rerenderCurrentState()}expandColumnComposer(){this.isColumnComposerExpanded=!0,this.rerenderCurrentState()}collapseColumnComposer(){this.isColumnComposerExpanded=!1,this.rerenderCurrentState()}submitCard(t){const e=this.cardDrafts.get(t);if(!e)return;const a=e.title.value.trim();a&&(this.handlers.onCreateCard(t,a,""),e.title.value="",this.expandedCardComposerColumnId=null,this.rerenderCurrentState())}rerenderCurrentState(){this.state&&this.render(this.state)}unmountHeaderMenu(){var t;(t=this.headerMenu)==null||t.unmount(),this.headerMenu=null}}function Mt(i){return{id:i.uuid??String(i.id),title:i.title,status:i.status??null}}function St(i){return(i==null?void 0:i.trim())??""}class mo{constructor(t={}){this.root=null,this.store=null,this.view=null,this.subscriptions=new Yt,this.runtime=t.runtime??zt()}mount(t){if(this.root)return;const e=document.createElement("div");e.dataset.module="boards",e.className="h-full w-full",t.appendChild(e),this.root=e;const a=new Le(Me.apiUrl),o=new Se(a),r=new Te(a),n=new Ne(a),s=new Na(new Fe(a)),c=new lo(e,{runtime:this.runtime,tagCatalog:{loadTags:()=>k(o.getTags()),createTag:(d,m)=>k(o.createTag({title:d,color:m??De(d)})),updateTag:(d,m)=>k(o.updateTag(d,m)),deleteTag:async d=>{await k(o.deleteTag(d))}},entityCatalog:{searchTasks:async d=>(await k(o.fetchTasks({search:d,page:1,pageSize:20}))).results.map(Mt),searchStories:async d=>(await k(r.fetchStories({search:d,page:1,pageSize:20}))).results.map(Mt),searchGoals:async d=>(await k(n.searchGoalsForPicker({search:d,page:1,pageSize:20}))).results.map(Mt)},handlers:{onRefresh:()=>void s.load(),onSelectBoard:d=>s.selectBoard(d),onCreateBoard:d=>void s.createBoard(d),onPatchBoard:(d,m)=>void s.patchBoard(d,m),onToggleBoardStar:d=>s.toggleBoardStar(d),onUpdateBoardGroup:(d,m)=>s.updateBoardGroup(d,m),onDeleteBoard:d=>void s.deleteBoard(d),onCreateColumn:(d,m)=>void s.createColumn(d,m),onPatchColumn:(d,m)=>void s.patchColumn(d,m),onDeleteColumn:d=>void s.deleteColumn(d),onCreateCard:(d,m,u)=>void s.createCard(d,m,u),onPatchCard:(d,m)=>void s.patchCard(d,m),onLoadCardChecklists:d=>s.loadCardChecklists(d),onCreateCardChecklist:(d,m)=>s.createCardChecklist(d,m),onDeleteCardChecklist:d=>s.deleteCardChecklist(d),onCreateCardCheckItem:(d,m)=>s.createCardCheckItem(d,m),onPatchCardCheckItem:(d,m)=>s.patchCardCheckItem(d,m),onDeleteCardCheckItem:d=>s.deleteCardCheckItem(d),onCreateCardEntityLink:(d,m,u)=>s.createCardEntityLink(d,m,u),onCreateCardEntityFromCard:async(d,m)=>{if(m==="task"){const b=await k(o.createTask({title:d.title.trim(),description:St(d.description),is_standalone:!0}));return s.createCardEntityLink(d.id,m,b.uuid??String(b.id))}if(m==="story"){const b=await k(r.createStory({title:d.title.trim(),description:St(d.description)}));return s.createCardEntityLink(d.id,m,b.uuid??String(b.id))}const u=await k(n.createGoal({title:d.title.trim(),description:St(d.description)}));return s.createCardEntityLink(d.id,m,u.uuid??String(u.id))},onDeleteCardEntityLink:d=>s.deleteCardEntityLink(d),onDeleteLinkedEntity:async(d,m)=>{m.entity_type==="task"?await k(o.deleteTask(m.entity_id)):m.entity_type==="story"?await k(r.deleteStory(m.entity_id)):await k(n.deleteGoal(m.entity_id)),await s.load()},onCreateCardMirror:(d,m,u)=>void s.createCardMirror(d,m,u),onPatchCardPlacement:(d,m)=>void s.patchCardPlacement(d,m),onDeleteCardPlacement:d=>void s.deleteCardPlacement(d),onDeleteCard:d=>void s.deleteCard(d),onPreviewImport:d=>s.previewImport(d),onExportData:d=>s.exportData(d),onApplyImport:d=>s.applyImport(d)}});this.store=s,this.view=c,this.subscriptions.add(s.state$.subscribe(d=>c.render(d))),s.load()}unmount(){var t,e,a;this.subscriptions.unsubscribe(),this.subscriptions=new Yt,(t=this.view)==null||t.destroy(),this.view=null,(e=this.store)==null||e.destroy(),this.store=null,(a=this.root)==null||a.remove(),this.root=null}}class bo{constructor(t={}){this.id="boards",this.app=null,this.runtime=t.runtime??zt()}mount(t){if(this.app)return;const e=new mo({runtime:this.runtime});e.mount(t),this.app=e}unmount(){var t;(t=this.app)==null||t.unmount(),this.app=null}getAiAssistantSnapshot(){return null}}export{bo as BoardsModule};
