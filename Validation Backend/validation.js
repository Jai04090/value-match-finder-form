// Get form and submit button
const form = document.getElementById('registerForm');
const submitBtn = document.getElementById('submitBtn');

// Get all input fields
const fullNameInput = document.getElementById('fullName');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const phoneInput = document.getElementById('phone');

// Get error message elements
const fullNameError = document.getElementById('fullNameError');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const confirmPasswordError = document.getElementById('confirmPasswordError');
const phoneError = document.getElementById('phoneError');

// Helper: Check if email format is valid
function isValidEmail(value) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

// Helper: Check if password has at least 8 characters, at least 1 letter, and 1 number
function isValidPassword(value) {
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  return passwordRegex.test(value);
}

// Helper: Check if phone number is valid (optional field)
function isValidPhone(value) {
  const phoneRegex = /^\+?\d{7,15}$/;
  return phoneRegex.test(value);
}

// Validate full name
function validateFullName() {
  const value = fullNameInput.value.trim();
  if (value.length < 2) {
    fullNameError.textContent = "Full Name is required (min 2 characters).";
    return false;
  }
  fullNameError.textContent = "";
  return true;
}

// Validate email
function validateEmail() {
  const value = emailInput.value.trim();
  if (!isValidEmail(value)) {
    emailError.textContent = "Please enter a valid email address.";
    return false;
  }
  emailError.textContent = "";
  return true;
}

// Validate password
function validatePassword() {
  const value = passwordInput.value;
  if (!isValidPassword(value)) {
    passwordError.textContent = "Password must be at least 8 characters with a number and letter.";
    return false;
  }
  passwordError.textContent = "";
  return true;
}

// Validate confirm password (must match password)
function validateConfirmPassword() {
  if (confirmPasswordInput.value !== passwordInput.value) {
    confirmPasswordError.textContent = "Passwords must match.";
    return false;
  }
  confirmPasswordError.textContent = "";
  return true;
}

// Validate phone number (optional)
function validatePhone() {
  const value = phoneInput.value.trim();
  if (value !== "" && !isValidPhone(value)) {
    phoneError.textContent = "Please enter a valid phone number.";
    return false;
  }
  phoneError.textContent = "";
  return true;
}

// Master validation function: checks all fields and toggles submit button
function validateForm() {
  const validFullName = validateFullName();
  const validEmail = validateEmail();
  const validPassword = validatePassword();
  const validConfirm = validateConfirmPassword();
  const validPhone = validatePhone();

  // Enable or disable submit button based on validation results
  submitBtn.disabled = !(validFullName && validEmail && validPassword && validConfirm && validPhone);
}

// Add input listeners to validate in real-time
fullNameInput.addEventListener('input', validateForm);
emailInput.addEventListener('input', validateForm);
passwordInput.addEventListener('input', validateForm);
confirmPasswordInput.addEventListener('input', validateForm);
phoneInput.addEventListener('input', validateForm);

// Handle form submission
form.addEventListener('submit', function (e) {
  e.preventDefault(); // Prevent default form behavior

  validateForm();

  // Only proceed if submit button is enabled (all fields valid)
  if (!submitBtn.disabled) {
    alert("Account created! Redirecting to login...");
    window.location.href = "/login.html"; // Change as needed
  }
});
