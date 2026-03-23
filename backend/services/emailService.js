const nodemailer = require('nodemailer');
const db = require('../config/db');

// Cache transporter to avoid recreating on every email if settings haven't changed
let transporter = null;
let currentConfig = null;

const getTransporter = async () => {
    try {
        // Fetch latest settings from DB
        const [settings] = await db.query('SELECT setting_key, setting_value FROM system_settings');
        const config = settings.reduce((acc, curr) => {
            acc[curr.setting_key] = curr.setting_value;
            return acc;
        }, {});

        // Check required fields
        if (!config.smtp_host || !config.smtp_user || !config.smtp_pass) {
            console.warn('SMTP Settings missing, cannot send email.');
            return null;
        }

        // Check if config changed or transporter doesn't exist
        const configStr = JSON.stringify(config);
        if (!transporter || currentConfig !== configStr) {
            transporter = nodemailer.createTransport({
                host: config.smtp_host,
                port: parseInt(config.smtp_port) || 587,
                secure: config.smtp_secure === 'true', // true for 465, false for other ports
                auth: {
                    user: config.smtp_user,
                    pass: config.smtp_pass,
                },
                tls: {
                    rejectUnauthorized: false // Helpful for self-signed certs or some dev envs
                }
            });
            currentConfig = configStr;
            console.log('Nodemailer transporter initialized.');
        }

        return transporter;
    } catch (error) {
        console.error('Error configuring email transporter:', error);
        return null;
    }
};

const sendEmail = async (to, subject, htmlContent) => {
    const mailTransport = await getTransporter();
    if (!mailTransport) return false;

    try {
        const [settings] = await db.query("SELECT setting_value FROM system_settings WHERE setting_key = 'smtp_user'");
        const fromEmail = settings.length > 0 ? settings[0].setting_value : 'noreply@induwell.com';

        const info = await mailTransport.sendMail({
            from: `"Induwell Cloud" <${fromEmail}>`,
            to,
            subject,
            html: htmlContent,
        });

        console.log('Message sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

// --- Templates ---

const sendNewTransactionNotification = async (approverEmail, requeresterName, type, amount, details, link) => {
    const subject = `Nueva Solicitud de ${type}: ${requeresterName}`;
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #1e293b;">Nueva Solicitud Pendiente</h2>
            <p>Hola,</p>
            <p><strong>${requeresterName}</strong> ha registrado un nuevo <strong>${type}</strong> que requiere tu revisión.</p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Monto:</strong> $${amount}</p>
                <p><strong>Detalle:</strong> ${details}</p>
            </div>

            <p>Por favor ingresa al sistema para aprobar o rechazar esta solicitud.</p>
            <a href="${link}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Ir a Aprobaciones</a>
        </div>
    `;
    return sendEmail(approverEmail, subject, html);
};

const sendStatusUpdateNotification = async (requesterEmail, type, status, comments) => {
    const color = status === 'Aprobado' ? '#22c55e' : '#ef4444';
    const subject = `Tu solicitud de ${type} ha sido ${status}`;
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: ${color};">Solicitud ${status}</h2>
            <p>Hola,</p>
            <p>Tu solicitud de <strong>${type}</strong> ha sido procesada.</p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Estado:</strong> <span style="color: ${color}; font-weight: bold;">${status}</span></p>
                ${comments ? `<p><strong>Comentarios:</strong> ${comments}</p>` : ''}
            </div>

            <p>Ingresa al sistema para ver más detalles.</p>
        </div>
    `;
    return sendEmail(requesterEmail, subject, html);
};

module.exports = {
    sendEmail,
    sendNewTransactionNotification,
    sendStatusUpdateNotification
};
