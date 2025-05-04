<template>
  <div id="app">
    <div v-if="loading" class="app-loading">
      <div class="spinner"></div>
      <div class="brand">METS</div>
      <div class="loading-text">{{ loadingMessage }}</div>
    </div>
    <router-view v-else />
    
    <!-- AI Chatbot Bileşenleri -->
    <AIChatbotButton v-if="isAuthenticated" />
    <AIChatModal v-if="isAIChatModalOpen" @close="closeAIChatModal" :isVisible="isAIChatModalOpen" />
    
    <!-- Toast bildirim sistemi -->
    <Notifications />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, shallowRef } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import AIChatbotButton from '@/components/ai/AIChatbotButton.vue';
import AIChatModal from '@/components/ai/AIChatModal.vue';
import Notifications from '@/components/ui/Notifications.vue';
import { useTechnicalStore } from '@/store/technical';
import { useAuthStore } from '@/store/auth';

const router = useRouter();
const technicalStore = useTechnicalStore();
const authStore = useAuthStore();

// Store'dan reactive properties
const { isAuthenticated } = storeToRefs(authStore);
const { isAIChatModalOpen } = storeToRefs(technicalStore);

// Yükleme durumu
const loading = ref(true);
const loadingMessage = ref('Yükleniyor...');

// Modal'ı kapat
const closeAIChatModal = () => {
  technicalStore.setAIChatModalOpen(false);
};

// Geliştirme ortamında otomatik demo giriş
const autoDemoLogin = async () => {
  console.log('Otomatik demo giriş kontrolü yapılıyor...');
  
  // Eğer kullanıcı giriş yapmamışsa ve URL'de demo=true parametresi varsa veya geliştirme modundaysak
  if (!isAuthenticated.value && (window.location.search.includes('demo=true') || import.meta.env.DEV)) {
    console.log('Otomatik demo giriş başlatılıyor');
    loadingMessage.value = 'Demo hesabı hazırlanıyor...';
    try {
      const result = await authStore.demoLogin();
      if (result.success) {
        console.log('Otomatik demo giriş başarılı');
        return true;
      } else {
        console.error('Otomatik demo giriş başarısız:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Otomatik demo giriş hatası:', error);
      return false;
    }
  }
  return false;
};

// Auth durumunu kontrol et
onMounted(async () => {
  // Minimum ve maksimum yükleme sürelerini ayarla
  const MIN_LOADING_TIME = 800;
  const MAX_LOADING_TIME = 6000;
  const startTime = Date.now();
  
  // Maksimum yükleme süresi için zaman aşımı
  const timeoutId = setTimeout(() => {
    if (loading.value) {
      console.warn('Auth durumu kontrolü zaman aşımına uğradı, yükleme ekranı kapatılıyor');
      loading.value = false;
    }
  }, MAX_LOADING_TIME);
  
  try {
    console.log('Auth durumu kontrol ediliyor...');
    loadingMessage.value = 'Kimlik bilgileri kontrol ediliyor...';
    
    // Initialize auth store
    const result = await authStore.initialize().catch(() => ({ success: false }));
    
    // Kimlik doğrulama başarısız ise demo giriş yap
    if (!result.success || !isAuthenticated.value) {
      loadingMessage.value = 'Demo moda geçiliyor...';
      await autoDemoLogin();
    } else {
      loadingMessage.value = 'Kimlik doğrulama başarılı...';
    }
  } catch (error) {
    console.error('Auth initialize genel hatası:', error);
    loadingMessage.value = 'Bir hata oluştu, demo moda geçiliyor...';
    // Demo giriş yapmayı dene
    await autoDemoLogin();
  } finally {
    clearTimeout(timeoutId); // Zaman aşımını temizle
    
    // Yükleme ekranını minimum süre sonra kaldır
    const elapsed = Date.now() - startTime;
    const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed);
    
    setTimeout(() => {
      loading.value = false;
      console.log('Uygulama yükleme tamamlandı, dashboard görüntüleniyor');
      
      // Önceden yüklenmiş sayfa yoksa ve giriş başarılıysa ana sayfaya yönlendir
      if (router.currentRoute.value.path === '/' && isAuthenticated.value) {
        router.push('/');
      }
    }, remainingTime);
  }
});
</script>

<style lang="scss">
@forward '@/styles/main.scss';

#app {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--text-color, #2c3e50);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: var(--bg-loading, #f8f9fa);
  z-index: 9999;
  
  .spinner {
    width: 50px;
    height: 50px;
    border: 3px solid rgba(13, 110, 253, 0.1);
    border-radius: 50%;
    border-top-color: #0d6efd;
    animation: spin 1s linear infinite;
  }
  
  .brand {
    margin-top: 20px;
    font-size: 24px;
    font-weight: 600;
    background: linear-gradient(45deg, #0d6efd, #6610f2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-fill-color: transparent;
  }
  
  .loading-text {
    margin-top: 10px;
    color: var(--text-muted, #6c757d);
    font-size: 14px;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// Dark mode için CSS değişkenleri
body {
  --text-color: #2c3e50;
  --bg-content: #f5f7fa;
  --bg-card: #ffffff;
  --bg-loading: #f8f9fa;
  --text-muted: #6c757d;
  --border-color: rgba(0, 0, 0, 0.125);
  --material-critical-bg: #ffebee;
  --material-required-bg: #fff3e0;
  --material-available-bg: #e8f5e9;
  --light-color: #ecf0f1;
  --header-bg: #ffffff;
  --sidebar-bg: #2c3e50;
  
  &.dark-mode {
    --text-color: #e2e2e2;
    --bg-content: #121212;
    --bg-card: #1e1e1e;
    --bg-loading: #121212;
    --text-muted: #adb5bd;
    --border-color: rgba(255, 255, 255, 0.125);
    --material-critical-bg: rgba(244, 67, 54, 0.15);
    --material-required-bg: rgba(255, 152, 0, 0.15);
    --material-available-bg: rgba(76, 175, 80, 0.15);
    --light-color: #1e1e1e;
    --header-bg: #1e1e1e;
    --sidebar-bg: #1a1a1a;
    
    .app-loading {
      .spinner {
        border-color: rgba(255, 255, 255, 0.1);
        border-top-color: #0d6efd;
      }
      
      .loading-text {
        color: #adb5bd;
      }
    }
    
    .card {
      background-color: var(--bg-card);
      border-color: var(--border-color);
    }
    
    .card-header {
      background-color: var(--bg-card);
      border-color: var(--border-color);
    }
    
    .table {
      color: var(--text-color);
      
      th {
        background-color: var(--light-color);
        color: var(--text-color);
      }
    }
    
    .text-muted {
      color: var(--text-muted) !important;
    }
    
    .border-0 {
      border-color: var(--border-color) !important;
    }
    
    .list-group-item {
      background-color: var(--bg-card);
      color: var(--text-color);
      border-color: var(--border-color);
    }
  }
}
</style>