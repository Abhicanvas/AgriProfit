import sys
import os

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.session import engine
from app.database.base import Base
# Import models so they are registered with Base
from app.models import CommunityReply, CommunityLike, CommunityPost

def create_tables():
    print("Creating missing tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")

if __name__ == "__main__":
    create_tables()
