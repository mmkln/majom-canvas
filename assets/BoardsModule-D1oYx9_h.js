import{m as Rt,B as ge,g as k,k as $t,n as Ct,l as Y,p as T,q as D,r as ke,u as F,v as O,w as yt,x as fe,y as _e,z as C,A as xe,D as nt,E as ve,F as Kt,G as st,I as wt,J as W,L as Ce,C as ye,d as Ht,H as we,e as je,T as Ee,M as Pe,N as Ie,O as Ae}from"./index-CkxXbdOI.js";import{r as Be}from"./renderInlineComposer-BtSXxV7x.js";function Wt(n){return Array.isArray(n)?n:n.results}function P(n){return encodeURIComponent(String(n))}function Le(n={}){const t=[];return n.card&&t.push(`card=${encodeURIComponent(n.card)}`),n.entity_type&&t.push(`entity_type=${encodeURIComponent(n.entity_type)}`),n.entity_id&&t.push(`entity_id=${encodeURIComponent(n.entity_id)}`),t.length?`?${t.join("&")}`:""}class Me{constructor(t){this.http=t}getBoards(){return this.http.get("/boards/").pipe(Rt(Wt))}createBoard(t){return this.http.post("/boards/",t)}updateBoard(t,e){return this.http.patch(`/boards/${P(t)}/`,e)}deleteBoard(t){return this.http.delete(`/boards/${P(t)}/`)}createColumn(t){return this.http.post("/columns/",t)}updateColumn(t,e){return this.http.patch(`/columns/${P(t)}/`,e)}deleteColumn(t){return this.http.delete(`/columns/${P(t)}/`)}createCard(t){return this.http.post("/cards/",t)}updateCard(t,e){return this.http.patch(`/cards/${P(t)}/`,e)}deleteCard(t){return this.http.delete(`/cards/${P(t)}/`)}getCardChecklists(t){return this.http.get(`/cards/${P(t)}/checklists/`)}createCardChecklist(t,e){return this.http.post(`/cards/${P(t)}/checklists/`,e)}updateCardChecklist(t,e){return this.http.patch(`/card-checklists/${P(t)}/`,e)}deleteCardChecklist(t){return this.http.delete(`/card-checklists/${P(t)}/`)}createCardCheckItem(t,e){return this.http.post(`/card-checklists/${P(t)}/items/`,e)}updateCardCheckItem(t,e){return this.http.patch(`/card-check-items/${P(t)}/`,e)}deleteCardCheckItem(t){return this.http.delete(`/card-check-items/${P(t)}/`)}getCardEntityLinks(t={}){return this.http.get(`/card-entity-links/${Le(t)}`).pipe(Rt(Wt))}createCardEntityLink(t){return this.http.post("/card-entity-links/",t)}deleteCardEntityLink(t){return this.http.delete(`/card-entity-links/${P(t)}/`)}createCardPlacement(t){return this.http.post("/card-placements/",t)}updateCardPlacement(t,e){return this.http.patch(`/card-placements/${P(t)}/`,e)}deleteCardPlacement(t){return this.http.delete(`/card-placements/${P(t)}/`)}}function j(n){return n.placement_id??n.id}function Ut(n){const t=n.pos??n.order??0,e=Number(t);return Number.isFinite(e)?e:0}function Se(n,t){return Ut(n)-Ut(t)||j(n).localeCompare(j(t))||n.id.localeCompare(t.id)}const St="boards-session-selected-board";function de(n){if(typeof n!="string")return null;const t=n.trim();return t.length>0?t:null}function Gt(n,t){return t!==null&&n.some(e=>e.id===t)}function Te(){try{return de(sessionStorage.getItem(St))}catch{return null}}function Qt(n){try{const t=de(n);if(t){sessionStorage.setItem(St,t);return}sessionStorage.removeItem(St)}catch{}}function Ne(n,t){var a;if(Gt(n,t))return t;const e=Te();return Gt(n,e)?e:((a=n[0])==null?void 0:a.id)??null}const De=["lastOpenedAt","last_opened_at","lastActivityAt","last_activity_at","updatedAt","updated_at","createdAt","created_at"];function gt(n){const t=n.meta;return t&&typeof t=="object"&&!Array.isArray(t)?t:null}function zt(n){return{...gt(n)??{}}}function $e(n,t){const e=gt(n);if(!e)return!1;for(const a of t){const o=e[a];if(typeof o=="boolean")return o}return!1}function bt(n){return $e(n,["favorite","favourite","starred"])}function jt(n){const t=gt(n);if(!t)return null;for(const e of De){const a=t[e],o=typeof a=="string"||typeof a=="number"?new Date(a).getTime():null;if(typeof o=="number"&&Number.isFinite(o))return o}return null}function Tt(n){const t=gt(n);if(!t)return null;const e=t.group;if(e&&typeof e=="object"&&!Array.isArray(e)){const r=e,i=typeof r.id=="string"?r.id.trim():"",s=typeof r.name=="string"?r.name.trim():"";if(i||s)return{id:i||s,name:s||i}}const a=typeof t.groupId=="string"?t.groupId.trim():typeof t.group_id=="string"?t.group_id.trim():"",o=typeof t.groupName=="string"?t.groupName.trim():typeof t.group_name=="string"?t.group_name.trim():"";return!a&&!o?null:{id:a||o,name:o||a}}function ze(n,t){return{...zt(n),favorite:t}}function Fe(n,t){return{...zt(n),lastOpenedAt:t}}function Oe(n,t){const e=zt(n);if(!t)return delete e.group,delete e.groupId,delete e.groupName,delete e.group_id,delete e.group_name,e;const a=t.id.trim()||t.name.trim(),o=t.name.trim()||t.id.trim();return e.group={id:a,name:o},e.groupId=a,e.groupName=o,e.group_id=a,e.group_name=o,e}function Nt(n){const t=new Map;return n.forEach(e=>{const a=Tt(e);!a||t.has(a.id)||t.set(a.id,a)}),Array.from(t.values()).sort((e,a)=>e.name.localeCompare(a.name))}function qe(n,t){const a=n.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"group",o=new Set(Nt(t).map(s=>s.id));if(!o.has(a))return a;let r=2,i=`${a}-${r}`;for(;o.has(i);)r+=1,i=`${a}-${r}`;return i}const kt="majom.boards.exchange",ft="1.0";function Re(){return{mode:"merge",missingFieldPolicy:"keep_existing",matchStrategy:"title",unknownFieldPolicy:"warn_and_ignore"}}const Ke=new Set(["schema","version","scope","title","id","exportedAt"]);function He(n){var i;const t=n.replace(/\r\n/g,`
`).split(`
`);if(((i=t[0])==null?void 0:i.trim())!=="---")return{fields:{},body:n,diagnostics:[]};const e=t.findIndex((s,c)=>c>0&&s.trim()==="---");if(e<0)return{fields:{},body:n,diagnostics:[{level:"warning",code:"markdown_front_matter_unclosed",message:"Markdown front matter was not closed and was ignored.",path:"frontMatter"}]};const a=t.slice(1,e),o={},r=[];for(const s of a){const c=s.indexOf(":");if(c<0)continue;const d=s.slice(0,c).trim(),m=s.slice(c+1).trim().replace(/^"|"$/g,"");d&&(o[d]=m,Ke.has(d)||r.push({level:"warning",code:"unknown_front_matter_field",message:`Unknown front matter field "${d}" will be ignored.`,path:`frontMatter.${d}`}))}return{fields:o,body:t.slice(e+1).join(`
`),diagnostics:r}}function U(n,t,e,a){if(n===void 0)return a.push({level:"warning",code:"missing_title",message:`Missing title at ${e}; using "${t}".`,path:e}),t;const o=n.trim();return o||(a.push({level:"warning",code:"empty_title",message:`Empty title at ${e}; using "${t}".`,path:e}),t)}function We(n,t){var i;const a=(((i=n[t])==null?void 0:i.trim())??"").replace(/^Description:\s*/i,"").trim();if(a)return a;const o=[];for(let s=t+1;s<n.length;s+=1){const c=n[s]??"";if(/^#{1,6}\s/.test(c)||/^[A-Za-z][A-Za-z0-9 _-]*:\s*/.test(c))break;o.push(c)}return o.join(`
`).trim()||void 0}function Yt(n,t,e,a){let o;const r=[];let i=null;const s=Math.max(t+1,0);for(let c=s;c<n.length;c+=1){const d=n[c]??"",m=d.trim();if(/^##\s+Column:/.test(d)||/^###\s+Card:/.test(d))break;if(!m)continue;if(/^Description:/i.test(m)){o=We(n,c),i=null;continue}const u=/^Checklist:\s*(.*)$/i.exec(m);if(u){const b=r.length;i={title:U(u[1],"Checklist",`${e}.checklists[${b}].title`,a),items:[]},r.push(i);continue}const h=/^-\s*\[( |x|X)\]\s*(.*)$/.exec(m);if(h){i||(i={title:"Checklist",items:[]},r.push(i),a.push({level:"warning",code:"check_item_without_checklist",message:'A checklist item appeared before any checklist title; using "Checklist".',path:`${e}.checklists[${r.length-1}]`}));const b=i.items.length;i.items.push({title:U(h[2],"Untitled item",`${e}.checklists[${r.length-1}].items[${b}].title`,a),state:h[1].toLowerCase()==="x"?"complete":"incomplete"})}}return{...o?{description:o}:{},...r.length>0?{checklists:r}:{}}}function Et(n,t){return{schema:kt,version:ft,format:"markdown",scope:n,exportedAt:new Date().toISOString(),payload:t}}function Ue(n,t){const e=He(n),a=e.body.replace(/\r\n/g,`
`).split(`
`),o=[...e.diagnostics];if(t==="card"){const c=a.findIndex(h=>h.startsWith("### Card:")||h.startsWith("# Card:")),d=c>=0?a[c]:void 0,m=U(d==null?void 0:d.replace(/^#{1,3}\s*Card:/,""),"Untitled card","payload.title",o),u=Yt(a,c>=0?c:-1,"payload",o);return{envelope:Et(t,{...e.fields.id?{id:e.fields.id}:{},title:m,...u}),diagnostics:o}}const r=[];let i=null;for(const[c,d]of a.entries()){if(d.startsWith("## Column:")){i={title:U(d.replace("## Column:",""),"Untitled column",`payload.columns[${r.length}].title`,o),cards:[]},r.push(i);continue}if(d.startsWith("### Card:")){i||(i={title:"Imported",cards:[]},r.push(i),o.push({level:"warning",code:"card_without_column",message:'A card heading appeared before any column; using "Imported".',path:`body.line${c+1}`}));const m=Math.max(r.length-1,0),u=i.cards.length,h=U(d.replace("### Card:",""),"Untitled card",`payload.columns[${m}].cards[${u}].title`,o),b=Yt(a,c,`payload.columns[${m}].cards[${u}]`,o);i.cards.push({title:h,...b})}}if(t==="column"){const c=r[0]??{title:U(e.fields.title,"Untitled column","payload.title",o),cards:[]};return{envelope:Et(t,c),diagnostics:o}}const s={...e.fields.id?{id:e.fields.id}:{},title:U(e.fields.title,"Untitled board","payload.title",o),columns:r};return{envelope:Et(t,s),diagnostics:o}}function Ge(n,t=[]){return{scope:n,canApply:t.every(e=>e.level!=="error"),counts:{create:0,update:0,skip:0,conflict:0},items:[],diagnostics:t,warnings:t.filter(e=>e.level==="warning").map(e=>e.message),errors:t.filter(e=>e.level==="error").map(e=>e.message)}}const et={board:new Set(["id","title","columns"]),column:new Set(["id","title","cards"]),card:new Set(["id","title","description","checklists"]),checklist:new Set(["id","title","items"]),checkItem:new Set(["id","title","state"])},Qe=new Set(["complete","incomplete"]);function J(n){return typeof n=="object"&&n!==null&&!Array.isArray(n)}function Ye(n,t,e,a,o){n.push({level:t.policies.unknownFieldPolicy==="strict_error"?"error":"warning",code:e,message:a,...o?{path:o}:{}})}function Xe(n,t,e){return n.push({level:"warning",code:"missing_title",message:`Missing title at ${t}; using "${e}".`,path:t}),e}function at(n,t,e,a){if(typeof n!="string")return Xe(a,e,t);const o=n.trim();return o||(a.push({level:"warning",code:"empty_title",message:`Empty title at ${e}; using "${t}".`,path:e}),t)}function ot(n,t,e,a,o){for(const r of Object.keys(n))t.has(r)||Ye(o,a,"unknown_payload_field",`Unknown payload field "${r}" will be ignored.`,`${e}.${r}`)}function ce(n,t,e,a){if(!J(n))return a.push({level:"error",code:"invalid_card_payload",message:`Card payload at ${t} must be an object.`,path:t}),{title:"Untitled card"};ot(n,et.card,t,e,a);const o=Array.isArray(n.checklists)?n.checklists:[];n.checklists!==void 0&&!Array.isArray(n.checklists)&&a.push({level:"warning",code:"invalid_checklists_field",message:`Checklists at ${t}.checklists must be an array and were ignored.`,path:`${t}.checklists`});const r=o.map((i,s)=>Ve(i,`${t}.checklists[${s}]`,e,a));return{...typeof n.id=="string"?{id:n.id}:{},title:at(n.title,"Untitled card",`${t}.title`,a),...typeof n.description=="string"?{description:n.description}:{},...r.length>0?{checklists:r}:{}}}function Ve(n,t,e,a){if(!J(n))return a.push({level:"error",code:"invalid_checklist_payload",message:`Checklist payload at ${t} must be an object.`,path:t}),{title:"Checklist",items:[]};ot(n,et.checklist,t,e,a);const o=Array.isArray(n.items)?n.items:[];return n.items!==void 0&&!Array.isArray(n.items)&&a.push({level:"warning",code:"invalid_check_items_field",message:`Checklist items at ${t}.items must be an array and were ignored.`,path:`${t}.items`}),{...typeof n.id=="string"?{id:n.id}:{},title:at(n.title,"Checklist",`${t}.title`,a),items:o.map((r,i)=>Je(r,`${t}.items[${i}]`,e,a))}}function Je(n,t,e,a){if(!J(n))return a.push({level:"error",code:"invalid_check_item_payload",message:`Checklist item payload at ${t} must be an object.`,path:t}),{title:"Untitled item",state:"incomplete"};ot(n,et.checkItem,t,e,a);const o=typeof n.state=="string"&&Qe.has(n.state)?n.state:"incomplete";return n.state!==void 0&&o!==n.state&&a.push({level:"warning",code:"invalid_check_item_state",message:`Checklist item state at ${t}.state must be "complete" or "incomplete"; using "incomplete".`,path:`${t}.state`}),{...typeof n.id=="string"?{id:n.id}:{},title:at(n.title,"Untitled item",`${t}.title`,a),state:o}}function le(n,t,e,a){if(!J(n))return a.push({level:"error",code:"invalid_column_payload",message:`Column payload at ${t} must be an object.`,path:t}),{title:"Untitled column",cards:[]};ot(n,et.column,t,e,a);const o=Array.isArray(n.cards)?n.cards:[];return n.cards!==void 0&&!Array.isArray(n.cards)&&a.push({level:"warning",code:"invalid_cards_field",message:`Cards at ${t}.cards must be an array and were ignored.`,path:`${t}.cards`}),{...typeof n.id=="string"?{id:n.id}:{},title:at(n.title,"Untitled column",`${t}.title`,a),cards:o.map((r,i)=>ce(r,`${t}.cards[${i}]`,e,a))}}function Ze(n,t,e,a){if(!J(n))return a.push({level:"error",code:"invalid_board_payload",message:`Board payload at ${t} must be an object.`,path:t}),{title:"Untitled board",columns:[]};ot(n,et.board,t,e,a);const o=Array.isArray(n.columns)?n.columns:[];return n.columns!==void 0&&!Array.isArray(n.columns)&&a.push({level:"warning",code:"invalid_columns_field",message:`Columns at ${t}.columns must be an array and were ignored.`,path:`${t}.columns`}),{...typeof n.id=="string"?{id:n.id}:{},title:at(n.title,"Untitled board",`${t}.title`,a),columns:o.map((r,i)=>le(r,`${t}.columns[${i}]`,e,a))}}function ta(n,t){return{schema:kt,version:ft,format:n.format,scope:n.scope,exportedAt:new Date().toISOString(),payload:t}}function ea(n){const t=[];let e;try{e=JSON.parse(n.raw)}catch{return{envelope:null,diagnostics:[{level:"error",code:"invalid_json",message:"Import source is not valid JSON.",path:"source"}]}}if(!J(e))return{envelope:null,diagnostics:[{level:"error",code:"invalid_json_root",message:"JSON import root must be an object.",path:"source"}]};const a="payload"in e?e.payload:e;"payload"in e||t.push({level:"warning",code:"missing_envelope",message:"JSON import has no exchange envelope; treating root as payload.",path:"source"}),e.schema!==void 0&&e.schema!==kt&&t.push({level:"error",code:"schema_mismatch",message:"JSON import schema is not supported.",path:"schema"}),e.version!==void 0&&e.version!==ft&&t.push({level:"error",code:"version_mismatch",message:"JSON import version is not supported.",path:"version"}),e.scope!==void 0&&e.scope!==n.scope&&t.push({level:"error",code:"scope_mismatch",message:`JSON import scope "${String(e.scope)}" does not match "${n.scope}".`,path:"scope"});const o=n.scope==="board"?Ze(a,"payload",n,t):n.scope==="column"?le(a,"payload",n,t):ce(a,"payload",n,t);return{envelope:ta(n,o),diagnostics:t}}function me(n){if(n.format==="markdown"){const t=Ue(n.raw,n.scope);return n.policies.unknownFieldPolicy!=="strict_error"?t:{...t,diagnostics:t.diagnostics.map(e=>e.code.startsWith("unknown_")?{...e,level:"error"}:e)}}return ea(n)}function M(n,t){n.items.push(t),n.counts[t.action]+=1,t.action==="conflict"&&(n.canApply=!1)}function aa(n,t){const e=n.trim().toLowerCase();return t.filter(a=>a.title.trim().toLowerCase()===e)}function q(n){return Object.entries(n).filter(([,t])=>t!==void 0).map(([t])=>t)}function Pt(n){const t=[];for(const e of n)for(const a of e.columns??[])t.push(...a.cards??[]);return t}function oa(n){const t=[];for(const e of n)t.push(...e.columns??[]);return t}function Xt(n,t,e){M(n,{action:"create",entity:"card",title:t.title,path:e,reason:"card-import",source:{...t.id?{id:t.id}:{},explicitFields:q(t)}});for(const[a,o]of(t.checklists??[]).entries()){const r=`${e}.checklists[${a}]`;M(n,{action:"create",entity:"checklist",title:o.title,path:r,reason:"checklist-import",source:{...o.id?{id:o.id}:{},explicitFields:q(o)}});for(const[i,s]of(o.items??[]).entries())M(n,{action:"create",entity:"checkItem",title:s.title,path:`${r}.items[${i}]`,reason:"check-item-import",source:{...s.id?{id:s.id}:{},explicitFields:q(s)}})}}function ra(n,t){for(const e of n){const a=(e.columns??[]).find(o=>o.id===t);if(a)return a}return null}function Vt(n,t,e,a,o){const r=aa(n,t);return r.length>1?(M(o,{action:"conflict",entity:e,title:n,path:a,reason:"ambiguous-title-match"}),null):r[0]??null}function It(n,t,e){return t.policies.mode==="create"?"create":e?"update":t.policies.mode==="replace"?(M(n,{action:"conflict",entity:t.scope,title:"Import target",path:"target",reason:"replace-target-not-found"}),null):"create"}function ia(n,t){var s,c,d;const e=me(t),a=Ge(t.scope,e.diagnostics);if(!e.envelope||a.errors.length>0)return M(a,{action:"conflict",entity:t.scope,title:"Import source",path:"source",reason:"invalid-source"}),a;if(t.scope==="board"){const m=e.envelope.payload,u=m.id!==void 0?n.find(b=>b.id===m.id)??null:t.policies.matchStrategy==="title"?Vt(m.title,n,"board","payload",a):null;if(a.counts.conflict>0)return a;const h=It(a,t,u);if(!h)return a;M(a,{action:h,entity:"board",title:m.title,path:"payload",reason:u?"matched-by-title":"new-board",...u?{targetId:u.id}:{},source:{...m.id?{id:m.id}:{},explicitFields:q(m)}});for(const[b,g]of(m.columns??[]).entries()){M(a,{action:"create",entity:"column",title:g.title,path:`payload.columns[${b}]`,reason:"column-import",source:{...g.id?{id:g.id}:{},explicitFields:q(g)}});for(const[f,x]of(g.cards??[]).entries())Xt(a,x,`payload.columns[${b}].cards[${f}]`)}return a}if(t.scope==="column"){const m=e.envelope.payload;if((s=t.target)!=null&&s.boardId&&!n.some(g=>{var f;return g.id===((f=t.target)==null?void 0:f.boardId)}))return M(a,{action:"conflict",entity:"board",title:t.target.boardId,path:"target.boardId",reason:"target-board-not-found"}),a;const u=m.id!==void 0?oa(n).find(b=>b.id===m.id)??null:null,h=It(a,t,u);if(!h)return a;M(a,{action:h,entity:"column",title:m.title,path:"payload",reason:"column-import",...u?{targetId:u.id}:{},source:{...m.id?{id:m.id}:{},explicitFields:q(m)}});for(const[b,g]of(m.cards??[]).entries())Xt(a,g,`payload.cards[${b}]`);return a}const o=e.envelope.payload,r=((c=t.target)==null?void 0:c.cardId)!==void 0?Pt(n).find(m=>{var u;return m.id===((u=t.target)==null?void 0:u.cardId)})??null:o.id!==void 0?Pt(n).find(m=>m.id===o.id)??null:t.policies.matchStrategy==="title"?Vt(o.title,Pt(n),"card","payload",a):null;if(a.counts.conflict>0)return a;if((d=t.target)!=null&&d.columnId&&!ra(n,t.target.columnId))return M(a,{action:"conflict",entity:"column",title:t.target.columnId,path:"target.columnId",reason:"target-column-not-found"}),a;const i=It(a,t,r);if(!i)return a;if(M(a,{action:i,entity:"card",title:o.title,path:"payload",reason:"card-import",...r?{targetId:r.id}:{},source:{...o.id?{id:o.id}:{},explicitFields:q(o)}}),i==="create")for(const[m,u]of(o.checklists??[]).entries()){const h=`payload.checklists[${m}]`;M(a,{action:"create",entity:"checklist",title:u.title,path:h,reason:"checklist-import",source:{...u.id?{id:u.id}:{},explicitFields:q(u)}});for(const[b,g]of(u.items??[]).entries())M(a,{action:"create",entity:"checkItem",title:g.title,path:`${h}.items[${b}]`,reason:"check-item-import",source:{...g.id?{id:g.id}:{},explicitFields:q(g)}})}return a}function Jt(n){const t=(n==null?void 0:n.trim())??"";return t.length>0?t:void 0}function pe(n){const t=n.checklists??[];return{id:n.id,title:n.title.trim()||"Untitled card",...Jt(n.description)?{description:Jt(n.description)}:{},...t.length>0?{checklists:t.map(e=>({id:e.id,title:e.title.trim()||"Checklist",items:(e.items??[]).map(a=>({id:a.id,title:a.title.trim()||"Untitled item",state:a.state}))}))}:{}}}function ue(n){return{id:n.id,title:n.title.trim()||"Untitled column",cards:(n.cards??[]).map(pe)}}function na(n){return{id:n.id,title:n.title.trim()||"Untitled board",columns:(n.columns??[]).map(ue)}}function sa(n,t,e,a=new Date().toISOString()){return{schema:kt,version:ft,format:n,scope:t,exportedAt:a,payload:e}}function da(n){return`${JSON.stringify(n,null,2)}
`}function dt(n){return JSON.stringify(n)}function ca(n){const t=n.payload;return["---",`schema: ${n.schema}`,`version: ${dt(n.version)}`,`scope: ${n.scope}`,`title: ${dt(t.title)}`,`exportedAt: ${dt(n.exportedAt)}`,...t.id?[`id: ${dt(t.id)}`]:[],"---"]}function la(n,t){t&&n.push("","Description:",t)}function be(n,t){n.push(`### Card: ${t.title}`),la(n,t.description);for(const e of t.checklists??[]){n.push("",`Checklist: ${e.title}`);for(const a of e.items??[]){const o=a.state==="complete"?"x":" ";n.push(`- [${o}] ${a.title}`)}}}function Zt(n,t){n.push(`## Column: ${t.title}`);for(const e of t.cards)n.push(""),be(n,e)}function ma(n){const t=ca(n);if(n.scope==="board"){const e=n.payload;for(const a of e.columns)t.push(""),Zt(t,a);return`${t.join(`
`).trimEnd()}
`}return n.scope==="column"?(Zt(t,n.payload),`${t.join(`
`).trimEnd()}
`):(be(t,n.payload),`${t.join(`
`).trimEnd()}
`)}function Ft(n){return n.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"untitled"}function Ot(n,t,e){const a=sa(n,t,e);return n==="json"?da(a):ma(a)}function pa(n,t){const e=na(n);return{format:t,scope:"board",fileName:`board-${Ft(e.title)}.${t==="json"?"json":"md"}`,content:Ot(t,"board",e)}}function ua(n,t){const e=ue(n);return{format:t,scope:"column",fileName:`column-${Ft(e.title)}.${t==="json"?"json":"md"}`,content:Ot(t,"column",e)}}function ba(n,t){const e=pe(n);return{format:t,scope:"card",fileName:`card-${Ft(e.title)}.${t==="json"?"json":"md"}`,content:Ot(t,"card",e)}}const ha={boards:[],selectedBoardId:null,status:"idle",error:null};function te(n){const t=Number(n??0);return Number.isFinite(t)?t:0}function ga(n,t){const e=n.pos??n.order??0,a=t.pos??t.order??0;return te(e)-te(a)||n.id.localeCompare(t.id)}function ee(n){return n.map(t=>({...t,columns:[...t.columns??[]].sort(ga).map(e=>({...e,cards:[...e.cards??[]].sort(Se)}))})).sort((t,e)=>t.id.localeCompare(e.id))}class ka{constructor(t,e={}){this.api=t,this.stateSubject=new ge(ha),this.state$=this.stateSubject.asObservable(),this.boardMetaMutationVersions=new Map,this.now=e.now??(()=>new Date)}get snapshot(){return this.stateSubject.value}destroy(){this.stateSubject.complete()}selectBoard(t){this.snapshot.boards.some(e=>e.id===t)&&(Qt(t),this.patchState({selectedBoardId:t,error:null}),this.patchBoardMeta(t,e=>Fe(e,this.now().toISOString())))}previewImport(t){return ia(this.snapshot.boards,t)}async exportData(t){const e=new Map;this.patchState({status:"loading",error:null});try{const a=await this.createExportData(t,e);return this.patchState({status:"idle",error:null}),a}catch{return this.patchState({status:"error",error:"boards.errors.load"}),null}}async createExportData(t,e){if(t.scope==="board"){const o=t.boardId?this.findBoard(t.boardId):this.getSelectedBoard();return o?pa(await this.hydrateBoardForExport(o,e),t.format):null}if(t.scope==="column"){const o=t.columnId?this.findColumn(t.columnId):null;return o?ua(await this.hydrateColumnForExport(o,e),t.format):null}const a=t.cardId?this.findCard(t.cardId):null;return a?ba(await this.hydrateCardForExport(a,e),t.format):null}async applyImport(t){if(t.policies.mode!=="create"||!this.previewImport(t).canApply)return null;const a=me(t);return a.envelope?this.runMutationResult(async()=>{var o,r;return t.scope==="board"?this.applyBoardCreateImport(a.envelope.payload):t.scope==="column"?this.applyColumnCreateImport(a.envelope.payload,(o=t.target)==null?void 0:o.boardId):this.applyCardCreateImport(a.envelope.payload,(r=t.target)==null?void 0:r.columnId)}):null}async load(){this.patchState({status:"loading",error:null});try{await this.reloadPreservingSelection(),this.patchState({status:"idle",error:null})}catch{this.patchState({status:"error",error:"boards.errors.load"})}}async createBoard(t){const e=t.trim();e&&await this.runMutation(async()=>{const a=await k(this.api.createBoard({title:e}));await this.reload(a.id)})}async deleteBoard(t){await this.runMutation(async()=>{await k(this.api.deleteBoard(t)),await this.reload(null)})}async patchBoard(t,e){this.findBoard(t)&&await this.runMutation(async()=>{await k(this.api.updateBoard(t,e)),await this.reload(t)})}toggleBoardStar(t){this.patchBoardMeta(t,e=>ze(e,!bt(e)))}updateBoardGroup(t,e){this.patchBoardMeta(t,a=>Oe(a,e))}async createColumn(t,e){const a=e.trim();!a||!this.findBoard(t)||await this.runMutation(async()=>{await k(this.api.createColumn({board:t,title:a,position:"end"})),await this.reload(t)})}async deleteColumn(t){await this.runMutation(async()=>{await k(this.api.deleteColumn(t)),await this.reloadPreservingSelection()})}async patchColumn(t,e){this.findColumn(t)&&await this.runMutation(async()=>{await k(this.api.updateColumn(t,e)),await this.reloadPreservingSelection()})}async createCard(t,e,a){const o=e.trim();!o||!this.findColumn(t)||await this.runMutation(async()=>{await k(this.api.createCard({column:t,title:o,description:a.trim(),position:"bottom"})),await this.reloadPreservingSelection()})}async patchCard(t,e){this.findCard(t)&&await this.runMutation(async()=>{await k(this.api.updateCard(t,e)),await this.reloadPreservingSelection()})}async loadCardChecklists(t){if(!this.findCard(t))return[];try{return await k(this.api.getCardChecklists(t))}catch{return this.patchState({error:"boards.errors.load"}),[]}}async createCardChecklist(t,e){const a=e.trim();return!a||!this.findCard(t)?null:this.runMutationResult(async()=>{const o=await k(this.api.createCardChecklist(t,{title:a,position:"bottom"}));return await this.reloadPreservingSelection(),o})}async deleteCardChecklist(t){await this.runMutation(async()=>{await k(this.api.deleteCardChecklist(t)),await this.reloadPreservingSelection()})}async createCardCheckItem(t,e){const a=e.trim();return a?this.runMutationResult(async()=>{const o=await k(this.api.createCardCheckItem(t,{title:a,position:"bottom"}));return await this.reloadPreservingSelection(),o}):null}async patchCardCheckItem(t,e){return this.runMutationResult(async()=>{const a=await k(this.api.updateCardCheckItem(t,e));return await this.reloadPreservingSelection(),a})}async deleteCardCheckItem(t){await this.runMutation(async()=>{await k(this.api.deleteCardCheckItem(t)),await this.reloadPreservingSelection()})}async createCardEntityLink(t,e,a){if(!this.findCard(t))return null;const o={card:t,entity_type:e,entity_id:a};return this.runMutationResult(async()=>{const r=await k(this.api.createCardEntityLink(o));return await this.reloadPreservingSelection(),r})}async deleteCardEntityLink(t){await this.runMutation(async()=>{await k(this.api.deleteCardEntityLink(t)),await this.reloadPreservingSelection()})}async createCardMirror(t,e,a){!this.findCard(t)||!this.findColumn(e)||await this.runMutation(async()=>{await k(this.api.createCardPlacement({card:t,column:e,...a})),await this.reloadPreservingSelection()})}async patchCardPlacement(t,e){this.findCardPlacement(t)&&await this.runMutation(async()=>{await k(this.api.updateCardPlacement(t,e)),await this.reloadPreservingSelection()})}async deleteCardPlacement(t){this.findCardPlacement(t)&&await this.runMutation(async()=>{await k(this.api.deleteCardPlacement(t)),await this.reloadPreservingSelection()})}async deleteCard(t){await this.runMutation(async()=>{await k(this.api.deleteCard(t)),await this.reloadPreservingSelection()})}async applyBoardCreateImport(t){const e=await k(this.api.createBoard({title:t.title})),a=[],o=[],r=[],i=[];for(const s of t.columns??[]){const c=await k(this.api.createColumn({board:e.id,title:s.title,position:"end"}));a.push(c.id);const d=await this.createImportedCards(c.id,s.cards??[]);o.push(...d.cardIds),r.push(...d.checklistIds),i.push(...d.checkItemIds)}return await this.reload(e.id),{scope:"board",created:{boardId:e.id,columnIds:a,cardIds:o,checklistIds:r,checkItemIds:i}}}async applyColumnCreateImport(t,e){const a=e??this.snapshot.selectedBoardId??void 0;if(!a||!this.findBoard(a))throw new Error("Missing import target board");const o=await k(this.api.createColumn({board:a,title:t.title,position:"end"})),r=await this.createImportedCards(o.id,t.cards??[]);return await this.reload(a),{scope:"column",created:{columnIds:[o.id],cardIds:r.cardIds,checklistIds:r.checklistIds,checkItemIds:r.checkItemIds}}}async applyCardCreateImport(t,e){if(!e||!this.findColumn(e))throw new Error("Missing import target column");const a=await this.createImportedCard(e,t);return await this.reloadPreservingSelection(),{scope:"card",created:{columnIds:[],cardIds:[a.card.id],checklistIds:a.checklistIds,checkItemIds:a.checkItemIds}}}async createImportedCards(t,e){const a=[],o=[],r=[];for(const i of e){const s=await this.createImportedCard(t,i);a.push(s.card.id),o.push(...s.checklistIds),r.push(...s.checkItemIds)}return{cardIds:a,checklistIds:o,checkItemIds:r}}async createImportedCard(t,e){const a=await k(this.api.createCard({column:t,title:e.title,description:e.description??"",position:"bottom"})),o=[],r=[];for(const i of e.checklists??[]){const s=await k(this.api.createCardChecklist(a.id,{title:i.title,position:"bottom"}));o.push(s.id);for(const c of i.items??[]){const d=await k(this.api.createCardCheckItem(s.id,{title:c.title,state:c.state??"incomplete",position:"bottom"}));r.push(d.id)}}return{card:a,checklistIds:o,checkItemIds:r}}async hydrateBoardForExport(t,e){return{...t,columns:await Promise.all((t.columns??[]).map(a=>this.hydrateColumnForExport(a,e)))}}async hydrateColumnForExport(t,e){return{...t,cards:await Promise.all((t.cards??[]).map(a=>this.hydrateCardForExport(a,e)))}}async hydrateCardForExport(t,e){return{...t,checklists:await this.loadCardChecklistsForExport(t.id,e)}}loadCardChecklistsForExport(t,e){const a=e.get(t);if(a)return a;const o=k(this.api.getCardChecklists(t));return e.set(t,o),o}async runMutation(t){this.patchState({status:"saving",error:null});try{await t(),this.patchState({status:"idle",error:null})}catch{this.patchState({status:"error",error:"boards.errors.save"})}}async runMutationResult(t){this.patchState({status:"saving",error:null});try{const e=await t();return this.patchState({status:"idle",error:null}),e}catch{return this.patchState({status:"error",error:"boards.errors.save"}),null}}async reloadPreservingSelection(){await this.reload(this.snapshot.selectedBoardId)}async reload(t){const e=ee(await k(this.api.getBoards())),a=Ne(e,t);Qt(a),this.patchState({boards:e,selectedBoardId:a})}findBoard(t){return this.snapshot.boards.find(e=>e.id===t)??null}getSelectedBoard(){return this.snapshot.selectedBoardId?this.findBoard(this.snapshot.selectedBoardId):null}patchBoardMeta(t,e){const a=this.findBoard(t);if(!a)return;const o=(this.boardMetaMutationVersions.get(t)??0)+1;this.boardMetaMutationVersions.set(t,o);const r=a.meta??null,i=e(a);this.replaceBoardMeta(t,i),k(this.api.updateBoard(t,{meta:i})).then(s=>{this.boardMetaMutationVersions.get(t)===o&&this.replaceBoardMeta(t,s.meta??i)}).catch(()=>{this.boardMetaMutationVersions.get(t)===o&&(this.replaceBoardMeta(t,r),this.patchState({error:"boards.errors.save"}))})}replaceBoardMeta(t,e){this.patchState({boards:ee(this.snapshot.boards.map(a=>a.id===t?{...a,meta:e??null}:a)),error:null})}findColumn(t){for(const e of this.snapshot.boards){const a=e.columns.find(o=>o.id===t);if(a)return a}return null}findCardPlacement(t){for(const e of this.snapshot.boards)for(const a of e.columns){const o=a.cards.find(r=>j(r)===t);if(o)return o}return null}findCard(t){for(const e of this.snapshot.boards)for(const a of e.columns){const o=a.cards.find(r=>r.id===t);if(o)return o}return null}patchState(t){this.stateSubject.next({...this.snapshot,...t})}}function ht(n){return[...new Set([...n].filter(fa))].sort((t,e)=>t-e)}function X(n){var t;return ht(n.tag_ids??((t=n.tags)==null?void 0:t.map(e=>e.id))??[])}function ae(n,t){const e=ht(n),a=ht(t);return e.length===a.length&&e.every((o,r)=>o===a[r])}function fa(n){return typeof n=="number"&&Number.isFinite(n)}function he({columnId:n,cards:t,movingPlacementId:e,insertionIndex:a}){const o=t.filter(d=>j(d)!==e),r=Math.max(0,Math.min(a,o.length)),i=r>0?o[r-1]:null,s=r<o.length?o[r]:null,c={column:n};return i&&(c.before_placement=j(i)),s&&(c.after_placement=j(s)),!i&&!s&&(c.position="bottom"),c}function _a(n,t,e){const a=n.filter(u=>j(u)!==t),o=n.findIndex(u=>j(u)===t);if(o<0)return!0;const r=o>0?n[o-1]:null,i=o<n.length-1?n[o+1]:null,s=r?j(r):null,c=i?j(i):null,d=e.before_placement??null,m=e.after_placement??null;return a.length===0?!1:s!==d||c!==m}function xa({columns:n,movingColumnId:t,insertionIndex:e}){const a=n.filter(c=>c.id!==t),o=Math.max(0,Math.min(e,a.length)),r=o>0?a[o-1]:null,i=o<a.length?a[o]:null,s={};return r&&(s.before_column=r.id),i&&(s.after_column=i.id),!r&&!i&&(s.position="end"),s}function va(n,t,e){const a=n.filter(d=>d.id!==t),o=n.findIndex(d=>d.id===t);if(o<0)return!0;if(a.length===0)return!1;const r=o>0?n[o-1]:null,i=o<n.length-1?n[o+1]:null,s=(r==null?void 0:r.id)??null,c=(i==null?void 0:i.id)??null;return s!==(e.before_column??null)||c!==(e.after_column??null)}const Ca=4,oe=44,re=18;function ya(n){return n.view??window}function ie(n,t){for(const e of n.boards)if(e.columns.some(a=>a.id===t))return e.columns;return null}class wa{constructor(t){this.options=t,this.pending=null,this.active=null,this.eventWindow=null,this.suppressNextClick=!1,this.mounted=!1,this.handleClick=e=>{this.suppressNextClick&&(this.suppressNextClick=!1,e.preventDefault(),e.stopPropagation())},this.handlePointerDown=e=>{if(e.button!==0||e.isPrimary===!1)return;const a=e.target,o=a==null?void 0:a.closest('[data-board-column-draggable="true"]');if(!o||!this.options.root.contains(o)||a!=null&&a.closest('[data-board-drag-ignore="true"], [data-board-card-draggable="true"], input, textarea, select'))return;const r=o.dataset.boardColumnId,i=this.options.getState();!i||!r||!ie(i,r)||(this.pending={pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,sourceColumnElement:o,columnId:r},this.addWindowListeners(ya(e)))},this.handlePointerMove=e=>{const a=this.pending;if(!a||e.pointerId!==a.pointerId)return;if(!this.active){const r=e.clientX-a.startX,i=e.clientY-a.startY;if(Math.hypot(r,i)<Ca)return;this.startDrag(a,e)}const o=this.active;o&&(e.preventDefault(),this.movePreview(o,e.clientX,e.clientY),this.updateDropTarget(o,e.clientX),this.autoScroll(e.clientX))},this.handlePointerUp=e=>{this.pending&&e.pointerId!==this.pending.pointerId||(this.removeWindowListeners(),this.pending=null,this.finishActiveDrag(!0))},this.handlePointerCancel=e=>{this.pending&&e.pointerId!==this.pending.pointerId||this.cancelDrag()},this.handleWindowBlur=()=>{this.cancelDrag()}}mount(){this.mounted||(this.mounted=!0,this.options.root.addEventListener("pointerdown",this.handlePointerDown,!0),this.options.root.addEventListener("click",this.handleClick,!0))}unmount(){this.mounted&&(this.mounted=!1,this.cancelDrag(),this.options.root.removeEventListener("pointerdown",this.handlePointerDown,!0),this.options.root.removeEventListener("click",this.handleClick,!0))}cancelDrag(){this.removeWindowListeners(),this.pending=null,this.finishActiveDrag(!1)}startDrag(t,e){var c,d;const a=this.options.getState(),o=a?ie(a,t.columnId):null;if(!o)return;(d=(c=this.options).onDragStart)==null||d.call(c);const r=t.sourceColumnElement.getBoundingClientRect(),i=t.sourceColumnElement.cloneNode(!0);i.classList.add("majom-boards__column-drag-preview"),i.style.width=`${r.width}px`,i.style.height=`${r.height}px`,i.style.left=`${r.left}px`,i.style.top=`${r.top}px`;const s=document.createElement("div");s.className="majom-boards__column-drag-placeholder",s.style.width=`${r.width}px`,s.style.height=`${r.height}px`,t.sourceColumnElement.classList.add("is-dragging"),document.body.append(i),this.active={...t,offsetX:e.clientX-r.left,offsetY:e.clientY-r.top,preview:i,placeholder:s,sourceColumns:o,target:null},this.options.root.classList.add("is-column-dragging"),this.movePreview(this.active,e.clientX,e.clientY),this.updateDropTarget(this.active,e.clientX)}movePreview(t,e,a){t.preview.style.left=`${e-t.offsetX}px`,t.preview.style.top=`${a-t.offsetY}px`}updateDropTarget(t,e){const a=this.resolveInsertionIndex(t.columnId,e);if(t.target=xa({columns:t.sourceColumns,movingColumnId:t.columnId,insertionIndex:a}),!this.hasActiveTargetChanged(t)){t.placeholder.remove();return}this.placePlaceholder(t,a)}hasActiveTargetChanged(t){return!!(t.target&&va(t.sourceColumns,t.columnId,t.target))}resolveInsertionIndex(t,e){const a=Array.from(this.options.root.querySelectorAll('[data-board-column-draggable="true"]')).filter(r=>r.dataset.boardColumnId!==t),o=a.findIndex(r=>{const i=r.getBoundingClientRect();return e<i.left+i.width/2});return o>=0?o:a.length}placePlaceholder(t,e){const a=this.options.root.querySelector('[data-board-canvas="true"]');if(!a)return;const o=Array.from(a.querySelectorAll('[data-board-column-draggable="true"]')).filter(i=>i.dataset.boardColumnId!==t.columnId),r=a.querySelector('[data-board-column-composer="true"]');a.insertBefore(t.placeholder,o[e]??r??null)}autoScroll(t){const e=this.options.root.querySelector('[data-board-canvas="true"]');if(!e)return;const a=e.getBoundingClientRect();t<a.left+oe?e.scrollLeft-=re:t>a.right-oe&&(e.scrollLeft+=re)}finishActiveDrag(t){const e=this.active;e&&(this.active=null,e.preview.remove(),e.placeholder.remove(),e.sourceColumnElement.classList.remove("is-dragging"),this.options.root.classList.remove("is-column-dragging"),this.suppressNextClick=!0,t&&this.hasActiveTargetChanged(e)&&this.options.onDrop(e.columnId,e.target))}addWindowListeners(t){this.eventWindow=t,t.addEventListener("pointermove",this.handlePointerMove,!0),t.addEventListener("pointerup",this.handlePointerUp,!0),t.addEventListener("pointercancel",this.handlePointerCancel,!0),t.addEventListener("blur",this.handleWindowBlur,!0)}removeWindowListeners(){const t=this.eventWindow??window;this.eventWindow=null,t.removeEventListener("pointermove",this.handlePointerMove,!0),t.removeEventListener("pointerup",this.handlePointerUp,!0),t.removeEventListener("pointercancel",this.handlePointerCancel,!0),t.removeEventListener("blur",this.handleWindowBlur,!0)}}const ja=4,ct=44,lt=18;function Ea(n){return n.view??window}function ne(n,t){for(const e of n.boards){const a=e.columns.find(o=>o.id===t);if(a)return a.cards}return null}function Pa(n,t){for(const e of n.boards)for(const a of e.columns)if(a.cards.some(o=>j(o)===t))return a.id;return null}class Ia{constructor(t){this.options=t,this.pending=null,this.active=null,this.eventWindow=null,this.suppressNextClick=!1,this.mounted=!1,this.handleClick=e=>{this.suppressNextClick&&(this.suppressNextClick=!1,e.preventDefault(),e.stopPropagation())},this.handlePointerDown=e=>{if(e.button!==0||e.isPrimary===!1)return;const a=e.target,o=a==null?void 0:a.closest('[data-board-card-draggable="true"]');if(!o||!this.options.root.contains(o)||a!=null&&a.closest('[data-board-drag-ignore="true"], input, textarea, select'))return;const r=o.dataset.boardCardPlacementId,i=this.options.getState();if(!i||!r)return;const s=Pa(i,r);s!==null&&(this.pending={pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,sourceCardElement:o,placementId:r,sourceColumnId:s},this.addWindowListeners(Ea(e)))},this.handlePointerMove=e=>{const a=this.pending;if(!a||e.pointerId!==a.pointerId)return;if(!this.active){const r=e.clientX-a.startX,i=e.clientY-a.startY;if(Math.hypot(r,i)<ja)return;this.startDrag(a,e)}const o=this.active;o&&(e.preventDefault(),this.movePreview(o,e.clientX,e.clientY),this.updateDropTarget(o,e.clientX,e.clientY),this.autoScroll(e.clientX,e.clientY))},this.handlePointerUp=e=>{this.pending&&e.pointerId!==this.pending.pointerId||(this.removeWindowListeners(),this.pending=null,this.finishActiveDrag(!0))},this.handlePointerCancel=e=>{this.pending&&e.pointerId!==this.pending.pointerId||this.cancelDrag()},this.handleWindowBlur=()=>{this.cancelDrag()}}mount(){this.mounted||(this.mounted=!0,this.options.root.addEventListener("pointerdown",this.handlePointerDown,!0),this.options.root.addEventListener("click",this.handleClick,!0))}unmount(){this.mounted&&(this.mounted=!1,this.cancelDrag(),this.options.root.removeEventListener("pointerdown",this.handlePointerDown,!0),this.options.root.removeEventListener("click",this.handleClick,!0))}cancelDrag(){this.removeWindowListeners(),this.pending=null,this.finishActiveDrag(!1)}startDrag(t,e){var c,d;const a=this.options.getState();if(!a)return;const o=ne(a,t.sourceColumnId);if(!o)return;(d=(c=this.options).onDragStart)==null||d.call(c);const r=t.sourceCardElement.getBoundingClientRect(),i=t.sourceCardElement.cloneNode(!0);i.classList.add("majom-boards__card-drag-preview"),i.style.width=`${r.width}px`,i.style.height=`${r.height}px`,i.style.left=`${r.left}px`,i.style.top=`${r.top}px`;const s=document.createElement("div");s.className="majom-boards__card-drag-placeholder",s.style.height=`${r.height}px`,t.sourceCardElement.classList.add("is-dragging"),document.body.append(i),this.active={...t,offsetX:e.clientX-r.left,offsetY:e.clientY-r.top,preview:i,placeholder:s,sourceColumnCards:o,targetColumnId:null,target:null},this.options.root.classList.add("is-card-dragging"),this.movePreview(this.active,e.clientX,e.clientY),this.updateDropTarget(this.active,e.clientX,e.clientY)}movePreview(t,e,a){t.preview.style.left=`${e-t.offsetX}px`,t.preview.style.top=`${a-t.offsetY}px`}updateDropTarget(t,e,a){const o=this.options.getState();if(!o)return;const r=this.findTargetColumn(e);if(!r)return;const i=r.dataset.boardColumnId;if(!i)return;const s=ne(o,i),c=r.querySelector('[data-board-cards-container="true"]');if(!s||!c)return;const d=this.resolveInsertionIndex(r,t.placementId,a);if(t.targetColumnId=i,t.target=he({columnId:i,cards:s,movingPlacementId:t.placementId,insertionIndex:d}),!this.hasActiveTargetChanged(t)){t.placeholder.remove();return}this.placePlaceholder(c,t,d)}hasActiveTargetChanged(t){return!t.target||t.targetColumnId===null?!1:!(t.targetColumnId===t.sourceColumnId)||_a(t.sourceColumnCards,t.placementId,t.target)}findTargetColumn(t){const e=Array.from(this.options.root.querySelectorAll("[data-board-column-id]"));if(e.length===0)return null;const a=e.find(o=>{const r=o.getBoundingClientRect();return t>=r.left&&t<=r.right});return a||e.reduce((o,r)=>{if(!o)return r;const i=r.getBoundingClientRect(),s=o.getBoundingClientRect(),c=Math.abs(t-(i.left+i.width/2)),d=Math.abs(t-(s.left+s.width/2));return c<d?r:o},null)}resolveInsertionIndex(t,e,a){const o=Array.from(t.querySelectorAll("[data-board-card-placement-id]")).filter(i=>i.dataset.boardCardPlacementId!==e),r=o.findIndex(i=>{const s=i.getBoundingClientRect();return a<s.top+s.height/2});return r>=0?r:o.length}placePlaceholder(t,e,a){const r=Array.from(t.querySelectorAll("[data-board-card-placement-id]")).filter(i=>i.dataset.boardCardPlacementId!==e.placementId)[a]??null;t.insertBefore(e.placeholder,r)}autoScroll(t,e){const a=this.options.root.querySelector('[data-board-canvas="true"]');if(a){const c=a.getBoundingClientRect();t<c.left+ct?a.scrollLeft-=lt:t>c.right-ct&&(a.scrollLeft+=lt)}const o=this.active;if(!(o!=null&&o.targetColumnId))return;const r=Array.from(this.options.root.querySelectorAll("[data-board-column-id]")).find(c=>c.dataset.boardColumnId===o.targetColumnId),i=r==null?void 0:r.querySelector('[data-board-cards-container="true"]');if(!i)return;const s=i.getBoundingClientRect();e<s.top+ct?i.scrollTop-=lt:e>s.bottom-ct&&(i.scrollTop+=lt)}finishActiveDrag(t){const e=this.active;e&&(this.active=null,e.preview.remove(),e.placeholder.remove(),e.sourceCardElement.classList.remove("is-dragging"),this.options.root.classList.remove("is-card-dragging"),this.suppressNextClick=!0,!(!t||!e.target||e.targetColumnId===null)&&this.hasActiveTargetChanged(e)&&this.options.onDrop(e.placementId,e.target))}addWindowListeners(t){this.eventWindow=t,t.addEventListener("pointermove",this.handlePointerMove,!0),t.addEventListener("pointerup",this.handlePointerUp,!0),t.addEventListener("pointercancel",this.handlePointerCancel,!0),t.addEventListener("blur",this.handleWindowBlur,!0)}removeWindowListeners(){const t=this.eventWindow??window;this.eventWindow=null,t.removeEventListener("pointermove",this.handlePointerMove,!0),t.removeEventListener("pointerup",this.handlePointerUp,!0),t.removeEventListener("pointercancel",this.handlePointerCancel,!0),t.removeEventListener("blur",this.handleWindowBlur,!0)}}const se="majom-boards-view-styles",p={root:"majom-boards",shell:"majom-boards__shell",header:"majom-boards__header",titleBlock:"majom-boards__title-block",titleRow:"majom-boards__title-row",title:"majom-boards__title",titleButton:"majom-boards__title-button",titleEditInput:"majom-boards__title-edit-input",boardPickerButton:"majom-boards__board-picker-button",boardPickerButtonContent:"majom-boards__board-picker-button-content",headerActions:"majom-boards__header-actions",headerMenuButton:"majom-boards__header-menu-button",boardPickerPopover:"majom-boards-board-picker",boardPickerSearchWrap:"majom-boards-board-picker__search-wrap",boardPickerSearchIcon:"majom-boards-board-picker__search-icon",boardPickerSearchInput:"majom-boards-board-picker__search-input",boardPickerChips:"majom-boards-board-picker__chips",boardPickerChip:"majom-boards-board-picker__chip",boardPickerChipSelected:"majom-boards-board-picker__chip is-selected",boardPickerSections:"majom-boards-board-picker__sections",boardPickerSection:"majom-boards-board-picker__section",boardPickerSectionTitle:"majom-boards-board-picker__section-title",boardPickerSectionToggle:"majom-boards-board-picker__section-toggle",boardPickerSectionIconCollapsed:"majom-boards-board-picker__section-icon--collapsed",boardPickerGrid:"majom-boards-board-picker__grid",boardPickerCard:"majom-boards-board-picker__card",boardPickerCardSelected:"majom-boards-board-picker__card is-selected",boardPickerCardButton:"majom-boards-board-picker__card-button",boardPickerCreateCard:"majom-boards-board-picker__create-card",boardPickerStarButton:"majom-boards-board-picker__star-button",boardPickerStarButtonActive:"majom-boards-board-picker__star-button is-active",boardPickerActionsButton:"majom-boards-board-picker__actions-button",boardPickerActionsMenu:"majom-boards-board-picker-actions",boardPickerActionsInputRow:"majom-boards-board-picker-actions__input-row",boardPickerActionsInput:"majom-boards-board-picker-actions__input",boardPickerCover:"majom-boards-board-picker__cover",boardPickerCoverA:"majom-boards-board-picker__cover--a",boardPickerCoverB:"majom-boards-board-picker__cover--b",boardPickerCoverC:"majom-boards-board-picker__cover--c",boardPickerCoverD:"majom-boards-board-picker__cover--d",boardPickerCoverE:"majom-boards-board-picker__cover--e",boardPickerCoverF:"majom-boards-board-picker__cover--f",boardPickerCoverInitial:"majom-boards-board-picker__cover-initial",boardPickerCardTitle:"majom-boards-board-picker__card-title",boardPickerEmpty:"majom-boards-board-picker__empty",primaryButton:"majom-boards__button majom-boards__button--primary",quietButton:"majom-boards__button majom-boards__button--quiet",iconButton:"majom-boards__icon-button",body:"majom-boards__body",canvas:"majom-boards__canvas",column:"majom-boards__column",columnHeader:"majom-boards__column-header",columnTitleButton:"majom-boards__column-title-button",columnTitleInput:"majom-boards__column-title-input",columnTitle:"majom-boards__column-title",columnMenuButton:"majom-boards__column-menu-button",cards:"majom-boards__cards",card:"majom-boards__card",cardCompleted:"majom-boards__card is-complete",cardMirror:"majom-boards__card--mirror",cardOpenButton:"majom-boards__card-open",cardCompleteToggle:"majom-boards__card-complete-toggle",cardCompleteToggleCompleted:"majom-boards__card-complete-toggle is-complete",cardSourceLabel:"majom-boards__card-source-label",cardTags:"majom-boards__card-tags",cardTag:"majom-boards__card-tag",cardTitle:"majom-boards__card-title",cardBadges:"majom-boards__card-badges",cardBadgePlain:"majom-boards__card-badge majom-boards__card-badge--plain",cardBadgeNeutral:"majom-boards__card-badge majom-boards__card-badge--neutral",cardBadgeTask:"majom-boards__card-badge majom-boards__card-badge--task",cardBadgeStory:"majom-boards__card-badge majom-boards__card-badge--story",cardBadgeGoal:"majom-boards__card-badge majom-boards__card-badge--goal",cardComposer:"majom-boards__card-composer",cardComposerCollapsed:"majom-boards__card-composer-collapsed",cardComposerExpanded:"majom-boards__card-composer-expanded",cardComposerTextarea:"majom-boards__card-composer-textarea",composerActions:"majom-boards__composer-actions",composerCancelButton:"majom-boards__composer-cancel",columnComposerCollapsedPanel:"majom-boards__column-composer majom-boards__column-composer--collapsed",columnComposerExpandedPanel:"majom-boards__column-composer majom-boards__column-composer--expanded",columnComposerCollapsed:"majom-boards__column-composer-collapsed",columnComposerExpanded:"majom-boards__column-composer-expanded",listComposerTextarea:"majom-boards__list-composer-textarea",empty:"majom-boards__empty",emptyContent:"majom-boards__empty-content",emptyTitle:"majom-boards__empty-title",emptyCopy:"majom-boards__empty-copy",messageWrapper:"majom-boards__message-wrapper",messageLabel:"majom-boards__message-label"},l={container:"majom-boards-modal",body:"majom-boards-modal__body",cardBack:"majom-boards-cardback",hiddenShellPart:"majom-boards-cardback__hidden-shell-part",topbar:"majom-boards-cardback__topbar",topbarStart:"majom-boards-cardback__topbar-start",listBadge:"majom-boards-cardback__list-badge",sourceLabel:"majom-boards-cardback__source-label",movePopover:"majom-boards-cardback__move-popover",movePopoverHeader:"majom-boards-cardback__move-popover-header",movePopoverTitle:"majom-boards-cardback__move-popover-title",movePopoverBody:"majom-boards-cardback__move-popover-body",movePopoverContent:"majom-boards-cardback__move-popover-content",moveTabs:"majom-boards-cardback__move-tabs",moveTab:"majom-boards-cardback__move-tab",moveTabSelected:"majom-boards-cardback__move-tab is-selected",moveSectionTitle:"majom-boards-cardback__move-section-title",moveFields:"majom-boards-cardback__move-fields",moveField:"majom-boards-cardback__move-field",moveLabel:"majom-boards-cardback__move-label",moveSelect:"majom-boards-cardback__move-select",moveActions:"majom-boards-cardback__move-actions",moveButton:"majom-boards-cardback__move-button",listActionsPopover:"majom-boards-list-actions",listActionsHeader:"majom-boards-list-actions__header",listActionsTitle:"majom-boards-list-actions__title",listActionsBody:"majom-boards-list-actions__body",listActionsList:"majom-boards-list-actions__list",listActionsItem:"majom-boards-list-actions__item",listActionsButton:"majom-boards-list-actions__button",listActionsDivider:"majom-boards-list-actions__divider",listActionsSection:"majom-boards-list-actions__section",listActionsSectionButton:"majom-boards-list-actions__section-button",listActionsUpgrade:"majom-boards-list-actions__upgrade",listActionsUpgradeTitle:"majom-boards-list-actions__upgrade-title",listActionsUpgradeCopy:"majom-boards-list-actions__upgrade-copy",importModal:"majom-boards-import-modal",importLayout:"majom-boards-import__layout",importPanel:"majom-boards-import__panel",importField:"majom-boards-import__field",importLabel:"majom-boards-import__label",importSource:"majom-boards-import__source",importSelect:"majom-boards-import__select",importPreviewPanel:"majom-boards-import__preview",importPreviewTitle:"majom-boards-import__preview-title",importEmpty:"majom-boards-import__empty",importCounts:"majom-boards-import__counts",importCount:"majom-boards-import__count",importCountValue:"majom-boards-import__count-value",importCountLabel:"majom-boards-import__count-label",importStatusOk:"majom-boards-import__status majom-boards-import__status--ok",importStatusBlocked:"majom-boards-import__status majom-boards-import__status--blocked",importItems:"majom-boards-import__items",importItem:"majom-boards-import__item",importItemMain:"majom-boards-import__item-main",importItemMeta:"majom-boards-import__item-meta",importDiagnostics:"majom-boards-import__diagnostics",importDiagnosticWarning:"majom-boards-import__diagnostic majom-boards-import__diagnostic--warning",importDiagnosticError:"majom-boards-import__diagnostic majom-boards-import__diagnostic--error",importMessage:"majom-boards-import__message",exportModal:"majom-boards-export-modal",exportContent:"majom-boards-export__content",exportMeta:"majom-boards-export__meta",exportOutput:"majom-boards-export__output",exportMessage:"majom-boards-export__message",cardActionsPopover:"majom-boards-card-actions",cardActionsBody:"majom-boards-card-actions__body",cardActionsList:"majom-boards-card-actions__list",cardActionsItem:"majom-boards-card-actions__item",cardActionsButton:"majom-boards-card-actions__button",cardActionsDivider:"majom-boards-card-actions__divider",topbarActions:"majom-boards-cardback__topbar-actions",iconButton:"majom-boards-cardback__icon-button",layout:"majom-boards-cardback__layout",main:"majom-boards-cardback__main",aside:"majom-boards-cardback__aside",section:"majom-boards-cardback__section",sectionIcon:"majom-boards-cardback__section-icon",sectionMain:"majom-boards-cardback__section-main",sectionHeader:"majom-boards-cardback__section-header",sectionTitle:"majom-boards-cardback__section-title",sectionActions:"majom-boards-cardback__section-actions",titleSection:"majom-boards-cardback__title-section",doneButton:"majom-boards-cardback__done-button",doneButtonCompleted:"majom-boards-cardback__done-button is-complete",titleEditor:"majom-boards-cardback__title-editor",quickActions:"majom-boards-cardback__quick-actions",quickActionList:"majom-boards-cardback__quick-action-list",quickActionButton:"majom-boards-cardback__quick-action-button",labelsHost:"majom-boards-cardback__labels-host",labelsSection:"majom-boards-cardback__labels-section",labelsTitle:"majom-boards-cardback__labels-title",labelsList:"majom-boards-cardback__labels-list",labelSwatch:"majom-boards-cardback__label-swatch",labelAddButton:"majom-boards-cardback__label-add-button",labelPickerPopover:"majom-boards-cardback__label-picker-popover",entityLinksHost:"majom-boards-cardback__entity-links-host",entityLinksMessage:"majom-boards-cardback__entity-links-message",entityLinksList:"majom-boards-cardback__entity-links-list",entityLinkItem:"majom-boards-cardback__entity-link-item",entityLinkIcon:"majom-boards-cardback__entity-link-icon",entityLinkContent:"majom-boards-cardback__entity-link-content",entityLinkTitle:"majom-boards-cardback__entity-link-title",entityLinkMeta:"majom-boards-cardback__entity-link-meta",entityLinkMenuTriggerButton:"majom-boards-cardback__entity-link-menu-trigger",entityLinkMenuPopover:"majom-boards-cardback__entity-link-menu",entityLinkMenuList:"majom-boards-cardback__entity-link-menu-list",entityLinkMenuItem:"majom-boards-cardback__entity-link-menu-item",entityLinkMenuButton:"majom-boards-cardback__entity-link-menu-button",entityLinkMenuDangerButton:"majom-boards-cardback__entity-link-menu-button majom-boards-cardback__entity-link-menu-button--danger",entityLinkPicker:"majom-boards-cardback__entity-link-picker",entityLinkPickerField:"majom-boards-cardback__entity-link-picker-field",entityLinkPickerInput:"majom-boards-cardback__entity-link-picker-input",entityLinkPickerResults:"majom-boards-cardback__entity-link-picker-results",entityLinkPickerList:"majom-boards-cardback__entity-link-picker-list",entityLinkPickerButton:"majom-boards-cardback__entity-link-picker-button",checklistPopover:"majom-boards-cardback__checklist-popover",checklistPopoverHeader:"majom-boards-cardback__checklist-popover-header",checklistPopoverTitle:"majom-boards-cardback__checklist-popover-title",checklistPopoverClose:"majom-boards-cardback__checklist-popover-close",checklistPopoverForm:"majom-boards-cardback__checklist-popover-form",checklistPopoverLabel:"majom-boards-cardback__checklist-popover-label",checklistPopoverInput:"majom-boards-cardback__checklist-popover-input",checklistPopoverActions:"majom-boards-cardback__checklist-popover-actions",checklistPopoverSubmit:"majom-boards-cardback__checklist-popover-submit",checklistsHost:"majom-boards-cardback__checklists-host",checklistsMessage:"majom-boards-cardback__checklists-message",checklistsList:"majom-boards-cardback__checklists-list",checklist:"majom-boards-cardback__checklist",checklistActions:"majom-boards-cardback__checklist-actions",checklistActionButton:"majom-boards-cardback__checklist-action-button",checklistProgressRow:"majom-boards-cardback__checklist-progress-row",checklistProgress:"majom-boards-cardback__checklist-progress",checklistProgressTrack:"majom-boards-cardback__checklist-progress-track",checklistProgressBar:"majom-boards-cardback__checklist-progress-bar",checkItemList:"majom-boards-cardback__checkitem-list",checkItem:"majom-boards-cardback__checkitem",checkItemCheckbox:"majom-boards-cardback__checkitem-checkbox",checkItemTitle:"majom-boards-cardback__checkitem-title",checkItemTitleComplete:"majom-boards-cardback__checkitem-title is-complete",checkItemTitleInput:"majom-boards-cardback__checkitem-title-input",checkItemMenuTriggerButton:"majom-boards-cardback__checkitem-menu-trigger",checkItemMenuPopover:"majom-boards-cardback__checkitem-menu",checkItemMenuList:"majom-boards-cardback__checkitem-menu-list",checkItemMenuItem:"majom-boards-cardback__checkitem-menu-item",checkItemMenuButton:"majom-boards-cardback__checkitem-menu-button",checkItemCollapsedComposer:"majom-boards-cardback__checkitem-collapsed-composer",checkItemComposer:"majom-boards-cardback__checkitem-composer",checkItemComposerInput:"majom-boards-cardback__checkitem-composer-input",checkItemComposerActions:"majom-boards-cardback__checkitem-composer-actions",checkItemComposerPrimaryActions:"majom-boards-cardback__checkitem-composer-primary-actions",checkItemComposerMetaActions:"majom-boards-cardback__checkitem-composer-meta-actions",checkItemMetaButton:"majom-boards-cardback__checkitem-meta-button",descriptionEditor:"majom-boards-cardback__description-editor",placeholderPanel:"majom-boards-cardback__placeholder-panel",editorActions:"majom-boards-cardback__editor-actions",activityInput:"majom-boards-cardback__activity-input",activityList:"majom-boards-cardback__activity-list",activityItem:"majom-boards-cardback__activity-item",avatar:"majom-boards-cardback__avatar",quickEditorOverlay:"majom-boards-quick-editor-overlay",quickEditor:"majom-boards-quick-editor",quickEditorForm:"majom-boards-quick-editor__form",quickEditorCard:"majom-boards-quick-editor__card",quickEditorCardMirror:"majom-boards-quick-editor__card--mirror",quickEditorCardInner:"majom-boards-quick-editor__card-inner",quickEditorTitle:"majom-boards-quick-editor__title",quickEditorSave:"majom-boards-quick-editor__save",quickEditorActions:"majom-boards-quick-editor__actions",quickEditorButtons:"majom-boards-quick-editor__buttons",quickEditorButton:"majom-boards-quick-editor__button",quickEditorDangerItem:"majom-boards-quick-editor__danger-item",quickEditorDangerButton:"majom-boards-quick-editor__button--danger"},Aa=`
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
  width: min(920px, calc(100vw - 24px));
  max-width: min(920px, calc(100vw - 24px));
}

.majom-boards-import__layout {
  display: grid;
  min-height: min(560px, calc(100vh - 168px));
  grid-template-columns: minmax(0, 1.15fr) minmax(220px, 0.65fr) minmax(260px, 0.9fr);
  gap: 16px;
  overflow: hidden;
  padding: 16px;
}

.majom-boards-import__panel,
.majom-boards-import__preview {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  gap: 12px;
}

.majom-boards-import__field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.majom-boards-import__label {
  color: var(--mb-muted, #44546f);
  font-size: 12px;
  font-weight: 700;
  line-height: 16px;
}

.majom-boards-import__source {
  min-height: 420px;
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
  overflow-y: auto;
  border-radius: 8px;
  padding: 12px;
  background: #f7f8f9;
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

.majom-boards-import__counts {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
}

.majom-boards-import__count {
  min-width: 0;
  border-radius: 6px;
  padding: 8px;
  background: #ffffff;
}

.majom-boards-import__count-value,
.majom-boards-import__count-label {
  margin: 0;
}

.majom-boards-import__count-value {
  color: var(--mb-text, #172b4d);
  font-size: 18px;
  font-weight: 700;
  line-height: 22px;
}

.majom-boards-import__count-label {
  color: var(--mb-muted, #44546f);
  font-size: 11px;
  font-weight: 700;
  line-height: 14px;
}

.majom-boards-import__status {
  margin: 0;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 13px;
  font-weight: 700;
  line-height: 18px;
}

.majom-boards-import__status--ok {
  color: #216e4e;
  background: #dcfff1;
}

.majom-boards-import__status--blocked {
  color: #ae2e24;
  background: #ffeceb;
}

.majom-boards-import__items,
.majom-boards-import__diagnostics {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.majom-boards-import__item,
.majom-boards-import__diagnostic {
  border-radius: 6px;
  padding: 8px 10px;
  background: #ffffff;
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

.majom-boards-export__message {
  margin: 0 0 10px;
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

  .majom-boards-import__counts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
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
`;function Ba(){if(typeof document>"u"||document.getElementById(se))return;const n=document.createElement("style");n.id=se,n.textContent=Aa,document.head.appendChild(n)}const La=1,Ma=16384,At=[p.boardPickerCoverA,p.boardPickerCoverB,p.boardPickerCoverC,p.boardPickerCoverD,p.boardPickerCoverE,p.boardPickerCoverF],Sa={starred:!1,yourBoards:!1},Ta={formWidth:256,actionsWidth:220,actionsGap:8,viewportMargin:12,minVisibleHeight:220},Na={create:"boards.import.action.create",update:"boards.import.action.update",skip:"boards.import.action.skip",conflict:"boards.import.action.conflict"},Da={board:"boards.import.entity.board",column:"boards.import.entity.column",card:"boards.import.entity.card",checklist:"boards.import.entity.checklist",checkItem:"boards.import.entity.checkItem"};function tt(n){return n.mirror_source!=null}function mt(n){return n.completedAt!=null}function K(n,t){const e=n.textContent??"";n.textContent="";const a=D(t,{size:16,strokeWidth:2});a.setAttribute("aria-hidden","true");const o=document.createElement("span");o.textContent=e,n.append(a,o)}function $a(n,t,e){const a=n.getButtonElement();a.className=p.headerMenuButton;const o=D(t,{size:16,strokeWidth:2});o.setAttribute("aria-hidden","true"),a.replaceChildren(o),a.title=e,a.setAttribute("aria-label",e)}function za(n,t){const e=n.getButtonElement();e.classList.remove("!bg-slate-100","!text-slate-800"),e.dataset.boardsHeaderMenuOpen=t?"true":"false"}function Fa(n){var a;const t=n,e=t.commentsCount??t.commentCount??t.comments_count??((a=t.comments)==null?void 0:a.length)??0;return Number.isFinite(e)&&e>0?e:0}function pt(n){return{id:n.id,title:n.title,color:n.color}}function Oa(n){const t=Array.from(n.id).reduce((e,a)=>e+a.charCodeAt(0),0);return At[t%At.length]??At[0]}function qa(n){return n.title.trim().charAt(0)||"?"}function Ra(n){const t=n.trim().replace(/^#/,"");if(!/^[0-9a-f]{6}$/i.test(t))return"#172b4d";const e=parseInt(t.slice(0,2),16),a=parseInt(t.slice(2,4),16),o=parseInt(t.slice(4,6),16);return(.299*e+.587*a+.114*o)/255>.58?"#172b4d":"#ffffff"}function Ka(n){const t=n.checklist_summary,e=Number((t==null?void 0:t.total)??0),a=Number((t==null?void 0:t.completed)??0);return{total:Number.isFinite(e)?e:0,completed:Number.isFinite(a)?a:0}}function Dt(n){return n.entity_links??[]}function Ha(n){return Dt(n).reduce((t,e)=>(t[e.entity_type]+=1,t),{task:0,story:0,goal:0})}function Bt(n){return n==="task"?"check-box":n==="story"?"bookmark":"goal-circle"}function ut(n){return n==="task"?"boards.cardLinks.task":n==="story"?"boards.cardLinks.story":"boards.cardLinks.goal"}function V(n){var t,e;return((e=(t=n.entity)==null?void 0:t.title)==null?void 0:e.trim())||n.entity_id}class Wa{constructor(t,e){this.root=t,this.state=null,this.columnTitleTextarea=null,this.expandedCardComposerColumnId=null,this.isColumnComposerExpanded=!1,this.editingBoardTitleId=null,this.boardTitleEditInput=null,this.editingColumnTitleId=null,this.columnTitleEditInput=null,this.headerMenu=null,this.boardPickerPopover=null,this.importPreviewOverlay=null,this.exportOutputOverlay=null,this.quickEditorOverlay=null,this.activeCardPlacementId=null,this.cardModalOverlay=null,this.moveCardPopover=null,this.listActionsPopover=null,this.cardActionsPopover=null,this.cardLabelsPopover=null,this.cardChecklistPopover=null,this.cardCheckItemMenuPopover=null,this.cardEntityLinkMenuPopover=null,this.cardModalDraftTagIds=null,this.cardModalRequestedTagIds=null,this.cardModalLabelsHost=null,this.cardModalQuickActionList=null,this.cardModalChecklistHost=null,this.cardChecklistPanelState=null,this.cardChecklistLoadVersion=0,this.hiddenCheckedChecklistIds=new Set,this.expandedCheckItemComposerIds=new Set,this.tagItems=[],this.tagCatalogStatus="idle",this.lastNotifiedErrorKey=null,this.cardDrafts=new Map,Ba(),this.runtime=e.runtime??$t(),this.tagCatalog=e.tagCatalog??null,this.entityCatalog=e.entityCatalog??null,this.handlers=e.handlers,this.dragController=new Ia({root:this.root,getState:()=>this.state,onDrop:(a,o)=>this.handlers.onPatchCardPlacement(a,o),onDragStart:()=>this.closeTransientBoardOverlays()}),this.columnDragController=new wa({root:this.root,getState:()=>this.state,onDrop:(a,o)=>this.handlers.onPatchColumn(a,o),onDragStart:()=>this.closeTransientBoardOverlays()}),this.dragController.mount(),this.columnDragController.mount(),this.disposeRuntimeSubscription=this.runtime.subscribe(()=>this.refreshFromRuntime(),{emitCurrent:!1}),this.root.className=p.root}render(t){const e=this.boardPickerPopover?{...this.boardPickerPopover.viewState,collapsedSections:{...this.boardPickerPopover.viewState.collapsedSections}}:null;this.state=t,this.notifyStateError(t.error),this.ensureTagCatalogLoaded(),this.dragController.cancelDrag(),this.columnDragController.cancelDrag(),this.cardDrafts.clear(),this.unmountHeaderMenu(),this.closeBoardPickerPopover(),this.closeListActionsPopover(),this.closeCardActionsPopover(),this.closeMoveCardPopover(),this.closeCardChecklistPopover(),this.closeCardCheckItemMenuPopover(),this.closeCardEntityLinkMenuPopover(),this.closeQuickCardEditor(),this.root.replaceChildren(this.renderShell(t)),this.syncCardModal(t),e&&requestAnimationFrame(()=>{const a=this.root.querySelector('[data-testid="board-picker-button"]');a&&!a.disabled&&this.openBoardPickerPopover(a,t,e)})}destroy(){this.disposeRuntimeSubscription(),this.dragController.unmount(),this.columnDragController.unmount(),this.unmountHeaderMenu(),this.closeBoardPickerPopover(),this.closeCardLabelsPopover(),this.closeCardChecklistPopover(),this.closeCardCheckItemMenuPopover(),this.closeCardEntityLinkMenuPopover(),this.closeListActionsPopover(),this.closeCardActionsPopover(),this.closeMoveCardPopover(),this.closeQuickCardEditor(),this.closeImportPreviewModal(),this.closeExportOutputModal(),this.closeCardModal(),this.cardDrafts.clear(),this.root.replaceChildren()}notifyStateError(t){if(!t){this.lastNotifiedErrorKey=null;return}t!==this.lastNotifiedErrorKey&&(this.lastNotifiedErrorKey=t,Ct(this.runtime.i18n.t(t),"error"))}refreshFromRuntime(){this.state&&this.render(this.state)}closeTransientBoardOverlays(){this.closeBoardPickerPopover(),this.closeListActionsPopover(),this.closeCardActionsPopover(),this.closeCardLabelsPopover(),this.closeCardChecklistPopover(),this.closeCardCheckItemMenuPopover(),this.closeCardEntityLinkMenuPopover(),this.closeMoveCardPopover(),this.closeQuickCardEditor()}ensureTagCatalogLoaded(){!this.tagCatalog||this.tagCatalogStatus!=="idle"||(this.tagCatalogStatus="loading",this.tagCatalog.loadTags().then(t=>{this.tagItems=t.map(pt),this.tagCatalogStatus="ready",this.rerenderCurrentState()}).catch(()=>{this.tagItems=[],this.tagCatalogStatus="error",this.rerenderCurrentState()}))}getTagPickerErrorMessage(){return this.tagCatalogStatus==="error"?this.runtime.i18n.t("boards.cardBack.tagsLoadFailed"):null}renderShell(t){const e=document.createElement("section");if(e.className=p.shell,e.append(this.renderHeader(t)),t.status==="loading"&&t.boards.length===0)return e.append(this.renderMessage(this.runtime.i18n.t("boards.loading"))),e;if(t.boards.length===0)return e.append(this.renderEmptyState()),e;const a=this.getSelectedBoard(t);return e.append(a?this.renderBoard(a,t):this.renderMessage(this.runtime.i18n.t("boards.empty"))),e}renderHeader(t){const e=document.createElement("header");e.className=p.header;const a=this.getSelectedBoard(t),o=document.createElement("div");o.className=p.titleBlock;const r=document.createElement("div");r.className=p.titleRow,r.append(this.renderBoardTitle(a,t)),t.boards.length>0&&r.append(this.renderBoardPickerButton(a,t)),o.append(r);const i=document.createElement("div");return i.className=p.headerActions,i.append(this.renderHeaderMenu(a,t)),e.append(o,i),e}renderBoardTitle(t,e){const a=document.createElement("h1");if(a.className=p.title,!t||this.editingBoardTitleId!==t.id){const o=document.createElement("button");return o.type="button",o.className=p.titleButton,o.textContent=(t==null?void 0:t.title)??this.runtime.i18n.t("boards.title"),o.disabled=!t||e.status==="saving",o.title=this.runtime.i18n.t("boards.actions.renameBoard"),o.setAttribute("aria-label",this.runtime.i18n.t("boards.actions.renameBoard")),o.addEventListener("click",()=>{t&&this.startBoardTitleEdit(t.id)}),a.append(o),a}return this.boardTitleEditInput=Y({variant:"inline",type:"text",value:t.title,autoComplete:"off",maxLength:512,className:p.titleEditInput,onKeyDown:o=>{if(o.key==="Enter"){o.preventDefault(),this.finishBoardTitleEdit(t,!0);return}o.key==="Escape"&&(o.preventDefault(),this.finishBoardTitleEdit(t,!1))}}),this.boardTitleEditInput.setAttribute("aria-label",this.runtime.i18n.t("boards.boardTitlePlaceholder")),this.boardTitleEditInput.addEventListener("blur",()=>{this.finishBoardTitleEdit(t,!0)}),a.append(this.boardTitleEditInput),requestAnimationFrame(()=>{var o,r;(o=this.boardTitleEditInput)==null||o.focus(),(r=this.boardTitleEditInput)==null||r.select()}),a}renderBoardPickerButton(t,e){const a=this.runtime.i18n.t("boards.boardPicker.open"),o=T({icon:"kanban",tone:"text",size:"sm",className:p.boardPickerButton,title:a,ariaLabel:a,disabled:!t||e.status==="saving"}),r=document.createElement("span");r.className=p.boardPickerButtonContent;const i=D("kanban",{size:16,strokeWidth:2});i.setAttribute("aria-hidden","true");const s=D("chevron-down",{size:14,strokeWidth:2});return s.setAttribute("aria-hidden","true"),r.append(i,s),ke(o,r),o.setAttribute("aria-haspopup","dialog"),o.setAttribute("aria-expanded","false"),o.setAttribute("data-testid","board-picker-button"),o.addEventListener("click",c=>{var d;if(c.stopPropagation(),((d=this.boardPickerPopover)==null?void 0:d.trigger)===o){this.closeBoardPickerPopover();return}this.openBoardPickerPopover(o,e)}),o}openBoardPickerPopover(t,e,a){this.closeTransientBoardOverlays();const o=a?{query:a.query,activeFilter:a.activeFilter,collapsedSections:{...a.collapsedSections}}:{query:"",activeFilter:"all",collapsedSections:{...Sa}},r=this.getSelectedBoard(e),i=F({elevated:!0,className:`${p.boardPickerPopover} hidden`});i.setAttribute("data-testid","board-picker-popover");const s=document.createElement("div");s.className=p.boardPickerSearchWrap;const c=D("magnifying-glass",{size:18,strokeWidth:2});c.setAttribute("aria-hidden","true"),c.classList.add(p.boardPickerSearchIcon);const d=Y({type:"search",autoComplete:"off",placeholder:this.runtime.i18n.t("boards.boardPicker.searchPlaceholder"),className:p.boardPickerSearchInput,onInput:f=>{o.query=f.trim().toLowerCase(),b()},onKeyDown:f=>{f.key==="Escape"&&(f.preventDefault(),this.closeBoardPickerPopover())}});d.setAttribute("aria-label",this.runtime.i18n.t("boards.boardPicker.searchLabel")),d.value=o.query,s.append(c,d);const m=document.createElement("div");m.className=p.boardPickerChips;const u=()=>{m.replaceChildren(...this.getBoardPickerFilterOptions().map(f=>this.renderBoardPickerChip({label:f.label,selected:o.activeFilter===f.value,onClick:()=>{o.activeFilter=f.value,u(),b(),d.focus()}})))},h=document.createElement("div");h.className=p.boardPickerSections;const b=()=>{h.replaceChildren();const f=this.getBoardPickerVisibleBoards(e.boards,o.activeFilter,o.query),x=this.getBoardPickerGroupedBoards(f);if(o.activeFilter==="all"){const v=f.filter(bt);v.length>0&&h.append(this.renderBoardPickerSection({id:"starred",label:this.runtime.i18n.t("boards.boardPicker.starred"),boards:v,selectedBoardId:r==null?void 0:r.id,viewState:o,allowEmpty:!1,onToggle:b}))}x.groups.forEach(v=>{h.append(this.renderBoardPickerSection({id:`group:${v.id}`,label:v.name,boards:v.boards,allBoards:e.boards,selectedBoardId:r==null?void 0:r.id,viewState:o,allowEmpty:!1,onToggle:b}))}),(x.ungrouped.length>0||x.groups.length===0||f.length===0)&&h.append(this.renderBoardPickerSection({id:"yourBoards",label:this.runtime.i18n.t("boards.boardPicker.yourBoards"),boards:x.groups.length>0?x.ungrouped:f,allBoards:e.boards,selectedBoardId:r==null?void 0:r.id,viewState:o,allowEmpty:!0,showCreateBoardCard:o.activeFilter==="all",onToggle:b}))};i.append(s,m,h);const g=new O({container:t,panel:i,positioning:"viewport",panelZIndex:290,onOpenChange:f=>{var x;t.setAttribute("aria-expanded",f?"true":"false"),!f&&((x=this.boardPickerPopover)==null?void 0:x.menu)===g&&this.closeBoardPickerPopover()}});g.mount(),this.boardPickerPopover={menu:g,panel:i,trigger:t,viewState:o,actionsMenu:null},u(),b(),g.openAt({anchor:t,placement:"bottom-start",fallbackPlacements:["bottom-end","top-start","top-end"],gap:8,margin:12,lockPlacementAfterOpen:!0}),requestAnimationFrame(()=>d.focus())}getBoardPickerFilterOptions(){return[{value:"all",label:this.runtime.i18n.t("boards.boardPicker.all")},{value:"starred",label:this.runtime.i18n.t("boards.boardPicker.starred")},{value:"recent",label:this.runtime.i18n.t("boards.boardPicker.recent")}]}getBoardPickerVisibleBoards(t,e,a){const o=a.trim().toLowerCase(),r=t.filter(i=>o&&!i.title.toLowerCase().includes(o)?!1:e==="starred"?bt(i):e==="recent"?jt(i)!==null:!0);return e!=="recent"?r:[...r].sort((i,s)=>(jt(s)??0)-(jt(i)??0))}getBoardPickerGroupedBoards(t){const e=new Map,a=[];return t.forEach(o=>{const r=Tt(o);if(!r){a.push(o);return}const i=e.get(r.id);if(i){i.boards.push(o);return}e.set(r.id,{...r,boards:[o]})}),{groups:Array.from(e.values()).sort((o,r)=>o.name.localeCompare(r.name)),ungrouped:a}}renderBoardPickerChip(t){const e=document.createElement("button");return e.type="button",e.className=t.selected?p.boardPickerChipSelected:p.boardPickerChip,e.textContent=t.label,e.addEventListener("click",t.onClick),e}renderBoardPickerSection(t){const e=t.viewState.collapsedSections[t.id],a=document.createElement("section");a.className=p.boardPickerSection,a.dataset.boardPickerSection=t.id;const o=document.createElement("h2");o.className=p.boardPickerSectionTitle;const r=document.createElement("button");r.type="button",r.className=p.boardPickerSectionToggle,r.setAttribute("aria-expanded",e?"false":"true");const i=D("chevron-down",{size:16,strokeWidth:2});i.setAttribute("aria-hidden","true"),i.classList.toggle(p.boardPickerSectionIconCollapsed,e);const s=document.createElement("span");s.textContent=t.label,r.append(i,s),r.addEventListener("click",()=>{t.viewState.collapsedSections[t.id]=!e,t.onToggle()}),o.append(r);const c=document.createElement("div");if(c.className=p.boardPickerGrid,c.hidden=e,t.boards.length===0&&t.allowEmpty){const d=document.createElement("p");d.className=p.boardPickerEmpty,d.textContent=this.runtime.i18n.t("boards.boardPicker.noResults"),c.append(d)}else t.boards.forEach(d=>{c.append(this.renderBoardPickerCard(d,t.selectedBoardId,t.allBoards))});return t.showCreateBoardCard&&c.append(this.renderBoardPickerCreateCard()),a.append(o,c),a}renderBoardPickerCreateCard(){const t=document.createElement("button");return t.type="button",t.className=p.boardPickerCreateCard,t.textContent=this.runtime.i18n.t("boards.boardPicker.createBoard"),t.addEventListener("click",()=>{this.closeBoardPickerPopover(),this.handlers.onCreateBoard(this.runtime.i18n.t("boards.defaultBoardTitle"))}),t}renderBoardPickerCard(t,e,a){const o=t.id===e,r=bt(t),i=document.createElement("div");i.className=o?p.boardPickerCardSelected:p.boardPickerCard;const s=document.createElement("button");s.type="button",s.className=p.boardPickerCardButton,s.setAttribute("aria-label",t.title),s.setAttribute("aria-current",o?"true":"false"),s.dataset.boardPickerBoardId=t.id,s.addEventListener("click",()=>{this.closeBoardPickerPopover(),this.handlers.onSelectBoard(t.id)});const c=document.createElement("div");c.className=`${p.boardPickerCover} ${Oa(t)}`.trim();const d=document.createElement("span");d.className=p.boardPickerCoverInitial,d.textContent=qa(t),c.append(d);const m=document.createElement("span");m.className=p.boardPickerCardTitle,m.textContent=t.title,s.append(c,m);const u=T({icon:r?"star-solid":"star",tone:"text",size:"sm",className:r?p.boardPickerStarButtonActive:p.boardPickerStarButton,title:this.runtime.i18n.t(r?"boards.boardPicker.unstar":"boards.boardPicker.star"),ariaLabel:this.runtime.i18n.t(r?"boards.boardPicker.unstar":"boards.boardPicker.star"),onClick:b=>{b.stopPropagation(),this.handlers.onToggleBoardStar(t.id)}});u.setAttribute("aria-pressed",r?"true":"false");const h=T({icon:"ellipsis-horizontal",tone:"text",size:"sm",className:p.boardPickerActionsButton,title:this.runtime.i18n.t("boards.boardPicker.actions"),ariaLabel:this.runtime.i18n.t("boards.boardPicker.actions"),onClick:b=>{b.stopPropagation(),this.openBoardPickerActionsMenu(t,a,h)}});return i.append(s,u,h),i}openBoardPickerActionsMenu(t,e,a){var s;const o=this.boardPickerPopover;if(!o)return;if(((s=o.actionsMenu)==null?void 0:s.boardId)===t.id){this.closeBoardPickerActionsMenu();return}this.closeBoardPickerActionsMenu();const r=F({elevated:!0,className:`${p.boardPickerActionsMenu} hidden`});r.addEventListener("mousedown",c=>c.stopPropagation());const i=new O({container:a,panel:r,positioning:"viewport",panelZIndex:310,onOpenChange:c=>{var d,m;!c&&((m=(d=this.boardPickerPopover)==null?void 0:d.actionsMenu)==null?void 0:m.menu)===i&&this.closeBoardPickerActionsMenu()}});o.panel.append(r),i.mount(),o.actionsMenu={menu:i,panel:r,boardId:t.id},this.renderBoardPickerActionsMenu(t,e),i.openAt({anchor:a,placement:"right-start",fallbackPlacements:["left-start","bottom-end","top-end"],gap:4,margin:8,lockPlacementAfterOpen:!0})}renderBoardPickerActionsMenu(t,e,a="menu"){var i;const o=(i=this.boardPickerPopover)==null?void 0:i.actionsMenu;if(!o)return;if(o.panel.replaceChildren(),a==="createGroup"){o.panel.append(this.renderBoardPickerCreateGroupInput(t,e));return}const r=Tt(t);Nt(e).filter(s=>s.id!==(r==null?void 0:r.id)).forEach(s=>{o.panel.append(yt({label:this.runtime.i18n.t("boards.boardPicker.moveToGroup",{group:s.name}),onClick:c=>{c.stopPropagation(),this.handlers.onUpdateBoardGroup(t.id,s),this.closeBoardPickerActionsMenu()}}))}),r&&o.panel.append(yt({label:this.runtime.i18n.t("boards.boardPicker.removeFromGroup"),onClick:s=>{s.stopPropagation(),this.handlers.onUpdateBoardGroup(t.id,null),this.closeBoardPickerActionsMenu()}})),o.panel.childElementCount>0&&o.panel.append(fe({tone:"soft"})),o.panel.append(yt({label:this.runtime.i18n.t("boards.boardPicker.createGroup"),onClick:s=>{s.stopPropagation(),this.renderBoardPickerActionsMenu(t,e,"createGroup")}}))}renderBoardPickerCreateGroupInput(t,e){const a=document.createElement("div");a.className=p.boardPickerActionsInputRow;const o=Y({variant:"inline",value:"",type:"text",className:p.boardPickerActionsInput});o.placeholder=this.runtime.i18n.t("boards.boardPicker.newGroupPlaceholder");let r=!1;const i=s=>{if(r)return;r=!0;const c=s?o.value.trim():"";if(!c){this.renderBoardPickerActionsMenu(t,e);return}const m=Nt(e).find(u=>u.name.toLowerCase()===c.toLowerCase())??{id:qe(c,e),name:c};this.handlers.onUpdateBoardGroup(t.id,m),this.closeBoardPickerActionsMenu()};return o.addEventListener("blur",()=>i(!0)),o.addEventListener("keydown",s=>{s.key==="Enter"?(s.preventDefault(),i(!0)):s.key==="Escape"&&(s.preventDefault(),i(!1))}),a.append(o),requestAnimationFrame(()=>o.focus()),a}renderHeaderMenu(t,e){let a;return a=new _e({label:this.runtime.i18n.t("boards.actions.menu"),ariaLabel:this.runtime.i18n.t("boards.actions.menu"),title:this.runtime.i18n.t("boards.actions.menu"),variant:"plain",size:"md",buttonClassName:p.headerMenuButton,placement:"bottom-end",fallbackPlacements:["bottom-start","top-end","top-start"],onOpenChange:o=>za(a,o),items:[{id:"create-board",label:this.runtime.i18n.t("boards.actions.createBoard"),disabled:e.status==="saving",onSelect:()=>{this.handlers.onCreateBoard(this.runtime.i18n.t("boards.defaultBoardTitle"))}},{id:"import-board",label:this.runtime.i18n.t("boards.import.actions.importBoard"),disabled:!t||e.status==="saving",onSelect:()=>{this.openImportPreviewModal({scope:"board",titleKey:"boards.import.title.board"})}},{id:"export-board-markdown",label:this.runtime.i18n.t("boards.export.actions.boardMarkdown"),disabled:!t,onSelect:()=>{t&&this.openExportOutputModal({titleKey:"boards.export.title.board",request:{scope:"board",format:"markdown",boardId:t.id}})}},{id:"export-board-json",label:this.runtime.i18n.t("boards.export.actions.boardJson"),disabled:!t,onSelect:()=>{t&&this.openExportOutputModal({titleKey:"boards.export.title.board",request:{scope:"board",format:"json",boardId:t.id}})}},{id:"delete-board",label:this.runtime.i18n.t("boards.actions.deleteBoard"),disabled:!t||e.status==="saving",onSelect:()=>{t&&this.handlers.onDeleteBoard(t.id)}}]}),$a(a,"ellipsis-horizontal",this.runtime.i18n.t("boards.actions.menu")),this.headerMenu=a,a.mount(),a.element}renderBoard(t,e){const a=document.createElement("div");a.className=p.body;const o=document.createElement("div");return o.className=p.canvas,o.setAttribute("aria-label",t.title),o.dataset.boardCanvas="true",t.columns.forEach(r=>{o.append(this.renderColumn(t,r,e))}),o.append(this.renderColumnComposer(t,e)),a.append(o),a}renderColumn(t,e,a){const o=document.createElement("section");o.className=p.column,o.dataset.boardColumnId=String(e.id),o.dataset.boardColumnDraggable="true";const r=document.createElement("header");r.className=p.columnHeader,r.append(this.renderColumnTitle(e,a));const i=T({icon:"ellipsis-horizontal",tone:"text",size:"sm",className:`${p.iconButton} ${p.columnMenuButton}`,title:this.runtime.i18n.t("boards.listActions.title"),ariaLabel:this.runtime.i18n.t("boards.listActions.title"),disabled:a.status==="saving"});i.setAttribute("aria-haspopup","dialog"),i.setAttribute("aria-expanded","false"),i.setAttribute("data-testid","list-actions-menu-button"),i.dataset.boardDragIgnore="true",i.addEventListener("click",c=>{var d;if(c.stopPropagation(),((d=this.listActionsPopover)==null?void 0:d.trigger)===i){this.closeListActionsPopover();return}this.openListActionsPopover(i,t,e)}),r.append(i);const s=document.createElement("div");return s.className=p.cards,s.dataset.boardCardsContainer="true",e.cards.forEach(c=>s.append(this.renderCard(c))),o.append(r,s,this.renderCardComposer(e,a)),o}renderColumnTitle(t,e){if(this.editingColumnTitleId===t.id)return this.columnTitleEditInput=document.createElement("input"),this.columnTitleEditInput.className=p.columnTitleInput,this.columnTitleEditInput.type="text",this.columnTitleEditInput.value=t.title,this.columnTitleEditInput.maxLength=512,this.columnTitleEditInput.autocomplete="off",this.columnTitleEditInput.setAttribute("aria-label",this.runtime.i18n.t("boards.columnTitlePlaceholder")),this.columnTitleEditInput.addEventListener("keydown",r=>{if(r.key==="Enter"){r.preventDefault(),this.finishColumnTitleEdit(t,!0);return}r.key==="Escape"&&(r.preventDefault(),this.finishColumnTitleEdit(t,!1))}),this.columnTitleEditInput.addEventListener("blur",()=>{this.finishColumnTitleEdit(t,!0)}),requestAnimationFrame(()=>{var r,i;(r=this.columnTitleEditInput)==null||r.focus(),(i=this.columnTitleEditInput)==null||i.select()}),this.columnTitleEditInput;const a=document.createElement("button");a.type="button",a.className=p.columnTitleButton,a.disabled=e.status==="saving",a.title=this.runtime.i18n.t("boards.actions.renameColumn"),a.setAttribute("aria-label",this.runtime.i18n.t("boards.actions.renameColumn")),a.addEventListener("click",()=>this.startColumnTitleEdit(t.id));const o=document.createElement("span");return o.className=p.columnTitle,o.textContent=t.title,a.append(o),a}openListActionsPopover(t,e,a){this.closeListActionsPopover();const o=F({elevated:!0,className:`${l.listActionsPopover} hidden`});o.setAttribute("role","dialog"),o.setAttribute("aria-modal","false"),o.setAttribute("aria-labelledby","list-actions-menu"),o.setAttribute("data-testid","list-actions-popover"),o.addEventListener("mousedown",m=>m.stopPropagation());const r=document.createElement("header");r.className=l.listActionsHeader;const i=document.createElement("h2");i.id="list-actions-menu",i.className=l.listActionsTitle,i.textContent=this.runtime.i18n.t("boards.listActions.title");const s=T({icon:"x-mark",tone:"text",size:"sm",className:l.iconButton,ariaLabel:this.runtime.i18n.t("common.close"),title:this.runtime.i18n.t("common.close"),onClick:()=>this.closeListActionsPopover()});r.append(i,s);const c=document.createElement("div");c.className=l.listActionsBody,c.append(this.renderListActionList([this.createListActionButton({labelKey:"boards.listActions.addCard",testId:"list-actions-add-card-button",onClick:()=>{this.closeListActionsPopover(),this.expandCardComposer(a.id)}}),this.createListActionButton({labelKey:"boards.import.actions.importColumn",testId:"list-actions-import-column-button",onClick:()=>{this.closeListActionsPopover(),this.openImportPreviewModal({scope:"column",titleKey:"boards.import.title.column",target:{boardId:e.id,columnId:a.id}})}}),this.createListActionButton({labelKey:"boards.export.actions.columnMarkdown",testId:"list-actions-export-column-markdown-button",onClick:()=>{this.closeListActionsPopover(),this.openExportOutputModal({titleKey:"boards.export.title.column",request:{scope:"column",format:"markdown",columnId:a.id}})}}),this.createListActionButton({labelKey:"boards.export.actions.columnJson",testId:"list-actions-export-column-json-button",onClick:()=>{this.closeListActionsPopover(),this.openExportOutputModal({titleKey:"boards.export.title.column",request:{scope:"column",format:"json",columnId:a.id}})}}),this.createListActionButton({labelKey:"boards.listActions.copyList",testId:"list-actions-copy-list-button",disabled:!0}),this.createListActionButton({labelKey:"boards.listActions.moveList",testId:"list-actions-move-list-button",disabled:!0}),this.createListActionButton({labelKey:"boards.listActions.moveAllCards",testId:"list-actions-move-all-cards-button",disabled:!0}),this.createListActionButton({labelKey:"boards.listActions.sortBy",disabled:!0}),this.createListActionButton({labelKey:"boards.listActions.watch",testId:"list-actions-watch-list-button",disabled:!0})]),this.renderListActionsDivider(),this.renderListActionsColorSection(),this.renderListActionsDivider(),this.renderListActionList([this.createListActionButton({labelKey:"boards.listActions.archiveList",testId:"list-actions-archive-list-button",onClick:()=>{this.closeListActionsPopover(),this.handlers.onDeleteColumn(a.id)}}),this.createListActionButton({labelKey:"boards.listActions.deleteList",testId:"list-actions-delete-list-button",onClick:()=>{this.closeListActionsPopover(),this.handlers.onDeleteColumn(a.id)}}),this.createListActionButton({labelKey:"boards.listActions.archiveAllCards",disabled:!0})])),o.append(r,c);let d;d=new O({container:t,panel:o,positioning:"viewport",panelZIndex:290,onOpenChange:m=>{var u;t.setAttribute("aria-expanded",m?"true":"false"),!m&&((u=this.listActionsPopover)==null?void 0:u.menu)===d&&this.closeListActionsPopover()}}),d.mount(),this.listActionsPopover={menu:d,panel:o,trigger:t},d.openAt({anchor:t,placement:"bottom-end",fallbackPlacements:["bottom-start","top-end","top-start"],gap:8,margin:12,lockPlacementAfterOpen:!0})}renderListActionList(t){const e=document.createElement("ul");return e.className=l.listActionsList,t.forEach(a=>{const o=document.createElement("li");o.className=l.listActionsItem,o.append(a),e.append(o)}),e}createListActionButton(t){const e=C({text:this.runtime.i18n.t(t.labelKey),tone:"text",size:"md",className:l.listActionsButton,disabled:t.disabled,onClick:t.onClick});return t.testId&&e.setAttribute("data-testid",t.testId),e}renderListActionsDivider(){const t=document.createElement("div");return t.className=l.listActionsDivider,t.setAttribute("role","separator"),t}renderListActionsColorSection(){const t=document.createElement("section");t.className=l.listActionsSection;const e=C({text:this.runtime.i18n.t("boards.listActions.changeListColor"),tone:"text",size:"md",className:l.listActionsSectionButton,disabled:!0}),a=D("chevron-up",{size:16,strokeWidth:2});a.setAttribute("aria-hidden","true"),e.append(a);const o=document.createElement("div");o.className=l.listActionsUpgrade;const r=document.createElement("p");r.className=l.listActionsUpgradeTitle,r.textContent=this.runtime.i18n.t("boards.listActions.colorUpgradeTitle");const i=document.createElement("p");return i.className=l.listActionsUpgradeCopy,i.textContent=this.runtime.i18n.t("boards.listActions.colorUpgradeBody"),o.append(r,i),t.append(e,o),t}renderCard(t){const e=j(t),a=mt(t),o=document.createElement("article"),r=a?p.cardCompleted:p.card;o.className=tt(t)?`${r} ${p.cardMirror}`:r,o.dataset.boardCardId=String(t.id),o.dataset.boardCardPlacementId=String(e),o.dataset.boardCardDraggable="true",o.addEventListener("contextmenu",h=>{h.preventDefault(),h.stopPropagation(),this.openQuickCardEditor(e,o.getBoundingClientRect())});const i=document.createElement("button");i.type="button",i.className=p.cardOpenButton,i.dataset.boardCardOpen=String(e),i.setAttribute("aria-label",this.runtime.i18n.t("boards.actions.openCard")),i.addEventListener("click",()=>this.openCardModal(e));const s=document.createElement("h3");s.className=p.cardTitle,s.textContent=t.title;const c=this.createCardCompletionToggle(t,{className:a?p.cardCompleteToggleCompleted:p.cardCompleteToggle,testId:"board-card-completion-toggle"}),d=this.renderCardMirrorSourceLabel(t,p.cardSourceLabel),m=this.renderCardFrontTags(t);d&&i.append(d),m&&i.append(m),i.append(s);const u=this.renderCardFrontBadges(t);return u&&i.append(u),o.append(c,i),o}createCardCompletionToggle(t,e){const a=mt(t),o=this.runtime.i18n.t(a?"boards.cardBack.markIncomplete":"boards.cardBack.markComplete",{title:t.title}),r=this.runtime.i18n.t(a?"boards.cardBack.markIncompleteHint":"boards.cardBack.markCompleteHint"),i=document.createElement("button");i.type="button",i.className=e.className,i.title=r,i.dataset.testid=e.testId,i.dataset.boardDragIgnore="true",i.setAttribute("aria-label",o),i.setAttribute("aria-pressed",a?"true":"false");const s=document.createElement("span");return s.className="majom-boards__completion-mark",s.setAttribute("aria-hidden","true"),i.append(s),i.addEventListener("pointerdown",c=>{c.stopPropagation()}),i.addEventListener("click",c=>{c.preventDefault(),c.stopPropagation(),this.toggleCardCompletion(t)}),i}toggleCardCompletion(t){const e={completedAt:mt(t)?null:new Date};this.handlers.onPatchCard(t.id,e)}renderCardFrontTags(t){var a;if(!((a=t.tags)!=null&&a.length))return null;const e=document.createElement("div");return e.className=p.cardTags,e.setAttribute("data-testid","board-card-tags"),t.tags.forEach(o=>{e.append(this.createCardTagChip(o,p.cardTag))}),e}createCardTagChip(t,e){const a=document.createElement("span");return a.className=e,a.title=t.title,a.setAttribute("aria-label",t.title),a.setAttribute("role","img"),a.setAttribute("data-testid","compact-card-label"),a.style.backgroundColor=t.color,a}renderCardFrontBadges(t){const e=document.createElement("div");e.className=p.cardBadges,t.description.trim()&&e.append(this.createCardFrontBadge("bars-3-bottom-left",this.runtime.i18n.t("boards.cardDescriptionLabel"),void 0,"plain"));const a=Fa(t);a>0&&e.append(this.createCardFrontBadge("chat-bubble-bottom-center-text",this.runtime.i18n.t("boards.cardBack.comments"),String(a),"neutral"));const o=Ka(t);o.total>0&&e.append(this.createCardFrontBadge("check-box",this.runtime.i18n.t("boards.cardBack.checklist"),`${o.completed}/${o.total}`,"neutral"));const r=Ha(t);return[{type:"goal",tone:"goal",labelKey:"boards.cardLinks.goalBadge"},{type:"story",tone:"story",labelKey:"boards.cardLinks.storyBadge"},{type:"task",tone:"task",labelKey:"boards.cardLinks.taskBadge"}].forEach(s=>{const c=r[s.type];c<=0||e.append(this.createCardFrontBadge(Bt(s.type),this.runtime.i18n.t(s.labelKey),String(c),s.tone))}),e.childElementCount>0?e:null}renderCardMirrorSourceLabel(t,e){if(!t.mirror_source)return null;const a=t.mirror_source,o=this.runtime.i18n.t("boards.cardMirror.sourceLocation",{board:a.board_title,list:a.column_title}),r=document.createElement("span");return r.className=e,r.setAttribute("data-testid","card-mirror-source-label"),r.textContent=o,r.title=this.runtime.i18n.t("boards.cardMirror.sourceLabel",{source:o}),r.setAttribute("aria-label",r.title),r}createCardFrontBadge(t,e,a,o="neutral"){const r=document.createElement("span"),i={plain:p.cardBadgePlain,neutral:p.cardBadgeNeutral,task:p.cardBadgeTask,story:p.cardBadgeStory,goal:p.cardBadgeGoal};r.className=i[o],r.title=e,r.setAttribute("aria-label",a?`${e}: ${a}`:e);const s=D(t,{size:16,strokeWidth:2});if(s.setAttribute("aria-hidden","true"),r.append(s),a){const c=document.createElement("span");c.textContent=a,r.append(c)}return r}renderCardComposer(t,e){return Be({expanded:this.expandedCardComposerColumnId===t.id,collapsedLabel:this.runtime.i18n.t("boards.actions.createCard"),submitLabel:this.runtime.i18n.t("boards.actions.createCard"),cancelLabel:this.runtime.i18n.t("boards.actions.cancelNewCard"),placeholder:this.runtime.i18n.t("boards.cardComposerPlaceholder"),ariaLabel:this.runtime.i18n.t("boards.cardTitleLabel"),classNames:{root:p.cardComposer,collapsedButton:p.cardComposerCollapsed,expandedForm:p.cardComposerExpanded,textarea:p.cardComposerTextarea,actions:p.composerActions,submitButton:p.primaryButton,cancelButton:p.composerCancelButton},disabled:e.status==="saving",rows:2,textareaTestId:"list-card-composer-textarea",focusOnRender:!0,dragIgnoreDatasetKey:"boardDragIgnore",onExpand:()=>this.expandCardComposer(t.id),onTextareaCreated:a=>this.cardDrafts.set(t.id,{title:a}),onSubmit:()=>this.submitCard(t.id),onCancel:()=>this.collapseCardComposer()}).element}renderColumnComposer(t,e){const a=document.createElement("aside");if(a.className=this.isColumnComposerExpanded?p.columnComposerExpandedPanel:p.columnComposerCollapsedPanel,a.dataset.boardColumnComposer="true",!this.isColumnComposerExpanded){const i=C({text:this.runtime.i18n.t("boards.addColumnPanelTitle"),tone:"text",size:"md",fullWidth:!0,className:p.columnComposerCollapsed,disabled:e.status==="saving",onClick:()=>this.expandColumnComposer()});return i.setAttribute("data-testid","list-composer-button"),i.setAttribute("data-drag-scroll-disabled","true"),K(i,"plus"),a.append(i),a}const o=document.createElement("form");o.className=p.columnComposerExpanded,o.setAttribute("data-focus-lock-disabled","false"),o.addEventListener("submit",i=>{i.preventDefault(),this.submitColumnTitle(t.id)}),this.columnTitleTextarea=document.createElement("textarea"),this.columnTitleTextarea.className=p.listComposerTextarea,this.columnTitleTextarea.placeholder=this.runtime.i18n.t("boards.columnTitlePlaceholder"),this.columnTitleTextarea.name=this.runtime.i18n.t("boards.columnTitlePlaceholder"),this.columnTitleTextarea.dir="auto",this.columnTitleTextarea.rows=1,this.columnTitleTextarea.maxLength=512,this.columnTitleTextarea.spellcheck=!1,this.columnTitleTextarea.setAttribute("data-testid","list-name-textarea"),this.columnTitleTextarea.setAttribute("autocomplete","off"),this.columnTitleTextarea.setAttribute("aria-label",this.runtime.i18n.t("boards.columnTitlePlaceholder")),this.columnTitleTextarea.addEventListener("keydown",i=>{i.key!=="Enter"||i.shiftKey||(i.preventDefault(),this.submitColumnTitle(t.id))});const r=document.createElement("div");return r.className=p.composerActions,r.append(C({text:this.runtime.i18n.t("boards.actions.createColumn"),tone:"primary",size:"sm",type:"submit",className:p.primaryButton,disabled:e.status==="saving"}),T({icon:"x-mark",tone:"text",size:"md",type:"button",title:this.runtime.i18n.t("boards.actions.cancelNewColumn"),ariaLabel:this.runtime.i18n.t("boards.actions.cancelNewColumn"),className:p.composerCancelButton,onClick:()=>this.collapseColumnComposer()})),o.append(this.columnTitleTextarea,r),a.append(o),requestAnimationFrame(()=>{var i;return(i=this.columnTitleTextarea)==null?void 0:i.focus()}),a}renderEmptyState(){const t=document.createElement("div");t.className=p.empty;const e=document.createElement("div");e.className=p.emptyContent;const a=document.createElement("h2");a.className=p.emptyTitle,a.textContent=this.runtime.i18n.t("boards.emptyTitle");const o=document.createElement("p");return o.className=p.emptyCopy,o.textContent=this.runtime.i18n.t("boards.emptyBody"),e.append(a,o),t.append(e),t}renderMessage(t){const e=document.createElement("div");e.className=p.messageWrapper;const a=document.createElement("p");return a.className=p.messageLabel,a.textContent=t,e.append(a),e}openQuickCardEditor(t,e){if(!this.state)return;const a=this.findCardLocation(t,this.state);if(!a)return;this.closeQuickCardEditor();const o=document.createElement("div");o.className=l.quickEditorOverlay,o.addEventListener("pointerdown",i=>{i.target===o&&this.closeQuickCardEditor()}),o.addEventListener("keydown",i=>{i.key==="Escape"&&(i.preventDefault(),this.closeQuickCardEditor())});const r=this.renderQuickCardEditor(a);this.positionQuickCardEditor(r,e),o.append(r),document.body.append(o),this.quickEditorOverlay=o,requestAnimationFrame(()=>{var i;(i=r.querySelector('[data-testid="quick-card-editor-card-title"]'))==null||i.focus()})}renderQuickCardEditor(t){const{card:e}=t,a=document.createElement("div");a.className=l.quickEditor,a.setAttribute("data-elevation","1"),a.addEventListener("pointerdown",b=>b.stopPropagation());const o=document.createElement("div");o.setAttribute("role","dialog"),o.setAttribute("aria-modal","true"),o.setAttribute("aria-label",this.runtime.i18n.t("boards.quickEditor.menuLabel")),o.setAttribute("data-testid","quick-card-editor-menu");const r=document.createElement("form");r.className=l.quickEditorForm,r.addEventListener("submit",b=>{b.preventDefault(),this.saveQuickCardEditor(e,c)});const i=F({elevated:!0,className:tt(e)?`${l.quickEditorCard} ${l.quickEditorCardMirror}`:l.quickEditorCard});i.setAttribute("data-testid","quick-card-editor-card-front");const s=document.createElement("div");s.className=l.quickEditorCardInner;const c=document.createElement("textarea");c.className=l.quickEditorTitle,c.setAttribute("data-testid","quick-card-editor-card-title"),c.dir="auto",c.setAttribute("aria-label",this.runtime.i18n.t("boards.quickEditor.editCardName")),c.value=e.title,c.rows=2,c.addEventListener("keydown",b=>{b.key!=="Enter"||b.shiftKey||(b.preventDefault(),this.saveQuickCardEditor(e,c))});const d=this.renderCardFrontBadges(e),m=this.renderCardMirrorSourceLabel(e,p.cardSourceLabel);m&&s.append(m),s.append(c),d&&s.append(d),i.append(s);const u=C({text:this.runtime.i18n.t("common.save"),tone:"primary",size:"md",className:`${p.primaryButton} ${l.quickEditorSave}`,type:"submit"}),h=()=>{u.disabled=c.value.trim().length===0};return c.addEventListener("input",h),h(),r.append(i,u),o.append(r,this.renderQuickCardEditorActions(t)),a.append(o),a}renderQuickCardEditorActions(t){const{board:e,column:a,card:o,placementId:r}=t,i=document.createElement("div");i.className=l.quickEditorActions;const s=document.createElement("ul");return s.className=l.quickEditorButtons,s.setAttribute("data-testid","quick-card-editor-buttons"),[{testId:"quick-card-editor-open-card",labelKey:"boards.quickEditor.openCard",icon:"rectangle-stack",onClick:()=>{this.closeQuickCardEditor(),this.openCardModal(r)}},{testId:"quick-card-editor-edit-labels",labelKey:"boards.quickEditor.editLabels",icon:"tag",onClick:()=>{this.closeQuickCardEditor(),this.openCardModal(r)}},{testId:"quick-card-editor-move",labelKey:"boards.quickEditor.move",icon:"arrow-right",onClick:d=>{this.openMoveCardPopover(d.currentTarget,e,a,o,"move")}},{testId:"mirror-new-button",labelKey:"boards.quickEditor.mirror",icon:"rectangle-stack",onClick:d=>{this.openMoveCardPopover(d.currentTarget,e,a,o,"mirror")}},{testId:"quick-card-editor-archive",labelKey:tt(o)?"boards.quickEditor.removeFromBoard":"boards.quickEditor.archive",icon:"archive-box",onClick:()=>{this.closeQuickCardEditor(),this.archiveOrRemoveCard(o,r)}},{testId:"quick-card-editor-delete-card",labelKey:"boards.actions.deleteCard",icon:"trash",danger:!0,onClick:()=>void this.deleteSharedCardFromQuickEditor(o)}].forEach(d=>{const m=document.createElement("li");d.danger&&(m.className=l.quickEditorDangerItem);const u=C({text:this.runtime.i18n.t(d.labelKey),tone:d.danger?"danger":"text",size:"md",className:d.danger?`${l.quickEditorButton} ${l.quickEditorDangerButton}`:l.quickEditorButton,onClick:d.onClick});u.setAttribute("data-testid",d.testId),K(u,d.icon),m.append(u),s.append(m)}),i.append(s),i}positionQuickCardEditor(t,e){const{formWidth:a,actionsWidth:o,actionsGap:r,viewportMargin:i,minVisibleHeight:s}=Ta,c=Math.min(Math.max(e.left,i),Math.max(i,window.innerWidth-a-o-r-i)),d=Math.min(Math.max(e.top,i),Math.max(i,window.innerHeight-s-i));t.style.left=`${c}px`,t.style.top=`${d}px`}saveQuickCardEditor(t,e){const a=e.value.trim();a&&(this.closeQuickCardEditor(),a!==t.title&&this.handlers.onPatchCard(t.id,{title:a}))}openCardModal(t){if(!this.state)return;const e=this.findCardLocation(t,this.state);e&&(this.activeCardPlacementId=t,this.cardModalDraftTagIds=X(e.card),this.cardModalRequestedTagIds=[...this.cardModalDraftTagIds],this.hiddenCheckedChecklistIds.clear(),this.expandedCheckItemComposerIds.clear(),this.cardChecklistPanelState={cardId:e.card.id,status:"idle",checklists:[],error:null},this.renderCardModal(e),this.loadCardModalChecklists(e.card.id))}syncCardModal(t){if(this.activeCardPlacementId===null)return;const e=this.findCardLocation(this.activeCardPlacementId,t);if(!e){this.closeCardModal();return}this.renderCardModal(e)}renderCardModal(t){var b;this.closeCardLabelsPopover(),this.closeCardChecklistPopover(),this.closeCardCheckItemMenuPopover(),this.closeCardEntityLinkMenuPopover(),this.closeMoveCardPopover(),(b=this.cardModalOverlay)==null||b.remove(),this.cardModalOverlay=null,this.cardModalLabelsHost=null,this.cardModalQuickActionList=null,this.cardModalChecklistHost=null;const{board:e,column:a,card:o}=t;this.cardModalDraftTagIds===null&&(this.cardModalDraftTagIds=X(o)),this.cardModalRequestedTagIds===null&&(this.cardModalRequestedTagIds=X(o));const{overlay:r,container:i,header:s,divider:c,body:d}=xe(o.title,{onClose:()=>this.closeCardModal(),hideCloseButton:!0,intent:"form",presentation:"dialog",zIndex:270});s.classList.add(l.hiddenShellPart),c.classList.add(l.hiddenShellPart),i.classList.add(l.container),i.addEventListener("keydown",g=>{g.stopPropagation()}),d.className=l.body;const m=document.createElement("textarea");m.className=l.titleEditor,m.dataset.boardCardModalTitle="true",m.dir="auto",m.rows=La,m.maxLength=Ma,m.value=o.title,m.setAttribute("aria-label",o.title);const u=document.createElement("textarea");u.className=l.descriptionEditor,u.dataset.boardCardModalDescription="true",u.value=o.description,u.placeholder=this.runtime.i18n.t("boards.cardDescriptionPlaceholder"),u.setAttribute("aria-label",this.runtime.i18n.t("boards.cardDescriptionLabel"));const h=document.createElement("div");h.className=l.cardBack,h.append(this.renderCardBackTopbar(e,a,o),this.renderCardBackLayout(e,a,o,m,u)),d.append(h),i.setAttribute("aria-labelledby","card-back-name"),i.setAttribute("data-focus-lock","cardback"),this.cardModalOverlay=r}renderCardBackTopbar(t,e,a){const o=document.createElement("header");o.className=l.topbar;const r=document.createElement("div");r.className=l.topbarStart;const i=document.createElement("button");i.type="button",i.className=l.listBadge,i.setAttribute("data-testid","card-back-list-button"),i.title=e.title,i.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.changeList",{column:e.title})),i.setAttribute("aria-haspopup","dialog"),i.setAttribute("aria-expanded","false"),i.addEventListener("click",h=>{var b;if(h.stopPropagation(),((b=this.moveCardPopover)==null?void 0:b.trigger)===i){this.closeMoveCardPopover();return}this.openMoveCardPopover(i,t,e,a)});const s=document.createElement("span");s.textContent=e.title;const c=D("chevron-down",{size:14,strokeWidth:2});c.setAttribute("aria-hidden","true"),i.append(s,c),r.append(i);const d=this.renderCardMirrorSourceLabel(a,l.sourceLabel);d&&r.append(d);const m=document.createElement("div");m.className=l.topbarActions;const u=T({icon:"ellipsis-vertical",tone:"text",size:"md",className:l.iconButton,ariaLabel:this.runtime.i18n.t("boards.cardBack.actions"),title:this.runtime.i18n.t("boards.cardBack.actions")});return u.setAttribute("aria-haspopup","dialog"),u.setAttribute("aria-expanded","false"),u.setAttribute("data-testid","card-back-actions-button"),u.addEventListener("click",h=>{var b;if(h.stopPropagation(),((b=this.cardActionsPopover)==null?void 0:b.trigger)===u){this.closeCardActionsPopover();return}this.openCardActionsPopover(u,t,e,a)}),m.append(u,T({icon:"x-mark",tone:"text",size:"md",className:l.iconButton,ariaLabel:this.runtime.i18n.t("common.close"),title:this.runtime.i18n.t("common.close"),onClick:()=>this.closeCardModal()})),o.append(r,m),o}openCardActionsPopover(t,e,a,o){this.closeCardActionsPopover();const r=F({elevated:!0,className:`${l.cardActionsPopover} hidden`});r.setAttribute("role","dialog"),r.setAttribute("aria-modal","false"),r.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.actions")),r.setAttribute("data-testid","card-back-actions-popover"),r.addEventListener("mousedown",d=>d.stopPropagation());const i=document.createElement("div");i.className=l.cardActionsBody;const s=document.createElement("ul");s.className=l.cardActionsList,s.append(this.renderCardActionItem({testId:"card-back-move-card-button",labelKey:"boards.quickEditor.move",icon:"arrow-right",disabled:!0}),this.renderCardActionItem({testId:"card-back-copy-card-button",labelKey:"boards.quickEditor.copyCard",icon:"square-2-stack",disabled:!0}),this.renderCardActionItem({testId:"card-back-mirror-card-button",labelKey:"boards.quickEditor.mirror",icon:"rectangle-stack",onClick:()=>{this.closeCardActionsPopover(),this.openMoveCardPopover(t,e,a,o,"mirror")}}),this.renderCardActionItem({testId:"card-back-link-entity-button",labelKey:"boards.cardLinks.link",icon:"link",onClick:()=>{this.closeCardActionsPopover(),this.openCardEntityLinkModal(o)}}),this.renderCardActionItem({testId:"card-back-import-card-button",labelKey:"boards.import.actions.importCard",icon:"arrow-down",onClick:()=>{this.closeCardActionsPopover(),this.openImportPreviewModal({scope:"card",titleKey:"boards.import.title.card",target:{cardId:o.id,columnId:a.id,boardId:e.id}})}}),this.renderCardActionItem({testId:"card-back-export-card-markdown-button",labelKey:"boards.export.actions.cardMarkdown",icon:"document",onClick:()=>{this.closeCardActionsPopover(),this.openExportOutputModal({titleKey:"boards.export.title.card",request:{scope:"card",format:"markdown",cardId:o.id}})}}),this.renderCardActionItem({testId:"card-back-export-card-json-button",labelKey:"boards.export.actions.cardJson",icon:"document",onClick:()=>{this.closeCardActionsPopover(),this.openExportOutputModal({titleKey:"boards.export.title.card",request:{scope:"card",format:"json",cardId:o.id}})}}),this.renderCardActionItem({testId:"card-back-create-task-button",labelKey:"boards.cardLinks.createTask",icon:"check-box",onClick:()=>void this.createEntityFromCard(o,"task")}),this.renderCardActionItem({testId:"card-back-create-story-button",labelKey:"boards.cardLinks.createStory",icon:"document",onClick:()=>void this.createEntityFromCard(o,"story")}),this.renderCardActionItem({testId:"card-back-create-goal-button",labelKey:"boards.cardLinks.createGoal",icon:"goal-circle",onClick:()=>void this.createEntityFromCard(o,"goal")}),this.renderCardActionsDivider(),this.renderCardActionItem({testId:"card-back-archive-button",labelKey:tt(o)?"boards.quickEditor.removeFromBoard":"boards.quickEditor.archive",icon:"archive-box",onClick:()=>{this.closeCardActionsPopover(),this.closeCardModal(),this.archiveOrRemoveCard(o,j(o))}}),this.renderCardActionItem({testId:"card-back-delete-card-button",labelKey:"boards.actions.deleteCard",icon:"trash",onClick:()=>void this.deleteSharedCardFromDetails(o)})),i.append(s),r.append(i);let c;c=new O({container:t,panel:r,positioning:"viewport",panelZIndex:300,onOpenChange:d=>{var m;t.setAttribute("aria-expanded",d?"true":"false"),!d&&((m=this.cardActionsPopover)==null?void 0:m.menu)===c&&this.closeCardActionsPopover()}}),c.mount(),this.cardActionsPopover={menu:c,panel:r,trigger:t},c.openAt({anchor:t,placement:"bottom-end",fallbackPlacements:["bottom-start","top-end","top-start"],gap:8,margin:12,lockPlacementAfterOpen:!0})}renderCardActionItem(t){const e=document.createElement("li");e.className=l.cardActionsItem;const a=C({text:this.runtime.i18n.t(t.labelKey),tone:"text",size:"md",className:l.cardActionsButton,disabled:t.disabled,onClick:t.onClick});return a.setAttribute("data-testid",t.testId),K(a,t.icon),e.append(a),e}renderCardActionsDivider(){const t=document.createElement("li");return t.className=l.cardActionsDivider,t.setAttribute("role","separator"),t}openImportPreviewModal(t){this.closeImportPreviewModal(),this.closeTransientBoardOverlays();let e="markdown";const a=Re();let o=null,r=null;const{overlay:i,container:s,body:c,footer:d}=nt(this.runtime.i18n.t(t.titleKey),{intent:"info",zIndex:370,onClose:()=>this.closeImportPreviewModal()});s.classList.add(l.importModal),i.setAttribute("data-testid","boards-import-preview-modal");const m=document.createElement("div");m.className=l.importLayout;const u=document.createElement("section");u.className=l.importPanel;const h=new ve({value:e,size:"sm",fullWidth:!0,ariaLabel:this.runtime.i18n.t("boards.import.format"),options:[{id:"markdown",value:"markdown",label:this.runtime.i18n.t("boards.import.formatMarkdown")},{id:"json",value:"json",label:this.runtime.i18n.t("boards.import.formatJson")}],onChange:I=>{e=I,L()}}),b=this.createImportField("boards.import.source","boards-import-source"),g=new Kt({id:"boards-import-source",rows:14,placeholder:this.runtime.i18n.t("boards.import.sourcePlaceholder"),className:l.importSource,onInput:()=>{L(),S()}}).createElement();b.append(g),u.append(h.element,b);const f=document.createElement("section");f.className=l.importPanel,f.append(this.createImportSelect({id:"boards-import-mode",labelKey:"boards.import.mode",value:a.mode,options:[["merge","boards.import.mode.merge"],["create","boards.import.mode.create"],["replace","boards.import.mode.replace"]],onChange:I=>{a.mode=I,L()}}),this.createImportSelect({id:"boards-import-match",labelKey:"boards.import.match",value:a.matchStrategy,options:[["title","boards.import.match.title"],["id","boards.import.match.id"],["external_ref","boards.import.match.externalRef"]],onChange:I=>{a.matchStrategy=I,L()}}),this.createImportSelect({id:"boards-import-missing",labelKey:"boards.import.missingFields",value:a.missingFieldPolicy,options:[["keep_existing","boards.import.missing.keepExisting"],["use_defaults","boards.import.missing.useDefaults"],["clear_on_replace","boards.import.missing.clearOnReplace"]],onChange:I=>{a.missingFieldPolicy=I,L()}}),this.createImportSelect({id:"boards-import-unknown",labelKey:"boards.import.unknownFields",value:a.unknownFieldPolicy,options:[["warn_and_ignore","boards.import.unknown.warn"],["strict_error","boards.import.unknown.strict"]],onChange:I=>{a.unknownFieldPolicy=I,L()}}));const x=document.createElement("section");x.className=l.importPreviewPanel,x.setAttribute("data-testid","boards-import-preview-panel"),this.renderImportPreviewPlan(x,null),m.append(u,f,x),c.replaceChildren(m);const v=st({className:l.importMessage,ariaLive:"polite"}),$=wt({variant:"confirm"}),y=document.createElement("button");y.type="button",y.className=W("default"),y.textContent=this.runtime.i18n.t("boards.import.preview"),y.setAttribute("data-testid","boards-import-preview-button");const w=document.createElement("button");w.type="button",w.className=W("wide"),w.textContent=this.runtime.i18n.t("boards.import.apply"),w.disabled=!0,w.setAttribute("data-testid","boards-import-apply-button");const z=document.createElement("button");z.type="button",z.className=W("default"),z.textContent=this.runtime.i18n.t("common.close"),z.addEventListener("click",()=>this.closeImportPreviewModal());const A=async()=>{const I=g.value.trim();if(!I)return;const rt={raw:I,format:e,scope:t.scope,target:t.target,policies:{...a}};y.disabled=!0,w.disabled=!0,v.show(this.runtime.i18n.t("boards.import.previewing"),"info");try{const H=await this.handlers.onPreviewImport(rt);o=rt,r=H,this.renderImportPreviewPlan(x,H),v.clear()}catch{o=null,r=null,this.renderImportPreviewPlan(x,null),v.show(this.runtime.i18n.t("boards.import.previewFailed"),"error")}finally{S(),R()}},B=async()=>{if(!(!o||!(r!=null&&r.canApply))&&o.policies.mode==="create"){w.disabled=!0,y.disabled=!0,v.show(this.runtime.i18n.t("boards.import.applying"),"info");try{if(!await this.handlers.onApplyImport(o)){v.show(this.runtime.i18n.t("boards.import.applyFailed"),"error");return}this.closeImportPreviewModal(),Ct(this.runtime.i18n.t("boards.import.applied"),"success")}catch{v.show(this.runtime.i18n.t("boards.import.applyFailed"),"error")}finally{S(),R()}}};function L(){o=null,r=null,w.disabled=!0}function S(){y.disabled=g.value.trim().length===0}function R(){w.disabled=!o||!(r!=null&&r.canApply)||o.policies.mode!=="create"}y.addEventListener("click",()=>void A()),w.addEventListener("click",()=>void B()),$.append(z,y,w),d.replaceChildren(v.element,$),S(),this.importPreviewOverlay=i,requestAnimationFrame(()=>g.focus())}createImportField(t,e){const a=document.createElement("label");a.className=l.importField,a.htmlFor=e;const o=document.createElement("span");return o.className=l.importLabel,o.textContent=this.runtime.i18n.t(t),a.append(o),a}createImportSelect(t){const e=this.createImportField(t.labelKey,t.id),a=document.createElement("select");a.id=t.id,a.className=l.importSelect,a.value=t.value;for(const[o,r]of t.options)a.append(this.createSelectOption(o,this.runtime.i18n.t(r)));return a.addEventListener("change",()=>{t.onChange(a.value)}),e.append(a),e}renderImportPreviewPlan(t,e){t.replaceChildren();const a=document.createElement("h3");if(a.className=l.importPreviewTitle,a.textContent=this.runtime.i18n.t("boards.import.previewTitle"),t.append(a),!e){const i=document.createElement("p");i.className=l.importEmpty,i.textContent=this.runtime.i18n.t("boards.import.previewEmpty"),t.append(i);return}const o=document.createElement("dl");o.className=l.importCounts,[["create","boards.import.count.create"],["update","boards.import.count.update"],["skip","boards.import.count.skip"],["conflict","boards.import.count.conflict"]].forEach(([i,s])=>{const c=document.createElement("div");c.className=l.importCount;const d=document.createElement("dt");d.className=l.importCountValue,d.textContent=String(e.counts[i]);const m=document.createElement("dd");m.className=l.importCountLabel,m.textContent=this.runtime.i18n.t(s),c.append(d,m),o.append(c)}),t.append(o);const r=document.createElement("p");if(r.className=e.canApply?l.importStatusOk:l.importStatusBlocked,r.textContent=this.runtime.i18n.t(e.canApply?"boards.import.status.ready":"boards.import.status.blocked"),t.append(r),e.items.length>0){const i=document.createElement("ul");i.className=l.importItems,e.items.slice(0,40).forEach(s=>{const c=document.createElement("li");c.className=l.importItem;const d=document.createElement("span");d.className=l.importItemMain,d.textContent=`${this.runtime.i18n.t(Na[s.action])} ${this.runtime.i18n.t(Da[s.entity])}: ${s.title}`;const m=document.createElement("span");m.className=l.importItemMeta,m.textContent=s.reason?`${s.path} · ${s.reason}`:s.path,c.append(d,m),i.append(c)}),t.append(i)}if(e.diagnostics.length>0){const i=document.createElement("ul");i.className=l.importDiagnostics,e.diagnostics.slice(0,20).forEach(s=>{const c=document.createElement("li");c.className=s.level==="error"?l.importDiagnosticError:l.importDiagnosticWarning,c.textContent=s.path?`${s.path}: ${s.message}`:s.message,i.append(c)}),t.append(i)}}closeImportPreviewModal(){var t;(t=this.importPreviewOverlay)==null||t.remove(),this.importPreviewOverlay=null}async openExportOutputModal(t){this.closeExportOutputModal(),this.closeImportPreviewModal();const e=await this.handlers.onExportData(t.request);if(!e){Ct(this.runtime.i18n.t("boards.export.failed"),"error");return}const{overlay:a,container:o,body:r,footer:i}=nt(this.runtime.i18n.t(t.titleKey),{intent:"info",zIndex:380,onClose:()=>this.closeExportOutputModal()});o.classList.add(l.exportModal),a.setAttribute("data-testid","boards-export-output-modal");const s=document.createElement("div");s.className=l.exportContent;const c=document.createElement("p");c.className=l.exportMeta,c.textContent=`${e.fileName} · ${e.format.toUpperCase()}`;const d=new Kt({rows:18,value:e.content,className:l.exportOutput}).createElement();d.readOnly=!0,d.setAttribute("data-testid","boards-export-output"),d.addEventListener("focus",()=>d.select()),s.append(c,d),r.replaceChildren(s);const m=st({className:l.exportMessage,ariaLive:"polite"}),u=wt({variant:"confirm"}),h=document.createElement("button");h.type="button",h.className=W("default"),h.textContent=this.runtime.i18n.t("common.close"),h.addEventListener("click",()=>this.closeExportOutputModal());const b=document.createElement("button");b.type="button",b.className=W("wide"),b.textContent=this.runtime.i18n.t("boards.export.copy"),b.setAttribute("data-testid","boards-export-copy-button"),b.addEventListener("click",()=>{this.copyExportContent(e,d,m)}),u.append(h,b),i.replaceChildren(m.element,u),this.exportOutputOverlay=a,requestAnimationFrame(()=>d.focus())}async copyExportContent(t,e,a){var o;try{(o=navigator.clipboard)!=null&&o.writeText?await navigator.clipboard.writeText(t.content):(e.select(),document.execCommand("copy")),a.show(this.runtime.i18n.t("boards.export.copied"),"success")}catch{e.select(),a.show(this.runtime.i18n.t("boards.export.copyFailed"),"warning")}}closeExportOutputModal(){var t;(t=this.exportOutputOverlay)==null||t.remove(),this.exportOutputOverlay=null}archiveOrRemoveCard(t,e){if(tt(t)){this.handlers.onDeleteCardPlacement(e);return}this.handlers.onDeleteCard(t.id)}createPlacementTargetFromPosition(t,e,a){return he({columnId:t.id,cards:t.cards,movingPlacementId:a??"",insertionIndex:e-1})}openMoveCardPopover(t,e,a,o,r="move"){var qt;const i=((qt=this.state)==null?void 0:qt.boards)??[e],s=j(o);let c=e.id,d=a.id,m=a.cards.findIndex(_=>j(_)===s);m=m>=0?m+1:1;const u=r==="mirror"?"boards.cardMirror.title":"boards.cardMove.title",h=r==="mirror"?"boards.cardMirror.create":"boards.cardMove.move";this.closeMoveCardPopover();const b=F({elevated:!0,className:`${l.movePopover} hidden`});b.setAttribute("role","dialog"),b.setAttribute("aria-modal","false"),b.setAttribute("aria-labelledby","move-card-popover"),b.setAttribute("data-testid","move-card-popover"),b.addEventListener("mousedown",_=>_.stopPropagation());const g=document.createElement("header");g.className=l.movePopoverHeader;const f=document.createElement("h2");f.id="move-card-popover",f.className=l.movePopoverTitle,f.textContent=this.runtime.i18n.t(u);const x=T({icon:"x-mark",tone:"text",size:"sm",className:l.iconButton,ariaLabel:this.runtime.i18n.t("common.close"),title:this.runtime.i18n.t("common.close"),onClick:()=>this.closeMoveCardPopover()});g.append(f,x);const v=document.createElement("div");v.className=l.movePopoverBody;const $=document.createElement("div");$.className=l.movePopoverContent;const y=document.createElement("div");y.className=l.moveTabs,y.setAttribute("role","tablist"),y.append(this.renderMoveCardTab("boards.cardMove.inbox",!1),this.renderMoveCardTab("boards.cardMove.board",!0));const w=document.createElement("h3");w.className=l.moveSectionTitle,w.textContent=this.runtime.i18n.t("boards.cardMove.selectDestination");const z=document.createElement("div");z.className=l.moveFields;const A=this.createMoveSelectField({id:"move-card-board-select",label:this.runtime.i18n.t("boards.cardMove.board")}),B=this.createMoveSelectField({id:"move-card-list-select",label:this.runtime.i18n.t("boards.cardMove.list")}),L=this.createMoveSelectField({id:"move-card-board-list-position-select",label:this.runtime.i18n.t("boards.cardMove.position")}),S=()=>i.find(_=>_.id===c)??null,R=()=>{var _;return((_=S())==null?void 0:_.columns.find(E=>E.id===d))??null},I=()=>{var _;return r!=="mirror"?!1:((_=R())==null?void 0:_.cards.some(E=>E.id===o.id))??!1},rt=()=>{const _=R();return _?r==="mirror"?_.cards.length+1:_.id===a.id?_.cards.length:_.cards.length+1:0};let H;const _t=()=>{var Q;A.select.replaceChildren(...i.map(N=>this.createSelectOption(N.id,N.title,N.id===c)));const _=S(),E=(_==null?void 0:_.columns)??[];E.some(N=>N.id===d)||(d=((Q=E[0])==null?void 0:Q.id)??""),B.select.replaceChildren(...E.map(N=>this.createSelectOption(N.id,N.title,N.id===d)));const G=rt();m=Math.min(Math.max(m,1),G||1),L.select.replaceChildren(...Array.from({length:G},(N,vt)=>this.createSelectOption(vt+1,String(vt+1),vt+1===m))),I()?it.show(this.runtime.i18n.t("boards.cardMirror.duplicateDestination"),"warning"):R()?it.clear():it.show(this.runtime.i18n.t("boards.cardMirror.noDestination"),"error"),H.disabled=!R()},it=st({tone:"error",className:"mb-3"});A.select.addEventListener("change",()=>{var _,E;c=A.select.value,d=((E=(_=i.find(G=>G.id===c))==null?void 0:_.columns[0])==null?void 0:E.id)??"",m=1,_t()}),B.select.addEventListener("change",()=>{d=B.select.value,m=d===a.id?m:1,_t()}),L.select.addEventListener("change",()=>{m=Number(L.select.value)}),H=C({text:this.runtime.i18n.t(h),tone:"primary",size:"md",className:l.moveButton,onClick:()=>{const _=R();if(!_)return;const E=this.createPlacementTargetFromPosition(_,m,r==="move"?s:void 0),G=a.cards.findIndex(Q=>j(Q)===s);if(this.closeMoveCardPopover(),r==="mirror"){this.closeQuickCardEditor();const{column:Q,...N}=E;this.handlers.onCreateCardMirror(o.id,Q,N);return}if(_.id===a.id&&m-1===G){this.closeQuickCardEditor();return}this.closeQuickCardEditor(),this.handlers.onPatchCardPlacement(s,E)}}),H.setAttribute("data-testid","move-card-popover-move-button");const xt=document.createElement("div");xt.className=l.moveActions,xt.append(H),z.append(A.field,B.field,L.field),$.append(y,w,z,it.element),v.append($,xt),b.append(g,v);let Z;Z=new O({container:t,panel:b,positioning:"viewport",panelZIndex:300,onOpenChange:_=>{var E;t.setAttribute("aria-expanded",_?"true":"false"),!_&&((E=this.moveCardPopover)==null?void 0:E.menu)===Z&&this.closeMoveCardPopover()}}),Z.mount(),this.moveCardPopover={menu:Z,panel:b,trigger:t},_t(),Z.openAt({anchor:t,placement:"bottom-start",fallbackPlacements:["bottom-end","top-start","top-end"],gap:8,margin:12,lockPlacementAfterOpen:!0})}renderMoveCardTab(t,e){const a=document.createElement("button");return a.type="button",a.className=e?l.moveTabSelected:l.moveTab,a.setAttribute("role","tab"),a.setAttribute("aria-selected",e?"true":"false"),a.disabled=!e,a.textContent=this.runtime.i18n.t(t),a}createMoveSelectField(t){const e=document.createElement("label");e.className=l.moveField,e.htmlFor=t.id;const a=document.createElement("span");a.className=l.moveLabel,a.textContent=t.label;const o=document.createElement("select");return o.id=t.id,o.className=l.moveSelect,o.setAttribute("data-testid",`${t.id}-select`),e.append(a,o),{field:e,select:o}}createSelectOption(t,e,a){const o=document.createElement("option");return o.value=String(t),o.textContent=e,o.selected=a,o}renderCardBackLayout(t,e,a,o,r){const i=document.createElement("div");i.className=l.layout;const s=document.createElement("main");s.className=l.main,s.setAttribute("data-auto-scrollable","true"),s.append(this.renderCardBackTitleSection(a,o),this.renderCardBackQuickActions(a),this.renderCardBackLabelsHost(a),...this.renderCardBackEntityLinksSection(a),this.renderCardBackDescriptionSection(a,o,r),this.renderCardBackChecklistsSection(a),this.renderCardBackAttachmentsSection());const c=this.renderCardBackAside(t,e);return i.append(s,c),i}renderCardBackTitleSection(t,e){const a=document.createElement("section");a.className=`${l.section} ${l.titleSection}`,a.setAttribute("data-testid","card-back-header");const o=document.createElement("div");o.className=l.sectionIcon;const r=this.createCardCompletionToggle(t,{className:mt(t)?l.doneButtonCompleted:l.doneButton,testId:"card-back-completion-toggle"});o.append(r);const i=document.createElement("div");i.className=l.sectionMain;const s=document.createElement("hgroup"),c=document.createElement("h2");return c.id="card-back-name",c.className=l.hiddenShellPart,c.textContent=t.title,s.append(c,e),i.append(s),a.append(o,i),a}renderCardBackQuickActions(t){const e=document.createElement("section");e.className=`${l.section} ${l.quickActions}`;const a=document.createElement("div");a.className=l.sectionIcon;const o=document.createElement("div");o.className=l.sectionMain;const r=document.createElement("ul");return r.className=l.quickActionList,this.cardModalQuickActionList=r,this.populateCardBackQuickActions(r,t),o.append(r),e.append(a,o),e}populateCardBackQuickActions(t,e){t.replaceChildren();const a=[{labelKey:"boards.cardBack.add",icon:"plus",disabled:!0}];this.getCardModalDraftTagItems(e).length===0&&a.push({labelKey:"boards.cardBack.labels",icon:"tag",onClick:o=>this.openCardLabelsPopover(o,e)}),a.push({labelKey:"boards.cardLinks.link",icon:"link",onClick:()=>this.openCardEntityLinkModal(e)},{labelKey:"boards.cardLinks.createTask",icon:"check-box",onClick:()=>void this.createEntityFromCard(e,"task")},{labelKey:"boards.cardLinks.createStory",icon:"document",onClick:()=>void this.createEntityFromCard(e,"story")},{labelKey:"boards.cardLinks.createGoal",icon:"goal-circle",onClick:()=>void this.createEntityFromCard(e,"goal")},{labelKey:"boards.cardBack.dates",icon:"calendar",disabled:!0},{labelKey:"boards.cardBack.checklist",icon:"check-box",onClick:o=>this.openCardChecklistPopover(o,e)}),a.forEach(o=>{const r=document.createElement("li"),i=o.disabled===!0?this.createUnavailableCardBackButton(o.labelKey,o.icon):this.createAvailableCardBackButton({labelKey:o.labelKey,icon:o.icon,onClick:o.onClick});r.append(i),t.append(r)})}renderCardBackLabelsHost(t){const e=document.createElement("div");return e.className=l.labelsHost,e.setAttribute("data-testid","card-back-labels-host"),this.cardModalLabelsHost=e,this.populateCardBackLabelsHost(e,t),e}populateCardBackLabelsHost(t,e){t.replaceChildren();const a=this.getCardModalDraftTagItems(e);if(a.length===0)return;const o=document.createElement("section");o.className=l.labelsSection,o.setAttribute("aria-labelledby","card-back-labels-title");const r=document.createElement("h3");r.id="card-back-labels-title",r.className=l.labelsTitle,r.textContent=this.runtime.i18n.t("boards.cardBack.labels");const i=document.createElement("div");i.setAttribute("role","group"),i.setAttribute("aria-labelledby",r.id);const s=document.createElement("div");s.className=l.labelsList,s.setAttribute("data-testid","card-back-labels-container"),a.forEach(c=>{s.append(this.createCardBackLabelSwatch(c))}),s.append(this.createCardBackAddLabelButton(e)),i.append(s),o.append(r,i),t.append(o)}createCardBackLabelSwatch(t){const e=document.createElement("button");return e.type="button",e.className=l.labelSwatch,e.style.backgroundColor=t.color,e.style.color=Ra(t.color),e.textContent=t.title,e.title=t.title,e.setAttribute("aria-label",t.title),e.setAttribute("data-testid","card-label"),e.dataset.tagId=String(t.id),e}createCardBackAddLabelButton(t){const e=T({icon:"plus",tone:"text",size:"md",className:l.labelAddButton,ariaLabel:this.runtime.i18n.t("boards.cardBack.addLabel"),title:this.runtime.i18n.t("boards.cardBack.addLabel"),onClick:()=>this.openCardLabelsPopover(e,t)});return e.setAttribute("data-testid","card-back-add-label-button"),e.dataset.role="goal-tag-picker-trigger",e.setAttribute("aria-haspopup","dialog"),e.setAttribute("aria-expanded","false"),e}createAvailableCardBackButton(t){const e=C({text:this.runtime.i18n.t(t.labelKey),tone:"text",size:"md",className:l.quickActionButton,onClick:()=>t.onClick(e)});return e.setAttribute("aria-haspopup","dialog"),e.setAttribute("aria-expanded","false"),K(e,t.icon),e}getCardModalDraftTagIds(t){return this.cardModalDraftTagIds===null&&(this.cardModalDraftTagIds=X(t)),this.cardModalDraftTagIds}getCardModalDraftTagItems(t){var r;const e=this.getCardModalDraftTagIds(t),a=new Set(e),o=new Map;return(r=t.tags)==null||r.forEach(i=>o.set(i.id,pt(i))),this.tagItems.forEach(i=>o.set(i.id,i)),e.map(i=>o.get(i)).filter(i=>!!i&&a.has(i.id))}refreshCardModalLabelControls(t){this.cardModalLabelsHost&&this.populateCardBackLabelsHost(this.cardModalLabelsHost,t),this.cardModalQuickActionList&&this.populateCardBackQuickActions(this.cardModalQuickActionList,t)}patchCardModalTagIds(t,e){const a=ht(e),o=this.cardModalRequestedTagIds??X(t);ae(a,o)||(this.cardModalRequestedTagIds=a,this.handlers.onPatchCard(t.id,{tag_ids:a}))}openCardLabelsPopover(t,e){this.closeCardLabelsPopover();const a=F({elevated:!0,className:`${l.labelPickerPopover} hidden`});a.setAttribute("role","dialog"),a.setAttribute("aria-modal","false"),a.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.labels")),a.setAttribute("data-testid","card-back-label-picker-popover"),a.addEventListener("mousedown",i=>i.stopPropagation());const o=new Ce({variant:"labels",items:this.tagItems,selectedIds:this.getCardModalDraftTagIds(e),loading:this.tagCatalogStatus==="loading",errorMessage:this.getTagPickerErrorMessage(),placeholder:this.runtime.i18n.t("boards.cardBack.tagsPlaceholder"),searchPlaceholder:this.runtime.i18n.t("boards.cardBack.tagsSearchPlaceholder"),copy:{title:this.runtime.i18n.t("boards.cardBack.labels"),editTitle:this.runtime.i18n.t("boards.cardBack.editLabel"),createTitle:this.runtime.i18n.t("boards.cardBack.createLabel"),searchPlaceholder:this.runtime.i18n.t("boards.cardBack.tagsSearchPlaceholder"),labelsLegend:this.runtime.i18n.t("boards.cardBack.labels"),createButton:this.runtime.i18n.t("boards.cardBack.createNewLabel"),colorblindButton:this.runtime.i18n.t("boards.cardBack.enableColorblindMode"),titleLabel:this.runtime.i18n.t("boards.cardBack.labelTitle"),colorLegend:this.runtime.i18n.t("boards.cardBack.selectColor"),removeColor:this.runtime.i18n.t("boards.cardBack.removeColor"),save:this.runtime.i18n.t("common.save"),delete:this.runtime.i18n.t("common.delete"),close:this.runtime.i18n.t("boards.cardBack.closeLabelsPopover"),back:this.runtime.i18n.t("boards.cardBack.returnToLabels")},onRequestClose:()=>this.closeCardLabelsPopover(),onCreate:(i,s)=>this.createTagFromCardBack(i,s),onUpdate:(i,s)=>this.updateTagFromCardBack(i,s),onDelete:i=>this.deleteTagFromCardBack(i),onChange:i=>{this.cardModalDraftTagIds=i,this.refreshCardModalLabelControls(e),this.patchCardModalTagIds(e,i)}});o.element.setAttribute("data-testid","card-back-tag-picker"),a.append(o.element);let r;r=new O({container:t,panel:a,positioning:"viewport",panelZIndex:310,onOpenChange:i=>{var s;t.setAttribute("aria-expanded",i?"true":"false"),!i&&((s=this.cardLabelsPopover)==null?void 0:s.menu)===r&&this.closeCardLabelsPopover()}}),r.mount(),this.cardLabelsPopover={menu:r,panel:a,picker:o,trigger:t},r.openAt({anchor:t,placement:"bottom-start",fallbackPlacements:["bottom-end","top-start","top-end"],gap:8,margin:12,lockPlacementAfterOpen:!0}),window.requestAnimationFrame(()=>o.focusSearch())}openCardChecklistPopover(t,e){this.closeCardChecklistPopover();const a=F({elevated:!0,className:`${l.checklistPopover} hidden`});a.setAttribute("role","dialog"),a.setAttribute("aria-modal","false"),a.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.addChecklist")),a.setAttribute("data-testid","card-back-checklist-popover"),a.addEventListener("mousedown",b=>b.stopPropagation());const o=document.createElement("header");o.className=l.checklistPopoverHeader;const r=document.createElement("h3");r.className=l.checklistPopoverTitle,r.textContent=this.runtime.i18n.t("boards.cardBack.addChecklist");const i=T({icon:"x-mark",tone:"text",size:"sm",className:l.checklistPopoverClose,ariaLabel:this.runtime.i18n.t("common.close"),title:this.runtime.i18n.t("common.close"),onClick:()=>this.closeCardChecklistPopover()});o.append(r,i);const s=document.createElement("form");s.className=l.checklistPopoverForm;const c=document.createElement("label");c.className=l.checklistPopoverLabel,c.textContent=this.runtime.i18n.t("boards.cardBack.checklistTitle");const d=Y({variant:"default",value:this.runtime.i18n.t("boards.cardBack.defaultChecklistTitle"),className:l.checklistPopoverInput});c.append(d);const m=document.createElement("div");m.className=l.checklistPopoverActions;const u=C({text:this.runtime.i18n.t("boards.cardBack.add"),tone:"primary",size:"md",className:l.checklistPopoverSubmit});u.type="submit",m.append(u),s.append(c,m),s.addEventListener("submit",b=>{b.preventDefault(),this.createCardModalChecklist(e,d.value)}),a.append(o,s);let h;h=new O({container:t,panel:a,positioning:"viewport",panelZIndex:310,onOpenChange:b=>{var g;t.setAttribute("aria-expanded",b?"true":"false"),!b&&((g=this.cardChecklistPopover)==null?void 0:g.menu)===h&&this.closeCardChecklistPopover()}}),h.mount(),this.cardChecklistPopover={menu:h,panel:a,trigger:t},h.openAt({anchor:t,placement:"bottom-start",fallbackPlacements:["bottom-end","top-start","top-end"],gap:8,margin:12,lockPlacementAfterOpen:!0}),window.requestAnimationFrame(()=>{d.focus(),d.select()})}async createTagFromCardBack(t,e){if(!this.tagCatalog)return null;try{const a=await this.tagCatalog.createTag(t,e),o=pt(a);return this.upsertTagItem(o),o}catch{throw new Error(this.runtime.i18n.t("boards.cardBack.tagsCreateFailed"))}}async updateTagFromCardBack(t,e){if(!this.tagCatalog)return null;try{const a=await this.tagCatalog.updateTag(t,e),o=pt(a);return this.upsertTagItem(o),o}catch{throw new Error(this.runtime.i18n.t("boards.cardBack.tagsUpdateFailed"))}}async deleteTagFromCardBack(t){if(this.tagCatalog)try{await this.tagCatalog.deleteTag(t),this.tagItems=this.tagItems.filter(a=>a.id!==t);const{card:e}=this.findActiveCardLocation();this.cardModalDraftTagIds=this.getCardModalDraftTagIds(e).filter(a=>a!==t)}catch{throw new Error(this.runtime.i18n.t("boards.cardBack.tagsDeleteFailed"))}}upsertTagItem(t){if(this.tagItems.findIndex(a=>a.id===t.id)>=0){this.tagItems=this.tagItems.map(a=>a.id===t.id?t:a);return}this.tagItems=[...this.tagItems,t]}renderCardBackEntityLinksSection(t){const e=Dt(t);if(e.length===0)return[];const a=this.createCardBackSection("link",this.runtime.i18n.t("boards.cardLinks.title")),o=a.querySelector(`.${l.sectionMain}`),r=a.querySelector(`.${l.sectionHeader}`);if(!o||!r)return[a];const i=document.createElement("div");i.className=l.sectionActions,i.append(C({text:this.runtime.i18n.t("boards.cardLinks.link"),tone:"text",size:"md",className:p.quietButton,onClick:()=>this.openCardEntityLinkModal(t)})),r.append(i);const s=document.createElement("div");s.className=l.entityLinksHost,s.setAttribute("data-testid","card-entity-links");const c=document.createElement("ul");return c.className=l.entityLinksList,e.forEach(d=>{c.append(this.renderCardEntityLinkItem(t,d))}),s.append(c),o.append(s),[a]}renderCardEntityLinkItem(t,e){var m;const a=document.createElement("li");a.className=l.entityLinkItem;const o=document.createElement("span");o.className=l.entityLinkIcon,o.append(D(Bt(e.entity_type),{size:16}));const r=document.createElement("span");r.className=l.entityLinkContent;const i=document.createElement("span");i.className=l.entityLinkTitle,i.textContent=V(e);const s=document.createElement("span");s.className=l.entityLinkMeta;const c=this.runtime.i18n.t(ut(e.entity_type));s.textContent=(m=e.entity)!=null&&m.status?`${c} - ${e.entity.status}`:c,r.append(i,s);const d=T({icon:"ellipsis-vertical",tone:"text",size:"sm",className:l.entityLinkMenuTriggerButton,ariaLabel:this.runtime.i18n.t("boards.cardLinks.actions",{title:V(e)}),title:this.runtime.i18n.t("boards.cardBack.actions")});return d.setAttribute("aria-haspopup","dialog"),d.setAttribute("aria-expanded","false"),d.setAttribute("data-testid","card-entity-link-menu-button"),d.addEventListener("click",u=>{var h;if(u.stopPropagation(),((h=this.cardEntityLinkMenuPopover)==null?void 0:h.trigger)===d){this.closeCardEntityLinkMenuPopover();return}this.openCardEntityLinkMenuPopover(d,t,e)}),a.append(o,r,d),a}openCardEntityLinkMenuPopover(t,e,a){this.closeCardEntityLinkMenuPopover();const o=F({elevated:!0,className:`${l.entityLinkMenuPopover} hidden`});o.setAttribute("role","dialog"),o.setAttribute("aria-modal","false"),o.setAttribute("aria-label",this.runtime.i18n.t("boards.cardLinks.actions",{title:V(a)})),o.setAttribute("data-testid","card-entity-link-menu-popover"),o.addEventListener("mousedown",s=>s.stopPropagation());const r=document.createElement("ul");r.className=l.entityLinkMenuList,r.append(this.renderCardEntityLinkMenuItem({labelKey:"boards.cardLinks.openAction",ariaLabel:this.runtime.i18n.t("boards.cardLinks.open",{title:V(a)}),icon:"arrow-right",onClick:()=>{this.closeCardEntityLinkMenuPopover(),this.openLinkedEntity(a)}}),this.renderCardEntityLinkMenuItem({labelKey:"boards.cardLinks.unlinkAction",ariaLabel:this.runtime.i18n.t("boards.cardLinks.unlink",{title:V(a)}),icon:"link-slash",onClick:()=>{this.closeCardEntityLinkMenuPopover(),this.unlinkCardEntity(e,a)}}),this.renderCardEntityLinkMenuItem({labelKey:"boards.cardLinks.deleteEntity",ariaLabel:this.runtime.i18n.t("boards.cardLinks.deleteEntityLabel",{title:V(a)}),icon:"trash",danger:!0,onClick:()=>{this.closeCardEntityLinkMenuPopover(),this.deleteLinkedEntity(e,a)}})),o.append(r);let i;i=new O({container:t,panel:o,positioning:"viewport",panelZIndex:320,onOpenChange:s=>{var c;t.setAttribute("aria-expanded",s?"true":"false"),!s&&((c=this.cardEntityLinkMenuPopover)==null?void 0:c.menu)===i&&this.closeCardEntityLinkMenuPopover()}}),i.mount(),this.cardEntityLinkMenuPopover={menu:i,panel:o,trigger:t},i.openAt({anchor:t,placement:"bottom-end",fallbackPlacements:["bottom-start","top-end","top-start"],gap:4,margin:12,lockPlacementAfterOpen:!0})}renderCardEntityLinkMenuItem(t){const e=document.createElement("li");e.className=l.entityLinkMenuItem;const a=C({text:this.runtime.i18n.t(t.labelKey),tone:"text",size:"md",className:t.danger?l.entityLinkMenuDangerButton:l.entityLinkMenuButton,onClick:t.onClick});return a.setAttribute("aria-label",t.ariaLabel),K(a,t.icon),e.append(a),e}async unlinkCardEntity(t,e){await Promise.resolve(this.handlers.onDeleteCardEntityLink(e.id)),await this.refreshOpenCardEntityLinks(t.id)}async deleteLinkedEntity(t,e){await Promise.resolve(this.handlers.onDeleteLinkedEntity(t,e)),await this.refreshOpenCardEntityLinks(t.id)}async createEntityFromCard(t,e){await Promise.resolve(this.handlers.onCreateCardEntityFromCard(t,e)),await this.refreshOpenCardEntityLinks(t.id)}async refreshOpenCardEntityLinks(t){const e=this.activeCardPlacementId&&this.state?this.findCardLocation(this.activeCardPlacementId,this.state):null;!e||e.card.id!==t||this.renderCardModal(e)}openLinkedEntity(t){window.dispatchEvent(new CustomEvent("boardLinkedEntityOpenRequested",{detail:{entityType:t.entity_type,entityId:t.entity_id}}))}openCardEntityLinkModal(t){let e=null;const{overlay:a,container:o,body:r}=nt(this.runtime.i18n.t("boards.cardLinks.linkToEntity"),{zIndex:360,onClose:()=>e==null?void 0:e.remove()});e=a,o.setAttribute("data-testid","card-entity-link-modal");const i=document.createElement("div");i.className=l.entityLinkPicker;const s=document.createElement("label");s.className=l.entityLinkPickerField;const c=document.createElement("span");c.className=l.moveLabel,c.textContent=this.runtime.i18n.t("boards.cardLinks.selectType");const d=document.createElement("select");d.className=l.moveSelect,["task","story","goal"].forEach(A=>{const B=document.createElement("option");B.value=A,B.textContent=this.runtime.i18n.t(ut(A)),d.append(B)}),s.append(c,d);const u=document.createElement("label");u.className=l.entityLinkPickerField;const h=document.createElement("span");h.className=l.moveLabel,h.textContent=this.runtime.i18n.t("boards.cardLinks.search");const b=Y({variant:"default",className:l.entityLinkPickerInput,placeholder:this.runtime.i18n.t("boards.cardLinks.searchPlaceholder"),disabled:!this.entityCatalog});u.append(h,b);const g=document.createElement("div");g.className=l.entityLinkPickerResults,g.setAttribute("data-testid","card-entity-link-results"),i.append(s,u,g),r.append(i),document.body.append(a);let f=this.entityCatalog?"idle":"error",x=[],v=0,$=null;const y=()=>{if(g.replaceChildren(),f==="loading"){g.append(this.createEntityLinkPickerMessage(this.runtime.i18n.t("boards.cardLinks.loading")));return}if(f==="error"){g.append(this.createEntityLinkPickerMessage(this.runtime.i18n.t("boards.cardLinks.loadFailed")));return}if(x.length===0){g.append(this.createEntityLinkPickerMessage(this.runtime.i18n.t("boards.cardLinks.noResults")));return}const A=new Set(Dt(t).map(S=>`${S.entity_type}:${S.entity_id}`)),B=document.createElement("ul");B.className=l.entityLinkPickerList;const L=d.value;x.forEach(S=>{B.append(this.renderEntityLinkPickerResult({card:t,entityType:L,item:S,disabled:A.has(`${L}:${S.id}`),close:()=>a.remove()}))}),g.append(B)},w=async()=>{const A=++v;f="loading",y();try{if(x=await this.searchCardEntityCatalog(d.value,b.value),A!==v)return;f="ready",y()}catch{if(A!==v)return;x=[],f="error",y()}},z=()=>{$!==null&&window.clearTimeout($),$=window.setTimeout(()=>{$=null,w()},180)};d.addEventListener("change",()=>{x=[],w()}),b.addEventListener("input",z),y(),this.entityCatalog&&(w(),b.focus())}createEntityLinkPickerMessage(t){const e=document.createElement("p");return e.className=l.entityLinksMessage,e.textContent=t,e}renderEntityLinkPickerResult(t){const e=document.createElement("li"),a=document.createElement("button");a.type="button",a.className=l.entityLinkPickerButton,a.disabled=t.disabled,a.setAttribute("data-testid","card-entity-link-result"),a.addEventListener("click",async()=>{a.disabled=!0,await Promise.resolve(this.handlers.onCreateCardEntityLink(t.card.id,t.entityType,t.item.id)),t.close(),await this.refreshOpenCardEntityLinks(t.card.id)});const o=D(Bt(t.entityType),{size:16});o.setAttribute("aria-hidden","true");const r=document.createElement("span");r.className=l.entityLinkContent;const i=document.createElement("span");i.className=l.entityLinkTitle,i.textContent=t.item.title;const s=document.createElement("span");return s.className=l.entityLinkMeta,s.textContent=t.item.status?`${this.runtime.i18n.t(ut(t.entityType))} - ${t.item.status}`:this.runtime.i18n.t(ut(t.entityType)),r.append(i,s),a.append(o,r),e.append(a),e}searchCardEntityCatalog(t,e){return this.entityCatalog?t==="task"?this.entityCatalog.searchTasks(e):t==="story"?this.entityCatalog.searchStories(e):this.entityCatalog.searchGoals(e):Promise.resolve([])}renderCardBackChecklistsSection(t){const e=document.createElement("div");return e.className=l.checklistsHost,e.setAttribute("data-testid","card-back-checklists-host"),this.cardModalChecklistHost=e,this.populateCardBackChecklistsHost(t),e}populateCardBackChecklistsHost(t){var i;const e=this.cardModalChecklistHost;if(!e)return;e.replaceChildren();const a=((i=this.cardChecklistPanelState)==null?void 0:i.cardId)===t.id?this.cardChecklistPanelState:null,o=!a||a.status==="idle"&&a.checklists.length===0||a.status==="ready"&&a.checklists.length===0&&!a.error;if(e.hidden=o,o)return;if((a==null?void 0:a.status)==="loading"){const s=this.createCardBackSection("check-box",this.runtime.i18n.t("boards.cardBack.checklist")),c=s.querySelector(`.${l.sectionMain}`),d=document.createElement("div");d.className=l.checklistsMessage,d.textContent=this.runtime.i18n.t("boards.cardBack.checklistsLoading"),c==null||c.append(d),e.append(s);return}if(a!=null&&a.error){const s=this.createCardBackSection("check-box",this.runtime.i18n.t("boards.cardBack.checklist")),c=s.querySelector(`.${l.sectionMain}`),d=st({tone:"error"});d.show(this.runtime.i18n.t(a.error)),c==null||c.append(d.element),e.append(s)}const r=(a==null?void 0:a.checklists)??[];if(r.length>0){const s=document.createElement("div");s.className=l.checklistsList,r.forEach(c=>{s.append(this.renderCardChecklist(t,c))}),e.append(s)}}renderCardChecklist(t,e){const a=e.items.filter(v=>v.state==="complete").length,o=e.items.length,r=o===0?0:Math.round(a/o*100),i=this.hiddenCheckedChecklistIds.has(e.id),s=i?e.items.filter(v=>v.state!=="complete"):e.items,c=document.createElement("div");c.className=l.checklistActions,a>0&&c.append(C({text:i?this.runtime.i18n.t("boards.cardBack.showCheckedItems",{count:a}):this.runtime.i18n.t("boards.cardBack.hideCheckedItems"),tone:"text",size:"md",className:l.checklistActionButton,onClick:()=>this.toggleChecklistCheckedItems(t,e.id)}));const d=C({text:this.runtime.i18n.t("common.delete"),tone:"text",size:"md",className:l.checklistActionButton,onClick:()=>this.deleteCardModalChecklist(t.id,e.id)});d.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.deleteChecklist",{title:e.title})),c.append(d);const m=this.createCardBackSection("check-box",e.title,c);if(m.classList.add(l.checklist),m.setAttribute("data-testid","card-checklist"),!m.querySelector(`.${l.sectionMain}`))return m;const h=document.createElement("div");h.className=l.checklistProgressRow;const b=document.createElement("span");b.className=l.checklistProgress,b.textContent=`${r}%`;const g=document.createElement("div");g.className=l.checklistProgressTrack;const f=document.createElement("span");f.className=l.checklistProgressBar,f.style.width=`${r}%`,g.append(f),h.append(b,g);const x=document.createElement("ul");return x.className=l.checkItemList,s.forEach(v=>{x.append(this.renderCardChecklistItem(t,v))}),m.append(h),m.append(x,this.renderCheckItemComposer(t,e)),m}renderCardChecklistItem(t,e){const a=document.createElement("li");a.className=l.checkItem,a.setAttribute("data-testid","card-check-item");const o=new ye({checked:e.state==="complete",ariaLabel:e.title,className:l.checkItemCheckbox,onChange:s=>{this.patchCardModalCheckItem(t.id,e.id,{state:s?"complete":"incomplete"})}}),r=this.renderCardChecklistItemTitle(t,e),i=T({icon:"ellipsis-vertical",tone:"text",size:"sm",className:l.checkItemMenuTriggerButton,ariaLabel:this.runtime.i18n.t("boards.cardBack.checkItemActions",{title:e.title}),title:this.runtime.i18n.t("boards.cardBack.actions")});return i.setAttribute("aria-haspopup","dialog"),i.setAttribute("aria-expanded","false"),i.setAttribute("data-testid","card-check-item-menu-button"),i.addEventListener("click",s=>{var c;if(s.stopPropagation(),((c=this.cardCheckItemMenuPopover)==null?void 0:c.trigger)===i){this.closeCardCheckItemMenuPopover();return}this.openCardCheckItemMenuPopover(i,t,e)}),a.append(o.getElement(),r,i),a}openCardCheckItemMenuPopover(t,e,a){this.closeCardCheckItemMenuPopover();const o=F({elevated:!0,className:`${l.checkItemMenuPopover} hidden`});o.setAttribute("role","dialog"),o.setAttribute("aria-modal","false"),o.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.checkItemActions",{title:a.title})),o.setAttribute("data-testid","card-check-item-menu-popover"),o.addEventListener("mousedown",d=>d.stopPropagation());const r=document.createElement("ul");r.className=l.checkItemMenuList;const i=document.createElement("li");i.className=l.checkItemMenuItem;const s=C({text:this.runtime.i18n.t("common.delete"),tone:"text",size:"md",className:l.checkItemMenuButton,onClick:()=>{this.closeCardCheckItemMenuPopover(),this.deleteCardModalCheckItem(e.id,a.id)}});s.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.deleteCheckItem",{title:a.title})),K(s,"trash"),i.append(s),r.append(i),o.append(r);let c;c=new O({container:t,panel:o,positioning:"viewport",panelZIndex:320,onOpenChange:d=>{var m;t.setAttribute("aria-expanded",d?"true":"false"),!d&&((m=this.cardCheckItemMenuPopover)==null?void 0:m.menu)===c&&this.closeCardCheckItemMenuPopover()}}),c.mount(),this.cardCheckItemMenuPopover={itemId:a.id,menu:c,panel:o,trigger:t},c.openAt({anchor:t,placement:"bottom-end",fallbackPlacements:["bottom-start","top-end","top-start"],gap:4,margin:12,lockPlacementAfterOpen:!0})}renderCardChecklistItemTitle(t,e){const a=document.createElement("button");return a.type="button",a.className=e.state==="complete"?l.checkItemTitleComplete:l.checkItemTitle,a.textContent=e.title,a.addEventListener("click",()=>{this.startCardChecklistItemTitleEdit(t,e,a)}),a}startCardChecklistItemTitleEdit(t,e,a){const o=document.createElement("input");o.type="text",o.className=l.checkItemTitleInput,o.value=e.title,o.setAttribute("aria-label",e.title);let r=!1;const i=()=>{a.isConnected||o.replaceWith(a)},s=()=>{if(r)return;r=!0;const d=o.value.trim();if(!d||d===e.title){i();return}this.patchCardModalCheckItem(t.id,e.id,{title:d})},c=()=>{r||(r=!0,i())};o.addEventListener("keydown",d=>{d.key==="Enter"&&(d.preventDefault(),s()),d.key==="Escape"&&(d.preventDefault(),c())}),o.addEventListener("blur",s),a.replaceWith(o),window.requestAnimationFrame(()=>{o.focus(),o.select()})}renderCheckItemComposer(t,e){if(!this.expandedCheckItemComposerIds.has(e.id))return C({text:this.runtime.i18n.t("boards.cardBack.checkItemPlaceholder"),tone:"text",size:"md",className:l.checkItemCollapsedComposer,onClick:()=>this.expandCheckItemComposer(t,e.id)});const a=document.createElement("form");a.className=l.checkItemComposer;const o=Y({variant:"default",className:l.checkItemComposerInput,placeholder:this.runtime.i18n.t("boards.cardBack.checkItemPlaceholder")});o.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.checkItemPlaceholder")),o.addEventListener("keydown",m=>{m.key==="Enter"&&(m.preventDefault(),a.requestSubmit()),m.key==="Escape"&&this.collapseCheckItemComposer(t,e.id)});const r=document.createElement("div");r.className=l.checkItemComposerActions;const i=document.createElement("div");i.className=l.checkItemComposerPrimaryActions;const s=C({text:this.runtime.i18n.t("boards.cardBack.addItem"),tone:"primary",size:"md",className:p.primaryButton});s.type="submit";const c=C({text:this.runtime.i18n.t("common.cancel"),tone:"text",size:"md",className:p.quietButton,onClick:()=>this.collapseCheckItemComposer(t,e.id)});c.type="button",i.append(s,c);const d=document.createElement("div");return d.className=l.checkItemComposerMetaActions,d.append(this.createCheckItemMetaButton("plus","boards.cardBack.assign"),this.createCheckItemMetaButton("calendar","boards.cardBack.dueDate")),r.append(i,d),a.addEventListener("submit",m=>{m.preventDefault(),this.createCardModalCheckItem(t.id,e.id,o.value)}),a.append(o,r),window.requestAnimationFrame(()=>o.focus()),a}createCheckItemMetaButton(t,e){const a=C({text:this.runtime.i18n.t(e),tone:"text",size:"md",className:l.checkItemMetaButton,disabled:!0});return K(a,t),a}setCardChecklistPanelState(t){this.cardChecklistPanelState=t;const e=this.activeCardPlacementId&&this.state?this.findCardLocation(this.activeCardPlacementId,this.state):null;(e==null?void 0:e.card.id)===t.cardId&&this.populateCardBackChecklistsHost(e.card)}async loadCardModalChecklists(t){var a;const e=++this.cardChecklistLoadVersion;this.setCardChecklistPanelState({cardId:t,status:"loading",checklists:((a=this.cardChecklistPanelState)==null?void 0:a.cardId)===t?this.cardChecklistPanelState.checklists:[],error:null});try{const o=await Promise.resolve(this.handlers.onLoadCardChecklists(t));if(e!==this.cardChecklistLoadVersion||this.activeCardPlacementId===null)return;this.setCardChecklistPanelState({cardId:t,status:"ready",checklists:o,error:null})}catch{if(e!==this.cardChecklistLoadVersion)return;this.setCardChecklistPanelState({cardId:t,status:"error",checklists:[],error:"boards.cardBack.checklistsLoadFailed"})}}focusCardChecklistComposer(){var e;const t=(e=this.cardChecklistPopover)==null?void 0:e.panel.querySelector("input");t==null||t.focus()}toggleChecklistCheckedItems(t,e){this.hiddenCheckedChecklistIds.has(e)?this.hiddenCheckedChecklistIds.delete(e):this.hiddenCheckedChecklistIds.add(e),this.populateCardBackChecklistsHost(t)}expandCheckItemComposer(t,e){this.expandedCheckItemComposerIds.add(e),this.populateCardBackChecklistsHost(t)}collapseCheckItemComposer(t,e){this.expandedCheckItemComposerIds.delete(e),this.populateCardBackChecklistsHost(t)}async createCardModalChecklist(t,e){const a=(e==null?void 0:e.trim())??"";if(!a){this.focusCardChecklistComposer();return}await this.runCardChecklistMutation(t.id,async()=>{await Promise.resolve(this.handlers.onCreateCardChecklist(t.id,a))}),this.closeCardChecklistPopover()}async deleteCardModalChecklist(t,e){await this.runCardChecklistMutation(t,async()=>{await Promise.resolve(this.handlers.onDeleteCardChecklist(e))})}async createCardModalCheckItem(t,e,a){const o=a.trim();o&&(await this.runCardChecklistMutation(t,async()=>{await Promise.resolve(this.handlers.onCreateCardCheckItem(e,o))}),this.expandedCheckItemComposerIds.delete(e))}async patchCardModalCheckItem(t,e,a){await this.runCardChecklistMutation(t,async()=>{await Promise.resolve(this.handlers.onPatchCardCheckItem(e,a))})}async deleteCardModalCheckItem(t,e){await this.runCardChecklistMutation(t,async()=>{await Promise.resolve(this.handlers.onDeleteCardCheckItem(e))})}async runCardChecklistMutation(t,e){const a=this.cardChecklistPanelState;this.setCardChecklistPanelState({cardId:t,status:"saving",checklists:(a==null?void 0:a.cardId)===t?a.checklists:[],error:null});try{await e(),await this.loadCardModalChecklists(t)}catch{this.setCardChecklistPanelState({cardId:t,status:"error",checklists:(a==null?void 0:a.cardId)===t?a.checklists:[],error:"boards.cardBack.checklistsSaveFailed"})}}renderCardBackDescriptionSection(t,e,a){const o=this.createCardBackSection("document",this.runtime.i18n.t("boards.cardDescriptionLabel")),r=o.querySelector(`.${l.sectionMain}`);if(!r)return o;r.append(a);const i=document.createElement("div");i.className=l.editorActions;const s=C({text:this.runtime.i18n.t("common.save"),tone:"primary",size:"md",className:p.primaryButton,onClick:()=>this.saveCardModal(t,e,a)}),c=()=>{s.disabled=e.value.trim().length===0};return e.addEventListener("input",c),c(),i.append(C({text:this.runtime.i18n.t("common.cancel"),tone:"text",size:"md",className:p.quietButton,onClick:()=>this.closeCardModal()}),s),r.append(i),o}async deleteSharedCardFromQuickEditor(t){await this.deleteSharedCard(t,()=>this.closeQuickCardEditor())}async deleteSharedCardFromDetails(t){await this.deleteSharedCard(t,()=>{this.closeCardActionsPopover(),this.closeCardModal()})}async deleteSharedCard(t,e){await this.confirmSharedCardDeletion()&&(e(),this.handlers.onDeleteCard(t.id))}confirmSharedCardDeletion(){return this.openDeleteCardConfirmationDialog()}openDeleteCardConfirmationDialog(){return new Promise(t=>{let e=!1;const a=b=>{e||(e=!0,t(b))},o=()=>r.remove(),{overlay:r,container:i,body:s,footer:c}=nt(this.runtime.i18n.t("boards.actions.deleteCard"),{intent:"confirm",zIndex:360,onClose:()=>{a(!1),o()}}),d=document.createElement("p");d.className="text-sm leading-relaxed text-slate-600",d.id=`delete-card-confirm-message-${Math.random().toString(36).slice(2,9)}`,d.textContent=this.runtime.i18n.t("boards.cardMirror.deleteSharedConfirm"),i.setAttribute("aria-describedby",d.id),s.append(d);const m=wt({variant:"confirm"}),u=C({text:this.runtime.i18n.t("common.cancel"),tone:"text",size:"md",className:W("default"),onClick:()=>{a(!1),o()}});u.setAttribute("data-testid","delete-card-cancel-button"),m.append(u);const h=C({text:this.runtime.i18n.t("boards.actions.deleteCard"),tone:"destructive",size:"md",className:W("wide"),onClick:()=>{a(!0),o()}});h.setAttribute("data-testid","delete-card-confirm-button"),m.append(h),c.append(m),i.addEventListener("keydown",b=>{b.stopPropagation(),b.key==="Escape"&&(b.preventDefault(),a(!1),o())})})}renderCardBackAttachmentsSection(){const t=this.createCardBackSection("link",this.runtime.i18n.t("boards.cardBack.attachments"),C({text:this.runtime.i18n.t("boards.cardBack.add"),tone:"text",size:"sm",className:p.quietButton,disabled:!0})),e=t.querySelector(`.${l.sectionMain}`);if(!e)return t;const a=document.createElement("div");return a.className=l.placeholderPanel,a.textContent=this.runtime.i18n.t("boards.cardBack.noAttachments"),e.append(a),t}renderCardBackAside(t,e){const a=document.createElement("aside");a.className=l.aside,a.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.comments"));const o=this.createCardBackSection("chat-bubble-left",this.runtime.i18n.t("boards.cardBack.comments"),C({text:this.runtime.i18n.t("boards.cardBack.showDetails"),tone:"text",size:"sm",className:p.quietButton,disabled:!0})),r=o.querySelector(`.${l.sectionMain}`);if(!r)return a;r.append(C({text:this.runtime.i18n.t("boards.cardBack.writeComment"),tone:"text",size:"md",className:l.activityInput,disabled:!0}));const i=document.createElement("ul");i.className=l.activityList;const s=document.createElement("li");s.className=l.activityItem;const c=document.createElement("span");c.className=l.avatar,c.textContent="M",c.setAttribute("aria-hidden","true");const d=document.createElement("span");return d.textContent=this.runtime.i18n.t("boards.cardBack.activityCreated",{board:t.title,column:e.title}),s.append(c,d),i.append(s),r.append(i),a.append(o),a}createCardBackSection(t,e,a){const o=document.createElement("section");o.className=l.section;const r=document.createElement("div");r.className=l.sectionIcon;const i=D(t,{size:20,strokeWidth:2});i.setAttribute("aria-hidden","true"),r.append(i);const s=document.createElement("div");s.className=l.sectionMain;const c=document.createElement("div");c.className=l.sectionHeader;const d=document.createElement("h3");d.className=l.sectionTitle,d.textContent=e;const m=document.createElement("div");return m.className=l.sectionActions,a&&m.append(a),c.append(d,m),s.append(c),o.append(r,s),o}createUnavailableCardBackButton(t,e){const a=C({text:this.runtime.i18n.t(t),tone:"text",size:"md",className:l.quickActionButton,disabled:!0});return K(a,e),a}saveCardModal(t,e,a){const o=e.value.trim();if(!o)return;const r=a.value,i=this.getCardModalDraftTagIds(t),s={};o!==t.title&&(s.title=o),r!==t.description&&(s.description=r);const c=this.cardModalRequestedTagIds??X(t);ae(i,c)||(s.tag_ids=i),this.closeCardModal(),(s.title!==void 0||s.description!==void 0||s.tag_ids!==void 0)&&this.handlers.onPatchCard(t.id,s)}closeCardModal(){var t;this.closeCardActionsPopover(),this.closeCardLabelsPopover(),this.closeCardChecklistPopover(),this.closeCardCheckItemMenuPopover(),this.closeMoveCardPopover(),this.cardModalDraftTagIds=null,this.cardModalRequestedTagIds=null,this.cardModalLabelsHost=null,this.cardModalQuickActionList=null,this.cardModalChecklistHost=null,this.cardChecklistPanelState=null,this.cardChecklistLoadVersion+=1,this.activeCardPlacementId=null,(t=this.cardModalOverlay)==null||t.remove(),this.cardModalOverlay=null}closeCardLabelsPopover(){const t=this.cardLabelsPopover;t&&(this.cardLabelsPopover=null,t.trigger.setAttribute("aria-expanded","false"),t.menu.close(),t.menu.unmount(),t.picker.destroy(),t.panel.remove())}closeCardChecklistPopover(){const t=this.cardChecklistPopover;t&&(this.cardChecklistPopover=null,t.trigger.setAttribute("aria-expanded","false"),t.menu.close(),t.menu.unmount(),t.panel.remove())}closeCardCheckItemMenuPopover(){const t=this.cardCheckItemMenuPopover;t&&(this.cardCheckItemMenuPopover=null,t.trigger.setAttribute("aria-expanded","false"),t.menu.close(),t.menu.unmount(),t.panel.remove())}closeCardEntityLinkMenuPopover(){const t=this.cardEntityLinkMenuPopover;t&&(this.cardEntityLinkMenuPopover=null,t.trigger.setAttribute("aria-expanded","false"),t.menu.close(),t.menu.unmount(),t.panel.remove())}closeMoveCardPopover(){const t=this.moveCardPopover;t&&(this.moveCardPopover=null,t.trigger.setAttribute("aria-expanded","false"),t.menu.close(),t.menu.unmount(),t.panel.remove())}closeCardActionsPopover(){const t=this.cardActionsPopover;t&&(this.cardActionsPopover=null,t.trigger.setAttribute("aria-expanded","false"),t.menu.close(),t.menu.unmount(),t.panel.remove())}closeListActionsPopover(){const t=this.listActionsPopover;t&&(this.listActionsPopover=null,t.trigger.setAttribute("aria-expanded","false"),t.menu.close(),t.menu.unmount(),t.panel.remove())}closeBoardPickerPopover(){const t=this.boardPickerPopover;t&&(this.closeBoardPickerActionsMenu(),this.boardPickerPopover=null,t.trigger.setAttribute("aria-expanded","false"),t.menu.close(),t.menu.unmount(),t.panel.remove())}closeBoardPickerActionsMenu(){var e;const t=(e=this.boardPickerPopover)==null?void 0:e.actionsMenu;t&&(this.boardPickerPopover.actionsMenu=null,t.menu.close(),t.menu.unmount(),t.panel.remove())}closeQuickCardEditor(){var t;(t=this.quickEditorOverlay)==null||t.remove(),this.quickEditorOverlay=null}getSelectedBoard(t){return t.boards.find(e=>e.id===t.selectedBoardId)??t.boards[0]??null}findCardLocation(t,e){for(const a of e.boards)for(const o of a.columns){const r=o.cards.find(i=>j(i)===t);if(r)return{board:a,column:o,card:r,placementId:t}}return null}submitColumnTitle(t){var a;const e=((a=this.columnTitleTextarea)==null?void 0:a.value.trim())??"";e&&(this.handlers.onCreateColumn(t,e),this.columnTitleTextarea&&(this.columnTitleTextarea.value=""),this.isColumnComposerExpanded=!1)}startBoardTitleEdit(t){this.editingBoardTitleId=t,this.rerenderCurrentState()}finishBoardTitleEdit(t,e){var o;if(this.editingBoardTitleId!==t.id)return;const a=((o=this.boardTitleEditInput)==null?void 0:o.value.trim())??"";if(this.editingBoardTitleId=null,this.boardTitleEditInput=null,e&&a.length>0&&a!==t.title){this.handlers.onPatchBoard(t.id,{title:a});return}this.rerenderCurrentState()}startColumnTitleEdit(t){this.editingColumnTitleId=t,this.rerenderCurrentState()}finishColumnTitleEdit(t,e){var o;if(this.editingColumnTitleId!==t.id)return;const a=((o=this.columnTitleEditInput)==null?void 0:o.value.trim())??"";if(this.editingColumnTitleId=null,this.columnTitleEditInput=null,e&&a.length>0&&a!==t.title){this.handlers.onPatchColumn(t.id,{title:a});return}this.rerenderCurrentState()}expandCardComposer(t){this.expandedCardComposerColumnId=t,this.rerenderCurrentState()}collapseCardComposer(){this.expandedCardComposerColumnId=null,this.rerenderCurrentState()}expandColumnComposer(){this.isColumnComposerExpanded=!0,this.rerenderCurrentState()}collapseColumnComposer(){this.isColumnComposerExpanded=!1,this.rerenderCurrentState()}submitCard(t){const e=this.cardDrafts.get(t);if(!e)return;const a=e.title.value.trim();a&&(this.handlers.onCreateCard(t,a,""),e.title.value="",this.expandedCardComposerColumnId=null,this.rerenderCurrentState())}rerenderCurrentState(){this.state&&this.render(this.state)}unmountHeaderMenu(){var t;(t=this.headerMenu)==null||t.unmount(),this.headerMenu=null}}function Lt(n){return{id:n.uuid??String(n.id),title:n.title,status:n.status??null}}function Mt(n){return(n==null?void 0:n.trim())??""}class Ua{constructor(t={}){this.root=null,this.store=null,this.view=null,this.subscriptions=new Ht,this.runtime=t.runtime??$t()}mount(t){if(this.root)return;const e=document.createElement("div");e.dataset.module="boards",e.className="h-full w-full",t.appendChild(e),this.root=e;const a=new we(je.apiUrl),o=new Ee(a),r=new Pe(a),i=new Ie(a),s=new ka(new Me(a)),c=new Wa(e,{runtime:this.runtime,tagCatalog:{loadTags:()=>k(o.getTags()),createTag:(d,m)=>k(o.createTag({title:d,color:m??Ae(d)})),updateTag:(d,m)=>k(o.updateTag(d,m)),deleteTag:async d=>{await k(o.deleteTag(d))}},entityCatalog:{searchTasks:async d=>(await k(o.fetchTasks({search:d,page:1,pageSize:20}))).results.map(Lt),searchStories:async d=>(await k(r.fetchStories({search:d,page:1,pageSize:20}))).results.map(Lt),searchGoals:async d=>(await k(i.searchGoalsForPicker({search:d,page:1,pageSize:20}))).results.map(Lt)},handlers:{onRefresh:()=>void s.load(),onSelectBoard:d=>s.selectBoard(d),onCreateBoard:d=>void s.createBoard(d),onPatchBoard:(d,m)=>void s.patchBoard(d,m),onToggleBoardStar:d=>s.toggleBoardStar(d),onUpdateBoardGroup:(d,m)=>s.updateBoardGroup(d,m),onDeleteBoard:d=>void s.deleteBoard(d),onCreateColumn:(d,m)=>void s.createColumn(d,m),onPatchColumn:(d,m)=>void s.patchColumn(d,m),onDeleteColumn:d=>void s.deleteColumn(d),onCreateCard:(d,m,u)=>void s.createCard(d,m,u),onPatchCard:(d,m)=>void s.patchCard(d,m),onLoadCardChecklists:d=>s.loadCardChecklists(d),onCreateCardChecklist:(d,m)=>s.createCardChecklist(d,m),onDeleteCardChecklist:d=>s.deleteCardChecklist(d),onCreateCardCheckItem:(d,m)=>s.createCardCheckItem(d,m),onPatchCardCheckItem:(d,m)=>s.patchCardCheckItem(d,m),onDeleteCardCheckItem:d=>s.deleteCardCheckItem(d),onCreateCardEntityLink:(d,m,u)=>s.createCardEntityLink(d,m,u),onCreateCardEntityFromCard:async(d,m)=>{if(m==="task"){const h=await k(o.createTask({title:d.title.trim(),description:Mt(d.description),is_standalone:!0}));return s.createCardEntityLink(d.id,m,h.uuid??String(h.id))}if(m==="story"){const h=await k(r.createStory({title:d.title.trim(),description:Mt(d.description)}));return s.createCardEntityLink(d.id,m,h.uuid??String(h.id))}const u=await k(i.createGoal({title:d.title.trim(),description:Mt(d.description)}));return s.createCardEntityLink(d.id,m,u.uuid??String(u.id))},onDeleteCardEntityLink:d=>s.deleteCardEntityLink(d),onDeleteLinkedEntity:async(d,m)=>{m.entity_type==="task"?await k(o.deleteTask(m.entity_id)):m.entity_type==="story"?await k(r.deleteStory(m.entity_id)):await k(i.deleteGoal(m.entity_id)),await s.load()},onCreateCardMirror:(d,m,u)=>void s.createCardMirror(d,m,u),onPatchCardPlacement:(d,m)=>void s.patchCardPlacement(d,m),onDeleteCardPlacement:d=>void s.deleteCardPlacement(d),onDeleteCard:d=>void s.deleteCard(d),onPreviewImport:d=>s.previewImport(d),onExportData:d=>s.exportData(d),onApplyImport:d=>s.applyImport(d)}});this.store=s,this.view=c,this.subscriptions.add(s.state$.subscribe(d=>c.render(d))),s.load()}unmount(){var t,e,a;this.subscriptions.unsubscribe(),this.subscriptions=new Ht,(t=this.view)==null||t.destroy(),this.view=null,(e=this.store)==null||e.destroy(),this.store=null,(a=this.root)==null||a.remove(),this.root=null}}class Ya{constructor(t={}){this.id="boards",this.app=null,this.runtime=t.runtime??$t()}mount(t){if(this.app)return;const e=new Ua({runtime:this.runtime});e.mount(t),this.app=e}unmount(){var t;(t=this.app)==null||t.unmount(),this.app=null}getAiAssistantSnapshot(){return null}}export{Ya as BoardsModule};
