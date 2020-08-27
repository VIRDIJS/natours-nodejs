import '@babel/polyfill';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { displayMap } from './mapbox';
import { bookTour } from './stripe';
import { showAlerts, showAlert } from './alerts';

// DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const logoutBtn = document.querySelector('.nav__el--logout');
const bookBtn = document.getElementById('book-tour');
// VALUES

// DELEGATION
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (userDataForm) {
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    updateSettings(form, 'data');
  });
}

if(userPasswordForm) {
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent ='Updating...'
    const passwordCurrent = document.getElementById('password-current').value;
    const newPassword = document.getElementById('password').value;
    const newPasswordConfirm = document.getElementById('password-confirm').value;
    await updateSettings({passwordCurrent,newPassword,newPasswordConfirm},'password');
    document.querySelector('.btn--save-password').textContent ='Save password'

    // Delete the content of the fields once form is submitted
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';

  })
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}

if(bookBtn){
  bookBtn.addEventListener('click',(e)=>{
    e.target.textContent = 'Processing...'
    // Using Destructuring
    // const { tourId } = e.target.dataset 
    // OR the following syntax
    const tourId = e.target.dataset.tourId;
    // Call bookTour(tourId) in stripe.js 
    bookTour(tourId)
  })
}

const alertMessage = document.querySelector('body').dataset.alert;
if(alertMessage){
  showAlert('success',alertMessage,20)
}
