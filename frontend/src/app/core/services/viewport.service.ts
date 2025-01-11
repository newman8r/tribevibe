import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ViewportService {
  private isKeyboardVisible = new BehaviorSubject<boolean>(false);
  isKeyboardVisible$ = this.isKeyboardVisible.asObservable();

  constructor() {
    this.setupViewportCalculation();
    this.setupKeyboardListeners();
  }

  private setupViewportCalculation() {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
  }

  private setupKeyboardListeners() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (!isIOS) return;

    window.visualViewport?.addEventListener('resize', () => {
      const isKeyboardOpen = window.visualViewport!.height < window.innerHeight;
      this.isKeyboardVisible.next(isKeyboardOpen);
      
      if (isKeyboardOpen) {
        document.body.style.height = `${window.visualViewport!.height}px`;
      } else {
        document.body.style.height = '100%';
      }
    });
  }
} 