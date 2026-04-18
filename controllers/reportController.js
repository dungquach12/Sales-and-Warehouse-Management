const controller = {};

controller.showReport = async (req, res) => {
    try {
        res.render('report', {
            title: 'Tổng quan',
            activeMenu: 'report',
            pageCSS: 'report.css',
        });
    } catch (error) {
        console.error("Error loading report:", error);
        res.status(500).render("error", { message: "Could not load report" });
    }
};

module.exports = controller;

