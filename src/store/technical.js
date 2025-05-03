/**
 * technical.js
 * Teknik doküman ve sorgulamalar için Pinia store
 */

import { defineStore } from 'pinia';

export const useTechnicalStore = defineStore('technical', {
  state: () => ({
    documents: [],
    isLoading: false,
    error: null,
    selectedDocument: null,
    isAIChatModalOpen: false
  }),

  getters: {
    getDocuments: (state) => state.documents,
    getSelectedDocument: (state) => state.selectedDocument,
    getIsLoading: (state) => state.isLoading
  },

  actions: {
    async fetchDocuments() {
      this.isLoading = true;
      try {
        // Burada API'den teknik dokümanların alınması simüle edildi
        // Gerçek uygulamada bir servis çağrısı yapılacak
        const documents = [
          { 
            id: 1, 
            name: 'RM 36 CB Teknik Şartnamesi', 
            category: 'şartname', 
            version: 'Rev.2.1',
            uploadDate: '2024-04-15',
            size: '2.3 MB',
            downloadUrl: '#',
            description: 'RM 36 CB hücresine ait teknik şartname dokümanı'
          },
          { 
            id: 2, 
            name: 'RM 36 LB Montaj Talimatı', 
            category: 'talimat', 
            version: 'Rev.1.3',
            uploadDate: '2024-04-10',
            size: '1.8 MB',
            downloadUrl: '#',
            description: 'RM 36 LB hücresi montaj talimatları'
          },
          { 
            id: 3, 
            name: 'Akım Trafosu Seçim Kılavuzu', 
            category: 'kılavuz', 
            version: 'Rev.1.3',
            uploadDate: '2024-04-01',
            size: '3.1 MB',
            downloadUrl: '#',
            description: 'Akım trafolarının seçimine ilişkin teknik bilgiler'
          },
          { 
            id: 4, 
            name: 'RM 36 Serisi Bara Montaj Kılavuzu', 
            category: 'kılavuz', 
            version: 'Rev.1.8',
            uploadDate: '2024-03-25',
            size: '4.2 MB',
            downloadUrl: '#',
            description: 'RM 36 serisi için bara montaj kılavuzu'
          },
          { 
            id: 5, 
            name: 'RM 36 Motor Teknik Özellikleri', 
            category: 'teknik doküman', 
            version: 'Rev.1.2',
            uploadDate: '2024-03-20',
            size: '1.4 MB',
            downloadUrl: '#',
            description: 'RM 36 serisi motorlu mekanizmaların teknik özellikleri'
          }
        ];

        this.documents = documents;
        return { success: true, data: documents };
      } catch (error) {
        this.error = 'Teknik dokümanlar yüklenirken bir hata oluştu';
        console.error('Teknik dokümanlar yüklenirken hata:', error);
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },

    selectDocument(document) {
      this.selectedDocument = document;
    },

    clearSelectedDocument() {
      this.selectedDocument = null;
    },

    // AI Chat Modal için durum yönetimi fonksiyonları
    setAIChatModalOpen(isOpen) {
      this.isAIChatModalOpen = isOpen;
    },

    // Teknik sorgulama
    async performTechnicalQuery(question) {
      this.isLoading = true;
      try {
        // Burada gerçek bir AI sorgulama yapılacak
        // Şimdilik simüle edilmiş cevaplar dönüyoruz
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simüle edilmiş gecikme
        
        const lowerQuestion = question.toLowerCase();
        let answer = {
          text: 'Bu konuda bilgi bulunamadı.',
          reference: 'Genel Teknik Doküman'
        };
        
        if (lowerQuestion.includes('akım trafosu')) {
          answer = {
            text: 'RM 36 CB hücresinde genellikle 200-400/5-5A 5P20 7,5/15VA veya 300-600/5-5A 5P20 7,5/15VA özelliklerinde toroidal tip akım trafoları kullanılmaktadır. Canias kodları: 144866% (KAP-80/190-95) veya 142227% (KAT-85/190-95). Bu trafolar Orta Gerilim Hücrelerinde koruma ve ölçme amacıyla kullanılır.',
            reference: 'RM 36 CB Teknik Şartnamesi Rev.2.1'
          };
        } else if (lowerQuestion.includes('bara')) {
          answer = {
            text: 'OG Hücrelerde kullanılan baralar genellikle elektrolitik bakırdır. RM 36 serisi için 582mm ve 432mm uzunluklarında 40x10mm kesitinde düz bakır baralar kullanılır. Stok kodları: 109367% (582mm) ve 109363% (432mm).',
            reference: 'RM 36 Serisi Bara Montaj Kılavuzu Rev.1.8'
          };
        } else if (lowerQuestion.includes('motor') || lowerQuestion.includes('ayırıcı')) {
          answer = {
            text: 'RM 36 serisi hücrelerde kesici ve ayırıcılarda 24VDC motorlar standart olarak kullanılmaktadır. Özel gereksinimler için 48VDC, 110VDC ve 220VAC motorlar da mevcuttur. Çalışma süresi 3-5 saniye arasındadır.',
            reference: 'RM 36 Motor Teknik Özellikleri Rev.1.2'
          };
        } else if (lowerQuestion.includes('rm 36') || lowerQuestion.includes('hücre')) {
          answer = {
            text: 'RM 36 serisi hücreler, 36kV orta gerilim için tasarlanmıştır. Ana bileşenleri: kesici/yük ayırıcı, akım trafosu, gerilim trafosu, koruma rölesi ve bara sisteminden oluşur. Temel hücre tipleri: CB (Kesicili), LB (Yük Ayırıcılı), FL (Sigortalı), RMU (Ring Main Unit).',
            reference: 'RM 36 Serisi Genel Teknik Şartname Rev.3.0'
          };
        }
        
        // İlgili dokümanları bul
        let relatedDocs = this.documents.filter(doc => 
          doc.name.toLowerCase().includes(answer.reference.toLowerCase()) || 
          doc.description.toLowerCase().includes(lowerQuestion)
        );
        
        if (relatedDocs.length === 0) {
          // Eğer tam eşleşme bulunamadıysa kategoriye göre bak
          if (lowerQuestion.includes('akım trafo')) {
            relatedDocs = this.documents.filter(doc => doc.name.toLowerCase().includes('akım trafo'));
          } else if (lowerQuestion.includes('bara')) {
            relatedDocs = this.documents.filter(doc => doc.name.toLowerCase().includes('bara'));
          } else if (lowerQuestion.includes('motor')) {
            relatedDocs = this.documents.filter(doc => doc.name.toLowerCase().includes('motor'));
          } else {
            // Hiçbir şey bulunamadıysa genel teknik dokümanları döndür
            relatedDocs = this.documents.slice(0, 3);
          }
        }
        
        return { 
          success: true, 
          answer: answer,
          relatedDocuments: relatedDocs
        };
      } catch (error) {
        this.error = 'Teknik sorgulama yapılırken bir hata oluştu';
        console.error('Teknik sorgulama hatası:', error);
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    }
  }
});