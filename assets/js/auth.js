// Wait for the form to be submitted
document.getElementById('loginForm').addEventListener('submit', function(e) {
    
    // Stop the page from refreshing
    e.preventDefault();

    // Get what the user typed
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Check if fields are empty
    if(username === '' || password === '') {
        alert('Please fill in all fields');
        return;
    }

    // Check username and password
    if(username === 'admin' && password === 'admin123') {
        // Correct — go to dashboard
        window.location.href = 'index.html';
    } else {
        // Wrong — show error
        alert('Wrong username or password');
    }

});