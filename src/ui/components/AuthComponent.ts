import { Component } from '../../ui-lib/src/core/Component.ts';
import { Button } from '../../ui-lib/src/components/Button.ts';
import { Input } from '../../ui-lib/src/components/Input.ts';
import { AuthService } from '../../majom-wrapper/data-access/auth-service.ts';
import { UserApiService } from '../../majom-wrapper/data-access/user-api-service.ts';
import { LoginCredentials, User } from '../../majom-wrapper/interfaces/auth-interfaces.ts';
import { createModalShell } from '../../ui-lib/src/components/Modal.ts';
import { notify } from '../../core/services/NotificationService.ts';
import { historyService } from '../../core/services/HistoryService.ts';
import { ComponentFactory } from '../../ui-lib/src/index.js';

/**
 * AuthComponent manages the UI for user authentication, including login/logout buttons and modal for credentials.
 */
export class AuthComponent extends Component<any> {
  private authService: AuthService;
  private userApiService: UserApiService;
  private currentUser: User | null = null;
  private avatarContainer: HTMLElement;
  private loginButton: HTMLButtonElement;
  private logoutButton: HTMLButtonElement;
  private dropdownMenu: HTMLElement;
  private modal: HTMLElement | null = null;
  private errorMessage: HTMLElement | null = null;
  private isLoading: boolean = false;
  private authGuardOverlay: HTMLElement | null = null;
  private showLoginModalHandler: () => void;

  constructor(container: HTMLElement, authService: AuthService, userApiService: UserApiService) {
    super(container);
    this.authService = authService;
    this.userApiService = userApiService;
    this.avatarContainer = document.createElement('div');
    this.avatarContainer.className = 'absolute top-5 right-4';

    // Use Button component from UI library for login and logout buttons
    this.loginButton = ComponentFactory.createButton({
      text: 'Login',
      onClick: () => this.showLoginModal(),
      variant: 'default',
      className: 'w-full',
    }).createElement() as HTMLButtonElement;

    this.logoutButton = ComponentFactory.createButton({
      text: 'Logout',
      onClick: () => this.handleLogout(),
      variant: 'destructive',
      className: 'w-full',
      size: 'lg',
    }).createElement() as HTMLButtonElement;

    this.dropdownMenu = document.createElement('div');
    this.dropdownMenu.className =
      'absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-10 hidden';
    
    // Build user details section
    this.buildUserDetailsSection();
    
    // Add logout button
    this.dropdownMenu.appendChild(this.logoutButton);
    this.avatarContainer.appendChild(this.dropdownMenu);

    // Ensure container and avatarContainer are valid DOM nodes before appending
    if (container instanceof Node) {
      if (this.avatarContainer instanceof Node) {
        container.appendChild(this.avatarContainer);
      } else {
        console.error(
          'avatarContainer is not a valid DOM node',
          this.avatarContainer
        );
      }
    } else {
      console.error('Container is not a valid DOM node', container);
    }
    this.showLoginModalHandler = () => this.showLoginModal(true);
    window.addEventListener('showLoginModal', this.showLoginModalHandler);

    this.updateUI();
    // Update login button text on history or auth changes
    historyService.changes.subscribe(() => this.updateUI());
    window.addEventListener('refreshCanvasData', () => this.updateUI());
  }

  protected createElement(): HTMLElement {
    return this.avatarContainer;
  }

  private updateUI(): void {
    if (this.authService.isLoggedIn()) {
      this.loadUserData();
      this.avatarContainer.innerHTML =
        '<img src="https://cdn.thegreatprojects.com/thegreatprojects/images/c/c/c/d/9/cccd9ab3a8832417497e233c1cb92b9e.jpg?width=364&height=364&format=jpg" alt="User Avatar" class="w-10 h-10 bg-gray-100 rounded-full cursor-pointer">';
      this.avatarContainer.firstChild?.addEventListener('click', () =>
        this.toggleDropdown()
      );
      this.avatarContainer.appendChild(this.dropdownMenu);
    } else {
      this.currentUser = null;
      this.avatarContainer.innerHTML = '';
      // Show login prompt if there are unsaved changes
      const canSave = historyService.hasUnsavedChanges();
      this.loginButton.textContent = canSave ? 'Login to Save' : 'Login';
      this.avatarContainer.appendChild(this.loginButton);
    }

    this.syncAuthRequirement();
  }

  private toggleDropdown(): void {
    if (this.dropdownMenu.classList.contains('hidden')) {
      this.dropdownMenu.classList.remove('hidden');
    } else {
      this.dropdownMenu.classList.add('hidden');
    }
  }

  private loadUserData(): void {
    this.userApiService.getUser().subscribe({
      next: (user: User) => {
        this.currentUser = user;
        this.buildUserDetailsSection();
      },
      error: (error: any) => {
        console.error('Failed to load user data:', error);
      }
    });
  }

  private buildUserDetailsSection(): void {
    // Clear existing content except logout button
    const logoutButton = this.logoutButton;
    this.dropdownMenu.innerHTML = '';
    
    if (this.currentUser) {
      // User details section
      const userDetailsDiv = document.createElement('div');
      userDetailsDiv.className = 'px-4 py-3 border-b border-gray-200';
      
      // User avatar and name
      const userInfoDiv = document.createElement('div');
      userInfoDiv.className = 'flex items-center space-x-3';
      
      const avatar = document.createElement('img');
      avatar.src = 'https://cdn.thegreatprojects.com/thegreatprojects/images/c/c/c/d/9/cccd9ab3a8832417497e233c1cb92b9e.jpg?width=364&height=364&format=jpg';
      avatar.alt = 'User Avatar';
      avatar.className = 'w-8 h-8 rounded-full';
      
      const userTextDiv = document.createElement('div');
      userTextDiv.className = 'flex-1';
      
      const userName = document.createElement('div');
      userName.className = 'text-sm font-medium text-gray-900';
      userName.textContent = this.currentUser.username;
      
      const userEmail = document.createElement('div');
      userEmail.className = 'text-xs text-gray-500';
      userEmail.textContent = this.currentUser.email;
      
      userTextDiv.appendChild(userName);
      userTextDiv.appendChild(userEmail);
      userInfoDiv.appendChild(avatar);
      userInfoDiv.appendChild(userTextDiv);
      userDetailsDiv.appendChild(userInfoDiv);
      
      // Additional user info
      const additionalInfoDiv = document.createElement('div');
      additionalInfoDiv.className = 'mt-2 text-xs text-gray-600';
      additionalInfoDiv.innerHTML = `
        <div>ID: ${this.currentUser.id}</div>
        <div>Language: ${this.currentUser.language}</div>
        ${this.currentUser.deletion_requested_at ? '<div class="text-red-500">Deletion requested</div>' : ''}
      `;
      userDetailsDiv.appendChild(additionalInfoDiv);
      
      this.dropdownMenu.appendChild(userDetailsDiv);
    }
    
    // Add logout button back
    this.dropdownMenu.appendChild(logoutButton);
  }

  private showLoginModal(force: boolean = false): void {
    if (this.modal) {
      if (!force) return;
      this.closeModal();
    }
    const { overlay, container } = createModalShell('Login to Majom Canvas', {
      onClose: () => {
        this.closeModal();
        if (!this.authService.isLoggedIn()) {
          this.ensureAuthGuardOverlay();
          window.setTimeout(() => this.showLoginModal(true), 0);
        }
      },
      zIndex: 210,
    });
    this.modal = overlay;

    // Build login form
    const form = document.createElement('form');
    form.id = 'loginForm';

    // Username field
    const usernameDiv = document.createElement('div');
    usernameDiv.className = 'mb-4';
    const usernameLabel = document.createElement('label');
    usernameLabel.htmlFor = 'username';
    usernameLabel.className = 'block text-sm font-medium text-gray-700';
    usernameLabel.textContent = 'Username';
    const usernameInput = ComponentFactory.createInput({
      id: 'username',
      name: 'username',
      type: 'text',
      placeholder: 'Enter your username',
      className: 'mt-1',
    }).createElement();
    usernameDiv.append(usernameLabel, usernameInput);

    // Password field
    const passwordDiv = document.createElement('div');
    passwordDiv.className = 'mb-4';
    const passwordLabel = document.createElement('label');
    passwordLabel.htmlFor = 'password';
    passwordLabel.className = 'block text-sm font-medium text-gray-700';
    passwordLabel.textContent = 'Password';
    const passwordInput = ComponentFactory.createInput({
      id: 'password',
      name: 'password',
      type: 'password',
      placeholder: 'Enter your password',
      className: 'mt-1',
    }).createElement();
    passwordDiv.append(passwordLabel, passwordInput);

    // Error message
    this.errorMessage = document.createElement('div');
    this.errorMessage.className = 'mt-2 text-red-500 hidden';

    // Submit button
    const loginBtn = ComponentFactory.createButton({
      text: 'Login',
      type: 'submit',
      variant: 'default',
      className: 'w-full',
    }).createElement();
    loginBtn.id = 'loginSubmit';

    form.append(usernameDiv, passwordDiv, loginBtn);
    container.append(form, this.errorMessage);
    form.addEventListener('submit', (e) => this.handleLoginSubmit(e));
  }

  private closeModal(): void {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
      this.errorMessage = null;
    }
  }

  private async handleLoginSubmit(e: Event): Promise<void> {
    e.preventDefault();
    if (this.isLoading || !this.modal) return;

    const usernameInput = this.modal.querySelector(
      '#username'
    ) as HTMLInputElement;
    const passwordInput = this.modal.querySelector(
      '#password'
    ) as HTMLInputElement;
    const loginButton = this.modal.querySelector(
      '#loginSubmit'
    ) as HTMLButtonElement;

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
      notify('Logged in successfully', 'success');
      this.closeModal();
      this.updateUI();
      // Trigger canvas data refresh
      window.dispatchEvent(new CustomEvent('refreshCanvasData'));
    } catch (error: unknown) {
      this.isLoading = false;
      loginButton.disabled = false;
      loginButton.textContent = 'Login';
      const msg =
        error instanceof Error
          ? error.message
          : 'Login failed. Please try again.';
      notify(msg, 'error');
      if (this.errorMessage) {
        this.errorMessage.classList.remove('hidden');
        this.errorMessage.textContent = msg;
      }
    }
  }

  private handleLogout(): void {
    this.authService.logout();
    notify('Logged out', 'info');
    this.updateUI();
    this.dropdownMenu.classList.add('hidden');
    // Trigger canvas data refresh
    window.dispatchEvent(new CustomEvent('refreshCanvasData'));
  }

  private ensureAuthGuardOverlay(): void {
    if (this.authService.isLoggedIn() || this.authGuardOverlay) return;

    const overlay = document.createElement('div');
    overlay.className =
      'fixed inset-0 z-[180] bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center gap-4 pointer-events-auto';

    const message = document.createElement('p');
    message.className = 'text-lg font-semibold text-gray-800';
    message.textContent = 'Please log in to continue.';

    const openModalButton = ComponentFactory.createButton({
      text: 'Open Login',
      variant: 'default',
      size: 'lg',
      onClick: () => this.showLoginModal(true),
    }).createElement() as HTMLButtonElement;

    overlay.append(message, openModalButton);
    document.body.appendChild(overlay);
    this.authGuardOverlay = overlay;
  }

  private removeAuthGuardOverlay(): void {
    if (!this.authGuardOverlay) return;
    this.authGuardOverlay.remove();
    this.authGuardOverlay = null;
  }

  private syncAuthRequirement(): void {
    if (this.authService.isLoggedIn()) {
      this.removeAuthGuardOverlay();
    } else {
      this.ensureAuthGuardOverlay();
      this.showLoginModal();
    }
  }
}
