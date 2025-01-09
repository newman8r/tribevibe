import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DirectMessageService {
  private openDMSubject = new Subject<string>();
  openDM$ = this.openDMSubject.asObservable();

  openDirectMessage(userId: string) {
    this.openDMSubject.next(userId);
  }
} 