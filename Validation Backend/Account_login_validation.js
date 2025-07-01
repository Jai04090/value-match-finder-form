// Get references to form elements and error containers
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");

// Hardcoded example credentials (to replace with real backend or database check later)
const storedEmail = "user@example.com";
const storedPassword = "password123";

// Helper function: Check if email format is valid
function isValidEmail(value) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

// Validate email field and display error if needed
function validateEmail() {
  const value = emailInput.value.trim();
  if (!isValidEmail(value)) {
    emailError.textContent = "Please enter a valid email address.";
    return false;
  }
  emailError.textContent = "";
  return true;
}

// Validate password field (just check if not empty here)
function validatePassword() {
  const value = passwordInput.value.trim();
  if (value === "") {
    passwordError.textContent = "Password cannot be empty.";
    return false;
  }
  passwordError.textContent = "";
  return true;
}

// Check if the entered email and password match stored credentials
function validateCredentials() {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  return email === storedEmail && password === storedPassword;
}

// Handle form submission
loginForm.addEventListener("submit", function (e) {
  e.preventDefault(); // Prevent default form submission behavior (page reload)

  // Validate email and password fields first
  const emailValid = validateEmail();
  const passwordValid = validatePassword();

  // If either field is invalid, stop here
  if (!emailValid || !passwordValid) return;

  // Check credentials
  if (validateCredentials()) {
    alert("Login successful! Redirecting...");
    window.location.href = "/preferences.html"; // Change path as needed
  } else {
    // If credentials are wrong, show errors on both fields
    const errorMessage = "Invalid email or password.";
    emailError.textContent = errorMessage;
    passwordError.textContent = errorMessage;
  }
});
