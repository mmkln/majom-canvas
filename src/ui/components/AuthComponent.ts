import { Component } from '../../ui-lib/src/core/Component.js';
import { Button } from '../../ui-lib/src/components/Button.js';
import { Input } from '../../ui-lib/src/components/Input.js';
import { AuthService } from '../../majom-wrapper/data-access/auth-service.js';
import { LoginCredentials } from '../../majom-wrapper/interfaces/auth-interfaces.js';

/**
 * AuthComponent manages the UI for user authentication, including login/logout buttons and modal for credentials.
 */
export class AuthComponent extends Component<any> {
  private authService: AuthService;
  private avatarContainer: HTMLElement;
  private loginButton: HTMLButtonElement;
  private logoutButton: HTMLButtonElement;
  private dropdownMenu: HTMLElement;
  private modal: HTMLElement | null = null;
  private errorMessage: HTMLElement | null = null;
  private isLoading: boolean = false;

  constructor(container: HTMLElement, authService: AuthService) {
    super(container);
    this.authService = authService;
    this.avatarContainer = document.createElement('div');
    this.avatarContainer.className = 'absolute top-4 right-4';
    
    // Use Button component from UI library for login and logout buttons
    this.loginButton = new Button({
      text: 'Login',
      onClick: () => this.showLoginModal(),
      variant: 'default',
      className: 'w-full',
    }).createElement() as HTMLButtonElement;

    this.logoutButton = new Button({
      text: 'Logout',
      onClick: () => this.handleLogout(),
      variant: 'destructive',
      className: 'w-full',
    }).createElement() as HTMLButtonElement;

    this.dropdownMenu = document.createElement('div');
    this.dropdownMenu.className = 'absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 hidden';
    this.dropdownMenu.appendChild(this.logoutButton);
    this.avatarContainer.appendChild(this.dropdownMenu);
    
    // Ensure container and avatarContainer are valid DOM nodes before appending
    if (container instanceof Node) {
      if (this.avatarContainer instanceof Node) {
        container.appendChild(this.avatarContainer);
      } else {
        console.error('avatarContainer is not a valid DOM node', this.avatarContainer);
      }
    } else {
      console.error('Container is not a valid DOM node', container);
    }
    this.updateUI();
  }

  protected createElement(): HTMLElement {
    return this.avatarContainer;
  }

  private updateUI(): void {
    if (this.authService.isLoggedIn()) {
      const user = this.authService.getAuthToken(); // Assuming user data is part of token or stored separately
      this.avatarContainer.innerHTML = '<img src="avatar-url-placeholder" alt="User Avatar" class="w-10 h-10 rounded-full cursor-pointer">';
      this.avatarContainer.firstChild?.addEventListener('click', () => this.toggleDropdown());
      this.avatarContainer.appendChild(this.dropdownMenu);
    } else {
      this.avatarContainer.innerHTML = '';
      this.avatarContainer.appendChild(this.loginButton);
    }
  }

  private toggleDropdown(): void {
    if (this.dropdownMenu.classList.contains('hidden')) {
      this.dropdownMenu.classList.remove('hidden');
    } else {
      this.dropdownMenu.classList.add('hidden');
    }
  }

  private showLoginModal(): void {
    if (this.modal) return;

    this.modal = document.createElement('div');
    this.modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
    const modalContent = document.createElement('div');
    modalContent.className = 'bg-white rounded-lg p-6 w-96';
    modalContent.innerHTML = `
      <h2 class="text-2xl font-bold mb-4">Login to Majom Canvas</h2>
      <form id="loginForm">
        <div class="mb-4">
          <label for="username" class="block text-sm font-medium text-gray-700">Username</label>
          <span id="usernameInputPlaceholder"></span>
        </div>
        <div class="mb-4">
          <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
          <span id="passwordInputPlaceholder"></span>
        </div>
        <span id="loginSubmitPlaceholder"></span>
      </form>
      <div id="errorMessage" class="mt-2 text-red-500 hidden"></div>
    `;
    this.modal.appendChild(modalContent);

    // Use Input component for username and password fields
    const usernameInput = new Input({
      id: 'username',
      name: 'username',
      type: 'text',
      placeholder: 'Enter your username',
      className: 'mt-1',
    }).createElement();
    const passwordInput = new Input({
      id: 'password',
      name: 'password',
      type: 'password',
      placeholder: 'Enter your password',
      className: 'mt-1',
    }).createElement();
    const usernameInputPlaceholder = modalContent.querySelector('#usernameInputPlaceholder');
    const passwordInputPlaceholder = modalContent.querySelector('#passwordInputPlaceholder');
    if (usernameInputPlaceholder) usernameInputPlaceholder.replaceWith(usernameInput);
    if (passwordInputPlaceholder) passwordInputPlaceholder.replaceWith(passwordInput);
    document.body.appendChild(this.modal);

    const form = modalContent.querySelector('#loginForm');
    this.errorMessage = modalContent.querySelector('#errorMessage');

    // Replace placeholder with Button component for submit
    const loginSubmitPlaceholder = modalContent.querySelector('#loginSubmitPlaceholder');
    if (loginSubmitPlaceholder) {
      const loginButton = new Button({
        text: 'Login',
        type: 'submit',
        variant: 'default',
        className: 'w-full',
      }).createElement();
      loginButton.id = 'loginSubmit';
      loginSubmitPlaceholder.replaceWith(loginButton);
    }

    form?.addEventListener('submit', (e) => this.handleLoginSubmit(e));

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });
  }

  private closeModal(): void {
    if (this.modal) {
      document.body.removeChild(this.modal);
      this.modal = null;
      this.errorMessage = null;
    }
  }

  private async handleLoginSubmit(e: Event): Promise<void> {
    e.preventDefault();
    if (this.isLoading || !this.modal) return;

    const usernameInput = this.modal.querySelector('#username') as HTMLInputElement;
    const passwordInput = this.modal.querySelector('#password') as HTMLInputElement;
    const loginButton = this.modal.querySelector('#loginSubmit') as HTMLButtonElement;

    const credentials: LoginCredentials = {
      username: usernameInput.value,
      password: passwordInput.value,
    };

    this.isLoading = true;
    loginButton.disabled = true;
    loginButton.textContent = 'Logging in...';

    try {
      await this.authService.login(credentials);
      this.isLoading = false;
      this.closeModal();
      this.updateUI();
      // Trigger canvas data refresh
      window.dispatchEvent(new CustomEvent('refreshCanvasData'));
    } catch (error: unknown) {
      this.isLoading = false;
      loginButton.disabled = false;
      loginButton.textContent = 'Login';
      if (this.errorMessage) {
        this.errorMessage.classList.remove('hidden');
        this.errorMessage.textContent = error instanceof Error ? error.message : 'An error occurred. Please try again.';
      }
    }
  }

  private handleLogout(): void {
    this.authService.logout();
    this.updateUI();
    this.dropdownMenu.classList.add('hidden');
    // Trigger canvas data refresh
    window.dispatchEvent(new CustomEvent('refreshCanvasData'));
  }
}
