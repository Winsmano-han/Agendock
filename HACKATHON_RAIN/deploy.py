#!/usr/bin/env python3
"""
Safe deployment script for AgentDock that preserves data.
Prevents database loss during updates and deployments.
"""

import os
import sys
import subprocess
import shutil
from datetime import datetime
from pathlib import Path

def run_command(cmd, cwd=None):
    """Run a command and return success status."""
    try:
        result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"Command failed: {cmd}")
            print(f"Error: {result.stderr}")
            return False
        return True
    except Exception as e:
        print(f"Failed to run command: {cmd}")
        print(f"Error: {e}")
        return False

def backup_database():
    """Backup the current database before deployment."""
    print("🔄 Creating database backup...")
    
    db_files = ["agentdock.db", "services/api/agentdock.db"]
    backup_created = False
    
    for db_file in db_files:
        if os.path.exists(db_file):
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_name = f"{db_file}.backup_{timestamp}"
            
            try:
                shutil.copy2(db_file, backup_name)
                print(f"✅ Database backed up: {backup_name}")
                backup_created = True
            except Exception as e:
                print(f"❌ Failed to backup {db_file}: {e}")
    
    return backup_created

def check_environment():
    """Check if required environment variables are set."""
    print("🔍 Checking environment configuration...")
    
    required_vars = [
        "GROQ_API_KEY",
        "AUTH_SECRET",
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        print("Please set these variables before deployment.")
        return False
    
    print("✅ Environment configuration looks good")
    return True

def install_dependencies():
    """Install Python dependencies."""
    print("📦 Installing dependencies...")
    
    services = ["services/api", "services/ai", "services/whatsapp"]
    
    for service in services:
        if os.path.exists(f"{service}/requirements.txt"):
            print(f"Installing dependencies for {service}...")
            if not run_command(f"pip install -r requirements.txt", cwd=service):
                print(f"❌ Failed to install dependencies for {service}")
                return False
    
    print("✅ Dependencies installed successfully")
    return True

def run_database_migrations():
    """Run database migrations safely."""
    print("🗄️ Running database migrations...")
    
    # The init_db() function in app.py handles migrations safely
    # We just need to import it to trigger the migration
    try:
        sys.path.append("services/api")
        from app import init_db
        init_db()
        print("✅ Database migrations completed")
        return True
    except Exception as e:
        print(f"❌ Database migration failed: {e}")
        return False

def start_services():
    """Start all services."""
    print("🚀 Starting services...")
    
    # Use the existing run-all script
    if os.path.exists("run-all.ps1"):
        print("Starting services using run-all.ps1...")
        if run_command("powershell -ExecutionPolicy Bypass -File .\\run-all.ps1 -KillPorts"):
            print("✅ Services started successfully")
            return True
        else:
            print("❌ Failed to start services")
            return False
    else:
        print("❌ run-all.ps1 not found")
        return False

def deploy():
    """Main deployment function."""
    print("🚀 Starting AgentDock deployment...")
    print("=" * 50)
    
    # Step 1: Backup database
    if not backup_database():
        print("⚠️ No database backup created (this might be the first deployment)")
    
    # Step 2: Check environment
    if not check_environment():
        print("❌ Deployment failed: Environment check failed")
        return False
    
    # Step 3: Install dependencies
    if not install_dependencies():
        print("❌ Deployment failed: Dependency installation failed")
        return False
    
    # Step 4: Run migrations
    if not run_database_migrations():
        print("❌ Deployment failed: Database migration failed")
        return False
    
    # Step 5: Start services
    if not start_services():
        print("❌ Deployment failed: Service startup failed")
        return False
    
    print("=" * 50)
    print("✅ AgentDock deployment completed successfully!")
    print("")
    print("🌐 Services should be available at:")
    print("   - API: http://localhost:5000")
    print("   - Frontend: http://localhost:3002")
    print("   - AI Service: http://localhost:5002")
    print("")
    print("📊 Check the dashboard for your business data")
    
    return True

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--help":
        print("AgentDock Deployment Script")
        print("Usage: python deploy.py")
        print("")
        print("This script will:")
        print("1. Backup existing database")
        print("2. Check environment configuration")
        print("3. Install dependencies")
        print("4. Run database migrations")
        print("5. Start all services")
        sys.exit(0)
    
    success = deploy()
    sys.exit(0 if success else 1)