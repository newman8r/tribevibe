import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  imports: [CommonModule, ReactiveFormsModule],
  standalone: true
})
export class AuthComponent implements OnInit {
  isLoginMode = true;
  authForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['']
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
    } else {
      this.authForm.get('confirmPassword')?.setValidators([Validators.required]);
    }
    this.authForm.get('confirmPassword')?.updateValueAndValidity();
  }

  onSubmit() {
    if (this.authForm.valid) {
      // Handle authentication logic here
      console.log(this.authForm.value);
    }
  }
} 