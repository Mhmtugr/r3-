<template>
  <div class="technical-view">
    <div class="row">
      <!-- Teknik Dokümanlar Listesi -->
      <div class="col-md-5">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Teknik Dokümanlar</h5>
            <button class="btn btn-sm btn-primary" @click="openUploadModal">
              <i class="bi bi-upload"></i> Yükle
            </button>
          </div>
          <div class="card-body">
            <!-- Arama Çubuğu -->
            <div class="input-group mb-3">
              <input type="text" class="form-control" placeholder="Doküman ara..." v-model="searchTerm">
              <button class="btn btn-outline-secondary" type="button" @click="searchDocuments">
                <i class="bi bi-search"></i>
              </button>
            </div>
            <!-- Doküman Listesi -->
            <div class="list-group" v-if="filteredDocuments.length > 0">
              <a href="#" class="list-group-item list-group-item-action" v-for="doc in filteredDocuments" :key="doc.id" @click.prevent="viewDocument(doc)">
                <div class="d-flex w-100 justify-content-between">
                  <h6 class="mb-1">{{ doc.name }}</h6>
                  <small class="text-muted">{{ formatDate(doc.date || doc.uploadDate) }}</small>
                </div>
                <p class="mb-1">Rev. {{ doc.revision }} - Son güncelleme: {{ doc.updatedBy || doc.uploadedBy }}</p>
                <small class="text-muted">{{ getDepartmentName(doc.department) }}</small>
              </a>
            </div>
             <p v-else class="text-center text-muted">Gösterilecek doküman bulunamadı.</p>
          </div>
        </div>
      </div>

      <!-- Teknik Sorgulama Alanı -->
      <div class="col-md-7">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">Teknik Sorgulama (AI Destekli)</h5>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label for="technicalQuestion" class="form-label">Teknik sorunuzu yazın:</label>
              <textarea class="form-control" id="technicalQuestion" rows="3" placeholder="Örneğin: RM 36 CB hücresinde hangi akım trafosu kullanılır?" v-model="technicalQuestion"></textarea>
            </div>
            <button class="btn btn-primary" @click="queryAI" :disabled="isQueryingAI">
                <span v-if="isQueryingAI" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span v-else>Sorgula</span>
            </button>
            <hr v-if="aiResponse || relatedDocuments.length > 0">
            <!-- AI Cevabı -->
            <div class="alert alert-info mt-3" v-if="aiResponse">
              <h6><i class="bi bi-lightbulb"></i> Yapay Zeka Cevabı:</h6>
              <p>{{ aiResponse.text }}</p>
              <p class="mb-0">Referans doküman: <a href="#" @click.prevent="viewDocumentByName(aiResponse.reference)">{{ aiResponse.reference }}</a></p>
            </div>
            <!-- İlgili Dokümanlar -->
            <div class="mt-3" v-if="relatedDocuments.length > 0">
              <h6>İlgili Dokümanlar:</h6>
              <ul>
                <li v-for="doc in relatedDocuments" :key="doc.id"><a href="#" @click.prevent="viewDocument(doc)">{{ doc.name }} - Rev.{{ doc.revision }}</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Doküman Yükleme Modalı -->
    <UploadDocumentModal v-if="isUploadModalOpen" @close="closeUploadModal" @document-uploaded="handleDocumentUploaded" />

    <!-- Doküman Görüntüleme Modalı -->
    <DocumentViewer v-if="selectedDocument" :document="selectedDocument" @close="selectedDocument = null" />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAiService } from '@/services/ai-service';
import { useTechnicalStore } from '@/store/technical';
import { formatDate } from '@/utils/dateUtils';
import { useToast } from '@/composables/useToast';
import UploadDocumentModal from '../components/UploadDocumentModal.vue';
import DocumentViewer from '../components/DocumentViewer.vue';

const { queryTechnical, isProcessing: isQueryingAI } = useAiService();
const technicalStore = useTechnicalStore();
const { showToast } = useToast();

const documents = ref([]);
const searchTerm = ref('');
const technicalQuestion = ref('');
const aiResponse = ref(null);
const relatedDocuments = ref([]);
const isUploadModalOpen = ref(false);
const selectedDocument = ref(null);

onMounted(async () => {
  try {
    await technicalStore.fetchDocuments();
    documents.value = technicalStore.documents;
  } catch (error) {
    console.error('Teknik dokümanlar yüklenemedi:', error);
    showToast('Teknik dokümanlar yüklenirken bir hata oluştu.', 'error');
  }
});

const filteredDocuments = computed(() => {
  if (!searchTerm.value) {
    return documents.value;
  }
  const lowerSearchTerm = searchTerm.value.toLowerCase();
  return documents.value.filter(doc =>
    doc.name.toLowerCase().includes(lowerSearchTerm) ||
    (doc.department && doc.department.toLowerCase().includes(lowerSearchTerm)) ||
    (doc.updatedBy && doc.updatedBy.toLowerCase().includes(lowerSearchTerm))
  );
});

const searchDocuments = () => {
  console.log('Searching for:', searchTerm.value);
};

const queryAI = async () => {
  if (!technicalQuestion.value.trim()) {
    showToast('Lütfen teknik sorunuzu girin.', 'warning');
    return;
  }

  aiResponse.value = null;
  relatedDocuments.value = [];

  try {
    const response = await queryTechnical(technicalQuestion.value);
    
    aiResponse.value = response.answer;
    relatedDocuments.value = response.relatedDocs;

    if (!response.answer || !response.answer.text) {
        showToast('Yapay zeka bir cevap üretemedi.', 'info');
    }

  } catch (error) {
    console.error('AI sorgusu başarısız:', error);
    showToast(`Teknik sorgu sırasında bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`, 'error');
    aiResponse.value = { text: 'Sorgulama sırasında bir hata oluştu. Lütfen tekrar deneyin.', reference: 'Hata' };
  }
};

const openUploadModal = () => {
  isUploadModalOpen.value = true;
};

const closeUploadModal = () => {
  isUploadModalOpen.value = false;
};

const handleDocumentUploaded = (document) => {
  documents.value.unshift(document); // Yeni dokümanı en başa ekle
  showToast(`"${document.name}" dokümanı başarıyla eklendi.`, 'success');
};

const viewDocument = (doc) => {
  selectedDocument.value = doc;
  console.log('Viewing document:', doc.name);
};

const viewDocumentByName = (docName) => {
  const doc = documents.value.find(d => d.name === docName);
  if(doc) {
    viewDocument(doc);
  }
};

const getDepartmentName = (departmentCode) => {
  const departments = {
    'electrical': 'Elektrik Tasarım',
    'mechanical': 'Mekanik Tasarım',
    'purchasing': 'Satın Alma',
    'production': 'Mekanik Üretim',
    'assembly': 'İç Montaj',
    'wiring': 'Kablaj',
    'general_assembly': 'Genel Montaj',
    'testing': 'Test',
    'quality': 'Kalite'
  };
  
  return departments[departmentCode] || departmentCode;
};
</script>

<style scoped>
.list-group-item-action:hover {
  background-color: #f8f9fa;
}
textarea {
  resize: vertical;
}
</style>