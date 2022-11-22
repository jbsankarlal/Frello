var nameError = document.getElementById('name-info');
var emailError = document.getElementById('email-info');
var mobileNoError = document.getElementById('mobileNo-info');
var passwordError = document.getElementById('password-info');
var submitError =document.getElementById('submit-info')


function validateName(){
    var name = document.getElementById('username').value;

    if(name.length == 0){

        nameError.innerHTML = 'Username is required';
        return false;

    }

    if(!name.match(/(^[a-zA-Z][a-zA-Z\s]{0,20}[a-zA-Z]$)/)){

        nameError.innerHTML = 'Invalid Username';
        return false;
    }
    else{
    nameError.innerHTML = '' ;
    return true ;
    }
}

function validateEmail(){

    var email = document.getElementById('email').value;

    if(email.length == 0){
        emailError.innerHTML = 'E-mail is required'
        return false;
    }

    if(!email.match(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)){

        emailError.innerHTML = 'Invalid e-mail address'
        return false;

    }

    emailError.innerHTML = '';
    return true;
}

function validateMobileNo(){
    var phone = document.getElementById('mobileNo').value;

    if(phone.match(/^[0-9]{3}-[0-9]{4}-[0-9]{4}$/)){
        mobileNoError.innerHTML = 'Enter Only Digits';
        return false;
    }

    if(phone.length == 0){
        mobileNoError.innerHTML = 'Mobile Number required';
        return false;
    }

    if(phone.length !== 10){

        mobileNoError.innerHTML = 'Mobile Number should be ten digits'
        return false;
    }
    
    

   

    mobileNoError.innerHTML = '';
        return true;
    

}



function validatePassword(){

    var password = document.getElementById('password').value;

    if(password.length==0){
        passwordError.innerHTML='Password is required'
        return false;
    }
    var required = 4 ;
    var left = required - password.length;

    if(left>0){
        passwordError.innerHTML = left + ' more characters required';
        return false;
    }

    passwordError.innerHTML = '';
    return true

}


function validateForm(){
    if(!validateName() && !validateEmail() && !validateMobileNo() && !validatePassword() ){
        submitError.style.direction = 'block';
        submitError.innerHTML = 'Please Fix the errors to Register'
        event.preventDefault()
        setTimeout(function(){submitError.style.display = 'none ';} , 3000)
        return false;
    }

    else if(!validateName() || !validateEmail() || !validateMobileNo() || !validatePassword()){
        submitError.style.direction = 'block';
        submitError.innerHTML = 'Please Enter All Required Fields to Register'
        event.preventDefault()
        setTimeout(function(){submitError.style.display = 'none ';} , 3000)
        return false; 
    }
}