"""
One-shot script to create/ensure admin user: ranjith / ranjith143
Run from: e:/My Projects/Smart Hire Ai/backend
    uv run python scripts/create_admin.py
"""

import asyncio
from sqlalchemy import select
from app.db.database import get_session_factory
from app.db.enums import UserRole
from app.models.user import User
from app.models.role import Role
from app.core.security.password import PasswordManager


async def create_admin() -> None:
    pm = PasswordManager()
    session_factory = get_session_factory()

    async with session_factory() as db:
        # 1. Ensure admin role exists
        role_q = await db.execute(select(Role).where(Role.name == UserRole.ADMIN))
        admin_role = role_q.scalar_one_or_none()
        if not admin_role:
            admin_role = Role(name=UserRole.ADMIN, description="Platform administrator")
            db.add(admin_role)
            await db.flush()
            print("Created ADMIN role.")

        # 2. Check if user already exists
        user_q = await db.execute(select(User).where(User.username == "ranjith"))
        existing = user_q.scalar_one_or_none()

        if existing:
            # Ensure admin role is attached and account is approved/active
            roles = [r.name for r in existing.roles]
            if UserRole.ADMIN not in roles:
                existing.roles.append(admin_role)
                print("Attached ADMIN role to existing user 'ranjith'.")
            existing.is_approved = True
            existing.is_active = True
            await db.commit()
            print(f"Admin user 'ranjith' already exists (id={existing.id}). Ensured active + approved.")
            return

        # 3. Create fresh admin user
        user = User(
            email="ranjith@smarthire.ai",
            username="ranjith",
            hashed_password=pm.hash_password("ranjith143"),
            first_name="Ranjith",
            last_name="Admin",
            is_active=True,
            is_verified=True,
            is_approved=True,
        )
        user.roles.append(admin_role)
        db.add(user)
        await db.commit()
        await db.refresh(user)

        print("=" * 50)
        print("Admin user created successfully!")
        print(f"  Username : ranjith")
        print(f"  Password : ranjith143")
        print(f"  Email    : ranjith@smarthire.ai")
        print(f"  Role     : admin")
        print(f"  User ID  : {user.id}")
        print("=" * 50)


if __name__ == "__main__":
    asyncio.run(create_admin())
