<template>
  <div class="modal fade" tabindex="-1" aria-hidden="true" id="aiChatModal">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <!-- Modal Header -->
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title">Yapay Zeka Asistan</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close" @click="closeModal"></button>
        </div>
        
        <!-- Modal Body (Messages Area) -->
        <div class="modal-body" style="height: 400px; overflow-y: auto;" ref="chatBodyRef">
          <div id="chatMessages">
            <!-- Welcome message (AI) -->
            <div class="chat-message ai-message">
              Merhaba! Ben MehmetEndüstriyelTakip yapay zeka asistanınızım. Size nasıl yardımcı olabilirim?
            </div>
            
            <!-- Message History -->
            <div v-for="(msg, i) in messages" :key="`msg-${i}`">
              <!-- User messages -->
              <div v-if="msg.role === 'user'" class="chat-message user-message">
                {{ msg.content }}
              </div>
              
              <!-- AI responses -->
              <div v-else class="chat-message ai-message">
                {{ msg.content }}
              </div>
            </div>
            
            <!-- Loading message -->
            <div v-if="isLoading" class="chat-message ai-message">
              <small><i>Cevap üretiliyor...</i></small>
            </div>
          </div>
        </div>
        
        <!-- Modal Footer (Input Area) -->
        <div class="modal-footer">
          <div class="input-group">
            <input 
              type="text" 
              class="form-control" 
              id="aiChatInput" 
              ref="inputRef"
              v-model="inputValue"
              placeholder="Soru sorun..."
              @keypress.enter="sendMessage"
            >
            <button 
              class="btn btn-primary" 
              id="sendChatBtn" 
              @click="sendMessage"
              :disabled="isLoading || !inputValue.trim()"
            >
              Gönder
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue';
import { useTechnicalStore } from '@/store/technical';

// Store
const technicalStore = useTechnicalStore();

// Component state
const isLoading = ref(false);
const inputValue = ref('');
const messages = ref([]);
const chatBodyRef = ref(null);
const inputRef = ref(null);

// Örnek sistem verileri (gerçek uygulamada API'den gelecek)
const systemData = {
  orders: [
    { id: '#0424-1251', customer: 'AYEDAŞ', cellType: 'RM 36 CB', status: 'Gecikiyor', progress: 65 },
    { id: '#0424-1245', customer: 'TEİAŞ', cellType: 'RM 36 CB', status: 'Devam Ediyor', progress: 45 },
    { id: '#0424-1239', customer: 'BEDAŞ', cellType: 'RM 36 LB', status: 'Devam Ediyor', progress: 30 },
    { id: '#0424-1235', customer: 'OSMANİYE ELEKTRİK', cellType: 'RM 36 FL', status: 'Planlandı', progress: 10 }
  ],
  materials: [
    { code: '137998%', name: 'Siemens 7SR1003-1JA20-2DA0+ZY20 24VDC', stock: 2, required: 8, status: 'Kritik' },
    { code: '144866%', name: 'KAP-80/190-95 Akım Trafosu', stock: 3, required: 5, status: 'Düşük' },
    { code: '120170%', name: 'M480TB/G-027-95.300UN5 Kablo Başlığı', stock: 12, required: 15, status: 'Düşük' },
    { code: '109367%', name: '582mm Bara', stock: 25, required: 18, status: 'Yeterli' }
  ],
  technicalDocs: [
    { name: 'RM 36 CB Teknik Çizim', date: '15.10.2024', content: 'RM 36 CB hücresine ait teknik çizim detayları...' },
    { name: 'RM 36 LB Montaj Talimatı', date: '10.10.2024', content: 'RM 36 LB hücresi montaj talimatları...' },
    { name: 'Akım Trafosu Seçim Kılavuzu', date: '01.10.2024', content: 'Akım trafolarının seçimine ilişkin teknik bilgiler...' }
  ]
};

// Actions
const closeModal = () => {
  technicalStore.setAIChatModalOpen(false);
};

const focusInput = () => {
  if (inputRef.value) {
    inputRef.value.focus();
  }
};

const scrollToBottom = () => {
  if (chatBodyRef.value) {
    chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight;
  }
};

// Kullanıcı mesajını yapay zekadan cevap alma (örnek)
const generateAIResponse = (userMessage) => {
  const lowerMessage = userMessage.toLowerCase();
  
  // Siparişlerle ilgili sorular
  if (lowerMessage.includes('sipariş') || lowerMessage.includes('order')) {
    if (lowerMessage.includes('geciken') || lowerMessage.includes('gecikme')) {
      return `Sistemde geciken 1 sipariş bulunmaktadır: ${systemData.orders[0].id} no'lu ${systemData.orders[0].customer} firmasına ait ${systemData.orders[0].cellType} hücresi. İlerleme durumu: %${systemData.orders[0].progress}.`;
    }
    
    if (lowerMessage.includes('devam eden') || lowerMessage.includes('üretim')) {
      return `Şu anda üretimi devam eden 2 sipariş bulunmaktadır:\n1. ${systemData.orders[1].id} - ${systemData.orders[1].customer} - ${systemData.orders[1].cellType}\n2. ${systemData.orders[2].id} - ${systemData.orders[2].customer} - ${systemData.orders[2].cellType}`;
    }
    
    return `Sistemde toplam 4 aktif sipariş bulunmaktadır. 1 sipariş gecikmiş durumda, 2 sipariş devam ediyor, 1 sipariş ise henüz planlanma aşamasında. Detaylı bilgi için "siparişler" sayfasını inceleyebilirsiniz.`;
  }
  
  // Malzeme sorguları
  if (lowerMessage.includes('malzeme') || lowerMessage.includes('stok') || lowerMessage.includes('material')) {
    if (lowerMessage.includes('kritik') || lowerMessage.includes('acil')) {
      return `Kritik seviyede olan malzeme: ${systemData.materials[0].name} (Stok: ${systemData.materials[0].stock}, İhtiyaç: ${systemData.materials[0].required})`;
    }
    
    if (lowerMessage.includes('röle') || lowerMessage.includes('role') || lowerMessage.includes('siemens')) {
      return `Siemens röle (kod: ${systemData.materials[0].code}) için mevcut stok ${systemData.materials[0].stock} adet, ancak ihtiyaç ${systemData.materials[0].required} adet. Acilen sipariş verilmesi gerekiyor.`;
    }
    
    return `Mevcut stok durumu: 1 malzeme kritik seviyede, 2 malzeme düşük stokta, 1 malzeme yeterli durumdadır. Kritik malzemeler için "malzeme yönetimi" bölümünden sipariş verebilirsiniz.`;
  }
  
  // Teknik sorular
  if (lowerMessage.includes('teknik') || lowerMessage.includes('çizim') || lowerMessage.includes('doküman')) {
    if (lowerMessage.includes('rm 36 cb')) {
      return `RM 36 CB hücresi için teknik çizim Rev.2.1 versiyonu mevcut. Bu hücre tipi 36kV gerilimde çalışır, genellikle 200-400/5-5A 5P20 7,5/15VA özelliklerinde akım trafosu kullanılır. Detaylı teknik şartnameyi teknik dokümanlar bölümünden inceleyebilirsiniz.`;
    }
    
    if (lowerMessage.includes('akım trafo')) {
      return `RM 36 CB hücresinde genellikle KAP-80/190-95 (kod: 144866%) veya KAT-85/190-95 (kod: 142227%) tip akım trafoları kullanılmaktadır. Mevcutta 3 adet KAP-80/190-95 stokta bulunuyor, 5 adete ihtiyaç var.`;
    }
    
    return `Sistemde toplam 3 teknik doküman mevcut: ${systemData.technicalDocs[0].name}, ${systemData.technicalDocs[1].name}, ve ${systemData.technicalDocs[2].name}. Bu dokümanları "Teknik Dokümanlar" sayfasından inceleyebilirsiniz.`;
  }
  
  // Genel sorular için yapay zeka cevabı
  return `Elimdeki bilgilere göre: Sistemde 4 aktif sipariş, 4 farklı malzeme kaydı ve 3 teknik doküman bulunuyor. Daha spesifik bilgi için lütfen daha detaylı bir soru sorun. Örneğin "Geciken siparişler nelerdir?" veya "Kritik malzeme durumu nedir?" gibi.`;
};

// Kullanıcı mesajını gönder ve cevap al
const sendMessage = async () => {
  if (!inputValue.value.trim() || isLoading.value) return;
  
  const messageText = inputValue.value.trim();
  
  // Add user message
  messages.value.push({
    role: 'user',
    content: messageText
  });
  
  // Clear input
  inputValue.value = '';
  focusInput();
  
  // Scroll to bottom
  nextTick(() => {
    scrollToBottom();
  });
  
  try {
    isLoading.value = true;
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get AI response (in a real app, this would call an API)
    const response = generateAIResponse(messageText);
    
    // Add AI response
  messages.value.push({
      role: 'assistant',
      content: response
    });
    
  } catch (error) {
    console.error('AI error:', error);
    
    // Add error message
    messages.value.push({
      role: 'assistant',
      content: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.'
    });
  } finally {
    isLoading.value = false;
    
    // Scroll to bottom
    nextTick(() => {
      scrollToBottom();
    });
  }
};

// Lifecycle hooks
onMounted(() => {
  // Focus input when modal opens
  watch(() => technicalStore.isAIChatModalOpen, (isOpen) => {
    if (isOpen) {
      nextTick(() => {
        focusInput();
      });
    }
  });
  
  // Initialize bootstrap modal - in a real App, need to import Bootstrap JS
  try {
    window.addEventListener('shown.bs.modal', (event) => {
      if (event.target.id === 'aiChatModal') {
        focusInput();
      }
    });
  } catch (error) {
    console.error('Bootstrap modal initialization failed:', error);
  }
});

// Export component's public API for potential parent component use
defineExpose({
  sendMessage,
  closeModal
});
</script>

<style lang="scss" scoped>
/* Chat message styles - from ornekindex.html */
.chat-message {
  margin-bottom: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  max-width: 80%;
}

.user-message {
  background-color: #e3f2fd;
  margin-left: auto;
}

.ai-message {
  background-color: #f1f1f1;
  margin-right: auto;
}

/* Customize Bootstrap modal for chat */
:deep(.modal-body) {
  background-color: #f8f9fa;
}

:deep(.modal-footer) {
  padding: 0.5rem 1rem;
}
</style>