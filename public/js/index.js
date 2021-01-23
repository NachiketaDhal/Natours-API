/* eslint-disable */

import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { signup } from './signup';
import { format } from 'morgan';
import { forgotPassword } from './forgetpassword';
import { resetPassword } from './resetpassword';
import { bookTour } from './stripe';
import { showAlert } from './alert';

// DOM ELEMENTS
const mapbox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const loginBtn = document.querySelector('.btn--login');
const logoutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const signupForm = document.querySelector('.signup-form');
const forgotPasswordFrom = document.querySelector('.form--forgotpassword');
const resetPasswordForm = document.querySelector('.form--resetpassword');
const bookBtn = document.getElementById('book-tour');

// VALUES

// DELEGATION
if (mapbox) {
  const locations = JSON.parse(mapbox.dataset.locations);
  displayMap(locations);
}

// SIGNUP NEWUSER USING AXION(API) //////////////////////////////////////////////////////////////////////
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Change button text while Signing up a new user
    document.querySelector('.btn--signup').innerText = 'Signing...';

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordconfirm').value;
    await signup(name, email, password, passwordConfirm);

    // Change button text and clear input-fields after Signing up new user
    document.querySelector('.btn--signup').innerText = 'Signup';
    signupForm.reset();
  });
}

// LOGIN USING AXION(API) //////////////////////////////////////////////////////////////////////////////////////
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Change button text while login
    document.querySelector('.btn--login').innerText = 'Logging...';

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    await login(email, password);

    // Change button text after login
    document.querySelector('.btn--login').innerText = 'Login';
  });
}
// LOGOUT USING AXION(API) //////////////////////////////////////////////////////////////////////////////////////
if (logoutBtn) logoutBtn.addEventListener('click', logout);

// UPDATE USER DATA USING AXION(API) ////////////////////////////////////////////////////////////////////////////
if (userDataForm) {
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    // console.log(form);

    updateSettings(form, 'data');
  });
}

// UPDATE USER PASSWORD USING AXION(API) ////////////////////////////////////////////////////////////////////////
if (userPasswordForm) {
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Change button text while updating password
    document.querySelector('.btn--save--password').innerText = 'Updating...';

    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );

    // Change button text and clear input-fields after changing password
    document.querySelector('.btn--save--password').innerText = 'Save password';
    userPasswordForm.reset();
  });
}

// FORGOT PASSWORD
if (forgotPasswordFrom) {
  forgotPasswordFrom.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Change button text while sending email
    document.querySelector('.btn-forgot-password').innerText = 'Sending...';

    const email = document.getElementById('emailForgotPassword').value;
    await forgotPassword(email);

    // Change button text after sending email
    document.querySelector('.btn-forgot-password').innerText = 'Submit';
  });
}

// RESET PASSWORD
if (resetPasswordForm) {
  resetPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Change button text while resetting password
    document.querySelector('.btn--reset').innerText = 'Resetting...';

    const password = document.getElementById('passwordResetPassword').value;
    const passwordConfirm = document.getElementById(
      'passwordConfirmResetPassword'
    ).value;
    const resetToken = document.getElementById('resetToken').value;

    await resetPassword(password, passwordConfirm, resetToken);

    // Change button text after resetting password
    document.querySelector('.btn--reset').innerText = 'Reset';
  });
}

// BOOKING PAYMENT BUTTON
if (bookBtn) {
  bookBtn.addEventListener('click', (e) => {
    e.target.innerText = 'Processing...';
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });
}

const alertMessage = document.querySelector('body').dataset.alert;
if (alertMessage) showAlert('success', alertMessage, 20);
