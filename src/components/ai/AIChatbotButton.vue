<template>
  <div class="ai-chatbot">
    <div class="ai-chatbot-btn" @click="openChatModal">
      <i class="bi bi-robot"></i>
      <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useTechnicalStore } from '@/store/technical';

const technicalStore = useTechnicalStore();
const unreadCount = ref(3); // Varsayılan olarak 3 okunmamış mesaj (ornekindex.html'de olduğu gibi)

const openChatModal = () => {
  technicalStore.openChatModal();
  // Yapay zeka sohbeti açıldığında bildirimleri sıfırla
  unreadCount.value = 0;
};

// İleriki aşamalarda gerçek bildirim yönetimi için hazırlık
onMounted(() => {
  // Gerçek bir uygulamada burada API'den bildirim sayısı alınabilir
  console.log('AI Chatbot hazır');
});
</script>

<style lang="scss" scoped>
// Stiller DefaultLayout.vue içindeki global stillerden geliyor
// Burada sadece ek stillerinizi ekleyin
</style>