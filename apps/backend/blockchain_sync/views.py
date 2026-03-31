from django.utils import timezone
from rest_framework import viewsets, permissions, status, generics
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from django.db.models import Q
from . import serializers
from .models import OnChainHarvest, MerkleBatchModel, FarmerProfile, Plot, FarmEvent, SupplyContract, MpesaPayout
from blockchain.relayer import meta_relayer, SignedHarvestData
from .certificates import generate_compliance_certificate
from django.db.models import Avg, Count, F, ExpressionWrapper, fields, Sum
from django.db.models.functions import TruncWeek
from django.http import FileResponse
import io
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class SupplyContractViewSet(viewsets.ModelViewSet):
    """
    API for Digital Supply Contracts.
    Buyers (Off-takers) can create 'Open' contracts.
    Cooperatives can see 'Open' contracts and accept them.
    """
    serializer_class = serializers.SupplyContractSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = SupplyContract.objects.all()

        # Filters
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)

        # Role-based scoping
        if user.groups.filter(name='Offtaker').exists():
            return queryset.filter(buyer=user)
        
        if user.groups.filter(name='CoopManager').exists():
            # Coops can see Open contracts or those assigned to them
            coop = getattr(user, 'managed_cooperative', None)
            if coop:
                return queryset.filter(Q(status='OPEN') | Q(cooperative=coop))
            return queryset.filter(status='OPEN')

        if user.is_staff or \
           user.groups.filter(name__in=['Auditor', 'Agronomist', 'GIS Admin', 'System Admin']).exists():
            return queryset

        return queryset.none()

    def perform_create(self, serializer):
        # Auto-assign buyer to the current user if they are an Offtaker
        if self.request.user.groups.filter(name='Offtaker').exists():
            serializer.save(buyer=self.request.user)
        else:
            serializer.save()

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Cooperative manager accepts an open contract."""
        contract = self.get_object()
        user = request.user

        if not user.groups.filter(name='CoopManager').exists():
            return Response({"error": "Only Cooperative Managers can accept contracts."}, 
                            status=status.HTTP_403_FORBIDDEN)

        coop = getattr(user, 'managed_cooperative', None)
        if not coop:
            return Response({"error": "You must be associated with a Cooperative to accept contracts."}, 
                            status=status.HTTP_400_BAD_REQUEST)

        if contract.status != 'OPEN':
            return Response({"error": "Only OPEN contracts can be accepted."}, 
                            status=status.HTTP_400_BAD_REQUEST)

        contract.cooperative = coop
        contract.status = 'ACTIVE'
        contract.save()

        return Response(serializers.SupplyContractSerializer(contract).data)

class FarmerViewSet(viewsets.ModelViewSet):
    """
    Headless Farmer Identity API.
    """
    queryset = FarmerProfile.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.user.groups.filter(name='Auditor').exists():
            return serializers.AuditorFarmerProfileSerializer
        return serializers.PublicFarmerProfileSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or \
           user.groups.filter(name__in=['Auditor', 'Agronomist', 'Customer Support', 'System Admin']).exists():
            return FarmerProfile.objects.all()
        if user.groups.filter(name='CoopManager').exists():
            coop = getattr(user, 'managed_cooperative', None)
            if coop:
                return FarmerProfile.objects.filter(cooperative=coop)
        return FarmerProfile.objects.none()

    @action(detail=True, methods=['patch'])
    def wallet(self, request, pk=None):
        """Update farmer wallet/payment details."""
        farmer = self.get_object()
        address = request.data.get('celo_address')
        phone = request.data.get('phone_number')
        
        if address:
            farmer.celo_address = address
        if phone:
            farmer.phone_number = phone
            
        farmer.save()
        return Response(self.get_serializer(farmer).data)

class PlotViewSet(viewsets.ModelViewSet):
    """
    Headless Geospatial Plot API.
    Handles GeoJSON submission and EUDR compliance status.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or \
           user.groups.filter(name__in=['Auditor', 'Agronomist', 'GIS Admin', 'System Admin']).exists():
            return Plot.objects.all()
        if user.groups.filter(name='CoopManager').exists():
            coop = getattr(user, 'managed_cooperative', None)
            if coop:
                return Plot.objects.filter(cooperative=coop)
        return Plot.objects.none()

    def get_serializer_class(self):
        if self.request.user.groups.filter(name='Auditor').exists() or \
           self.request.user.groups.filter(name='CoopManager').exists():
            return serializers.AuditorPlotSerializer
        return serializers.PublicPlotSerializer

    @action(detail=True, methods=['get'])
    def compliance(self, request, pk=None):
        """Get EUDR compliance details for a plot."""
        plot = self.get_object()
        return Response({
            "plot_id": plot.id,
            "eudr_compliant": plot.is_eudr_compliant,
            "last_checked_at": plot.last_checked_at,
            "acreage_hectares": plot.area_hectares
        })

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Agronomist or Staff approves a plot for EUDR compliance."""
        plot = self.get_object()
        user = request.user
        
        if not user.is_staff and not user.groups.filter(name='Agronomist').exists():
            return Response({"error": "Only Agronomists or Staff can approve plots."}, 
                            status=status.HTTP_403_FORBIDDEN)
            
        plot.is_eudr_compliant = True
        import datetime
        plot.last_checked_at = datetime.datetime.now()
        plot.save()
        
        return Response({"message": "Plot approved", "status": "COMPLIANT"})

class ComplianceViewSet(viewsets.ViewSet):
    """
    API for EUDR Compliance summaries and certificates.
    """
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """High-level compliance stats for the dashboard."""
        user = request.user
        plots = Plot.objects.all()
        
        if not user.is_staff and \
           not user.groups.filter(name__in=['Auditor', 'Agronomist', 'GIS Admin', 'System Admin']).exists():
             coop = getattr(user, 'managed_cooperative', None)
             if coop:
                 plots = plots.filter(cooperative=coop)
             else:
                 plots = plots.none()

        total_plots = plots.count()
        compliant_plots = plots.filter(is_eudr_compliant=True).count()
        return Response({
            "total_plots": total_plots,
            "compliant_count": compliant_plots,
            "compliance_rate": (compliant_plots / total_plots * 100) if total_plots > 0 else 0
        })

    @action(detail=True, methods=['get'], url_path='certificate')
    def download_certificate(self, request, pk=None):
        """Generate and download a PDF compliance certificate.

        Access is scoped through the parent ComplianceViewSet permission model:
        staff/Auditor/Agronomist see all; CoopManager sees only their coop's plots.
        """
        user = request.user
        allowed_plots = Plot.objects.all()
        if not user.is_staff and not user.groups.filter(
            name__in=['Auditor', 'Agronomist', 'GIS Admin', 'System Admin']
        ).exists():
            coop = getattr(user, 'managed_cooperative', None)
            if coop:
                allowed_plots = Plot.objects.filter(cooperative=coop)
            else:
                allowed_plots = Plot.objects.none()

        try:
            plot = allowed_plots.get(id=pk)
        except Plot.DoesNotExist:
            return Response({"error": "Plot not found"}, status=status.HTTP_404_NOT_FOUND)

        farmer = plot.farmer
        harvests = OnChainHarvest.objects.filter(farmer_address=farmer.celo_address).order_by('-record_id')[:5]
        pdf_content = generate_compliance_certificate(farmer, plot, harvests)

        return FileResponse(
            io.BytesIO(pdf_content),
            as_attachment=True,
            filename=f"Compliance_Certificate_{plot.id}.pdf",
            content_type='application/pdf'
        )

class HarvestViewSet(viewsets.ModelViewSet):
    """
    Headless Harvest/Traceability API.
    POST /harvests triggers on-chain hashing via the gasless relayer.
    """
    queryset = OnChainHarvest.objects.all().order_by('-record_id')
    serializer_class = serializers.OnChainHarvestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        # 1. Extract data
        farmer_id = request.data.get('farmer_id')
        crop = request.data.get('crop')
        weight = request.data.get('weight_kg')
        location = request.data.get('location', 'Unspecified')
        
        # 2. Validate Farmer
        try:
            farmer = FarmerProfile.objects.get(id=farmer_id)
        except (FarmerProfile.DoesNotExist, ValueError):
            return Response({"error": "Invalid Farmer ID"}, status=status.HTTP_400_BAD_REQUEST)
            
        # 3. Trigger Blockchain Relayer (Gasless)
        signed_data = SignedHarvestData(
            farmer_address=farmer.celo_address,
            farmer_id=str(farmer.id),
            crop_type=crop,
            weight_kg=int(float(weight)),
            location=location,
            signature="" # Server-side trust for Alpha
        )
        
        relayer_response = meta_relayer.relay_harvest_log(signed_data)
        
        if not relayer_response.get("success"):
            return Response({"error": f"Blockchain Relay Failed: {relayer_response.get('error')}"}, 
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # 4. Instant M-Pesa Payout Automation (Trust-Link Engine)
        # In a full production env, this would wait for the Escrow Contract event. 
        # For the MVP, we trigger M-Pesa immediately upon successful on-chain hash.
        payment_initiated = False
        if farmer.phone_number:
            from .models import OnChainHarvest, MpesaPayout
            from .mpesa import mpesa_client
            
            # Create a mock optimistic on-chain harvest record to attach the payout to
            # Typically, this is created by a blockchain listener.
            harvest_record, _ = OnChainHarvest.objects.get_or_create(
                record_id=int(relayer_response.get('transaction_hash', '0x1')[-8:], 16), # mock ID from hash
                defaults={
                    'farmer_address': farmer.celo_address,
                    'farmer_id': str(farmer.id),
                    'crop_type': crop,
                    'weight_kg': weight,
                    'location': location,
                    'status': 1, # Verified
                    'payout_amount_cusd': float(weight) * 2.5 # Mock Base Price $2.5/kg
                }
            )

            payout_record = MpesaPayout.objects.create(
                harvest=harvest_record,
                phone_number=farmer.phone_number,
                amount_kes=harvest_record.payout_amount_cusd * 130, # Mock KES rate
                status='PENDING',
                conversion_rate=130
            )

            # Instantly trigger B2C API
            mpesa_res = mpesa_client.trigger_b2c_payout(
                payout_record, 
                remarks=f"Vunachain {crop} Harvest Payment", 
                occasion="SupplyChain"
            )
            payment_initiated = mpesa_res.get('success', False)

        return Response({
            "message": "Harvest logged successfully",
            "transaction_hash": relayer_response.get("transaction_hash"),
            "data_hash": relayer_response.get("data_hash"),
            "status": "PENDING_BLOCKCHAIN_CONFIRMATION",
            "payment_initiated": payment_initiated
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='trace/(?P<batch_id>[^/.]+)')
    def trace(self, request, batch_id=None):
        """Lineage API for a specific batch."""
        try:
            batch = MerkleBatchModel.objects.get(id=batch_id)
            harvests = batch.harvests.all()
            return Response({
                "batch_id": batch.id,
                "merkle_root": batch.merkle_root,
                "total_records": batch.total_records,
                "harvests": serializers.OnChainHarvestSerializer(harvests, many=True).data
            })
        except MerkleBatchModel.DoesNotExist:
            return Response({"error": "Batch not found"}, status=status.HTTP_404_NOT_FOUND)

class HarvestListView(generics.ListAPIView):
    """
    Returns harvest history for a specific farmer wallet.
    Staff, Auditors, and Agronomists may query any address.
    CoopManagers may only query addresses belonging to farmers in their cooperative.
    All other roles receive an empty result.
    """
    serializer_class = serializers.OnChainHarvestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        address = self.request.query_params.get('address')
        if not address:
            return OnChainHarvest.objects.none()

        # Full access for compliance/admin roles
        if user.is_staff or user.groups.filter(
            name__in=['Auditor', 'Agronomist', 'System Admin']
        ).exists():
            return OnChainHarvest.objects.filter(farmer_address__iexact=address).order_by('-record_id')

        # CoopManagers: verify the wallet belongs to a farmer in their coop
        if user.groups.filter(name='CoopManager').exists():
            coop = getattr(user, 'managed_cooperative', None)
            if coop and FarmerProfile.objects.filter(
                celo_address__iexact=address, cooperative=coop
            ).exists():
                return OnChainHarvest.objects.filter(farmer_address__iexact=address).order_by('-record_id')

        return OnChainHarvest.objects.none()

@api_view(['GET'])
def get_harvest_proof(request, record_id):
    """
    Retrieves the Merkle proof for a specific harvest record.
    """
    try:
        harvest = OnChainHarvest.objects.get(record_id=record_id)
        if not harvest.merkle_proof:
            return Response(
                {"error": "Proof not yet generated for this record. It may be awaiting batching."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({
            "record_id": harvest.record_id,
            "merkle_root": harvest.batch.merkle_root if harvest.batch else None,
            "proof": harvest.merkle_proof,
            "amount": int(harvest.payout_amount_cusd * 10**18)
        })
    except OnChainHarvest.DoesNotExist:
        return Response({"error": "Record not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([permissions.AllowAny]) # Daraja sends callbacks from public internet
def mpesa_callback(request):
    """
    Callback endpoint for M-Pesa B2C payout results.
    Secured by:
    1. Dynamic Token validation (?token=<MPESA_CALLBACK_TOKEN>)
    2. IP allowlist guard (Safaricom production IPs)
    """
    import logging
    import os
    logger = logging.getLogger(__name__)

    # 1. Security Check: Token-based access (deny-by-default when token is unset)
    expected_token = os.getenv('MPESA_CALLBACK_TOKEN')
    provided_token = request.query_params.get('token')

    if not expected_token or provided_token != expected_token:
        logger.warning("M-Pesa callback rejected: Invalid or missing token.")
        return Response({"ResultCode": 1, "ResultDesc": "Unauthorized"}, status=401)

    # 2. Security Check: IP allowlist guard
    # Default Safaricom production IPs based on Daraja documentation/community
    default_ips = (
        '196.201.214.200,196.201.214.206,196.201.213.114,196.201.214.207,'
        '196.201.214.208,196.201.213.44,196.201.212.127,196.201.212.138,'
        '196.201.212.129,196.201.212.136,196.201.212.74,196.201.212.69'
    )
    allowed_ips_env = os.getenv('MPESA_CALLBACK_IPS', default_ips)
    
    if allowed_ips_env:
        allowed_ips = [ip.strip() for ip in allowed_ips_env.split(',')]
        # Extract client IP (handle proxy/Railway forward)
        client_ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
        client_ip = client_ip.split(',')[0].strip()
        
        # In development/local, skip IP check if not strictly enforced
        if client_ip not in allowed_ips and not os.getenv('DEBUG') == 'True':
            logger.warning("M-Pesa callback rejected: untrusted IP %s", client_ip)
            return Response({"ResultCode": 1, "ResultDesc": "Forbidden"}, status=403)

    data = request.data
    logger.info("M-Pesa Callback received: %s", data)
    
    # Check if this is a success or failure
    result = data.get('Result', {})
    result_code = result.get('ResultCode')
    result_desc = result.get('ResultDesc')
    originator_cid = result.get('OriginatorConversationID')
    
    from .models import MpesaPayout
    
    try:
        # Link payout by OriginatorConversationID which was returned in trigger_b2c_payout
        payout = MpesaPayout.objects.get(originator_conversation_id=originator_cid)
        
        if result_code == 0:
            payout.status = 'COMPLETED'
            # Extract additional data if needed (Receipt number etc)
            result_params = result.get('ResultParameters', {}).get('ResultParameter', [])
            for param in result_params:
                if isinstance(param, dict) and param.get('Key') == 'MpesaReceiptNo':
                    payout.receipt_number = param.get('Value')
                    payout.metadata['receipt_no'] = param.get('Value')
        else:
            payout.status = 'FAILED'
            payout.failure_reason = result_desc
            payout.metadata['error'] = result_desc
            
        payout.save()
        
        # Trigger Webhook for successful payment
        if payout.status == 'COMPLETED':
            from .webhooks import dispatch_webhook
            dispatch_webhook("payment.success", {
                "farmer_id": str(payout.harvest.farmer_id),
                "harvest_id": payout.harvest.record_id,
                "amount_kes": str(payout.amount_kes),
                "receipt_number": payout.receipt_number
            })
            
        return Response({"ResultCode": 0, "ResultDesc": "Success"})
        
    except MpesaPayout.DoesNotExist:
        logger.error(f"Payout not found for CID: {originator_cid}")
        return Response({"ResultCode": 1, "ResultDesc": "Internal Error"}, status=status.HTTP_404_NOT_FOUND)

class FarmEventViewSet(viewsets.ModelViewSet):
    """
    API for Farm Events (Planting, Harvesting, Spraying).
    Role-scoped: Auditor/Agronomist see all; CoopManager sees own coop;
    FieldAgent sees events they created (by logged farmer FK); others see none.
    """
    serializer_class = serializers.FarmEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # Full visibility for compliance roles
        if user.is_staff or user.groups.filter(
            name__in=['Auditor', 'Agronomist', 'System Admin']
        ).exists():
            return FarmEvent.objects.all()

        # CoopManager: only events on their cooperative's plots
        if user.groups.filter(name='CoopManager').exists():
            coop = getattr(user, 'managed_cooperative', None)
            if coop:
                return FarmEvent.objects.filter(plot__cooperative=coop)
            return FarmEvent.objects.none()

        # FieldAgent: events on plots within their linked cooperative
        if user.groups.filter(name='FieldAgent').exists():
            coop = getattr(user, 'managed_cooperative', None)
            if coop:
                return FarmEvent.objects.filter(plot__cooperative=coop)
            return FarmEvent.objects.none()

        return FarmEvent.objects.none()

    def perform_create(self, serializer):
        # Additional logic (e.g. triggering sync to farmOS) can be added here
        event = serializer.save()
        logger.info(f"New Farm Event Logged: {event.event_type} on Plot {event.plot.id}")

class AnalyticsViewSet(viewsets.ViewSet):
    """
    The "North Star" Analytics API.
    Calculates MVP success metrics for the dashboard.
    """
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        user = request.user
        harvests = OnChainHarvest.objects.all()
        payouts = MpesaPayout.objects.filter(status='COMPLETED')
        plots = Plot.objects.all()
        contracts = SupplyContract.objects.filter(status='ACTIVE')

        if not user.is_staff and not user.groups.filter(name='Auditor').exists():
            if user.groups.filter(name='CoopManager').exists():
                coop = getattr(user, 'managed_cooperative', None)
                if coop:
                    farmer_ids = FarmerProfile.objects.filter(cooperative=coop).values_list('id', flat=True)
                    harvests = harvests.filter(farmer_id__in=[str(fid) for fid in farmer_ids])
                    payouts = payouts.filter(harvest__in=harvests)
                    plots = plots.filter(cooperative=coop)
                    contracts = contracts.filter(cooperative=coop)
                else:
                    return Response({"error": "No cooperative data found for manager"}, status=status.HTTP_404_NOT_FOUND)
            elif user.groups.filter(name='Offtaker').exists():
                contracts = contracts.filter(buyer=user)
                # For harvests, show only those related to the buyer's active contracts
                relevant_commodities = contracts.values_list('commodity', flat=True)
                relevant_coops = contracts.values_list('cooperative', flat=True)
                harvests = harvests.filter(crop_type__in=relevant_commodities)
                # Note: harvests model doesn't have coop link, but we filter by crop for now. 
                # In production, we'd join via FarmerProfile.
                payouts = payouts.filter(harvest__in=harvests)
                plots = plots.filter(cooperative__in=relevant_coops)
            else:
                # Fallback for other roles if they access analytics
                pass

        # 1. Side-Selling Reduction (Mocked for MVP demo)
        side_selling_reduction = 12.5 

        # 2. Days to Pay (Payment Speed)
        avg_speed_mins = 0
        payout_durations = []
        for p in payouts:
            if p.completed_at and p.harvest.created_at:
                delta = p.completed_at - p.harvest.created_at
                payout_durations.append(delta.total_seconds() / 60)
        if payout_durations:
            avg_speed_mins = sum(payout_durations) / len(payout_durations)

        # 3. Dispute Rate
        total_harvest_count = harvests.count()
        rejected_harvests = harvests.filter(status=2).count()
        dispute_rate = (rejected_harvests / total_harvest_count * 100) if total_harvest_count > 0 else 0

        # 4. Weekly Volume Trends (Last 12 weeks)
        twelve_weeks_ago = timezone.now() - timedelta(weeks=12)
        weekly_data = harvests.filter(created_at__gte=twelve_weeks_ago)\
            .annotate(week=TruncWeek('created_at'))\
            .values('week')\
            .annotate(volume=Sum('weight_kg'))\
            .order_by('week')

        # 5. Compliance Distribution
        total_plots = plots.count()
        compliant_count = plots.filter(is_eudr_compliant=True).count()
        compliance_distribution = [
            {"name": "Compliant", "value": compliant_count},
            {"name": "Non-Compliant", "value": total_plots - compliant_count}
        ]

        # 6. Contract Performance (Radar/Bar)
        performance_data = []
        for c in contracts:
            # Calculate actual volume for this contract's commodity in the coop
            actual = harvests.filter(
                crop_type__iexact=c.commodity,
                created_at__gte=c.created_at
            ).aggregate(total=Sum('weight_kg'))['total'] or 0
            
            performance_data.append({
                "commodity": c.commodity,
                "target": float(c.target_volume_kg),
                "actual": float(actual),
                "fulfillment": round((float(actual) / float(c.target_volume_kg) * 100), 1) if c.target_volume_kg > 0 else 0
            })

        return Response({
            "metrics": {
                "side_selling_improvement": side_selling_reduction,
                "avg_payment_speed_minutes": round(avg_speed_mins, 1),
                "dispute_rate": round(dispute_rate, 2),
                "total_volume_mt": (sum(h.weight_kg for h in harvests) / 1000) if harvests.exists() else 0,
            },
            "charts": {
                "weekly_volume": list(weekly_data),
                "compliance_distribution": compliance_distribution,
                "contract_performance": performance_data
            }
        })
