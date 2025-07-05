// Toggle password visibility
function togglePassword() {
  const pwd = document.getElementById("password");
  pwd.type = pwd.type === "password" ? "text" : "password";
}

// If checkbox exists, bind event (for sign-in/signup)
const showCheckbox = document.getElementById("showPassword");
if (showCheckbox) {
  showCheckbox.addEventListener("change", togglePassword);
}

// Form validation
function validateForm() {
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();

  const emailRegex = /^[^\s@]+@gmail\.com$/i;     // Only mail
  const phoneRegex = /^[0-9]{10}$/;               // Only 10-digit numbers

  if (!emailRegex.test(email)) {
    alert("Please enter a valid Gmail address (e.g., user@email.com).");
    return false;
  }

  if (!phoneRegex.test(phone)) {
    alert("Phone must be exactly 10 digits .");
    return false;
  }

  return true;
}
