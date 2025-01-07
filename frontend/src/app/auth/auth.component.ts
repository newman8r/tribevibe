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
  authForm: FormGroup;
  isLoading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: [''],
      ticketId: ['']
    });
  }

  ngOnInit() {
    // Add loading class when component initializes
    document.body.classList.add('loading');

    // Remove loading class after a small delay to ensure styles are applied
    setTimeout(() => {
      document.body.classList.remove('loading');
    }, 100);
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    if (this.isLoginMode) {
      this.authForm.get('confirmPassword')?.clearValidators();
      this.authForm.get('ticketId')?.clearValidators();
    } else {
      this.authForm.get('confirmPassword')?.setValidators([Validators.required]);
      this.authForm.get('ticketId')?.setValidators([Validators.required]);
    }
    this.authForm.get('confirmPassword')?.updateValueAndValidity();
    this.authForm.get('ticketId')?.updateValueAndValidity();
  }

  onSubmit() {
    if (this.authForm.valid) {
      this.isLoading = true;
      this.error = null;
      
      const { email, password, ticketId } = this.authForm.value;
      let authObs: Observable<any>;

      if (this.isLoginMode) {
        authObs = this.authService.signIn({ email, password });
      } else {
        authObs = this.authService.signUp({ email, password, ticketId });
      }

      authObs.pipe(
        finalize(() => this.isLoading = false)
      ).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (errorMessage) => {
          this.error = errorMessage;
        }
      });
    }
  }
} 