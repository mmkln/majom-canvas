import{B as pe,u as P,z as V,q as D,Q as B,p as $,R as z,U as S,F as Y,C as Z,D as O,V as M,W as he,I as R,J as N,X as re,Y as ue,S as L,Z as X,g as v,f as ge,k as ne,d as J,H as fe,e as be,a as ke,M as me,N as ye,T as xe,_ as ve}from"./index-CRr2IAtf.js";class Se{constructor(e){this.http=e}loadSnapshot(){return this.http.get("/focus-board/snapshot/")}saveSnapshot(e){return this.http.put("/focus-board/snapshot/",e)}clearSnapshot(){return this.http.delete("/focus-board/snapshot/")}}const W=[3,4,5,6,7],ee=["#60a5fa","#34d399","#f59e0b","#fb7185","#818cf8","#22c55e","#f97316","#14b8a6"];function Ce(r,e,t={}){return{id:r,text:e,completed:t.completed??!1,isFocus:t.isFocus??!1}}function Te(r){return{...r}}function T(r=[]){return r.map(Te)}function I(r){const e={};return Object.entries(r).forEach(([t,a])=>{e[Number(t)]=T(a)}),e}function _(r){if(r.length===0)return[];const e=r.findIndex(t=>t.isFocus);return r.map((t,a)=>({...t,isFocus:e===-1?a===0:a===e}))}function K(r,e){const t={};return Object.entries(r).forEach(([a,o])=>{const s=Number(a);s<=e&&(t[s]=o)}),t}function we(){const r=new Date,e=r.getFullYear(),t=String(r.getMonth()+1).padStart(2,"0"),a=String(r.getDate()).padStart(2,"0");return`${e}-${t}-${a}`}function ie(r){const[e,t,a]=r.split("-").map(Number);return!Number.isInteger(e)||!Number.isInteger(t)||!Number.isInteger(a)?null:new Date(e,t-1,a,12)}function Pe(r,e){const t=ie(r);return t?(t.setDate(t.getDate()+e),`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`):r}function Me(r){const e=new Set;return r.backlog.forEach(t=>e.add(t.id)),Object.values(r.days).forEach(t=>{t.forEach(a=>e.add(a.id))}),e}function Le(r,e){const t=new Map;return r.forEach(a=>t.set(a.id,a)),e.forEach(a=>t.set(a.id,a)),[...t.values()]}function De(r,e){return _(T(r).concat({...e,isFocus:r.length===0}))}function Ee(){return{load:()=>null,save:()=>{},searchTasks:()=>({items:[],nextPage:null,total:0}),searchGoals:()=>({items:[],nextPage:null}),searchStories:()=>({items:[],nextPage:null}),createTask:r=>Ce(`noop-${r}`,r),setTaskCompleted:()=>{},toggleHabitCompletion:()=>{}}}function Ne(){return{title:"Focus Board",hasActiveCycle:!1,cycleStartDateKey:we(),goal:"",tempGoal:"",cycleLength:3,tempCycleLength:3,cycleLengthOptions:W,habits:[],habitChecks:{},dailyGoals:{},days:{},backlog:[],backlogSearchQuery:"",backlogOpen:!1,goalModalOpen:!1,habitManagerOpen:!1,activeHabitDay:null,taskPicker:{open:!1,query:"",items:[],loading:!1,error:null,nextPage:1,total:0,status:null,goal:null,story:null},taskComposer:{open:!1,target:null,title:"",saving:!1,error:null}}}const j=class j{constructor(e=Ne(),t=Ee()){this.repository=t,this.hasLocalChanges=!1,this.nextHabitId=100,this.writeQueue=Promise.resolve(),this.taskPickerRequestId=0,this.stateSubject=new pe(e),this.state$=this.stateSubject.asObservable(),this.hydrateFromRepository()}getSnapshot(){return this.stateSubject.getValue()}destroy(){this.stateSubject.complete()}async hydrateFromRepository(){try{const e=await this.resolveRepositoryResult(this.repository.load());if(!e||this.hasLocalChanges)return;const t=this.getSnapshot();this.stateSubject.next({...e,tempGoal:t.goalModalOpen?t.tempGoal:e.tempGoal,tempCycleLength:t.goalModalOpen?t.tempCycleLength:e.tempCycleLength,backlogSearchQuery:t.backlogSearchQuery,backlogOpen:t.backlogOpen,goalModalOpen:t.goalModalOpen,habitManagerOpen:t.habitManagerOpen,activeHabitDay:t.activeHabitDay,taskPicker:t.taskPicker.open?t.taskPicker:e.taskPicker,taskComposer:t.taskComposer.open?t.taskComposer:e.taskComposer})}catch(e){console.warn("Failed to hydrate focus board snapshot.",e)}}enqueueSave(e){this.hasLocalChanges=!0,this.writeQueue=this.writeQueue.catch(()=>{}).then(async()=>{try{await this.resolveRepositoryResult(this.repository.save(e))}catch(t){console.warn("Failed to persist focus board snapshot.",t)}})}enqueueTaskCompletion(e,t){this.hasLocalChanges=!0,this.writeQueue=this.writeQueue.catch(()=>{}).then(async()=>{try{await this.resolveRepositoryResult(this.repository.setTaskCompleted(e,t))}catch(a){console.warn("Failed to update task completion from focus board.",a)}})}enqueueHabitToggle(e,t){this.hasLocalChanges=!0,this.writeQueue=this.writeQueue.catch(()=>{}).then(async()=>{try{await this.resolveRepositoryResult(this.repository.toggleHabitCompletion(e,t))}catch(a){console.warn("Failed to toggle habit completion from focus board.",a)}})}resolveRepositoryResult(e){return e instanceof Promise?e:Promise.resolve(e)}toggleBacklog(){const e=this.getSnapshot();this.stateSubject.next({...e,backlogOpen:!e.backlogOpen})}closeBacklog(){const e=this.getSnapshot();e.backlogOpen&&this.stateSubject.next({...e,backlogOpen:!1})}setBacklogSearchQuery(e){const t=this.getSnapshot();this.stateSubject.next({...t,backlogSearchQuery:e})}openGoalModal(){const e=this.getSnapshot();this.stateSubject.next({...e,goalModalOpen:!0,tempGoal:e.goal,tempCycleLength:e.cycleLength})}closeGoalModal(){const e=this.getSnapshot();e.goalModalOpen&&this.stateSubject.next({...e,goalModalOpen:!1,tempGoal:e.goal,tempCycleLength:e.cycleLength})}setGoalModalDraft(e,t){const a=this.getSnapshot();this.stateSubject.next({...a,tempGoal:e,tempCycleLength:t})}saveGoalAndCycle(e){const t=this.getSnapshot(),a=t.tempCycleLength,o=e.trim(),s=I(t.days);let n=T(t.backlog);Object.entries(s).forEach(([l,p])=>{const h=Number(l);h<=a||(n=n.concat(p.map(d=>({...d,isFocus:!1}))),delete s[h])});const i={...t,hasActiveCycle:!0,goal:o,tempGoal:o,cycleLength:a,days:K(s,a),dailyGoals:K(t.dailyGoals,a),habitChecks:K(t.habitChecks,a),backlog:n,goalModalOpen:!1};this.stateSubject.next(i),this.enqueueSave(i)}updateCycleGoal(e){const t=this.getSnapshot(),a=e.trim();if(t.goal===a||!t.hasActiveCycle&&a.length===0)return;const o={...t,hasActiveCycle:!0,goal:a,tempGoal:t.goalModalOpen?t.tempGoal:a};this.stateSubject.next(o),this.enqueueSave(o)}openHabitManager(){const e=this.getSnapshot();this.stateSubject.next({...e,habitManagerOpen:!0})}closeHabitManager(){const e=this.getSnapshot();e.habitManagerOpen&&this.stateSubject.next({...e,habitManagerOpen:!1})}openHabitDay(e){const t=this.getSnapshot();this.stateSubject.next({...t,activeHabitDay:e})}closeHabitDay(){const e=this.getSnapshot();e.activeHabitDay!==null&&this.stateSubject.next({...e,activeHabitDay:null})}updateDailyGoal(e,t){const a=this.getSnapshot(),o={...a,dailyGoals:{...a.dailyGoals,[e]:t}};this.stateSubject.next(o),this.enqueueSave(o)}addTask(e,t){this.createTaskInTarget(t,e)}openTaskComposer(e){const t=this.getSnapshot();this.stateSubject.next({...t,taskComposer:{open:!0,target:e,title:"",saving:!1,error:null}})}closeTaskComposer(){const e=this.getSnapshot();e.taskComposer.open&&this.stateSubject.next({...e,taskComposer:{open:!1,target:null,title:"",saving:!1,error:null}})}setTaskComposerTitle(e){const t=this.getSnapshot();this.stateSubject.next({...t,taskComposer:{...t.taskComposer,title:e,error:null}})}submitTaskComposer(){const e=this.getSnapshot();e.taskComposer.saving||e.taskComposer.target===null||this.createTaskInTarget(e.taskComposer.title,e.taskComposer.target)}openTaskPicker(){const e=this.getSnapshot();this.stateSubject.next({...e,taskPicker:{...e.taskPicker,open:!0,error:null}}),e.taskPicker.items.length===0&&this.loadTaskPickerPage(!0)}closeTaskPicker(){const e=this.getSnapshot();e.taskPicker.open&&this.stateSubject.next({...e,taskPicker:{...e.taskPicker,open:!1,loading:!1,error:null}})}setTaskPickerQuery(e){const t=this.getSnapshot();this.stateSubject.next({...t,taskPicker:{...t.taskPicker,query:e,error:null}}),this.loadTaskPickerPage(!0)}setTaskPickerStatus(e){const t=this.getSnapshot();t.taskPicker.status!==e&&(this.stateSubject.next({...t,taskPicker:{...t.taskPicker,status:e,error:null}}),this.loadTaskPickerPage(!0))}setTaskPickerGoal(e){var s;const t=this.getSnapshot(),a=((s=t.taskPicker.goal)==null?void 0:s.id)??null,o=(e==null?void 0:e.id)??null;a!==o&&(this.stateSubject.next({...t,taskPicker:{...t.taskPicker,goal:e,story:null,error:null}}),this.loadTaskPickerPage(!0))}setTaskPickerStory(e){var s;const t=this.getSnapshot(),a=((s=t.taskPicker.story)==null?void 0:s.id)??null,o=(e==null?void 0:e.id)??null;a!==o&&(this.stateSubject.next({...t,taskPicker:{...t.taskPicker,story:e,error:null}}),this.loadTaskPickerPage(!0))}loadMoreTaskPicker(){this.loadTaskPickerPage(!1)}addTaskToBacklog(e){const t=this.getSnapshot();if(Me(t).has(e))return;const a=t.taskPicker.items.find(s=>s.id===e);if(!a)return;const o={...t,backlog:t.backlog.concat({id:a.id,text:a.text,completed:a.completed,isFocus:!1})};this.stateSubject.next(o),this.enqueueSave(o)}toggleTask(e,t){const a=this.getSnapshot(),o=I(a.days);let s=T(a.backlog);if(e==="backlog"){s=s.map(p=>p.id===t?{...p,completed:!p.completed}:p),this.stateSubject.next({...a,backlog:s});const l=s.find(p=>p.id===t);l&&this.enqueueTaskCompletion(t,l.completed);return}const n=T(o[e]??[]).map(l=>l.id===t?{...l,completed:!l.completed}:l);o[e]=n,this.stateSubject.next({...a,days:o});const i=n.find(l=>l.id===t);i&&this.enqueueTaskCompletion(t,i.completed)}moveTask(e,t,a){if(e===t)return;const o=this.getSnapshot(),s=I(o.days);let n=T(o.backlog);const i=e==="backlog"?n:T(s[e]??[]),l=i.findIndex(d=>d.id===a);if(l===-1)return;const[p]=i.splice(l,1);if(e==="backlog"?n=i:s[e]=_(i),t==="backlog")n.push({...p,isFocus:!1});else{const d=T(s[t]??[]);d.push({...p,isFocus:d.length===0}),s[t]=_(d)}const h={...o,days:s,backlog:n};this.stateSubject.next(h),this.enqueueSave(h)}async loadTaskPickerPage(e){var s,n;const t=this.getSnapshot();if(!t.taskPicker.open&&!e||t.taskPicker.loading)return;const a=e?1:t.taskPicker.nextPage;if(a===null)return;const o=++this.taskPickerRequestId;this.stateSubject.next({...t,taskPicker:{...t.taskPicker,loading:!0,error:null,...e?{items:[],nextPage:1,total:0}:{}}});try{const i=await this.resolveRepositoryResult(this.repository.searchTasks({query:this.getSnapshot().taskPicker.query.trim(),page:a,pageSize:j.TASK_PICKER_PAGE_SIZE,status:this.getSnapshot().taskPicker.status,goalId:((s=this.getSnapshot().taskPicker.goal)==null?void 0:s.id)??null,storyId:((n=this.getSnapshot().taskPicker.story)==null?void 0:n.id)??null}));if(o!==this.taskPickerRequestId)return;const l=this.getSnapshot();this.stateSubject.next({...l,taskPicker:{...l.taskPicker,loading:!1,error:null,items:e?i.items:Le(l.taskPicker.items,i.items),nextPage:i.nextPage,total:i.total}})}catch(i){if(o!==this.taskPickerRequestId)return;const l=this.getSnapshot();this.stateSubject.next({...l,taskPicker:{...l.taskPicker,loading:!1,error:"Не вдалося завантажити задачі."}}),console.warn("Failed to search tasks for focus board.",i)}}async createTaskInTarget(e,t){const a=e.trim();if(a.length===0){const s=this.getSnapshot();this.stateSubject.next({...s,taskComposer:{...s.taskComposer,error:"Вкажи назву задачі."}});return}const o=this.getSnapshot();this.stateSubject.next({...o,taskComposer:{...o.taskComposer,open:!0,target:t,title:a,saving:!0,error:null}});try{const s=await this.resolveRepositoryResult(this.repository.createTask(a)),n=this.getSnapshot(),i=I(n.days);let l=T(n.backlog);t==="backlog"?l=l.concat({...s,isFocus:!1}):i[t]=De(i[t]??[],s);const p={...n,days:i,backlog:l,taskComposer:{open:!1,target:null,title:"",saving:!1,error:null}};this.stateSubject.next(p),this.enqueueSave(p)}catch(s){const n=this.getSnapshot();this.stateSubject.next({...n,taskComposer:{...n.taskComposer,open:!0,target:t,title:a,saving:!1,error:"Не вдалося створити задачу."}}),console.warn("Failed to create task from focus board.",s)}}toggleHabit(e,t){const a=this.getSnapshot(),o={...a.habitChecks[e]??{}};o[t]=!o[t],this.stateSubject.next({...a,habitChecks:{...a.habitChecks,[e]:o}});const s=Pe(a.cycleStartDateKey,e-1),n=ie(s);n&&this.enqueueHabitToggle(t,n)}addHabit(e){const t=e.trim();if(t.length===0)return;const a=this.getSnapshot(),o=ee[a.habits.length%ee.length],s=t.charAt(0).toUpperCase()||"+";this.stateSubject.next({...a,habits:a.habits.concat({id:`habit-${this.nextHabitId++}`,text:t,accent:o,badge:s,priority:"low"})})}removeHabit(e){const t=this.getSnapshot(),a={};Object.entries(t.habitChecks).forEach(([o,s])=>{const n={...s};delete n[e],a[Number(o)]=n}),this.stateSubject.next({...t,habits:t.habits.filter(o=>o.id!==e),habitChecks:a})}};j.TASK_PICKER_PAGE_SIZE=20;let U=j;const te="focus-board-styles",He=`
#focus-board-root {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent;
  color: #334155;
  font-family: "Poppins", "Inter", "Segoe UI", "Roboto", "Arial", sans-serif;
}

#focus-board-root .custom-scrollbar::-webkit-scrollbar {
  width: 4px;
  height: 6px;
}

#focus-board-root .custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

#focus-board-root .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 999px;
}

.fb-page {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.fb-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
  padding: 24px 28px 18px;
  flex-shrink: 0;
}

.fb-goal-surface {
  flex: 1 1 18rem;
  max-width: min(34rem, 48vw);
}

.fb-wallpaper-surface {
  margin-left: auto;
}

.fb-primary-btn,
.fb-primary-btn-small,
.fb-habit-stack,
.fb-sheet-habit-row {
  font: inherit;
  border: 0;
  outline: none;
  cursor: pointer;
}

.fb-btn-icon {
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: currentColor;
}

.fb-habit-stack:hover {
  color: #0f172a;
}

.fb-board-main {
  flex: 1;
  min-height: 0;
  padding: 0;
}

.fb-empty-cycle-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.fb-empty-cycle-kicker {
  margin: 0;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #94a3b8;
}

.fb-empty-cycle-title {
  margin: 0;
  font-size: 28px;
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: #0f172a;
}

.fb-empty-cycle-text {
  margin: 0;
  max-width: 44ch;
  font-size: 14px;
  line-height: 1.6;
  color: #64748b;
}

.fb-board-scroll {
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 8px 22px 22px;
}

.fb-board-row {
  display: flex;
  align-items: stretch;
  gap: 16px;
  width: max-content;
  min-width: 100%;
  height: 100%;
}

.fb-day-column {
  width: 340px;
  min-width: 340px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border-radius: 24px;
  border: 1px solid rgba(226, 232, 240, 0.88);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
}

.fb-day-column[data-today="false"] {
  background: rgba(248, 250, 252, 0.72);
  border-color: rgba(226, 232, 240, 0.92);
  box-shadow: none;
}

.fb-day-column[data-today="true"] {
  border-color: rgba(165, 180, 252, 0.9);
  background: #ffffff;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.14);
}

.fb-day-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 2px 4px 0;
}

.fb-day-kicker {
  margin: 0;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #94a3b8;
}

.fb-day-date {
  margin: 6px 0 0;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #64748b;
}

.fb-day-goal-wrap {
  padding: 0 4px;
}

.fb-day-goal-wrap textarea {
  resize: none;
}

.fb-habit-stack {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 0 4px;
  padding: 14px;
  border-radius: 16px;
  background: rgba(248, 250, 252, 0.92);
  border: 1px solid transparent;
  transition: background-color 140ms ease, border-color 140ms ease, box-shadow 140ms ease,
    color 140ms ease;
}

.fb-habit-stack:hover {
  background: #ffffff;
  border-color: rgba(226, 232, 240, 0.92);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
}

.fb-habit-stack-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.fb-habit-stack-label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #94a3b8;
}

.fb-habit-stack-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fb-habit-stack-icons {
  display: flex;
  align-items: center;
}

.fb-habit-mini {
  width: 26px;
  height: 26px;
  margin-right: -6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 2px solid #ffffff;
  background: rgba(203, 213, 225, 0.72);
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
}

.fb-habit-mini[data-checked="true"] {
  background: var(--habit-accent);
}

.fb-habit-stack-stats {
  font-size: 12px;
  font-weight: 700;
  color: #475569;
}

.fb-chevron {
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 14px;
  font-weight: 800;
  flex-shrink: 0;
}

.fb-focus-zone {
  min-height: 0;
}

.fb-task-list {
  flex: 1;
  min-height: 120px;
  overflow-y: auto;
  padding: 0 4px 2px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: background-color 140ms ease, border-color 140ms ease;
}

.fb-day-footer {
  padding: 0 4px 2px;
}

.fb-task-list[data-drag-over="true"],
.fb-backlog-list[data-drag-over="true"] {
  background: rgba(241, 245, 249, 0.92);
  box-shadow: inset 0 0 0 1px rgba(165, 180, 252, 0.9);
}

.fb-column-hint,
.fb-empty-state {
  margin: 12px 0 0;
  font-size: 13px;
  line-height: 1.45;
  color: #94a3b8;
}

.fb-task-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.88);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: none;
  cursor: grab;
  transition: opacity 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
}

.fb-task-card[data-dragging="true"] {
  opacity: 0.45;
}

.fb-task-card-focus {
  margin: 0 4px;
  border-color: rgba(165, 180, 252, 0.92);
  background: rgba(238, 242, 255, 0.72);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
}

.fb-task-card-done .fb-task-text {
  color: #cbd5e1;
  text-decoration: line-through;
}

.fb-task-toggle-slot {
  flex-shrink: 0;
  display: inline-flex;
  margin-top: 1px;
}

.fb-task-checkbox {
  flex-shrink: 0;
  margin-top: 1px;
}

.fb-task-content {
  min-width: 0;
  flex: 1;
}

.fb-task-label {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #94a3b8;
}

.fb-task-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: #334155;
  font-weight: 500;
}

.fb-backlog-backdrop,
.fb-modal-backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(15, 23, 42, 0.32);
  opacity: 0;
  pointer-events: none;
  transition: opacity 180ms ease;
}

.fb-backlog-backdrop[data-open="true"] {
  opacity: 1;
  pointer-events: auto;
}

.fb-backlog-sidebar {
  position: absolute;
  inset: 0 0 0 auto;
  width: 320px;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-left: 1px solid rgba(226, 232, 240, 0.92);
  box-shadow: -24px 0 48px rgba(15, 23, 42, 0.16);
  transform: translateX(100%);
  transition: transform 220ms ease;
  z-index: 12;
}

.fb-backlog-sidebar[data-open="true"] {
  transform: translateX(0);
}

.fb-side-header,
.fb-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px 18px;
  border-bottom: 1px solid rgba(241, 245, 249, 0.96);
}

.fb-side-title,
.fb-modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
}

.fb-side-header-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.fb-side-subtitle,
.fb-modal-subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.45;
  color: #94a3b8;
}

.fb-backlog-list {
  flex: 1;
  overflow-y: auto;
  padding: 18px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fb-backlog-search {
  padding: 14px 16px 0;
}

.fb-backlog-footer {
  padding: 16px;
  border-top: 1px solid rgba(241, 245, 249, 0.96);
  background: rgba(248, 250, 252, 0.68);
}

.fb-task-picker-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fb-task-picker-filters {
  padding: 0 24px 8px;
}

.fb-task-picker-filter-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.fb-modal-overlay,
.fb-sheet-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 180ms ease;
  z-index: 20;
}

.fb-modal-overlay[data-open="true"],
.fb-sheet-overlay[data-open="true"] {
  opacity: 1;
  pointer-events: auto;
}

.fb-modal-overlay[data-open="true"] .fb-modal-backdrop,
.fb-sheet-overlay[data-open="true"] .fb-modal-backdrop {
  opacity: 1;
  pointer-events: auto;
}

.fb-modal-card {
  position: relative;
  z-index: 1;
  width: min(100%, 560px);
  max-height: min(86vh, 760px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 32px;
  background: #ffffff;
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.22);
}

.fb-goal-modal {
  max-width: 620px;
}

.fb-modal-body {
  padding: 24px;
  overflow-y: auto;
}

.fb-modal-footer {
  padding: 20px 24px 24px;
  border-top: 1px solid rgba(241, 245, 249, 0.96);
  background: rgba(248, 250, 252, 0.7);
}

.fb-field-label {
  display: block;
  margin: 0 0 10px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #94a3b8;
}

.fb-cycle-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.fb-cycle-chip {
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.92);
  background: #ffffff;
  color: #64748b;
  font-size: 13px;
  font-weight: 800;
  transition: background-color 140ms ease, border-color 140ms ease, color 140ms ease;
}

.fb-cycle-chip[data-active="true"] {
  background: #4f46e5;
  border-color: #4f46e5;
  color: #ffffff;
  box-shadow: 0 12px 26px rgba(79, 70, 229, 0.22);
}

.fb-primary-btn,
.fb-primary-btn-small {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  background: #4f46e5;
  color: #ffffff;
  font-size: 14px;
  font-weight: 800;
  box-shadow: 0 16px 28px rgba(79, 70, 229, 0.22);
}

.fb-primary-btn {
  width: 100%;
  min-height: 52px;
  padding: 0 20px;
}

.fb-primary-btn-small {
  width: 48px;
  min-width: 48px;
  min-height: 48px;
}

.fb-sheet-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: min(42vh, 420px);
  overflow-y: auto;
}

.fb-sheet-habit-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid rgba(241, 245, 249, 0.98);
}

.fb-sheet-habit-row {
  justify-content: flex-start;
  width: 100%;
  background: transparent;
}

.fb-habit-badge {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--habit-accent);
  color: #ffffff;
  font-size: 12px;
  font-weight: 800;
}

.fb-habit-text {
  min-width: 0;
  font-size: 14px;
  line-height: 1.4;
  color: #334155;
  font-weight: 600;
}

.fb-sheet-overlay {
  align-items: flex-end;
  padding: 0;
}

.fb-habit-sheet {
  position: relative;
  z-index: 1;
  width: min(100%, 720px);
  max-height: 84vh;
  display: flex;
  flex-direction: column;
  border-radius: 32px 32px 0 0;
  background: #ffffff;
  box-shadow: 0 -18px 48px rgba(15, 23, 42, 0.24);
  transform: translateY(100%);
  transition: transform 240ms ease;
}

.fb-habit-sheet[data-open="true"] {
  transform: translateY(0);
}

.fb-sheet-handle {
  width: 52px;
  height: 5px;
  border-radius: 999px;
  background: #e2e8f0;
  margin: 12px auto 0;
}

.fb-sheet-check {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  color: #ffffff;
  font-size: 12px;
  font-weight: 800;
}

.fb-sheet-check[data-checked="true"] {
  background: #4f46e5;
  border-color: #4f46e5;
}

@media (max-width: 920px) {
  .fb-header {
    flex-wrap: wrap;
    padding: 18px 16px 14px;
  }

  .fb-goal-surface {
    flex: 1 1 100%;
    order: 3;
    max-width: none;
  }

  .fb-wallpaper-surface {
    margin-left: 0;
  }

  .fb-board-main {
    padding: 0;
  }

  .fb-board-scroll {
    padding: 8px 12px 16px;
  }

  .fb-day-column {
    width: 304px;
    min-width: 304px;
  }

  .fb-modal-overlay {
    padding: 12px;
  }

  .fb-backlog-sidebar {
    width: min(100%, 320px);
  }

  .fb-task-picker-filter-grid {
    grid-template-columns: 1fr;
  }
}
`;function Be(){if(typeof document>"u"||document.getElementById(te))return;const r=document.createElement("style");r.id=te,r.textContent=He,document.head.appendChild(r)}const ae=["highest","high","medium","low","lowest"],Oe={highest:"chevron-double-up",high:"chevron-up",medium:"bars-2",low:"chevron-down",lowest:"chevron-double-down"},Ie={highest:"text-red-500",high:"text-red-500",medium:"text-orange-500",low:"text-sky-500",lowest:"text-sky-500"},Q={id:"all",label:"Усі статуси"},le=[Q,{id:L.Completed,label:"Завершена"},{id:L.Active,label:"Активна"},{id:L.Described,label:"Описано"},{id:L.Draft,label:"Чернетка"},{id:L.Archived,label:"Архівна"},{id:L.Cancelled,label:"Скасована"}],A={id:"all-goals",title:"Усі цілі"},G={id:"all-stories",title:"Усі сценарії",goalId:null};function H(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function q(r){if(!r)return null;if(r==="backlog")return"backlog";const e=Number(r);return!Number.isInteger(e)||e<1?null:e}function Ae(r){switch(r){case"highest":return"Найвищий";case"high":return"Високий";case"medium":return"Середній";case"lowest":return"Найнижчий";case"low":default:return"Низький"}}function Ge(r){const e=D(Oe[r],{size:14,strokeWidth:1.9});return e.classList.add("shrink-0",Ie[r]),e.setAttribute("aria-hidden","true"),e}function oe(r){return le.find(e=>e.id===(r??"all"))??Q}function Fe(r){return r<=4?`Цикл: ${r} дні`:`Цикл: ${r} днів`}class je{constructor(e,t,a){this.root=e,this.options=t,this.snapshot=null,this.draggedTask=null,this.goalModalOverlay=null,this.goalModalTextarea=null,this.goalModalCycleControl=null,this.habitDayModalOverlay=null,this.habitDayModalBody=null,this.habitDayModalSubtitle=null,this.taskPickerModalOverlay=null,this.taskPickerSearchInput=null,this.taskPickerStatusSelect=null,this.taskPickerGoalSelect=null,this.taskPickerStorySelect=null,this.taskPickerList=null,this.taskPickerListScrollHandler=null,this.taskComposerModalOverlay=null,this.taskComposerInput=null,this.taskComposerErrorText=null,this.taskComposerSubmitButton=null,this.restoreBacklogSearchFocus=!1,this.clickHandler=o=>this.handleClick(o),this.keydownHandler=o=>this.handleKeydown(o),this.focusoutHandler=o=>this.handleFocusOut(o),this.dragstartHandler=o=>this.handleDragStart(o),this.dragendHandler=o=>this.handleDragEnd(o),this.dragoverHandler=o=>this.handleDragOver(o),this.dragleaveHandler=o=>this.handleDragLeave(o),this.dropHandler=o=>this.handleDrop(o),this.runtime=a,Be(),this.root.id="focus-board-root",this.root.dataset.module="focus-board",this.root.addEventListener("click",this.clickHandler),this.root.addEventListener("keydown",this.keydownHandler),this.root.addEventListener("focusout",this.focusoutHandler),this.root.addEventListener("dragstart",this.dragstartHandler),this.root.addEventListener("dragend",this.dragendHandler),this.root.addEventListener("dragover",this.dragoverHandler),this.root.addEventListener("dragleave",this.dragleaveHandler),this.root.addEventListener("drop",this.dropHandler)}render(e){this.snapshot=e;const t=this.filterBacklogTasks(e.backlog,e.backlogSearchQuery);this.root.innerHTML=`
      <div class="fb-page">
        <header class="fb-header" data-focus-board-header-root="true"></header>

        <main class="fb-board-main">
          ${e.hasActiveCycle?`
          <div class="fb-board-scroll custom-scrollbar">
            <div class="fb-board-row">
              ${Array.from({length:e.cycleLength},(a,o)=>this.renderDayColumn(e,o+1)).join("")}
            </div>
          </div>
          `:this.renderEmptyCycleState()}
        </main>

        <button
          type="button"
          class="fb-backlog-backdrop"
          data-open="${e.backlogOpen}"
          data-action="close-backlog"
          aria-label="Закрити беклог"
        ></button>

        <aside class="fb-backlog-sidebar" data-open="${e.backlogOpen}">
          <div class="fb-side-header">
            <p class="fb-side-title">Беклог</p>
            <div class="fb-side-header-actions" data-backlog-header-actions-root="true"></div>
          </div>
          <div
            class="fb-backlog-search"
            data-backlog-search-root="true"
            data-backlog-search-value="${H(e.backlogSearchQuery)}"
          >
          </div>
          <div
            class="fb-backlog-list custom-scrollbar"
            data-drop-target="backlog"
            data-drag-over="false"
          >
            ${t.length>0?t.map(a=>this.renderTaskCard(a,"backlog")).join(""):`<p class="fb-empty-state">${e.backlogSearchQuery.trim().length>0?"Нічого не знайдено у беклозі.":"Беклог порожній."}</p>`}
          </div>
          <div class="fb-backlog-footer" data-backlog-create-root="true"></div>
        </aside>
      </div>
    `,this.syncGoalModal(e),this.syncHabitDayModal(e),this.syncTaskPickerModal(e),this.syncTaskComposerModal(e),this.hydrateHeader(e),this.hydrateUiLibPrimitives(),this.populateIcons()}destroy(){this.root.removeEventListener("click",this.clickHandler),this.root.removeEventListener("keydown",this.keydownHandler),this.root.removeEventListener("focusout",this.focusoutHandler),this.root.removeEventListener("dragstart",this.dragstartHandler),this.root.removeEventListener("dragend",this.dragendHandler),this.root.removeEventListener("dragover",this.dragoverHandler),this.root.removeEventListener("dragleave",this.dragleaveHandler),this.root.removeEventListener("drop",this.dropHandler),this.closeNativeGoalModal(),this.closeNativeHabitDayModal(),this.closeNativeTaskPickerModal(),this.closeNativeTaskComposerModal(),this.root.innerHTML="",this.snapshot=null}renderDayColumn(e,t){const a=e.days[t]??[],o=a.find(d=>d.isFocus)??null,s=a.filter(d=>!d.isFocus),n=this.getHabitDoneCount(e,t),i=this.formatDate(t),l=this.dateKeyFromOffset(e.cycleStartDateKey,t-1)===this.dateKeyFromDate(new Date),p=a.filter(d=>!d.completed).length,h=e.dailyGoals[t]??"";return`
      <section class="fb-day-column" data-today="${l}">
        <div class="fb-day-header">
          <div>
            <p class="fb-day-kicker">День ${t}</p>
            <h3 class="fb-day-date">${H(i)}</h3>
          </div>
          <span data-day-count-badge="${p}"></span>
        </div>

        <div
          class="fb-day-goal-wrap"
          data-day-goal-root="${t}"
          data-day-goal-value="${H(h)}"
        >
        </div>

        <button
          type="button"
          class="fb-habit-stack"
          data-action="open-habit-day"
          data-day-index="${t}"
        >
          <div class="fb-habit-stack-copy">
            <span class="fb-habit-stack-label">Звички</span>
            <div class="fb-habit-stack-row">
              <div class="fb-habit-stack-icons">
                ${e.habits.slice(0,4).map(d=>{var f;return this.renderHabitMini(d,!!((f=e.habitChecks[t])!=null&&f[d.id]))}).join("")}
              </div>
              <span class="fb-habit-stack-stats">${n}/${e.habits.length}</span>
            </div>
          </div>
          <span class="fb-chevron">></span>
        </button>

        <div class="fb-focus-zone">
          ${o?this.renderTaskCard(o,t,!0):""}
        </div>

        <div
          class="fb-task-list custom-scrollbar"
          data-drop-target="${t}"
          data-drag-over="false"
        >
          ${s.length>0?s.map(d=>this.renderTaskCard(d,t)).join(""):'<p class="fb-column-hint">Перетягни сюди задачу з іншого дня або з беклогу.</p>'}
        </div>

        <div class="fb-day-footer" data-day-create-task-root="${t}"></div>
      </section>
    `}renderTaskCard(e,t,a=!1){const o=String(t);return`
      <article
        class="fb-task-card ${a?"fb-task-card-focus":""} ${e.completed?"fb-task-card-done":""}"
        draggable="true"
        data-task-id="${e.id}"
        data-list-id="${o}"
      >
        <span
          class="fb-task-toggle-slot"
          data-task-toggle-root="true"
          data-task-id="${e.id}"
          data-list-id="${o}"
          data-task-completed="${e.completed}"
        >
        </span>
        <div class="fb-task-content">
          <p class="fb-task-text">${H(e.text)}</p>
        </div>
      </article>
    `}renderHabitMini(e,t){return`
      <span
        class="fb-habit-mini"
        style="--habit-accent: ${e.accent};"
        data-checked="${t}"
      >
        ${H(e.badge)}
      </span>
    `}renderEmptyCycleState(){return`
      <section class="fb-empty-cycle-state">
        <div data-empty-cycle-root="true"></div>
      </section>
    `}filterBacklogTasks(e,t){const a=t.trim().toLocaleLowerCase("uk-UA");return a.length===0?e:e.filter(o=>o.text.toLocaleLowerCase("uk-UA").includes(a))}findTaskPlacement(e,t){if(e.backlog.some(a=>a.id===t))return{inBacklog:!0,dayIndex:null};for(const[a,o]of Object.entries(e.days))if(o.some(s=>s.id===t))return{inBacklog:!1,dayIndex:Number(a)};return{inBacklog:!1,dayIndex:null}}handleClick(e){const t=e.target;if(!(t instanceof HTMLElement))return;const a=t.closest("[data-action]");if(!a)return;const o=a.dataset.action;if(o)switch(o){case"toggle-backlog":this.options.onToggleBacklog();return;case"close-backlog":this.options.onCloseBacklog();return;case"open-goal-modal":this.options.onOpenGoalModal();return;case"open-wallpaper-picker":this.options.onOpenWallpaperPicker();return;case"open-habit-day":{const s=Number(a.dataset.dayIndex);if(!Number.isInteger(s)||s<1)return;this.options.onOpenHabitDay(s);return}default:return}}handleKeydown(e){}handleFocusOut(e){const t=e.target;if(t instanceof HTMLElement&&t instanceof HTMLTextAreaElement&&t.matches("[data-day-goal-index]")){const a=Number(t.dataset.dayGoalIndex);if(!Number.isInteger(a)||a<1)return;this.options.onUpdateDailyGoal(a,t.value.trim())}}handleDragStart(e){var n,i;const t=e.target;if(!(t instanceof HTMLElement))return;const a=t.closest("[data-task-id][data-list-id]");if(!a)return;const o=a.dataset.taskId,s=q(a.dataset.listId);!o||s===null||(this.draggedTask={taskId:o,sourceId:s},a.dataset.dragging="true",(n=e.dataTransfer)==null||n.setData("text/plain",o),(i=e.dataTransfer)==null||i.setDragImage(a,16,16))}handleDragEnd(e){const t=e.target;if(t instanceof HTMLElement){const a=t.closest("[data-task-id][data-list-id]");a&&(a.dataset.dragging="false")}this.draggedTask=null,this.clearDropTargets()}handleDragOver(e){const t=e.target;if(!(t instanceof HTMLElement))return;const a=t.closest("[data-drop-target]");!a||!this.draggedTask||(e.preventDefault(),a.dataset.dragOver="true")}handleDragLeave(e){const t=e.target;if(!(t instanceof HTMLElement))return;const a=t.closest("[data-drop-target]");a&&(a.dataset.dragOver="false")}handleDrop(e){const t=e.target;if(!(t instanceof HTMLElement))return;const a=t.closest("[data-drop-target]");if(!a||!this.draggedTask)return;e.preventDefault();const o=q(a.dataset.dropTarget);a.dataset.dragOver="false",o!==null&&(this.options.onMoveTask(this.draggedTask.sourceId,o,this.draggedTask.taskId),this.draggedTask=null)}clearDropTargets(){this.root.querySelectorAll("[data-drop-target]").forEach(e=>{e.dataset.dragOver="false"})}getHabitDoneCount(e,t){const a=e.habitChecks[t]??{};return Object.values(a).filter(Boolean).length}formatDate(e){const t=this.snapshot,a=t==null?void 0:t.cycleStartDateKey,o=a?this.dateFromDateKey(a,e-1):new Date;return this.runtime.i18n.formatDate(o,{weekday:"short",day:"numeric",month:"short"})}dateFromDateKey(e,t=0){const[a,o,s]=e.split("-").map(Number),n=new Date(a,o-1,s,12);return n.setDate(n.getDate()+t),n}dateKeyFromDate(e){return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`}dateKeyFromOffset(e,t=0){return this.dateKeyFromDate(this.dateFromDateKey(e,t))}hydrateHeader(e){const t=this.root.querySelector("[data-focus-board-header-root]");if(!t)return;const a=P({className:"inline-flex items-center p-1.5"}),o=P({className:"fb-goal-surface inline-flex min-w-0 items-center gap-2 p-1.5"}),s=P({className:"fb-wallpaper-surface inline-flex items-center p-1.5"}),n=P({className:"inline-flex items-center p-1.5"}),i=V({tone:"text",size:"lg",text:Fe(e.cycleLength),title:"Налаштування циклу",ariaLabel:"Налаштування циклу"});i.dataset.action="open-goal-modal";const l=D("cog-6-tooth",{size:16,strokeWidth:1.8});l.setAttribute("aria-hidden","true"),i.append(l);const p=D("star",{size:16,strokeWidth:1.8});p.setAttribute("aria-hidden","true");const h=new B({value:e.goal,placeholder:"Головна мета циклу...",variant:"inline",className:"min-w-0"}).getElement();h.dataset.role="focus-board-cycle-goal-input",h.addEventListener("keydown",k=>{k.key==="Enter"&&(k.preventDefault(),this.commitHeaderGoalInput(h),h.blur())}),h.addEventListener("blur",()=>{this.commitHeaderGoalInput(h)}),o.append(p,h);const d=$({icon:"palette",size:"lg",tone:"text",title:this.runtime.i18n.t("profileSettings.appearance.change"),ariaLabel:this.runtime.i18n.t("profileSettings.appearance.change")});d.dataset.action="open-wallpaper-picker";const f=V({tone:"text",size:"lg",text:"Беклог",title:"Беклог"});f.dataset.action="toggle-backlog";const b=D("inbox",{size:16,strokeWidth:1.8});b.setAttribute("aria-hidden","true");const g=z({label:String(e.backlog.length),tone:"accent"});f.prepend(b),f.append(g),a.appendChild(i),s.appendChild(d),n.appendChild(f),t.replaceChildren(a,o,s,n)}commitHeaderGoalInput(e){var o;const t=e.value.trim(),a=((o=this.snapshot)==null?void 0:o.goal)??"";t!==a&&this.options.onUpdateCycleGoal(t)}populateIcons(){this.root.querySelectorAll("[data-icon-name]").forEach(e=>{const t=e.dataset.iconName;t&&e.replaceChildren(D(t,{size:16,strokeWidth:1.5}))})}hydrateUiLibPrimitives(){this.hydrateEmptyCycleState(),this.hydrateDayCountBadges(),this.hydrateTextareas(),this.hydrateTaskCheckboxes(),this.hydrateDayCreateButtons(),this.hydrateBacklogHeaderActions(),this.hydrateBacklogSearch(),this.hydrateBacklogCreateButton()}hydrateEmptyCycleState(){const e=this.root.querySelector("[data-empty-cycle-root]");if(!e)return;const t=P({className:"mx-auto flex w-full max-w-[32.5rem] flex-col items-start gap-3 rounded-[1.75rem] px-7 py-7"}),a=document.createElement("p");a.className="fb-empty-cycle-kicker",a.textContent="Focus Board";const o=document.createElement("h2");o.className="fb-empty-cycle-title",o.textContent="Немає активного циклу";const s=document.createElement("p");s.className="fb-empty-cycle-text",s.textContent="Створи цикл на 3-7 днів, щоб розкласти задачі з беклогу по днях.";const n=new S({text:"Створити цикл",variant:"default",className:"mt-2 min-w-[11.25rem]",onClick:()=>this.options.onOpenGoalModal()}).getElement();t.append(a,o,s,n),e.replaceChildren(t)}hydrateDayCountBadges(){this.root.querySelectorAll("[data-day-count-badge]").forEach(e=>{const t=e.dataset.dayCountBadge??"0",a=z({label:t,tone:"neutral"});e.replaceWith(a)})}hydrateTextareas(){this.root.querySelectorAll("[data-day-goal-root]").forEach(e=>{const t=Number(e.dataset.dayGoalRoot);if(!Number.isInteger(t)||t<1)return;const a=new Y({value:e.dataset.dayGoalValue??"",placeholder:"Гра дня...",rows:2,variant:"inline",className:"min-h-[56px]"}).getElement();a.dataset.dayGoalIndex=String(t),e.replaceChildren(a)})}hydrateTaskCheckboxes(){this.root.querySelectorAll("[data-task-toggle-root]").forEach(e=>{const t=e.dataset.taskId,a=q(e.dataset.listId);if(!t||a===null)return;const o=new Z({checked:e.dataset.taskCompleted==="true",ariaLabel:"Перемкнути статус задачі",stopPropagation:!0,className:"fb-task-checkbox",onChange:()=>this.options.onToggleTask(a,t)}).getElement();e.replaceChildren(o)})}hydrateDayCreateButtons(){this.root.querySelectorAll("[data-day-create-task-root]").forEach(e=>{const t=Number(e.dataset.dayCreateTaskRoot);if(!Number.isInteger(t)||t<1)return;const a=new S({text:"Нова задача",variant:"outline",className:"w-full",onClick:()=>this.options.onOpenTaskComposer(t)}).getElement();e.replaceChildren(a)})}hydrateBacklogHeaderActions(){const e=this.root.querySelector("[data-backlog-header-actions-root]");if(!e)return;const t=$({icon:"circle-stack",size:"lg",tone:"text",title:"Додати існуючу задачу",ariaLabel:"Додати існуючу задачу",onClick:()=>this.options.onOpenTaskPicker()}),a=$({icon:"x-mark",size:"lg",tone:"text",title:"Закрити беклог",ariaLabel:"Закрити беклог",onClick:()=>this.options.onCloseBacklog()});e.replaceChildren(t,a)}hydrateBacklogSearch(){const e=this.root.querySelector("[data-backlog-search-root]");if(!e)return;const t=new B({value:e.dataset.backlogSearchValue??"",placeholder:"Пошук у беклозі...",onInput:a=>{this.restoreBacklogSearchFocus=!0,this.options.onSetBacklogSearchQuery(a)}}).getElement();t.dataset.focusBoardBacklogSearch="true",e.replaceChildren(t),this.restoreBacklogSearchFocus&&(this.restoreBacklogSearchFocus=!1,window.requestAnimationFrame(()=>{t.focus();const a=t.value.length;t.setSelectionRange(a,a)}))}hydrateBacklogCreateButton(){const e=this.root.querySelector("[data-backlog-create-root]");if(!e)return;const t=new S({text:"Створити",variant:"lightgray",className:"w-full",onClick:()=>this.options.onOpenTaskComposer("backlog")}).getElement();e.replaceChildren(t)}syncGoalModal(e){if(!e.goalModalOpen){this.closeNativeGoalModal();return}if(!this.goalModalOverlay){this.openNativeGoalModal(e);return}this.goalModalTextarea&&this.goalModalTextarea.getValue()!==e.tempGoal&&this.goalModalTextarea.setValue(e.tempGoal),this.goalModalCycleControl&&this.goalModalCycleControl.getValue()!==e.tempCycleLength&&this.goalModalCycleControl.setValue(e.tempCycleLength)}syncHabitDayModal(e){if(e.activeHabitDay===null){this.closeNativeHabitDayModal();return}if(!this.habitDayModalOverlay){this.openNativeHabitDayModal(e,e.activeHabitDay);return}this.renderNativeHabitDayContent(e,e.activeHabitDay)}syncTaskPickerModal(e){var t,a,o;if(!e.taskPicker.open){this.closeNativeTaskPickerModal();return}if(!this.taskPickerModalOverlay){this.openNativeTaskPickerModal(e);return}this.taskPickerSearchInput&&this.taskPickerSearchInput.getValue()!==e.taskPicker.query&&this.taskPickerSearchInput.setValue(e.taskPicker.query),(t=this.taskPickerStatusSelect)==null||t.setSelected(oe(e.taskPicker.status)),(a=this.taskPickerGoalSelect)==null||a.setSelected(e.taskPicker.goal??A),(o=this.taskPickerStorySelect)==null||o.setSelected(e.taskPicker.story??G),this.renderNativeTaskPickerContent(e)}syncTaskComposerModal(e){if(!e.taskComposer.open){this.closeNativeTaskComposerModal();return}if(!this.taskComposerModalOverlay){this.openNativeTaskComposerModal(e);return}this.taskComposerInput&&this.taskComposerInput.getValue()!==e.taskComposer.title&&this.taskComposerInput.setValue(e.taskComposer.title),this.taskComposerErrorText&&(this.taskComposerErrorText.textContent=e.taskComposer.error??"",this.taskComposerErrorText.hidden=!e.taskComposer.error),this.taskComposerSubmitButton&&(this.taskComposerSubmitButton.textContent=e.taskComposer.saving?"Створення...":"Створити",this.taskComposerSubmitButton.disabled=e.taskComposer.saving)}openNativeGoalModal(e){this.closeNativeGoalModal();const{overlay:t,container:a,body:o,footer:s}=O("Налаштування циклу",{subtitle:"Задай загальну мету і горизонт планування.",onClose:()=>this.options.onCloseGoalModal(),intent:"form",zIndex:260});t.dataset.role="focus-board-goal-modal",a.dataset.role="focus-board-goal-modal-container",a.style.width="min(38rem, calc(100vw - 2rem))",a.style.maxWidth="min(38rem, calc(100vw - 2rem))",a.addEventListener("keydown",g=>{g.stopPropagation()});const n=document.createElement("div");n.className="flex flex-col gap-5";const i=new Y({value:e.tempGoal,placeholder:"Чого ти хочеш досягти за ці дні?",rows:4,id:"fb-goal-modal-input",onInput:g=>{var k;this.options.onSetGoalModalDraft(g,((k=this.goalModalCycleControl)==null?void 0:k.getValue())??e.tempCycleLength)}});this.goalModalTextarea=i;const l=M({label:"Мета на весь цикл",className:"mb-0",control:i.getElement()});n.appendChild(l.element);const p=he({size:"md",fullWidth:!0,ariaLabel:"Тривалість циклу",value:e.tempCycleLength,options:e.cycleLengthOptions.map(g=>({id:`focus-board-cycle-${g}`,value:g,label:`${g} дн`,title:`${g} днів у циклі`})),onChange:g=>{var k;this.options.onSetGoalModalDraft(((k=this.goalModalTextarea)==null?void 0:k.getValue())??"",g)}});this.goalModalCycleControl=p;const h=M({label:"Тривалість циклу",className:"mb-0",control:p.element});n.appendChild(h.element),o.appendChild(n);const d=R({variant:"form"}),f=new S({text:"Скасувати",variant:"outline",className:N("default"),onClick:()=>this.options.onCloseGoalModal()}).getElement(),b=new S({text:"Зберегти",variant:"default",className:N("wide"),onClick:()=>{var g;return this.options.onSaveGoalAndCycle(((g=this.goalModalTextarea)==null?void 0:g.getValue())??"")}}).getElement();d.append(f,b),s.appendChild(d),this.goalModalOverlay=t}closeNativeGoalModal(){var e,t;(e=this.goalModalCycleControl)==null||e.destroy(),this.goalModalCycleControl=null,this.goalModalTextarea=null,(t=this.goalModalOverlay)==null||t.remove(),this.goalModalOverlay=null}openNativeHabitDayModal(e,t){this.closeNativeHabitDayModal();const{overlay:a,container:o,header:s,body:n,footer:i}=O("Звички дня",{onClose:()=>this.options.onCloseHabitDay(),intent:"form",presentation:"bottom-sheet",zIndex:265});a.dataset.role="focus-board-habit-day-modal",o.dataset.role="focus-board-habit-day-modal-container",o.style.width="min(42rem, calc(100vw - 2rem))",o.style.maxWidth="min(42rem, calc(100vw - 2rem))",o.addEventListener("keydown",d=>{d.stopPropagation()});const l=document.createElement("p");l.className="mt-1 text-sm leading-5 text-slate-500",this.habitDayModalSubtitle=l,s.appendChild(l),n.className="min-h-0 flex-1 overflow-y-auto",this.habitDayModalBody=n;const p=R({variant:"form"}),h=new S({text:"Готово",variant:"default",className:N("wide"),onClick:()=>this.options.onCloseHabitDay()}).getElement();p.append(h),i.appendChild(p),this.habitDayModalOverlay=a,this.renderNativeHabitDayContent(e,t)}renderNativeHabitDayContent(e,t){if(!this.habitDayModalBody)return;const a=this.getHabitDoneCount(e,t);this.habitDayModalSubtitle&&(this.habitDayModalSubtitle.textContent=`${a} з ${e.habits.length} виконано`),this.habitDayModalBody.replaceChildren();const o=document.createElement("div");o.className="flex flex-col px-4 py-4 md:px-6 md:py-5",this.buildHabitPriorityGroups(e).forEach((s,n)=>{if(n>0){const d=document.createElement("div");d.className="my-2 border-t border-slate-200/80",o.appendChild(d)}const i=document.createElement("section");i.className="flex flex-col";const l=document.createElement("div");l.className="flex items-center gap-2 px-3 py-1",l.appendChild(Ge(s.priority));const p=document.createElement("p");p.className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500",p.textContent=Ae(s.priority),l.appendChild(p),i.appendChild(l);const h=document.createElement("div");h.className="flex flex-wrap gap-1",s.habits.forEach(d=>{var u;const f=!!((u=e.habitChecks[t])!=null&&u[d.id]),b=document.createElement("button");b.type="button",b.className="flex min-h-[56px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-100/80 sm:basis-[calc(50%-0.125rem)] sm:flex-1",b.dataset.role="focus-board-habit-day-row",b.dataset.priority=d.priority;const g=new Z({checked:f,ariaLabel:`Позначити звичку ${d.text}`,stopPropagation:!0,onChange:()=>this.options.onToggleHabit(t,d.id)}).getElement(),k=z({label:d.badge,tone:f?"accent":"neutral"});k.style.flexShrink="0";const m=document.createElement("span");m.className="min-w-0 text-sm font-medium leading-5 text-slate-700",m.textContent=d.text,b.append(g,k,m),b.addEventListener("click",()=>{this.options.onToggleHabit(t,d.id)}),h.appendChild(b)}),i.appendChild(h),o.appendChild(i)}),this.habitDayModalBody.appendChild(o)}buildHabitPriorityGroups(e){const t=new Map;return ae.forEach(a=>t.set(a,[])),e.habits.forEach(a=>{const o=re(a.priority,"low"),s=t.get(o);s&&s.push(a)}),ae.map(a=>({priority:a,habits:[...t.get(a)??[]].sort((o,s)=>o.text.localeCompare(s.text))})).filter(a=>a.habits.length>0)}closeNativeHabitDayModal(){var e;this.habitDayModalBody=null,this.habitDayModalSubtitle=null,(e=this.habitDayModalOverlay)==null||e.remove(),this.habitDayModalOverlay=null}openNativeTaskPickerModal(e){this.closeNativeTaskPickerModal();const{overlay:t,container:a,body:o}=O("Усі задачі",{subtitle:"Шукай задачі у проекті та додавай їх у беклог.",onClose:()=>this.options.onCloseTaskPicker(),intent:"form",zIndex:270});t.dataset.role="focus-board-task-picker-modal",a.style.width="min(44rem, calc(100vw - 2rem))",a.style.maxWidth="min(44rem, calc(100vw - 2rem))";const s=document.createElement("div");s.className="flex min-h-0 flex-1 flex-col gap-4";const n=document.createElement("div");n.className="px-6 pt-5";const i=new B({value:e.taskPicker.query,placeholder:"Пошук задач...",autoFocus:!0,onInput:u=>this.options.onSetTaskPickerQuery(u)});this.taskPickerSearchInput=i,n.appendChild(i.getElement());const l=document.createElement("div");l.className="fb-task-picker-filters";const p=document.createElement("div");p.className="fb-task-picker-filter-grid";const h=M({label:"Статус",className:"min-w-0"}),d=new ue({value:oe(e.taskPicker.status),placeholder:Q.label,items:[...le],getKey:u=>String(u.id),getLabel:u=>u.label,onSelect:u=>{this.options.onSetTaskPickerStatus(u.id==="all"?null:u.id)},className:"w-full",ariaLabel:"Фільтр задач за статусом",portalTarget:t});this.taskPickerStatusSelect=d,h.setControl(d.element);const f=M({label:"Ціль (goal)",className:"min-w-0"}),b=new X({placeholder:A.title,searchPlaceholder:"Шукати цілі...",clearSearchLabel:"Очистити пошук цілей",loadingLabel:"Завантаження цілей...",emptyLabel:"Цілей не знайдено.",hintLabel:"Почни вводити назву цілі.",errorFallbackLabel:"Не вдалося завантажити цілі.",value:e.taskPicker.goal??A,className:"w-full",ariaLabel:"Фільтр задач за ціллю",portalTarget:t,getKey:u=>u.id==="all-goals"?u.id:`goal-${u.id}`,getLabel:u=>u.title,onSelect:u=>{this.options.onSetTaskPickerGoal(u.id==="all-goals"?null:u)},loadPage:async(u,y,w)=>{const c=await this.options.searchTaskPickerGoals({query:u,page:y,pageSize:w});return{items:y===1?[A,...c.items]:c.items,hasMore:c.nextPage!==null}}});this.taskPickerGoalSelect=b,f.setControl(b.element);const g=M({label:"Сценарій (story)",className:"min-w-0"}),k=new X({placeholder:G.title,searchPlaceholder:"Шукати сценарії...",clearSearchLabel:"Очистити пошук сценаріїв",loadingLabel:"Завантаження сценаріїв...",emptyLabel:"Сценаріїв не знайдено.",hintLabel:e.taskPicker.goal===null?"Почни вводити назву сценарію.":"Почни вводити назву сценарію для вибраної цілі.",errorFallbackLabel:"Не вдалося завантажити сценарії.",value:e.taskPicker.story??G,className:"w-full",ariaLabel:"Фільтр задач за сценарієм",portalTarget:t,getKey:u=>u.id==="all-stories"?u.id:`story-${u.id}`,getLabel:u=>u.title,onSelect:u=>{this.options.onSetTaskPickerStory(u.id==="all-stories"?null:u)},loadPage:async(u,y,w)=>{var C,x;const c=await this.options.searchTaskPickerStories({query:u,page:y,pageSize:w,goalId:((x=(C=this.snapshot)==null?void 0:C.taskPicker.goal)==null?void 0:x.id)??null});return{items:y===1?[G,...c.items]:c.items,hasMore:c.nextPage!==null}}});this.taskPickerStorySelect=k,g.setControl(k.element),p.append(h.element,f.element,g.element),l.appendChild(p);const m=document.createElement("div");m.className="fb-task-picker-list custom-scrollbar",this.taskPickerList=m,this.taskPickerListScrollHandler=u=>{const y=u.currentTarget;y instanceof HTMLElement&&y.scrollTop+y.clientHeight>=y.scrollHeight-120&&this.options.onLoadMoreTaskPicker()},m.addEventListener("scroll",this.taskPickerListScrollHandler),s.append(n,l,m),o.className="flex min-h-0 flex-1 flex-col overflow-hidden p-0",o.appendChild(s),this.taskPickerModalOverlay=t,this.renderNativeTaskPickerContent(e)}renderNativeTaskPickerContent(e){if(this.taskPickerList){if(this.taskPickerList.replaceChildren(),e.taskPicker.items.length===0&&e.taskPicker.loading){const t=document.createElement("p");t.className="fb-empty-state",t.textContent="Завантаження задач...",this.taskPickerList.appendChild(t);return}if(e.taskPicker.items.length===0){const t=document.createElement("p");t.className="fb-empty-state",t.textContent=e.taskPicker.query.trim().length>0?"За цим запитом задач не знайдено.":"Немає задач для додавання.",this.taskPickerList.appendChild(t)}else e.taskPicker.items.forEach(t=>{var p;const a=this.findTaskPlacement(e,t.id),o=P({className:"flex items-center justify-between gap-3 rounded-2xl px-4 py-3"}),s=document.createElement("div");s.className="min-w-0 flex-1";const n=document.createElement("p");n.className="truncate text-sm font-medium leading-5 text-slate-800",n.textContent=t.text;const i=document.createElement("p");i.className="mt-1 text-xs leading-4 text-slate-500",a.inBacklog?i.textContent="Уже в беклозі":a.dayIndex!==null?i.textContent=`Уже призначена на день ${a.dayIndex}`:t.completed?i.textContent="Виконана задача":i.textContent="Можна додати у беклог",s.append(n,i);const l=new S({text:a.inBacklog||a.dayIndex!==null?"Додано":void 0,variant:a.inBacklog||a.dayIndex!==null?"secondary":"default",disabled:a.inBacklog||a.dayIndex!==null,children:a.inBacklog||a.dayIndex!==null?void 0:(()=>{const h=document.createElement("span");return h.className="inline-flex items-center gap-2",h.append(D("plus",{size:16,strokeWidth:1.9}),document.createTextNode("В беклог")),h})(),onClick:()=>this.options.onAddTaskToBacklog(t.id)}).getElement();o.append(s,l),(p=this.taskPickerList)==null||p.appendChild(o)});if(e.taskPicker.error){const t=document.createElement("p");t.className="px-1 text-sm leading-5 text-red-500",t.textContent=e.taskPicker.error,this.taskPickerList.appendChild(t)}if(e.taskPicker.loading&&e.taskPicker.items.length>0){const t=document.createElement("p");t.className="fb-empty-state",t.textContent="Завантаження ще...",this.taskPickerList.appendChild(t)}else if(e.taskPicker.nextPage!==null){const t=document.createElement("div");t.className="flex justify-center pt-2";const a=new S({text:"Завантажити ще",variant:"outline",onClick:()=>this.options.onLoadMoreTaskPicker()}).getElement();t.appendChild(a),this.taskPickerList.appendChild(t)}}}closeNativeTaskPickerModal(){var e,t,a,o;this.taskPickerList&&this.taskPickerListScrollHandler&&this.taskPickerList.removeEventListener("scroll",this.taskPickerListScrollHandler),this.taskPickerListScrollHandler=null,(e=this.taskPickerStatusSelect)==null||e.destroy(),this.taskPickerStatusSelect=null,(t=this.taskPickerGoalSelect)==null||t.destroy(),this.taskPickerGoalSelect=null,(a=this.taskPickerStorySelect)==null||a.destroy(),this.taskPickerStorySelect=null,this.taskPickerSearchInput=null,this.taskPickerList=null,(o=this.taskPickerModalOverlay)==null||o.remove(),this.taskPickerModalOverlay=null}openNativeTaskComposerModal(e){this.closeNativeTaskComposerModal();const t=e.taskComposer.target==="backlog",a=t?"Нова задача у беклог":"Нова задача у день",o=t?"Створи задачу і додай її в беклог.":"Створи задачу і одразу розмісти її у вибраному дні.",{overlay:s,container:n,body:i,footer:l}=O(a,{subtitle:o,onClose:()=>this.options.onCloseTaskComposer(),intent:"form",zIndex:272});s.dataset.role="focus-board-task-composer-modal",n.style.width="min(32rem, calc(100vw - 2rem))",n.style.maxWidth="min(32rem, calc(100vw - 2rem))";const p=document.createElement("div");p.className="flex flex-col gap-2";const h=new B({value:e.taskComposer.title,placeholder:"Назва задачі...",autoFocus:!0,onInput:m=>this.options.onSetTaskComposerTitle(m)});this.taskComposerInput=h;const d=M({label:"Назва задачі",className:"mb-0",control:h.getElement()});p.appendChild(d.element);const f=document.createElement("p");f.className="text-sm leading-5 text-red-500",f.textContent=e.taskComposer.error??"",f.hidden=!e.taskComposer.error,this.taskComposerErrorText=f,p.appendChild(f),i.appendChild(p);const b=R({variant:"form"}),g=new S({text:"Скасувати",variant:"outline",className:N("default"),onClick:()=>this.options.onCloseTaskComposer()}).getElement(),k=new S({text:e.taskComposer.saving?"Створення...":"Створити",variant:"default",disabled:e.taskComposer.saving,className:N("wide"),onClick:()=>this.options.onSubmitTaskComposer()}).getElement();this.taskComposerSubmitButton=k,b.append(g,k),l.appendChild(b),this.taskComposerModalOverlay=s}closeNativeTaskComposerModal(){var e;this.taskComposerInput=null,this.taskComposerErrorText=null,this.taskComposerSubmitButton=null,(e=this.taskComposerModalOverlay)==null||e.remove(),this.taskComposerModalOverlay=null}}const se=["#60a5fa","#34d399","#f59e0b","#fb7185","#818cf8","#22c55e","#f97316","#14b8a6"];function ce(r){const e=r.getFullYear(),t=String(r.getMonth()+1).padStart(2,"0"),a=String(r.getDate()).padStart(2,"0");return`${e}-${t}-${a}`}function $e(r){const[e,t,a]=r.split("-").map(Number);return new Date(e,t-1,a,12)}function ze(r,e){const t=$e(r);return t.setDate(t.getDate()+e),ce(t)}function Re(){return ce(new Date)}function de(r){return W.includes(r)}function F(r,e){return{id:r.uuid??String(r.id),text:r.title,completed:!!r.is_completed,isFocus:e}}function Ke(r){return{id:r.uuid??String(r.id),text:r.title,completed:!!r.is_completed}}function qe(r){return{id:r.id,title:r.title}}function _e(r){var e;return{id:r.id,title:r.title,goalId:r.goal_id??((e=r.goal)==null?void 0:e.id)??null}}function Ue(r,e){const t=r.title.trim().charAt(0).toUpperCase()||"+";return{id:r.uuid,text:r.title,accent:se[e%se.length],badge:t,priority:re(r.priority,"low")}}function We(r,e){return r.completions.some(([t,a])=>t===e&&a)}function Qe(){return{cycleStartDateKey:null,cycleLength:null,goal:"",days:[]}}function Ve(){return{taskUuids:[]}}function Ye(r){return r?{cycleStartDateKey:r.cycleStartDateKey??null,cycleLength:de(r.cycleLength)?r.cycleLength:null,goal:r.goal??"",days:Array.isArray(r.days)?r.days:[]}:Qe()}function Ze(r){return r?{taskUuids:Array.isArray(r.taskUuids)?r.taskUuids:[]}:Ve()}function Xe(r){const e=[];for(let t=1;t<=r.cycleLength;t+=1){const a=r.days[t]??[],o=a.find(n=>n.isFocus)??null,s=a.filter(n=>!n.isFocus).map(n=>n.id);e.push({dayNumber:t,goal:r.dailyGoals[t]??"",focusTaskUuid:(o==null?void 0:o.id)??null,supportTaskUuids:s})}return{cycleStartDateKey:r.cycleStartDateKey,cycleLength:r.cycleLength,goal:r.goal,days:e}}function Je(r){return{taskUuids:r.backlog.map(e=>e.id)}}class et{constructor(e){this.deps=e}async load(){try{const[e,t,a]=await Promise.all([v(this.deps.focusBoardApi.loadSnapshot()),v(this.deps.backlogApi.loadSnapshot()),v(this.deps.habitsApi.getHabits())]),o=Ye(e),s=Ze(t),n=de(o.cycleLength)&&typeof o.cycleStartDateKey=="string",i=o.cycleLength??3,l=o.cycleStartDateKey??Re(),p=o.days,h=[...s.taskUuids];p.forEach(c=>{c.focusTaskUuid&&h.push(c.focusTaskUuid),h.push(...c.supportTaskUuids)});const d=[...new Set(h)],f=d.length>0?await v(this.deps.tasksApi.fetchTasksByUuids(d)):[],b=new Map;f.forEach(c=>{const C=c.uuid??String(c.id);b.set(C,c)});const g={},k={},m=new Set;for(let c=1;c<=i;c+=1)g[c]=[];o.days.forEach(c=>{if(c.dayNumber<1||c.dayNumber>i)return;if(k[c.dayNumber]=c.goal??"",c.focusTaskUuid){const x=b.get(c.focusTaskUuid);x&&(m.add(c.focusTaskUuid),g[c.dayNumber]=g[c.dayNumber].concat(F(x,!0)))}(Array.isArray(c.supportTaskUuids)?c.supportTaskUuids:[]).forEach(x=>{const E=b.get(x);!E||m.has(x)||(m.add(x),g[c.dayNumber]=g[c.dayNumber].concat(F(E,!1)))})});const u=s.taskUuids.filter(c=>!m.has(c)).map(c=>b.get(c)).filter(c=>!!c).map(c=>F(c,!1)),y=a.map((c,C)=>Ue(c,C)),w={};for(let c=1;c<=i;c+=1){const C=ze(l,c-1),x={};a.forEach(E=>{x[E.uuid]=We(E,C)}),w[c]=x}return{title:"Focus Board",hasActiveCycle:n,cycleStartDateKey:l,goal:o.goal,tempGoal:o.goal,cycleLength:i,tempCycleLength:i,cycleLengthOptions:W,habits:y,habitChecks:w,dailyGoals:k,days:g,backlog:u,backlogSearchQuery:"",backlogOpen:!1,goalModalOpen:!1,habitManagerOpen:!1,activeHabitDay:null,taskPicker:{open:!1,query:"",items:[],loading:!1,error:null,nextPage:1,total:0,status:null,goal:null,story:null},taskComposer:{open:!1,target:null,title:"",saving:!1,error:null}}}catch(e){return console.warn("Focus board snapshot load failed.",e),null}}async save(e){const t=Xe(e),a=Je(e);await v(ge({board:this.deps.focusBoardApi.saveSnapshot(t),backlog:this.deps.backlogApi.saveSnapshot(a)}))}async searchTasks(e){const t=await v(this.deps.tasksApi.fetchTasks({search:e.query,page:e.page,pageSize:e.pageSize,...e.status?{status:e.status}:{},...e.goalId!==null?{goal:e.goalId}:{},...e.storyId!==null?{story:e.storyId}:{}}));return{items:t.results.map(a=>Ke(a)),nextPage:t.next?e.page+1:null,total:t.count}}async searchGoals(e){const t=await v(this.deps.goalsApi.searchGoalsForPicker({search:e.query,page:e.page,pageSize:e.pageSize}));return{items:t.results.map(a=>qe(a)),nextPage:t.next?e.page+1:null}}async searchStories(e){const t=await v(this.deps.storiesApi.fetchStories({search:e.query,page:e.page,pageSize:e.pageSize,...e.goalId!==null?{goal:e.goalId}:{}}));return{items:t.results.map(a=>_e(a)),nextPage:t.next?e.page+1:null}}async createTask(e){const t=await v(this.deps.tasksApi.createTask({title:e,description:"",is_standalone:!0}));return F(t,!1)}async setTaskCompleted(e,t){await v(this.deps.tasksApi.patchTask(e,{is_completed:t}))}async toggleHabitCompletion(e,t){await v(this.deps.habitsApi.toggleHabitCompletion(e,t))}}class tt{constructor(e=ne(),t=new et((()=>{const o=new fe(be.apiUrl);return{focusBoardApi:new Se(o),backlogApi:new ve(o),tasksApi:new xe(o),goalsApi:new ye(o),storiesApi:new me(o),habitsApi:new ke(o)}})()),a={}){this.runtime=e,this.repository=t,this.options=a,this.root=null,this.store=null,this.view=null,this.subscriptions=new J}mount(e){if(this.root)return;const t=document.createElement("div");t.style.width="100%",t.style.height="100%",e.appendChild(t),this.root=t;const a=new U(void 0,this.repository);this.store=a;const o=new je(t,{onToggleBacklog:()=>a.toggleBacklog(),onCloseBacklog:()=>a.closeBacklog(),onOpenGoalModal:()=>a.openGoalModal(),onCloseGoalModal:()=>a.closeGoalModal(),onSetGoalModalDraft:(s,n)=>a.setGoalModalDraft(s,n),onSaveGoalAndCycle:s=>a.saveGoalAndCycle(s),onOpenHabitDay:s=>a.openHabitDay(s),onCloseHabitDay:()=>a.closeHabitDay(),onUpdateDailyGoal:(s,n)=>a.updateDailyGoal(s,n),onToggleTask:(s,n)=>a.toggleTask(s,n),onMoveTask:(s,n,i)=>a.moveTask(s,n,i),onToggleHabit:(s,n)=>a.toggleHabit(s,n),onSetBacklogSearchQuery:s=>a.setBacklogSearchQuery(s),onOpenTaskPicker:()=>a.openTaskPicker(),onCloseTaskPicker:()=>a.closeTaskPicker(),onSetTaskPickerQuery:s=>a.setTaskPickerQuery(s),onSetTaskPickerStatus:s=>a.setTaskPickerStatus(s),onSetTaskPickerGoal:s=>a.setTaskPickerGoal(s),onSetTaskPickerStory:s=>a.setTaskPickerStory(s),onLoadMoreTaskPicker:()=>a.loadMoreTaskPicker(),onAddTaskToBacklog:s=>a.addTaskToBacklog(s),searchTaskPickerGoals:s=>this.repository.searchGoals(s),searchTaskPickerStories:s=>this.repository.searchStories(s),onOpenTaskComposer:s=>a.openTaskComposer(s),onCloseTaskComposer:()=>a.closeTaskComposer(),onSetTaskComposerTitle:s=>a.setTaskComposerTitle(s),onSubmitTaskComposer:()=>a.submitTaskComposer(),onOpenWallpaperPicker:this.options.onOpenWallpaperPicker??(()=>{}),onUpdateCycleGoal:s=>a.updateCycleGoal(s)},this.runtime);this.view=o,this.subscriptions.add(a.state$.subscribe(s=>o.render(s))),this.subscriptions.add(this.runtime.subscribe(()=>{o.render(a.getSnapshot())}))}unmount(){var e,t,a;this.subscriptions.unsubscribe(),this.subscriptions=new J,(e=this.store)==null||e.destroy(),this.store=null,(t=this.view)==null||t.destroy(),this.view=null,(a=this.root)==null||a.remove(),this.root=null}}class ot{constructor(e={}){this.id="focus-board",this.app=null,this.runtime=e.runtime??ne(),this.onOpenWallpaperPicker=e.onOpenWallpaperPicker??(()=>{})}mount(e){if(this.app)return;const t=new tt(this.runtime,void 0,{onOpenWallpaperPicker:this.onOpenWallpaperPicker});t.mount(e),this.app=t}unmount(){var e;(e=this.app)==null||e.unmount(),this.app=null}getAiAssistantSnapshot(){return null}}export{ot as FocusBoardModule};
