import os
import sys
from sqlalchemy import create_engine, inspect, text
from app.config import settings

def stamp_if_needed():
    """
    Checks if the database has tables but is missing the alembic_version table.
    If so, stamps it with the initial migration to prevent create_all conflicts.
    """
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # Check if tables exist
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        if "users" in tables and "alembic_version" not in tables:
            print("Database has tables but no alembic_version. Stamping initial migration...")
            # Stamp with the initial migration ID
            conn.execute(text("CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL, CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num))"))
            conn.execute(text("INSERT INTO alembic_version (version_num) VALUES ('65e0203b5218')"))
            conn.commit()
            print("Successfully stamped database.")
        else:
            print("Database is already stamped or empty.")

if __name__ == "__main__":
    stamp_if_needed()
