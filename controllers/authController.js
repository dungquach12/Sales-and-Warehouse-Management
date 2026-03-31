const controller = {};

controller.showLogin = (req, res) => {
    res.render('authenticate/auth-login', {
        title: 'Đăng nhập',
        layout: 'auth-layout'
    });
}

module.exports = controller;