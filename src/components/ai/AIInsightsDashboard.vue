<template>
  <div class="ai-insights-card card border-0 h-100">
    <div class="card-header bg-transparent border-0">
      <div class="d-flex justify-content-between align-items-center">
        <h5 class="card-title mb-0">
          <i class="bi bi-lightning-charge-fill text-primary me-2"></i>
          Yapay Zeka Öngörüleri
        </h5>
        <div>
          <button class="btn btn-sm btn-outline-secondary me-2" @click="refreshInsights">
            <i class="bi bi-arrow-clockwise"></i>
          </button>
          <button class="btn btn-sm btn-outline-primary" @click="openAIChat">
            <i class="bi bi-chat-text"></i> Soru Sor
          </button>
        </div>
      </div>
    </div>
    <div class="card-body p-0 insights-container">
      <div v-if="isLoading" class="p-4 text-center">
        <div class="spinner-border text-primary spinner-border-sm me-2" role="status">
          <span class="visually-hidden">Yükleniyor...</span>
        </div>
        <span>Veriler analiz ediliyor...</span>
      </div>
      
      <div v-else>
        <div v-for="(insight, index) in insights" :key="index" 
             class="insight-item p-3 border-bottom" 
             :class="{'highlight': insight.importance === 'high'}">
          <div class="d-flex">
            <div class="flex-shrink-0">
              <i :class="getInsightIcon(insight.type)" class="insight-icon"></i>
            </div>
            <div class="flex-grow-1 ms-3">
              <h6 class="mb-1">{{ insight.title }}</h6>
              <p class="mb-1">{{ insight.description }}</p>
              <div class="d-flex justify-content-between align-items-center small">
                <span class="text-muted">{{ insight.source }}</span>
                <span :class="getTimestampClass(insight.timestamp)">{{ formatTimestamp(insight.timestamp) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useTechnicalStore } from '@/store/technical';
import { useAiService } from '@/services/ai-service';

// Stores ve servisler
const technicalStore = useTechnicalStore();
const aiService = useAiService();

// State
const insights = ref([]);
const isLoading = ref(true);

// AI chat modalı aç
const openAIChat = () => {
  technicalStore.setAIChatModalOpen(true);
};

// Öngörüleri yenile
const refreshInsights = async () => {
  isLoading.value = true;
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1200)); // Simüle edilmiş yükleme
    
    insights.value = [
      {
        title: "36kV Kesici Stok Uyarısı",
        description: "36kV kesiciler kritik stok seviyesine düştü (4 adet kaldı). Bu hafta 2 yeni sipariş bekleniyor ve tahminlere göre yetersiz kalabilir. Sipariş planlaması önerilir.",
        importance: "high",
        type: "warning",
        source: "Stok Analizi",
        timestamp: new Date(new Date().getTime() - 35 * 60000) // 35 dakika önce
      },
      {
        title: "Üretim Verimliliği Artışı",
        description: "Son 30 günde üretim verimliliği %8 artış gösterdi. Artışa en çok katkıda bulunan faktör: Montaj süreçlerindeki iyileştirmeler.",
        importance: "medium",
        type: "improvement",
        source: "Üretim Metrikleri",
        timestamp: new Date(new Date().getTime() - 3 * 3600000) // 3 saat önce
      },
      {
        title: "TEDAŞ Siparişi Risk Analizi",
        description: "TEDAŞ projesi (12 adet RM36 CB) için iş planı riskleri analiz edildi. Tedarik zinciri gecikmesi olasılığı düşük, üretim planı riskli alanlar tespit edilmedi.",
        importance: "medium",
        type: "analysis",
        source: "Proje Risk Analizi",
        timestamp: new Date(new Date().getTime() - 12 * 3600000) // 12 saat önce
      },
      {
        title: "Enerji Tüketimi Optimizasyonu",
        description: "Üretim hattında enerji tüketimini %12 düşürme potansiyeli tespit edildi. Test bölümünde ekipmanların bekleme modunda optimizasyon önerilir.",
        importance: "low",
        type: "suggestion",
        source: "Enerji Verimliliği Analizi",
        timestamp: new Date(new Date().getTime() - 27 * 3600000) // 27 saat önce
      },
      {
        title: "Bakım Planlaması",
        description: "A2 montaj hattındaki pres makinesinin performans metrikleri bakım ihtiyacına işaret ediyor. Önümüzdeki 2 hafta içinde planlı bakım önerilir.",
        importance: "medium",
        type: "maintenance",
        source: "Ekipman Diagnostiği",
        timestamp: new Date(new Date().getTime() - 2 * 86400000) // 2 gün önce
      }
    ];
  } catch (error) {
    console.error('Öngörüler yüklenirken hata:', error);
  } finally {
    isLoading.value = false;
  }
};

// Öngörü tipi için icon belirleme
const getInsightIcon = (type) => {
  const icons = {
    warning: 'bi bi-exclamation-triangle-fill text-warning',
    improvement: 'bi bi-graph-up-arrow text-success',
    analysis: 'bi bi-bar-chart-fill text-primary',
    suggestion: 'bi bi-lightbulb-fill text-info',
    maintenance: 'bi bi-tools text-secondary'
  };
  
  return icons[type] || 'bi bi-info-circle-fill text-primary';
};

// Zaman damgası formatı
const formatTimestamp = (timestamp) => {
  const now = new Date();
  const diff = now - timestamp;
  
  // 1 saat içinde
  if (diff < 3600000) {
    const mins = Math.round(diff / 60000);
    return `${mins} dakika önce`;
  }
  
  // 1 gün içinde
  if (diff < 86400000) {
    const hours = Math.round(diff / 3600000);
    return `${hours} saat önce`;
  }
  
  // 1 gün sonra
  const days = Math.round(diff / 86400000);
  return `${days} gün önce`;
};

// Zaman damgası için CSS sınıfı
const getTimestampClass = (timestamp) => {
  const now = new Date();
  const diff = now - timestamp;
  
  if (diff < 3600000) return 'text-danger'; // 1 saat içinde: kırmızı
  if (diff < 86400000) return 'text-warning'; // 1 gün içinde: sarı
  return 'text-muted'; // 1 günden fazla: gri
};

// Komponent yüklendiğinde öngörüleri al
onMounted(async () => {
  await refreshInsights();
});
</script>

<style scoped>
.ai-insights-card {
  background-color: var(--bg-color, #ffffff);
  transition: all 0.3s ease;
}

.insight-item {
  transition: background-color 0.3s;
}

.insight-item:hover {
  background-color: var(--hover-bg, rgba(0, 123, 255, 0.05));
}

.insights-container {
  max-height: 500px;
  overflow-y: auto;
}

.insight-icon {
  font-size: 1.5rem;
  opacity: 0.8;
}

.highlight {
  border-left: 4px solid var(--warning-color, #ffc107);
  background-color: var(--highlight-bg, rgba(255, 193, 7, 0.05));
}

/* Koyu mod desteği */
@media (prefers-color-scheme: dark) {
  .ai-insights-card {
    --bg-color: #212529;
    --hover-bg: rgba(255, 255, 255, 0.05);
    --highlight-bg: rgba(255, 193, 7, 0.1);
  }
}
</style>