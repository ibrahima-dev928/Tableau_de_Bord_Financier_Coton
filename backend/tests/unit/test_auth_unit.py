from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def test_password_hashing():
    password = "admin123"
    hashed = pwd_context.hash(password)
    assert pwd_context.verify(password, hashed) is True
    assert pwd_context.verify("wrong", hashed) is False