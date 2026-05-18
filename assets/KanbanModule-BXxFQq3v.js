import{m as P,H as re,e as ae,T as le,a as de,f as ce,b as k,S as d,B as ue,c as pe,d as M,t as he,s as me,g as O,n as T,h as be,o as fe,C as ge,P as C,i as ke,K as F,j as q}from"./index-wC9KDwt3.js";class ye{constructor(n){this.http=n}getEvents(){return this.http.get("/events/").pipe(P(n=>Array.isArray(n)?n:n.results))}}class xe{constructor(){this.http=new re(ae.apiUrl),this.tasksApi=new le(this.http),this.habitsApi=new de(this.http),this.eventsApi=new ye(this.http)}loadSnapshot(n=new Date){return ce({tasks:this.tasksApi.getTasks().pipe(k()),habits:this.habitsApi.getHabits().pipe(k()),events:this.eventsApi.getEvents().pipe(k())}).pipe(P(({tasks:t,habits:s,events:o})=>({tasks:t,habits:s,events:o,now:new Date(n)})))}patchTask(n,t){const s={};return t.title!==void 0&&(s.title=t.title),t.status!==void 0&&(s.status=t.status),t.priority!==void 0&&(s.priority=t.priority),t.dueDate!==void 0&&(s.due_date=t.dueDate),this.tasksApi.patchTask(n,s).pipe(k())}toggleHabitCompletion(n,t){return this.habitsApi.toggleHabitCompletion(n,t).pipe(k())}patchHabitTitle(n,t){return this.habitsApi.patchHabit(n,{title:t}).pipe(k())}}const A=["today","tomorrow","soon","overdue","planned","todo","done","cancelled"],X={today:"Today",tomorrow:"Tomorrow",soon:"Soon",overdue:"Overdue",planned:"Planned",todo:"Todo",done:"Done",cancelled:"Cancelled"},N=5,ve=24*60*60*1e3;function B(e){return e<10?`0${e}`:String(e)}function we(e){const n=/^(\d{4})-(\d{2})-(\d{2})$/.exec(e.trim());if(!n)return null;const t=Number(n[1]),s=Number(n[2]),o=Number(n[3]);if(!Number.isFinite(t)||!Number.isFinite(s)||!Number.isFinite(o))return null;const i=new Date(t,s-1,o);return Number.isNaN(i.getTime())?null:i}function x(e){if(!e)return null;if(e instanceof Date)return Number.isNaN(e.getTime())?null:e;const n=we(e);if(n)return n;const t=new Date(e);return Number.isNaN(t.getTime())?null:t}function U(e){return new Date(e.getFullYear(),e.getMonth(),e.getDate())}function Z(e,n){const t=U(e).getTime(),s=U(n).getTime();return Math.floor((t-s)/ve)}function Ce(e,n){return e.getFullYear()===n.getFullYear()&&e.getMonth()===n.getMonth()&&e.getDate()===n.getDate()}function Ee(e){if(!e)return"";const n=e.getFullYear(),t=B(e.getMonth()+1),s=B(e.getDate());return`${n}-${t}-${s}`}function Te(e){return e?new Intl.DateTimeFormat(void 0,{month:"short",day:"numeric"}).format(e):"No date"}function Se(e){const n=new Date(e.getFullYear(),e.getMonth(),e.getDate()+1,0,0,0,0);return Math.max(1e3,n.getTime()-e.getTime())}function ee(e){return e===d.Completed||e===d.Archived}function te(e){return e===d.Cancelled}function Ne(e){return e===d.Active||e===d.Draft||e===d.Described}function Ae(e,n){return e.getTime()<n.getTime()}function ne(e,n){return Ce(e,n)}function De(e){return e===1}function Le(e,n,t){return e>=n&&e<=t}function He(e,n){const t=x(e);if(!t)return null;if(Ae(t,n))return"overdue";if(ne(t,n))return"today";const s=Z(t,n);return De(s)?"tomorrow":Le(s,2,N)?"soon":s>N?"planned":null}function Ie(e,n){const t=x(e.due_date),s=te(e.status),o=e.status===d.Archived;if(t&&ne(t,n)&&!s&&!o)return"today";if(e.status===d.Completed)return"done";if(s)return"cancelled";const i=He(t,n);return i||(Ne(e.status)?"todo":null)}function Re(e,n){return e.challenge?n==="today"||n==="tomorrow":!0}function Ge(e,n){if(ee(e.status)||te(e.status))return null;const t=x(e.start_time),s=x(e.end_time);if(!t)return null;const o=Z(t,n);return o===0?!s||s.getTime()>n.getTime()?"today":null:o===1?"tomorrow":o>=2&&o<=N?"soon":o>N?"planned":null}function Ke(e){return e.status===d.Active}function j(e,n){return`${e}:${n}`}function Y(){return A.map(e=>({id:e,title:X[e],progress:{completed:0,total:0},sections:{events:[],storyGroups:[],tasks:[],challengeTasks:[],habits:[],completedTasks:[]}}))}function _e(){return new Map(A.map(e=>[e,{id:e,title:X[e],events:[],tasks:[],challengeTasks:[],habits:[],completedTasks:[],storyGroupsByKey:new Map}]))}function ze(e){var i,r;const n=x(e.due_date),t=((i=e.story)==null?void 0:i.id)??e.story_id??null,s=t?String(t):null,o=((r=e.story)==null?void 0:r.title)??(s?`Story #${s}`:null);return{key:e.uuid??String(e.id),taskId:e.id,title:e.title,status:e.status,priority:e.priority,dueDate:n,dueDateInput:Ee(n),dueDateLabel:Te(n),isCompleted:ee(e.status),isChallenge:e.challenge!==null,storyKey:s,storyTitle:o,source:e}}function Me(e){return{key:String(e.id),eventId:e.id,title:e.title,startTime:x(e.start_time),endTime:x(e.end_time),source:e}}function je(e){const n=e.is_due_today===!0;return{key:e.uuid,habitUuid:e.uuid,title:e.title,isDueToday:n,isCompletedToday:!n,source:e}}function Pe(e,n,t){const s=t,o=n.storyTitle??`Story #${t}`;let i=e.storyGroupsByKey.get(s);i||(i={key:s,storyKey:s,title:o,tasks:[]},e.storyGroupsByKey.set(s,i)),i.tasks.unshift(n)}function $e(e,n){const t=n.collapsedStoryGroups??new Set;return Array.from(e.storyGroupsByKey.values()).map(o=>{const i=j(e.id,o.storyKey);return{key:o.key,storyKey:o.storyKey,title:o.title,collapsed:t.has(i),tasks:o.tasks,completedCount:o.tasks.filter(r=>r.isCompleted).length,totalCount:o.tasks.length}})}function Oe(e,n){const t=n.reduce((l,c)=>l+c.tasks.length,0),s=e.habits.filter(l=>l.isCompletedToday).length,o=e.habits.length,i=e.completedTasks.length+s,r=t+e.tasks.length+e.challengeTasks.length+e.completedTasks.length+o;return{completed:i,total:r}}function Fe(e,n,t){if(t.isCompleted){n==="today"?e.completedTasks.push(t):e.completedTasks.unshift(t);return}if(t.storyKey){Pe(e,t,t.storyKey);return}if(t.isChallenge){e.challengeTasks.unshift(t);return}e.tasks.unshift(t)}function qe(e,n,t){e.forEach(s=>{const o=Ie(s,t);if(!o||!Re(s,o))return;const i=n.get(o);if(!i)return;const r=ze(s);Fe(i,o,r)})}function Be(e,n){const t=n.get("today");t&&e.forEach(s=>{Ke(s)&&t.habits.push(je(s))})}function Ue(e,n,t){e.forEach(s=>{const o=Ge(s,t);if(!o)return;const i=n.get(o);i&&i.events.push(Me(s))})}function Ye(e,n={}){const t=_e(),s=e.now;return qe(e.tasks,t,s),Be(e.habits,t),Ue(e.events,t,s),A.map(o=>{const i=t.get(o);if(!i)throw new Error(`Missing mutable column "${o}".`);const r=$e(i,n),l=Oe(i,r);return{id:i.id,title:i.title,progress:l,sections:{events:i.events,storyGroups:r,tasks:i.tasks,challengeTasks:i.challengeTasks,habits:i.habits,completedTasks:i.completedTasks}}})}function S(e){return e instanceof Error&&e.message?e.message:"Unable to refresh kanban board."}class Je{constructor(n){this.dataService=n,this.stateSubject=new ue({columns:Y(),loading:!1,error:null,updatedAt:null}),this.refreshRequests$=new pe,this.subscriptions=new M,this.collapsedStoryGroups=new Set,this.latestSnapshot=null,this.midnightTimer=null,this.started=!1,this.subscriptions.add(this.refreshRequests$.pipe(he(({silent:t})=>{t||this.patchState({loading:!0,error:null})}),me(t=>this.dataService.loadSnapshot(new Date).pipe(P(s=>({ok:!0,snapshot:s,request:t})),be(s=>fe({ok:!1,error:s,request:t}))))).subscribe(t=>{if(!t.ok){this.patchState({loading:!1,error:S(t.error)});return}this.latestSnapshot=t.snapshot,this.rebuildFromSnapshot()}))}get state$(){return this.stateSubject.asObservable()}getState(){return this.stateSubject.value}start(){this.started||(this.started=!0,this.scheduleMidnightRefresh(),this.requestRefresh("initial"))}destroy(){this.midnightTimer!==null&&(window.clearTimeout(this.midnightTimer),this.midnightTimer=null),this.subscriptions.unsubscribe(),this.stateSubject.complete(),this.refreshRequests$.complete()}requestRefresh(n="manual",t=!1){this.refreshRequests$.next({reason:n,silent:t})}patchTask(n,t){!this.latestSnapshot||!(t.title!==void 0||t.status!==void 0||t.priority!==void 0||t.dueDate!==void 0)||(this.applyTaskPatchOptimistic(n,t),this.dataService.patchTask(n,t).subscribe({next:()=>{this.requestRefresh("task_patch",!0)},error:o=>{this.patchState({error:S(o)}),this.requestRefresh("manual")}}))}toggleStoryGroup(n,t){const s=j(n,t);this.collapsedStoryGroups.has(s)?this.collapsedStoryGroups.delete(s):this.collapsedStoryGroups.add(s),this.rebuildFromSnapshot()}setAllStoryGroupsCollapsed(n,t){const s=this.stateSubject.value.columns.find(o=>o.id===n);s&&(s.sections.storyGroups.forEach(o=>{const i=j(n,o.storyKey);t?this.collapsedStoryGroups.add(i):this.collapsedStoryGroups.delete(i)}),this.rebuildFromSnapshot())}async patchHabitTitle(n,t){try{return await O(this.dataService.patchHabitTitle(n,t).pipe(k())),T("Routine updated","success"),!0}catch(s){return this.patchState({error:S(s)}),T("Failed to update routine","error"),!1}}async toggleHabitCompleted(n,t){try{return await O(this.dataService.toggleHabitCompletion(n,new Date).pipe(k())),T("Routine updated","success"),!0}catch(s){return this.patchState({error:S(s)}),T("Failed to update routine","error"),!1}}scheduleMidnightRefresh(){this.midnightTimer!==null&&(window.clearTimeout(this.midnightTimer),this.midnightTimer=null);const t=Se(new Date);this.midnightTimer=window.setTimeout(()=>{this.requestRefresh("midnight"),this.scheduleMidnightRefresh()},t)}applyTaskPatchOptimistic(n,t){this.latestSnapshot&&(this.latestSnapshot={...this.latestSnapshot,now:new Date,tasks:this.latestSnapshot.tasks.map(s=>s.id!==n?s:{...s,...t.title!==void 0?{title:t.title}:{},...t.status!==void 0?{status:t.status}:{},...t.priority!==void 0?{priority:t.priority}:{},...t.dueDate!==void 0?{due_date:t.dueDate}:{}})},this.rebuildFromSnapshot())}rebuildFromSnapshot(){if(!this.latestSnapshot){this.patchState({columns:Y(),loading:!1});return}const n={...this.latestSnapshot,now:new Date};this.latestSnapshot=n,this.patchState({columns:Ye(n,{collapsedStoryGroups:this.collapsedStoryGroups}),loading:!1,error:null,updatedAt:Date.now()})}patchState(n){this.stateSubject.next({...this.stateSubject.value,...n})}}function Ve(e){const n="http://www.w3.org/2000/svg",t=document.createElementNS(n,"svg");t.setAttribute("viewBox","0 0 24 24"),t.setAttribute("fill","none"),t.setAttribute("stroke","currentColor"),t.setAttribute("stroke-width","1.8"),t.setAttribute("aria-hidden","true");const s=document.createElementNS(n,"path");return s.setAttribute("stroke-linecap","round"),s.setAttribute("stroke-linejoin","round"),s.setAttribute("d",e?"m6 9 6 6 6-6":"m18 15-6-6-6 6"),t.appendChild(s),t}class We{constructor(n){this.options=n,this.dueItemList=[],this.completedItemList=[],this.loading=!1,this.sortItems(this.options.habits)}sortItems(n=this.options.habits){this.dueItemList=n.filter(t=>t.isDueToday),this.completedItemList=n.filter(t=>!t.isDueToday)}toggleCompletedList(){this.isCompletedCollapsed()?this.options.completedHabitsCollapsed.delete(this.options.columnId):this.options.completedHabitsCollapsed.add(this.options.columnId),this.options.onLocalStateChange()}isLoading(){return this.loading}async onHabitComplete(n,t){if(!this.loading){this.loading=!0,this.options.onLocalStateChange();try{let s=!1;try{s=await this.options.handlers.onHabitToggle(n.habitUuid,t)}catch{s=!1}s&&this.options.handlers.onHabitUpdate()}finally{this.loading=!1,this.options.onLocalStateChange()}}}async onHabitTitleChange(n,t){const s=t.trim();if(!(this.loading||!s||s===n.title)){this.loading=!0,this.options.onLocalStateChange();try{let o=!1;try{o=await this.options.handlers.onHabitTitlePatch(n.habitUuid,s)}catch{o=!1}o&&this.options.handlers.onHabitUpdate()}finally{this.loading=!1,this.options.onLocalStateChange()}}}render(){this.sortItems();const n=document.createElement("section");n.className="kb-stack";const t=document.createElement("div");t.className="kb-habit-list group",this.loading&&t.classList.add("is-loading");const s=document.createElement("div");s.className="kb-habit-header";const o=document.createElement("h4");if(o.className="kb-habit-header-title",o.textContent="Routines",s.appendChild(o),t.appendChild(s),this.dueItemList.forEach(i=>{t.appendChild(this.renderItem(i,!0))}),this.completedItemList.length>0){const i=document.createElement("button");i.type="button",i.className="kb-habit-completed-toggle",i.disabled=this.loading;const r=this.isCompletedCollapsed(),l=document.createElement("span");l.textContent=`Completed (${this.completedItemList.length})`,i.append(l,Ve(r)),i.addEventListener("click",()=>{this.toggleCompletedList()}),t.appendChild(i),r||this.completedItemList.forEach(c=>{t.appendChild(this.renderItem(c,!1))})}return n.appendChild(t),n}renderItem(n,t){const s=document.createElement("article");s.className=t?"kb-habit-row kb-habit-row-due":"kb-habit-row",t||s.classList.add("done");const o=new ge({checked:!n.isDueToday,disabled:this.loading,label:n.title,stopPropagation:!0});o.onChange(r=>{this.onHabitComplete(n,r)});const i=document.createElement("input");return i.className=t?"kb-habit-title kb-habit-title-due":"kb-habit-title",i.value=n.title,i.disabled=this.loading,i.addEventListener("keydown",r=>{r.key==="Enter"&&(r.preventDefault(),i.blur())}),i.addEventListener("blur",()=>{this.onHabitTitleChange(n,i.value)}),s.append(o.getElement(),i),s}isCompletedCollapsed(){return this.options.completedHabitsCollapsed.has(this.options.columnId)}}const Qe=[d.Active,d.Described,d.Draft,d.Completed,d.Archived,d.Cancelled],Xe=[C.Lowest,C.Low,C.Medium,C.High,C.Highest];function Ze(e){return e.charAt(0).toUpperCase()+e.slice(1)}function et(e){return e.charAt(0).toUpperCase()+e.slice(1)}function tt(e){if(!e)return{day:"No",month:"date"};const n=String(e.getDate()),t=new Intl.DateTimeFormat("en",{month:"short"}).format(e);return{day:n,month:t}}function _(e,n,t,s,o){const i=document.createElement("button");return i.type="button",i.className=o,i.textContent=e,i.addEventListener("click",()=>{s.onTaskAction(n,t)}),i}function J(e){return new Date(e.getFullYear(),e.getMonth(),e.getDate())}function nt(e){if(!e.dueDate)return{today:!1,past:!1};if(e.status===d.Completed||e.status===d.Cancelled)return{today:!1,past:!1};const n=J(new Date).getTime(),t=J(e.dueDate).getTime();return t<n?{today:!1,past:!0}:t===n?{today:!0,past:!1}:{today:!1,past:!1}}function st(e){const n=nt(e);return e.status===d.Completed?"kb-card-status-completed":e.status===d.Cancelled?"kb-card-status-cancelled":n.past?"kb-card-status-overdue-past":n.today?"kb-card-status-overdue-today":e.status===d.Active||e.status===d.Archived?"kb-card-status-active":"kb-card-status-default"}function ot(e){const n=e.source.subtasks??[];if(!n.length)return null;const t=n.filter(i=>i.is_completed).length,s=n.length,o=s>0?Math.round(t/s*100):0;return{total:s,completed:t,percent:o}}function se(e,n,t={}){const s=document.createElement("article");s.className=`kb-card group px-3 py-3.5 rounded-md shadow-sm ${st(e)}`,t.isInGroup&&s.classList.add("kb-card-in-group");const o=document.createElement("div");o.className="kb-task-meta-row flex items-center justify-between pb-2";const i=document.createElement("div");i.className="kb-task-meta-list";const r=[];e.storyTitle&&r.push(e.storyTitle),e.isChallenge&&r.push("Challenge"),r.length>0&&(i.textContent=r.join(" | "),o.appendChild(i));const l=document.createElement("div");l.className="kb-task-title-row flex items-center justify-between pb-2";const c=document.createElement("input");c.className="kb-title-input text-sm font-medium",c.value=e.title,c.placeholder="Task title",c.addEventListener("keydown",a=>{a.key==="Enter"&&(a.preventDefault(),c.blur())}),c.addEventListener("blur",()=>{const a=c.value.trim();!a||a===e.title||n.onTaskPatch(e.taskId,{title:a})}),l.appendChild(c);const f=document.createElement("div");f.className="kb-task-status-top-row";const u=document.createElement("div");u.className="kb-task-controls-row flex justify-between items-center h-5";const b=document.createElement("div");b.className="kb-row";const h=document.createElement("select");h.className="kb-select",Qe.forEach(a=>{const p=document.createElement("option");p.value=a,p.textContent=Ze(a),p.selected=e.status===a,h.appendChild(p)}),h.addEventListener("change",()=>{const a=h.value;a!==e.status&&n.onTaskPatch(e.taskId,{status:a})}),f.appendChild(h);const g=document.createElement("select");g.className="kb-select",Xe.forEach(a=>{const p=document.createElement("option");p.value=a,p.textContent=et(a),p.selected=e.priority===a,g.appendChild(p)}),g.addEventListener("change",()=>{const a=g.value;a!==e.priority&&n.onTaskPatch(e.taskId,{priority:a})}),b.append(g);const m=document.createElement("div");m.className="kb-row";const y=document.createElement("button");y.type="button",y.className="kb-date-label";const E=tt(e.dueDate),D=document.createElement("span");D.className="kb-date-day",D.textContent=E.day;const L=document.createElement("span");L.className="kb-date-month",L.textContent=` ${E.month}`,y.append(D,L);const H=document.createElement("div");H.className="kb-date-selector";const v=document.createElement("input");v.type="date",v.className="kb-date-input",v.value=e.dueDateInput,v.addEventListener("change",()=>{const a=v.value.trim(),p=a.length>0?a:null;p===e.dueDateInput||!p&&!e.dueDateInput||n.onTaskPatch(e.taskId,{dueDate:p})}),H.append(y,v),m.appendChild(H);const I=document.createElement("div");I.className="kb-card-actions";const ie=_("Open","open",e.taskId,n,"kb-link kb-link-open"),R=document.createElement("div");R.className="kb-card-secondary-actions hidden group-hover:flex",R.append(_("Clone","clone",e.taskId,n,"kb-link kb-link-muted"),_("+Subtask","add-subtask",e.taskId,n,"kb-link kb-link-muted")),I.append(ie,R),m.appendChild(I),u.append(b,m);const w=ot(e),G=document.createElement("div");if(G.className="kb-task-subtasks mt-2",w){const a=document.createElement("div");a.className="kb-task-subtasks-label",a.textContent=`${w.completed}/${w.total} subtasks`;const p=document.createElement("div");p.className="kb-task-subtasks-bar";const K=document.createElement("div");K.className="kb-task-subtasks-fill",K.style.width=`${w.percent}%`,p.appendChild(K),G.append(a,p)}return r.length>0&&s.appendChild(o),s.append(f,l,u),w&&s.appendChild(G),s}function V(e){return e?new Intl.DateTimeFormat(void 0,{hour:"2-digit",minute:"2-digit"}).format(e):"--:--"}function $(e){const n=document.createElement("div");return n.className="kb-section-title",n.textContent=e,n}function oe(e){const n="http://www.w3.org/2000/svg",t=document.createElementNS(n,"svg");t.setAttribute("viewBox","0 0 24 24"),t.setAttribute("fill","none"),t.setAttribute("stroke","currentColor"),t.setAttribute("stroke-width","1.8"),t.setAttribute("aria-hidden","true");const s=document.createElementNS(n,"path");return s.setAttribute("stroke-linecap","round"),s.setAttribute("stroke-linejoin","round"),s.setAttribute("d",e?"m6 9 6 6 6-6":"m18 15-6-6-6 6"),t.appendChild(s),t}function it(e){const n="http://www.w3.org/2000/svg",t=document.createElementNS(n,"svg");t.setAttribute("viewBox","0 0 24 24"),t.setAttribute("fill","none"),t.setAttribute("stroke","currentColor"),t.setAttribute("stroke-width","1.8"),t.setAttribute("aria-hidden","true");const s=document.createElementNS(n,"path");return s.setAttribute("stroke-linecap","round"),s.setAttribute("stroke-linejoin","round"),s.setAttribute("d",e?"m9 6 6 6-6 6":"m15 6-6 6 6 6"),t.appendChild(s),t}function rt(e){const n=document.createElement("section");return n.className="kb-stack",n.appendChild($("Events")),e.forEach(t=>{const s=document.createElement("article");s.className="kb-event";const o=document.createElement("div");o.className="kb-event-title",o.textContent=t.title;const i=document.createElement("div");i.className="kb-event-time",i.textContent=`${V(t.startTime)} - ${V(t.endTime)}`,s.append(o,i),n.appendChild(s)}),n}function at(e,n,t){const s=document.createElement("section");return s.className="kb-stack",s.appendChild($("Story Groups")),n.forEach(o=>{const i=document.createElement("article");i.className="kb-story-group";const r=document.createElement("header");r.className="kb-story-header";const l=document.createElement("h3");l.className="kb-story-title",l.textContent=o.title;const c=document.createElement("div");c.className="kb-story-header-actions";const f=document.createElement("span");f.className="kb-story-meta",f.textContent=`${o.completedCount}/${o.totalCount}`;const u=document.createElement("button");u.type="button",u.className="kb-story-toggle",u.title=o.collapsed?"Expand story group":"Collapse story group",u.setAttribute("aria-label",o.collapsed?"Expand story group":"Collapse story group"),u.appendChild(oe(o.collapsed)),u.addEventListener("click",()=>{t.handlers.onStoryGroupToggle(e,o.storyKey)}),c.append(f,u),r.append(l,c),i.appendChild(r);const b=document.createElement("div");b.className="kb-story-body",(o.collapsed?o.tasks.slice(0,1):o.tasks).forEach(g=>{b.appendChild(se(g,t.handlers,{isInGroup:!0}))}),i.appendChild(b),s.appendChild(i)}),s}function z(e,n,t){const s=document.createElement("section");return s.className="kb-stack",s.appendChild($(e)),n.forEach(o=>{s.appendChild(se(o,t.handlers))}),s}function lt(e,n,t){return new We({columnId:e,habits:n,completedHabitsCollapsed:t.completedHabitsCollapsed,handlers:t.handlers,onLocalStateChange:t.onLocalStateChange}).render()}function dt(e,n){const t=n.collapsedColumns.has(e.id),s=document.createElement("section");s.className="kb-column relative overflow-hidden text-gray-600 w-[17.5rem]",t&&s.classList.add("kb-column-collapsed");const o=document.createElement("header");o.className="kb-column-header-wrap sticky z-10 w-[17.5rem] h-4",t&&o.classList.add("kb-column-header-wrap-collapsed");const i=document.createElement("div");i.className="kb-column-header flex items-center justify-between px-4 h-9 bg-gray-100 rounded-lg advanced-glass-effect text-black",t&&i.classList.add("kb-column-header-collapsed");const r=document.createElement("h2");r.className="kb-column-title font-medium text-sm",r.textContent=e.title,r.title=e.title,t&&r.classList.add("kb-column-title-vertical");const l=document.createElement("div");l.className="kb-column-actions flex gap-2 items-center",t&&l.classList.add("kb-column-actions-collapsed");const c=document.createElement("span");c.className="kb-column-count inline-flex justify-center items-center px-2 text-base font-medium rounded-full",c.textContent=`${e.progress.completed}/${e.progress.total}`;const f=e.sections.storyGroups,u=document.createElement("button");u.type="button",u.className="kb-header-toggle",u.disabled=f.length===0;const b=f.length>0&&f.every(E=>E.collapsed);u.title=b?"Expand all story groups":"Collapse all story groups",u.setAttribute("aria-label",b?"Expand all story groups":"Collapse all story groups"),u.appendChild(oe(b)),u.addEventListener("click",()=>{n.handlers.onStoryGroupsToggleAll(e.id,!b)});const h=document.createElement("button");if(h.type="button",h.className="kb-header-toggle kb-column-collapse-toggle",h.title=t?"Expand column":"Collapse column",h.setAttribute("aria-label",t?"Expand column":"Collapse column"),h.appendChild(it(t)),h.addEventListener("click",()=>{n.onColumnCollapseToggle(e.id)}),t?(l.append(h),i.append(l,r)):(l.append(c,u,h),i.append(r,l)),o.appendChild(i),t)return s.appendChild(o),s;const g=document.createElement("div");g.className="kb-column-body column overflow-y-auto pt-8";const m=document.createElement("div");m.className="kb-column-sections",e.sections.events.length>0&&m.appendChild(rt(e.sections.events)),e.sections.storyGroups.length>0&&m.appendChild(at(e.id,e.sections.storyGroups,n)),e.sections.tasks.length>0&&m.appendChild(z("Tasks",e.sections.tasks,n)),e.sections.challengeTasks.length>0&&m.appendChild(z("Challenge Tasks",e.sections.challengeTasks,n)),e.sections.habits.length>0&&m.appendChild(lt(e.id,e.sections.habits,n)),e.sections.completedTasks.length>0&&m.appendChild(z("Completed",e.sections.completedTasks,n));const y=document.createElement("div");return y.className="kb-column-backdrop absolute z-[-1] w-[calc(100%-28px)] h-full rounded-[1.3rem] mx-3.5",g.appendChild(m),s.append(o,g,y),s}const W="kanban-board-styles",ct=`
#kanban-root {
  --kb-bg-1: #eef5ff;
  --kb-bg-2: #f8fafc;
  --kb-panel: rgba(255, 255, 255, 0.82);
  --kb-border: rgba(148, 163, 184, 0.28);
  --kb-text: #0f172a;
  --kb-muted: #64748b;
  --kb-accent: #2563eb;
  --kb-success: #059669;
  --kb-warn: #ea580c;
  --kb-danger: #dc2626;
  --kb-column-text: #4b5563;
  --kb-header-text: #0f172a;
  --kb-header-bg: rgba(243, 244, 246, 0.86);
  --kb-header-border: rgba(148, 163, 184, 0.28);
  --kb-header-toggle-hover: rgba(15, 23, 42, 0.08);
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent;
  color: var(--kb-text);
  font-family: Poppins, sans-serif;
}

.kb-shell {
  position: relative;
  z-index: 1;
  height: 100%;
  padding: 0;
  box-sizing: border-box;
}

.kb-button {
  border: 1px solid var(--kb-border);
  background: #ffffff;
  color: var(--kb-text);
  border-radius: 10px;
  padding: 0 12px;
  height: 32px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.kb-button:hover {
  background: #f8fafc;
}

.kb-board-scroll {
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}

.kb-board {
  display: flex;
  gap: 24px;
  min-width: max-content;
  height: 100%;
  padding: 16px 16px 0;
  box-sizing: border-box;
  align-items: flex-start;
}

/* Utility class replicas from the source Kanban column template */
.relative {
  position: relative;
}

.absolute {
  position: absolute;
}

.sticky {
  position: sticky;
}

.overflow-hidden {
  overflow: hidden;
}

.overflow-y-auto {
  overflow-y: auto;
}

.flex {
  display: flex;
}

.inline-flex {
  display: inline-flex;
}

.items-center {
  align-items: center;
}

.justify-between {
  justify-content: space-between;
}

.justify-center {
  justify-content: center;
}

.gap-2 {
  gap: 0.5rem;
}

.px-4 {
  padding-left: 1rem;
  padding-right: 1rem;
}

.px-2 {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

.pt-8 {
  padding-top: 2rem;
}

.w-\\[17\\.5rem\\] {
  width: 17.5rem;
}

.w-\\[calc\\(100%-28px\\)\\] {
  width: calc(100% - 28px);
}

.h-4 {
  height: 1rem;
}

.h-9 {
  height: 2.25rem;
}

.h-full {
  height: 100%;
}

.z-10 {
  z-index: 10;
}

.z-\\[-1\\] {
  z-index: -1;
}

.rounded-lg {
  border-radius: 0.5rem;
}

.rounded-full {
  border-radius: 9999px;
}

.rounded-\\[1\\.3rem\\] {
  border-radius: 1.3rem;
}

.mx-3\\.5 {
  margin-left: 0.875rem;
  margin-right: 0.875rem;
}

.font-medium {
  font-weight: 500;
}

.text-sm {
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.text-base {
  font-size: 1rem;
  line-height: 1.5rem;
}

.text-black {
  color: #000;
}

.text-gray-600 {
  color: #4b5563;
}

.bg-gray-100 {
  background-color: #f3f4f6;
}

.backdrop-blur-lg {
  backdrop-filter: blur(16px);
}

.kb-column {
  isolation: isolate;
  min-width: 17.5rem;
  display: flex;
  flex-direction: column;
}

.kb-column.kb-column-collapsed {
  width: 42px;
  min-width: 42px;
}

.kb-column-header-wrap {
  top: 0;
}

.kb-column-header-wrap-collapsed {
  width: 42px;
  height: auto;
  position: static;
}

.kb-column-header {
  color: inherit;
}

.kb-column-header-collapsed {
  width: 42px;
  height: auto;
  padding: 1rem 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
}

.advanced-glass-effect {
  position: relative;
  overflow: hidden;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.2),
    rgba(255, 255, 255, 0.1)
  );
  backdrop-filter: blur(10px) brightness(1.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.advanced-glass-effect::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.4),
    rgba(255, 255, 255, 0)
  );
  animation: shimmer 3s infinite;
  pointer-events: none;
}

@keyframes shimmer {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(0, 0);
  }
}

.kb-column-title {
  margin: 0;
  font-family: 'Inter', sans-serif;
  font-style: normal;
  font-weight: 600;
  font-size: 14px;
  line-height: 17px;
  color: #000000;
}

.kb-column-actions {
}

.kb-column-actions-collapsed {
  width: 100%;
  justify-content: center;
}

.kb-column-count {
  line-height: 1;
}

.kb-column-title-vertical {
  display: inline-flex;
  align-items: center;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  transform: rotate(180deg);
  line-height: 1;
  text-align: center;
  white-space: nowrap;
}

.kb-header-toggle {
  border: none;
  background: transparent;
  color: inherit;
  width: 24px;
  height: 24px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.kb-header-toggle:hover {
  background: var(--kb-header-toggle-hover);
}

.kb-header-toggle:disabled {
  opacity: 0.45;
  cursor: default;
}

.kb-header-toggle svg {
  width: 16px;
  height: 16px;
}

.kb-column-collapse-toggle {
  flex: 0 0 auto;
}

.kb-column-body {
  position: relative;
  z-index: 1;
}

.column {
  max-height: calc(100vh - 47px);
}

.kb-column-sections {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.kb-column-backdrop {
  inset: 0;
}

.kb-section-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--kb-muted);
}

.kb-stack {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.kb-event {
  border: 1px solid rgba(37, 99, 235, 0.3);
  background: rgba(37, 99, 235, 0.08);
  border-radius: 12px;
  padding: 8px 10px;
}

.kb-event-title {
  font-size: 12px;
  font-weight: 600;
}

.kb-event-time {
  margin-top: 2px;
  font-size: 11px;
  color: #1d4ed8;
}

.kb-story-group {
  background: rgba(255, 255, 255, 0.75);
  border-radius: 0.5rem;
  padding: 0.25rem;
  backdrop-filter: blur(24px);
}

.kb-story-header {
  min-height: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  color: #717070;
}

.kb-story-title {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1rem;
  color: inherit;
}

.kb-story-header-actions {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.kb-story-meta {
  font-size: 0.75rem;
  line-height: 1rem;
  color: inherit;
}

.kb-story-toggle {
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(148, 163, 184, 0.14);
  color: #6b7280;
  border-radius: 8px;
  height: 20px;
  width: 20px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.kb-story-toggle:hover {
  background: rgba(148, 163, 184, 0.24);
}

.kb-story-toggle svg {
  width: 14px;
  height: 14px;
}

.kb-story-body {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.kb-card {
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 0.375rem;
  padding: 0.875rem 0.75rem;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 0;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.1);
  transition: box-shadow 120ms ease;
}

.kb-card:hover {
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.12);
}

.kb-card-status-completed {
  border-color: rgba(5, 150, 105, 0.35);
  background: #ffffff;
}

.kb-card-status-active {
  border-color: rgba(37, 99, 235, 0.3);
  background: #ffffff;
}

.kb-card-status-cancelled {
  border-color: rgba(234, 179, 8, 0.38);
  background: #ffffff;
}

.kb-card-status-overdue-today {
  border-color: rgba(234, 179, 8, 0.42);
  background: #ffffff;
}

.kb-card-status-overdue-past {
  border-color: rgba(220, 38, 38, 0.4);
  background: #ffffff;
}

.kb-card-status-default {
  border-color: rgba(148, 163, 184, 0.3);
  background: #ffffff;
}

.kb-task-meta-row,
.kb-task-title-row {
  padding-bottom: 0.5rem;
}

.kb-task-status-top-row {
  display: flex;
  justify-content: flex-start;
  padding-bottom: 0.5rem;
}

.kb-task-meta-list {
  font-size: 11px;
  color: var(--kb-muted);
}

.kb-task-controls-row {
  min-height: 1.25rem;
}

.kb-task-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.kb-title-input {
  width: 100%;
  box-sizing: border-box;
  border: none;
  border-radius: 6px;
  padding: 0;
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 500;
  color: inherit;
  background: transparent;
}

.kb-title-input:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
  background: rgba(255, 255, 255, 0.75);
  padding: 0 4px;
}

.kb-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.kb-select {
  border: 1px solid var(--kb-border);
  background: rgba(255, 255, 255, 0.82);
  border-radius: 6px;
  font-size: 10px;
  line-height: 1.1;
  padding: 2px 6px;
  height: 20px;
  min-width: 0;
  color: var(--kb-text);
}

.kb-select {
  flex: 0 1 auto;
}

.kb-date-selector {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0;
  gap: 3px;
  width: 38px;
  height: 15px;
  flex: none;
  order: 2;
  flex-grow: 0;
}

.kb-date-label {
  display: flex;
  align-items: center;
  width: 38px;
  height: 15px;
  border: none;
  background: transparent;
  padding: 0;
  margin: 0;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-style: normal;
  font-weight: 600;
  font-size: 12px;
  line-height: 15px;
  color: #8f9295;
  white-space: nowrap;
  flex: none;
  order: 1;
  flex-grow: 0;
  pointer-events: none;
}

.kb-date-day {
  text-decoration-line: underline;
}

.kb-date-month {
  text-decoration-line: none;
}

.kb-date-label:focus-visible {
  outline: none;
}

.kb-date-input {
  position: absolute;
  inset: 0;
  z-index: 2;
  opacity: 0;
  width: 100%;
  height: 100%;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  pointer-events: auto;
}

.kb-card-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.kb-link-open {
  color: var(--kb-accent);
}

.kb-card-secondary-actions {
  display: none;
  gap: 6px;
}

.kb-card:hover .kb-card-secondary-actions {
  display: flex;
}

.kb-link {
  border: none;
  background: transparent;
  padding: 0;
  font-size: 11px;
  line-height: 1;
  cursor: pointer;
  color: inherit;
}

.kb-link-muted {
  color: var(--kb-muted);
}

.kb-link-muted:hover {
  color: var(--kb-text);
}

.kb-task-subtasks {
  margin-top: 0.5rem;
}

.kb-task-subtasks-label {
  font-size: 10px;
  color: var(--kb-muted);
}

.kb-task-subtasks-bar {
  margin-top: 4px;
  height: 4px;
  border-radius: 9999px;
  background: rgba(148, 163, 184, 0.25);
  overflow: hidden;
}

.kb-task-subtasks-fill {
  height: 100%;
  border-radius: inherit;
  background: rgba(37, 99, 235, 0.6);
}

.kb-habit-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: rgba(255, 255, 255, 0.75);
  border-radius: 0.5rem;
  padding: 0.25rem;
  backdrop-filter: blur(24px);
}

.kb-habit-list.is-loading {
  opacity: 0.7;
  pointer-events: none;
}

.kb-habit-header {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  color: #717070;
}

.kb-habit-header-title {
  margin: 0;
  font-weight: 600;
  font-size: 0.75rem;
  line-height: 1rem;
}

.kb-habit-row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  border-radius: 0.375rem;
  padding: 0.5rem;
}

.kb-habit-row-due {
  position: relative;
  background: #fdfdfd;
}

.kb-habit-row.done {
  opacity: 0.7;
}

.kb-habit-completed-toggle {
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #4b5563;
  font-size: 12px;
  line-height: 1rem;
  cursor: pointer;
  padding: 0.375rem 0.5rem;
}

.kb-habit-completed-toggle svg {
  width: 14px;
  height: 14px;
}

.kb-habit-title {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 12px;
  color: var(--kb-text);
}

.kb-habit-title-due {
  display: inline-flex;
  align-items: baseline;
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
}

.kb-habit-title:focus {
  outline: none;
}

.kb-empty {
  font-size: 12px;
  color: var(--kb-muted);
  border: 1px dashed var(--kb-border);
  border-radius: 10px;
  padding: 10px;
  text-align: center;
}

`;function ut(){if(typeof document>"u"||document.getElementById(W))return;const e=document.createElement("style");e.id=W,e.textContent=ct,document.head.appendChild(e)}const Q="kanban-collapsed-columns",pt=new Set(A);class ht{constructor(n,t){this.handlers=t,this.collapsedColumns=new Set,this.completedHabitsCollapsed=new Set(["today"]),this.state={columns:[],loading:!1,error:null,updatedAt:null},ut(),this.root=document.createElement("div"),this.root.id="kanban-root";const s=document.createElement("div");s.className="kb-shell";const o=document.createElement("div");o.className="kb-board-scroll",this.boardEl=document.createElement("div"),this.boardEl.className="kb-board",o.appendChild(this.boardEl),s.append(o),this.root.appendChild(s),n.appendChild(this.root),this.restoreCollapsedColumns()}render(n){this.state=n,this.renderColumns(n.columns)}destroy(){this.root.remove()}renderColumns(n){this.pruneCollapsedColumns(n),this.boardEl.replaceChildren(),n.forEach(t=>{this.boardEl.appendChild(dt(t,{handlers:this.handlers,collapsedColumns:this.collapsedColumns,completedHabitsCollapsed:this.completedHabitsCollapsed,onColumnCollapseToggle:s=>this.toggleColumnCollapse(s),onLocalStateChange:()=>this.render(this.state)}))})}toggleColumnCollapse(n){this.collapsedColumns.has(n)?this.collapsedColumns.delete(n):this.collapsedColumns.add(n),this.persistCollapsedColumns(),this.render(this.state)}restoreCollapsedColumns(){try{const n=localStorage.getItem(Q);if(!n)return;const t=JSON.parse(n);if(!Array.isArray(t))return;t.forEach(s=>{typeof s=="string"&&pt.has(s)&&this.collapsedColumns.add(s)})}catch{}}persistCollapsedColumns(){try{const n=JSON.stringify(Array.from(this.collapsedColumns));localStorage.setItem(Q,n)}catch{}}pruneCollapsedColumns(n){const t=new Set(n.map(o=>o.id));let s=!1;this.collapsedColumns.forEach(o=>{t.has(o)||(this.collapsedColumns.delete(o),s=!0)}),s&&this.persistCollapsedColumns()}}function mt(e){e.requestRefresh("manual",!0)}class bt{constructor(){this.root=null,this.store=null,this.view=null,this.subscriptions=new M,this.refreshRequestHandler=null,this.entityCreatedHandler=null,this.visibilityHandler=null}mount(n){if(this.root)return;const t=document.createElement("div");t.dataset.module="kanban",t.style.width="100%",t.style.height="100%",t.style.display="block",n.appendChild(t),this.root=t;const s=new Je(new xe);this.store=s;const o=new ht(t,{onTaskPatch:(i,r)=>s.patchTask(i,r),onStoryGroupToggle:(i,r)=>s.toggleStoryGroup(i,r),onStoryGroupsToggleAll:(i,r)=>s.setAllStoryGroupsCollapsed(i,r),onTaskAction:(i,r)=>this.emitTaskAction(i,r),onHabitToggle:(i,r)=>s.toggleHabitCompleted(i,r),onHabitTitlePatch:(i,r)=>s.patchHabitTitle(i,r),onHabitUpdate:()=>mt(s)});this.view=o,this.subscriptions.add(s.state$.subscribe(i=>o.render(i))),s.start(),this.bindGlobalRefreshTriggers(s)}unmount(){var n,t,s;this.unbindGlobalRefreshTriggers(),this.subscriptions.unsubscribe(),this.subscriptions=new M,(n=this.store)==null||n.destroy(),this.store=null,(t=this.view)==null||t.destroy(),this.view=null,(s=this.root)==null||s.remove(),this.root=null}emitTaskAction(n,t){ke(n,t)}bindGlobalRefreshTriggers(n){this.refreshRequestHandler=()=>{n.requestRefresh("external")},this.entityCreatedHandler=()=>{n.requestRefresh("external",!0)},this.visibilityHandler=()=>{document.visibilityState==="visible"&&n.requestRefresh("external",!0)},window.addEventListener(F,this.refreshRequestHandler),window.addEventListener(q,this.entityCreatedHandler),document.addEventListener("visibilitychange",this.visibilityHandler)}unbindGlobalRefreshTriggers(){this.refreshRequestHandler&&(window.removeEventListener(F,this.refreshRequestHandler),this.refreshRequestHandler=null),this.entityCreatedHandler&&(window.removeEventListener(q,this.entityCreatedHandler),this.entityCreatedHandler=null),this.visibilityHandler&&(document.removeEventListener("visibilitychange",this.visibilityHandler),this.visibilityHandler=null)}}class gt{constructor(){this.id="kanban",this.app=null}mount(n){if(this.app)return;const t=new bt;t.mount(n),this.app=t}unmount(){var n;(n=this.app)==null||n.unmount(),this.app=null}getAiAssistantSnapshot(){return null}}export{gt as KanbanModule};
