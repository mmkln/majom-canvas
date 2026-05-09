import{m as Te,B as Ie,g as x,k as ce,l as ae,p as j,q as w,r as Le,u as A,v as L,w as oe,x as Se,y as Me,z as _,A as Ne,D as De,E as qe,F as ze,G as Oe,I as pe,d as be,H as Fe,e as Re,T as $e,J as We}from"./index-CWqM7Nx2.js";function He(d){return Array.isArray(d)?d:d.results}function E(d){return encodeURIComponent(String(d))}class Ke{constructor(e){this.http=e}getBoards(){return this.http.get("/boards/").pipe(Te(He))}createBoard(e){return this.http.post("/boards/",e)}updateBoard(e,t){return this.http.patch(`/boards/${E(e)}/`,t)}deleteBoard(e){return this.http.delete(`/boards/${E(e)}/`)}createColumn(e){return this.http.post("/columns/",e)}updateColumn(e,t){return this.http.patch(`/columns/${E(e)}/`,t)}deleteColumn(e){return this.http.delete(`/columns/${E(e)}/`)}createCard(e){return this.http.post("/cards/",e)}updateCard(e,t){return this.http.patch(`/cards/${E(e)}/`,t)}deleteCard(e){return this.http.delete(`/cards/${E(e)}/`)}createCardPlacement(e){return this.http.post("/card-placements/",e)}updateCardPlacement(e,t){return this.http.patch(`/card-placements/${E(e)}/`,t)}deleteCardPlacement(e){return this.http.delete(`/card-placements/${E(e)}/`)}}function v(d){return d.placement_id??d.id}function he(d){const e=d.pos??d.order??0,t=Number(e);return Number.isFinite(t)?t:0}function Qe(d,e){return he(d)-he(e)||v(d).localeCompare(v(e))||d.id.localeCompare(e.id)}const ne="boards-session-selected-board";function Pe(d){if(typeof d!="string")return null;const e=d.trim();return e.length>0?e:null}function ge(d,e){return e!==null&&d.some(t=>t.id===e)}function Ge(){try{return Pe(sessionStorage.getItem(ne))}catch{return null}}function fe(d){try{const e=Pe(d);if(e){sessionStorage.setItem(ne,e);return}sessionStorage.removeItem(ne)}catch{}}function Ue(d,e){var a;if(ge(d,e))return e;const t=Ge();return ge(d,t)?t:((a=d[0])==null?void 0:a.id)??null}const Xe=["lastOpenedAt","last_opened_at","lastActivityAt","last_activity_at","updatedAt","updated_at","createdAt","created_at"];function X(d){const e=d.meta;return e&&typeof e=="object"&&!Array.isArray(e)?e:null}function le(d){return{...X(d)??{}}}function Ye(d,e){const t=X(d);if(!t)return!1;for(const a of e){const o=t[a];if(typeof o=="boolean")return o}return!1}function G(d){return Ye(d,["favorite","favourite","starred"])}function re(d){const e=X(d);if(!e)return null;for(const t of Xe){const a=e[t],o=typeof a=="string"||typeof a=="number"?new Date(a).getTime():null;if(typeof o=="number"&&Number.isFinite(o))return o}return null}function se(d){const e=X(d);if(!e)return null;const t=e.group;if(t&&typeof t=="object"&&!Array.isArray(t)){const r=t,i=typeof r.id=="string"?r.id.trim():"",n=typeof r.name=="string"?r.name.trim():"";if(i||n)return{id:i||n,name:n||i}}const a=typeof e.groupId=="string"?e.groupId.trim():typeof e.group_id=="string"?e.group_id.trim():"",o=typeof e.groupName=="string"?e.groupName.trim():typeof e.group_name=="string"?e.group_name.trim():"";return!a&&!o?null:{id:a||o,name:o||a}}function Ve(d,e){return{...le(d),favorite:e}}function Ze(d,e){return{...le(d),lastOpenedAt:e}}function Je(d,e){const t=le(d);if(!e)return delete t.group,delete t.groupId,delete t.groupName,delete t.group_id,delete t.group_name,t;const a=e.id.trim()||e.name.trim(),o=e.name.trim()||e.id.trim();return t.group={id:a,name:o},t.groupId=a,t.groupName=o,t.group_id=a,t.group_name=o,t}function de(d){const e=new Map;return d.forEach(t=>{const a=se(t);!a||e.has(a.id)||e.set(a.id,a)}),Array.from(e.values()).sort((t,a)=>t.name.localeCompare(a.name))}function et(d,e){const a=d.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"group",o=new Set(de(e).map(n=>n.id));if(!o.has(a))return a;let r=2,i=`${a}-${r}`;for(;o.has(i);)r+=1,i=`${a}-${r}`;return i}const tt={boards:[],selectedBoardId:null,status:"idle",error:null};function _e(d){const e=Number(d??0);return Number.isFinite(e)?e:0}function at(d,e){const t=d.pos??d.order??0,a=e.pos??e.order??0;return _e(t)-_e(a)||d.id.localeCompare(e.id)}function xe(d){return d.map(e=>({...e,columns:[...e.columns??[]].sort(at).map(t=>({...t,cards:[...t.cards??[]].sort(Qe)}))})).sort((e,t)=>e.id.localeCompare(t.id))}class ot{constructor(e,t={}){this.api=e,this.stateSubject=new Ie(tt),this.state$=this.stateSubject.asObservable(),this.boardMetaMutationVersions=new Map,this.now=t.now??(()=>new Date)}get snapshot(){return this.stateSubject.value}destroy(){this.stateSubject.complete()}selectBoard(e){this.snapshot.boards.some(t=>t.id===e)&&(fe(e),this.patchState({selectedBoardId:e,error:null}),this.patchBoardMeta(e,t=>Ze(t,this.now().toISOString())))}async load(){this.patchState({status:"loading",error:null});try{await this.reloadPreservingSelection(),this.patchState({status:"idle",error:null})}catch{this.patchState({status:"error",error:"boards.errors.load"})}}async createBoard(e){const t=e.trim();t&&await this.runMutation(async()=>{const a=await x(this.api.createBoard({title:t}));await this.reload(a.id)})}async deleteBoard(e){await this.runMutation(async()=>{await x(this.api.deleteBoard(e)),await this.reload(null)})}async patchBoard(e,t){this.findBoard(e)&&await this.runMutation(async()=>{await x(this.api.updateBoard(e,t)),await this.reload(e)})}toggleBoardStar(e){this.patchBoardMeta(e,t=>Ve(t,!G(t)))}updateBoardGroup(e,t){this.patchBoardMeta(e,a=>Je(a,t))}async createColumn(e,t){const a=t.trim();!a||!this.findBoard(e)||await this.runMutation(async()=>{await x(this.api.createColumn({board:e,title:a,position:"end"})),await this.reload(e)})}async deleteColumn(e){await this.runMutation(async()=>{await x(this.api.deleteColumn(e)),await this.reloadPreservingSelection()})}async patchColumn(e,t){this.findColumn(e)&&await this.runMutation(async()=>{await x(this.api.updateColumn(e,t)),await this.reloadPreservingSelection()})}async createCard(e,t,a){const o=t.trim();!o||!this.findColumn(e)||await this.runMutation(async()=>{await x(this.api.createCard({column:e,title:o,description:a.trim(),position:"bottom"})),await this.reloadPreservingSelection()})}async patchCard(e,t){this.findCard(e)&&await this.runMutation(async()=>{await x(this.api.updateCard(e,t)),await this.reloadPreservingSelection()})}async createCardMirror(e,t,a){!this.findCard(e)||!this.findColumn(t)||await this.runMutation(async()=>{await x(this.api.createCardPlacement({card:e,column:t,...a})),await this.reloadPreservingSelection()})}async patchCardPlacement(e,t){this.findCardPlacement(e)&&await this.runMutation(async()=>{await x(this.api.updateCardPlacement(e,t)),await this.reloadPreservingSelection()})}async deleteCardPlacement(e){this.findCardPlacement(e)&&await this.runMutation(async()=>{await x(this.api.deleteCardPlacement(e)),await this.reloadPreservingSelection()})}async deleteCard(e){await this.runMutation(async()=>{await x(this.api.deleteCard(e)),await this.reloadPreservingSelection()})}async runMutation(e){this.patchState({status:"saving",error:null});try{await e(),this.patchState({status:"idle",error:null})}catch{this.patchState({status:"error",error:"boards.errors.save"})}}async reloadPreservingSelection(){await this.reload(this.snapshot.selectedBoardId)}async reload(e){const t=xe(await x(this.api.getBoards())),a=Ue(t,e);fe(a),this.patchState({boards:t,selectedBoardId:a})}findBoard(e){return this.snapshot.boards.find(t=>t.id===e)??null}patchBoardMeta(e,t){const a=this.findBoard(e);if(!a)return;const o=(this.boardMetaMutationVersions.get(e)??0)+1;this.boardMetaMutationVersions.set(e,o);const r=a.meta??null,i=t(a);this.replaceBoardMeta(e,i),x(this.api.updateBoard(e,{meta:i})).then(n=>{this.boardMetaMutationVersions.get(e)===o&&this.replaceBoardMeta(e,n.meta??i)}).catch(()=>{this.boardMetaMutationVersions.get(e)===o&&(this.replaceBoardMeta(e,r),this.patchState({error:"boards.errors.save"}))})}replaceBoardMeta(e,t){this.patchState({boards:xe(this.snapshot.boards.map(a=>a.id===e?{...a,meta:t??null}:a)),error:null})}findColumn(e){for(const t of this.snapshot.boards){const a=t.columns.find(o=>o.id===e);if(a)return a}return null}findCardPlacement(e){for(const t of this.snapshot.boards)for(const a of t.columns){const o=a.cards.find(r=>v(r)===e);if(o)return o}return null}findCard(e){for(const t of this.snapshot.boards)for(const a of t.columns){const o=a.cards.find(r=>r.id===e);if(o)return o}return null}patchState(e){this.stateSubject.next({...this.snapshot,...e})}}function U(d){return[...new Set([...d].filter(rt))].sort((e,t)=>e-t)}function S(d){var e;return U(d.tag_ids??((e=d.tags)==null?void 0:e.map(t=>t.id))??[])}function ve(d,e){const t=U(d),a=U(e);return t.length===a.length&&t.every((o,r)=>o===a[r])}function rt(d){return typeof d=="number"&&Number.isFinite(d)}function Be({columnId:d,cards:e,movingPlacementId:t,insertionIndex:a}){const o=e.filter(c=>v(c)!==t),r=Math.max(0,Math.min(a,o.length)),i=r>0?o[r-1]:null,n=r<o.length?o[r]:null,s={column:d};return i&&(s.before_placement=v(i)),n&&(s.after_placement=v(n)),!i&&!n&&(s.position="bottom"),s}function it(d,e,t){const a=d.filter(b=>v(b)!==e),o=d.findIndex(b=>v(b)===e);if(o<0)return!0;const r=o>0?d[o-1]:null,i=o<d.length-1?d[o+1]:null,n=r?v(r):null,s=i?v(i):null,c=t.before_placement??null,u=t.after_placement??null;return a.length===0?!1:n!==c||s!==u}function nt({columns:d,movingColumnId:e,insertionIndex:t}){const a=d.filter(s=>s.id!==e),o=Math.max(0,Math.min(t,a.length)),r=o>0?a[o-1]:null,i=o<a.length?a[o]:null,n={};return r&&(n.before_column=r.id),i&&(n.after_column=i.id),!r&&!i&&(n.position="end"),n}function st(d,e,t){const a=d.filter(c=>c.id!==e),o=d.findIndex(c=>c.id===e);if(o<0)return!0;if(a.length===0)return!1;const r=o>0?d[o-1]:null,i=o<d.length-1?d[o+1]:null,n=(r==null?void 0:r.id)??null,s=(i==null?void 0:i.id)??null;return n!==(t.before_column??null)||s!==(t.after_column??null)}const dt=4,ke=44,Ce=18;function ct(d){return d.view??window}function we(d,e){for(const t of d.boards)if(t.columns.some(a=>a.id===e))return t.columns;return null}class lt{constructor(e){this.options=e,this.pending=null,this.active=null,this.eventWindow=null,this.suppressNextClick=!1,this.mounted=!1,this.handleClick=t=>{this.suppressNextClick&&(this.suppressNextClick=!1,t.preventDefault(),t.stopPropagation())},this.handlePointerDown=t=>{if(t.button!==0||t.isPrimary===!1)return;const a=t.target,o=a==null?void 0:a.closest('[data-board-column-draggable="true"]');if(!o||!this.options.root.contains(o)||a!=null&&a.closest('[data-board-drag-ignore="true"], [data-board-card-draggable="true"], input, textarea, select'))return;const r=o.dataset.boardColumnId,i=this.options.getState();!i||!r||!we(i,r)||(this.pending={pointerId:t.pointerId,startX:t.clientX,startY:t.clientY,sourceColumnElement:o,columnId:r},this.addWindowListeners(ct(t)))},this.handlePointerMove=t=>{const a=this.pending;if(!a||t.pointerId!==a.pointerId)return;if(!this.active){const r=t.clientX-a.startX,i=t.clientY-a.startY;if(Math.hypot(r,i)<dt)return;this.startDrag(a,t)}const o=this.active;o&&(t.preventDefault(),this.movePreview(o,t.clientX,t.clientY),this.updateDropTarget(o,t.clientX),this.autoScroll(t.clientX))},this.handlePointerUp=t=>{this.pending&&t.pointerId!==this.pending.pointerId||(this.removeWindowListeners(),this.pending=null,this.finishActiveDrag(!0))},this.handlePointerCancel=t=>{this.pending&&t.pointerId!==this.pending.pointerId||this.cancelDrag()},this.handleWindowBlur=()=>{this.cancelDrag()}}mount(){this.mounted||(this.mounted=!0,this.options.root.addEventListener("pointerdown",this.handlePointerDown,!0),this.options.root.addEventListener("click",this.handleClick,!0))}unmount(){this.mounted&&(this.mounted=!1,this.cancelDrag(),this.options.root.removeEventListener("pointerdown",this.handlePointerDown,!0),this.options.root.removeEventListener("click",this.handleClick,!0))}cancelDrag(){this.removeWindowListeners(),this.pending=null,this.finishActiveDrag(!1)}startDrag(e,t){var s,c;const a=this.options.getState(),o=a?we(a,e.columnId):null;if(!o)return;(c=(s=this.options).onDragStart)==null||c.call(s);const r=e.sourceColumnElement.getBoundingClientRect(),i=e.sourceColumnElement.cloneNode(!0);i.classList.add("majom-boards__column-drag-preview"),i.style.width=`${r.width}px`,i.style.height=`${r.height}px`,i.style.left=`${r.left}px`,i.style.top=`${r.top}px`;const n=document.createElement("div");n.className="majom-boards__column-drag-placeholder",n.style.width=`${r.width}px`,n.style.height=`${r.height}px`,e.sourceColumnElement.classList.add("is-dragging"),document.body.append(i),this.active={...e,offsetX:t.clientX-r.left,offsetY:t.clientY-r.top,preview:i,placeholder:n,sourceColumns:o,target:null},this.options.root.classList.add("is-column-dragging"),this.movePreview(this.active,t.clientX,t.clientY),this.updateDropTarget(this.active,t.clientX)}movePreview(e,t,a){e.preview.style.left=`${t-e.offsetX}px`,e.preview.style.top=`${a-e.offsetY}px`}updateDropTarget(e,t){const a=this.resolveInsertionIndex(e.columnId,t);if(e.target=nt({columns:e.sourceColumns,movingColumnId:e.columnId,insertionIndex:a}),!this.hasActiveTargetChanged(e)){e.placeholder.remove();return}this.placePlaceholder(e,a)}hasActiveTargetChanged(e){return!!(e.target&&st(e.sourceColumns,e.columnId,e.target))}resolveInsertionIndex(e,t){const a=Array.from(this.options.root.querySelectorAll('[data-board-column-draggable="true"]')).filter(r=>r.dataset.boardColumnId!==e),o=a.findIndex(r=>{const i=r.getBoundingClientRect();return t<i.left+i.width/2});return o>=0?o:a.length}placePlaceholder(e,t){const a=this.options.root.querySelector('[data-board-canvas="true"]');if(!a)return;const o=Array.from(a.querySelectorAll('[data-board-column-draggable="true"]')).filter(i=>i.dataset.boardColumnId!==e.columnId),r=a.querySelector('[data-board-column-composer="true"]');a.insertBefore(e.placeholder,o[t]??r??null)}autoScroll(e){const t=this.options.root.querySelector('[data-board-canvas="true"]');if(!t)return;const a=t.getBoundingClientRect();e<a.left+ke?t.scrollLeft-=Ce:e>a.right-ke&&(t.scrollLeft+=Ce)}finishActiveDrag(e){const t=this.active;t&&(this.active=null,t.preview.remove(),t.placeholder.remove(),t.sourceColumnElement.classList.remove("is-dragging"),this.options.root.classList.remove("is-column-dragging"),this.suppressNextClick=!0,e&&this.hasActiveTargetChanged(t)&&this.options.onDrop(t.columnId,t.target))}addWindowListeners(e){this.eventWindow=e,e.addEventListener("pointermove",this.handlePointerMove,!0),e.addEventListener("pointerup",this.handlePointerUp,!0),e.addEventListener("pointercancel",this.handlePointerCancel,!0),e.addEventListener("blur",this.handleWindowBlur,!0)}removeWindowListeners(){const e=this.eventWindow??window;this.eventWindow=null,e.removeEventListener("pointermove",this.handlePointerMove,!0),e.removeEventListener("pointerup",this.handlePointerUp,!0),e.removeEventListener("pointercancel",this.handlePointerCancel,!0),e.removeEventListener("blur",this.handleWindowBlur,!0)}}const mt=4,H=44,K=18;function ut(d){return d.view??window}function je(d,e){for(const t of d.boards){const a=t.columns.find(o=>o.id===e);if(a)return a.cards}return null}function pt(d,e){for(const t of d.boards)for(const a of t.columns)if(a.cards.some(o=>v(o)===e))return a.id;return null}class bt{constructor(e){this.options=e,this.pending=null,this.active=null,this.eventWindow=null,this.suppressNextClick=!1,this.mounted=!1,this.handleClick=t=>{this.suppressNextClick&&(this.suppressNextClick=!1,t.preventDefault(),t.stopPropagation())},this.handlePointerDown=t=>{if(t.button!==0||t.isPrimary===!1)return;const a=t.target,o=a==null?void 0:a.closest('[data-board-card-draggable="true"]');if(!o||!this.options.root.contains(o)||a!=null&&a.closest('[data-board-drag-ignore="true"], input, textarea, select'))return;const r=o.dataset.boardCardPlacementId,i=this.options.getState();if(!i||!r)return;const n=pt(i,r);n!==null&&(this.pending={pointerId:t.pointerId,startX:t.clientX,startY:t.clientY,sourceCardElement:o,placementId:r,sourceColumnId:n},this.addWindowListeners(ut(t)))},this.handlePointerMove=t=>{const a=this.pending;if(!a||t.pointerId!==a.pointerId)return;if(!this.active){const r=t.clientX-a.startX,i=t.clientY-a.startY;if(Math.hypot(r,i)<mt)return;this.startDrag(a,t)}const o=this.active;o&&(t.preventDefault(),this.movePreview(o,t.clientX,t.clientY),this.updateDropTarget(o,t.clientX,t.clientY),this.autoScroll(t.clientX,t.clientY))},this.handlePointerUp=t=>{this.pending&&t.pointerId!==this.pending.pointerId||(this.removeWindowListeners(),this.pending=null,this.finishActiveDrag(!0))},this.handlePointerCancel=t=>{this.pending&&t.pointerId!==this.pending.pointerId||this.cancelDrag()},this.handleWindowBlur=()=>{this.cancelDrag()}}mount(){this.mounted||(this.mounted=!0,this.options.root.addEventListener("pointerdown",this.handlePointerDown,!0),this.options.root.addEventListener("click",this.handleClick,!0))}unmount(){this.mounted&&(this.mounted=!1,this.cancelDrag(),this.options.root.removeEventListener("pointerdown",this.handlePointerDown,!0),this.options.root.removeEventListener("click",this.handleClick,!0))}cancelDrag(){this.removeWindowListeners(),this.pending=null,this.finishActiveDrag(!1)}startDrag(e,t){var s,c;const a=this.options.getState();if(!a)return;const o=je(a,e.sourceColumnId);if(!o)return;(c=(s=this.options).onDragStart)==null||c.call(s);const r=e.sourceCardElement.getBoundingClientRect(),i=e.sourceCardElement.cloneNode(!0);i.classList.add("majom-boards__card-drag-preview"),i.style.width=`${r.width}px`,i.style.height=`${r.height}px`,i.style.left=`${r.left}px`,i.style.top=`${r.top}px`;const n=document.createElement("div");n.className="majom-boards__card-drag-placeholder",n.style.height=`${r.height}px`,e.sourceCardElement.classList.add("is-dragging"),document.body.append(i),this.active={...e,offsetX:t.clientX-r.left,offsetY:t.clientY-r.top,preview:i,placeholder:n,sourceColumnCards:o,targetColumnId:null,target:null},this.options.root.classList.add("is-card-dragging"),this.movePreview(this.active,t.clientX,t.clientY),this.updateDropTarget(this.active,t.clientX,t.clientY)}movePreview(e,t,a){e.preview.style.left=`${t-e.offsetX}px`,e.preview.style.top=`${a-e.offsetY}px`}updateDropTarget(e,t,a){const o=this.options.getState();if(!o)return;const r=this.findTargetColumn(t);if(!r)return;const i=r.dataset.boardColumnId;if(!i)return;const n=je(o,i),s=r.querySelector('[data-board-cards-container="true"]');if(!n||!s)return;const c=this.resolveInsertionIndex(r,e.placementId,a);if(e.targetColumnId=i,e.target=Be({columnId:i,cards:n,movingPlacementId:e.placementId,insertionIndex:c}),!this.hasActiveTargetChanged(e)){e.placeholder.remove();return}this.placePlaceholder(s,e,c)}hasActiveTargetChanged(e){return!e.target||e.targetColumnId===null?!1:!(e.targetColumnId===e.sourceColumnId)||it(e.sourceColumnCards,e.placementId,e.target)}findTargetColumn(e){const t=Array.from(this.options.root.querySelectorAll("[data-board-column-id]"));if(t.length===0)return null;const a=t.find(o=>{const r=o.getBoundingClientRect();return e>=r.left&&e<=r.right});return a||t.reduce((o,r)=>{if(!o)return r;const i=r.getBoundingClientRect(),n=o.getBoundingClientRect(),s=Math.abs(e-(i.left+i.width/2)),c=Math.abs(e-(n.left+n.width/2));return s<c?r:o},null)}resolveInsertionIndex(e,t,a){const o=Array.from(e.querySelectorAll("[data-board-card-placement-id]")).filter(i=>i.dataset.boardCardPlacementId!==t),r=o.findIndex(i=>{const n=i.getBoundingClientRect();return a<n.top+n.height/2});return r>=0?r:o.length}placePlaceholder(e,t,a){const r=Array.from(e.querySelectorAll("[data-board-card-placement-id]")).filter(i=>i.dataset.boardCardPlacementId!==t.placementId)[a]??null;e.insertBefore(t.placeholder,r)}autoScroll(e,t){const a=this.options.root.querySelector('[data-board-canvas="true"]');if(a){const s=a.getBoundingClientRect();e<s.left+H?a.scrollLeft-=K:e>s.right-H&&(a.scrollLeft+=K)}const o=this.active;if(!(o!=null&&o.targetColumnId))return;const r=Array.from(this.options.root.querySelectorAll("[data-board-column-id]")).find(s=>s.dataset.boardColumnId===o.targetColumnId),i=r==null?void 0:r.querySelector('[data-board-cards-container="true"]');if(!i)return;const n=i.getBoundingClientRect();t<n.top+H?i.scrollTop-=K:t>n.bottom-H&&(i.scrollTop+=K)}finishActiveDrag(e){const t=this.active;t&&(this.active=null,t.preview.remove(),t.placeholder.remove(),t.sourceCardElement.classList.remove("is-dragging"),this.options.root.classList.remove("is-card-dragging"),this.suppressNextClick=!0,!(!e||!t.target||t.targetColumnId===null)&&this.hasActiveTargetChanged(t)&&this.options.onDrop(t.placementId,t.target))}addWindowListeners(e){this.eventWindow=e,e.addEventListener("pointermove",this.handlePointerMove,!0),e.addEventListener("pointerup",this.handlePointerUp,!0),e.addEventListener("pointercancel",this.handlePointerCancel,!0),e.addEventListener("blur",this.handleWindowBlur,!0)}removeWindowListeners(){const e=this.eventWindow??window;this.eventWindow=null,e.removeEventListener("pointermove",this.handlePointerMove,!0),e.removeEventListener("pointerup",this.handlePointerUp,!0),e.removeEventListener("pointercancel",this.handlePointerCancel,!0),e.removeEventListener("blur",this.handleWindowBlur,!0)}}const ye="majom-boards-view-styles",m={root:"majom-boards",shell:"majom-boards__shell",header:"majom-boards__header",titleBlock:"majom-boards__title-block",titleRow:"majom-boards__title-row",title:"majom-boards__title",titleButton:"majom-boards__title-button",titleEditInput:"majom-boards__title-edit-input",boardPickerButton:"majom-boards__board-picker-button",boardPickerButtonContent:"majom-boards__board-picker-button-content",headerActions:"majom-boards__header-actions",headerMenuButton:"majom-boards__header-menu-button",boardPickerPopover:"majom-boards-board-picker",boardPickerSearchWrap:"majom-boards-board-picker__search-wrap",boardPickerSearchIcon:"majom-boards-board-picker__search-icon",boardPickerSearchInput:"majom-boards-board-picker__search-input",boardPickerChips:"majom-boards-board-picker__chips",boardPickerChip:"majom-boards-board-picker__chip",boardPickerChipSelected:"majom-boards-board-picker__chip is-selected",boardPickerSections:"majom-boards-board-picker__sections",boardPickerSection:"majom-boards-board-picker__section",boardPickerSectionTitle:"majom-boards-board-picker__section-title",boardPickerSectionToggle:"majom-boards-board-picker__section-toggle",boardPickerSectionIconCollapsed:"majom-boards-board-picker__section-icon--collapsed",boardPickerGrid:"majom-boards-board-picker__grid",boardPickerCard:"majom-boards-board-picker__card",boardPickerCardSelected:"majom-boards-board-picker__card is-selected",boardPickerCardButton:"majom-boards-board-picker__card-button",boardPickerCreateCard:"majom-boards-board-picker__create-card",boardPickerStarButton:"majom-boards-board-picker__star-button",boardPickerStarButtonActive:"majom-boards-board-picker__star-button is-active",boardPickerActionsButton:"majom-boards-board-picker__actions-button",boardPickerActionsMenu:"majom-boards-board-picker-actions",boardPickerActionsInputRow:"majom-boards-board-picker-actions__input-row",boardPickerActionsInput:"majom-boards-board-picker-actions__input",boardPickerCover:"majom-boards-board-picker__cover",boardPickerCoverA:"majom-boards-board-picker__cover--a",boardPickerCoverB:"majom-boards-board-picker__cover--b",boardPickerCoverC:"majom-boards-board-picker__cover--c",boardPickerCoverD:"majom-boards-board-picker__cover--d",boardPickerCoverE:"majom-boards-board-picker__cover--e",boardPickerCoverF:"majom-boards-board-picker__cover--f",boardPickerCoverInitial:"majom-boards-board-picker__cover-initial",boardPickerCardTitle:"majom-boards-board-picker__card-title",boardPickerEmpty:"majom-boards-board-picker__empty",primaryButton:"majom-boards__button majom-boards__button--primary",quietButton:"majom-boards__button majom-boards__button--quiet",iconButton:"majom-boards__icon-button",body:"majom-boards__body",canvas:"majom-boards__canvas",column:"majom-boards__column",columnHeader:"majom-boards__column-header",columnTitleButton:"majom-boards__column-title-button",columnTitleInput:"majom-boards__column-title-input",columnTitle:"majom-boards__column-title",columnMenuButton:"majom-boards__column-menu-button",cards:"majom-boards__cards",card:"majom-boards__card",cardMirror:"majom-boards__card--mirror",cardOpenButton:"majom-boards__card-open",cardSourceLabel:"majom-boards__card-source-label",cardTags:"majom-boards__card-tags",cardTag:"majom-boards__card-tag",cardTitle:"majom-boards__card-title",cardBadges:"majom-boards__card-badges",cardBadge:"majom-boards__card-badge",cardComposer:"majom-boards__card-composer",cardComposerCollapsed:"majom-boards__card-composer-collapsed",cardComposerExpanded:"majom-boards__card-composer-expanded",cardComposerTextarea:"majom-boards__card-composer-textarea",composerActions:"majom-boards__composer-actions",composerCancelButton:"majom-boards__composer-cancel",columnComposerCollapsedPanel:"majom-boards__column-composer majom-boards__column-composer--collapsed",columnComposerExpandedPanel:"majom-boards__column-composer majom-boards__column-composer--expanded",columnComposerCollapsed:"majom-boards__column-composer-collapsed",columnComposerExpanded:"majom-boards__column-composer-expanded",listComposerTextarea:"majom-boards__list-composer-textarea",empty:"majom-boards__empty",emptyContent:"majom-boards__empty-content",emptyTitle:"majom-boards__empty-title",emptyCopy:"majom-boards__empty-copy",messageWrapper:"majom-boards__message-wrapper",messageLabel:"majom-boards__message-label",error:"majom-boards__error"},l={container:"majom-boards-modal",body:"majom-boards-modal__body",cardBack:"majom-boards-cardback",hiddenShellPart:"majom-boards-cardback__hidden-shell-part",topbar:"majom-boards-cardback__topbar",topbarStart:"majom-boards-cardback__topbar-start",listBadge:"majom-boards-cardback__list-badge",sourceLabel:"majom-boards-cardback__source-label",movePopover:"majom-boards-cardback__move-popover",movePopoverHeader:"majom-boards-cardback__move-popover-header",movePopoverTitle:"majom-boards-cardback__move-popover-title",movePopoverBody:"majom-boards-cardback__move-popover-body",movePopoverContent:"majom-boards-cardback__move-popover-content",moveTabs:"majom-boards-cardback__move-tabs",moveTab:"majom-boards-cardback__move-tab",moveTabSelected:"majom-boards-cardback__move-tab is-selected",moveSectionTitle:"majom-boards-cardback__move-section-title",moveFields:"majom-boards-cardback__move-fields",moveField:"majom-boards-cardback__move-field",moveLabel:"majom-boards-cardback__move-label",moveSelect:"majom-boards-cardback__move-select",moveActions:"majom-boards-cardback__move-actions",moveButton:"majom-boards-cardback__move-button",listActionsPopover:"majom-boards-list-actions",listActionsHeader:"majom-boards-list-actions__header",listActionsTitle:"majom-boards-list-actions__title",listActionsBody:"majom-boards-list-actions__body",listActionsList:"majom-boards-list-actions__list",listActionsItem:"majom-boards-list-actions__item",listActionsButton:"majom-boards-list-actions__button",listActionsDivider:"majom-boards-list-actions__divider",listActionsSection:"majom-boards-list-actions__section",listActionsSectionButton:"majom-boards-list-actions__section-button",listActionsUpgrade:"majom-boards-list-actions__upgrade",listActionsUpgradeTitle:"majom-boards-list-actions__upgrade-title",listActionsUpgradeCopy:"majom-boards-list-actions__upgrade-copy",cardActionsPopover:"majom-boards-card-actions",cardActionsBody:"majom-boards-card-actions__body",cardActionsList:"majom-boards-card-actions__list",cardActionsItem:"majom-boards-card-actions__item",cardActionsButton:"majom-boards-card-actions__button",cardActionsDivider:"majom-boards-card-actions__divider",topbarActions:"majom-boards-cardback__topbar-actions",iconButton:"majom-boards-cardback__icon-button",layout:"majom-boards-cardback__layout",main:"majom-boards-cardback__main",aside:"majom-boards-cardback__aside",section:"majom-boards-cardback__section",sectionIcon:"majom-boards-cardback__section-icon",sectionMain:"majom-boards-cardback__section-main",sectionHeader:"majom-boards-cardback__section-header",sectionTitle:"majom-boards-cardback__section-title",sectionActions:"majom-boards-cardback__section-actions",titleSection:"majom-boards-cardback__title-section",doneButton:"majom-boards-cardback__done-button",titleEditor:"majom-boards-cardback__title-editor",quickActions:"majom-boards-cardback__quick-actions",quickActionList:"majom-boards-cardback__quick-action-list",quickActionButton:"majom-boards-cardback__quick-action-button",labelsHost:"majom-boards-cardback__labels-host",labelsSection:"majom-boards-cardback__labels-section",labelsTitle:"majom-boards-cardback__labels-title",labelsList:"majom-boards-cardback__labels-list",labelSwatch:"majom-boards-cardback__label-swatch",labelAddButton:"majom-boards-cardback__label-add-button",labelPickerPopover:"majom-boards-cardback__label-picker-popover",descriptionEditor:"majom-boards-cardback__description-editor",placeholderPanel:"majom-boards-cardback__placeholder-panel",editorActions:"majom-boards-cardback__editor-actions",activityInput:"majom-boards-cardback__activity-input",activityList:"majom-boards-cardback__activity-list",activityItem:"majom-boards-cardback__activity-item",avatar:"majom-boards-cardback__avatar",quickEditorOverlay:"majom-boards-quick-editor-overlay",quickEditor:"majom-boards-quick-editor",quickEditorForm:"majom-boards-quick-editor__form",quickEditorCard:"majom-boards-quick-editor__card",quickEditorCardMirror:"majom-boards-quick-editor__card--mirror",quickEditorCardInner:"majom-boards-quick-editor__card-inner",quickEditorTitle:"majom-boards-quick-editor__title",quickEditorSave:"majom-boards-quick-editor__save",quickEditorActions:"majom-boards-quick-editor__actions",quickEditorButtons:"majom-boards-quick-editor__buttons",quickEditorButton:"majom-boards-quick-editor__button",quickEditorDangerItem:"majom-boards-quick-editor__danger-item",quickEditorDangerButton:"majom-boards-quick-editor__button--danger"},ht=`
:root {
  --mb-shadow-card: 0 1px 1px rgba(9, 30, 66, 0.25), 0 0 0 1px rgba(9, 30, 66, 0.06);
  --mb-shadow-list: 0 1px 1px rgba(9, 30, 66, 0.16), 0 0 1px rgba(9, 30, 66, 0.31);
}

.majom-boards {
  --mb-text: #172b4d;
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
  width: min(420px, calc(100vw - 24px));
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
  color: var(--mb-text);
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
  color: var(--mb-text);
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
  color: var(--mb-text);
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
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
  gap: 3px;
  min-height: 16px;
  color: var(--mb-muted);
  font-size: 11px;
  font-weight: 600;
  line-height: 16px;
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

.majom-boards__error {
  margin: 0 16px 10px;
  border-radius: 8px;
  padding: 8px 12px;
  color: var(--mb-danger);
  background: var(--mb-danger-soft);
  box-shadow: inset 0 0 0 1px rgba(174, 46, 36, 0.16);
  font-size: 14px;
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
  background: #f1f2f4;
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
  background: #f1f2f4;
}

.majom-boards-cardback__topbar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid rgba(9, 30, 66, 0.14);
  padding: 10px 12px;
  background: #f1f2f4;
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
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 999px;
  color: var(--mb-subtle, #626f86);
  background: transparent;
  box-shadow: none;
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
`;function gt(){if(typeof document>"u"||document.getElementById(ye))return;const d=document.createElement("style");d.id=ye,d.textContent=ht,document.head.appendChild(d)}const ft=1,_t=16384,ie=[m.boardPickerCoverA,m.boardPickerCoverB,m.boardPickerCoverC,m.boardPickerCoverD,m.boardPickerCoverE,m.boardPickerCoverF],xt={starred:!1,yourBoards:!1},vt={formWidth:256,actionsWidth:220,actionsGap:8,viewportMargin:12,minVisibleHeight:220};function D(d){return d.mirror_source!=null}function q(d,e){const t=d.textContent??"";d.textContent="";const a=w(e,{size:16,strokeWidth:2});a.setAttribute("aria-hidden","true");const o=document.createElement("span");o.textContent=t,d.append(a,o)}function kt(d,e,t){const a=d.getButtonElement();a.className=m.headerMenuButton;const o=w(e,{size:16,strokeWidth:2});o.setAttribute("aria-hidden","true"),a.replaceChildren(o),a.title=t,a.setAttribute("aria-label",t)}function Ct(d,e){const t=d.getButtonElement();t.classList.remove("!bg-slate-100","!text-slate-800"),t.dataset.boardsHeaderMenuOpen=e?"true":"false"}function wt(d){var a;const e=d,t=e.commentsCount??e.commentCount??e.comments_count??((a=e.comments)==null?void 0:a.length)??0;return Number.isFinite(t)&&t>0?t:0}function Q(d){return{id:d.id,title:d.title,color:d.color}}function jt(d){const e=Array.from(d.id).reduce((t,a)=>t+a.charCodeAt(0),0);return ie[e%ie.length]??ie[0]}function yt(d){return d.title.trim().charAt(0)||"?"}function Pt(d){const e=d.trim().replace(/^#/,"");if(!/^[0-9a-f]{6}$/i.test(e))return"#172b4d";const t=parseInt(e.slice(0,2),16),a=parseInt(e.slice(2,4),16),o=parseInt(e.slice(4,6),16);return(.299*t+.587*a+.114*o)/255>.58?"#172b4d":"#ffffff"}class Bt{constructor(e,t){this.root=e,this.state=null,this.columnTitleTextarea=null,this.expandedCardComposerColumnId=null,this.isColumnComposerExpanded=!1,this.editingBoardTitleId=null,this.boardTitleEditInput=null,this.editingColumnTitleId=null,this.columnTitleEditInput=null,this.headerMenu=null,this.boardPickerPopover=null,this.quickEditorOverlay=null,this.activeCardPlacementId=null,this.cardModalOverlay=null,this.moveCardPopover=null,this.listActionsPopover=null,this.cardActionsPopover=null,this.cardLabelsPopover=null,this.cardModalDraftTagIds=null,this.cardModalRequestedTagIds=null,this.cardModalLabelsHost=null,this.cardModalQuickActionList=null,this.tagItems=[],this.tagCatalogStatus="idle",this.cardDrafts=new Map,gt(),this.runtime=t.runtime??ce(),this.tagCatalog=t.tagCatalog??null,this.handlers=t.handlers,this.dragController=new bt({root:this.root,getState:()=>this.state,onDrop:(a,o)=>this.handlers.onPatchCardPlacement(a,o),onDragStart:()=>this.closeTransientBoardOverlays()}),this.columnDragController=new lt({root:this.root,getState:()=>this.state,onDrop:(a,o)=>this.handlers.onPatchColumn(a,o),onDragStart:()=>this.closeTransientBoardOverlays()}),this.dragController.mount(),this.columnDragController.mount(),this.disposeRuntimeSubscription=this.runtime.subscribe(()=>this.refreshFromRuntime(),{emitCurrent:!1}),this.root.className=m.root}render(e){const t=this.boardPickerPopover?{...this.boardPickerPopover.viewState,collapsedSections:{...this.boardPickerPopover.viewState.collapsedSections}}:null;this.state=e,this.ensureTagCatalogLoaded(),this.dragController.cancelDrag(),this.columnDragController.cancelDrag(),this.cardDrafts.clear(),this.unmountHeaderMenu(),this.closeBoardPickerPopover(),this.closeListActionsPopover(),this.closeCardActionsPopover(),this.closeMoveCardPopover(),this.closeQuickCardEditor(),this.root.replaceChildren(this.renderShell(e)),this.syncCardModal(e),t&&requestAnimationFrame(()=>{const a=this.root.querySelector('[data-testid="board-picker-button"]');a&&!a.disabled&&this.openBoardPickerPopover(a,e,t)})}destroy(){this.disposeRuntimeSubscription(),this.dragController.unmount(),this.columnDragController.unmount(),this.unmountHeaderMenu(),this.closeBoardPickerPopover(),this.closeCardLabelsPopover(),this.closeListActionsPopover(),this.closeCardActionsPopover(),this.closeMoveCardPopover(),this.closeQuickCardEditor(),this.closeCardModal(),this.cardDrafts.clear(),this.root.replaceChildren()}refreshFromRuntime(){this.state&&this.render(this.state)}closeTransientBoardOverlays(){this.closeBoardPickerPopover(),this.closeListActionsPopover(),this.closeCardActionsPopover(),this.closeCardLabelsPopover(),this.closeMoveCardPopover(),this.closeQuickCardEditor()}ensureTagCatalogLoaded(){!this.tagCatalog||this.tagCatalogStatus!=="idle"||(this.tagCatalogStatus="loading",this.tagCatalog.loadTags().then(e=>{this.tagItems=e.map(Q),this.tagCatalogStatus="ready",this.rerenderCurrentState()}).catch(()=>{this.tagItems=[],this.tagCatalogStatus="error",this.rerenderCurrentState()}))}getTagPickerErrorMessage(){return this.tagCatalogStatus==="error"?this.runtime.i18n.t("boards.cardBack.tagsLoadFailed"):null}renderShell(e){const t=document.createElement("section");if(t.className=m.shell,t.append(this.renderHeader(e)),e.error&&t.append(this.renderError(e.error)),e.status==="loading"&&e.boards.length===0)return t.append(this.renderMessage(this.runtime.i18n.t("boards.loading"))),t;if(e.boards.length===0)return t.append(this.renderEmptyState()),t;const a=this.getSelectedBoard(e);return t.append(a?this.renderBoard(a,e):this.renderMessage(this.runtime.i18n.t("boards.empty"))),t}renderHeader(e){const t=document.createElement("header");t.className=m.header;const a=this.getSelectedBoard(e),o=document.createElement("div");o.className=m.titleBlock;const r=document.createElement("div");r.className=m.titleRow,r.append(this.renderBoardTitle(a,e)),e.boards.length>0&&r.append(this.renderBoardPickerButton(a,e)),o.append(r);const i=document.createElement("div");return i.className=m.headerActions,i.append(this.renderHeaderMenu(a,e)),t.append(o,i),t}renderBoardTitle(e,t){const a=document.createElement("h1");if(a.className=m.title,!e||this.editingBoardTitleId!==e.id){const o=document.createElement("button");return o.type="button",o.className=m.titleButton,o.textContent=(e==null?void 0:e.title)??this.runtime.i18n.t("boards.title"),o.disabled=!e||t.status==="saving",o.title=this.runtime.i18n.t("boards.actions.renameBoard"),o.setAttribute("aria-label",this.runtime.i18n.t("boards.actions.renameBoard")),o.addEventListener("click",()=>{e&&this.startBoardTitleEdit(e.id)}),a.append(o),a}return this.boardTitleEditInput=ae({variant:"inline",type:"text",value:e.title,autoComplete:"off",maxLength:512,className:m.titleEditInput,onKeyDown:o=>{if(o.key==="Enter"){o.preventDefault(),this.finishBoardTitleEdit(e,!0);return}o.key==="Escape"&&(o.preventDefault(),this.finishBoardTitleEdit(e,!1))}}),this.boardTitleEditInput.setAttribute("aria-label",this.runtime.i18n.t("boards.boardTitlePlaceholder")),this.boardTitleEditInput.addEventListener("blur",()=>{this.finishBoardTitleEdit(e,!0)}),a.append(this.boardTitleEditInput),requestAnimationFrame(()=>{var o,r;(o=this.boardTitleEditInput)==null||o.focus(),(r=this.boardTitleEditInput)==null||r.select()}),a}renderBoardPickerButton(e,t){const a=this.runtime.i18n.t("boards.boardPicker.open"),o=j({icon:"kanban",tone:"text",size:"sm",className:m.boardPickerButton,title:a,ariaLabel:a,disabled:!e||t.status==="saving"}),r=document.createElement("span");r.className=m.boardPickerButtonContent;const i=w("kanban",{size:16,strokeWidth:2});i.setAttribute("aria-hidden","true");const n=w("chevron-down",{size:14,strokeWidth:2});return n.setAttribute("aria-hidden","true"),r.append(i,n),Le(o,r),o.setAttribute("aria-haspopup","dialog"),o.setAttribute("aria-expanded","false"),o.setAttribute("data-testid","board-picker-button"),o.addEventListener("click",s=>{var c;if(s.stopPropagation(),((c=this.boardPickerPopover)==null?void 0:c.trigger)===o){this.closeBoardPickerPopover();return}this.openBoardPickerPopover(o,t)}),o}openBoardPickerPopover(e,t,a){this.closeTransientBoardOverlays();const o=a?{query:a.query,activeFilter:a.activeFilter,collapsedSections:{...a.collapsedSections}}:{query:"",activeFilter:"all",collapsedSections:{...xt}},r=this.getSelectedBoard(t),i=A({elevated:!0,className:`${m.boardPickerPopover} hidden`});i.setAttribute("data-testid","board-picker-popover");const n=document.createElement("div");n.className=m.boardPickerSearchWrap;const s=w("magnifying-glass",{size:18,strokeWidth:2});s.setAttribute("aria-hidden","true"),s.classList.add(m.boardPickerSearchIcon);const c=ae({type:"search",autoComplete:"off",placeholder:this.runtime.i18n.t("boards.boardPicker.searchPlaceholder"),className:m.boardPickerSearchInput,onInput:f=>{o.query=f.trim().toLowerCase(),p()},onKeyDown:f=>{f.key==="Escape"&&(f.preventDefault(),this.closeBoardPickerPopover())}});c.setAttribute("aria-label",this.runtime.i18n.t("boards.boardPicker.searchLabel")),c.value=o.query,n.append(s,c);const u=document.createElement("div");u.className=m.boardPickerChips;const b=()=>{u.replaceChildren(...this.getBoardPickerFilterOptions().map(f=>this.renderBoardPickerChip({label:f.label,selected:o.activeFilter===f.value,onClick:()=>{o.activeFilter=f.value,b(),p(),c.focus()}})))},g=document.createElement("div");g.className=m.boardPickerSections;const p=()=>{g.replaceChildren();const f=this.getBoardPickerVisibleBoards(t.boards,o.activeFilter,o.query),P=this.getBoardPickerGroupedBoards(f);if(o.activeFilter==="all"){const B=f.filter(G);B.length>0&&g.append(this.renderBoardPickerSection({id:"starred",label:this.runtime.i18n.t("boards.boardPicker.starred"),boards:B,selectedBoardId:r==null?void 0:r.id,viewState:o,allowEmpty:!1,onToggle:p}))}P.groups.forEach(B=>{g.append(this.renderBoardPickerSection({id:`group:${B.id}`,label:B.name,boards:B.boards,allBoards:t.boards,selectedBoardId:r==null?void 0:r.id,viewState:o,allowEmpty:!1,onToggle:p}))}),(P.ungrouped.length>0||P.groups.length===0||f.length===0)&&g.append(this.renderBoardPickerSection({id:"yourBoards",label:this.runtime.i18n.t("boards.boardPicker.yourBoards"),boards:P.groups.length>0?P.ungrouped:f,allBoards:t.boards,selectedBoardId:r==null?void 0:r.id,viewState:o,allowEmpty:!0,showCreateBoardCard:o.activeFilter==="all",onToggle:p}))};i.append(n,u,g);const y=new L({container:e,panel:i,positioning:"viewport",panelZIndex:290,onOpenChange:f=>{var P;e.setAttribute("aria-expanded",f?"true":"false"),!f&&((P=this.boardPickerPopover)==null?void 0:P.menu)===y&&this.closeBoardPickerPopover()}});y.mount(),this.boardPickerPopover={menu:y,panel:i,trigger:e,viewState:o,actionsMenu:null},b(),p(),y.openAt({anchor:e,placement:"bottom-start",fallbackPlacements:["bottom-end","top-start","top-end"],gap:8,margin:12,lockPlacementAfterOpen:!0}),requestAnimationFrame(()=>c.focus())}getBoardPickerFilterOptions(){return[{value:"all",label:this.runtime.i18n.t("boards.boardPicker.all")},{value:"starred",label:this.runtime.i18n.t("boards.boardPicker.starred")},{value:"recent",label:this.runtime.i18n.t("boards.boardPicker.recent")}]}getBoardPickerVisibleBoards(e,t,a){const o=a.trim().toLowerCase(),r=e.filter(i=>o&&!i.title.toLowerCase().includes(o)?!1:t==="starred"?G(i):t==="recent"?re(i)!==null:!0);return t!=="recent"?r:[...r].sort((i,n)=>(re(n)??0)-(re(i)??0))}getBoardPickerGroupedBoards(e){const t=new Map,a=[];return e.forEach(o=>{const r=se(o);if(!r){a.push(o);return}const i=t.get(r.id);if(i){i.boards.push(o);return}t.set(r.id,{...r,boards:[o]})}),{groups:Array.from(t.values()).sort((o,r)=>o.name.localeCompare(r.name)),ungrouped:a}}renderBoardPickerChip(e){const t=document.createElement("button");return t.type="button",t.className=e.selected?m.boardPickerChipSelected:m.boardPickerChip,t.textContent=e.label,t.addEventListener("click",e.onClick),t}renderBoardPickerSection(e){const t=e.viewState.collapsedSections[e.id],a=document.createElement("section");a.className=m.boardPickerSection,a.dataset.boardPickerSection=e.id;const o=document.createElement("h2");o.className=m.boardPickerSectionTitle;const r=document.createElement("button");r.type="button",r.className=m.boardPickerSectionToggle,r.setAttribute("aria-expanded",t?"false":"true");const i=w("chevron-down",{size:16,strokeWidth:2});i.setAttribute("aria-hidden","true"),i.classList.toggle(m.boardPickerSectionIconCollapsed,t);const n=document.createElement("span");n.textContent=e.label,r.append(i,n),r.addEventListener("click",()=>{e.viewState.collapsedSections[e.id]=!t,e.onToggle()}),o.append(r);const s=document.createElement("div");if(s.className=m.boardPickerGrid,s.hidden=t,e.boards.length===0&&e.allowEmpty){const c=document.createElement("p");c.className=m.boardPickerEmpty,c.textContent=this.runtime.i18n.t("boards.boardPicker.noResults"),s.append(c)}else e.boards.forEach(c=>{s.append(this.renderBoardPickerCard(c,e.selectedBoardId,e.allBoards))});return e.showCreateBoardCard&&s.append(this.renderBoardPickerCreateCard()),a.append(o,s),a}renderBoardPickerCreateCard(){const e=document.createElement("button");return e.type="button",e.className=m.boardPickerCreateCard,e.textContent=this.runtime.i18n.t("boards.boardPicker.createBoard"),e.addEventListener("click",()=>{this.closeBoardPickerPopover(),this.handlers.onCreateBoard(this.runtime.i18n.t("boards.defaultBoardTitle"))}),e}renderBoardPickerCard(e,t,a){const o=e.id===t,r=G(e),i=document.createElement("div");i.className=o?m.boardPickerCardSelected:m.boardPickerCard;const n=document.createElement("button");n.type="button",n.className=m.boardPickerCardButton,n.setAttribute("aria-label",e.title),n.setAttribute("aria-current",o?"true":"false"),n.dataset.boardPickerBoardId=e.id,n.addEventListener("click",()=>{this.closeBoardPickerPopover(),this.handlers.onSelectBoard(e.id)});const s=document.createElement("div");s.className=`${m.boardPickerCover} ${jt(e)}`.trim();const c=document.createElement("span");c.className=m.boardPickerCoverInitial,c.textContent=yt(e),s.append(c);const u=document.createElement("span");u.className=m.boardPickerCardTitle,u.textContent=e.title,n.append(s,u);const b=j({icon:r?"star-solid":"star",tone:"text",size:"sm",className:r?m.boardPickerStarButtonActive:m.boardPickerStarButton,title:this.runtime.i18n.t(r?"boards.boardPicker.unstar":"boards.boardPicker.star"),ariaLabel:this.runtime.i18n.t(r?"boards.boardPicker.unstar":"boards.boardPicker.star"),onClick:p=>{p.stopPropagation(),this.handlers.onToggleBoardStar(e.id)}});b.setAttribute("aria-pressed",r?"true":"false");const g=j({icon:"ellipsis-horizontal",tone:"text",size:"sm",className:m.boardPickerActionsButton,title:this.runtime.i18n.t("boards.boardPicker.actions"),ariaLabel:this.runtime.i18n.t("boards.boardPicker.actions"),onClick:p=>{p.stopPropagation(),this.openBoardPickerActionsMenu(e,a,g)}});return i.append(n,b,g),i}openBoardPickerActionsMenu(e,t,a){var n;const o=this.boardPickerPopover;if(!o)return;if(((n=o.actionsMenu)==null?void 0:n.boardId)===e.id){this.closeBoardPickerActionsMenu();return}this.closeBoardPickerActionsMenu();const r=A({elevated:!0,className:`${m.boardPickerActionsMenu} hidden`});r.addEventListener("mousedown",s=>s.stopPropagation());const i=new L({container:a,panel:r,positioning:"viewport",panelZIndex:310,onOpenChange:s=>{var c,u;!s&&((u=(c=this.boardPickerPopover)==null?void 0:c.actionsMenu)==null?void 0:u.menu)===i&&this.closeBoardPickerActionsMenu()}});o.panel.append(r),i.mount(),o.actionsMenu={menu:i,panel:r,boardId:e.id},this.renderBoardPickerActionsMenu(e,t),i.openAt({anchor:a,placement:"right-start",fallbackPlacements:["left-start","bottom-end","top-end"],gap:4,margin:8,lockPlacementAfterOpen:!0})}renderBoardPickerActionsMenu(e,t,a="menu"){var i;const o=(i=this.boardPickerPopover)==null?void 0:i.actionsMenu;if(!o)return;if(o.panel.replaceChildren(),a==="createGroup"){o.panel.append(this.renderBoardPickerCreateGroupInput(e,t));return}const r=se(e);de(t).filter(n=>n.id!==(r==null?void 0:r.id)).forEach(n=>{o.panel.append(oe({label:this.runtime.i18n.t("boards.boardPicker.moveToGroup",{group:n.name}),onClick:s=>{s.stopPropagation(),this.handlers.onUpdateBoardGroup(e.id,n),this.closeBoardPickerActionsMenu()}}))}),r&&o.panel.append(oe({label:this.runtime.i18n.t("boards.boardPicker.removeFromGroup"),onClick:n=>{n.stopPropagation(),this.handlers.onUpdateBoardGroup(e.id,null),this.closeBoardPickerActionsMenu()}})),o.panel.childElementCount>0&&o.panel.append(Se({tone:"soft"})),o.panel.append(oe({label:this.runtime.i18n.t("boards.boardPicker.createGroup"),onClick:n=>{n.stopPropagation(),this.renderBoardPickerActionsMenu(e,t,"createGroup")}}))}renderBoardPickerCreateGroupInput(e,t){const a=document.createElement("div");a.className=m.boardPickerActionsInputRow;const o=ae({variant:"inline",value:"",type:"text",className:m.boardPickerActionsInput});o.placeholder=this.runtime.i18n.t("boards.boardPicker.newGroupPlaceholder");let r=!1;const i=n=>{if(r)return;r=!0;const s=n?o.value.trim():"";if(!s){this.renderBoardPickerActionsMenu(e,t);return}const u=de(t).find(b=>b.name.toLowerCase()===s.toLowerCase())??{id:et(s,t),name:s};this.handlers.onUpdateBoardGroup(e.id,u),this.closeBoardPickerActionsMenu()};return o.addEventListener("blur",()=>i(!0)),o.addEventListener("keydown",n=>{n.key==="Enter"?(n.preventDefault(),i(!0)):n.key==="Escape"&&(n.preventDefault(),i(!1))}),a.append(o),requestAnimationFrame(()=>o.focus()),a}renderHeaderMenu(e,t){let a;return a=new Me({label:this.runtime.i18n.t("boards.actions.menu"),ariaLabel:this.runtime.i18n.t("boards.actions.menu"),title:this.runtime.i18n.t("boards.actions.menu"),variant:"plain",size:"md",buttonClassName:m.headerMenuButton,placement:"bottom-end",fallbackPlacements:["bottom-start","top-end","top-start"],onOpenChange:o=>Ct(a,o),items:[{id:"create-board",label:this.runtime.i18n.t("boards.actions.createBoard"),disabled:t.status==="saving",onSelect:()=>{this.handlers.onCreateBoard(this.runtime.i18n.t("boards.defaultBoardTitle"))}},{id:"delete-board",label:this.runtime.i18n.t("boards.actions.deleteBoard"),disabled:!e||t.status==="saving",onSelect:()=>{e&&this.handlers.onDeleteBoard(e.id)}}]}),kt(a,"ellipsis-horizontal",this.runtime.i18n.t("boards.actions.menu")),this.headerMenu=a,a.mount(),a.element}renderBoard(e,t){const a=document.createElement("div");a.className=m.body;const o=document.createElement("div");return o.className=m.canvas,o.setAttribute("aria-label",e.title),o.dataset.boardCanvas="true",e.columns.forEach(r=>{o.append(this.renderColumn(e,r,t))}),o.append(this.renderColumnComposer(e,t)),a.append(o),a}renderColumn(e,t,a){const o=document.createElement("section");o.className=m.column,o.dataset.boardColumnId=String(t.id),o.dataset.boardColumnDraggable="true";const r=document.createElement("header");r.className=m.columnHeader,r.append(this.renderColumnTitle(t,a));const i=j({icon:"ellipsis-horizontal",tone:"text",size:"sm",className:`${m.iconButton} ${m.columnMenuButton}`,title:this.runtime.i18n.t("boards.listActions.title"),ariaLabel:this.runtime.i18n.t("boards.listActions.title"),disabled:a.status==="saving"});i.setAttribute("aria-haspopup","dialog"),i.setAttribute("aria-expanded","false"),i.setAttribute("data-testid","list-actions-menu-button"),i.dataset.boardDragIgnore="true",i.addEventListener("click",s=>{var c;if(s.stopPropagation(),((c=this.listActionsPopover)==null?void 0:c.trigger)===i){this.closeListActionsPopover();return}this.openListActionsPopover(i,t)}),r.append(i);const n=document.createElement("div");return n.className=m.cards,n.dataset.boardCardsContainer="true",t.cards.forEach(s=>n.append(this.renderCard(s))),o.append(r,n,this.renderCardComposer(t,a)),o}renderColumnTitle(e,t){if(this.editingColumnTitleId===e.id)return this.columnTitleEditInput=document.createElement("input"),this.columnTitleEditInput.className=m.columnTitleInput,this.columnTitleEditInput.type="text",this.columnTitleEditInput.value=e.title,this.columnTitleEditInput.maxLength=512,this.columnTitleEditInput.autocomplete="off",this.columnTitleEditInput.setAttribute("aria-label",this.runtime.i18n.t("boards.columnTitlePlaceholder")),this.columnTitleEditInput.addEventListener("keydown",r=>{if(r.key==="Enter"){r.preventDefault(),this.finishColumnTitleEdit(e,!0);return}r.key==="Escape"&&(r.preventDefault(),this.finishColumnTitleEdit(e,!1))}),this.columnTitleEditInput.addEventListener("blur",()=>{this.finishColumnTitleEdit(e,!0)}),requestAnimationFrame(()=>{var r,i;(r=this.columnTitleEditInput)==null||r.focus(),(i=this.columnTitleEditInput)==null||i.select()}),this.columnTitleEditInput;const a=document.createElement("button");a.type="button",a.className=m.columnTitleButton,a.disabled=t.status==="saving",a.title=this.runtime.i18n.t("boards.actions.renameColumn"),a.setAttribute("aria-label",this.runtime.i18n.t("boards.actions.renameColumn")),a.addEventListener("click",()=>this.startColumnTitleEdit(e.id));const o=document.createElement("span");return o.className=m.columnTitle,o.textContent=e.title,a.append(o),a}openListActionsPopover(e,t){this.closeListActionsPopover();const a=A({elevated:!0,className:`${l.listActionsPopover} hidden`});a.setAttribute("role","dialog"),a.setAttribute("aria-modal","false"),a.setAttribute("aria-labelledby","list-actions-menu"),a.setAttribute("data-testid","list-actions-popover"),a.addEventListener("mousedown",c=>c.stopPropagation());const o=document.createElement("header");o.className=l.listActionsHeader;const r=document.createElement("h2");r.id="list-actions-menu",r.className=l.listActionsTitle,r.textContent=this.runtime.i18n.t("boards.listActions.title");const i=j({icon:"x-mark",tone:"text",size:"sm",className:l.iconButton,ariaLabel:this.runtime.i18n.t("common.close"),title:this.runtime.i18n.t("common.close"),onClick:()=>this.closeListActionsPopover()});o.append(r,i);const n=document.createElement("div");n.className=l.listActionsBody,n.append(this.renderListActionList([this.createListActionButton({labelKey:"boards.listActions.addCard",testId:"list-actions-add-card-button",onClick:()=>{this.closeListActionsPopover(),this.expandCardComposer(t.id)}}),this.createListActionButton({labelKey:"boards.listActions.copyList",testId:"list-actions-copy-list-button",disabled:!0}),this.createListActionButton({labelKey:"boards.listActions.moveList",testId:"list-actions-move-list-button",disabled:!0}),this.createListActionButton({labelKey:"boards.listActions.moveAllCards",testId:"list-actions-move-all-cards-button",disabled:!0}),this.createListActionButton({labelKey:"boards.listActions.sortBy",disabled:!0}),this.createListActionButton({labelKey:"boards.listActions.watch",testId:"list-actions-watch-list-button",disabled:!0})]),this.renderListActionsDivider(),this.renderListActionsColorSection(),this.renderListActionsDivider(),this.renderListActionsAutomationSection(),this.renderListActionsDivider(),this.renderListActionList([this.createListActionButton({labelKey:"boards.listActions.archiveList",testId:"list-actions-archive-list-button",onClick:()=>{this.closeListActionsPopover(),this.handlers.onDeleteColumn(t.id)}}),this.createListActionButton({labelKey:"boards.listActions.archiveAllCards",disabled:!0})])),a.append(o,n);let s;s=new L({container:e,panel:a,positioning:"viewport",panelZIndex:290,onOpenChange:c=>{var u;e.setAttribute("aria-expanded",c?"true":"false"),!c&&((u=this.listActionsPopover)==null?void 0:u.menu)===s&&this.closeListActionsPopover()}}),s.mount(),this.listActionsPopover={menu:s,panel:a,trigger:e},s.openAt({anchor:e,placement:"bottom-end",fallbackPlacements:["bottom-start","top-end","top-start"],gap:8,margin:12,lockPlacementAfterOpen:!0})}renderListActionList(e){const t=document.createElement("ul");return t.className=l.listActionsList,e.forEach(a=>{const o=document.createElement("li");o.className=l.listActionsItem,o.append(a),t.append(o)}),t}createListActionButton(e){const t=_({text:this.runtime.i18n.t(e.labelKey),tone:"text",size:"md",className:l.listActionsButton,disabled:e.disabled,onClick:e.onClick});return e.testId&&t.setAttribute("data-testid",e.testId),t}renderListActionsDivider(){const e=document.createElement("div");return e.className=l.listActionsDivider,e.setAttribute("role","separator"),e}renderListActionsColorSection(){const e=document.createElement("section");e.className=l.listActionsSection;const t=_({text:this.runtime.i18n.t("boards.listActions.changeListColor"),tone:"text",size:"md",className:l.listActionsSectionButton,disabled:!0}),a=w("chevron-up",{size:16,strokeWidth:2});a.setAttribute("aria-hidden","true"),t.append(a);const o=document.createElement("div");o.className=l.listActionsUpgrade;const r=document.createElement("p");r.className=l.listActionsUpgradeTitle,r.textContent=this.runtime.i18n.t("boards.listActions.colorUpgradeTitle");const i=document.createElement("p");return i.className=l.listActionsUpgradeCopy,i.textContent=this.runtime.i18n.t("boards.listActions.colorUpgradeBody"),o.append(r,i),e.append(t,o),e}renderListActionsAutomationSection(){const e=document.createElement("section");e.className=l.listActionsSection;const t=_({text:this.runtime.i18n.t("boards.listActions.automation"),tone:"text",size:"md",className:l.listActionsSectionButton,disabled:!0}),a=w("chevron-up",{size:16,strokeWidth:2});return a.setAttribute("aria-hidden","true"),t.append(a),e.append(t,this.renderListActionList([this.createListActionButton({labelKey:"boards.listActions.whenCardAdded",disabled:!0}),this.createListActionButton({labelKey:"boards.listActions.everyDaySort",disabled:!0}),this.createListActionButton({labelKey:"boards.listActions.everyMondaySort",disabled:!0}),this.createListActionButton({labelKey:"boards.listActions.createRule",disabled:!0})])),e}renderCard(e){const t=v(e),a=document.createElement("article");a.className=D(e)?`${m.card} ${m.cardMirror}`:m.card,a.dataset.boardCardId=String(e.id),a.dataset.boardCardPlacementId=String(t),a.dataset.boardCardDraggable="true",a.addEventListener("contextmenu",c=>{c.preventDefault(),c.stopPropagation(),this.openQuickCardEditor(t,a.getBoundingClientRect())});const o=document.createElement("button");o.type="button",o.className=m.cardOpenButton,o.dataset.boardCardOpen=String(t),o.setAttribute("aria-label",this.runtime.i18n.t("boards.actions.openCard")),o.addEventListener("click",()=>this.openCardModal(t));const r=document.createElement("h3");r.className=m.cardTitle,r.textContent=e.title;const i=this.renderCardMirrorSourceLabel(e,m.cardSourceLabel),n=this.renderCardFrontTags(e);i&&o.append(i),n&&o.append(n),o.append(r);const s=this.renderCardFrontBadges(e);return s&&o.append(s),a.append(o),a}renderCardFrontTags(e){var a;if(!((a=e.tags)!=null&&a.length))return null;const t=document.createElement("div");return t.className=m.cardTags,t.setAttribute("data-testid","board-card-tags"),e.tags.forEach(o=>{t.append(this.createCardTagChip(o,m.cardTag))}),t}createCardTagChip(e,t){const a=document.createElement("span");return a.className=t,a.title=e.title,a.setAttribute("aria-label",e.title),a.setAttribute("role","img"),a.setAttribute("data-testid","compact-card-label"),a.style.backgroundColor=e.color,a}renderCardFrontBadges(e){const t=document.createElement("div");t.className=m.cardBadges,e.description.trim()&&t.append(this.createCardFrontBadge("bars-3-bottom-left",this.runtime.i18n.t("boards.cardDescriptionLabel")));const a=wt(e);return a>0&&t.append(this.createCardFrontBadge("chat-bubble-bottom-center-text",this.runtime.i18n.t("boards.cardBack.comments"),String(a))),t.childElementCount>0?t:null}renderCardMirrorSourceLabel(e,t){if(!e.mirror_source)return null;const a=e.mirror_source,o=this.runtime.i18n.t("boards.cardMirror.sourceLocation",{board:a.board_title,list:a.column_title}),r=document.createElement("span");return r.className=t,r.setAttribute("data-testid","card-mirror-source-label"),r.textContent=o,r.title=this.runtime.i18n.t("boards.cardMirror.sourceLabel",{source:o}),r.setAttribute("aria-label",r.title),r}createCardFrontBadge(e,t,a){const o=document.createElement("span");o.className=m.cardBadge,o.title=t,o.setAttribute("aria-label",a?`${t}: ${a}`:t);const r=w(e,{size:16,strokeWidth:2});if(r.setAttribute("aria-hidden","true"),o.append(r),a){const i=document.createElement("span");i.textContent=a,o.append(i)}return o}renderCardComposer(e,t){const a=document.createElement("div");if(a.className=m.cardComposer,this.expandedCardComposerColumnId!==e.id){const n=_({text:this.runtime.i18n.t("boards.actions.createCard"),tone:"text",size:"md",fullWidth:!0,className:m.cardComposerCollapsed,disabled:t.status==="saving",onClick:()=>this.expandCardComposer(e.id)});return a.append(n),a}const o=document.createElement("form");o.className=m.cardComposerExpanded,o.addEventListener("submit",n=>{n.preventDefault(),this.submitCard(e.id)});const r=document.createElement("textarea");r.className=m.cardComposerTextarea,r.placeholder=this.runtime.i18n.t("boards.cardComposerPlaceholder"),r.dir="auto",r.rows=2,r.setAttribute("data-testid","list-card-composer-textarea"),r.setAttribute("aria-label",this.runtime.i18n.t("boards.cardTitleLabel")),r.addEventListener("keydown",n=>{n.key!=="Enter"||n.shiftKey||(n.preventDefault(),this.submitCard(e.id))}),this.cardDrafts.set(e.id,{title:r});const i=document.createElement("div");return i.className=m.composerActions,i.append(_({text:this.runtime.i18n.t("boards.actions.createCard"),tone:"primary",size:"sm",type:"submit",className:m.primaryButton,disabled:t.status==="saving"}),j({icon:"x-mark",tone:"text",size:"md",type:"button",title:this.runtime.i18n.t("boards.actions.cancelNewCard"),ariaLabel:this.runtime.i18n.t("boards.actions.cancelNewCard"),className:m.composerCancelButton,onClick:()=>this.collapseCardComposer()})),o.append(r,i),a.append(o),requestAnimationFrame(()=>r.focus()),a}renderColumnComposer(e,t){const a=document.createElement("aside");if(a.className=this.isColumnComposerExpanded?m.columnComposerExpandedPanel:m.columnComposerCollapsedPanel,a.dataset.boardColumnComposer="true",!this.isColumnComposerExpanded){const i=_({text:this.runtime.i18n.t("boards.addColumnPanelTitle"),tone:"text",size:"md",fullWidth:!0,className:m.columnComposerCollapsed,disabled:t.status==="saving",onClick:()=>this.expandColumnComposer()});return i.setAttribute("data-testid","list-composer-button"),i.setAttribute("data-drag-scroll-disabled","true"),q(i,"plus"),a.append(i),a}const o=document.createElement("form");o.className=m.columnComposerExpanded,o.setAttribute("data-focus-lock-disabled","false"),o.addEventListener("submit",i=>{i.preventDefault(),this.submitColumnTitle(e.id)}),this.columnTitleTextarea=document.createElement("textarea"),this.columnTitleTextarea.className=m.listComposerTextarea,this.columnTitleTextarea.placeholder=this.runtime.i18n.t("boards.columnTitlePlaceholder"),this.columnTitleTextarea.name=this.runtime.i18n.t("boards.columnTitlePlaceholder"),this.columnTitleTextarea.dir="auto",this.columnTitleTextarea.rows=1,this.columnTitleTextarea.maxLength=512,this.columnTitleTextarea.spellcheck=!1,this.columnTitleTextarea.setAttribute("data-testid","list-name-textarea"),this.columnTitleTextarea.setAttribute("autocomplete","off"),this.columnTitleTextarea.setAttribute("aria-label",this.runtime.i18n.t("boards.columnTitlePlaceholder")),this.columnTitleTextarea.addEventListener("keydown",i=>{i.key!=="Enter"||i.shiftKey||(i.preventDefault(),this.submitColumnTitle(e.id))});const r=document.createElement("div");return r.className=m.composerActions,r.append(_({text:this.runtime.i18n.t("boards.actions.createColumn"),tone:"primary",size:"sm",type:"submit",className:m.primaryButton,disabled:t.status==="saving"}),j({icon:"x-mark",tone:"text",size:"md",type:"button",title:this.runtime.i18n.t("boards.actions.cancelNewColumn"),ariaLabel:this.runtime.i18n.t("boards.actions.cancelNewColumn"),className:m.composerCancelButton,onClick:()=>this.collapseColumnComposer()})),o.append(this.columnTitleTextarea,r),a.append(o),requestAnimationFrame(()=>{var i;return(i=this.columnTitleTextarea)==null?void 0:i.focus()}),a}renderEmptyState(){const e=document.createElement("div");e.className=m.empty;const t=document.createElement("div");t.className=m.emptyContent;const a=document.createElement("h2");a.className=m.emptyTitle,a.textContent=this.runtime.i18n.t("boards.emptyTitle");const o=document.createElement("p");return o.className=m.emptyCopy,o.textContent=this.runtime.i18n.t("boards.emptyBody"),t.append(a,o),e.append(t),e}renderMessage(e){const t=document.createElement("div");t.className=m.messageWrapper;const a=document.createElement("p");return a.className=m.messageLabel,a.textContent=e,t.append(a),t}renderError(e){const t=document.createElement("div");return t.className=m.error,t.textContent=this.runtime.i18n.t(e),t}openQuickCardEditor(e,t){if(!this.state)return;const a=this.findCardLocation(e,this.state);if(!a)return;this.closeQuickCardEditor();const o=document.createElement("div");o.className=l.quickEditorOverlay,o.addEventListener("pointerdown",i=>{i.target===o&&this.closeQuickCardEditor()}),o.addEventListener("keydown",i=>{i.key==="Escape"&&(i.preventDefault(),this.closeQuickCardEditor())});const r=this.renderQuickCardEditor(a);this.positionQuickCardEditor(r,t),o.append(r),document.body.append(o),this.quickEditorOverlay=o,requestAnimationFrame(()=>{var i;(i=r.querySelector('[data-testid="quick-card-editor-card-title"]'))==null||i.focus()})}renderQuickCardEditor(e){const{card:t}=e,a=document.createElement("div");a.className=l.quickEditor,a.setAttribute("data-elevation","1"),a.addEventListener("pointerdown",p=>p.stopPropagation());const o=document.createElement("div");o.setAttribute("role","dialog"),o.setAttribute("aria-modal","true"),o.setAttribute("aria-label",this.runtime.i18n.t("boards.quickEditor.menuLabel")),o.setAttribute("data-testid","quick-card-editor-menu");const r=document.createElement("form");r.className=l.quickEditorForm,r.addEventListener("submit",p=>{p.preventDefault(),this.saveQuickCardEditor(t,s)});const i=A({elevated:!0,className:D(t)?`${l.quickEditorCard} ${l.quickEditorCardMirror}`:l.quickEditorCard});i.setAttribute("data-testid","quick-card-editor-card-front");const n=document.createElement("div");n.className=l.quickEditorCardInner;const s=document.createElement("textarea");s.className=l.quickEditorTitle,s.setAttribute("data-testid","quick-card-editor-card-title"),s.dir="auto",s.setAttribute("aria-label",this.runtime.i18n.t("boards.quickEditor.editCardName")),s.value=t.title,s.rows=2,s.addEventListener("keydown",p=>{p.key!=="Enter"||p.shiftKey||(p.preventDefault(),this.saveQuickCardEditor(t,s))});const c=this.renderCardFrontBadges(t),u=this.renderCardMirrorSourceLabel(t,m.cardSourceLabel);u&&n.append(u),n.append(s),c&&n.append(c),i.append(n);const b=_({text:this.runtime.i18n.t("common.save"),tone:"primary",size:"md",className:`${m.primaryButton} ${l.quickEditorSave}`,type:"submit"}),g=()=>{b.disabled=s.value.trim().length===0};return s.addEventListener("input",g),g(),r.append(i,b),o.append(r,this.renderQuickCardEditorActions(e)),a.append(o),a}renderQuickCardEditorActions(e){const{board:t,column:a,card:o,placementId:r}=e,i=document.createElement("div");i.className=l.quickEditorActions;const n=document.createElement("ul");return n.className=l.quickEditorButtons,n.setAttribute("data-testid","quick-card-editor-buttons"),[{testId:"quick-card-editor-open-card",labelKey:"boards.quickEditor.openCard",icon:"rectangle-stack",onClick:()=>{this.closeQuickCardEditor(),this.openCardModal(r)}},{testId:"quick-card-editor-edit-labels",labelKey:"boards.quickEditor.editLabels",icon:"tag",onClick:()=>{this.closeQuickCardEditor(),this.openCardModal(r)}},{testId:"quick-card-editor-move",labelKey:"boards.quickEditor.move",icon:"arrow-right",onClick:c=>{this.openMoveCardPopover(c.currentTarget,t,a,o,"move")}},{testId:"mirror-new-button",labelKey:"boards.quickEditor.mirror",icon:"rectangle-stack",onClick:c=>{this.openMoveCardPopover(c.currentTarget,t,a,o,"mirror")}},{testId:"quick-card-editor-archive",labelKey:D(o)?"boards.quickEditor.removeFromBoard":"boards.quickEditor.archive",icon:"archive-box",onClick:()=>{this.closeQuickCardEditor(),this.archiveOrRemoveCard(o,r)}},{testId:"quick-card-editor-delete-card",labelKey:"boards.actions.deleteCard",icon:"trash",danger:!0,onClick:()=>void this.deleteSharedCardFromQuickEditor(o)}].forEach(c=>{const u=document.createElement("li");c.danger&&(u.className=l.quickEditorDangerItem);const b=_({text:this.runtime.i18n.t(c.labelKey),tone:c.danger?"danger":"text",size:"md",className:c.danger?`${l.quickEditorButton} ${l.quickEditorDangerButton}`:l.quickEditorButton,onClick:c.onClick});b.setAttribute("data-testid",c.testId),q(b,c.icon),u.append(b),n.append(u)}),i.append(n),i}positionQuickCardEditor(e,t){const{formWidth:a,actionsWidth:o,actionsGap:r,viewportMargin:i,minVisibleHeight:n}=vt,s=Math.min(Math.max(t.left,i),Math.max(i,window.innerWidth-a-o-r-i)),c=Math.min(Math.max(t.top,i),Math.max(i,window.innerHeight-n-i));e.style.left=`${s}px`,e.style.top=`${c}px`}saveQuickCardEditor(e,t){const a=t.value.trim();a&&(this.closeQuickCardEditor(),a!==e.title&&this.handlers.onPatchCard(e.id,{title:a}))}openCardModal(e){if(!this.state)return;const t=this.findCardLocation(e,this.state);t&&(this.activeCardPlacementId=e,this.cardModalDraftTagIds=S(t.card),this.cardModalRequestedTagIds=[...this.cardModalDraftTagIds],this.renderCardModal(t))}syncCardModal(e){if(this.activeCardPlacementId===null)return;const t=this.findCardLocation(this.activeCardPlacementId,e);if(!t){this.closeCardModal();return}this.renderCardModal(t)}renderCardModal(e){var p;this.closeCardLabelsPopover(),this.closeMoveCardPopover(),(p=this.cardModalOverlay)==null||p.remove(),this.cardModalOverlay=null,this.cardModalLabelsHost=null,this.cardModalQuickActionList=null;const{board:t,column:a,card:o}=e;this.cardModalDraftTagIds===null&&(this.cardModalDraftTagIds=S(o)),this.cardModalRequestedTagIds===null&&(this.cardModalRequestedTagIds=S(o));const{overlay:r,container:i,header:n,divider:s,body:c}=Ne(o.title,{onClose:()=>this.closeCardModal(),hideCloseButton:!0,intent:"form",presentation:"dialog",zIndex:270});n.classList.add(l.hiddenShellPart),s.classList.add(l.hiddenShellPart),i.classList.add(l.container),i.addEventListener("keydown",y=>{y.stopPropagation()}),c.className=l.body;const u=document.createElement("textarea");u.className=l.titleEditor,u.dataset.boardCardModalTitle="true",u.dir="auto",u.rows=ft,u.maxLength=_t,u.value=o.title,u.setAttribute("aria-label",o.title);const b=document.createElement("textarea");b.className=l.descriptionEditor,b.dataset.boardCardModalDescription="true",b.value=o.description,b.placeholder=this.runtime.i18n.t("boards.cardDescriptionPlaceholder"),b.setAttribute("aria-label",this.runtime.i18n.t("boards.cardDescriptionLabel"));const g=document.createElement("div");g.className=l.cardBack,g.append(this.renderCardBackTopbar(t,a,o),this.renderCardBackLayout(t,a,o,u,b)),c.append(g),i.setAttribute("aria-labelledby","card-back-name"),i.setAttribute("data-focus-lock","cardback"),this.cardModalOverlay=r}renderCardBackTopbar(e,t,a){const o=document.createElement("header");o.className=l.topbar;const r=document.createElement("div");r.className=l.topbarStart;const i=document.createElement("button");i.type="button",i.className=l.listBadge,i.setAttribute("data-testid","card-back-list-button"),i.title=t.title,i.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.changeList",{column:t.title})),i.setAttribute("aria-haspopup","dialog"),i.setAttribute("aria-expanded","false"),i.addEventListener("click",g=>{var p;if(g.stopPropagation(),((p=this.moveCardPopover)==null?void 0:p.trigger)===i){this.closeMoveCardPopover();return}this.openMoveCardPopover(i,e,t,a)});const n=document.createElement("span");n.textContent=t.title;const s=w("chevron-down",{size:14,strokeWidth:2});s.setAttribute("aria-hidden","true"),i.append(n,s),r.append(i);const c=this.renderCardMirrorSourceLabel(a,l.sourceLabel);c&&r.append(c);const u=document.createElement("div");u.className=l.topbarActions;const b=j({icon:"ellipsis-vertical",tone:"text",size:"md",className:l.iconButton,ariaLabel:this.runtime.i18n.t("boards.cardBack.actions"),title:this.runtime.i18n.t("boards.cardBack.actions")});return b.setAttribute("aria-haspopup","dialog"),b.setAttribute("aria-expanded","false"),b.setAttribute("data-testid","card-back-actions-button"),b.addEventListener("click",g=>{var p;if(g.stopPropagation(),((p=this.cardActionsPopover)==null?void 0:p.trigger)===b){this.closeCardActionsPopover();return}this.openCardActionsPopover(b,e,t,a)}),u.append(b,j({icon:"x-mark",tone:"text",size:"md",className:l.iconButton,ariaLabel:this.runtime.i18n.t("common.close"),title:this.runtime.i18n.t("common.close"),onClick:()=>this.closeCardModal()})),o.append(r,u),o}openCardActionsPopover(e,t,a,o){this.closeCardActionsPopover();const r=A({elevated:!0,className:`${l.cardActionsPopover} hidden`});r.setAttribute("role","dialog"),r.setAttribute("aria-modal","false"),r.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.actions")),r.setAttribute("data-testid","card-back-actions-popover"),r.addEventListener("mousedown",c=>c.stopPropagation());const i=document.createElement("div");i.className=l.cardActionsBody;const n=document.createElement("ul");n.className=l.cardActionsList,n.append(this.renderCardActionItem({testId:"card-back-move-card-button",labelKey:"boards.quickEditor.move",icon:"arrow-right",disabled:!0}),this.renderCardActionItem({testId:"card-back-copy-card-button",labelKey:"boards.quickEditor.copyCard",icon:"square-2-stack",disabled:!0}),this.renderCardActionItem({testId:"card-back-mirror-card-button",labelKey:"boards.quickEditor.mirror",icon:"rectangle-stack",onClick:()=>{this.closeCardActionsPopover(),this.openMoveCardPopover(e,t,a,o,"mirror")}}),this.renderCardActionsDivider(),this.renderCardActionItem({testId:"card-back-archive-button",labelKey:D(o)?"boards.quickEditor.removeFromBoard":"boards.quickEditor.archive",icon:"archive-box",onClick:()=>{this.closeCardActionsPopover(),this.closeCardModal(),this.archiveOrRemoveCard(o,v(o))}}),this.renderCardActionItem({testId:"card-back-delete-card-button",labelKey:"boards.actions.deleteCard",icon:"trash",onClick:()=>void this.deleteSharedCardFromDetails(o)})),i.append(n),r.append(i);let s;s=new L({container:e,panel:r,positioning:"viewport",panelZIndex:300,onOpenChange:c=>{var u;e.setAttribute("aria-expanded",c?"true":"false"),!c&&((u=this.cardActionsPopover)==null?void 0:u.menu)===s&&this.closeCardActionsPopover()}}),s.mount(),this.cardActionsPopover={menu:s,panel:r,trigger:e},s.openAt({anchor:e,placement:"bottom-end",fallbackPlacements:["bottom-start","top-end","top-start"],gap:8,margin:12,lockPlacementAfterOpen:!0})}renderCardActionItem(e){const t=document.createElement("li");t.className=l.cardActionsItem;const a=_({text:this.runtime.i18n.t(e.labelKey),tone:"text",size:"md",className:l.cardActionsButton,disabled:e.disabled,onClick:e.onClick});return a.setAttribute("data-testid",e.testId),q(a,e.icon),t.append(a),t}renderCardActionsDivider(){const e=document.createElement("li");return e.className=l.cardActionsDivider,e.setAttribute("role","separator"),e}archiveOrRemoveCard(e,t){if(D(e)){this.handlers.onDeleteCardPlacement(t);return}this.handlers.onDeleteCard(e.id)}createPlacementTargetFromPosition(e,t,a){return Be({columnId:e.id,cards:e.cards,movingPlacementId:a??"",insertionIndex:t-1})}openMoveCardPopover(e,t,a,o,r="move"){var ue;const i=((ue=this.state)==null?void 0:ue.boards)??[t],n=v(o);let s=t.id,c=a.id,u=a.cards.findIndex(h=>v(h)===n);u=u>=0?u+1:1;const b=r==="mirror"?"boards.cardMirror.title":"boards.cardMove.title",g=r==="mirror"?"boards.cardMirror.create":"boards.cardMove.move";this.closeMoveCardPopover();const p=A({elevated:!0,className:`${l.movePopover} hidden`});p.setAttribute("role","dialog"),p.setAttribute("aria-modal","false"),p.setAttribute("aria-labelledby","move-card-popover"),p.setAttribute("data-testid","move-card-popover"),p.addEventListener("mousedown",h=>h.stopPropagation());const y=document.createElement("header");y.className=l.movePopoverHeader;const f=document.createElement("h2");f.id="move-card-popover",f.className=l.movePopoverTitle,f.textContent=this.runtime.i18n.t(b);const P=j({icon:"x-mark",tone:"text",size:"sm",className:l.iconButton,ariaLabel:this.runtime.i18n.t("common.close"),title:this.runtime.i18n.t("common.close"),onClick:()=>this.closeMoveCardPopover()});y.append(f,P);const B=document.createElement("div");B.className=l.movePopoverBody;const Y=document.createElement("div");Y.className=l.movePopoverContent;const z=document.createElement("div");z.className=l.moveTabs,z.setAttribute("role","tablist"),z.append(this.renderMoveCardTab("boards.cardMove.inbox",!1),this.renderMoveCardTab("boards.cardMove.board",!0));const V=document.createElement("h3");V.className=l.moveSectionTitle,V.textContent=this.runtime.i18n.t("boards.cardMove.selectDestination");const Z=document.createElement("div");Z.className=l.moveFields;const O=this.createMoveSelectField({id:"move-card-board-select",label:this.runtime.i18n.t("boards.cardMove.board")}),F=this.createMoveSelectField({id:"move-card-list-select",label:this.runtime.i18n.t("boards.cardMove.list")}),R=this.createMoveSelectField({id:"move-card-board-list-position-select",label:this.runtime.i18n.t("boards.cardMove.position")}),me=()=>i.find(h=>h.id===s)??null,M=()=>{var h;return((h=me())==null?void 0:h.columns.find(k=>k.id===c))??null},Ee=()=>{var h;return r!=="mirror"?!1:((h=M())==null?void 0:h.cards.some(k=>k.id===o.id))??!1},Ae=()=>{const h=M();return h?r==="mirror"?h.cards.length+1:h.id===a.id?h.cards.length:h.cards.length+1:0};let $;const J=()=>{var I;O.select.replaceChildren(...i.map(C=>this.createSelectOption(C.id,C.title,C.id===s)));const h=me(),k=(h==null?void 0:h.columns)??[];k.some(C=>C.id===c)||(c=((I=k[0])==null?void 0:I.id)??""),F.select.replaceChildren(...k.map(C=>this.createSelectOption(C.id,C.title,C.id===c)));const T=Ae();u=Math.min(Math.max(u,1),T||1),R.select.replaceChildren(...Array.from({length:T},(C,te)=>this.createSelectOption(te+1,String(te+1),te+1===u))),Ee()?W.show(this.runtime.i18n.t("boards.cardMirror.duplicateDestination"),"warning"):M()?W.clear():W.show(this.runtime.i18n.t("boards.cardMirror.noDestination"),"error"),$.disabled=!M()},W=De({tone:"error",className:"mb-3"});O.select.addEventListener("change",()=>{var h,k;s=O.select.value,c=((k=(h=i.find(T=>T.id===s))==null?void 0:h.columns[0])==null?void 0:k.id)??"",u=1,J()}),F.select.addEventListener("change",()=>{c=F.select.value,u=c===a.id?u:1,J()}),R.select.addEventListener("change",()=>{u=Number(R.select.value)}),$=_({text:this.runtime.i18n.t(g),tone:"primary",size:"md",className:l.moveButton,onClick:()=>{const h=M();if(!h)return;const k=this.createPlacementTargetFromPosition(h,u,r==="move"?n:void 0),T=a.cards.findIndex(I=>v(I)===n);if(this.closeMoveCardPopover(),r==="mirror"){this.closeQuickCardEditor();const{column:I,...C}=k;this.handlers.onCreateCardMirror(o.id,I,C);return}if(h.id===a.id&&u-1===T){this.closeQuickCardEditor();return}this.closeQuickCardEditor(),this.handlers.onPatchCardPlacement(n,k)}}),$.setAttribute("data-testid","move-card-popover-move-button");const ee=document.createElement("div");ee.className=l.moveActions,ee.append($),Z.append(O.field,F.field,R.field),Y.append(z,V,Z,W.element),B.append(Y,ee),p.append(y,B);let N;N=new L({container:e,panel:p,positioning:"viewport",panelZIndex:300,onOpenChange:h=>{var k;e.setAttribute("aria-expanded",h?"true":"false"),!h&&((k=this.moveCardPopover)==null?void 0:k.menu)===N&&this.closeMoveCardPopover()}}),N.mount(),this.moveCardPopover={menu:N,panel:p,trigger:e},J(),N.openAt({anchor:e,placement:"bottom-start",fallbackPlacements:["bottom-end","top-start","top-end"],gap:8,margin:12,lockPlacementAfterOpen:!0})}renderMoveCardTab(e,t){const a=document.createElement("button");return a.type="button",a.className=t?l.moveTabSelected:l.moveTab,a.setAttribute("role","tab"),a.setAttribute("aria-selected",t?"true":"false"),a.disabled=!t,a.textContent=this.runtime.i18n.t(e),a}createMoveSelectField(e){const t=document.createElement("label");t.className=l.moveField,t.htmlFor=e.id;const a=document.createElement("span");a.className=l.moveLabel,a.textContent=e.label;const o=document.createElement("select");return o.id=e.id,o.className=l.moveSelect,o.setAttribute("data-testid",`${e.id}-select`),t.append(a,o),{field:t,select:o}}createSelectOption(e,t,a){const o=document.createElement("option");return o.value=String(e),o.textContent=t,o.selected=a,o}renderCardBackLayout(e,t,a,o,r){const i=document.createElement("div");i.className=l.layout;const n=document.createElement("main");n.className=l.main,n.setAttribute("data-auto-scrollable","true"),n.append(this.renderCardBackTitleSection(a,o),this.renderCardBackQuickActions(a),this.renderCardBackLabelsHost(a),this.renderCardBackDescriptionSection(a,o,r),this.renderCardBackAttachmentsSection());const s=this.renderCardBackAside(e,t);return i.append(n,s),i}renderCardBackTitleSection(e,t){const a=document.createElement("section");a.className=`${l.section} ${l.titleSection}`,a.setAttribute("data-testid","card-back-header");const o=document.createElement("div");o.className=l.sectionIcon;const r=document.createElement("button");r.type="button",r.className=l.doneButton,r.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.markComplete",{title:e.title})),r.disabled=!0,r.append(w("check-circle",{size:20,strokeWidth:2})),o.append(r);const i=document.createElement("div");i.className=l.sectionMain;const n=document.createElement("hgroup"),s=document.createElement("h2");return s.id="card-back-name",s.className=l.hiddenShellPart,s.textContent=e.title,n.append(s,t),i.append(n),a.append(o,i),a}renderCardBackQuickActions(e){const t=document.createElement("section");t.className=`${l.section} ${l.quickActions}`;const a=document.createElement("div");a.className=l.sectionIcon;const o=document.createElement("div");o.className=l.sectionMain;const r=document.createElement("ul");return r.className=l.quickActionList,this.cardModalQuickActionList=r,this.populateCardBackQuickActions(r,e),o.append(r),t.append(a,o),t}populateCardBackQuickActions(e,t){e.replaceChildren();const a=[{labelKey:"boards.cardBack.add",icon:"plus",disabled:!0}];this.getCardModalDraftTagItems(t).length===0&&a.push({labelKey:"boards.cardBack.labels",icon:"tag",onClick:o=>this.openCardLabelsPopover(o,t)}),a.push({labelKey:"boards.cardBack.dates",icon:"calendar",disabled:!0},{labelKey:"boards.cardBack.checklist",icon:"check-box",disabled:!0},{labelKey:"boards.cardBack.members",icon:"plus",disabled:!0}),a.forEach(o=>{const r=document.createElement("li"),i=o.disabled===!0?this.createUnavailableCardBackButton(o.labelKey,o.icon):this.createAvailableCardBackButton({labelKey:o.labelKey,icon:o.icon,onClick:o.onClick});r.append(i),e.append(r)})}renderCardBackLabelsHost(e){const t=document.createElement("div");return t.className=l.labelsHost,t.setAttribute("data-testid","card-back-labels-host"),this.cardModalLabelsHost=t,this.populateCardBackLabelsHost(t,e),t}populateCardBackLabelsHost(e,t){e.replaceChildren();const a=this.getCardModalDraftTagItems(t);if(a.length===0)return;const o=document.createElement("section");o.className=l.labelsSection,o.setAttribute("aria-labelledby","card-back-labels-title");const r=document.createElement("h3");r.id="card-back-labels-title",r.className=l.labelsTitle,r.textContent=this.runtime.i18n.t("boards.cardBack.labels");const i=document.createElement("div");i.setAttribute("role","group"),i.setAttribute("aria-labelledby",r.id);const n=document.createElement("div");n.className=l.labelsList,n.setAttribute("data-testid","card-back-labels-container"),a.forEach(s=>{n.append(this.createCardBackLabelSwatch(s))}),n.append(this.createCardBackAddLabelButton(t)),i.append(n),o.append(r,i),e.append(o)}createCardBackLabelSwatch(e){const t=document.createElement("button");return t.type="button",t.className=l.labelSwatch,t.style.backgroundColor=e.color,t.style.color=Pt(e.color),t.textContent=e.title,t.title=e.title,t.setAttribute("aria-label",e.title),t.setAttribute("data-testid","card-label"),t.dataset.tagId=String(e.id),t}createCardBackAddLabelButton(e){const t=j({icon:"plus",tone:"text",size:"md",className:l.labelAddButton,ariaLabel:this.runtime.i18n.t("boards.cardBack.addLabel"),title:this.runtime.i18n.t("boards.cardBack.addLabel"),onClick:()=>this.openCardLabelsPopover(t,e)});return t.setAttribute("data-testid","card-back-add-label-button"),t.dataset.role="goal-tag-picker-trigger",t.setAttribute("aria-haspopup","dialog"),t.setAttribute("aria-expanded","false"),t}createAvailableCardBackButton(e){const t=_({text:this.runtime.i18n.t(e.labelKey),tone:"text",size:"md",className:l.quickActionButton,onClick:()=>e.onClick(t)});return t.setAttribute("aria-haspopup","dialog"),t.setAttribute("aria-expanded","false"),q(t,e.icon),t}getCardModalDraftTagIds(e){return this.cardModalDraftTagIds===null&&(this.cardModalDraftTagIds=S(e)),this.cardModalDraftTagIds}getCardModalDraftTagItems(e){var r;const t=this.getCardModalDraftTagIds(e),a=new Set(t),o=new Map;return(r=e.tags)==null||r.forEach(i=>o.set(i.id,Q(i))),this.tagItems.forEach(i=>o.set(i.id,i)),t.map(i=>o.get(i)).filter(i=>!!i&&a.has(i.id))}refreshCardModalLabelControls(e){this.cardModalLabelsHost&&this.populateCardBackLabelsHost(this.cardModalLabelsHost,e),this.cardModalQuickActionList&&this.populateCardBackQuickActions(this.cardModalQuickActionList,e)}patchCardModalTagIds(e,t){const a=U(t),o=this.cardModalRequestedTagIds??S(e);ve(a,o)||(this.cardModalRequestedTagIds=a,this.handlers.onPatchCard(e.id,{tag_ids:a}))}openCardLabelsPopover(e,t){this.closeCardLabelsPopover();const a=A({elevated:!0,className:`${l.labelPickerPopover} hidden`});a.setAttribute("role","dialog"),a.setAttribute("aria-modal","false"),a.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.labels")),a.setAttribute("data-testid","card-back-label-picker-popover"),a.addEventListener("mousedown",i=>i.stopPropagation());const o=new qe({variant:"labels",items:this.tagItems,selectedIds:this.getCardModalDraftTagIds(t),loading:this.tagCatalogStatus==="loading",errorMessage:this.getTagPickerErrorMessage(),placeholder:this.runtime.i18n.t("boards.cardBack.tagsPlaceholder"),searchPlaceholder:this.runtime.i18n.t("boards.cardBack.tagsSearchPlaceholder"),copy:{title:this.runtime.i18n.t("boards.cardBack.labels"),editTitle:this.runtime.i18n.t("boards.cardBack.editLabel"),createTitle:this.runtime.i18n.t("boards.cardBack.createLabel"),searchPlaceholder:this.runtime.i18n.t("boards.cardBack.tagsSearchPlaceholder"),labelsLegend:this.runtime.i18n.t("boards.cardBack.labels"),createButton:this.runtime.i18n.t("boards.cardBack.createNewLabel"),colorblindButton:this.runtime.i18n.t("boards.cardBack.enableColorblindMode"),titleLabel:this.runtime.i18n.t("boards.cardBack.labelTitle"),colorLegend:this.runtime.i18n.t("boards.cardBack.selectColor"),removeColor:this.runtime.i18n.t("boards.cardBack.removeColor"),save:this.runtime.i18n.t("common.save"),delete:this.runtime.i18n.t("common.delete"),close:this.runtime.i18n.t("boards.cardBack.closeLabelsPopover"),back:this.runtime.i18n.t("boards.cardBack.returnToLabels")},onRequestClose:()=>this.closeCardLabelsPopover(),onCreate:(i,n)=>this.createTagFromCardBack(i,n),onUpdate:(i,n)=>this.updateTagFromCardBack(i,n),onDelete:i=>this.deleteTagFromCardBack(i),onChange:i=>{this.cardModalDraftTagIds=i,this.refreshCardModalLabelControls(t),this.patchCardModalTagIds(t,i)}});o.element.setAttribute("data-testid","card-back-tag-picker"),a.append(o.element);let r;r=new L({container:e,panel:a,positioning:"viewport",panelZIndex:310,onOpenChange:i=>{var n;e.setAttribute("aria-expanded",i?"true":"false"),!i&&((n=this.cardLabelsPopover)==null?void 0:n.menu)===r&&this.closeCardLabelsPopover()}}),r.mount(),this.cardLabelsPopover={menu:r,panel:a,picker:o,trigger:e},r.openAt({anchor:e,placement:"bottom-start",fallbackPlacements:["bottom-end","top-start","top-end"],gap:8,margin:12,lockPlacementAfterOpen:!0}),window.requestAnimationFrame(()=>o.focusSearch())}async createTagFromCardBack(e,t){if(!this.tagCatalog)return null;try{const a=await this.tagCatalog.createTag(e,t),o=Q(a);return this.upsertTagItem(o),o}catch{throw new Error(this.runtime.i18n.t("boards.cardBack.tagsCreateFailed"))}}async updateTagFromCardBack(e,t){if(!this.tagCatalog)return null;try{const a=await this.tagCatalog.updateTag(e,t),o=Q(a);return this.upsertTagItem(o),o}catch{throw new Error(this.runtime.i18n.t("boards.cardBack.tagsUpdateFailed"))}}async deleteTagFromCardBack(e){if(this.tagCatalog)try{await this.tagCatalog.deleteTag(e),this.tagItems=this.tagItems.filter(a=>a.id!==e);const{card:t}=this.findActiveCardLocation();this.cardModalDraftTagIds=this.getCardModalDraftTagIds(t).filter(a=>a!==e)}catch{throw new Error(this.runtime.i18n.t("boards.cardBack.tagsDeleteFailed"))}}upsertTagItem(e){if(this.tagItems.findIndex(a=>a.id===e.id)>=0){this.tagItems=this.tagItems.map(a=>a.id===e.id?e:a);return}this.tagItems=[...this.tagItems,e]}renderCardBackDescriptionSection(e,t,a){const o=this.createCardBackSection("document",this.runtime.i18n.t("boards.cardDescriptionLabel")),r=o.querySelector(`.${l.sectionMain}`);if(!r)return o;r.append(a);const i=document.createElement("div");i.className=l.editorActions;const n=_({text:this.runtime.i18n.t("common.save"),tone:"primary",size:"md",className:m.primaryButton,onClick:()=>this.saveCardModal(e,t,a)}),s=()=>{n.disabled=t.value.trim().length===0};return t.addEventListener("input",s),s(),i.append(_({text:this.runtime.i18n.t("common.cancel"),tone:"text",size:"md",className:m.quietButton,onClick:()=>this.closeCardModal()}),n),r.append(i),o}async deleteSharedCardFromQuickEditor(e){await this.deleteSharedCard(e,()=>this.closeQuickCardEditor())}async deleteSharedCardFromDetails(e){await this.deleteSharedCard(e,()=>{this.closeCardActionsPopover(),this.closeCardModal()})}async deleteSharedCard(e,t){await this.confirmSharedCardDeletion()&&(t(),this.handlers.onDeleteCard(e.id))}confirmSharedCardDeletion(){return this.openDeleteCardConfirmationDialog()}openDeleteCardConfirmationDialog(){return new Promise(e=>{let t=!1;const a=p=>{t||(t=!0,e(p))},o=()=>r.remove(),{overlay:r,container:i,body:n,footer:s}=ze(this.runtime.i18n.t("boards.actions.deleteCard"),{intent:"confirm",zIndex:360,onClose:()=>{a(!1),o()}}),c=document.createElement("p");c.className="text-sm leading-relaxed text-slate-600",c.id=`delete-card-confirm-message-${Math.random().toString(36).slice(2,9)}`,c.textContent=this.runtime.i18n.t("boards.cardMirror.deleteSharedConfirm"),i.setAttribute("aria-describedby",c.id),n.append(c);const u=Oe({variant:"confirm"}),b=_({text:this.runtime.i18n.t("common.cancel"),tone:"text",size:"md",className:pe("default"),onClick:()=>{a(!1),o()}});b.setAttribute("data-testid","delete-card-cancel-button"),u.append(b);const g=_({text:this.runtime.i18n.t("boards.actions.deleteCard"),tone:"destructive",size:"md",className:pe("wide"),onClick:()=>{a(!0),o()}});g.setAttribute("data-testid","delete-card-confirm-button"),u.append(g),s.append(u),i.addEventListener("keydown",p=>{p.stopPropagation(),p.key==="Escape"&&(p.preventDefault(),a(!1),o())})})}renderCardBackAttachmentsSection(){const e=this.createCardBackSection("link",this.runtime.i18n.t("boards.cardBack.attachments"),_({text:this.runtime.i18n.t("boards.cardBack.add"),tone:"text",size:"sm",className:m.quietButton,disabled:!0})),t=e.querySelector(`.${l.sectionMain}`);if(!t)return e;const a=document.createElement("div");return a.className=l.placeholderPanel,a.textContent=this.runtime.i18n.t("boards.cardBack.noAttachments"),t.append(a),e}renderCardBackAside(e,t){const a=document.createElement("aside");a.className=l.aside,a.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.comments"));const o=this.createCardBackSection("chat-bubble-left",this.runtime.i18n.t("boards.cardBack.comments"),_({text:this.runtime.i18n.t("boards.cardBack.showDetails"),tone:"text",size:"sm",className:m.quietButton,disabled:!0})),r=o.querySelector(`.${l.sectionMain}`);if(!r)return a;r.append(_({text:this.runtime.i18n.t("boards.cardBack.writeComment"),tone:"text",size:"md",className:l.activityInput,disabled:!0}));const i=document.createElement("ul");i.className=l.activityList;const n=document.createElement("li");n.className=l.activityItem;const s=document.createElement("span");s.className=l.avatar,s.textContent="M",s.setAttribute("aria-hidden","true");const c=document.createElement("span");return c.textContent=this.runtime.i18n.t("boards.cardBack.activityCreated",{board:e.title,column:t.title}),n.append(s,c),i.append(n),r.append(i),a.append(o),a}createCardBackSection(e,t,a){const o=document.createElement("section");o.className=l.section;const r=document.createElement("div");r.className=l.sectionIcon;const i=w(e,{size:20,strokeWidth:2});i.setAttribute("aria-hidden","true"),r.append(i);const n=document.createElement("div");n.className=l.sectionMain;const s=document.createElement("div");s.className=l.sectionHeader;const c=document.createElement("h3");c.className=l.sectionTitle,c.textContent=t;const u=document.createElement("div");return u.className=l.sectionActions,a&&u.append(a),s.append(c,u),n.append(s),o.append(r,n),o}createUnavailableCardBackButton(e,t){const a=_({text:this.runtime.i18n.t(e),tone:"text",size:"md",className:l.quickActionButton,disabled:!0});return q(a,t),a}saveCardModal(e,t,a){const o=t.value.trim();if(!o)return;const r=a.value,i=this.getCardModalDraftTagIds(e),n={};o!==e.title&&(n.title=o),r!==e.description&&(n.description=r);const s=this.cardModalRequestedTagIds??S(e);ve(i,s)||(n.tag_ids=i),this.closeCardModal(),(n.title!==void 0||n.description!==void 0||n.tag_ids!==void 0)&&this.handlers.onPatchCard(e.id,n)}closeCardModal(){var e;this.closeCardActionsPopover(),this.closeCardLabelsPopover(),this.closeMoveCardPopover(),this.cardModalDraftTagIds=null,this.cardModalRequestedTagIds=null,this.cardModalLabelsHost=null,this.cardModalQuickActionList=null,this.activeCardPlacementId=null,(e=this.cardModalOverlay)==null||e.remove(),this.cardModalOverlay=null}closeCardLabelsPopover(){const e=this.cardLabelsPopover;e&&(this.cardLabelsPopover=null,e.trigger.setAttribute("aria-expanded","false"),e.menu.close(),e.menu.unmount(),e.picker.destroy(),e.panel.remove())}closeMoveCardPopover(){const e=this.moveCardPopover;e&&(this.moveCardPopover=null,e.trigger.setAttribute("aria-expanded","false"),e.menu.close(),e.menu.unmount(),e.panel.remove())}closeCardActionsPopover(){const e=this.cardActionsPopover;e&&(this.cardActionsPopover=null,e.trigger.setAttribute("aria-expanded","false"),e.menu.close(),e.menu.unmount(),e.panel.remove())}closeListActionsPopover(){const e=this.listActionsPopover;e&&(this.listActionsPopover=null,e.trigger.setAttribute("aria-expanded","false"),e.menu.close(),e.menu.unmount(),e.panel.remove())}closeBoardPickerPopover(){const e=this.boardPickerPopover;e&&(this.closeBoardPickerActionsMenu(),this.boardPickerPopover=null,e.trigger.setAttribute("aria-expanded","false"),e.menu.close(),e.menu.unmount(),e.panel.remove())}closeBoardPickerActionsMenu(){var t;const e=(t=this.boardPickerPopover)==null?void 0:t.actionsMenu;e&&(this.boardPickerPopover.actionsMenu=null,e.menu.close(),e.menu.unmount(),e.panel.remove())}closeQuickCardEditor(){var e;(e=this.quickEditorOverlay)==null||e.remove(),this.quickEditorOverlay=null}getSelectedBoard(e){return e.boards.find(t=>t.id===e.selectedBoardId)??e.boards[0]??null}findCardLocation(e,t){for(const a of t.boards)for(const o of a.columns){const r=o.cards.find(i=>v(i)===e);if(r)return{board:a,column:o,card:r,placementId:e}}return null}submitColumnTitle(e){var a;const t=((a=this.columnTitleTextarea)==null?void 0:a.value.trim())??"";t&&(this.handlers.onCreateColumn(e,t),this.columnTitleTextarea&&(this.columnTitleTextarea.value=""),this.isColumnComposerExpanded=!1)}startBoardTitleEdit(e){this.editingBoardTitleId=e,this.rerenderCurrentState()}finishBoardTitleEdit(e,t){var o;if(this.editingBoardTitleId!==e.id)return;const a=((o=this.boardTitleEditInput)==null?void 0:o.value.trim())??"";if(this.editingBoardTitleId=null,this.boardTitleEditInput=null,t&&a.length>0&&a!==e.title){this.handlers.onPatchBoard(e.id,{title:a});return}this.rerenderCurrentState()}startColumnTitleEdit(e){this.editingColumnTitleId=e,this.rerenderCurrentState()}finishColumnTitleEdit(e,t){var o;if(this.editingColumnTitleId!==e.id)return;const a=((o=this.columnTitleEditInput)==null?void 0:o.value.trim())??"";if(this.editingColumnTitleId=null,this.columnTitleEditInput=null,t&&a.length>0&&a!==e.title){this.handlers.onPatchColumn(e.id,{title:a});return}this.rerenderCurrentState()}expandCardComposer(e){this.expandedCardComposerColumnId=e,this.rerenderCurrentState()}collapseCardComposer(){this.expandedCardComposerColumnId=null,this.rerenderCurrentState()}expandColumnComposer(){this.isColumnComposerExpanded=!0,this.rerenderCurrentState()}collapseColumnComposer(){this.isColumnComposerExpanded=!1,this.rerenderCurrentState()}submitCard(e){const t=this.cardDrafts.get(e);if(!t)return;const a=t.title.value.trim();a&&(this.handlers.onCreateCard(e,a,""),t.title.value="",this.expandedCardComposerColumnId=null,this.rerenderCurrentState())}rerenderCurrentState(){this.state&&this.render(this.state)}unmountHeaderMenu(){var e;(e=this.headerMenu)==null||e.unmount(),this.headerMenu=null}}class Et{constructor(e={}){this.root=null,this.store=null,this.view=null,this.subscriptions=new be,this.runtime=e.runtime??ce()}mount(e){if(this.root)return;const t=document.createElement("div");t.dataset.module="boards",t.className="h-full w-full",e.appendChild(t),this.root=t;const a=new Fe(Re.apiUrl),o=new $e(a),r=new ot(new Ke(a)),i=new Bt(t,{runtime:this.runtime,tagCatalog:{loadTags:()=>x(o.getTags()),createTag:(n,s)=>x(o.createTag({title:n,color:s??We(n)})),updateTag:(n,s)=>x(o.updateTag(n,s)),deleteTag:async n=>{await x(o.deleteTag(n))}},handlers:{onRefresh:()=>void r.load(),onSelectBoard:n=>r.selectBoard(n),onCreateBoard:n=>void r.createBoard(n),onPatchBoard:(n,s)=>void r.patchBoard(n,s),onToggleBoardStar:n=>r.toggleBoardStar(n),onUpdateBoardGroup:(n,s)=>r.updateBoardGroup(n,s),onDeleteBoard:n=>void r.deleteBoard(n),onCreateColumn:(n,s)=>void r.createColumn(n,s),onPatchColumn:(n,s)=>void r.patchColumn(n,s),onDeleteColumn:n=>void r.deleteColumn(n),onCreateCard:(n,s,c)=>void r.createCard(n,s,c),onPatchCard:(n,s)=>void r.patchCard(n,s),onCreateCardMirror:(n,s,c)=>void r.createCardMirror(n,s,c),onPatchCardPlacement:(n,s)=>void r.patchCardPlacement(n,s),onDeleteCardPlacement:n=>void r.deleteCardPlacement(n),onDeleteCard:n=>void r.deleteCard(n)}});this.store=r,this.view=i,this.subscriptions.add(r.state$.subscribe(n=>i.render(n))),r.load()}unmount(){var e,t,a;this.subscriptions.unsubscribe(),this.subscriptions=new be,(e=this.view)==null||e.destroy(),this.view=null,(t=this.store)==null||t.destroy(),this.store=null,(a=this.root)==null||a.remove(),this.root=null}}class Tt{constructor(e={}){this.id="boards",this.app=null,this.runtime=e.runtime??ce()}mount(e){if(this.app)return;const t=new Et({runtime:this.runtime});t.mount(e),this.app=t}unmount(){var e;(e=this.app)==null||e.unmount(),this.app=null}getAiAssistantSnapshot(){return null}}export{Tt as BoardsModule};
