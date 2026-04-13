from django.conf import settings
from django.core.mail import send_mail

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status as drf_status

from .models import Prospect, Quote, Note
from .serializers import (
    ProspectPublicCreateSerializer,
    ProspectAdminSerializer,
    ProspectStatusSerializer,
    QuoteSerializer,
    NoteSerializer,
)


class ProspectViewSet(viewsets.ModelViewSet):
    queryset = Prospect.objects.all().order_by("-created_at")

    def get_permissions(self):
        # POST public (form)
        if self.action == "create":
            return [AllowAny()]

        # le reste : admin only (GET list/retrieve, patch status, etc.)
        return [IsAdminUser()]

    def get_serializer_class(self):
        if self.action == "create":
            return ProspectPublicCreateSerializer
        if self.action == "status":
            return ProspectStatusSerializer
        return ProspectAdminSerializer

    def perform_create(self, serializer):
        prospect = serializer.save()

        # Email (mock console si EMAIL_BACKEND = console)
        to_email = getattr(settings, "QUOTE_CONTACT_EMAIL", "contact@innovevents.com")
        subject = f"[Innov'Events] Nouvelle demande de devis — {prospect.first_name} {prospect.last_name}"

        body = (
            f"Nouvelle demande de devis\n\n"
            f"Nom: {prospect.first_name} {prospect.last_name}\n"
            f"Email: {prospect.email}\n"
            f"Téléphone: {prospect.phone}\n"
            f"Société: {prospect.company}\n"
            f"Ville: {prospect.city}\n\n"
            f"Message:\n{prospect.message}\n\n"
            f"Statut: {prospect.status}\n"
        )

        send_mail(
            subject=subject,
            message=body,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
            recipient_list=[to_email],
            fail_silently=True,  # MVP: ne bloque pas si mail non configuré
        )

    @action(detail=True, methods=["patch"], url_path="status", permission_classes=[IsAdminUser])
    def status(self, request, pk=None):
        """
        PATCH /api/prospects/{id}/status/
        Body: { "status": "CONTACTED" }
        """
        prospect = self.get_object()
        serializer = self.get_serializer(prospect, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # on renvoie l'objet complet (admin serializer) pour voir le résultat
        return Response(ProspectAdminSerializer(prospect).data, status=drf_status.HTTP_200_OK)
    
    @action(detail=True,methods=["post"],url_path="convert",permission_classes=[IsAdminUser])
    def convert(self,request,pk=None):
        from django.contrib.auth import get_user_model
        from django.utils.crypto import get_random_string
        from django.core.mail import send_mail
        from config.mongo import log_action
        from .models import ClientProfile
        User=get_user_model()
        prospect=self.get_object()
        if User.objects.filter(email=prospect.email).exists():
            return Response({"detail":"Compte existant pour cet email."},status=400)
        tmp=get_random_string(12)
        base=prospect.email.split("@")[0]; username=base; i=1
        while User.objects.filter(username=username).exists():
            username=f"{base}{i}"; i+=1
        user=User.objects.create_user(username=username,email=prospect.email,password=tmp)
        user.first_name=prospect.first_name; user.last_name=prospect.last_name
        user.is_staff=False; user.save()
        ClientProfile.objects.create(user=user,company=prospect.company,phone=prospect.phone)
        prospect.status=Prospect.Status.QUALIFIED
        prospect.save(update_fields=["status"])
        log_action("CREATION_CLIENT",request.user.id,{"client_id":user.id,"nom":f"{user.first_name} {user.last_name}","email":user.email})
        send_mail("Votre compte Innov'Events",
            f"Bonjour {user.first_name},\n\nLogin: {user.email}\nMot de passe: {tmp}\n\nModifiez-le à la première connexion.",
            None,[user.email],fail_silently=True)
        return Response({"user_id":user.id,"username":user.username,"email":user.email},status=201)

class QuoteViewSet(viewsets.ModelViewSet):
    queryset=Quote.objects.all().order_by("-created_at")
    serializer_class=QuoteSerializer

    def get_permissions(self):
        if self.action in ["accept","refuse","request_change","list","retrieve"]:
            return [IsAuthenticated()]
        return [IsAdminUser()]

    def get_queryset(self):
        qs=super().get_queryset()
        if not self.request.user.is_staff:
            qs=qs.filter(client=self.request.user)
        return qs

    @action(detail=True,methods=["post"])
    def accept(self,request,pk=None):
        from django.core.mail import send_mail
        q=self.get_object(); q.status=Quote.Status.ACCEPTED; q.save(update_fields=["status"])
        send_mail("Devis accepté",f"Le devis #{q.id} a été accepté par le client.",None,["contact@innovevents.com"],fail_silently=True)
        return Response({"status":q.status})

    @action(detail=True,methods=["post"])
    def refuse(self,request,pk=None):
        q=self.get_object(); q.status=Quote.Status.REFUSED; q.save(update_fields=["status"])
        return Response({"status":q.status})

    @action(detail=True,methods=["post"],url_path="request-change")
    def request_change(self,request,pk=None):
        q=self.get_object(); reason=request.data.get("reason","")
        q.status=Quote.Status.CHANGE_REQUESTED; q.save(update_fields=["status"])
        Note.objects.create(author=request.user,client=q.client,
                            content=f"[Modif devis #{q.id}] {reason}")
        return Response({"status":q.status})
    

    @action(detail=True,methods=["get"],url_path="pdf")
    def generate_pdf(self,request,pk=None):
        from django.http import HttpResponse
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import mm
        from config.mongo import log_action
        import io
        q=self.get_object()
        buf=io.BytesIO()
        c=canvas.Canvas(buf,pagesize=A4)
        w,h=A4
        c.setFont("Helvetica-Bold",20)
        c.drawString(20*mm,h-25*mm,"Innov'Events")
        c.setFont("Helvetica",11)
        c.drawString(20*mm,h-35*mm,f"Devis N° {q.id}   |   Date : {q.created_at.strftime('%d/%m/%Y')}")
        if q.client:
            c.drawString(20*mm,h-50*mm,f"Client : {q.client.first_name} {q.client.last_name} — {q.client.email}")
        c.setFont("Helvetica-Bold",12)
        c.drawString(20*mm,h-70*mm,"Prestations")
        c.setFont("Helvetica",11)
        y=h-82*mm
        for item in q.items.all():
            c.drawString(25*mm,y,f"• {item.label}")
            c.drawRightString(185*mm,y,f"{item.amount_ht} EUR HT")
            y-=8*mm
        y-=4*mm; c.line(20*mm,y,185*mm,y); y-=8*mm
        c.drawString(130*mm,y,"Total HT :"); c.drawRightString(185*mm,y,f"{q.total_ht} EUR")
        y-=8*mm
        c.drawString(130*mm,y,f"TVA ({int(q.tva_rate*100)}%) :"); c.drawRightString(185*mm,y,f"{q.total_tva} EUR")
        y-=8*mm
        c.setFont("Helvetica-Bold",12)
        c.drawString(130*mm,y,"Total TTC :"); c.drawRightString(185*mm,y,f"{q.total_ttc} EUR")
        c.save(); buf.seek(0)
        log_action("GENERATION_PDF_DEVIS",request.user.id,{"quote_id":q.id})
        res=HttpResponse(buf,content_type="application/pdf")
        res["Content-Disposition"]=f'attachment; filename="devis_{q.id}.pdf"'
        return res


class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.all().order_by("-created_at")
    serializer_class = NoteSerializer
    permission_classes = [IsAdminUser]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
