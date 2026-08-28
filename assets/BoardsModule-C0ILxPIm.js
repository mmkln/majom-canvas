import{m as Wt,B as Se,g as k,k as wt,l as Te,p as Qt,q as Nt,n as X,r as fe,u as jt,v as q,w as Ft,x as tt,y as $,z as De,A as K,D as W,E as Et,F as Ne,G as Re,I as j,J as qe,L as Oe,C as $e,d as Yt,H as ze,e as Fe,M as Ke,N as He,T as Ge,O as Ue}from"./index-CzaUTAZQ.js";import{r as We}from"./renderInlineComposer-5hC2yVu5.js";function Xt(i){return Array.isArray(i)?i:i.results}function T(i){return encodeURIComponent(String(i))}function Qe(i={}){const t=[];return i.card&&t.push(`card=${encodeURIComponent(i.card)}`),i.entity_type&&t.push(`entity_type=${encodeURIComponent(i.entity_type)}`),i.entity_id&&t.push(`entity_id=${encodeURIComponent(i.entity_id)}`),t.length?`?${t.join("&")}`:""}class Ye{constructor(t){this.http=t}getBoards(){return this.http.get("/boards/").pipe(Wt(Xt))}createBoard(t){return this.http.post("/boards/",t)}updateBoard(t,e){return this.http.patch(`/boards/${T(t)}/`,e)}deleteBoard(t){return this.http.delete(`/boards/${T(t)}/`)}createColumn(t){return this.http.post("/columns/",t)}updateColumn(t,e){return this.http.patch(`/columns/${T(t)}/`,e)}deleteColumn(t){return this.http.delete(`/columns/${T(t)}/`)}createCard(t){return this.http.post("/cards/",t)}updateCard(t,e){return this.http.patch(`/cards/${T(t)}/`,e)}deleteCard(t){return this.http.delete(`/cards/${T(t)}/`)}getCardChecklists(t){return this.http.get(`/cards/${T(t)}/checklists/`)}createCardChecklist(t,e){return this.http.post(`/cards/${T(t)}/checklists/`,e)}updateCardChecklist(t,e){return this.http.patch(`/card-checklists/${T(t)}/`,e)}deleteCardChecklist(t){return this.http.delete(`/card-checklists/${T(t)}/`)}createCardCheckItem(t,e){return this.http.post(`/card-checklists/${T(t)}/items/`,e)}updateCardCheckItem(t,e){return this.http.patch(`/card-check-items/${T(t)}/`,e)}deleteCardCheckItem(t){return this.http.delete(`/card-check-items/${T(t)}/`)}getCardEntityLinks(t={}){return this.http.get(`/card-entity-links/${Qe(t)}`).pipe(Wt(Xt))}createCardEntityLink(t){return this.http.post("/card-entity-links/",t)}deleteCardEntityLink(t){return this.http.delete(`/card-entity-links/${T(t)}/`)}createCardPlacement(t){return this.http.post("/card-placements/",t)}updateCardPlacement(t,e){return this.http.patch(`/card-placements/${T(t)}/`,e)}deleteCardPlacement(t){return this.http.delete(`/card-placements/${T(t)}/`)}}function y(i){return i.placement_id??i.id}function Vt(i){const t=i.pos??i.order??0,e=Number(t);return Number.isFinite(e)?e:0}function Xe(i,t){return Vt(i)-Vt(t)||y(i).localeCompare(y(t))||i.id.localeCompare(t.id)}const Rt="boards-session-selected-board";function ge(i){if(typeof i!="string")return null;const t=i.trim();return t.length>0?t:null}function Jt(i,t){return t!==null&&i.some(e=>e.id===t)}function Ve(){try{return ge(sessionStorage.getItem(Rt))}catch{return null}}function Zt(i){try{const t=ge(i);if(t){sessionStorage.setItem(Rt,t);return}sessionStorage.removeItem(Rt)}catch{}}function Je(i,t){var r;if(Jt(i,t))return t;const e=Ve();return Jt(i,e)?e:((r=i[0])==null?void 0:r.id)??null}const Ze=["lastOpenedAt","last_opened_at","lastActivityAt","last_activity_at","updatedAt","updated_at","createdAt","created_at"];function Pt(i){const t=i.meta;return t&&typeof t=="object"&&!Array.isArray(t)?t:null}function Kt(i){return{...Pt(i)??{}}}function tr(i,t){const e=Pt(i);if(!e)return!1;for(const r of t){const a=e[r];if(typeof a=="boolean")return a}return!1}function yt(i){return tr(i,["favorite","favourite","starred"])}function At(i){const t=Pt(i);if(!t)return null;for(const e of Ze){const r=t[e],a=typeof r=="string"||typeof r=="number"?new Date(r).getTime():null;if(typeof a=="number"&&Number.isFinite(a))return a}return null}function qt(i){const t=Pt(i);if(!t)return null;const e=t.group;if(e&&typeof e=="object"&&!Array.isArray(e)){const o=e,n=typeof o.id=="string"?o.id.trim():"",s=typeof o.name=="string"?o.name.trim():"";if(n||s)return{id:n||s,name:s||n}}const r=typeof t.groupId=="string"?t.groupId.trim():typeof t.group_id=="string"?t.group_id.trim():"",a=typeof t.groupName=="string"?t.groupName.trim():typeof t.group_name=="string"?t.group_name.trim():"";return!r&&!a?null:{id:r||a,name:a||r}}function er(i,t){return{...Kt(i),favorite:t}}function rr(i,t){return{...Kt(i),lastOpenedAt:t}}function ar(i,t){const e=Kt(i);if(!t)return delete e.group,delete e.groupId,delete e.groupName,delete e.group_id,delete e.group_name,e;const r=t.id.trim()||t.name.trim(),a=t.name.trim()||t.id.trim();return e.group={id:r,name:a},e.groupId=r,e.groupName=a,e.group_id=r,e.group_name=a,e}function Ot(i){const t=new Map;return i.forEach(e=>{const r=qt(e);!r||t.has(r.id)||t.set(r.id,r)}),Array.from(t.values()).sort((e,r)=>e.name.localeCompare(r.name))}function or(i,t){const r=i.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"group",a=new Set(Ot(t).map(s=>s.id));if(!a.has(r))return r;let o=2,n=`${r}-${o}`;for(;a.has(n);)o+=1,n=`${r}-${o}`;return n}function Ht(){return{cards:{},placements:{},columns:{},resolved:{cards:{},placements:{},columns:{}}}}function ir(i,t){return{...i,...t.title!==void 0?{title:t.title}:{},...t.order!==void 0?{order:t.order}:{}}}function nr(i,t){return{...i,...t.title!==void 0?{title:t.title}:{},...t.description!==void 0?{description:t.description}:{},...t.completedAt!==void 0?{completedAt:t.completedAt}:{},...t.tag_ids!==void 0?{tag_ids:t.tag_ids}:{}}}function sr(i){return i.before_column!==void 0||i.after_column!==void 0||i.position!==void 0}function dr(i,t,e){if(e.position==="start")return[t,...i];if(e.position==="end")return[...i,t];const r=e.before_column?i.findIndex(o=>o.id===e.before_column):-1;if(r>=0)return[...i.slice(0,r+1),t,...i.slice(r+1)];const a=e.after_column?i.findIndex(o=>o.id===e.after_column):-1;return a>=0?[...i.slice(0,a),t,...i.slice(a)]:[...i,t]}function cr(i,t){const e=i.columns.find(o=>o.id===t.columnId);if(!e)return i;const r=ir(e,t.patch);if(!sr(t.patch))return{...i,columns:i.columns.map(o=>o.id===t.columnId?r:o)};const a=i.columns.filter(o=>o.id!==t.columnId);return{...i,columns:dr(a,r,t.patch)}}function lr(i,t,e){if(e.position==="top")return[t,...i];if(e.position==="bottom")return[...i,t];const r=e.before_placement?i.findIndex(o=>y(o)===e.before_placement):-1;if(r>=0)return[...i.slice(0,r+1),t,...i.slice(r+1)];const a=e.after_placement?i.findIndex(o=>y(o)===e.after_placement):-1;return a>=0?[...i.slice(0,a),t,...i.slice(a)]:[...i,t]}function mr(i,t){for(const e of i)for(const r of e.columns){const a=r.cards.find(o=>y(o)===t);if(a)return a}return null}function ke(i,t){return i.map(e=>({...e,columns:e.columns.map(r=>({...r,cards:r.cards.filter(a=>y(a)!==t)}))}))}function ur(i,t,e){if(e.archived===!0)return ke(i,t);const r=mr(i,t);if(!r)return i;const a=e.column??r.column;return i.map(o=>({...o,columns:o.columns.map(n=>{const s=n.cards.filter(d=>y(d)!==t);return n.id!==a?{...n,cards:s}:{...n,cards:lr(s,r,e).map(d=>y(d)===t?{...d,column:a}:d)}})}))}function pr(i,t){return i.map(e=>({...e,columns:e.columns.map(r=>({...r,cards:r.cards.filter(a=>a.id!==t)}))}))}function hr(i,t){return i.map(e=>({...e,columns:e.columns.filter(r=>r.id!==t)}))}function br(i,t){return t.type==="create-column"?i.map(e=>e.id===t.boardId?{...e,columns:[...e.columns,t.column]}:e):t.type==="patch-column"?i.map(e=>cr(e,t)):t.type==="delete-column"?hr(i,t.columnId):t.type==="create-card"?i.map(e=>({...e,columns:e.columns.map(r=>r.id===t.columnId?{...r,cards:[...r.cards,t.card]}:r)})):t.type==="patch-card-placement"?ur(i,t.placementId,t.patch):t.type==="delete-card-placement"?ke(i,t.placementId):t.type==="delete-card"?pr(i,t.cardId):i.map(e=>({...e,columns:e.columns.map(r=>({...r,cards:r.cards.map(a=>a.id===t.cardId?nr(a,t.patch):a)}))}))}function fr(i,t){return t.length===0?i:t.reduce((e,r)=>br(e,r),i)}function gr(i,t={cards:{},placements:{},columns:{}}){const e=Ht();return e.resolved={cards:{...t.cards},placements:{...t.placements},columns:{...t.columns}},i.forEach(r=>{if(r.type==="create-column"){e.columns[r.column.id]="creating";return}if(r.type==="delete-column"){e.columns[r.columnId]="deleting";return}if(r.type==="patch-column"){e.columns[r.columnId]="saving";return}if(r.type==="create-card"){e.cards[r.card.id]="creating",e.placements[y(r.card)]="creating";return}if(r.type==="delete-card"){e.cards[r.cardId]="deleting";return}if(r.type==="patch-card"){e.cards[r.cardId]="saving";return}if(r.type==="delete-card-placement"){e.placements[r.placementId]="deleting";return}r.type==="patch-card-placement"&&(e.placements[r.placementId]=r.patch.archived?"deleting":"saving")}),e}const at="majom.boards.exchange",ot="1.0";function kr(){return{mode:"merge",missingFieldPolicy:"keep_existing",matchStrategy:"title",unknownFieldPolicy:"warn_and_ignore"}}const Cr=new Set(["schema","version","scope","title","id","exportedAt"]);function _r(i){var n;const t=i.replace(/\r\n/g,`
`).split(`
`);if(((n=t[0])==null?void 0:n.trim())!=="---")return{fields:{},body:i,diagnostics:[]};const e=t.findIndex((s,d)=>d>0&&s.trim()==="---");if(e<0)return{fields:{},body:i,diagnostics:[{level:"warning",code:"markdown_front_matter_unclosed",message:"Markdown front matter was not closed and was ignored.",path:"frontMatter"}]};const r=t.slice(1,e),a={},o=[];for(const s of r){const d=s.indexOf(":");if(d<0)continue;const c=s.slice(0,d).trim(),u=s.slice(d+1).trim().replace(/^"|"$/g,"");c&&(a[c]=u,Cr.has(c)||o.push({level:"warning",code:"unknown_front_matter_field",message:`Unknown front matter field "${c}" will be ignored.`,path:`frontMatter.${c}`}))}return{fields:a,body:t.slice(e+1).join(`
`),diagnostics:o}}function J(i,t,e,r){if(i===void 0)return r.push({level:"warning",code:"missing_title",message:`Missing title at ${e}; using "${t}".`,path:e}),t;const a=i.trim();return a||(r.push({level:"warning",code:"empty_title",message:`Empty title at ${e}; using "${t}".`,path:e}),t)}function vr(i,t){var n;const r=(((n=i[t])==null?void 0:n.trim())??"").replace(/^Description:\s*/i,"").trim();if(r)return r;const a=[];for(let s=t+1;s<i.length;s+=1){const d=i[s]??"";if(/^#{1,6}\s/.test(d)||/^[A-Za-z][A-Za-z0-9 _-]*:\s*/.test(d))break;a.push(d)}return a.join(`
`).trim()||void 0}function te(i,t,e,r){let a;const o=[];let n=null;const s=Math.max(t+1,0);for(let d=s;d<i.length;d+=1){const c=i[d]??"",u=c.trim();if(/^##\s+Column:/.test(c)||/^###\s+Card:/.test(c))break;if(!u)continue;if(/^Description:/i.test(u)){a=vr(i,d),n=null;continue}const b=/^Checklist:\s*(.*)$/i.exec(u);if(b){const p=o.length;n={title:J(b[1],"Checklist",`${e}.checklists[${p}].title`,r),items:[]},o.push(n);continue}const m=/^-\s*\[( |x|X)\]\s*(.*)$/.exec(u);if(m){n||(n={title:"Checklist",items:[]},o.push(n),r.push({level:"warning",code:"check_item_without_checklist",message:'A checklist item appeared before any checklist title; using "Checklist".',path:`${e}.checklists[${o.length-1}]`}));const p=n.items.length;n.items.push({title:J(m[2],"Untitled item",`${e}.checklists[${o.length-1}].items[${p}].title`,r),state:m[1].toLowerCase()==="x"?"complete":"incomplete"})}}return{...a?{description:a}:{},...o.length>0?{checklists:o}:{}}}function Bt(i,t){return{schema:at,version:ot,format:"markdown",scope:i,exportedAt:new Date().toISOString(),payload:t}}function xr(i,t){const e=_r(i),r=e.body.replace(/\r\n/g,`
`).split(`
`),a=[...e.diagnostics];if(t==="card"){const d=r.findIndex(m=>m.startsWith("### Card:")||m.startsWith("# Card:")),c=d>=0?r[d]:void 0,u=J(c==null?void 0:c.replace(/^#{1,3}\s*Card:/,""),"Untitled card","payload.title",a),b=te(r,d>=0?d:-1,"payload",a);return{envelope:Bt(t,{...e.fields.id?{id:e.fields.id}:{},title:u,...b}),diagnostics:a}}const o=[];let n=null;for(const[d,c]of r.entries()){if(c.startsWith("## Column:")){n={title:J(c.replace("## Column:",""),"Untitled column",`payload.columns[${o.length}].title`,a),cards:[]},o.push(n);continue}if(c.startsWith("### Card:")){n||(n={title:"Imported",cards:[]},o.push(n),a.push({level:"warning",code:"card_without_column",message:'A card heading appeared before any column; using "Imported".',path:`body.line${d+1}`}));const u=Math.max(o.length-1,0),b=n.cards.length,m=J(c.replace("### Card:",""),"Untitled card",`payload.columns[${u}].cards[${b}].title`,a),p=te(r,d,`payload.columns[${u}].cards[${b}]`,a);n.cards.push({title:m,...p})}}if(t==="column"){const d=o[0]??{title:J(e.fields.title,"Untitled column","payload.title",a),cards:[]};return{envelope:Bt(t,d),diagnostics:a}}const s={...e.fields.id?{id:e.fields.id}:{},title:J(e.fields.title,"Untitled board","payload.title",a),columns:o};return{envelope:Bt(t,s),diagnostics:a}}function yr(i,t=[]){return{scope:i,canApply:t.every(e=>e.level!=="error"),counts:{create:0,update:0,skip:0,conflict:0},items:[],diagnostics:t,warnings:t.filter(e=>e.level==="warning").map(e=>e.message),errors:t.filter(e=>e.level==="error").map(e=>e.message)}}const ht={board:new Set(["id","title","columns"]),column:new Set(["id","title","cards"]),card:new Set(["id","title","description","checklists"]),checklist:new Set(["id","title","items"]),checkItem:new Set(["id","title","state"])},wr=new Set(["complete","incomplete"]);function st(i){return typeof i=="object"&&i!==null&&!Array.isArray(i)}function jr(i,t,e,r,a){i.push({level:t.policies.unknownFieldPolicy==="strict_error"?"error":"warning",code:e,message:r,...a?{path:a}:{}})}function Pr(i,t,e){return i.push({level:"warning",code:"missing_title",message:`Missing title at ${t}; using "${e}".`,path:t}),e}function bt(i,t,e,r){if(typeof i!="string")return Pr(r,e,t);const a=i.trim();return a||(r.push({level:"warning",code:"empty_title",message:`Empty title at ${e}; using "${t}".`,path:e}),t)}function ft(i,t,e,r,a){for(const o of Object.keys(i))t.has(o)||jr(a,r,"unknown_payload_field",`Unknown payload field "${o}" will be ignored.`,`${e}.${o}`)}function Ce(i,t,e,r){if(!st(i))return r.push({level:"error",code:"invalid_card_payload",message:`Card payload at ${t} must be an object.`,path:t}),{title:"Untitled card"};ft(i,ht.card,t,e,r);const a=Array.isArray(i.checklists)?i.checklists:[];i.checklists!==void 0&&!Array.isArray(i.checklists)&&r.push({level:"warning",code:"invalid_checklists_field",message:`Checklists at ${t}.checklists must be an array and were ignored.`,path:`${t}.checklists`});const o=a.map((n,s)=>Ir(n,`${t}.checklists[${s}]`,e,r));return{...typeof i.id=="string"?{id:i.id}:{},title:bt(i.title,"Untitled card",`${t}.title`,r),...typeof i.description=="string"?{description:i.description}:{},...o.length>0?{checklists:o}:{}}}function Ir(i,t,e,r){if(!st(i))return r.push({level:"error",code:"invalid_checklist_payload",message:`Checklist payload at ${t} must be an object.`,path:t}),{title:"Checklist",items:[]};ft(i,ht.checklist,t,e,r);const a=Array.isArray(i.items)?i.items:[];return i.items!==void 0&&!Array.isArray(i.items)&&r.push({level:"warning",code:"invalid_check_items_field",message:`Checklist items at ${t}.items must be an array and were ignored.`,path:`${t}.items`}),{...typeof i.id=="string"?{id:i.id}:{},title:bt(i.title,"Checklist",`${t}.title`,r),items:a.map((o,n)=>Er(o,`${t}.items[${n}]`,e,r))}}function Er(i,t,e,r){if(!st(i))return r.push({level:"error",code:"invalid_check_item_payload",message:`Checklist item payload at ${t} must be an object.`,path:t}),{title:"Untitled item",state:"incomplete"};ft(i,ht.checkItem,t,e,r);const a=typeof i.state=="string"&&wr.has(i.state)?i.state:"incomplete";return i.state!==void 0&&a!==i.state&&r.push({level:"warning",code:"invalid_check_item_state",message:`Checklist item state at ${t}.state must be "complete" or "incomplete"; using "incomplete".`,path:`${t}.state`}),{...typeof i.id=="string"?{id:i.id}:{},title:bt(i.title,"Untitled item",`${t}.title`,r),state:a}}function _e(i,t,e,r){if(!st(i))return r.push({level:"error",code:"invalid_column_payload",message:`Column payload at ${t} must be an object.`,path:t}),{title:"Untitled column",cards:[]};ft(i,ht.column,t,e,r);const a=Array.isArray(i.cards)?i.cards:[];return i.cards!==void 0&&!Array.isArray(i.cards)&&r.push({level:"warning",code:"invalid_cards_field",message:`Cards at ${t}.cards must be an array and were ignored.`,path:`${t}.cards`}),{...typeof i.id=="string"?{id:i.id}:{},title:bt(i.title,"Untitled column",`${t}.title`,r),cards:a.map((o,n)=>Ce(o,`${t}.cards[${n}]`,e,r))}}function Ar(i,t,e,r){if(!st(i))return r.push({level:"error",code:"invalid_board_payload",message:`Board payload at ${t} must be an object.`,path:t}),{title:"Untitled board",columns:[]};ft(i,ht.board,t,e,r);const a=Array.isArray(i.columns)?i.columns:[];return i.columns!==void 0&&!Array.isArray(i.columns)&&r.push({level:"warning",code:"invalid_columns_field",message:`Columns at ${t}.columns must be an array and were ignored.`,path:`${t}.columns`}),{...typeof i.id=="string"?{id:i.id}:{},title:bt(i.title,"Untitled board",`${t}.title`,r),columns:a.map((o,n)=>_e(o,`${t}.columns[${n}]`,e,r))}}function Br(i,t){return{schema:at,version:ot,format:i.format,scope:i.scope,exportedAt:new Date().toISOString(),payload:t}}function Lr(i){const t=[];let e;try{e=JSON.parse(i.raw)}catch{return{envelope:null,diagnostics:[{level:"error",code:"invalid_json",message:"Import source is not valid JSON.",path:"source"}]}}if(!st(e))return{envelope:null,diagnostics:[{level:"error",code:"invalid_json_root",message:"JSON import root must be an object.",path:"source"}]};const r="payload"in e?e.payload:e;"payload"in e||t.push({level:"warning",code:"missing_envelope",message:"JSON import has no exchange envelope; treating root as payload.",path:"source"}),e.schema!==void 0&&e.schema!==at&&t.push({level:"error",code:"schema_mismatch",message:"JSON import schema is not supported.",path:"schema"}),e.version!==void 0&&e.version!==ot&&t.push({level:"error",code:"version_mismatch",message:"JSON import version is not supported.",path:"version"}),e.scope!==void 0&&e.scope!==i.scope&&t.push({level:"error",code:"scope_mismatch",message:`JSON import scope "${String(e.scope)}" does not match "${i.scope}".`,path:"scope"});const a=i.scope==="board"?Ar(r,"payload",i,t):i.scope==="column"?_e(r,"payload",i,t):Ce(r,"payload",i,t);return{envelope:Br(i,a),diagnostics:t}}function ve(i){if(i.format==="markdown"){const t=xr(i.raw,i.scope);return i.policies.unknownFieldPolicy!=="strict_error"?t:{...t,diagnostics:t.diagnostics.map(e=>e.code.startsWith("unknown_")?{...e,level:"error"}:e)}}return Lr(i)}function O(i,t){i.items.push(t),i.counts[t.action]+=1,t.action==="conflict"&&(i.canApply=!1)}function Mr(i,t){const e=i.trim().toLowerCase();return t.filter(r=>r.title.trim().toLowerCase()===e)}function Q(i){return Object.entries(i).filter(([,t])=>t!==void 0).map(([t])=>t)}function Lt(i){const t=[];for(const e of i)for(const r of e.columns??[])t.push(...r.cards??[]);return t}function Sr(i){const t=[];for(const e of i)t.push(...e.columns??[]);return t}function ee(i,t,e){O(i,{action:"create",entity:"card",title:t.title,path:e,reason:"card-import",source:{...t.id?{id:t.id}:{},explicitFields:Q(t)}});for(const[r,a]of(t.checklists??[]).entries()){const o=`${e}.checklists[${r}]`;O(i,{action:"create",entity:"checklist",title:a.title,path:o,reason:"checklist-import",source:{...a.id?{id:a.id}:{},explicitFields:Q(a)}});for(const[n,s]of(a.items??[]).entries())O(i,{action:"create",entity:"checkItem",title:s.title,path:`${o}.items[${n}]`,reason:"check-item-import",source:{...s.id?{id:s.id}:{},explicitFields:Q(s)}})}}function Tr(i,t){for(const e of i){const r=(e.columns??[]).find(a=>a.id===t);if(r)return r}return null}function re(i,t,e,r,a){const o=Mr(i,t);return o.length>1?(O(a,{action:"conflict",entity:e,title:i,path:r,reason:"ambiguous-title-match"}),null):o[0]??null}function Mt(i,t,e){return t.policies.mode==="create"?"create":e?"update":t.policies.mode==="replace"?(O(i,{action:"conflict",entity:t.scope,title:"Import target",path:"target",reason:"replace-target-not-found"}),null):"create"}function Dr(i,t){var s,d,c;const e=ve(t),r=yr(t.scope,e.diagnostics);if(!e.envelope||r.errors.length>0)return O(r,{action:"conflict",entity:t.scope,title:"Import source",path:"source",reason:"invalid-source"}),r;if(t.scope==="board"){const u=e.envelope.payload,b=u.id!==void 0?i.find(p=>p.id===u.id)??null:t.policies.matchStrategy==="title"?re(u.title,i,"board","payload",r):null;if(r.counts.conflict>0)return r;const m=Mt(r,t,b);if(!m)return r;O(r,{action:m,entity:"board",title:u.title,path:"payload",reason:b?"matched-by-title":"new-board",...b?{targetId:b.id}:{},source:{...u.id?{id:u.id}:{},explicitFields:Q(u)}});for(const[p,f]of(u.columns??[]).entries()){O(r,{action:"create",entity:"column",title:f.title,path:`payload.columns[${p}]`,reason:"column-import",source:{...f.id?{id:f.id}:{},explicitFields:Q(f)}});for(const[g,P]of(f.cards??[]).entries())ee(r,P,`payload.columns[${p}].cards[${g}]`)}return r}if(t.scope==="column"){const u=e.envelope.payload;if((s=t.target)!=null&&s.boardId&&!i.some(f=>{var g;return f.id===((g=t.target)==null?void 0:g.boardId)}))return O(r,{action:"conflict",entity:"board",title:t.target.boardId,path:"target.boardId",reason:"target-board-not-found"}),r;const b=u.id!==void 0?Sr(i).find(p=>p.id===u.id)??null:null,m=Mt(r,t,b);if(!m)return r;O(r,{action:m,entity:"column",title:u.title,path:"payload",reason:"column-import",...b?{targetId:b.id}:{},source:{...u.id?{id:u.id}:{},explicitFields:Q(u)}});for(const[p,f]of(u.cards??[]).entries())ee(r,f,`payload.cards[${p}]`);return r}const a=e.envelope.payload,o=((d=t.target)==null?void 0:d.cardId)!==void 0?Lt(i).find(u=>{var b;return u.id===((b=t.target)==null?void 0:b.cardId)})??null:a.id!==void 0?Lt(i).find(u=>u.id===a.id)??null:t.policies.matchStrategy==="title"?re(a.title,Lt(i),"card","payload",r):null;if(r.counts.conflict>0)return r;if((c=t.target)!=null&&c.columnId&&!Tr(i,t.target.columnId))return O(r,{action:"conflict",entity:"column",title:t.target.columnId,path:"target.columnId",reason:"target-column-not-found"}),r;const n=Mt(r,t,o);if(!n)return r;if(O(r,{action:n,entity:"card",title:a.title,path:"payload",reason:"card-import",...o?{targetId:o.id}:{},source:{...a.id?{id:a.id}:{},explicitFields:Q(a)}}),n==="create")for(const[u,b]of(a.checklists??[]).entries()){const m=`payload.checklists[${u}]`;O(r,{action:"create",entity:"checklist",title:b.title,path:m,reason:"checklist-import",source:{...b.id?{id:b.id}:{},explicitFields:Q(b)}});for(const[p,f]of(b.items??[]).entries())O(r,{action:"create",entity:"checkItem",title:f.title,path:`${m}.items[${p}]`,reason:"check-item-import",source:{...f.id?{id:f.id}:{},explicitFields:Q(f)}})}return r}function ae(i){const t=(i==null?void 0:i.trim())??"";return t.length>0?t:void 0}function xe(i){const t=i.checklists??[];return{id:i.id,title:i.title.trim()||"Untitled card",...ae(i.description)?{description:ae(i.description)}:{},...t.length>0?{checklists:t.map(e=>({id:e.id,title:e.title.trim()||"Checklist",items:(e.items??[]).map(r=>({id:r.id,title:r.title.trim()||"Untitled item",state:r.state}))}))}:{}}}function ye(i){return{id:i.id,title:i.title.trim()||"Untitled column",cards:(i.cards??[]).map(xe)}}function Nr(i){return{id:i.id,title:i.title.trim()||"Untitled board",columns:(i.columns??[]).map(ye)}}function Rr(i,t,e,r=new Date().toISOString()){return{schema:at,version:ot,format:i,scope:t,exportedAt:r,payload:e}}function qr(i){return`${JSON.stringify(i,null,2)}
`}function gt(i){return JSON.stringify(i)}function Or(i){const t=i.payload;return["---",`schema: ${i.schema}`,`version: ${gt(i.version)}`,`scope: ${i.scope}`,`title: ${gt(t.title)}`,`exportedAt: ${gt(i.exportedAt)}`,...t.id?[`id: ${gt(t.id)}`]:[],"---"]}function $r(i,t){t&&i.push("","Description:",t)}function we(i,t){i.push(`### Card: ${t.title}`),$r(i,t.description);for(const e of t.checklists??[]){i.push("",`Checklist: ${e.title}`);for(const r of e.items??[]){const a=r.state==="complete"?"x":" ";i.push(`- [${a}] ${r.title}`)}}}function oe(i,t){i.push(`## Column: ${t.title}`);for(const e of t.cards)i.push(""),we(i,e)}function zr(i){const t=Or(i);if(i.scope==="board"){const e=i.payload;for(const r of e.columns)t.push(""),oe(t,r);return`${t.join(`
`).trimEnd()}
`}return i.scope==="column"?(oe(t,i.payload),`${t.join(`
`).trimEnd()}
`):(we(t,i.payload),`${t.join(`
`).trimEnd()}
`)}function Gt(i){return i.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"untitled"}function Ut(i,t,e){const r=Rr(i,t,e);return i==="json"?qr(r):zr(r)}function Fr(i,t){const e=Nr(i);return{format:t,scope:"board",fileName:`board-${Gt(e.title)}.${t==="json"?"json":"md"}`,content:Ut(t,"board",e)}}function Kr(i,t){const e=ye(i);return{format:t,scope:"column",fileName:`column-${Gt(e.title)}.${t==="json"?"json":"md"}`,content:Ut(t,"column",e)}}function Hr(i,t){const e=xe(i);return{format:t,scope:"card",fileName:`card-${Gt(e.title)}.${t==="json"?"json":"md"}`,content:Ut(t,"card",e)}}const $t={code:"boards.save_failed",messageKey:"boards.errors.save",recoverable:!0};function E(i){return{ok:!0,data:i}}function it(i=$t){return{ok:!1,error:i}}const ie={boards:[],selectedBoardId:null,status:"idle",error:null,optimistic:Ht()};function ne(i){const t=Number(i??0);return Number.isFinite(t)?t:0}function Gr(i,t){const e=i.pos??i.order??0,r=t.pos??t.order??0;return ne(e)-ne(r)||i.id.localeCompare(t.id)}function se(i){return i.map(t=>({...t,columns:[...t.columns??[]].sort(Gr).map(e=>({...e,cards:[...e.cards??[]].sort(Xe)}))})).sort((t,e)=>t.id.localeCompare(e.id))}class Ur{constructor(t,e={}){this.api=t,this.stateSubject=new Se(ie),this.state$=this.stateSubject.asObservable(),this.confirmedBoards=ie.boards,this.pendingMutations=[],this.resolvedOptimisticIds=Ht().resolved,this.tempIdSequence=0,this.boardMetaMutationVersions=new Map,this.now=e.now??(()=>new Date),this.createTempIdValue=e.createTempId??(r=>(this.tempIdSequence+=1,`temp:${r}:${this.tempIdSequence}`))}get snapshot(){return this.stateSubject.value}destroy(){this.stateSubject.complete()}selectBoard(t){this.snapshot.boards.some(e=>e.id===t)&&(Zt(t),this.patchState({selectedBoardId:t,error:null}),this.patchBoardMeta(t,e=>rr(e,this.now().toISOString())))}previewImport(t){return Dr(this.snapshot.boards,t)}async exportData(t){const e=new Map;this.patchState({status:"loading",error:null});try{const r=await this.createExportData(t,e);return this.patchState({status:"idle",error:null}),r}catch{return this.patchState({status:"error",error:"boards.errors.load"}),null}}async createExportData(t,e){if(t.scope==="board"){const a=t.boardId?this.findBoard(t.boardId):this.getSelectedBoard();return a?Fr(await this.hydrateBoardForExport(a,e),t.format):null}if(t.scope==="column"){const a=t.columnId?this.findColumn(t.columnId):null;return a?Kr(await this.hydrateColumnForExport(a,e),t.format):null}const r=t.cardId?this.findCard(t.cardId):null;return r?Hr(await this.hydrateCardForExport(r,e),t.format):null}async applyImport(t){if(t.policies.mode!=="create"||!this.previewImport(t).canApply)return E(null);const r=ve(t);return r.envelope?this.runMutationResult(async()=>{var a,o;return t.scope==="board"?this.applyBoardCreateImport(r.envelope.payload):t.scope==="column"?this.applyColumnCreateImport(r.envelope.payload,(a=t.target)==null?void 0:a.boardId):this.applyCardCreateImport(r.envelope.payload,(o=t.target)==null?void 0:o.columnId)}):E(null)}async load(){this.patchState({status:"loading",error:null});try{await this.reloadPreservingSelection(),this.patchState({status:"idle",error:null})}catch{this.patchState({status:"error",error:"boards.errors.load"})}}publishCommandState(t){this.patchState({status:t.hasRunningCommands?"saving":t.errorKey?"error":"idle",error:t.errorKey})}async reloadBoardSnapshot(t=this.snapshot.selectedBoardId){await this.reload(t)}toggleBoardStar(t){this.patchBoardMeta(t,e=>er(e,!yt(e)))}updateBoardGroup(t,e){this.patchBoardMeta(t,r=>ar(r,e))}hasCard(t){return this.findCard(t)!==null}hasCardPlacement(t){return this.findCardPlacement(t)!==null}hasColumn(t){return this.findColumn(t)!==null}findBoardSnapshot(t){return this.findBoard(t)}findColumnSnapshot(t){return this.findColumn(t)}createOptimisticTempId(t){return this.createTempIdValue(t)}applyOptimisticMutation(t){this.pendingMutations=[...this.pendingMutations,t],this.publishProjectedState({status:"saving",error:null})}async confirmOptimisticMutation(t,e,r={hasRunningCommands:!1,errorKey:null}){e&&this.rememberResolvedOptimisticIds(e),this.pendingMutations=this.pendingMutations.filter(a=>a.id!==t),await this.reloadPreservingSelection(),this.publishProjectedState({status:r.hasRunningCommands?"saving":r.errorKey?"error":"idle",error:r.errorKey})}rejectOptimisticMutation(t,e={hasRunningCommands:!1,errorKey:"boards.errors.save"}){this.pendingMutations=this.pendingMutations.filter(r=>r.id!==t),this.publishProjectedState({status:e.hasRunningCommands?"saving":"error",error:e.errorKey??"boards.errors.save"})}async loadCardChecklists(t){if(!this.findCard(t))return[];try{return await k(this.api.getCardChecklists(t))}catch{return this.patchState({error:"boards.errors.load"}),[]}}async createCardChecklist(t,e){const r=e.trim();return!r||!this.findCard(t)?E(null):this.runMutationResult(async()=>{const a=await k(this.api.createCardChecklist(t,{title:r,position:"bottom"}));return await this.reloadPreservingSelection(),a})}async deleteCardChecklist(t){return this.runMutation(async()=>{await k(this.api.deleteCardChecklist(t)),await this.reloadPreservingSelection()})}async createCardCheckItem(t,e){const r=e.trim();return r?this.runMutationResult(async()=>{const a=await k(this.api.createCardCheckItem(t,{title:r,position:"bottom"}));return await this.reloadPreservingSelection(),a}):E(null)}async patchCardCheckItem(t,e){return this.runMutationResult(async()=>{const r=await k(this.api.updateCardCheckItem(t,e));return await this.reloadPreservingSelection(),r})}async deleteCardCheckItem(t){return this.runMutation(async()=>{await k(this.api.deleteCardCheckItem(t)),await this.reloadPreservingSelection()})}async createCardEntityLink(t,e,r){if(!this.findCard(t))return E(null);const a={card:t,entity_type:e,entity_id:r};return this.runMutationResult(async()=>{const o=await k(this.api.createCardEntityLink(a));return await this.reloadPreservingSelection(),o})}async deleteCardEntityLink(t){return this.runMutation(async()=>{await k(this.api.deleteCardEntityLink(t)),await this.reloadPreservingSelection()})}async applyBoardCreateImport(t){const e=await k(this.api.createBoard({title:t.title})),r=[],a=[],o=[],n=[];for(const s of t.columns??[]){const d=await k(this.api.createColumn({board:e.id,title:s.title,position:"end"}));r.push(d.id);const c=await this.createImportedCards(d.id,s.cards??[]);a.push(...c.cardIds),o.push(...c.checklistIds),n.push(...c.checkItemIds)}return await this.reload(e.id),{scope:"board",created:{boardId:e.id,columnIds:r,cardIds:a,checklistIds:o,checkItemIds:n}}}async applyColumnCreateImport(t,e){const r=e??this.snapshot.selectedBoardId??void 0;if(!r||!this.findBoard(r))throw new Error("Missing import target board");const a=await k(this.api.createColumn({board:r,title:t.title,position:"end"})),o=await this.createImportedCards(a.id,t.cards??[]);return await this.reload(r),{scope:"column",created:{columnIds:[a.id],cardIds:o.cardIds,checklistIds:o.checklistIds,checkItemIds:o.checkItemIds}}}async applyCardCreateImport(t,e){if(!e||!this.findColumn(e))throw new Error("Missing import target column");const r=await this.createImportedCard(e,t);return await this.reloadPreservingSelection(),{scope:"card",created:{columnIds:[],cardIds:[r.card.id],checklistIds:r.checklistIds,checkItemIds:r.checkItemIds}}}async createImportedCards(t,e){const r=[],a=[],o=[];for(const n of e){const s=await this.createImportedCard(t,n);r.push(s.card.id),a.push(...s.checklistIds),o.push(...s.checkItemIds)}return{cardIds:r,checklistIds:a,checkItemIds:o}}async createImportedCard(t,e){const r=await k(this.api.createCard({column:t,title:e.title,description:e.description??"",position:"bottom"})),a=[],o=[];for(const n of e.checklists??[]){const s=await k(this.api.createCardChecklist(r.id,{title:n.title,position:"bottom"}));a.push(s.id);for(const d of n.items??[]){const c=await k(this.api.createCardCheckItem(s.id,{title:d.title,state:d.state??"incomplete",position:"bottom"}));o.push(c.id)}}return{card:r,checklistIds:a,checkItemIds:o}}async hydrateBoardForExport(t,e){return{...t,columns:await Promise.all((t.columns??[]).map(r=>this.hydrateColumnForExport(r,e)))}}async hydrateColumnForExport(t,e){return{...t,cards:await Promise.all((t.cards??[]).map(r=>this.hydrateCardForExport(r,e)))}}async hydrateCardForExport(t,e){return{...t,checklists:await this.loadCardChecklistsForExport(t.id,e)}}loadCardChecklistsForExport(t,e){const r=e.get(t);if(r)return r;const a=k(this.api.getCardChecklists(t));return e.set(t,a),a}async runMutation(t){this.patchState({status:"saving",error:null});try{return await t(),this.patchState({status:"idle",error:null}),E()}catch{return this.patchState({status:"error",error:"boards.errors.save"}),it()}}async runMutationResult(t){this.patchState({status:"saving",error:null});try{const e=await t();return this.patchState({status:"idle",error:null}),E(e)}catch{return this.patchState({status:"error",error:"boards.errors.save"}),it()}}rememberResolvedOptimisticIds(t){this.resolvedOptimisticIds={cards:{...this.resolvedOptimisticIds.cards,...t.cards??{}},placements:{...this.resolvedOptimisticIds.placements,...t.placements??{}},columns:{...this.resolvedOptimisticIds.columns,...t.columns??{}}}}async reloadPreservingSelection(){await this.reload(this.snapshot.selectedBoardId)}async reload(t){const e=se(await k(this.api.getBoards()));this.confirmedBoards=e;const r=Je(e,t);Zt(r),this.publishProjectedState({selectedBoardId:r})}findBoard(t){return this.snapshot.boards.find(e=>e.id===t)??null}getSelectedBoard(){return this.snapshot.selectedBoardId?this.findBoard(this.snapshot.selectedBoardId):null}patchBoardMeta(t,e){const r=this.findBoard(t);if(!r)return;const a=(this.boardMetaMutationVersions.get(t)??0)+1;this.boardMetaMutationVersions.set(t,a);const o=r.meta??null,n=e(r);this.replaceBoardMeta(t,n),k(this.api.updateBoard(t,{meta:n})).then(s=>{this.boardMetaMutationVersions.get(t)===a&&this.replaceBoardMeta(t,s.meta??n)}).catch(()=>{this.boardMetaMutationVersions.get(t)===a&&(this.replaceBoardMeta(t,o),this.patchState({error:"boards.errors.save"}))})}replaceBoardMeta(t,e){this.confirmedBoards=se(this.confirmedBoards.map(r=>r.id===t?{...r,meta:e??null}:r)),this.publishProjectedState({error:null})}findColumn(t){for(const e of this.snapshot.boards){const r=e.columns.find(a=>a.id===t);if(r)return r}return null}findCardPlacement(t){for(const e of this.snapshot.boards)for(const r of e.columns){const a=r.cards.find(o=>y(o)===t);if(a)return a}return null}findCard(t){for(const e of this.snapshot.boards)for(const r of e.columns){const a=r.cards.find(o=>o.id===t);if(a)return a}return null}patchState(t){this.stateSubject.next({...this.snapshot,...t})}publishProjectedState(t={}){this.stateSubject.next({...this.snapshot,...t,boards:fr(this.confirmedBoards,this.pendingMutations),optimistic:gr(this.pendingMutations,this.resolvedOptimisticIds)})}}class Wr{constructor(t,e){this.api=t,this.store=e,this.mutationSequence=0,this.commandSequence=0,this.commandRecordsById=new Map}async createBoard(t){const e=t.trim();return e?this.runBackendCommand("create-board",async()=>{const r=await k(this.api.createBoard({title:e}));await this.store.reloadBoardSnapshot(r.id)}):E()}async patchBoard(t,e){return this.store.findBoardSnapshot(t)?this.runBackendCommand("patch-board",async()=>{await k(this.api.updateBoard(t,e)),await this.store.reloadBoardSnapshot(t)}):E()}async deleteBoard(t){return this.runBackendCommand("delete-board",async()=>{await k(this.api.deleteBoard(t)),await this.store.reloadBoardSnapshot(null)})}async createColumn(t,e){const r=e.trim();if(!r)return E();const a=this.store.findBoardSnapshot(t);if(!a)return E();const o=this.store.createOptimisticTempId("column"),n={id:this.createMutationId(),type:"create-column",boardId:t,column:{id:o,board:t,title:r,order:a.columns.length,cards:[]}};return this.runOptimisticCommand("create-column",n,async()=>{const s=await k(this.api.createColumn({board:t,title:r,position:"end"}));return{columns:{[o]:s.id}}})}async patchColumn(t,e){if(!this.store.hasColumn(t))return E();const r={id:this.createMutationId(),type:"patch-column",columnId:t,patch:e};return this.runOptimisticCommand("patch-column",r,async()=>{await k(this.api.updateColumn(t,e))})}async deleteColumn(t){if(!this.store.hasColumn(t))return E();const e={id:this.createMutationId(),type:"delete-column",columnId:t};return this.runOptimisticCommand("delete-column",e,async()=>{await k(this.api.deleteColumn(t))})}async createCard(t,e,r){const a=e.trim();if(!a)return E();const o=this.store.findColumnSnapshot(t);if(!o)return E();const n=r.trim(),s=this.store.createOptimisticTempId("card"),d=this.store.createOptimisticTempId("placement"),c={id:this.createMutationId(),type:"create-card",columnId:t,card:{id:s,placement_id:d,column:t,title:a,description:n,order:o.cards.length}};return this.runOptimisticCommand("create-card",c,async()=>{const u=await k(this.api.createCard({column:t,title:a,description:n,position:"bottom"}));return{cards:{[s]:u.id},placements:{[d]:y(u)}}})}async patchCard(t,e){if(!this.store.hasCard(t))return E();const r={id:this.createMutationId(),type:"patch-card",cardId:t,patch:e};return this.runOptimisticCommand("patch-card",r,async()=>{await k(this.api.updateCard(t,e))})}async patchCardPlacement(t,e){if(!this.store.hasCardPlacement(t))return E();const r={id:this.createMutationId(),type:"patch-card-placement",placementId:t,patch:e};return this.runOptimisticCommand("patch-card-placement",r,async()=>{await k(this.api.updateCardPlacement(t,e))})}async deleteCardPlacement(t){if(!this.store.hasCardPlacement(t))return E();const e={id:this.createMutationId(),type:"delete-card-placement",placementId:t};return this.runOptimisticCommand("delete-card-placement",e,async()=>{await k(this.api.deleteCardPlacement(t))})}async deleteCard(t){if(!this.store.hasCard(t))return E();const e={id:this.createMutationId(),type:"delete-card",cardId:t};return this.runOptimisticCommand("delete-card",e,async()=>{await k(this.api.deleteCard(t))})}async createCardMirror(t,e,r){return!this.store.hasCard(t)||!this.store.hasColumn(e)?E():this.runBackendCommand("create-card-mirror",async()=>{await k(this.api.createCardPlacement({card:t,column:e,...r})),await this.store.reloadBoardSnapshot()})}getCommandRecords(){return Array.from(this.commandRecordsById.values())}async runOptimisticCommand(t,e,r){const a=this.startCommand(t,e.id);this.store.applyOptimisticMutation(e);try{const o=await r(),n=this.settleCommand(a.id,"confirmed");return await this.store.confirmOptimisticMutation(e.id,o,n),E()}catch{const o=this.settleCommand(a.id,"rejected",$t);return this.store.rejectOptimisticMutation(e.id,o),it()}}async runBackendCommand(t,e){const r=this.startCommand(t);this.store.publishCommandState(this.createStoreCommandState());try{return await e(),this.store.publishCommandState(this.settleCommand(r.id,"confirmed")),E()}catch{return this.store.publishCommandState(this.settleCommand(r.id,"rejected",$t)),it()}}startCommand(t,e){this.hasRunningCommands()||this.commandRecordsById.clear();const r={id:this.createCommandId(),kind:t,status:"running",...e?{optimisticMutationId:e}:{}};return this.commandRecordsById.set(r.id,r),r}settleCommand(t,e,r){const a=this.commandRecordsById.get(t);a&&this.commandRecordsById.set(t,{...a,status:e,...r?{error:r}:{}});const o=this.createStoreCommandState();return o.hasRunningCommands||this.commandRecordsById.clear(),o}createStoreCommandState(){var r;const t=Array.from(this.commandRecordsById.values()),e=t.find(a=>a.status==="rejected");return{hasRunningCommands:t.some(a=>a.status==="running"),errorKey:((r=e==null?void 0:e.error)==null?void 0:r.messageKey)??null}}hasRunningCommands(){return Array.from(this.commandRecordsById.values()).some(t=>t.status==="running")}createCommandId(){return this.commandSequence+=1,`boards-command-${this.commandSequence}`}createMutationId(){return this.mutationSequence+=1,`boards-command-mutation-${this.mutationSequence}`}}class Qr{constructor(t){this.ports=t}async createEntityFromCard(t,e){try{const r=await this.createEntity(t,e);return this.ports.createCardEntityLink(t.id,e,Xr(r))}catch{return it()}}async deleteLinkedEntity(t){try{return t.entity_type==="task"?await this.ports.deleteTask(t.entity_id):t.entity_type==="story"?await this.ports.deleteStory(t.entity_id):await this.ports.deleteGoal(t.entity_id),await this.ports.reloadBoards(),E()}catch{return it()}}createEntity(t,e){const r={title:t.title.trim(),description:Yr(t.description)};return e==="task"?this.ports.createTask({...r,is_standalone:!0}):e==="story"?this.ports.createStory(r):this.ports.createGoal(r)}}function Yr(i){return(i==null?void 0:i.trim())??""}function Xr(i){return i.uuid??String(i.id)}function nt(i){return[...new Set([...i].filter(Vr))].sort((t,e)=>t-e)}function zt(i){var t;return nt(i.tag_ids??((t=i.tags)==null?void 0:t.map(e=>e.id))??[])}function pt(i,t){const e=nt(i),r=nt(t);return e.length===r.length&&e.every((a,o)=>a===r[o])}function Vr(i){return typeof i=="number"&&Number.isFinite(i)}function je({columnId:i,cards:t,movingPlacementId:e,insertionIndex:r}){const a=t.filter(c=>y(c)!==e),o=Math.max(0,Math.min(r,a.length)),n=o>0?a[o-1]:null,s=o<a.length?a[o]:null,d={column:i};return n&&(d.before_placement=y(n)),s&&(d.after_placement=y(s)),!n&&!s&&(d.position="bottom"),d}function Jr(i,t,e){const r=i.filter(b=>y(b)!==t),a=i.findIndex(b=>y(b)===t);if(a<0)return!0;const o=a>0?i[a-1]:null,n=a<i.length-1?i[a+1]:null,s=o?y(o):null,d=n?y(n):null,c=e.before_placement??null,u=e.after_placement??null;return r.length===0?!1:s!==c||d!==u}function Zr({columns:i,movingColumnId:t,insertionIndex:e}){const r=i.filter(d=>d.id!==t),a=Math.max(0,Math.min(e,r.length)),o=a>0?r[a-1]:null,n=a<r.length?r[a]:null,s={};return o&&(s.before_column=o.id),n&&(s.after_column=n.id),!o&&!n&&(s.position="end"),s}function ta(i,t,e){const r=i.filter(c=>c.id!==t),a=i.findIndex(c=>c.id===t);if(a<0)return!0;if(r.length===0)return!1;const o=a>0?i[a-1]:null,n=a<i.length-1?i[a+1]:null,s=(o==null?void 0:o.id)??null,d=(n==null?void 0:n.id)??null;return s!==(e.before_column??null)||d!==(e.after_column??null)}const ea=4,de=44,ce=18;function ra(i){return i.view??window}function le(i,t){for(const e of i.boards)if(e.columns.some(r=>r.id===t))return e.columns;return null}class aa{constructor(t){this.options=t,this.pending=null,this.active=null,this.eventWindow=null,this.suppressNextClick=!1,this.mounted=!1,this.handleClick=e=>{this.suppressNextClick&&(this.suppressNextClick=!1,e.preventDefault(),e.stopPropagation())},this.handlePointerDown=e=>{if(e.button!==0||e.isPrimary===!1)return;const r=e.target,a=r==null?void 0:r.closest('[data-board-column-draggable="true"]');if(!a||!this.options.root.contains(a)||r!=null&&r.closest('[data-board-drag-ignore="true"], [data-board-card-draggable="true"], input, textarea, select'))return;const o=a.dataset.boardColumnId,n=this.options.getState();!n||!o||!le(n,o)||(this.pending={pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,sourceColumnElement:a,columnId:o},this.addWindowListeners(ra(e)))},this.handlePointerMove=e=>{const r=this.pending;if(!r||e.pointerId!==r.pointerId)return;if(!this.active){const o=e.clientX-r.startX,n=e.clientY-r.startY;if(Math.hypot(o,n)<ea)return;this.startDrag(r,e)}const a=this.active;a&&(e.preventDefault(),this.movePreview(a,e.clientX,e.clientY),this.updateDropTarget(a,e.clientX),this.autoScroll(e.clientX))},this.handlePointerUp=e=>{this.pending&&e.pointerId!==this.pending.pointerId||(this.removeWindowListeners(),this.pending=null,this.finishActiveDrag(!0))},this.handlePointerCancel=e=>{this.pending&&e.pointerId!==this.pending.pointerId||this.cancelDrag()},this.handleWindowBlur=()=>{this.cancelDrag()}}mount(){this.mounted||(this.mounted=!0,this.options.root.addEventListener("pointerdown",this.handlePointerDown,!0),this.options.root.addEventListener("click",this.handleClick,!0))}unmount(){this.mounted&&(this.mounted=!1,this.cancelDrag(),this.options.root.removeEventListener("pointerdown",this.handlePointerDown,!0),this.options.root.removeEventListener("click",this.handleClick,!0))}cancelDrag(){this.removeWindowListeners(),this.pending=null,this.finishActiveDrag(!1)}startDrag(t,e){var d,c;const r=this.options.getState(),a=r?le(r,t.columnId):null;if(!a)return;(c=(d=this.options).onDragStart)==null||c.call(d);const o=t.sourceColumnElement.getBoundingClientRect(),n=t.sourceColumnElement.cloneNode(!0);n.classList.add("majom-boards__column-drag-preview"),n.style.width=`${o.width}px`,n.style.height=`${o.height}px`,n.style.left=`${o.left}px`,n.style.top=`${o.top}px`;const s=document.createElement("div");s.className="majom-boards__column-drag-placeholder",s.style.width=`${o.width}px`,s.style.height=`${o.height}px`,t.sourceColumnElement.classList.add("is-dragging"),document.body.append(n),this.active={...t,offsetX:e.clientX-o.left,offsetY:e.clientY-o.top,preview:n,placeholder:s,sourceColumns:a,target:null},this.options.root.classList.add("is-column-dragging"),this.movePreview(this.active,e.clientX,e.clientY),this.updateDropTarget(this.active,e.clientX)}movePreview(t,e,r){t.preview.style.left=`${e-t.offsetX}px`,t.preview.style.top=`${r-t.offsetY}px`}updateDropTarget(t,e){const r=this.resolveInsertionIndex(t.columnId,e);if(t.target=Zr({columns:t.sourceColumns,movingColumnId:t.columnId,insertionIndex:r}),!this.hasActiveTargetChanged(t)){t.placeholder.remove();return}this.placePlaceholder(t,r)}hasActiveTargetChanged(t){return!!(t.target&&ta(t.sourceColumns,t.columnId,t.target))}resolveInsertionIndex(t,e){const r=Array.from(this.options.root.querySelectorAll('[data-board-column-draggable="true"]')).filter(o=>o.dataset.boardColumnId!==t),a=r.findIndex(o=>{const n=o.getBoundingClientRect();return e<n.left+n.width/2});return a>=0?a:r.length}placePlaceholder(t,e){const r=this.options.root.querySelector('[data-board-canvas="true"]');if(!r)return;const a=Array.from(r.querySelectorAll('[data-board-column-draggable="true"]')).filter(n=>n.dataset.boardColumnId!==t.columnId),o=r.querySelector('[data-board-column-composer="true"]');r.insertBefore(t.placeholder,a[e]??o??null)}autoScroll(t){const e=this.options.root.querySelector('[data-board-canvas="true"]');if(!e)return;const r=e.getBoundingClientRect();t<r.left+de?e.scrollLeft-=ce:t>r.right-de&&(e.scrollLeft+=ce)}finishActiveDrag(t){const e=this.active;e&&(this.active=null,e.preview.remove(),e.placeholder.remove(),e.sourceColumnElement.classList.remove("is-dragging"),this.options.root.classList.remove("is-column-dragging"),this.suppressNextClick=!0,t&&this.hasActiveTargetChanged(e)&&this.options.onDrop(e.columnId,e.target))}addWindowListeners(t){this.eventWindow=t,t.addEventListener("pointermove",this.handlePointerMove,!0),t.addEventListener("pointerup",this.handlePointerUp,!0),t.addEventListener("pointercancel",this.handlePointerCancel,!0),t.addEventListener("blur",this.handleWindowBlur,!0)}removeWindowListeners(){const t=this.eventWindow??window;this.eventWindow=null,t.removeEventListener("pointermove",this.handlePointerMove,!0),t.removeEventListener("pointerup",this.handlePointerUp,!0),t.removeEventListener("pointercancel",this.handlePointerCancel,!0),t.removeEventListener("blur",this.handleWindowBlur,!0)}}const oa=4,kt=44,Ct=18;function ia(i){return i.view??window}function me(i,t){for(const e of i.boards){const r=e.columns.find(a=>a.id===t);if(r)return r.cards}return null}function na(i,t){for(const e of i.boards)for(const r of e.columns)if(r.cards.some(a=>y(a)===t))return r.id;return null}class sa{constructor(t){this.options=t,this.pending=null,this.active=null,this.eventWindow=null,this.suppressNextClick=!1,this.mounted=!1,this.handleClick=e=>{this.suppressNextClick&&(this.suppressNextClick=!1,e.preventDefault(),e.stopPropagation())},this.handlePointerDown=e=>{if(e.button!==0||e.isPrimary===!1)return;const r=e.target,a=r==null?void 0:r.closest('[data-board-card-draggable="true"]');if(!a||!this.options.root.contains(a)||r!=null&&r.closest('[data-board-drag-ignore="true"], input, textarea, select'))return;const o=a.dataset.boardCardPlacementId,n=this.options.getState();if(!n||!o)return;const s=na(n,o);s!==null&&(this.pending={pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,sourceCardElement:a,placementId:o,sourceColumnId:s},this.addWindowListeners(ia(e)))},this.handlePointerMove=e=>{const r=this.pending;if(!r||e.pointerId!==r.pointerId)return;if(!this.active){const o=e.clientX-r.startX,n=e.clientY-r.startY;if(Math.hypot(o,n)<oa)return;this.startDrag(r,e)}const a=this.active;a&&(e.preventDefault(),this.movePreview(a,e.clientX,e.clientY),this.updateDropTarget(a,e.clientX,e.clientY),this.autoScroll(e.clientX,e.clientY))},this.handlePointerUp=e=>{this.pending&&e.pointerId!==this.pending.pointerId||(this.removeWindowListeners(),this.pending=null,this.finishActiveDrag(!0))},this.handlePointerCancel=e=>{this.pending&&e.pointerId!==this.pending.pointerId||this.cancelDrag()},this.handleWindowBlur=()=>{this.cancelDrag()}}mount(){this.mounted||(this.mounted=!0,this.options.root.addEventListener("pointerdown",this.handlePointerDown,!0),this.options.root.addEventListener("click",this.handleClick,!0))}unmount(){this.mounted&&(this.mounted=!1,this.cancelDrag(),this.options.root.removeEventListener("pointerdown",this.handlePointerDown,!0),this.options.root.removeEventListener("click",this.handleClick,!0))}cancelDrag(){this.removeWindowListeners(),this.pending=null,this.finishActiveDrag(!1)}startDrag(t,e){var d,c;const r=this.options.getState();if(!r)return;const a=me(r,t.sourceColumnId);if(!a)return;(c=(d=this.options).onDragStart)==null||c.call(d);const o=t.sourceCardElement.getBoundingClientRect(),n=t.sourceCardElement.cloneNode(!0);n.classList.add("majom-boards__card-drag-preview"),n.style.width=`${o.width}px`,n.style.height=`${o.height}px`,n.style.left=`${o.left}px`,n.style.top=`${o.top}px`;const s=document.createElement("div");s.className="majom-boards__card-drag-placeholder",s.style.height=`${o.height}px`,t.sourceCardElement.classList.add("is-dragging"),document.body.append(n),this.active={...t,offsetX:e.clientX-o.left,offsetY:e.clientY-o.top,preview:n,placeholder:s,sourceColumnCards:a,targetColumnId:null,target:null},this.options.root.classList.add("is-card-dragging"),this.movePreview(this.active,e.clientX,e.clientY),this.updateDropTarget(this.active,e.clientX,e.clientY)}movePreview(t,e,r){t.preview.style.left=`${e-t.offsetX}px`,t.preview.style.top=`${r-t.offsetY}px`}updateDropTarget(t,e,r){const a=this.options.getState();if(!a)return;const o=this.findTargetColumn(e);if(!o)return;const n=o.dataset.boardColumnId;if(!n)return;const s=me(a,n),d=o.querySelector('[data-board-cards-container="true"]');if(!s||!d)return;const c=this.resolveInsertionIndex(o,t.placementId,r);if(t.targetColumnId=n,t.target=je({columnId:n,cards:s,movingPlacementId:t.placementId,insertionIndex:c}),!this.hasActiveTargetChanged(t)){t.placeholder.remove();return}this.placePlaceholder(d,t,c)}hasActiveTargetChanged(t){return!t.target||t.targetColumnId===null?!1:!(t.targetColumnId===t.sourceColumnId)||Jr(t.sourceColumnCards,t.placementId,t.target)}findTargetColumn(t){const e=Array.from(this.options.root.querySelectorAll("[data-board-column-id]"));if(e.length===0)return null;const r=e.find(a=>{const o=a.getBoundingClientRect();return t>=o.left&&t<=o.right});return r||e.reduce((a,o)=>{if(!a)return o;const n=o.getBoundingClientRect(),s=a.getBoundingClientRect(),d=Math.abs(t-(n.left+n.width/2)),c=Math.abs(t-(s.left+s.width/2));return d<c?o:a},null)}resolveInsertionIndex(t,e,r){const a=Array.from(t.querySelectorAll("[data-board-card-placement-id]")).filter(n=>n.dataset.boardCardPlacementId!==e),o=a.findIndex(n=>{const s=n.getBoundingClientRect();return r<s.top+s.height/2});return o>=0?o:a.length}placePlaceholder(t,e,r){const o=Array.from(t.querySelectorAll("[data-board-card-placement-id]")).filter(n=>n.dataset.boardCardPlacementId!==e.placementId)[r]??null;t.insertBefore(e.placeholder,o)}autoScroll(t,e){const r=this.options.root.querySelector('[data-board-canvas="true"]');if(r){const d=r.getBoundingClientRect();t<d.left+kt?r.scrollLeft-=Ct:t>d.right-kt&&(r.scrollLeft+=Ct)}const a=this.active;if(!(a!=null&&a.targetColumnId))return;const o=Array.from(this.options.root.querySelectorAll("[data-board-column-id]")).find(d=>d.dataset.boardColumnId===a.targetColumnId),n=o==null?void 0:o.querySelector('[data-board-cards-container="true"]');if(!n)return;const s=n.getBoundingClientRect();e<s.top+kt?n.scrollTop-=Ct:e>s.bottom-kt&&(n.scrollTop+=Ct)}finishActiveDrag(t){const e=this.active;e&&(this.active=null,e.preview.remove(),e.placeholder.remove(),e.sourceCardElement.classList.remove("is-dragging"),this.options.root.classList.remove("is-card-dragging"),this.suppressNextClick=!0,!(!t||!e.target||e.targetColumnId===null)&&this.hasActiveTargetChanged(e)&&this.options.onDrop(e.placementId,e.target))}addWindowListeners(t){this.eventWindow=t,t.addEventListener("pointermove",this.handlePointerMove,!0),t.addEventListener("pointerup",this.handlePointerUp,!0),t.addEventListener("pointercancel",this.handlePointerCancel,!0),t.addEventListener("blur",this.handleWindowBlur,!0)}removeWindowListeners(){const t=this.eventWindow??window;this.eventWindow=null,t.removeEventListener("pointermove",this.handlePointerMove,!0),t.removeEventListener("pointerup",this.handlePointerUp,!0),t.removeEventListener("pointercancel",this.handlePointerCancel,!0),t.removeEventListener("blur",this.handleWindowBlur,!0)}}const ue="majom-boards-view-styles",h={root:"majom-boards",surfaceRoot:"majom-boards__surface-root",overlayRoot:"majom-boards__overlay-root",modalRoot:"majom-boards__modal-root",shell:"majom-boards__shell",header:"majom-boards__header",titleBlock:"majom-boards__title-block",titleRow:"majom-boards__title-row",title:"majom-boards__title",titleButton:"majom-boards__title-button",titleEditInput:"majom-boards__title-edit-input",boardPickerButton:"majom-boards__board-picker-button",boardPickerButtonContent:"majom-boards__board-picker-button-content",headerActions:"majom-boards__header-actions",headerMenuButton:"majom-boards__header-menu-button",boardPickerPopover:"majom-boards-board-picker",boardPickerSearchWrap:"majom-boards-board-picker__search-wrap",boardPickerSearchIcon:"majom-boards-board-picker__search-icon",boardPickerSearchInput:"majom-boards-board-picker__search-input",boardPickerChips:"majom-boards-board-picker__chips",boardPickerChip:"majom-boards-board-picker__chip",boardPickerChipSelected:"majom-boards-board-picker__chip is-selected",boardPickerSections:"majom-boards-board-picker__sections",boardPickerSection:"majom-boards-board-picker__section",boardPickerSectionTitle:"majom-boards-board-picker__section-title",boardPickerSectionToggle:"majom-boards-board-picker__section-toggle",boardPickerSectionIconCollapsed:"majom-boards-board-picker__section-icon--collapsed",boardPickerGrid:"majom-boards-board-picker__grid",boardPickerCard:"majom-boards-board-picker__card",boardPickerCardSelected:"majom-boards-board-picker__card is-selected",boardPickerCardButton:"majom-boards-board-picker__card-button",boardPickerCreateCard:"majom-boards-board-picker__create-card",boardPickerStarButton:"majom-boards-board-picker__star-button",boardPickerStarButtonActive:"majom-boards-board-picker__star-button is-active",boardPickerActionsButton:"majom-boards-board-picker__actions-button",boardPickerActionsMenu:"majom-boards-board-picker-actions",boardPickerActionsInputRow:"majom-boards-board-picker-actions__input-row",boardPickerActionsInput:"majom-boards-board-picker-actions__input",boardPickerCover:"majom-boards-board-picker__cover",boardPickerCoverA:"majom-boards-board-picker__cover--a",boardPickerCoverB:"majom-boards-board-picker__cover--b",boardPickerCoverC:"majom-boards-board-picker__cover--c",boardPickerCoverD:"majom-boards-board-picker__cover--d",boardPickerCoverE:"majom-boards-board-picker__cover--e",boardPickerCoverF:"majom-boards-board-picker__cover--f",boardPickerCoverInitial:"majom-boards-board-picker__cover-initial",boardPickerCardTitle:"majom-boards-board-picker__card-title",boardPickerEmpty:"majom-boards-board-picker__empty",primaryButton:"majom-boards__button majom-boards__button--primary",quietButton:"majom-boards__button majom-boards__button--quiet",iconButton:"majom-boards__icon-button",body:"majom-boards__body",canvas:"majom-boards__canvas",column:"majom-boards__column",columnHeader:"majom-boards__column-header",columnTitleButton:"majom-boards__column-title-button",columnTitleInput:"majom-boards__column-title-input",columnTitle:"majom-boards__column-title",columnMenuButton:"majom-boards__column-menu-button",cards:"majom-boards__cards",card:"majom-boards__card",cardCompleted:"majom-boards__card is-complete",cardMirror:"majom-boards__card--mirror",cardOpenButton:"majom-boards__card-open",cardCompleteToggle:"majom-boards__card-complete-toggle",cardCompleteToggleCompleted:"majom-boards__card-complete-toggle is-complete",cardSourceLabel:"majom-boards__card-source-label",cardTags:"majom-boards__card-tags",cardTag:"majom-boards__card-tag",cardTitle:"majom-boards__card-title",cardBadges:"majom-boards__card-badges",cardBadgePlain:"majom-boards__card-badge majom-boards__card-badge--plain",cardBadgeNeutral:"majom-boards__card-badge majom-boards__card-badge--neutral",cardBadgeTask:"majom-boards__card-badge majom-boards__card-badge--task",cardBadgeStory:"majom-boards__card-badge majom-boards__card-badge--story",cardBadgeGoal:"majom-boards__card-badge majom-boards__card-badge--goal",cardComposer:"majom-boards__card-composer",cardComposerCollapsed:"majom-boards__card-composer-collapsed",cardComposerExpanded:"majom-boards__card-composer-expanded",cardComposerTextarea:"majom-boards__card-composer-textarea",composerActions:"majom-boards__composer-actions",composerCancelButton:"majom-boards__composer-cancel",columnComposerCollapsedPanel:"majom-boards__column-composer majom-boards__column-composer--collapsed",columnComposerExpandedPanel:"majom-boards__column-composer majom-boards__column-composer--expanded",columnComposerCollapsed:"majom-boards__column-composer-collapsed",columnComposerExpanded:"majom-boards__column-composer-expanded",listComposerTextarea:"majom-boards__list-composer-textarea",empty:"majom-boards__empty",emptyContent:"majom-boards__empty-content",emptyTitle:"majom-boards__empty-title",emptyCopy:"majom-boards__empty-copy",messageWrapper:"majom-boards__message-wrapper",messageLabel:"majom-boards__message-label"},l={container:"majom-boards-modal",body:"majom-boards-modal__body",cardBack:"majom-boards-cardback",hiddenShellPart:"majom-boards-cardback__hidden-shell-part",topbar:"majom-boards-cardback__topbar",topbarStart:"majom-boards-cardback__topbar-start",listBadge:"majom-boards-cardback__list-badge",sourceLabel:"majom-boards-cardback__source-label",movePopover:"majom-boards-cardback__move-popover",movePopoverHeader:"majom-boards-cardback__move-popover-header",movePopoverTitle:"majom-boards-cardback__move-popover-title",movePopoverBody:"majom-boards-cardback__move-popover-body",movePopoverContent:"majom-boards-cardback__move-popover-content",moveTabs:"majom-boards-cardback__move-tabs",moveTab:"majom-boards-cardback__move-tab",moveTabSelected:"majom-boards-cardback__move-tab is-selected",moveSectionTitle:"majom-boards-cardback__move-section-title",moveFields:"majom-boards-cardback__move-fields",moveField:"majom-boards-cardback__move-field",moveLabel:"majom-boards-cardback__move-label",moveSelect:"majom-boards-cardback__move-select",moveActions:"majom-boards-cardback__move-actions",moveButton:"majom-boards-cardback__move-button",listActionsPopover:"majom-boards-list-actions",listActionsHeader:"majom-boards-list-actions__header",listActionsTitle:"majom-boards-list-actions__title",listActionsBody:"majom-boards-list-actions__body",listActionsList:"majom-boards-list-actions__list",listActionsItem:"majom-boards-list-actions__item",listActionsButton:"majom-boards-list-actions__button",listActionsDivider:"majom-boards-list-actions__divider",listActionsSection:"majom-boards-list-actions__section",listActionsSectionButton:"majom-boards-list-actions__section-button",listActionsUpgrade:"majom-boards-list-actions__upgrade",listActionsUpgradeTitle:"majom-boards-list-actions__upgrade-title",listActionsUpgradeCopy:"majom-boards-list-actions__upgrade-copy",importModal:"majom-boards-import-modal",importLayout:"majom-boards-import__layout",importReview:"majom-boards-import__review",importPanel:"majom-boards-import__panel",importSidePanel:"majom-boards-import__side-panel",importField:"majom-boards-import__field",importSourceHeader:"majom-boards-import__source-header",importGuide:"majom-boards-import__guide",importGuideActions:"majom-boards-import__guide-actions",importGuideButton:"majom-boards-import__guide-button",importGuideHelp:"majom-boards-import__guide-help",importLabel:"majom-boards-import__label",importSource:"majom-boards-import__source",importSelect:"majom-boards-import__select",importPreviewPanel:"majom-boards-import__preview",importReviewHeader:"majom-boards-import__review-header",importReviewEyebrow:"majom-boards-import__review-eyebrow",importReviewHeadline:"majom-boards-import__review-headline",importPreviewTitle:"majom-boards-import__preview-title",importEmpty:"majom-boards-import__empty",importPlanGroups:"majom-boards-import__plan-groups",importPlanGroup:"majom-boards-import__plan-group",importPlanGroupHeader:"majom-boards-import__plan-group-header",importPlanGroupTitle:"majom-boards-import__plan-group-title",importItems:"majom-boards-import__items",importItem:"majom-boards-import__item",importItemEntity:"majom-boards-import__item-entity",importItemMain:"majom-boards-import__item-main",importItemMeta:"majom-boards-import__item-meta",importDiagnostics:"majom-boards-import__diagnostics",importDiagnosticWarning:"majom-boards-import__diagnostic majom-boards-import__diagnostic--warning",importDiagnosticError:"majom-boards-import__diagnostic majom-boards-import__diagnostic--error",importMessage:"majom-boards-import__message",importActions:"majom-boards-import__actions",importActionButtonPrimary:"majom-boards-import__action-button majom-boards-import__action-button--primary",importActionButtonSecondary:"majom-boards-import__action-button majom-boards-import__action-button--secondary",exportModal:"majom-boards-export-modal",exportContent:"majom-boards-export__content",exportMeta:"majom-boards-export__meta",exportOutput:"majom-boards-export__output",cardActionsPopover:"majom-boards-card-actions",cardActionsBody:"majom-boards-card-actions__body",cardActionsList:"majom-boards-card-actions__list",cardActionsItem:"majom-boards-card-actions__item",cardActionsButton:"majom-boards-card-actions__button",cardActionsDivider:"majom-boards-card-actions__divider",topbarActions:"majom-boards-cardback__topbar-actions",iconButton:"majom-boards-cardback__icon-button",layout:"majom-boards-cardback__layout",main:"majom-boards-cardback__main",aside:"majom-boards-cardback__aside",section:"majom-boards-cardback__section",sectionIcon:"majom-boards-cardback__section-icon",sectionMain:"majom-boards-cardback__section-main",sectionHeader:"majom-boards-cardback__section-header",sectionTitle:"majom-boards-cardback__section-title",sectionActions:"majom-boards-cardback__section-actions",titleSection:"majom-boards-cardback__title-section",doneButton:"majom-boards-cardback__done-button",doneButtonCompleted:"majom-boards-cardback__done-button is-complete",titleEditor:"majom-boards-cardback__title-editor",quickActions:"majom-boards-cardback__quick-actions",quickActionList:"majom-boards-cardback__quick-action-list",quickActionButton:"majom-boards-cardback__quick-action-button",labelsHost:"majom-boards-cardback__labels-host",labelsSection:"majom-boards-cardback__labels-section",labelsTitle:"majom-boards-cardback__labels-title",labelsList:"majom-boards-cardback__labels-list",labelSwatch:"majom-boards-cardback__label-swatch",labelAddButton:"majom-boards-cardback__label-add-button",labelPickerPopover:"majom-boards-cardback__label-picker-popover",entityLinksHost:"majom-boards-cardback__entity-links-host",entityLinksMessage:"majom-boards-cardback__entity-links-message",entityLinksList:"majom-boards-cardback__entity-links-list",entityLinkItem:"majom-boards-cardback__entity-link-item",entityLinkIcon:"majom-boards-cardback__entity-link-icon",entityLinkContent:"majom-boards-cardback__entity-link-content",entityLinkTitle:"majom-boards-cardback__entity-link-title",entityLinkMeta:"majom-boards-cardback__entity-link-meta",entityLinkMenuTriggerButton:"majom-boards-cardback__entity-link-menu-trigger",entityLinkMenuPopover:"majom-boards-cardback__entity-link-menu",entityLinkMenuList:"majom-boards-cardback__entity-link-menu-list",entityLinkMenuItem:"majom-boards-cardback__entity-link-menu-item",entityLinkMenuButton:"majom-boards-cardback__entity-link-menu-button",entityLinkMenuDangerButton:"majom-boards-cardback__entity-link-menu-button majom-boards-cardback__entity-link-menu-button--danger",entityLinkPicker:"majom-boards-cardback__entity-link-picker",entityLinkPickerField:"majom-boards-cardback__entity-link-picker-field",entityLinkPickerInput:"majom-boards-cardback__entity-link-picker-input",entityLinkPickerResults:"majom-boards-cardback__entity-link-picker-results",entityLinkPickerList:"majom-boards-cardback__entity-link-picker-list",entityLinkPickerButton:"majom-boards-cardback__entity-link-picker-button",checklistPopover:"majom-boards-cardback__checklist-popover",checklistPopoverHeader:"majom-boards-cardback__checklist-popover-header",checklistPopoverTitle:"majom-boards-cardback__checklist-popover-title",checklistPopoverClose:"majom-boards-cardback__checklist-popover-close",checklistPopoverForm:"majom-boards-cardback__checklist-popover-form",checklistPopoverLabel:"majom-boards-cardback__checklist-popover-label",checklistPopoverInput:"majom-boards-cardback__checklist-popover-input",checklistPopoverActions:"majom-boards-cardback__checklist-popover-actions",checklistPopoverSubmit:"majom-boards-cardback__checklist-popover-submit",checklistsHost:"majom-boards-cardback__checklists-host",checklistsMessage:"majom-boards-cardback__checklists-message",checklistsList:"majom-boards-cardback__checklists-list",checklist:"majom-boards-cardback__checklist",checklistActions:"majom-boards-cardback__checklist-actions",checklistActionButton:"majom-boards-cardback__checklist-action-button",checklistProgressRow:"majom-boards-cardback__checklist-progress-row",checklistProgress:"majom-boards-cardback__checklist-progress",checklistProgressTrack:"majom-boards-cardback__checklist-progress-track",checklistProgressBar:"majom-boards-cardback__checklist-progress-bar",checkItemList:"majom-boards-cardback__checkitem-list",checkItem:"majom-boards-cardback__checkitem",checkItemCheckbox:"majom-boards-cardback__checkitem-checkbox",checkItemTitle:"majom-boards-cardback__checkitem-title",checkItemTitleComplete:"majom-boards-cardback__checkitem-title is-complete",checkItemTitleInput:"majom-boards-cardback__checkitem-title-input",checkItemMenuTriggerButton:"majom-boards-cardback__checkitem-menu-trigger",checkItemMenuPopover:"majom-boards-cardback__checkitem-menu",checkItemMenuList:"majom-boards-cardback__checkitem-menu-list",checkItemMenuItem:"majom-boards-cardback__checkitem-menu-item",checkItemMenuButton:"majom-boards-cardback__checkitem-menu-button",checkItemCollapsedComposer:"majom-boards-cardback__checkitem-collapsed-composer",checkItemComposer:"majom-boards-cardback__checkitem-composer",checkItemComposerInput:"majom-boards-cardback__checkitem-composer-input",checkItemComposerActions:"majom-boards-cardback__checkitem-composer-actions",checkItemComposerPrimaryActions:"majom-boards-cardback__checkitem-composer-primary-actions",checkItemComposerMetaActions:"majom-boards-cardback__checkitem-composer-meta-actions",checkItemMetaButton:"majom-boards-cardback__checkitem-meta-button",descriptionEditor:"majom-boards-cardback__description-editor",placeholderPanel:"majom-boards-cardback__placeholder-panel",editorActions:"majom-boards-cardback__editor-actions",activityInput:"majom-boards-cardback__activity-input",activityList:"majom-boards-cardback__activity-list",activityItem:"majom-boards-cardback__activity-item",avatar:"majom-boards-cardback__avatar",quickEditorOverlay:"majom-boards-quick-editor-overlay",quickEditor:"majom-boards-quick-editor",quickEditorForm:"majom-boards-quick-editor__form",quickEditorCard:"majom-boards-quick-editor__card",quickEditorCardMirror:"majom-boards-quick-editor__card--mirror",quickEditorCardInner:"majom-boards-quick-editor__card-inner",quickEditorTitle:"majom-boards-quick-editor__title",quickEditorSave:"majom-boards-quick-editor__save",quickEditorActions:"majom-boards-quick-editor__actions",quickEditorButtons:"majom-boards-quick-editor__buttons",quickEditorButton:"majom-boards-quick-editor__button",quickEditorDangerItem:"majom-boards-quick-editor__danger-item",quickEditorDangerButton:"majom-boards-quick-editor__button--danger"},da=`
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
  position: relative;
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

.majom-boards__surface-root {
  min-height: 0;
  height: 100%;
}

.majom-boards__overlay-root,
.majom-boards__modal-root {
  display: contents;
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
`;function ca(){if(typeof document>"u"||document.getElementById(ue))return;const i=document.createElement("style");i.id=ue,i.textContent=da,document.head.appendChild(i)}const Pe='[data-board-canvas="true"]',Ie="[data-board-column-id]",Ee='[data-board-cards-container="true"]';function la(i){const t=i.querySelector(Pe),e={};return i.querySelectorAll(Ie).forEach(r=>{const a=r.dataset.boardColumnId;if(!a)return;const o=r.querySelector(Ee);o&&(e[a]=o.scrollTop)}),{canvasScrollLeft:(t==null?void 0:t.scrollLeft)??0,columnScrollTops:e}}function pe(i,t){const e=i.querySelector(Pe);e&&(e.scrollLeft=t.canvasScrollLeft),i.querySelectorAll(Ie).forEach(r=>{const a=r.dataset.boardColumnId;if(!a)return;const o=t.columnScrollTops[a];if(o===void 0)return;const n=r.querySelector(Ee);n&&(n.scrollTop=o)})}class ma{constructor(t){this.root=t}capture(t){return t?la(this.root):null}restore(t){t&&(pe(this.root,t),requestAnimationFrame(()=>pe(this.root,t)))}}function ua(i,t,e){const r=Ae(i);return{identity:{cardId:i.id,placementId:t,isResolved:e.isResolved},base:r,draft:Be(r),dirty:Le(),requested:{tagIds:[...r.tagIds]},pendingSubmit:!1,closeAfterSubmit:!1,error:null}}function pa(i,t){const e={...i.draft,...t,tagIds:t.tagIds!==void 0?nt(t.tagIds):i.draft.tagIds};return{...i,draft:e,dirty:Me(i.base,e)}}function ha(i,t,e,r){const a=Ae(t),o=Ca(i,a);return{...i,identity:{cardId:t.id,placementId:e,isResolved:r.isResolved},base:a,draft:o,dirty:Me(a,o),requested:{tagIds:pt(i.requested.tagIds,a.tagIds)?[...a.tagIds]:[...i.requested.tagIds]}}}function ba(i,t){return{...i,pendingSubmit:!0,closeAfterSubmit:t.closeAfterSubmit,error:null}}function fa(i){return{...i,pendingSubmit:!1,closeAfterSubmit:!1,dirty:Le(),base:Be(i.draft),requested:{tagIds:[...i.draft.tagIds]},error:null}}function ga(i,t){return{...i,requested:{tagIds:nt(t)}}}function he(i){const t={},e=i.draft.title.trim();return i.dirty.title&&e!==i.base.title&&(t.title=e),i.dirty.description&&i.draft.description!==i.base.description&&(t.description=i.draft.description),i.dirty.tagIds&&!pt(i.draft.tagIds,i.base.tagIds)&&!pt(i.draft.tagIds,i.requested.tagIds)&&(t.tag_ids=[...i.draft.tagIds]),t}function be(i){return i.title!==void 0||i.description!==void 0||i.tag_ids!==void 0}function ka(i,t){return pt(i.requested.tagIds,t)}function Ae(i){return{title:i.title,description:i.description??"",tagIds:zt(i)}}function Be(i){return{title:i.title,description:i.description,tagIds:[...i.tagIds]}}function Le(){return{title:!1,description:!1,tagIds:!1}}function Me(i,t){return{title:t.title.trim()!==i.title,description:t.description!==i.description,tagIds:!pt(t.tagIds,i.tagIds)}}function Ca(i,t){return{title:i.dirty.title?i.draft.title:t.title,description:i.dirty.description?i.draft.description:t.description,tagIds:i.dirty.tagIds?[...i.draft.tagIds]:[...t.tagIds]}}class _a{constructor(){this.state=null}get snapshot(){return this.state}open(t,e,r){return this.state=ua(t,e,r),this.state}close(){this.state=null}updateDraft(t){return this.state?(this.state=pa(this.state,t),this.state):null}reconcile(t,e,r){return this.state?(this.state=ha(this.state,t,e,r),this.state):null}queueSubmit(t){return this.state?(this.state=ba(this.state,t),this.state):null}markSubmitted(){return this.state?(this.state=fa(this.state),this.state):null}updateRequestedTagIds(t){return this.state?(this.state=ga(this.state,t),this.state):null}}class va{constructor(t=null,e=null){this.checklistPorts=t,this.entityLinkPorts=e,this.activePlacement=null,this.session=new _a,this.checklistState=null,this.entityLinksState=null,this.checklistLoadVersion=0,this.hiddenCheckedChecklistIds=new Set,this.expandedCheckItemComposerIds=new Set}get activePlacementId(){return this.activePlacement}get snapshot(){return this.session.snapshot}get checklists(){return this.checklistState}get entityLinks(){return this.entityLinksState}get isOpen(){return this.activePlacement!==null}open(t,e,r){this.activePlacement=e;const a=this.session.open(t,e,r);return this.resetChecklistState(t.id),this.resetEntityLinksState(t.id),a}close(){this.activePlacement=null,this.session.close(),this.checklistState=null,this.entityLinksState=null,this.hiddenCheckedChecklistIds.clear(),this.expandedCheckItemComposerIds.clear(),this.invalidateChecklistLoads()}resolveActivePlacement(t){this.activePlacement&&(this.activePlacement=t)}reconcile(t,e,r){var n;if(!this.activePlacement)return null;const a=((n=this.session.snapshot)==null?void 0:n.identity.cardId)??null;this.activePlacement=e;const o=this.session.reconcile(t,e,r);return a!==t.id&&(this.resetChecklistState(t.id),this.resetEntityLinksState(t.id)),o}updateDraft(t){return this.session.updateDraft(t)}queueSubmit(t){return this.session.queueSubmit(t)}markSubmitted(){return this.session.markSubmitted()}updateRequestedTagIds(t){return this.session.updateRequestedTagIds(t)}beginChecklistLoad(t){var r;const e=this.nextChecklistLoadVersion();return this.checklistState={cardId:t,status:"loading",checklists:((r=this.checklistState)==null?void 0:r.cardId)===t?this.checklistState.checklists:[],error:null},e}applyChecklistLoadSuccess(t,e,r){return this.isCurrentChecklistLoad(t)?(this.checklistState={cardId:e,status:"ready",checklists:r,error:null},!0):!1}applyChecklistLoadError(t,e,r){return this.isCurrentChecklistLoad(t)?(this.checklistState={cardId:e,status:"error",checklists:[],error:r},!0):!1}beginChecklistMutation(t){const e=this.checklistState;return this.checklistState={cardId:t,status:"saving",checklists:(e==null?void 0:e.cardId)===t?e.checklists:[],error:null},this.checklistState}failChecklistMutation(t,e){const r=this.checklistState;this.checklistState={cardId:t,status:"error",checklists:(r==null?void 0:r.cardId)===t?r.checklists:[],error:e}}isChecklistCheckedItemsHidden(t){return this.hiddenCheckedChecklistIds.has(t)}toggleChecklistCheckedItems(t){if(this.hiddenCheckedChecklistIds.has(t)){this.hiddenCheckedChecklistIds.delete(t);return}this.hiddenCheckedChecklistIds.add(t)}isCheckItemComposerExpanded(t){return this.expandedCheckItemComposerIds.has(t)}expandCheckItemComposer(t){this.expandedCheckItemComposerIds.add(t)}collapseCheckItemComposer(t){this.expandedCheckItemComposerIds.delete(t)}async loadChecklists(t){if(!this.checklistPorts)return!1;const e=this.beginChecklistLoad(t);try{const r=await this.checklistPorts.loadChecklists(t);return this.applyChecklistLoadSuccess(e,t,r)}catch{return this.applyChecklistLoadError(e,t,"boards.cardBack.checklistsLoadFailed")}}async createChecklist(t,e){return this.runChecklistMutation(t,()=>this.requireChecklistPorts().createChecklist(t,e))}async deleteChecklist(t,e){return this.runChecklistMutation(t,()=>this.requireChecklistPorts().deleteChecklist(e))}async createCheckItem(t,e,r){const a=await this.runChecklistMutation(t,()=>this.requireChecklistPorts().createCheckItem(e,r));return a&&this.collapseCheckItemComposer(e),a}async patchCheckItem(t,e,r){return this.runChecklistMutation(t,()=>this.requireChecklistPorts().patchCheckItem(e,r))}async deleteCheckItem(t,e){return this.runChecklistMutation(t,()=>this.requireChecklistPorts().deleteCheckItem(e))}async createEntityLink(t,e,r){return this.runEntityLinkMutation(t.id,()=>this.requireEntityLinkPorts().createLink(t.id,e,r))}async createEntityFromCard(t,e){return this.runEntityLinkMutation(t.id,()=>this.requireEntityLinkPorts().createEntityFromCard(t,e))}async unlinkEntity(t,e){return this.runEntityLinkMutation(t.id,()=>this.requireEntityLinkPorts().deleteLink(e.id))}async deleteLinkedEntity(t,e){return this.runEntityLinkMutation(t.id,()=>this.requireEntityLinkPorts().deleteLinkedEntity(t,e))}resetChecklistState(t){this.checklistState={cardId:t,status:"idle",checklists:[],error:null},this.hiddenCheckedChecklistIds.clear(),this.expandedCheckItemComposerIds.clear(),this.invalidateChecklistLoads()}resetEntityLinksState(t){this.entityLinksState={cardId:t,status:"idle",error:null}}nextChecklistLoadVersion(){return this.checklistLoadVersion+=1,this.checklistLoadVersion}invalidateChecklistLoads(){this.checklistLoadVersion+=1}isCurrentChecklistLoad(t){return this.isOpen&&t===this.checklistLoadVersion}async runChecklistMutation(t,e){this.beginChecklistMutation(t);try{const r=await e();if(!r.ok)throw new Error(r.error.code);return this.loadChecklists(t)}catch{return this.failChecklistMutation(t,"boards.cardBack.checklistsSaveFailed"),!0}}async runEntityLinkMutation(t,e){if(!this.isActiveResolvedCard(t))return{status:"ignored",shouldRefresh:!1};this.entityLinksState={cardId:t,status:"saving",error:null};try{const r=await e();if(!r.ok)throw new Error(r.error.code);return this.entityLinksState={cardId:t,status:"idle",error:null},{status:"confirmed",shouldRefresh:this.isActiveCard(t)}}catch{return this.entityLinksState={cardId:t,status:"error",error:"boards.cardLinks.saveFailed"},{status:"rejected",shouldRefresh:this.isActiveCard(t)}}}isActiveCard(t){var e;return this.isOpen&&((e=this.session.snapshot)==null?void 0:e.identity.cardId)===t}isActiveResolvedCard(t){var e;return this.isActiveCard(t)&&((e=this.session.snapshot)==null?void 0:e.identity.isResolved)===!0}requireChecklistPorts(){if(!this.checklistPorts)throw new Error("Card details checklist ports are not configured.");return this.checklistPorts}requireEntityLinkPorts(){if(!this.entityLinkPorts)throw new Error("Card details entity link ports are not configured.");return this.entityLinkPorts}}class xa{constructor(){this.selectedBoardId=null,this.expandedCardComposerColumnId=null,this.cardComposerDrafts=new Map,this.isColumnComposerExpanded=!1,this.columnComposerDraft="",this.editingBoardTitleId=null,this.boardTitleDraft="",this.editingColumnTitleId=null,this.columnTitleDraft="",this.quickEditor=null,this.activeDragKind=null}get snapshot(){return{selectedBoardId:this.selectedBoardId,expandedCardComposerColumnId:this.expandedCardComposerColumnId,cardComposerDrafts:new Map(this.cardComposerDrafts),isColumnComposerExpanded:this.isColumnComposerExpanded,columnComposerDraft:this.columnComposerDraft,editingBoardTitleId:this.editingBoardTitleId,boardTitleDraft:this.boardTitleDraft,editingColumnTitleId:this.editingColumnTitleId,columnTitleDraft:this.columnTitleDraft,quickEditor:this.quickEditor?{...this.quickEditor,anchorRect:{...this.quickEditor.anchorRect}}:null}}syncSelectedBoard(t){this.selectedBoardId!==t&&(this.selectedBoardId=t,this.clearSurfaceSession())}beginRender(t){const r=this.selectedBoardId!==null&&this.selectedBoardId!==t,a=this.selectedBoardId===t;return this.syncSelectedBoard(t),{selectedBoardChanged:r,shouldPreserveScroll:a}}beginCardComposer(t){this.expandedCardComposerColumnId=t,this.cardComposerDrafts.has(t)||this.cardComposerDrafts.set(t,"")}cancelCardComposer(){this.expandedCardComposerColumnId&&this.cardComposerDrafts.delete(this.expandedCardComposerColumnId),this.expandedCardComposerColumnId=null}setCardComposerDraft(t,e){this.cardComposerDrafts.set(t,e)}getCardComposerDraft(t){return this.cardComposerDrafts.get(t)??""}submitCardComposer(t){const e=this.getCardComposerDraft(t).trim();return e?(this.cardComposerDrafts.delete(t),this.expandedCardComposerColumnId===t&&(this.expandedCardComposerColumnId=null),e):null}beginColumnComposer(){this.isColumnComposerExpanded=!0}cancelColumnComposer(){this.isColumnComposerExpanded=!1,this.columnComposerDraft=""}setColumnComposerDraft(t){this.columnComposerDraft=t}submitColumnComposer(){const t=this.columnComposerDraft.trim();return t?(this.isColumnComposerExpanded=!1,this.columnComposerDraft="",t):null}beginBoardTitleEdit(t){this.editingBoardTitleId=t.id,this.boardTitleDraft=t.title}setBoardTitleDraft(t){this.boardTitleDraft=t}finishBoardTitleEdit(t,e){if(this.editingBoardTitleId!==t.id)return null;const r=this.boardTitleDraft.trim();return this.editingBoardTitleId=null,this.boardTitleDraft="",!e||r.length===0||r===t.title?null:r}beginColumnTitleEdit(t){this.editingColumnTitleId=t.id,this.columnTitleDraft=t.title}setColumnTitleDraft(t){this.columnTitleDraft=t}finishColumnTitleEdit(t,e){if(this.editingColumnTitleId!==t.id)return null;const r=this.columnTitleDraft.trim();return this.editingColumnTitleId=null,this.columnTitleDraft="",!e||r.length===0||r===t.title?null:r}openQuickEditor(t,e,r){this.quickEditor={placementId:t,anchorRect:e,titleDraft:r}}setQuickEditorTitleDraft(t,e){var r;((r=this.quickEditor)==null?void 0:r.placementId)===t&&(this.quickEditor.titleDraft=e)}submitQuickEditor(t){var r;if(((r=this.quickEditor)==null?void 0:r.placementId)!==t)return null;const e=this.quickEditor.titleDraft.trim();return e?(this.quickEditor=null,e):null}closeQuickEditor(){this.quickEditor=null}beginDrag(t){this.activeDragKind=t,this.closeQuickEditor()}createCardDropIntent(t,e){return this.activeDragKind=null,{placementId:t,target:e}}createColumnDropIntent(t,e){return this.activeDragKind=null,{columnId:t,target:e}}cancelDrag(){this.activeDragKind=null}reset(){this.selectedBoardId=null,this.clearSurfaceSession()}clearSurfaceSession(){this.expandedCardComposerColumnId=null,this.cardComposerDrafts.clear(),this.isColumnComposerExpanded=!1,this.columnComposerDraft="",this.editingBoardTitleId=null,this.boardTitleDraft="",this.editingColumnTitleId=null,this.columnTitleDraft="",this.quickEditor=null,this.activeDragKind=null}}class ya{constructor(t){this.ports=t,this.importState=null,this.exportState={operation:"idle",result:null,error:null}}get importSnapshot(){return this.importState?et(this.importState):null}get exportSnapshot(){return{...this.exportState}}openImport(t){return this.importState={scope:t.scope,target:t.target,source:"",format:"markdown",policies:{...kr(),mode:"create"},lastPreviewRequest:null,lastPreviewPlan:null,hasCompletedPreview:!1,mode:"edit",operation:"idle",statusOverride:null},et(this.importState)}closeImport(){this.importState=null}setImportSource(t){const e=this.importState;return e?(e.source=t,this.invalidatePreview(e),et(e)):null}setImportFormat(t){const e=this.importState;return e?(e.format=t,this.invalidatePreview(e),et(e)):null}setImportPolicy(t,e){const r=this.importState;return r?(r.policies[t]=e,this.invalidatePreview(r),et(r)):null}showImportEdit(){const t=this.importState;return t?(t.mode="edit",et(t)):null}async previewImport(){const t=this.importState;if(!t)return null;const e=this.createPreviewRequest(t);if(!e)return null;t.operation="previewing",t.statusOverride=null;try{const r=await this.ports.previewImport(e);return t.lastPreviewRequest=e,t.lastPreviewPlan=r,t.hasCompletedPreview=!0,t.mode="review",t.statusOverride=null,r}catch{return t.lastPreviewRequest=null,t.lastPreviewPlan=null,t.statusOverride={messageKey:"boards.import.previewFailed",tone:"error"},null}finally{t.operation="idle"}}async applyImport(){var e;const t=this.importState;if(!(t!=null&&t.lastPreviewRequest)||!((e=t.lastPreviewPlan)!=null&&e.canApply)||t.lastPreviewRequest.policies.mode!=="create")return"ignored";t.operation="applying",t.statusOverride=null;try{const r=await this.ports.applyImport(t.lastPreviewRequest);return!r.ok||!r.data?(t.statusOverride={messageKey:"boards.import.applyFailed",tone:"error"},"failed"):(this.closeImport(),"applied")}catch{return t.statusOverride={messageKey:"boards.import.applyFailed",tone:"error"},"failed"}finally{this.importState===t&&(t.operation="idle")}}async exportData(t){this.exportState={operation:"exporting",result:null,error:null};try{const e=await this.ports.exportData(t);return this.exportState={operation:"idle",result:e,error:e?null:"boards.export.failed"},e}catch{return this.exportState={operation:"idle",result:null,error:"boards.export.failed"},null}}clearExport(){this.exportState={operation:"idle",result:null,error:null}}createPreviewRequest(t){const e=t.source.trim();return e?{raw:e,format:t.format,scope:t.scope,target:t.target,policies:{...t.policies}}:null}invalidatePreview(t){t.lastPreviewRequest=null,t.lastPreviewPlan=null,t.statusOverride=null}}function et(i){return{...i,target:i.target?{...i.target}:void 0,policies:{...i.policies},lastPreviewRequest:i.lastPreviewRequest?{...i.lastPreviewRequest,target:i.lastPreviewRequest.target?{...i.lastPreviewRequest.target}:void 0,policies:{...i.lastPreviewRequest.policies}}:null}}const wa={board:"boards.import.entity.board",column:"boards.import.entity.column",card:"boards.import.entity.card",checklist:"boards.import.entity.checklist",checkItem:"boards.import.entity.checkItem"},ja={create:"boards.import.group.create",update:"boards.import.group.update",skip:"boards.import.group.skip",conflict:"boards.import.group.conflict"};class Pa{constructor(t,e){this.runtime=t,this.controller=e,this.importPreviewOverlay=null,this.exportOutputOverlay=null}openImport(t){this.closeImport(),this.closeExport(),this.controller.openImport({scope:t.scope,target:t.target});const e=()=>this.controller.importSnapshot,{overlay:r,container:a,body:o,footer:n}=wt(this.runtime.i18n.t(t.titleKey),{intent:"info",zIndex:370,onClose:()=>this.closeImport()});a.classList.add(l.importModal),r.setAttribute("data-testid","boards-import-preview-modal");const s=document.createElement("div");s.className=l.importLayout,s.setAttribute("data-testid","boards-import-edit-mode");const d=document.createElement("section");d.className=l.importReview,d.setAttribute("data-testid","boards-import-review-mode");const c=document.createElement("section");c.className=l.importPanel;let u=null;const b=new Te({value:e().format,size:"sm",fullWidth:!0,ariaLabel:this.runtime.i18n.t("boards.import.format"),options:[{id:"markdown",value:"markdown",label:this.runtime.i18n.t("boards.import.formatMarkdown")},{id:"json",value:"json",label:this.runtime.i18n.t("boards.import.formatJson")}],onChange:x=>{this.controller.setImportFormat(x),z(),u==null||u.refresh(),L()}}),m=document.createElement("section");m.className=l.importField;const p=document.createElement("div");p.className=l.importSourceHeader;const f=document.createElement("label");f.className=l.importLabel,f.htmlFor="boards-import-source",f.textContent=this.runtime.i18n.t("boards.import.source");const g=new Qt({id:"boards-import-source",rows:14,placeholder:this.runtime.i18n.t("boards.import.sourcePlaceholder"),className:l.importSource,onInput:()=>{this.controller.setImportSource(g.value),z(),L()}}).createElement();g.spellcheck=!1,g.autocomplete="off",g.wrap="off";const P=document.createElement("section");P.className=l.importPanel,P.append(this.createImportSelect({id:"boards-import-mode",labelKey:"boards.import.mode",value:e().policies.mode,options:[["merge","boards.import.mode.merge"],["create","boards.import.mode.create"],["replace","boards.import.mode.replace"]],onChange:x=>{this.controller.setImportPolicy("mode",x),z(),L()}}),this.createImportSelect({id:"boards-import-match",labelKey:"boards.import.match",value:e().policies.matchStrategy,options:[["title","boards.import.match.title"],["id","boards.import.match.id"],["external_ref","boards.import.match.externalRef"]],onChange:x=>{this.controller.setImportPolicy("matchStrategy",x),z(),L()}}),this.createImportSelect({id:"boards-import-missing",labelKey:"boards.import.missingFields",value:e().policies.missingFieldPolicy,options:[["keep_existing","boards.import.missing.keepExisting"],["use_defaults","boards.import.missing.useDefaults"],["clear_on_replace","boards.import.missing.clearOnReplace"]],onChange:x=>{this.controller.setImportPolicy("missingFieldPolicy",x),z(),L()}}),this.createImportSelect({id:"boards-import-unknown",labelKey:"boards.import.unknownFields",value:e().policies.unknownFieldPolicy,options:[["warn_and_ignore","boards.import.unknown.warn"],["strict_error","boards.import.unknown.strict"]],onChange:x=>{this.controller.setImportPolicy("unknownFieldPolicy",x),z(),L()}}));const w=document.createElement("section");w.className=l.importPreviewPanel,w.setAttribute("data-testid","boards-import-preview-panel"),this.renderImportPreviewPlan(w,null),d.append(w);const _=Nt({className:l.importMessage,ariaLive:"polite"});u=this.createImportFormatGuide({scope:t.scope,getFormat:()=>e().format,onInsertTemplate:()=>{g.value=this.getImportTemplate(t.scope,e().format),this.controller.setImportSource(g.value),z(),L(),g.focus()},onCopyAiPrompt:()=>{this.copyImportAiPrompt(t.scope,e().format)},onClear:()=>{g.value="",this.controller.setImportSource(""),z(),L(),g.focus()}}),p.append(f,u.element),m.append(p,g),c.replaceChildren(b.element,m);const I=document.createElement("aside");I.className=l.importSidePanel,I.append(P),s.append(c,I);const M=document.createElement("div");M.className=l.importActions,M.setAttribute("data-testid","boards-import-action-row");const A=document.createElement("button");A.type="button",A.className=l.importActionButtonSecondary,A.textContent=this.runtime.i18n.t("boards.import.preview"),A.setAttribute("data-testid","boards-import-preview-button");const v=document.createElement("button");v.type="button",v.className=l.importActionButtonPrimary,v.textContent=this.runtime.i18n.t("boards.import.apply"),v.disabled=!0,v.setAttribute("data-testid","boards-import-apply-button");const B=document.createElement("button");B.type="button",B.className=l.importActionButtonSecondary,B.textContent=this.runtime.i18n.t("boards.import.backToEdit"),B.setAttribute("data-testid","boards-import-back-button"),B.addEventListener("click",()=>{this.controller.showImportEdit(),dt(),L(),requestAnimationFrame(()=>g.focus())});const D=document.createElement("button");D.type="button",D.className=l.importActionButtonSecondary,D.textContent=this.runtime.i18n.t("common.close"),D.addEventListener("click",()=>this.closeImport());const F=async()=>{var H;if(!g.value.trim())return;this.controller.setImportSource(g.value);const x=this.controller.previewImport();L(),await x;const R=this.controller.importSnapshot;!R||this.importPreviewOverlay!==r||(this.renderImportPreviewPlan(w,R.lastPreviewPlan,((H=R.lastPreviewRequest)==null?void 0:H.policies.mode)==="create"),dt(),L())},V=async()=>{const x=this.controller.applyImport();L();const R=await x;if(!(this.importPreviewOverlay!==r&&R!=="applied")){if(R==="applied"){this.closeImport(),X(this.runtime.i18n.t("boards.import.applied"),"success");return}L()}},z=()=>{this.renderImportPreviewPlan(w,null)},dt=()=>{o.replaceChildren(e().mode==="review"?d:s)},L=()=>{var G,U,N;const x=e(),R=x.source.trim().length>0,H=x.operation!=="idle",ct=x.lastPreviewRequest!==null,Z=((G=x.lastPreviewPlan)==null?void 0:G.canApply)===!0,lt=((U=x.lastPreviewRequest)==null?void 0:U.policies.mode)==="create",C=x.mode==="review";A.disabled=H||!R,v.disabled=H||!C||!ct||!Z||!lt,A.hidden=C,B.hidden=!C,v.hidden=!C,A.className=l.importActionButtonPrimary,v.className=v.disabled?l.importActionButtonSecondary:l.importActionButtonPrimary,A.textContent=this.runtime.i18n.t(x.hasCompletedPreview?"boards.import.previewUpdate":"boards.import.preview"),x.operation==="previewing"?_.show(this.runtime.i18n.t("boards.import.previewing"),"info"):x.operation==="applying"?_.show(this.runtime.i18n.t("boards.import.applying"),"info"):x.statusOverride?_.show(this.runtime.i18n.t(x.statusOverride.messageKey),x.statusOverride.tone):R?C?ct?Z?lt?_.clear():_.show(this.runtime.i18n.t("boards.import.unsupportedMode"),"warning"):_.show(this.runtime.i18n.t("boards.import.blockedByPlan"),"error"):_.show(this.runtime.i18n.t("boards.import.previewRequired"),"info"):ct?_.clear():_.show(this.runtime.i18n.t("boards.import.previewRequired"),"info"):_.show(this.runtime.i18n.t("boards.import.needSource"),"info");const S=v.disabled?(N=_.element.textContent)==null?void 0:N.trim():"";S?v.title=S:v.removeAttribute("title")};A.addEventListener("click",()=>void F()),v.addEventListener("click",()=>void V()),M.append(D,B,A,v),n.replaceChildren(_.element,M),dt(),L(),this.importPreviewOverlay=r,z(),requestAnimationFrame(()=>g.focus())}async openExport(t){this.closeExport(),this.closeImport();const e=await this.controller.exportData(t.request);if(!e){X(this.runtime.i18n.t("boards.export.failed"),"error");return}const{overlay:r,container:a,body:o,footer:n}=wt(this.runtime.i18n.t(t.titleKey),{intent:"info",zIndex:380,onClose:()=>this.closeExport()});a.classList.add(l.exportModal),r.setAttribute("data-testid","boards-export-output-modal");const s=document.createElement("div");s.className=l.exportContent;const d=document.createElement("p");d.className=l.exportMeta,d.textContent=`${e.fileName} Â· ${e.format.toUpperCase()}`;const c=new Qt({rows:18,value:e.content,className:l.exportOutput}).createElement();c.readOnly=!0,c.setAttribute("data-testid","boards-export-output"),c.addEventListener("focus",()=>c.select()),s.append(d,c),o.replaceChildren(s);const u=fe({variant:"confirm"}),b=document.createElement("button");b.type="button",b.className=jt("default"),b.textContent=this.runtime.i18n.t("common.close"),b.addEventListener("click",()=>this.closeExport());const m=document.createElement("button");m.type="button",m.className=jt("wide"),m.textContent=this.runtime.i18n.t("boards.export.copy"),m.setAttribute("data-testid","boards-export-copy-button"),m.addEventListener("click",()=>{this.copyExportContent(e,c)}),u.append(b,m),n.replaceChildren(u),this.exportOutputOverlay=r,requestAnimationFrame(()=>c.focus())}closeImport(){var t;(t=this.importPreviewOverlay)==null||t.remove(),this.importPreviewOverlay=null,this.controller.closeImport()}closeExport(){var t;(t=this.exportOutputOverlay)==null||t.remove(),this.exportOutputOverlay=null,this.controller.clearExport()}createImportField(t,e){const r=document.createElement("label");r.className=l.importField,r.htmlFor=e;const a=document.createElement("span");return a.className=l.importLabel,a.textContent=this.runtime.i18n.t(t),r.append(a),r}createImportSelect(t){const e=this.createImportField(t.labelKey,t.id),r=document.createElement("select");r.id=t.id,r.className=l.importSelect;for(const[a,o]of t.options){const n=document.createElement("option");n.value=a,n.textContent=this.runtime.i18n.t(o),r.append(n)}return r.value=t.value,r.addEventListener("change",()=>{t.onChange(r.value)}),e.append(r),e}createImportFormatGuide(t){const e=document.createElement("section");e.className=l.importGuide,e.setAttribute("data-testid","boards-import-format-guide");const r=q({icon:"light-bulb",size:"sm",tone:"text",className:l.importGuideHelp,ariaLabel:this.runtime.i18n.t("boards.import.guide.title"),title:this.runtime.i18n.t("boards.import.guide.title")});r.setAttribute("data-testid","boards-import-format-help");const a=document.createElement("div");a.className=l.importGuideActions,a.append(r,this.createImportGuideButton("boards.import.guide.insertTemplate","boards-import-insert-template-button",t.onInsertTemplate),this.createImportGuideButton("boards.import.guide.copyAiPrompt","boards-import-copy-ai-prompt-button",t.onCopyAiPrompt),this.createImportGuideButton("boards.import.guide.clear","boards-import-clear-source-button",t.onClear));const o=()=>{const n=t.getFormat();r.title=this.getImportGuideTooltip(n),r.setAttribute("aria-label",this.runtime.i18n.t("boards.import.guide.title"))};return e.append(a),o(),{element:e,refresh:o}}getImportGuideTooltip(t){return[this.runtime.i18n.t("boards.import.guide.title"),this.runtime.i18n.t(t==="markdown"?"boards.import.guide.markdownSummary":"boards.import.guide.jsonSummary"),this.runtime.i18n.t(t==="markdown"?"boards.import.guide.markdownRequired":"boards.import.guide.jsonRequired"),this.runtime.i18n.t("boards.import.guide.optional"),this.runtime.i18n.t("boards.import.guide.partial"),this.runtime.i18n.t("boards.import.guide.createOnly")].join(`
`)}createImportGuideButton(t,e,r){const a=document.createElement("button");return a.type="button",a.className=l.importGuideButton,a.textContent=this.runtime.i18n.t(t),a.setAttribute("data-testid",e),a.addEventListener("click",r),a}getImportTemplate(t,e){return e==="json"?JSON.stringify({schema:at,version:ot,scope:t,payload:this.getJsonImportTemplatePayload(t)},null,2):t==="column"?["## Column: Backlog","","### Card: First task","Description:","Optional description.","","### Card: Second task"].join(`
`):t==="card"?["### Card: First task","Description:","Optional description.","","Checklist: Steps","- [ ] First step","- [ ] Second step"].join(`
`):["---",'title: "Project board"',"---","","## Column: Backlog","","### Card: First task","Description:","Short task description.","","Checklist: Setup","- [ ] Prepare data","- [x] Confirm format"].join(`
`)}getJsonImportTemplatePayload(t){const e={title:"First task",description:"Optional description.",checklists:[{title:"Steps",items:[{title:"First step",state:"incomplete"},{title:"Second step",state:"complete"}]}]};if(t==="card")return e;const r={title:"Backlog",cards:[e]};return t==="column"?r:{title:"Project board",columns:[r]}}getImportAiPrompt(t,e){const r=t==="board"?"board":t==="column"?"list":"card";return e==="json"?[`Generate a Majom Boards JSON import for one ${r}.`,`Use schema "${at}" and version "${ot}".`,"Use this shape:",this.getImportTemplate(t,"json"),"Return only valid JSON."].join(`

`):[`Generate a Majom Boards Markdown import for one ${r}.`,"Use this format:","- YAML front matter with title for board imports","- ## Column: column name","- ### Card: card title","- Description: optional multiline description","- Checklist: optional checklist title","- - [ ] unchecked item","- - [x] completed item","Missing optional fields are allowed.","Return only Markdown.","",this.getImportTemplate(t,"markdown")].join(`
`)}async copyImportAiPrompt(t,e){var a;const r=this.getImportAiPrompt(t,e);try{if((a=navigator.clipboard)!=null&&a.writeText)await navigator.clipboard.writeText(r);else{const o=document.createElement("textarea");o.value=r,o.style.position="fixed",o.style.left="-9999px",document.body.append(o),o.select(),document.execCommand("copy"),o.remove()}X(this.runtime.i18n.t("boards.import.aiPromptCopied"),"success")}catch{X(this.runtime.i18n.t("boards.import.aiPromptCopyFailed"),"warning")}}renderImportPreviewPlan(t,e,r=!0){if(t.replaceChildren(),!e){const d=document.createElement("h3");d.className=l.importPreviewTitle,d.textContent=this.runtime.i18n.t("boards.import.previewTitle");const c=document.createElement("p");c.className=l.importEmpty,c.textContent=this.runtime.i18n.t("boards.import.previewEmpty"),t.append(d,c);return}const a=document.createElement("header");a.className=l.importReviewHeader;const o=document.createElement("div"),n=document.createElement("p");n.className=l.importReviewEyebrow,n.textContent=this.runtime.i18n.t("boards.import.previewTitle");const s=document.createElement("h3");if(s.className=l.importReviewHeadline,s.textContent=this.runtime.i18n.t(e.canApply?r?"boards.import.status.ready":"boards.import.status.previewOnly":"boards.import.status.blocked"),o.append(n,s),a.append(o),t.append(a),e.items.length>0){const d=document.createElement("div");d.className=l.importPlanGroups,["create","update","skip","conflict"].forEach(c=>{const u=e.items.filter(g=>g.action===c).slice(0,40);if(u.length===0)return;const b=document.createElement("section");b.className=`${l.importPlanGroup} majom-boards-import__plan-group--${c}`;const m=document.createElement("header");m.className=l.importPlanGroupHeader;const p=document.createElement("h4");p.className=l.importPlanGroupTitle,p.textContent=this.runtime.i18n.t(ja[c]),m.append(p);const f=document.createElement("ul");f.className=l.importItems,u.forEach(g=>{const P=document.createElement("li");P.className=l.importItem;const w=document.createElement("span");w.className=l.importItemEntity,w.textContent=this.runtime.i18n.t(wa[g.entity]);const _=document.createElement("span"),I=document.createElement("span");I.className=l.importItemMain,I.textContent=g.title,_.append(I);const M=this.getImportPlanItemMeta(g);if(M){const A=document.createElement("span");A.className=l.importItemMeta,A.textContent=M,_.append(A)}P.append(w,_),f.append(P)}),b.append(m,f),d.append(b)}),t.append(d)}if(e.diagnostics.length>0){const d=document.createElement("ul");d.className=l.importDiagnostics,e.diagnostics.slice(0,20).forEach(c=>{const u=document.createElement("li");u.className=c.level==="error"?l.importDiagnosticError:l.importDiagnosticWarning,u.textContent=c.path?`${c.path}: ${c.message}`:c.message,d.append(u)}),t.append(d)}}getImportPlanItemMeta(t){if(t.action==="create")return null;const e={"ambiguous-title-match":this.runtime.i18n.t("boards.import.reason.ambiguousTitle"),"invalid-source":this.runtime.i18n.t("boards.import.reason.invalidSource"),"matched-by-title":this.runtime.i18n.t("boards.import.reason.matchedByTitle"),"replace-target-not-found":this.runtime.i18n.t("boards.import.reason.replaceTargetNotFound"),"target-board-not-found":this.runtime.i18n.t("boards.import.reason.targetBoardNotFound"),"target-column-not-found":this.runtime.i18n.t("boards.import.reason.targetColumnNotFound")};return t.reason?e[t.reason]??t.path:t.targetId?this.runtime.i18n.t("boards.import.reason.existingTarget"):t.path}async copyExportContent(t,e){var r;try{(r=navigator.clipboard)!=null&&r.writeText?await navigator.clipboard.writeText(t.content):(e.select(),document.execCommand("copy")),X(this.runtime.i18n.t("boards.export.copied"),"success")}catch{e.select(),X(this.runtime.i18n.t("boards.export.copyFailed"),"warning")}}}const Ia=1,Ea=16384,St=[h.boardPickerCoverA,h.boardPickerCoverB,h.boardPickerCoverC,h.boardPickerCoverD,h.boardPickerCoverE,h.boardPickerCoverF],Aa={starred:!1,yourBoards:!1},Ba={formWidth:256,actionsWidth:220,actionsGap:8,viewportMargin:12,minVisibleHeight:220};function mt(i){return i.mirror_source!=null}function _t(i){return i.completedAt!=null}function Y(i,t){const e=i.textContent??"";i.textContent="";const r=$(t,{size:16,strokeWidth:2});r.setAttribute("aria-hidden","true");const a=document.createElement("span");a.textContent=e,i.append(r,a)}function La(i,t,e){const r=i.getButtonElement();r.className=h.headerMenuButton;const a=$(t,{size:16,strokeWidth:2});a.setAttribute("aria-hidden","true"),r.replaceChildren(a),r.title=e,r.setAttribute("aria-label",e)}function Ma(i,t){const e=i.getButtonElement();e.classList.remove("!bg-slate-100","!text-slate-800"),e.dataset.boardsHeaderMenuOpen=t?"true":"false"}function Sa(i){var r;const t=i,e=t.commentsCount??t.commentCount??t.comments_count??((r=t.comments)==null?void 0:r.length)??0;return Number.isFinite(e)&&e>0?e:0}function vt(i){return{id:i.id,title:i.title,color:i.color}}function Ta(i){const t=Array.from(i.id).reduce((e,r)=>e+r.charCodeAt(0),0);return St[t%St.length]??St[0]}function Da(i){return i.title.trim().charAt(0)||"?"}function Na(i){const t=i.trim().replace(/^#/,"");if(!/^[0-9a-f]{6}$/i.test(t))return"#172b4d";const e=parseInt(t.slice(0,2),16),r=parseInt(t.slice(2,4),16),a=parseInt(t.slice(4,6),16);return(.299*e+.587*r+.114*a)/255>.58?"#172b4d":"#ffffff"}function Ra(i){const t=i.checklist_summary,e=Number((t==null?void 0:t.total)??0),r=Number((t==null?void 0:t.completed)??0);return{total:Number.isFinite(e)?e:0,completed:Number.isFinite(r)?r:0}}function ut(i){return i.entity_links??[]}function qa(i){return ut(i).reduce((t,e)=>(t[e.entity_type]+=1,t),{task:0,story:0,goal:0})}function Tt(i){return i==="task"?"check-box":i==="story"?"bookmark":"goal-circle"}function xt(i){return i==="task"?"boards.cardLinks.task":i==="story"?"boards.cardLinks.story":"boards.cardLinks.goal"}function rt(i){var t,e;return((e=(t=i.entity)==null?void 0:t.title)==null?void 0:e.trim())||i.entity_id}function Oa(i){return{left:i.left,top:i.top,right:i.right,bottom:i.bottom,width:i.width,height:i.height}}class $a{constructor(t,e){this.root=t,this.state=null,this.headerMenu=null,this.boardPickerPopover=null,this.quickEditorOverlay=null,this.cardModalOverlay=null,this.cardModalContainer=null,this.cardModalBody=null,this.cardModalTitleElement=null,this.moveCardPopover=null,this.listActionsPopover=null,this.cardActionsPopover=null,this.cardLabelsPopover=null,this.cardChecklistPopover=null,this.cardCheckItemMenuPopover=null,this.cardEntityLinkMenuPopover=null,this.cardModalLabelsHost=null,this.cardModalQuickActionList=null,this.cardModalChecklistHost=null,this.tagItems=[],this.tagCatalogStatus="idle",this.lastNotifiedErrorKey=null,this.surfaceRoot=null,this.overlayRoot=null,this.modalRoot=null,ca(),this.runtime=e.runtime??Ft(),this.tagCatalog=e.tagCatalog??null,this.entityCatalog=e.entityCatalog??null,this.handlers=e.handlers,this.root.className=h.root,this.ensureRenderRoots(),this.surface=new xa,this.scrollCoordinator=new ma(this.root),this.cardDetails=new va({loadChecklists:r=>Promise.resolve(this.handlers.onLoadCardChecklists(r)),createChecklist:(r,a)=>Promise.resolve(this.handlers.onCreateCardChecklist(r,a)),deleteChecklist:r=>Promise.resolve(this.handlers.onDeleteCardChecklist(r)),createCheckItem:(r,a)=>Promise.resolve(this.handlers.onCreateCardCheckItem(r,a)),patchCheckItem:(r,a)=>Promise.resolve(this.handlers.onPatchCardCheckItem(r,a)),deleteCheckItem:r=>Promise.resolve(this.handlers.onDeleteCardCheckItem(r))},{createLink:(r,a,o)=>Promise.resolve(this.handlers.onCreateCardEntityLink(r,a,o)),createEntityFromCard:(r,a)=>Promise.resolve(this.handlers.onCreateCardEntityFromCard(r,a)),deleteLink:r=>Promise.resolve(this.handlers.onDeleteCardEntityLink(r)),deleteLinkedEntity:(r,a)=>Promise.resolve(this.handlers.onDeleteLinkedEntity(r,a))}),this.importExport=new ya({previewImport:r=>Promise.resolve(this.handlers.onPreviewImport(r)),applyImport:r=>Promise.resolve(this.handlers.onApplyImport(r)),exportData:r=>Promise.resolve(this.handlers.onExportData(r))}),this.importExportModals=new Pa(this.runtime,this.importExport),this.dragController=new sa({root:this.root,getState:()=>this.state,onDrop:(r,a)=>this.handleCardPlacementDrop(r,a),onDragStart:()=>this.handleSurfaceDragStart("card")}),this.columnDragController=new aa({root:this.root,getState:()=>this.state,onDrop:(r,a)=>this.handleColumnDrop(r,a),onDragStart:()=>this.handleSurfaceDragStart("column")}),this.dragController.mount(),this.columnDragController.mount(),this.disposeRuntimeSubscription=this.runtime.subscribe(()=>this.refreshFromRuntime(),{emitCurrent:!1})}render(t){this.ensureRenderRoots();const e=this.surface.beginRender(t.selectedBoardId),r=this.scrollCoordinator.capture(e.shouldPreserveScroll);this.state=t,this.notifyStateError(t.error),this.ensureTagCatalogLoaded(),this.dragController.cancelDrag(),this.columnDragController.cancelDrag(),this.surface.cancelDrag(),this.unmountHeaderMenu(),e.selectedBoardChanged&&this.closeBoardPickerPopover(),this.closeListActionsPopover(),this.surfaceRoot.replaceChildren(this.renderShell(t)),this.scrollCoordinator.restore(r),this.refreshQuickCardEditor(t),this.syncCardModal(t),this.refreshBoardPickerPopover(t)}destroy(){this.disposeRuntimeSubscription(),this.dragController.unmount(),this.columnDragController.unmount(),this.unmountHeaderMenu(),this.closeBoardPickerPopover(),this.closeCardLabelsPopover(),this.closeCardChecklistPopover(),this.closeCardCheckItemMenuPopover(),this.closeCardEntityLinkMenuPopover(),this.closeListActionsPopover(),this.closeCardActionsPopover(),this.closeMoveCardPopover(),this.closeQuickCardEditor(),this.closeImportPreviewModal(),this.closeExportOutputModal(),this.closeCardModal(),this.surface.reset(),this.root.replaceChildren(),this.surfaceRoot=null,this.overlayRoot=null,this.modalRoot=null}ensureRenderRoots(){var a,o,n;if(((a=this.surfaceRoot)==null?void 0:a.parentElement)===this.root&&((o=this.overlayRoot)==null?void 0:o.parentElement)===this.root&&((n=this.modalRoot)==null?void 0:n.parentElement)===this.root)return;const t=document.createElement("div");t.className=h.surfaceRoot,t.setAttribute("data-boards-surface-root","true");const e=document.createElement("div");e.className=h.overlayRoot,e.setAttribute("data-boards-overlay-root","true");const r=document.createElement("div");r.className=h.modalRoot,r.setAttribute("data-boards-modal-root","true"),this.root.replaceChildren(t,e,r),this.surfaceRoot=t,this.overlayRoot=e,this.modalRoot=r}notifyStateError(t){if(!t){this.lastNotifiedErrorKey=null;return}t!==this.lastNotifiedErrorKey&&(this.lastNotifiedErrorKey=t,X(this.runtime.i18n.t(t),"error"))}isCommandFailure(t){return typeof t=="object"&&t!==null&&"ok"in t&&!t.ok}notifyCommandFailure(t){t.ok||X(this.runtime.i18n.t(t.error.messageKey),"error")}isPromiseLike(t){return typeof t=="object"&&t!==null&&"then"in t&&typeof t.then=="function"}refreshFromRuntime(){this.state&&this.render(this.state)}closeTransientBoardOverlays(){this.closeBoardPickerPopover(),this.closeListActionsPopover(),this.closeCardActionsPopover(),this.closeCardLabelsPopover(),this.closeCardChecklistPopover(),this.closeCardCheckItemMenuPopover(),this.closeCardEntityLinkMenuPopover(),this.closeMoveCardPopover(),this.closeQuickCardEditor()}ensureTagCatalogLoaded(){!this.tagCatalog||this.tagCatalogStatus!=="idle"||(this.tagCatalogStatus="loading",this.tagCatalog.loadTags().then(t=>{this.tagItems=t.map(vt),this.tagCatalogStatus="ready",this.rerenderCurrentState()}).catch(()=>{this.tagItems=[],this.tagCatalogStatus="error",this.rerenderCurrentState()}))}getTagPickerErrorMessage(){return this.tagCatalogStatus==="error"?this.runtime.i18n.t("boards.cardBack.tagsLoadFailed"):null}renderShell(t){const e=document.createElement("section");if(e.className=h.shell,e.append(this.renderHeader(t)),t.status==="loading"&&t.boards.length===0)return e.append(this.renderMessage(this.runtime.i18n.t("boards.loading"))),e;if(t.boards.length===0)return e.append(this.renderEmptyState()),e;const r=this.getSelectedBoard(t);return e.append(r?this.renderBoard(r,t):this.renderMessage(this.runtime.i18n.t("boards.empty"))),e}renderHeader(t){const e=document.createElement("header");e.className=h.header;const r=this.getSelectedBoard(t),a=document.createElement("div");a.className=h.titleBlock;const o=document.createElement("div");o.className=h.titleRow,o.append(this.renderBoardTitle(r,t)),t.boards.length>0&&o.append(this.renderBoardPickerButton(r,t)),a.append(o);const n=document.createElement("div");return n.className=h.headerActions,n.append(this.renderHeaderMenu(r,t)),e.append(a,n),e}renderBoardTitle(t,e){const r=document.createElement("h1");r.className=h.title;const a=this.surface.snapshot;if(!t||a.editingBoardTitleId!==t.id){const n=document.createElement("button");return n.type="button",n.className=h.titleButton,n.textContent=(t==null?void 0:t.title)??this.runtime.i18n.t("boards.title"),n.disabled=!t||e.status==="saving",n.title=this.runtime.i18n.t("boards.actions.renameBoard"),n.setAttribute("aria-label",this.runtime.i18n.t("boards.actions.renameBoard")),n.addEventListener("click",()=>{t&&this.startBoardTitleEdit(t)}),r.append(n),r}const o=tt({variant:"inline",type:"text",value:a.boardTitleDraft,autoComplete:"off",maxLength:512,className:h.titleEditInput,onKeyDown:n=>{if(n.key==="Enter"){n.preventDefault(),this.surface.setBoardTitleDraft(o.value),this.finishBoardTitleEdit(t,!0);return}n.key==="Escape"&&(n.preventDefault(),this.surface.setBoardTitleDraft(o.value),this.finishBoardTitleEdit(t,!1))}});return o.setAttribute("aria-label",this.runtime.i18n.t("boards.boardTitlePlaceholder")),o.addEventListener("input",()=>{this.surface.setBoardTitleDraft(o.value)}),o.addEventListener("blur",()=>{this.surface.setBoardTitleDraft(o.value),this.finishBoardTitleEdit(t,!0)}),r.append(o),requestAnimationFrame(()=>{o.focus(),o.select()}),r}renderBoardPickerButton(t,e){const r=this.runtime.i18n.t("boards.boardPicker.open"),a=q({icon:"kanban",tone:"text",size:"sm",className:h.boardPickerButton,title:r,ariaLabel:r,disabled:!t||e.status==="saving"}),o=document.createElement("span");o.className=h.boardPickerButtonContent;const n=$("kanban",{size:16,strokeWidth:2});n.setAttribute("aria-hidden","true");const s=$("chevron-down",{size:14,strokeWidth:2});return s.setAttribute("aria-hidden","true"),o.append(n,s),De(a,o),a.setAttribute("aria-haspopup","dialog"),a.setAttribute("aria-expanded","false"),a.setAttribute("data-testid","board-picker-button"),a.addEventListener("click",d=>{var c;if(d.stopPropagation(),((c=this.boardPickerPopover)==null?void 0:c.trigger)===a){this.closeBoardPickerPopover();return}this.openBoardPickerPopover(a,e)}),a}openBoardPickerPopover(t,e,r){this.closeTransientBoardOverlays();const a=r?{query:r.query,activeFilter:r.activeFilter,collapsedSections:{...r.collapsedSections}}:{query:"",activeFilter:"all",collapsedSections:{...Aa}},o=K({elevated:!0,className:`${h.boardPickerPopover} hidden`});o.setAttribute("data-testid","board-picker-popover");const n=this.renderBoardPickerPopoverContent(o,e,a),s=this.createBoardPickerAnchoredMenu(t,o);s.mount(),this.boardPickerPopover={menu:s,panel:o,trigger:t,viewState:a,actionsMenu:null},this.openBoardPickerAnchoredMenu(s,t),requestAnimationFrame(()=>n.focus())}refreshBoardPickerPopover(t){const e=this.boardPickerPopover;if(!e)return;const r=this.root.querySelector('[data-testid="board-picker-button"]');if(!r||r.disabled){this.closeBoardPickerPopover();return}this.closeBoardPickerActionsMenu(),e.trigger.setAttribute("aria-expanded","false"),e.menu.unmount(),e.trigger=r,this.renderBoardPickerPopoverContent(e.panel,t,e.viewState);const a=this.createBoardPickerAnchoredMenu(r,e.panel);e.menu=a,a.mount(),this.openBoardPickerAnchoredMenu(a,r)}createBoardPickerAnchoredMenu(t,e){const r=new W({container:t,panel:e,positioning:"viewport",panelZIndex:290,onOpenChange:a=>{var o;t.setAttribute("aria-expanded",a?"true":"false"),!a&&((o=this.boardPickerPopover)==null?void 0:o.menu)===r&&this.closeBoardPickerPopover()}});return r}openBoardPickerAnchoredMenu(t,e){t.openAt({anchor:e,placement:"bottom-start",fallbackPlacements:["bottom-end","top-start","top-end"],gap:8,margin:12,lockPlacementAfterOpen:!0})}renderBoardPickerPopoverContent(t,e,r){const a=this.getSelectedBoard(e),o=document.createElement("div");o.className=h.boardPickerSearchWrap;const n=$("magnifying-glass",{size:18,strokeWidth:2});n.setAttribute("aria-hidden","true"),n.classList.add(h.boardPickerSearchIcon);const s=tt({type:"search",autoComplete:"off",placeholder:this.runtime.i18n.t("boards.boardPicker.searchPlaceholder"),className:h.boardPickerSearchInput,onInput:m=>{r.query=m.trim().toLowerCase(),b()},onKeyDown:m=>{m.key==="Escape"&&(m.preventDefault(),this.closeBoardPickerPopover())}});s.setAttribute("aria-label",this.runtime.i18n.t("boards.boardPicker.searchLabel")),s.value=r.query,o.append(n,s);const d=document.createElement("div");d.className=h.boardPickerChips;const c=document.createElement("div");c.className=h.boardPickerSections;const u=()=>{d.replaceChildren(...this.getBoardPickerFilterOptions().map(m=>this.renderBoardPickerChip({label:m.label,selected:r.activeFilter===m.value,onClick:()=>{r.activeFilter=m.value,u(),b(),s.focus()}})))},b=()=>{c.replaceChildren();const m=this.getBoardPickerVisibleBoards(e.boards,r.activeFilter,r.query),p=this.getBoardPickerGroupedBoards(m);if(r.activeFilter==="all"){const f=m.filter(yt);f.length>0&&c.append(this.renderBoardPickerSection({id:"starred",label:this.runtime.i18n.t("boards.boardPicker.starred"),boards:f,selectedBoardId:a==null?void 0:a.id,viewState:r,allowEmpty:!1,onToggle:b}))}p.groups.forEach(f=>{c.append(this.renderBoardPickerSection({id:`group:${f.id}`,label:f.name,boards:f.boards,allBoards:e.boards,selectedBoardId:a==null?void 0:a.id,viewState:r,allowEmpty:!1,onToggle:b}))}),(p.ungrouped.length>0||p.groups.length===0||m.length===0)&&c.append(this.renderBoardPickerSection({id:"yourBoards",label:this.runtime.i18n.t("boards.boardPicker.yourBoards"),boards:p.groups.length>0?p.ungrouped:m,allBoards:e.boards,selectedBoardId:a==null?void 0:a.id,viewState:r,allowEmpty:!0,showCreateBoardCard:r.activeFilter==="all",onToggle:b}))};return u(),b(),t.replaceChildren(o,d,c),s}getBoardPickerFilterOptions(){return[{value:"all",label:this.runtime.i18n.t("boards.boardPicker.all")},{value:"starred",label:this.runtime.i18n.t("boards.boardPicker.starred")},{value:"recent",label:this.runtime.i18n.t("boards.boardPicker.recent")}]}getBoardPickerVisibleBoards(t,e,r){const a=r.trim().toLowerCase(),o=t.filter(n=>a&&!n.title.toLowerCase().includes(a)?!1:e==="starred"?yt(n):e==="recent"?At(n)!==null:!0);return e!=="recent"?o:[...o].sort((n,s)=>(At(s)??0)-(At(n)??0))}getBoardPickerGroupedBoards(t){const e=new Map,r=[];return t.forEach(a=>{const o=qt(a);if(!o){r.push(a);return}const n=e.get(o.id);if(n){n.boards.push(a);return}e.set(o.id,{...o,boards:[a]})}),{groups:Array.from(e.values()).sort((a,o)=>a.name.localeCompare(o.name)),ungrouped:r}}renderBoardPickerChip(t){const e=document.createElement("button");return e.type="button",e.className=t.selected?h.boardPickerChipSelected:h.boardPickerChip,e.textContent=t.label,e.addEventListener("click",t.onClick),e}renderBoardPickerSection(t){const e=t.viewState.collapsedSections[t.id],r=document.createElement("section");r.className=h.boardPickerSection,r.dataset.boardPickerSection=t.id;const a=document.createElement("h2");a.className=h.boardPickerSectionTitle;const o=document.createElement("button");o.type="button",o.className=h.boardPickerSectionToggle,o.setAttribute("aria-expanded",e?"false":"true");const n=$("chevron-down",{size:16,strokeWidth:2});n.setAttribute("aria-hidden","true"),n.classList.toggle(h.boardPickerSectionIconCollapsed,e);const s=document.createElement("span");s.textContent=t.label,o.append(n,s),o.addEventListener("click",()=>{t.viewState.collapsedSections[t.id]=!e,t.onToggle()}),a.append(o);const d=document.createElement("div");if(d.className=h.boardPickerGrid,d.hidden=e,t.boards.length===0&&t.allowEmpty){const c=document.createElement("p");c.className=h.boardPickerEmpty,c.textContent=this.runtime.i18n.t("boards.boardPicker.noResults"),d.append(c)}else t.boards.forEach(c=>{d.append(this.renderBoardPickerCard(c,t.selectedBoardId,t.allBoards))});return t.showCreateBoardCard&&d.append(this.renderBoardPickerCreateCard()),r.append(a,d),r}renderBoardPickerCreateCard(){const t=document.createElement("button");return t.type="button",t.className=h.boardPickerCreateCard,t.textContent=this.runtime.i18n.t("boards.boardPicker.createBoard"),t.addEventListener("click",()=>{this.closeBoardPickerPopover(),this.handlers.onCreateBoard(this.runtime.i18n.t("boards.defaultBoardTitle"))}),t}renderBoardPickerCard(t,e,r){const a=t.id===e,o=yt(t),n=document.createElement("div");n.className=a?h.boardPickerCardSelected:h.boardPickerCard;const s=document.createElement("button");s.type="button",s.className=h.boardPickerCardButton,s.setAttribute("aria-label",t.title),s.setAttribute("aria-current",a?"true":"false"),s.dataset.boardPickerBoardId=t.id,s.addEventListener("click",()=>{this.closeBoardPickerPopover(),this.handlers.onSelectBoard(t.id)});const d=document.createElement("div");d.className=`${h.boardPickerCover} ${Ta(t)}`.trim();const c=document.createElement("span");c.className=h.boardPickerCoverInitial,c.textContent=Da(t),d.append(c);const u=document.createElement("span");u.className=h.boardPickerCardTitle,u.textContent=t.title,s.append(d,u);const b=q({icon:o?"star-solid":"star",tone:"text",size:"sm",className:o?h.boardPickerStarButtonActive:h.boardPickerStarButton,title:this.runtime.i18n.t(o?"boards.boardPicker.unstar":"boards.boardPicker.star"),ariaLabel:this.runtime.i18n.t(o?"boards.boardPicker.unstar":"boards.boardPicker.star"),onClick:p=>{p.stopPropagation(),this.handlers.onToggleBoardStar(t.id)}});b.setAttribute("aria-pressed",o?"true":"false");const m=q({icon:"ellipsis-horizontal",tone:"text",size:"sm",className:h.boardPickerActionsButton,title:this.runtime.i18n.t("boards.boardPicker.actions"),ariaLabel:this.runtime.i18n.t("boards.boardPicker.actions"),onClick:p=>{p.stopPropagation(),this.openBoardPickerActionsMenu(t,r,m)}});return n.append(s,b,m),n}openBoardPickerActionsMenu(t,e,r){var s;const a=this.boardPickerPopover;if(!a)return;if(((s=a.actionsMenu)==null?void 0:s.boardId)===t.id){this.closeBoardPickerActionsMenu();return}this.closeBoardPickerActionsMenu();const o=K({elevated:!0,className:`${h.boardPickerActionsMenu} hidden`});o.addEventListener("mousedown",d=>d.stopPropagation());const n=new W({container:r,panel:o,positioning:"viewport",panelZIndex:310,onOpenChange:d=>{var c,u;!d&&((u=(c=this.boardPickerPopover)==null?void 0:c.actionsMenu)==null?void 0:u.menu)===n&&this.closeBoardPickerActionsMenu()}});a.panel.append(o),n.mount(),a.actionsMenu={menu:n,panel:o,boardId:t.id},this.renderBoardPickerActionsMenu(t,e),n.openAt({anchor:r,placement:"right-start",fallbackPlacements:["left-start","bottom-end","top-end"],gap:4,margin:8,lockPlacementAfterOpen:!0})}renderBoardPickerActionsMenu(t,e,r="menu"){var n;const a=(n=this.boardPickerPopover)==null?void 0:n.actionsMenu;if(!a)return;if(a.panel.replaceChildren(),r==="createGroup"){a.panel.append(this.renderBoardPickerCreateGroupInput(t,e));return}const o=qt(t);Ot(e).filter(s=>s.id!==(o==null?void 0:o.id)).forEach(s=>{a.panel.append(Et({label:this.runtime.i18n.t("boards.boardPicker.moveToGroup",{group:s.name}),onClick:d=>{d.stopPropagation(),this.handlers.onUpdateBoardGroup(t.id,s),this.closeBoardPickerActionsMenu()}}))}),o&&a.panel.append(Et({label:this.runtime.i18n.t("boards.boardPicker.removeFromGroup"),onClick:s=>{s.stopPropagation(),this.handlers.onUpdateBoardGroup(t.id,null),this.closeBoardPickerActionsMenu()}})),a.panel.childElementCount>0&&a.panel.append(Ne({tone:"soft"})),a.panel.append(Et({label:this.runtime.i18n.t("boards.boardPicker.createGroup"),onClick:s=>{s.stopPropagation(),this.renderBoardPickerActionsMenu(t,e,"createGroup")}}))}renderBoardPickerCreateGroupInput(t,e){const r=document.createElement("div");r.className=h.boardPickerActionsInputRow;const a=tt({variant:"inline",value:"",type:"text",className:h.boardPickerActionsInput});a.placeholder=this.runtime.i18n.t("boards.boardPicker.newGroupPlaceholder");let o=!1;const n=s=>{if(o)return;o=!0;const d=s?a.value.trim():"";if(!d){this.renderBoardPickerActionsMenu(t,e);return}const u=Ot(e).find(b=>b.name.toLowerCase()===d.toLowerCase())??{id:or(d,e),name:d};this.handlers.onUpdateBoardGroup(t.id,u),this.closeBoardPickerActionsMenu()};return a.addEventListener("blur",()=>n(!0)),a.addEventListener("keydown",s=>{s.key==="Enter"?(s.preventDefault(),n(!0)):s.key==="Escape"&&(s.preventDefault(),n(!1))}),r.append(a),requestAnimationFrame(()=>a.focus()),r}renderHeaderMenu(t,e){let r;return r=new Re({label:this.runtime.i18n.t("boards.actions.menu"),ariaLabel:this.runtime.i18n.t("boards.actions.menu"),title:this.runtime.i18n.t("boards.actions.menu"),variant:"plain",size:"md",buttonClassName:h.headerMenuButton,placement:"bottom-end",fallbackPlacements:["bottom-start","top-end","top-start"],onOpenChange:a=>Ma(r,a),items:[{id:"create-board",label:this.runtime.i18n.t("boards.actions.createBoard"),disabled:e.status==="saving",onSelect:()=>{this.handlers.onCreateBoard(this.runtime.i18n.t("boards.defaultBoardTitle"))}},{id:"import-board",label:this.runtime.i18n.t("boards.import.actions.importBoard"),disabled:!t||e.status==="saving",onSelect:()=>{this.openImportPreviewModal({scope:"board",titleKey:"boards.import.title.board"})}},{id:"export-board-markdown",label:this.runtime.i18n.t("boards.export.actions.boardMarkdown"),disabled:!t,onSelect:()=>{t&&this.openExportOutputModal({titleKey:"boards.export.title.board",request:{scope:"board",format:"markdown",boardId:t.id}})}},{id:"export-board-json",label:this.runtime.i18n.t("boards.export.actions.boardJson"),disabled:!t,onSelect:()=>{t&&this.openExportOutputModal({titleKey:"boards.export.title.board",request:{scope:"board",format:"json",boardId:t.id}})}},{id:"delete-board",label:this.runtime.i18n.t("boards.actions.deleteBoard"),disabled:!t||e.status==="saving",onSelect:()=>{t&&this.handlers.onDeleteBoard(t.id)}}]}),La(r,"ellipsis-horizontal",this.runtime.i18n.t("boards.actions.menu")),this.headerMenu=r,r.mount(),r.element}renderBoard(t,e){const r=document.createElement("div");r.className=h.body;const a=document.createElement("div");return a.className=h.canvas,a.setAttribute("aria-label",t.title),a.dataset.boardCanvas="true",t.columns.forEach(o=>{a.append(this.renderColumn(t,o,e))}),a.append(this.renderColumnComposer(t,e)),r.append(a),r}renderColumn(t,e,r){const a=document.createElement("section");a.className=h.column,a.dataset.boardColumnId=String(e.id),a.dataset.boardColumnDraggable="true";const o=document.createElement("header");o.className=h.columnHeader,o.append(this.renderColumnTitle(e,r));const n=q({icon:"ellipsis-horizontal",tone:"text",size:"sm",className:`${h.iconButton} ${h.columnMenuButton}`,title:this.runtime.i18n.t("boards.listActions.title"),ariaLabel:this.runtime.i18n.t("boards.listActions.title"),disabled:r.status==="saving"});n.setAttribute("aria-haspopup","dialog"),n.setAttribute("aria-expanded","false"),n.setAttribute("data-testid","list-actions-menu-button"),n.dataset.boardDragIgnore="true",n.addEventListener("click",d=>{var c;if(d.stopPropagation(),((c=this.listActionsPopover)==null?void 0:c.trigger)===n){this.closeListActionsPopover();return}this.openListActionsPopover(n,t,e)}),o.append(n);const s=document.createElement("div");return s.className=h.cards,s.dataset.boardCardsContainer="true",e.cards.forEach(d=>s.append(this.renderCard(d))),a.append(o,s,this.renderCardComposer(e,r)),a}renderColumnTitle(t,e){const r=this.surface.snapshot;if(r.editingColumnTitleId===t.id){const n=document.createElement("input");return n.className=h.columnTitleInput,n.type="text",n.value=r.columnTitleDraft,n.maxLength=512,n.autocomplete="off",n.setAttribute("aria-label",this.runtime.i18n.t("boards.columnTitlePlaceholder")),n.addEventListener("input",()=>{this.surface.setColumnTitleDraft(n.value)}),n.addEventListener("keydown",s=>{if(s.key==="Enter"){s.preventDefault(),this.surface.setColumnTitleDraft(n.value),this.finishColumnTitleEdit(t,!0);return}s.key==="Escape"&&(s.preventDefault(),this.surface.setColumnTitleDraft(n.value),this.finishColumnTitleEdit(t,!1))}),n.addEventListener("blur",()=>{this.surface.setColumnTitleDraft(n.value),this.finishColumnTitleEdit(t,!0)}),requestAnimationFrame(()=>{n.focus(),n.select()}),n}const a=document.createElement("button");a.type="button",a.className=h.columnTitleButton,a.disabled=e.status==="saving",a.title=this.runtime.i18n.t("boards.actions.renameColumn"),a.setAttribute("aria-label",this.runtime.i18n.t("boards.actions.renameColumn")),a.addEventListener("click",()=>this.startColumnTitleEdit(t));const o=document.createElement("span");return o.className=h.columnTitle,o.textContent=t.title,a.append(o),a}openListActionsPopover(t,e,r){this.closeListActionsPopover();const a=K({elevated:!0,className:`${l.listActionsPopover} hidden`});a.setAttribute("role","dialog"),a.setAttribute("aria-modal","false"),a.setAttribute("aria-labelledby","list-actions-menu"),a.setAttribute("data-testid","list-actions-popover"),a.addEventListener("mousedown",u=>u.stopPropagation());const o=document.createElement("header");o.className=l.listActionsHeader;const n=document.createElement("h2");n.id="list-actions-menu",n.className=l.listActionsTitle,n.textContent=this.runtime.i18n.t("boards.listActions.title");const s=q({icon:"x-mark",tone:"text",size:"sm",className:l.iconButton,ariaLabel:this.runtime.i18n.t("common.close"),title:this.runtime.i18n.t("common.close"),onClick:()=>this.closeListActionsPopover()});o.append(n,s);const d=document.createElement("div");d.className=l.listActionsBody,d.append(this.renderListActionList([this.createListActionButton({labelKey:"boards.listActions.addCard",testId:"list-actions-add-card-button",onClick:()=>{this.closeListActionsPopover(),this.expandCardComposer(r.id)}}),this.createListActionButton({labelKey:"boards.import.actions.importColumn",testId:"list-actions-import-column-button",onClick:()=>{this.closeListActionsPopover(),this.openImportPreviewModal({scope:"column",titleKey:"boards.import.title.column",target:{boardId:e.id,columnId:r.id}})}}),this.createListActionButton({labelKey:"boards.export.actions.columnMarkdown",testId:"list-actions-export-column-markdown-button",onClick:()=>{this.closeListActionsPopover(),this.openExportOutputModal({titleKey:"boards.export.title.column",request:{scope:"column",format:"markdown",columnId:r.id}})}}),this.createListActionButton({labelKey:"boards.export.actions.columnJson",testId:"list-actions-export-column-json-button",onClick:()=>{this.closeListActionsPopover(),this.openExportOutputModal({titleKey:"boards.export.title.column",request:{scope:"column",format:"json",columnId:r.id}})}}),this.createListActionButton({labelKey:"boards.listActions.copyList",testId:"list-actions-copy-list-button",disabled:!0}),this.createListActionButton({labelKey:"boards.listActions.moveList",testId:"list-actions-move-list-button",disabled:!0}),this.createListActionButton({labelKey:"boards.listActions.moveAllCards",testId:"list-actions-move-all-cards-button",disabled:!0}),this.createListActionButton({labelKey:"boards.listActions.sortBy",disabled:!0}),this.createListActionButton({labelKey:"boards.listActions.watch",testId:"list-actions-watch-list-button",disabled:!0})]),this.renderListActionsDivider(),this.renderListActionsColorSection(),this.renderListActionsDivider(),this.renderListActionList([this.createListActionButton({labelKey:"boards.listActions.archiveList",testId:"list-actions-archive-list-button",onClick:()=>{this.closeListActionsPopover(),this.handlers.onDeleteColumn(r.id)}}),this.createListActionButton({labelKey:"boards.listActions.deleteList",testId:"list-actions-delete-list-button",onClick:()=>{this.closeListActionsPopover(),this.handlers.onDeleteColumn(r.id)}}),this.createListActionButton({labelKey:"boards.listActions.archiveAllCards",disabled:!0})])),a.append(o,d);let c;c=new W({container:t,panel:a,positioning:"viewport",panelZIndex:290,onOpenChange:u=>{var b;t.setAttribute("aria-expanded",u?"true":"false"),!u&&((b=this.listActionsPopover)==null?void 0:b.menu)===c&&this.closeListActionsPopover()}}),c.mount(),this.listActionsPopover={menu:c,panel:a,trigger:t},c.openAt({anchor:t,placement:"bottom-end",fallbackPlacements:["bottom-start","top-end","top-start"],gap:8,margin:12,lockPlacementAfterOpen:!0})}renderListActionList(t){const e=document.createElement("ul");return e.className=l.listActionsList,t.forEach(r=>{const a=document.createElement("li");a.className=l.listActionsItem,a.append(r),e.append(a)}),e}createListActionButton(t){const e=j({text:this.runtime.i18n.t(t.labelKey),tone:"text",size:"md",className:l.listActionsButton,disabled:t.disabled,onClick:t.onClick});return t.testId&&e.setAttribute("data-testid",t.testId),e}renderListActionsDivider(){const t=document.createElement("div");return t.className=l.listActionsDivider,t.setAttribute("role","separator"),t}renderListActionsColorSection(){const t=document.createElement("section");t.className=l.listActionsSection;const e=j({text:this.runtime.i18n.t("boards.listActions.changeListColor"),tone:"text",size:"md",className:l.listActionsSectionButton,disabled:!0}),r=$("chevron-up",{size:16,strokeWidth:2});r.setAttribute("aria-hidden","true"),e.append(r);const a=document.createElement("div");a.className=l.listActionsUpgrade;const o=document.createElement("p");o.className=l.listActionsUpgradeTitle,o.textContent=this.runtime.i18n.t("boards.listActions.colorUpgradeTitle");const n=document.createElement("p");return n.className=l.listActionsUpgradeCopy,n.textContent=this.runtime.i18n.t("boards.listActions.colorUpgradeBody"),a.append(o,n),t.append(e,a),t}renderCard(t){const e=y(t),r=_t(t),a=document.createElement("article"),o=r?h.cardCompleted:h.card;a.className=mt(t)?`${o} ${h.cardMirror}`:o,a.dataset.boardCardId=String(t.id),a.dataset.boardCardPlacementId=String(e),a.dataset.boardCardDraggable="true",a.addEventListener("contextmenu",m=>{m.preventDefault(),m.stopPropagation(),this.openQuickCardEditor(e,a.getBoundingClientRect())});const n=document.createElement("button");n.type="button",n.className=h.cardOpenButton,n.dataset.boardCardOpen=String(e),n.setAttribute("aria-label",this.runtime.i18n.t("boards.actions.openCard")),n.addEventListener("click",()=>this.openCardModal(e));const s=document.createElement("h3");s.className=h.cardTitle,s.textContent=t.title;const d=this.createCardCompletionToggle(t,{className:r?h.cardCompleteToggleCompleted:h.cardCompleteToggle,testId:"board-card-completion-toggle"}),c=this.renderCardMirrorSourceLabel(t,h.cardSourceLabel),u=this.renderCardFrontTags(t);c&&n.append(c),u&&n.append(u),n.append(s);const b=this.renderCardFrontBadges(t);return b&&n.append(b),a.append(d,n),a}createCardCompletionToggle(t,e){const r=_t(t),a=this.runtime.i18n.t(r?"boards.cardBack.markIncomplete":"boards.cardBack.markComplete",{title:t.title}),o=this.runtime.i18n.t(r?"boards.cardBack.markIncompleteHint":"boards.cardBack.markCompleteHint"),n=document.createElement("button");n.type="button",n.className=e.className,n.title=o,n.dataset.testid=e.testId,n.dataset.boardDragIgnore="true",n.setAttribute("aria-label",a),n.setAttribute("aria-pressed",r?"true":"false");const s=document.createElement("span");return s.className="majom-boards__completion-mark",s.setAttribute("aria-hidden","true"),n.append(s),n.addEventListener("pointerdown",d=>{d.stopPropagation()}),n.addEventListener("click",d=>{d.preventDefault(),d.stopPropagation(),this.toggleCardCompletion(t)}),n}toggleCardCompletion(t){const e={completedAt:_t(t)?null:new Date};this.handlers.onPatchCard(t.id,e)}renderCardFrontTags(t){var r;if(!((r=t.tags)!=null&&r.length))return null;const e=document.createElement("div");return e.className=h.cardTags,e.setAttribute("data-testid","board-card-tags"),t.tags.forEach(a=>{e.append(this.createCardTagChip(a,h.cardTag))}),e}createCardTagChip(t,e){const r=document.createElement("span");return r.className=e,r.title=t.title,r.setAttribute("aria-label",t.title),r.setAttribute("role","img"),r.setAttribute("data-testid","compact-card-label"),r.style.backgroundColor=t.color,r}renderCardFrontBadges(t){const e=document.createElement("div");e.className=h.cardBadges,t.description.trim()&&e.append(this.createCardFrontBadge("bars-3-bottom-left",this.runtime.i18n.t("boards.cardDescriptionLabel"),void 0,"plain"));const r=Sa(t);r>0&&e.append(this.createCardFrontBadge("chat-bubble-bottom-center-text",this.runtime.i18n.t("boards.cardBack.comments"),String(r),"neutral"));const a=Ra(t);a.total>0&&e.append(this.createCardFrontBadge("check-box",this.runtime.i18n.t("boards.cardBack.checklist"),`${a.completed}/${a.total}`,"neutral"));const o=qa(t);return[{type:"goal",tone:"goal",labelKey:"boards.cardLinks.goalBadge"},{type:"story",tone:"story",labelKey:"boards.cardLinks.storyBadge"},{type:"task",tone:"task",labelKey:"boards.cardLinks.taskBadge"}].forEach(s=>{const d=o[s.type];d<=0||e.append(this.createCardFrontBadge(Tt(s.type),this.runtime.i18n.t(s.labelKey),String(d),s.tone))}),e.childElementCount>0?e:null}renderCardMirrorSourceLabel(t,e){if(!t.mirror_source)return null;const r=t.mirror_source,a=this.runtime.i18n.t("boards.cardMirror.sourceLocation",{board:r.board_title,list:r.column_title}),o=document.createElement("span");return o.className=e,o.setAttribute("data-testid","card-mirror-source-label"),o.textContent=a,o.title=this.runtime.i18n.t("boards.cardMirror.sourceLabel",{source:a}),o.setAttribute("aria-label",o.title),o}createCardFrontBadge(t,e,r,a="neutral"){const o=document.createElement("span"),n={plain:h.cardBadgePlain,neutral:h.cardBadgeNeutral,task:h.cardBadgeTask,story:h.cardBadgeStory,goal:h.cardBadgeGoal};o.className=n[a],o.title=e,o.setAttribute("aria-label",r?`${e}: ${r}`:e);const s=$(t,{size:16,strokeWidth:2});if(s.setAttribute("aria-hidden","true"),o.append(s),r){const d=document.createElement("span");d.textContent=r,o.append(d)}return o}renderCardComposer(t,e){const r=this.surface.snapshot;return We({expanded:r.expandedCardComposerColumnId===t.id,collapsedLabel:this.runtime.i18n.t("boards.actions.createCard"),submitLabel:this.runtime.i18n.t("boards.actions.createCard"),cancelLabel:this.runtime.i18n.t("boards.actions.cancelNewCard"),placeholder:this.runtime.i18n.t("boards.cardComposerPlaceholder"),ariaLabel:this.runtime.i18n.t("boards.cardTitleLabel"),classNames:{root:h.cardComposer,collapsedButton:h.cardComposerCollapsed,expandedForm:h.cardComposerExpanded,textarea:h.cardComposerTextarea,actions:h.composerActions,submitButton:h.primaryButton,cancelButton:h.composerCancelButton},disabled:e.status==="saving",rows:2,value:this.surface.getCardComposerDraft(t.id),textareaTestId:"list-card-composer-textarea",focusOnRender:!0,dragIgnoreDatasetKey:"boardDragIgnore",onExpand:()=>this.expandCardComposer(t.id),onInput:a=>this.surface.setCardComposerDraft(t.id,a),onSubmit:a=>this.submitCard(t.id,a),onCancel:()=>this.collapseCardComposer()}).element}renderColumnComposer(t,e){const r=this.surface.snapshot,a=document.createElement("aside");if(a.className=r.isColumnComposerExpanded?h.columnComposerExpandedPanel:h.columnComposerCollapsedPanel,a.dataset.boardColumnComposer="true",!r.isColumnComposerExpanded){const d=j({text:this.runtime.i18n.t("boards.addColumnPanelTitle"),tone:"text",size:"md",fullWidth:!0,className:h.columnComposerCollapsed,disabled:e.status==="saving",onClick:()=>this.expandColumnComposer()});return d.setAttribute("data-testid","list-composer-button"),d.setAttribute("data-drag-scroll-disabled","true"),Y(d,"plus"),a.append(d),a}const o=document.createElement("form");o.className=h.columnComposerExpanded,o.setAttribute("data-focus-lock-disabled","false"),o.addEventListener("submit",d=>{d.preventDefault(),this.submitColumnTitle(t.id,n.value)});const n=document.createElement("textarea");n.className=h.listComposerTextarea,n.placeholder=this.runtime.i18n.t("boards.columnTitlePlaceholder"),n.name=this.runtime.i18n.t("boards.columnTitlePlaceholder"),n.dir="auto",n.rows=1,n.value=r.columnComposerDraft,n.maxLength=512,n.spellcheck=!1,n.setAttribute("data-testid","list-name-textarea"),n.setAttribute("autocomplete","off"),n.setAttribute("aria-label",this.runtime.i18n.t("boards.columnTitlePlaceholder")),n.addEventListener("input",()=>{this.surface.setColumnComposerDraft(n.value)}),n.addEventListener("keydown",d=>{d.key!=="Enter"||d.shiftKey||(d.preventDefault(),this.submitColumnTitle(t.id,n.value))});const s=document.createElement("div");return s.className=h.composerActions,s.append(j({text:this.runtime.i18n.t("boards.actions.createColumn"),tone:"primary",size:"sm",type:"submit",className:h.primaryButton,disabled:e.status==="saving"}),q({icon:"x-mark",tone:"text",size:"md",type:"button",title:this.runtime.i18n.t("boards.actions.cancelNewColumn"),ariaLabel:this.runtime.i18n.t("boards.actions.cancelNewColumn"),className:h.composerCancelButton,onClick:()=>this.collapseColumnComposer()})),o.append(n,s),a.append(o),requestAnimationFrame(()=>n.focus()),a}renderEmptyState(){const t=document.createElement("div");t.className=h.empty;const e=document.createElement("div");e.className=h.emptyContent;const r=document.createElement("h2");r.className=h.emptyTitle,r.textContent=this.runtime.i18n.t("boards.emptyTitle");const a=document.createElement("p");return a.className=h.emptyCopy,a.textContent=this.runtime.i18n.t("boards.emptyBody"),e.append(r,a),t.append(e),t}renderMessage(t){const e=document.createElement("div");e.className=h.messageWrapper;const r=document.createElement("p");return r.className=h.messageLabel,r.textContent=t,e.append(r),e}openQuickCardEditor(t,e){if(!this.state)return;const r=this.findCardLocation(t,this.state);r&&(this.surface.openQuickEditor(t,Oa(e),r.card.title),this.renderQuickCardEditorOverlay(r,e))}refreshQuickCardEditor(t){const e=this.surface.snapshot.quickEditor;if(!e){this.unmountQuickCardEditorOverlay();return}const r=this.findCardLocation(e.placementId,t);if(!r){this.closeQuickCardEditor();return}this.renderQuickCardEditorOverlay(r,e.anchorRect)}renderQuickCardEditorOverlay(t,e){this.unmountQuickCardEditorOverlay();const r=document.createElement("div");r.className=l.quickEditorOverlay,r.addEventListener("pointerdown",o=>{o.target===r&&this.closeQuickCardEditor()}),r.addEventListener("keydown",o=>{o.key==="Escape"&&(o.preventDefault(),this.closeQuickCardEditor())});const a=this.renderQuickCardEditor(t);this.positionQuickCardEditor(a,e),r.append(a),document.body.append(r),this.quickEditorOverlay=r,requestAnimationFrame(()=>{var o;(o=a.querySelector('[data-testid="quick-card-editor-card-title"]'))==null||o.focus()})}renderQuickCardEditor(t){const{card:e,placementId:r}=t,a=this.surface.snapshot.quickEditor,o=document.createElement("div");o.className=l.quickEditor,o.setAttribute("data-elevation","1"),o.addEventListener("pointerdown",g=>g.stopPropagation());const n=document.createElement("div");n.setAttribute("role","dialog"),n.setAttribute("aria-modal","true"),n.setAttribute("aria-label",this.runtime.i18n.t("boards.quickEditor.menuLabel")),n.setAttribute("data-testid","quick-card-editor-menu");const s=document.createElement("form");s.className=l.quickEditorForm,s.addEventListener("submit",g=>{g.preventDefault(),this.saveQuickCardEditor(e,r,u)});const d=K({elevated:!0,className:mt(e)?`${l.quickEditorCard} ${l.quickEditorCardMirror}`:l.quickEditorCard});d.setAttribute("data-testid","quick-card-editor-card-front");const c=document.createElement("div");c.className=l.quickEditorCardInner;const u=document.createElement("textarea");u.className=l.quickEditorTitle,u.setAttribute("data-testid","quick-card-editor-card-title"),u.dir="auto",u.setAttribute("aria-label",this.runtime.i18n.t("boards.quickEditor.editCardName")),u.value=(a==null?void 0:a.placementId)===r?a.titleDraft:e.title,u.rows=2,u.addEventListener("input",()=>{this.surface.setQuickEditorTitleDraft(r,u.value)}),u.addEventListener("keydown",g=>{g.key!=="Enter"||g.shiftKey||(g.preventDefault(),this.saveQuickCardEditor(e,r,u))});const b=this.renderCardFrontBadges(e),m=this.renderCardMirrorSourceLabel(e,h.cardSourceLabel);m&&c.append(m),c.append(u),b&&c.append(b),d.append(c);const p=j({text:this.runtime.i18n.t("common.save"),tone:"primary",size:"md",className:`${h.primaryButton} ${l.quickEditorSave}`,type:"submit"}),f=()=>{p.disabled=u.value.trim().length===0};return u.addEventListener("input",f),f(),s.append(d,p),n.append(s,this.renderQuickCardEditorActions(t)),o.append(n),o}renderQuickCardEditorActions(t){const{board:e,column:r,card:a,placementId:o}=t,n=document.createElement("div");n.className=l.quickEditorActions;const s=document.createElement("ul");return s.className=l.quickEditorButtons,s.setAttribute("data-testid","quick-card-editor-buttons"),[{testId:"quick-card-editor-open-card",labelKey:"boards.quickEditor.openCard",icon:"rectangle-stack",onClick:()=>{this.closeQuickCardEditor(),this.openCardModal(o)}},{testId:"quick-card-editor-edit-labels",labelKey:"boards.quickEditor.editLabels",icon:"tag",onClick:()=>{this.closeQuickCardEditor(),this.openCardModal(o)}},{testId:"quick-card-editor-move",labelKey:"boards.quickEditor.move",icon:"arrow-right",onClick:c=>{this.openMoveCardPopover(c.currentTarget,e,r,a,"move")}},{testId:"mirror-new-button",labelKey:"boards.quickEditor.mirror",icon:"rectangle-stack",onClick:c=>{this.openMoveCardPopover(c.currentTarget,e,r,a,"mirror")}},{testId:"quick-card-editor-archive",labelKey:mt(a)?"boards.quickEditor.removeFromBoard":"boards.quickEditor.archive",icon:"archive-box",onClick:()=>{this.closeQuickCardEditor(),this.archiveOrRemoveCard(a,o)}},{testId:"quick-card-editor-delete-card",labelKey:"boards.actions.deleteCard",icon:"trash",danger:!0,onClick:()=>void this.deleteSharedCardFromQuickEditor(a)}].forEach(c=>{const u=document.createElement("li");c.danger&&(u.className=l.quickEditorDangerItem);const b=j({text:this.runtime.i18n.t(c.labelKey),tone:c.danger?"danger":"text",size:"md",className:c.danger?`${l.quickEditorButton} ${l.quickEditorDangerButton}`:l.quickEditorButton,onClick:c.onClick});b.setAttribute("data-testid",c.testId),Y(b,c.icon),u.append(b),s.append(u)}),n.append(s),n}positionQuickCardEditor(t,e){const{formWidth:r,actionsWidth:a,actionsGap:o,viewportMargin:n,minVisibleHeight:s}=Ba,d=Math.min(Math.max(e.left,n),Math.max(n,window.innerWidth-r-a-o-n)),c=Math.min(Math.max(e.top,n),Math.max(n,window.innerHeight-s-n));t.style.left=`${d}px`,t.style.top=`${c}px`}saveQuickCardEditor(t,e,r){this.surface.setQuickEditorTitleDraft(e,r.value);const a=this.surface.submitQuickEditor(e);a&&(this.unmountQuickCardEditorOverlay(),a!==t.title&&this.handlers.onPatchCard(t.id,{title:a}))}openCardModal(t){if(!this.state)return;const e=this.findCardLocation(t,this.state);if(!e)return;const r=!this.isPendingCardLocation(e);this.cardDetails.open(e.card,t,{isResolved:r}),this.renderCardModal(e),r&&this.loadCardModalChecklists(e.card.id)}isPendingCardLocation(t){return this.isPendingCard(t.card,t.placementId)}isPendingCard(t,e=y(t)){return this.state?this.state.optimistic.cards[t.id]==="creating"||this.state.optimistic.placements[e]==="creating":!1}syncCardModal(t){var a;if(!this.cardDetails.isOpen)return;const e=((a=this.cardDetails.checklists)==null?void 0:a.cardId)??null,r=this.resolveActiveCardModalLocation(t);if(!r){this.closeCardModal();return}this.cardDetails.reconcile(r.card,r.placementId,{isResolved:!this.isPendingCardLocation(r)}),this.renderCardModal(r),e!==r.card.id&&!this.isPendingCardLocation(r)&&this.loadCardModalChecklists(r.card.id),this.flushQueuedCardDetailsSubmit()}resolveActiveCardModalLocation(t){const e=this.cardDetails.activePlacementId;if(e===null)return null;const r=this.findCardLocation(e,t);if(r)return r;const a=t.optimistic.resolved.placements[e];if(!a)return null;const o=this.findCardLocation(a,t);return o?(this.cardDetails.resolveActivePlacement(a),o):null}flushQueuedCardDetailsSubmit(){const t=this.cardDetails.snapshot;if(!(t!=null&&t.pendingSubmit)||!t.identity.isResolved)return;const e=he(t);if(be(e)){const r=this.handlers.onPatchCard(t.identity.cardId,e);if(this.isPromiseLike(r)){Promise.resolve(r).then(a=>{if(this.isCommandFailure(a)){this.notifyCommandFailure(a);return}this.cardDetails.markSubmitted(),t.closeAfterSubmit&&this.closeCardModal()});return}if(this.isCommandFailure(r)){this.notifyCommandFailure(r);return}this.cardDetails.markSubmitted()}t.closeAfterSubmit&&this.closeCardModal()}renderCardModal(t){var m,p,f,g,P,w;this.ensureRenderRoots(),this.cardModalLabelsHost=null,this.cardModalQuickActionList=null,this.cardModalChecklistHost=null;const{board:e,column:r,card:a}=t;((m=this.cardLabelsPopover)==null?void 0:m.cardId)!==a.id&&this.closeCardLabelsPopover(),((p=this.cardChecklistPopover)==null?void 0:p.cardId)!==a.id&&this.closeCardChecklistPopover(),((f=this.cardCheckItemMenuPopover)==null?void 0:f.cardId)!==a.id&&this.closeCardCheckItemMenuPopover(),this.cardEntityLinkMenuPopover&&(this.cardEntityLinkMenuPopover.cardId!==a.id||!ut(a).some(_=>{var I;return _.id===((I=this.cardEntityLinkMenuPopover)==null?void 0:I.linkId)}))&&this.closeCardEntityLinkMenuPopover();const o=y(a);this.moveCardPopover&&(this.moveCardPopover.cardId!==a.id||this.moveCardPopover.placementId!==o)&&this.closeMoveCardPopover(),this.cardActionsPopover&&(this.cardActionsPopover.cardId!==a.id||this.cardActionsPopover.placementId!==o)&&this.closeCardActionsPopover(),this.cardDetails.snapshot||this.cardDetails.open(a,t.placementId,{isResolved:!this.isPendingCardLocation(t)});const n=this.cardDetails.snapshot,s=(n==null?void 0:n.draft)??{title:a.title,description:a.description??"",tagIds:zt(a)},d=document.createElement("textarea");d.className=l.titleEditor,d.dataset.boardCardModalTitle="true",d.dir="auto",d.rows=Ia,d.maxLength=Ea,d.value=s.title,d.setAttribute("aria-label",s.title),d.addEventListener("input",()=>{this.cardDetails.updateDraft({title:d.value})});const c=document.createElement("textarea");c.className=l.descriptionEditor,c.dataset.boardCardModalDescription="true",c.value=s.description,c.placeholder=this.runtime.i18n.t("boards.cardDescriptionPlaceholder"),c.setAttribute("aria-label",this.runtime.i18n.t("boards.cardDescriptionLabel"));const u=document.createElement("div");u.className=l.cardBack,c.addEventListener("input",()=>{this.cardDetails.updateDraft({description:c.value})}),u.append(this.renderCardBackTopbar(e,r,a),this.renderCardBackLayout(e,r,a,d,c));const b=((P=(g=this.cardModalBody)==null?void 0:g.querySelector('[data-auto-scrollable="true"]'))==null?void 0:P.scrollTop)??null;if(!this.cardModalOverlay||!this.cardModalContainer||!this.cardModalBody||!this.cardModalTitleElement){const{overlay:_,container:I,header:M,divider:A,body:v,titleElement:B}=qe(s.title,{onClose:()=>this.closeCardModal(),hideCloseButton:!0,intent:"form",presentation:"dialog",zIndex:270});M.classList.add(l.hiddenShellPart),A.classList.add(l.hiddenShellPart),I.classList.add(l.container),I.addEventListener("keydown",D=>{D.stopPropagation()}),v.className=l.body,this.cardModalOverlay=_,this.cardModalContainer=I,this.cardModalBody=v,this.cardModalTitleElement=B,(w=this.modalRoot)==null||w.append(_)}if(this.cardModalTitleElement.textContent=s.title,this.cardModalContainer.setAttribute("aria-labelledby","card-back-name"),this.cardModalContainer.setAttribute("data-focus-lock","cardback"),this.cardModalBody.replaceChildren(u),b!==null){const _=this.cardModalBody.querySelector('[data-auto-scrollable="true"]');_&&(_.scrollTop=b)}this.refreshCardLabelsPopover(a),this.refreshCardChecklistPopover(a),this.refreshMoveCardPopover(a),this.refreshCardActionsPopover(a),this.refreshCardEntityLinkMenuPopover(a),this.refreshCardCheckItemMenuPopover(a)}renderCardBackTopbar(t,e,r){const a=document.createElement("header");a.className=l.topbar;const o=document.createElement("div");o.className=l.topbarStart;const n=document.createElement("button");n.type="button",n.className=l.listBadge,n.setAttribute("data-testid","card-back-list-button"),n.dataset.cardBackAction="move",n.title=e.title,n.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.changeList",{column:e.title})),n.setAttribute("aria-haspopup","dialog"),n.setAttribute("aria-expanded","false"),n.addEventListener("click",m=>{var p;if(m.stopPropagation(),((p=this.moveCardPopover)==null?void 0:p.trigger)===n){this.closeMoveCardPopover();return}this.openMoveCardPopover(n,t,e,r)});const s=document.createElement("span");s.textContent=e.title;const d=$("chevron-down",{size:14,strokeWidth:2});d.setAttribute("aria-hidden","true"),n.append(s,d),o.append(n);const c=this.renderCardMirrorSourceLabel(r,l.sourceLabel);c&&o.append(c);const u=document.createElement("div");u.className=l.topbarActions;const b=q({icon:"ellipsis-vertical",tone:"text",size:"md",className:l.iconButton,ariaLabel:this.runtime.i18n.t("boards.cardBack.actions"),title:this.runtime.i18n.t("boards.cardBack.actions")});return b.setAttribute("aria-haspopup","dialog"),b.setAttribute("aria-expanded","false"),b.setAttribute("data-testid","card-back-actions-button"),b.dataset.cardBackAction="actions",b.addEventListener("click",m=>{var p;if(m.stopPropagation(),((p=this.cardActionsPopover)==null?void 0:p.trigger)===b){this.closeCardActionsPopover();return}this.openCardActionsPopover(b,t,e,r)}),u.append(b,q({icon:"x-mark",tone:"text",size:"md",className:l.iconButton,ariaLabel:this.runtime.i18n.t("common.close"),title:this.runtime.i18n.t("common.close"),onClick:()=>this.closeCardModal()})),a.append(o,u),a}openCardActionsPopover(t,e,r,a){this.closeCardActionsPopover();const o=K({elevated:!0,className:`${l.cardActionsPopover} hidden`});o.setAttribute("role","dialog"),o.setAttribute("aria-modal","false"),o.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.actions")),o.setAttribute("data-testid","card-back-actions-popover"),o.addEventListener("mousedown",c=>c.stopPropagation());const n=document.createElement("div");n.className=l.cardActionsBody;const s=document.createElement("ul");s.className=l.cardActionsList,s.append(this.renderCardActionItem({testId:"card-back-move-card-button",labelKey:"boards.quickEditor.move",icon:"arrow-right",disabled:!0}),this.renderCardActionItem({testId:"card-back-copy-card-button",labelKey:"boards.quickEditor.copyCard",icon:"square-2-stack",disabled:!0}),this.renderCardActionItem({testId:"card-back-mirror-card-button",labelKey:"boards.quickEditor.mirror",icon:"rectangle-stack",onClick:()=>{this.closeCardActionsPopover(),this.openMoveCardPopover(t,e,r,a,"mirror")}}),this.renderCardActionItem({testId:"card-back-link-entity-button",labelKey:"boards.cardLinks.link",icon:"link",onClick:()=>{this.closeCardActionsPopover(),this.openCardEntityLinkModal(a)}}),this.renderCardActionItem({testId:"card-back-import-card-button",labelKey:"boards.import.actions.importCard",icon:"arrow-down",onClick:()=>{this.closeCardActionsPopover(),this.openImportPreviewModal({scope:"card",titleKey:"boards.import.title.card",target:{cardId:a.id,columnId:r.id,boardId:e.id}})}}),this.renderCardActionItem({testId:"card-back-export-card-markdown-button",labelKey:"boards.export.actions.cardMarkdown",icon:"document",onClick:()=>{this.closeCardActionsPopover(),this.openExportOutputModal({titleKey:"boards.export.title.card",request:{scope:"card",format:"markdown",cardId:a.id}})}}),this.renderCardActionItem({testId:"card-back-export-card-json-button",labelKey:"boards.export.actions.cardJson",icon:"document",onClick:()=>{this.closeCardActionsPopover(),this.openExportOutputModal({titleKey:"boards.export.title.card",request:{scope:"card",format:"json",cardId:a.id}})}}),this.renderCardActionItem({testId:"card-back-create-task-button",labelKey:"boards.cardLinks.createTask",icon:"check-box",onClick:()=>void this.createEntityFromCard(a,"task")}),this.renderCardActionItem({testId:"card-back-create-story-button",labelKey:"boards.cardLinks.createStory",icon:"document",onClick:()=>void this.createEntityFromCard(a,"story")}),this.renderCardActionItem({testId:"card-back-create-goal-button",labelKey:"boards.cardLinks.createGoal",icon:"goal-circle",onClick:()=>void this.createEntityFromCard(a,"goal")}),this.renderCardActionsDivider(),this.renderCardActionItem({testId:"card-back-archive-button",labelKey:mt(a)?"boards.quickEditor.removeFromBoard":"boards.quickEditor.archive",icon:"archive-box",onClick:()=>{this.closeCardActionsPopover(),this.closeCardModal(),this.archiveOrRemoveCard(a,y(a))}}),this.renderCardActionItem({testId:"card-back-delete-card-button",labelKey:"boards.actions.deleteCard",icon:"trash",onClick:()=>void this.deleteSharedCardFromDetails(a)})),n.append(s),o.append(n);const d=this.createCardActionsAnchoredMenu(t,o);d.mount(),this.cardActionsPopover={cardId:a.id,placementId:y(a),menu:d,panel:o,trigger:t},this.openCardActionsAnchoredMenu(d,t)}refreshCardActionsPopover(t){var n;const e=this.cardActionsPopover;if(!e)return;const r=y(t);if(e.cardId!==t.id||e.placementId!==r){this.closeCardActionsPopover();return}const a=(n=this.cardModalBody)==null?void 0:n.querySelector('[data-card-back-action="actions"]');if(!a||a.disabled){this.closeCardActionsPopover();return}e.trigger.setAttribute("aria-expanded","false"),e.menu.unmount(),e.trigger=a;const o=this.createCardActionsAnchoredMenu(a,e.panel);e.menu=o,o.mount(),this.openCardActionsAnchoredMenu(o,a)}createCardActionsAnchoredMenu(t,e){const r=new W({container:t,panel:e,positioning:"viewport",panelZIndex:300,onOpenChange:a=>{var o;t.setAttribute("aria-expanded",a?"true":"false"),!a&&((o=this.cardActionsPopover)==null?void 0:o.menu)===r&&this.closeCardActionsPopover()}});return r}openCardActionsAnchoredMenu(t,e){t.openAt({anchor:e,placement:"bottom-end",fallbackPlacements:["bottom-start","top-end","top-start"],gap:8,margin:12,lockPlacementAfterOpen:!0})}renderCardActionItem(t){const e=document.createElement("li");e.className=l.cardActionsItem;const r=j({text:this.runtime.i18n.t(t.labelKey),tone:"text",size:"md",className:l.cardActionsButton,disabled:t.disabled,onClick:t.onClick});return r.setAttribute("data-testid",t.testId),Y(r,t.icon),e.append(r),e}renderCardActionsDivider(){const t=document.createElement("li");return t.className=l.cardActionsDivider,t.setAttribute("role","separator"),t}openImportPreviewModal(t){this.closeTransientBoardOverlays(),this.importExportModals.openImport(t)}closeImportPreviewModal(){this.importExportModals.closeImport()}async openExportOutputModal(t){await this.importExportModals.openExport(t)}closeExportOutputModal(){this.importExportModals.closeExport()}archiveOrRemoveCard(t,e){if(mt(t)){this.handlers.onDeleteCardPlacement(e);return}this.handlers.onDeleteCard(t.id)}createPlacementTargetFromPosition(t,e,r){return je({columnId:t.id,cards:t.cards,movingPlacementId:r??"",insertionIndex:e-1})}openMoveCardPopover(t,e,r,a,o="move"){var lt;const n=((lt=this.state)==null?void 0:lt.boards)??[e],s=y(a);let d=e.id,c=r.id,u=r.cards.findIndex(C=>y(C)===s);u=u>=0?u+1:1;const b=o==="mirror"?"boards.cardMirror.title":"boards.cardMove.title",m=o==="mirror"?"boards.cardMirror.create":"boards.cardMove.move";this.closeMoveCardPopover();const p=K({elevated:!0,className:`${l.movePopover} hidden`});p.setAttribute("role","dialog"),p.setAttribute("aria-modal","false"),p.setAttribute("aria-labelledby","move-card-popover"),p.setAttribute("data-testid","move-card-popover"),p.addEventListener("mousedown",C=>C.stopPropagation());const f=document.createElement("header");f.className=l.movePopoverHeader;const g=document.createElement("h2");g.id="move-card-popover",g.className=l.movePopoverTitle,g.textContent=this.runtime.i18n.t(b);const P=q({icon:"x-mark",tone:"text",size:"sm",className:l.iconButton,ariaLabel:this.runtime.i18n.t("common.close"),title:this.runtime.i18n.t("common.close"),onClick:()=>this.closeMoveCardPopover()});f.append(g,P);const w=document.createElement("div");w.className=l.movePopoverBody;const _=document.createElement("div");_.className=l.movePopoverContent;const I=document.createElement("div");I.className=l.moveTabs,I.setAttribute("role","tablist"),I.append(this.renderMoveCardTab("boards.cardMove.inbox",!1),this.renderMoveCardTab("boards.cardMove.board",!0));const M=document.createElement("h3");M.className=l.moveSectionTitle,M.textContent=this.runtime.i18n.t("boards.cardMove.selectDestination");const A=document.createElement("div");A.className=l.moveFields;const v=this.createMoveSelectField({id:"move-card-board-select",label:this.runtime.i18n.t("boards.cardMove.board")}),B=this.createMoveSelectField({id:"move-card-list-select",label:this.runtime.i18n.t("boards.cardMove.list")}),D=this.createMoveSelectField({id:"move-card-board-list-position-select",label:this.runtime.i18n.t("boards.cardMove.position")}),F=()=>n.find(C=>C.id===d)??null,V=()=>{var C;return((C=F())==null?void 0:C.columns.find(S=>S.id===c))??null},z=()=>{var C;return o!=="mirror"?!1:((C=V())==null?void 0:C.cards.some(S=>S.id===a.id))??!1},dt=()=>{const C=V();return C?o==="mirror"?C.cards.length+1:C.id===r.id?C.cards.length:C.cards.length+1:0};let L;const x=()=>{var U;v.select.replaceChildren(...n.map(N=>this.createSelectOption(N.id,N.title,N.id===d)));const C=F(),S=(C==null?void 0:C.columns)??[];S.some(N=>N.id===c)||(c=((U=S[0])==null?void 0:U.id)??""),B.select.replaceChildren(...S.map(N=>this.createSelectOption(N.id,N.title,N.id===c)));const G=dt();u=Math.min(Math.max(u,1),G||1),D.select.replaceChildren(...Array.from({length:G},(N,It)=>this.createSelectOption(It+1,String(It+1),It+1===u))),z()?R.show(this.runtime.i18n.t("boards.cardMirror.duplicateDestination"),"warning"):V()?R.clear():R.show(this.runtime.i18n.t("boards.cardMirror.noDestination"),"error"),L.disabled=!V()},R=Nt({tone:"error",className:"mb-3"});v.select.addEventListener("change",()=>{var C,S;d=v.select.value,c=((S=(C=n.find(G=>G.id===d))==null?void 0:C.columns[0])==null?void 0:S.id)??"",u=1,x()}),B.select.addEventListener("change",()=>{c=B.select.value,u=c===r.id?u:1,x()}),D.select.addEventListener("change",()=>{u=Number(D.select.value)}),L=j({text:this.runtime.i18n.t(m),tone:"primary",size:"md",className:l.moveButton,onClick:()=>{const C=V();if(!C)return;const S=this.createPlacementTargetFromPosition(C,u,o==="move"?s:void 0),G=r.cards.findIndex(U=>y(U)===s);if(this.closeMoveCardPopover(),o==="mirror"){this.closeQuickCardEditor();const{column:U,...N}=S;this.handlers.onCreateCardMirror(a.id,U,N);return}if(C.id===r.id&&u-1===G){this.closeQuickCardEditor();return}this.closeQuickCardEditor(),this.handlers.onPatchCardPlacement(s,S)}}),L.setAttribute("data-testid","move-card-popover-move-button");const H=document.createElement("div");H.className=l.moveActions,H.append(L),A.append(v.field,B.field,D.field),_.append(I,M,A,R.element),w.append(_,H),p.append(f,w);const ct=t.dataset.cardBackAction==="actions"?"actions":"move",Z=this.createMoveCardAnchoredMenu(t,p);Z.mount(),this.moveCardPopover={cardId:a.id,placementId:s,mode:o,triggerAction:ct,menu:Z,panel:p,trigger:t},x(),this.openMoveCardAnchoredMenu(Z,t)}refreshMoveCardPopover(t){var n;const e=this.moveCardPopover;if(!e)return;const r=y(t);if(e.cardId!==t.id||e.placementId!==r){this.closeMoveCardPopover();return}const a=(n=this.cardModalBody)==null?void 0:n.querySelector(`[data-card-back-action="${e.triggerAction}"]`);if(!a||a.disabled){this.closeMoveCardPopover();return}e.trigger.setAttribute("aria-expanded","false"),e.menu.unmount(),e.trigger=a;const o=this.createMoveCardAnchoredMenu(a,e.panel);e.menu=o,o.mount(),this.openMoveCardAnchoredMenu(o,a)}createMoveCardAnchoredMenu(t,e){const r=new W({container:t,panel:e,positioning:"viewport",panelZIndex:300,onOpenChange:a=>{var o;t.setAttribute("aria-expanded",a?"true":"false"),!a&&((o=this.moveCardPopover)==null?void 0:o.menu)===r&&this.closeMoveCardPopover()}});return r}openMoveCardAnchoredMenu(t,e){t.openAt({anchor:e,placement:"bottom-start",fallbackPlacements:["bottom-end","top-start","top-end"],gap:8,margin:12,lockPlacementAfterOpen:!0})}renderMoveCardTab(t,e){const r=document.createElement("button");return r.type="button",r.className=e?l.moveTabSelected:l.moveTab,r.setAttribute("role","tab"),r.setAttribute("aria-selected",e?"true":"false"),r.disabled=!e,r.textContent=this.runtime.i18n.t(t),r}createMoveSelectField(t){const e=document.createElement("label");e.className=l.moveField,e.htmlFor=t.id;const r=document.createElement("span");r.className=l.moveLabel,r.textContent=t.label;const a=document.createElement("select");return a.id=t.id,a.className=l.moveSelect,a.setAttribute("data-testid",`${t.id}-select`),e.append(r,a),{field:e,select:a}}createSelectOption(t,e,r){const a=document.createElement("option");return a.value=String(t),a.textContent=e,a.selected=r,a}renderCardBackLayout(t,e,r,a,o){const n=document.createElement("div");n.className=l.layout;const s=document.createElement("main");s.className=l.main,s.setAttribute("data-auto-scrollable","true"),s.append(this.renderCardBackTitleSection(r,a),this.renderCardBackQuickActions(r),this.renderCardBackLabelsHost(r),...this.renderCardBackEntityLinksSection(r),this.renderCardBackDescriptionSection(r,a,o),this.renderCardBackChecklistsSection(r),this.renderCardBackAttachmentsSection());const d=this.renderCardBackAside(t,e);return n.append(s,d),n}renderCardBackTitleSection(t,e){const r=document.createElement("section");r.className=`${l.section} ${l.titleSection}`,r.setAttribute("data-testid","card-back-header");const a=document.createElement("div");a.className=l.sectionIcon;const o=this.createCardCompletionToggle(t,{className:_t(t)?l.doneButtonCompleted:l.doneButton,testId:"card-back-completion-toggle"});a.append(o);const n=document.createElement("div");n.className=l.sectionMain;const s=document.createElement("hgroup"),d=document.createElement("h2");return d.id="card-back-name",d.className=l.hiddenShellPart,d.textContent=t.title,s.append(d,e),n.append(s),r.append(a,n),r}renderCardBackQuickActions(t){const e=document.createElement("section");e.className=`${l.section} ${l.quickActions}`;const r=document.createElement("div");r.className=l.sectionIcon;const a=document.createElement("div");a.className=l.sectionMain;const o=document.createElement("ul");return o.className=l.quickActionList,this.cardModalQuickActionList=o,this.populateCardBackQuickActions(o,t),a.append(o),e.append(r,a),e}populateCardBackQuickActions(t,e){t.replaceChildren();const r=this.isPendingCard(e),a=[{labelKey:"boards.cardBack.add",icon:"plus",disabled:!0}];this.getCardModalDraftTagItems(e).length===0&&a.push({labelKey:"boards.cardBack.labels",icon:"tag",actionId:"labels",onClick:o=>this.openCardLabelsPopover(o,e)}),r?a.push({labelKey:"boards.cardLinks.link",icon:"link",disabled:!0},{labelKey:"boards.cardLinks.createTask",icon:"check-box",disabled:!0},{labelKey:"boards.cardLinks.createStory",icon:"document",disabled:!0},{labelKey:"boards.cardLinks.createGoal",icon:"goal-circle",disabled:!0},{labelKey:"boards.cardBack.dates",icon:"calendar",disabled:!0},{labelKey:"boards.cardBack.checklist",icon:"check-box",actionId:"checklist",disabled:!0}):a.push({labelKey:"boards.cardLinks.link",icon:"link",onClick:()=>this.openCardEntityLinkModal(e)},{labelKey:"boards.cardLinks.createTask",icon:"check-box",onClick:()=>void this.createEntityFromCard(e,"task")},{labelKey:"boards.cardLinks.createStory",icon:"document",onClick:()=>void this.createEntityFromCard(e,"story")},{labelKey:"boards.cardLinks.createGoal",icon:"goal-circle",onClick:()=>void this.createEntityFromCard(e,"goal")},{labelKey:"boards.cardBack.dates",icon:"calendar",disabled:!0},{labelKey:"boards.cardBack.checklist",icon:"check-box",actionId:"checklist",onClick:o=>this.openCardChecklistPopover(o,e)}),a.forEach(o=>{const n=document.createElement("li"),s=o.disabled===!0?this.createUnavailableCardBackButton(o.labelKey,o.icon):this.createAvailableCardBackButton({labelKey:o.labelKey,icon:o.icon,onClick:o.onClick});o.actionId&&(s.dataset.cardBackAction=o.actionId),n.append(s),t.append(n)})}renderCardBackLabelsHost(t){const e=document.createElement("div");return e.className=l.labelsHost,e.setAttribute("data-testid","card-back-labels-host"),this.cardModalLabelsHost=e,this.populateCardBackLabelsHost(e,t),e}populateCardBackLabelsHost(t,e){t.replaceChildren();const r=this.getCardModalDraftTagItems(e);if(r.length===0)return;const a=document.createElement("section");a.className=l.labelsSection,a.setAttribute("aria-labelledby","card-back-labels-title");const o=document.createElement("h3");o.id="card-back-labels-title",o.className=l.labelsTitle,o.textContent=this.runtime.i18n.t("boards.cardBack.labels");const n=document.createElement("div");n.setAttribute("role","group"),n.setAttribute("aria-labelledby",o.id);const s=document.createElement("div");s.className=l.labelsList,s.setAttribute("data-testid","card-back-labels-container"),r.forEach(d=>{s.append(this.createCardBackLabelSwatch(d))}),s.append(this.createCardBackAddLabelButton(e)),n.append(s),a.append(o,n),t.append(a)}createCardBackLabelSwatch(t){const e=document.createElement("button");return e.type="button",e.className=l.labelSwatch,e.style.backgroundColor=t.color,e.style.color=Na(t.color),e.textContent=t.title,e.title=t.title,e.setAttribute("aria-label",t.title),e.setAttribute("data-testid","card-label"),e.dataset.tagId=String(t.id),e}createCardBackAddLabelButton(t){const e=q({icon:"plus",tone:"text",size:"md",className:l.labelAddButton,ariaLabel:this.runtime.i18n.t("boards.cardBack.addLabel"),title:this.runtime.i18n.t("boards.cardBack.addLabel"),onClick:()=>this.openCardLabelsPopover(e,t)});return e.setAttribute("data-testid","card-back-add-label-button"),e.dataset.role="goal-tag-picker-trigger",e.dataset.cardBackAction="labels",e.setAttribute("aria-haspopup","dialog"),e.setAttribute("aria-expanded","false"),e}createAvailableCardBackButton(t){const e=j({text:this.runtime.i18n.t(t.labelKey),tone:"text",size:"md",className:l.quickActionButton,onClick:()=>t.onClick(e)});return e.setAttribute("aria-haspopup","dialog"),e.setAttribute("aria-expanded","false"),Y(e,t.icon),e}getCardModalDraftTagIds(t){var e;return((e=this.cardDetails.snapshot)==null?void 0:e.draft.tagIds)??zt(t)}getCardModalDraftTagItems(t){var o;const e=this.getCardModalDraftTagIds(t),r=new Set(e),a=new Map;return(o=t.tags)==null||o.forEach(n=>a.set(n.id,vt(n))),this.tagItems.forEach(n=>a.set(n.id,n)),e.map(n=>a.get(n)).filter(n=>!!n&&r.has(n.id))}refreshCardModalLabelControls(t){this.cardModalLabelsHost&&this.populateCardBackLabelsHost(this.cardModalLabelsHost,t),this.cardModalQuickActionList&&this.populateCardBackQuickActions(this.cardModalQuickActionList,t)}patchCardModalTagIds(t,e){const r=nt(e),a=this.cardDetails.snapshot;a&&!a.identity.isResolved||a&&ka(a,r)||(this.cardDetails.updateRequestedTagIds(r),this.handlers.onPatchCard(t.id,{tag_ids:r}))}openCardLabelsPopover(t,e){this.closeCardLabelsPopover();const r=K({elevated:!0,className:`${l.labelPickerPopover} hidden`});r.setAttribute("role","dialog"),r.setAttribute("aria-modal","false"),r.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.labels")),r.setAttribute("data-testid","card-back-label-picker-popover"),r.addEventListener("mousedown",n=>n.stopPropagation());const a=new Oe({variant:"labels",items:this.tagItems,selectedIds:this.getCardModalDraftTagIds(e),loading:this.tagCatalogStatus==="loading",errorMessage:this.getTagPickerErrorMessage(),placeholder:this.runtime.i18n.t("boards.cardBack.tagsPlaceholder"),searchPlaceholder:this.runtime.i18n.t("boards.cardBack.tagsSearchPlaceholder"),copy:{title:this.runtime.i18n.t("boards.cardBack.labels"),editTitle:this.runtime.i18n.t("boards.cardBack.editLabel"),createTitle:this.runtime.i18n.t("boards.cardBack.createLabel"),searchPlaceholder:this.runtime.i18n.t("boards.cardBack.tagsSearchPlaceholder"),labelsLegend:this.runtime.i18n.t("boards.cardBack.labels"),createButton:this.runtime.i18n.t("boards.cardBack.createNewLabel"),colorblindButton:this.runtime.i18n.t("boards.cardBack.enableColorblindMode"),titleLabel:this.runtime.i18n.t("boards.cardBack.labelTitle"),colorLegend:this.runtime.i18n.t("boards.cardBack.selectColor"),removeColor:this.runtime.i18n.t("boards.cardBack.removeColor"),save:this.runtime.i18n.t("common.save"),delete:this.runtime.i18n.t("common.delete"),close:this.runtime.i18n.t("boards.cardBack.closeLabelsPopover"),back:this.runtime.i18n.t("boards.cardBack.returnToLabels")},onRequestClose:()=>this.closeCardLabelsPopover(),onCreate:(n,s)=>this.createTagFromCardBack(n,s),onUpdate:(n,s)=>this.updateTagFromCardBack(n,s),onDelete:n=>this.deleteTagFromCardBack(n),onChange:n=>{this.cardDetails.updateDraft({tagIds:n}),this.refreshCardModalLabelControls(e),this.patchCardModalTagIds(e,n)}});a.element.setAttribute("data-testid","card-back-tag-picker"),r.append(a.element);const o=this.createCardLabelsAnchoredMenu(t,r);o.mount(),this.cardLabelsPopover={cardId:e.id,menu:o,panel:r,picker:a,trigger:t},this.openCardLabelsAnchoredMenu(o,t),window.requestAnimationFrame(()=>a.focusSearch())}refreshCardLabelsPopover(t){var o;const e=this.cardLabelsPopover;if(!e)return;if(e.cardId!==t.id){this.closeCardLabelsPopover();return}const r=(o=this.cardModalBody)==null?void 0:o.querySelector('[data-card-back-action="labels"]');if(!r||r.disabled){this.closeCardLabelsPopover();return}e.picker.update({items:this.tagItems,selectedIds:this.getCardModalDraftTagIds(t),loading:this.tagCatalogStatus==="loading",errorMessage:this.getTagPickerErrorMessage(),onCreate:(n,s)=>this.createTagFromCardBack(n,s),onUpdate:(n,s)=>this.updateTagFromCardBack(n,s),onDelete:n=>this.deleteTagFromCardBack(n)}),e.trigger.setAttribute("aria-expanded","false"),e.menu.unmount(),e.trigger=r;const a=this.createCardLabelsAnchoredMenu(r,e.panel);e.menu=a,a.mount(),this.openCardLabelsAnchoredMenu(a,r)}createCardLabelsAnchoredMenu(t,e){const r=new W({container:t,panel:e,positioning:"viewport",panelZIndex:310,onOpenChange:a=>{var o;t.setAttribute("aria-expanded",a?"true":"false"),!a&&((o=this.cardLabelsPopover)==null?void 0:o.menu)===r&&this.closeCardLabelsPopover()}});return r}openCardLabelsAnchoredMenu(t,e){t.openAt({anchor:e,placement:"bottom-start",fallbackPlacements:["bottom-end","top-start","top-end"],gap:8,margin:12,lockPlacementAfterOpen:!0})}openCardChecklistPopover(t,e){this.closeCardChecklistPopover();const r=K({elevated:!0,className:`${l.checklistPopover} hidden`});r.setAttribute("role","dialog"),r.setAttribute("aria-modal","false"),r.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.addChecklist")),r.setAttribute("data-testid","card-back-checklist-popover"),r.addEventListener("mousedown",p=>p.stopPropagation());const a=document.createElement("header");a.className=l.checklistPopoverHeader;const o=document.createElement("h3");o.className=l.checklistPopoverTitle,o.textContent=this.runtime.i18n.t("boards.cardBack.addChecklist");const n=q({icon:"x-mark",tone:"text",size:"sm",className:l.checklistPopoverClose,ariaLabel:this.runtime.i18n.t("common.close"),title:this.runtime.i18n.t("common.close"),onClick:()=>this.closeCardChecklistPopover()});a.append(o,n);const s=document.createElement("form");s.className=l.checklistPopoverForm;const d=document.createElement("label");d.className=l.checklistPopoverLabel,d.textContent=this.runtime.i18n.t("boards.cardBack.checklistTitle");const c=tt({variant:"default",value:this.runtime.i18n.t("boards.cardBack.defaultChecklistTitle"),className:l.checklistPopoverInput});d.append(c);const u=document.createElement("div");u.className=l.checklistPopoverActions;const b=j({text:this.runtime.i18n.t("boards.cardBack.add"),tone:"primary",size:"md",className:l.checklistPopoverSubmit});b.type="submit",u.append(b),s.append(d,u),s.addEventListener("submit",p=>{p.preventDefault(),this.createCardModalChecklist(e,c.value)}),r.append(a,s);const m=this.createCardChecklistAnchoredMenu(t,r);m.mount(),this.cardChecklistPopover={cardId:e.id,menu:m,panel:r,trigger:t},this.openCardChecklistAnchoredMenu(m,t),window.requestAnimationFrame(()=>{c.focus(),c.select()})}refreshCardChecklistPopover(t){var o;const e=this.cardChecklistPopover;if(!e)return;if(e.cardId!==t.id){this.closeCardChecklistPopover();return}const r=(o=this.cardModalBody)==null?void 0:o.querySelector('[data-card-back-action="checklist"]');if(!r||r.disabled){this.closeCardChecklistPopover();return}e.trigger.setAttribute("aria-expanded","false"),e.menu.unmount(),e.trigger=r;const a=this.createCardChecklistAnchoredMenu(r,e.panel);e.menu=a,a.mount(),this.openCardChecklistAnchoredMenu(a,r)}createCardChecklistAnchoredMenu(t,e){const r=new W({container:t,panel:e,positioning:"viewport",panelZIndex:310,onOpenChange:a=>{var o;t.setAttribute("aria-expanded",a?"true":"false"),!a&&((o=this.cardChecklistPopover)==null?void 0:o.menu)===r&&this.closeCardChecklistPopover()}});return r}openCardChecklistAnchoredMenu(t,e){t.openAt({anchor:e,placement:"bottom-start",fallbackPlacements:["bottom-end","top-start","top-end"],gap:8,margin:12,lockPlacementAfterOpen:!0})}async createTagFromCardBack(t,e){if(!this.tagCatalog)return null;try{const r=await this.tagCatalog.createTag(t,e),a=vt(r);return this.upsertTagItem(a),a}catch{throw new Error(this.runtime.i18n.t("boards.cardBack.tagsCreateFailed"))}}async updateTagFromCardBack(t,e){if(!this.tagCatalog)return null;try{const r=await this.tagCatalog.updateTag(t,e),a=vt(r);return this.upsertTagItem(a),a}catch{throw new Error(this.runtime.i18n.t("boards.cardBack.tagsUpdateFailed"))}}async deleteTagFromCardBack(t){if(this.tagCatalog)try{await this.tagCatalog.deleteTag(t),this.tagItems=this.tagItems.filter(r=>r.id!==t);const{card:e}=this.findActiveCardLocation();this.cardDetails.updateDraft({tagIds:this.getCardModalDraftTagIds(e).filter(r=>r!==t)})}catch{throw new Error(this.runtime.i18n.t("boards.cardBack.tagsDeleteFailed"))}}upsertTagItem(t){if(this.tagItems.findIndex(r=>r.id===t.id)>=0){this.tagItems=this.tagItems.map(r=>r.id===t.id?t:r);return}this.tagItems=[...this.tagItems,t]}renderCardBackEntityLinksSection(t){var c;const e=ut(t),r=((c=this.cardDetails.entityLinks)==null?void 0:c.cardId)===t.id?this.cardDetails.entityLinks:null;if(e.length===0&&(r==null?void 0:r.status)!=="saving"&&(r==null?void 0:r.status)!=="error")return[];const a=this.createCardBackSection("link",this.runtime.i18n.t("boards.cardLinks.title")),o=a.querySelector(`.${l.sectionMain}`),n=a.querySelector(`.${l.sectionHeader}`);if(!o||!n)return[a];const s=document.createElement("div");s.className=l.sectionActions,s.append(j({text:this.runtime.i18n.t("boards.cardLinks.link"),tone:"text",size:"md",className:h.quietButton,onClick:()=>this.openCardEntityLinkModal(t)})),n.append(s);const d=document.createElement("div");if(d.className=l.entityLinksHost,d.setAttribute("data-testid","card-entity-links"),(r==null?void 0:r.status)==="saving"&&d.append(this.createEntityLinkPickerMessage(this.runtime.i18n.t("boards.cardLinks.saving"))),(r==null?void 0:r.status)==="error"&&r.error&&d.append(this.createEntityLinkPickerMessage(this.runtime.i18n.t(r.error))),e.length>0){const u=document.createElement("ul");u.className=l.entityLinksList,e.forEach(b=>{u.append(this.renderCardEntityLinkItem(t,b))}),d.append(u)}return o.append(d),[a]}renderCardEntityLinkItem(t,e){var u;const r=document.createElement("li");r.className=l.entityLinkItem;const a=document.createElement("span");a.className=l.entityLinkIcon,a.append($(Tt(e.entity_type),{size:16}));const o=document.createElement("span");o.className=l.entityLinkContent;const n=document.createElement("span");n.className=l.entityLinkTitle,n.textContent=rt(e);const s=document.createElement("span");s.className=l.entityLinkMeta;const d=this.runtime.i18n.t(xt(e.entity_type));s.textContent=(u=e.entity)!=null&&u.status?`${d} - ${e.entity.status}`:d,o.append(n,s);const c=q({icon:"ellipsis-vertical",tone:"text",size:"sm",className:l.entityLinkMenuTriggerButton,ariaLabel:this.runtime.i18n.t("boards.cardLinks.actions",{title:rt(e)}),title:this.runtime.i18n.t("boards.cardBack.actions")});return c.setAttribute("aria-haspopup","dialog"),c.setAttribute("aria-expanded","false"),c.setAttribute("data-testid","card-entity-link-menu-button"),c.dataset.cardEntityLinkMenuTrigger=e.id,c.addEventListener("click",b=>{var m;if(b.stopPropagation(),((m=this.cardEntityLinkMenuPopover)==null?void 0:m.trigger)===c){this.closeCardEntityLinkMenuPopover();return}this.openCardEntityLinkMenuPopover(c,t,e)}),r.append(a,o,c),r}openCardEntityLinkMenuPopover(t,e,r){this.closeCardEntityLinkMenuPopover();const a=K({elevated:!0,className:`${l.entityLinkMenuPopover} hidden`});a.setAttribute("role","dialog"),a.setAttribute("aria-modal","false"),a.setAttribute("aria-label",this.runtime.i18n.t("boards.cardLinks.actions",{title:rt(r)})),a.setAttribute("data-testid","card-entity-link-menu-popover"),a.addEventListener("mousedown",s=>s.stopPropagation());const o=document.createElement("ul");o.className=l.entityLinkMenuList,o.append(this.renderCardEntityLinkMenuItem({labelKey:"boards.cardLinks.openAction",ariaLabel:this.runtime.i18n.t("boards.cardLinks.open",{title:rt(r)}),icon:"arrow-right",onClick:()=>{this.closeCardEntityLinkMenuPopover(),this.openLinkedEntity(r)}}),this.renderCardEntityLinkMenuItem({labelKey:"boards.cardLinks.unlinkAction",ariaLabel:this.runtime.i18n.t("boards.cardLinks.unlink",{title:rt(r)}),icon:"link-slash",onClick:()=>{this.closeCardEntityLinkMenuPopover(),this.unlinkCardEntity(e,r)}}),this.renderCardEntityLinkMenuItem({labelKey:"boards.cardLinks.deleteEntity",ariaLabel:this.runtime.i18n.t("boards.cardLinks.deleteEntityLabel",{title:rt(r)}),icon:"trash",danger:!0,onClick:()=>{this.closeCardEntityLinkMenuPopover(),this.deleteLinkedEntity(e,r)}})),a.append(o);const n=this.createCardEntityLinkMenuAnchoredMenu(t,a);n.mount(),this.cardEntityLinkMenuPopover={cardId:e.id,linkId:r.id,menu:n,panel:a,trigger:t},this.openCardEntityLinkMenuAnchoredMenu(n,t)}refreshCardEntityLinkMenuPopover(t){var o;const e=this.cardEntityLinkMenuPopover;if(!e)return;if(e.cardId!==t.id||!ut(t).some(n=>n.id===e.linkId)){this.closeCardEntityLinkMenuPopover();return}const r=Array.from(((o=this.cardModalBody)==null?void 0:o.querySelectorAll("[data-card-entity-link-menu-trigger]"))??[]).find(n=>n.dataset.cardEntityLinkMenuTrigger===e.linkId);if(!r||r.disabled){this.closeCardEntityLinkMenuPopover();return}e.trigger.setAttribute("aria-expanded","false"),e.menu.unmount(),e.trigger=r;const a=this.createCardEntityLinkMenuAnchoredMenu(r,e.panel);e.menu=a,a.mount(),this.openCardEntityLinkMenuAnchoredMenu(a,r)}createCardEntityLinkMenuAnchoredMenu(t,e){const r=new W({container:t,panel:e,positioning:"viewport",panelZIndex:320,onOpenChange:a=>{var o;t.setAttribute("aria-expanded",a?"true":"false"),!a&&((o=this.cardEntityLinkMenuPopover)==null?void 0:o.menu)===r&&this.closeCardEntityLinkMenuPopover()}});return r}openCardEntityLinkMenuAnchoredMenu(t,e){t.openAt({anchor:e,placement:"bottom-end",fallbackPlacements:["bottom-start","top-end","top-start"],gap:4,margin:12,lockPlacementAfterOpen:!0})}renderCardEntityLinkMenuItem(t){const e=document.createElement("li");e.className=l.entityLinkMenuItem;const r=j({text:this.runtime.i18n.t(t.labelKey),tone:"text",size:"md",className:t.danger?l.entityLinkMenuDangerButton:l.entityLinkMenuButton,onClick:t.onClick});return r.setAttribute("aria-label",t.ariaLabel),Y(r,t.icon),e.append(r),e}async unlinkCardEntity(t,e){const r=await this.cardDetails.unlinkEntity(t,e);this.closeCardEntityLinkMenuPopover(),r.shouldRefresh&&await this.refreshOpenCardEntityLinks(t.id)}async deleteLinkedEntity(t,e){const r=await this.cardDetails.deleteLinkedEntity(t,e);this.closeCardEntityLinkMenuPopover(),r.shouldRefresh&&await this.refreshOpenCardEntityLinks(t.id)}async createEntityFromCard(t,e){(await this.cardDetails.createEntityFromCard(t,e)).shouldRefresh&&await this.refreshOpenCardEntityLinks(t.id)}async refreshOpenCardEntityLinks(t){const e=this.cardDetails.activePlacementId&&this.state?this.findCardLocation(this.cardDetails.activePlacementId,this.state):null;!e||e.card.id!==t||this.renderCardModal(e)}openLinkedEntity(t){window.dispatchEvent(new CustomEvent("boardLinkedEntityOpenRequested",{detail:{entityType:t.entity_type,entityId:t.entity_id}}))}openCardEntityLinkModal(t){let e=null;const{overlay:r,container:a,body:o}=wt(this.runtime.i18n.t("boards.cardLinks.linkToEntity"),{zIndex:360,onClose:()=>e==null?void 0:e.remove()});e=r,a.setAttribute("data-testid","card-entity-link-modal");const n=document.createElement("div");n.className=l.entityLinkPicker;const s=document.createElement("label");s.className=l.entityLinkPickerField;const d=document.createElement("span");d.className=l.moveLabel,d.textContent=this.runtime.i18n.t("boards.cardLinks.selectType");const c=document.createElement("select");c.className=l.moveSelect,["task","story","goal"].forEach(v=>{const B=document.createElement("option");B.value=v,B.textContent=this.runtime.i18n.t(xt(v)),c.append(B)}),s.append(d,c);const b=document.createElement("label");b.className=l.entityLinkPickerField;const m=document.createElement("span");m.className=l.moveLabel,m.textContent=this.runtime.i18n.t("boards.cardLinks.search");const p=tt({variant:"default",className:l.entityLinkPickerInput,placeholder:this.runtime.i18n.t("boards.cardLinks.searchPlaceholder"),disabled:!this.entityCatalog});b.append(m,p);const f=document.createElement("div");f.className=l.entityLinkPickerResults,f.setAttribute("data-testid","card-entity-link-results"),n.append(s,b,f),o.append(n),document.body.append(r);let g=this.entityCatalog?"idle":"error",P=[],w=0,_=null;const I=()=>{if(f.replaceChildren(),g==="loading"){f.append(this.createEntityLinkPickerMessage(this.runtime.i18n.t("boards.cardLinks.loading")));return}if(g==="error"){f.append(this.createEntityLinkPickerMessage(this.runtime.i18n.t("boards.cardLinks.loadFailed")));return}if(P.length===0){f.append(this.createEntityLinkPickerMessage(this.runtime.i18n.t("boards.cardLinks.noResults")));return}const v=new Set(ut(t).map(F=>`${F.entity_type}:${F.entity_id}`)),B=document.createElement("ul");B.className=l.entityLinkPickerList;const D=c.value;P.forEach(F=>{B.append(this.renderEntityLinkPickerResult({card:t,entityType:D,item:F,disabled:v.has(`${D}:${F.id}`),close:()=>r.remove()}))}),f.append(B)},M=async()=>{const v=++w;g="loading",I();try{if(P=await this.searchCardEntityCatalog(c.value,p.value),v!==w)return;g="ready",I()}catch{if(v!==w)return;P=[],g="error",I()}},A=()=>{_!==null&&window.clearTimeout(_),_=window.setTimeout(()=>{_=null,M()},180)};c.addEventListener("change",()=>{P=[],M()}),p.addEventListener("input",A),I(),this.entityCatalog&&(M(),p.focus())}createEntityLinkPickerMessage(t){const e=document.createElement("p");return e.className=l.entityLinksMessage,e.textContent=t,e}renderEntityLinkPickerResult(t){const e=document.createElement("li"),r=document.createElement("button");r.type="button",r.className=l.entityLinkPickerButton,r.disabled=t.disabled,r.setAttribute("data-testid","card-entity-link-result"),r.addEventListener("click",async()=>{r.disabled=!0;const d=await this.cardDetails.createEntityLink(t.card,t.entityType,t.item.id);d.status==="confirmed"&&t.close(),d.shouldRefresh&&await this.refreshOpenCardEntityLinks(t.card.id),d.status!=="confirmed"&&(r.disabled=!1)});const a=$(Tt(t.entityType),{size:16});a.setAttribute("aria-hidden","true");const o=document.createElement("span");o.className=l.entityLinkContent;const n=document.createElement("span");n.className=l.entityLinkTitle,n.textContent=t.item.title;const s=document.createElement("span");return s.className=l.entityLinkMeta,s.textContent=t.item.status?`${this.runtime.i18n.t(xt(t.entityType))} - ${t.item.status}`:this.runtime.i18n.t(xt(t.entityType)),o.append(n,s),r.append(a,o),e.append(r),e}searchCardEntityCatalog(t,e){return this.entityCatalog?t==="task"?this.entityCatalog.searchTasks(e):t==="story"?this.entityCatalog.searchStories(e):this.entityCatalog.searchGoals(e):Promise.resolve([])}renderCardBackChecklistsSection(t){const e=document.createElement("div");return e.className=l.checklistsHost,e.setAttribute("data-testid","card-back-checklists-host"),this.cardModalChecklistHost=e,this.populateCardBackChecklistsHost(t),e}populateCardBackChecklistsHost(t){var n;const e=this.cardModalChecklistHost;if(!e)return;e.replaceChildren();const r=((n=this.cardDetails.checklists)==null?void 0:n.cardId)===t.id?this.cardDetails.checklists:null,a=!r||r.status==="idle"&&r.checklists.length===0||r.status==="ready"&&r.checklists.length===0&&!r.error;if(e.hidden=a,a)return;if((r==null?void 0:r.status)==="loading"){const s=this.createCardBackSection("check-box",this.runtime.i18n.t("boards.cardBack.checklist")),d=s.querySelector(`.${l.sectionMain}`),c=document.createElement("div");c.className=l.checklistsMessage,c.textContent=this.runtime.i18n.t("boards.cardBack.checklistsLoading"),d==null||d.append(c),e.append(s);return}if(r!=null&&r.error){const s=this.createCardBackSection("check-box",this.runtime.i18n.t("boards.cardBack.checklist")),d=s.querySelector(`.${l.sectionMain}`),c=Nt({tone:"error"});c.show(this.runtime.i18n.t(r.error)),d==null||d.append(c.element),e.append(s)}const o=(r==null?void 0:r.checklists)??[];if(o.length>0){const s=document.createElement("div");s.className=l.checklistsList,o.forEach(d=>{s.append(this.renderCardChecklist(t,d))}),e.append(s)}}renderCardChecklist(t,e){const r=e.items.filter(w=>w.state==="complete").length,a=e.items.length,o=a===0?0:Math.round(r/a*100),n=this.cardDetails.isChecklistCheckedItemsHidden(e.id),s=n?e.items.filter(w=>w.state!=="complete"):e.items,d=document.createElement("div");d.className=l.checklistActions,r>0&&d.append(j({text:n?this.runtime.i18n.t("boards.cardBack.showCheckedItems",{count:r}):this.runtime.i18n.t("boards.cardBack.hideCheckedItems"),tone:"text",size:"md",className:l.checklistActionButton,onClick:()=>this.toggleChecklistCheckedItems(t,e.id)}));const c=j({text:this.runtime.i18n.t("common.delete"),tone:"text",size:"md",className:l.checklistActionButton,onClick:()=>this.deleteCardModalChecklist(t.id,e.id)});c.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.deleteChecklist",{title:e.title})),d.append(c);const u=this.createCardBackSection("check-box",e.title,d);if(u.classList.add(l.checklist),u.setAttribute("data-testid","card-checklist"),!u.querySelector(`.${l.sectionMain}`))return u;const m=document.createElement("div");m.className=l.checklistProgressRow;const p=document.createElement("span");p.className=l.checklistProgress,p.textContent=`${o}%`;const f=document.createElement("div");f.className=l.checklistProgressTrack;const g=document.createElement("span");g.className=l.checklistProgressBar,g.style.width=`${o}%`,f.append(g),m.append(p,f);const P=document.createElement("ul");return P.className=l.checkItemList,s.forEach(w=>{P.append(this.renderCardChecklistItem(t,w))}),u.append(m),u.append(P,this.renderCheckItemComposer(t,e)),u}renderCardChecklistItem(t,e){const r=document.createElement("li");r.className=l.checkItem,r.setAttribute("data-testid","card-check-item");const a=new $e({checked:e.state==="complete",ariaLabel:e.title,className:l.checkItemCheckbox,onChange:s=>{this.patchCardModalCheckItem(t.id,e.id,{state:s?"complete":"incomplete"})}}),o=this.renderCardChecklistItemTitle(t,e),n=q({icon:"ellipsis-vertical",tone:"text",size:"sm",className:l.checkItemMenuTriggerButton,ariaLabel:this.runtime.i18n.t("boards.cardBack.checkItemActions",{title:e.title}),title:this.runtime.i18n.t("boards.cardBack.actions")});return n.setAttribute("aria-haspopup","dialog"),n.setAttribute("aria-expanded","false"),n.setAttribute("data-testid","card-check-item-menu-button"),n.dataset.cardCheckItemMenuTrigger=e.id,n.addEventListener("click",s=>{var d;if(s.stopPropagation(),((d=this.cardCheckItemMenuPopover)==null?void 0:d.trigger)===n){this.closeCardCheckItemMenuPopover();return}this.openCardCheckItemMenuPopover(n,t,e)}),r.append(a.getElement(),o,n),r}openCardCheckItemMenuPopover(t,e,r){this.closeCardCheckItemMenuPopover();const a=K({elevated:!0,className:`${l.checkItemMenuPopover} hidden`});a.setAttribute("role","dialog"),a.setAttribute("aria-modal","false"),a.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.checkItemActions",{title:r.title})),a.setAttribute("data-testid","card-check-item-menu-popover"),a.addEventListener("mousedown",c=>c.stopPropagation());const o=document.createElement("ul");o.className=l.checkItemMenuList;const n=document.createElement("li");n.className=l.checkItemMenuItem;const s=j({text:this.runtime.i18n.t("common.delete"),tone:"text",size:"md",className:l.checkItemMenuButton,onClick:()=>{this.closeCardCheckItemMenuPopover(),this.deleteCardModalCheckItem(e.id,r.id)}});s.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.deleteCheckItem",{title:r.title})),Y(s,"trash"),n.append(s),o.append(n),a.append(o);const d=this.createCardCheckItemMenuAnchoredMenu(t,a);d.mount(),this.cardCheckItemMenuPopover={cardId:e.id,itemId:r.id,menu:d,panel:a,trigger:t},this.openCardCheckItemMenuAnchoredMenu(d,t)}refreshCardCheckItemMenuPopover(t){var o;const e=this.cardCheckItemMenuPopover;if(!e)return;if(e.cardId!==t.id){this.closeCardCheckItemMenuPopover();return}const r=Array.from(((o=this.cardModalBody)==null?void 0:o.querySelectorAll("[data-card-check-item-menu-trigger]"))??[]).find(n=>n.dataset.cardCheckItemMenuTrigger===e.itemId);if(!r||r.disabled){this.closeCardCheckItemMenuPopover();return}e.trigger.setAttribute("aria-expanded","false"),e.menu.unmount(),e.trigger=r;const a=this.createCardCheckItemMenuAnchoredMenu(r,e.panel);e.menu=a,a.mount(),this.openCardCheckItemMenuAnchoredMenu(a,r)}createCardCheckItemMenuAnchoredMenu(t,e){const r=new W({container:t,panel:e,positioning:"viewport",panelZIndex:320,onOpenChange:a=>{var o;t.setAttribute("aria-expanded",a?"true":"false"),!a&&((o=this.cardCheckItemMenuPopover)==null?void 0:o.menu)===r&&this.closeCardCheckItemMenuPopover()}});return r}openCardCheckItemMenuAnchoredMenu(t,e){t.openAt({anchor:e,placement:"bottom-end",fallbackPlacements:["bottom-start","top-end","top-start"],gap:4,margin:12,lockPlacementAfterOpen:!0})}renderCardChecklistItemTitle(t,e){const r=document.createElement("button");return r.type="button",r.className=e.state==="complete"?l.checkItemTitleComplete:l.checkItemTitle,r.textContent=e.title,r.addEventListener("click",()=>{this.startCardChecklistItemTitleEdit(t,e,r)}),r}startCardChecklistItemTitleEdit(t,e,r){const a=document.createElement("input");a.type="text",a.className=l.checkItemTitleInput,a.value=e.title,a.setAttribute("aria-label",e.title);let o=!1;const n=()=>{r.isConnected||a.replaceWith(r)},s=()=>{if(o)return;o=!0;const c=a.value.trim();if(!c||c===e.title){n();return}this.patchCardModalCheckItem(t.id,e.id,{title:c})},d=()=>{o||(o=!0,n())};a.addEventListener("keydown",c=>{c.key==="Enter"&&(c.preventDefault(),s()),c.key==="Escape"&&(c.preventDefault(),d())}),a.addEventListener("blur",s),r.replaceWith(a),window.requestAnimationFrame(()=>{a.focus(),a.select()})}renderCheckItemComposer(t,e){if(!this.cardDetails.isCheckItemComposerExpanded(e.id))return j({text:this.runtime.i18n.t("boards.cardBack.checkItemPlaceholder"),tone:"text",size:"md",className:l.checkItemCollapsedComposer,onClick:()=>this.expandCheckItemComposer(t,e.id)});const r=document.createElement("form");r.className=l.checkItemComposer;const a=tt({variant:"default",className:l.checkItemComposerInput,placeholder:this.runtime.i18n.t("boards.cardBack.checkItemPlaceholder")});a.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.checkItemPlaceholder")),a.addEventListener("keydown",u=>{u.key==="Enter"&&(u.preventDefault(),r.requestSubmit()),u.key==="Escape"&&this.collapseCheckItemComposer(t,e.id)});const o=document.createElement("div");o.className=l.checkItemComposerActions;const n=document.createElement("div");n.className=l.checkItemComposerPrimaryActions;const s=j({text:this.runtime.i18n.t("boards.cardBack.addItem"),tone:"primary",size:"md",className:h.primaryButton});s.type="submit";const d=j({text:this.runtime.i18n.t("common.cancel"),tone:"text",size:"md",className:h.quietButton,onClick:()=>this.collapseCheckItemComposer(t,e.id)});d.type="button",n.append(s,d);const c=document.createElement("div");return c.className=l.checkItemComposerMetaActions,c.append(this.createCheckItemMetaButton("plus","boards.cardBack.assign"),this.createCheckItemMetaButton("calendar","boards.cardBack.dueDate")),o.append(n,c),r.addEventListener("submit",u=>{u.preventDefault(),this.createCardModalCheckItem(t.id,e.id,a.value)}),r.append(a,o),window.requestAnimationFrame(()=>a.focus()),r}createCheckItemMetaButton(t,e){const r=j({text:this.runtime.i18n.t(e),tone:"text",size:"md",className:l.checkItemMetaButton,disabled:!0});return Y(r,t),r}setCardChecklistPanelState(t){const e=this.cardDetails.activePlacementId&&this.state?this.findCardLocation(this.cardDetails.activePlacementId,this.state):null;(e==null?void 0:e.card.id)===t.cardId&&this.populateCardBackChecklistsHost(e.card)}syncCardChecklistPanelState(){const t=this.cardDetails.checklists;t&&this.setCardChecklistPanelState(t)}async loadCardModalChecklists(t){const e=this.cardDetails.loadChecklists(t);this.syncCardChecklistPanelState(),await e&&this.syncCardChecklistPanelState()}focusCardChecklistComposer(){var e;const t=(e=this.cardChecklistPopover)==null?void 0:e.panel.querySelector("input");t==null||t.focus()}toggleChecklistCheckedItems(t,e){this.cardDetails.toggleChecklistCheckedItems(e),this.populateCardBackChecklistsHost(t)}expandCheckItemComposer(t,e){this.cardDetails.expandCheckItemComposer(e),this.populateCardBackChecklistsHost(t)}collapseCheckItemComposer(t,e){this.cardDetails.collapseCheckItemComposer(e),this.populateCardBackChecklistsHost(t)}async createCardModalChecklist(t,e){const r=(e==null?void 0:e.trim())??"";if(!r){this.focusCardChecklistComposer();return}const a=this.cardDetails.createChecklist(t.id,r);this.syncCardChecklistPanelState(),await a&&this.syncCardChecklistPanelState(),this.closeCardChecklistPopover()}async deleteCardModalChecklist(t,e){const r=this.cardDetails.deleteChecklist(t,e);this.syncCardChecklistPanelState(),await r&&this.syncCardChecklistPanelState()}async createCardModalCheckItem(t,e,r){const a=r.trim();if(!a)return;const o=this.cardDetails.createCheckItem(t,e,a);this.syncCardChecklistPanelState(),await o&&this.syncCardChecklistPanelState()}async patchCardModalCheckItem(t,e,r){const a=this.cardDetails.patchCheckItem(t,e,r);this.syncCardChecklistPanelState(),await a&&this.syncCardChecklistPanelState()}async deleteCardModalCheckItem(t,e){const r=this.cardDetails.deleteCheckItem(t,e);this.syncCardChecklistPanelState(),await r&&this.syncCardChecklistPanelState()}renderCardBackDescriptionSection(t,e,r){const a=this.createCardBackSection("document",this.runtime.i18n.t("boards.cardDescriptionLabel")),o=a.querySelector(`.${l.sectionMain}`);if(!o)return a;o.append(r);const n=document.createElement("div");n.className=l.editorActions;const s=j({text:this.runtime.i18n.t("common.save"),tone:"primary",size:"md",className:h.primaryButton,onClick:()=>this.saveCardModal(t,e,r)}),d=()=>{s.disabled=e.value.trim().length===0};return e.addEventListener("input",d),d(),n.append(j({text:this.runtime.i18n.t("common.cancel"),tone:"text",size:"md",className:h.quietButton,onClick:()=>this.closeCardModal()}),s),o.append(n),a}async deleteSharedCardFromQuickEditor(t){await this.deleteSharedCard(t,()=>this.closeQuickCardEditor())}async deleteSharedCardFromDetails(t){await this.deleteSharedCard(t,()=>{this.closeCardActionsPopover(),this.closeCardModal()})}async deleteSharedCard(t,e){await this.confirmSharedCardDeletion()&&(e(),this.handlers.onDeleteCard(t.id))}confirmSharedCardDeletion(){return this.openDeleteCardConfirmationDialog()}openDeleteCardConfirmationDialog(){return new Promise(t=>{let e=!1;const r=p=>{e||(e=!0,t(p))},a=()=>o.remove(),{overlay:o,container:n,body:s,footer:d}=wt(this.runtime.i18n.t("boards.actions.deleteCard"),{intent:"confirm",zIndex:360,onClose:()=>{r(!1),a()}}),c=document.createElement("p");c.className="text-sm leading-relaxed text-slate-600",c.id=`delete-card-confirm-message-${Math.random().toString(36).slice(2,9)}`,c.textContent=this.runtime.i18n.t("boards.cardMirror.deleteSharedConfirm"),n.setAttribute("aria-describedby",c.id),s.append(c);const u=fe({variant:"confirm"}),b=j({text:this.runtime.i18n.t("common.cancel"),tone:"text",size:"md",className:jt("default"),onClick:()=>{r(!1),a()}});b.setAttribute("data-testid","delete-card-cancel-button"),u.append(b);const m=j({text:this.runtime.i18n.t("boards.actions.deleteCard"),tone:"destructive",size:"md",className:jt("wide"),onClick:()=>{r(!0),a()}});m.setAttribute("data-testid","delete-card-confirm-button"),u.append(m),d.append(u),n.addEventListener("keydown",p=>{p.stopPropagation(),p.key==="Escape"&&(p.preventDefault(),r(!1),a())})})}renderCardBackAttachmentsSection(){const t=this.createCardBackSection("link",this.runtime.i18n.t("boards.cardBack.attachments"),j({text:this.runtime.i18n.t("boards.cardBack.add"),tone:"text",size:"sm",className:h.quietButton,disabled:!0})),e=t.querySelector(`.${l.sectionMain}`);if(!e)return t;const r=document.createElement("div");return r.className=l.placeholderPanel,r.textContent=this.runtime.i18n.t("boards.cardBack.noAttachments"),e.append(r),t}renderCardBackAside(t,e){const r=document.createElement("aside");r.className=l.aside,r.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.comments"));const a=this.createCardBackSection("chat-bubble-left",this.runtime.i18n.t("boards.cardBack.comments"),j({text:this.runtime.i18n.t("boards.cardBack.showDetails"),tone:"text",size:"sm",className:h.quietButton,disabled:!0})),o=a.querySelector(`.${l.sectionMain}`);if(!o)return r;o.append(j({text:this.runtime.i18n.t("boards.cardBack.writeComment"),tone:"text",size:"md",className:l.activityInput,disabled:!0}));const n=document.createElement("ul");n.className=l.activityList;const s=document.createElement("li");s.className=l.activityItem;const d=document.createElement("span");d.className=l.avatar,d.textContent="M",d.setAttribute("aria-hidden","true");const c=document.createElement("span");return c.textContent=this.runtime.i18n.t("boards.cardBack.activityCreated",{board:t.title,column:e.title}),s.append(d,c),n.append(s),o.append(n),r.append(a),r}createCardBackSection(t,e,r){const a=document.createElement("section");a.className=l.section;const o=document.createElement("div");o.className=l.sectionIcon;const n=$(t,{size:20,strokeWidth:2});n.setAttribute("aria-hidden","true"),o.append(n);const s=document.createElement("div");s.className=l.sectionMain;const d=document.createElement("div");d.className=l.sectionHeader;const c=document.createElement("h3");c.className=l.sectionTitle,c.textContent=e;const u=document.createElement("div");return u.className=l.sectionActions,r&&u.append(r),d.append(c,u),s.append(d),a.append(o,s),a}createUnavailableCardBackButton(t,e){const r=j({text:this.runtime.i18n.t(t),tone:"text",size:"md",className:l.quickActionButton,disabled:!0});return Y(r,e),r}saveCardModal(t,e,r){if(!e.value.trim())return;const o=this.cardDetails.updateDraft({title:e.value,description:r.value});if(!o)return;if(!o.identity.isResolved){this.cardDetails.queueSubmit({closeAfterSubmit:!0});return}const n=he(o);if(be(n)){const s=this.handlers.onPatchCard(o.identity.cardId,n);if(this.isPromiseLike(s)){Promise.resolve(s).then(d=>{if(this.isCommandFailure(d)){this.notifyCommandFailure(d);return}this.cardDetails.markSubmitted(),this.closeCardModal()});return}if(this.isCommandFailure(s)){this.notifyCommandFailure(s);return}this.cardDetails.markSubmitted()}this.closeCardModal()}closeCardModal(){var t;this.closeCardActionsPopover(),this.closeCardLabelsPopover(),this.closeCardChecklistPopover(),this.closeCardCheckItemMenuPopover(),this.closeMoveCardPopover(),this.cardDetails.close(),this.cardModalLabelsHost=null,this.cardModalQuickActionList=null,this.cardModalChecklistHost=null,(t=this.cardModalOverlay)==null||t.remove(),this.cardModalOverlay=null,this.cardModalContainer=null,this.cardModalBody=null,this.cardModalTitleElement=null}closeCardLabelsPopover(){const t=this.cardLabelsPopover;t&&(this.cardLabelsPopover=null,t.trigger.setAttribute("aria-expanded","false"),t.menu.close(),t.menu.unmount(),t.picker.destroy(),t.panel.remove())}closeCardChecklistPopover(){const t=this.cardChecklistPopover;t&&(this.cardChecklistPopover=null,t.trigger.setAttribute("aria-expanded","false"),t.menu.close(),t.menu.unmount(),t.panel.remove())}closeCardCheckItemMenuPopover(){const t=this.cardCheckItemMenuPopover;t&&(this.cardCheckItemMenuPopover=null,t.trigger.setAttribute("aria-expanded","false"),t.menu.close(),t.menu.unmount(),t.panel.remove())}closeCardEntityLinkMenuPopover(){const t=this.cardEntityLinkMenuPopover;t&&(this.cardEntityLinkMenuPopover=null,t.trigger.setAttribute("aria-expanded","false"),t.menu.close(),t.menu.unmount(),t.panel.remove())}closeMoveCardPopover(){const t=this.moveCardPopover;t&&(this.moveCardPopover=null,t.trigger.setAttribute("aria-expanded","false"),t.menu.close(),t.menu.unmount(),t.panel.remove())}closeCardActionsPopover(){const t=this.cardActionsPopover;t&&(this.cardActionsPopover=null,t.trigger.setAttribute("aria-expanded","false"),t.menu.close(),t.menu.unmount(),t.panel.remove())}closeListActionsPopover(){const t=this.listActionsPopover;t&&(this.listActionsPopover=null,t.trigger.setAttribute("aria-expanded","false"),t.menu.close(),t.menu.unmount(),t.panel.remove())}closeBoardPickerPopover(){const t=this.boardPickerPopover;t&&(this.closeBoardPickerActionsMenu(),this.boardPickerPopover=null,t.trigger.setAttribute("aria-expanded","false"),t.menu.close(),t.menu.unmount(),t.panel.remove())}closeBoardPickerActionsMenu(){var e;const t=(e=this.boardPickerPopover)==null?void 0:e.actionsMenu;t&&(this.boardPickerPopover.actionsMenu=null,t.menu.close(),t.menu.unmount(),t.panel.remove())}closeQuickCardEditor(){this.surface.closeQuickEditor(),this.unmountQuickCardEditorOverlay()}unmountQuickCardEditorOverlay(){var t;(t=this.quickEditorOverlay)==null||t.remove(),this.quickEditorOverlay=null}getSelectedBoard(t){return t.boards.find(e=>e.id===t.selectedBoardId)??t.boards[0]??null}findCardLocation(t,e){for(const r of e.boards)for(const a of r.columns){const o=a.cards.find(n=>y(n)===t);if(o)return{board:r,column:a,card:o,placementId:t}}return null}handleSurfaceDragStart(t){this.surface.beginDrag(t),this.closeTransientBoardOverlays()}handleCardPlacementDrop(t,e){const r=this.surface.createCardDropIntent(t,e);this.handlers.onPatchCardPlacement(r.placementId,r.target)}handleColumnDrop(t,e){const r=this.surface.createColumnDropIntent(t,e);this.handlers.onPatchColumn(r.columnId,r.target)}submitColumnTitle(t,e){typeof e=="string"&&this.surface.setColumnComposerDraft(e);const r=this.surface.submitColumnComposer();r&&this.handlers.onCreateColumn(t,r)}startBoardTitleEdit(t){this.surface.beginBoardTitleEdit(t),this.rerenderCurrentState()}finishBoardTitleEdit(t,e){const r=this.surface.finishBoardTitleEdit(t,e);if(r){this.handlers.onPatchBoard(t.id,{title:r});return}this.rerenderCurrentState()}startColumnTitleEdit(t){this.surface.beginColumnTitleEdit(t),this.rerenderCurrentState()}finishColumnTitleEdit(t,e){const r=this.surface.finishColumnTitleEdit(t,e);if(r){this.handlers.onPatchColumn(t.id,{title:r});return}this.rerenderCurrentState()}expandCardComposer(t){this.surface.beginCardComposer(t),this.rerenderCurrentState()}collapseCardComposer(){this.surface.cancelCardComposer(),this.rerenderCurrentState()}expandColumnComposer(){this.surface.beginColumnComposer(),this.rerenderCurrentState()}collapseColumnComposer(){this.surface.cancelColumnComposer(),this.rerenderCurrentState()}submitCard(t,e){typeof e=="string"&&this.surface.setCardComposerDraft(t,e);const r=this.surface.submitCardComposer(t);r&&(this.handlers.onCreateCard(t,r,""),this.rerenderCurrentState())}rerenderCurrentState(){this.state&&this.render(this.state)}unmountHeaderMenu(){var t;(t=this.headerMenu)==null||t.unmount(),this.headerMenu=null}}function Dt(i){return{id:i.uuid??String(i.id),title:i.title,status:i.status??null}}class za{constructor(t={}){this.root=null,this.store=null,this.view=null,this.subscriptions=new Yt,this.runtime=t.runtime??Ft()}mount(t){if(this.root)return;const e=document.createElement("div");e.dataset.module="boards",e.className="h-full w-full",t.appendChild(e),this.root=e;const r=new ze(Fe.apiUrl),a=new Ge(r),o=new He(r),n=new Ke(r),s=new Ye(r),d=new Ur(s),c=new Wr(s,d),u=new Qr({createTask:m=>k(a.createTask(m)),createStory:m=>k(o.createStory(m)),createGoal:m=>k(n.createGoal(m)),deleteTask:async m=>{await k(a.deleteTask(m))},deleteStory:async m=>{await k(o.deleteStory(m))},deleteGoal:async m=>{await k(n.deleteGoal(m))},createCardEntityLink:(m,p,f)=>d.createCardEntityLink(m,p,f),reloadBoards:()=>d.load()}),b=new $a(e,{runtime:this.runtime,tagCatalog:{loadTags:()=>k(a.getTags()),createTag:(m,p)=>k(a.createTag({title:m,color:p??Ue(m)})),updateTag:(m,p)=>k(a.updateTag(m,p)),deleteTag:async m=>{await k(a.deleteTag(m))}},entityCatalog:{searchTasks:async m=>(await k(a.fetchTasks({search:m,page:1,pageSize:20}))).results.map(Dt),searchStories:async m=>(await k(o.fetchStories({search:m,page:1,pageSize:20}))).results.map(Dt),searchGoals:async m=>(await k(n.searchGoalsForPicker({search:m,page:1,pageSize:20}))).results.map(Dt)},handlers:{onRefresh:()=>void d.load(),onSelectBoard:m=>d.selectBoard(m),onCreateBoard:m=>c.createBoard(m),onPatchBoard:(m,p)=>c.patchBoard(m,p),onToggleBoardStar:m=>d.toggleBoardStar(m),onUpdateBoardGroup:(m,p)=>d.updateBoardGroup(m,p),onDeleteBoard:m=>c.deleteBoard(m),onCreateColumn:(m,p)=>c.createColumn(m,p),onPatchColumn:(m,p)=>c.patchColumn(m,p),onDeleteColumn:m=>c.deleteColumn(m),onCreateCard:(m,p,f)=>c.createCard(m,p,f),onPatchCard:(m,p)=>c.patchCard(m,p),onLoadCardChecklists:m=>d.loadCardChecklists(m),onCreateCardChecklist:(m,p)=>d.createCardChecklist(m,p),onDeleteCardChecklist:m=>d.deleteCardChecklist(m),onCreateCardCheckItem:(m,p)=>d.createCardCheckItem(m,p),onPatchCardCheckItem:(m,p)=>d.patchCardCheckItem(m,p),onDeleteCardCheckItem:m=>d.deleteCardCheckItem(m),onCreateCardEntityLink:(m,p,f)=>d.createCardEntityLink(m,p,f),onCreateCardEntityFromCard:(m,p)=>u.createEntityFromCard(m,p),onDeleteCardEntityLink:m=>d.deleteCardEntityLink(m),onDeleteLinkedEntity:(m,p)=>u.deleteLinkedEntity(p),onCreateCardMirror:(m,p,f)=>c.createCardMirror(m,p,f),onPatchCardPlacement:(m,p)=>c.patchCardPlacement(m,p),onDeleteCardPlacement:m=>c.deleteCardPlacement(m),onDeleteCard:m=>c.deleteCard(m),onPreviewImport:m=>d.previewImport(m),onExportData:m=>d.exportData(m),onApplyImport:m=>d.applyImport(m)}});this.store=d,this.view=b,this.subscriptions.add(d.state$.subscribe(m=>b.render(m))),d.load()}unmount(){var t,e,r;this.subscriptions.unsubscribe(),this.subscriptions=new Yt,(t=this.view)==null||t.destroy(),this.view=null,(e=this.store)==null||e.destroy(),this.store=null,(r=this.root)==null||r.remove(),this.root=null}}class Ha{constructor(t={}){this.id="boards",this.app=null,this.runtime=t.runtime??Ft()}mount(t){if(this.app)return;const e=new za({runtime:this.runtime});e.mount(t),this.app=e}unmount(){var t;(t=this.app)==null||t.unmount(),this.app=null}getAiAssistantSnapshot(){return null}}export{Ha as BoardsModule};
