import{m as V,B as X,g as x,P as u,z as P,q as w,u as q,v as Y,w as U,S as h,X as G,d as L,k as R,H as K,e as Z}from"./index-D-OMYOoW.js";function Q(s){return Array.isArray(s)?s:s.results}function y(s){return encodeURIComponent(String(s))}function J(s={}){const e=[];return s.isCompleted!==void 0&&e.push(`is_completed=${s.isCompleted?"true":"false"}`),s.page!==void 0&&e.push(`page=${encodeURIComponent(s.page.toString())}`),s.pageSize!==void 0&&e.push(`page_size=${encodeURIComponent(s.pageSize.toString())}`),e.length?`?${e.join("&")}`:""}class ee{constructor(e){this.http=e}getFlows(){return this.http.get("/flows/").pipe(V(Q))}getFlow(e){return this.http.get(`/flows/${y(e)}/`)}getFlowTasks(e,t={}){return this.http.get(`/flows/${y(e)}/tasks/${J(t)}`)}createFlow(e){return this.http.post("/flows/",e)}updateFlow(e,t){return this.http.put(`/flows/${y(e)}/`,t)}patchFlow(e,t){return this.http.patch(`/flows/${y(e)}/`,t)}deleteFlow(e){return this.http.delete(`/flows/${y(e)}/`)}}const B=1024;function W(s,e){const t=I(s),o=I(e);return t!==null||o!==null?(t??N(s))-(o??N(e))||s.title.localeCompare(e.title)||s.id-e.id:s.title.localeCompare(e.title)||s.id-e.id}function te(s,e,t){const o=s.find(l=>l.flow.id===e);if(!o)return[];const n=s.filter(l=>l.flow.id!==e),i=Math.max(0,Math.min(t,n.length)),r=[...n];return r.splice(i,0,o),r.map((l,a)=>({column:l,pos:(a+1)*B})).filter(({column:l,pos:a})=>I(l.flow)!==a)}function E(s,e,t){var l,a;const o=oe(s,e,t),n=s.findIndex(d=>d.flow.id===e);if(n<0)return!0;const i=n>0?s[n-1]:null,r=n<s.length-1?s[n+1]:null;return((i==null?void 0:i.flow.id)??null)!==(((l=o.previous)==null?void 0:l.flow.id)??null)||((r==null?void 0:r.flow.id)??null)!==(((a=o.next)==null?void 0:a.flow.id)??null)}function oe(s,e,t){const o=s.filter(i=>i.flow.id!==e),n=Math.max(0,Math.min(t,o.length));return{previous:n>0?o[n-1]:null,next:n<o.length?o[n]:null}}function I(s){const e=_(s.meta),t=e==null?void 0:e.pos;if(typeof t=="number"&&Number.isFinite(t))return t;if(typeof t=="string"&&t.trim()){const o=Number(t);return Number.isFinite(o)?o:null}return null}function $(s,e){return{..._(s)??{},pos:e}}function N(s){return s.id*B}function _(s){return s&&typeof s=="object"&&!Array.isArray(s)?s:null}const ne=50,ie={columns:[],status:"idle",error:null};function re(s){return[...s].sort(W)}class le{constructor(e){this.api=e,this.stateSubject=new X(ie),this.state$=this.stateSubject.asObservable(),this.loadVersion=0,this.reorderVersion=0,this.flowPatchVersions=new Map}get snapshot(){return this.stateSubject.value}destroy(){this.loadVersion+=1,this.stateSubject.complete()}async load(){const e=++this.loadVersion;this.patchState({status:"loading",error:null});try{const t=re(await x(this.api.getFlows()));if(e!==this.loadVersion)return;this.patchState({columns:t.map(T),status:"ready",error:null}),await Promise.all(t.map(o=>this.loadColumnTasks(o,e)))}catch{if(e!==this.loadVersion)return;this.patchState({status:"error",error:"flows.errors.load"})}}async patchFlow(e,t){const o=this.snapshot.columns.find(i=>i.flow.id===e)??null,n=(this.flowPatchVersions.get(e)??0)+1;this.flowPatchVersions.set(e,n),o&&this.replaceFlow(se(o.flow,t));try{const i=await x(this.api.patchFlow(e,t));this.flowPatchVersions.get(e)===n&&this.replaceFlow(i)}catch(i){throw o&&this.flowPatchVersions.get(e)===n&&this.replaceFlow(o.flow),i}}async createFlow(e){const t=await x(this.api.createFlow(e)),o=this.loadVersion;this.patchState({columns:z([...this.snapshot.columns,T(t)])}),await this.loadColumnTasks(t,o)}async reorderFlowColumns(e,t){const o=te(this.snapshot.columns,e,t);if(o.length===0)return;const n=++this.reorderVersion,i=this.snapshot.columns;this.patchState({columns:ae(this.snapshot.columns,o)});try{const r=await Promise.all(o.map(({column:a,pos:d})=>x(this.api.patchFlow(a.flow.id,{meta:$(a.flow.meta,d)}))));if(n!==this.reorderVersion)return;const l=new Map(r.map(a=>[a.id,a]));this.patchState({columns:z(this.snapshot.columns.map(a=>{const d=l.get(a.flow.id);return d?{...a,flow:d}:a}))})}catch(r){throw n===this.reorderVersion&&this.patchState({columns:i}),r}}async deleteFlow(e){await x(this.api.deleteFlow(e)),this.patchState({columns:this.snapshot.columns.filter(t=>t.flow.id!==e)})}async loadColumnTasks(e,t){try{const o=await x(this.api.getFlowTasks(e.id,{isCompleted:!1,page:1,pageSize:ne}));if(t!==this.loadVersion)return;this.patchColumn(e.id,{tasks:o.results,taskStatus:"ready",taskError:null,openTaskCount:o.count})}catch{if(t!==this.loadVersion)return;this.patchColumn(e.id,{taskStatus:"error",taskError:"flows.tasks.errors.load"})}}patchColumn(e,t){this.patchState({columns:this.snapshot.columns.map(o=>o.flow.id===e?{...o,...t}:o)})}replaceFlow(e){this.patchState({columns:z(this.snapshot.columns.map(t=>t.flow.id===e.id?{...t,flow:e}:t))})}patchState(e){this.stateSubject.next({...this.snapshot,...e})}}function z(s){return[...s].sort((e,t)=>W(e.flow,t.flow))}function se(s,e){return{...s,...e}}function ae(s,e){const t=new Map(e.map(({column:o,pos:n})=>[o.flow.id,n]));return z(s.map(o=>{const n=t.get(o.flow.id);return n===void 0?o:{...o,flow:{...o.flow,meta:$(o.flow.meta,n)}}}))}function T(s){return{flow:s,tasks:[],taskStatus:"loading",taskError:null,openTaskCount:0}}const k=["indigo","violet","fuchsia","rose","orange","amber","lime","emerald","teal","cyan","blue","slate"],S=["stable","medium","high"],D=[u.Lowest,u.Low,u.Medium,u.High,u.Highest],de=new Set(k),ce=new Set(S),ue=new Set(D);function v(s){return k[s%k.length]??"indigo"}function b(s){var a;const e=F((a=F(s.meta))==null?void 0:a.presentation),t=e==null?void 0:e.color,o=e==null?void 0:e.timeProfile,n=e==null?void 0:e.riskLevel,i=e==null?void 0:e.priority,r=e==null?void 0:e.collapsed,l=e==null?void 0:e.hidden;return{color:typeof t=="string"&&de.has(t)?t:null,timeProfile:typeof o=="string"&&o.trim()?o.trim():null,riskLevel:typeof n=="string"&&ce.has(n)?n:null,priority:typeof i=="string"&&ue.has(i)?i:null,collapsed:typeof r=="boolean"?r:null,hidden:typeof l=="boolean"?l:null}}function C(s,e){const t={...F(s)??{}},o={...F(t.presentation)??{},color:e.color,timeProfile:e.timeProfile,riskLevel:e.riskLevel,priority:e.priority,collapsed:e.collapsed,hidden:e.hidden};return t.presentation=o,t}function F(s){return s&&typeof s=="object"&&!Array.isArray(s)?s:null}const fe=4,A=44,O=18;function pe(s){return s.view??window}function he(s){return!s||s.closest(".flows-column-collapsed")?!1:!!s.closest('[data-flow-drag-ignore="true"], button, input, textarea, select')}class we{constructor(e){this.options=e,this.pending=null,this.active=null,this.eventWindow=null,this.suppressNextClick=!1,this.mounted=!1,this.handleClick=t=>{this.suppressNextClick&&(this.suppressNextClick=!1,t.preventDefault(),t.stopPropagation())},this.handlePointerDown=t=>{if(t.button!==0||t.isPrimary===!1)return;const o=t.target,n=o==null?void 0:o.closest('[data-flow-column-draggable="true"]');if(!n||!this.options.root.contains(n)||he(o))return;const i=Number(n.dataset.flowId),r=this.options.getState();!r||!Number.isFinite(i)||r.columns.some(l=>l.flow.id===i)&&(this.pending={pointerId:t.pointerId,startX:t.clientX,startY:t.clientY,sourceColumnElement:n,flowId:i},this.addWindowListeners(pe(t)))},this.handlePointerMove=t=>{const o=this.pending;if(!o||t.pointerId!==o.pointerId)return;if(!this.active){const i=t.clientX-o.startX,r=t.clientY-o.startY;if(Math.hypot(i,r)<fe)return;this.startDrag(o,t)}const n=this.active;n&&(t.preventDefault(),this.movePreview(n,t.clientX,t.clientY),this.updateDropTarget(n,t.clientX),this.autoScroll(t.clientX))},this.handlePointerUp=t=>{this.pending&&t.pointerId!==this.pending.pointerId||(this.removeWindowListeners(),this.pending=null,this.finishActiveDrag(!0))},this.handlePointerCancel=t=>{this.pending&&t.pointerId!==this.pending.pointerId||this.cancelDrag()},this.handleWindowBlur=()=>{this.cancelDrag()}}mount(){this.mounted||(this.mounted=!0,this.options.root.addEventListener("pointerdown",this.handlePointerDown,!0),this.options.root.addEventListener("click",this.handleClick,!0))}unmount(){this.mounted&&(this.mounted=!1,this.cancelDrag(),this.options.root.removeEventListener("pointerdown",this.handlePointerDown,!0),this.options.root.removeEventListener("click",this.handleClick,!0))}cancelDrag(){this.removeWindowListeners(),this.pending=null,this.finishActiveDrag(!1)}startDrag(e,t){const o=e.sourceColumnElement.getBoundingClientRect(),n=e.sourceColumnElement.cloneNode(!0);n.classList.add("flows-column-drag-preview"),n.style.width=`${o.width}px`,n.style.height=`${o.height}px`,n.style.left=`${o.left}px`,n.style.top=`${o.top}px`;const i=document.createElement("div");i.className="flows-column-drag-placeholder",i.style.width=`${o.width}px`,i.style.flexBasis=`${o.width}px`,i.style.height=`${o.height}px`,e.sourceColumnElement.classList.add("is-dragging"),document.body.append(n),this.active={...e,offsetX:t.clientX-o.left,offsetY:t.clientY-o.top,preview:n,placeholder:i,insertionIndex:null},this.options.root.classList.add("is-flow-column-dragging"),this.movePreview(this.active,t.clientX,t.clientY),this.updateDropTarget(this.active,t.clientX)}movePreview(e,t,o){e.preview.style.left=`${t-e.offsetX}px`,e.preview.style.top=`${o-e.offsetY}px`}updateDropTarget(e,t){const o=this.resolveInsertionIndex(e.flowId,t);if(e.insertionIndex=o,!this.hasActiveTargetChanged(e)){e.placeholder.remove();return}this.placePlaceholder(e,o)}hasActiveTargetChanged(e){const t=this.options.getState();return!!(t&&e.insertionIndex!==null&&E(t.columns,e.flowId,e.insertionIndex))}resolveInsertionIndex(e,t){const o=Array.from(this.options.root.querySelectorAll('[data-flow-column-draggable="true"]')).filter(i=>Number(i.dataset.flowId)!==e),n=o.findIndex(i=>{const r=i.getBoundingClientRect();return t<r.left+r.width/2});return n>=0?n:o.length}placePlaceholder(e,t){const o=this.options.root.querySelector('[data-flow-board="true"]');if(!o)return;const n=Array.from(o.querySelectorAll('[data-flow-column-draggable="true"]')).filter(i=>Number(i.dataset.flowId)!==e.flowId);o.insertBefore(e.placeholder,n[t]??null)}autoScroll(e){const t=this.options.root.querySelector(".flows-body");if(!t)return;const o=t.getBoundingClientRect();e<o.left+A?t.scrollLeft-=O:e>o.right-A&&(t.scrollLeft+=O)}finishActiveDrag(e){const t=this.active;t&&(this.active=null,t.preview.remove(),t.placeholder.remove(),t.sourceColumnElement.classList.remove("is-dragging"),this.options.root.classList.remove("is-flow-column-dragging"),this.suppressNextClick=!0,e&&this.hasActiveTargetChanged(t)&&t.insertionIndex!==null&&this.options.onDrop(t.flowId,t.insertionIndex))}addWindowListeners(e){this.eventWindow=e,e.addEventListener("pointermove",this.handlePointerMove,!0),e.addEventListener("pointerup",this.handlePointerUp,!0),e.addEventListener("pointercancel",this.handlePointerCancel,!0),e.addEventListener("blur",this.handleWindowBlur,!0)}removeWindowListeners(){const e=this.eventWindow??window;this.eventWindow=null,e.removeEventListener("pointermove",this.handlePointerMove,!0),e.removeEventListener("pointerup",this.handlePointerUp,!0),e.removeEventListener("pointercancel",this.handlePointerCancel,!0),e.removeEventListener("blur",this.handleWindowBlur,!0)}}const M="flows-styles",me=`
#flows-root {
  --flows-column-expanded-width: 272px;
  --flows-card-border: 1px solid rgba(9, 30, 66, 0.08);
  --flows-card-shadow: 0 1px 1px rgba(9, 30, 66, 0.25);
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
  box-shadow: var(--flows-card-shadow);
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
  box-shadow: var(--flows-card-shadow);
  padding: 10px 8px 10px 12px;
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
  box-shadow: inset 0 0 0 2px var(--flow-accent, #818cf8);
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

.flows-column-meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
}

.flows-column-meta-select-field {
  display: inline-flex;
  min-width: 0;
  flex: 0 1 auto;
}

.flows-column-meta-select-label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.flows-column-meta-dropdown {
  min-width: 0;
}

.flows-column-meta-dropdown > button {
  width: auto;
  min-width: 0;
  height: 27px;
  min-height: 27px;
  align-items: center;
  gap: 5px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  box-shadow: none;
  color: #475569;
  padding: 0 6px;
  transition: background-color 140ms ease, box-shadow 140ms ease, color 140ms ease;
}

.flows-column-meta-dropdown > button:hover {
  background: rgba(248, 250, 252, 0.72);
}

.flows-column-meta-dropdown > button[aria-expanded="true"],
.flows-column-meta-dropdown > button:focus-visible {
  background: rgba(248, 250, 252, 0.82);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--flows-meta-tone, #64748b) 32%, #e2e8f0);
}

.flows-column-meta-dropdown > button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.flows-column-meta-dropdown > button > div {
  flex: 0 1 auto;
  color: #475569;
  font-size: 11px;
  font-weight: 650;
  line-height: 1;
}

.flows-column-meta-select-icon {
  flex: 0 0 auto;
  color: var(--flows-meta-tone, #64748b);
  opacity: 0.86;
}

.flows-column-meta-select-chevron {
  flex: 0 0 auto;
  color: #94a3b8;
  opacity: 0.72;
  pointer-events: none;
}

.flows-column-meta-option-icon {
  flex: 0 0 auto;
  opacity: 0.86;
}

.flows-column-meta-option-check {
  color: #64748b;
}

.flows-column-meta-select-field--slate { --flows-meta-tone: #64748b; }
.flows-column-meta-select-field--blue { --flows-meta-tone: #2563eb; }
.flows-column-meta-select-field--emerald { --flows-meta-tone: #059669; }
.flows-column-meta-select-field--amber { --flows-meta-tone: #d97706; }
.flows-column-meta-select-field--rose { --flows-meta-tone: #e11d48; }
.flows-column-meta-select-field--violet { --flows-meta-tone: #7c3aed; }
.flows-column-meta-tone--slate { color: #64748b; }
.flows-column-meta-tone--blue { color: #2563eb; }
.flows-column-meta-tone--emerald { color: #059669; }
.flows-column-meta-tone--amber { color: #d97706; }
.flows-column-meta-tone--rose { color: #e11d48; }
.flows-column-meta-tone--violet { color: #7c3aed; }

.flows-column-risk {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  padding: 5px 8px;
}

.flows-column-risk-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: currentColor;
}

.flows-column-risk--stable {
  border-color: rgba(226, 232, 240, 0.7);
  background: #f8fafc;
  color: #64748b;
}

.flows-column-risk--medium {
  border-color: rgba(254, 243, 199, 0.8);
  background: #fffbeb;
  color: #b45309;
}

.flows-column-risk--high {
  border-color: rgba(255, 228, 230, 0.85);
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
  box-shadow:
    0 1px 2px rgba(9, 30, 66, 0.3),
    0 0 0 2px color-mix(in srgb, var(--flow-accent, #818cf8) 42%, rgba(12, 102, 228, 0.42));
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

.flows-edit-input,
.flows-edit-select {
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

.flows-edit-input:focus,
.flows-edit-select:focus {
  border-color: #94a3b8;
  box-shadow: 0 0 0 3px rgba(100, 116, 139, 0.12);
}

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
}
`;function ge(){if(document.getElementById(M))return;const s=document.createElement("style");s.id=M,s.textContent=me,document.head.appendChild(s)}const H=[h.Draft,h.Described,h.Active,h.Completed,h.Archived,h.Cancelled],be=8;class xe{constructor(e,t,o){this.parent=e,this.runtime=t,this.handlers=o,this.isOrganizeModalOpen=!1,this.organizeDraggingFlowId=null,this.organizeDragOverFlowId=null,this.organizeDragPlacement=null,this.organizeDropInsertionIndex=null,this.reorderPendingFlowId=null,this.columnMenuPopover=null,this.editingFlowTitleTarget=null,this.flowTitleEditInput=null,this.isCreatingFlow=!1,this.editingFlowId=null,this.editDraft=null,this.editError=null,this.isSubmittingEdit=!1,this.lastState=null,this.dropdownDisposers=[],ge(),this.element=document.createElement("div"),this.element.id="flows-root",this.element.dataset.module="flows",this.parent.appendChild(this.element),this.columnDragController=new we({root:this.element,getState:()=>this.lastState,onDrop:(n,i)=>{this.handlers.onReorderFlow(n,i)}}),this.columnDragController.mount()}render(e){this.closeColumnMenu(),this.disposeDropdownControls(),this.lastState=e,this.element.replaceChildren(this.renderPage(e))}destroy(){this.closeColumnMenu(),this.disposeDropdownControls(),this.columnDragController.unmount(),this.element.remove()}renderPage(e){const t=document.createElement("div");t.className="flows-page";const o=document.createElement("main");o.className="flows-body",o.appendChild(this.renderBody(e)),t.append(this.renderHeader(e),o);const n=this.getEditingColumn(e);return n&&t.appendChild(this.renderEditModal(n)),this.isCreatingFlow&&t.appendChild(this.renderEditModal(null)),this.isOrganizeModalOpen&&t.appendChild(this.renderOrganizeModal(e)),t}renderHeader(e){const t=document.createElement("header");t.className="flows-header";const o=document.createElement("div");o.className="flows-header-title-block";const n=document.createElement("div");n.className="flows-header-title-row";const i=document.createElement("h1");return i.className="flows-header-title",i.textContent=this.runtime.i18n.t("flows.title"),n.append(i,this.renderHeaderActionButton({label:this.runtime.i18n.t("flows.actions.organize"),icon:"bars-3",pressed:this.isOrganizeModalOpen,onClick:()=>{this.openOrganizeModal(),this.renderCurrent()}}),this.renderHeaderActionButton({label:this.runtime.i18n.t("flows.actions.create"),icon:"plus",disabled:e.status==="loading",onClick:()=>{this.openCreateModal(),this.renderCurrent()}})),o.appendChild(n),t.appendChild(o),t}renderHeaderActionButton(e){const t=P({text:"",tone:"text",size:"sm",className:"flows-header-action",title:e.label,ariaLabel:e.label,disabled:e.disabled,onClick:e.onClick});e.pressed!==void 0&&t.setAttribute("aria-pressed",e.pressed?"true":"false");const o=w(e.icon,{size:16,strokeWidth:2});o.setAttribute("aria-hidden","true");const n=document.createElement("span");return n.textContent=e.label,t.append(o,n),t}renderBody(e){if(e.status==="loading"||e.status==="idle")return this.renderCenterState(this.runtime.i18n.t("flows.loading"));if(e.status==="error")return this.renderCenterState(this.runtime.i18n.t("flows.errors.load"));if(e.columns.length===0)return this.renderCenterState(this.runtime.i18n.t("flows.empty"));const t=e.columns.filter(n=>b(n.flow).hidden!==!0),o=document.createElement("div");return o.className="flows-board",o.dataset.flowBoard="true",t.forEach(n=>{o.appendChild(this.renderFlowColumn(n,this.getColumnIndex(n.flow.id)))}),o.appendChild(this.renderAddFlowButton(e)),o}renderCenterState(e){const t=document.createElement("div");t.className="flows-center-state";const o=document.createElement("p");return o.className="flows-state-text",o.textContent=e,t.appendChild(o),t}renderFlowColumn(e,t){const n=b(e.flow).collapsed===!0,i=this.getColumnAccentColor(e,t),r=document.createElement("section");return r.className=`flows-column flows-column--${i}${n?" is-collapsed":""}`,r.dataset.flowId=String(e.flow.id),r.dataset.flowColumnDraggable="true",r.appendChild(this.renderCollapsedColumn(e)),r.appendChild(this.renderExpandedColumn(e)),r}renderOrganizeModal(e){const t=e.columns,o=t.length>=be,n=document.createElement("div");n.className="flows-organize-modal",n.setAttribute("role","presentation"),n.addEventListener("click",()=>this.closeOrganizeModal());const i=document.createElement("section");i.className=`flows-organize-dialog${o?" flows-organize-dialog--multi-column":""}`,i.setAttribute("role","dialog"),i.setAttribute("aria-modal","true"),i.setAttribute("aria-labelledby","flows-organize-title"),i.addEventListener("click",g=>g.stopPropagation());const r=document.createElement("header");r.className="flows-organize-header";const l=document.createElement("div");l.className="flows-organize-title-wrap";const a=w("bars-3",{size:20,strokeWidth:2});a.setAttribute("aria-hidden","true");const d=document.createElement("h2");d.id="flows-organize-title",d.className="flows-organize-title",d.textContent=this.runtime.i18n.t("flows.organize.title"),l.append(a,d);const c=document.createElement("button");c.type="button",c.className="flows-organize-close",c.title=this.runtime.i18n.t("flows.organize.close"),c.setAttribute("aria-label",c.title),c.disabled=this.reorderPendingFlowId!==null,c.appendChild(w("x-mark",{size:19,strokeWidth:2})),c.addEventListener("click",()=>this.closeOrganizeModal()),r.append(l,c);const f=document.createElement("div");if(f.className=`flows-organize-body${o?" flows-organize-body--multi-column":""}`,f.setAttribute("role","list"),f.addEventListener("dragover",g=>{this.handleOrganizeBodyDragOver(g)}),f.addEventListener("drop",g=>{this.handleOrganizeBodyDrop(g,t)}),t.length===0){const g=document.createElement("p");g.className="flows-organize-empty",g.textContent=this.runtime.i18n.t("flows.organize.empty"),f.appendChild(g)}else t.forEach((g,j)=>{f.appendChild(this.renderOrganizeRow(g,j,t))});const p=document.createElement("footer");p.className="flows-organize-footer";const m=P({text:this.runtime.i18n.t("flows.organize.done"),tone:"primary",size:"sm",className:"flows-organize-done",disabled:this.reorderPendingFlowId!==null,onClick:()=>this.closeOrganizeModal()});return p.appendChild(m),i.append(r,f,p),n.appendChild(i),n}renderOrganizeRow(e,t,o){const n=this.getColumnAccentColor(e,t),i=b(e.flow),r=this.reorderPendingFlowId===e.flow.id,l=document.createElement("div");l.className=`flows-organize-row flows-column--${n}${r?" is-pending":""}${i.hidden===!0?" is-hidden":""}`,l.setAttribute("role","listitem"),l.dataset.flowId=String(e.flow.id),l.addEventListener("dragover",p=>{this.handleOrganizeDragOver(p,l,e,t,o)}),l.addEventListener("drop",p=>{this.handleOrganizeDrop(p,l,e,t,o)});const a=document.createElement("button");a.type="button",a.className="flows-organize-drag-handle",a.draggable=this.reorderPendingFlowId===null,a.title=this.runtime.i18n.t("flows.organize.drag",{title:e.flow.title}),a.setAttribute("aria-label",a.title),a.disabled=this.reorderPendingFlowId!==null,a.appendChild(w("drag-handle",{size:16})),a.addEventListener("dragstart",p=>{this.startOrganizeDrag(p,l,e)}),a.addEventListener("dragend",()=>{this.resetOrganizeDragState()});const d=document.createElement("div");d.className="flows-organize-row-main";const c=document.createElement("span");c.className="flows-organize-dot",c.setAttribute("aria-hidden","true");const f=document.createElement("span");return f.className="flows-organize-label",f.appendChild(this.renderFlowTitleInline(e,"organize")),d.append(a,c,f),l.append(d,this.renderOrganizeHideButton(e,i)),l}renderOrganizeHideButton(e,t){const o=t.hidden===!0,n=this.runtime.i18n.t(o?"flows.organize.show":"flows.organize.hide"),i=document.createElement("button");return i.type="button",i.className=`flows-organize-hide${o?" is-hidden":""}`,i.dataset.flowDragIgnore="true",i.disabled=this.reorderPendingFlowId!==null,i.title=n,i.setAttribute("aria-label",n),i.appendChild(w(o?"eye":"eye-slash",{size:16,strokeWidth:2})),i.addEventListener("click",()=>{this.patchFlowHidden(e,!o)}),i}renderFlowTitleInline(e,t){var r;if(((r=this.editingFlowTitleTarget)==null?void 0:r.flowId)===e.flow.id&&this.editingFlowTitleTarget.surface===t){const l=document.createElement("input");return l.type="text",l.className=t==="column"?"flows-column-title-input":"flows-organize-title-input",l.value=e.flow.title,l.maxLength=512,l.autocomplete="off",l.dataset.flowDragIgnore="true",l.setAttribute("aria-label",this.runtime.i18n.t("flows.titlePlaceholder")),l.addEventListener("keydown",a=>{if(a.key==="Enter"){a.preventDefault(),this.finishFlowTitleEdit(e.flow,!0);return}a.key==="Escape"&&(a.preventDefault(),this.finishFlowTitleEdit(e.flow,!1))}),l.addEventListener("blur",()=>{this.finishFlowTitleEdit(e.flow,!0)}),this.flowTitleEditInput=l,requestAnimationFrame(()=>{this.flowTitleEditInput===l&&(l.focus(),l.select())}),l}const n=document.createElement("button");n.type="button",n.className=t==="column"?"flows-column-title-button":"flows-organize-title-button",n.dataset.flowDragIgnore="true",n.title=this.runtime.i18n.t("flows.actions.renameFlow"),n.setAttribute("aria-label",n.title),n.addEventListener("click",()=>{this.startFlowTitleEdit(e.flow.id,t)});const i=document.createElement("span");return i.className=t==="column"?"flows-column-title-text":"flows-organize-title-text",i.textContent=e.flow.title,n.appendChild(i),n}startOrganizeDrag(e,t,o){var n;if(this.reorderPendingFlowId!==null){e.preventDefault();return}this.organizeDraggingFlowId=o.flow.id,(n=e.dataTransfer)==null||n.setData("text/plain",String(o.flow.id)),e.dataTransfer&&(e.dataTransfer.effectAllowed="move"),t.classList.add("is-dragging")}handleOrganizeDragOver(e,t,o,n,i){const r=this.organizeDraggingFlowId;if(this.reorderPendingFlowId!==null||r===null||r===o.flow.id)return;e.preventDefault(),e.dataTransfer&&(e.dataTransfer.dropEffect="move");const l=this.resolveOrganizeDropPlacement(e,t),a=this.resolveOrganizeInsertionIndex(i,r,n,l);this.organizeDragOverFlowId=o.flow.id,this.organizeDragPlacement=l,this.organizeDropInsertionIndex=a,this.placeOrganizeDropPlaceholder({row:t,placement:l,show:E(i,r,a)})}async handleOrganizeDrop(e,t,o,n,i){const r=this.readOrganizeDraggedFlowId(e);if(this.reorderPendingFlowId!==null||r===null||r===o.flow.id){this.resetOrganizeDragState();return}e.preventDefault();const l=this.organizeDragOverFlowId===o.flow.id&&this.organizeDragPlacement?this.organizeDragPlacement:this.resolveOrganizeDropPlacement(e,t),a=this.organizeDragOverFlowId===o.flow.id&&this.organizeDragPlacement&&this.organizeDropInsertionIndex!==null?this.organizeDropInsertionIndex:this.resolveOrganizeInsertionIndex(i,r,n,l);e.stopPropagation(),this.resetOrganizeDragState(),await this.moveOrganizeColumn(r,a)}async handleOrganizeBodyDrop(e,t){const o=this.readOrganizeDraggedFlowId(e),n=this.organizeDropInsertionIndex;if(this.reorderPendingFlowId!==null||o===null||n===null){this.resetOrganizeDragState();return}e.preventDefault(),this.resetOrganizeDragState(),E(t,o,n)&&await this.moveOrganizeColumn(o,n)}handleOrganizeBodyDragOver(e){this.reorderPendingFlowId!==null||this.organizeDraggingFlowId===null||this.organizeDropInsertionIndex===null||(e.preventDefault(),e.dataTransfer&&(e.dataTransfer.dropEffect="move"))}resolveOrganizeDropPlacement(e,t){const o=t.getBoundingClientRect(),n=o.top+o.height/2;return e.clientY>n?"after":"before"}resolveOrganizeInsertionIndex(e,t,o,n){const i=e.findIndex(l=>l.flow.id===t),r=i>=0&&i<o?o-1:o;return n==="after"?r+1:r}placeOrganizeDropPlaceholder(e){if(this.element.querySelectorAll(".flows-organize-drop-placeholder").forEach(i=>i.remove()),!e.show)return;const t=e.row.parentElement;if(!t)return;const o=document.createElement("div");o.className="flows-organize-drop-placeholder";const n=Array.from(e.row.classList).find(i=>i.startsWith("flows-column--"));n&&o.classList.add(n),o.setAttribute("aria-hidden","true"),t.insertBefore(o,e.placement==="before"?e.row:e.row.nextElementSibling)}readOrganizeDraggedFlowId(e){var n;const t=((n=e.dataTransfer)==null?void 0:n.getData("text/plain"))??"";if(!t.trim())return this.organizeDraggingFlowId;const o=Number(t);return Number.isFinite(o)?o:this.organizeDraggingFlowId}resetOrganizeDragState(){this.organizeDraggingFlowId=null,this.organizeDragOverFlowId=null,this.organizeDragPlacement=null,this.organizeDropInsertionIndex=null,this.clearOrganizeDropIndicators()}clearOrganizeDropIndicators(){this.element.querySelectorAll(".flows-organize-row.is-dragging").forEach(e=>{e.classList.remove("is-dragging")}),this.element.querySelectorAll(".flows-organize-drop-placeholder").forEach(e=>e.remove())}async moveOrganizeColumn(e,t){if(this.lastState&&!(t<0||t>=this.lastState.columns.length)&&this.lastState.columns.some(o=>o.flow.id===e)&&E(this.lastState.columns,e,t)){this.reorderPendingFlowId=e,this.renderCurrent();try{await this.handlers.onReorderFlow(e,t)}finally{this.reorderPendingFlowId=null,this.renderCurrent()}}}openOrganizeModal(){this.closeColumnMenu(),this.isOrganizeModalOpen=!0}closeOrganizeModal(){this.reorderPendingFlowId===null&&(this.isOrganizeModalOpen=!1,this.resetOrganizeDragState(),this.renderCurrent())}getColumnAccentColor(e,t){return b(e.flow).color??v(t)}renderCollapsedColumn(e){const t=document.createElement("button");t.type="button",t.className="flows-column-collapsed",t.title=e.flow.title,t.setAttribute("aria-label",this.runtime.i18n.t("flows.expand")),t.addEventListener("click",()=>{this.patchColumnCollapsed(e,!1)});const o=document.createElement("span");o.className="flows-column-collapsed-indicator";const n=document.createElement("span");return n.className="flows-column-collapsed-title",n.textContent=e.flow.title,t.append(o,n),t}renderExpandedColumn(e){const t=document.createElement("div");t.className="flows-column-expanded";const o=document.createElement("header");o.className="flows-column-header";const n=document.createElement("div");n.className="color-line-bar flows-column-color-line-bar",n.setAttribute("aria-hidden","true");const i=document.createElement("div");i.className="flows-column-title-row";const r=document.createElement("div");r.className="flows-column-title-wrap";const l=document.createElement("button");l.type="button",l.className="flows-column-icon-button",l.dataset.flowDragIgnore="true",l.title=this.runtime.i18n.t("flows.collapse"),l.setAttribute("aria-label",l.title),l.appendChild(w("shrink",{size:16,strokeWidth:2})),l.addEventListener("click",()=>{this.patchColumnCollapsed(e,!0)});const a=document.createElement("h2");a.className="flows-column-title",a.appendChild(this.renderFlowTitleInline(e,"column")),r.appendChild(a);const d=document.createElement("div");d.className="flows-column-title-actions",d.append(l,this.renderColumnMenu(e)),i.append(r,d);const c=document.createElement("div");c.className="flows-column-meta-row";const f=b(e.flow);c.append(this.renderFlowStatusSelect(e),this.renderFlowPrioritySelect(e,f)),o.append(n,i,c);const p=document.createElement("div");return p.className="flows-column-task-list",this.appendTaskContent(p,e),t.append(o,p),t}renderColumnMenu(e){const t=document.createElement("div");t.className="flows-column-menu-container";const o=document.createElement("button");return o.type="button",o.className="flows-column-icon-button flows-column-menu-trigger",o.dataset.flowDragIgnore="true",o.title=this.runtime.i18n.t("flows.actions.menu"),o.setAttribute("aria-label",o.title),o.setAttribute("aria-haspopup","menu"),o.setAttribute("aria-expanded","false"),o.appendChild(w("ellipsis-horizontal",{size:18,strokeWidth:2})),o.addEventListener("click",n=>{var i;if(n.stopPropagation(),((i=this.columnMenuPopover)==null?void 0:i.trigger)===o){this.closeColumnMenu();return}this.openColumnMenu(o,e)}),t.appendChild(o),t}openColumnMenu(e,t){this.closeColumnMenu();const o=q({elevated:!0,className:"flows-column-menu hidden"});o.setAttribute("role","menu"),o.addEventListener("mousedown",i=>i.stopPropagation()),o.append(this.renderColumnMenuItem({label:this.runtime.i18n.t("flows.actions.edit"),icon:"pencil",onClick:()=>this.openEditModal(t)}),this.renderColumnMenuItem({label:this.runtime.i18n.t("flows.actions.delete"),icon:"trash",tone:"danger",onClick:()=>void this.deleteFlow(t)}));let n;n=new Y({container:e,panel:o,positioning:"viewport",panelZIndex:290,onOpenChange:i=>{var r;e.setAttribute("aria-expanded",i?"true":"false"),!i&&((r=this.columnMenuPopover)==null?void 0:r.menu)===n&&this.closeColumnMenu()}}),n.mount(),this.columnMenuPopover={menu:n,panel:o,trigger:e},n.openAt({anchor:e,placement:"bottom-end",fallbackPlacements:["bottom-start","top-end","top-start"],gap:6,margin:12,lockPlacementAfterOpen:!0})}renderColumnMenuItem(e){const t=document.createElement("span");t.className="flows-column-menu-item-icon",t.appendChild(w(e.icon,{size:15,strokeWidth:2}));const o=U({label:e.label,tone:e.tone==="danger"?"danger":"default",leading:t,className:`flows-column-menu-item${e.tone==="danger"?" flows-column-menu-item--danger":""}`,onClick:n=>{n.stopPropagation(),e.onClick()}});return o.dataset.flowDragIgnore="true",o.setAttribute("role","menuitem"),o}openEditModal(e){const t=b(e.flow);this.closeColumnMenu(),this.editingFlowTitleTarget=null,this.flowTitleEditInput=null,this.isCreatingFlow=!1,this.editingFlowId=e.flow.id,this.editDraft={title:e.flow.title,color:t.color??v(this.getColumnIndex(e.flow.id)),timeProfile:t.timeProfile??"",riskLevel:t.riskLevel??"stable",priority:t.priority},this.editError=null,this.renderCurrent()}openCreateModal(){this.closeColumnMenu(),this.isOrganizeModalOpen=!1,this.editingFlowTitleTarget=null,this.flowTitleEditInput=null,this.isCreatingFlow=!0,this.editingFlowId=null,this.editDraft=this.createNewFlowDraft(),this.editError=null}async deleteFlow(e){this.closeColumnMenu(),window.confirm(this.runtime.i18n.t("flows.delete.confirm",{title:e.flow.title}))&&await this.handlers.onDeleteFlow(e.flow.id)}renderFlowStatusSelect(e){const t=e.flow.status;return this.renderMetaSelect({kind:"status",label:this.runtime.i18n.t("flows.fields.status"),value:t,options:H.map(o=>({value:o,label:this.getStatusLabel(o),icon:this.getStatusIcon(o),tone:this.getStatusTone(o)})),onChange:(o,n)=>{!ve(o)||o===e.flow.status||this.patchFlowFromMetaControl(n,e,{status:o})}})}renderFlowPrioritySelect(e,t){const o=t.priority??u.Medium;return this.renderMetaSelect({kind:"priority",label:this.runtime.i18n.t("flows.fields.priority"),value:o,options:D.map(n=>({value:n,label:this.getPriorityLabel(n),icon:this.getPriorityIcon(n),tone:this.getPriorityTone(n)})),onChange:(n,i)=>{!ye(n)||n===t.priority||this.patchFlowFromMetaControl(i,e,{meta:C(e.flow.meta,{...t,priority:n})})}})}renderMetaSelect(e){const t=e.options.find(a=>a.value===e.value)??null,o=(t==null?void 0:t.tone)??"slate",n=document.createElement("div");n.className=`flows-column-meta-select-field flows-column-meta-select-field--${e.kind} flows-column-meta-select-field--${o}`;const i=document.createElement("span");i.className="flows-column-meta-select-label",i.textContent=e.label;const r={current:null},l=new G({size:"sm",value:t,placeholder:e.label,items:e.options,getKey:a=>a.value,getLabel:a=>a.label,ariaLabel:e.label,className:"flows-column-meta-dropdown",portalTarget:document.body,renderTriggerLeading:a=>this.renderMetaSelectIcon(a),renderTriggerTrailing:()=>{const a=w("chevron-down",{size:13,strokeWidth:2});return a.classList.add("flows-column-meta-select-chevron"),a.setAttribute("aria-hidden","true"),a},renderOptionLeading:a=>this.renderMetaSelectIcon(a,!0),renderOptionTrailing:(a,d)=>{if(!d)return null;const c=w("check",{size:14,strokeWidth:2.3});return c.classList.add("flows-column-meta-option-check"),c.setAttribute("aria-hidden","true"),c},onSelect:a=>{e.onChange(a.value,d=>{var c;return(c=r.current)==null?void 0:c.setDisabled(d)})}});return r.current=l,l.element.dataset.flowDragIgnore="true",this.dropdownDisposers.push(()=>l.destroy()),n.append(i,l.element),n}renderMetaSelectIcon(e,t=!1){if(!e)return null;const o=w(e.icon,{size:14,strokeWidth:2});return o.classList.add(t?"flows-column-meta-option-icon":"flows-column-meta-select-icon",`flows-column-meta-tone--${e.tone}`),o.setAttribute("aria-hidden","true"),o}async patchFlowFromMetaControl(e,t,o){e(!0);try{await this.handlers.onPatchFlow(t.flow.id,o)}catch{e(!1),this.renderCurrent()}}async patchColumnCollapsed(e,t){const o=b(e.flow);await this.handlers.onPatchFlow(e.flow.id,{meta:C(e.flow.meta,{...o,collapsed:t})})}async patchFlowHidden(e,t){const o=b(e.flow);await this.handlers.onPatchFlow(e.flow.id,{meta:C(e.flow.meta,{...o,hidden:t})})}renderRiskBadge(e,t){const o=document.createElement("span"),n=e.tasks.filter(a=>a.priority==="high"||a.priority==="highest").length,i=t.riskLevel??(n>0?"high":e.openTaskCount>e.tasks.length?"medium":"stable");o.className=`flows-column-risk flows-column-risk--${i}`;const r=document.createElement("span");r.className="flows-column-risk-dot",r.setAttribute("aria-hidden","true");const l=document.createElement("span");return l.textContent=i==="high"?this.runtime.i18n.t("flows.risk.high"):i==="medium"?this.runtime.i18n.t("flows.risk.medium"):this.runtime.i18n.t("flows.risk.stable"),o.append(r,l),o}appendTaskContent(e,t){if(t.taskStatus==="loading"){e.appendChild(this.renderColumnState(this.runtime.i18n.t("flows.tasks.loading")));return}if(t.taskStatus==="error"){e.appendChild(this.renderColumnState(this.runtime.i18n.t("flows.tasks.errors.load")));return}t.tasks.forEach(o=>{const n=document.createElement("article");n.className="flows-task-card";const i=document.createElement("p");i.className="flows-task-title",i.textContent=o.title;const r=document.createElement("div");r.className="flows-task-meta",r.append(this.renderTaskMetaItem(o.status),this.renderTaskMetaItem(o.priority)),n.append(i,r),e.appendChild(n)}),e.appendChild(this.renderAddTaskButton())}renderColumnState(e){const t=document.createElement("div");return t.className="flows-column-state",t.textContent=e,t}renderTaskMetaItem(e){const t=document.createElement("span");return t.className="flows-task-meta-item",t.textContent=e,t}renderAddTaskButton(){const e=document.createElement("button");return e.type="button",e.className="flows-add-task-button",e.dataset.flowDragIgnore="true",e.append(w("plus",{size:15,strokeWidth:2}),document.createTextNode(this.runtime.i18n.t("flows.tasks.add"))),e}renderAddFlowButton(e){const t=document.createElement("aside");t.className="flows-add-flow-panel",t.dataset.flowDragIgnore="true";const o=document.createElement("button");return o.type="button",o.className="flows-add-flow-button",o.disabled=e.status==="loading",o.append(w("plus",{size:16,strokeWidth:2}),document.createTextNode(this.runtime.i18n.t("flows.actions.addFlow"))),o.addEventListener("click",()=>{this.openCreateModal(),this.renderCurrent()}),t.appendChild(o),t}renderEditModal(e){const t=e===null,o=this.editDraft??(t?this.createNewFlowDraft():this.createEditDraft(e)),n=document.createElement("div");n.className="flows-edit-modal",n.setAttribute("role","presentation"),n.addEventListener("click",()=>this.closeEditModal());const i=document.createElement("form");i.className="flows-edit-dialog",i.setAttribute("role","dialog"),i.setAttribute("aria-modal","true"),i.setAttribute("aria-labelledby","flows-edit-title"),i.addEventListener("click",m=>m.stopPropagation()),i.addEventListener("submit",m=>{m.preventDefault(),this.submitEditModal(e,i)});const r=document.createElement("header");r.className="flows-edit-header";const l=document.createElement("h2");l.id="flows-edit-title",l.className="flows-edit-title",l.textContent=this.runtime.i18n.t(t?"flows.create.title":"flows.edit.title");const a=document.createElement("button");a.type="button",a.className="flows-edit-close",a.title=this.runtime.i18n.t(t?"flows.create.close":"flows.edit.close"),a.setAttribute("aria-label",a.title),a.appendChild(w("x-mark",{size:18,strokeWidth:2})),a.addEventListener("click",()=>this.closeEditModal()),r.append(l,a);const d=document.createElement("div");if(d.className="flows-edit-body",d.append(this.renderTextField({name:"title",label:this.runtime.i18n.t("flows.edit.name"),value:o.title,placeholder:this.runtime.i18n.t("flows.edit.namePlaceholder")}),this.renderColorField(o.color),this.renderTextField({name:"timeProfile",label:this.runtime.i18n.t("flows.edit.timeProfile"),value:o.timeProfile,placeholder:this.runtime.i18n.t("flows.edit.timeProfilePlaceholder")}),this.renderRiskField(o.riskLevel)),this.editError){const m=document.createElement("p");m.className="flows-edit-error",m.textContent=this.editError,d.appendChild(m)}const c=document.createElement("footer");c.className="flows-edit-footer";const f=document.createElement("button");f.type="button",f.className="flows-edit-secondary",f.textContent=this.runtime.i18n.t("flows.edit.cancel"),f.disabled=this.isSubmittingEdit,f.addEventListener("click",()=>this.closeEditModal());const p=document.createElement("button");return p.type="submit",p.className="flows-edit-primary",p.textContent=this.runtime.i18n.t(this.isSubmittingEdit?t?"flows.create.saving":"flows.edit.saving":t?"flows.create.save":"flows.edit.save"),p.disabled=this.isSubmittingEdit,c.append(f,p),i.append(r,d,c),n.appendChild(i),requestAnimationFrame(()=>{var m;(m=i.querySelector('input[name="title"]'))==null||m.focus()}),n}renderTextField(e){const t=document.createElement("label");t.className="flows-edit-field";const o=document.createElement("span");o.className="flows-edit-label",o.textContent=e.label;const n=document.createElement("input");return n.className="flows-edit-input",n.dataset.flowDragIgnore="true",n.name=e.name,n.type="text",n.value=e.value,n.placeholder=e.placeholder,n.disabled=this.isSubmittingEdit,t.append(o,n),t}renderColorField(e){const t=document.createElement("fieldset");t.className="flows-edit-field flows-edit-color-field";const o=document.createElement("legend");o.className="flows-edit-label",o.textContent=this.runtime.i18n.t("flows.edit.color");const n=document.createElement("div");return n.className="flows-edit-color-row",k.forEach(i=>{const r=document.createElement("label");r.className=`flows-edit-color flows-edit-color--${i}`,r.title=this.runtime.i18n.t(`flows.colors.${i}`);const l=document.createElement("input");l.type="radio",l.dataset.flowDragIgnore="true",l.name="color",l.value=i,l.checked=i===e,l.disabled=this.isSubmittingEdit;const a=document.createElement("span");a.setAttribute("aria-hidden","true"),r.append(l,a),n.appendChild(r)}),t.append(o,n),t}renderRiskField(e){const t=document.createElement("label");t.className="flows-edit-field";const o=document.createElement("span");o.className="flows-edit-label",o.textContent=this.runtime.i18n.t("flows.edit.risk");const n=document.createElement("select");return n.className="flows-edit-select",n.dataset.flowDragIgnore="true",n.name="riskLevel",n.disabled=this.isSubmittingEdit,S.forEach(i=>{const r=document.createElement("option");r.value=i,r.selected=i===e,r.textContent=this.getRiskLabel(i),n.appendChild(r)}),t.append(o,n),t}async submitEditModal(e,t){const o=new FormData(t),n=e===null?this.readCreateDraft(o):this.readEditDraft(o,e);this.editDraft=n,this.editError=null,this.isSubmittingEdit=!0,this.renderCurrent();try{if(e===null)await this.handlers.onCreateFlow({title:n.title,meta:this.writeDraftPresentation(null,n,null,null)});else{const i=b(e.flow);await this.handlers.onPatchFlow(e.flow.id,{title:n.title,meta:this.writeDraftPresentation(e.flow.meta,n,i.collapsed,i.hidden)})}this.isSubmittingEdit=!1,this.closeEditModal()}catch{this.isSubmittingEdit=!1,this.editError=this.runtime.i18n.t(e===null?"flows.create.error":"flows.edit.error"),this.renderCurrent()}}writeDraftPresentation(e,t,o,n){return C(e,{color:t.color,timeProfile:t.timeProfile||null,riskLevel:t.riskLevel,priority:t.priority,collapsed:o,hidden:n})}readCreateDraft(e){var t;return this.readDraftFromForm(e,this.runtime.i18n.t("flows.defaultFlowTitle"),v(((t=this.lastState)==null?void 0:t.columns.length)??0),null)}readEditDraft(e,t){return this.readDraftFromForm(e,t.flow.title,v(this.getColumnIndex(t.flow.id)),b(t.flow).priority)}readDraftFromForm(e,t,o,n){const i=String(e.get("title")??"").trim(),r=String(e.get("color")??""),l=String(e.get("riskLevel")??"");return{title:i||t,color:k.includes(r)?r:o,timeProfile:String(e.get("timeProfile")??"").trim(),riskLevel:S.includes(l)?l:"stable",priority:n}}createEditDraft(e){const t=b(e.flow);return{title:e.flow.title,color:t.color??v(this.getColumnIndex(e.flow.id)),timeProfile:t.timeProfile??"",riskLevel:t.riskLevel??"stable",priority:t.priority}}createNewFlowDraft(){var e;return{title:"",color:v(((e=this.lastState)==null?void 0:e.columns.length)??0),timeProfile:"",riskLevel:"stable",priority:null}}getStatusLabel(e){return this.runtime.i18n.t(`flows.status.${e}`)}getStatusIcon(e){switch(e){case h.Active:return"arrow-path";case h.Completed:return"check-circle";case h.Archived:return"archive-box";case h.Cancelled:return"x-mark";case h.Described:return"map-pin";case h.Draft:default:return"status-pending"}}getStatusTone(e){switch(e){case h.Active:return"blue";case h.Completed:return"emerald";case h.Cancelled:return"rose";case h.Described:return"violet";case h.Draft:return"amber";case h.Archived:default:return"slate"}}getPriorityLabel(e){switch(e){case u.Highest:return this.runtime.i18n.t("priority.highest");case u.High:return this.runtime.i18n.t("priority.high");case u.Low:return this.runtime.i18n.t("priority.low");case u.Lowest:return this.runtime.i18n.t("priority.lowest");case u.Medium:default:return this.runtime.i18n.t("priority.medium")}}getPriorityIcon(e){switch(e){case u.Highest:return"chevron-double-up";case u.High:return"chevron-up";case u.Low:return"chevron-down";case u.Lowest:return"chevron-double-down";case u.Medium:default:return"bars-2"}}getPriorityTone(e){switch(e){case u.Highest:case u.High:return"rose";case u.Low:case u.Lowest:return"blue";case u.Medium:default:return"amber"}}getRiskLabel(e){return e==="high"?this.runtime.i18n.t("flows.risk.high"):e==="medium"?this.runtime.i18n.t("flows.risk.medium"):this.runtime.i18n.t("flows.risk.stable")}getEditingColumn(e){return this.editingFlowId===null?null:e.columns.find(t=>t.flow.id===this.editingFlowId)??null}getColumnIndex(e){var t;return Math.max(0,((t=this.lastState)==null?void 0:t.columns.findIndex(o=>o.flow.id===e))??0)}closeEditModal(){this.isSubmittingEdit||(this.isCreatingFlow=!1,this.editingFlowId=null,this.editDraft=null,this.editError=null,this.renderCurrent())}startFlowTitleEdit(e,t){this.editingFlowTitleTarget={flowId:e,surface:t},this.flowTitleEditInput=null,this.renderCurrent()}finishFlowTitleEdit(e,t){var n,i;if(((n=this.editingFlowTitleTarget)==null?void 0:n.flowId)!==e.id)return;const o=((i=this.flowTitleEditInput)==null?void 0:i.value.trim())??"";if(this.editingFlowTitleTarget=null,this.flowTitleEditInput=null,t&&o.length>0&&o!==e.title){this.handlers.onPatchFlow(e.id,{title:o});return}this.renderCurrent()}renderCurrent(){this.lastState&&this.render(this.lastState)}closeColumnMenu(){const e=this.columnMenuPopover;e&&(this.columnMenuPopover=null,e.trigger.setAttribute("aria-expanded","false"),e.menu.close(),e.menu.unmount(),e.panel.remove())}disposeDropdownControls(){var e;for(;this.dropdownDisposers.length>0;)(e=this.dropdownDisposers.pop())==null||e()}}function ve(s){return H.includes(s)}function ye(s){return D.includes(s)}class ke{constructor(e={}){this.root=null,this.store=null,this.view=null,this.subscriptions=new L,this.runtime=e.runtime??R(),this.flowsApi=e.flowsApi??new ee(new K(Z.apiUrl))}mount(e){if(this.root)return;const t=document.createElement("div");t.dataset.module="flows",t.className="h-full w-full",e.appendChild(t),this.root=t;const o=new le(this.flowsApi),n=new xe(t,this.runtime,{onCreateFlow:i=>o.createFlow(i),onPatchFlow:(i,r)=>o.patchFlow(i,r),onReorderFlow:(i,r)=>o.reorderFlowColumns(i,r),onDeleteFlow:i=>o.deleteFlow(i)});this.store=o,this.view=n,this.subscriptions.add(o.state$.subscribe(i=>n.render(i))),this.subscriptions.add(this.runtime.subscribe(()=>{n.render(o.snapshot)})),o.load()}unmount(){var e,t,o;this.subscriptions.unsubscribe(),this.subscriptions=new L,(e=this.store)==null||e.destroy(),this.store=null,(t=this.view)==null||t.destroy(),this.view=null,(o=this.root)==null||o.remove(),this.root=null}}class Ee{constructor(e={}){this.id="flows",this.app=null,this.runtime=e.runtime??R()}mount(e){if(this.app)return;const t=new ke({runtime:this.runtime});t.mount(e),this.app=t}unmount(){var e;(e=this.app)==null||e.unmount(),this.app=null}getAiAssistantSnapshot(){return null}}export{Ee as FlowsModule};
