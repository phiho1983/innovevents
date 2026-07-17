from django.test import TestCase
from decimal import Decimal

# Create your tests here.
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from .models import Prospect,Quote,QuoteItem

User=get_user_model()

class ProspectModelTest(TestCase):
    def test_str(self):
        p=Prospect(first_name="Jean",last_name="Dupont",email="j@test.com")
        self.assertEqual(str(p),"Jean Dupont (j@test.com)")

class ProspectAPITest(TestCase):
    def setUp(self):
        self.client=APIClient()

    def test_create_prospect_public(self):
        data={"first_name":"Jean","last_name":"Dupont","email":"jean@test.com",
              "phone":"0612345678","company":"ACME","city":"Paris","message":"Test"}
        r=self.client.post("/api/prospects/",data,format="json")
        self.assertEqual(r.status_code,201)
        self.assertEqual(Prospect.objects.count(),1)
        self.assertEqual(Prospect.objects.first().status,"TO_CONTACT")

    def test_create_prospect_missing_email(self):
        data={"first_name":"Jean","last_name":"Dupont","phone":"0612345678",
              "company":"ACME","city":"Paris","message":"Test"}
        r=self.client.post("/api/prospects/",data,format="json")
        self.assertEqual(r.status_code,400)
        self.assertIn("email",r.data)

    def test_list_prospects_requires_admin(self):
        r=self.client.get("/api/prospects/")
        self.assertIn(r.status_code,[401,403])

class QuoteModelTest(TestCase):
    def setUp(self):
        self.admin=User.objects.create_user("admin","a@test.com","pass1234",is_staff=True)
        self.prospect=Prospect.objects.create(first_name="X",last_name="Y",email="x@y.com",
                                              phone="0600000000",company="Z",city="Paris",message="Ok")

    def test_quote_totals(self):
        q = Quote.objects.create(prospect=self.prospect,tva_rate=Decimal("0.20"))
        QuoteItem.objects.create(quote=q,label="Traiteur",amount_ht=Decimal("2000.00"))
        QuoteItem.objects.create(quote=q,label="Salle",amount_ht=Decimal("1000.00"))
        self.assertEqual(float(q.total_ht),3000.0)
        self.assertEqual(float(q.total_tva),600.0)
        self.assertEqual(float(q.total_ttc),3600.0)

    def test_create_quote_as_admin(self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.admin)
        r=self.client.post("/api/quotes/",
            {"prospect":self.prospect.id,"tva_rate":"0.20","items":[{"label":"DJ","amount_ht":"500"}]},
            format="json")
        self.assertEqual(r.status_code,201)
        self.assertEqual(QuoteItem.objects.count(),1)