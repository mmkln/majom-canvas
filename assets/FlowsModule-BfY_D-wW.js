import{m as V,B as H,g as b,P as c,z as I,q as m,u as X,v as Y,w as q,S as f,d as P,k as M,H as U,e as G}from"./index-BUbMYuCT.js";function K(s){return Array.isArray(s)?s:s.results}function v(s){return encodeURIComponent(String(s))}function Z(s={}){const e=[];return s.isCompleted!==void 0&&e.push(`is_completed=${s.isCompleted?"true":"false"}`),s.page!==void 0&&e.push(`page=${encodeURIComponent(s.page.toString())}`),s.pageSize!==void 0&&e.push(`page_size=${encodeURIComponent(s.pageSize.toString())}`),e.length?`?${e.join("&")}`:""}class Q{constructor(e){this.http=e}getFlows(){return this.http.get("/flows/").pipe(V(K))}getFlow(e){return this.http.get(`/flows/${v(e)}/`)}getFlowTasks(e,t={}){return this.http.get(`/flows/${v(e)}/tasks/${Z(t)}`)}createFlow(e){return this.http.post("/flows/",e)}updateFlow(e,t){return this.http.put(`/flows/${v(e)}/`,t)}patchFlow(e,t){return this.http.patch(`/flows/${v(e)}/`,t)}deleteFlow(e){return this.http.delete(`/flows/${v(e)}/`)}}const O=1024;function R(s,e){const t=z(s),o=z(e);return t!==null||o!==null?(t??D(s))-(o??D(e))||s.title.localeCompare(e.title)||s.id-e.id:s.title.localeCompare(e.title)||s.id-e.id}function J(s,e,t){const o=s.find(l=>l.flow.id===e);if(!o)return[];const i=s.filter(l=>l.flow.id!==e),n=Math.max(0,Math.min(t,i.length)),r=[...i];return r.splice(n,0,o),r.map((l,a)=>({column:l,pos:(a+1)*O})).filter(({column:l,pos:a})=>z(l.flow)!==a)}function B(s,e,t){var l,a;const o=ee(s,e,t),i=s.findIndex(d=>d.flow.id===e);if(i<0)return!0;const n=i>0?s[i-1]:null,r=i<s.length-1?s[i+1]:null;return((n==null?void 0:n.flow.id)??null)!==(((l=o.previous)==null?void 0:l.flow.id)??null)||((r==null?void 0:r.flow.id)??null)!==(((a=o.next)==null?void 0:a.flow.id)??null)}function ee(s,e,t){const o=s.filter(n=>n.flow.id!==e),i=Math.max(0,Math.min(t,o.length));return{previous:i>0?o[i-1]:null,next:i<o.length?o[i]:null}}function z(s){const e=$(s.meta),t=e==null?void 0:e.pos;if(typeof t=="number"&&Number.isFinite(t))return t;if(typeof t=="string"&&t.trim()){const o=Number(t);return Number.isFinite(o)?o:null}return null}function W(s,e){return{...$(s)??{},pos:e}}function D(s){return s.id*O}function $(s){return s&&typeof s=="object"&&!Array.isArray(s)?s:null}const te=50,oe={columns:[],status:"idle",error:null};function ie(s){return[...s].sort(R)}class ne{constructor(e){this.api=e,this.stateSubject=new H(oe),this.state$=this.stateSubject.asObservable(),this.loadVersion=0,this.reorderVersion=0,this.flowPatchVersions=new Map}get snapshot(){return this.stateSubject.value}destroy(){this.loadVersion+=1,this.stateSubject.complete()}async load(){const e=++this.loadVersion;this.patchState({status:"loading",error:null});try{const t=ie(await b(this.api.getFlows()));if(e!==this.loadVersion)return;this.patchState({columns:t.map(L),status:"ready",error:null}),await Promise.all(t.map(o=>this.loadColumnTasks(o,e)))}catch{if(e!==this.loadVersion)return;this.patchState({status:"error",error:"flows.errors.load"})}}async patchFlow(e,t){const o=this.snapshot.columns.find(n=>n.flow.id===e)??null,i=(this.flowPatchVersions.get(e)??0)+1;this.flowPatchVersions.set(e,i),o&&this.replaceFlow(re(o.flow,t));try{const n=await b(this.api.patchFlow(e,t));this.flowPatchVersions.get(e)===i&&this.replaceFlow(n)}catch(n){throw o&&this.flowPatchVersions.get(e)===i&&this.replaceFlow(o.flow),n}}async createFlow(e){const t=await b(this.api.createFlow(e)),o=this.loadVersion;this.patchState({columns:y([...this.snapshot.columns,L(t)])}),await this.loadColumnTasks(t,o)}async reorderFlowColumns(e,t){const o=J(this.snapshot.columns,e,t);if(o.length===0)return;const i=++this.reorderVersion,n=this.snapshot.columns;this.patchState({columns:le(this.snapshot.columns,o)});try{const r=await Promise.all(o.map(({column:a,pos:d})=>b(this.api.patchFlow(a.flow.id,{meta:W(a.flow.meta,d)}))));if(i!==this.reorderVersion)return;const l=new Map(r.map(a=>[a.id,a]));this.patchState({columns:y(this.snapshot.columns.map(a=>{const d=l.get(a.flow.id);return d?{...a,flow:d}:a}))})}catch(r){throw i===this.reorderVersion&&this.patchState({columns:n}),r}}async deleteFlow(e){await b(this.api.deleteFlow(e)),this.patchState({columns:this.snapshot.columns.filter(t=>t.flow.id!==e)})}async loadColumnTasks(e,t){try{const o=await b(this.api.getFlowTasks(e.id,{isCompleted:!1,page:1,pageSize:te}));if(t!==this.loadVersion)return;this.patchColumn(e.id,{tasks:o.results,taskStatus:"ready",taskError:null,openTaskCount:o.count})}catch{if(t!==this.loadVersion)return;this.patchColumn(e.id,{taskStatus:"error",taskError:"flows.tasks.errors.load"})}}patchColumn(e,t){this.patchState({columns:this.snapshot.columns.map(o=>o.flow.id===e?{...o,...t}:o)})}replaceFlow(e){this.patchState({columns:y(this.snapshot.columns.map(t=>t.flow.id===e.id?{...t,flow:e}:t))})}patchState(e){this.stateSubject.next({...this.snapshot,...e})}}function y(s){return[...s].sort((e,t)=>R(e.flow,t.flow))}function re(s,e){return{...s,...e}}function le(s,e){const t=new Map(e.map(({column:o,pos:i})=>[o.flow.id,i]));return y(s.map(o=>{const i=t.get(o.flow.id);return i===void 0?o:{...o,flow:{...o.flow,meta:W(o.flow.meta,i)}}}))}function L(s){return{flow:s,tasks:[],taskStatus:"loading",taskError:null,openTaskCount:0}}const k=["indigo","violet","fuchsia","rose","orange","amber","lime","emerald","teal","cyan","blue","slate"],F=["stable","medium","high"],S=[c.Lowest,c.Low,c.Medium,c.High,c.Highest],se=new Set(k),ae=new Set(F),de=new Set(S);function x(s){return k[s%k.length]??"indigo"}function g(s){var l;const e=C((l=C(s.meta))==null?void 0:l.presentation),t=e==null?void 0:e.color,o=e==null?void 0:e.timeProfile,i=e==null?void 0:e.riskLevel,n=e==null?void 0:e.priority,r=e==null?void 0:e.collapsed;return{color:typeof t=="string"&&se.has(t)?t:null,timeProfile:typeof o=="string"&&o.trim()?o.trim():null,riskLevel:typeof i=="string"&&ae.has(i)?i:null,priority:typeof n=="string"&&de.has(n)?n:null,collapsed:typeof r=="boolean"?r:null}}function E(s,e){const t={...C(s)??{}},o={...C(t.presentation)??{},color:e.color,timeProfile:e.timeProfile,riskLevel:e.riskLevel,priority:e.priority,collapsed:e.collapsed};return t.presentation=o,t}function C(s){return s&&typeof s=="object"&&!Array.isArray(s)?s:null}const ce=4,N=44,T=18;function ue(s){return s.view??window}function fe(s){return!s||s.closest(".flows-column-collapsed")?!1:!!s.closest('[data-flow-drag-ignore="true"], button, input, textarea, select')}class pe{constructor(e){this.options=e,this.pending=null,this.active=null,this.eventWindow=null,this.suppressNextClick=!1,this.mounted=!1,this.handleClick=t=>{this.suppressNextClick&&(this.suppressNextClick=!1,t.preventDefault(),t.stopPropagation())},this.handlePointerDown=t=>{if(t.button!==0||t.isPrimary===!1)return;const o=t.target,i=o==null?void 0:o.closest('[data-flow-column-draggable="true"]');if(!i||!this.options.root.contains(i)||fe(o))return;const n=Number(i.dataset.flowId),r=this.options.getState();!r||!Number.isFinite(n)||r.columns.some(l=>l.flow.id===n)&&(this.pending={pointerId:t.pointerId,startX:t.clientX,startY:t.clientY,sourceColumnElement:i,flowId:n},this.addWindowListeners(ue(t)))},this.handlePointerMove=t=>{const o=this.pending;if(!o||t.pointerId!==o.pointerId)return;if(!this.active){const n=t.clientX-o.startX,r=t.clientY-o.startY;if(Math.hypot(n,r)<ce)return;this.startDrag(o,t)}const i=this.active;i&&(t.preventDefault(),this.movePreview(i,t.clientX,t.clientY),this.updateDropTarget(i,t.clientX),this.autoScroll(t.clientX))},this.handlePointerUp=t=>{this.pending&&t.pointerId!==this.pending.pointerId||(this.removeWindowListeners(),this.pending=null,this.finishActiveDrag(!0))},this.handlePointerCancel=t=>{this.pending&&t.pointerId!==this.pending.pointerId||this.cancelDrag()},this.handleWindowBlur=()=>{this.cancelDrag()}}mount(){this.mounted||(this.mounted=!0,this.options.root.addEventListener("pointerdown",this.handlePointerDown,!0),this.options.root.addEventListener("click",this.handleClick,!0))}unmount(){this.mounted&&(this.mounted=!1,this.cancelDrag(),this.options.root.removeEventListener("pointerdown",this.handlePointerDown,!0),this.options.root.removeEventListener("click",this.handleClick,!0))}cancelDrag(){this.removeWindowListeners(),this.pending=null,this.finishActiveDrag(!1)}startDrag(e,t){const o=e.sourceColumnElement.getBoundingClientRect(),i=e.sourceColumnElement.cloneNode(!0);i.classList.add("flows-column-drag-preview"),i.style.width=`${o.width}px`,i.style.height=`${o.height}px`,i.style.left=`${o.left}px`,i.style.top=`${o.top}px`;const n=document.createElement("div");n.className="flows-column-drag-placeholder",n.style.width=`${o.width}px`,n.style.flexBasis=`${o.width}px`,n.style.height=`${o.height}px`,e.sourceColumnElement.classList.add("is-dragging"),document.body.append(i),this.active={...e,offsetX:t.clientX-o.left,offsetY:t.clientY-o.top,preview:i,placeholder:n,insertionIndex:null},this.options.root.classList.add("is-flow-column-dragging"),this.movePreview(this.active,t.clientX,t.clientY),this.updateDropTarget(this.active,t.clientX)}movePreview(e,t,o){e.preview.style.left=`${t-e.offsetX}px`,e.preview.style.top=`${o-e.offsetY}px`}updateDropTarget(e,t){const o=this.resolveInsertionIndex(e.flowId,t);if(e.insertionIndex=o,!this.hasActiveTargetChanged(e)){e.placeholder.remove();return}this.placePlaceholder(e,o)}hasActiveTargetChanged(e){const t=this.options.getState();return!!(t&&e.insertionIndex!==null&&B(t.columns,e.flowId,e.insertionIndex))}resolveInsertionIndex(e,t){const o=Array.from(this.options.root.querySelectorAll('[data-flow-column-draggable="true"]')).filter(n=>Number(n.dataset.flowId)!==e),i=o.findIndex(n=>{const r=n.getBoundingClientRect();return t<r.left+r.width/2});return i>=0?i:o.length}placePlaceholder(e,t){const o=this.options.root.querySelector('[data-flow-board="true"]');if(!o)return;const i=Array.from(o.querySelectorAll('[data-flow-column-draggable="true"]')).filter(n=>Number(n.dataset.flowId)!==e.flowId);o.insertBefore(e.placeholder,i[t]??null)}autoScroll(e){const t=this.options.root.querySelector(".flows-body");if(!t)return;const o=t.getBoundingClientRect();e<o.left+N?t.scrollLeft-=T:e>o.right-N&&(t.scrollLeft+=T)}finishActiveDrag(e){const t=this.active;t&&(this.active=null,t.preview.remove(),t.placeholder.remove(),t.sourceColumnElement.classList.remove("is-dragging"),this.options.root.classList.remove("is-flow-column-dragging"),this.suppressNextClick=!0,e&&this.hasActiveTargetChanged(t)&&t.insertionIndex!==null&&this.options.onDrop(t.flowId,t.insertionIndex))}addWindowListeners(e){this.eventWindow=e,e.addEventListener("pointermove",this.handlePointerMove,!0),e.addEventListener("pointerup",this.handlePointerUp,!0),e.addEventListener("pointercancel",this.handlePointerCancel,!0),e.addEventListener("blur",this.handleWindowBlur,!0)}removeWindowListeners(){const e=this.eventWindow??window;this.eventWindow=null,e.removeEventListener("pointermove",this.handlePointerMove,!0),e.removeEventListener("pointerup",this.handlePointerUp,!0),e.removeEventListener("pointercancel",this.handlePointerCancel,!0),e.removeEventListener("blur",this.handleWindowBlur,!0)}}const A="flows-styles",he=`
#flows-root {
  --flows-column-expanded-width: 320px;
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
  width: 56px;
  min-width: 56px;
  flex-basis: 56px;
  height: auto;
  max-height: calc(100% - 8px);
  overflow: hidden;
  border: var(--flows-card-border);
  border-radius: 14px;
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
  min-height: 10rem;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  border: 0;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  padding: 16px 0;
  transition: background-color 140ms ease, color 140ms ease;
}

.flows-column-collapsed:hover {
  background: #f8fafc;
  color: #334155;
}

.flows-column-collapsed-indicator {
  width: 6px;
  height: 24px;
  border-radius: 999px;
  background: var(--flow-accent, #818cf8);
}

.flows-column-collapsed-title {
  max-height: 14rem;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.14em;
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
  padding: 16px 14px 14px 20px;
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
  gap: 10px;
  margin-top: 14px;
}

.flows-column-meta-select-field {
  display: inline-flex;
  min-width: 0;
  flex: 1 1 0;
  flex-direction: column;
  gap: 4px;
}

.flows-column-meta-select-label {
  color: #64748b;
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0;
  line-height: 1;
  text-transform: uppercase;
}

.flows-column-meta-select-control {
  position: relative;
  display: flex;
  width: 100%;
  min-width: 0;
  height: 34px;
  align-items: center;
  gap: 7px;
  border: 1px solid rgba(226, 232, 240, 0.92);
  border-radius: 10px;
  background: #f8fafc;
  color: #475569;
  padding: 0 8px;
  transition: border-color 140ms ease, background-color 140ms ease, box-shadow 140ms ease;
}

.flows-column-meta-select-icon {
  flex: 0 0 auto;
  color: var(--flows-meta-tone, #64748b);
}

.flows-column-meta-select-chevron {
  flex: 0 0 auto;
  color: #94a3b8;
  pointer-events: none;
}

.flows-column-meta-select {
  flex: 1 1 auto;
  min-width: 0;
  height: 100%;
  border: 0;
  appearance: none;
  background: transparent;
  color: #334155;
  font-size: 16px;
  font-weight: 650;
  line-height: 1;
  padding: 0;
}

.flows-column-meta-select:focus {
  outline: none;
}

.flows-column-meta-select-field:focus-within .flows-column-meta-select-control {
  border-color: color-mix(in srgb, var(--flows-meta-tone, #64748b) 38%, #cbd5e1);
  background: #ffffff;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--flows-meta-tone, #64748b) 16%, transparent);
}

.flows-column-meta-select:disabled {
  cursor: wait;
  opacity: 0.65;
}

.flows-column-meta-select-field--slate { --flows-meta-tone: #64748b; }
.flows-column-meta-select-field--blue { --flows-meta-tone: #2563eb; }
.flows-column-meta-select-field--emerald { --flows-meta-tone: #059669; }
.flows-column-meta-select-field--amber { --flows-meta-tone: #d97706; }
.flows-column-meta-select-field--rose { --flows-meta-tone: #e11d48; }
.flows-column-meta-select-field--violet { --flows-meta-tone: #7c3aed; }

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

.flows-organize-row {
  display: flex;
  min-height: 56px;
  align-items: center;
  gap: 10px;
  justify-content: space-between;
  border: 1px solid transparent;
  border-radius: 12px;
  padding: 0 10px;
  transition: background-color 140ms ease, border-color 140ms ease, opacity 140ms ease;
}

.flows-organize-row:hover,
.flows-organize-row:focus-within,
.flows-organize-row.is-drag-over {
  border-color: #edf2f7;
  background: #f8fafc;
}

.flows-organize-row.is-dragging {
  opacity: 0.42;
}

.flows-organize-row.is-pending {
  opacity: 0.68;
}

.flows-organize-row.is-drag-over-before {
  box-shadow: inset 0 2px 0 var(--flow-accent, #818cf8);
}

.flows-organize-row.is-drag-over-after {
  box-shadow: inset 0 -2px 0 var(--flow-accent, #818cf8);
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

.flows-organize-row-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 140ms ease;
}

.flows-organize-row:hover .flows-organize-row-actions,
.flows-organize-row:focus-within .flows-organize-row-actions {
  opacity: 1;
  pointer-events: auto;
}

.flows-organize-move {
  display: inline-flex;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: background-color 140ms ease, color 140ms ease;
}

.flows-organize-move:hover {
  background: #eef2f7;
  color: #64748b;
}

.flows-organize-move:disabled {
  cursor: default;
  opacity: 0.38;
}

.flows-organize-move:disabled:hover {
  background: transparent;
  color: #94a3b8;
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

  .flows-column-meta-select {
    font-size: 11px;
  }
}

@media (max-width: 640px) {
  #flows-root {
    --flows-column-expanded-width: 304px;
  }

  .flows-body {
    padding: 12px 12px 16px;
  }
}
`;function we(){if(document.getElementById(A))return;const s=document.createElement("style");s.id=A,s.textContent=he,document.head.appendChild(s)}const _=[f.Draft,f.Described,f.Active,f.Completed,f.Archived,f.Cancelled];class me{constructor(e,t,o){this.parent=e,this.runtime=t,this.handlers=o,this.isOrganizeModalOpen=!1,this.organizeDraggingFlowId=null,this.organizeDragOverFlowId=null,this.organizeDragPlacement=null,this.reorderPendingFlowId=null,this.columnMenuPopover=null,this.editingFlowTitleTarget=null,this.flowTitleEditInput=null,this.isCreatingFlow=!1,this.editingFlowId=null,this.editDraft=null,this.editError=null,this.isSubmittingEdit=!1,this.lastState=null,we(),this.element=document.createElement("div"),this.element.id="flows-root",this.element.dataset.module="flows",this.parent.appendChild(this.element),this.columnDragController=new pe({root:this.element,getState:()=>this.lastState,onDrop:(i,n)=>{this.handlers.onReorderFlow(i,n)}}),this.columnDragController.mount()}render(e){this.closeColumnMenu(),this.lastState=e,this.element.replaceChildren(this.renderPage(e))}destroy(){this.closeColumnMenu(),this.columnDragController.unmount(),this.element.remove()}renderPage(e){const t=document.createElement("div");t.className="flows-page";const o=document.createElement("main");o.className="flows-body",o.appendChild(this.renderBody(e)),t.append(this.renderHeader(e),o);const i=this.getEditingColumn(e);return i&&t.appendChild(this.renderEditModal(i)),this.isCreatingFlow&&t.appendChild(this.renderEditModal(null)),this.isOrganizeModalOpen&&t.appendChild(this.renderOrganizeModal(e)),t}renderHeader(e){const t=document.createElement("header");t.className="flows-header";const o=document.createElement("div");o.className="flows-header-title-block";const i=document.createElement("div");i.className="flows-header-title-row";const n=document.createElement("h1");return n.className="flows-header-title",n.textContent=this.runtime.i18n.t("flows.title"),i.append(n,this.renderHeaderActionButton({label:this.runtime.i18n.t("flows.actions.organize"),icon:"bars-3",pressed:this.isOrganizeModalOpen,onClick:()=>{this.openOrganizeModal(),this.renderCurrent()}}),this.renderHeaderActionButton({label:this.runtime.i18n.t("flows.actions.create"),icon:"plus",disabled:e.status==="loading",onClick:()=>{this.openCreateModal(),this.renderCurrent()}})),o.appendChild(i),t.appendChild(o),t}renderHeaderActionButton(e){const t=I({text:"",tone:"text",size:"sm",className:"flows-header-action",title:e.label,ariaLabel:e.label,disabled:e.disabled,onClick:e.onClick});e.pressed!==void 0&&t.setAttribute("aria-pressed",e.pressed?"true":"false");const o=m(e.icon,{size:16,strokeWidth:2});o.setAttribute("aria-hidden","true");const i=document.createElement("span");return i.textContent=e.label,t.append(o,i),t}renderBody(e){if(e.status==="loading"||e.status==="idle")return this.renderCenterState(this.runtime.i18n.t("flows.loading"));if(e.status==="error")return this.renderCenterState(this.runtime.i18n.t("flows.errors.load"));if(e.columns.length===0)return this.renderCenterState(this.runtime.i18n.t("flows.empty"));const t=document.createElement("div");return t.className="flows-board",t.dataset.flowBoard="true",e.columns.forEach((o,i)=>{t.appendChild(this.renderFlowColumn(o,i))}),t.appendChild(this.renderAddFlowButton(e)),t}renderCenterState(e){const t=document.createElement("div");t.className="flows-center-state";const o=document.createElement("p");return o.className="flows-state-text",o.textContent=e,t.appendChild(o),t}renderFlowColumn(e,t){const i=g(e.flow).collapsed===!0,n=this.getColumnAccentColor(e,t),r=document.createElement("section");return r.className=`flows-column flows-column--${n}${i?" is-collapsed":""}`,r.dataset.flowId=String(e.flow.id),r.dataset.flowColumnDraggable="true",r.appendChild(this.renderCollapsedColumn(e)),r.appendChild(this.renderExpandedColumn(e)),r}renderOrganizeModal(e){const t=e.columns,o=document.createElement("div");o.className="flows-organize-modal",o.setAttribute("role","presentation"),o.addEventListener("click",()=>this.closeOrganizeModal());const i=document.createElement("section");i.className="flows-organize-dialog",i.setAttribute("role","dialog"),i.setAttribute("aria-modal","true"),i.setAttribute("aria-labelledby","flows-organize-title"),i.addEventListener("click",u=>u.stopPropagation());const n=document.createElement("header");n.className="flows-organize-header";const r=document.createElement("div");r.className="flows-organize-title-wrap";const l=m("bars-3",{size:20,strokeWidth:2});l.setAttribute("aria-hidden","true");const a=document.createElement("h2");a.id="flows-organize-title",a.className="flows-organize-title",a.textContent=this.runtime.i18n.t("flows.organize.title"),r.append(l,a);const d=document.createElement("button");d.type="button",d.className="flows-organize-close",d.title=this.runtime.i18n.t("flows.organize.close"),d.setAttribute("aria-label",d.title),d.disabled=this.reorderPendingFlowId!==null,d.appendChild(m("x-mark",{size:19,strokeWidth:2})),d.addEventListener("click",()=>this.closeOrganizeModal()),n.append(r,d);const p=document.createElement("div");if(p.className="flows-organize-body",p.setAttribute("role","list"),t.length===0){const u=document.createElement("p");u.className="flows-organize-empty",u.textContent=this.runtime.i18n.t("flows.organize.empty"),p.appendChild(u)}else t.forEach((u,j)=>{p.appendChild(this.renderOrganizeRow(u,j,t))});const w=document.createElement("footer");w.className="flows-organize-footer";const h=I({text:this.runtime.i18n.t("flows.organize.done"),tone:"primary",size:"sm",className:"flows-organize-done",disabled:this.reorderPendingFlowId!==null,onClick:()=>this.closeOrganizeModal()});return w.appendChild(h),i.append(n,p,w),o.appendChild(i),o}renderOrganizeRow(e,t,o){const i=this.getColumnAccentColor(e,t),n=this.reorderPendingFlowId===e.flow.id,r=document.createElement("div");r.className=`flows-organize-row flows-column--${i}${n?" is-pending":""}`,r.setAttribute("role","listitem"),r.dataset.flowId=String(e.flow.id),r.addEventListener("dragover",h=>{this.handleOrganizeDragOver(h,r,e)}),r.addEventListener("drop",h=>{this.handleOrganizeDrop(h,r,e,t,o)});const l=document.createElement("button");l.type="button",l.className="flows-organize-drag-handle",l.draggable=this.reorderPendingFlowId===null,l.title=this.runtime.i18n.t("flows.organize.drag",{title:e.flow.title}),l.setAttribute("aria-label",l.title),l.disabled=this.reorderPendingFlowId!==null,l.appendChild(m("drag-handle",{size:16})),l.addEventListener("dragstart",h=>{this.startOrganizeDrag(h,r,e)}),l.addEventListener("dragend",()=>{this.resetOrganizeDragState()});const a=document.createElement("div");a.className="flows-organize-row-main";const d=document.createElement("span");d.className="flows-organize-dot",d.setAttribute("aria-hidden","true");const p=document.createElement("span");p.className="flows-organize-label",p.appendChild(this.renderFlowTitleInline(e,"organize")),a.append(l,d,p);const w=document.createElement("div");return w.className="flows-organize-row-actions",w.append(this.renderOrganizeMoveButton({icon:"chevron-up",label:this.runtime.i18n.t("flows.organize.moveUp",{title:e.flow.title}),disabled:t===0||this.reorderPendingFlowId!==null,onClick:()=>void this.moveOrganizeColumn(e.flow.id,t-1)}),this.renderOrganizeMoveButton({icon:"chevron-down",label:this.runtime.i18n.t("flows.organize.moveDown",{title:e.flow.title}),disabled:t===o.length-1||this.reorderPendingFlowId!==null,onClick:()=>void this.moveOrganizeColumn(e.flow.id,t+1)})),r.append(a,w),r}renderOrganizeMoveButton(e){const t=document.createElement("button");return t.type="button",t.className="flows-organize-move",t.title=e.label,t.setAttribute("aria-label",e.label),t.disabled=e.disabled,t.appendChild(m(e.icon,{size:17,strokeWidth:2})),t.addEventListener("click",e.onClick),t}renderFlowTitleInline(e,t){var r;if(((r=this.editingFlowTitleTarget)==null?void 0:r.flowId)===e.flow.id&&this.editingFlowTitleTarget.surface===t){const l=document.createElement("input");return l.type="text",l.className=t==="column"?"flows-column-title-input":"flows-organize-title-input",l.value=e.flow.title,l.maxLength=512,l.autocomplete="off",l.dataset.flowDragIgnore="true",l.setAttribute("aria-label",this.runtime.i18n.t("flows.titlePlaceholder")),l.addEventListener("keydown",a=>{if(a.key==="Enter"){a.preventDefault(),this.finishFlowTitleEdit(e.flow,!0);return}a.key==="Escape"&&(a.preventDefault(),this.finishFlowTitleEdit(e.flow,!1))}),l.addEventListener("blur",()=>{this.finishFlowTitleEdit(e.flow,!0)}),this.flowTitleEditInput=l,requestAnimationFrame(()=>{this.flowTitleEditInput===l&&(l.focus(),l.select())}),l}const i=document.createElement("button");i.type="button",i.className=t==="column"?"flows-column-title-button":"flows-organize-title-button",i.dataset.flowDragIgnore="true",i.title=this.runtime.i18n.t("flows.actions.renameFlow"),i.setAttribute("aria-label",i.title),i.addEventListener("click",()=>{this.startFlowTitleEdit(e.flow.id,t)});const n=document.createElement("span");return n.className=t==="column"?"flows-column-title-text":"flows-organize-title-text",n.textContent=e.flow.title,i.appendChild(n),i}startOrganizeDrag(e,t,o){var i;if(this.reorderPendingFlowId!==null){e.preventDefault();return}this.organizeDraggingFlowId=o.flow.id,(i=e.dataTransfer)==null||i.setData("text/plain",String(o.flow.id)),e.dataTransfer&&(e.dataTransfer.effectAllowed="move"),t.classList.add("is-dragging")}handleOrganizeDragOver(e,t,o){const i=this.organizeDraggingFlowId;if(this.reorderPendingFlowId!==null||i===null||i===o.flow.id)return;e.preventDefault(),e.dataTransfer&&(e.dataTransfer.dropEffect="move");const n=this.resolveOrganizeDropPlacement(e,t);this.clearOrganizeDropIndicators(),this.organizeDragOverFlowId=o.flow.id,this.organizeDragPlacement=n,t.classList.add("is-drag-over",`is-drag-over-${n}`)}async handleOrganizeDrop(e,t,o,i,n){const r=this.readOrganizeDraggedFlowId(e);if(this.reorderPendingFlowId!==null||r===null||r===o.flow.id){this.resetOrganizeDragState();return}e.preventDefault();const l=this.organizeDragOverFlowId===o.flow.id&&this.organizeDragPlacement?this.organizeDragPlacement:this.resolveOrganizeDropPlacement(e,t),a=this.resolveOrganizeInsertionIndex(n,r,i,l);this.resetOrganizeDragState(),await this.moveOrganizeColumn(r,a)}resolveOrganizeDropPlacement(e,t){const o=t.getBoundingClientRect(),i=o.top+o.height/2;return e.clientY>i?"after":"before"}resolveOrganizeInsertionIndex(e,t,o,i){const n=e.findIndex(l=>l.flow.id===t),r=n>=0&&n<o?o-1:o;return i==="after"?r+1:r}readOrganizeDraggedFlowId(e){var i;const t=((i=e.dataTransfer)==null?void 0:i.getData("text/plain"))??"";if(!t.trim())return this.organizeDraggingFlowId;const o=Number(t);return Number.isFinite(o)?o:this.organizeDraggingFlowId}resetOrganizeDragState(){this.organizeDraggingFlowId=null,this.organizeDragOverFlowId=null,this.organizeDragPlacement=null,this.clearOrganizeDropIndicators()}clearOrganizeDropIndicators(){this.element.querySelectorAll(".flows-organize-row.is-dragging, .flows-organize-row.is-drag-over").forEach(e=>{e.classList.remove("is-dragging","is-drag-over","is-drag-over-before","is-drag-over-after")})}async moveOrganizeColumn(e,t){if(this.lastState&&!(t<0||t>=this.lastState.columns.length)&&this.lastState.columns.some(o=>o.flow.id===e)&&B(this.lastState.columns,e,t)){this.reorderPendingFlowId=e,this.renderCurrent();try{await this.handlers.onReorderFlow(e,t)}finally{this.reorderPendingFlowId=null,this.renderCurrent()}}}openOrganizeModal(){this.closeColumnMenu(),this.isOrganizeModalOpen=!0}closeOrganizeModal(){this.reorderPendingFlowId===null&&(this.isOrganizeModalOpen=!1,this.resetOrganizeDragState(),this.renderCurrent())}getColumnAccentColor(e,t){return g(e.flow).color??x(t)}renderCollapsedColumn(e){const t=document.createElement("button");t.type="button",t.className="flows-column-collapsed",t.title=e.flow.title,t.setAttribute("aria-label",this.runtime.i18n.t("flows.expand")),t.addEventListener("click",()=>{this.patchColumnCollapsed(e,!1)});const o=document.createElement("span");o.className="flows-column-collapsed-indicator";const i=document.createElement("span");return i.className="flows-column-collapsed-title",i.textContent=e.flow.title,t.append(o,i),t}renderExpandedColumn(e){const t=document.createElement("div");t.className="flows-column-expanded";const o=document.createElement("header");o.className="flows-column-header";const i=document.createElement("div");i.className="color-line-bar flows-column-color-line-bar",i.setAttribute("aria-hidden","true");const n=document.createElement("div");n.className="flows-column-title-row";const r=document.createElement("div");r.className="flows-column-title-wrap";const l=document.createElement("button");l.type="button",l.className="flows-column-icon-button",l.dataset.flowDragIgnore="true",l.title=this.runtime.i18n.t("flows.collapse"),l.setAttribute("aria-label",l.title),l.appendChild(m("shrink",{size:16,strokeWidth:2})),l.addEventListener("click",()=>{this.patchColumnCollapsed(e,!0)});const a=document.createElement("h2");a.className="flows-column-title",a.appendChild(this.renderFlowTitleInline(e,"column")),r.appendChild(a);const d=document.createElement("div");d.className="flows-column-title-actions",d.append(l,this.renderColumnMenu(e)),n.append(r,d);const p=document.createElement("div");p.className="flows-column-meta-row";const w=g(e.flow);p.append(this.renderFlowStatusSelect(e),this.renderFlowPrioritySelect(e,w)),o.append(i,n,p);const h=document.createElement("div");return h.className="flows-column-task-list",this.appendTaskContent(h,e),t.append(o,h),t}renderColumnMenu(e){const t=document.createElement("div");t.className="flows-column-menu-container";const o=document.createElement("button");return o.type="button",o.className="flows-column-icon-button flows-column-menu-trigger",o.dataset.flowDragIgnore="true",o.title=this.runtime.i18n.t("flows.actions.menu"),o.setAttribute("aria-label",o.title),o.setAttribute("aria-haspopup","menu"),o.setAttribute("aria-expanded","false"),o.appendChild(m("ellipsis-horizontal",{size:18,strokeWidth:2})),o.addEventListener("click",i=>{var n;if(i.stopPropagation(),((n=this.columnMenuPopover)==null?void 0:n.trigger)===o){this.closeColumnMenu();return}this.openColumnMenu(o,e)}),t.appendChild(o),t}openColumnMenu(e,t){this.closeColumnMenu();const o=X({elevated:!0,className:"flows-column-menu hidden"});o.setAttribute("role","menu"),o.addEventListener("mousedown",n=>n.stopPropagation()),o.append(this.renderColumnMenuItem({label:this.runtime.i18n.t("flows.actions.edit"),icon:"pencil",onClick:()=>this.openEditModal(t)}),this.renderColumnMenuItem({label:this.runtime.i18n.t("flows.actions.delete"),icon:"trash",tone:"danger",onClick:()=>void this.deleteFlow(t)}));let i;i=new Y({container:e,panel:o,positioning:"viewport",panelZIndex:290,onOpenChange:n=>{var r;e.setAttribute("aria-expanded",n?"true":"false"),!n&&((r=this.columnMenuPopover)==null?void 0:r.menu)===i&&this.closeColumnMenu()}}),i.mount(),this.columnMenuPopover={menu:i,panel:o,trigger:e},i.openAt({anchor:e,placement:"bottom-end",fallbackPlacements:["bottom-start","top-end","top-start"],gap:6,margin:12,lockPlacementAfterOpen:!0})}renderColumnMenuItem(e){const t=q({label:e.label,tone:e.tone==="danger"?"danger":"default",leading:m(e.icon,{size:15,strokeWidth:2}),className:`flows-column-menu-item${e.tone==="danger"?" flows-column-menu-item--danger":""}`,onClick:o=>{o.stopPropagation(),e.onClick()}});return t.dataset.flowDragIgnore="true",t.setAttribute("role","menuitem"),t}openEditModal(e){const t=g(e.flow);this.closeColumnMenu(),this.editingFlowTitleTarget=null,this.flowTitleEditInput=null,this.isCreatingFlow=!1,this.editingFlowId=e.flow.id,this.editDraft={title:e.flow.title,color:t.color??x(this.getColumnIndex(e.flow.id)),timeProfile:t.timeProfile??"",riskLevel:t.riskLevel??"stable",priority:t.priority},this.editError=null,this.renderCurrent()}openCreateModal(){this.closeColumnMenu(),this.isOrganizeModalOpen=!1,this.editingFlowTitleTarget=null,this.flowTitleEditInput=null,this.isCreatingFlow=!0,this.editingFlowId=null,this.editDraft=this.createNewFlowDraft(),this.editError=null}async deleteFlow(e){this.closeColumnMenu(),window.confirm(this.runtime.i18n.t("flows.delete.confirm",{title:e.flow.title}))&&await this.handlers.onDeleteFlow(e.flow.id)}renderFlowStatusSelect(e){return this.renderMetaSelect({kind:"status",label:this.runtime.i18n.t("flows.fields.status"),icon:this.getStatusIcon(e.flow.status),tone:this.getStatusTone(e.flow.status),value:e.flow.status,options:_.map(t=>({value:t,label:this.getStatusLabel(t)})),onChange:(t,o)=>{!ge(t)||t===e.flow.status||this.patchFlowFromSelect(o,e,{status:t})}})}renderFlowPrioritySelect(e,t){const o=t.priority??c.Medium;return this.renderMetaSelect({kind:"priority",label:this.runtime.i18n.t("flows.fields.priority"),icon:this.getPriorityIcon(o),tone:this.getPriorityTone(o),value:o,options:S.map(i=>({value:i,label:this.getPriorityLabel(i)})),onChange:(i,n)=>{!be(i)||i===t.priority||this.patchFlowFromSelect(n,e,{meta:E(e.flow.meta,{...t,priority:i})})}})}renderMetaSelect(e){const t=document.createElement("label");t.className=`flows-column-meta-select-field flows-column-meta-select-field--${e.kind} flows-column-meta-select-field--${e.tone}`;const o=document.createElement("span");o.className="flows-column-meta-select-label",o.textContent=e.label;const i=document.createElement("span");i.className="flows-column-meta-select-control";const n=m(e.icon,{size:14,strokeWidth:2});n.classList.add("flows-column-meta-select-icon"),n.setAttribute("aria-hidden","true");const r=document.createElement("select");r.className="flows-column-meta-select",r.dataset.flowDragIgnore="true",r.value=e.value,e.options.forEach(a=>{const d=document.createElement("option");d.value=a.value,d.selected=a.value===e.value,d.textContent=a.label,r.appendChild(d)}),r.addEventListener("change",()=>{e.onChange(r.value,r)});const l=m("chevron-down",{size:13,strokeWidth:2});return l.classList.add("flows-column-meta-select-chevron"),l.setAttribute("aria-hidden","true"),i.append(n,r,l),t.append(o,i),t}async patchFlowFromSelect(e,t,o){e.disabled=!0;try{await this.handlers.onPatchFlow(t.flow.id,o)}catch{e.disabled=!1,this.renderCurrent()}}async patchColumnCollapsed(e,t){const o=g(e.flow);await this.handlers.onPatchFlow(e.flow.id,{meta:E(e.flow.meta,{...o,collapsed:t})})}renderRiskBadge(e,t){const o=document.createElement("span"),i=e.tasks.filter(a=>a.priority==="high"||a.priority==="highest").length,n=t.riskLevel??(i>0?"high":e.openTaskCount>e.tasks.length?"medium":"stable");o.className=`flows-column-risk flows-column-risk--${n}`;const r=document.createElement("span");r.className="flows-column-risk-dot",r.setAttribute("aria-hidden","true");const l=document.createElement("span");return l.textContent=n==="high"?this.runtime.i18n.t("flows.risk.high"):n==="medium"?this.runtime.i18n.t("flows.risk.medium"):this.runtime.i18n.t("flows.risk.stable"),o.append(r,l),o}appendTaskContent(e,t){if(t.taskStatus==="loading"){e.appendChild(this.renderColumnState(this.runtime.i18n.t("flows.tasks.loading")));return}if(t.taskStatus==="error"){e.appendChild(this.renderColumnState(this.runtime.i18n.t("flows.tasks.errors.load")));return}t.tasks.forEach(o=>{const i=document.createElement("article");i.className="flows-task-card";const n=document.createElement("p");n.className="flows-task-title",n.textContent=o.title;const r=document.createElement("div");r.className="flows-task-meta",r.append(this.renderTaskMetaItem(o.status),this.renderTaskMetaItem(o.priority)),i.append(n,r),e.appendChild(i)}),e.appendChild(this.renderAddTaskButton())}renderColumnState(e){const t=document.createElement("div");return t.className="flows-column-state",t.textContent=e,t}renderTaskMetaItem(e){const t=document.createElement("span");return t.className="flows-task-meta-item",t.textContent=e,t}renderAddTaskButton(){const e=document.createElement("button");return e.type="button",e.className="flows-add-task-button",e.dataset.flowDragIgnore="true",e.append(m("plus",{size:15,strokeWidth:2}),document.createTextNode(this.runtime.i18n.t("flows.tasks.add"))),e}renderAddFlowButton(e){const t=document.createElement("aside");t.className="flows-add-flow-panel",t.dataset.flowDragIgnore="true";const o=document.createElement("button");return o.type="button",o.className="flows-add-flow-button",o.disabled=e.status==="loading",o.append(m("plus",{size:16,strokeWidth:2}),document.createTextNode(this.runtime.i18n.t("flows.actions.addFlow"))),o.addEventListener("click",()=>{this.openCreateModal(),this.renderCurrent()}),t.appendChild(o),t}renderEditModal(e){const t=e===null,o=this.editDraft??(t?this.createNewFlowDraft():this.createEditDraft(e)),i=document.createElement("div");i.className="flows-edit-modal",i.setAttribute("role","presentation"),i.addEventListener("click",()=>this.closeEditModal());const n=document.createElement("form");n.className="flows-edit-dialog",n.setAttribute("role","dialog"),n.setAttribute("aria-modal","true"),n.setAttribute("aria-labelledby","flows-edit-title"),n.addEventListener("click",u=>u.stopPropagation()),n.addEventListener("submit",u=>{u.preventDefault(),this.submitEditModal(e,n)});const r=document.createElement("header");r.className="flows-edit-header";const l=document.createElement("h2");l.id="flows-edit-title",l.className="flows-edit-title",l.textContent=this.runtime.i18n.t(t?"flows.create.title":"flows.edit.title");const a=document.createElement("button");a.type="button",a.className="flows-edit-close",a.title=this.runtime.i18n.t(t?"flows.create.close":"flows.edit.close"),a.setAttribute("aria-label",a.title),a.appendChild(m("x-mark",{size:18,strokeWidth:2})),a.addEventListener("click",()=>this.closeEditModal()),r.append(l,a);const d=document.createElement("div");if(d.className="flows-edit-body",d.append(this.renderTextField({name:"title",label:this.runtime.i18n.t("flows.edit.name"),value:o.title,placeholder:this.runtime.i18n.t("flows.edit.namePlaceholder")}),this.renderColorField(o.color),this.renderTextField({name:"timeProfile",label:this.runtime.i18n.t("flows.edit.timeProfile"),value:o.timeProfile,placeholder:this.runtime.i18n.t("flows.edit.timeProfilePlaceholder")}),this.renderRiskField(o.riskLevel)),this.editError){const u=document.createElement("p");u.className="flows-edit-error",u.textContent=this.editError,d.appendChild(u)}const p=document.createElement("footer");p.className="flows-edit-footer";const w=document.createElement("button");w.type="button",w.className="flows-edit-secondary",w.textContent=this.runtime.i18n.t("flows.edit.cancel"),w.disabled=this.isSubmittingEdit,w.addEventListener("click",()=>this.closeEditModal());const h=document.createElement("button");return h.type="submit",h.className="flows-edit-primary",h.textContent=this.runtime.i18n.t(this.isSubmittingEdit?t?"flows.create.saving":"flows.edit.saving":t?"flows.create.save":"flows.edit.save"),h.disabled=this.isSubmittingEdit,p.append(w,h),n.append(r,d,p),i.appendChild(n),requestAnimationFrame(()=>{var u;(u=n.querySelector('input[name="title"]'))==null||u.focus()}),i}renderTextField(e){const t=document.createElement("label");t.className="flows-edit-field";const o=document.createElement("span");o.className="flows-edit-label",o.textContent=e.label;const i=document.createElement("input");return i.className="flows-edit-input",i.dataset.flowDragIgnore="true",i.name=e.name,i.type="text",i.value=e.value,i.placeholder=e.placeholder,i.disabled=this.isSubmittingEdit,t.append(o,i),t}renderColorField(e){const t=document.createElement("fieldset");t.className="flows-edit-field flows-edit-color-field";const o=document.createElement("legend");o.className="flows-edit-label",o.textContent=this.runtime.i18n.t("flows.edit.color");const i=document.createElement("div");return i.className="flows-edit-color-row",k.forEach(n=>{const r=document.createElement("label");r.className=`flows-edit-color flows-edit-color--${n}`,r.title=this.runtime.i18n.t(`flows.colors.${n}`);const l=document.createElement("input");l.type="radio",l.dataset.flowDragIgnore="true",l.name="color",l.value=n,l.checked=n===e,l.disabled=this.isSubmittingEdit;const a=document.createElement("span");a.setAttribute("aria-hidden","true"),r.append(l,a),i.appendChild(r)}),t.append(o,i),t}renderRiskField(e){const t=document.createElement("label");t.className="flows-edit-field";const o=document.createElement("span");o.className="flows-edit-label",o.textContent=this.runtime.i18n.t("flows.edit.risk");const i=document.createElement("select");return i.className="flows-edit-select",i.dataset.flowDragIgnore="true",i.name="riskLevel",i.disabled=this.isSubmittingEdit,F.forEach(n=>{const r=document.createElement("option");r.value=n,r.selected=n===e,r.textContent=this.getRiskLabel(n),i.appendChild(r)}),t.append(o,i),t}async submitEditModal(e,t){const o=new FormData(t),i=e===null?this.readCreateDraft(o):this.readEditDraft(o,e);this.editDraft=i,this.editError=null,this.isSubmittingEdit=!0,this.renderCurrent();try{e===null?await this.handlers.onCreateFlow({title:i.title,meta:this.writeDraftPresentation(null,i,null)}):await this.handlers.onPatchFlow(e.flow.id,{title:i.title,meta:this.writeDraftPresentation(e.flow.meta,i,g(e.flow).collapsed)}),this.isSubmittingEdit=!1,this.closeEditModal()}catch{this.isSubmittingEdit=!1,this.editError=this.runtime.i18n.t(e===null?"flows.create.error":"flows.edit.error"),this.renderCurrent()}}writeDraftPresentation(e,t,o){return E(e,{color:t.color,timeProfile:t.timeProfile||null,riskLevel:t.riskLevel,priority:t.priority,collapsed:o})}readCreateDraft(e){var t;return this.readDraftFromForm(e,this.runtime.i18n.t("flows.defaultFlowTitle"),x(((t=this.lastState)==null?void 0:t.columns.length)??0),null)}readEditDraft(e,t){return this.readDraftFromForm(e,t.flow.title,x(this.getColumnIndex(t.flow.id)),g(t.flow).priority)}readDraftFromForm(e,t,o,i){const n=String(e.get("title")??"").trim(),r=String(e.get("color")??""),l=String(e.get("riskLevel")??"");return{title:n||t,color:k.includes(r)?r:o,timeProfile:String(e.get("timeProfile")??"").trim(),riskLevel:F.includes(l)?l:"stable",priority:i}}createEditDraft(e){const t=g(e.flow);return{title:e.flow.title,color:t.color??x(this.getColumnIndex(e.flow.id)),timeProfile:t.timeProfile??"",riskLevel:t.riskLevel??"stable",priority:t.priority}}createNewFlowDraft(){var e;return{title:"",color:x(((e=this.lastState)==null?void 0:e.columns.length)??0),timeProfile:"",riskLevel:"stable",priority:null}}getStatusLabel(e){return this.runtime.i18n.t(`flows.status.${e}`)}getStatusIcon(e){switch(e){case f.Active:return"arrow-path";case f.Completed:return"check-circle";case f.Archived:return"archive-box";case f.Cancelled:return"x-mark";case f.Described:return"map-pin";case f.Draft:default:return"status-pending"}}getStatusTone(e){switch(e){case f.Active:return"blue";case f.Completed:return"emerald";case f.Cancelled:return"rose";case f.Described:return"violet";case f.Draft:return"amber";case f.Archived:default:return"slate"}}getPriorityLabel(e){switch(e){case c.Highest:return this.runtime.i18n.t("priority.highest");case c.High:return this.runtime.i18n.t("priority.high");case c.Low:return this.runtime.i18n.t("priority.low");case c.Lowest:return this.runtime.i18n.t("priority.lowest");case c.Medium:default:return this.runtime.i18n.t("priority.medium")}}getPriorityIcon(e){switch(e){case c.Highest:return"chevron-double-up";case c.High:return"chevron-up";case c.Low:return"chevron-down";case c.Lowest:return"chevron-double-down";case c.Medium:default:return"bars-2"}}getPriorityTone(e){switch(e){case c.Highest:case c.High:return"rose";case c.Low:case c.Lowest:return"blue";case c.Medium:default:return"amber"}}getRiskLabel(e){return e==="high"?this.runtime.i18n.t("flows.risk.high"):e==="medium"?this.runtime.i18n.t("flows.risk.medium"):this.runtime.i18n.t("flows.risk.stable")}getEditingColumn(e){return this.editingFlowId===null?null:e.columns.find(t=>t.flow.id===this.editingFlowId)??null}getColumnIndex(e){var t;return Math.max(0,((t=this.lastState)==null?void 0:t.columns.findIndex(o=>o.flow.id===e))??0)}closeEditModal(){this.isSubmittingEdit||(this.isCreatingFlow=!1,this.editingFlowId=null,this.editDraft=null,this.editError=null,this.renderCurrent())}startFlowTitleEdit(e,t){this.editingFlowTitleTarget={flowId:e,surface:t},this.flowTitleEditInput=null,this.renderCurrent()}finishFlowTitleEdit(e,t){var i,n;if(((i=this.editingFlowTitleTarget)==null?void 0:i.flowId)!==e.id)return;const o=((n=this.flowTitleEditInput)==null?void 0:n.value.trim())??"";if(this.editingFlowTitleTarget=null,this.flowTitleEditInput=null,t&&o.length>0&&o!==e.title){this.handlers.onPatchFlow(e.id,{title:o});return}this.renderCurrent()}renderCurrent(){this.lastState&&this.render(this.lastState)}closeColumnMenu(){const e=this.columnMenuPopover;e&&(this.columnMenuPopover=null,e.trigger.setAttribute("aria-expanded","false"),e.menu.close(),e.menu.unmount(),e.panel.remove())}}function ge(s){return _.includes(s)}function be(s){return S.includes(s)}class xe{constructor(e={}){this.root=null,this.store=null,this.view=null,this.subscriptions=new P,this.runtime=e.runtime??M(),this.flowsApi=e.flowsApi??new Q(new U(G.apiUrl))}mount(e){if(this.root)return;const t=document.createElement("div");t.dataset.module="flows",t.className="h-full w-full",e.appendChild(t),this.root=t;const o=new ne(this.flowsApi),i=new me(t,this.runtime,{onCreateFlow:n=>o.createFlow(n),onPatchFlow:(n,r)=>o.patchFlow(n,r),onReorderFlow:(n,r)=>o.reorderFlowColumns(n,r),onDeleteFlow:n=>o.deleteFlow(n)});this.store=o,this.view=i,this.subscriptions.add(o.state$.subscribe(n=>i.render(n))),this.subscriptions.add(this.runtime.subscribe(()=>{i.render(o.snapshot)})),o.load()}unmount(){var e,t,o;this.subscriptions.unsubscribe(),this.subscriptions=new P,(e=this.store)==null||e.destroy(),this.store=null,(t=this.view)==null||t.destroy(),this.view=null,(o=this.root)==null||o.remove(),this.root=null}}class ke{constructor(e={}){this.id="flows",this.app=null,this.runtime=e.runtime??M()}mount(e){if(this.app)return;const t=new xe({runtime:this.runtime});t.mount(e),this.app=t}unmount(){var e;(e=this.app)==null||e.unmount(),this.app=null}getAiAssistantSnapshot(){return null}}export{ke as FlowsModule};
