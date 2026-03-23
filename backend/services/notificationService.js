const nodemailer = require('nodemailer');
const webpush = require('web-push');
const db = require('../config/db');

// In-memory cache for settings to reduce DB hits (optional optimization)
let settingsCache = {};

// Helper: Get Settings
const getSettings = async () => {
    // Ideally use cache with TTL, for now fetch fresh
    const [rows] = await db.execute('SELECT * FROM system_settings');
    const settings = {};
    rows.forEach(r => settings[r.setting_key] = r.setting_value);
    return settings;
};

// Helper: Get Template
const getTemplate = async (event_name) => {
    const [rows] = await db.execute('SELECT * FROM notification_templates WHERE event_name = ?', [event_name]);
    return rows[0];
};

const sendNotification = async (eventName, data, userId) => {
    try {
        const settings = await getSettings();
        const template = await getTemplate(eventName);

        if (!template || !template.is_active) {
            console.log(`Notification skipped: No active template for ${eventName}`);
            return;
        }

        // 1. Replace Variables
        let subject = template.subject_template;
        let body = template.body_template;

        // Simple {{variable}} replacement
        Object.keys(data).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            subject = subject.replace(regex, data[key]);
            body = body.replace(regex, data[key]);
        });

        // 2. Send Email
        if (template.channel === 'EMAIL' || template.channel === 'BOTH') {
            if (settings.smtp_host && settings.smtp_user) {
                const transporter = nodemailer.createTransport({
                    host: settings.smtp_host,
                    port: parseInt(settings.smtp_port),
                    secure: settings.smtp_secure === 'true',
                    auth: {
                        user: settings.smtp_user,
                        pass: settings.smtp_pass // Use encrypted/decrypted in real prod
                    }
                });

                // Get user email
                const [users] = await db.execute('SELECT email FROM users WHERE id = ?', [userId]);
                if (users.length > 0) {
                    await transporter.sendMail({
                        from: `"Induwell System" <${settings.smtp_user}>`,
                        to: users[0].email,
                        subject: subject,
                        html: body // Assuming body supports basic HTML
                    });
                    console.log(`Email sent to ${users[0].email} for ${eventName}`);
                }
            } else {
                console.log('SMTP not configured, skipping email.');
            }
        }

        // 3. Send Push (Stub for now)
        if (template.channel === 'PUSH' || template.channel === 'BOTH') {
            console.log(`Push notification logic pending for ${eventName}: ${subject}`);
            // Fetch subscription from `push_subscriptions` and use web-push
        }

    } catch (error) {
        console.error('Notification Service Error:', error);
    }
};

module.exports = { sendNotification };
