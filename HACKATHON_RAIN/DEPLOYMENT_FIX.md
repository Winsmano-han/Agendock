# Deployment Data Persistence Fix

## Problem
- Users get deleted when new accounts are created
- Business data disappears with every deployment
- SQLite database is ephemeral on cloud platforms

## Root Causes
1. **SQLite on Render**: Render's filesystem is ephemeral - files are deleted on every deployment
2. **No Persistent Database**: SQLite creates local files that don't persist across deployments
3. **Race Conditions**: Multiple users creating accounts simultaneously

## Solutions

### 1. Switch to PostgreSQL (CRITICAL)

#### On Render:
1. Go to your Render dashboard
2. Create a new PostgreSQL database:
   - Click "New" → "PostgreSQL"
   - Choose a name (e.g., "agentdock-db")
   - Select region closest to your API service
   - Choose the free tier for testing

3. Get the connection string:
   - Copy the "External Database URL" from your PostgreSQL dashboard
   - It looks like: `postgresql://username:password@host:port/database`

4. Update your API service environment variables:
   ```
   DATABASE_URL=postgresql://username:password@host:port/database
   ```

#### On Vercel (Frontend):
1. Update `NEXT_PUBLIC_API_BASE_URL` to point to your Render API URL
2. Ensure CORS is properly configured in your API

### 2. Environment Variables Setup

#### API Service (Render):
```bash
DATABASE_URL=postgresql://your-db-connection-string
AUTH_SECRET=your-secure-secret-here
AUTH_REQUIRED=1
GROQ_API_KEY=your-groq-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
CORS_ORIGINS=https://agendock-xi.vercel.app
```

#### Frontend (Vercel):
```bash
NEXT_PUBLIC_API_BASE_URL=https://your-api.onrender.com
```

### 3. Database Migration Steps

1. **Backup existing data** (if any):
   ```bash
   # If you have important data, export it first
   sqlite3 agentdock.db .dump > backup.sql
   ```

2. **Deploy with PostgreSQL**:
   - Update DATABASE_URL environment variable
   - Redeploy your API service
   - The app will automatically create tables on first run

3. **Verify deployment**:
   - Check API health: `https://your-api.onrender.com/health`
   - Create a test account
   - Verify data persists after redeployment

### 4. Monitoring & Debugging

#### Check Database Connection:
```bash
# Add this endpoint to test DB connectivity
@app.route("/db-test", methods=["GET"])
def db_test():
    try:
        db = SessionLocal()
        result = db.execute(text("SELECT 1")).fetchone()
        db.close()
        return jsonify({"status": "connected", "result": result[0] if result else None})
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500
```

#### Monitor Logs:
- Check Render logs for database connection errors
- Look for "Failed to create tenant" messages
- Monitor for SQLAlchemy connection issues

### 5. Quick Fix for Immediate Testing

If you need a quick fix while setting up PostgreSQL:

1. **Use Render's Persistent Disk** (paid feature):
   - Add a persistent disk to your service
   - Mount it to `/app/data`
   - Update DATABASE_URL to `sqlite:////app/data/agentdock.db`

2. **Or use a managed SQLite service**:
   - Consider Turso (serverless SQLite)
   - Update DATABASE_URL accordingly

### 6. Verification Checklist

- [ ] PostgreSQL database created on Render
- [ ] DATABASE_URL updated in environment variables
- [ ] API service redeployed successfully
- [ ] Health check returns 200: `/health`
- [ ] Database test passes: `/db-test`
- [ ] Can create new account without errors
- [ ] Account persists after API redeployment
- [ ] Frontend can connect to API
- [ ] WhatsApp integration still works

### 7. Rollback Plan

If issues occur:
1. Revert DATABASE_URL to SQLite temporarily
2. Check application logs for specific errors
3. Verify PostgreSQL connection string format
4. Ensure database is accessible from Render's network

## Expected Results

After implementing these fixes:
- ✅ User accounts persist across deployments
- ✅ Business data is never lost
- ✅ Multiple users can create accounts simultaneously
- ✅ Database scales with your application
- ✅ Better performance and reliability