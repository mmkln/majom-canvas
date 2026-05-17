import {
  createIconButton,
  createTextButton,
} from '../ui-lib/src/hud/index.ts';

type PublicLandingPageOptions = {
  onSignIn: () => void;
};

export class PublicLandingPage {
  private readonly root: HTMLElement;
  private readonly signInHandler: (event: Event) => void;
  private readonly menuToggleHandler: (event: Event) => void;
  private readonly menuLinkHandler: () => void;
  private listenersBound = false;

  constructor(private readonly options: PublicLandingPageOptions) {
    this.root = this.resolveRoot();
    this.signInHandler = (event: Event) => {
      event.preventDefault();
      this.options.onSignIn();
    };
    this.menuToggleHandler = (event: Event) => {
      event.preventDefault();
      this.toggleMobileMenu();
    };
    this.menuLinkHandler = () => this.closeMobileMenu();
  }

  public show(parent: HTMLElement = document.body): void {
    if (!this.root.isConnected) {
      parent.prepend(this.root);
    }
    this.upgradeSignInTriggers();
    this.upgradeMenuTriggers();
    this.bindListeners();
    this.root.hidden = false;
    this.root.removeAttribute('aria-hidden');
  }

  public hide(): void {
    this.closeMobileMenu();
    this.root.hidden = true;
    this.root.setAttribute('aria-hidden', 'true');
  }

  public destroy(): void {
    this.unbindListeners();
    this.root.remove();
  }

  private bindListeners(): void {
    if (this.listenersBound) return;
    this.getSignInTriggers().forEach((trigger) => {
      trigger.addEventListener('click', this.signInHandler);
    });
    this.getMenuTriggers().forEach((trigger) => {
      trigger.addEventListener('click', this.menuToggleHandler);
    });
    this.getMobileMenuLinks().forEach((link) => {
      link.addEventListener('click', this.menuLinkHandler);
    });
    this.listenersBound = true;
  }

  private unbindListeners(): void {
    if (!this.listenersBound) return;
    this.getSignInTriggers().forEach((trigger) => {
      trigger.removeEventListener('click', this.signInHandler);
    });
    this.getMenuTriggers().forEach((trigger) => {
      trigger.removeEventListener('click', this.menuToggleHandler);
    });
    this.getMobileMenuLinks().forEach((link) => {
      link.removeEventListener('click', this.menuLinkHandler);
    });
    this.listenersBound = false;
  }

  private getSignInTriggers(): HTMLElement[] {
    return Array.from(
      this.root.querySelectorAll<HTMLElement>('[data-landing-action="sign-in"]')
    );
  }

  private getMenuTriggers(): HTMLButtonElement[] {
    return Array.from(
      this.root.querySelectorAll<HTMLButtonElement>(
        '[data-landing-action="toggle-menu"]'
      )
    );
  }

  private getMobileMenu(): HTMLElement | null {
    return this.root.querySelector<HTMLElement>('[data-landing-mobile-menu]');
  }

  private getMobileMenuLinks(): HTMLAnchorElement[] {
    return Array.from(
      this.root.querySelectorAll<HTMLAnchorElement>(
        '[data-landing-mobile-menu] a[href^="#"]'
      )
    );
  }

  private upgradeSignInTriggers(): void {
    this.getSignInTriggers().forEach((trigger) => {
      if (trigger.getAttribute('data-component') === 'HudTextButton') return;

      const button = createTextButton({
        tone: 'primary',
        size: 'lg',
        text: trigger.textContent?.trim() || 'Sign in',
        type: 'button',
      });
      button.dataset.landingAction = 'sign-in';
      trigger.replaceWith(button);
    });
  }

  private upgradeMenuTriggers(): void {
    this.getMenuTriggers().forEach((trigger) => {
      if (trigger.getAttribute('data-component') === 'HudIconButton') return;

      const button = createIconButton({
        icon: 'bars-3',
        tone: 'secondary',
        size: 'lg',
        type: 'button',
        title: 'Open menu',
        ariaLabel: 'Open menu',
        className: trigger.className,
      });
      button.dataset.landingAction = 'toggle-menu';
      button.setAttribute('aria-expanded', 'false');
      const controls = trigger.getAttribute('aria-controls');
      if (controls) {
        button.setAttribute('aria-controls', controls);
      }
      trigger.replaceWith(button);
    });
  }

  private toggleMobileMenu(): void {
    const menu = this.getMobileMenu();
    if (!menu) return;

    const shouldOpen = menu.hidden;
    menu.hidden = !shouldOpen;
    this.getMenuTriggers().forEach((trigger) => {
      trigger.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
    });
  }

  private closeMobileMenu(): void {
    const menu = this.getMobileMenu();
    if (!menu) return;

    menu.hidden = true;
    this.getMenuTriggers().forEach((trigger) => {
      trigger.setAttribute('aria-expanded', 'false');
    });
  }

  private resolveRoot(): HTMLElement {
    const existing = document.getElementById('majom-public-landing');
    if (existing) return existing;

    const fallback = document.createElement('main');
    fallback.id = 'majom-public-landing';
    fallback.className =
      'fixed inset-0 z-[180] overflow-y-auto bg-white px-6 py-10 text-slate-950';

    const heading = document.createElement('h1');
    heading.className = 'max-w-3xl text-4xl font-semibold leading-tight';
    heading.textContent = 'Majom is a visual planning workspace for individuals';

    const body = document.createElement('p');
    body.className = 'mt-4 max-w-2xl text-lg leading-8 text-slate-700';
    body.textContent =
      'Plan goals, tasks, boards, routines, and ideas in one personal canvas before opening the private app workspace.';

    const button = createTextButton({
      tone: 'primary',
      size: 'lg',
      text: 'Sign in',
      type: 'button',
    });
    button.dataset.landingAction = 'sign-in';

    const actionRow = document.createElement('div');
    actionRow.className = 'mt-8';
    actionRow.appendChild(button);

    fallback.append(heading, body, actionRow);
    return fallback;
  }
}
