const roleName = 'director';
const isAdmin = ['admin', 'gerente', 'director'].includes(roleName);
let status = 'Pendiente';
if (isAdmin) status = (roleName === 'admin') ? 'AdminPending' : 'Aprobado Jefe';
console.log(status);
