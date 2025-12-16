#!/usr/bin/env python3
"""
Database backup and migration utility for AgentDock.
Prevents data loss during deployments and updates.
"""

import os
import shutil
import sqlite3
from datetime import datetime
from pathlib import Path

def backup_sqlite_database(db_path: str, backup_dir: str = "backups") -> str:
    """Create a backup of the SQLite database."""
    if not os.path.exists(db_path):
        print(f"Database file {db_path} does not exist")
        return ""
    
    # Create backup directory
    Path(backup_dir).mkdir(exist_ok=True)
    
    # Generate backup filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"agentdock_backup_{timestamp}.db"
    backup_path = os.path.join(backup_dir, backup_filename)
    
    try:
        # Copy database file
        shutil.copy2(db_path, backup_path)
        print(f"Database backed up to: {backup_path}")
        
        # Verify backup integrity
        conn = sqlite3.connect(backup_path)
        conn.execute("PRAGMA integrity_check")
        conn.close()
        
        return backup_path
    except Exception as e:
        print(f"Backup failed: {e}")
        return ""

def restore_database(backup_path: str, target_path: str) -> bool:
    """Restore database from backup."""
    if not os.path.exists(backup_path):
        print(f"Backup file {backup_path} does not exist")
        return False
    
    try:
        # Create backup of current database if it exists
        if os.path.exists(target_path):
            current_backup = f"{target_path}.pre_restore_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            shutil.copy2(target_path, current_backup)
            print(f"Current database backed up to: {current_backup}")
        
        # Restore from backup
        shutil.copy2(backup_path, target_path)
        print(f"Database restored from: {backup_path}")
        return True
    except Exception as e:
        print(f"Restore failed: {e}")
        return False

def list_backups(backup_dir: str = "backups") -> list:
    """List available database backups."""
    if not os.path.exists(backup_dir):
        return []
    
    backups = []
    for file in os.listdir(backup_dir):
        if file.startswith("agentdock_backup_") and file.endswith(".db"):
            file_path = os.path.join(backup_dir, file)
            stat = os.stat(file_path)
            backups.append({
                "filename": file,
                "path": file_path,
                "size": stat.st_size,
                "created": datetime.fromtimestamp(stat.st_ctime)
            })
    
    return sorted(backups, key=lambda x: x["created"], reverse=True)

def cleanup_old_backups(backup_dir: str = "backups", keep_count: int = 10):
    """Remove old backup files, keeping only the most recent ones."""
    backups = list_backups(backup_dir)
    
    if len(backups) <= keep_count:
        return
    
    old_backups = backups[keep_count:]
    for backup in old_backups:
        try:
            os.remove(backup["path"])
            print(f"Removed old backup: {backup['filename']}")
        except Exception as e:
            print(f"Failed to remove {backup['filename']}: {e}")

if __name__ == "__main__":
    import sys
    
    db_path = "agentdock.db"
    
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python backup_db.py backup [db_path]")
        print("  python backup_db.py restore <backup_file> [target_path]")
        print("  python backup_db.py list")
        print("  python backup_db.py cleanup [keep_count]")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "backup":
        if len(sys.argv) > 2:
            db_path = sys.argv[2]
        backup_path = backup_sqlite_database(db_path)
        if backup_path:
            print("Backup completed successfully")
        else:
            print("Backup failed")
            sys.exit(1)
    
    elif command == "restore":
        if len(sys.argv) < 3:
            print("Error: backup file path required")
            sys.exit(1)
        
        backup_file = sys.argv[2]
        target_path = sys.argv[3] if len(sys.argv) > 3 else db_path
        
        if restore_database(backup_file, target_path):
            print("Restore completed successfully")
        else:
            print("Restore failed")
            sys.exit(1)
    
    elif command == "list":
        backups = list_backups()
        if not backups:
            print("No backups found")
        else:
            print("Available backups:")
            for backup in backups:
                size_mb = backup["size"] / (1024 * 1024)
                print(f"  {backup['filename']} - {size_mb:.1f}MB - {backup['created']}")
    
    elif command == "cleanup":
        keep_count = int(sys.argv[2]) if len(sys.argv) > 2 else 10
        cleanup_old_backups(keep_count=keep_count)
        print(f"Cleanup completed, keeping {keep_count} most recent backups")
    
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)