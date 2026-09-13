const keys = ['DATABASE_URL','AUTH0_DOMAIN','AUTH0_CLIENT_ID','AUTH0_CLIENT_SECRET','AUTH0_SECRET','APP_BASE_URL','GEMINI_API_KEY'];
for (const key of keys) console.log(`${key}: ${process.env[key] ? 'configured' : 'missing'}`);
