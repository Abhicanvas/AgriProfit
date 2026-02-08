"""Helper script to make a user an admin"""
from app.database.session import SessionLocal
from app.models.user import User

def list_users():
    """List all users in the database"""
    db = SessionLocal()
    users = db.query(User).all()
    
    print("\n=== All Users ===")
    for user in users:
        print(f"ID: {user.id} | Name: {user.name} | Phone: {user.phone_number} | Role: {user.role}")
    
    db.close()
    return users

def make_admin(user_id=None, phone=None):
    """Make a user an admin by ID or phone number"""
    db = SessionLocal()
    
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()
    elif phone:
        user = db.query(User).filter(User.phone_number == phone).first()
    else:
        print("Error: Provide either user_id or phone number")
        db.close()
        return
    
    if user:
        user.role = "admin"
        db.commit()
        print(f"\n✅ User '{user.name}' (ID: {user.id}) is now an admin!")
        print(f"Phone: {user.phone_number}")
        print(f"Role: {user.role}")
    else:
        print("\n❌ User not found")
    
    db.close()

if __name__ == "__main__":
    # First, list all users
    users = list_users()
    
    if users:
        print("\n" + "="*50)
        print("To make a user admin, use one of these:")
        print("  make_admin(user_id=1)")
        print("  make_admin(phone='1234567890')")
        print("="*50 + "\n")
        
        # If there's only one user, make them admin automatically
        if len(users) == 1:
            response = input(f"Make '{users[0].name}' an admin? (y/n): ")
            if response.lower() == 'y':
                make_admin(user_id=users[0].id)
    else:
        print("\n❌ No users found in database")
