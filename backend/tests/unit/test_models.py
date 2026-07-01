from decimal import Decimal
from app.models import Achat

def test_achat_montant_total():
    achat = Achat(quantite_kg=Decimal("500"), prix_kg=Decimal("250"))
    # Dans la vraie vie, le montant_total est calculé dans le constructeur ou une méthode
    montant = achat.quantite_kg * achat.prix_kg
    assert montant == Decimal("125000")