/* Signup form validation */
let signup_form = document.getElementById('signupForm');
const password_regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;
const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{com|in}$/;

if (signup_form) {
    signup_form.addEventListener('submit', function(e) {
        let fullname = document.getElementById('floatingInput1');
        let phone = document.getElementById('floatingInput2');
        let email = document.getElementById('floatingInput3');
        let password = document.getElementById('floatingPassword');
        let cpassword = document.getElementById('floatingCpassword');
        let term_status = document.getElementById('exampleCheck1');

        fullname.addEventListener('blur', handleInputField); 
        phone.addEventListener('blur', handleInputField);
        email.addEventListener('blur', handleInputField);
        password.addEventListener('blur', handleInputField);
        cpassword.addEventListener('blur', handleInputField);
        term_status.addEventListener('change', handleCheckboxField);

        if (!fullname.value) { 
            document.getElementById('floatingInput1_error').innerHTML = 'Name is required';
            e.preventDefault();
        } else {
            document.getElementById('floatingInput1_error').innerHTML = '';
        }

        if (!phone.value) {
            document.getElementById('floatingInput2_error').innerHTML = 'Mobile Number is required';
            e.preventDefault();
        } else {
            document.getElementById('floatingInput2_error').innerHTML = '';
        }

        if (!email.value) {
            document.getElementById('floatingInput3_error').innerHTML = 'Email is required';
            e.preventDefault();
        } 
        else if (!emailRegex.test(email.value)) {
            document.getElementById('floatingInput3_error').innerHTML =
                'Please enter a valid email';
            e.preventDefault();
        }else {
            document.getElementById('floatingInput3_error').innerHTML = '';
        }
        if (!password.value) {
            document.getElementById('floatingPassword_error').innerHTML = 'Password is required';
            e.preventDefault();
        }
        else if (!password_regex.test(password.value)) {
            document.getElementById('floatingPassword_error').innerHTML =
                'Password should be at least 8 characters, having at least one lowercase, one uppercase, one special character, and one number';
            e.preventDefault();
        } else {
            document.getElementById('floatingPassword_error').innerHTML = '';
        }

        if (password.value !== cpassword.value) {
            document.getElementById('floatingCpassword_error').innerHTML = "Password didn't match";
            e.preventDefault();
        } else {
            document.getElementById('floatingCpassword_error').innerHTML = '';
        }

        if (!term_status.checked) {
            document.getElementById('exampleCheck1_error').innerHTML = 'Field is required';
            e.preventDefault();
        } else {
            document.getElementById('exampleCheck1_error').innerHTML = '';
        }
    });
}
/**
 * Method for handling input fields
 */
let handleInputField = function(){
    let el_ID = this.getAttribute('id')+'_error';
     if(this.value){
        document.getElementById(el_ID).innerHTML = "";
     }
}

/**
 * Method for handling checkbox fields
 */
let handleCheckboxField = function(){
    let el_ID = this.getAttribute('id')+'_error';
    if(this.checked){
        document.getElementById(el_ID).innerHTML = "";
    }
}

/* Validation for Login form */
let login_form = document.getElementById('loginform');

if(login_form){
    login_form.addEventListener('submit', function(e) {

        let email = document.getElementById('floatingInput');
        let password = document.getElementById('floatingPassword');
        let term_status = document.getElementById('exampleCheck1');
    
        email.addEventListener('blur', handleInputField);
        password.addEventListener('blur', handleInputField);
        term_status.addEventListener('change', handleCheckboxField);
        
        if(!email.value){ 
            document.getElementById("floatingInput_error").innerHTML = "Email is required";
            e.preventDefault();

        }else{
            document.getElementById("floatingInput_error").innerHTML = "";
        }
        if(!password.value){        
            document.getElementById("floatingPassword_error").innerHTML = "Password is required";
            e.preventDefault();
        }else{
            document.getElementById("floatingPassword_error").innerHTML = "";
        }
        
    
        if(!term_status.checked){        
            document.getElementById("exampleCheck1_error").innerHTML = "Field is required";
            e.preventDefault();
        }else{
            document.getElementById("exampleCheck1_error").innerHTML = "";
        }
    
    });
    }
