function validateForm() {
  var name = document.forms["contact-form"]["name"].value;
  var mail = document.forms["contact-form"]["email"].value;
  var phone = document.forms["contact-form"]["phone"].value;
  var subject = document.forms["contact-form"]["subject"].value;
  var message = document.forms["contact-form"]["message"].value;

  var regEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/g;
  var regPhone = /^\d{10}$/; // Validates a 10-digit phone number
  var regName = /^[A-Za-z\s]+$/; // Validates names with alphabets and spaces only

  if (!regName.test(name)) {
    alert("Kindly enter a valid Name (letters and spaces only)!");
    return false;
  }

  if (mail == "" || !regEmail.test(mail)) {
    alert("Please enter a valid e-mail address.");
    return false;
  }

  if (!regPhone.test(phone)) {
    alert("Please enter a valid 10-digit phone number!");
    return false;
  }

  alert("Details Submitted!");

  const recipient = "dgoswami1@learn.athabascau.ca";
  const mailtoLink =
    `mailto:${recipient}` +
    `?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(
      `Name: ${name}\nEmail: ${mail}\nPhone: ${phone}\n\n${message}`
    )}`;

  window.location.href = mailtoLink;
  return false;
}
