import{m as xe,B as Re,g as k,k as ge,n as Oe,l as R,p as P,q as E,r as He,u as I,v as T,w as se,x as Ke,y as We,z as _,A as Ge,D as ve,E as Qe,F as Ce,C as Ue,G as Xe,I as ye,d as je,H as Ye,e as Ve,T as Ze,J as Je,L as et,M as tt}from"./index-D-OMYOoW.js";function we(l){return Array.isArray(l)?l:l.results}function w(l){return encodeURIComponent(String(l))}function at(l={}){const e=[];return l.card&&e.push(`card=${encodeURIComponent(l.card)}`),l.entity_type&&e.push(`entity_type=${encodeURIComponent(l.entity_type)}`),l.entity_id&&e.push(`entity_id=${encodeURIComponent(l.entity_id)}`),e.length?`?${e.join("&")}`:""}class ot{constructor(e){this.http=e}getBoards(){return this.http.get("/boards/").pipe(xe(we))}createBoard(e){return this.http.post("/boards/",e)}updateBoard(e,t){return this.http.patch(`/boards/${w(e)}/`,t)}deleteBoard(e){return this.http.delete(`/boards/${w(e)}/`)}createColumn(e){return this.http.post("/columns/",e)}updateColumn(e,t){return this.http.patch(`/columns/${w(e)}/`,t)}deleteColumn(e){return this.http.delete(`/columns/${w(e)}/`)}createCard(e){return this.http.post("/cards/",e)}updateCard(e,t){return this.http.patch(`/cards/${w(e)}/`,t)}deleteCard(e){return this.http.delete(`/cards/${w(e)}/`)}getCardChecklists(e){return this.http.get(`/cards/${w(e)}/checklists/`)}createCardChecklist(e,t){return this.http.post(`/cards/${w(e)}/checklists/`,t)}updateCardChecklist(e,t){return this.http.patch(`/card-checklists/${w(e)}/`,t)}deleteCardChecklist(e){return this.http.delete(`/card-checklists/${w(e)}/`)}createCardCheckItem(e,t){return this.http.post(`/card-checklists/${w(e)}/items/`,t)}updateCardCheckItem(e,t){return this.http.patch(`/card-check-items/${w(e)}/`,t)}deleteCardCheckItem(e){return this.http.delete(`/card-check-items/${w(e)}/`)}getCardEntityLinks(e={}){return this.http.get(`/card-entity-links/${at(e)}`).pipe(xe(we))}createCardEntityLink(e){return this.http.post("/card-entity-links/",e)}deleteCardEntityLink(e){return this.http.delete(`/card-entity-links/${w(e)}/`)}createCardPlacement(e){return this.http.post("/card-placements/",e)}updateCardPlacement(e,t){return this.http.patch(`/card-placements/${w(e)}/`,t)}deleteCardPlacement(e){return this.http.delete(`/card-placements/${w(e)}/`)}}function y(l){return l.placement_id??l.id}function Pe(l){const e=l.pos??l.order??0,t=Number(e);return Number.isFinite(t)?t:0}function rt(l,e){return Pe(l)-Pe(e)||y(l).localeCompare(y(e))||l.id.localeCompare(e.id)}const pe="boards-session-selected-board";function qe(l){if(typeof l!="string")return null;const e=l.trim();return e.length>0?e:null}function Ee(l,e){return e!==null&&l.some(t=>t.id===e)}function it(){try{return qe(sessionStorage.getItem(pe))}catch{return null}}function Be(l){try{const e=qe(l);if(e){sessionStorage.setItem(pe,e);return}sessionStorage.removeItem(pe)}catch{}}function nt(l,e){var a;if(Ee(l,e))return e;const t=it();return Ee(l,t)?t:((a=l[0])==null?void 0:a.id)??null}const st=["lastOpenedAt","last_opened_at","lastActivityAt","last_activity_at","updatedAt","updated_at","createdAt","created_at"];function oe(l){const e=l.meta;return e&&typeof e=="object"&&!Array.isArray(e)?e:null}function fe(l){return{...oe(l)??{}}}function dt(l,e){const t=oe(l);if(!t)return!1;for(const a of e){const o=t[a];if(typeof o=="boolean")return o}return!1}function te(l){return dt(l,["favorite","favourite","starred"])}function de(l){const e=oe(l);if(!e)return null;for(const t of st){const a=e[t],o=typeof a=="string"||typeof a=="number"?new Date(a).getTime():null;if(typeof o=="number"&&Number.isFinite(o))return o}return null}function be(l){const e=oe(l);if(!e)return null;const t=e.group;if(t&&typeof t=="object"&&!Array.isArray(t)){const r=t,i=typeof r.id=="string"?r.id.trim():"",n=typeof r.name=="string"?r.name.trim():"";if(i||n)return{id:i||n,name:n||i}}const a=typeof e.groupId=="string"?e.groupId.trim():typeof e.group_id=="string"?e.group_id.trim():"",o=typeof e.groupName=="string"?e.groupName.trim():typeof e.group_name=="string"?e.group_name.trim():"";return!a&&!o?null:{id:a||o,name:o||a}}function ct(l,e){return{...fe(l),favorite:e}}function lt(l,e){return{...fe(l),lastOpenedAt:e}}function mt(l,e){const t=fe(l);if(!e)return delete t.group,delete t.groupId,delete t.groupName,delete t.group_id,delete t.group_name,t;const a=e.id.trim()||e.name.trim(),o=e.name.trim()||e.id.trim();return t.group={id:a,name:o},t.groupId=a,t.groupName=o,t.group_id=a,t.group_name=o,t}function he(l){const e=new Map;return l.forEach(t=>{const a=be(t);!a||e.has(a.id)||e.set(a.id,a)}),Array.from(e.values()).sort((t,a)=>t.name.localeCompare(a.name))}function ut(l,e){const a=l.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"group",o=new Set(he(e).map(n=>n.id));if(!o.has(a))return a;let r=2,i=`${a}-${r}`;for(;o.has(i);)r+=1,i=`${a}-${r}`;return i}const pt={boards:[],selectedBoardId:null,status:"idle",error:null};function Ae(l){const e=Number(l??0);return Number.isFinite(e)?e:0}function bt(l,e){const t=l.pos??l.order??0,a=e.pos??e.order??0;return Ae(t)-Ae(a)||l.id.localeCompare(e.id)}function Le(l){return l.map(e=>({...e,columns:[...e.columns??[]].sort(bt).map(t=>({...t,cards:[...t.cards??[]].sort(rt)}))})).sort((e,t)=>e.id.localeCompare(t.id))}class ht{constructor(e,t={}){this.api=e,this.stateSubject=new Re(pt),this.state$=this.stateSubject.asObservable(),this.boardMetaMutationVersions=new Map,this.now=t.now??(()=>new Date)}get snapshot(){return this.stateSubject.value}destroy(){this.stateSubject.complete()}selectBoard(e){this.snapshot.boards.some(t=>t.id===e)&&(Be(e),this.patchState({selectedBoardId:e,error:null}),this.patchBoardMeta(e,t=>lt(t,this.now().toISOString())))}async load(){this.patchState({status:"loading",error:null});try{await this.reloadPreservingSelection(),this.patchState({status:"idle",error:null})}catch{this.patchState({status:"error",error:"boards.errors.load"})}}async createBoard(e){const t=e.trim();t&&await this.runMutation(async()=>{const a=await k(this.api.createBoard({title:t}));await this.reload(a.id)})}async deleteBoard(e){await this.runMutation(async()=>{await k(this.api.deleteBoard(e)),await this.reload(null)})}async patchBoard(e,t){this.findBoard(e)&&await this.runMutation(async()=>{await k(this.api.updateBoard(e,t)),await this.reload(e)})}toggleBoardStar(e){this.patchBoardMeta(e,t=>ct(t,!te(t)))}updateBoardGroup(e,t){this.patchBoardMeta(e,a=>mt(a,t))}async createColumn(e,t){const a=t.trim();!a||!this.findBoard(e)||await this.runMutation(async()=>{await k(this.api.createColumn({board:e,title:a,position:"end"})),await this.reload(e)})}async deleteColumn(e){await this.runMutation(async()=>{await k(this.api.deleteColumn(e)),await this.reloadPreservingSelection()})}async patchColumn(e,t){this.findColumn(e)&&await this.runMutation(async()=>{await k(this.api.updateColumn(e,t)),await this.reloadPreservingSelection()})}async createCard(e,t,a){const o=t.trim();!o||!this.findColumn(e)||await this.runMutation(async()=>{await k(this.api.createCard({column:e,title:o,description:a.trim(),position:"bottom"})),await this.reloadPreservingSelection()})}async patchCard(e,t){this.findCard(e)&&await this.runMutation(async()=>{await k(this.api.updateCard(e,t)),await this.reloadPreservingSelection()})}async loadCardChecklists(e){if(!this.findCard(e))return[];try{return await k(this.api.getCardChecklists(e))}catch{return this.patchState({error:"boards.errors.load"}),[]}}async createCardChecklist(e,t){const a=t.trim();return!a||!this.findCard(e)?null:this.runMutationResult(async()=>{const o=await k(this.api.createCardChecklist(e,{title:a,position:"bottom"}));return await this.reloadPreservingSelection(),o})}async deleteCardChecklist(e){await this.runMutation(async()=>{await k(this.api.deleteCardChecklist(e)),await this.reloadPreservingSelection()})}async createCardCheckItem(e,t){const a=t.trim();return a?this.runMutationResult(async()=>{const o=await k(this.api.createCardCheckItem(e,{title:a,position:"bottom"}));return await this.reloadPreservingSelection(),o}):null}async patchCardCheckItem(e,t){return this.runMutationResult(async()=>{const a=await k(this.api.updateCardCheckItem(e,t));return await this.reloadPreservingSelection(),a})}async deleteCardCheckItem(e){await this.runMutation(async()=>{await k(this.api.deleteCardCheckItem(e)),await this.reloadPreservingSelection()})}async createCardEntityLink(e,t,a){if(!this.findCard(e))return null;const o={card:e,entity_type:t,entity_id:a};return this.runMutationResult(async()=>{const r=await k(this.api.createCardEntityLink(o));return await this.reloadPreservingSelection(),r})}async deleteCardEntityLink(e){await this.runMutation(async()=>{await k(this.api.deleteCardEntityLink(e)),await this.reloadPreservingSelection()})}async createCardMirror(e,t,a){!this.findCard(e)||!this.findColumn(t)||await this.runMutation(async()=>{await k(this.api.createCardPlacement({card:e,column:t,...a})),await this.reloadPreservingSelection()})}async patchCardPlacement(e,t){this.findCardPlacement(e)&&await this.runMutation(async()=>{await k(this.api.updateCardPlacement(e,t)),await this.reloadPreservingSelection()})}async deleteCardPlacement(e){this.findCardPlacement(e)&&await this.runMutation(async()=>{await k(this.api.deleteCardPlacement(e)),await this.reloadPreservingSelection()})}async deleteCard(e){await this.runMutation(async()=>{await k(this.api.deleteCard(e)),await this.reloadPreservingSelection()})}async runMutation(e){this.patchState({status:"saving",error:null});try{await e(),this.patchState({status:"idle",error:null})}catch{this.patchState({status:"error",error:"boards.errors.save"})}}async runMutationResult(e){this.patchState({status:"saving",error:null});try{const t=await e();return this.patchState({status:"idle",error:null}),t}catch{return this.patchState({status:"error",error:"boards.errors.save"}),null}}async reloadPreservingSelection(){await this.reload(this.snapshot.selectedBoardId)}async reload(e){const t=Le(await k(this.api.getBoards())),a=nt(t,e);Be(a),this.patchState({boards:t,selectedBoardId:a})}findBoard(e){return this.snapshot.boards.find(t=>t.id===e)??null}patchBoardMeta(e,t){const a=this.findBoard(e);if(!a)return;const o=(this.boardMetaMutationVersions.get(e)??0)+1;this.boardMetaMutationVersions.set(e,o);const r=a.meta??null,i=t(a);this.replaceBoardMeta(e,i),k(this.api.updateBoard(e,{meta:i})).then(n=>{this.boardMetaMutationVersions.get(e)===o&&this.replaceBoardMeta(e,n.meta??i)}).catch(()=>{this.boardMetaMutationVersions.get(e)===o&&(this.replaceBoardMeta(e,r),this.patchState({error:"boards.errors.save"}))})}replaceBoardMeta(e,t){this.patchState({boards:Le(this.snapshot.boards.map(a=>a.id===e?{...a,meta:t??null}:a)),error:null})}findColumn(e){for(const t of this.snapshot.boards){const a=t.columns.find(o=>o.id===e);if(a)return a}return null}findCardPlacement(e){for(const t of this.snapshot.boards)for(const a of t.columns){const o=a.cards.find(r=>y(r)===e);if(o)return o}return null}findCard(e){for(const t of this.snapshot.boards)for(const a of t.columns){const o=a.cards.find(r=>r.id===e);if(o)return o}return null}patchState(e){this.stateSubject.next({...this.snapshot,...e})}}function ae(l){return[...new Set([...l].filter(kt))].sort((e,t)=>e-t)}function O(l){var e;return ae(l.tag_ids??((e=l.tags)==null?void 0:e.map(t=>t.id))??[])}function Ie(l,e){const t=ae(l),a=ae(e);return t.length===a.length&&t.every((o,r)=>o===a[r])}function kt(l){return typeof l=="number"&&Number.isFinite(l)}function ze({columnId:l,cards:e,movingPlacementId:t,insertionIndex:a}){const o=e.filter(s=>y(s)!==t),r=Math.max(0,Math.min(a,o.length)),i=r>0?o[r-1]:null,n=r<o.length?o[r]:null,d={column:l};return i&&(d.before_placement=y(i)),n&&(d.after_placement=y(n)),!i&&!n&&(d.position="bottom"),d}function gt(l,e,t){const a=l.filter(p=>y(p)!==e),o=l.findIndex(p=>y(p)===e);if(o<0)return!0;const r=o>0?l[o-1]:null,i=o<l.length-1?l[o+1]:null,n=r?y(r):null,d=i?y(i):null,s=t.before_placement??null,m=t.after_placement??null;return a.length===0?!1:n!==s||d!==m}function ft({columns:l,movingColumnId:e,insertionIndex:t}){const a=l.filter(d=>d.id!==e),o=Math.max(0,Math.min(t,a.length)),r=o>0?a[o-1]:null,i=o<a.length?a[o]:null,n={};return r&&(n.before_column=r.id),i&&(n.after_column=i.id),!r&&!i&&(n.position="end"),n}function _t(l,e,t){const a=l.filter(s=>s.id!==e),o=l.findIndex(s=>s.id===e);if(o<0)return!0;if(a.length===0)return!1;const r=o>0?l[o-1]:null,i=o<l.length-1?l[o+1]:null,n=(r==null?void 0:r.id)??null,d=(i==null?void 0:i.id)??null;return n!==(t.before_column??null)||d!==(t.after_column??null)}const xt=4,Me=44,Te=18;function vt(l){return l.view??window}function Se(l,e){for(const t of l.boards)if(t.columns.some(a=>a.id===e))return t.columns;return null}class Ct{constructor(e){this.options=e,this.pending=null,this.active=null,this.eventWindow=null,this.suppressNextClick=!1,this.mounted=!1,this.handleClick=t=>{this.suppressNextClick&&(this.suppressNextClick=!1,t.preventDefault(),t.stopPropagation())},this.handlePointerDown=t=>{if(t.button!==0||t.isPrimary===!1)return;const a=t.target,o=a==null?void 0:a.closest('[data-board-column-draggable="true"]');if(!o||!this.options.root.contains(o)||a!=null&&a.closest('[data-board-drag-ignore="true"], [data-board-card-draggable="true"], input, textarea, select'))return;const r=o.dataset.boardColumnId,i=this.options.getState();!i||!r||!Se(i,r)||(this.pending={pointerId:t.pointerId,startX:t.clientX,startY:t.clientY,sourceColumnElement:o,columnId:r},this.addWindowListeners(vt(t)))},this.handlePointerMove=t=>{const a=this.pending;if(!a||t.pointerId!==a.pointerId)return;if(!this.active){const r=t.clientX-a.startX,i=t.clientY-a.startY;if(Math.hypot(r,i)<xt)return;this.startDrag(a,t)}const o=this.active;o&&(t.preventDefault(),this.movePreview(o,t.clientX,t.clientY),this.updateDropTarget(o,t.clientX),this.autoScroll(t.clientX))},this.handlePointerUp=t=>{this.pending&&t.pointerId!==this.pending.pointerId||(this.removeWindowListeners(),this.pending=null,this.finishActiveDrag(!0))},this.handlePointerCancel=t=>{this.pending&&t.pointerId!==this.pending.pointerId||this.cancelDrag()},this.handleWindowBlur=()=>{this.cancelDrag()}}mount(){this.mounted||(this.mounted=!0,this.options.root.addEventListener("pointerdown",this.handlePointerDown,!0),this.options.root.addEventListener("click",this.handleClick,!0))}unmount(){this.mounted&&(this.mounted=!1,this.cancelDrag(),this.options.root.removeEventListener("pointerdown",this.handlePointerDown,!0),this.options.root.removeEventListener("click",this.handleClick,!0))}cancelDrag(){this.removeWindowListeners(),this.pending=null,this.finishActiveDrag(!1)}startDrag(e,t){var d,s;const a=this.options.getState(),o=a?Se(a,e.columnId):null;if(!o)return;(s=(d=this.options).onDragStart)==null||s.call(d);const r=e.sourceColumnElement.getBoundingClientRect(),i=e.sourceColumnElement.cloneNode(!0);i.classList.add("majom-boards__column-drag-preview"),i.style.width=`${r.width}px`,i.style.height=`${r.height}px`,i.style.left=`${r.left}px`,i.style.top=`${r.top}px`;const n=document.createElement("div");n.className="majom-boards__column-drag-placeholder",n.style.width=`${r.width}px`,n.style.height=`${r.height}px`,e.sourceColumnElement.classList.add("is-dragging"),document.body.append(i),this.active={...e,offsetX:t.clientX-r.left,offsetY:t.clientY-r.top,preview:i,placeholder:n,sourceColumns:o,target:null},this.options.root.classList.add("is-column-dragging"),this.movePreview(this.active,t.clientX,t.clientY),this.updateDropTarget(this.active,t.clientX)}movePreview(e,t,a){e.preview.style.left=`${t-e.offsetX}px`,e.preview.style.top=`${a-e.offsetY}px`}updateDropTarget(e,t){const a=this.resolveInsertionIndex(e.columnId,t);if(e.target=ft({columns:e.sourceColumns,movingColumnId:e.columnId,insertionIndex:a}),!this.hasActiveTargetChanged(e)){e.placeholder.remove();return}this.placePlaceholder(e,a)}hasActiveTargetChanged(e){return!!(e.target&&_t(e.sourceColumns,e.columnId,e.target))}resolveInsertionIndex(e,t){const a=Array.from(this.options.root.querySelectorAll('[data-board-column-draggable="true"]')).filter(r=>r.dataset.boardColumnId!==e),o=a.findIndex(r=>{const i=r.getBoundingClientRect();return t<i.left+i.width/2});return o>=0?o:a.length}placePlaceholder(e,t){const a=this.options.root.querySelector('[data-board-canvas="true"]');if(!a)return;const o=Array.from(a.querySelectorAll('[data-board-column-draggable="true"]')).filter(i=>i.dataset.boardColumnId!==e.columnId),r=a.querySelector('[data-board-column-composer="true"]');a.insertBefore(e.placeholder,o[t]??r??null)}autoScroll(e){const t=this.options.root.querySelector('[data-board-canvas="true"]');if(!t)return;const a=t.getBoundingClientRect();e<a.left+Me?t.scrollLeft-=Te:e>a.right-Me&&(t.scrollLeft+=Te)}finishActiveDrag(e){const t=this.active;t&&(this.active=null,t.preview.remove(),t.placeholder.remove(),t.sourceColumnElement.classList.remove("is-dragging"),this.options.root.classList.remove("is-column-dragging"),this.suppressNextClick=!0,e&&this.hasActiveTargetChanged(t)&&this.options.onDrop(t.columnId,t.target))}addWindowListeners(e){this.eventWindow=e,e.addEventListener("pointermove",this.handlePointerMove,!0),e.addEventListener("pointerup",this.handlePointerUp,!0),e.addEventListener("pointercancel",this.handlePointerCancel,!0),e.addEventListener("blur",this.handleWindowBlur,!0)}removeWindowListeners(){const e=this.eventWindow??window;this.eventWindow=null,e.removeEventListener("pointermove",this.handlePointerMove,!0),e.removeEventListener("pointerup",this.handlePointerUp,!0),e.removeEventListener("pointercancel",this.handlePointerCancel,!0),e.removeEventListener("blur",this.handleWindowBlur,!0)}}const yt=4,Y=44,V=18;function jt(l){return l.view??window}function Ne(l,e){for(const t of l.boards){const a=t.columns.find(o=>o.id===e);if(a)return a.cards}return null}function wt(l,e){for(const t of l.boards)for(const a of t.columns)if(a.cards.some(o=>y(o)===e))return a.id;return null}class Pt{constructor(e){this.options=e,this.pending=null,this.active=null,this.eventWindow=null,this.suppressNextClick=!1,this.mounted=!1,this.handleClick=t=>{this.suppressNextClick&&(this.suppressNextClick=!1,t.preventDefault(),t.stopPropagation())},this.handlePointerDown=t=>{if(t.button!==0||t.isPrimary===!1)return;const a=t.target,o=a==null?void 0:a.closest('[data-board-card-draggable="true"]');if(!o||!this.options.root.contains(o)||a!=null&&a.closest('[data-board-drag-ignore="true"], input, textarea, select'))return;const r=o.dataset.boardCardPlacementId,i=this.options.getState();if(!i||!r)return;const n=wt(i,r);n!==null&&(this.pending={pointerId:t.pointerId,startX:t.clientX,startY:t.clientY,sourceCardElement:o,placementId:r,sourceColumnId:n},this.addWindowListeners(jt(t)))},this.handlePointerMove=t=>{const a=this.pending;if(!a||t.pointerId!==a.pointerId)return;if(!this.active){const r=t.clientX-a.startX,i=t.clientY-a.startY;if(Math.hypot(r,i)<yt)return;this.startDrag(a,t)}const o=this.active;o&&(t.preventDefault(),this.movePreview(o,t.clientX,t.clientY),this.updateDropTarget(o,t.clientX,t.clientY),this.autoScroll(t.clientX,t.clientY))},this.handlePointerUp=t=>{this.pending&&t.pointerId!==this.pending.pointerId||(this.removeWindowListeners(),this.pending=null,this.finishActiveDrag(!0))},this.handlePointerCancel=t=>{this.pending&&t.pointerId!==this.pending.pointerId||this.cancelDrag()},this.handleWindowBlur=()=>{this.cancelDrag()}}mount(){this.mounted||(this.mounted=!0,this.options.root.addEventListener("pointerdown",this.handlePointerDown,!0),this.options.root.addEventListener("click",this.handleClick,!0))}unmount(){this.mounted&&(this.mounted=!1,this.cancelDrag(),this.options.root.removeEventListener("pointerdown",this.handlePointerDown,!0),this.options.root.removeEventListener("click",this.handleClick,!0))}cancelDrag(){this.removeWindowListeners(),this.pending=null,this.finishActiveDrag(!1)}startDrag(e,t){var d,s;const a=this.options.getState();if(!a)return;const o=Ne(a,e.sourceColumnId);if(!o)return;(s=(d=this.options).onDragStart)==null||s.call(d);const r=e.sourceCardElement.getBoundingClientRect(),i=e.sourceCardElement.cloneNode(!0);i.classList.add("majom-boards__card-drag-preview"),i.style.width=`${r.width}px`,i.style.height=`${r.height}px`,i.style.left=`${r.left}px`,i.style.top=`${r.top}px`;const n=document.createElement("div");n.className="majom-boards__card-drag-placeholder",n.style.height=`${r.height}px`,e.sourceCardElement.classList.add("is-dragging"),document.body.append(i),this.active={...e,offsetX:t.clientX-r.left,offsetY:t.clientY-r.top,preview:i,placeholder:n,sourceColumnCards:o,targetColumnId:null,target:null},this.options.root.classList.add("is-card-dragging"),this.movePreview(this.active,t.clientX,t.clientY),this.updateDropTarget(this.active,t.clientX,t.clientY)}movePreview(e,t,a){e.preview.style.left=`${t-e.offsetX}px`,e.preview.style.top=`${a-e.offsetY}px`}updateDropTarget(e,t,a){const o=this.options.getState();if(!o)return;const r=this.findTargetColumn(t);if(!r)return;const i=r.dataset.boardColumnId;if(!i)return;const n=Ne(o,i),d=r.querySelector('[data-board-cards-container="true"]');if(!n||!d)return;const s=this.resolveInsertionIndex(r,e.placementId,a);if(e.targetColumnId=i,e.target=ze({columnId:i,cards:n,movingPlacementId:e.placementId,insertionIndex:s}),!this.hasActiveTargetChanged(e)){e.placeholder.remove();return}this.placePlaceholder(d,e,s)}hasActiveTargetChanged(e){return!e.target||e.targetColumnId===null?!1:!(e.targetColumnId===e.sourceColumnId)||gt(e.sourceColumnCards,e.placementId,e.target)}findTargetColumn(e){const t=Array.from(this.options.root.querySelectorAll("[data-board-column-id]"));if(t.length===0)return null;const a=t.find(o=>{const r=o.getBoundingClientRect();return e>=r.left&&e<=r.right});return a||t.reduce((o,r)=>{if(!o)return r;const i=r.getBoundingClientRect(),n=o.getBoundingClientRect(),d=Math.abs(e-(i.left+i.width/2)),s=Math.abs(e-(n.left+n.width/2));return d<s?r:o},null)}resolveInsertionIndex(e,t,a){const o=Array.from(e.querySelectorAll("[data-board-card-placement-id]")).filter(i=>i.dataset.boardCardPlacementId!==t),r=o.findIndex(i=>{const n=i.getBoundingClientRect();return a<n.top+n.height/2});return r>=0?r:o.length}placePlaceholder(e,t,a){const r=Array.from(e.querySelectorAll("[data-board-card-placement-id]")).filter(i=>i.dataset.boardCardPlacementId!==t.placementId)[a]??null;e.insertBefore(t.placeholder,r)}autoScroll(e,t){const a=this.options.root.querySelector('[data-board-canvas="true"]');if(a){const d=a.getBoundingClientRect();e<d.left+Y?a.scrollLeft-=V:e>d.right-Y&&(a.scrollLeft+=V)}const o=this.active;if(!(o!=null&&o.targetColumnId))return;const r=Array.from(this.options.root.querySelectorAll("[data-board-column-id]")).find(d=>d.dataset.boardColumnId===o.targetColumnId),i=r==null?void 0:r.querySelector('[data-board-cards-container="true"]');if(!i)return;const n=i.getBoundingClientRect();t<n.top+Y?i.scrollTop-=V:t>n.bottom-Y&&(i.scrollTop+=V)}finishActiveDrag(e){const t=this.active;t&&(this.active=null,t.preview.remove(),t.placeholder.remove(),t.sourceCardElement.classList.remove("is-dragging"),this.options.root.classList.remove("is-card-dragging"),this.suppressNextClick=!0,!(!e||!t.target||t.targetColumnId===null)&&this.hasActiveTargetChanged(t)&&this.options.onDrop(t.placementId,t.target))}addWindowListeners(e){this.eventWindow=e,e.addEventListener("pointermove",this.handlePointerMove,!0),e.addEventListener("pointerup",this.handlePointerUp,!0),e.addEventListener("pointercancel",this.handlePointerCancel,!0),e.addEventListener("blur",this.handleWindowBlur,!0)}removeWindowListeners(){const e=this.eventWindow??window;this.eventWindow=null,e.removeEventListener("pointermove",this.handlePointerMove,!0),e.removeEventListener("pointerup",this.handlePointerUp,!0),e.removeEventListener("pointercancel",this.handlePointerCancel,!0),e.removeEventListener("blur",this.handleWindowBlur,!0)}}const De="majom-boards-view-styles",u={root:"majom-boards",shell:"majom-boards__shell",header:"majom-boards__header",titleBlock:"majom-boards__title-block",titleRow:"majom-boards__title-row",title:"majom-boards__title",titleButton:"majom-boards__title-button",titleEditInput:"majom-boards__title-edit-input",boardPickerButton:"majom-boards__board-picker-button",boardPickerButtonContent:"majom-boards__board-picker-button-content",headerActions:"majom-boards__header-actions",headerMenuButton:"majom-boards__header-menu-button",boardPickerPopover:"majom-boards-board-picker",boardPickerSearchWrap:"majom-boards-board-picker__search-wrap",boardPickerSearchIcon:"majom-boards-board-picker__search-icon",boardPickerSearchInput:"majom-boards-board-picker__search-input",boardPickerChips:"majom-boards-board-picker__chips",boardPickerChip:"majom-boards-board-picker__chip",boardPickerChipSelected:"majom-boards-board-picker__chip is-selected",boardPickerSections:"majom-boards-board-picker__sections",boardPickerSection:"majom-boards-board-picker__section",boardPickerSectionTitle:"majom-boards-board-picker__section-title",boardPickerSectionToggle:"majom-boards-board-picker__section-toggle",boardPickerSectionIconCollapsed:"majom-boards-board-picker__section-icon--collapsed",boardPickerGrid:"majom-boards-board-picker__grid",boardPickerCard:"majom-boards-board-picker__card",boardPickerCardSelected:"majom-boards-board-picker__card is-selected",boardPickerCardButton:"majom-boards-board-picker__card-button",boardPickerCreateCard:"majom-boards-board-picker__create-card",boardPickerStarButton:"majom-boards-board-picker__star-button",boardPickerStarButtonActive:"majom-boards-board-picker__star-button is-active",boardPickerActionsButton:"majom-boards-board-picker__actions-button",boardPickerActionsMenu:"majom-boards-board-picker-actions",boardPickerActionsInputRow:"majom-boards-board-picker-actions__input-row",boardPickerActionsInput:"majom-boards-board-picker-actions__input",boardPickerCover:"majom-boards-board-picker__cover",boardPickerCoverA:"majom-boards-board-picker__cover--a",boardPickerCoverB:"majom-boards-board-picker__cover--b",boardPickerCoverC:"majom-boards-board-picker__cover--c",boardPickerCoverD:"majom-boards-board-picker__cover--d",boardPickerCoverE:"majom-boards-board-picker__cover--e",boardPickerCoverF:"majom-boards-board-picker__cover--f",boardPickerCoverInitial:"majom-boards-board-picker__cover-initial",boardPickerCardTitle:"majom-boards-board-picker__card-title",boardPickerEmpty:"majom-boards-board-picker__empty",primaryButton:"majom-boards__button majom-boards__button--primary",quietButton:"majom-boards__button majom-boards__button--quiet",iconButton:"majom-boards__icon-button",body:"majom-boards__body",canvas:"majom-boards__canvas",column:"majom-boards__column",columnHeader:"majom-boards__column-header",columnTitleButton:"majom-boards__column-title-button",columnTitleInput:"majom-boards__column-title-input",columnTitle:"majom-boards__column-title",columnMenuButton:"majom-boards__column-menu-button",cards:"majom-boards__cards",card:"majom-boards__card",cardCompleted:"majom-boards__card is-complete",cardMirror:"majom-boards__card--mirror",cardOpenButton:"majom-boards__card-open",cardCompleteToggle:"majom-boards__card-complete-toggle",cardCompleteToggleCompleted:"majom-boards__card-complete-toggle is-complete",cardSourceLabel:"majom-boards__card-source-label",cardTags:"majom-boards__card-tags",cardTag:"majom-boards__card-tag",cardTitle:"majom-boards__card-title",cardBadges:"majom-boards__card-badges",cardBadgePlain:"majom-boards__card-badge majom-boards__card-badge--plain",cardBadgeNeutral:"majom-boards__card-badge majom-boards__card-badge--neutral",cardBadgeTask:"majom-boards__card-badge majom-boards__card-badge--task",cardBadgeStory:"majom-boards__card-badge majom-boards__card-badge--story",cardBadgeGoal:"majom-boards__card-badge majom-boards__card-badge--goal",cardComposer:"majom-boards__card-composer",cardComposerCollapsed:"majom-boards__card-composer-collapsed",cardComposerExpanded:"majom-boards__card-composer-expanded",cardComposerTextarea:"majom-boards__card-composer-textarea",composerActions:"majom-boards__composer-actions",composerCancelButton:"majom-boards__composer-cancel",columnComposerCollapsedPanel:"majom-boards__column-composer majom-boards__column-composer--collapsed",columnComposerExpandedPanel:"majom-boards__column-composer majom-boards__column-composer--expanded",columnComposerCollapsed:"majom-boards__column-composer-collapsed",columnComposerExpanded:"majom-boards__column-composer-expanded",listComposerTextarea:"majom-boards__list-composer-textarea",empty:"majom-boards__empty",emptyContent:"majom-boards__empty-content",emptyTitle:"majom-boards__empty-title",emptyCopy:"majom-boards__empty-copy",messageWrapper:"majom-boards__message-wrapper",messageLabel:"majom-boards__message-label"},c={container:"majom-boards-modal",body:"majom-boards-modal__body",cardBack:"majom-boards-cardback",hiddenShellPart:"majom-boards-cardback__hidden-shell-part",topbar:"majom-boards-cardback__topbar",topbarStart:"majom-boards-cardback__topbar-start",listBadge:"majom-boards-cardback__list-badge",sourceLabel:"majom-boards-cardback__source-label",movePopover:"majom-boards-cardback__move-popover",movePopoverHeader:"majom-boards-cardback__move-popover-header",movePopoverTitle:"majom-boards-cardback__move-popover-title",movePopoverBody:"majom-boards-cardback__move-popover-body",movePopoverContent:"majom-boards-cardback__move-popover-content",moveTabs:"majom-boards-cardback__move-tabs",moveTab:"majom-boards-cardback__move-tab",moveTabSelected:"majom-boards-cardback__move-tab is-selected",moveSectionTitle:"majom-boards-cardback__move-section-title",moveFields:"majom-boards-cardback__move-fields",moveField:"majom-boards-cardback__move-field",moveLabel:"majom-boards-cardback__move-label",moveSelect:"majom-boards-cardback__move-select",moveActions:"majom-boards-cardback__move-actions",moveButton:"majom-boards-cardback__move-button",listActionsPopover:"majom-boards-list-actions",listActionsHeader:"majom-boards-list-actions__header",listActionsTitle:"majom-boards-list-actions__title",listActionsBody:"majom-boards-list-actions__body",listActionsList:"majom-boards-list-actions__list",listActionsItem:"majom-boards-list-actions__item",listActionsButton:"majom-boards-list-actions__button",listActionsDivider:"majom-boards-list-actions__divider",listActionsSection:"majom-boards-list-actions__section",listActionsSectionButton:"majom-boards-list-actions__section-button",listActionsUpgrade:"majom-boards-list-actions__upgrade",listActionsUpgradeTitle:"majom-boards-list-actions__upgrade-title",listActionsUpgradeCopy:"majom-boards-list-actions__upgrade-copy",cardActionsPopover:"majom-boards-card-actions",cardActionsBody:"majom-boards-card-actions__body",cardActionsList:"majom-boards-card-actions__list",cardActionsItem:"majom-boards-card-actions__item",cardActionsButton:"majom-boards-card-actions__button",cardActionsDivider:"majom-boards-card-actions__divider",topbarActions:"majom-boards-cardback__topbar-actions",iconButton:"majom-boards-cardback__icon-button",layout:"majom-boards-cardback__layout",main:"majom-boards-cardback__main",aside:"majom-boards-cardback__aside",section:"majom-boards-cardback__section",sectionIcon:"majom-boards-cardback__section-icon",sectionMain:"majom-boards-cardback__section-main",sectionHeader:"majom-boards-cardback__section-header",sectionTitle:"majom-boards-cardback__section-title",sectionActions:"majom-boards-cardback__section-actions",titleSection:"majom-boards-cardback__title-section",doneButton:"majom-boards-cardback__done-button",doneButtonCompleted:"majom-boards-cardback__done-button is-complete",titleEditor:"majom-boards-cardback__title-editor",quickActions:"majom-boards-cardback__quick-actions",quickActionList:"majom-boards-cardback__quick-action-list",quickActionButton:"majom-boards-cardback__quick-action-button",labelsHost:"majom-boards-cardback__labels-host",labelsSection:"majom-boards-cardback__labels-section",labelsTitle:"majom-boards-cardback__labels-title",labelsList:"majom-boards-cardback__labels-list",labelSwatch:"majom-boards-cardback__label-swatch",labelAddButton:"majom-boards-cardback__label-add-button",labelPickerPopover:"majom-boards-cardback__label-picker-popover",entityLinksHost:"majom-boards-cardback__entity-links-host",entityLinksMessage:"majom-boards-cardback__entity-links-message",entityLinksList:"majom-boards-cardback__entity-links-list",entityLinkItem:"majom-boards-cardback__entity-link-item",entityLinkIcon:"majom-boards-cardback__entity-link-icon",entityLinkContent:"majom-boards-cardback__entity-link-content",entityLinkTitle:"majom-boards-cardback__entity-link-title",entityLinkMeta:"majom-boards-cardback__entity-link-meta",entityLinkMenuTriggerButton:"majom-boards-cardback__entity-link-menu-trigger",entityLinkMenuPopover:"majom-boards-cardback__entity-link-menu",entityLinkMenuList:"majom-boards-cardback__entity-link-menu-list",entityLinkMenuItem:"majom-boards-cardback__entity-link-menu-item",entityLinkMenuButton:"majom-boards-cardback__entity-link-menu-button",entityLinkMenuDangerButton:"majom-boards-cardback__entity-link-menu-button majom-boards-cardback__entity-link-menu-button--danger",entityLinkPicker:"majom-boards-cardback__entity-link-picker",entityLinkPickerField:"majom-boards-cardback__entity-link-picker-field",entityLinkPickerInput:"majom-boards-cardback__entity-link-picker-input",entityLinkPickerResults:"majom-boards-cardback__entity-link-picker-results",entityLinkPickerList:"majom-boards-cardback__entity-link-picker-list",entityLinkPickerButton:"majom-boards-cardback__entity-link-picker-button",checklistPopover:"majom-boards-cardback__checklist-popover",checklistPopoverHeader:"majom-boards-cardback__checklist-popover-header",checklistPopoverTitle:"majom-boards-cardback__checklist-popover-title",checklistPopoverClose:"majom-boards-cardback__checklist-popover-close",checklistPopoverForm:"majom-boards-cardback__checklist-popover-form",checklistPopoverLabel:"majom-boards-cardback__checklist-popover-label",checklistPopoverInput:"majom-boards-cardback__checklist-popover-input",checklistPopoverActions:"majom-boards-cardback__checklist-popover-actions",checklistPopoverSubmit:"majom-boards-cardback__checklist-popover-submit",checklistsHost:"majom-boards-cardback__checklists-host",checklistsMessage:"majom-boards-cardback__checklists-message",checklistsList:"majom-boards-cardback__checklists-list",checklist:"majom-boards-cardback__checklist",checklistActions:"majom-boards-cardback__checklist-actions",checklistActionButton:"majom-boards-cardback__checklist-action-button",checklistProgressRow:"majom-boards-cardback__checklist-progress-row",checklistProgress:"majom-boards-cardback__checklist-progress",checklistProgressTrack:"majom-boards-cardback__checklist-progress-track",checklistProgressBar:"majom-boards-cardback__checklist-progress-bar",checkItemList:"majom-boards-cardback__checkitem-list",checkItem:"majom-boards-cardback__checkitem",checkItemCheckbox:"majom-boards-cardback__checkitem-checkbox",checkItemTitle:"majom-boards-cardback__checkitem-title",checkItemTitleComplete:"majom-boards-cardback__checkitem-title is-complete",checkItemTitleInput:"majom-boards-cardback__checkitem-title-input",checkItemMenuTriggerButton:"majom-boards-cardback__checkitem-menu-trigger",checkItemMenuPopover:"majom-boards-cardback__checkitem-menu",checkItemMenuList:"majom-boards-cardback__checkitem-menu-list",checkItemMenuItem:"majom-boards-cardback__checkitem-menu-item",checkItemMenuButton:"majom-boards-cardback__checkitem-menu-button",checkItemCollapsedComposer:"majom-boards-cardback__checkitem-collapsed-composer",checkItemComposer:"majom-boards-cardback__checkitem-composer",checkItemComposerInput:"majom-boards-cardback__checkitem-composer-input",checkItemComposerActions:"majom-boards-cardback__checkitem-composer-actions",checkItemComposerPrimaryActions:"majom-boards-cardback__checkitem-composer-primary-actions",checkItemComposerMetaActions:"majom-boards-cardback__checkitem-composer-meta-actions",checkItemMetaButton:"majom-boards-cardback__checkitem-meta-button",descriptionEditor:"majom-boards-cardback__description-editor",placeholderPanel:"majom-boards-cardback__placeholder-panel",editorActions:"majom-boards-cardback__editor-actions",activityInput:"majom-boards-cardback__activity-input",activityList:"majom-boards-cardback__activity-list",activityItem:"majom-boards-cardback__activity-item",avatar:"majom-boards-cardback__avatar",quickEditorOverlay:"majom-boards-quick-editor-overlay",quickEditor:"majom-boards-quick-editor",quickEditorForm:"majom-boards-quick-editor__form",quickEditorCard:"majom-boards-quick-editor__card",quickEditorCardMirror:"majom-boards-quick-editor__card--mirror",quickEditorCardInner:"majom-boards-quick-editor__card-inner",quickEditorTitle:"majom-boards-quick-editor__title",quickEditorSave:"majom-boards-quick-editor__save",quickEditorActions:"majom-boards-quick-editor__actions",quickEditorButtons:"majom-boards-quick-editor__buttons",quickEditorButton:"majom-boards-quick-editor__button",quickEditorDangerItem:"majom-boards-quick-editor__danger-item",quickEditorDangerButton:"majom-boards-quick-editor__button--danger"},Et=`
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
  .majom-boards-modal__description {
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
`;function Bt(){if(typeof document>"u"||document.getElementById(De))return;const l=document.createElement("style");l.id=De,l.textContent=Et,document.head.appendChild(l)}const At=1,Lt=16384,ce=[u.boardPickerCoverA,u.boardPickerCoverB,u.boardPickerCoverC,u.boardPickerCoverD,u.boardPickerCoverE,u.boardPickerCoverF],It={starred:!1,yourBoards:!1},Mt={formWidth:256,actionsWidth:220,actionsGap:8,viewportMargin:12,minVisibleHeight:220};function Q(l){return l.mirror_source!=null}function Z(l){return l.completedAt!=null}function D(l,e){const t=l.textContent??"";l.textContent="";const a=E(e,{size:16,strokeWidth:2});a.setAttribute("aria-hidden","true");const o=document.createElement("span");o.textContent=t,l.append(a,o)}function Tt(l,e,t){const a=l.getButtonElement();a.className=u.headerMenuButton;const o=E(e,{size:16,strokeWidth:2});o.setAttribute("aria-hidden","true"),a.replaceChildren(o),a.title=t,a.setAttribute("aria-label",t)}function St(l,e){const t=l.getButtonElement();t.classList.remove("!bg-slate-100","!text-slate-800"),t.dataset.boardsHeaderMenuOpen=e?"true":"false"}function Nt(l){var a;const e=l,t=e.commentsCount??e.commentCount??e.comments_count??((a=e.comments)==null?void 0:a.length)??0;return Number.isFinite(t)&&t>0?t:0}function J(l){return{id:l.id,title:l.title,color:l.color}}function Dt(l){const e=Array.from(l.id).reduce((t,a)=>t+a.charCodeAt(0),0);return ce[e%ce.length]??ce[0]}function qt(l){return l.title.trim().charAt(0)||"?"}function zt(l){const e=l.trim().replace(/^#/,"");if(!/^[0-9a-f]{6}$/i.test(e))return"#172b4d";const t=parseInt(e.slice(0,2),16),a=parseInt(e.slice(2,4),16),o=parseInt(e.slice(4,6),16);return(.299*t+.587*a+.114*o)/255>.58?"#172b4d":"#ffffff"}function Ft(l){const e=l.checklist_summary,t=Number((e==null?void 0:e.total)??0),a=Number((e==null?void 0:e.completed)??0);return{total:Number.isFinite(t)?t:0,completed:Number.isFinite(a)?a:0}}function ke(l){return l.entity_links??[]}function $t(l){return ke(l).reduce((e,t)=>(e[t.entity_type]+=1,e),{task:0,story:0,goal:0})}function le(l){return l==="task"?"check-box":l==="story"?"bookmark":"goal-circle"}function ee(l){return l==="task"?"boards.cardLinks.task":l==="story"?"boards.cardLinks.story":"boards.cardLinks.goal"}function H(l){var e,t;return((t=(e=l.entity)==null?void 0:e.title)==null?void 0:t.trim())||l.entity_id}class Rt{constructor(e,t){this.root=e,this.state=null,this.columnTitleTextarea=null,this.expandedCardComposerColumnId=null,this.isColumnComposerExpanded=!1,this.editingBoardTitleId=null,this.boardTitleEditInput=null,this.editingColumnTitleId=null,this.columnTitleEditInput=null,this.headerMenu=null,this.boardPickerPopover=null,this.quickEditorOverlay=null,this.activeCardPlacementId=null,this.cardModalOverlay=null,this.moveCardPopover=null,this.listActionsPopover=null,this.cardActionsPopover=null,this.cardLabelsPopover=null,this.cardChecklistPopover=null,this.cardCheckItemMenuPopover=null,this.cardEntityLinkMenuPopover=null,this.cardModalDraftTagIds=null,this.cardModalRequestedTagIds=null,this.cardModalLabelsHost=null,this.cardModalQuickActionList=null,this.cardModalChecklistHost=null,this.cardChecklistPanelState=null,this.cardChecklistLoadVersion=0,this.hiddenCheckedChecklistIds=new Set,this.expandedCheckItemComposerIds=new Set,this.tagItems=[],this.tagCatalogStatus="idle",this.lastNotifiedErrorKey=null,this.cardDrafts=new Map,Bt(),this.runtime=t.runtime??ge(),this.tagCatalog=t.tagCatalog??null,this.entityCatalog=t.entityCatalog??null,this.handlers=t.handlers,this.dragController=new Pt({root:this.root,getState:()=>this.state,onDrop:(a,o)=>this.handlers.onPatchCardPlacement(a,o),onDragStart:()=>this.closeTransientBoardOverlays()}),this.columnDragController=new Ct({root:this.root,getState:()=>this.state,onDrop:(a,o)=>this.handlers.onPatchColumn(a,o),onDragStart:()=>this.closeTransientBoardOverlays()}),this.dragController.mount(),this.columnDragController.mount(),this.disposeRuntimeSubscription=this.runtime.subscribe(()=>this.refreshFromRuntime(),{emitCurrent:!1}),this.root.className=u.root}render(e){const t=this.boardPickerPopover?{...this.boardPickerPopover.viewState,collapsedSections:{...this.boardPickerPopover.viewState.collapsedSections}}:null;this.state=e,this.notifyStateError(e.error),this.ensureTagCatalogLoaded(),this.dragController.cancelDrag(),this.columnDragController.cancelDrag(),this.cardDrafts.clear(),this.unmountHeaderMenu(),this.closeBoardPickerPopover(),this.closeListActionsPopover(),this.closeCardActionsPopover(),this.closeMoveCardPopover(),this.closeCardChecklistPopover(),this.closeCardCheckItemMenuPopover(),this.closeCardEntityLinkMenuPopover(),this.closeQuickCardEditor(),this.root.replaceChildren(this.renderShell(e)),this.syncCardModal(e),t&&requestAnimationFrame(()=>{const a=this.root.querySelector('[data-testid="board-picker-button"]');a&&!a.disabled&&this.openBoardPickerPopover(a,e,t)})}destroy(){this.disposeRuntimeSubscription(),this.dragController.unmount(),this.columnDragController.unmount(),this.unmountHeaderMenu(),this.closeBoardPickerPopover(),this.closeCardLabelsPopover(),this.closeCardChecklistPopover(),this.closeCardCheckItemMenuPopover(),this.closeCardEntityLinkMenuPopover(),this.closeListActionsPopover(),this.closeCardActionsPopover(),this.closeMoveCardPopover(),this.closeQuickCardEditor(),this.closeCardModal(),this.cardDrafts.clear(),this.root.replaceChildren()}notifyStateError(e){if(!e){this.lastNotifiedErrorKey=null;return}e!==this.lastNotifiedErrorKey&&(this.lastNotifiedErrorKey=e,Oe(this.runtime.i18n.t(e),"error"))}refreshFromRuntime(){this.state&&this.render(this.state)}closeTransientBoardOverlays(){this.closeBoardPickerPopover(),this.closeListActionsPopover(),this.closeCardActionsPopover(),this.closeCardLabelsPopover(),this.closeCardChecklistPopover(),this.closeCardCheckItemMenuPopover(),this.closeCardEntityLinkMenuPopover(),this.closeMoveCardPopover(),this.closeQuickCardEditor()}ensureTagCatalogLoaded(){!this.tagCatalog||this.tagCatalogStatus!=="idle"||(this.tagCatalogStatus="loading",this.tagCatalog.loadTags().then(e=>{this.tagItems=e.map(J),this.tagCatalogStatus="ready",this.rerenderCurrentState()}).catch(()=>{this.tagItems=[],this.tagCatalogStatus="error",this.rerenderCurrentState()}))}getTagPickerErrorMessage(){return this.tagCatalogStatus==="error"?this.runtime.i18n.t("boards.cardBack.tagsLoadFailed"):null}renderShell(e){const t=document.createElement("section");if(t.className=u.shell,t.append(this.renderHeader(e)),e.status==="loading"&&e.boards.length===0)return t.append(this.renderMessage(this.runtime.i18n.t("boards.loading"))),t;if(e.boards.length===0)return t.append(this.renderEmptyState()),t;const a=this.getSelectedBoard(e);return t.append(a?this.renderBoard(a,e):this.renderMessage(this.runtime.i18n.t("boards.empty"))),t}renderHeader(e){const t=document.createElement("header");t.className=u.header;const a=this.getSelectedBoard(e),o=document.createElement("div");o.className=u.titleBlock;const r=document.createElement("div");r.className=u.titleRow,r.append(this.renderBoardTitle(a,e)),e.boards.length>0&&r.append(this.renderBoardPickerButton(a,e)),o.append(r);const i=document.createElement("div");return i.className=u.headerActions,i.append(this.renderHeaderMenu(a,e)),t.append(o,i),t}renderBoardTitle(e,t){const a=document.createElement("h1");if(a.className=u.title,!e||this.editingBoardTitleId!==e.id){const o=document.createElement("button");return o.type="button",o.className=u.titleButton,o.textContent=(e==null?void 0:e.title)??this.runtime.i18n.t("boards.title"),o.disabled=!e||t.status==="saving",o.title=this.runtime.i18n.t("boards.actions.renameBoard"),o.setAttribute("aria-label",this.runtime.i18n.t("boards.actions.renameBoard")),o.addEventListener("click",()=>{e&&this.startBoardTitleEdit(e.id)}),a.append(o),a}return this.boardTitleEditInput=R({variant:"inline",type:"text",value:e.title,autoComplete:"off",maxLength:512,className:u.titleEditInput,onKeyDown:o=>{if(o.key==="Enter"){o.preventDefault(),this.finishBoardTitleEdit(e,!0);return}o.key==="Escape"&&(o.preventDefault(),this.finishBoardTitleEdit(e,!1))}}),this.boardTitleEditInput.setAttribute("aria-label",this.runtime.i18n.t("boards.boardTitlePlaceholder")),this.boardTitleEditInput.addEventListener("blur",()=>{this.finishBoardTitleEdit(e,!0)}),a.append(this.boardTitleEditInput),requestAnimationFrame(()=>{var o,r;(o=this.boardTitleEditInput)==null||o.focus(),(r=this.boardTitleEditInput)==null||r.select()}),a}renderBoardPickerButton(e,t){const a=this.runtime.i18n.t("boards.boardPicker.open"),o=P({icon:"kanban",tone:"text",size:"sm",className:u.boardPickerButton,title:a,ariaLabel:a,disabled:!e||t.status==="saving"}),r=document.createElement("span");r.className=u.boardPickerButtonContent;const i=E("kanban",{size:16,strokeWidth:2});i.setAttribute("aria-hidden","true");const n=E("chevron-down",{size:14,strokeWidth:2});return n.setAttribute("aria-hidden","true"),r.append(i,n),He(o,r),o.setAttribute("aria-haspopup","dialog"),o.setAttribute("aria-expanded","false"),o.setAttribute("data-testid","board-picker-button"),o.addEventListener("click",d=>{var s;if(d.stopPropagation(),((s=this.boardPickerPopover)==null?void 0:s.trigger)===o){this.closeBoardPickerPopover();return}this.openBoardPickerPopover(o,t)}),o}openBoardPickerPopover(e,t,a){this.closeTransientBoardOverlays();const o=a?{query:a.query,activeFilter:a.activeFilter,collapsedSections:{...a.collapsedSections}}:{query:"",activeFilter:"all",collapsedSections:{...It}},r=this.getSelectedBoard(t),i=I({elevated:!0,className:`${u.boardPickerPopover} hidden`});i.setAttribute("data-testid","board-picker-popover");const n=document.createElement("div");n.className=u.boardPickerSearchWrap;const d=E("magnifying-glass",{size:18,strokeWidth:2});d.setAttribute("aria-hidden","true"),d.classList.add(u.boardPickerSearchIcon);const s=R({type:"search",autoComplete:"off",placeholder:this.runtime.i18n.t("boards.boardPicker.searchPlaceholder"),className:u.boardPickerSearchInput,onInput:g=>{o.query=g.trim().toLowerCase(),b()},onKeyDown:g=>{g.key==="Escape"&&(g.preventDefault(),this.closeBoardPickerPopover())}});s.setAttribute("aria-label",this.runtime.i18n.t("boards.boardPicker.searchLabel")),s.value=o.query,n.append(d,s);const m=document.createElement("div");m.className=u.boardPickerChips;const p=()=>{m.replaceChildren(...this.getBoardPickerFilterOptions().map(g=>this.renderBoardPickerChip({label:g.label,selected:o.activeFilter===g.value,onClick:()=>{o.activeFilter=g.value,p(),b(),s.focus()}})))},h=document.createElement("div");h.className=u.boardPickerSections;const b=()=>{h.replaceChildren();const g=this.getBoardPickerVisibleBoards(t.boards,o.activeFilter,o.query),v=this.getBoardPickerGroupedBoards(g);if(o.activeFilter==="all"){const C=g.filter(te);C.length>0&&h.append(this.renderBoardPickerSection({id:"starred",label:this.runtime.i18n.t("boards.boardPicker.starred"),boards:C,selectedBoardId:r==null?void 0:r.id,viewState:o,allowEmpty:!1,onToggle:b}))}v.groups.forEach(C=>{h.append(this.renderBoardPickerSection({id:`group:${C.id}`,label:C.name,boards:C.boards,allBoards:t.boards,selectedBoardId:r==null?void 0:r.id,viewState:o,allowEmpty:!1,onToggle:b}))}),(v.ungrouped.length>0||v.groups.length===0||g.length===0)&&h.append(this.renderBoardPickerSection({id:"yourBoards",label:this.runtime.i18n.t("boards.boardPicker.yourBoards"),boards:v.groups.length>0?v.ungrouped:g,allBoards:t.boards,selectedBoardId:r==null?void 0:r.id,viewState:o,allowEmpty:!0,showCreateBoardCard:o.activeFilter==="all",onToggle:b}))};i.append(n,m,h);const x=new T({container:e,panel:i,positioning:"viewport",panelZIndex:290,onOpenChange:g=>{var v;e.setAttribute("aria-expanded",g?"true":"false"),!g&&((v=this.boardPickerPopover)==null?void 0:v.menu)===x&&this.closeBoardPickerPopover()}});x.mount(),this.boardPickerPopover={menu:x,panel:i,trigger:e,viewState:o,actionsMenu:null},p(),b(),x.openAt({anchor:e,placement:"bottom-start",fallbackPlacements:["bottom-end","top-start","top-end"],gap:8,margin:12,lockPlacementAfterOpen:!0}),requestAnimationFrame(()=>s.focus())}getBoardPickerFilterOptions(){return[{value:"all",label:this.runtime.i18n.t("boards.boardPicker.all")},{value:"starred",label:this.runtime.i18n.t("boards.boardPicker.starred")},{value:"recent",label:this.runtime.i18n.t("boards.boardPicker.recent")}]}getBoardPickerVisibleBoards(e,t,a){const o=a.trim().toLowerCase(),r=e.filter(i=>o&&!i.title.toLowerCase().includes(o)?!1:t==="starred"?te(i):t==="recent"?de(i)!==null:!0);return t!=="recent"?r:[...r].sort((i,n)=>(de(n)??0)-(de(i)??0))}getBoardPickerGroupedBoards(e){const t=new Map,a=[];return e.forEach(o=>{const r=be(o);if(!r){a.push(o);return}const i=t.get(r.id);if(i){i.boards.push(o);return}t.set(r.id,{...r,boards:[o]})}),{groups:Array.from(t.values()).sort((o,r)=>o.name.localeCompare(r.name)),ungrouped:a}}renderBoardPickerChip(e){const t=document.createElement("button");return t.type="button",t.className=e.selected?u.boardPickerChipSelected:u.boardPickerChip,t.textContent=e.label,t.addEventListener("click",e.onClick),t}renderBoardPickerSection(e){const t=e.viewState.collapsedSections[e.id],a=document.createElement("section");a.className=u.boardPickerSection,a.dataset.boardPickerSection=e.id;const o=document.createElement("h2");o.className=u.boardPickerSectionTitle;const r=document.createElement("button");r.type="button",r.className=u.boardPickerSectionToggle,r.setAttribute("aria-expanded",t?"false":"true");const i=E("chevron-down",{size:16,strokeWidth:2});i.setAttribute("aria-hidden","true"),i.classList.toggle(u.boardPickerSectionIconCollapsed,t);const n=document.createElement("span");n.textContent=e.label,r.append(i,n),r.addEventListener("click",()=>{e.viewState.collapsedSections[e.id]=!t,e.onToggle()}),o.append(r);const d=document.createElement("div");if(d.className=u.boardPickerGrid,d.hidden=t,e.boards.length===0&&e.allowEmpty){const s=document.createElement("p");s.className=u.boardPickerEmpty,s.textContent=this.runtime.i18n.t("boards.boardPicker.noResults"),d.append(s)}else e.boards.forEach(s=>{d.append(this.renderBoardPickerCard(s,e.selectedBoardId,e.allBoards))});return e.showCreateBoardCard&&d.append(this.renderBoardPickerCreateCard()),a.append(o,d),a}renderBoardPickerCreateCard(){const e=document.createElement("button");return e.type="button",e.className=u.boardPickerCreateCard,e.textContent=this.runtime.i18n.t("boards.boardPicker.createBoard"),e.addEventListener("click",()=>{this.closeBoardPickerPopover(),this.handlers.onCreateBoard(this.runtime.i18n.t("boards.defaultBoardTitle"))}),e}renderBoardPickerCard(e,t,a){const o=e.id===t,r=te(e),i=document.createElement("div");i.className=o?u.boardPickerCardSelected:u.boardPickerCard;const n=document.createElement("button");n.type="button",n.className=u.boardPickerCardButton,n.setAttribute("aria-label",e.title),n.setAttribute("aria-current",o?"true":"false"),n.dataset.boardPickerBoardId=e.id,n.addEventListener("click",()=>{this.closeBoardPickerPopover(),this.handlers.onSelectBoard(e.id)});const d=document.createElement("div");d.className=`${u.boardPickerCover} ${Dt(e)}`.trim();const s=document.createElement("span");s.className=u.boardPickerCoverInitial,s.textContent=qt(e),d.append(s);const m=document.createElement("span");m.className=u.boardPickerCardTitle,m.textContent=e.title,n.append(d,m);const p=P({icon:r?"star-solid":"star",tone:"text",size:"sm",className:r?u.boardPickerStarButtonActive:u.boardPickerStarButton,title:this.runtime.i18n.t(r?"boards.boardPicker.unstar":"boards.boardPicker.star"),ariaLabel:this.runtime.i18n.t(r?"boards.boardPicker.unstar":"boards.boardPicker.star"),onClick:b=>{b.stopPropagation(),this.handlers.onToggleBoardStar(e.id)}});p.setAttribute("aria-pressed",r?"true":"false");const h=P({icon:"ellipsis-horizontal",tone:"text",size:"sm",className:u.boardPickerActionsButton,title:this.runtime.i18n.t("boards.boardPicker.actions"),ariaLabel:this.runtime.i18n.t("boards.boardPicker.actions"),onClick:b=>{b.stopPropagation(),this.openBoardPickerActionsMenu(e,a,h)}});return i.append(n,p,h),i}openBoardPickerActionsMenu(e,t,a){var n;const o=this.boardPickerPopover;if(!o)return;if(((n=o.actionsMenu)==null?void 0:n.boardId)===e.id){this.closeBoardPickerActionsMenu();return}this.closeBoardPickerActionsMenu();const r=I({elevated:!0,className:`${u.boardPickerActionsMenu} hidden`});r.addEventListener("mousedown",d=>d.stopPropagation());const i=new T({container:a,panel:r,positioning:"viewport",panelZIndex:310,onOpenChange:d=>{var s,m;!d&&((m=(s=this.boardPickerPopover)==null?void 0:s.actionsMenu)==null?void 0:m.menu)===i&&this.closeBoardPickerActionsMenu()}});o.panel.append(r),i.mount(),o.actionsMenu={menu:i,panel:r,boardId:e.id},this.renderBoardPickerActionsMenu(e,t),i.openAt({anchor:a,placement:"right-start",fallbackPlacements:["left-start","bottom-end","top-end"],gap:4,margin:8,lockPlacementAfterOpen:!0})}renderBoardPickerActionsMenu(e,t,a="menu"){var i;const o=(i=this.boardPickerPopover)==null?void 0:i.actionsMenu;if(!o)return;if(o.panel.replaceChildren(),a==="createGroup"){o.panel.append(this.renderBoardPickerCreateGroupInput(e,t));return}const r=be(e);he(t).filter(n=>n.id!==(r==null?void 0:r.id)).forEach(n=>{o.panel.append(se({label:this.runtime.i18n.t("boards.boardPicker.moveToGroup",{group:n.name}),onClick:d=>{d.stopPropagation(),this.handlers.onUpdateBoardGroup(e.id,n),this.closeBoardPickerActionsMenu()}}))}),r&&o.panel.append(se({label:this.runtime.i18n.t("boards.boardPicker.removeFromGroup"),onClick:n=>{n.stopPropagation(),this.handlers.onUpdateBoardGroup(e.id,null),this.closeBoardPickerActionsMenu()}})),o.panel.childElementCount>0&&o.panel.append(Ke({tone:"soft"})),o.panel.append(se({label:this.runtime.i18n.t("boards.boardPicker.createGroup"),onClick:n=>{n.stopPropagation(),this.renderBoardPickerActionsMenu(e,t,"createGroup")}}))}renderBoardPickerCreateGroupInput(e,t){const a=document.createElement("div");a.className=u.boardPickerActionsInputRow;const o=R({variant:"inline",value:"",type:"text",className:u.boardPickerActionsInput});o.placeholder=this.runtime.i18n.t("boards.boardPicker.newGroupPlaceholder");let r=!1;const i=n=>{if(r)return;r=!0;const d=n?o.value.trim():"";if(!d){this.renderBoardPickerActionsMenu(e,t);return}const m=he(t).find(p=>p.name.toLowerCase()===d.toLowerCase())??{id:ut(d,t),name:d};this.handlers.onUpdateBoardGroup(e.id,m),this.closeBoardPickerActionsMenu()};return o.addEventListener("blur",()=>i(!0)),o.addEventListener("keydown",n=>{n.key==="Enter"?(n.preventDefault(),i(!0)):n.key==="Escape"&&(n.preventDefault(),i(!1))}),a.append(o),requestAnimationFrame(()=>o.focus()),a}renderHeaderMenu(e,t){let a;return a=new We({label:this.runtime.i18n.t("boards.actions.menu"),ariaLabel:this.runtime.i18n.t("boards.actions.menu"),title:this.runtime.i18n.t("boards.actions.menu"),variant:"plain",size:"md",buttonClassName:u.headerMenuButton,placement:"bottom-end",fallbackPlacements:["bottom-start","top-end","top-start"],onOpenChange:o=>St(a,o),items:[{id:"create-board",label:this.runtime.i18n.t("boards.actions.createBoard"),disabled:t.status==="saving",onSelect:()=>{this.handlers.onCreateBoard(this.runtime.i18n.t("boards.defaultBoardTitle"))}},{id:"delete-board",label:this.runtime.i18n.t("boards.actions.deleteBoard"),disabled:!e||t.status==="saving",onSelect:()=>{e&&this.handlers.onDeleteBoard(e.id)}}]}),Tt(a,"ellipsis-horizontal",this.runtime.i18n.t("boards.actions.menu")),this.headerMenu=a,a.mount(),a.element}renderBoard(e,t){const a=document.createElement("div");a.className=u.body;const o=document.createElement("div");return o.className=u.canvas,o.setAttribute("aria-label",e.title),o.dataset.boardCanvas="true",e.columns.forEach(r=>{o.append(this.renderColumn(e,r,t))}),o.append(this.renderColumnComposer(e,t)),a.append(o),a}renderColumn(e,t,a){const o=document.createElement("section");o.className=u.column,o.dataset.boardColumnId=String(t.id),o.dataset.boardColumnDraggable="true";const r=document.createElement("header");r.className=u.columnHeader,r.append(this.renderColumnTitle(t,a));const i=P({icon:"ellipsis-horizontal",tone:"text",size:"sm",className:`${u.iconButton} ${u.columnMenuButton}`,title:this.runtime.i18n.t("boards.listActions.title"),ariaLabel:this.runtime.i18n.t("boards.listActions.title"),disabled:a.status==="saving"});i.setAttribute("aria-haspopup","dialog"),i.setAttribute("aria-expanded","false"),i.setAttribute("data-testid","list-actions-menu-button"),i.dataset.boardDragIgnore="true",i.addEventListener("click",d=>{var s;if(d.stopPropagation(),((s=this.listActionsPopover)==null?void 0:s.trigger)===i){this.closeListActionsPopover();return}this.openListActionsPopover(i,t)}),r.append(i);const n=document.createElement("div");return n.className=u.cards,n.dataset.boardCardsContainer="true",t.cards.forEach(d=>n.append(this.renderCard(d))),o.append(r,n,this.renderCardComposer(t,a)),o}renderColumnTitle(e,t){if(this.editingColumnTitleId===e.id)return this.columnTitleEditInput=document.createElement("input"),this.columnTitleEditInput.className=u.columnTitleInput,this.columnTitleEditInput.type="text",this.columnTitleEditInput.value=e.title,this.columnTitleEditInput.maxLength=512,this.columnTitleEditInput.autocomplete="off",this.columnTitleEditInput.setAttribute("aria-label",this.runtime.i18n.t("boards.columnTitlePlaceholder")),this.columnTitleEditInput.addEventListener("keydown",r=>{if(r.key==="Enter"){r.preventDefault(),this.finishColumnTitleEdit(e,!0);return}r.key==="Escape"&&(r.preventDefault(),this.finishColumnTitleEdit(e,!1))}),this.columnTitleEditInput.addEventListener("blur",()=>{this.finishColumnTitleEdit(e,!0)}),requestAnimationFrame(()=>{var r,i;(r=this.columnTitleEditInput)==null||r.focus(),(i=this.columnTitleEditInput)==null||i.select()}),this.columnTitleEditInput;const a=document.createElement("button");a.type="button",a.className=u.columnTitleButton,a.disabled=t.status==="saving",a.title=this.runtime.i18n.t("boards.actions.renameColumn"),a.setAttribute("aria-label",this.runtime.i18n.t("boards.actions.renameColumn")),a.addEventListener("click",()=>this.startColumnTitleEdit(e.id));const o=document.createElement("span");return o.className=u.columnTitle,o.textContent=e.title,a.append(o),a}openListActionsPopover(e,t){this.closeListActionsPopover();const a=I({elevated:!0,className:`${c.listActionsPopover} hidden`});a.setAttribute("role","dialog"),a.setAttribute("aria-modal","false"),a.setAttribute("aria-labelledby","list-actions-menu"),a.setAttribute("data-testid","list-actions-popover"),a.addEventListener("mousedown",s=>s.stopPropagation());const o=document.createElement("header");o.className=c.listActionsHeader;const r=document.createElement("h2");r.id="list-actions-menu",r.className=c.listActionsTitle,r.textContent=this.runtime.i18n.t("boards.listActions.title");const i=P({icon:"x-mark",tone:"text",size:"sm",className:c.iconButton,ariaLabel:this.runtime.i18n.t("common.close"),title:this.runtime.i18n.t("common.close"),onClick:()=>this.closeListActionsPopover()});o.append(r,i);const n=document.createElement("div");n.className=c.listActionsBody,n.append(this.renderListActionList([this.createListActionButton({labelKey:"boards.listActions.addCard",testId:"list-actions-add-card-button",onClick:()=>{this.closeListActionsPopover(),this.expandCardComposer(t.id)}}),this.createListActionButton({labelKey:"boards.listActions.copyList",testId:"list-actions-copy-list-button",disabled:!0}),this.createListActionButton({labelKey:"boards.listActions.moveList",testId:"list-actions-move-list-button",disabled:!0}),this.createListActionButton({labelKey:"boards.listActions.moveAllCards",testId:"list-actions-move-all-cards-button",disabled:!0}),this.createListActionButton({labelKey:"boards.listActions.sortBy",disabled:!0}),this.createListActionButton({labelKey:"boards.listActions.watch",testId:"list-actions-watch-list-button",disabled:!0})]),this.renderListActionsDivider(),this.renderListActionsColorSection(),this.renderListActionsDivider(),this.renderListActionsAutomationSection(),this.renderListActionsDivider(),this.renderListActionList([this.createListActionButton({labelKey:"boards.listActions.archiveList",testId:"list-actions-archive-list-button",onClick:()=>{this.closeListActionsPopover(),this.handlers.onDeleteColumn(t.id)}}),this.createListActionButton({labelKey:"boards.listActions.archiveAllCards",disabled:!0})])),a.append(o,n);let d;d=new T({container:e,panel:a,positioning:"viewport",panelZIndex:290,onOpenChange:s=>{var m;e.setAttribute("aria-expanded",s?"true":"false"),!s&&((m=this.listActionsPopover)==null?void 0:m.menu)===d&&this.closeListActionsPopover()}}),d.mount(),this.listActionsPopover={menu:d,panel:a,trigger:e},d.openAt({anchor:e,placement:"bottom-end",fallbackPlacements:["bottom-start","top-end","top-start"],gap:8,margin:12,lockPlacementAfterOpen:!0})}renderListActionList(e){const t=document.createElement("ul");return t.className=c.listActionsList,e.forEach(a=>{const o=document.createElement("li");o.className=c.listActionsItem,o.append(a),t.append(o)}),t}createListActionButton(e){const t=_({text:this.runtime.i18n.t(e.labelKey),tone:"text",size:"md",className:c.listActionsButton,disabled:e.disabled,onClick:e.onClick});return e.testId&&t.setAttribute("data-testid",e.testId),t}renderListActionsDivider(){const e=document.createElement("div");return e.className=c.listActionsDivider,e.setAttribute("role","separator"),e}renderListActionsColorSection(){const e=document.createElement("section");e.className=c.listActionsSection;const t=_({text:this.runtime.i18n.t("boards.listActions.changeListColor"),tone:"text",size:"md",className:c.listActionsSectionButton,disabled:!0}),a=E("chevron-up",{size:16,strokeWidth:2});a.setAttribute("aria-hidden","true"),t.append(a);const o=document.createElement("div");o.className=c.listActionsUpgrade;const r=document.createElement("p");r.className=c.listActionsUpgradeTitle,r.textContent=this.runtime.i18n.t("boards.listActions.colorUpgradeTitle");const i=document.createElement("p");return i.className=c.listActionsUpgradeCopy,i.textContent=this.runtime.i18n.t("boards.listActions.colorUpgradeBody"),o.append(r,i),e.append(t,o),e}renderListActionsAutomationSection(){const e=document.createElement("section");e.className=c.listActionsSection;const t=_({text:this.runtime.i18n.t("boards.listActions.automation"),tone:"text",size:"md",className:c.listActionsSectionButton,disabled:!0}),a=E("chevron-up",{size:16,strokeWidth:2});return a.setAttribute("aria-hidden","true"),t.append(a),e.append(t,this.renderListActionList([this.createListActionButton({labelKey:"boards.listActions.whenCardAdded",disabled:!0}),this.createListActionButton({labelKey:"boards.listActions.everyDaySort",disabled:!0}),this.createListActionButton({labelKey:"boards.listActions.everyMondaySort",disabled:!0}),this.createListActionButton({labelKey:"boards.listActions.createRule",disabled:!0})])),e}renderCard(e){const t=y(e),a=Z(e),o=document.createElement("article"),r=a?u.cardCompleted:u.card;o.className=Q(e)?`${r} ${u.cardMirror}`:r,o.dataset.boardCardId=String(e.id),o.dataset.boardCardPlacementId=String(t),o.dataset.boardCardDraggable="true",o.addEventListener("contextmenu",h=>{h.preventDefault(),h.stopPropagation(),this.openQuickCardEditor(t,o.getBoundingClientRect())});const i=document.createElement("button");i.type="button",i.className=u.cardOpenButton,i.dataset.boardCardOpen=String(t),i.setAttribute("aria-label",this.runtime.i18n.t("boards.actions.openCard")),i.addEventListener("click",()=>this.openCardModal(t));const n=document.createElement("h3");n.className=u.cardTitle,n.textContent=e.title;const d=this.createCardCompletionToggle(e,{className:a?u.cardCompleteToggleCompleted:u.cardCompleteToggle,testId:"board-card-completion-toggle"}),s=this.renderCardMirrorSourceLabel(e,u.cardSourceLabel),m=this.renderCardFrontTags(e);s&&i.append(s),m&&i.append(m),i.append(n);const p=this.renderCardFrontBadges(e);return p&&i.append(p),o.append(d,i),o}createCardCompletionToggle(e,t){const a=Z(e),o=this.runtime.i18n.t(a?"boards.cardBack.markIncomplete":"boards.cardBack.markComplete",{title:e.title}),r=this.runtime.i18n.t(a?"boards.cardBack.markIncompleteHint":"boards.cardBack.markCompleteHint"),i=document.createElement("button");i.type="button",i.className=t.className,i.title=r,i.dataset.testid=t.testId,i.dataset.boardDragIgnore="true",i.setAttribute("aria-label",o),i.setAttribute("aria-pressed",a?"true":"false");const n=document.createElement("span");return n.className="majom-boards__completion-mark",n.setAttribute("aria-hidden","true"),i.append(n),i.addEventListener("pointerdown",d=>{d.stopPropagation()}),i.addEventListener("click",d=>{d.preventDefault(),d.stopPropagation(),this.toggleCardCompletion(e)}),i}toggleCardCompletion(e){const t={completedAt:Z(e)?null:new Date};this.handlers.onPatchCard(e.id,t)}renderCardFrontTags(e){var a;if(!((a=e.tags)!=null&&a.length))return null;const t=document.createElement("div");return t.className=u.cardTags,t.setAttribute("data-testid","board-card-tags"),e.tags.forEach(o=>{t.append(this.createCardTagChip(o,u.cardTag))}),t}createCardTagChip(e,t){const a=document.createElement("span");return a.className=t,a.title=e.title,a.setAttribute("aria-label",e.title),a.setAttribute("role","img"),a.setAttribute("data-testid","compact-card-label"),a.style.backgroundColor=e.color,a}renderCardFrontBadges(e){const t=document.createElement("div");t.className=u.cardBadges,e.description.trim()&&t.append(this.createCardFrontBadge("bars-3-bottom-left",this.runtime.i18n.t("boards.cardDescriptionLabel"),void 0,"plain"));const a=Nt(e);a>0&&t.append(this.createCardFrontBadge("chat-bubble-bottom-center-text",this.runtime.i18n.t("boards.cardBack.comments"),String(a),"neutral"));const o=Ft(e);o.total>0&&t.append(this.createCardFrontBadge("check-box",this.runtime.i18n.t("boards.cardBack.checklist"),`${o.completed}/${o.total}`,"neutral"));const r=$t(e);return[{type:"goal",tone:"goal",labelKey:"boards.cardLinks.goalBadge"},{type:"story",tone:"story",labelKey:"boards.cardLinks.storyBadge"},{type:"task",tone:"task",labelKey:"boards.cardLinks.taskBadge"}].forEach(n=>{const d=r[n.type];d<=0||t.append(this.createCardFrontBadge(le(n.type),this.runtime.i18n.t(n.labelKey),String(d),n.tone))}),t.childElementCount>0?t:null}renderCardMirrorSourceLabel(e,t){if(!e.mirror_source)return null;const a=e.mirror_source,o=this.runtime.i18n.t("boards.cardMirror.sourceLocation",{board:a.board_title,list:a.column_title}),r=document.createElement("span");return r.className=t,r.setAttribute("data-testid","card-mirror-source-label"),r.textContent=o,r.title=this.runtime.i18n.t("boards.cardMirror.sourceLabel",{source:o}),r.setAttribute("aria-label",r.title),r}createCardFrontBadge(e,t,a,o="neutral"){const r=document.createElement("span"),i={plain:u.cardBadgePlain,neutral:u.cardBadgeNeutral,task:u.cardBadgeTask,story:u.cardBadgeStory,goal:u.cardBadgeGoal};r.className=i[o],r.title=t,r.setAttribute("aria-label",a?`${t}: ${a}`:t);const n=E(e,{size:16,strokeWidth:2});if(n.setAttribute("aria-hidden","true"),r.append(n),a){const d=document.createElement("span");d.textContent=a,r.append(d)}return r}renderCardComposer(e,t){const a=document.createElement("div");if(a.className=u.cardComposer,this.expandedCardComposerColumnId!==e.id){const n=_({text:this.runtime.i18n.t("boards.actions.createCard"),tone:"text",size:"md",fullWidth:!0,className:u.cardComposerCollapsed,disabled:t.status==="saving",onClick:()=>this.expandCardComposer(e.id)});return a.append(n),a}const o=document.createElement("form");o.className=u.cardComposerExpanded,o.addEventListener("submit",n=>{n.preventDefault(),this.submitCard(e.id)});const r=document.createElement("textarea");r.className=u.cardComposerTextarea,r.placeholder=this.runtime.i18n.t("boards.cardComposerPlaceholder"),r.dir="auto",r.rows=2,r.setAttribute("data-testid","list-card-composer-textarea"),r.setAttribute("aria-label",this.runtime.i18n.t("boards.cardTitleLabel")),r.addEventListener("keydown",n=>{n.key!=="Enter"||n.shiftKey||(n.preventDefault(),this.submitCard(e.id))}),this.cardDrafts.set(e.id,{title:r});const i=document.createElement("div");return i.className=u.composerActions,i.append(_({text:this.runtime.i18n.t("boards.actions.createCard"),tone:"primary",size:"sm",type:"submit",className:u.primaryButton,disabled:t.status==="saving"}),P({icon:"x-mark",tone:"text",size:"md",type:"button",title:this.runtime.i18n.t("boards.actions.cancelNewCard"),ariaLabel:this.runtime.i18n.t("boards.actions.cancelNewCard"),className:u.composerCancelButton,onClick:()=>this.collapseCardComposer()})),o.append(r,i),a.append(o),requestAnimationFrame(()=>r.focus()),a}renderColumnComposer(e,t){const a=document.createElement("aside");if(a.className=this.isColumnComposerExpanded?u.columnComposerExpandedPanel:u.columnComposerCollapsedPanel,a.dataset.boardColumnComposer="true",!this.isColumnComposerExpanded){const i=_({text:this.runtime.i18n.t("boards.addColumnPanelTitle"),tone:"text",size:"md",fullWidth:!0,className:u.columnComposerCollapsed,disabled:t.status==="saving",onClick:()=>this.expandColumnComposer()});return i.setAttribute("data-testid","list-composer-button"),i.setAttribute("data-drag-scroll-disabled","true"),D(i,"plus"),a.append(i),a}const o=document.createElement("form");o.className=u.columnComposerExpanded,o.setAttribute("data-focus-lock-disabled","false"),o.addEventListener("submit",i=>{i.preventDefault(),this.submitColumnTitle(e.id)}),this.columnTitleTextarea=document.createElement("textarea"),this.columnTitleTextarea.className=u.listComposerTextarea,this.columnTitleTextarea.placeholder=this.runtime.i18n.t("boards.columnTitlePlaceholder"),this.columnTitleTextarea.name=this.runtime.i18n.t("boards.columnTitlePlaceholder"),this.columnTitleTextarea.dir="auto",this.columnTitleTextarea.rows=1,this.columnTitleTextarea.maxLength=512,this.columnTitleTextarea.spellcheck=!1,this.columnTitleTextarea.setAttribute("data-testid","list-name-textarea"),this.columnTitleTextarea.setAttribute("autocomplete","off"),this.columnTitleTextarea.setAttribute("aria-label",this.runtime.i18n.t("boards.columnTitlePlaceholder")),this.columnTitleTextarea.addEventListener("keydown",i=>{i.key!=="Enter"||i.shiftKey||(i.preventDefault(),this.submitColumnTitle(e.id))});const r=document.createElement("div");return r.className=u.composerActions,r.append(_({text:this.runtime.i18n.t("boards.actions.createColumn"),tone:"primary",size:"sm",type:"submit",className:u.primaryButton,disabled:t.status==="saving"}),P({icon:"x-mark",tone:"text",size:"md",type:"button",title:this.runtime.i18n.t("boards.actions.cancelNewColumn"),ariaLabel:this.runtime.i18n.t("boards.actions.cancelNewColumn"),className:u.composerCancelButton,onClick:()=>this.collapseColumnComposer()})),o.append(this.columnTitleTextarea,r),a.append(o),requestAnimationFrame(()=>{var i;return(i=this.columnTitleTextarea)==null?void 0:i.focus()}),a}renderEmptyState(){const e=document.createElement("div");e.className=u.empty;const t=document.createElement("div");t.className=u.emptyContent;const a=document.createElement("h2");a.className=u.emptyTitle,a.textContent=this.runtime.i18n.t("boards.emptyTitle");const o=document.createElement("p");return o.className=u.emptyCopy,o.textContent=this.runtime.i18n.t("boards.emptyBody"),t.append(a,o),e.append(t),e}renderMessage(e){const t=document.createElement("div");t.className=u.messageWrapper;const a=document.createElement("p");return a.className=u.messageLabel,a.textContent=e,t.append(a),t}openQuickCardEditor(e,t){if(!this.state)return;const a=this.findCardLocation(e,this.state);if(!a)return;this.closeQuickCardEditor();const o=document.createElement("div");o.className=c.quickEditorOverlay,o.addEventListener("pointerdown",i=>{i.target===o&&this.closeQuickCardEditor()}),o.addEventListener("keydown",i=>{i.key==="Escape"&&(i.preventDefault(),this.closeQuickCardEditor())});const r=this.renderQuickCardEditor(a);this.positionQuickCardEditor(r,t),o.append(r),document.body.append(o),this.quickEditorOverlay=o,requestAnimationFrame(()=>{var i;(i=r.querySelector('[data-testid="quick-card-editor-card-title"]'))==null||i.focus()})}renderQuickCardEditor(e){const{card:t}=e,a=document.createElement("div");a.className=c.quickEditor,a.setAttribute("data-elevation","1"),a.addEventListener("pointerdown",b=>b.stopPropagation());const o=document.createElement("div");o.setAttribute("role","dialog"),o.setAttribute("aria-modal","true"),o.setAttribute("aria-label",this.runtime.i18n.t("boards.quickEditor.menuLabel")),o.setAttribute("data-testid","quick-card-editor-menu");const r=document.createElement("form");r.className=c.quickEditorForm,r.addEventListener("submit",b=>{b.preventDefault(),this.saveQuickCardEditor(t,d)});const i=I({elevated:!0,className:Q(t)?`${c.quickEditorCard} ${c.quickEditorCardMirror}`:c.quickEditorCard});i.setAttribute("data-testid","quick-card-editor-card-front");const n=document.createElement("div");n.className=c.quickEditorCardInner;const d=document.createElement("textarea");d.className=c.quickEditorTitle,d.setAttribute("data-testid","quick-card-editor-card-title"),d.dir="auto",d.setAttribute("aria-label",this.runtime.i18n.t("boards.quickEditor.editCardName")),d.value=t.title,d.rows=2,d.addEventListener("keydown",b=>{b.key!=="Enter"||b.shiftKey||(b.preventDefault(),this.saveQuickCardEditor(t,d))});const s=this.renderCardFrontBadges(t),m=this.renderCardMirrorSourceLabel(t,u.cardSourceLabel);m&&n.append(m),n.append(d),s&&n.append(s),i.append(n);const p=_({text:this.runtime.i18n.t("common.save"),tone:"primary",size:"md",className:`${u.primaryButton} ${c.quickEditorSave}`,type:"submit"}),h=()=>{p.disabled=d.value.trim().length===0};return d.addEventListener("input",h),h(),r.append(i,p),o.append(r,this.renderQuickCardEditorActions(e)),a.append(o),a}renderQuickCardEditorActions(e){const{board:t,column:a,card:o,placementId:r}=e,i=document.createElement("div");i.className=c.quickEditorActions;const n=document.createElement("ul");return n.className=c.quickEditorButtons,n.setAttribute("data-testid","quick-card-editor-buttons"),[{testId:"quick-card-editor-open-card",labelKey:"boards.quickEditor.openCard",icon:"rectangle-stack",onClick:()=>{this.closeQuickCardEditor(),this.openCardModal(r)}},{testId:"quick-card-editor-edit-labels",labelKey:"boards.quickEditor.editLabels",icon:"tag",onClick:()=>{this.closeQuickCardEditor(),this.openCardModal(r)}},{testId:"quick-card-editor-move",labelKey:"boards.quickEditor.move",icon:"arrow-right",onClick:s=>{this.openMoveCardPopover(s.currentTarget,t,a,o,"move")}},{testId:"mirror-new-button",labelKey:"boards.quickEditor.mirror",icon:"rectangle-stack",onClick:s=>{this.openMoveCardPopover(s.currentTarget,t,a,o,"mirror")}},{testId:"quick-card-editor-archive",labelKey:Q(o)?"boards.quickEditor.removeFromBoard":"boards.quickEditor.archive",icon:"archive-box",onClick:()=>{this.closeQuickCardEditor(),this.archiveOrRemoveCard(o,r)}},{testId:"quick-card-editor-delete-card",labelKey:"boards.actions.deleteCard",icon:"trash",danger:!0,onClick:()=>void this.deleteSharedCardFromQuickEditor(o)}].forEach(s=>{const m=document.createElement("li");s.danger&&(m.className=c.quickEditorDangerItem);const p=_({text:this.runtime.i18n.t(s.labelKey),tone:s.danger?"danger":"text",size:"md",className:s.danger?`${c.quickEditorButton} ${c.quickEditorDangerButton}`:c.quickEditorButton,onClick:s.onClick});p.setAttribute("data-testid",s.testId),D(p,s.icon),m.append(p),n.append(m)}),i.append(n),i}positionQuickCardEditor(e,t){const{formWidth:a,actionsWidth:o,actionsGap:r,viewportMargin:i,minVisibleHeight:n}=Mt,d=Math.min(Math.max(t.left,i),Math.max(i,window.innerWidth-a-o-r-i)),s=Math.min(Math.max(t.top,i),Math.max(i,window.innerHeight-n-i));e.style.left=`${d}px`,e.style.top=`${s}px`}saveQuickCardEditor(e,t){const a=t.value.trim();a&&(this.closeQuickCardEditor(),a!==e.title&&this.handlers.onPatchCard(e.id,{title:a}))}openCardModal(e){if(!this.state)return;const t=this.findCardLocation(e,this.state);t&&(this.activeCardPlacementId=e,this.cardModalDraftTagIds=O(t.card),this.cardModalRequestedTagIds=[...this.cardModalDraftTagIds],this.hiddenCheckedChecklistIds.clear(),this.expandedCheckItemComposerIds.clear(),this.cardChecklistPanelState={cardId:t.card.id,status:"idle",checklists:[],error:null},this.renderCardModal(t),this.loadCardModalChecklists(t.card.id))}syncCardModal(e){if(this.activeCardPlacementId===null)return;const t=this.findCardLocation(this.activeCardPlacementId,e);if(!t){this.closeCardModal();return}this.renderCardModal(t)}renderCardModal(e){var b;this.closeCardLabelsPopover(),this.closeCardChecklistPopover(),this.closeCardCheckItemMenuPopover(),this.closeCardEntityLinkMenuPopover(),this.closeMoveCardPopover(),(b=this.cardModalOverlay)==null||b.remove(),this.cardModalOverlay=null,this.cardModalLabelsHost=null,this.cardModalQuickActionList=null,this.cardModalChecklistHost=null;const{board:t,column:a,card:o}=e;this.cardModalDraftTagIds===null&&(this.cardModalDraftTagIds=O(o)),this.cardModalRequestedTagIds===null&&(this.cardModalRequestedTagIds=O(o));const{overlay:r,container:i,header:n,divider:d,body:s}=Ge(o.title,{onClose:()=>this.closeCardModal(),hideCloseButton:!0,intent:"form",presentation:"dialog",zIndex:270});n.classList.add(c.hiddenShellPart),d.classList.add(c.hiddenShellPart),i.classList.add(c.container),i.addEventListener("keydown",x=>{x.stopPropagation()}),s.className=c.body;const m=document.createElement("textarea");m.className=c.titleEditor,m.dataset.boardCardModalTitle="true",m.dir="auto",m.rows=At,m.maxLength=Lt,m.value=o.title,m.setAttribute("aria-label",o.title);const p=document.createElement("textarea");p.className=c.descriptionEditor,p.dataset.boardCardModalDescription="true",p.value=o.description,p.placeholder=this.runtime.i18n.t("boards.cardDescriptionPlaceholder"),p.setAttribute("aria-label",this.runtime.i18n.t("boards.cardDescriptionLabel"));const h=document.createElement("div");h.className=c.cardBack,h.append(this.renderCardBackTopbar(t,a,o),this.renderCardBackLayout(t,a,o,m,p)),s.append(h),i.setAttribute("aria-labelledby","card-back-name"),i.setAttribute("data-focus-lock","cardback"),this.cardModalOverlay=r}renderCardBackTopbar(e,t,a){const o=document.createElement("header");o.className=c.topbar;const r=document.createElement("div");r.className=c.topbarStart;const i=document.createElement("button");i.type="button",i.className=c.listBadge,i.setAttribute("data-testid","card-back-list-button"),i.title=t.title,i.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.changeList",{column:t.title})),i.setAttribute("aria-haspopup","dialog"),i.setAttribute("aria-expanded","false"),i.addEventListener("click",h=>{var b;if(h.stopPropagation(),((b=this.moveCardPopover)==null?void 0:b.trigger)===i){this.closeMoveCardPopover();return}this.openMoveCardPopover(i,e,t,a)});const n=document.createElement("span");n.textContent=t.title;const d=E("chevron-down",{size:14,strokeWidth:2});d.setAttribute("aria-hidden","true"),i.append(n,d),r.append(i);const s=this.renderCardMirrorSourceLabel(a,c.sourceLabel);s&&r.append(s);const m=document.createElement("div");m.className=c.topbarActions;const p=P({icon:"ellipsis-vertical",tone:"text",size:"md",className:c.iconButton,ariaLabel:this.runtime.i18n.t("boards.cardBack.actions"),title:this.runtime.i18n.t("boards.cardBack.actions")});return p.setAttribute("aria-haspopup","dialog"),p.setAttribute("aria-expanded","false"),p.setAttribute("data-testid","card-back-actions-button"),p.addEventListener("click",h=>{var b;if(h.stopPropagation(),((b=this.cardActionsPopover)==null?void 0:b.trigger)===p){this.closeCardActionsPopover();return}this.openCardActionsPopover(p,e,t,a)}),m.append(p,P({icon:"x-mark",tone:"text",size:"md",className:c.iconButton,ariaLabel:this.runtime.i18n.t("common.close"),title:this.runtime.i18n.t("common.close"),onClick:()=>this.closeCardModal()})),o.append(r,m),o}openCardActionsPopover(e,t,a,o){this.closeCardActionsPopover();const r=I({elevated:!0,className:`${c.cardActionsPopover} hidden`});r.setAttribute("role","dialog"),r.setAttribute("aria-modal","false"),r.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.actions")),r.setAttribute("data-testid","card-back-actions-popover"),r.addEventListener("mousedown",s=>s.stopPropagation());const i=document.createElement("div");i.className=c.cardActionsBody;const n=document.createElement("ul");n.className=c.cardActionsList,n.append(this.renderCardActionItem({testId:"card-back-move-card-button",labelKey:"boards.quickEditor.move",icon:"arrow-right",disabled:!0}),this.renderCardActionItem({testId:"card-back-copy-card-button",labelKey:"boards.quickEditor.copyCard",icon:"square-2-stack",disabled:!0}),this.renderCardActionItem({testId:"card-back-mirror-card-button",labelKey:"boards.quickEditor.mirror",icon:"rectangle-stack",onClick:()=>{this.closeCardActionsPopover(),this.openMoveCardPopover(e,t,a,o,"mirror")}}),this.renderCardActionItem({testId:"card-back-link-entity-button",labelKey:"boards.cardLinks.link",icon:"link",onClick:()=>{this.closeCardActionsPopover(),this.openCardEntityLinkModal(o)}}),this.renderCardActionItem({testId:"card-back-create-task-button",labelKey:"boards.cardLinks.createTask",icon:"check-box",onClick:()=>void this.createEntityFromCard(o,"task")}),this.renderCardActionItem({testId:"card-back-create-story-button",labelKey:"boards.cardLinks.createStory",icon:"document",onClick:()=>void this.createEntityFromCard(o,"story")}),this.renderCardActionItem({testId:"card-back-create-goal-button",labelKey:"boards.cardLinks.createGoal",icon:"goal-circle",onClick:()=>void this.createEntityFromCard(o,"goal")}),this.renderCardActionsDivider(),this.renderCardActionItem({testId:"card-back-archive-button",labelKey:Q(o)?"boards.quickEditor.removeFromBoard":"boards.quickEditor.archive",icon:"archive-box",onClick:()=>{this.closeCardActionsPopover(),this.closeCardModal(),this.archiveOrRemoveCard(o,y(o))}}),this.renderCardActionItem({testId:"card-back-delete-card-button",labelKey:"boards.actions.deleteCard",icon:"trash",onClick:()=>void this.deleteSharedCardFromDetails(o)})),i.append(n),r.append(i);let d;d=new T({container:e,panel:r,positioning:"viewport",panelZIndex:300,onOpenChange:s=>{var m;e.setAttribute("aria-expanded",s?"true":"false"),!s&&((m=this.cardActionsPopover)==null?void 0:m.menu)===d&&this.closeCardActionsPopover()}}),d.mount(),this.cardActionsPopover={menu:d,panel:r,trigger:e},d.openAt({anchor:e,placement:"bottom-end",fallbackPlacements:["bottom-start","top-end","top-start"],gap:8,margin:12,lockPlacementAfterOpen:!0})}renderCardActionItem(e){const t=document.createElement("li");t.className=c.cardActionsItem;const a=_({text:this.runtime.i18n.t(e.labelKey),tone:"text",size:"md",className:c.cardActionsButton,disabled:e.disabled,onClick:e.onClick});return a.setAttribute("data-testid",e.testId),D(a,e.icon),t.append(a),t}renderCardActionsDivider(){const e=document.createElement("li");return e.className=c.cardActionsDivider,e.setAttribute("role","separator"),e}archiveOrRemoveCard(e,t){if(Q(e)){this.handlers.onDeleteCardPlacement(t);return}this.handlers.onDeleteCard(e.id)}createPlacementTargetFromPosition(e,t,a){return ze({columnId:e.id,cards:e.cards,movingPlacementId:a??"",insertionIndex:t-1})}openMoveCardPopover(e,t,a,o,r="move"){var _e;const i=((_e=this.state)==null?void 0:_e.boards)??[t],n=y(o);let d=t.id,s=a.id,m=a.cards.findIndex(f=>y(f)===n);m=m>=0?m+1:1;const p=r==="mirror"?"boards.cardMirror.title":"boards.cardMove.title",h=r==="mirror"?"boards.cardMirror.create":"boards.cardMove.move";this.closeMoveCardPopover();const b=I({elevated:!0,className:`${c.movePopover} hidden`});b.setAttribute("role","dialog"),b.setAttribute("aria-modal","false"),b.setAttribute("aria-labelledby","move-card-popover"),b.setAttribute("data-testid","move-card-popover"),b.addEventListener("mousedown",f=>f.stopPropagation());const x=document.createElement("header");x.className=c.movePopoverHeader;const g=document.createElement("h2");g.id="move-card-popover",g.className=c.movePopoverTitle,g.textContent=this.runtime.i18n.t(p);const v=P({icon:"x-mark",tone:"text",size:"sm",className:c.iconButton,ariaLabel:this.runtime.i18n.t("common.close"),title:this.runtime.i18n.t("common.close"),onClick:()=>this.closeMoveCardPopover()});x.append(g,v);const C=document.createElement("div");C.className=c.movePopoverBody;const S=document.createElement("div");S.className=c.movePopoverContent;const M=document.createElement("div");M.className=c.moveTabs,M.setAttribute("role","tablist"),M.append(this.renderMoveCardTab("boards.cardMove.inbox",!1),this.renderMoveCardTab("boards.cardMove.board",!0));const q=document.createElement("h3");q.className=c.moveSectionTitle,q.textContent=this.runtime.i18n.t("boards.cardMove.selectDestination");const K=document.createElement("div");K.className=c.moveFields;const B=this.createMoveSelectField({id:"move-card-board-select",label:this.runtime.i18n.t("boards.cardMove.board")}),A=this.createMoveSelectField({id:"move-card-list-select",label:this.runtime.i18n.t("boards.cardMove.list")}),z=this.createMoveSelectField({id:"move-card-board-list-position-select",label:this.runtime.i18n.t("boards.cardMove.position")}),N=()=>i.find(f=>f.id===d)??null,W=()=>{var f;return((f=N())==null?void 0:f.columns.find(j=>j.id===s))??null},Fe=()=>{var f;return r!=="mirror"?!1:((f=W())==null?void 0:f.cards.some(j=>j.id===o.id))??!1},$e=()=>{const f=W();return f?r==="mirror"?f.cards.length+1:f.id===a.id?f.cards.length:f.cards.length+1:0};let U;const re=()=>{var $;B.select.replaceChildren(...i.map(L=>this.createSelectOption(L.id,L.title,L.id===d)));const f=N(),j=(f==null?void 0:f.columns)??[];j.some(L=>L.id===s)||(s=(($=j[0])==null?void 0:$.id)??""),A.select.replaceChildren(...j.map(L=>this.createSelectOption(L.id,L.title,L.id===s)));const F=$e();m=Math.min(Math.max(m,1),F||1),z.select.replaceChildren(...Array.from({length:F},(L,ne)=>this.createSelectOption(ne+1,String(ne+1),ne+1===m))),Fe()?X.show(this.runtime.i18n.t("boards.cardMirror.duplicateDestination"),"warning"):W()?X.clear():X.show(this.runtime.i18n.t("boards.cardMirror.noDestination"),"error"),U.disabled=!W()},X=ve({tone:"error",className:"mb-3"});B.select.addEventListener("change",()=>{var f,j;d=B.select.value,s=((j=(f=i.find(F=>F.id===d))==null?void 0:f.columns[0])==null?void 0:j.id)??"",m=1,re()}),A.select.addEventListener("change",()=>{s=A.select.value,m=s===a.id?m:1,re()}),z.select.addEventListener("change",()=>{m=Number(z.select.value)}),U=_({text:this.runtime.i18n.t(h),tone:"primary",size:"md",className:c.moveButton,onClick:()=>{const f=W();if(!f)return;const j=this.createPlacementTargetFromPosition(f,m,r==="move"?n:void 0),F=a.cards.findIndex($=>y($)===n);if(this.closeMoveCardPopover(),r==="mirror"){this.closeQuickCardEditor();const{column:$,...L}=j;this.handlers.onCreateCardMirror(o.id,$,L);return}if(f.id===a.id&&m-1===F){this.closeQuickCardEditor();return}this.closeQuickCardEditor(),this.handlers.onPatchCardPlacement(n,j)}}),U.setAttribute("data-testid","move-card-popover-move-button");const ie=document.createElement("div");ie.className=c.moveActions,ie.append(U),K.append(B.field,A.field,z.field),S.append(M,q,K,X.element),C.append(S,ie),b.append(x,C);let G;G=new T({container:e,panel:b,positioning:"viewport",panelZIndex:300,onOpenChange:f=>{var j;e.setAttribute("aria-expanded",f?"true":"false"),!f&&((j=this.moveCardPopover)==null?void 0:j.menu)===G&&this.closeMoveCardPopover()}}),G.mount(),this.moveCardPopover={menu:G,panel:b,trigger:e},re(),G.openAt({anchor:e,placement:"bottom-start",fallbackPlacements:["bottom-end","top-start","top-end"],gap:8,margin:12,lockPlacementAfterOpen:!0})}renderMoveCardTab(e,t){const a=document.createElement("button");return a.type="button",a.className=t?c.moveTabSelected:c.moveTab,a.setAttribute("role","tab"),a.setAttribute("aria-selected",t?"true":"false"),a.disabled=!t,a.textContent=this.runtime.i18n.t(e),a}createMoveSelectField(e){const t=document.createElement("label");t.className=c.moveField,t.htmlFor=e.id;const a=document.createElement("span");a.className=c.moveLabel,a.textContent=e.label;const o=document.createElement("select");return o.id=e.id,o.className=c.moveSelect,o.setAttribute("data-testid",`${e.id}-select`),t.append(a,o),{field:t,select:o}}createSelectOption(e,t,a){const o=document.createElement("option");return o.value=String(e),o.textContent=t,o.selected=a,o}renderCardBackLayout(e,t,a,o,r){const i=document.createElement("div");i.className=c.layout;const n=document.createElement("main");n.className=c.main,n.setAttribute("data-auto-scrollable","true"),n.append(this.renderCardBackTitleSection(a,o),this.renderCardBackQuickActions(a),this.renderCardBackLabelsHost(a),...this.renderCardBackEntityLinksSection(a),this.renderCardBackDescriptionSection(a,o,r),this.renderCardBackChecklistsSection(a),this.renderCardBackAttachmentsSection());const d=this.renderCardBackAside(e,t);return i.append(n,d),i}renderCardBackTitleSection(e,t){const a=document.createElement("section");a.className=`${c.section} ${c.titleSection}`,a.setAttribute("data-testid","card-back-header");const o=document.createElement("div");o.className=c.sectionIcon;const r=this.createCardCompletionToggle(e,{className:Z(e)?c.doneButtonCompleted:c.doneButton,testId:"card-back-completion-toggle"});o.append(r);const i=document.createElement("div");i.className=c.sectionMain;const n=document.createElement("hgroup"),d=document.createElement("h2");return d.id="card-back-name",d.className=c.hiddenShellPart,d.textContent=e.title,n.append(d,t),i.append(n),a.append(o,i),a}renderCardBackQuickActions(e){const t=document.createElement("section");t.className=`${c.section} ${c.quickActions}`;const a=document.createElement("div");a.className=c.sectionIcon;const o=document.createElement("div");o.className=c.sectionMain;const r=document.createElement("ul");return r.className=c.quickActionList,this.cardModalQuickActionList=r,this.populateCardBackQuickActions(r,e),o.append(r),t.append(a,o),t}populateCardBackQuickActions(e,t){e.replaceChildren();const a=[{labelKey:"boards.cardBack.add",icon:"plus",disabled:!0}];this.getCardModalDraftTagItems(t).length===0&&a.push({labelKey:"boards.cardBack.labels",icon:"tag",onClick:o=>this.openCardLabelsPopover(o,t)}),a.push({labelKey:"boards.cardLinks.link",icon:"link",onClick:()=>this.openCardEntityLinkModal(t)},{labelKey:"boards.cardLinks.createTask",icon:"check-box",onClick:()=>void this.createEntityFromCard(t,"task")},{labelKey:"boards.cardLinks.createStory",icon:"document",onClick:()=>void this.createEntityFromCard(t,"story")},{labelKey:"boards.cardLinks.createGoal",icon:"goal-circle",onClick:()=>void this.createEntityFromCard(t,"goal")},{labelKey:"boards.cardBack.dates",icon:"calendar",disabled:!0},{labelKey:"boards.cardBack.checklist",icon:"check-box",onClick:o=>this.openCardChecklistPopover(o,t)}),a.forEach(o=>{const r=document.createElement("li"),i=o.disabled===!0?this.createUnavailableCardBackButton(o.labelKey,o.icon):this.createAvailableCardBackButton({labelKey:o.labelKey,icon:o.icon,onClick:o.onClick});r.append(i),e.append(r)})}renderCardBackLabelsHost(e){const t=document.createElement("div");return t.className=c.labelsHost,t.setAttribute("data-testid","card-back-labels-host"),this.cardModalLabelsHost=t,this.populateCardBackLabelsHost(t,e),t}populateCardBackLabelsHost(e,t){e.replaceChildren();const a=this.getCardModalDraftTagItems(t);if(a.length===0)return;const o=document.createElement("section");o.className=c.labelsSection,o.setAttribute("aria-labelledby","card-back-labels-title");const r=document.createElement("h3");r.id="card-back-labels-title",r.className=c.labelsTitle,r.textContent=this.runtime.i18n.t("boards.cardBack.labels");const i=document.createElement("div");i.setAttribute("role","group"),i.setAttribute("aria-labelledby",r.id);const n=document.createElement("div");n.className=c.labelsList,n.setAttribute("data-testid","card-back-labels-container"),a.forEach(d=>{n.append(this.createCardBackLabelSwatch(d))}),n.append(this.createCardBackAddLabelButton(t)),i.append(n),o.append(r,i),e.append(o)}createCardBackLabelSwatch(e){const t=document.createElement("button");return t.type="button",t.className=c.labelSwatch,t.style.backgroundColor=e.color,t.style.color=zt(e.color),t.textContent=e.title,t.title=e.title,t.setAttribute("aria-label",e.title),t.setAttribute("data-testid","card-label"),t.dataset.tagId=String(e.id),t}createCardBackAddLabelButton(e){const t=P({icon:"plus",tone:"text",size:"md",className:c.labelAddButton,ariaLabel:this.runtime.i18n.t("boards.cardBack.addLabel"),title:this.runtime.i18n.t("boards.cardBack.addLabel"),onClick:()=>this.openCardLabelsPopover(t,e)});return t.setAttribute("data-testid","card-back-add-label-button"),t.dataset.role="goal-tag-picker-trigger",t.setAttribute("aria-haspopup","dialog"),t.setAttribute("aria-expanded","false"),t}createAvailableCardBackButton(e){const t=_({text:this.runtime.i18n.t(e.labelKey),tone:"text",size:"md",className:c.quickActionButton,onClick:()=>e.onClick(t)});return t.setAttribute("aria-haspopup","dialog"),t.setAttribute("aria-expanded","false"),D(t,e.icon),t}getCardModalDraftTagIds(e){return this.cardModalDraftTagIds===null&&(this.cardModalDraftTagIds=O(e)),this.cardModalDraftTagIds}getCardModalDraftTagItems(e){var r;const t=this.getCardModalDraftTagIds(e),a=new Set(t),o=new Map;return(r=e.tags)==null||r.forEach(i=>o.set(i.id,J(i))),this.tagItems.forEach(i=>o.set(i.id,i)),t.map(i=>o.get(i)).filter(i=>!!i&&a.has(i.id))}refreshCardModalLabelControls(e){this.cardModalLabelsHost&&this.populateCardBackLabelsHost(this.cardModalLabelsHost,e),this.cardModalQuickActionList&&this.populateCardBackQuickActions(this.cardModalQuickActionList,e)}patchCardModalTagIds(e,t){const a=ae(t),o=this.cardModalRequestedTagIds??O(e);Ie(a,o)||(this.cardModalRequestedTagIds=a,this.handlers.onPatchCard(e.id,{tag_ids:a}))}openCardLabelsPopover(e,t){this.closeCardLabelsPopover();const a=I({elevated:!0,className:`${c.labelPickerPopover} hidden`});a.setAttribute("role","dialog"),a.setAttribute("aria-modal","false"),a.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.labels")),a.setAttribute("data-testid","card-back-label-picker-popover"),a.addEventListener("mousedown",i=>i.stopPropagation());const o=new Qe({variant:"labels",items:this.tagItems,selectedIds:this.getCardModalDraftTagIds(t),loading:this.tagCatalogStatus==="loading",errorMessage:this.getTagPickerErrorMessage(),placeholder:this.runtime.i18n.t("boards.cardBack.tagsPlaceholder"),searchPlaceholder:this.runtime.i18n.t("boards.cardBack.tagsSearchPlaceholder"),copy:{title:this.runtime.i18n.t("boards.cardBack.labels"),editTitle:this.runtime.i18n.t("boards.cardBack.editLabel"),createTitle:this.runtime.i18n.t("boards.cardBack.createLabel"),searchPlaceholder:this.runtime.i18n.t("boards.cardBack.tagsSearchPlaceholder"),labelsLegend:this.runtime.i18n.t("boards.cardBack.labels"),createButton:this.runtime.i18n.t("boards.cardBack.createNewLabel"),colorblindButton:this.runtime.i18n.t("boards.cardBack.enableColorblindMode"),titleLabel:this.runtime.i18n.t("boards.cardBack.labelTitle"),colorLegend:this.runtime.i18n.t("boards.cardBack.selectColor"),removeColor:this.runtime.i18n.t("boards.cardBack.removeColor"),save:this.runtime.i18n.t("common.save"),delete:this.runtime.i18n.t("common.delete"),close:this.runtime.i18n.t("boards.cardBack.closeLabelsPopover"),back:this.runtime.i18n.t("boards.cardBack.returnToLabels")},onRequestClose:()=>this.closeCardLabelsPopover(),onCreate:(i,n)=>this.createTagFromCardBack(i,n),onUpdate:(i,n)=>this.updateTagFromCardBack(i,n),onDelete:i=>this.deleteTagFromCardBack(i),onChange:i=>{this.cardModalDraftTagIds=i,this.refreshCardModalLabelControls(t),this.patchCardModalTagIds(t,i)}});o.element.setAttribute("data-testid","card-back-tag-picker"),a.append(o.element);let r;r=new T({container:e,panel:a,positioning:"viewport",panelZIndex:310,onOpenChange:i=>{var n;e.setAttribute("aria-expanded",i?"true":"false"),!i&&((n=this.cardLabelsPopover)==null?void 0:n.menu)===r&&this.closeCardLabelsPopover()}}),r.mount(),this.cardLabelsPopover={menu:r,panel:a,picker:o,trigger:e},r.openAt({anchor:e,placement:"bottom-start",fallbackPlacements:["bottom-end","top-start","top-end"],gap:8,margin:12,lockPlacementAfterOpen:!0}),window.requestAnimationFrame(()=>o.focusSearch())}openCardChecklistPopover(e,t){this.closeCardChecklistPopover();const a=I({elevated:!0,className:`${c.checklistPopover} hidden`});a.setAttribute("role","dialog"),a.setAttribute("aria-modal","false"),a.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.addChecklist")),a.setAttribute("data-testid","card-back-checklist-popover"),a.addEventListener("mousedown",b=>b.stopPropagation());const o=document.createElement("header");o.className=c.checklistPopoverHeader;const r=document.createElement("h3");r.className=c.checklistPopoverTitle,r.textContent=this.runtime.i18n.t("boards.cardBack.addChecklist");const i=P({icon:"x-mark",tone:"text",size:"sm",className:c.checklistPopoverClose,ariaLabel:this.runtime.i18n.t("common.close"),title:this.runtime.i18n.t("common.close"),onClick:()=>this.closeCardChecklistPopover()});o.append(r,i);const n=document.createElement("form");n.className=c.checklistPopoverForm;const d=document.createElement("label");d.className=c.checklistPopoverLabel,d.textContent=this.runtime.i18n.t("boards.cardBack.checklistTitle");const s=R({variant:"default",value:this.runtime.i18n.t("boards.cardBack.defaultChecklistTitle"),className:c.checklistPopoverInput});d.append(s);const m=document.createElement("div");m.className=c.checklistPopoverActions;const p=_({text:this.runtime.i18n.t("boards.cardBack.add"),tone:"primary",size:"md",className:c.checklistPopoverSubmit});p.type="submit",m.append(p),n.append(d,m),n.addEventListener("submit",b=>{b.preventDefault(),this.createCardModalChecklist(t,s.value)}),a.append(o,n);let h;h=new T({container:e,panel:a,positioning:"viewport",panelZIndex:310,onOpenChange:b=>{var x;e.setAttribute("aria-expanded",b?"true":"false"),!b&&((x=this.cardChecklistPopover)==null?void 0:x.menu)===h&&this.closeCardChecklistPopover()}}),h.mount(),this.cardChecklistPopover={menu:h,panel:a,trigger:e},h.openAt({anchor:e,placement:"bottom-start",fallbackPlacements:["bottom-end","top-start","top-end"],gap:8,margin:12,lockPlacementAfterOpen:!0}),window.requestAnimationFrame(()=>{s.focus(),s.select()})}async createTagFromCardBack(e,t){if(!this.tagCatalog)return null;try{const a=await this.tagCatalog.createTag(e,t),o=J(a);return this.upsertTagItem(o),o}catch{throw new Error(this.runtime.i18n.t("boards.cardBack.tagsCreateFailed"))}}async updateTagFromCardBack(e,t){if(!this.tagCatalog)return null;try{const a=await this.tagCatalog.updateTag(e,t),o=J(a);return this.upsertTagItem(o),o}catch{throw new Error(this.runtime.i18n.t("boards.cardBack.tagsUpdateFailed"))}}async deleteTagFromCardBack(e){if(this.tagCatalog)try{await this.tagCatalog.deleteTag(e),this.tagItems=this.tagItems.filter(a=>a.id!==e);const{card:t}=this.findActiveCardLocation();this.cardModalDraftTagIds=this.getCardModalDraftTagIds(t).filter(a=>a!==e)}catch{throw new Error(this.runtime.i18n.t("boards.cardBack.tagsDeleteFailed"))}}upsertTagItem(e){if(this.tagItems.findIndex(a=>a.id===e.id)>=0){this.tagItems=this.tagItems.map(a=>a.id===e.id?e:a);return}this.tagItems=[...this.tagItems,e]}renderCardBackEntityLinksSection(e){const t=ke(e);if(t.length===0)return[];const a=this.createCardBackSection("link",this.runtime.i18n.t("boards.cardLinks.title")),o=a.querySelector(`.${c.sectionMain}`),r=a.querySelector(`.${c.sectionHeader}`);if(!o||!r)return[a];const i=document.createElement("div");i.className=c.sectionActions,i.append(_({text:this.runtime.i18n.t("boards.cardLinks.link"),tone:"text",size:"md",className:u.quietButton,onClick:()=>this.openCardEntityLinkModal(e)})),r.append(i);const n=document.createElement("div");n.className=c.entityLinksHost,n.setAttribute("data-testid","card-entity-links");const d=document.createElement("ul");return d.className=c.entityLinksList,t.forEach(s=>{d.append(this.renderCardEntityLinkItem(e,s))}),n.append(d),o.append(n),[a]}renderCardEntityLinkItem(e,t){var m;const a=document.createElement("li");a.className=c.entityLinkItem;const o=document.createElement("span");o.className=c.entityLinkIcon,o.append(E(le(t.entity_type),{size:16}));const r=document.createElement("span");r.className=c.entityLinkContent;const i=document.createElement("span");i.className=c.entityLinkTitle,i.textContent=H(t);const n=document.createElement("span");n.className=c.entityLinkMeta;const d=this.runtime.i18n.t(ee(t.entity_type));n.textContent=(m=t.entity)!=null&&m.status?`${d} - ${t.entity.status}`:d,r.append(i,n);const s=P({icon:"ellipsis-vertical",tone:"text",size:"sm",className:c.entityLinkMenuTriggerButton,ariaLabel:this.runtime.i18n.t("boards.cardLinks.actions",{title:H(t)}),title:this.runtime.i18n.t("boards.cardBack.actions")});return s.setAttribute("aria-haspopup","dialog"),s.setAttribute("aria-expanded","false"),s.setAttribute("data-testid","card-entity-link-menu-button"),s.addEventListener("click",p=>{var h;if(p.stopPropagation(),((h=this.cardEntityLinkMenuPopover)==null?void 0:h.trigger)===s){this.closeCardEntityLinkMenuPopover();return}this.openCardEntityLinkMenuPopover(s,e,t)}),a.append(o,r,s),a}openCardEntityLinkMenuPopover(e,t,a){this.closeCardEntityLinkMenuPopover();const o=I({elevated:!0,className:`${c.entityLinkMenuPopover} hidden`});o.setAttribute("role","dialog"),o.setAttribute("aria-modal","false"),o.setAttribute("aria-label",this.runtime.i18n.t("boards.cardLinks.actions",{title:H(a)})),o.setAttribute("data-testid","card-entity-link-menu-popover"),o.addEventListener("mousedown",n=>n.stopPropagation());const r=document.createElement("ul");r.className=c.entityLinkMenuList,r.append(this.renderCardEntityLinkMenuItem({labelKey:"boards.cardLinks.openAction",ariaLabel:this.runtime.i18n.t("boards.cardLinks.open",{title:H(a)}),icon:"arrow-right",onClick:()=>{this.closeCardEntityLinkMenuPopover(),this.openLinkedEntity(a)}}),this.renderCardEntityLinkMenuItem({labelKey:"boards.cardLinks.unlinkAction",ariaLabel:this.runtime.i18n.t("boards.cardLinks.unlink",{title:H(a)}),icon:"link-slash",onClick:()=>{this.closeCardEntityLinkMenuPopover(),this.unlinkCardEntity(t,a)}}),this.renderCardEntityLinkMenuItem({labelKey:"boards.cardLinks.deleteEntity",ariaLabel:this.runtime.i18n.t("boards.cardLinks.deleteEntityLabel",{title:H(a)}),icon:"trash",danger:!0,onClick:()=>{this.closeCardEntityLinkMenuPopover(),this.deleteLinkedEntity(t,a)}})),o.append(r);let i;i=new T({container:e,panel:o,positioning:"viewport",panelZIndex:320,onOpenChange:n=>{var d;e.setAttribute("aria-expanded",n?"true":"false"),!n&&((d=this.cardEntityLinkMenuPopover)==null?void 0:d.menu)===i&&this.closeCardEntityLinkMenuPopover()}}),i.mount(),this.cardEntityLinkMenuPopover={menu:i,panel:o,trigger:e},i.openAt({anchor:e,placement:"bottom-end",fallbackPlacements:["bottom-start","top-end","top-start"],gap:4,margin:12,lockPlacementAfterOpen:!0})}renderCardEntityLinkMenuItem(e){const t=document.createElement("li");t.className=c.entityLinkMenuItem;const a=_({text:this.runtime.i18n.t(e.labelKey),tone:"text",size:"md",className:e.danger?c.entityLinkMenuDangerButton:c.entityLinkMenuButton,onClick:e.onClick});return a.setAttribute("aria-label",e.ariaLabel),D(a,e.icon),t.append(a),t}async unlinkCardEntity(e,t){await Promise.resolve(this.handlers.onDeleteCardEntityLink(t.id)),await this.refreshOpenCardEntityLinks(e.id)}async deleteLinkedEntity(e,t){await Promise.resolve(this.handlers.onDeleteLinkedEntity(e,t)),await this.refreshOpenCardEntityLinks(e.id)}async createEntityFromCard(e,t){await Promise.resolve(this.handlers.onCreateCardEntityFromCard(e,t)),await this.refreshOpenCardEntityLinks(e.id)}async refreshOpenCardEntityLinks(e){const t=this.activeCardPlacementId&&this.state?this.findCardLocation(this.activeCardPlacementId,this.state):null;!t||t.card.id!==e||this.renderCardModal(t)}openLinkedEntity(e){window.dispatchEvent(new CustomEvent("boardLinkedEntityOpenRequested",{detail:{entityType:e.entity_type,entityId:e.entity_id}}))}openCardEntityLinkModal(e){let t=null;const{overlay:a,container:o,body:r}=Ce(this.runtime.i18n.t("boards.cardLinks.linkToEntity"),{zIndex:360,onClose:()=>t==null?void 0:t.remove()});t=a,o.setAttribute("data-testid","card-entity-link-modal");const i=document.createElement("div");i.className=c.entityLinkPicker;const n=document.createElement("label");n.className=c.entityLinkPickerField;const d=document.createElement("span");d.className=c.moveLabel,d.textContent=this.runtime.i18n.t("boards.cardLinks.selectType");const s=document.createElement("select");s.className=c.moveSelect,["task","story","goal"].forEach(B=>{const A=document.createElement("option");A.value=B,A.textContent=this.runtime.i18n.t(ee(B)),s.append(A)}),n.append(d,s);const p=document.createElement("label");p.className=c.entityLinkPickerField;const h=document.createElement("span");h.className=c.moveLabel,h.textContent=this.runtime.i18n.t("boards.cardLinks.search");const b=R({variant:"default",className:c.entityLinkPickerInput,placeholder:this.runtime.i18n.t("boards.cardLinks.searchPlaceholder"),disabled:!this.entityCatalog});p.append(h,b);const x=document.createElement("div");x.className=c.entityLinkPickerResults,x.setAttribute("data-testid","card-entity-link-results"),i.append(n,p,x),r.append(i),document.body.append(a);let g=this.entityCatalog?"idle":"error",v=[],C=0,S=null;const M=()=>{if(x.replaceChildren(),g==="loading"){x.append(this.createEntityLinkPickerMessage(this.runtime.i18n.t("boards.cardLinks.loading")));return}if(g==="error"){x.append(this.createEntityLinkPickerMessage(this.runtime.i18n.t("boards.cardLinks.loadFailed")));return}if(v.length===0){x.append(this.createEntityLinkPickerMessage(this.runtime.i18n.t("boards.cardLinks.noResults")));return}const B=new Set(ke(e).map(N=>`${N.entity_type}:${N.entity_id}`)),A=document.createElement("ul");A.className=c.entityLinkPickerList;const z=s.value;v.forEach(N=>{A.append(this.renderEntityLinkPickerResult({card:e,entityType:z,item:N,disabled:B.has(`${z}:${N.id}`),close:()=>a.remove()}))}),x.append(A)},q=async()=>{const B=++C;g="loading",M();try{if(v=await this.searchCardEntityCatalog(s.value,b.value),B!==C)return;g="ready",M()}catch{if(B!==C)return;v=[],g="error",M()}},K=()=>{S!==null&&window.clearTimeout(S),S=window.setTimeout(()=>{S=null,q()},180)};s.addEventListener("change",()=>{v=[],q()}),b.addEventListener("input",K),M(),this.entityCatalog&&(q(),b.focus())}createEntityLinkPickerMessage(e){const t=document.createElement("p");return t.className=c.entityLinksMessage,t.textContent=e,t}renderEntityLinkPickerResult(e){const t=document.createElement("li"),a=document.createElement("button");a.type="button",a.className=c.entityLinkPickerButton,a.disabled=e.disabled,a.setAttribute("data-testid","card-entity-link-result"),a.addEventListener("click",async()=>{a.disabled=!0,await Promise.resolve(this.handlers.onCreateCardEntityLink(e.card.id,e.entityType,e.item.id)),e.close(),await this.refreshOpenCardEntityLinks(e.card.id)});const o=E(le(e.entityType),{size:16});o.setAttribute("aria-hidden","true");const r=document.createElement("span");r.className=c.entityLinkContent;const i=document.createElement("span");i.className=c.entityLinkTitle,i.textContent=e.item.title;const n=document.createElement("span");return n.className=c.entityLinkMeta,n.textContent=e.item.status?`${this.runtime.i18n.t(ee(e.entityType))} - ${e.item.status}`:this.runtime.i18n.t(ee(e.entityType)),r.append(i,n),a.append(o,r),t.append(a),t}searchCardEntityCatalog(e,t){return this.entityCatalog?e==="task"?this.entityCatalog.searchTasks(t):e==="story"?this.entityCatalog.searchStories(t):this.entityCatalog.searchGoals(t):Promise.resolve([])}renderCardBackChecklistsSection(e){const t=document.createElement("div");return t.className=c.checklistsHost,t.setAttribute("data-testid","card-back-checklists-host"),this.cardModalChecklistHost=t,this.populateCardBackChecklistsHost(e),t}populateCardBackChecklistsHost(e){var i;const t=this.cardModalChecklistHost;if(!t)return;t.replaceChildren();const a=((i=this.cardChecklistPanelState)==null?void 0:i.cardId)===e.id?this.cardChecklistPanelState:null,o=!a||a.status==="idle"&&a.checklists.length===0||a.status==="ready"&&a.checklists.length===0&&!a.error;if(t.hidden=o,o)return;if((a==null?void 0:a.status)==="loading"){const n=this.createCardBackSection("check-box",this.runtime.i18n.t("boards.cardBack.checklist")),d=n.querySelector(`.${c.sectionMain}`),s=document.createElement("div");s.className=c.checklistsMessage,s.textContent=this.runtime.i18n.t("boards.cardBack.checklistsLoading"),d==null||d.append(s),t.append(n);return}if(a!=null&&a.error){const n=this.createCardBackSection("check-box",this.runtime.i18n.t("boards.cardBack.checklist")),d=n.querySelector(`.${c.sectionMain}`),s=ve({tone:"error"});s.show(this.runtime.i18n.t(a.error)),d==null||d.append(s.element),t.append(n)}const r=(a==null?void 0:a.checklists)??[];if(r.length>0){const n=document.createElement("div");n.className=c.checklistsList,r.forEach(d=>{n.append(this.renderCardChecklist(e,d))}),t.append(n)}}renderCardChecklist(e,t){const a=t.items.filter(C=>C.state==="complete").length,o=t.items.length,r=o===0?0:Math.round(a/o*100),i=this.hiddenCheckedChecklistIds.has(t.id),n=i?t.items.filter(C=>C.state!=="complete"):t.items,d=document.createElement("div");d.className=c.checklistActions,a>0&&d.append(_({text:i?this.runtime.i18n.t("boards.cardBack.showCheckedItems",{count:a}):this.runtime.i18n.t("boards.cardBack.hideCheckedItems"),tone:"text",size:"md",className:c.checklistActionButton,onClick:()=>this.toggleChecklistCheckedItems(e,t.id)}));const s=_({text:this.runtime.i18n.t("common.delete"),tone:"text",size:"md",className:c.checklistActionButton,onClick:()=>this.deleteCardModalChecklist(e.id,t.id)});s.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.deleteChecklist",{title:t.title})),d.append(s);const m=this.createCardBackSection("check-box",t.title,d);if(m.classList.add(c.checklist),m.setAttribute("data-testid","card-checklist"),!m.querySelector(`.${c.sectionMain}`))return m;const h=document.createElement("div");h.className=c.checklistProgressRow;const b=document.createElement("span");b.className=c.checklistProgress,b.textContent=`${r}%`;const x=document.createElement("div");x.className=c.checklistProgressTrack;const g=document.createElement("span");g.className=c.checklistProgressBar,g.style.width=`${r}%`,x.append(g),h.append(b,x);const v=document.createElement("ul");return v.className=c.checkItemList,n.forEach(C=>{v.append(this.renderCardChecklistItem(e,C))}),m.append(h),m.append(v,this.renderCheckItemComposer(e,t)),m}renderCardChecklistItem(e,t){const a=document.createElement("li");a.className=c.checkItem,a.setAttribute("data-testid","card-check-item");const o=new Ue({checked:t.state==="complete",ariaLabel:t.title,className:c.checkItemCheckbox,onChange:n=>{this.patchCardModalCheckItem(e.id,t.id,{state:n?"complete":"incomplete"})}}),r=this.renderCardChecklistItemTitle(e,t),i=P({icon:"ellipsis-vertical",tone:"text",size:"sm",className:c.checkItemMenuTriggerButton,ariaLabel:this.runtime.i18n.t("boards.cardBack.checkItemActions",{title:t.title}),title:this.runtime.i18n.t("boards.cardBack.actions")});return i.setAttribute("aria-haspopup","dialog"),i.setAttribute("aria-expanded","false"),i.setAttribute("data-testid","card-check-item-menu-button"),i.addEventListener("click",n=>{var d;if(n.stopPropagation(),((d=this.cardCheckItemMenuPopover)==null?void 0:d.trigger)===i){this.closeCardCheckItemMenuPopover();return}this.openCardCheckItemMenuPopover(i,e,t)}),a.append(o.getElement(),r,i),a}openCardCheckItemMenuPopover(e,t,a){this.closeCardCheckItemMenuPopover();const o=I({elevated:!0,className:`${c.checkItemMenuPopover} hidden`});o.setAttribute("role","dialog"),o.setAttribute("aria-modal","false"),o.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.checkItemActions",{title:a.title})),o.setAttribute("data-testid","card-check-item-menu-popover"),o.addEventListener("mousedown",s=>s.stopPropagation());const r=document.createElement("ul");r.className=c.checkItemMenuList;const i=document.createElement("li");i.className=c.checkItemMenuItem;const n=_({text:this.runtime.i18n.t("common.delete"),tone:"text",size:"md",className:c.checkItemMenuButton,onClick:()=>{this.closeCardCheckItemMenuPopover(),this.deleteCardModalCheckItem(t.id,a.id)}});n.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.deleteCheckItem",{title:a.title})),D(n,"trash"),i.append(n),r.append(i),o.append(r);let d;d=new T({container:e,panel:o,positioning:"viewport",panelZIndex:320,onOpenChange:s=>{var m;e.setAttribute("aria-expanded",s?"true":"false"),!s&&((m=this.cardCheckItemMenuPopover)==null?void 0:m.menu)===d&&this.closeCardCheckItemMenuPopover()}}),d.mount(),this.cardCheckItemMenuPopover={itemId:a.id,menu:d,panel:o,trigger:e},d.openAt({anchor:e,placement:"bottom-end",fallbackPlacements:["bottom-start","top-end","top-start"],gap:4,margin:12,lockPlacementAfterOpen:!0})}renderCardChecklistItemTitle(e,t){const a=document.createElement("button");return a.type="button",a.className=t.state==="complete"?c.checkItemTitleComplete:c.checkItemTitle,a.textContent=t.title,a.addEventListener("click",()=>{this.startCardChecklistItemTitleEdit(e,t,a)}),a}startCardChecklistItemTitleEdit(e,t,a){const o=document.createElement("input");o.type="text",o.className=c.checkItemTitleInput,o.value=t.title,o.setAttribute("aria-label",t.title);let r=!1;const i=()=>{a.isConnected||o.replaceWith(a)},n=()=>{if(r)return;r=!0;const s=o.value.trim();if(!s||s===t.title){i();return}this.patchCardModalCheckItem(e.id,t.id,{title:s})},d=()=>{r||(r=!0,i())};o.addEventListener("keydown",s=>{s.key==="Enter"&&(s.preventDefault(),n()),s.key==="Escape"&&(s.preventDefault(),d())}),o.addEventListener("blur",n),a.replaceWith(o),window.requestAnimationFrame(()=>{o.focus(),o.select()})}renderCheckItemComposer(e,t){if(!this.expandedCheckItemComposerIds.has(t.id))return _({text:this.runtime.i18n.t("boards.cardBack.checkItemPlaceholder"),tone:"text",size:"md",className:c.checkItemCollapsedComposer,onClick:()=>this.expandCheckItemComposer(e,t.id)});const a=document.createElement("form");a.className=c.checkItemComposer;const o=R({variant:"default",className:c.checkItemComposerInput,placeholder:this.runtime.i18n.t("boards.cardBack.checkItemPlaceholder")});o.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.checkItemPlaceholder")),o.addEventListener("keydown",m=>{m.key==="Enter"&&(m.preventDefault(),a.requestSubmit()),m.key==="Escape"&&this.collapseCheckItemComposer(e,t.id)});const r=document.createElement("div");r.className=c.checkItemComposerActions;const i=document.createElement("div");i.className=c.checkItemComposerPrimaryActions;const n=_({text:this.runtime.i18n.t("boards.cardBack.addItem"),tone:"primary",size:"md",className:u.primaryButton});n.type="submit";const d=_({text:this.runtime.i18n.t("common.cancel"),tone:"text",size:"md",className:u.quietButton,onClick:()=>this.collapseCheckItemComposer(e,t.id)});d.type="button",i.append(n,d);const s=document.createElement("div");return s.className=c.checkItemComposerMetaActions,s.append(this.createCheckItemMetaButton("plus","boards.cardBack.assign"),this.createCheckItemMetaButton("calendar","boards.cardBack.dueDate")),r.append(i,s),a.addEventListener("submit",m=>{m.preventDefault(),this.createCardModalCheckItem(e.id,t.id,o.value)}),a.append(o,r),window.requestAnimationFrame(()=>o.focus()),a}createCheckItemMetaButton(e,t){const a=_({text:this.runtime.i18n.t(t),tone:"text",size:"md",className:c.checkItemMetaButton,disabled:!0});return D(a,e),a}setCardChecklistPanelState(e){this.cardChecklistPanelState=e;const t=this.activeCardPlacementId&&this.state?this.findCardLocation(this.activeCardPlacementId,this.state):null;(t==null?void 0:t.card.id)===e.cardId&&this.populateCardBackChecklistsHost(t.card)}async loadCardModalChecklists(e){var a;const t=++this.cardChecklistLoadVersion;this.setCardChecklistPanelState({cardId:e,status:"loading",checklists:((a=this.cardChecklistPanelState)==null?void 0:a.cardId)===e?this.cardChecklistPanelState.checklists:[],error:null});try{const o=await Promise.resolve(this.handlers.onLoadCardChecklists(e));if(t!==this.cardChecklistLoadVersion||this.activeCardPlacementId===null)return;this.setCardChecklistPanelState({cardId:e,status:"ready",checklists:o,error:null})}catch{if(t!==this.cardChecklistLoadVersion)return;this.setCardChecklistPanelState({cardId:e,status:"error",checklists:[],error:"boards.cardBack.checklistsLoadFailed"})}}focusCardChecklistComposer(){var t;const e=(t=this.cardChecklistPopover)==null?void 0:t.panel.querySelector("input");e==null||e.focus()}toggleChecklistCheckedItems(e,t){this.hiddenCheckedChecklistIds.has(t)?this.hiddenCheckedChecklistIds.delete(t):this.hiddenCheckedChecklistIds.add(t),this.populateCardBackChecklistsHost(e)}expandCheckItemComposer(e,t){this.expandedCheckItemComposerIds.add(t),this.populateCardBackChecklistsHost(e)}collapseCheckItemComposer(e,t){this.expandedCheckItemComposerIds.delete(t),this.populateCardBackChecklistsHost(e)}async createCardModalChecklist(e,t){const a=(t==null?void 0:t.trim())??"";if(!a){this.focusCardChecklistComposer();return}await this.runCardChecklistMutation(e.id,async()=>{await Promise.resolve(this.handlers.onCreateCardChecklist(e.id,a))}),this.closeCardChecklistPopover()}async deleteCardModalChecklist(e,t){await this.runCardChecklistMutation(e,async()=>{await Promise.resolve(this.handlers.onDeleteCardChecklist(t))})}async createCardModalCheckItem(e,t,a){const o=a.trim();o&&(await this.runCardChecklistMutation(e,async()=>{await Promise.resolve(this.handlers.onCreateCardCheckItem(t,o))}),this.expandedCheckItemComposerIds.delete(t))}async patchCardModalCheckItem(e,t,a){await this.runCardChecklistMutation(e,async()=>{await Promise.resolve(this.handlers.onPatchCardCheckItem(t,a))})}async deleteCardModalCheckItem(e,t){await this.runCardChecklistMutation(e,async()=>{await Promise.resolve(this.handlers.onDeleteCardCheckItem(t))})}async runCardChecklistMutation(e,t){const a=this.cardChecklistPanelState;this.setCardChecklistPanelState({cardId:e,status:"saving",checklists:(a==null?void 0:a.cardId)===e?a.checklists:[],error:null});try{await t(),await this.loadCardModalChecklists(e)}catch{this.setCardChecklistPanelState({cardId:e,status:"error",checklists:(a==null?void 0:a.cardId)===e?a.checklists:[],error:"boards.cardBack.checklistsSaveFailed"})}}renderCardBackDescriptionSection(e,t,a){const o=this.createCardBackSection("document",this.runtime.i18n.t("boards.cardDescriptionLabel")),r=o.querySelector(`.${c.sectionMain}`);if(!r)return o;r.append(a);const i=document.createElement("div");i.className=c.editorActions;const n=_({text:this.runtime.i18n.t("common.save"),tone:"primary",size:"md",className:u.primaryButton,onClick:()=>this.saveCardModal(e,t,a)}),d=()=>{n.disabled=t.value.trim().length===0};return t.addEventListener("input",d),d(),i.append(_({text:this.runtime.i18n.t("common.cancel"),tone:"text",size:"md",className:u.quietButton,onClick:()=>this.closeCardModal()}),n),r.append(i),o}async deleteSharedCardFromQuickEditor(e){await this.deleteSharedCard(e,()=>this.closeQuickCardEditor())}async deleteSharedCardFromDetails(e){await this.deleteSharedCard(e,()=>{this.closeCardActionsPopover(),this.closeCardModal()})}async deleteSharedCard(e,t){await this.confirmSharedCardDeletion()&&(t(),this.handlers.onDeleteCard(e.id))}confirmSharedCardDeletion(){return this.openDeleteCardConfirmationDialog()}openDeleteCardConfirmationDialog(){return new Promise(e=>{let t=!1;const a=b=>{t||(t=!0,e(b))},o=()=>r.remove(),{overlay:r,container:i,body:n,footer:d}=Ce(this.runtime.i18n.t("boards.actions.deleteCard"),{intent:"confirm",zIndex:360,onClose:()=>{a(!1),o()}}),s=document.createElement("p");s.className="text-sm leading-relaxed text-slate-600",s.id=`delete-card-confirm-message-${Math.random().toString(36).slice(2,9)}`,s.textContent=this.runtime.i18n.t("boards.cardMirror.deleteSharedConfirm"),i.setAttribute("aria-describedby",s.id),n.append(s);const m=Xe({variant:"confirm"}),p=_({text:this.runtime.i18n.t("common.cancel"),tone:"text",size:"md",className:ye("default"),onClick:()=>{a(!1),o()}});p.setAttribute("data-testid","delete-card-cancel-button"),m.append(p);const h=_({text:this.runtime.i18n.t("boards.actions.deleteCard"),tone:"destructive",size:"md",className:ye("wide"),onClick:()=>{a(!0),o()}});h.setAttribute("data-testid","delete-card-confirm-button"),m.append(h),d.append(m),i.addEventListener("keydown",b=>{b.stopPropagation(),b.key==="Escape"&&(b.preventDefault(),a(!1),o())})})}renderCardBackAttachmentsSection(){const e=this.createCardBackSection("link",this.runtime.i18n.t("boards.cardBack.attachments"),_({text:this.runtime.i18n.t("boards.cardBack.add"),tone:"text",size:"sm",className:u.quietButton,disabled:!0})),t=e.querySelector(`.${c.sectionMain}`);if(!t)return e;const a=document.createElement("div");return a.className=c.placeholderPanel,a.textContent=this.runtime.i18n.t("boards.cardBack.noAttachments"),t.append(a),e}renderCardBackAside(e,t){const a=document.createElement("aside");a.className=c.aside,a.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.comments"));const o=this.createCardBackSection("chat-bubble-left",this.runtime.i18n.t("boards.cardBack.comments"),_({text:this.runtime.i18n.t("boards.cardBack.showDetails"),tone:"text",size:"sm",className:u.quietButton,disabled:!0})),r=o.querySelector(`.${c.sectionMain}`);if(!r)return a;r.append(_({text:this.runtime.i18n.t("boards.cardBack.writeComment"),tone:"text",size:"md",className:c.activityInput,disabled:!0}));const i=document.createElement("ul");i.className=c.activityList;const n=document.createElement("li");n.className=c.activityItem;const d=document.createElement("span");d.className=c.avatar,d.textContent="M",d.setAttribute("aria-hidden","true");const s=document.createElement("span");return s.textContent=this.runtime.i18n.t("boards.cardBack.activityCreated",{board:e.title,column:t.title}),n.append(d,s),i.append(n),r.append(i),a.append(o),a}createCardBackSection(e,t,a){const o=document.createElement("section");o.className=c.section;const r=document.createElement("div");r.className=c.sectionIcon;const i=E(e,{size:20,strokeWidth:2});i.setAttribute("aria-hidden","true"),r.append(i);const n=document.createElement("div");n.className=c.sectionMain;const d=document.createElement("div");d.className=c.sectionHeader;const s=document.createElement("h3");s.className=c.sectionTitle,s.textContent=t;const m=document.createElement("div");return m.className=c.sectionActions,a&&m.append(a),d.append(s,m),n.append(d),o.append(r,n),o}createUnavailableCardBackButton(e,t){const a=_({text:this.runtime.i18n.t(e),tone:"text",size:"md",className:c.quickActionButton,disabled:!0});return D(a,t),a}saveCardModal(e,t,a){const o=t.value.trim();if(!o)return;const r=a.value,i=this.getCardModalDraftTagIds(e),n={};o!==e.title&&(n.title=o),r!==e.description&&(n.description=r);const d=this.cardModalRequestedTagIds??O(e);Ie(i,d)||(n.tag_ids=i),this.closeCardModal(),(n.title!==void 0||n.description!==void 0||n.tag_ids!==void 0)&&this.handlers.onPatchCard(e.id,n)}closeCardModal(){var e;this.closeCardActionsPopover(),this.closeCardLabelsPopover(),this.closeCardChecklistPopover(),this.closeCardCheckItemMenuPopover(),this.closeMoveCardPopover(),this.cardModalDraftTagIds=null,this.cardModalRequestedTagIds=null,this.cardModalLabelsHost=null,this.cardModalQuickActionList=null,this.cardModalChecklistHost=null,this.cardChecklistPanelState=null,this.cardChecklistLoadVersion+=1,this.activeCardPlacementId=null,(e=this.cardModalOverlay)==null||e.remove(),this.cardModalOverlay=null}closeCardLabelsPopover(){const e=this.cardLabelsPopover;e&&(this.cardLabelsPopover=null,e.trigger.setAttribute("aria-expanded","false"),e.menu.close(),e.menu.unmount(),e.picker.destroy(),e.panel.remove())}closeCardChecklistPopover(){const e=this.cardChecklistPopover;e&&(this.cardChecklistPopover=null,e.trigger.setAttribute("aria-expanded","false"),e.menu.close(),e.menu.unmount(),e.panel.remove())}closeCardCheckItemMenuPopover(){const e=this.cardCheckItemMenuPopover;e&&(this.cardCheckItemMenuPopover=null,e.trigger.setAttribute("aria-expanded","false"),e.menu.close(),e.menu.unmount(),e.panel.remove())}closeCardEntityLinkMenuPopover(){const e=this.cardEntityLinkMenuPopover;e&&(this.cardEntityLinkMenuPopover=null,e.trigger.setAttribute("aria-expanded","false"),e.menu.close(),e.menu.unmount(),e.panel.remove())}closeMoveCardPopover(){const e=this.moveCardPopover;e&&(this.moveCardPopover=null,e.trigger.setAttribute("aria-expanded","false"),e.menu.close(),e.menu.unmount(),e.panel.remove())}closeCardActionsPopover(){const e=this.cardActionsPopover;e&&(this.cardActionsPopover=null,e.trigger.setAttribute("aria-expanded","false"),e.menu.close(),e.menu.unmount(),e.panel.remove())}closeListActionsPopover(){const e=this.listActionsPopover;e&&(this.listActionsPopover=null,e.trigger.setAttribute("aria-expanded","false"),e.menu.close(),e.menu.unmount(),e.panel.remove())}closeBoardPickerPopover(){const e=this.boardPickerPopover;e&&(this.closeBoardPickerActionsMenu(),this.boardPickerPopover=null,e.trigger.setAttribute("aria-expanded","false"),e.menu.close(),e.menu.unmount(),e.panel.remove())}closeBoardPickerActionsMenu(){var t;const e=(t=this.boardPickerPopover)==null?void 0:t.actionsMenu;e&&(this.boardPickerPopover.actionsMenu=null,e.menu.close(),e.menu.unmount(),e.panel.remove())}closeQuickCardEditor(){var e;(e=this.quickEditorOverlay)==null||e.remove(),this.quickEditorOverlay=null}getSelectedBoard(e){return e.boards.find(t=>t.id===e.selectedBoardId)??e.boards[0]??null}findCardLocation(e,t){for(const a of t.boards)for(const o of a.columns){const r=o.cards.find(i=>y(i)===e);if(r)return{board:a,column:o,card:r,placementId:e}}return null}submitColumnTitle(e){var a;const t=((a=this.columnTitleTextarea)==null?void 0:a.value.trim())??"";t&&(this.handlers.onCreateColumn(e,t),this.columnTitleTextarea&&(this.columnTitleTextarea.value=""),this.isColumnComposerExpanded=!1)}startBoardTitleEdit(e){this.editingBoardTitleId=e,this.rerenderCurrentState()}finishBoardTitleEdit(e,t){var o;if(this.editingBoardTitleId!==e.id)return;const a=((o=this.boardTitleEditInput)==null?void 0:o.value.trim())??"";if(this.editingBoardTitleId=null,this.boardTitleEditInput=null,t&&a.length>0&&a!==e.title){this.handlers.onPatchBoard(e.id,{title:a});return}this.rerenderCurrentState()}startColumnTitleEdit(e){this.editingColumnTitleId=e,this.rerenderCurrentState()}finishColumnTitleEdit(e,t){var o;if(this.editingColumnTitleId!==e.id)return;const a=((o=this.columnTitleEditInput)==null?void 0:o.value.trim())??"";if(this.editingColumnTitleId=null,this.columnTitleEditInput=null,t&&a.length>0&&a!==e.title){this.handlers.onPatchColumn(e.id,{title:a});return}this.rerenderCurrentState()}expandCardComposer(e){this.expandedCardComposerColumnId=e,this.rerenderCurrentState()}collapseCardComposer(){this.expandedCardComposerColumnId=null,this.rerenderCurrentState()}expandColumnComposer(){this.isColumnComposerExpanded=!0,this.rerenderCurrentState()}collapseColumnComposer(){this.isColumnComposerExpanded=!1,this.rerenderCurrentState()}submitCard(e){const t=this.cardDrafts.get(e);if(!t)return;const a=t.title.value.trim();a&&(this.handlers.onCreateCard(e,a,""),t.title.value="",this.expandedCardComposerColumnId=null,this.rerenderCurrentState())}rerenderCurrentState(){this.state&&this.render(this.state)}unmountHeaderMenu(){var e;(e=this.headerMenu)==null||e.unmount(),this.headerMenu=null}}function me(l){return{id:l.uuid??String(l.id),title:l.title,status:l.status??null}}function ue(l){return(l==null?void 0:l.trim())??""}class Ot{constructor(e={}){this.root=null,this.store=null,this.view=null,this.subscriptions=new je,this.runtime=e.runtime??ge()}mount(e){if(this.root)return;const t=document.createElement("div");t.dataset.module="boards",t.className="h-full w-full",e.appendChild(t),this.root=t;const a=new Ye(Ve.apiUrl),o=new Ze(a),r=new Je(a),i=new et(a),n=new ht(new ot(a)),d=new Rt(t,{runtime:this.runtime,tagCatalog:{loadTags:()=>k(o.getTags()),createTag:(s,m)=>k(o.createTag({title:s,color:m??tt(s)})),updateTag:(s,m)=>k(o.updateTag(s,m)),deleteTag:async s=>{await k(o.deleteTag(s))}},entityCatalog:{searchTasks:async s=>(await k(o.fetchTasks({search:s,page:1,pageSize:20}))).results.map(me),searchStories:async s=>(await k(r.fetchStories({search:s,page:1,pageSize:20}))).results.map(me),searchGoals:async s=>(await k(i.searchGoalsForPicker({search:s,page:1,pageSize:20}))).results.map(me)},handlers:{onRefresh:()=>void n.load(),onSelectBoard:s=>n.selectBoard(s),onCreateBoard:s=>void n.createBoard(s),onPatchBoard:(s,m)=>void n.patchBoard(s,m),onToggleBoardStar:s=>n.toggleBoardStar(s),onUpdateBoardGroup:(s,m)=>n.updateBoardGroup(s,m),onDeleteBoard:s=>void n.deleteBoard(s),onCreateColumn:(s,m)=>void n.createColumn(s,m),onPatchColumn:(s,m)=>void n.patchColumn(s,m),onDeleteColumn:s=>void n.deleteColumn(s),onCreateCard:(s,m,p)=>void n.createCard(s,m,p),onPatchCard:(s,m)=>void n.patchCard(s,m),onLoadCardChecklists:s=>n.loadCardChecklists(s),onCreateCardChecklist:(s,m)=>n.createCardChecklist(s,m),onDeleteCardChecklist:s=>n.deleteCardChecklist(s),onCreateCardCheckItem:(s,m)=>n.createCardCheckItem(s,m),onPatchCardCheckItem:(s,m)=>n.patchCardCheckItem(s,m),onDeleteCardCheckItem:s=>n.deleteCardCheckItem(s),onCreateCardEntityLink:(s,m,p)=>n.createCardEntityLink(s,m,p),onCreateCardEntityFromCard:async(s,m)=>{if(m==="task"){const h=await k(o.createTask({title:s.title.trim(),description:ue(s.description),is_standalone:!0}));return n.createCardEntityLink(s.id,m,h.uuid??String(h.id))}if(m==="story"){const h=await k(r.createStory({title:s.title.trim(),description:ue(s.description)}));return n.createCardEntityLink(s.id,m,h.uuid??String(h.id))}const p=await k(i.createGoal({title:s.title.trim(),description:ue(s.description)}));return n.createCardEntityLink(s.id,m,p.uuid??String(p.id))},onDeleteCardEntityLink:s=>n.deleteCardEntityLink(s),onDeleteLinkedEntity:async(s,m)=>{m.entity_type==="task"?await k(o.deleteTask(m.entity_id)):m.entity_type==="story"?await k(r.deleteStory(m.entity_id)):await k(i.deleteGoal(m.entity_id)),await n.load()},onCreateCardMirror:(s,m,p)=>void n.createCardMirror(s,m,p),onPatchCardPlacement:(s,m)=>void n.patchCardPlacement(s,m),onDeleteCardPlacement:s=>void n.deleteCardPlacement(s),onDeleteCard:s=>void n.deleteCard(s)}});this.store=n,this.view=d,this.subscriptions.add(n.state$.subscribe(s=>d.render(s))),n.load()}unmount(){var e,t,a;this.subscriptions.unsubscribe(),this.subscriptions=new je,(e=this.view)==null||e.destroy(),this.view=null,(t=this.store)==null||t.destroy(),this.store=null,(a=this.root)==null||a.remove(),this.root=null}}class Kt{constructor(e={}){this.id="boards",this.app=null,this.runtime=e.runtime??ge()}mount(e){if(this.app)return;const t=new Ot({runtime:this.runtime});t.mount(e),this.app=t}unmount(){var e;(e=this.app)==null||e.unmount(),this.app=null}getAiAssistantSnapshot(){return null}}export{Kt as BoardsModule};
