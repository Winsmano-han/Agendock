# AgentDock Deployment Fixes

## Critical Issues Fixed

### 1. Database Persistence Issues ✅
**Problem**: Database was being recreated on each deployment, causing data loss.

**Fixes Applied**:
- Added `checkfirst=True` to table creation to prevent recreation
- Implemented absolute database paths to prevent file location issues
- Added explicit database commits after critical operations
- Created database backup utility (`backup_db.py`)

### 2. Booking System Not Updating ✅
**Problem**: AI agent created appointments but they weren't visible in booking dashboard.

**Fixes Applied**:
- Added explicit `db.commit()` after appointment creation
- Fixed transaction handling in message processing
- Added real-time event publishing for booking updates
- Improved database session error handling

### 3. Multi-Tenant Account Overwriting ✅
**Problem**: New tenant creation was overwriting existing accounts.

**Fixes Applied**:
- Added email uniqueness check before tenant creation
- Return proper error (409) when email already exists
- Immediate database commit after tenant creation
- Improved error messages for account conflicts

### 4. WhatsApp Notifications Not Working ✅
**Problem**: Business owners weren't receiving booking notifications.

**Fixes Applied**:
- Enhanced phone number detection from business profile
- Added comprehensive logging for notification debugging
- Improved error handling and fallback mechanisms
- Better Twilio integration with proper credentials handling

## Deployment Instructions

### 1. Safe Deployment Process

```bash
# 1. Backup existing database
python backup_db.py backup

# 2. Use the safe deployment script
python deploy.py

# 3. Verify system is working
python verify_system.py
```

### 2. Environment Configuration

Create `.env` files in each service directory with proper values:

```bash
# Copy production template
cp services/api/.env.production services/api/.env

# Edit with your actual values
# - GROQ_API_KEY: Your Groq API key
# - AUTH_SECRET: Secure random string
# - TWILIO_ACCOUNT_SID: For WhatsApp notifications
# - TWILIO_AUTH_TOKEN: For WhatsApp notifications
```

### 3. Database Backup Strategy

```bash
# Create backup before any changes
python backup_db.py backup

# List available backups
python backup_db.py list

# Restore from backup if needed
python backup_db.py restore backups/agentdock_backup_20250115_143022.db

# Cleanup old backups (keep 10 most recent)
python backup_db.py cleanup 10
```

## Verification Steps

After deployment, run these checks:

1. **System Health Check**:
   ```bash
   python verify_system.py
   ```

2. **Manual Verification**:
   - Visit `http://localhost:3002` (Frontend)
   - Create a test business account
   - Test AI chat and booking creation
   - Check booking appears in dashboard
   - Verify WhatsApp notifications (if configured)

3. **Database Integrity**:
   ```bash
   # Check database has data
   python backup_db.py list
   
   # Verify tenant count
   sqlite3 agentdock.db "SELECT COUNT(*) FROM tenants;"
   ```

## Troubleshooting

### Issue: Bookings Not Appearing
**Solution**: 
1. Check database commits are working: `python verify_system.py`
2. Verify API service is running: `curl http://localhost:5000/health`
3. Check browser console for frontend errors

### Issue: WhatsApp Notifications Not Sending
**Solution**:
1. Verify Twilio credentials in `.env`
2. Check business profile has `whatsapp_number` or `contact_phone`
3. Review API logs for notification errors

### Issue: Database Lost After Deployment
**Solution**:
1. Restore from backup: `python backup_db.py restore <backup_file>`
2. Use absolute database paths in production
3. Ensure `DATABASE_URL` environment variable is set correctly

### Issue: Multiple Accounts with Same Email
**Solution**:
1. The system now prevents this with proper error messages
2. Users should use different emails or login to existing accounts
3. Database integrity is maintained

## Production Deployment Notes

### For Render/Vercel Deployment:

1. **Environment Variables**: Set all required variables in platform dashboard
2. **Database**: Use PostgreSQL or MySQL instead of SQLite for production
3. **File Storage**: Use cloud storage for uploads instead of local filesystem
4. **Monitoring**: Enable logging and monitoring for production issues

### Database Migration for Production:

```bash
# Export SQLite data
sqlite3 agentdock.db .dump > agentdock_export.sql

# Import to PostgreSQL (example)
psql $DATABASE_URL < agentdock_export.sql
```

## Key Files Added/Modified

- `backup_db.py` - Database backup utility
- `deploy.py` - Safe deployment script  
- `verify_system.py` - System verification
- `.env.production` - Production environment template
- `services/api/app.py` - Fixed database commits and session handling

## Testing Checklist

- [ ] Database persists after restart
- [ ] New tenants don't overwrite existing ones
- [ ] Bookings appear immediately in dashboard
- [ ] WhatsApp notifications work (if configured)
- [ ] Multiple users can create accounts
- [ ] System survives deployment updates
- [ ] Backup and restore works correctly

## Support

If issues persist:
1. Run `python verify_system.py` for diagnostics
2. Check service logs for errors
3. Verify environment configuration
4. Test with fresh database if needed