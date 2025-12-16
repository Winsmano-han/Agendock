#!/usr/bin/env python3
"""
System verification script for AgentDock.
Checks that all components are working correctly.
"""

import os
import sys
import requests
import sqlite3
import time
from datetime import datetime

def check_database():
    """Verify database is accessible and has data."""
    print("🗄️ Checking database...")
    
    db_files = ["agentdock.db", "services/api/agentdock.db"]
    
    for db_file in db_files:
        if os.path.exists(db_file):
            try:
                conn = sqlite3.connect(db_file)
                cursor = conn.cursor()
                
                # Check if tables exist
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
                tables = cursor.fetchall()
                
                if not tables:
                    print(f"❌ Database {db_file} exists but has no tables")
                    return False
                
                # Check tenant count
                cursor.execute("SELECT COUNT(*) FROM tenants")
                tenant_count = cursor.fetchone()[0]
                
                print(f"✅ Database {db_file}: {len(tables)} tables, {tenant_count} tenants")
                conn.close()
                return True
                
            except Exception as e:
                print(f"❌ Database error in {db_file}: {e}")
                return False
    
    print("❌ No database file found")
    return False

def check_api_service():
    """Check if API service is running."""
    print("🔌 Checking API service...")
    
    try:
        response = requests.get("http://localhost:5000/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API service: {data.get('status', 'unknown')}")
            return True
        else:
            print(f"❌ API service returned status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ API service not accessible: {e}")
        return False

def check_ai_service():
    """Check if AI service is running."""
    print("🤖 Checking AI service...")
    
    try:
        response = requests.get("http://localhost:5002/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ AI service: {data.get('status', 'unknown')}")
            return True
        else:
            print(f"❌ AI service returned status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ AI service not accessible: {e}")
        return False

def check_frontend():
    """Check if frontend is running."""
    print("🌐 Checking frontend...")
    
    try:
        response = requests.get("http://localhost:3002", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend service is running")
            return True
        else:
            print(f"❌ Frontend returned status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Frontend not accessible: {e}")
        return False

def test_booking_system():
    """Test the booking system end-to-end."""
    print("📅 Testing booking system...")
    
    try:
        # Get tenants
        response = requests.get("http://localhost:5000/tenants", timeout=5)
        if response.status_code != 200:
            print("❌ Cannot fetch tenants")
            return False
        
        tenants = response.json()
        if not tenants:
            print("❌ No tenants found")
            return False
        
        tenant_id = tenants[0]["id"]
        
        # Test appointment creation
        test_appointment = {
            "start_time": "2025-01-15T14:00:00",
            "customer_name": "Test Customer",
            "customer_phone": "+1234567890",
            "status": "pending"
        }
        
        response = requests.post(
            f"http://localhost:5000/tenants/{tenant_id}/appointments",
            json=test_appointment,
            timeout=5
        )
        
        if response.status_code == 201:
            appointment = response.json()
            appointment_id = appointment["id"]
            
            # Verify appointment appears in list
            response = requests.get(f"http://localhost:5000/tenants/{tenant_id}/appointments", timeout=5)
            if response.status_code == 200:
                appointments = response.json()
                found = any(a["id"] == appointment_id for a in appointments)
                if found:
                    print("✅ Booking system working correctly")
                    return True
                else:
                    print("❌ Appointment not found in list")
                    return False
            else:
                print("❌ Cannot fetch appointments")
                return False
        else:
            print(f"❌ Cannot create appointment: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Booking system test failed: {e}")
        return False

def check_environment():
    """Check environment configuration."""
    print("⚙️ Checking environment...")
    
    required_vars = ["GROQ_API_KEY"]
    optional_vars = ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"]
    
    missing_required = []
    missing_optional = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_required.append(var)
    
    for var in optional_vars:
        if not os.getenv(var):
            missing_optional.append(var)
    
    if missing_required:
        print(f"❌ Missing required variables: {', '.join(missing_required)}")
        return False
    
    if missing_optional:
        print(f"⚠️ Missing optional variables: {', '.join(missing_optional)}")
    
    print("✅ Environment configuration OK")
    return True

def main():
    """Run all verification checks."""
    print("🔍 AgentDock System Verification")
    print("=" * 40)
    
    checks = [
        ("Environment", check_environment),
        ("Database", check_database),
        ("API Service", check_api_service),
        ("AI Service", check_ai_service),
        ("Frontend", check_frontend),
        ("Booking System", test_booking_system),
    ]
    
    results = []
    
    for name, check_func in checks:
        print(f"\n{name}:")
        try:
            result = check_func()
            results.append((name, result))
        except Exception as e:
            print(f"❌ {name} check failed with error: {e}")
            results.append((name, False))
    
    print("\n" + "=" * 40)
    print("📊 Verification Summary:")
    
    passed = 0
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {name}: {status}")
        if result:
            passed += 1
    
    print(f"\nPassed: {passed}/{len(results)}")
    
    if passed == len(results):
        print("🎉 All systems operational!")
        return True
    else:
        print("⚠️ Some systems need attention")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)