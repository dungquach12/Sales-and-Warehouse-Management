document.getElementById('togglePassword').addEventListener('click', function () {
    const passwordInput = document.getElementById('floatingPassword');
    const eyeIcon = document.getElementById('eyeIcon');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.classList.replace('bi-eye', 'bi-eye-slash');
    } else {
        passwordInput.type = 'password';
        eyeIcon.classList.replace('bi-eye-slash', 'bi-eye');
    }
});

document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const btn = document.getElementById('loginBtn');
    const errorMsg = document.getElementById('errorMsg');

    // show loading
    btn.disabled = true;
    btn.textContent = 'Đang đăng nhập...';
    errorMsg.classList.add('d-none');

    const usernameOrEmail = document.getElementById('floatingInput').value;
    const password = document.getElementById('floatingPassword').value;

    try {
        const res = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usernameOrEmail, password })
        });

        const result = await res.json();

        if (result.success) {
            window.location.href = '/report';
        } else {
            errorMsg.textContent = result.message;
            errorMsg.classList.remove('d-none');
        }
    } catch (error) {
        errorMsg.textContent = 'Something went wrong. Please try again.';
        errorMsg.classList.remove('d-none');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Log in';
    }
});