import type { Observable } from 'rxjs';
import type { User } from '../../../../majom-wrapper/interfaces/auth-interfaces.ts';

export interface CanvasUserProfilePort {
  getUser(): Observable<User>;
}
