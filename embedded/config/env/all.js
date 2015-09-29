'use strict';

module.exports = {
  countdown: {
    initial: 5,
    others: 10
  },
  frontend: {
    host: 'http://localhost:3000',
  },
	google: {
		clientID: process.env.GOOGLE_ID || 'APP_ID',
		clientSecret: process.env.GOOGLE_SECRET || 'APP_SECRET',
		callbackURL: '/auth/google/callback',
    project: process.env.GOOGLE_PROJECT || 'APP_PROJECT',
    keyFilename: 'secrets/service/prod.json',
    storageBucket: process.env.GOOGLE_STORAGE_BUCKET || 'STORAGE_BUCKET',
	},
	mailer: {
		from: process.env.MAILER_FROM || 'MAILER_FROM',
		options: {
			service: process.env.MAILER_SERVICE_PROVIDER || 'MAILER_SERVICE_PROVIDER',
			auth: {
				user: process.env.MAILER_EMAIL_ID || 'MAILER_EMAIL_ID',
				pass: process.env.MAILER_PASSWORD || 'MAILER_PASSWORD'
			}
		}
	}
};