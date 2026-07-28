"""Quick script to check what tables exist and then seed the admin user."""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text, select
from app.db.database import get_session_factory
from app.db.enums import UserRole
from app.models.user import User
from app.models.role import Role
from app.core.security.password import PasswordManager


from app.db.database import get_engine, get_session_factory


async def main() -> None:
    # 1. Check tables exist
    engine = get_engine()


    async with engine.connect() as conn:
        result = await conn.execute(
            text(
                "SELECT table_name FROM information_schema.tables "
                "WHERE table_schema='public' ORDER BY table_name"
            )
        )
        tables = [r[0] for r in result.fetchall()]
        print("Tables in smarthire_ai DB:", tables)
    await engine.dispose()

    if "users" not in tables:
        print("ERROR: 'users' table not found! Run: uv run alembic upgrade head")
        return

    # 2. Seed admin user
    pm = PasswordManager()
    session_factory = get_session_factory()

    async with session_factory() as db:
        # Ensure ADMIN role exists
        role_q = await db.execute(select(Role).where(Role.name == UserRole.ADMIN))
        admin_role = role_q.scalar_one_or_none()
        if not admin_role:
            admin_role = Role(name=UserRole.ADMIN, description="Platform administrator")
            db.add(admin_role)
            await db.flush()
            print("Created ADMIN role.")
        else:
            print("ADMIN role already exists.")

        # Check if user 'ranjith' already exists
        user_q = await db.execute(select(User).where(User.username == "ranjith"))
        existing = user_q.scalar_one_or_none()

        if existing:
            roles = [r.name for r in existing.roles]
            if UserRole.ADMIN not in roles:
                existing.roles.append(admin_role)
                print("Attached ADMIN role to existing user 'ranjith'.")
            existing.is_approved = True
            existing.is_active = True
            existing.is_verified = True
            # Reset password
            existing.hashed_password = pm.hash_password("ranjith143")
            await db.commit()
            print(f"Admin user 'ranjith' updated — active, approved, password reset.")
        else:
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
            print("  Username : ranjith")
            print("  Password : ranjith143")
            print("  Email    : ranjith@smarthire.ai")
            print("  Role     : admin")
            print(f"  User ID  : {user.id}")
            print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())
