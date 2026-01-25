from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib.auth.decorators import login_required, user_passes_test
from django.http import JsonResponse
from django.core.mail import send_mail
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.hashers import make_password
from django.db.models import Sum
import razorpay
import random
import json

# Unified Imports: Use these names throughout the file
from .models import User, ContactMessage, DonationTransaction, Article, Event
from .forms import ContactForm, UserUpdateForm

# --- Helper: Admin Check ---
def is_admin(user):
    return user.is_staff or user.is_superuser

# --- 1. Navigation & Static Pages ---
def index(request): return render(request, 'frontend/index.html')
def about(request): return render(request, 'frontend/pages/about.html')
def education(request): return render(request, 'frontend/pages/education.html')
def blood_donation(request): return render(request, 'frontend/pages/blood-donation.html')
def social_awareness(request): return render(request, 'frontend/pages/socialawareness.html')
def events(request): return render(request, 'frontend/pages/events.html')
def support_mission(request): return render(request, 'frontend/pages/Supportourmission.html')
def disclaimer(request): return render(request, 'frontend/pages/disclaimer.html')
def privacy_policy(request): return render(request, 'frontend/pages/privacypolicy.html')
# yuva_app/views.py
def forgot_password_view(request):
    return render(request, 'frontend/pages/forgetPassword.html')

# --- 2. Contact Us (Cleaned) ---
def contact_view(request):
    if request.method == 'POST':
        form = ContactForm(request.POST)
        if form.is_valid():
            try:
                contact_msg = form.save()
                subject = f"New Contact Message from {contact_msg.first_name}"
                message = f"Name: {contact_msg.first_name} {contact_msg.last_name}\nEmail: {contact_msg.email}\nPhone: {contact_msg.phone}\nMessage: {contact_msg.message}"
                send_mail(subject, message, settings.EMAIL_HOST_USER, [settings.EMAIL_HOST_USER], fail_silently=False)
                return JsonResponse({'status': 'success', 'message': 'Successfully contacted!'})
            except Exception as e:
                return JsonResponse({'status': 'success', 'message': 'Saved, but email notification failed.'})
        return JsonResponse({'status': 'error', 'message': 'Invalid form data.'})
    return render(request, 'frontend/pages/contact.html')

# --- 3. Registration Flow (Merged & Fixed) ---
def send_otp(request):
    if request.method == 'POST':
        email = request.POST.get('email') or request.POST.get('target')
        if not email: return JsonResponse({'status': 'error', 'message': 'Email required'})
        
        otp = random.randint(1000, 9999)
        request.session['otp'] = str(otp)
        request.session['reg_email'] = email
        
        try:
            send_mail('YUVA Verification OTP', f'Your OTP is: {otp}', settings.EMAIL_HOST_USER, [email], fail_silently=False)
            return JsonResponse({'status': 'success', 'message': 'OTP sent successfully'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': 'Mail Error: ' + str(e)})
    return JsonResponse({'status': 'error', 'message': 'Invalid Method'})

def verify_otp(request):
    if request.method == 'POST':
        entered_otp = request.POST.get('otp')
        saved_otp = request.session.get('otp')
        if entered_otp and str(entered_otp) == str(saved_otp):
            request.session['is_verified'] = True
            return JsonResponse({'status': 'success', 'message': 'OTP Verified'})
        return JsonResponse({'status': 'error', 'message': 'Invalid OTP'})
    return JsonResponse({'status': 'error', 'message': 'Invalid Method'})

def create_account(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        phone = request.POST.get('phone')
        
        # Check duplicates
        if User.objects.filter(email=email).exists():
            return JsonResponse({'status': 'error', 'message': 'Email already registered.'})
        if User.objects.filter(phone_number=phone).exists():
            return JsonResponse({'status': 'error', 'message': 'Phone already registered.'})

        try:
            user = User.objects.create(
                username=email,
                email=email,
                first_name=request.POST.get('firstname'),
                last_name=request.POST.get('lastname'),
                phone_number=phone,
                dob=request.POST.get('dob'),
                gender=request.POST.get('gender'),
                blood_group=request.POST.get('bloodgrp'),
                address=request.POST.get('address'),
                account_status=request.POST.get('status', 'active'),
                password=make_password(request.POST.get('password'))
            )
            user.save()
            login(request, user)
            return JsonResponse({'status': 'success', 'message': 'Account created!'})
        except Exception as e:
            print(f"DB Error: {e}")
            return JsonResponse({'status': 'error', 'message': f'Server Error: {str(e)}'})
    return JsonResponse({'status': 'error', 'message': 'Invalid Request'})

# --- 4. Login/Logout ---
def login_view(request):
    if request.method == 'POST':
        role = request.POST.get('role')
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            if role == 'admin' and not user.is_staff:
                 return render(request, 'frontend/pages/adminlogin.html', {'error': 'Not authorized as Admin'})
            login(request, user)
            return redirect('admin_dashboard' if user.is_staff else 'user_profile')
        return render(request, 'frontend/pages/adminlogin.html', {'error': 'Invalid Credentials'})
    return render(request, 'frontend/pages/adminlogin.html')

def logout_view(request):
    logout(request)
    return redirect('index')

# --- 5. User Profile ---
@login_required
def user_profile(request):
    user_donations = DonationTransaction.objects.filter(email=request.user.email, status='Success').aggregate(Sum('amount'))
    total_donated = user_donations['amount__sum'] or 0

    if request.method == 'POST':
        # You MUST include request.FILES to capture the profile picture upload
        form = UserUpdateForm(request.POST, request.FILES, instance=request.user)
        if form.is_valid():
            form.save()
            return redirect('user_profile')
    else:
        form = UserUpdateForm(instance=request.user)

    return render(request, 'frontend/pages/membership-profile.html', {
        'user': request.user, 
        'total_donated': total_donated,
        'form': form # VITAL: Pass the form back to the template
    })    # Fetch donation sum for the impact section
    user_donations = DonationTransaction.objects.filter(email=request.user.email, status='Success').aggregate(Sum('amount'))
    total_donated = user_donations['amount__sum'] or 0

    if request.method == 'POST':
        # VITAL: You must include request.FILES to handle the profile picture upload
        form = UserUpdateForm(request.POST, request.FILES, instance=request.user)
        if form.is_valid():
            form.save()
            return redirect('user_profile')
    else:
        # Pre-fill the form with existing user data for GET requests
        form = UserUpdateForm(instance=request.user)

    # Fallback return: This ensures an HttpResponse is ALWAYS returned
    return render(request, 'frontend/pages/membership-profile.html', {
        'user': request.user, 
        'total_donated': total_donated,
        'form': form
    })
@login_required
def change_password(request):
    if request.method == 'POST':
        new_p = request.POST.get('new_password')
        conf_p = request.POST.get('confirm_password')
        if new_p and new_p == conf_p:
            request.user.set_password(new_p)
            request.user.save()
            update_session_auth_hash(request, request.user)
            return JsonResponse({'status': 'success'})
    return JsonResponse({'status': 'error', 'message': 'Update failed'})

# --- 6. Admin Dashboard ---
@login_required
@user_passes_test(is_admin)
def admin_dashboard(request):
    users = User.objects.filter(is_staff=False)
    transactions = DonationTransaction.objects.all().order_by('-created_at')
    total_donations = transactions.filter(status='Success').aggregate(Sum('amount'))['amount__sum'] or 0
    context = {
        'users': users, 'transactions': transactions,
        'total_donations': total_donations, 'users_count': users.count()
    }
    return render(request, 'frontend/pages/admin-dashboard.html', context)

@login_required
@user_passes_test(is_admin)
def delete_user(request, user_id):
    user = get_object_or_404(User, id=user_id)
    if not user.is_superuser: user.delete()
    return redirect('admin_dashboard')

# --- 7. Donations (Razorpay) ---
client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

@csrf_exempt
def initiate_payment(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            amount = int(float(data.get('amount'))) * 100
            order = client.order.create(data={"amount": amount, "currency": "INR", "receipt": "rcpt_1"})
            return JsonResponse({'order_id': order['id'], 'amount': amount, 'currency': 'INR', 'key_id': settings.RAZORPAY_KEY_ID})
        except Exception as e: return JsonResponse({'error': str(e)})
    return JsonResponse({'error': 'Invalid method'})

@csrf_exempt
def payment_success(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            client.utility.verify_payment_signature(data)
            DonationTransaction.objects.create(donor_name="Online Donor", amount=0, status='Success')
            return JsonResponse({'status': 'success'})
        except Exception as e: return JsonResponse({'status': 'error', 'message': str(e)})
    return JsonResponse({'status': 'error'})

# --- 8. Content API ---
def get_content(request):
    articles = list(Article.objects.values('id', 'title', 'content', 'image', 'created_at'))
    events = list(Event.objects.values('id', 'title', 'description', 'date', 'image', 'created_at'))
    for item in articles + events:
        if item.get('image'): item['image'] = settings.MEDIA_URL + item['image']
    return JsonResponse({'articles': articles, 'events': events})

def add_article(request):
    if request.method == "POST":
        title = request.POST.get('title')
        content = request.POST.get('content')
        image = request.FILES.get('image')
        
        Article.objects.create(title=title, content=content, image=image)
        return JsonResponse({'status': 'success'})
    return JsonResponse({'status': 'failed'}, status=400)

def add_event(request):
    if request.method == "POST":
        title = request.POST.get('title')
        date = request.POST.get('date')
        description = request.POST.get('description')
        image = request.FILES.get('image')
        
        Event.objects.create(title=title, date=date, description=description, image=image)
        return JsonResponse({'status': 'success'})
    return JsonResponse({'status': 'failed'}, status=400)
def delete_content(request, type, id):
    if not request.user.is_staff: return JsonResponse({'status': 'error'})
    model = Article if type == 'article' else Event
    get_object_or_404(model, id=id).delete()
    return JsonResponse({'status': 'success'})

@login_required
@user_passes_test(is_admin)
def admin_dashboard(request):
    users = User.objects.filter(is_staff=False)
    donations_query = DonationTransaction.objects.filter(status='Success')
    total_donated = donations_query.aggregate(Sum('amount'))['amount__sum'] or 0
    
    # Passing the exact variable names your HTML template expects
    context = {
        'members': users,
        'members_count': users.count(),
        'events_count': Event.objects.count(),
        'articles_count': Article.objects.count(),
        'donations_total': total_donated,
        'transactions': DonationTransaction.objects.all().order_by('-created_at')[:10],
    }
    return render(request, 'frontend/pages/admin-dashboard.html', context)
#forgot password

def send_reset_otp(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        if not email: 
            return JsonResponse({'status': 'error', 'message': 'Email required'})
        
        # Security: Only send if the user exists
        if not User.objects.filter(email__iexact=email).exists():
            return JsonResponse({'status': 'error', 'message': 'No account found with this email.'})
        
        otp = random.randint(1000, 9999)
        request.session['otp'] = str(otp)
        request.session['reset_email'] = email  # Key for Step 3
        
        try:
            send_mail(
                'YUVA Password Reset', 
                f'Your password reset code is: {otp}', 
                settings.EMAIL_HOST_USER, 
                [email], 
                fail_silently=False
            )
            return JsonResponse({'status': 'success', 'message': 'Reset OTP sent successfully'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': 'Mail Error: ' + str(e)})
    return JsonResponse({'status': 'error', 'message': 'Invalid Method'})

def verify_reset_otp(request):
    if request.method == 'POST':
        entered_otp = request.POST.get('otp')
        saved_otp = request.session.get('otp')
        
        if entered_otp and str(entered_otp) == str(saved_otp):
            # Mark the session as 'reset_verified' so the user can change password
            request.session['reset_verified'] = True
            return JsonResponse({'status': 'success', 'message': 'OTP Verified. Proceed to reset password.'})
            
        return JsonResponse({'status': 'error', 'message': 'Invalid OTP'})
    return JsonResponse({'status': 'error', 'message': 'Invalid Method'})

def finalize_password_reset(request):
    # This will now find the email because we updated send_otp above
    email = request.session.get('reset_email')
    print(f"DEBUG: Session Email is {email}") 

    if request.method == 'POST':
        if not request.session.get('reset_verified'):
            return JsonResponse({'status': 'error', 'message': 'Session expired or not verified.'})

        new_password = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')

        if not new_password or new_password != confirm_password:
            return JsonResponse({'status': 'error', 'message': 'Passwords do not match.'})

        if not email:
            return JsonResponse({'status': 'error', 'message': 'User email not found in session.'})

        try:
            # Use iexact to avoid case-sensitivity issues (e.g., User@Gmail.com)
            user = User.objects.get(email__iexact=email)
            user.set_password(new_password)
            user.save()
            
            # Clean up session safely
            request.session.pop('otp', None)
            request.session.pop('reset_email', None)
            request.session.pop('reset_verified', None)
            request.session.pop('reg_email', None)
            
            return JsonResponse({'status': 'success', 'message': 'Password reset successful! Please login.'})
        except User.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'User not found in database.'})
            
    return JsonResponse({'status': 'error', 'message': 'Invalid Method'})
