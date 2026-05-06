import{m as _t,B as Ct,g as x,k as tt,l as kt,p as wt,q as g,r as k,u as L,v as O,w as y,x as yt,y as jt,z as Et,A as At,D as Bt,E as ot,d as rt,H as Tt,e as It,T as Lt,F as Pt}from"./index-BxC1JGF3.js";function St(c){return Array.isArray(c)?c:c.results}function w(c){return encodeURIComponent(String(c))}class Mt{constructor(t){this.http=t}getBoards(){return this.http.get("/boards/").pipe(_t(St))}createBoard(t){return this.http.post("/boards/",t)}updateBoard(t,e){return this.http.patch(`/boards/${w(t)}/`,e)}deleteBoard(t){return this.http.delete(`/boards/${w(t)}/`)}createColumn(t){return this.http.post("/columns/",t)}updateColumn(t,e){return this.http.patch(`/columns/${w(t)}/`,e)}deleteColumn(t){return this.http.delete(`/columns/${w(t)}/`)}createCard(t){return this.http.post("/cards/",t)}updateCard(t,e){return this.http.patch(`/cards/${w(t)}/`,e)}deleteCard(t){return this.http.delete(`/cards/${w(t)}/`)}createCardPlacement(t){return this.http.post("/card-placements/",t)}updateCardPlacement(t,e){return this.http.patch(`/card-placements/${w(t)}/`,e)}deleteCardPlacement(t){return this.http.delete(`/card-placements/${w(t)}/`)}}function v(c){return c.placement_id??c.id}function it(c){const t=c.pos??c.order??0,e=Number(t);return Number.isFinite(e)?e:0}function Nt(c,t){return it(c)-it(t)||v(c).localeCompare(v(t))||c.id.localeCompare(t.id)}const J="boards-session-selected-board";function ht(c){if(typeof c!="string")return null;const t=c.trim();return t.length>0?t:null}function nt(c,t){return t!==null&&c.some(e=>e.id===t)}function qt(){try{return ht(sessionStorage.getItem(J))}catch{return null}}function st(c){try{const t=ht(c);if(t){sessionStorage.setItem(J,t);return}sessionStorage.removeItem(J)}catch{}}function Dt(c,t){var a;if(nt(c,t))return t;const e=qt();return nt(c,e)?e:((a=c[0])==null?void 0:a.id)??null}const zt={boards:[],selectedBoardId:null,status:"idle",error:null};function dt(c){const t=Number(c??0);return Number.isFinite(t)?t:0}function Rt(c,t){const e=c.pos??c.order??0,a=t.pos??t.order??0;return dt(e)-dt(a)||c.id.localeCompare(t.id)}function $t(c){return c.map(t=>({...t,columns:[...t.columns??[]].sort(Rt).map(e=>({...e,cards:[...e.cards??[]].sort(Nt)}))})).sort((t,e)=>t.id.localeCompare(e.id))}class Ot{constructor(t){this.api=t,this.stateSubject=new Ct(zt),this.state$=this.stateSubject.asObservable()}get snapshot(){return this.stateSubject.value}destroy(){this.stateSubject.complete()}selectBoard(t){this.snapshot.boards.some(e=>e.id===t)&&(st(t),this.patchState({selectedBoardId:t,error:null}))}async load(){this.patchState({status:"loading",error:null});try{await this.reloadPreservingSelection(),this.patchState({status:"idle",error:null})}catch{this.patchState({status:"error",error:"boards.errors.load"})}}async createBoard(t){const e=t.trim();e&&await this.runMutation(async()=>{const a=await x(this.api.createBoard({title:e}));await this.reload(a.id)})}async deleteBoard(t){await this.runMutation(async()=>{await x(this.api.deleteBoard(t)),await this.reload(null)})}async patchBoard(t,e){this.findBoard(t)&&await this.runMutation(async()=>{await x(this.api.updateBoard(t,e)),await this.reload(t)})}async createColumn(t,e){const a=e.trim();!a||!this.findBoard(t)||await this.runMutation(async()=>{await x(this.api.createColumn({board:t,title:a,position:"end"})),await this.reload(t)})}async deleteColumn(t){await this.runMutation(async()=>{await x(this.api.deleteColumn(t)),await this.reloadPreservingSelection()})}async patchColumn(t,e){this.findColumn(t)&&await this.runMutation(async()=>{await x(this.api.updateColumn(t,e)),await this.reloadPreservingSelection()})}async createCard(t,e,a){const o=e.trim();!o||!this.findColumn(t)||await this.runMutation(async()=>{await x(this.api.createCard({column:t,title:o,description:a.trim(),position:"bottom"})),await this.reloadPreservingSelection()})}async patchCard(t,e){this.findCard(t)&&await this.runMutation(async()=>{await x(this.api.updateCard(t,e)),await this.reloadPreservingSelection()})}async createCardMirror(t,e,a){!this.findCard(t)||!this.findColumn(e)||await this.runMutation(async()=>{await x(this.api.createCardPlacement({card:t,column:e,...a})),await this.reloadPreservingSelection()})}async patchCardPlacement(t,e){this.findCardPlacement(t)&&await this.runMutation(async()=>{await x(this.api.updateCardPlacement(t,e)),await this.reloadPreservingSelection()})}async deleteCardPlacement(t){this.findCardPlacement(t)&&await this.runMutation(async()=>{await x(this.api.deleteCardPlacement(t)),await this.reloadPreservingSelection()})}async deleteCard(t){await this.runMutation(async()=>{await x(this.api.deleteCard(t)),await this.reloadPreservingSelection()})}async runMutation(t){this.patchState({status:"saving",error:null});try{await t(),this.patchState({status:"idle",error:null})}catch{this.patchState({status:"error",error:"boards.errors.save"})}}async reloadPreservingSelection(){await this.reload(this.snapshot.selectedBoardId)}async reload(t){const e=$t(await x(this.api.getBoards())),a=Dt(e,t);st(a),this.patchState({boards:e,selectedBoardId:a})}findBoard(t){return this.snapshot.boards.find(e=>e.id===t)??null}findColumn(t){for(const e of this.snapshot.boards){const a=e.columns.find(o=>o.id===t);if(a)return a}return null}findCardPlacement(t){for(const e of this.snapshot.boards)for(const a of e.columns){const o=a.cards.find(r=>v(r)===t);if(o)return o}return null}findCard(t){for(const e of this.snapshot.boards)for(const a of e.columns){const o=a.cards.find(r=>r.id===t);if(o)return o}return null}patchState(t){this.stateSubject.next({...this.snapshot,...t})}}function H(c){return[...new Set([...c].filter(Ft))].sort((t,e)=>t-e)}function A(c){var t;return H(c.tag_ids??((t=c.tags)==null?void 0:t.map(e=>e.id))??[])}function ct(c,t){const e=H(c),a=H(t);return e.length===a.length&&e.every((o,r)=>o===a[r])}function Ft(c){return typeof c=="number"&&Number.isFinite(c)}function gt({columnId:c,cards:t,movingPlacementId:e,insertionIndex:a}){const o=t.filter(l=>v(l)!==e),r=Math.max(0,Math.min(a,o.length)),i=r>0?o[r-1]:null,n=r<o.length?o[r]:null,s={column:c};return i&&(s.before_placement=v(i)),n&&(s.after_placement=v(n)),!i&&!n&&(s.position="bottom"),s}function Kt(c,t,e){const a=c.filter(p=>v(p)!==t),o=c.findIndex(p=>v(p)===t);if(o<0)return!0;const r=o>0?c[o-1]:null,i=o<c.length-1?c[o+1]:null,n=r?v(r):null,s=i?v(i):null,l=e.before_placement??null,u=e.after_placement??null;return a.length===0?!1:n!==l||s!==u}function Wt({columns:c,movingColumnId:t,insertionIndex:e}){const a=c.filter(s=>s.id!==t),o=Math.max(0,Math.min(e,a.length)),r=o>0?a[o-1]:null,i=o<a.length?a[o]:null,n={};return r&&(n.before_column=r.id),i&&(n.after_column=i.id),!r&&!i&&(n.position="end"),n}function Ht(c,t,e){const a=c.filter(l=>l.id!==t),o=c.findIndex(l=>l.id===t);if(o<0)return!0;if(a.length===0)return!1;const r=o>0?c[o-1]:null,i=o<c.length-1?c[o+1]:null,n=(r==null?void 0:r.id)??null,s=(i==null?void 0:i.id)??null;return n!==(e.before_column??null)||s!==(e.after_column??null)}const Qt=4,lt=44,mt=18;function Xt(c){return c.view??window}function ut(c,t){for(const e of c.boards)if(e.columns.some(a=>a.id===t))return e.columns;return null}class Ut{constructor(t){this.options=t,this.pending=null,this.active=null,this.eventWindow=null,this.suppressNextClick=!1,this.mounted=!1,this.handleClick=e=>{this.suppressNextClick&&(this.suppressNextClick=!1,e.preventDefault(),e.stopPropagation())},this.handlePointerDown=e=>{if(e.button!==0||e.isPrimary===!1)return;const a=e.target,o=a==null?void 0:a.closest('[data-board-column-draggable="true"]');if(!o||!this.options.root.contains(o)||a!=null&&a.closest('[data-board-drag-ignore="true"], [data-board-card-draggable="true"], input, textarea, select'))return;const r=o.dataset.boardColumnId,i=this.options.getState();!i||!r||!ut(i,r)||(this.pending={pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,sourceColumnElement:o,columnId:r},this.addWindowListeners(Xt(e)))},this.handlePointerMove=e=>{const a=this.pending;if(!a||e.pointerId!==a.pointerId)return;if(!this.active){const r=e.clientX-a.startX,i=e.clientY-a.startY;if(Math.hypot(r,i)<Qt)return;this.startDrag(a,e)}const o=this.active;o&&(e.preventDefault(),this.movePreview(o,e.clientX,e.clientY),this.updateDropTarget(o,e.clientX),this.autoScroll(e.clientX))},this.handlePointerUp=e=>{this.pending&&e.pointerId!==this.pending.pointerId||(this.removeWindowListeners(),this.pending=null,this.finishActiveDrag(!0))},this.handlePointerCancel=e=>{this.pending&&e.pointerId!==this.pending.pointerId||this.cancelDrag()},this.handleWindowBlur=()=>{this.cancelDrag()}}mount(){this.mounted||(this.mounted=!0,this.options.root.addEventListener("pointerdown",this.handlePointerDown,!0),this.options.root.addEventListener("click",this.handleClick,!0))}unmount(){this.mounted&&(this.mounted=!1,this.cancelDrag(),this.options.root.removeEventListener("pointerdown",this.handlePointerDown,!0),this.options.root.removeEventListener("click",this.handleClick,!0))}cancelDrag(){this.removeWindowListeners(),this.pending=null,this.finishActiveDrag(!1)}startDrag(t,e){var s,l;const a=this.options.getState(),o=a?ut(a,t.columnId):null;if(!o)return;(l=(s=this.options).onDragStart)==null||l.call(s);const r=t.sourceColumnElement.getBoundingClientRect(),i=t.sourceColumnElement.cloneNode(!0);i.classList.add("majom-boards__column-drag-preview"),i.style.width=`${r.width}px`,i.style.height=`${r.height}px`,i.style.left=`${r.left}px`,i.style.top=`${r.top}px`;const n=document.createElement("div");n.className="majom-boards__column-drag-placeholder",n.style.width=`${r.width}px`,n.style.height=`${r.height}px`,t.sourceColumnElement.classList.add("is-dragging"),document.body.append(i),this.active={...t,offsetX:e.clientX-r.left,offsetY:e.clientY-r.top,preview:i,placeholder:n,sourceColumns:o,target:null},this.options.root.classList.add("is-column-dragging"),this.movePreview(this.active,e.clientX,e.clientY),this.updateDropTarget(this.active,e.clientX)}movePreview(t,e,a){t.preview.style.left=`${e-t.offsetX}px`,t.preview.style.top=`${a-t.offsetY}px`}updateDropTarget(t,e){const a=this.resolveInsertionIndex(t.columnId,e);if(t.target=Wt({columns:t.sourceColumns,movingColumnId:t.columnId,insertionIndex:a}),!this.hasActiveTargetChanged(t)){t.placeholder.remove();return}this.placePlaceholder(t,a)}hasActiveTargetChanged(t){return!!(t.target&&Ht(t.sourceColumns,t.columnId,t.target))}resolveInsertionIndex(t,e){const a=Array.from(this.options.root.querySelectorAll('[data-board-column-draggable="true"]')).filter(r=>r.dataset.boardColumnId!==t),o=a.findIndex(r=>{const i=r.getBoundingClientRect();return e<i.left+i.width/2});return o>=0?o:a.length}placePlaceholder(t,e){const a=this.options.root.querySelector('[data-board-canvas="true"]');if(!a)return;const o=Array.from(a.querySelectorAll('[data-board-column-draggable="true"]')).filter(i=>i.dataset.boardColumnId!==t.columnId),r=a.querySelector('[data-board-column-composer="true"]');a.insertBefore(t.placeholder,o[e]??r??null)}autoScroll(t){const e=this.options.root.querySelector('[data-board-canvas="true"]');if(!e)return;const a=e.getBoundingClientRect();t<a.left+lt?e.scrollLeft-=mt:t>a.right-lt&&(e.scrollLeft+=mt)}finishActiveDrag(t){const e=this.active;e&&(this.active=null,e.preview.remove(),e.placeholder.remove(),e.sourceColumnElement.classList.remove("is-dragging"),this.options.root.classList.remove("is-column-dragging"),this.suppressNextClick=!0,t&&this.hasActiveTargetChanged(e)&&this.options.onDrop(e.columnId,e.target))}addWindowListeners(t){this.eventWindow=t,t.addEventListener("pointermove",this.handlePointerMove,!0),t.addEventListener("pointerup",this.handlePointerUp,!0),t.addEventListener("pointercancel",this.handlePointerCancel,!0),t.addEventListener("blur",this.handleWindowBlur,!0)}removeWindowListeners(){const t=this.eventWindow??window;this.eventWindow=null,t.removeEventListener("pointermove",this.handlePointerMove,!0),t.removeEventListener("pointerup",this.handlePointerUp,!0),t.removeEventListener("pointercancel",this.handlePointerCancel,!0),t.removeEventListener("blur",this.handleWindowBlur,!0)}}const Yt=4,F=44,K=18;function Gt(c){return c.view??window}function pt(c,t){for(const e of c.boards){const a=e.columns.find(o=>o.id===t);if(a)return a.cards}return null}function Vt(c,t){for(const e of c.boards)for(const a of e.columns)if(a.cards.some(o=>v(o)===t))return a.id;return null}class Zt{constructor(t){this.options=t,this.pending=null,this.active=null,this.eventWindow=null,this.suppressNextClick=!1,this.mounted=!1,this.handleClick=e=>{this.suppressNextClick&&(this.suppressNextClick=!1,e.preventDefault(),e.stopPropagation())},this.handlePointerDown=e=>{if(e.button!==0||e.isPrimary===!1)return;const a=e.target,o=a==null?void 0:a.closest('[data-board-card-draggable="true"]');if(!o||!this.options.root.contains(o)||a!=null&&a.closest('[data-board-drag-ignore="true"], input, textarea, select'))return;const r=o.dataset.boardCardPlacementId,i=this.options.getState();if(!i||!r)return;const n=Vt(i,r);n!==null&&(this.pending={pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,sourceCardElement:o,placementId:r,sourceColumnId:n},this.addWindowListeners(Gt(e)))},this.handlePointerMove=e=>{const a=this.pending;if(!a||e.pointerId!==a.pointerId)return;if(!this.active){const r=e.clientX-a.startX,i=e.clientY-a.startY;if(Math.hypot(r,i)<Yt)return;this.startDrag(a,e)}const o=this.active;o&&(e.preventDefault(),this.movePreview(o,e.clientX,e.clientY),this.updateDropTarget(o,e.clientX,e.clientY),this.autoScroll(e.clientX,e.clientY))},this.handlePointerUp=e=>{this.pending&&e.pointerId!==this.pending.pointerId||(this.removeWindowListeners(),this.pending=null,this.finishActiveDrag(!0))},this.handlePointerCancel=e=>{this.pending&&e.pointerId!==this.pending.pointerId||this.cancelDrag()},this.handleWindowBlur=()=>{this.cancelDrag()}}mount(){this.mounted||(this.mounted=!0,this.options.root.addEventListener("pointerdown",this.handlePointerDown,!0),this.options.root.addEventListener("click",this.handleClick,!0))}unmount(){this.mounted&&(this.mounted=!1,this.cancelDrag(),this.options.root.removeEventListener("pointerdown",this.handlePointerDown,!0),this.options.root.removeEventListener("click",this.handleClick,!0))}cancelDrag(){this.removeWindowListeners(),this.pending=null,this.finishActiveDrag(!1)}startDrag(t,e){var s,l;const a=this.options.getState();if(!a)return;const o=pt(a,t.sourceColumnId);if(!o)return;(l=(s=this.options).onDragStart)==null||l.call(s);const r=t.sourceCardElement.getBoundingClientRect(),i=t.sourceCardElement.cloneNode(!0);i.classList.add("majom-boards__card-drag-preview"),i.style.width=`${r.width}px`,i.style.height=`${r.height}px`,i.style.left=`${r.left}px`,i.style.top=`${r.top}px`;const n=document.createElement("div");n.className="majom-boards__card-drag-placeholder",n.style.height=`${r.height}px`,t.sourceCardElement.classList.add("is-dragging"),document.body.append(i),this.active={...t,offsetX:e.clientX-r.left,offsetY:e.clientY-r.top,preview:i,placeholder:n,sourceColumnCards:o,targetColumnId:null,target:null},this.options.root.classList.add("is-card-dragging"),this.movePreview(this.active,e.clientX,e.clientY),this.updateDropTarget(this.active,e.clientX,e.clientY)}movePreview(t,e,a){t.preview.style.left=`${e-t.offsetX}px`,t.preview.style.top=`${a-t.offsetY}px`}updateDropTarget(t,e,a){const o=this.options.getState();if(!o)return;const r=this.findTargetColumn(e);if(!r)return;const i=r.dataset.boardColumnId;if(!i)return;const n=pt(o,i),s=r.querySelector('[data-board-cards-container="true"]');if(!n||!s)return;const l=this.resolveInsertionIndex(r,t.placementId,a);if(t.targetColumnId=i,t.target=gt({columnId:i,cards:n,movingPlacementId:t.placementId,insertionIndex:l}),!this.hasActiveTargetChanged(t)){t.placeholder.remove();return}this.placePlaceholder(s,t,l)}hasActiveTargetChanged(t){return!t.target||t.targetColumnId===null?!1:!(t.targetColumnId===t.sourceColumnId)||Kt(t.sourceColumnCards,t.placementId,t.target)}findTargetColumn(t){const e=Array.from(this.options.root.querySelectorAll("[data-board-column-id]"));if(e.length===0)return null;const a=e.find(o=>{const r=o.getBoundingClientRect();return t>=r.left&&t<=r.right});return a||e.reduce((o,r)=>{if(!o)return r;const i=r.getBoundingClientRect(),n=o.getBoundingClientRect(),s=Math.abs(t-(i.left+i.width/2)),l=Math.abs(t-(n.left+n.width/2));return s<l?r:o},null)}resolveInsertionIndex(t,e,a){const o=Array.from(t.querySelectorAll("[data-board-card-placement-id]")).filter(i=>i.dataset.boardCardPlacementId!==e),r=o.findIndex(i=>{const n=i.getBoundingClientRect();return a<n.top+n.height/2});return r>=0?r:o.length}placePlaceholder(t,e,a){const r=Array.from(t.querySelectorAll("[data-board-card-placement-id]")).filter(i=>i.dataset.boardCardPlacementId!==e.placementId)[a]??null;t.insertBefore(e.placeholder,r)}autoScroll(t,e){const a=this.options.root.querySelector('[data-board-canvas="true"]');if(a){const s=a.getBoundingClientRect();t<s.left+F?a.scrollLeft-=K:t>s.right-F&&(a.scrollLeft+=K)}const o=this.active;if(!(o!=null&&o.targetColumnId))return;const r=Array.from(this.options.root.querySelectorAll("[data-board-column-id]")).find(s=>s.dataset.boardColumnId===o.targetColumnId),i=r==null?void 0:r.querySelector('[data-board-cards-container="true"]');if(!i)return;const n=i.getBoundingClientRect();e<n.top+F?i.scrollTop-=K:e>n.bottom-F&&(i.scrollTop+=K)}finishActiveDrag(t){const e=this.active;e&&(this.active=null,e.preview.remove(),e.placeholder.remove(),e.sourceCardElement.classList.remove("is-dragging"),this.options.root.classList.remove("is-card-dragging"),this.suppressNextClick=!0,!(!t||!e.target||e.targetColumnId===null)&&this.hasActiveTargetChanged(e)&&this.options.onDrop(e.placementId,e.target))}addWindowListeners(t){this.eventWindow=t,t.addEventListener("pointermove",this.handlePointerMove,!0),t.addEventListener("pointerup",this.handlePointerUp,!0),t.addEventListener("pointercancel",this.handlePointerCancel,!0),t.addEventListener("blur",this.handleWindowBlur,!0)}removeWindowListeners(){const t=this.eventWindow??window;this.eventWindow=null,t.removeEventListener("pointermove",this.handlePointerMove,!0),t.removeEventListener("pointerup",this.handlePointerUp,!0),t.removeEventListener("pointercancel",this.handlePointerCancel,!0),t.removeEventListener("blur",this.handleWindowBlur,!0)}}const bt="majom-boards-view-styles",m={root:"majom-boards",shell:"majom-boards__shell",header:"majom-boards__header",titleBlock:"majom-boards__title-block",title:"majom-boards__title",titleButton:"majom-boards__title-button",titleEditInput:"majom-boards__title-edit-input",headerActions:"majom-boards__header-actions",headerMenuButton:"majom-boards__header-menu-button",primaryButton:"majom-boards__button majom-boards__button--primary",quietButton:"majom-boards__button majom-boards__button--quiet",iconButton:"majom-boards__icon-button",body:"majom-boards__body",tabs:"majom-boards__tabs",boardTab:"majom-boards__tab",boardTabSelected:"majom-boards__tab is-selected",canvas:"majom-boards__canvas",column:"majom-boards__column",columnHeader:"majom-boards__column-header",columnTitleButton:"majom-boards__column-title-button",columnTitleInput:"majom-boards__column-title-input",columnTitle:"majom-boards__column-title",columnMenuButton:"majom-boards__column-menu-button",cards:"majom-boards__cards",card:"majom-boards__card",cardMirror:"majom-boards__card--mirror",cardOpenButton:"majom-boards__card-open",cardSourceLabel:"majom-boards__card-source-label",cardTags:"majom-boards__card-tags",cardTag:"majom-boards__card-tag",cardTitle:"majom-boards__card-title",cardBadges:"majom-boards__card-badges",cardBadge:"majom-boards__card-badge",cardComposer:"majom-boards__card-composer",cardComposerCollapsed:"majom-boards__card-composer-collapsed",cardComposerExpanded:"majom-boards__card-composer-expanded",cardComposerTextarea:"majom-boards__card-composer-textarea",composerActions:"majom-boards__composer-actions",composerCancelButton:"majom-boards__composer-cancel",columnComposerCollapsedPanel:"majom-boards__column-composer majom-boards__column-composer--collapsed",columnComposerExpandedPanel:"majom-boards__column-composer majom-boards__column-composer--expanded",columnComposerCollapsed:"majom-boards__column-composer-collapsed",columnComposerExpanded:"majom-boards__column-composer-expanded",listComposerTextarea:"majom-boards__list-composer-textarea",empty:"majom-boards__empty",emptyContent:"majom-boards__empty-content",emptyTitle:"majom-boards__empty-title",emptyCopy:"majom-boards__empty-copy",messageWrapper:"majom-boards__message-wrapper",messageLabel:"majom-boards__message-label",error:"majom-boards__error"},d={container:"majom-boards-modal",body:"majom-boards-modal__body",cardBack:"majom-boards-cardback",hiddenShellPart:"majom-boards-cardback__hidden-shell-part",topbar:"majom-boards-cardback__topbar",topbarStart:"majom-boards-cardback__topbar-start",listBadge:"majom-boards-cardback__list-badge",sourceLabel:"majom-boards-cardback__source-label",movePopover:"majom-boards-cardback__move-popover",movePopoverHeader:"majom-boards-cardback__move-popover-header",movePopoverTitle:"majom-boards-cardback__move-popover-title",movePopoverBody:"majom-boards-cardback__move-popover-body",movePopoverContent:"majom-boards-cardback__move-popover-content",moveTabs:"majom-boards-cardback__move-tabs",moveTab:"majom-boards-cardback__move-tab",moveTabSelected:"majom-boards-cardback__move-tab is-selected",moveSectionTitle:"majom-boards-cardback__move-section-title",moveFields:"majom-boards-cardback__move-fields",moveField:"majom-boards-cardback__move-field",moveLabel:"majom-boards-cardback__move-label",moveSelect:"majom-boards-cardback__move-select",moveActions:"majom-boards-cardback__move-actions",moveButton:"majom-boards-cardback__move-button",listActionsPopover:"majom-boards-list-actions",listActionsHeader:"majom-boards-list-actions__header",listActionsTitle:"majom-boards-list-actions__title",listActionsBody:"majom-boards-list-actions__body",listActionsList:"majom-boards-list-actions__list",listActionsItem:"majom-boards-list-actions__item",listActionsButton:"majom-boards-list-actions__button",listActionsDivider:"majom-boards-list-actions__divider",listActionsSection:"majom-boards-list-actions__section",listActionsSectionButton:"majom-boards-list-actions__section-button",listActionsUpgrade:"majom-boards-list-actions__upgrade",listActionsUpgradeTitle:"majom-boards-list-actions__upgrade-title",listActionsUpgradeCopy:"majom-boards-list-actions__upgrade-copy",cardActionsPopover:"majom-boards-card-actions",cardActionsBody:"majom-boards-card-actions__body",cardActionsList:"majom-boards-card-actions__list",cardActionsItem:"majom-boards-card-actions__item",cardActionsButton:"majom-boards-card-actions__button",cardActionsDivider:"majom-boards-card-actions__divider",topbarActions:"majom-boards-cardback__topbar-actions",iconButton:"majom-boards-cardback__icon-button",layout:"majom-boards-cardback__layout",main:"majom-boards-cardback__main",aside:"majom-boards-cardback__aside",section:"majom-boards-cardback__section",sectionIcon:"majom-boards-cardback__section-icon",sectionMain:"majom-boards-cardback__section-main",sectionHeader:"majom-boards-cardback__section-header",sectionTitle:"majom-boards-cardback__section-title",sectionActions:"majom-boards-cardback__section-actions",titleSection:"majom-boards-cardback__title-section",doneButton:"majom-boards-cardback__done-button",titleEditor:"majom-boards-cardback__title-editor",quickActions:"majom-boards-cardback__quick-actions",quickActionList:"majom-boards-cardback__quick-action-list",quickActionButton:"majom-boards-cardback__quick-action-button",labelsHost:"majom-boards-cardback__labels-host",labelsSection:"majom-boards-cardback__labels-section",labelsTitle:"majom-boards-cardback__labels-title",labelsList:"majom-boards-cardback__labels-list",labelSwatch:"majom-boards-cardback__label-swatch",labelAddButton:"majom-boards-cardback__label-add-button",labelPickerPopover:"majom-boards-cardback__label-picker-popover",descriptionEditor:"majom-boards-cardback__description-editor",placeholderPanel:"majom-boards-cardback__placeholder-panel",editorActions:"majom-boards-cardback__editor-actions",activityInput:"majom-boards-cardback__activity-input",activityList:"majom-boards-cardback__activity-list",activityItem:"majom-boards-cardback__activity-item",avatar:"majom-boards-cardback__avatar",quickEditorOverlay:"majom-boards-quick-editor-overlay",quickEditor:"majom-boards-quick-editor",quickEditorForm:"majom-boards-quick-editor__form",quickEditorCard:"majom-boards-quick-editor__card",quickEditorCardMirror:"majom-boards-quick-editor__card--mirror",quickEditorCardInner:"majom-boards-quick-editor__card-inner",quickEditorTitle:"majom-boards-quick-editor__title",quickEditorSave:"majom-boards-quick-editor__save",quickEditorActions:"majom-boards-quick-editor__actions",quickEditorButtons:"majom-boards-quick-editor__buttons",quickEditorButton:"majom-boards-quick-editor__button",quickEditorDangerItem:"majom-boards-quick-editor__danger-item",quickEditorDangerButton:"majom-boards-quick-editor__button--danger",quickEditorNewBadge:"majom-boards-quick-editor__new-badge"},Jt=`
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
  --mb-header-bg: rgba(255, 255, 255, 0.24);
  --mb-button-hover: rgba(9, 30, 66, 0.14);
  --mb-button-active: rgba(9, 30, 66, 0.2);
  --mb-list-button-hover: rgba(9, 30, 66, 0.08);
  --mb-list-button-active: rgba(9, 30, 66, 0.14);
  --mb-shadow-card: 0 1px 1px rgba(9, 30, 66, 0.25), 0 0 0 1px rgba(9, 30, 66, 0.06);
  --mb-shadow-list: 0 1px 1px rgba(9, 30, 66, 0.16), 0 0 1px rgba(9, 30, 66, 0.31);
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
  color: var(--mb-text);
  backdrop-filter: blur(10px);
}

.majom-boards__title-block {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 6px;
}

.majom-boards__title {
  margin: 0;
  overflow: hidden;
  color: var(--mb-text);
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
  background: var(--mb-button-hover);
  outline: none;
}

.majom-boards__title-edit-input {
  max-width: 320px;
  min-width: min(260px, 70vw);
  height: 32px;
  color: var(--mb-text);
  font: inherit;
}

.majom-boards__header-actions {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 6px;
}

.majom-boards__header-menu-button {
  color: var(--mb-text);
  background: var(--mb-button-hover);
}

.majom-boards__body {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  padding: 12px 16px 16px;
}

.majom-boards__tabs {
  display: flex;
  min-width: 0;
  max-width: 100%;
  gap: 4px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.majom-boards__tab {
  max-width: 220px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 6px;
  color: var(--mb-text);
  background: transparent;
  box-shadow: none;
}

.majom-boards__tab:hover {
  color: var(--mb-text);
  background: var(--mb-button-hover);
}

.majom-boards__tab.is-selected {
  color: var(--mb-text);
  background: rgba(9, 30, 66, 0.16);
}

.majom-boards__canvas {
  display: flex;
  min-height: 0;
  flex: 1;
  align-items: flex-start;
  gap: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0 8px 8px 0;
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
  background: rgba(255, 255, 255, 0.24);
  box-shadow: none;
  backdrop-filter: blur(8px);
}

.majom-boards__column-composer-collapsed {
  width: 100%;
  min-height: 44px;
  justify-content: flex-start;
  border-radius: 8px;
  gap: 8px;
  color: var(--mb-text);
  background: transparent;
}

.majom-boards__column-composer-collapsed:hover {
  color: var(--mb-text);
  background: var(--mb-button-hover);
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

  .majom-boards__tabs {
    max-width: min(48vw, 520px);
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
`;function te(){if(typeof document>"u"||document.getElementById(bt))return;const c=document.createElement("style");c.id=bt,c.textContent=Jt,document.head.appendChild(c)}const ee=1,ae=16384,oe={formWidth:256,actionsWidth:220,actionsGap:8,viewportMargin:12,minVisibleHeight:220};function P(c){return c.mirror_source!=null}function S(c,t){const e=c.textContent??"";c.textContent="";const a=y(t,{size:16,strokeWidth:2});a.setAttribute("aria-hidden","true");const o=document.createElement("span");o.textContent=e,c.append(a,o)}function re(c,t,e){const a=c.getButtonElement(),o=y(t,{size:16,strokeWidth:2});o.setAttribute("aria-hidden","true"),a.replaceChildren(o),a.title=e,a.setAttribute("aria-label",e)}function ie(c){var a;const t=c,e=t.commentsCount??t.commentCount??t.comments_count??((a=t.comments)==null?void 0:a.length)??0;return Number.isFinite(e)&&e>0?e:0}function W(c){return{id:c.id,title:c.title,color:c.color}}function ne(c){const t=c.trim().replace(/^#/,"");if(!/^[0-9a-f]{6}$/i.test(t))return"#172b4d";const e=parseInt(t.slice(0,2),16),a=parseInt(t.slice(2,4),16),o=parseInt(t.slice(4,6),16);return(.299*e+.587*a+.114*o)/255>.58?"#172b4d":"#ffffff"}class se{constructor(t,e){this.root=t,this.state=null,this.columnTitleTextarea=null,this.expandedCardComposerColumnId=null,this.isColumnComposerExpanded=!1,this.editingBoardTitleId=null,this.boardTitleEditInput=null,this.editingColumnTitleId=null,this.columnTitleEditInput=null,this.headerMenu=null,this.quickEditorOverlay=null,this.activeCardPlacementId=null,this.cardModalOverlay=null,this.moveCardPopover=null,this.listActionsPopover=null,this.cardActionsPopover=null,this.cardLabelsPopover=null,this.cardModalDraftTagIds=null,this.cardModalRequestedTagIds=null,this.cardModalLabelsHost=null,this.cardModalQuickActionList=null,this.tagItems=[],this.tagCatalogStatus="idle",this.cardDrafts=new Map,te(),this.runtime=e.runtime??tt(),this.tagCatalog=e.tagCatalog??null,this.handlers=e.handlers,this.dragController=new Zt({root:this.root,getState:()=>this.state,onDrop:(a,o)=>this.handlers.onPatchCardPlacement(a,o),onDragStart:()=>this.closeTransientBoardOverlays()}),this.columnDragController=new Ut({root:this.root,getState:()=>this.state,onDrop:(a,o)=>this.handlers.onPatchColumn(a,o),onDragStart:()=>this.closeTransientBoardOverlays()}),this.dragController.mount(),this.columnDragController.mount(),this.disposeRuntimeSubscription=this.runtime.subscribe(()=>this.refreshFromRuntime(),{emitCurrent:!1}),this.root.className=m.root}render(t){this.state=t,this.ensureTagCatalogLoaded(),this.dragController.cancelDrag(),this.columnDragController.cancelDrag(),this.cardDrafts.clear(),this.unmountHeaderMenu(),this.closeListActionsPopover(),this.closeCardActionsPopover(),this.closeMoveCardPopover(),this.closeQuickCardEditor(),this.root.replaceChildren(this.renderShell(t)),this.syncCardModal(t)}destroy(){this.disposeRuntimeSubscription(),this.dragController.unmount(),this.columnDragController.unmount(),this.unmountHeaderMenu(),this.closeCardLabelsPopover(),this.closeListActionsPopover(),this.closeCardActionsPopover(),this.closeMoveCardPopover(),this.closeQuickCardEditor(),this.closeCardModal(),this.cardDrafts.clear(),this.root.replaceChildren()}refreshFromRuntime(){this.state&&this.render(this.state)}closeTransientBoardOverlays(){this.closeListActionsPopover(),this.closeCardActionsPopover(),this.closeCardLabelsPopover(),this.closeMoveCardPopover(),this.closeQuickCardEditor()}ensureTagCatalogLoaded(){!this.tagCatalog||this.tagCatalogStatus!=="idle"||(this.tagCatalogStatus="loading",this.tagCatalog.loadTags().then(t=>{this.tagItems=t.map(W),this.tagCatalogStatus="ready",this.rerenderCurrentState()}).catch(()=>{this.tagItems=[],this.tagCatalogStatus="error",this.rerenderCurrentState()}))}getTagPickerErrorMessage(){return this.tagCatalogStatus==="error"?this.runtime.i18n.t("boards.cardBack.tagsLoadFailed"):null}renderShell(t){const e=document.createElement("section");if(e.className=m.shell,e.append(this.renderHeader(t)),t.error&&e.append(this.renderError(t.error)),t.status==="loading"&&t.boards.length===0)return e.append(this.renderMessage(this.runtime.i18n.t("boards.loading"))),e;if(t.boards.length===0)return e.append(this.renderEmptyState()),e;const a=this.getSelectedBoard(t);return e.append(a?this.renderBoard(a,t):this.renderMessage(this.runtime.i18n.t("boards.empty"))),e}renderHeader(t){const e=document.createElement("header");e.className=m.header;const a=this.getSelectedBoard(t),o=document.createElement("div");o.className=m.titleBlock,o.append(this.renderBoardTitle(a,t)),t.boards.length>1&&o.append(this.renderBoardTabs(t));const r=document.createElement("div");return r.className=m.headerActions,r.append(this.renderHeaderMenu(a,t)),e.append(o,r),e}renderBoardTitle(t,e){const a=document.createElement("h1");if(a.className=m.title,!t||this.editingBoardTitleId!==t.id){const o=document.createElement("button");return o.type="button",o.className=m.titleButton,o.textContent=(t==null?void 0:t.title)??this.runtime.i18n.t("boards.title"),o.disabled=!t||e.status==="saving",o.title=this.runtime.i18n.t("boards.actions.renameBoard"),o.setAttribute("aria-label",this.runtime.i18n.t("boards.actions.renameBoard")),o.addEventListener("click",()=>{t&&this.startBoardTitleEdit(t.id)}),a.append(o),a}return this.boardTitleEditInput=kt({variant:"inline",type:"text",value:t.title,autoComplete:"off",maxLength:512,className:m.titleEditInput,onKeyDown:o=>{if(o.key==="Enter"){o.preventDefault(),this.finishBoardTitleEdit(t,!0);return}o.key==="Escape"&&(o.preventDefault(),this.finishBoardTitleEdit(t,!1))}}),this.boardTitleEditInput.setAttribute("aria-label",this.runtime.i18n.t("boards.boardTitlePlaceholder")),this.boardTitleEditInput.addEventListener("blur",()=>{this.finishBoardTitleEdit(t,!0)}),a.append(this.boardTitleEditInput),requestAnimationFrame(()=>{var o,r;(o=this.boardTitleEditInput)==null||o.focus(),(r=this.boardTitleEditInput)==null||r.select()}),a}renderHeaderMenu(t,e){const a=new wt({label:this.runtime.i18n.t("boards.actions.menu"),ariaLabel:this.runtime.i18n.t("boards.actions.menu"),title:this.runtime.i18n.t("boards.actions.menu"),variant:"plain",size:"md",buttonClassName:m.headerMenuButton,placement:"bottom-end",fallbackPlacements:["bottom-start","top-end","top-start"],items:[{id:"create-board",label:this.runtime.i18n.t("boards.actions.createBoard"),disabled:e.status==="saving",onSelect:()=>{this.handlers.onCreateBoard(this.runtime.i18n.t("boards.defaultBoardTitle"))}},{id:"delete-board",label:this.runtime.i18n.t("boards.actions.deleteBoard"),disabled:!t||e.status==="saving",onSelect:()=>{t&&this.handlers.onDeleteBoard(t.id)}}]});return re(a,"ellipsis-vertical",this.runtime.i18n.t("boards.actions.menu")),this.headerMenu=a,a.mount(),a.element}renderBoard(t,e){const a=document.createElement("div");a.className=m.body;const o=document.createElement("div");return o.className=m.canvas,o.setAttribute("aria-label",t.title),o.dataset.boardCanvas="true",t.columns.forEach(r=>{o.append(this.renderColumn(t,r,e))}),o.append(this.renderColumnComposer(t,e)),a.append(o),a}renderBoardTabs(t){const e=document.createElement("div");return e.className=m.tabs,t.boards.forEach(a=>{const o=a.id===t.selectedBoardId;e.append(g({text:a.title,tone:"text",size:"sm",className:o?m.boardTabSelected:m.boardTab,onClick:()=>this.handlers.onSelectBoard(a.id)}))}),e}renderColumn(t,e,a){const o=document.createElement("section");o.className=m.column,o.dataset.boardColumnId=String(e.id),o.dataset.boardColumnDraggable="true";const r=document.createElement("header");r.className=m.columnHeader,r.append(this.renderColumnTitle(e,a));const i=k({icon:"ellipsis-vertical",tone:"text",size:"sm",className:`${m.iconButton} ${m.columnMenuButton}`,title:this.runtime.i18n.t("boards.listActions.title"),ariaLabel:this.runtime.i18n.t("boards.listActions.title"),disabled:a.status==="saving"});i.setAttribute("aria-haspopup","dialog"),i.setAttribute("aria-expanded","false"),i.setAttribute("data-testid","list-actions-menu-button"),i.dataset.boardDragIgnore="true",i.addEventListener("click",s=>{var l;if(s.stopPropagation(),((l=this.listActionsPopover)==null?void 0:l.trigger)===i){this.closeListActionsPopover();return}this.openListActionsPopover(i,e)}),r.append(i);const n=document.createElement("div");return n.className=m.cards,n.dataset.boardCardsContainer="true",e.cards.forEach(s=>n.append(this.renderCard(s))),o.append(r,n,this.renderCardComposer(e,a)),o}renderColumnTitle(t,e){if(this.editingColumnTitleId===t.id)return this.columnTitleEditInput=document.createElement("input"),this.columnTitleEditInput.className=m.columnTitleInput,this.columnTitleEditInput.type="text",this.columnTitleEditInput.value=t.title,this.columnTitleEditInput.maxLength=512,this.columnTitleEditInput.autocomplete="off",this.columnTitleEditInput.setAttribute("aria-label",this.runtime.i18n.t("boards.columnTitlePlaceholder")),this.columnTitleEditInput.addEventListener("keydown",r=>{if(r.key==="Enter"){r.preventDefault(),this.finishColumnTitleEdit(t,!0);return}r.key==="Escape"&&(r.preventDefault(),this.finishColumnTitleEdit(t,!1))}),this.columnTitleEditInput.addEventListener("blur",()=>{this.finishColumnTitleEdit(t,!0)}),requestAnimationFrame(()=>{var r,i;(r=this.columnTitleEditInput)==null||r.focus(),(i=this.columnTitleEditInput)==null||i.select()}),this.columnTitleEditInput;const a=document.createElement("button");a.type="button",a.className=m.columnTitleButton,a.disabled=e.status==="saving",a.title=this.runtime.i18n.t("boards.actions.renameColumn"),a.setAttribute("aria-label",this.runtime.i18n.t("boards.actions.renameColumn")),a.addEventListener("click",()=>this.startColumnTitleEdit(t.id));const o=document.createElement("span");return o.className=m.columnTitle,o.textContent=t.title,a.append(o),a}openListActionsPopover(t,e){this.closeListActionsPopover();const a=L({elevated:!0,className:`${d.listActionsPopover} hidden`});a.setAttribute("role","dialog"),a.setAttribute("aria-modal","false"),a.setAttribute("aria-labelledby","list-actions-menu"),a.setAttribute("data-testid","list-actions-popover"),a.addEventListener("mousedown",l=>l.stopPropagation());const o=document.createElement("header");o.className=d.listActionsHeader;const r=document.createElement("h2");r.id="list-actions-menu",r.className=d.listActionsTitle,r.textContent=this.runtime.i18n.t("boards.listActions.title");const i=k({icon:"x-mark",tone:"text",size:"sm",className:d.iconButton,ariaLabel:this.runtime.i18n.t("common.close"),title:this.runtime.i18n.t("common.close"),onClick:()=>this.closeListActionsPopover()});o.append(r,i);const n=document.createElement("div");n.className=d.listActionsBody,n.append(this.renderListActionList([this.createListActionButton({labelKey:"boards.listActions.addCard",testId:"list-actions-add-card-button",onClick:()=>{this.closeListActionsPopover(),this.expandCardComposer(e.id)}}),this.createListActionButton({labelKey:"boards.listActions.copyList",testId:"list-actions-copy-list-button",disabled:!0}),this.createListActionButton({labelKey:"boards.listActions.moveList",testId:"list-actions-move-list-button",disabled:!0}),this.createListActionButton({labelKey:"boards.listActions.moveAllCards",testId:"list-actions-move-all-cards-button",disabled:!0}),this.createListActionButton({labelKey:"boards.listActions.sortBy",disabled:!0}),this.createListActionButton({labelKey:"boards.listActions.watch",testId:"list-actions-watch-list-button",disabled:!0})]),this.renderListActionsDivider(),this.renderListActionsColorSection(),this.renderListActionsDivider(),this.renderListActionsAutomationSection(),this.renderListActionsDivider(),this.renderListActionList([this.createListActionButton({labelKey:"boards.listActions.archiveList",testId:"list-actions-archive-list-button",onClick:()=>{this.closeListActionsPopover(),this.handlers.onDeleteColumn(e.id)}}),this.createListActionButton({labelKey:"boards.listActions.archiveAllCards",disabled:!0})])),a.append(o,n);let s;s=new O({container:t,panel:a,positioning:"viewport",panelZIndex:290,onOpenChange:l=>{var u;t.setAttribute("aria-expanded",l?"true":"false"),!l&&((u=this.listActionsPopover)==null?void 0:u.menu)===s&&this.closeListActionsPopover()}}),s.mount(),this.listActionsPopover={menu:s,panel:a,trigger:t},s.openAt({anchor:t,placement:"bottom-end",fallbackPlacements:["bottom-start","top-end","top-start"],gap:8,margin:12,lockPlacementAfterOpen:!0})}renderListActionList(t){const e=document.createElement("ul");return e.className=d.listActionsList,t.forEach(a=>{const o=document.createElement("li");o.className=d.listActionsItem,o.append(a),e.append(o)}),e}createListActionButton(t){const e=g({text:this.runtime.i18n.t(t.labelKey),tone:"text",size:"md",className:d.listActionsButton,disabled:t.disabled,onClick:t.onClick});return t.testId&&e.setAttribute("data-testid",t.testId),e}renderListActionsDivider(){const t=document.createElement("div");return t.className=d.listActionsDivider,t.setAttribute("role","separator"),t}renderListActionsColorSection(){const t=document.createElement("section");t.className=d.listActionsSection;const e=g({text:this.runtime.i18n.t("boards.listActions.changeListColor"),tone:"text",size:"md",className:d.listActionsSectionButton,disabled:!0}),a=y("chevron-up",{size:16,strokeWidth:2});a.setAttribute("aria-hidden","true"),e.append(a);const o=document.createElement("div");o.className=d.listActionsUpgrade;const r=document.createElement("p");r.className=d.listActionsUpgradeTitle,r.textContent=this.runtime.i18n.t("boards.listActions.colorUpgradeTitle");const i=document.createElement("p");return i.className=d.listActionsUpgradeCopy,i.textContent=this.runtime.i18n.t("boards.listActions.colorUpgradeBody"),o.append(r,i),t.append(e,o),t}renderListActionsAutomationSection(){const t=document.createElement("section");t.className=d.listActionsSection;const e=g({text:this.runtime.i18n.t("boards.listActions.automation"),tone:"text",size:"md",className:d.listActionsSectionButton,disabled:!0}),a=y("chevron-up",{size:16,strokeWidth:2});return a.setAttribute("aria-hidden","true"),e.append(a),t.append(e,this.renderListActionList([this.createListActionButton({labelKey:"boards.listActions.whenCardAdded",disabled:!0}),this.createListActionButton({labelKey:"boards.listActions.everyDaySort",disabled:!0}),this.createListActionButton({labelKey:"boards.listActions.everyMondaySort",disabled:!0}),this.createListActionButton({labelKey:"boards.listActions.createRule",disabled:!0})])),t}renderCard(t){const e=v(t),a=document.createElement("article");a.className=P(t)?`${m.card} ${m.cardMirror}`:m.card,a.dataset.boardCardId=String(t.id),a.dataset.boardCardPlacementId=String(e),a.dataset.boardCardDraggable="true",a.addEventListener("contextmenu",l=>{l.preventDefault(),l.stopPropagation(),this.openQuickCardEditor(e,a.getBoundingClientRect())});const o=document.createElement("button");o.type="button",o.className=m.cardOpenButton,o.dataset.boardCardOpen=String(e),o.setAttribute("aria-label",this.runtime.i18n.t("boards.actions.openCard")),o.addEventListener("click",()=>this.openCardModal(e));const r=document.createElement("h3");r.className=m.cardTitle,r.textContent=t.title;const i=this.renderCardMirrorSourceLabel(t,m.cardSourceLabel),n=this.renderCardFrontTags(t);i&&o.append(i),n&&o.append(n),o.append(r);const s=this.renderCardFrontBadges(t);return s&&o.append(s),a.append(o),a}renderCardFrontTags(t){var a;if(!((a=t.tags)!=null&&a.length))return null;const e=document.createElement("div");return e.className=m.cardTags,e.setAttribute("data-testid","board-card-tags"),t.tags.forEach(o=>{e.append(this.createCardTagChip(o,m.cardTag))}),e}createCardTagChip(t,e){const a=document.createElement("span");return a.className=e,a.title=t.title,a.setAttribute("aria-label",t.title),a.setAttribute("role","img"),a.setAttribute("data-testid","compact-card-label"),a.style.backgroundColor=t.color,a}renderCardFrontBadges(t){const e=document.createElement("div");e.className=m.cardBadges,t.description.trim()&&e.append(this.createCardFrontBadge("bars-3-bottom-left",this.runtime.i18n.t("boards.cardDescriptionLabel")));const a=ie(t);return a>0&&e.append(this.createCardFrontBadge("chat-bubble-bottom-center-text",this.runtime.i18n.t("boards.cardBack.comments"),String(a))),e.childElementCount>0?e:null}renderCardMirrorSourceLabel(t,e){if(!t.mirror_source)return null;const a=t.mirror_source,o=this.runtime.i18n.t("boards.cardMirror.sourceLocation",{board:a.board_title,list:a.column_title}),r=document.createElement("span");return r.className=e,r.setAttribute("data-testid","card-mirror-source-label"),r.textContent=o,r.title=this.runtime.i18n.t("boards.cardMirror.sourceLabel",{source:o}),r.setAttribute("aria-label",r.title),r}createCardFrontBadge(t,e,a){const o=document.createElement("span");o.className=m.cardBadge,o.title=e,o.setAttribute("aria-label",a?`${e}: ${a}`:e);const r=y(t,{size:16,strokeWidth:2});if(r.setAttribute("aria-hidden","true"),o.append(r),a){const i=document.createElement("span");i.textContent=a,o.append(i)}return o}renderCardComposer(t,e){const a=document.createElement("div");if(a.className=m.cardComposer,this.expandedCardComposerColumnId!==t.id){const n=g({text:this.runtime.i18n.t("boards.actions.createCard"),tone:"text",size:"md",fullWidth:!0,className:m.cardComposerCollapsed,disabled:e.status==="saving",onClick:()=>this.expandCardComposer(t.id)});return a.append(n),a}const o=document.createElement("form");o.className=m.cardComposerExpanded,o.addEventListener("submit",n=>{n.preventDefault(),this.submitCard(t.id)});const r=document.createElement("textarea");r.className=m.cardComposerTextarea,r.placeholder=this.runtime.i18n.t("boards.cardComposerPlaceholder"),r.dir="auto",r.rows=2,r.setAttribute("data-testid","list-card-composer-textarea"),r.setAttribute("aria-label",this.runtime.i18n.t("boards.cardTitleLabel")),r.addEventListener("keydown",n=>{n.key!=="Enter"||n.shiftKey||(n.preventDefault(),this.submitCard(t.id))}),this.cardDrafts.set(t.id,{title:r});const i=document.createElement("div");return i.className=m.composerActions,i.append(g({text:this.runtime.i18n.t("boards.actions.createCard"),tone:"primary",size:"sm",type:"submit",className:m.primaryButton,disabled:e.status==="saving"}),k({icon:"x-mark",tone:"text",size:"md",type:"button",title:this.runtime.i18n.t("boards.actions.cancelNewCard"),ariaLabel:this.runtime.i18n.t("boards.actions.cancelNewCard"),className:m.composerCancelButton,onClick:()=>this.collapseCardComposer()})),o.append(r,i),a.append(o),requestAnimationFrame(()=>r.focus()),a}renderColumnComposer(t,e){const a=document.createElement("aside");if(a.className=this.isColumnComposerExpanded?m.columnComposerExpandedPanel:m.columnComposerCollapsedPanel,a.dataset.boardColumnComposer="true",!this.isColumnComposerExpanded){const i=g({text:this.runtime.i18n.t("boards.addColumnPanelTitle"),tone:"text",size:"md",fullWidth:!0,className:m.columnComposerCollapsed,disabled:e.status==="saving",onClick:()=>this.expandColumnComposer()});return i.setAttribute("data-testid","list-composer-button"),i.setAttribute("data-drag-scroll-disabled","true"),S(i,"plus"),a.append(i),a}const o=document.createElement("form");o.className=m.columnComposerExpanded,o.setAttribute("data-focus-lock-disabled","false"),o.addEventListener("submit",i=>{i.preventDefault(),this.submitColumnTitle(t.id)}),this.columnTitleTextarea=document.createElement("textarea"),this.columnTitleTextarea.className=m.listComposerTextarea,this.columnTitleTextarea.placeholder=this.runtime.i18n.t("boards.columnTitlePlaceholder"),this.columnTitleTextarea.name=this.runtime.i18n.t("boards.columnTitlePlaceholder"),this.columnTitleTextarea.dir="auto",this.columnTitleTextarea.rows=1,this.columnTitleTextarea.maxLength=512,this.columnTitleTextarea.spellcheck=!1,this.columnTitleTextarea.setAttribute("data-testid","list-name-textarea"),this.columnTitleTextarea.setAttribute("autocomplete","off"),this.columnTitleTextarea.setAttribute("aria-label",this.runtime.i18n.t("boards.columnTitlePlaceholder")),this.columnTitleTextarea.addEventListener("keydown",i=>{i.key!=="Enter"||i.shiftKey||(i.preventDefault(),this.submitColumnTitle(t.id))});const r=document.createElement("div");return r.className=m.composerActions,r.append(g({text:this.runtime.i18n.t("boards.actions.createColumn"),tone:"primary",size:"sm",type:"submit",className:m.primaryButton,disabled:e.status==="saving"}),k({icon:"x-mark",tone:"text",size:"md",type:"button",title:this.runtime.i18n.t("boards.actions.cancelNewColumn"),ariaLabel:this.runtime.i18n.t("boards.actions.cancelNewColumn"),className:m.composerCancelButton,onClick:()=>this.collapseColumnComposer()})),o.append(this.columnTitleTextarea,r),a.append(o),requestAnimationFrame(()=>{var i;return(i=this.columnTitleTextarea)==null?void 0:i.focus()}),a}renderEmptyState(){const t=document.createElement("div");t.className=m.empty;const e=document.createElement("div");e.className=m.emptyContent;const a=document.createElement("h2");a.className=m.emptyTitle,a.textContent=this.runtime.i18n.t("boards.emptyTitle");const o=document.createElement("p");return o.className=m.emptyCopy,o.textContent=this.runtime.i18n.t("boards.emptyBody"),e.append(a,o),t.append(e),t}renderMessage(t){const e=document.createElement("div");e.className=m.messageWrapper;const a=document.createElement("p");return a.className=m.messageLabel,a.textContent=t,e.append(a),e}renderError(t){const e=document.createElement("div");return e.className=m.error,e.textContent=this.runtime.i18n.t(t),e}openQuickCardEditor(t,e){if(!this.state)return;const a=this.findCardLocation(t,this.state);if(!a)return;this.closeQuickCardEditor();const o=document.createElement("div");o.className=d.quickEditorOverlay,o.addEventListener("pointerdown",i=>{i.target===o&&this.closeQuickCardEditor()}),o.addEventListener("keydown",i=>{i.key==="Escape"&&(i.preventDefault(),this.closeQuickCardEditor())});const r=this.renderQuickCardEditor(a);this.positionQuickCardEditor(r,e),o.append(r),document.body.append(o),this.quickEditorOverlay=o,requestAnimationFrame(()=>{var i;(i=r.querySelector('[data-testid="quick-card-editor-card-title"]'))==null||i.focus()})}renderQuickCardEditor(t){const{card:e}=t,a=document.createElement("div");a.className=d.quickEditor,a.setAttribute("data-elevation","1"),a.addEventListener("pointerdown",b=>b.stopPropagation());const o=document.createElement("div");o.setAttribute("role","dialog"),o.setAttribute("aria-modal","true"),o.setAttribute("aria-label",this.runtime.i18n.t("boards.quickEditor.menuLabel")),o.setAttribute("data-testid","quick-card-editor-menu");const r=document.createElement("form");r.className=d.quickEditorForm,r.addEventListener("submit",b=>{b.preventDefault(),this.saveQuickCardEditor(e,s)});const i=L({elevated:!0,className:P(e)?`${d.quickEditorCard} ${d.quickEditorCardMirror}`:d.quickEditorCard});i.setAttribute("data-testid","quick-card-editor-card-front");const n=document.createElement("div");n.className=d.quickEditorCardInner;const s=document.createElement("textarea");s.className=d.quickEditorTitle,s.setAttribute("data-testid","quick-card-editor-card-title"),s.dir="auto",s.setAttribute("aria-label",this.runtime.i18n.t("boards.quickEditor.editCardName")),s.value=e.title,s.rows=2,s.addEventListener("keydown",b=>{b.key!=="Enter"||b.shiftKey||(b.preventDefault(),this.saveQuickCardEditor(e,s))});const l=this.renderCardFrontBadges(e),u=this.renderCardMirrorSourceLabel(e,m.cardSourceLabel);u&&n.append(u),n.append(s),l&&n.append(l),i.append(n);const p=g({text:this.runtime.i18n.t("common.save"),tone:"primary",size:"md",className:`${m.primaryButton} ${d.quickEditorSave}`,type:"submit"}),f=()=>{p.disabled=s.value.trim().length===0};return s.addEventListener("input",f),f(),r.append(i,p),o.append(r,this.renderQuickCardEditorActions(t)),a.append(o),a}renderQuickCardEditorActions(t){const{board:e,column:a,card:o,placementId:r}=t,i=document.createElement("div");i.className=d.quickEditorActions;const n=document.createElement("ul");return n.className=d.quickEditorButtons,n.setAttribute("data-testid","quick-card-editor-buttons"),[{testId:"quick-card-editor-open-card",labelKey:"boards.quickEditor.openCard",icon:"rectangle-stack",onClick:()=>{this.closeQuickCardEditor(),this.openCardModal(r)}},{testId:"quick-card-editor-edit-labels",labelKey:"boards.quickEditor.editLabels",icon:"tag",onClick:()=>{this.closeQuickCardEditor(),this.openCardModal(r)}},{testId:"quick-card-editor-change-members",labelKey:"boards.quickEditor.changeMembers",icon:"plus",disabled:!0},{testId:"quick-card-editor-change-cover",labelKey:"boards.quickEditor.changeCover",icon:"document",disabled:!0},{testId:"quick-card-editor-edit-dates",labelKey:"boards.quickEditor.editDates",icon:"calendar",disabled:!0},{testId:"quick-card-editor-move",labelKey:"boards.quickEditor.move",icon:"arrow-right",onClick:l=>{this.openMoveCardPopover(l.currentTarget,e,a,o,"move")}},{testId:"quick-card-editor-create-jira-work-item",labelKey:"boards.quickEditor.createJiraWorkItem",icon:"check-box",disabled:!0,badgeText:this.runtime.i18n.t("boards.quickEditor.newBadge")},{testId:"quick-card-editor-copy",labelKey:"boards.quickEditor.copyCard",icon:"square-2-stack",disabled:!0},{testId:"quick-card-editor-copy-link",labelKey:"boards.quickEditor.copyLink",icon:"link",disabled:!0},{testId:"mirror-new-button",labelKey:"boards.quickEditor.mirror",icon:"rectangle-stack",onClick:l=>{this.openMoveCardPopover(l.currentTarget,e,a,o,"mirror")}},{testId:"quick-card-editor-archive",labelKey:P(o)?"boards.quickEditor.removeFromBoard":"boards.quickEditor.archive",icon:"archive-box",onClick:()=>{this.closeQuickCardEditor(),this.archiveOrRemoveCard(o,r)}},{testId:"quick-card-editor-delete-card",labelKey:"boards.actions.deleteCard",icon:"trash",danger:!0,onClick:()=>void this.deleteSharedCardFromQuickEditor(o)}].forEach(l=>{const u=document.createElement("li");l.danger&&(u.className=d.quickEditorDangerItem);const p=g({text:this.runtime.i18n.t(l.labelKey),tone:l.danger?"danger":"text",size:"md",className:l.danger?`${d.quickEditorButton} ${d.quickEditorDangerButton}`:d.quickEditorButton,disabled:l.disabled,onClick:l.onClick});if(p.setAttribute("data-testid",l.testId),S(p,l.icon),l.badgeText){const f=document.createElement("span");f.className=d.quickEditorNewBadge,f.textContent=l.badgeText,p.append(f)}u.append(p),n.append(u)}),i.append(n),i}positionQuickCardEditor(t,e){const{formWidth:a,actionsWidth:o,actionsGap:r,viewportMargin:i,minVisibleHeight:n}=oe,s=Math.min(Math.max(e.left,i),Math.max(i,window.innerWidth-a-o-r-i)),l=Math.min(Math.max(e.top,i),Math.max(i,window.innerHeight-n-i));t.style.left=`${s}px`,t.style.top=`${l}px`}saveQuickCardEditor(t,e){const a=e.value.trim();a&&(this.closeQuickCardEditor(),a!==t.title&&this.handlers.onPatchCard(t.id,{title:a}))}openCardModal(t){if(!this.state)return;const e=this.findCardLocation(t,this.state);e&&(this.activeCardPlacementId=t,this.cardModalDraftTagIds=A(e.card),this.cardModalRequestedTagIds=[...this.cardModalDraftTagIds],this.renderCardModal(e))}syncCardModal(t){if(this.activeCardPlacementId===null)return;const e=this.findCardLocation(this.activeCardPlacementId,t);if(!e){this.closeCardModal();return}this.renderCardModal(e)}renderCardModal(t){var b;this.closeCardLabelsPopover(),this.closeMoveCardPopover(),(b=this.cardModalOverlay)==null||b.remove(),this.cardModalOverlay=null,this.cardModalLabelsHost=null,this.cardModalQuickActionList=null;const{board:e,column:a,card:o}=t;this.cardModalDraftTagIds===null&&(this.cardModalDraftTagIds=A(o)),this.cardModalRequestedTagIds===null&&(this.cardModalRequestedTagIds=A(o));const{overlay:r,container:i,header:n,divider:s,body:l}=yt(o.title,{onClose:()=>this.closeCardModal(),hideCloseButton:!0,intent:"form",presentation:"dialog",zIndex:270});n.classList.add(d.hiddenShellPart),s.classList.add(d.hiddenShellPart),i.classList.add(d.container),i.addEventListener("keydown",B=>{B.stopPropagation()}),l.className=d.body;const u=document.createElement("textarea");u.className=d.titleEditor,u.dataset.boardCardModalTitle="true",u.dir="auto",u.rows=ee,u.maxLength=ae,u.value=o.title,u.setAttribute("aria-label",o.title);const p=document.createElement("textarea");p.className=d.descriptionEditor,p.dataset.boardCardModalDescription="true",p.value=o.description,p.placeholder=this.runtime.i18n.t("boards.cardDescriptionPlaceholder"),p.setAttribute("aria-label",this.runtime.i18n.t("boards.cardDescriptionLabel"));const f=document.createElement("div");f.className=d.cardBack,f.append(this.renderCardBackTopbar(e,a,o),this.renderCardBackLayout(e,a,o,u,p)),l.append(f),i.setAttribute("aria-labelledby","card-back-name"),i.setAttribute("data-focus-lock","cardback"),this.cardModalOverlay=r}renderCardBackTopbar(t,e,a){const o=document.createElement("header");o.className=d.topbar;const r=document.createElement("div");r.className=d.topbarStart;const i=document.createElement("button");i.type="button",i.className=d.listBadge,i.setAttribute("data-testid","card-back-list-button"),i.title=e.title,i.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.changeList",{column:e.title})),i.setAttribute("aria-haspopup","dialog"),i.setAttribute("aria-expanded","false"),i.addEventListener("click",f=>{var b;if(f.stopPropagation(),((b=this.moveCardPopover)==null?void 0:b.trigger)===i){this.closeMoveCardPopover();return}this.openMoveCardPopover(i,t,e,a)});const n=document.createElement("span");n.textContent=e.title;const s=y("chevron-down",{size:14,strokeWidth:2});s.setAttribute("aria-hidden","true"),i.append(n,s),r.append(i);const l=this.renderCardMirrorSourceLabel(a,d.sourceLabel);l&&r.append(l);const u=document.createElement("div");u.className=d.topbarActions;const p=k({icon:"ellipsis-vertical",tone:"text",size:"md",className:d.iconButton,ariaLabel:this.runtime.i18n.t("boards.cardBack.actions"),title:this.runtime.i18n.t("boards.cardBack.actions")});return p.setAttribute("aria-haspopup","dialog"),p.setAttribute("aria-expanded","false"),p.setAttribute("data-testid","card-back-actions-button"),p.addEventListener("click",f=>{var b;if(f.stopPropagation(),((b=this.cardActionsPopover)==null?void 0:b.trigger)===p){this.closeCardActionsPopover();return}this.openCardActionsPopover(p,t,e,a)}),u.append(p,k({icon:"x-mark",tone:"text",size:"md",className:d.iconButton,ariaLabel:this.runtime.i18n.t("common.close"),title:this.runtime.i18n.t("common.close"),onClick:()=>this.closeCardModal()})),o.append(r,u),o}openCardActionsPopover(t,e,a,o){this.closeCardActionsPopover();const r=L({elevated:!0,className:`${d.cardActionsPopover} hidden`});r.setAttribute("role","dialog"),r.setAttribute("aria-modal","false"),r.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.actions")),r.setAttribute("data-testid","card-back-actions-popover"),r.addEventListener("mousedown",l=>l.stopPropagation());const i=document.createElement("div");i.className=d.cardActionsBody;const n=document.createElement("ul");n.className=d.cardActionsList,n.append(this.renderCardActionItem({testId:"card-back-move-card-button",labelKey:"boards.quickEditor.move",icon:"arrow-right",disabled:!0}),this.renderCardActionItem({testId:"card-back-copy-card-button",labelKey:"boards.quickEditor.copyCard",icon:"square-2-stack",disabled:!0}),this.renderCardActionItem({testId:"card-back-mirror-card-button",labelKey:"boards.quickEditor.mirror",icon:"rectangle-stack",onClick:()=>{this.closeCardActionsPopover(),this.openMoveCardPopover(t,e,a,o,"mirror")}}),this.renderCardActionsDivider(),this.renderCardActionItem({testId:"card-back-archive-button",labelKey:P(o)?"boards.quickEditor.removeFromBoard":"boards.quickEditor.archive",icon:"archive-box",onClick:()=>{this.closeCardActionsPopover(),this.closeCardModal(),this.archiveOrRemoveCard(o,v(o))}}),this.renderCardActionItem({testId:"card-back-delete-card-button",labelKey:"boards.actions.deleteCard",icon:"trash",onClick:()=>void this.deleteSharedCardFromDetails(o)})),i.append(n),r.append(i);let s;s=new O({container:t,panel:r,positioning:"viewport",panelZIndex:300,onOpenChange:l=>{var u;t.setAttribute("aria-expanded",l?"true":"false"),!l&&((u=this.cardActionsPopover)==null?void 0:u.menu)===s&&this.closeCardActionsPopover()}}),s.mount(),this.cardActionsPopover={menu:s,panel:r,trigger:t},s.openAt({anchor:t,placement:"bottom-end",fallbackPlacements:["bottom-start","top-end","top-start"],gap:8,margin:12,lockPlacementAfterOpen:!0})}renderCardActionItem(t){const e=document.createElement("li");e.className=d.cardActionsItem;const a=g({text:this.runtime.i18n.t(t.labelKey),tone:"text",size:"md",className:d.cardActionsButton,disabled:t.disabled,onClick:t.onClick});return a.setAttribute("data-testid",t.testId),S(a,t.icon),e.append(a),e}renderCardActionsDivider(){const t=document.createElement("li");return t.className=d.cardActionsDivider,t.setAttribute("role","separator"),t}archiveOrRemoveCard(t,e){if(P(t)){this.handlers.onDeleteCardPlacement(e);return}this.handlers.onDeleteCard(t.id)}createPlacementTargetFromPosition(t,e,a){return gt({columnId:t.id,cards:t.cards,movingPlacementId:a??"",insertionIndex:e-1})}openMoveCardPopover(t,e,a,o,r="move"){var at;const i=((at=this.state)==null?void 0:at.boards)??[e],n=v(o);let s=e.id,l=a.id,u=a.cards.findIndex(h=>v(h)===n);u=u>=0?u+1:1;const p=r==="mirror"?"boards.cardMirror.title":"boards.cardMove.title",f=r==="mirror"?"boards.cardMirror.create":"boards.cardMove.move";this.closeMoveCardPopover();const b=L({elevated:!0,className:`${d.movePopover} hidden`});b.setAttribute("role","dialog"),b.setAttribute("aria-modal","false"),b.setAttribute("aria-labelledby","move-card-popover"),b.setAttribute("data-testid","move-card-popover"),b.addEventListener("mousedown",h=>h.stopPropagation());const B=document.createElement("header");B.className=d.movePopoverHeader;const M=document.createElement("h2");M.id="move-card-popover",M.className=d.movePopoverTitle,M.textContent=this.runtime.i18n.t(p);const ft=k({icon:"x-mark",tone:"text",size:"sm",className:d.iconButton,ariaLabel:this.runtime.i18n.t("common.close"),title:this.runtime.i18n.t("common.close"),onClick:()=>this.closeMoveCardPopover()});B.append(M,ft);const Q=document.createElement("div");Q.className=d.movePopoverBody;const X=document.createElement("div");X.className=d.movePopoverContent;const N=document.createElement("div");N.className=d.moveTabs,N.setAttribute("role","tablist"),N.append(this.renderMoveCardTab("boards.cardMove.inbox",!1),this.renderMoveCardTab("boards.cardMove.board",!0));const U=document.createElement("h3");U.className=d.moveSectionTitle,U.textContent=this.runtime.i18n.t("boards.cardMove.selectDestination");const Y=document.createElement("div");Y.className=d.moveFields;const q=this.createMoveSelectField({id:"move-card-board-select",label:this.runtime.i18n.t("boards.cardMove.board")}),D=this.createMoveSelectField({id:"move-card-list-select",label:this.runtime.i18n.t("boards.cardMove.list")}),z=this.createMoveSelectField({id:"move-card-board-list-position-select",label:this.runtime.i18n.t("boards.cardMove.position")}),et=()=>i.find(h=>h.id===s)??null,T=()=>{var h;return((h=et())==null?void 0:h.columns.find(_=>_.id===l))??null},xt=()=>{var h;return r!=="mirror"?!1:((h=T())==null?void 0:h.cards.some(_=>_.id===o.id))??!1},vt=()=>{const h=T();return h?r==="mirror"?h.cards.length+1:h.id===a.id?h.cards.length:h.cards.length+1:0};let R;const G=()=>{var E;q.select.replaceChildren(...i.map(C=>this.createSelectOption(C.id,C.title,C.id===s)));const h=et(),_=(h==null?void 0:h.columns)??[];_.some(C=>C.id===l)||(l=((E=_[0])==null?void 0:E.id)??""),D.select.replaceChildren(..._.map(C=>this.createSelectOption(C.id,C.title,C.id===l)));const j=vt();u=Math.min(Math.max(u,1),j||1),z.select.replaceChildren(...Array.from({length:j},(C,Z)=>this.createSelectOption(Z+1,String(Z+1),Z+1===u))),xt()?$.show(this.runtime.i18n.t("boards.cardMirror.duplicateDestination"),"warning"):T()?$.clear():$.show(this.runtime.i18n.t("boards.cardMirror.noDestination"),"error"),R.disabled=!T()},$=jt({tone:"error",className:"mb-3"});q.select.addEventListener("change",()=>{var h,_;s=q.select.value,l=((_=(h=i.find(j=>j.id===s))==null?void 0:h.columns[0])==null?void 0:_.id)??"",u=1,G()}),D.select.addEventListener("change",()=>{l=D.select.value,u=l===a.id?u:1,G()}),z.select.addEventListener("change",()=>{u=Number(z.select.value)}),R=g({text:this.runtime.i18n.t(f),tone:"primary",size:"md",className:d.moveButton,onClick:()=>{const h=T();if(!h)return;const _=this.createPlacementTargetFromPosition(h,u,r==="move"?n:void 0),j=a.cards.findIndex(E=>v(E)===n);if(this.closeMoveCardPopover(),r==="mirror"){this.closeQuickCardEditor();const{column:E,...C}=_;this.handlers.onCreateCardMirror(o.id,E,C);return}if(h.id===a.id&&u-1===j){this.closeQuickCardEditor();return}this.closeQuickCardEditor(),this.handlers.onPatchCardPlacement(n,_)}}),R.setAttribute("data-testid","move-card-popover-move-button");const V=document.createElement("div");V.className=d.moveActions,V.append(R),Y.append(q.field,D.field,z.field),X.append(N,U,Y,$.element),Q.append(X,V),b.append(B,Q);let I;I=new O({container:t,panel:b,positioning:"viewport",panelZIndex:300,onOpenChange:h=>{var _;t.setAttribute("aria-expanded",h?"true":"false"),!h&&((_=this.moveCardPopover)==null?void 0:_.menu)===I&&this.closeMoveCardPopover()}}),I.mount(),this.moveCardPopover={menu:I,panel:b,trigger:t},G(),I.openAt({anchor:t,placement:"bottom-start",fallbackPlacements:["bottom-end","top-start","top-end"],gap:8,margin:12,lockPlacementAfterOpen:!0})}renderMoveCardTab(t,e){const a=document.createElement("button");return a.type="button",a.className=e?d.moveTabSelected:d.moveTab,a.setAttribute("role","tab"),a.setAttribute("aria-selected",e?"true":"false"),a.disabled=!e,a.textContent=this.runtime.i18n.t(t),a}createMoveSelectField(t){const e=document.createElement("label");e.className=d.moveField,e.htmlFor=t.id;const a=document.createElement("span");a.className=d.moveLabel,a.textContent=t.label;const o=document.createElement("select");return o.id=t.id,o.className=d.moveSelect,o.setAttribute("data-testid",`${t.id}-select`),e.append(a,o),{field:e,select:o}}createSelectOption(t,e,a){const o=document.createElement("option");return o.value=String(t),o.textContent=e,o.selected=a,o}renderCardBackLayout(t,e,a,o,r){const i=document.createElement("div");i.className=d.layout;const n=document.createElement("main");n.className=d.main,n.setAttribute("data-auto-scrollable","true"),n.append(this.renderCardBackTitleSection(a,o),this.renderCardBackQuickActions(a),this.renderCardBackLabelsHost(a),this.renderCardBackDescriptionSection(a,o,r),this.renderCardBackAttachmentsSection());const s=this.renderCardBackAside(t,e);return i.append(n,s),i}renderCardBackTitleSection(t,e){const a=document.createElement("section");a.className=`${d.section} ${d.titleSection}`,a.setAttribute("data-testid","card-back-header");const o=document.createElement("div");o.className=d.sectionIcon;const r=document.createElement("button");r.type="button",r.className=d.doneButton,r.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.markComplete",{title:t.title})),r.disabled=!0,r.append(y("check-circle",{size:20,strokeWidth:2})),o.append(r);const i=document.createElement("div");i.className=d.sectionMain;const n=document.createElement("hgroup"),s=document.createElement("h2");return s.id="card-back-name",s.className=d.hiddenShellPart,s.textContent=t.title,n.append(s,e),i.append(n),a.append(o,i),a}renderCardBackQuickActions(t){const e=document.createElement("section");e.className=`${d.section} ${d.quickActions}`;const a=document.createElement("div");a.className=d.sectionIcon;const o=document.createElement("div");o.className=d.sectionMain;const r=document.createElement("ul");return r.className=d.quickActionList,this.cardModalQuickActionList=r,this.populateCardBackQuickActions(r,t),o.append(r),e.append(a,o),e}populateCardBackQuickActions(t,e){t.replaceChildren();const a=[{labelKey:"boards.cardBack.add",icon:"plus",disabled:!0}];this.getCardModalDraftTagItems(e).length===0&&a.push({labelKey:"boards.cardBack.labels",icon:"tag",onClick:o=>this.openCardLabelsPopover(o,e)}),a.push({labelKey:"boards.cardBack.dates",icon:"calendar",disabled:!0},{labelKey:"boards.cardBack.checklist",icon:"check-box",disabled:!0},{labelKey:"boards.cardBack.members",icon:"plus",disabled:!0}),a.forEach(o=>{const r=document.createElement("li"),i=o.disabled===!0?this.createUnavailableCardBackButton(o.labelKey,o.icon):this.createAvailableCardBackButton({labelKey:o.labelKey,icon:o.icon,onClick:o.onClick});r.append(i),t.append(r)})}renderCardBackLabelsHost(t){const e=document.createElement("div");return e.className=d.labelsHost,e.setAttribute("data-testid","card-back-labels-host"),this.cardModalLabelsHost=e,this.populateCardBackLabelsHost(e,t),e}populateCardBackLabelsHost(t,e){t.replaceChildren();const a=this.getCardModalDraftTagItems(e);if(a.length===0)return;const o=document.createElement("section");o.className=d.labelsSection,o.setAttribute("aria-labelledby","card-back-labels-title");const r=document.createElement("h3");r.id="card-back-labels-title",r.className=d.labelsTitle,r.textContent=this.runtime.i18n.t("boards.cardBack.labels");const i=document.createElement("div");i.setAttribute("role","group"),i.setAttribute("aria-labelledby",r.id);const n=document.createElement("div");n.className=d.labelsList,n.setAttribute("data-testid","card-back-labels-container"),a.forEach(s=>{n.append(this.createCardBackLabelSwatch(s))}),n.append(this.createCardBackAddLabelButton(e)),i.append(n),o.append(r,i),t.append(o)}createCardBackLabelSwatch(t){const e=document.createElement("button");return e.type="button",e.className=d.labelSwatch,e.style.backgroundColor=t.color,e.style.color=ne(t.color),e.textContent=t.title,e.title=t.title,e.setAttribute("aria-label",t.title),e.setAttribute("data-testid","card-label"),e.dataset.tagId=String(t.id),e}createCardBackAddLabelButton(t){const e=k({icon:"plus",tone:"text",size:"md",className:d.labelAddButton,ariaLabel:this.runtime.i18n.t("boards.cardBack.addLabel"),title:this.runtime.i18n.t("boards.cardBack.addLabel"),onClick:()=>this.openCardLabelsPopover(e,t)});return e.setAttribute("data-testid","card-back-add-label-button"),e.dataset.role="goal-tag-picker-trigger",e.setAttribute("aria-haspopup","dialog"),e.setAttribute("aria-expanded","false"),e}createAvailableCardBackButton(t){const e=g({text:this.runtime.i18n.t(t.labelKey),tone:"text",size:"md",className:d.quickActionButton,onClick:()=>t.onClick(e)});return e.setAttribute("aria-haspopup","dialog"),e.setAttribute("aria-expanded","false"),S(e,t.icon),e}getCardModalDraftTagIds(t){return this.cardModalDraftTagIds===null&&(this.cardModalDraftTagIds=A(t)),this.cardModalDraftTagIds}getCardModalDraftTagItems(t){var r;const e=this.getCardModalDraftTagIds(t),a=new Set(e),o=new Map;return(r=t.tags)==null||r.forEach(i=>o.set(i.id,W(i))),this.tagItems.forEach(i=>o.set(i.id,i)),e.map(i=>o.get(i)).filter(i=>!!i&&a.has(i.id))}refreshCardModalLabelControls(t){this.cardModalLabelsHost&&this.populateCardBackLabelsHost(this.cardModalLabelsHost,t),this.cardModalQuickActionList&&this.populateCardBackQuickActions(this.cardModalQuickActionList,t)}patchCardModalTagIds(t,e){const a=H(e),o=this.cardModalRequestedTagIds??A(t);ct(a,o)||(this.cardModalRequestedTagIds=a,this.handlers.onPatchCard(t.id,{tag_ids:a}))}openCardLabelsPopover(t,e){this.closeCardLabelsPopover();const a=L({elevated:!0,className:`${d.labelPickerPopover} hidden`});a.setAttribute("role","dialog"),a.setAttribute("aria-modal","false"),a.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.labels")),a.setAttribute("data-testid","card-back-label-picker-popover"),a.addEventListener("mousedown",i=>i.stopPropagation());const o=new Et({variant:"labels",items:this.tagItems,selectedIds:this.getCardModalDraftTagIds(e),loading:this.tagCatalogStatus==="loading",errorMessage:this.getTagPickerErrorMessage(),placeholder:this.runtime.i18n.t("boards.cardBack.tagsPlaceholder"),searchPlaceholder:this.runtime.i18n.t("boards.cardBack.tagsSearchPlaceholder"),copy:{title:this.runtime.i18n.t("boards.cardBack.labels"),editTitle:this.runtime.i18n.t("boards.cardBack.editLabel"),createTitle:this.runtime.i18n.t("boards.cardBack.createLabel"),searchPlaceholder:this.runtime.i18n.t("boards.cardBack.tagsSearchPlaceholder"),labelsLegend:this.runtime.i18n.t("boards.cardBack.labels"),createButton:this.runtime.i18n.t("boards.cardBack.createNewLabel"),colorblindButton:this.runtime.i18n.t("boards.cardBack.enableColorblindMode"),titleLabel:this.runtime.i18n.t("boards.cardBack.labelTitle"),colorLegend:this.runtime.i18n.t("boards.cardBack.selectColor"),removeColor:this.runtime.i18n.t("boards.cardBack.removeColor"),save:this.runtime.i18n.t("common.save"),delete:this.runtime.i18n.t("common.delete"),close:this.runtime.i18n.t("boards.cardBack.closeLabelsPopover"),back:this.runtime.i18n.t("boards.cardBack.returnToLabels")},onRequestClose:()=>this.closeCardLabelsPopover(),onCreate:(i,n)=>this.createTagFromCardBack(i,n),onUpdate:(i,n)=>this.updateTagFromCardBack(i,n),onDelete:i=>this.deleteTagFromCardBack(i),onChange:i=>{this.cardModalDraftTagIds=i,this.refreshCardModalLabelControls(e),this.patchCardModalTagIds(e,i)}});o.element.setAttribute("data-testid","card-back-tag-picker"),a.append(o.element);let r;r=new O({container:t,panel:a,positioning:"viewport",panelZIndex:310,onOpenChange:i=>{var n;t.setAttribute("aria-expanded",i?"true":"false"),!i&&((n=this.cardLabelsPopover)==null?void 0:n.menu)===r&&this.closeCardLabelsPopover()}}),r.mount(),this.cardLabelsPopover={menu:r,panel:a,picker:o,trigger:t},r.openAt({anchor:t,placement:"bottom-start",fallbackPlacements:["bottom-end","top-start","top-end"],gap:8,margin:12,lockPlacementAfterOpen:!0}),window.requestAnimationFrame(()=>o.focusSearch())}async createTagFromCardBack(t,e){if(!this.tagCatalog)return null;try{const a=await this.tagCatalog.createTag(t,e),o=W(a);return this.upsertTagItem(o),o}catch{throw new Error(this.runtime.i18n.t("boards.cardBack.tagsCreateFailed"))}}async updateTagFromCardBack(t,e){if(!this.tagCatalog)return null;try{const a=await this.tagCatalog.updateTag(t,e),o=W(a);return this.upsertTagItem(o),o}catch{throw new Error(this.runtime.i18n.t("boards.cardBack.tagsUpdateFailed"))}}async deleteTagFromCardBack(t){if(this.tagCatalog)try{await this.tagCatalog.deleteTag(t),this.tagItems=this.tagItems.filter(a=>a.id!==t);const{card:e}=this.findActiveCardLocation();this.cardModalDraftTagIds=this.getCardModalDraftTagIds(e).filter(a=>a!==t)}catch{throw new Error(this.runtime.i18n.t("boards.cardBack.tagsDeleteFailed"))}}upsertTagItem(t){if(this.tagItems.findIndex(a=>a.id===t.id)>=0){this.tagItems=this.tagItems.map(a=>a.id===t.id?t:a);return}this.tagItems=[...this.tagItems,t]}renderCardBackDescriptionSection(t,e,a){const o=this.createCardBackSection("document",this.runtime.i18n.t("boards.cardDescriptionLabel")),r=o.querySelector(`.${d.sectionMain}`);if(!r)return o;r.append(a);const i=document.createElement("div");i.className=d.editorActions;const n=g({text:this.runtime.i18n.t("common.save"),tone:"primary",size:"md",className:m.primaryButton,onClick:()=>this.saveCardModal(t,e,a)}),s=()=>{n.disabled=e.value.trim().length===0};return e.addEventListener("input",s),s(),i.append(g({text:this.runtime.i18n.t("common.cancel"),tone:"text",size:"md",className:m.quietButton,onClick:()=>this.closeCardModal()}),n),r.append(i),o}async deleteSharedCardFromQuickEditor(t){await this.deleteSharedCard(t,()=>this.closeQuickCardEditor())}async deleteSharedCardFromDetails(t){await this.deleteSharedCard(t,()=>{this.closeCardActionsPopover(),this.closeCardModal()})}async deleteSharedCard(t,e){await this.confirmSharedCardDeletion()&&(e(),this.handlers.onDeleteCard(t.id))}confirmSharedCardDeletion(){return this.openDeleteCardConfirmationDialog()}openDeleteCardConfirmationDialog(){return new Promise(t=>{let e=!1;const a=b=>{e||(e=!0,t(b))},o=()=>r.remove(),{overlay:r,container:i,body:n,footer:s}=At(this.runtime.i18n.t("boards.actions.deleteCard"),{intent:"confirm",zIndex:360,onClose:()=>{a(!1),o()}}),l=document.createElement("p");l.className="text-sm leading-relaxed text-slate-600",l.id=`delete-card-confirm-message-${Math.random().toString(36).slice(2,9)}`,l.textContent=this.runtime.i18n.t("boards.cardMirror.deleteSharedConfirm"),i.setAttribute("aria-describedby",l.id),n.append(l);const u=Bt({variant:"confirm"}),p=g({text:this.runtime.i18n.t("common.cancel"),tone:"text",size:"md",className:ot("default"),onClick:()=>{a(!1),o()}});p.setAttribute("data-testid","delete-card-cancel-button"),u.append(p);const f=g({text:this.runtime.i18n.t("boards.actions.deleteCard"),tone:"destructive",size:"md",className:ot("wide"),onClick:()=>{a(!0),o()}});f.setAttribute("data-testid","delete-card-confirm-button"),u.append(f),s.append(u),i.addEventListener("keydown",b=>{b.stopPropagation(),b.key==="Escape"&&(b.preventDefault(),a(!1),o())})})}renderCardBackAttachmentsSection(){const t=this.createCardBackSection("link",this.runtime.i18n.t("boards.cardBack.attachments"),g({text:this.runtime.i18n.t("boards.cardBack.add"),tone:"text",size:"sm",className:m.quietButton,disabled:!0})),e=t.querySelector(`.${d.sectionMain}`);if(!e)return t;const a=document.createElement("div");return a.className=d.placeholderPanel,a.textContent=this.runtime.i18n.t("boards.cardBack.noAttachments"),e.append(a),t}renderCardBackAside(t,e){const a=document.createElement("aside");a.className=d.aside,a.setAttribute("aria-label",this.runtime.i18n.t("boards.cardBack.comments"));const o=this.createCardBackSection("chat-bubble-left",this.runtime.i18n.t("boards.cardBack.comments"),g({text:this.runtime.i18n.t("boards.cardBack.showDetails"),tone:"text",size:"sm",className:m.quietButton,disabled:!0})),r=o.querySelector(`.${d.sectionMain}`);if(!r)return a;r.append(g({text:this.runtime.i18n.t("boards.cardBack.writeComment"),tone:"text",size:"md",className:d.activityInput,disabled:!0}));const i=document.createElement("ul");i.className=d.activityList;const n=document.createElement("li");n.className=d.activityItem;const s=document.createElement("span");s.className=d.avatar,s.textContent="M",s.setAttribute("aria-hidden","true");const l=document.createElement("span");return l.textContent=this.runtime.i18n.t("boards.cardBack.activityCreated",{board:t.title,column:e.title}),n.append(s,l),i.append(n),r.append(i),a.append(o),a}createCardBackSection(t,e,a){const o=document.createElement("section");o.className=d.section;const r=document.createElement("div");r.className=d.sectionIcon;const i=y(t,{size:20,strokeWidth:2});i.setAttribute("aria-hidden","true"),r.append(i);const n=document.createElement("div");n.className=d.sectionMain;const s=document.createElement("div");s.className=d.sectionHeader;const l=document.createElement("h3");l.className=d.sectionTitle,l.textContent=e;const u=document.createElement("div");return u.className=d.sectionActions,a&&u.append(a),s.append(l,u),n.append(s),o.append(r,n),o}createUnavailableCardBackButton(t,e){const a=g({text:this.runtime.i18n.t(t),tone:"text",size:"md",className:d.quickActionButton,disabled:!0});return S(a,e),a}saveCardModal(t,e,a){const o=e.value.trim();if(!o)return;const r=a.value,i=this.getCardModalDraftTagIds(t),n={};o!==t.title&&(n.title=o),r!==t.description&&(n.description=r);const s=this.cardModalRequestedTagIds??A(t);ct(i,s)||(n.tag_ids=i),this.closeCardModal(),(n.title!==void 0||n.description!==void 0||n.tag_ids!==void 0)&&this.handlers.onPatchCard(t.id,n)}closeCardModal(){var t;this.closeCardActionsPopover(),this.closeCardLabelsPopover(),this.closeMoveCardPopover(),this.cardModalDraftTagIds=null,this.cardModalRequestedTagIds=null,this.cardModalLabelsHost=null,this.cardModalQuickActionList=null,this.activeCardPlacementId=null,(t=this.cardModalOverlay)==null||t.remove(),this.cardModalOverlay=null}closeCardLabelsPopover(){const t=this.cardLabelsPopover;t&&(this.cardLabelsPopover=null,t.trigger.setAttribute("aria-expanded","false"),t.menu.close(),t.menu.unmount(),t.picker.destroy(),t.panel.remove())}closeMoveCardPopover(){const t=this.moveCardPopover;t&&(this.moveCardPopover=null,t.trigger.setAttribute("aria-expanded","false"),t.menu.close(),t.menu.unmount(),t.panel.remove())}closeCardActionsPopover(){const t=this.cardActionsPopover;t&&(this.cardActionsPopover=null,t.trigger.setAttribute("aria-expanded","false"),t.menu.close(),t.menu.unmount(),t.panel.remove())}closeListActionsPopover(){const t=this.listActionsPopover;t&&(this.listActionsPopover=null,t.trigger.setAttribute("aria-expanded","false"),t.menu.close(),t.menu.unmount(),t.panel.remove())}closeQuickCardEditor(){var t;(t=this.quickEditorOverlay)==null||t.remove(),this.quickEditorOverlay=null}getSelectedBoard(t){return t.boards.find(e=>e.id===t.selectedBoardId)??t.boards[0]??null}findCardLocation(t,e){for(const a of e.boards)for(const o of a.columns){const r=o.cards.find(i=>v(i)===t);if(r)return{board:a,column:o,card:r,placementId:t}}return null}submitColumnTitle(t){var a;const e=((a=this.columnTitleTextarea)==null?void 0:a.value.trim())??"";e&&(this.handlers.onCreateColumn(t,e),this.columnTitleTextarea&&(this.columnTitleTextarea.value=""),this.isColumnComposerExpanded=!1)}startBoardTitleEdit(t){this.editingBoardTitleId=t,this.rerenderCurrentState()}finishBoardTitleEdit(t,e){var o;if(this.editingBoardTitleId!==t.id)return;const a=((o=this.boardTitleEditInput)==null?void 0:o.value.trim())??"";if(this.editingBoardTitleId=null,this.boardTitleEditInput=null,e&&a.length>0&&a!==t.title){this.handlers.onPatchBoard(t.id,{title:a});return}this.rerenderCurrentState()}startColumnTitleEdit(t){this.editingColumnTitleId=t,this.rerenderCurrentState()}finishColumnTitleEdit(t,e){var o;if(this.editingColumnTitleId!==t.id)return;const a=((o=this.columnTitleEditInput)==null?void 0:o.value.trim())??"";if(this.editingColumnTitleId=null,this.columnTitleEditInput=null,e&&a.length>0&&a!==t.title){this.handlers.onPatchColumn(t.id,{title:a});return}this.rerenderCurrentState()}expandCardComposer(t){this.expandedCardComposerColumnId=t,this.rerenderCurrentState()}collapseCardComposer(){this.expandedCardComposerColumnId=null,this.rerenderCurrentState()}expandColumnComposer(){this.isColumnComposerExpanded=!0,this.rerenderCurrentState()}collapseColumnComposer(){this.isColumnComposerExpanded=!1,this.rerenderCurrentState()}submitCard(t){const e=this.cardDrafts.get(t);if(!e)return;const a=e.title.value.trim();a&&(this.handlers.onCreateCard(t,a,""),e.title.value="",this.expandedCardComposerColumnId=null,this.rerenderCurrentState())}rerenderCurrentState(){this.state&&this.render(this.state)}unmountHeaderMenu(){var t;(t=this.headerMenu)==null||t.unmount(),this.headerMenu=null}}class de{constructor(t={}){this.root=null,this.store=null,this.view=null,this.subscriptions=new rt,this.runtime=t.runtime??tt()}mount(t){if(this.root)return;const e=document.createElement("div");e.dataset.module="boards",e.className="h-full w-full",t.appendChild(e),this.root=e;const a=new Tt(It.apiUrl),o=new Lt(a),r=new Ot(new Mt(a)),i=new se(e,{runtime:this.runtime,tagCatalog:{loadTags:()=>x(o.getTags()),createTag:(n,s)=>x(o.createTag({title:n,color:s??Pt(n)})),updateTag:(n,s)=>x(o.updateTag(n,s)),deleteTag:async n=>{await x(o.deleteTag(n))}},handlers:{onRefresh:()=>void r.load(),onSelectBoard:n=>r.selectBoard(n),onCreateBoard:n=>void r.createBoard(n),onPatchBoard:(n,s)=>void r.patchBoard(n,s),onDeleteBoard:n=>void r.deleteBoard(n),onCreateColumn:(n,s)=>void r.createColumn(n,s),onPatchColumn:(n,s)=>void r.patchColumn(n,s),onDeleteColumn:n=>void r.deleteColumn(n),onCreateCard:(n,s,l)=>void r.createCard(n,s,l),onPatchCard:(n,s)=>void r.patchCard(n,s),onCreateCardMirror:(n,s,l)=>void r.createCardMirror(n,s,l),onPatchCardPlacement:(n,s)=>void r.patchCardPlacement(n,s),onDeleteCardPlacement:n=>void r.deleteCardPlacement(n),onDeleteCard:n=>void r.deleteCard(n)}});this.store=r,this.view=i,this.subscriptions.add(r.state$.subscribe(n=>i.render(n))),r.load()}unmount(){var t,e,a;this.subscriptions.unsubscribe(),this.subscriptions=new rt,(t=this.view)==null||t.destroy(),this.view=null,(e=this.store)==null||e.destroy(),this.store=null,(a=this.root)==null||a.remove(),this.root=null}}class le{constructor(t={}){this.id="boards",this.app=null,this.runtime=t.runtime??tt()}mount(t){if(this.app)return;const e=new de({runtime:this.runtime});e.mount(t),this.app=e}unmount(){var t;(t=this.app)==null||t.unmount(),this.app=null}getAiAssistantSnapshot(){return null}}export{le as BoardsModule};
