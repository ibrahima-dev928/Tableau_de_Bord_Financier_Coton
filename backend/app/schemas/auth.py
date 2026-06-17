from pydantic import BaseModel

class LoginRequest(BaseModel):
    email: str
    mot_de_passe: str

class Token(BaseModel):
    access_token: str
    token_type: str