import{m as R,S as c,P as u,g as b,D as M,I as _,z as y,J as v,Q as L,V as x,$ as ne,Y as N,Z as V,p as ge,B as be,q as m,u as $,v as W,w as xe,d as q,k as ae,H as ye,e as ve,N as ke,M as Ce}from"./index-CDKLpsbW.js";import{r as Ee}from"./renderInlineComposer-eHHgbT7W.js";function Ie(s){return Array.isArray(s)?s:s.results}function C(s){return encodeURIComponent(String(s))}function Fe(s){return{id:s.id,uuid:s.uuid,title:s.title,status:s.status,priority:s.priority,due_date:s.due_date,is_completed:s.is_completed}}function Se(s={}){const e=[];return s.isCompleted!==void 0&&e.push(`is_completed=${s.isCompleted?"true":"false"}`),s.page!==void 0&&e.push(`page=${encodeURIComponent(s.page.toString())}`),s.pageSize!==void 0&&e.push(`page_size=${encodeURIComponent(s.pageSize.toString())}`),e.length?`?${e.join("&")}`:""}class ze{constructor(e){this.http=e}getFlows(){return this.http.get("/flows/").pipe(R(Ie))}getFlow(e){return this.http.get(`/flows/${C(e)}/`)}getFlowTasks(e,t={}){return this.http.get(`/flows/${C(e)}/tasks/${Se(t)}`)}createFlowTask(e,t){return this.http.post("/tasks/",{...t,flow_ids:[e]}).pipe(R(Fe))}getTask(e){return this.http.get(`/tasks/${encodeURIComponent(String(e))}/`)}patchTask(e,t){return this.http.patch(`/tasks/${encodeURIComponent(String(e))}/`,t)}createFlow(e){return this.http.post("/flows/",e)}updateFlow(e,t){return this.http.put(`/flows/${C(e)}/`,t)}patchFlow(e,t){return this.http.patch(`/flows/${C(e)}/`,t)}deleteFlow(e){return this.http.delete(`/flows/${C(e)}/`)}}const Te=[c.Draft,c.Described,c.Active,c.Completed,c.Archived,c.Cancelled],De=[u.Lowest,u.Low,u.Medium,u.High,u.Highest];function j(s){var i,r;const e=((i=s.goal)==null?void 0:i.id)??s.goal_id??null,t=B(s.goal),o=de(s.story,t);return{id:s.id,uuid:s.uuid,title:s.title,description:s.description??"",status:s.status,priority:s.priority,dueDate:Le(s.due_date),isCompleted:s.is_completed,goalId:e,goal:t,storyId:((r=s.story)==null?void 0:r.id)??s.story_id??null,story:o}}function le(s){const e={};return s.title!==void 0&&(e.title=s.title.trim()),s.description!==void 0&&(e.description=s.description),s.status!==void 0&&(e.status=s.status,s.isCompleted===void 0&&(e.isCompleted=s.status===c.Completed||s.status===c.Archived)),s.priority!==void 0&&(e.priority=s.priority),s.dueDate!==void 0&&(e.dueDate=s.dueDate),s.isCompleted!==void 0&&(e.isCompleted=s.isCompleted),s.goalId!==void 0&&(e.goalId=s.goalId),s.storyId!==void 0&&(e.storyId=s.storyId),e}function U(s,e){const t={};return e.title.trim()!==s.title&&(t.title=e.title.trim()),e.description!==s.description&&(t.description=e.description),e.status!==s.status&&(t.status=e.status),e.priority!==s.priority&&(t.priority=e.priority),e.dueDate!==s.dueDate&&(t.dueDate=e.dueDate),e.goalId!==s.goalId&&(t.goalId=e.goalId),e.storyId!==s.storyId&&(t.storyId=e.storyId),le(t)}function G(s){return Object.keys(s).length===0}function Pe(s,e){var t,o;return{...s,...e.title!==void 0?{title:e.title}:{},...e.description!==void 0?{description:e.description}:{},...e.status!==void 0?{status:e.status}:{},...e.priority!==void 0?{priority:e.priority}:{},...e.dueDate!==void 0?{dueDate:e.dueDate}:{},...e.isCompleted!==void 0?{isCompleted:e.isCompleted}:{},...e.goalId!==void 0?{goalId:e.goalId,goal:e.goalId===((t=s.goal)==null?void 0:t.id)?s.goal:null}:{},...e.storyId!==void 0?{storyId:e.storyId,story:e.storyId===((o=s.story)==null?void 0:o.id)?s.story:null}:{}}}function Y(s,e){var i;const t=(e==null?void 0:e.id)??null,o=t!==null&&((i=s.story)==null?void 0:i.goalId)!==void 0?s.story.goalId===t:!1;return{...s,goal:e,goalId:t,story:o?s.story:null,storyId:o?s.storyId:null}}function K(s,e){if(!e)return{...s,story:null,storyId:null};const t=e.goal??s.goal,o=e.goalId??(t==null?void 0:t.id)??s.goalId;return{...s,story:e,storyId:e.id,goal:(t==null?void 0:t.id)===o?t:null,goalId:o??null}}function B(s){return s?{id:s.id,uuid:s.uuid,title:s.title,status:s.status}:null}function de(s,e=null){var o;if(!s)return null;const t=B(s.goal)??e;return{id:s.id,uuid:s.uuid,title:s.title,status:s.status,goalId:((o=s.goal)==null?void 0:o.id)??s.goal_id??(t==null?void 0:t.id)??null,goal:t}}function Le(s){return s?s instanceof Date?Number.isNaN(s.getTime())?null:s.toISOString().slice(0,10):s.slice(0,10):null}function X(s){return s!==null}class Ae{constructor(e){this.deps=e,this.searchGoals=async t=>{const o=await b(this.deps.goalsApi.searchGoalsForPicker({search:t.query,page:t.page,pageSize:t.pageSize}));return{items:o.results.map(i=>B(i)).filter(X),nextPage:o.next?t.page+1:null}},this.searchStories=async t=>{const o=await b(this.deps.storiesApi.fetchStories({search:t.query,page:t.page,pageSize:t.pageSize,...t.goalId!==null?{goal:t.goalId}:{}}));return{items:o.results.map(i=>de(i)).filter(X),nextPage:o.next?t.page+1:null}}}}function Ne(s){const e={};return s.title!==void 0&&(e.title=s.title),s.description!==void 0&&(e.description=s.description),s.status!==void 0&&(e.status=s.status),s.priority!==void 0&&(e.priority=s.priority),s.dueDate!==void 0&&(e.due_date=s.dueDate),s.isCompleted!==void 0&&(e.is_completed=s.isCompleted),s.goalId!==void 0&&(e.goal_id=s.goalId),s.storyId!==void 0&&(e.story_id=s.storyId),e}const Oe={title:"Discard unsaved changes?",message:"You have unsaved changes. If you close now, your edits will be lost.",keepEditing:"Keep editing",discard:"Discard",saveChanges:"Save changes"};function Me(s={}){const e={...Oe,...s};return new Promise(t=>{let o=!1;const i=f=>{o||(o=!0,t(f))},{overlay:r,container:n,body:a,footer:l}=M(e.title,{onClose:()=>{i("keep-editing"),r.remove()},intent:"confirm",zIndex:280}),d=document.createElement("p");d.className="text-sm leading-relaxed text-slate-600",d.id=`task-unsaved-message-${Math.random().toString(36).slice(2,9)}`,d.textContent=e.message,n.setAttribute("aria-describedby",d.id),a.appendChild(d);const p=_({variant:"confirm"});p.append(y({text:e.saveChanges,tone:"secondary",size:"md",className:`${v("default")} md:mr-auto`,onClick:()=>{i("save-and-close"),r.remove()}}),y({text:e.keepEditing,tone:"text",size:"md",className:v("wide"),onClick:()=>{i("keep-editing"),r.remove()}}),y({text:e.discard,tone:"destructive",size:"md",className:v("medium"),onClick:()=>{i("discard"),r.remove()}})),l.appendChild(p)})}const J="task-edit-modal-styles",_e=`
.task-edit-modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 4px;
}

.task-edit-modal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.task-edit-modal-input,
.task-edit-modal-textarea {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
  color: #0f172a;
  font: inherit;
  font-size: 16px;
  line-height: 1.45;
  outline: none;
  transition: border-color 140ms ease, box-shadow 140ms ease;
}

.task-edit-modal-input {
  min-height: 42px;
  padding: 9px 12px;
}

.task-edit-modal-textarea {
  min-height: 110px;
  max-height: 260px;
  padding: 10px 12px;
  resize: vertical;
}

.task-edit-modal-input:focus,
.task-edit-modal-textarea:focus {
  border-color: #cbd5e1;
  box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.22);
}

.task-edit-modal-input:disabled,
.task-edit-modal-textarea:disabled {
  background: #f8fafc;
  color: #94a3b8;
  cursor: not-allowed;
}

.task-edit-modal-message {
  border-radius: 10px;
  background: #fff1f2;
  color: #be123c;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.45;
  padding: 10px 12px;
}

.task-edit-modal-relation-control {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
}

.task-edit-modal-relation-clear {
  height: 42px;
  width: 42px;
}

@media (min-width: 768px) {
  .task-edit-modal-input,
  .task-edit-modal-textarea {
    font-size: 14px;
  }
}

@media (max-width: 640px) {
  .task-edit-modal-grid {
    grid-template-columns: 1fr;
  }
}
`;function Be(){if(document.getElementById(J))return;const s=document.createElement("style");s.id=J,s.textContent=_e,document.head.appendChild(s)}const He={description:!0,status:!0,priority:!0,dueDate:!0,goal:!0,story:!0},Z={title:"Edit task",titleField:"Title",description:"Description",status:"Status",priority:"Priority",dueDate:"Due date",goal:"Goal",story:"Story",goalPlaceholder:"Select goal",storyPlaceholder:"Select story",goalSearchPlaceholder:"Search goals...",storySearchPlaceholder:"Search stories...",clearRelation:"Clear",clearSearch:"Clear search",loadingOptions:"Loading...",goalEmpty:"No goals found",storyEmpty:"No stories found",goalHint:"Search for a goal",storyHint:"Search for a story",relationSearchError:"Could not load options.",cancel:"Cancel",save:"Save",saving:"Saving...",loading:"Loading task...",loadError:"Could not load task.",saveError:"Could not save task.",titleRequired:"Title is required",closeLabel:"Close",getStatusLabel:Q,getPriorityLabel:Q,unsaved:{title:"Discard unsaved changes?",message:"You have unsaved changes. If you close now, your edits will be lost.",keepEditing:"Keep editing",discard:"Discard",saveChanges:"Save changes"}};class Re{constructor(e){var t;this.options=e,this.overlay=null,this.body=null,this.footer=null,this.saveButton=null,this.dropdowns=[],this.loading=!1,this.loadFailed=!1,this.saving=!1,this.saveFailed=!1,this.titleError=null,this.closed=!1,this.original={...e.task},this.draft={...e.task},this.labels={...Z,...e.labels,unsaved:{...Z.unsaved,...((t=e.labels)==null?void 0:t.unsaved)??{}}},this.capabilities={...He,...e.capabilities??{}}}show(){Be();const{overlay:e,body:t,footer:o,container:i}=M(this.labels.title,{onClose:()=>{this.requestClose()},intent:"form"});this.overlay=e,this.body=t,this.footer=o,i.addEventListener("keydown",r=>{if(r.stopPropagation(),r.key==="Enter"){const n=r.target;if(n instanceof HTMLTextAreaElement||n instanceof HTMLButtonElement)return;r.preventDefault(),this.save()}}),this.render(),this.options.port.loadTask&&this.loadFullTask()}close(e={saved:!1,task:null}){var t,o,i;this.closed||(this.closed=!0,this.destroyDropdowns(),(t=this.overlay)==null||t.remove(),this.overlay=null,(i=(o=this.options).onClose)==null||i.call(o,e))}async loadFullTask(){var e,t;this.loading=!0,this.loadFailed=!1,this.render();try{const o=await((t=(e=this.options.port).loadTask)==null?void 0:t.call(e));if(!o||this.closed)return;this.original={...o},this.draft={...o}}catch{this.loadFailed=!0}finally{this.loading=!1,this.render()}}render(){!this.body||!this.footer||(this.destroyDropdowns(),this.body.replaceChildren(this.renderBody()),this.footer.replaceChildren(this.renderFooter()))}renderBody(){const e=document.createElement("div");if(e.className="task-edit-modal-form",this.loading)return e.appendChild(this.renderMessage(this.labels.loading)),e;if(this.loadFailed)return e.appendChild(this.renderMessage(this.labels.loadError)),e;const t=new L({value:this.draft.title,className:"task-edit-modal-input",disabled:this.saving,onInput:r=>{this.draft.title=r,this.titleError=null}}).createElement();if(e.appendChild(x({label:this.labels.titleField,control:t,required:!0,error:this.titleError??void 0}).element),this.capabilities.description){const r=document.createElement("textarea");r.className="task-edit-modal-textarea",r.value=this.draft.description,r.disabled=this.saving,r.addEventListener("input",()=>{this.draft.description=r.value}),e.appendChild(x({label:this.labels.description,control:r}).element)}const o=document.createElement("div");o.className="task-edit-modal-grid",this.capabilities.status&&o.appendChild(this.renderStatusField()),this.capabilities.priority&&o.appendChild(this.renderPriorityField()),this.capabilities.dueDate&&o.appendChild(this.renderDueDateField()),o.children.length>0&&e.appendChild(o);const i=document.createElement("div");return i.className="task-edit-modal-grid",this.capabilities.goal&&this.options.port.searchGoals&&i.appendChild(this.renderGoalField()),this.capabilities.story&&this.options.port.searchStories&&i.appendChild(this.renderStoryField()),i.children.length>0&&e.appendChild(i),this.saveFailed&&e.appendChild(this.renderMessage(this.labels.saveError)),e}renderFooter(){const e=_({variant:"form"});return e.append(y({text:this.labels.cancel,tone:"text",size:"md",className:v("default"),disabled:this.saving,onClick:()=>{this.requestClose()}})),this.saveButton=y({text:this.labels.save,tone:"primary",size:"md",className:v("default"),disabled:this.loading||this.loadFailed||this.saving,onClick:()=>{this.save()}}),this.saving&&ne(this.saveButton,!0,{text:this.labels.saving}),e.append(this.saveButton),e}renderStatusField(){const e=new N({value:this.draft.status,placeholder:this.labels.status,items:[...Te],getKey:t=>t,getLabel:t=>this.labels.getStatusLabel(t),onSelect:t=>{this.draft.status=t},disabled:this.saving,ariaLabel:this.labels.status,portalTarget:this.overlay??void 0});return this.dropdowns.push(e),x({label:this.labels.status,control:e.element}).element}renderPriorityField(){const e=new N({value:this.draft.priority,placeholder:this.labels.priority,items:[...De],getKey:t=>t,getLabel:t=>this.labels.getPriorityLabel(t),onSelect:t=>{this.draft.priority=t},disabled:this.saving,ariaLabel:this.labels.priority,portalTarget:this.overlay??void 0});return this.dropdowns.push(e),x({label:this.labels.priority,control:e.element}).element}renderDueDateField(){const e=new L({value:this.draft.dueDate??"",type:"date",className:"task-edit-modal-input",disabled:this.saving,onInput:t=>{this.draft.dueDate=t||null}}).createElement();return x({label:this.labels.dueDate,control:e}).element}renderGoalField(){const e=new V({value:this.draft.goal,placeholder:this.labels.goalPlaceholder,searchPlaceholder:this.labels.goalSearchPlaceholder,clearSearchLabel:this.labels.clearSearch,loadingLabel:this.labels.loadingOptions,emptyLabel:this.labels.goalEmpty,hintLabel:this.labels.goalHint,errorFallbackLabel:this.labels.relationSearchError,getKey:t=>String(t.id),getLabel:t=>t.title,onSelect:t=>{this.draft=Y(this.draft,t),this.render()},loadPage:async(t,o,i)=>{const r=await this.options.port.searchGoals({query:t,page:o,pageSize:i});return{items:r.items,hasMore:r.nextPage!==null}},disabled:this.saving,ariaLabel:this.labels.goal,portalTarget:this.overlay??void 0});return this.dropdowns.push(e),this.renderRelationField({label:this.labels.goal,control:e.element,selected:this.draft.goal!==null,onClear:()=>{this.draft=Y(this.draft,null),this.render()}})}renderStoryField(){const e=new V({value:this.draft.story,placeholder:this.labels.storyPlaceholder,searchPlaceholder:this.labels.storySearchPlaceholder,clearSearchLabel:this.labels.clearSearch,loadingLabel:this.labels.loadingOptions,emptyLabel:this.labels.storyEmpty,hintLabel:this.labels.storyHint,errorFallbackLabel:this.labels.relationSearchError,getKey:t=>String(t.id),getLabel:t=>t.title,onSelect:t=>{this.draft=K(this.draft,t),this.render()},loadPage:async(t,o,i)=>{const r=await this.options.port.searchStories({query:t,page:o,pageSize:i,goalId:this.draft.goalId});return{items:r.items,hasMore:r.nextPage!==null}},disabled:this.saving,ariaLabel:this.labels.story,portalTarget:this.overlay??void 0});return this.dropdowns.push(e),this.renderRelationField({label:this.labels.story,control:e.element,selected:this.draft.story!==null,onClear:()=>{this.draft=K(this.draft,null),this.render()}})}renderRelationField(e){const t=document.createElement("div");t.className="task-edit-modal-relation-control",t.appendChild(e.control);const o=ge({icon:"x-mark",ariaLabel:this.labels.clearRelation,size:"sm",tone:"text",className:"task-edit-modal-relation-clear",disabled:this.saving||!e.selected,onClick:e.onClear});return t.appendChild(o),x({label:e.label,control:t}).element}async requestClose(){if(!this.hasUnsavedChanges()){this.close();return}const e=await Me(this.labels.unsaved);if(e==="discard"){this.close();return}e==="save-and-close"&&await this.save()}async save(){if(this.loading||this.saving||this.loadFailed)return;if(this.draft.title.trim().length===0){this.titleError=this.labels.titleRequired,this.render();return}const e=U(this.original,this.draft);if(G(e)){this.close({saved:!1,task:this.original});return}this.saving=!0,this.saveFailed=!1,this.render();try{const t=await this.options.port.saveTaskPatch(e);if(this.closed)return;const o=t??Pe(this.original,e);this.close({saved:!0,task:o})}catch{this.saving=!1,this.saveFailed=!0,this.render()}}hasUnsavedChanges(){return!G(U(this.original,this.draft))}renderMessage(e){const t=document.createElement("div");return t.className="task-edit-modal-message",t.textContent=e,t}destroyDropdowns(){this.dropdowns.splice(0).forEach(e=>e.destroy())}}function Q(s){return s.split(/[_-]/).filter(Boolean).map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ")}const ce=1024;function ue(s,e){const t=O(s),o=O(e);return t!==null||o!==null?(t??ee(s))-(o??ee(e))||s.title.localeCompare(e.title)||s.id-e.id:s.title.localeCompare(e.title)||s.id-e.id}function Ve(s,e,t){const o=s.find(a=>a.flow.id===e);if(!o)return[];const i=s.filter(a=>a.flow.id!==e),r=Math.max(0,Math.min(t,i.length)),n=[...i];return n.splice(r,0,o),n.map((a,l)=>({column:a,pos:(l+1)*ce})).filter(({column:a,pos:l})=>O(a.flow)!==l)}function T(s,e,t){var a,l;const o=$e(s,e,t),i=s.findIndex(d=>d.flow.id===e);if(i<0)return!0;const r=i>0?s[i-1]:null,n=i<s.length-1?s[i+1]:null;return((r==null?void 0:r.flow.id)??null)!==(((a=o.previous)==null?void 0:a.flow.id)??null)||((n==null?void 0:n.flow.id)??null)!==(((l=o.next)==null?void 0:l.flow.id)??null)}function $e(s,e,t){const o=s.filter(r=>r.flow.id!==e),i=Math.max(0,Math.min(t,o.length));return{previous:i>0?o[i-1]:null,next:i<o.length?o[i]:null}}function O(s){const e=he(s.meta),t=e==null?void 0:e.pos;if(typeof t=="number"&&Number.isFinite(t))return t;if(typeof t=="string"&&t.trim()){const o=Number(t);return Number.isFinite(o)?o:null}return null}function pe(s,e){return{...he(s)??{},pos:e}}function ee(s){return s.id*ce}function he(s){return s&&typeof s=="object"&&!Array.isArray(s)?s:null}const We=50,qe={columns:[],status:"idle",error:null};function je(s){return[...s].sort(ue)}class Ue{constructor(e){this.api=e,this.stateSubject=new be(qe),this.state$=this.stateSubject.asObservable(),this.loadVersion=0,this.reorderVersion=0,this.flowPatchVersions=new Map}get snapshot(){return this.stateSubject.value}destroy(){this.loadVersion+=1,this.stateSubject.complete()}async load(){const e=++this.loadVersion;this.patchState({status:"loading",error:null});try{const t=je(await b(this.api.getFlows()));if(e!==this.loadVersion)return;this.patchState({columns:t.map(te),status:"ready",error:null}),await Promise.all(t.map(o=>this.loadColumnTasks(o,e)))}catch{if(e!==this.loadVersion)return;this.patchState({status:"error",error:"flows.errors.load"})}}async patchFlow(e,t){const o=this.snapshot.columns.find(r=>r.flow.id===e)??null,i=(this.flowPatchVersions.get(e)??0)+1;this.flowPatchVersions.set(e,i),o&&this.replaceFlow(Ge(o.flow,t));try{const r=await b(this.api.patchFlow(e,t));this.flowPatchVersions.get(e)===i&&this.replaceFlow(r)}catch(r){throw o&&this.flowPatchVersions.get(e)===i&&this.replaceFlow(o.flow),r}}async createFlow(e){const t=await b(this.api.createFlow(e)),o=this.loadVersion;this.patchState({columns:D([...this.snapshot.columns,te(t)])}),await this.loadColumnTasks(t,o)}async createFlowTask(e,t){const o=t.trim();if(!o)return;const i=await b(this.api.createFlowTask(e,{title:o,description:"",is_standalone:!0})),r=this.snapshot.columns.find(n=>n.flow.id===e);r&&this.patchColumn(e,{tasks:Ke(r.tasks,i),taskStatus:"ready",taskError:null,openTaskCount:i.is_completed?r.openTaskCount:r.openTaskCount+1})}async loadFlowTask(e,t){if(!this.snapshot.columns.some(i=>i.flow.id===e))throw new Error("Flow column is not loaded.");const o=await b(this.api.getTask(t));return j(o)}async patchFlowTask(e,t,o){const i=le(o),r=this.snapshot.columns,n=r.find(a=>a.flow.id===e);n&&this.patchColumn(e,Je(n,t,i));try{const a=await b(this.api.patchTask(t,Ne(i))),l=j(a),d=this.snapshot.columns.find(p=>p.flow.id===e);return d&&this.patchColumn(e,Ze(d,l)),l}catch(a){throw this.patchState({columns:r}),a}}async reorderFlowColumns(e,t){const o=Ve(this.snapshot.columns,e,t);if(o.length===0)return;const i=++this.reorderVersion,r=this.snapshot.columns;this.patchState({columns:Ye(this.snapshot.columns,o)});try{const n=await Promise.all(o.map(({column:l,pos:d})=>b(this.api.patchFlow(l.flow.id,{meta:pe(l.flow.meta,d)}))));if(i!==this.reorderVersion)return;const a=new Map(n.map(l=>[l.id,l]));this.patchState({columns:D(this.snapshot.columns.map(l=>{const d=a.get(l.flow.id);return d?{...l,flow:d}:l}))})}catch(n){throw i===this.reorderVersion&&this.patchState({columns:r}),n}}async deleteFlow(e){await b(this.api.deleteFlow(e)),this.patchState({columns:this.snapshot.columns.filter(t=>t.flow.id!==e)})}async loadColumnTasks(e,t){try{const o=await b(this.api.getFlowTasks(e.id,{isCompleted:!1,page:1,pageSize:We}));if(t!==this.loadVersion)return;this.patchColumn(e.id,{tasks:o.results,taskStatus:"ready",taskError:null,openTaskCount:o.count})}catch{if(t!==this.loadVersion)return;this.patchColumn(e.id,{taskStatus:"error",taskError:"flows.tasks.errors.load"})}}patchColumn(e,t){this.patchState({columns:this.snapshot.columns.map(o=>o.flow.id===e?{...o,...t}:o)})}replaceFlow(e){this.patchState({columns:D(this.snapshot.columns.map(t=>t.flow.id===e.id?{...t,flow:e}:t))})}patchState(e){this.stateSubject.next({...this.snapshot,...e})}}function D(s){return[...s].sort((e,t)=>ue(e.flow,t.flow))}function Ge(s,e){return{...s,...e}}function Ye(s,e){const t=new Map(e.map(({column:o,pos:i})=>[o.flow.id,i]));return D(s.map(o=>{const i=t.get(o.flow.id);return i===void 0?o:{...o,flow:{...o.flow,meta:pe(o.flow.meta,i)}}}))}function Ke(s,e){return s.some(t=>t.id===e.id)?s:[...s,e]}function Xe(s){return String(s.uuid??s.id)}function k(s,e){return Xe(s)===String(e)||String(s.id)===String(e)}function Je(s,e,t){const o=s.tasks.find(r=>k(r,e));if(!o)return{};const i=Qe(o,t);return i.is_completed?{tasks:s.tasks.filter(r=>!k(r,e)),openTaskCount:Math.max(0,s.openTaskCount-1)}:{tasks:s.tasks.map(r=>k(r,e)?i:r)}}function Ze(s,e){const t=e.uuid??e.id,o=s.tasks.some(r=>k(r,t));if(e.isCompleted)return{tasks:s.tasks.filter(r=>!k(r,t)),openTaskCount:o?Math.max(0,s.openTaskCount-1):s.openTaskCount};const i=et(e);return{tasks:o?s.tasks.map(r=>k(r,t)?i:r):[...s.tasks,i],openTaskCount:o?s.openTaskCount:s.openTaskCount+1}}function Qe(s,e){return{...s,...e.title!==void 0?{title:e.title}:{},...e.status!==void 0?{status:e.status}:{},...e.priority!==void 0?{priority:e.priority}:{},...e.dueDate!==void 0?{due_date:e.dueDate}:{},...e.isCompleted!==void 0?{is_completed:e.isCompleted}:{}}}function et(s){return{id:s.id,uuid:s.uuid,title:s.title,status:s.status,priority:s.priority,due_date:s.dueDate,is_completed:s.isCompleted}}function te(s){return{flow:s,tasks:[],taskStatus:"loading",taskError:null,openTaskCount:0}}const F=["indigo","violet","fuchsia","rose","orange","amber","lime","emerald","teal","cyan","blue","slate"],P=["book-open","heart","code-brackets","command-line","computer-desktop","academic-cap","notebook","book-closed","brain","paw","lotus","plant","dumbbell","cooking-pot","currency-dollar","folder","plane","car","health","popcorn","bar-chart"],H=[u.Lowest,u.Low,u.Medium,u.High,u.Highest],tt=new Set(P),ot=new Set(F),it=new Set(H);function E(){return"slate"}function I(){return"folder"}function g(s){var l;const e=A((l=A(s.meta))==null?void 0:l.presentation),t=e==null?void 0:e.icon,o=e==null?void 0:e.color,i=e==null?void 0:e.timeProfile,r=e==null?void 0:e.priority,n=e==null?void 0:e.collapsed,a=e==null?void 0:e.hidden;return{icon:typeof t=="string"&&tt.has(t)?t:null,color:typeof o=="string"&&ot.has(o)?o:null,timeProfile:typeof i=="string"&&i.trim()?i.trim():null,priority:typeof r=="string"&&it.has(r)?r:null,collapsed:typeof n=="boolean"?n:null,hidden:typeof a=="boolean"?a:null}}function S(s,e){const t={...A(s)??{}},o={...A(t.presentation)??{},icon:e.icon,color:e.color,timeProfile:e.timeProfile,priority:e.priority,collapsed:e.collapsed,hidden:e.hidden};return delete o.riskLevel,t.presentation=o,t}function A(s){return s&&typeof s=="object"&&!Array.isArray(s)?s:null}class st{constructor(e){this.renderer=e,this.keys=null,this.collapsedElement=null,this.headerElement=null,this.element=document.createElement("section"),this.expandedElement=document.createElement("div"),this.expandedElement.className="flows-column-expanded",this.taskListElement=document.createElement("div"),this.taskListElement.className="flows-column-task-list",this.expandedElement.appendChild(this.taskListElement),this.element.appendChild(this.expandedElement)}update(e){var o,i,r;const t=this.renderer.getKeys(e);this.element.className=`flows-column${this.renderer.isCollapsed(e)?" is-collapsed":""}`,this.element.dataset.flowId=String(e.flow.id),this.element.dataset.flowColumnDraggable="true",((o=this.keys)==null?void 0:o.collapsed)!==t.collapsed&&this.updateCollapsed(e),((i=this.keys)==null?void 0:i.header)!==t.header&&this.updateHeader(e),((r=this.keys)==null?void 0:r.tasks)!==t.tasks&&this.updateTasks(e),this.keys=t}destroy(){this.element.remove(),this.keys=null,this.collapsedElement=null,this.headerElement=null}updateCollapsed(e){const t=this.renderer.renderCollapsed(e);this.collapsedElement?this.collapsedElement.replaceWith(t):this.element.insertBefore(t,this.expandedElement),this.collapsedElement=t}updateHeader(e){const t=this.renderer.renderHeader(e);this.headerElement?this.headerElement.replaceWith(t):this.expandedElement.insertBefore(t,this.taskListElement),this.headerElement=t}updateTasks(e){this.taskListElement.replaceChildren(),this.renderer.renderTasksInto(this.taskListElement,e)}}const rt=4,oe=44,ie=18;function nt(s){return s.view??window}function at(s){return!s||s.closest(".flows-column-collapsed")?!1:!!s.closest('[data-flow-drag-ignore="true"], button, input, textarea, select')}class lt{constructor(e){this.options=e,this.pending=null,this.active=null,this.eventWindow=null,this.suppressNextClick=!1,this.mounted=!1,this.handleClick=t=>{this.suppressNextClick&&(this.suppressNextClick=!1,t.preventDefault(),t.stopPropagation())},this.handlePointerDown=t=>{if(t.button!==0||t.isPrimary===!1)return;const o=t.target,i=o==null?void 0:o.closest('[data-flow-column-draggable="true"]');if(!i||!this.options.root.contains(i)||at(o))return;const r=Number(i.dataset.flowId),n=this.options.getState();!n||!Number.isFinite(r)||n.columns.some(a=>a.flow.id===r)&&(this.pending={pointerId:t.pointerId,startX:t.clientX,startY:t.clientY,sourceColumnElement:i,flowId:r},this.addWindowListeners(nt(t)))},this.handlePointerMove=t=>{const o=this.pending;if(!o||t.pointerId!==o.pointerId)return;if(!this.active){const r=t.clientX-o.startX,n=t.clientY-o.startY;if(Math.hypot(r,n)<rt)return;this.startDrag(o,t)}const i=this.active;i&&(t.preventDefault(),this.movePreview(i,t.clientX,t.clientY),this.updateDropTarget(i,t.clientX),this.autoScroll(t.clientX))},this.handlePointerUp=t=>{this.pending&&t.pointerId!==this.pending.pointerId||(this.removeWindowListeners(),this.pending=null,this.finishActiveDrag(!0))},this.handlePointerCancel=t=>{this.pending&&t.pointerId!==this.pending.pointerId||this.cancelDrag()},this.handleWindowBlur=()=>{this.cancelDrag()}}mount(){this.mounted||(this.mounted=!0,this.options.root.addEventListener("pointerdown",this.handlePointerDown,!0),this.options.root.addEventListener("click",this.handleClick,!0))}unmount(){this.mounted&&(this.mounted=!1,this.cancelDrag(),this.options.root.removeEventListener("pointerdown",this.handlePointerDown,!0),this.options.root.removeEventListener("click",this.handleClick,!0))}cancelDrag(){this.removeWindowListeners(),this.pending=null,this.finishActiveDrag(!1)}startDrag(e,t){const o=e.sourceColumnElement.getBoundingClientRect(),i=e.sourceColumnElement.cloneNode(!0);i.classList.add("flows-column-drag-preview"),i.style.width=`${o.width}px`,i.style.height=`${o.height}px`,i.style.left=`${o.left}px`,i.style.top=`${o.top}px`;const r=document.createElement("div");r.className="flows-column-drag-placeholder",r.style.width=`${o.width}px`,r.style.flexBasis=`${o.width}px`,r.style.height=`${o.height}px`,e.sourceColumnElement.classList.add("is-dragging"),document.body.append(i),this.active={...e,offsetX:t.clientX-o.left,offsetY:t.clientY-o.top,preview:i,placeholder:r,insertionIndex:null},this.options.root.classList.add("is-flow-column-dragging"),this.movePreview(this.active,t.clientX,t.clientY),this.updateDropTarget(this.active,t.clientX)}movePreview(e,t,o){e.preview.style.left=`${t-e.offsetX}px`,e.preview.style.top=`${o-e.offsetY}px`}updateDropTarget(e,t){const o=this.resolveInsertionIndex(e.flowId,t);if(e.insertionIndex=o,!this.hasActiveTargetChanged(e)){e.placeholder.remove();return}this.placePlaceholder(e,o)}hasActiveTargetChanged(e){const t=this.options.getState();return!!(t&&e.insertionIndex!==null&&T(t.columns,e.flowId,e.insertionIndex))}resolveInsertionIndex(e,t){const o=Array.from(this.options.root.querySelectorAll('[data-flow-column-draggable="true"]')).filter(r=>Number(r.dataset.flowId)!==e),i=o.findIndex(r=>{const n=r.getBoundingClientRect();return t<n.left+n.width/2});return i>=0?i:o.length}placePlaceholder(e,t){const o=this.options.root.querySelector('[data-flow-board="true"]');if(!o)return;const i=Array.from(o.querySelectorAll('[data-flow-column-draggable="true"]')).filter(r=>Number(r.dataset.flowId)!==e.flowId);o.insertBefore(e.placeholder,i[t]??null)}autoScroll(e){const t=this.options.root.querySelector(".flows-body");if(!t)return;const o=t.getBoundingClientRect();e<o.left+oe?t.scrollLeft-=ie:e>o.right-oe&&(t.scrollLeft+=ie)}finishActiveDrag(e){const t=this.active;t&&(this.active=null,t.preview.remove(),t.placeholder.remove(),t.sourceColumnElement.classList.remove("is-dragging"),this.options.root.classList.remove("is-flow-column-dragging"),this.suppressNextClick=!0,e&&this.hasActiveTargetChanged(t)&&t.insertionIndex!==null&&this.options.onDrop(t.flowId,t.insertionIndex))}addWindowListeners(e){this.eventWindow=e,e.addEventListener("pointermove",this.handlePointerMove,!0),e.addEventListener("pointerup",this.handlePointerUp,!0),e.addEventListener("pointercancel",this.handlePointerCancel,!0),e.addEventListener("blur",this.handleWindowBlur,!0)}removeWindowListeners(){const e=this.eventWindow??window;this.eventWindow=null,e.removeEventListener("pointermove",this.handlePointerMove,!0),e.removeEventListener("pointerup",this.handlePointerUp,!0),e.removeEventListener("pointercancel",this.handlePointerCancel,!0),e.removeEventListener("blur",this.handleWindowBlur,!0)}}const se="flows-styles",dt=`
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

.flows-flow-icon {
  flex: 0 0 auto;
}

.flows-column-collapsed-icon {
  margin-top: 1px;
}

.flows-flow-icon--indigo { color: #818cf8; }
.flows-flow-icon--violet { color: #a78bfa; }
.flows-flow-icon--fuchsia { color: #e879f9; }
.flows-flow-icon--rose { color: #fb7185; }
.flows-flow-icon--orange { color: #fb923c; }
.flows-flow-icon--amber { color: #fbbf24; }
.flows-flow-icon--lime { color: #84cc16; }
.flows-flow-icon--emerald { color: #10b981; }
.flows-flow-icon--teal { color: #14b8a6; }
.flows-flow-icon--cyan { color: #06b6d4; }
.flows-flow-icon--blue { color: #3b82f6; }
.flows-flow-icon--slate { color: #64748b; }

.flows-appearance-button {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  padding: 0;
  transition: background-color 140ms ease, color 140ms ease;
}

.flows-appearance-button:hover,
.flows-appearance-button:focus-visible,
.flows-appearance-button[aria-expanded="true"] {
  background: #f1f5f9;
  outline: none;
}

.flows-column-title-icon-button {
  width: 28px;
  height: 28px;
  border-radius: 8px;
}

.flows-edit-title-icon-button {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #f8fafc;
  box-shadow: inset 0 0 0 1px #e2e8f0;
}

.flows-appearance-popover {
  display: grid;
  width: 236px;
  gap: 12px;
  border: 1px solid rgba(226, 232, 240, 0.92);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.16);
  padding: 12px;
}

.flows-appearance-icon-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 6px;
}

.flows-appearance-icon-option,
.flows-appearance-color-option {
  border: 0;
  background: transparent;
  cursor: pointer;
  padding: 0;
}

.flows-appearance-icon-option {
  display: inline-flex;
  width: 22px;
  height: 22px;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  transition: background-color 140ms ease, box-shadow 140ms ease;
}

.flows-appearance-icon-option:hover,
.flows-appearance-icon-option.is-selected {
  background: #f8fafc;
  box-shadow: inset 0 0 0 1px currentColor;
}

.flows-appearance-color-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.flows-appearance-color-option {
  display: inline-flex;
  width: 22px;
  height: 22px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  transition: box-shadow 140ms ease, transform 140ms ease;
}

.flows-appearance-color-option span {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: var(--flow-edit-color, #94a3b8);
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.08);
}

.flows-appearance-color-option:hover {
  transform: scale(1.06);
}

.flows-appearance-color-option.is-selected {
  box-shadow:
    0 0 0 2px #ffffff,
    0 0 0 4px var(--flow-edit-color, #94a3b8);
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
  display: block;
  width: 100%;
  border: var(--flows-card-border);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: var(--flows-card-shadow);
  cursor: pointer;
  padding: 14px;
  text-align: left;
  transition: background-color 140ms ease, box-shadow 140ms ease;
}

.flows-task-card:hover {
  background: #f7f8f9;
}

.flows-task-card:disabled {
  cursor: default;
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

.flows-task-composer {
  width: 100%;
  flex: 0 0 auto;
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

.flows-task-composer-expanded {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.flows-task-composer-textarea {
  width: 100%;
  min-height: 64px;
  max-height: 160px;
  border: 0;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: var(--flows-card-shadow);
  color: #334155;
  font: inherit;
  font-size: 16px;
  line-height: 1.45;
  outline: none;
  overflow-y: auto;
  padding: 10px 12px;
  resize: none;
}

.flows-task-composer-textarea::placeholder {
  color: #94a3b8;
}

.flows-task-composer-textarea:focus-visible {
  box-shadow: var(--flows-card-shadow), 0 0 0 2px rgba(148, 163, 184, 0.28);
}

.flows-task-composer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.flows-task-composer-error {
  margin-top: 6px;
  color: #e11d48;
  font-size: 12px;
  font-weight: 650;
  line-height: 1.35;
}

@media (min-width: 768px) {
  .flows-task-composer-textarea {
    font-size: 13px;
  }
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

.flows-organize-row.is-hidden .flows-organize-icon {
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
  box-shadow: inset 0 0 0 2px #cbd5e1;
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

.flows-edit-container {
  max-width: 28rem;
}

.flows-edit-dialog {
  display: grid;
  gap: 16px;
  margin: 0;
}

.flows-edit-field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.flows-edit-title-control-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.flows-edit-title-input {
  min-width: 0;
  flex: 1 1 auto;
}

.flows-edit-dropdown {
  min-width: 0;
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
`;function ct(){if(document.getElementById(se))return;const s=document.createElement("style");s.id=se,s.textContent=dt,document.head.appendChild(s)}const re="default",fe=[c.Draft,c.Described,c.Active,c.Completed,c.Archived,c.Cancelled],ut=8;class pt{constructor(e,t,o){this.parent=e,this.runtime=t,this.handlers=o,this.pageElement=null,this.headerElement=null,this.bodyElement=null,this.boardElement=null,this.overlayHost=null,this.addFlowPanelElement=null,this.columnViews=new Map,this.isOrganizeModalOpen=!1,this.organizeDraggingFlowId=null,this.organizeDragOverFlowId=null,this.organizeDragPlacement=null,this.organizeDropInsertionIndex=null,this.reorderPendingFlowId=null,this.columnMenuPopover=null,this.appearancePopover=null,this.editingFlowTitleTarget=null,this.flowTitleEditInput=null,this.isCreatingFlow=!1,this.editingFlowId=null,this.editDraft=null,this.editError=null,this.isSubmittingEdit=!1,this.expandedTaskComposerFlowId=null,this.taskComposerSubmittingFlowId=null,this.taskComposerErrorFlowId=null,this.taskDrafts=new Map,this.taskEditModal=null,this.lastState=null,this.dropdownDisposers=[],ct(),this.element=document.createElement("div"),this.element.id="flows-root",this.element.dataset.module="flows",this.parent.appendChild(this.element),this.columnDragController=new lt({root:this.element,getState:()=>this.lastState,onDrop:(i,r)=>{this.handlers.onReorderFlow(i,r)}}),this.columnDragController.mount()}render(e){this.disposeDropdownControls(),this.lastState=e,this.ensureShell(),this.syncHeader(e),this.syncBody(e),this.syncOverlays(e),this.closeDisconnectedPopovers()}destroy(){this.closeColumnMenu(),this.closeAppearancePopover(),this.disposeDropdownControls(),this.closeTaskEditModal(),this.columnDragController.unmount(),this.destroyColumnViews(),this.taskDrafts.clear(),this.element.remove()}ensureShell(){if(this.pageElement&&this.bodyElement&&this.overlayHost)return;const e=document.createElement("div");e.className="flows-page";const t=document.createElement("main");t.className="flows-body";const o=document.createElement("div");o.className="flows-overlay-host",e.append(t,o),this.element.replaceChildren(e),this.pageElement=e,this.bodyElement=t,this.overlayHost=o}syncHeader(e){var o;const t=this.renderHeader(e);this.headerElement?this.headerElement.replaceWith(t):(o=this.pageElement)==null||o.prepend(t),this.headerElement=t}syncBody(e){if(!this.bodyElement)return;if(e.status==="loading"||e.status==="idle"){this.renderBodyCenterState(this.runtime.i18n.t("flows.loading"));return}if(e.status==="error"){this.renderBodyCenterState(this.runtime.i18n.t("flows.errors.load"));return}if(e.columns.length===0){this.renderBodyCenterState(this.runtime.i18n.t("flows.empty"));return}const t=e.columns.filter(o=>g(o.flow).hidden!==!0);this.syncBoard(t,e)}renderBodyCenterState(e){this.bodyElement&&(this.destroyColumnViews(),this.boardElement=null,this.addFlowPanelElement=null,this.bodyElement.replaceChildren(this.renderCenterState(e)))}syncBoard(e,t){var r;if(!this.bodyElement)return;const o=this.ensureBoard(),i=new Set(e.map(n=>n.flow.id));for(const[n,a]of this.columnViews)i.has(n)||(a.destroy(),this.columnViews.delete(n));e.forEach(n=>{const a=this.getOrCreateColumnView(n.flow.id);a.update(n),o.appendChild(a.element)}),(r=this.addFlowPanelElement)==null||r.remove(),this.addFlowPanelElement=this.renderAddFlowButton(t),o.appendChild(this.addFlowPanelElement)}ensureBoard(){if(!this.bodyElement)throw new Error("Flows body must exist before rendering board");return this.boardElement||(this.boardElement=document.createElement("div"),this.boardElement.className="flows-board",this.boardElement.dataset.flowBoard="true"),this.boardElement.parentElement!==this.bodyElement&&this.bodyElement.replaceChildren(this.boardElement),this.boardElement}getOrCreateColumnView(e){const t=this.columnViews.get(e);if(t)return t;const o=new st({getKeys:i=>this.getColumnViewKeys(i),isCollapsed:i=>g(i.flow).collapsed===!0,renderCollapsed:i=>this.renderCollapsedColumn(i,this.getColumnVisual(i)),renderHeader:i=>this.renderColumnHeader(i,this.getColumnVisual(i)),renderTasksInto:(i,r)=>this.appendTaskContent(i,r)});return this.columnViews.set(e,o),o}destroyColumnViews(){for(const e of this.columnViews.values())e.destroy();this.columnViews.clear()}syncOverlays(e){if(!this.overlayHost)return;this.clearOverlayHost();const t=this.getEditingColumn(e);t&&this.overlayHost.appendChild(this.renderEditModal(t)),this.isCreatingFlow&&this.overlayHost.appendChild(this.renderEditModal(null)),this.isOrganizeModalOpen&&this.overlayHost.appendChild(this.renderOrganizeModal(e))}clearOverlayHost(){if(this.overlayHost)for(;this.overlayHost.firstChild;)this.overlayHost.firstChild.remove()}renderHeader(e){const t=document.createElement("header");t.className="flows-header";const o=document.createElement("div");o.className="flows-header-title-block";const i=document.createElement("div");i.className="flows-header-title-row";const r=document.createElement("h1");return r.className="flows-header-title",r.textContent=this.runtime.i18n.t("flows.title"),i.append(r,this.renderHeaderActionButton({label:this.runtime.i18n.t("flows.actions.organize"),icon:"bars-3",pressed:this.isOrganizeModalOpen,onClick:()=>{this.openOrganizeModal(),this.renderCurrent()}}),this.renderHeaderActionButton({label:this.runtime.i18n.t("flows.actions.create"),icon:"plus",disabled:e.status==="loading",onClick:()=>{this.openCreateModal(),this.renderCurrent()}})),o.appendChild(i),t.appendChild(o),t}renderHeaderActionButton(e){const t=y({text:"",tone:"text",size:"sm",className:"flows-header-action",title:e.label,ariaLabel:e.label,disabled:e.disabled,onClick:e.onClick});e.pressed!==void 0&&t.setAttribute("aria-pressed",e.pressed?"true":"false");const o=m(e.icon,{size:16,strokeWidth:2});o.setAttribute("aria-hidden","true");const i=document.createElement("span");return i.textContent=e.label,t.append(o,i),t}renderCenterState(e){const t=document.createElement("div");t.className="flows-center-state";const o=document.createElement("p");return o.className="flows-state-text",o.textContent=e,t.appendChild(o),t}getColumnViewKeys(e){var n;const t=e.flow.id,o=this.getColumnVisual(e),i=g(e.flow),r=((n=this.editingFlowTitleTarget)==null?void 0:n.surface)==="column"&&this.editingFlowTitleTarget.flowId===t;return{root:JSON.stringify({flowId:t,collapsed:i.collapsed===!0}),collapsed:JSON.stringify({title:e.flow.title,visual:o}),header:JSON.stringify({flow:e.flow,visual:o,editingTitle:r}),tasks:JSON.stringify({tasks:e.tasks,taskStatus:e.taskStatus,taskError:e.taskError,openTaskCount:e.openTaskCount,taskComposerExpanded:this.expandedTaskComposerFlowId===t,taskComposerSubmitting:this.taskComposerSubmittingFlowId===t,taskComposerError:this.taskComposerErrorFlowId===t,taskDraft:this.taskDrafts.get(t)??null})}}renderOrganizeModal(e){const t=e.columns,o=t.length>=ut,i=document.createElement("div");i.className="flows-organize-modal",i.setAttribute("role","presentation"),i.addEventListener("click",()=>this.closeOrganizeModal());const r=document.createElement("section");r.className=`flows-organize-dialog${o?" flows-organize-dialog--multi-column":""}`,r.setAttribute("role","dialog"),r.setAttribute("aria-modal","true"),r.setAttribute("aria-labelledby","flows-organize-title"),r.addEventListener("click",w=>w.stopPropagation());const n=document.createElement("header");n.className="flows-organize-header";const a=document.createElement("div");a.className="flows-organize-title-wrap";const l=m("bars-3",{size:20,strokeWidth:2});l.setAttribute("aria-hidden","true");const d=document.createElement("h2");d.id="flows-organize-title",d.className="flows-organize-title",d.textContent=this.runtime.i18n.t("flows.organize.title"),a.append(l,d);const p=document.createElement("button");p.type="button",p.className="flows-organize-close",p.title=this.runtime.i18n.t("flows.organize.close"),p.setAttribute("aria-label",p.title),p.disabled=this.reorderPendingFlowId!==null,p.appendChild(m("x-mark",{size:19,strokeWidth:2})),p.addEventListener("click",()=>this.closeOrganizeModal()),n.append(a,p);const f=document.createElement("div");if(f.className=`flows-organize-body${o?" flows-organize-body--multi-column":""}`,f.setAttribute("role","list"),f.addEventListener("dragover",w=>{this.handleOrganizeBodyDragOver(w)}),f.addEventListener("drop",w=>{this.handleOrganizeBodyDrop(w,t)}),t.length===0){const w=document.createElement("p");w.className="flows-organize-empty",w.textContent=this.runtime.i18n.t("flows.organize.empty"),f.appendChild(w)}else t.forEach((w,we)=>{f.appendChild(this.renderOrganizeRow(w,we,t))});const h=document.createElement("footer");h.className="flows-organize-footer";const me=y({text:this.runtime.i18n.t("flows.organize.done"),tone:"primary",size:"sm",className:"flows-organize-done",disabled:this.reorderPendingFlowId!==null,onClick:()=>this.closeOrganizeModal()});return h.appendChild(me),r.append(n,f,h),i.appendChild(r),i}renderOrganizeRow(e,t,o){const i=this.getColumnVisual(e),r=g(e.flow),n=this.reorderPendingFlowId===e.flow.id,a=document.createElement("div");a.className=`flows-organize-row${n?" is-pending":""}${r.hidden===!0?" is-hidden":""}`,a.setAttribute("role","listitem"),a.dataset.flowId=String(e.flow.id),a.addEventListener("dragover",h=>{this.handleOrganizeDragOver(h,a,e,t,o)}),a.addEventListener("drop",h=>{this.handleOrganizeDrop(h,a,e,t,o)});const l=document.createElement("button");l.type="button",l.className="flows-organize-drag-handle",l.draggable=this.reorderPendingFlowId===null,l.title=this.runtime.i18n.t("flows.organize.drag",{title:e.flow.title}),l.setAttribute("aria-label",l.title),l.disabled=this.reorderPendingFlowId!==null,l.appendChild(m("drag-handle",{size:16})),l.addEventListener("dragstart",h=>{this.startOrganizeDrag(h,a,e)}),l.addEventListener("dragend",()=>{this.resetOrganizeDragState()});const d=document.createElement("div");d.className="flows-organize-row-main";const p=this.renderFlowVisualIcon(i,"flows-organize-icon",16),f=document.createElement("span");return f.className="flows-organize-label",f.appendChild(this.renderFlowTitleInline(e,"organize")),d.append(l,p,f),a.append(d,this.renderOrganizeHideButton(e,r)),a}renderOrganizeHideButton(e,t){const o=t.hidden===!0,i=this.runtime.i18n.t(o?"flows.organize.show":"flows.organize.hide"),r=document.createElement("button");return r.type="button",r.className=`flows-organize-hide${o?" is-hidden":""}`,r.dataset.flowDragIgnore="true",r.disabled=this.reorderPendingFlowId!==null,r.title=i,r.setAttribute("aria-label",i),r.appendChild(m(o?"eye":"eye-slash",{size:16,strokeWidth:2})),r.addEventListener("click",()=>{this.patchFlowHidden(e,!o)}),r}renderFlowTitleInline(e,t){var n;if(((n=this.editingFlowTitleTarget)==null?void 0:n.flowId)===e.flow.id&&this.editingFlowTitleTarget.surface===t){const a=document.createElement("input");return a.type="text",a.className=t==="column"?"flows-column-title-input":"flows-organize-title-input",a.value=e.flow.title,a.maxLength=512,a.autocomplete="off",a.dataset.flowDragIgnore="true",a.setAttribute("aria-label",this.runtime.i18n.t("flows.titlePlaceholder")),a.addEventListener("keydown",l=>{if(l.key==="Enter"){l.preventDefault(),this.finishFlowTitleEdit(e.flow,!0);return}l.key==="Escape"&&(l.preventDefault(),this.finishFlowTitleEdit(e.flow,!1))}),a.addEventListener("blur",()=>{this.finishFlowTitleEdit(e.flow,!0)}),this.flowTitleEditInput=a,requestAnimationFrame(()=>{this.flowTitleEditInput===a&&(a.focus(),a.select())}),a}const i=document.createElement("button");i.type="button",i.className=t==="column"?"flows-column-title-button":"flows-organize-title-button",i.dataset.flowDragIgnore="true",i.title=this.runtime.i18n.t("flows.actions.renameFlow"),i.setAttribute("aria-label",i.title),i.addEventListener("click",()=>{this.startFlowTitleEdit(e.flow.id,t)});const r=document.createElement("span");return r.className=t==="column"?"flows-column-title-text":"flows-organize-title-text",r.textContent=e.flow.title,i.appendChild(r),i}startOrganizeDrag(e,t,o){var i;if(this.reorderPendingFlowId!==null){e.preventDefault();return}this.organizeDraggingFlowId=o.flow.id,(i=e.dataTransfer)==null||i.setData("text/plain",String(o.flow.id)),e.dataTransfer&&(e.dataTransfer.effectAllowed="move"),t.classList.add("is-dragging")}handleOrganizeDragOver(e,t,o,i,r){const n=this.organizeDraggingFlowId;if(this.reorderPendingFlowId!==null||n===null||n===o.flow.id)return;e.preventDefault(),e.dataTransfer&&(e.dataTransfer.dropEffect="move");const a=this.resolveOrganizeDropPlacement(e,t),l=this.resolveOrganizeInsertionIndex(r,n,i,a);this.organizeDragOverFlowId=o.flow.id,this.organizeDragPlacement=a,this.organizeDropInsertionIndex=l,this.placeOrganizeDropPlaceholder({row:t,placement:a,show:T(r,n,l)})}async handleOrganizeDrop(e,t,o,i,r){const n=this.readOrganizeDraggedFlowId(e);if(this.reorderPendingFlowId!==null||n===null||n===o.flow.id){this.resetOrganizeDragState();return}e.preventDefault();const a=this.organizeDragOverFlowId===o.flow.id&&this.organizeDragPlacement?this.organizeDragPlacement:this.resolveOrganizeDropPlacement(e,t),l=this.organizeDragOverFlowId===o.flow.id&&this.organizeDragPlacement&&this.organizeDropInsertionIndex!==null?this.organizeDropInsertionIndex:this.resolveOrganizeInsertionIndex(r,n,i,a);e.stopPropagation(),this.resetOrganizeDragState(),await this.moveOrganizeColumn(n,l)}async handleOrganizeBodyDrop(e,t){const o=this.readOrganizeDraggedFlowId(e),i=this.organizeDropInsertionIndex;if(this.reorderPendingFlowId!==null||o===null||i===null){this.resetOrganizeDragState();return}e.preventDefault(),this.resetOrganizeDragState(),T(t,o,i)&&await this.moveOrganizeColumn(o,i)}handleOrganizeBodyDragOver(e){this.reorderPendingFlowId!==null||this.organizeDraggingFlowId===null||this.organizeDropInsertionIndex===null||(e.preventDefault(),e.dataTransfer&&(e.dataTransfer.dropEffect="move"))}resolveOrganizeDropPlacement(e,t){const o=t.getBoundingClientRect(),i=o.top+o.height/2;return e.clientY>i?"after":"before"}resolveOrganizeInsertionIndex(e,t,o,i){const r=e.findIndex(a=>a.flow.id===t),n=r>=0&&r<o?o-1:o;return i==="after"?n+1:n}placeOrganizeDropPlaceholder(e){if(this.element.querySelectorAll(".flows-organize-drop-placeholder").forEach(i=>i.remove()),!e.show)return;const t=e.row.parentElement;if(!t)return;const o=document.createElement("div");o.className="flows-organize-drop-placeholder",o.setAttribute("aria-hidden","true"),t.insertBefore(o,e.placement==="before"?e.row:e.row.nextElementSibling)}readOrganizeDraggedFlowId(e){var i;const t=((i=e.dataTransfer)==null?void 0:i.getData("text/plain"))??"";if(!t.trim())return this.organizeDraggingFlowId;const o=Number(t);return Number.isFinite(o)?o:this.organizeDraggingFlowId}resetOrganizeDragState(){this.organizeDraggingFlowId=null,this.organizeDragOverFlowId=null,this.organizeDragPlacement=null,this.organizeDropInsertionIndex=null,this.clearOrganizeDropIndicators()}clearOrganizeDropIndicators(){this.element.querySelectorAll(".flows-organize-row.is-dragging").forEach(e=>{e.classList.remove("is-dragging")}),this.element.querySelectorAll(".flows-organize-drop-placeholder").forEach(e=>e.remove())}async moveOrganizeColumn(e,t){if(this.lastState&&!(t<0||t>=this.lastState.columns.length)&&this.lastState.columns.some(o=>o.flow.id===e)&&T(this.lastState.columns,e,t)){this.reorderPendingFlowId=e,this.renderCurrent();try{await this.handlers.onReorderFlow(e,t)}finally{this.reorderPendingFlowId=null,this.renderCurrent()}}}openOrganizeModal(){this.closeColumnMenu(),this.isOrganizeModalOpen=!0}closeOrganizeModal(){this.reorderPendingFlowId===null&&(this.isOrganizeModalOpen=!1,this.resetOrganizeDragState(),this.renderCurrent())}getColumnVisual(e){const t=g(e.flow);return{icon:t.icon??I(),color:t.color??E()}}renderFlowVisualIcon(e,t,o){const i=m(e.icon,{size:o,strokeWidth:1.8});return i.classList.add("flows-flow-icon",t,`flows-flow-icon--${e.color}`),i.setAttribute("aria-hidden","true"),i}renderFlowAppearanceButton(e){const t=document.createElement("button");return t.type="button",t.className=`flows-appearance-button ${e.className}`,t.dataset.flowDragIgnore="true",t.title=this.runtime.i18n.t("flows.edit.appearance"),t.setAttribute("aria-label",t.title),t.setAttribute("aria-haspopup","dialog"),t.setAttribute("aria-expanded","false"),t.dataset.flowAppearanceIconClass=e.iconClassName,t.dataset.flowAppearanceIconSize=String(e.size),t.appendChild(this.renderFlowVisualIcon(e.visual,e.iconClassName,e.size)),t.addEventListener("click",o=>{o.stopPropagation(),this.openAppearancePopover(t,e.column,e.visual)}),t}openAppearancePopover(e,t,o){var n;if(((n=this.appearancePopover)==null?void 0:n.trigger)===e){this.closeAppearancePopover();return}this.closeAppearancePopover(),this.closeColumnMenu();const i=$({elevated:!0,className:"flows-appearance-popover hidden"});i.setAttribute("role","dialog"),i.setAttribute("aria-label",this.runtime.i18n.t("flows.edit.appearance")),i.dataset.flowAppearanceIcon=o.icon,i.dataset.flowAppearanceColor=o.color,i.addEventListener("mousedown",a=>a.stopPropagation()),i.append(this.renderAppearanceIconGrid(i,e,t),this.renderAppearanceColorRow(i,e,t));const r=new W({container:e,panel:i,positioning:"viewport",panelZIndex:300,onOpenChange:a=>{var l;e.setAttribute("aria-expanded",a?"true":"false"),!a&&((l=this.appearancePopover)==null?void 0:l.menu)===r&&this.closeAppearancePopover()}});this.appearancePopover={menu:r,panel:i,trigger:e},r.mount(),r.openAt({anchor:e,placement:"bottom-start",fallbackPlacements:["top-start","bottom-end","top-end"],gap:6,margin:8}),this.syncAppearancePopover(i,e)}renderAppearanceIconGrid(e,t,o){const i=document.createElement("div");return i.className="flows-appearance-icon-grid",P.forEach(r=>{const n=document.createElement("button");n.type="button",n.className="flows-appearance-icon-option",n.dataset.flowAppearanceIconOption=r,n.title=this.getThemeIconLabel(r),n.setAttribute("aria-label",n.title),n.appendChild(m(r,{size:18,strokeWidth:1.8})),n.addEventListener("click",()=>{this.applyAppearanceSelection(e,t,o,{icon:r})}),i.appendChild(n)}),i}renderAppearanceColorRow(e,t,o){const i=document.createElement("div");return i.className="flows-appearance-color-row",F.forEach(r=>{const n=document.createElement("button");n.type="button",n.className=`flows-appearance-color-option flows-edit-color--${r}`,n.dataset.flowAppearanceColorOption=r,n.title=this.runtime.i18n.t(`flows.colors.${r}`),n.setAttribute("aria-label",n.title);const a=document.createElement("span");a.setAttribute("aria-hidden","true"),n.appendChild(a),n.addEventListener("click",()=>{this.applyAppearanceSelection(e,t,o,{color:r})}),i.appendChild(n)}),i}applyAppearanceSelection(e,t,o,i){const r={icon:i.icon??this.readPopoverIcon(e),color:i.color??this.readPopoverColor(e)};e.dataset.flowAppearanceIcon=r.icon,e.dataset.flowAppearanceColor=r.color,this.syncAppearancePopover(e,t),this.editDraft&&(this.editDraft={...this.editDraft,icon:r.icon,color:r.color}),o&&this.patchFlowAppearance(o,r)}syncAppearancePopover(e,t){const o={icon:this.readPopoverIcon(e),color:this.readPopoverColor(e)},i=t.dataset.flowAppearanceIconClass??"flows-appearance-button-icon",r=Number(t.dataset.flowAppearanceIconSize);t.replaceChildren(this.renderFlowVisualIcon(o,i,Number.isFinite(r)?r:18)),e.querySelectorAll(".flows-appearance-icon-option").forEach(n=>{const a=n.dataset.flowAppearanceIconOption===o.icon;n.classList.toggle("is-selected",a),n.setAttribute("aria-pressed",a?"true":"false"),F.forEach(l=>{n.classList.remove(`flows-flow-icon--${l}`)}),n.classList.add(`flows-flow-icon--${o.color}`)}),e.querySelectorAll(".flows-appearance-color-option").forEach(n=>{const a=n.dataset.flowAppearanceColorOption===o.color;n.classList.toggle("is-selected",a),n.setAttribute("aria-pressed",a?"true":"false")})}readPopoverIcon(e){const t=e.dataset.flowAppearanceIcon??"";return P.includes(t)?t:I()}readPopoverColor(e){const t=e.dataset.flowAppearanceColor??"";return F.includes(t)?t:E()}async patchFlowAppearance(e,t){const o=g(e.flow);await this.handlers.onPatchFlow(e.flow.id,{meta:S(e.flow.meta,{...o,icon:t.icon,color:t.color})})}renderCollapsedColumn(e,t){const o=document.createElement("button");o.type="button",o.className="flows-column-collapsed",o.title=e.flow.title,o.setAttribute("aria-label",this.runtime.i18n.t("flows.expand")),o.addEventListener("click",()=>{this.patchColumnCollapsed(e,!1)});const i=this.renderFlowVisualIcon(t,"flows-column-collapsed-icon",20),r=document.createElement("span");return r.className="flows-column-collapsed-title",r.textContent=e.flow.title,o.append(i,r),o}renderColumnHeader(e,t){const o=document.createElement("header");o.className="flows-column-header";const i=document.createElement("div");i.className="flows-column-title-row";const r=document.createElement("div");r.className="flows-column-title-wrap",r.appendChild(this.renderFlowAppearanceButton({column:e,visual:t,className:"flows-column-title-icon-button",iconClassName:"flows-column-title-icon",size:18}));const n=document.createElement("button");n.type="button",n.className="flows-column-icon-button",n.dataset.flowDragIgnore="true",n.title=this.runtime.i18n.t("flows.collapse"),n.setAttribute("aria-label",n.title),n.appendChild(m("shrink",{size:16,strokeWidth:2})),n.addEventListener("click",()=>{this.patchColumnCollapsed(e,!0)});const a=document.createElement("h2");a.className="flows-column-title",a.appendChild(this.renderFlowTitleInline(e,"column")),r.appendChild(a);const l=document.createElement("div");return l.className="flows-column-title-actions",l.append(n,this.renderColumnMenu(e)),i.append(r,l),o.append(i),o}renderColumnMenu(e){const t=document.createElement("div");t.className="flows-column-menu-container";const o=document.createElement("button");return o.type="button",o.className="flows-column-icon-button flows-column-menu-trigger",o.dataset.flowDragIgnore="true",o.title=this.runtime.i18n.t("flows.actions.menu"),o.setAttribute("aria-label",o.title),o.setAttribute("aria-haspopup","menu"),o.setAttribute("aria-expanded","false"),o.appendChild(m("ellipsis-horizontal",{size:18,strokeWidth:2})),o.addEventListener("click",i=>{var r;if(i.stopPropagation(),((r=this.columnMenuPopover)==null?void 0:r.trigger)===o){this.closeColumnMenu();return}this.openColumnMenu(o,e)}),t.appendChild(o),t}openColumnMenu(e,t){this.closeColumnMenu();const o=$({elevated:!0,className:"flows-column-menu hidden"});o.setAttribute("role","menu"),o.addEventListener("mousedown",r=>r.stopPropagation()),o.append(this.renderColumnMenuItem({label:this.runtime.i18n.t("flows.actions.edit"),icon:"pencil",onClick:()=>this.openEditModal(t)}),this.renderColumnMenuItem({label:this.runtime.i18n.t("flows.actions.hideFlow"),icon:"eye-slash",onClick:()=>{this.closeColumnMenu(),this.patchFlowHidden(t,!0)}}),this.renderColumnMenuItem({label:this.runtime.i18n.t("flows.actions.delete"),icon:"trash",tone:"danger",onClick:()=>void this.deleteFlow(t)}));const i=new W({container:e,panel:o,positioning:"viewport",panelZIndex:290,onOpenChange:r=>{var n;e.setAttribute("aria-expanded",r?"true":"false"),!r&&((n=this.columnMenuPopover)==null?void 0:n.menu)===i&&this.closeColumnMenu()}});i.mount(),this.columnMenuPopover={menu:i,panel:o,trigger:e},i.openAt({anchor:e,placement:"bottom-end",fallbackPlacements:["bottom-start","top-end","top-start"],gap:6,margin:12,lockPlacementAfterOpen:!0})}renderColumnMenuItem(e){const t=document.createElement("span");t.className="flows-column-menu-item-icon",t.appendChild(m(e.icon,{size:15,strokeWidth:2}));const o=xe({label:e.label,tone:e.tone==="danger"?"danger":"default",leading:t,className:`flows-column-menu-item${e.tone==="danger"?" flows-column-menu-item--danger":""}`,onClick:i=>{i.stopPropagation(),e.onClick()}});return o.dataset.flowDragIgnore="true",o.setAttribute("role","menuitem"),o}openEditModal(e){const t=g(e.flow);this.closeColumnMenu(),this.editingFlowTitleTarget=null,this.flowTitleEditInput=null,this.isCreatingFlow=!1,this.editingFlowId=e.flow.id,this.editDraft={title:e.flow.title,status:e.flow.status,icon:t.icon??I(),color:t.color??E(),timeProfile:t.timeProfile??"",priority:t.priority},this.editError=null,this.renderCurrent()}openCreateModal(){this.closeColumnMenu(),this.isOrganizeModalOpen=!1,this.editingFlowTitleTarget=null,this.flowTitleEditInput=null,this.isCreatingFlow=!0,this.editingFlowId=null,this.editDraft=this.createNewFlowDraft(),this.editError=null}async deleteFlow(e){this.closeColumnMenu(),window.confirm(this.runtime.i18n.t("flows.delete.confirm",{title:e.flow.title}))&&await this.handlers.onDeleteFlow(e.flow.id)}async patchColumnCollapsed(e,t){const o=g(e.flow);await this.handlers.onPatchFlow(e.flow.id,{meta:S(e.flow.meta,{...o,collapsed:t})})}async patchFlowHidden(e,t){const o=g(e.flow);await this.handlers.onPatchFlow(e.flow.id,{meta:S(e.flow.meta,{...o,hidden:t})})}appendTaskContent(e,t){if(t.taskStatus==="loading"){e.appendChild(this.renderColumnState(this.runtime.i18n.t("flows.tasks.loading")));return}if(t.taskStatus==="error"){e.appendChild(this.renderColumnState(this.runtime.i18n.t("flows.tasks.errors.load")));return}t.tasks.forEach(o=>{const i=document.createElement("button");i.type="button",i.className="flows-task-card",i.dataset.flowDragIgnore="true",i.disabled=!this.handlers.onPatchTask,this.handlers.onPatchTask&&i.addEventListener("click",()=>{this.openTaskEditModal(t,o)});const r=document.createElement("p");r.className="flows-task-title",r.textContent=o.title;const n=document.createElement("div");n.className="flows-task-meta",n.append(this.renderTaskMetaItem(o.status),this.renderTaskMetaItem(o.priority)),i.append(r,n),e.appendChild(i)}),e.appendChild(this.renderAddTaskButton(t))}renderColumnState(e){const t=document.createElement("div");return t.className="flows-column-state",t.textContent=e,t}renderTaskMetaItem(e){const t=document.createElement("span");return t.className="flows-task-meta-item",t.textContent=e,t}renderAddTaskButton(e){const t=e.flow.id,o=this.expandedTaskComposerFlowId===t,i=this.taskComposerSubmittingFlowId===t,r=Ee({expanded:o,collapsedLabel:this.runtime.i18n.t("flows.tasks.add"),submitLabel:this.runtime.i18n.t("flows.tasks.add"),cancelLabel:this.runtime.i18n.t("common.cancel"),placeholder:this.runtime.i18n.t("flows.tasks.placeholder"),ariaLabel:this.runtime.i18n.t("flows.tasks.titleLabel"),classNames:{root:"flows-task-composer",collapsedButton:"flows-add-task-button",expandedForm:"flows-task-composer-expanded",textarea:"flows-task-composer-textarea",actions:"flows-task-composer-actions",submitButton:"flows-task-composer-submit",cancelButton:"flows-task-composer-cancel"},disabled:i,value:this.taskDrafts.get(t)??"",rows:2,focusOnRender:!0,collapsedIcon:"plus",dragIgnoreDatasetKey:"flowDragIgnore",onExpand:()=>this.expandTaskComposer(t),onInput:n=>{this.taskDrafts.set(t,n)},onSubmit:n=>{this.submitTaskComposer(t,n)},onCancel:()=>this.collapseTaskComposer(t)});if(this.taskComposerErrorFlowId===t){const n=document.createElement("div");n.className="flows-task-composer-error",n.textContent=this.runtime.i18n.t("flows.tasks.errors.create"),r.element.append(n)}return r.element}openTaskEditModal(e,t){var r,n;if(!this.handlers.onPatchTask)return;this.closeTaskEditModal();const o=ft(t),i=new Re({task:mt(t),labels:this.getTaskEditModalLabels(),port:{loadTask:this.handlers.onLoadTask?()=>this.handlers.onLoadTask(e.flow.id,o):void 0,saveTaskPatch:a=>this.handlers.onPatchTask(e.flow.id,o,a),searchGoals:(r=this.handlers.taskRelationCatalog)==null?void 0:r.searchGoals,searchStories:(n=this.handlers.taskRelationCatalog)==null?void 0:n.searchStories},onClose:()=>{this.taskEditModal===i&&(this.taskEditModal=null)}});this.taskEditModal=i,i.show()}closeTaskEditModal(){const e=this.taskEditModal;this.taskEditModal=null,e==null||e.close()}getTaskEditModalLabels(){return{title:this.runtime.i18n.t("tasks.edit.title"),titleField:this.runtime.i18n.t("tasks.edit.titleField"),description:this.runtime.i18n.t("tasks.edit.description"),status:this.runtime.i18n.t("tasks.edit.status"),priority:this.runtime.i18n.t("tasks.edit.priority"),dueDate:this.runtime.i18n.t("tasks.edit.dueDate"),goal:this.runtime.i18n.t("tasks.edit.goal"),story:this.runtime.i18n.t("tasks.edit.story"),goalPlaceholder:this.runtime.i18n.t("tasks.edit.goalPlaceholder"),storyPlaceholder:this.runtime.i18n.t("tasks.edit.storyPlaceholder"),goalSearchPlaceholder:this.runtime.i18n.t("tasks.edit.goalSearchPlaceholder"),storySearchPlaceholder:this.runtime.i18n.t("tasks.edit.storySearchPlaceholder"),clearRelation:this.runtime.i18n.t("tasks.edit.clearRelation"),clearSearch:this.runtime.i18n.t("tasks.edit.clearSearch"),loadingOptions:this.runtime.i18n.t("tasks.edit.loadingOptions"),goalEmpty:this.runtime.i18n.t("tasks.edit.goalEmpty"),storyEmpty:this.runtime.i18n.t("tasks.edit.storyEmpty"),goalHint:this.runtime.i18n.t("tasks.edit.goalHint"),storyHint:this.runtime.i18n.t("tasks.edit.storyHint"),relationSearchError:this.runtime.i18n.t("tasks.edit.errors.relationSearch"),cancel:this.runtime.i18n.t("common.cancel"),save:this.runtime.i18n.t("common.save"),saving:this.runtime.i18n.t("tasks.edit.saving"),loading:this.runtime.i18n.t("tasks.edit.loading"),loadError:this.runtime.i18n.t("tasks.edit.errors.load"),saveError:this.runtime.i18n.t("tasks.edit.errors.save"),titleRequired:this.runtime.i18n.t("tasks.edit.errors.titleRequired"),getStatusLabel:e=>this.getStatusLabel(e),getPriorityLabel:e=>this.getPriorityLabel(e),unsaved:{title:this.runtime.i18n.t("tasks.edit.unsaved.title"),message:this.runtime.i18n.t("tasks.edit.unsaved.message"),keepEditing:this.runtime.i18n.t("tasks.edit.unsaved.keepEditing"),discard:this.runtime.i18n.t("tasks.edit.unsaved.discard"),saveChanges:this.runtime.i18n.t("tasks.edit.unsaved.saveChanges")}}}expandTaskComposer(e){this.handlers.onCreateTask&&(this.expandedTaskComposerFlowId=e,this.taskComposerErrorFlowId=null,this.rerenderCurrentState())}collapseTaskComposer(e){this.taskComposerSubmittingFlowId!==e&&(this.taskDrafts.delete(e),this.expandedTaskComposerFlowId===e&&(this.expandedTaskComposerFlowId=null),this.taskComposerErrorFlowId===e&&(this.taskComposerErrorFlowId=null),this.rerenderCurrentState())}async submitTaskComposer(e,t){const o=t.trim();if(!(!o||!this.handlers.onCreateTask)){this.taskDrafts.set(e,t),this.taskComposerSubmittingFlowId=e,this.taskComposerErrorFlowId=null,this.rerenderCurrentState();try{await this.handlers.onCreateTask(e,o),this.taskDrafts.delete(e),this.expandedTaskComposerFlowId===e&&(this.expandedTaskComposerFlowId=null)}catch{this.taskComposerErrorFlowId=e}finally{this.taskComposerSubmittingFlowId===e&&(this.taskComposerSubmittingFlowId=null),this.rerenderCurrentState()}}}rerenderCurrentState(){this.lastState&&this.render(this.lastState)}renderAddFlowButton(e){const t=document.createElement("aside");t.className="flows-add-flow-panel",t.dataset.flowDragIgnore="true";const o=document.createElement("button");return o.type="button",o.className="flows-add-flow-button",o.disabled=e.status==="loading",o.append(m("plus",{size:16,strokeWidth:2}),document.createTextNode(this.runtime.i18n.t("flows.actions.addFlow"))),o.addEventListener("click",()=>{this.openCreateModal(),this.renderCurrent()}),t.appendChild(o),t}renderEditModal(e){var f;const t=e===null,o=this.editDraft??(t?this.createNewFlowDraft():this.createEditDraft(e)),{overlay:i,container:r,body:n,footer:a}=M(this.runtime.i18n.t(t?"flows.create.title":"flows.edit.title"),{onClose:()=>this.closeEditModal(),intent:"form"});r.classList.add("flows-edit-container"),(f=r.querySelector("h2"))==null||f.classList.add("flows-edit-title"),n.classList.add("flows-edit-body");const l=document.createElement("form");if(l.className="flows-edit-dialog",l.addEventListener("submit",h=>{h.preventDefault(),this.submitEditModal(e,l)}),l.append(this.renderTitleField(e,o)),t||l.appendChild(this.renderEditFieldGrid([this.renderStatusField(o.status),this.renderPriorityField(o.priority)])),l.append(this.renderTextField({name:"timeProfile",label:this.runtime.i18n.t("flows.edit.timeProfile"),value:o.timeProfile,placeholder:this.runtime.i18n.t("flows.edit.timeProfilePlaceholder")})),this.editError){const h=document.createElement("p");h.className="flows-edit-error",h.textContent=this.editError,l.appendChild(h)}n.appendChild(l);const d=_({variant:"form"});d.append(y({text:this.runtime.i18n.t("flows.edit.cancel"),tone:"text",size:"md",className:v("default"),disabled:this.isSubmittingEdit,onClick:()=>this.closeEditModal()}));const p=y({text:this.runtime.i18n.t(t?"flows.create.save":"flows.edit.save"),tone:"primary",size:"md",className:`${v("default")} flows-edit-primary`,disabled:this.isSubmittingEdit,onClick:()=>{l.requestSubmit()}});return this.isSubmittingEdit&&ne(p,!0,{text:this.runtime.i18n.t(t?"flows.create.saving":"flows.edit.saving")}),d.append(p),a.appendChild(d),requestAnimationFrame(()=>{var h;(h=l.querySelector('input[name="title"]'))==null||h.focus()}),i}renderTextField(e){const t=new L({name:e.name,value:e.value,placeholder:e.placeholder,disabled:this.isSubmittingEdit}).createElement();return t.dataset.flowDragIgnore="true",x({label:e.label,control:t,disabled:this.isSubmittingEdit}).element}renderTitleField(e,t){const o=document.createElement("div");o.className="flows-edit-title-control-row",o.appendChild(this.renderFlowAppearanceButton({column:e,visual:{icon:t.icon,color:t.color},className:"flows-edit-title-icon-button",iconClassName:"flows-edit-title-icon",size:22}));const i=new L({name:"title",value:t.title,placeholder:this.runtime.i18n.t("flows.edit.namePlaceholder"),disabled:this.isSubmittingEdit,className:"flows-edit-title-input"}).createElement();return i.dataset.flowDragIgnore="true",i.setAttribute("aria-label",this.runtime.i18n.t("flows.edit.name")),o.appendChild(i),x({label:this.runtime.i18n.t("flows.edit.name"),control:o,disabled:this.isSubmittingEdit}).element}renderEditFieldGrid(e){const t=document.createElement("div");return t.className="flows-edit-field-grid",t.append(...e),t}renderStatusField(e){return this.renderEditDropdownField({label:this.runtime.i18n.t("flows.fields.status"),value:e,items:fe.map(t=>({value:t,label:this.getStatusLabel(t),icon:this.getStatusIcon(t),tone:this.getStatusTone(t)})),onSelect:t=>{ht(t)&&this.updateEditDraft({status:t})}})}renderPriorityField(e){return this.renderEditDropdownField({label:this.runtime.i18n.t("flows.fields.priority"),value:e??re,items:[{value:re,label:this.runtime.i18n.t("flows.edit.priorityDefault"),icon:"bars-2",tone:"slate"},...H.map(t=>({value:t,label:this.getPriorityLabel(t),icon:this.getPriorityIcon(t),tone:this.getPriorityTone(t)}))],onSelect:t=>{this.updateEditDraft({priority:gt(t)?t:null})}})}renderEditDropdownField(e){const t=e.items.find(i=>i.value===e.value)??null,o=new N({size:"md",value:t,placeholder:e.label,items:e.items,getKey:i=>i.value,getLabel:i=>i.label,ariaLabel:e.label,className:"flows-edit-dropdown",disabled:this.isSubmittingEdit,portalTarget:document.body,renderTriggerLeading:i=>this.renderDropdownIcon(i,!1),renderOptionLeading:i=>this.renderDropdownIcon(i,!0),renderOptionTrailing:(i,r)=>{if(!r)return null;const n=m("check",{size:14,strokeWidth:2.3});n.setAttribute("aria-hidden","true");const a=document.createElement("span");return a.className="flows-edit-dropdown-check",a.appendChild(n),a},onSelect:i=>e.onSelect(i.value)});return o.element.dataset.flowDragIgnore="true",this.dropdownDisposers.push(()=>o.destroy()),x({label:e.label,control:o.element,disabled:this.isSubmittingEdit}).element}renderDropdownIcon(e,t){if(!e)return null;const o=m(e.icon,{size:t?14:15,strokeWidth:2}),i=document.createElement("span");return i.classList.add(t?"flows-edit-dropdown-option-icon":"flows-edit-dropdown-icon",`flows-edit-dropdown-tone--${e.tone}`),o.setAttribute("aria-hidden","true"),i.appendChild(o),i}updateEditDraft(e){this.editDraft&&(this.editDraft={...this.editDraft,...e})}async submitEditModal(e,t){const o=new FormData(t),i=e===null?this.readCreateDraft(o):this.readEditDraft(o,e);this.editDraft=i,this.editError=null,this.isSubmittingEdit=!0,this.renderCurrent();try{if(e===null)await this.handlers.onCreateFlow({title:i.title,meta:this.writeDraftPresentation(null,i,null,null)});else{const r=g(e.flow),n={title:i.title,meta:this.writeDraftPresentation(e.flow.meta,i,r.collapsed,r.hidden)};i.status!==e.flow.status&&(n.status=i.status),await this.handlers.onPatchFlow(e.flow.id,n)}this.isSubmittingEdit=!1,this.closeEditModal()}catch{this.isSubmittingEdit=!1,this.editError=this.runtime.i18n.t(e===null?"flows.create.error":"flows.edit.error"),this.renderCurrent()}}writeDraftPresentation(e,t,o,i){return S(e,{icon:t.icon,color:t.color,timeProfile:t.timeProfile||null,priority:t.priority,collapsed:o,hidden:i})}readCreateDraft(e){const t=this.editDraft??this.createNewFlowDraft();return this.readDraftFromForm(e,this.runtime.i18n.t("flows.defaultFlowTitle"),t.icon,t.color,t.status,t.priority)}readEditDraft(e,t){const o=this.editDraft??this.createEditDraft(t);return this.readDraftFromForm(e,t.flow.title,o.icon,o.color,o.status,o.priority)}readDraftFromForm(e,t,o,i,r,n){const a=z(e,"title"),l=z(e,"icon"),d=z(e,"color");return{title:a||t,status:r,icon:P.includes(l)?l:o,color:F.includes(d)?d:i,timeProfile:z(e,"timeProfile"),priority:n}}createEditDraft(e){const t=g(e.flow);return{title:e.flow.title,status:e.flow.status,icon:t.icon??I(),color:t.color??E(),timeProfile:t.timeProfile??"",priority:t.priority}}createNewFlowDraft(){return{title:"",status:c.Draft,icon:I(),color:E(),timeProfile:"",priority:null}}getThemeIconLabel(e){switch(e){case"academic-cap":return this.runtime.i18n.t("flows.icons.academicCap");case"bar-chart":return this.runtime.i18n.t("flows.icons.barChart");case"book-closed":return this.runtime.i18n.t("flows.icons.bookClosed");case"book-open":return this.runtime.i18n.t("flows.icons.bookOpen");case"brain":return this.runtime.i18n.t("flows.icons.brain");case"car":return this.runtime.i18n.t("flows.icons.car");case"code-brackets":return this.runtime.i18n.t("flows.icons.codeBrackets");case"command-line":return this.runtime.i18n.t("flows.icons.commandLine");case"computer-desktop":return this.runtime.i18n.t("flows.icons.computerDesktop");case"cooking-pot":return this.runtime.i18n.t("flows.icons.cookingPot");case"currency-dollar":return this.runtime.i18n.t("flows.icons.currencyDollar");case"dumbbell":return this.runtime.i18n.t("flows.icons.dumbbell");case"folder":return this.runtime.i18n.t("flows.icons.folder");case"health":return this.runtime.i18n.t("flows.icons.health");case"heart":return this.runtime.i18n.t("flows.icons.heart");case"notebook":return this.runtime.i18n.t("flows.icons.notebook");case"lotus":return this.runtime.i18n.t("flows.icons.lotus");case"paw":return this.runtime.i18n.t("flows.icons.paw");case"plane":return this.runtime.i18n.t("flows.icons.plane");case"plant":return this.runtime.i18n.t("flows.icons.plant");case"popcorn":return this.runtime.i18n.t("flows.icons.popcorn")}}getStatusLabel(e){return this.runtime.i18n.t(`flows.status.${e}`)}getStatusIcon(e){switch(e){case c.Active:return"arrow-path";case c.Completed:return"check-circle";case c.Archived:return"archive-box";case c.Cancelled:return"x-mark";case c.Described:return"map-pin";case c.Draft:default:return"status-pending"}}getStatusTone(e){switch(e){case c.Active:return"blue";case c.Completed:return"emerald";case c.Cancelled:return"rose";case c.Described:return"violet";case c.Draft:return"amber";case c.Archived:default:return"slate"}}getPriorityLabel(e){switch(e){case u.Highest:return this.runtime.i18n.t("priority.highest");case u.High:return this.runtime.i18n.t("priority.high");case u.Low:return this.runtime.i18n.t("priority.low");case u.Lowest:return this.runtime.i18n.t("priority.lowest");case u.Medium:default:return this.runtime.i18n.t("priority.medium")}}getPriorityIcon(e){switch(e){case u.Highest:return"chevron-double-up";case u.High:return"chevron-up";case u.Low:return"chevron-down";case u.Lowest:return"chevron-double-down";case u.Medium:default:return"bars-2"}}getPriorityTone(e){switch(e){case u.Highest:case u.High:return"rose";case u.Low:case u.Lowest:return"blue";case u.Medium:default:return"amber"}}getEditingColumn(e){return this.editingFlowId===null?null:e.columns.find(t=>t.flow.id===this.editingFlowId)??null}getColumnIndex(e){var t;return Math.max(0,((t=this.lastState)==null?void 0:t.columns.findIndex(o=>o.flow.id===e))??0)}closeEditModal(){this.isSubmittingEdit||(this.isCreatingFlow=!1,this.editingFlowId=null,this.editDraft=null,this.editError=null,this.renderCurrent())}startFlowTitleEdit(e,t){this.editingFlowTitleTarget={flowId:e,surface:t},this.flowTitleEditInput=null,this.renderCurrent()}finishFlowTitleEdit(e,t){var i,r;if(((i=this.editingFlowTitleTarget)==null?void 0:i.flowId)!==e.id)return;const o=((r=this.flowTitleEditInput)==null?void 0:r.value.trim())??"";if(this.editingFlowTitleTarget=null,this.flowTitleEditInput=null,t&&o.length>0&&o!==e.title){this.handlers.onPatchFlow(e.id,{title:o});return}this.renderCurrent()}renderCurrent(){this.lastState&&this.render(this.lastState)}closeColumnMenu(){const e=this.columnMenuPopover;e&&(this.columnMenuPopover=null,e.trigger.setAttribute("aria-expanded","false"),e.menu.close(),e.menu.unmount(),e.panel.remove())}closeAppearancePopover(){const e=this.appearancePopover;e&&(this.appearancePopover=null,e.trigger.setAttribute("aria-expanded","false"),e.menu.close(),e.menu.unmount(),e.panel.remove())}closeDisconnectedPopovers(){this.columnMenuPopover&&!this.columnMenuPopover.trigger.isConnected&&this.closeColumnMenu(),this.appearancePopover&&!this.appearancePopover.trigger.isConnected&&this.closeAppearancePopover()}disposeDropdownControls(){var e;for(;this.dropdownDisposers.length>0;)(e=this.dropdownDisposers.pop())==null||e()}}function ht(s){return fe.includes(s)}function ft(s){return s.uuid??s.id}function mt(s){return{id:s.id,uuid:s.uuid,title:s.title,description:"",status:s.status,priority:s.priority,dueDate:wt(s.due_date),isCompleted:s.is_completed,goalId:null,goal:null,storyId:null,story:null}}function wt(s){return s?s instanceof Date?Number.isNaN(s.getTime())?null:s.toISOString().slice(0,10):s.slice(0,10):null}function gt(s){return H.includes(s)}function z(s,e){const t=s.get(e);return typeof t=="string"?t.trim():""}class bt{constructor(e={}){this.root=null,this.store=null,this.view=null,this.subscriptions=new q,this.runtime=e.runtime??ae();const t=new ye(ve.apiUrl);this.flowsApi=e.flowsApi??new ze(t);const o=e.goalsApi??new ke(t),i=e.storiesApi??new Ce(t);this.taskRelationCatalog=e.taskRelationCatalog??new Ae({goalsApi:o,storiesApi:i})}mount(e){if(this.root)return;const t=document.createElement("div");t.dataset.module="flows",t.className="h-full w-full",e.appendChild(t),this.root=t;const o=new Ue(this.flowsApi),i=new pt(t,this.runtime,{onCreateFlow:r=>o.createFlow(r),onCreateTask:(r,n)=>o.createFlowTask(r,n),onLoadTask:(r,n)=>o.loadFlowTask(r,n),onPatchTask:(r,n,a)=>o.patchFlowTask(r,n,a),taskRelationCatalog:this.taskRelationCatalog,onPatchFlow:(r,n)=>o.patchFlow(r,n),onReorderFlow:(r,n)=>o.reorderFlowColumns(r,n),onDeleteFlow:r=>o.deleteFlow(r)});this.store=o,this.view=i,this.subscriptions.add(o.state$.subscribe(r=>i.render(r))),this.subscriptions.add(this.runtime.subscribe(()=>{i.render(o.snapshot)})),o.load()}unmount(){var e,t,o;this.subscriptions.unsubscribe(),this.subscriptions=new q,(e=this.store)==null||e.destroy(),this.store=null,(t=this.view)==null||t.destroy(),this.view=null,(o=this.root)==null||o.remove(),this.root=null}}class vt{constructor(e={}){this.id="flows",this.app=null,this.runtime=e.runtime??ae()}mount(e){if(this.app)return;const t=new bt({runtime:this.runtime});t.mount(e),this.app=t}unmount(){var e;(e=this.app)==null||e.unmount(),this.app=null}getAiAssistantSnapshot(){return null}}export{vt as FlowsModule};
