import { ref } from 'vue';

/**
 * Yapay Zeka Servisi
 * Kullanıcı sorguları için yapay zeka servisi
 */
export function useAiService() {
  const isProcessing = ref(false);
  const lastResponse = ref(null);
  const history = ref([]);

  /**
   * Kullanıcı mesajını işler ve yapay zeka yanıtı döndürür
   * @param {string} message - Kullanıcı mesajı
   * @returns {Promise<Object>} - Yapay zeka yanıtı
   */
  const sendMessage = async (message) => {
    isProcessing.value = true;
    
    try {
      // Mesaj geçmişine ekle
      history.value.push({
        role: 'user',
        content: message,
        timestamp: new Date()
      });
      
      // Burada gerçek bir API çağrısı yapılacak
      // Şimdilik simüle ediyoruz
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
      
      const response = await processQuery(message);
      
      // Yanıt geçmişine ekle
      history.value.push({
        role: 'assistant',
        content: response.text,
        source: response.source,
        timestamp: new Date()
      });
      
      lastResponse.value = response;
      return response;
    } catch (error) {
      console.error('AI servisi hatası:', error);
      throw new Error('Mesaj işlenirken bir hata oluştu');
    } finally {
      isProcessing.value = false;
    }
  };
  
  /**
   * Kullanıcı sorgusunu işler
   * @param {string} query - Kullanıcı sorgusu
   * @returns {Promise<Object>} - İşlenmiş yanıt
   */
  const processQuery = async (query) => {
    // Üretim ile ilgili sorgular
    if (query.toLowerCase().includes('üretim') || 
        query.toLowerCase().includes('imalat') || 
        query.toLowerCase().includes('montaj')) {
      return {
        text: 'Güncel üretim durumuna göre, bu hafta 15 adet hücre montajı tamamlandı ve 8 adedi test aşamasında. Toplam 24 aktif siparişin %65\'i üretim planına uygun şekilde ilerliyor. RM36 CB tipi hücrelerde yaklaşık 2 günlük gecikme mevcut.',
        source: 'Üretim Dashboard'
      };
    }
    
    // Stok ile ilgili sorgular
    if (query.toLowerCase().includes('stok') || 
        query.toLowerCase().includes('malzeme') || 
        query.toLowerCase().includes('envanter')) {
      return {
        text: 'Stok durumu güncel verilere göre şöyle: 36kV kesicilerde kritik seviye (4 adet kaldı), SF6 gaz dolum seviyesi yeterli. RM36 CB için 8 adet akım trafosu siparişi verildi, 3 gün içinde teslim bekleniyor. Gerilim trafolarında stok yeterli (14 adet).',
        source: 'Stok Yönetim Sistemi'
      };
    }
    
    // Teknik sorgular
    if (query.toLowerCase().includes('teknik') || 
        query.toLowerCase().includes('şartname') || 
        query.toLowerCase().includes('doküman') ||
        query.toLowerCase().includes('akım trafo') ||
        query.toLowerCase().includes('gerilim trafo')) {
      return {
        text: 'RM 36 serisi hücreler için teknik şartnameler merkezi dokümantasyon sisteminde bulunmaktadır. RM 36 CB hücresinde kullanılan akım trafoları tipik olarak 200-600/5A, 15VA değerlerine sahip olup, epoksi reçine izolasyonludur. Dahili ark koruması IEC 62271-200 standardına göre IAC-A-FLR 16kA, 1s sınıfındadır.',
        source: 'Teknik Dokümanlar'
      };
    }
    
    // Siparişlerle ilgili sorgular
    if (query.toLowerCase().includes('sipariş') || 
        query.toLowerCase().includes('müşteri') || 
        query.toLowerCase().includes('teslim')) {
      return {
        text: 'Bu ayki toplam 7 müşteri siparişinden 5\'i zamanında teslim edildi, 2\'si halen üretimde. Öncelikli olarak TEDAŞ projesi için 12 adet RM36 CB hücresi 15 Mayıs\'ta sevk edilecek. Gecikme riski olan TEİAŞ projesi için ek vardiya planlandı.',
        source: 'Sipariş Yönetim Sistemi'
      };
    }
    
    // Genel bilgi yanıtı
    return {
      text: 'MehmetEndüstriyelTakip sisteminde üretime, stoklara, siparişlere ve teknik bilgilere dair sorular sorabilirsiniz. Örneğin "Üretim durumu nedir?", "Stok seviyeleri nasıl?" veya "RM36 teknik özellikleri nedir?" gibi sorular sorabilirsiniz.',
      source: 'MehmetEndüstriyelTakip Dokümantasyonu'
    };
  };
  
  /**
   * Konuşma geçmişini temizler
   */
  const clearHistory = () => {
    history.value = [];
  };
  
  return {
    isProcessing,
    lastResponse,
    history,
    sendMessage,
    clearHistory
  };
}