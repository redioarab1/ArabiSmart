// تسجيل Service Worker لـ PWA
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered successfully:', registration.scope);
          
          // التحقق من التحديثات
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Service Worker جديد متاح
                  console.log('[PWA] New content is available; please refresh.');
                  
                  // يمكن إضافة notification للمستخدم هنا
                  if (confirm('تحديث جديد متاح! هل تريد تحديث الصفحة؟')) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
    });

    // إعادة تحميل الصفحة عند تفعيل Service Worker جديد
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }
}

// طلب إذن الإشعارات (اختياري)
export async function requestNotificationPermission() {
  if ('Notification' in window && 'serviceWorker' in navigator) {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('[PWA] Notification permission granted');
      return true;
    } else {
      console.log('[PWA] Notification permission denied');
      return false;
    }
  }
  return false;
}

// التحقق من إمكانية التثبيت
export function checkInstallability() {
  let deferredPrompt: any;

  window.addEventListener('beforeinstallprompt', (e) => {
    // منع ظهور prompt التلقائي
    e.preventDefault();
    // حفظ الحدث لاستخدامه لاحقاً
    deferredPrompt = e;
    console.log('[PWA] App is installable');
    
    // يمكن إضافة زر "تثبيت التطبيق" هنا
    showInstallButton(deferredPrompt);
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App was installed');
    deferredPrompt = null;
  });
}

// عرض زر التثبيت (يمكن تخصيصه)
function showInstallButton(deferredPrompt: any) {
  // يمكن إضافة UI لزر التثبيت هنا
  // مثال:
  // const installButton = document.getElementById('install-button');
  // if (installButton) {
  //   installButton.style.display = 'block';
  //   installButton.addEventListener('click', async () => {
  //     deferredPrompt.prompt();
  //     const { outcome } = await deferredPrompt.userChoice;
  //     console.log(`User response to the install prompt: ${outcome}`);
  //     deferredPrompt = null;
  //   });
  // }
}
