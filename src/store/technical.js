/**
 * technical.js
 * Teknik doküman ve sorgulamalar için Pinia store
 */

import { defineStore } from 'pinia';
import { aiService } from '@/services/ai-service';

export const useTechnicalStore = defineStore('technical', {
  state: () => ({
    documents: [],
    isLoading: false,
    error: null,
    selectedDocument: null,
    isAIChatModalOpen: false,
    lastQuery: null,
    recentQueries: []
  }),

  getters: {
    getDocuments: (state) => state.documents,
    getSelectedDocument: (state) => state.selectedDocument,
    getIsLoading: (state) => state.isLoading,
    getRelatedDocuments: (state) => (query) => {
      // İlgili dökümanları sorguya göre filtrele
      const lowerQuery = query.toLowerCase();
      
      // Eğer daha önce tam eşleşen sorgu varsa onu kullan
      if (state.lastQuery && state.lastQuery.query === query && state.lastQuery.relatedDocs) {
        return state.lastQuery.relatedDocs;
      }
      
      let relatedDocs = [];
      
      // Anahtar kelimelere göre ilgili dokümanları bul
      if (lowerQuery.includes('akım trafo')) {
        relatedDocs = state.documents.filter(doc => 
          doc.name.toLowerCase().includes('akım') || 
          doc.name.toLowerCase().includes('trafo') ||
          (doc.description && doc.description.toLowerCase().includes('akım trafo'))
        );
      } else if (lowerQuery.includes('bara')) {
        relatedDocs = state.documents.filter(doc => 
          doc.name.toLowerCase().includes('bara') || 
          (doc.description && doc.description.toLowerCase().includes('bara'))
        );
      } else if (lowerQuery.includes('motor') || lowerQuery.includes('ayırıcı')) {
        relatedDocs = state.documents.filter(doc => 
          doc.name.toLowerCase().includes('motor') ||
          doc.name.toLowerCase().includes('ayır') ||
          (doc.description && (doc.description.toLowerCase().includes('motor') || doc.description.toLowerCase().includes('ayırıcı')))
        );
      } else if (lowerQuery.includes('rm 36') || lowerQuery.includes('hücre')) {
        relatedDocs = state.documents.filter(doc => 
          doc.name.toLowerCase().includes('rm 36') || 
          doc.name.toLowerCase().includes('hücre') ||
          (doc.description && (doc.description.toLowerCase().includes('rm 36') || doc.description.toLowerCase().includes('hücre')))
        );
      } else {
        // Sorgudan anahtar kelimeler çıkar
        const keywords = lowerQuery.split(' ')
          .filter(word => word.length > 3)  // Kısa kelimeleri filtrele
          .filter(word => !['nasıl', 'nedir', 'hangi', 'neden', 'niçin', 'için', 'tarafından'].includes(word));
          
        // Her bir anahtar kelimeye göre puan ver
        const scoredDocs = state.documents.map(doc => {
          let score = 0;
          const docName = doc.name.toLowerCase();
          const docDesc = doc.description ? doc.description.toLowerCase() : '';
          
          keywords.forEach(keyword => {
            if (docName.includes(keyword)) score += 3;
            if (docDesc.includes(keyword)) score += 2;
            if (doc.category && doc.category.toLowerCase().includes(keyword)) score += 1;
          });
          
          return { doc, score };
        });
        
        // Puanı 0'dan büyük olanları en yüksekten başlayarak sırala
        relatedDocs = scoredDocs
          .filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .map(item => item.doc);
          
        // Eğer hiç sonuç yoksa, ilk birkaç dokümanı göster
        if (relatedDocs.length === 0) {
          relatedDocs = state.documents.slice(0, 3);
        }
      }
      
      // En fazla 5 doküman döndür
      return relatedDocs.slice(0, 5);
    }
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
          },
          {
            id: 6,
            name: 'RM 36 CB Test Prosedürü',
            category: 'prosedür',
            version: 'Rev.2.0',
            uploadDate: '2024-03-18',
            size: '2.8 MB',
            downloadUrl: '#',
            description: 'RM 36 CB hücresi test prosedürleri ve kontrol listesi'
          },
          {
            id: 7,
            name: 'Orta Gerilim Hücreler Genel Katalog',
            category: 'katalog',
            version: 'Rev.4.2',
            uploadDate: '2024-02-15',
            size: '8.5 MB',
            downloadUrl: '#',
            description: 'Tüm orta gerilim ürün ailesi için genel katalog'
          },
          {
            id: 8,
            name: 'RM 36 BC STEP Modeli Teknik Çizim',
            category: '3D model',
            version: 'Rev.1.5',
            uploadDate: '2024-02-10',
            size: '15.7 MB',
            downloadUrl: '#',
            description: 'RM 36 BC barınak için STEP formatında 3D teknik çizim'
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

    // Teknik doküman ekle
    addDocument(document) {
      // Yeni bir ID oluştur
      const newId = this.documents.length > 0 ? Math.max(...this.documents.map(d => d.id)) + 1 : 1;
      
      const newDocument = {
        id: newId,
        uploadDate: new Date().toISOString().split('T')[0],
        ...document
      };
      
      this.documents.unshift(newDocument);
      return newDocument;
    },

    // Doküman içeriğini getir
    async getDocumentContent(documentId) {
      this.isLoading = true;
      try {
        // Gerçek bir API çağrısı yapmak yerine demo içerik döndürüyoruz
        const document = this.documents.find(d => d.id === documentId);
        if (!document) {
          throw new Error('Doküman bulunamadı');
        }
        
        // Demo içerik - gerçek uygulamada API'den gelecek
        let content = '';
        
        if (document.name.includes('Akım Trafosu')) {
          content = `# Akım Trafosu Teknik Bilgiler

Model: KAP-80/190-95
Anma Akımı: 200-400/5-5A
Hassasiyet Sınıfı: 5P20
Anma Gücü: 7,5/15VA
Çalışma Frekansı: 50Hz
İzolasyon Seviyesi: 36kV

Kullanım Alanları:
- RM 36 CB hücrelerinde koruma ve ölçme amacıyla kullanılır
- Orta gerilim dağıtım sistemlerinde akım ölçümü
- Diferansiyel koruma sistemleri

Montaj Talimatları:
- Bara bağlantı vidaları 35Nm tork ile sıkılmalıdır
- Terminaller 5Nm tork ile sıkılmalıdır
- Topraklama bağlantısı mutlaka yapılmalıdır`;
        } else if (document.name.includes('Test Prosedürü')) {
          content = `# RM 36 CB Test Prosedürü

Bu prosedür RM 36 CB hücrelerinin fabrika kabul testlerini tanımlar.

## Test Aşamaları

1. Görsel İnceleme
   - Boyalı yüzeylerin kontrolü
   - Etiketlerin kontrolü
   - Kapı mekanizmalarının kontrolü

2. Elektriksel Testler
   - İzolasyon direnci ölçümü
   - Yüksek gerilim testi (36kV)
   - Koruma röle fonksiyon testleri

3. Mekanik Operasyon Testleri
   - Kesicinin açma-kapama testi (minimum 5 operasyon)
   - Manuel ve motorlu operasyon testi
   - Topraklama switch'inin test edilmesi

4. Sensör ve Ölçüm Devreleri
   - Akım trafosu bağlantıları
   - Gerilim trafosu bağlantıları
   - Ölçüm devrelerinin kalibrasyonu

Test sonuçları tabloya kaydedilmeli ve kalite kontrol departmanı tarafından onaylanmalıdır.`;
        } else if (document.name.includes('Bara Montaj')) {
          content = `# RM 36 Serisi Bara Montaj Kılavuzu

## Bara Özellikleri

Tip: Elektrolitik Bakır (E-Cu / OF-Cu)
Standart kesitler: 40x5mm, 40x10mm, 60x10mm 
Uzunluklar: 582mm (Yan hücre bağlantısı için)
            432mm (Tek hücre için)
Stok kodları: 109367% (582mm)
              109363% (432mm)

## Montaj Talimatları

1. Tüm bara bağlantıları temizlenmeli ve oksit oluşumu önlenmelidir.
2. Bara bağlantıları için M12 cıvata kullanılmalı ve 65-70 Nm tork ile sıkılmalıdır.
3. Baralar arasında iletkenliği artırmak için özel iletken pasta kullanılmalıdır.
4. Bara bağlantılarına ısıl kamera ile sıcaklık kontrolü yapılmalıdır.

## Emniyet Uyarıları

- Montaj işlemi sırasında enerji olmadığından emin olunmalıdır.
- Bara bağlantıları için izole eldivenler kullanılmalıdır.
- Tüm bara uçları yalıtım kapaklarıyla kapatılmalıdır.`;
        } else if (document.name.includes('Motor Teknik')) {
          content = `# RM 36 Motor Teknik Özellikleri

## Motor Parametreleri

Nominal Gerilim: 24V DC (Standart)
Alternatif Gerilimler: 48V DC, 110V DC, 220V AC (Özel sipariş)
Güç: 
- Ayırıcı motorları: 60W
- Kesici motorları: 85W
- Topraklama switch motorları: 40W

Çalışma Süresi: 3-5 saniye (tam açma/kapama)
Motor Tipi: Redüktörlü DC motor
Koruma Sınıfı: IP54

## Bakım Bilgileri

- 10,000 operasyonda bir yağlama yapılmalıdır
- 50,000 operasyonda bir motor değişimi önerilir
- Her yıl çalışma performansı kontrol edilmelidir`;
        } else {
          content = `# ${document.name} içeriği

Bu doküman için detaylı içerik bulunmamaktadır. Lütfen doküman yöneticisiyle iletişime geçiniz.`;
        }
        
        return { 
          success: true, 
          content,
          document
        };
        
      } catch (error) {
        this.error = 'Doküman içeriği yüklenirken bir hata oluştu';
        console.error('Doküman içeriği yüklenirken hata:', error);
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },

    // Teknik sorgulama
    async performTechnicalQuery(question) {
      this.isLoading = true;
      try {
        // Önce sorguyla ilgili dokümanları bul
        const relatedDocs = this.getRelatedDocuments(question);
        
        // AI servisi üzerinden sorgulama yap
        let answer = null;
        
        try {
          // Sorgu için doküman içeriği hazırla
          const docPromise = relatedDocs.length > 0 ? 
            this.getDocumentContent(relatedDocs[0].id) : 
            Promise.resolve({ success: false });
            
          const docResult = await docPromise;
          
          // Eğer doküman varsa AI analizi yap
          if (docResult.success && docResult.content) {
            const document = {
              id: relatedDocs[0].id,
              name: relatedDocs[0].name,
              content: docResult.content
            };
            
            const aiResult = await aiService.analyzeDocument(document, question);
            
            if (aiResult && aiResult.success) {
              answer = {
                text: aiResult.text,
                reference: relatedDocs[0].name + ' ' + relatedDocs[0].version
              };
            }
          }
        } catch (aiError) {
          console.warn('AI analizi yapılamadı, demo cevap kullanılacak:', aiError);
        }
        
        // Eğer AI analizi başarısız olduysa demo cevap kullan
        if (!answer) {
          answer = this.getDemoAnswer(question);
        }
        
        // Son sorguyu kaydet
        this.lastQuery = {
          query: question,
          answer,
          relatedDocs,
          timestamp: new Date()
        };
        
        // Son sorguları güncelle
        if (this.recentQueries.length >= 5) {
          this.recentQueries.pop(); // En eski sorguyu sil
        }
        this.recentQueries.unshift({
          query: question,
          timestamp: new Date()
        });
        
        return { 
          success: true, 
          answer,
          relatedDocs
        };
        
      } catch (error) {
        this.error = 'Teknik sorgulama yapılırken bir hata oluştu';
        console.error('Teknik sorgulama hatası:', error);
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },
    
    // Demo cevaplar oluştur
    getDemoAnswer(question) {
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
      } else if (lowerQuestion.includes('montaj')) {
        answer = {
          text: 'RM 36 LB hücresinin montajı için özel talimatlar bulunmaktadır. Mekanik montaj işlemleri için montaj talimatına göre işlem yapılmalıdır.',
          reference: 'RM 36 LB Montaj Talimatı Rev.1.3'
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
      
      return answer;
    }
  }
});