<template>
  <div class="ai-chat-modal" v-if="isVisible">
    <div class="ai-chat-container">
      <div class="ai-chat-header">
        <div class="d-flex align-items-center">
          <i class="bi bi-robot me-2"></i>
          <h5 class="m-0">Yapay Zeka Asistanı</h5>
        </div>
        <div class="ai-chat-actions">
          <button class="btn btn-link" @click="clearChat">
            <i class="bi bi-trash"></i>
          </button>
          <button class="btn btn-link" @click="$emit('close')">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </div>
      
      <div class="ai-chat-content" ref="chatContent">
        <div class="ai-message ai-message-bot">
          <div class="ai-message-content">
            <p>Merhaba! Size nasıl yardımcı olabilirim?</p>
            <p class="small mb-0">Üretim durumları, malzeme stokları veya teknik bilgiler hakkında sorular sorabilirsiniz.</p>
          </div>
        </div>
        
        <div v-for="(message, index) in messages" :key="index" 
             :class="['ai-message', message.sender === 'user' ? 'ai-message-user' : 'ai-message-bot']">
          <div class="ai-message-content">
            <p v-if="message.text">{{ message.text }}</p>
            <div v-if="message.loading" class="ai-typing">
              <div class="ai-typing-dot"></div>
              <div class="ai-typing-dot"></div>
              <div class="ai-typing-dot"></div>
            </div>
            <p v-if="message.source" class="ai-message-source">
              <small>Kaynak: {{ message.source }}</small>
            </p>
          </div>
        </div>
      </div>
      
      <div class="ai-chat-input">
        <form @submit.prevent="sendMessage">
          <div class="input-group">
            <input 
              type="text" 
              class="form-control" 
              placeholder="Mesajınızı yazın..." 
              v-model="userInput"
              :disabled="isLoading"
              @keypress.enter="sendMessage"
            >
            <button class="btn btn-primary" type="submit" :disabled="isLoading || !userInput.trim()">
              <i class="bi" :class="isLoading ? 'bi-hourglass-split' : 'bi-send'"></i>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import { useAiService } from '@/services/ai-service'
import { useTechnicalStore } from '@/store/technical'

// Props
const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  }
})

// Emit
const emit = defineEmits(['close'])

// Store ve servisler
const technicalStore = useTechnicalStore()
const aiService = useAiService()

// State
const userInput = ref('')
const messages = ref([])
const isLoading = ref(false)
const chatContent = ref(null)

// Mesaj gönderme
const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return

  const userMessage = userInput.value
  userInput.value = ''
  
  // Kullanıcı mesajını ekle
  messages.value.push({
    text: userMessage,
    sender: 'user',
    timestamp: new Date()
  })
  
  // Yapay zeka yanıt verirken loading göster
  messages.value.push({
    loading: true,
    sender: 'bot',
    timestamp: new Date()
  })
  
  // Chat alanını aşağı kaydır
  await scrollToBottom()
  
  // AI yanıtını al
  isLoading.value = true
  try {
    const response = await aiService.sendMessage(userMessage)
    
    // Loading mesajını kaldır
    messages.value.pop()
    
    // AI yanıtını ekle
    messages.value.push({
      text: response.text,
      source: response.source,
      sender: 'bot',
      timestamp: new Date()
    })
    
    // Chat alanını aşağı kaydır
    await scrollToBottom()
  } catch (error) {
    console.error('AI yanıtı alınamadı:', error)
    
    // Loading mesajını kaldır
    messages.value.pop()
    
    // Hata mesajı ekle
    messages.value.push({
      text: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
      sender: 'bot',
      timestamp: new Date()
    })
  } finally {
    isLoading.value = false
  }
}

// Chat geçmişini temizle
const clearChat = () => {
  messages.value = []
  
  // Karşılama mesajı ekle
  messages.value.push({
    text: 'Merhaba! Size nasıl yardımcı olabilirim?',
    sender: 'bot',
    timestamp: new Date()
  })
}

// Chat alanını en aşağı kaydır
const scrollToBottom = async () => {
  await nextTick()
  if (chatContent.value) {
    chatContent.value.scrollTop = chatContent.value.scrollHeight
  }
}

// Modal görünür olduğunda
watch(() => props.isVisible, async (newVal) => {
  if (newVal) {
    await nextTick()
    if (messages.value.length === 0) {
      clearChat()
    }
    await scrollToBottom()
    
    // Input'a focus ver
    const inputElement = document.querySelector('.ai-chat-input input')
    if (inputElement) {
      inputElement.focus()
    }
  }
})
</script>

<style scoped>
.ai-chat-modal {
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 350px;
  height: 500px;
  background-color: var(--bg-color, #ffffff);
  border-radius: 12px;
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  overflow: hidden;
}

.ai-chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.ai-chat-header {
  padding: 15px;
  background-color: var(--primary-color, #0d6efd);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ai-chat-actions .btn-link {
  color: white;
  padding: 0 8px;
}

.ai-chat-content {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.ai-message {
  display: flex;
  margin-bottom: 15px;
}

.ai-message-user {
  justify-content: flex-end;
}

.ai-message-content {
  max-width: 80%;
  padding: 10px 15px;
  border-radius: 18px;
}

.ai-message-bot .ai-message-content {
  background-color: var(--light-color, #f0f2f5);
  color: var(--dark-color, #343a40);
}

.ai-message-user .ai-message-content {
  background-color: var(--primary-color, #0d6efd);
  color: white;
}

.ai-message-content p {
  margin: 0;
}

.ai-message-source {
  margin-top: 5px;
  font-style: italic;
  opacity: 0.8;
}

.ai-chat-input {
  padding: 15px;
  border-top: 1px solid var(--border-color, #dee2e6);
}

.ai-typing {
  display: flex;
  align-items: center;
}

.ai-typing-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--gray-color, #6c757d);
  margin: 0 2px;
  animation: typing 1s infinite ease-in-out;
}

.ai-typing-dot:nth-child(1) {
  animation-delay: 0s;
}

.ai-typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.ai-typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
  100% {
    transform: translateY(0);
  }
}

/* Koyu mod desteği */
@media (prefers-color-scheme: dark) {
  .ai-chat-modal {
    --bg-color: #212529;
    --border-color: #495057;
    --light-color: #343a40;
  }
  
  .ai-message-bot .ai-message-content {
    background-color: #343a40;
    color: #f8f9fa;
  }
  
  .ai-chat-input {
    background-color: #212529;
  }
}
</style>