<template>
  <div class="ai-insights-card card border-0 h-100">
    <div class="card-header bg-transparent border-0">
      <div class="d-flex justify-content-between align-items-center">
        <h5 class="card-title mb-0">
          <i class="bi bi-lightning-charge-fill text-primary me-2"></i>
          Yapay Zeka Öngörüleri
        </h5>
        <div>
          <div class="btn-group me-2">
            <button type="button" class="btn btn-sm btn-outline-secondary" :class="{ 'active': insightFilter === 'all' }" @click="filterInsights('all')">Tümü</button>
            <button type="button" class="btn btn-sm btn-outline-secondary" :class="{ 'active': insightFilter === 'warning' }" @click="filterInsights('warning')">Uyarılar</button>
            <button type="button" class="btn btn-sm btn-outline-secondary" :class="{ 'active': insightFilter === 'suggestion' }" @click="filterInsights('suggestion')">Öneriler</button>
          </div>
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
      
      <div v-else-if="filteredInsights.length === 0" class="p-4 text-center">
        <i class="bi bi-search text-muted fs-4"></i>
        <p class="mt-2 mb-0">Seçilen filtre için öngörü bulunamadı.</p>
      </div>

      <div v-else>
        <div v-for="(insight, index) in filteredInsights" :key="index" 
             class="insight-item p-3 border-bottom" 
             :class="{'highlight-high': insight.importance === 'high', 'highlight-medium': insight.importance === 'medium'}">
          <div class="d-flex">
            <div class="flex-shrink-0">
              <i :class="getInsightIcon(insight.type)" class="insight-icon"></i>
            </div>
            <div class="flex-grow-1 ms-3">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <h6 class="mb-0">{{ insight.title }}</h6>
                <span class="badge" :class="getImportanceBadgeClass(insight.importance)">
                  {{ getImportanceText(insight.importance) }}
                </span>
              </div>
              <p class="mb-1">{{ insight.description }}</p>
              
              <!-- Tahminler veya istatistiksel verilerin detaylı gösterimi -->
              <div v-if="insight.details" class="insight-details bg-light p-2 rounded mb-2">
                <template v-if="insight.details.type === 'comparison'">
                  <div class="row">
                    <div class="col-6 text-center border-end">
                      <div class="text-muted small">{{ insight.details.leftLabel }}</div>
                      <div class="fw-bold">{{ insight.details.leftValue }}</div>
                    </div>
                    <div class="col-6 text-center">
                      <div class="text-muted small">{{ insight.details.rightLabel }}</div>
                      <div class="fw-bold">{{ insight.details.rightValue }}</div>
                    </div>
                  </div>
                </template>
                
                <template v-else-if="insight.details.type === 'trend'">
                  <div class="d-flex align-items-center">
                    <div class="flex-grow-1">
                      <div class="progress">
                        <div class="progress-bar" :class="insight.details.trendClass" role="progressbar" 
                             :style="{ width: insight.details.percentage + '%' }" 
                             :aria-valuenow="insight.details.percentage" aria-valuemin="0" aria-valuemax="100">
                        </div>
                      </div>
                    </div>
                    <div class="ms-2 text-nowrap">
                      <span :class="insight.details.trendClass">{{ insight.details.trendValue }}</span>
                    </div>
                  </div>
                </template>
              </div>
              
              <!-- Tavsiye ve öneriler bölümü -->
              <div v-if="insight.recommendations && insight.recommendations.length > 0" class="mt-2">
                <div class="recommendations">
                  <div v-for="(recommendation, rIndex) in insight.recommendations" :key="`rec-${index}-${rIndex}`" 
                        class="recommendation d-flex align-items-start mb-1">
                    <i class="bi bi-check-circle-fill text-success me-1"></i>
                    <span class="small">{{ recommendation }}</span>
                  </div>
                </div>
              </div>
              
              <div class="d-flex justify-content-between align-items-center small mt-2">
                <span class="text-muted">{{ insight.source }}</span>
                <span :class="getTimestampClass(insight.timestamp)">{{ formatTimestamp(insight.timestamp) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="card-footer bg-transparent border-0 p-2">
      <div class="d-flex justify-content-between align-items-center small px-2">
        <span class="text-muted">Güncellenme: {{ lastUpdated }}</span>
        <button class="btn btn-link btn-sm p-0 text-primary" @click="openFullReport">
          Detaylı rapor <i class="bi bi-arrow-right-short"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useTechnicalStore } from '@/store/technical';
import { useAiService } from '@/services/ai-service';

// Router ve stores
const router = useRouter();
const technicalStore = useTechnicalStore();
const aiService = useAiService();

// State
const insights = ref([]);
const isLoading = ref(true);
const lastUpdated = ref('');
const refreshTimer = ref(null);
const insightFilter = ref('all');

// Filtreli öngörüler
const filteredInsights = computed(() => {
  if (insightFilter.value === 'all') {
    return insights.value;
  }
  return insights.value.filter(insight => insight.type === insightFilter.value);
});

// Filtre uygula
const filterInsights = (filter) => {
  insightFilter.value = filter;
};

// AI chat modalı aç
const openAIChat = () => {
  technicalStore.setAIChatModalOpen(true);
};

// Detaylı rapor sayfasını aç
const openFullReport = () => {
  router.push({ name: 'AIReports' });
};

// Öngörüleri yenile - myrule2.mdc'ye göre genişletildi
const refreshInsights = async () => {
  isLoading.value = true;
  
  try {
    // Gerçek uygulamada bu fonksiyon AI servisi üzerinden veri çeker
    // await aiService.getInsights() şeklinde
    await new Promise(resolve => setTimeout(resolve, 1200)); // Simüle edilmiş yükleme
    
    // myrule2.mdc'de bahsedilen makine öğrenimi tabanlı analizleri yansıtan öngörüler
    insights.value = [
      {
        title: "36kV Kesici Stok Uyarısı",
        description: "36kV kesiciler kritik stok seviyesine düştü (4 adet kaldı). Bu hafta 2 yeni sipariş bekleniyor ve tahminlere göre yetersiz kalabilir.",
        importance: "high",
        type: "warning",
        source: "Stok Analizi",
        timestamp: new Date(new Date().getTime() - 35 * 60000), // 35 dakika önce
        details: {
          type: "comparison",
          leftLabel: "Mevcut Stok",
          leftValue: "4 adet",
          rightLabel: "Minimum Gereken",
          rightValue: "6 adet"
        },
        recommendations: [
          "Acil sipariş planlaması gerekiyor",
          "Alternatif tedarikçilerle iletişime geçin"
        ]
      },
      {
        title: "Üretim Verimliliği Artışı Tespiti",
        description: "Son 30 günde üretim verimliliği %8 artış gösterdi. Ana katkı faktörü: Montaj süreçlerindeki iyileştirmeler.",
        importance: "medium",
        type: "improvement",
        source: "Üretim Metrikleri Analizi",
        timestamp: new Date(new Date().getTime() - 3 * 3600000), // 3 saat önce
        details: {
          type: "trend",
          percentage: 80,
          trendClass: "text-success",
          trendValue: "+8%"
        },
        recommendations: [
          "İyileştirme sürecini diğer ürün hatlarına da yaygınlaştırın",
          "Montaj ekibine bonus değerlendirmesi"
        ]
      },
      {
        title: "TEDAŞ Siparişi Risk Analizi",
        description: "TEDAŞ projesi (12 adet RM36 CB) için iş planı analizi. Tedarik zinciri gecikmesi olasılığı düşük, üretim planı riskli alanlar tespit edilmedi.",
        importance: "medium",
        type: "analysis",
        source: "Proje Risk Analizi",
        timestamp: new Date(new Date().getTime() - 12 * 3600000), // 12 saat önce
        details: {
          type: "comparison",
          leftLabel: "Risk Skoru",
          leftValue: "Düşük (15/100)",
          rightLabel: "Tahmini Tamamlanma",
          rightValue: "Zamanında"
        }
      },
      {
        title: "Gecikme Riski Tespiti",
        description: "RM 36 CB tipi hücrelerde montaj süresinin ortalamadan %15 daha fazla olduğu tespit edildi. Bu durum yaklaşan AYEDAŞ siparişini etkileyebilir.",
        importance: "high",
        type: "warning",
        source: "Süreç Analizi",
        timestamp: new Date(new Date().getTime() - 16 * 3600000), // 16 saat önce
        details: {
          type: "trend",
          percentage: 65,
          trendClass: "text-danger",
          trendValue: "+15%"
        },
        recommendations: [
          "Montaj ekiplerine takviye yapılması önerilir",
          "Mesai planlaması güncellemesi gerekebilir"
        ]
      },
      {
        title: "Üretim Süresi Optimizasyon Önerisi",
        description: "RM 36 LB hücrelerinin üretim sürecinde darboğaz tespit edildi. Kablolama sürecinde ortalama 2.3 saat kayıp yaşanıyor.",
        importance: "medium",
        type: "suggestion",
        source: "Süreç Optimizasyonu",
        timestamp: new Date(new Date().getTime() - 1.5 * 86400000), // 1.5 gün önce
        details: {
          type: "comparison",
          leftLabel: "Mevcut Süre",
          leftValue: "8.5 saat",
          rightLabel: "Optimize Süre",
          rightValue: "6.2 saat"
        },
        recommendations: [
          "Kablolama sürecinde paralel çalışma düzeni",
          "Kablo kesim şablonları geliştirilmesi"
        ]
      },
      {
        title: "Enerji Tüketimi Optimizasyonu",
        description: "Üretim hattında enerji tüketimini %12 düşürme potansiyeli tespit edildi. Test bölümünde ekipmanların bekleme modunda kayıplar tespit edildi.",
        importance: "low",
        type: "suggestion",
        source: "Enerji Verimliliği Analizi",
        timestamp: new Date(new Date().getTime() - 27 * 3600000), // 27 saat önce
        details: {
          type: "trend",
          percentage: 55,
          trendClass: "text-success",
          trendValue: "-12%"
        },
        recommendations: [
          "Test ekipmanları için otomatik kapanma ayarları",
          "Enerji tüketim monitörü kurulumu"
        ]
      },
      {
        title: "Bakım Zamanlaması Önerisi",
        description: "A2 montaj hattındaki pres makinesinin performans metrikleri bakım ihtiyacına işaret ediyor. Çalışma parametrelerinde %5.3 gerileme tespit edildi.",
        importance: "medium",
        type: "maintenance",
        source: "Ekipman Diagnostiği",
        timestamp: new Date(new Date().getTime() - 2 * 86400000), // 2 gün önce
        details: {
          type: "trend",
          percentage: 40,
          trendClass: "text-warning",
          trendValue: "-5.3%"
        },
        recommendations: [
          "Önümüzdeki 2 hafta içinde planlı bakım önerilir",
          "Çalışma parametrelerinin günlük kontrolü"
        ]
      },
      {
        title: "Tekrarlanan Sorun Tespiti",
        description: "KEE Enerji siparişindeki teknik değişiklik talepleri analiz edildiğinde sık tekrarlanan bir sorun tespit edildi. Akım trafosu yerleşimi tasarımda kritik nokta.",
        importance: "medium",
        type: "analysis",
        source: "Müşteri Talep Analizi",
        timestamp: new Date(new Date().getTime() - 4 * 86400000), // 4 gün önce
        recommendations: [
          "Akım trafosu yerleşimi için tasarım revizyonu",
          "Standart teknik çizimlerin güncellenmesi"
        ]
      },
      {
        title: "Termin Öngörüsü",
        description: "Geçmiş üretim verilerinden öğrenilerek, mevcut siparişlerin termin tahminleri güncellendi. Öngörülen tamamlanma zamanları daha isabetli hale getirildi.",
        importance: "medium",
        type: "improvement",
        source: "Yapay Zeka Termin Öngörüsü",
        timestamp: new Date(new Date().getTime() - 5 * 86400000), // 5 gün önce
        details: {
          type: "comparison",
          leftLabel: "Eski Ortalama Sapma",
          leftValue: "±5.2 gün",
          rightLabel: "Yeni Ortalama Sapma",
          rightValue: "±2.1 gün"
        }
      }
    ];
    
    lastUpdated.value = new Date().toLocaleTimeString('tr-TR');
  } catch (error) {
    console.error('Öngörüler yüklenirken hata:', error);
  } finally {
    isLoading.value = false;
  }
};

// Öncelik badge'ı için sınıf
const getImportanceBadgeClass = (importance) => {
  switch(importance) {
    case 'high': return 'bg-danger';
    case 'medium': return 'bg-warning text-dark';
    case 'low': return 'bg-info text-dark';
    default: return 'bg-secondary';
  }
};

// Öncelik metni
const getImportanceText = (importance) => {
  switch(importance) {
    case 'high': return 'Yüksek';
    case 'medium': return 'Orta';
    case 'low': return 'Düşük';
    default: return '-';
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

// 30 dakikada bir otomatik yenileme - myrule2.mdc'de istendiği gibi
const startAutoRefresh = () => {
  refreshTimer.value = setInterval(() => {
    refreshInsights();
  }, 1800000); // 30 dakika: 30 * 60 * 1000
};

// Komponent yüklendiğinde öngörüleri al ve otomatik yenilemeyi başlat
onMounted(async () => {
  await refreshInsights();
  startAutoRefresh();
});

// Komponent kaldırıldığında otomatik yenilemeyi durdur
onBeforeUnmount(() => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value);
  }
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
  max-height: 600px; /* Biraz daha yüksek */
  overflow-y: auto;
}

.insight-icon {
  font-size: 1.5rem;
  opacity: 0.8;
}

.highlight-high {
  border-left: 4px solid var(--danger-color, #dc3545);
  background-color: var(--highlight-high-bg, rgba(220, 53, 69, 0.05));
}

.highlight-medium {
  border-left: 4px solid var(--warning-color, #ffc107);
  background-color: var(--highlight-medium-bg, rgba(255, 193, 7, 0.05));
}

.insight-details {
  background-color: var(--details-bg, #f8f9fa);
  font-size: 0.9rem;
}

.recommendations {
  font-size: 0.85rem;
  color: var(--text-muted, #6c757d);
}

/* Koyu mod desteği */
@media (prefers-color-scheme: dark) {
  .ai-insights-card {
    --bg-color: #212529;
    --hover-bg: rgba(255, 255, 255, 0.05);
    --highlight-high-bg: rgba(220, 53, 69, 0.1);
    --highlight-medium-bg: rgba(255, 193, 7, 0.1);
    --details-bg: #2c3034;
    --text-muted: #adb5bd;
  }
}

/* Responsive design desteği */
@media (max-width: 768px) {
  .card-header .btn-group,
  .card-header button {
    font-size: 0.7rem;
  }
  
  .insight-item {
    padding: 0.75rem !important;
  }
  
  .insight-icon {
    font-size: 1.2rem;
  }
}
</style>