import api from "../api";

// ==============================
// 👥 USERS
// ==============================

// GET ALL USERS (with pagination)
export const getUsers = (page = 0, size = 10) => {
    return api.get(`/admin/users?page=${page}&size=${size}`);
};

// GET USER BY ID
export const getUserById = (id) => {
    return api.get(`/admin/users/${id}`);
};

// UPDATE USER
export const updateUser = (id, data) => {
    return api.put(`/admin/users/${id}`, data);
};

// DELETE USER
export const deleteUser = (id) => {
    return api.delete(`/admin/users/${id}`);
};



// PROMOTE → ADMIN
export const promoteUser = (id) => {
    return api.put(`/admin/users/${id}/promote`);
};

// DEMOTE → USER
export const demoteUser = (id) => {
    return api.put(`/admin/users/${id}/demote`);
};

// ==============================
// 🛑 STATUS MANAGEMENT
// ==============================

// DISABLE USER
export const disableUser = (id) => {
    return api.put(`/admin/users/${id}/disable`);
};

// ENABLE USER
export const enableUser = (id) => {
    return api.put(`/admin/users/${id}/enable`);
};