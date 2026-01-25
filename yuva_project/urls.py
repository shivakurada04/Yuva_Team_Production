from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from yuva_app import views 
from django.contrib.auth import views as auth_views

urlpatterns = [
    # --- Django Default Admin ---
    path('django-admin/', admin.site.urls),

    # --- Main Website Pages ---
    path('', views.index, name='index'),                           # Home Page
    path('about/', views.about, name='about'),                     # About Us
    path('education/', views.education, name='education'),         # Education Page
    path('blood-donation/', views.blood_donation, name='blood_donation'), # Blood Donation
    path('social-awareness/', views.social_awareness, name='social_awareness'), # Social Awareness
    path('events/', views.events, name='events'),                  # Events Page
    path('support/', views.support_mission, name='support'),       # Support/Donate Page
    path('contact/', views.contact_view, name='contact'),          # Contact Us

    # --- Footer/Legal Pages ---
    path('disclaimer/', views.disclaimer, name='disclaimer'),
    path('privacy-policy/', views.privacy_policy, name='privacy_policy'),

    # --- Authentication (Login/Logout) ---
    path('login/', views.login_view, name='login'),    
    # --- Member Profile ---
    path('profile/', views.user_profile, name='user_profile'),
    
    # --- Admin Custom Dashboard ---
    path('admin-dashboard/', views.admin_dashboard, name='admin_dashboard'),
    path('admin/delete-user/<int:user_id>/', views.delete_user, name='delete_user'),
    
    # --- Registration API (For OTP & Account Creation) ---
    path('api/send-otp/', views.send_otp, name='send_otp'),
    path('api/verify-otp/', views.verify_otp, name='verify_otp'),
    path('api/create-account/', views.create_account, name='create_account'),
    path('logout/', auth_views.LogoutView.as_view(next_page='index'), name='logout'),
    # --- Payments (Razorpay) ---
    path('donate/pay/', views.initiate_payment, name='initiate_payment'),
    path('donate/success/', views.payment_success, name='payment_success'),
    # API Paths for Content
    path('api/content/get/', views.get_content, name='get_content'),
    path('api/article/add/', views.add_article, name='add_article'),
    path('api/event/add/', views.add_event, name='add_event'),
    path('api/delete/<str:type>/<int:id>/', views.delete_content, name='delete_content'),
    path('api/change-password/', views.change_password, name='change_password'),
    path('forgot-password/', views.forgot_password_view, name='forgetPassword'),
    path('api/verify-reset-otp/', views.verify_reset_otp, name='verify_reset_otp'),
    path('api/finalize-reset/', views.finalize_reset, name='finalize_reset'),

]

# --- Media Files Configuration (for Profile Pics) ---
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
