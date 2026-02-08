
import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.sql import quoted_name

# Get database URL from environment variable
DB_URL = os.environ.get("DATABASE_URL", "postgresql+psycopg2://postgres:password@127.0.0.1:5433/agriprofit_prod")

def verify():
    output = []
    try:
        engine = create_engine(DB_URL, connect_args={'connect_timeout': 10})
        output.append("Attempting connection...")
        with engine.connect() as conn:
            output.append("Successfully connected to database!")
            
            # Get tables
            result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
            tables = [row[0] for row in result]
            
            output.append(f"Found {len(tables)} tables:")
            for table in tables:
                if table != 'alembic_version':
                    # Use parameterized query to avoid SQL injection
                    # Note: table names can't be parameterized, but we validate against known schema
                    if table.isidentifier():  # Basic validation
                        count = conn.execute(text(f'SELECT count(*) FROM "{table}"')).scalar()
                        output.append(f"- {table}: {count} records")
                else:
                    output.append(f"- {table}")
                    
            return True
    except Exception as e:
        output.append(f"Error: {e}")
        return False
    finally:
        with open("verification_result.txt", "w") as f:
            f.write("\n".join(output))

if __name__ == "__main__":
    verify()
