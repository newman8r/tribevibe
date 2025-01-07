import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../core/services/auth.service';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { SignUpDto, SignInDto } from '../core/interfaces/auth.interface';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  standalone: true
})
export class AuthComponent implements OnInit {
  isLoginMode = true;
  authForm!: FormGroup;
  isLoading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.initializeForm();
  }

  private initializeForm() {
    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      ticketId: ['']
    });
  }

  ngOnInit() {
    document.body.classList.add('loading');
    setTimeout(() => {
      document.body.classList.remove('loading');
    }, 100);
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    if (this.isLoginMode) {
      this.authForm.get('ticketId')?.clearValidators();
      this.authForm.get('username')?.clearValidators();
    } else {
      this.authForm.get('ticketId')?.setValidators([]);  // Optional field
      this.authForm.get('username')?.setValidators([Validators.required, Validators.minLength(3)]);
    }
    this.authForm.get('ticketId')?.updateValueAndValidity();
    this.authForm.get('username')?.updateValueAndValidity();
  }

  isFormValid(): boolean {
    const emailControl = this.authForm.get('email');
    const passwordControl = this.authForm.get('password');
    
    if (!emailControl || !passwordControl) return false;
    
    return emailControl.valid && passwordControl.valid;
  }

  onSubmit() {
    if (this.isFormValid()) {
      this.isLoading = true;
      this.error = null;
      
      const { email, password, ticketId, username } = this.authForm.value;
      let authObs: Observable<any>;

      if (this.isLoginMode) {
        authObs = this.authService.signIn({ email, password });
      } else {
        authObs = this.authService.signUp({ email, password, username, ticketId: ticketId || '' });
      }

      authObs.pipe(
        finalize(() => this.isLoading = false)
      ).subscribe({
        next: () => {
          this.router.navigate(['/chat']);
        },
        error: (errorMessage) => {
          this.error = errorMessage;
        }
      });
    }
  }
} 