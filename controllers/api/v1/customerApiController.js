const controller = {};
const { Customer } = require("../../../models");
const { Op } = require("sequelize");

// In your customer controller
controller.getCustomer = async (req, res) => {
    try {
        const customers = await Customer.findAll({
            attributes: ['id', 'name', 'phone'],
            order: [['name', 'ASC']]
        });
        
        return res.status(200).json({
            success: true,
            data: customers
        });
    } catch (error) {
        console.error("Error fetching customers:", error);
        return res.status(500).json({ 
            success: false, 
            error: "Đã xảy ra lỗi khi lấy danh sách khách hàng." 
        });
    }
};

// Add search customer endpoint
controller.searchCustomers = async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.trim().length === 0) {
            return res.status(200).json({
                success: true,
                data: []
            });
        }
        
        const customers = await Customer.findAll({
            where: {
                [Op.or]: [
                    { name: { [Op.like]: `%${q}%` } },
                    { phone: { [Op.like]: `%${q}%` } }
                ]
            },
            attributes: ['id', 'name', 'phone'],
            limit: 10,
            order: [['name', 'ASC']]
        });
        
        return res.status(200).json({
            success: true,
            data: customers
        });
    } catch (error) {
        console.error("Error searching customers:", error);
        return res.status(500).json({ 
            success: false, 
            error: "Đã xảy ra lỗi khi tìm kiếm khách hàng." 
        });
    }
};

controller.createCustomer = async (req, res) => {
    try {
        const { name, phone } = req.body;

        // Validate input
        if (!name) {
            return res.status(400).json({ error: "Tên là bắt buộc." });
        }

        // Check if phone number already exists
        if (phone) {
            const existingCustomer = await Customer.findOne({ where: { phone } });
            if (existingCustomer) {
                return res.status(400).json({ error: "Số điện thoại đã tồn tại." });
            }
        }

        // Create new customer
        const customer = await Customer.create({ name, phone });
        return res.status(201).json({
            message: "Khách hàng được tạo thành công.",
            customer: {
                id: customer.id,
                name: customer.name,
                phone: customer.phone
            }
        });
    }
    catch (error) {
        console.error("Error creating customer:", error);
        return res.status(500).json({ error: "Đã xảy ra lỗi khi tạo khách hàng." });
    }
};

controller.updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone } = req.body;

        // Validate input
        if (!name) {
            return res.status(400).json({ error: "Tên là bắt buộc." });
        }

        // Check if customer exists
        const customer = await Customer.findByPk(id);
        if (!customer) {
            return res.status(404).json({ error: "Khách hàng không tồn tại." });
        }

        // Check if new phone number already exists for another customer
        if (phone) {
            const existingCustomer = await Customer.findOne({ where: { phone, id: { [Op.ne]: id } } });
            if (existingCustomer) {
                return res.status(400).json({ error: "Số điện thoại đã tồn tại." });
            }
        }

        // Update customer
        customer.name = name;
        customer.phone = phone;
        await customer.save();

        return res.status(200).json({
            message: "Khách hàng được cập nhật thành công.",
            customer: {
                id: customer.id,
                name: customer.name,
                phone: customer.phone
            }
        });
    }
    catch (error) {
        console.error("Error updating customer:", error);
        return res.status(500).json({ error: "Đã xảy ra lỗi khi cập nhật khách hàng." });
    }
};

controller.deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if customer exists
        const customer = await Customer.findByPk(id);
        if (!customer) {
            return res.status(404).json({ error: "Khách hàng không tồn tại." });
        }

        // Delete customer
        await customer.destroy();
        return res.status(200).json({ message: "Khách hàng được xóa thành công." });
    }
    catch (error) {
        console.error("Error deleting customer:", error);
        return res.status(500).json({ error: "Đã xảy ra lỗi khi xóa khách hàng." });
    }
};

module.exports = controller;