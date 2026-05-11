import{m as X,B as U,g as x,P as u,z as P,q as w,u as Y,v as q,w as G,S as f,X as K,d as L,k as B,H as Z,e as Q}from"./index-k5l5tUI7.js";function J(l){return Array.isArray(l)?l:l.results}function y(l){return encodeURIComponent(String(l))}function ee(l={}){const e=[];return l.isCompleted!==void 0&&e.push(`is_completed=${l.isCompleted?"true":"false"}`),l.page!==void 0&&e.push(`page=${encodeURIComponent(l.page.toString())}`),l.pageSize!==void 0&&e.push(`page_size=${encodeURIComponent(l.pageSize.toString())}`),e.length?`?${e.join("&")}`:""}class te{constructor(e){this.http=e}getFlows(){return this.http.get("/flows/").pipe(X(J))}getFlow(e){return this.http.get(`/flows/${y(e)}/`)}getFlowTasks(e,t={}){return this.http.get(`/flows/${y(e)}/tasks/${ee(t)}`)}createFlow(e){return this.http.post("/flows/",e)}updateFlow(e,t){return this.http.put(`/flows/${y(e)}/`,t)}patchFlow(e,t){return this.http.patch(`/flows/${y(e)}/`,t)}deleteFlow(e){return this.http.delete(`/flows/${y(e)}/`)}}const W=1024;function _(l,e){const t=I(l),o=I(e);return t!==null||o!==null?(t??T(l))-(o??T(e))||l.title.localeCompare(e.title)||l.id-e.id:l.title.localeCompare(e.title)||l.id-e.id}function oe(l,e,t){const o=l.find(s=>s.flow.id===e);if(!o)return[];const i=l.filter(s=>s.flow.id!==e),n=Math.max(0,Math.min(t,i.length)),r=[...i];return r.splice(n,0,o),r.map((s,a)=>({column:s,pos:(a+1)*W})).filter(({column:s,pos:a})=>I(s.flow)!==a)}function C(l,e,t){var s,a;const o=ie(l,e,t),i=l.findIndex(d=>d.flow.id===e);if(i<0)return!0;const n=i>0?l[i-1]:null,r=i<l.length-1?l[i+1]:null;return((n==null?void 0:n.flow.id)??null)!==(((s=o.previous)==null?void 0:s.flow.id)??null)||((r==null?void 0:r.flow.id)??null)!==(((a=o.next)==null?void 0:a.flow.id)??null)}function ie(l,e,t){const o=l.filter(n=>n.flow.id!==e),i=Math.max(0,Math.min(t,o.length));return{previous:i>0?o[i-1]:null,next:i<o.length?o[i]:null}}function I(l){const e=H(l.meta),t=e==null?void 0:e.pos;if(typeof t=="number"&&Number.isFinite(t))return t;if(typeof t=="string"&&t.trim()){const o=Number(t);return Number.isFinite(o)?o:null}return null}function $(l,e){return{...H(l)??{},pos:e}}function T(l){return l.id*W}function H(l){return l&&typeof l=="object"&&!Array.isArray(l)?l:null}const ne=50,re={columns:[],status:"idle",error:null};function le(l){return[...l].sort(_)}class se{constructor(e){this.api=e,this.stateSubject=new U(re),this.state$=this.stateSubject.asObservable(),this.loadVersion=0,this.reorderVersion=0,this.flowPatchVersions=new Map}get snapshot(){return this.stateSubject.value}destroy(){this.loadVersion+=1,this.stateSubject.complete()}async load(){const e=++this.loadVersion;this.patchState({status:"loading",error:null});try{const t=le(await x(this.api.getFlows()));if(e!==this.loadVersion)return;this.patchState({columns:t.map(N),status:"ready",error:null}),await Promise.all(t.map(o=>this.loadColumnTasks(o,e)))}catch{if(e!==this.loadVersion)return;this.patchState({status:"error",error:"flows.errors.load"})}}async patchFlow(e,t){const o=this.snapshot.columns.find(n=>n.flow.id===e)??null,i=(this.flowPatchVersions.get(e)??0)+1;this.flowPatchVersions.set(e,i),o&&this.replaceFlow(ae(o.flow,t));try{const n=await x(this.api.patchFlow(e,t));this.flowPatchVersions.get(e)===i&&this.replaceFlow(n)}catch(n){throw o&&this.flowPatchVersions.get(e)===i&&this.replaceFlow(o.flow),n}}async createFlow(e){const t=await x(this.api.createFlow(e)),o=this.loadVersion;this.patchState({columns:E([...this.snapshot.columns,N(t)])}),await this.loadColumnTasks(t,o)}async reorderFlowColumns(e,t){const o=oe(this.snapshot.columns,e,t);if(o.length===0)return;const i=++this.reorderVersion,n=this.snapshot.columns;this.patchState({columns:de(this.snapshot.columns,o)});try{const r=await Promise.all(o.map(({column:a,pos:d})=>x(this.api.patchFlow(a.flow.id,{meta:$(a.flow.meta,d)}))));if(i!==this.reorderVersion)return;const s=new Map(r.map(a=>[a.id,a]));this.patchState({columns:E(this.snapshot.columns.map(a=>{const d=s.get(a.flow.id);return d?{...a,flow:d}:a}))})}catch(r){throw i===this.reorderVersion&&this.patchState({columns:n}),r}}async deleteFlow(e){await x(this.api.deleteFlow(e)),this.patchState({columns:this.snapshot.columns.filter(t=>t.flow.id!==e)})}async loadColumnTasks(e,t){try{const o=await x(this.api.getFlowTasks(e.id,{isCompleted:!1,page:1,pageSize:ne}));if(t!==this.loadVersion)return;this.patchColumn(e.id,{tasks:o.results,taskStatus:"ready",taskError:null,openTaskCount:o.count})}catch{if(t!==this.loadVersion)return;this.patchColumn(e.id,{taskStatus:"error",taskError:"flows.tasks.errors.load"})}}patchColumn(e,t){this.patchState({columns:this.snapshot.columns.map(o=>o.flow.id===e?{...o,...t}:o)})}replaceFlow(e){this.patchState({columns:E(this.snapshot.columns.map(t=>t.flow.id===e.id?{...t,flow:e}:t))})}patchState(e){this.stateSubject.next({...this.snapshot,...e})}}function E(l){return[...l].sort((e,t)=>_(e.flow,t.flow))}function ae(l,e){return{...l,...e}}function de(l,e){const t=new Map(e.map(({column:o,pos:i})=>[o.flow.id,i]));return E(l.map(o=>{const i=t.get(o.flow.id);return i===void 0?o:{...o,flow:{...o.flow,meta:$(o.flow.meta,i)}}}))}function N(l){return{flow:l,tasks:[],taskStatus:"loading",taskError:null,openTaskCount:0}}const k=["indigo","violet","fuchsia","rose","orange","amber","lime","emerald","teal","cyan","blue","slate"],D=["stable","medium","high"],S=[u.Lowest,u.Low,u.Medium,u.High,u.Highest],ce=new Set(k),ue=new Set(D),fe=new Set(S);function v(l){return k[l%k.length]??"indigo"}function b(l){var a;const e=z((a=z(l.meta))==null?void 0:a.presentation),t=e==null?void 0:e.color,o=e==null?void 0:e.timeProfile,i=e==null?void 0:e.riskLevel,n=e==null?void 0:e.priority,r=e==null?void 0:e.collapsed,s=e==null?void 0:e.hidden;return{color:typeof t=="string"&&ce.has(t)?t:null,timeProfile:typeof o=="string"&&o.trim()?o.trim():null,riskLevel:typeof i=="string"&&ue.has(i)?i:null,priority:typeof n=="string"&&fe.has(n)?n:null,collapsed:typeof r=="boolean"?r:null,hidden:typeof s=="boolean"?s:null}}function F(l,e){const t={...z(l)??{}},o={...z(t.presentation)??{},color:e.color,timeProfile:e.timeProfile,riskLevel:e.riskLevel,priority:e.priority,collapsed:e.collapsed,hidden:e.hidden};return t.presentation=o,t}function z(l){return l&&typeof l=="object"&&!Array.isArray(l)?l:null}const pe=4,A=44,O=18;function he(l){return l.view??window}function we(l){return!l||l.closest(".flows-column-collapsed")?!1:!!l.closest('[data-flow-drag-ignore="true"], button, input, textarea, select')}class me{constructor(e){this.options=e,this.pending=null,this.active=null,this.eventWindow=null,this.suppressNextClick=!1,this.mounted=!1,this.handleClick=t=>{this.suppressNextClick&&(this.suppressNextClick=!1,t.preventDefault(),t.stopPropagation())},this.handlePointerDown=t=>{if(t.button!==0||t.isPrimary===!1)return;const o=t.target,i=o==null?void 0:o.closest('[data-flow-column-draggable="true"]');if(!i||!this.options.root.contains(i)||we(o))return;const n=Number(i.dataset.flowId),r=this.options.getState();!r||!Number.isFinite(n)||r.columns.some(s=>s.flow.id===n)&&(this.pending={pointerId:t.pointerId,startX:t.clientX,startY:t.clientY,sourceColumnElement:i,flowId:n},this.addWindowListeners(he(t)))},this.handlePointerMove=t=>{const o=this.pending;if(!o||t.pointerId!==o.pointerId)return;if(!this.active){const n=t.clientX-o.startX,r=t.clientY-o.startY;if(Math.hypot(n,r)<pe)return;this.startDrag(o,t)}const i=this.active;i&&(t.preventDefault(),this.movePreview(i,t.clientX,t.clientY),this.updateDropTarget(i,t.clientX),this.autoScroll(t.clientX))},this.handlePointerUp=t=>{this.pending&&t.pointerId!==this.pending.pointerId||(this.removeWindowListeners(),this.pending=null,this.finishActiveDrag(!0))},this.handlePointerCancel=t=>{this.pending&&t.pointerId!==this.pending.pointerId||this.cancelDrag()},this.handleWindowBlur=()=>{this.cancelDrag()}}mount(){this.mounted||(this.mounted=!0,this.options.root.addEventListener("pointerdown",this.handlePointerDown,!0),this.options.root.addEventListener("click",this.handleClick,!0))}unmount(){this.mounted&&(this.mounted=!1,this.cancelDrag(),this.options.root.removeEventListener("pointerdown",this.handlePointerDown,!0),this.options.root.removeEventListener("click",this.handleClick,!0))}cancelDrag(){this.removeWindowListeners(),this.pending=null,this.finishActiveDrag(!1)}startDrag(e,t){const o=e.sourceColumnElement.getBoundingClientRect(),i=e.sourceColumnElement.cloneNode(!0);i.classList.add("flows-column-drag-preview"),i.style.width=`${o.width}px`,i.style.height=`${o.height}px`,i.style.left=`${o.left}px`,i.style.top=`${o.top}px`;const n=document.createElement("div");n.className="flows-column-drag-placeholder",n.style.width=`${o.width}px`,n.style.flexBasis=`${o.width}px`,n.style.height=`${o.height}px`,e.sourceColumnElement.classList.add("is-dragging"),document.body.append(i),this.active={...e,offsetX:t.clientX-o.left,offsetY:t.clientY-o.top,preview:i,placeholder:n,insertionIndex:null},this.options.root.classList.add("is-flow-column-dragging"),this.movePreview(this.active,t.clientX,t.clientY),this.updateDropTarget(this.active,t.clientX)}movePreview(e,t,o){e.preview.style.left=`${t-e.offsetX}px`,e.preview.style.top=`${o-e.offsetY}px`}updateDropTarget(e,t){const o=this.resolveInsertionIndex(e.flowId,t);if(e.insertionIndex=o,!this.hasActiveTargetChanged(e)){e.placeholder.remove();return}this.placePlaceholder(e,o)}hasActiveTargetChanged(e){const t=this.options.getState();return!!(t&&e.insertionIndex!==null&&C(t.columns,e.flowId,e.insertionIndex))}resolveInsertionIndex(e,t){const o=Array.from(this.options.root.querySelectorAll('[data-flow-column-draggable="true"]')).filter(n=>Number(n.dataset.flowId)!==e),i=o.findIndex(n=>{const r=n.getBoundingClientRect();return t<r.left+r.width/2});return i>=0?i:o.length}placePlaceholder(e,t){const o=this.options.root.querySelector('[data-flow-board="true"]');if(!o)return;const i=Array.from(o.querySelectorAll('[data-flow-column-draggable="true"]')).filter(n=>Number(n.dataset.flowId)!==e.flowId);o.insertBefore(e.placeholder,i[t]??null)}autoScroll(e){const t=this.options.root.querySelector(".flows-body");if(!t)return;const o=t.getBoundingClientRect();e<o.left+A?t.scrollLeft-=O:e>o.right-A&&(t.scrollLeft+=O)}finishActiveDrag(e){const t=this.active;t&&(this.active=null,t.preview.remove(),t.placeholder.remove(),t.sourceColumnElement.classList.remove("is-dragging"),this.options.root.classList.remove("is-flow-column-dragging"),this.suppressNextClick=!0,e&&this.hasActiveTargetChanged(t)&&t.insertionIndex!==null&&this.options.onDrop(t.flowId,t.insertionIndex))}addWindowListeners(e){this.eventWindow=e,e.addEventListener("pointermove",this.handlePointerMove,!0),e.addEventListener("pointerup",this.handlePointerUp,!0),e.addEventListener("pointercancel",this.handlePointerCancel,!0),e.addEventListener("blur",this.handleWindowBlur,!0)}removeWindowListeners(){const e=this.eventWindow??window;this.eventWindow=null,e.removeEventListener("pointermove",this.handlePointerMove,!0),e.removeEventListener("pointerup",this.handlePointerUp,!0),e.removeEventListener("pointercancel",this.handlePointerCancel,!0),e.removeEventListener("blur",this.handleWindowBlur,!0)}}const M="flows-styles",ge=`
#flows-root {
  --flows-column-expanded-width: 272px;
  --flows-card-border: 0;
  --flows-card-shadow: 0 1px 1px rgba(9, 30, 66, 0.25), 0 0 0 1px rgba(9, 30, 66, 0.06);
  --flows-list-shadow: 0 1px 1px rgba(9, 30, 66, 0.16), 0 0 1px rgba(9, 30, 66, 0.31);
  --flows-on-wallpaper-text: var(--workspace-dynamic-text-color, #172b4d);
  --flows-on-wallpaper-bg: var(--workspace-dynamic-header-bg, rgba(255, 255, 255, 0.24));
  --flows-on-wallpaper-button-bg-hover: var(--workspace-dynamic-button-bg-hover, rgba(9, 30, 66, 0.16));
  --flows-on-wallpaper-button-bg-active: var(--workspace-dynamic-button-bg-active, rgba(9, 30, 66, 0.22));
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent;
  color: var(--workspace-dynamic-text-color, #0f172a);
  font-family: "Poppins", "Inter", "Segoe UI", "Roboto", "Arial", sans-serif;
}

#flows-root *,
#flows-root *::before,
#flows-root *::after {
  box-sizing: border-box;
}

.flows-page {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  width: 100%;
  height: 100%;
}

.flows-header {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: 8px;
  padding: 8px 12px;
  background: var(--workspace-dynamic-header-bg, rgba(255, 255, 255, 0.24));
  color: var(--workspace-dynamic-text-color, #172b4d);
  backdrop-filter: blur(10px);
}

.flows-header-title-block {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 6px;
}

.flows-header-title-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 4px;
}

.flows-header-title {
  margin: 0;
  overflow: hidden;
  color: var(--workspace-dynamic-text-color, #172b4d);
  font-size: 18px;
  font-weight: 700;
  line-height: 24px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flows-header-title-row .flows-header-action {
  flex: 0 0 auto;
}

.flows-header-action {
  display: inline-flex;
  height: 32px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 0 !important;
  border-radius: 6px !important;
  color: var(--workspace-dynamic-icon-color, #172b4d) !important;
  background: transparent !important;
  font-size: 13px !important;
  font-weight: 700 !important;
  line-height: 1 !important;
  padding: 0 10px !important;
}

.flows-header-action:hover,
.flows-header-action:focus-visible,
.flows-header-action:active,
.flows-header-action[aria-pressed="true"] {
  color: var(--workspace-dynamic-icon-color, #172b4d) !important;
  background: var(--workspace-dynamic-button-bg-active, rgba(9, 30, 66, 0.22)) !important;
}

.flows-body {
  display: flex;
  min-height: 0;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 12px 16px 16px;
}

.flows-center-state {
  display: flex;
  flex: 1;
  height: 100%;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.flows-state-text {
  margin: 0;
  max-width: 32rem;
  color: var(--workspace-dynamic-text-color, #334155);
  font-size: 15px;
  line-height: 1.6;
}

.flows-board {
  display: flex;
  width: max-content;
  min-width: max-content;
  height: 100%;
  align-items: flex-start;
  gap: 18px;
}

.flows-body::-webkit-scrollbar,
.flows-column-task-list::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.flows-body::-webkit-scrollbar-track,
.flows-column-task-list::-webkit-scrollbar-track {
  background: transparent;
}

.flows-body::-webkit-scrollbar-thumb,
.flows-column-task-list::-webkit-scrollbar-thumb {
  border: 2px solid rgba(248, 250, 252, 0.78);
  border-radius: 999px;
  background: rgba(203, 213, 225, 0.78);
}

.flows-column {
  position: relative;
  display: flex;
  width: var(--flows-column-expanded-width);
  min-width: var(--flows-column-expanded-width);
  flex: 0 0 var(--flows-column-expanded-width);
  height: auto;
  max-height: 100%;
  align-self: flex-start;
  flex-direction: column;
  overflow: visible;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
  transition: width 220ms ease, min-width 220ms ease;
}

.flows-column.is-dragging {
  opacity: 0.28;
}

.flows-column-drag-preview {
  position: fixed;
  z-index: 260;
  pointer-events: none;
  opacity: 0.92;
  transform: rotate(1deg);
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.18);
}

.flows-column-drag-placeholder {
  flex: 0 0 auto;
  border: 2px dashed rgba(148, 163, 184, 0.55);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.26);
}

.is-flow-column-dragging .flows-column {
  cursor: grabbing;
}

.flows-column.is-collapsed {
  width: 52px;
  min-width: 52px;
  flex-basis: 52px;
  height: auto;
  max-height: calc(100% - 8px);
  overflow: hidden;
  border: var(--flows-card-border);
  border-radius: 12px;
  background: #ffffff;
  box-shadow: var(--flows-list-shadow);
}

.flows-column.is-collapsed .flows-column-expanded {
  display: none;
}

.flows-column:not(.is-collapsed) .flows-column-collapsed {
  display: none;
}

.flows-column-collapsed {
  display: flex;
  width: 100%;
  min-height: 9rem;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  border: 0;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  padding: 14px 0;
  transition: background-color 140ms ease, color 140ms ease;
}

.flows-column-collapsed:hover {
  background: #f8fafc;
  color: #334155;
}

.flows-column-collapsed-indicator {
  width: 5px;
  height: 20px;
  border-radius: 999px;
  background: var(--flow-accent, #818cf8);
}

.flows-column-collapsed-title {
  max-height: 14rem;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.flows-column-expanded {
  display: flex;
  width: 100%;
  min-height: 0;
  flex-direction: column;
}

.flows-column-header {
  position: relative;
  flex-shrink: 0;
  overflow: hidden;
  border: var(--flows-card-border);
  border-radius: 14px;
  background: #ffffff;
  box-shadow: var(--flows-list-shadow);
  padding: 10px 12px 10px 12px;
}

.flows-column-color-line-bar {
  position: absolute;
  top: 0;
  left: 0;
  width: 6px;
  height: 100%;
  background: var(--flow-accent, #818cf8);
  opacity: 0.82;
}

.flows-column-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-top: 2px;
}

.flows-column-title-wrap {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  align-items: center;
  gap: 8px;
}

.flows-column-title-actions {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 4px;
}

.flows-column-title {
  margin: 0;
  min-width: 0;
  flex: 1 1 auto;
}

.flows-column-title-button {
  display: block;
  width: 100%;
  min-width: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  padding: 3px 5px;
  text-align: left;
}

.flows-column-title-button:hover,
.flows-column-title-button:focus-visible {
  background: rgba(15, 23, 42, 0.06);
  outline: none;
}

.flows-column-title-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #1e293b;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0;
}

.flows-column-title-input {
  width: 100%;
  min-width: 0;
  height: 30px;
  border: 0;
  border-radius: 6px;
  background: #ffffff;
  box-shadow: inset 0 0 0 1px #cbd5e1;
  color: #1e293b;
  font: inherit;
  font-size: 16px;
  font-weight: 700;
  line-height: 20px;
  padding: 4px 7px;
}

.flows-column-title-input:focus {
  outline: none;
}

.flows-column-icon-button {
  display: inline-flex;
  width: 26px;
  height: 26px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: background-color 140ms ease, color 140ms ease;
}

.flows-column-icon-button:hover {
  background: #f1f5f9;
  color: #475569;
}

.flows-column-menu-container {
  position: relative;
  flex: 0 0 auto;
}

.flows-column-menu-trigger {
  margin-right: -6px;
}

.flows-column-menu {
  width: 144px;
  overflow: hidden;
  border: 1px solid rgba(226, 232, 240, 0.92);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.14);
  padding: 4px 0;
}

.flows-column-menu-item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 8px;
  border: 0;
  background: transparent;
  color: #475569;
  cursor: pointer;
  font-size: 13px;
  font-weight: 650;
  padding: 8px 12px;
  text-align: left;
  transition: background-color 140ms ease, color 140ms ease;
}

.flows-column-menu-item:hover {
  background: #f8fafc;
  color: #334155;
}

.flows-column-menu-item-icon {
  display: inline-flex;
}

.flows-column-menu-item--danger {
  border-top: 1px solid rgba(241, 245, 249, 0.95);
  color: #dc2626;
  margin-top: 4px;
}

.flows-column-menu-item--danger:hover {
  background: #fff1f2;
  color: #be123c;
}

.flows-column-task-list {
  display: flex;
  min-height: 0;
  flex: 0 1 auto;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  padding: 10px 4px 0;
}

.flows-task-card {
  border: var(--flows-card-border);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: var(--flows-card-shadow);
  cursor: default;
  padding: 14px;
  transition: background-color 140ms ease, box-shadow 140ms ease;
}

.flows-task-card:hover {
  background: #f7f8f9;
}

.flows-task-title {
  margin: 0 0 12px;
  color: #334155;
  font-size: 13px;
  font-weight: 650;
  line-height: 1.5;
}

.flows-task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  color: #94a3b8;
}

.flows-task-meta-item {
  border-radius: 999px;
  background: #f8fafc;
  font-size: 11px;
  font-weight: 650;
  padding: 3px 7px;
  text-transform: capitalize;
}

.flows-add-task-button {
  display: flex;
  width: 100%;
  min-height: 44px;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  border: 0;
  border-radius: 8px;
  background: var(--flows-on-wallpaper-bg);
  color: var(--flows-on-wallpaper-text);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  padding: 0 14px;
  backdrop-filter: blur(10px);
  transition: background-color 140ms ease;
}

.flows-add-task-button:hover,
.flows-add-task-button:focus-visible {
  background: var(--flows-on-wallpaper-button-bg-hover);
  outline: none;
}

.flows-add-task-button:active {
  background: var(--flows-on-wallpaper-button-bg-active);
}

.flows-add-flow-panel {
  display: flex;
  width: var(--flows-column-expanded-width);
  height: fit-content;
  flex: 0 0 var(--flows-column-expanded-width);
  flex-direction: column;
  border-radius: 10px;
  background: var(--flows-on-wallpaper-bg);
  box-shadow: none;
  backdrop-filter: blur(10px);
}

.flows-add-flow-button {
  display: flex;
  width: 100%;
  min-height: 44px;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--flows-on-wallpaper-text);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  padding: 0 14px;
  transition: background-color 140ms ease;
}

.flows-add-flow-button:hover,
.flows-add-flow-button:focus-visible {
  background: var(--flows-on-wallpaper-button-bg-hover);
  outline: none;
}

.flows-add-flow-button:active {
  background: var(--flows-on-wallpaper-button-bg-active);
}

.flows-add-flow-button:disabled {
  cursor: default;
  opacity: 0.64;
}

.flows-column-state {
  display: flex;
  min-height: 84px;
  align-items: center;
  justify-content: center;
  border: 2px dashed rgba(226, 232, 240, 0.82);
  border-radius: 14px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  padding: 20px;
}

.flows-column--indigo { --flow-accent: #818cf8; }
.flows-column--violet { --flow-accent: #a78bfa; }
.flows-column--fuchsia { --flow-accent: #e879f9; }
.flows-column--rose { --flow-accent: #fb7185; }
.flows-column--orange { --flow-accent: #fb923c; }
.flows-column--amber { --flow-accent: #fbbf24; }
.flows-column--lime { --flow-accent: #a3e635; }
.flows-column--emerald { --flow-accent: #34d399; }
.flows-column--teal { --flow-accent: #2dd4bf; }
.flows-column--cyan { --flow-accent: #22d3ee; }
.flows-column--blue { --flow-accent: #60a5fa; }
.flows-column--slate { --flow-accent: #94a3b8; }

.flows-organize-modal {
  position: fixed;
  inset: 0;
  z-index: 230;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.22);
  backdrop-filter: blur(8px);
  padding: 12px;
}

.flows-organize-dialog {
  display: flex;
  width: min(454px, 100%);
  max-height: min(568px, calc(100vh - 24px));
  overflow: hidden;
  flex-direction: column;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.24);
}

.flows-organize-dialog--multi-column {
  width: min(920px, 100%);
}

.flows-organize-header {
  display: flex;
  min-height: 68px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #f1f5f9;
  padding: 16px 26px;
}

.flows-organize-title-wrap {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
  color: #64748b;
}

.flows-organize-title {
  margin: 0;
  overflow: hidden;
  color: #1e293b;
  font-size: 20px;
  font-weight: 750;
  letter-spacing: 0;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flows-organize-close {
  display: inline-flex;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: background-color 140ms ease, color 140ms ease;
}

.flows-organize-close:hover {
  background: #f1f5f9;
  color: #475569;
}

.flows-organize-close:disabled {
  cursor: default;
  opacity: 0.5;
}

.flows-organize-body {
  display: grid;
  min-height: 0;
  gap: 6px;
  overflow-y: auto;
  padding: 18px 10px 26px;
}

.flows-organize-body--multi-column {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  align-content: start;
  align-items: start;
  column-gap: 8px;
}

.flows-organize-row {
  display: flex;
  min-height: 56px;
  align-items: center;
  gap: 10px;
  justify-content: space-between;
  border: 1px solid transparent;
  border-radius: 12px;
  padding: 0 10px;
  transition: background-color 140ms ease, opacity 140ms ease;
}

.flows-organize-row:hover,
.flows-organize-row:focus-within {
  background: #f8fafc;
}

.flows-organize-row.is-dragging {
  opacity: 0.42;
}

.flows-organize-row.is-pending {
  opacity: 0.68;
}

.flows-organize-row.is-hidden .flows-organize-title-button,
.flows-organize-row.is-hidden .flows-organize-title-text {
  color: #94a3b8;
}

.flows-organize-row.is-hidden .flows-organize-dot {
  opacity: 0.38;
}

.flows-organize-row-main {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  align-items: center;
  gap: 12px;
  color: #334155;
  font: inherit;
  padding: 0 4px;
}

.flows-organize-hide {
  display: inline-flex;
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  opacity: 0;
  padding: 0;
  transition: background-color 140ms ease, color 140ms ease, opacity 140ms ease;
}

.flows-organize-row:hover .flows-organize-hide,
.flows-organize-row:focus-within .flows-organize-hide {
  opacity: 1;
}

.flows-organize-hide:hover,
.flows-organize-hide:focus-visible {
  background: #eef2f7;
  color: #334155;
  outline: none;
}

.flows-organize-hide:disabled {
  cursor: default;
  opacity: 0.34;
}

.flows-organize-hide:disabled:hover {
  background: transparent;
  color: #64748b;
}

.flows-organize-drop-placeholder {
  min-height: 56px;
  border-radius: 12px;
  background: #f1f5f9;
  pointer-events: none;
}

.flows-organize-drag-handle {
  display: inline-flex;
  width: 24px;
  height: 28px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #94a3b8;
  cursor: grab;
  opacity: 0.72;
  padding: 0;
  transition: background-color 140ms ease, color 140ms ease, opacity 140ms ease;
}

.flows-organize-drag-handle:hover,
.flows-organize-drag-handle:focus-visible {
  background: #eef2f7;
  color: #64748b;
  opacity: 1;
}

.flows-organize-drag-handle:active {
  cursor: grabbing;
}

.flows-organize-drag-handle:disabled {
  cursor: default;
  opacity: 0.36;
}

.flows-organize-dot {
  width: 11px;
  height: 11px;
  flex: 0 0 auto;
  border-radius: 999px;
  background: var(--flow-accent, #818cf8);
}

.flows-organize-label {
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
  color: #334155;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flows-organize-title-button {
  display: block;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  padding: 3px 5px;
  text-align: left;
}

.flows-organize-title-button:hover,
.flows-organize-title-button:focus-visible {
  background: rgba(15, 23, 42, 0.06);
  outline: none;
}

.flows-organize-title-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flows-organize-title-input {
  width: 100%;
  min-width: 0;
  height: 30px;
  border: 0;
  border-radius: 7px;
  background: #ffffff;
  box-shadow: inset 0 0 0 2px var(--flow-accent, #818cf8);
  color: #334155;
  font: inherit;
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  padding: 4px 7px;
}

.flows-organize-title-input:focus {
  outline: none;
}

.flows-organize-empty {
  margin: 28px 14px;
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
}

.flows-organize-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  border-top: 1px solid #f1f5f9;
  background: rgba(248, 250, 252, 0.72);
  padding: 18px 26px;
}

.flows-organize-done {
  min-width: 96px !important;
  height: 40px !important;
  border-radius: 14px !important;
  background: #1e293b !important;
  color: #ffffff !important;
  font-size: 14px !important;
  font-weight: 750 !important;
}

.flows-organize-done:hover,
.flows-organize-done:focus-visible {
  background: #0f172a !important;
  color: #ffffff !important;
}

.flows-edit-modal {
  position: fixed;
  inset: 0;
  z-index: 220;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.22);
  backdrop-filter: blur(8px);
  padding: 20px;
}

.flows-edit-dialog {
  width: min(420px, 100%);
  overflow: hidden;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.22);
}

.flows-edit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #f1f5f9;
  background: rgba(248, 250, 252, 0.72);
  padding: 16px 20px;
}

.flows-edit-title {
  margin: 0;
  color: #1e293b;
  font-size: 18px;
  font-weight: 750;
  letter-spacing: 0;
}

.flows-edit-close {
  display: inline-flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
}

.flows-edit-close:hover {
  background: #f1f5f9;
  color: #475569;
}

.flows-edit-body {
  display: grid;
  gap: 18px;
  padding: 22px 20px;
}

.flows-edit-field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.flows-edit-field {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  border: 0;
}

.flows-edit-label {
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.flows-edit-input {
  width: 100%;
  min-height: 42px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  color: #1e293b;
  font-size: 16px;
  line-height: 20px;
  padding: 10px 12px;
  outline: none;
  transition: border-color 140ms ease, box-shadow 140ms ease;
}

.flows-edit-input:focus {
  border-color: #94a3b8;
  box-shadow: 0 0 0 3px rgba(100, 116, 139, 0.12);
}

.flows-edit-dropdown {
  min-width: 0;
}

.flows-edit-dropdown > button {
  width: 100%;
  min-height: 42px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  box-shadow: none;
  color: #1e293b;
  padding: 10px 12px;
  transition: border-color 140ms ease, box-shadow 140ms ease, background-color 140ms ease;
}

.flows-edit-dropdown > button:hover {
  background: #f1f5f9;
}

.flows-edit-dropdown > button:focus-visible,
.flows-edit-dropdown > button[aria-expanded="true"] {
  border-color: #94a3b8;
  box-shadow: 0 0 0 3px rgba(100, 116, 139, 0.12);
}

.flows-edit-dropdown > button:disabled {
  cursor: default;
  opacity: 0.64;
}

.flows-edit-dropdown > button > div {
  color: #1e293b;
  font-size: 14px;
  font-weight: 650;
}

.flows-edit-dropdown-icon,
.flows-edit-dropdown-option-icon {
  flex: 0 0 auto;
}

.flows-edit-dropdown-check {
  color: #64748b;
}

.flows-edit-dropdown-tone--slate { color: #64748b; }
.flows-edit-dropdown-tone--blue { color: #2563eb; }
.flows-edit-dropdown-tone--emerald { color: #059669; }
.flows-edit-dropdown-tone--amber { color: #d97706; }
.flows-edit-dropdown-tone--rose { color: #e11d48; }
.flows-edit-dropdown-tone--violet { color: #7c3aed; }

.flows-edit-color-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.flows-edit-color-field {
  display: block;
}

.flows-edit-color-field .flows-edit-label {
  display: block;
  margin-bottom: 14px;
}

.flows-edit-color {
  position: relative;
  display: inline-flex;
  width: 30px;
  height: 30px;
  cursor: pointer;
}

.flows-edit-color input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.flows-edit-color span {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.08);
  transition: box-shadow 140ms ease, transform 140ms ease;
}

.flows-edit-color:hover span {
  transform: scale(1.06);
}

.flows-edit-color input:checked + span,
.flows-edit-color input:focus-visible + span {
  box-shadow:
    0 0 0 3px #ffffff,
    0 0 0 5px var(--flow-edit-color, #818cf8);
}

.flows-edit-color--indigo { --flow-edit-color: #818cf8; }
.flows-edit-color--violet { --flow-edit-color: #a78bfa; }
.flows-edit-color--fuchsia { --flow-edit-color: #e879f9; }
.flows-edit-color--rose { --flow-edit-color: #fb7185; }
.flows-edit-color--orange { --flow-edit-color: #fb923c; }
.flows-edit-color--amber { --flow-edit-color: #fbbf24; }
.flows-edit-color--lime { --flow-edit-color: #a3e635; }
.flows-edit-color--emerald { --flow-edit-color: #34d399; }
.flows-edit-color--teal { --flow-edit-color: #2dd4bf; }
.flows-edit-color--cyan { --flow-edit-color: #22d3ee; }
.flows-edit-color--blue { --flow-edit-color: #60a5fa; }
.flows-edit-color--slate { --flow-edit-color: #94a3b8; }
.flows-edit-color--indigo span { background: #818cf8; }
.flows-edit-color--violet span { background: #a78bfa; }
.flows-edit-color--fuchsia span { background: #e879f9; }
.flows-edit-color--rose span { background: #fb7185; }
.flows-edit-color--orange span { background: #fb923c; }
.flows-edit-color--amber span { background: #fbbf24; }
.flows-edit-color--lime span { background: #a3e635; }
.flows-edit-color--emerald span { background: #34d399; }
.flows-edit-color--teal span { background: #2dd4bf; }
.flows-edit-color--cyan span { background: #22d3ee; }
.flows-edit-color--blue span { background: #60a5fa; }
.flows-edit-color--slate span { background: #94a3b8; }

.flows-edit-error {
  margin: 0;
  border-radius: 10px;
  background: #fff1f2;
  color: #be123c;
  font-size: 13px;
  font-weight: 650;
  padding: 10px 12px;
}

.flows-edit-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid #f1f5f9;
  background: rgba(248, 250, 252, 0.72);
  padding: 14px 20px;
}

.flows-edit-secondary,
.flows-edit-primary {
  border: 0;
  border-radius: 12px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 750;
  min-height: 38px;
  padding: 0 16px;
}

.flows-edit-secondary {
  background: transparent;
  color: #475569;
}

.flows-edit-secondary:hover {
  background: #f1f5f9;
}

.flows-edit-primary {
  background: #1e293b;
  color: #ffffff;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.14);
}

.flows-edit-primary:hover {
  background: #0f172a;
}

.flows-edit-secondary:disabled,
.flows-edit-primary:disabled {
  cursor: default;
  opacity: 0.64;
}

@media (min-width: 768px) {
  .flows-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .flows-header-title-block {
    flex-direction: row;
    align-items: center;
    gap: 12px;
  }
}

@media (max-width: 640px) {
  #flows-root {
    --flows-column-expanded-width: 272px;
  }

  .flows-body {
    padding: 12px 12px 16px;
  }

  .flows-edit-field-grid {
    grid-template-columns: 1fr;
  }
}
`;function be(){if(document.getElementById(M))return;const l=document.createElement("style");l.id=M,l.textContent=ge,document.head.appendChild(l)}const R="default",j=[f.Draft,f.Described,f.Active,f.Completed,f.Archived,f.Cancelled],xe=8;class ve{constructor(e,t,o){this.parent=e,this.runtime=t,this.handlers=o,this.isOrganizeModalOpen=!1,this.organizeDraggingFlowId=null,this.organizeDragOverFlowId=null,this.organizeDragPlacement=null,this.organizeDropInsertionIndex=null,this.reorderPendingFlowId=null,this.columnMenuPopover=null,this.editingFlowTitleTarget=null,this.flowTitleEditInput=null,this.isCreatingFlow=!1,this.editingFlowId=null,this.editDraft=null,this.editError=null,this.isSubmittingEdit=!1,this.lastState=null,this.dropdownDisposers=[],be(),this.element=document.createElement("div"),this.element.id="flows-root",this.element.dataset.module="flows",this.parent.appendChild(this.element),this.columnDragController=new me({root:this.element,getState:()=>this.lastState,onDrop:(i,n)=>{this.handlers.onReorderFlow(i,n)}}),this.columnDragController.mount()}render(e){this.closeColumnMenu(),this.disposeDropdownControls(),this.lastState=e,this.element.replaceChildren(this.renderPage(e))}destroy(){this.closeColumnMenu(),this.disposeDropdownControls(),this.columnDragController.unmount(),this.element.remove()}renderPage(e){const t=document.createElement("div");t.className="flows-page";const o=document.createElement("main");o.className="flows-body",o.appendChild(this.renderBody(e)),t.append(this.renderHeader(e),o);const i=this.getEditingColumn(e);return i&&t.appendChild(this.renderEditModal(i)),this.isCreatingFlow&&t.appendChild(this.renderEditModal(null)),this.isOrganizeModalOpen&&t.appendChild(this.renderOrganizeModal(e)),t}renderHeader(e){const t=document.createElement("header");t.className="flows-header";const o=document.createElement("div");o.className="flows-header-title-block";const i=document.createElement("div");i.className="flows-header-title-row";const n=document.createElement("h1");return n.className="flows-header-title",n.textContent=this.runtime.i18n.t("flows.title"),i.append(n,this.renderHeaderActionButton({label:this.runtime.i18n.t("flows.actions.organize"),icon:"bars-3",pressed:this.isOrganizeModalOpen,onClick:()=>{this.openOrganizeModal(),this.renderCurrent()}}),this.renderHeaderActionButton({label:this.runtime.i18n.t("flows.actions.create"),icon:"plus",disabled:e.status==="loading",onClick:()=>{this.openCreateModal(),this.renderCurrent()}})),o.appendChild(i),t.appendChild(o),t}renderHeaderActionButton(e){const t=P({text:"",tone:"text",size:"sm",className:"flows-header-action",title:e.label,ariaLabel:e.label,disabled:e.disabled,onClick:e.onClick});e.pressed!==void 0&&t.setAttribute("aria-pressed",e.pressed?"true":"false");const o=w(e.icon,{size:16,strokeWidth:2});o.setAttribute("aria-hidden","true");const i=document.createElement("span");return i.textContent=e.label,t.append(o,i),t}renderBody(e){if(e.status==="loading"||e.status==="idle")return this.renderCenterState(this.runtime.i18n.t("flows.loading"));if(e.status==="error")return this.renderCenterState(this.runtime.i18n.t("flows.errors.load"));if(e.columns.length===0)return this.renderCenterState(this.runtime.i18n.t("flows.empty"));const t=e.columns.filter(i=>b(i.flow).hidden!==!0),o=document.createElement("div");return o.className="flows-board",o.dataset.flowBoard="true",t.forEach(i=>{o.appendChild(this.renderFlowColumn(i,this.getColumnIndex(i.flow.id)))}),o.appendChild(this.renderAddFlowButton(e)),o}renderCenterState(e){const t=document.createElement("div");t.className="flows-center-state";const o=document.createElement("p");return o.className="flows-state-text",o.textContent=e,t.appendChild(o),t}renderFlowColumn(e,t){const i=b(e.flow).collapsed===!0,n=this.getColumnAccentColor(e,t),r=document.createElement("section");return r.className=`flows-column flows-column--${n}${i?" is-collapsed":""}`,r.dataset.flowId=String(e.flow.id),r.dataset.flowColumnDraggable="true",r.appendChild(this.renderCollapsedColumn(e)),r.appendChild(this.renderExpandedColumn(e)),r}renderOrganizeModal(e){const t=e.columns,o=t.length>=xe,i=document.createElement("div");i.className="flows-organize-modal",i.setAttribute("role","presentation"),i.addEventListener("click",()=>this.closeOrganizeModal());const n=document.createElement("section");n.className=`flows-organize-dialog${o?" flows-organize-dialog--multi-column":""}`,n.setAttribute("role","dialog"),n.setAttribute("aria-modal","true"),n.setAttribute("aria-labelledby","flows-organize-title"),n.addEventListener("click",g=>g.stopPropagation());const r=document.createElement("header");r.className="flows-organize-header";const s=document.createElement("div");s.className="flows-organize-title-wrap";const a=w("bars-3",{size:20,strokeWidth:2});a.setAttribute("aria-hidden","true");const d=document.createElement("h2");d.id="flows-organize-title",d.className="flows-organize-title",d.textContent=this.runtime.i18n.t("flows.organize.title"),s.append(a,d);const c=document.createElement("button");c.type="button",c.className="flows-organize-close",c.title=this.runtime.i18n.t("flows.organize.close"),c.setAttribute("aria-label",c.title),c.disabled=this.reorderPendingFlowId!==null,c.appendChild(w("x-mark",{size:19,strokeWidth:2})),c.addEventListener("click",()=>this.closeOrganizeModal()),r.append(s,c);const p=document.createElement("div");if(p.className=`flows-organize-body${o?" flows-organize-body--multi-column":""}`,p.setAttribute("role","list"),p.addEventListener("dragover",g=>{this.handleOrganizeBodyDragOver(g)}),p.addEventListener("drop",g=>{this.handleOrganizeBodyDrop(g,t)}),t.length===0){const g=document.createElement("p");g.className="flows-organize-empty",g.textContent=this.runtime.i18n.t("flows.organize.empty"),p.appendChild(g)}else t.forEach((g,V)=>{p.appendChild(this.renderOrganizeRow(g,V,t))});const h=document.createElement("footer");h.className="flows-organize-footer";const m=P({text:this.runtime.i18n.t("flows.organize.done"),tone:"primary",size:"sm",className:"flows-organize-done",disabled:this.reorderPendingFlowId!==null,onClick:()=>this.closeOrganizeModal()});return h.appendChild(m),n.append(r,p,h),i.appendChild(n),i}renderOrganizeRow(e,t,o){const i=this.getColumnAccentColor(e,t),n=b(e.flow),r=this.reorderPendingFlowId===e.flow.id,s=document.createElement("div");s.className=`flows-organize-row flows-column--${i}${r?" is-pending":""}${n.hidden===!0?" is-hidden":""}`,s.setAttribute("role","listitem"),s.dataset.flowId=String(e.flow.id),s.addEventListener("dragover",h=>{this.handleOrganizeDragOver(h,s,e,t,o)}),s.addEventListener("drop",h=>{this.handleOrganizeDrop(h,s,e,t,o)});const a=document.createElement("button");a.type="button",a.className="flows-organize-drag-handle",a.draggable=this.reorderPendingFlowId===null,a.title=this.runtime.i18n.t("flows.organize.drag",{title:e.flow.title}),a.setAttribute("aria-label",a.title),a.disabled=this.reorderPendingFlowId!==null,a.appendChild(w("drag-handle",{size:16})),a.addEventListener("dragstart",h=>{this.startOrganizeDrag(h,s,e)}),a.addEventListener("dragend",()=>{this.resetOrganizeDragState()});const d=document.createElement("div");d.className="flows-organize-row-main";const c=document.createElement("span");c.className="flows-organize-dot",c.setAttribute("aria-hidden","true");const p=document.createElement("span");return p.className="flows-organize-label",p.appendChild(this.renderFlowTitleInline(e,"organize")),d.append(a,c,p),s.append(d,this.renderOrganizeHideButton(e,n)),s}renderOrganizeHideButton(e,t){const o=t.hidden===!0,i=this.runtime.i18n.t(o?"flows.organize.show":"flows.organize.hide"),n=document.createElement("button");return n.type="button",n.className=`flows-organize-hide${o?" is-hidden":""}`,n.dataset.flowDragIgnore="true",n.disabled=this.reorderPendingFlowId!==null,n.title=i,n.setAttribute("aria-label",i),n.appendChild(w(o?"eye":"eye-slash",{size:16,strokeWidth:2})),n.addEventListener("click",()=>{this.patchFlowHidden(e,!o)}),n}renderFlowTitleInline(e,t){var r;if(((r=this.editingFlowTitleTarget)==null?void 0:r.flowId)===e.flow.id&&this.editingFlowTitleTarget.surface===t){const s=document.createElement("input");return s.type="text",s.className=t==="column"?"flows-column-title-input":"flows-organize-title-input",s.value=e.flow.title,s.maxLength=512,s.autocomplete="off",s.dataset.flowDragIgnore="true",s.setAttribute("aria-label",this.runtime.i18n.t("flows.titlePlaceholder")),s.addEventListener("keydown",a=>{if(a.key==="Enter"){a.preventDefault(),this.finishFlowTitleEdit(e.flow,!0);return}a.key==="Escape"&&(a.preventDefault(),this.finishFlowTitleEdit(e.flow,!1))}),s.addEventListener("blur",()=>{this.finishFlowTitleEdit(e.flow,!0)}),this.flowTitleEditInput=s,requestAnimationFrame(()=>{this.flowTitleEditInput===s&&(s.focus(),s.select())}),s}const i=document.createElement("button");i.type="button",i.className=t==="column"?"flows-column-title-button":"flows-organize-title-button",i.dataset.flowDragIgnore="true",i.title=this.runtime.i18n.t("flows.actions.renameFlow"),i.setAttribute("aria-label",i.title),i.addEventListener("click",()=>{this.startFlowTitleEdit(e.flow.id,t)});const n=document.createElement("span");return n.className=t==="column"?"flows-column-title-text":"flows-organize-title-text",n.textContent=e.flow.title,i.appendChild(n),i}startOrganizeDrag(e,t,o){var i;if(this.reorderPendingFlowId!==null){e.preventDefault();return}this.organizeDraggingFlowId=o.flow.id,(i=e.dataTransfer)==null||i.setData("text/plain",String(o.flow.id)),e.dataTransfer&&(e.dataTransfer.effectAllowed="move"),t.classList.add("is-dragging")}handleOrganizeDragOver(e,t,o,i,n){const r=this.organizeDraggingFlowId;if(this.reorderPendingFlowId!==null||r===null||r===o.flow.id)return;e.preventDefault(),e.dataTransfer&&(e.dataTransfer.dropEffect="move");const s=this.resolveOrganizeDropPlacement(e,t),a=this.resolveOrganizeInsertionIndex(n,r,i,s);this.organizeDragOverFlowId=o.flow.id,this.organizeDragPlacement=s,this.organizeDropInsertionIndex=a,this.placeOrganizeDropPlaceholder({row:t,placement:s,show:C(n,r,a)})}async handleOrganizeDrop(e,t,o,i,n){const r=this.readOrganizeDraggedFlowId(e);if(this.reorderPendingFlowId!==null||r===null||r===o.flow.id){this.resetOrganizeDragState();return}e.preventDefault();const s=this.organizeDragOverFlowId===o.flow.id&&this.organizeDragPlacement?this.organizeDragPlacement:this.resolveOrganizeDropPlacement(e,t),a=this.organizeDragOverFlowId===o.flow.id&&this.organizeDragPlacement&&this.organizeDropInsertionIndex!==null?this.organizeDropInsertionIndex:this.resolveOrganizeInsertionIndex(n,r,i,s);e.stopPropagation(),this.resetOrganizeDragState(),await this.moveOrganizeColumn(r,a)}async handleOrganizeBodyDrop(e,t){const o=this.readOrganizeDraggedFlowId(e),i=this.organizeDropInsertionIndex;if(this.reorderPendingFlowId!==null||o===null||i===null){this.resetOrganizeDragState();return}e.preventDefault(),this.resetOrganizeDragState(),C(t,o,i)&&await this.moveOrganizeColumn(o,i)}handleOrganizeBodyDragOver(e){this.reorderPendingFlowId!==null||this.organizeDraggingFlowId===null||this.organizeDropInsertionIndex===null||(e.preventDefault(),e.dataTransfer&&(e.dataTransfer.dropEffect="move"))}resolveOrganizeDropPlacement(e,t){const o=t.getBoundingClientRect(),i=o.top+o.height/2;return e.clientY>i?"after":"before"}resolveOrganizeInsertionIndex(e,t,o,i){const n=e.findIndex(s=>s.flow.id===t),r=n>=0&&n<o?o-1:o;return i==="after"?r+1:r}placeOrganizeDropPlaceholder(e){if(this.element.querySelectorAll(".flows-organize-drop-placeholder").forEach(n=>n.remove()),!e.show)return;const t=e.row.parentElement;if(!t)return;const o=document.createElement("div");o.className="flows-organize-drop-placeholder";const i=Array.from(e.row.classList).find(n=>n.startsWith("flows-column--"));i&&o.classList.add(i),o.setAttribute("aria-hidden","true"),t.insertBefore(o,e.placement==="before"?e.row:e.row.nextElementSibling)}readOrganizeDraggedFlowId(e){var i;const t=((i=e.dataTransfer)==null?void 0:i.getData("text/plain"))??"";if(!t.trim())return this.organizeDraggingFlowId;const o=Number(t);return Number.isFinite(o)?o:this.organizeDraggingFlowId}resetOrganizeDragState(){this.organizeDraggingFlowId=null,this.organizeDragOverFlowId=null,this.organizeDragPlacement=null,this.organizeDropInsertionIndex=null,this.clearOrganizeDropIndicators()}clearOrganizeDropIndicators(){this.element.querySelectorAll(".flows-organize-row.is-dragging").forEach(e=>{e.classList.remove("is-dragging")}),this.element.querySelectorAll(".flows-organize-drop-placeholder").forEach(e=>e.remove())}async moveOrganizeColumn(e,t){if(this.lastState&&!(t<0||t>=this.lastState.columns.length)&&this.lastState.columns.some(o=>o.flow.id===e)&&C(this.lastState.columns,e,t)){this.reorderPendingFlowId=e,this.renderCurrent();try{await this.handlers.onReorderFlow(e,t)}finally{this.reorderPendingFlowId=null,this.renderCurrent()}}}openOrganizeModal(){this.closeColumnMenu(),this.isOrganizeModalOpen=!0}closeOrganizeModal(){this.reorderPendingFlowId===null&&(this.isOrganizeModalOpen=!1,this.resetOrganizeDragState(),this.renderCurrent())}getColumnAccentColor(e,t){return b(e.flow).color??v(t)}renderCollapsedColumn(e){const t=document.createElement("button");t.type="button",t.className="flows-column-collapsed",t.title=e.flow.title,t.setAttribute("aria-label",this.runtime.i18n.t("flows.expand")),t.addEventListener("click",()=>{this.patchColumnCollapsed(e,!1)});const o=document.createElement("span");o.className="flows-column-collapsed-indicator";const i=document.createElement("span");return i.className="flows-column-collapsed-title",i.textContent=e.flow.title,t.append(o,i),t}renderExpandedColumn(e){const t=document.createElement("div");t.className="flows-column-expanded";const o=document.createElement("header");o.className="flows-column-header";const i=document.createElement("div");i.className="color-line-bar flows-column-color-line-bar",i.setAttribute("aria-hidden","true");const n=document.createElement("div");n.className="flows-column-title-row";const r=document.createElement("div");r.className="flows-column-title-wrap";const s=document.createElement("button");s.type="button",s.className="flows-column-icon-button",s.dataset.flowDragIgnore="true",s.title=this.runtime.i18n.t("flows.collapse"),s.setAttribute("aria-label",s.title),s.appendChild(w("shrink",{size:16,strokeWidth:2})),s.addEventListener("click",()=>{this.patchColumnCollapsed(e,!0)});const a=document.createElement("h2");a.className="flows-column-title",a.appendChild(this.renderFlowTitleInline(e,"column")),r.appendChild(a);const d=document.createElement("div");d.className="flows-column-title-actions",d.append(s,this.renderColumnMenu(e)),n.append(r,d),o.append(i,n);const c=document.createElement("div");return c.className="flows-column-task-list",this.appendTaskContent(c,e),t.append(o,c),t}renderColumnMenu(e){const t=document.createElement("div");t.className="flows-column-menu-container";const o=document.createElement("button");return o.type="button",o.className="flows-column-icon-button flows-column-menu-trigger",o.dataset.flowDragIgnore="true",o.title=this.runtime.i18n.t("flows.actions.menu"),o.setAttribute("aria-label",o.title),o.setAttribute("aria-haspopup","menu"),o.setAttribute("aria-expanded","false"),o.appendChild(w("ellipsis-horizontal",{size:18,strokeWidth:2})),o.addEventListener("click",i=>{var n;if(i.stopPropagation(),((n=this.columnMenuPopover)==null?void 0:n.trigger)===o){this.closeColumnMenu();return}this.openColumnMenu(o,e)}),t.appendChild(o),t}openColumnMenu(e,t){this.closeColumnMenu();const o=Y({elevated:!0,className:"flows-column-menu hidden"});o.setAttribute("role","menu"),o.addEventListener("mousedown",n=>n.stopPropagation()),o.append(this.renderColumnMenuItem({label:this.runtime.i18n.t("flows.actions.edit"),icon:"pencil",onClick:()=>this.openEditModal(t)}),this.renderColumnMenuItem({label:this.runtime.i18n.t("flows.actions.delete"),icon:"trash",tone:"danger",onClick:()=>void this.deleteFlow(t)}));let i;i=new q({container:e,panel:o,positioning:"viewport",panelZIndex:290,onOpenChange:n=>{var r;e.setAttribute("aria-expanded",n?"true":"false"),!n&&((r=this.columnMenuPopover)==null?void 0:r.menu)===i&&this.closeColumnMenu()}}),i.mount(),this.columnMenuPopover={menu:i,panel:o,trigger:e},i.openAt({anchor:e,placement:"bottom-end",fallbackPlacements:["bottom-start","top-end","top-start"],gap:6,margin:12,lockPlacementAfterOpen:!0})}renderColumnMenuItem(e){const t=document.createElement("span");t.className="flows-column-menu-item-icon",t.appendChild(w(e.icon,{size:15,strokeWidth:2}));const o=G({label:e.label,tone:e.tone==="danger"?"danger":"default",leading:t,className:`flows-column-menu-item${e.tone==="danger"?" flows-column-menu-item--danger":""}`,onClick:i=>{i.stopPropagation(),e.onClick()}});return o.dataset.flowDragIgnore="true",o.setAttribute("role","menuitem"),o}openEditModal(e){const t=b(e.flow);this.closeColumnMenu(),this.editingFlowTitleTarget=null,this.flowTitleEditInput=null,this.isCreatingFlow=!1,this.editingFlowId=e.flow.id,this.editDraft={title:e.flow.title,status:e.flow.status,color:t.color??v(this.getColumnIndex(e.flow.id)),timeProfile:t.timeProfile??"",riskLevel:t.riskLevel??"stable",priority:t.priority},this.editError=null,this.renderCurrent()}openCreateModal(){this.closeColumnMenu(),this.isOrganizeModalOpen=!1,this.editingFlowTitleTarget=null,this.flowTitleEditInput=null,this.isCreatingFlow=!0,this.editingFlowId=null,this.editDraft=this.createNewFlowDraft(),this.editError=null}async deleteFlow(e){this.closeColumnMenu(),window.confirm(this.runtime.i18n.t("flows.delete.confirm",{title:e.flow.title}))&&await this.handlers.onDeleteFlow(e.flow.id)}async patchColumnCollapsed(e,t){const o=b(e.flow);await this.handlers.onPatchFlow(e.flow.id,{meta:F(e.flow.meta,{...o,collapsed:t})})}async patchFlowHidden(e,t){const o=b(e.flow);await this.handlers.onPatchFlow(e.flow.id,{meta:F(e.flow.meta,{...o,hidden:t})})}appendTaskContent(e,t){if(t.taskStatus==="loading"){e.appendChild(this.renderColumnState(this.runtime.i18n.t("flows.tasks.loading")));return}if(t.taskStatus==="error"){e.appendChild(this.renderColumnState(this.runtime.i18n.t("flows.tasks.errors.load")));return}t.tasks.forEach(o=>{const i=document.createElement("article");i.className="flows-task-card";const n=document.createElement("p");n.className="flows-task-title",n.textContent=o.title;const r=document.createElement("div");r.className="flows-task-meta",r.append(this.renderTaskMetaItem(o.status),this.renderTaskMetaItem(o.priority)),i.append(n,r),e.appendChild(i)}),e.appendChild(this.renderAddTaskButton())}renderColumnState(e){const t=document.createElement("div");return t.className="flows-column-state",t.textContent=e,t}renderTaskMetaItem(e){const t=document.createElement("span");return t.className="flows-task-meta-item",t.textContent=e,t}renderAddTaskButton(){const e=document.createElement("button");return e.type="button",e.className="flows-add-task-button",e.dataset.flowDragIgnore="true",e.append(w("plus",{size:15,strokeWidth:2}),document.createTextNode(this.runtime.i18n.t("flows.tasks.add"))),e}renderAddFlowButton(e){const t=document.createElement("aside");t.className="flows-add-flow-panel",t.dataset.flowDragIgnore="true";const o=document.createElement("button");return o.type="button",o.className="flows-add-flow-button",o.disabled=e.status==="loading",o.append(w("plus",{size:16,strokeWidth:2}),document.createTextNode(this.runtime.i18n.t("flows.actions.addFlow"))),o.addEventListener("click",()=>{this.openCreateModal(),this.renderCurrent()}),t.appendChild(o),t}renderEditModal(e){const t=e===null,o=this.editDraft??(t?this.createNewFlowDraft():this.createEditDraft(e)),i=document.createElement("div");i.className="flows-edit-modal",i.setAttribute("role","presentation"),i.addEventListener("click",()=>this.closeEditModal());const n=document.createElement("form");n.className="flows-edit-dialog",n.setAttribute("role","dialog"),n.setAttribute("aria-modal","true"),n.setAttribute("aria-labelledby","flows-edit-title"),n.addEventListener("click",m=>m.stopPropagation()),n.addEventListener("submit",m=>{m.preventDefault(),this.submitEditModal(e,n)});const r=document.createElement("header");r.className="flows-edit-header";const s=document.createElement("h2");s.id="flows-edit-title",s.className="flows-edit-title",s.textContent=this.runtime.i18n.t(t?"flows.create.title":"flows.edit.title");const a=document.createElement("button");a.type="button",a.className="flows-edit-close",a.title=this.runtime.i18n.t(t?"flows.create.close":"flows.edit.close"),a.setAttribute("aria-label",a.title),a.appendChild(w("x-mark",{size:18,strokeWidth:2})),a.addEventListener("click",()=>this.closeEditModal()),r.append(s,a);const d=document.createElement("div");if(d.className="flows-edit-body",d.append(this.renderTextField({name:"title",label:this.runtime.i18n.t("flows.edit.name"),value:o.title,placeholder:this.runtime.i18n.t("flows.edit.namePlaceholder")})),t||d.appendChild(this.renderEditFieldGrid([this.renderStatusField(o.status),this.renderPriorityField(o.priority)])),d.append(this.renderColorField(o.color),this.renderTextField({name:"timeProfile",label:this.runtime.i18n.t("flows.edit.timeProfile"),value:o.timeProfile,placeholder:this.runtime.i18n.t("flows.edit.timeProfilePlaceholder")}),this.renderRiskField(o.riskLevel)),this.editError){const m=document.createElement("p");m.className="flows-edit-error",m.textContent=this.editError,d.appendChild(m)}const c=document.createElement("footer");c.className="flows-edit-footer";const p=document.createElement("button");p.type="button",p.className="flows-edit-secondary",p.textContent=this.runtime.i18n.t("flows.edit.cancel"),p.disabled=this.isSubmittingEdit,p.addEventListener("click",()=>this.closeEditModal());const h=document.createElement("button");return h.type="submit",h.className="flows-edit-primary",h.textContent=this.runtime.i18n.t(this.isSubmittingEdit?t?"flows.create.saving":"flows.edit.saving":t?"flows.create.save":"flows.edit.save"),h.disabled=this.isSubmittingEdit,c.append(p,h),n.append(r,d,c),i.appendChild(n),requestAnimationFrame(()=>{var m;(m=n.querySelector('input[name="title"]'))==null||m.focus()}),i}renderTextField(e){const t=document.createElement("label");t.className="flows-edit-field";const o=document.createElement("span");o.className="flows-edit-label",o.textContent=e.label;const i=document.createElement("input");return i.className="flows-edit-input",i.dataset.flowDragIgnore="true",i.name=e.name,i.type="text",i.value=e.value,i.placeholder=e.placeholder,i.disabled=this.isSubmittingEdit,t.append(o,i),t}renderColorField(e){const t=document.createElement("fieldset");t.className="flows-edit-field flows-edit-color-field";const o=document.createElement("legend");o.className="flows-edit-label",o.textContent=this.runtime.i18n.t("flows.edit.color");const i=document.createElement("div");return i.className="flows-edit-color-row",k.forEach(n=>{const r=document.createElement("label");r.className=`flows-edit-color flows-edit-color--${n}`,r.title=this.runtime.i18n.t(`flows.colors.${n}`);const s=document.createElement("input");s.type="radio",s.dataset.flowDragIgnore="true",s.name="color",s.value=n,s.checked=n===e,s.disabled=this.isSubmittingEdit;const a=document.createElement("span");a.setAttribute("aria-hidden","true"),r.append(s,a),i.appendChild(r)}),t.append(o,i),t}renderEditFieldGrid(e){const t=document.createElement("div");return t.className="flows-edit-field-grid",t.append(...e),t}renderStatusField(e){return this.renderEditDropdownField({label:this.runtime.i18n.t("flows.fields.status"),value:e,items:j.map(t=>({value:t,label:this.getStatusLabel(t),icon:this.getStatusIcon(t),tone:this.getStatusTone(t)})),onSelect:t=>{ye(t)&&this.updateEditDraft({status:t})}})}renderPriorityField(e){return this.renderEditDropdownField({label:this.runtime.i18n.t("flows.fields.priority"),value:e??R,items:[{value:R,label:this.runtime.i18n.t("flows.edit.priorityDefault"),icon:"bars-2",tone:"slate"},...S.map(t=>({value:t,label:this.getPriorityLabel(t),icon:this.getPriorityIcon(t),tone:this.getPriorityTone(t)}))],onSelect:t=>{this.updateEditDraft({priority:ke(t)?t:null})}})}renderRiskField(e){return this.renderEditDropdownField({label:this.runtime.i18n.t("flows.edit.risk"),value:e,items:D.map(t=>({value:t,label:this.getRiskLabel(t),icon:this.getRiskIcon(t),tone:this.getRiskTone(t)})),onSelect:t=>{Ce(t)&&this.updateEditDraft({riskLevel:t})}})}renderEditDropdownField(e){const t=e.items.find(r=>r.value===e.value)??null,o=document.createElement("div");o.className="flows-edit-field";const i=document.createElement("span");i.className="flows-edit-label",i.textContent=e.label;const n=new K({size:"md",value:t,placeholder:e.label,items:e.items,getKey:r=>r.value,getLabel:r=>r.label,ariaLabel:e.label,className:"flows-edit-dropdown",disabled:this.isSubmittingEdit,portalTarget:document.body,renderTriggerLeading:r=>this.renderDropdownIcon(r,!1),renderOptionLeading:r=>this.renderDropdownIcon(r,!0),renderOptionTrailing:(r,s)=>{if(!s)return null;const a=w("check",{size:14,strokeWidth:2.3});return a.classList.add("flows-edit-dropdown-check"),a.setAttribute("aria-hidden","true"),a},onSelect:r=>e.onSelect(r.value)});return n.element.dataset.flowDragIgnore="true",this.dropdownDisposers.push(()=>n.destroy()),o.append(i,n.element),o}renderDropdownIcon(e,t){if(!e)return null;const o=w(e.icon,{size:t?14:15,strokeWidth:2});return o.classList.add(t?"flows-edit-dropdown-option-icon":"flows-edit-dropdown-icon",`flows-edit-dropdown-tone--${e.tone}`),o.setAttribute("aria-hidden","true"),o}updateEditDraft(e){this.editDraft&&(this.editDraft={...this.editDraft,...e})}async submitEditModal(e,t){const o=new FormData(t),i=e===null?this.readCreateDraft(o):this.readEditDraft(o,e);this.editDraft=i,this.editError=null,this.isSubmittingEdit=!0,this.renderCurrent();try{if(e===null)await this.handlers.onCreateFlow({title:i.title,meta:this.writeDraftPresentation(null,i,null,null)});else{const n=b(e.flow),r={title:i.title,meta:this.writeDraftPresentation(e.flow.meta,i,n.collapsed,n.hidden)};i.status!==e.flow.status&&(r.status=i.status),await this.handlers.onPatchFlow(e.flow.id,r)}this.isSubmittingEdit=!1,this.closeEditModal()}catch{this.isSubmittingEdit=!1,this.editError=this.runtime.i18n.t(e===null?"flows.create.error":"flows.edit.error"),this.renderCurrent()}}writeDraftPresentation(e,t,o,i){return F(e,{color:t.color,timeProfile:t.timeProfile||null,riskLevel:t.riskLevel,priority:t.priority,collapsed:o,hidden:i})}readCreateDraft(e){var o;const t=this.editDraft??this.createNewFlowDraft();return this.readDraftFromForm(e,this.runtime.i18n.t("flows.defaultFlowTitle"),v(((o=this.lastState)==null?void 0:o.columns.length)??0),t.status,t.riskLevel,t.priority)}readEditDraft(e,t){const o=this.editDraft??this.createEditDraft(t);return this.readDraftFromForm(e,t.flow.title,v(this.getColumnIndex(t.flow.id)),o.status,o.riskLevel,o.priority)}readDraftFromForm(e,t,o,i,n,r){const s=String(e.get("title")??"").trim(),a=String(e.get("color")??"");return{title:s||t,status:i,color:k.includes(a)?a:o,timeProfile:String(e.get("timeProfile")??"").trim(),riskLevel:n,priority:r}}createEditDraft(e){const t=b(e.flow);return{title:e.flow.title,status:e.flow.status,color:t.color??v(this.getColumnIndex(e.flow.id)),timeProfile:t.timeProfile??"",riskLevel:t.riskLevel??"stable",priority:t.priority}}createNewFlowDraft(){var e;return{title:"",status:f.Draft,color:v(((e=this.lastState)==null?void 0:e.columns.length)??0),timeProfile:"",riskLevel:"stable",priority:null}}getStatusLabel(e){return this.runtime.i18n.t(`flows.status.${e}`)}getStatusIcon(e){switch(e){case f.Active:return"arrow-path";case f.Completed:return"check-circle";case f.Archived:return"archive-box";case f.Cancelled:return"x-mark";case f.Described:return"map-pin";case f.Draft:default:return"status-pending"}}getStatusTone(e){switch(e){case f.Active:return"blue";case f.Completed:return"emerald";case f.Cancelled:return"rose";case f.Described:return"violet";case f.Draft:return"amber";case f.Archived:default:return"slate"}}getPriorityLabel(e){switch(e){case u.Highest:return this.runtime.i18n.t("priority.highest");case u.High:return this.runtime.i18n.t("priority.high");case u.Low:return this.runtime.i18n.t("priority.low");case u.Lowest:return this.runtime.i18n.t("priority.lowest");case u.Medium:default:return this.runtime.i18n.t("priority.medium")}}getPriorityIcon(e){switch(e){case u.Highest:return"chevron-double-up";case u.High:return"chevron-up";case u.Low:return"chevron-down";case u.Lowest:return"chevron-double-down";case u.Medium:default:return"bars-2"}}getPriorityTone(e){switch(e){case u.Highest:case u.High:return"rose";case u.Low:case u.Lowest:return"blue";case u.Medium:default:return"amber"}}getRiskLabel(e){return e==="high"?this.runtime.i18n.t("flows.risk.high"):e==="medium"?this.runtime.i18n.t("flows.risk.medium"):this.runtime.i18n.t("flows.risk.stable")}getRiskIcon(e){return e==="high"?"shield-exclamation":e==="medium"?"exclamation-circle":"check-circle"}getRiskTone(e){return e==="high"?"rose":e==="medium"?"amber":"emerald"}getEditingColumn(e){return this.editingFlowId===null?null:e.columns.find(t=>t.flow.id===this.editingFlowId)??null}getColumnIndex(e){var t;return Math.max(0,((t=this.lastState)==null?void 0:t.columns.findIndex(o=>o.flow.id===e))??0)}closeEditModal(){this.isSubmittingEdit||(this.isCreatingFlow=!1,this.editingFlowId=null,this.editDraft=null,this.editError=null,this.renderCurrent())}startFlowTitleEdit(e,t){this.editingFlowTitleTarget={flowId:e,surface:t},this.flowTitleEditInput=null,this.renderCurrent()}finishFlowTitleEdit(e,t){var i,n;if(((i=this.editingFlowTitleTarget)==null?void 0:i.flowId)!==e.id)return;const o=((n=this.flowTitleEditInput)==null?void 0:n.value.trim())??"";if(this.editingFlowTitleTarget=null,this.flowTitleEditInput=null,t&&o.length>0&&o!==e.title){this.handlers.onPatchFlow(e.id,{title:o});return}this.renderCurrent()}renderCurrent(){this.lastState&&this.render(this.lastState)}closeColumnMenu(){const e=this.columnMenuPopover;e&&(this.columnMenuPopover=null,e.trigger.setAttribute("aria-expanded","false"),e.menu.close(),e.menu.unmount(),e.panel.remove())}disposeDropdownControls(){var e;for(;this.dropdownDisposers.length>0;)(e=this.dropdownDisposers.pop())==null||e()}}function ye(l){return j.includes(l)}function ke(l){return S.includes(l)}function Ce(l){return D.includes(l)}class Ee{constructor(e={}){this.root=null,this.store=null,this.view=null,this.subscriptions=new L,this.runtime=e.runtime??B(),this.flowsApi=e.flowsApi??new te(new Z(Q.apiUrl))}mount(e){if(this.root)return;const t=document.createElement("div");t.dataset.module="flows",t.className="h-full w-full",e.appendChild(t),this.root=t;const o=new se(this.flowsApi),i=new ve(t,this.runtime,{onCreateFlow:n=>o.createFlow(n),onPatchFlow:(n,r)=>o.patchFlow(n,r),onReorderFlow:(n,r)=>o.reorderFlowColumns(n,r),onDeleteFlow:n=>o.deleteFlow(n)});this.store=o,this.view=i,this.subscriptions.add(o.state$.subscribe(n=>i.render(n))),this.subscriptions.add(this.runtime.subscribe(()=>{i.render(o.snapshot)})),o.load()}unmount(){var e,t,o;this.subscriptions.unsubscribe(),this.subscriptions=new L,(e=this.store)==null||e.destroy(),this.store=null,(t=this.view)==null||t.destroy(),this.view=null,(o=this.root)==null||o.remove(),this.root=null}}class Fe{constructor(e={}){this.id="flows",this.app=null,this.runtime=e.runtime??B()}mount(e){if(this.app)return;const t=new Ee({runtime:this.runtime});t.mount(e),this.app=t}unmount(){var e;(e=this.app)==null||e.unmount(),this.app=null}getAiAssistantSnapshot(){return null}}export{Fe as FlowsModule};
