import { ref } from 'vue';
import { useTechnicalStore } from '@/store/technical';
import { useErpService } from '@/services/erp-service';

/**
 * Yapay Zeka Servisi
 * DeepSeek API entegrasyonu ve kullanıcı sorguları için yapay zeka servisi
 */
export function useAiService() {
  const isProcessing = ref(false);
  const lastResponse = ref(null);
  const history = ref([]);
  const technicalStore = useTechnicalStore();
  const erpService = useErpService();

  // DeepSeek API yapılandırması
  const deepseekConfig = {
    apiKey: '', // Production'da process.env'den alınabilir
    modelName: 'deepseek-chat',
    temperature: 0.7,
    maxTokens: 1000
  };

  /**
   * DeepSeek API anahtarını ayarla
   * @param {string} apiKey - API anahtarı
   */
  const setApiKey = (apiKey) => {
    deepseekConfig.apiKey = apiKey;
    localStorage.setItem('deepseekApiKey', apiKey);
  };

  /**
   * Saklanan API anahtarını yükle
   */
  const loadApiKey = () => {
    try {
      const savedApiKey = localStorage.getItem('deepseekApiKey') || window.DEEPSEEK_API_KEY || '';
      if (savedApiKey) {
        deepseekConfig.apiKey = savedApiKey;
        return true;
      }
    } catch (error) {
      console.error('API anahtarı yüklenemedi:', error);
    }
    return false;
  };

  /**
   * Kullanıcı mesajını işler ve yapay zeka yanıtı döndürür
   * @param {string} message - Kullanıcı mesajı
   * @returns {Promise<Object>} - Yapay zeka yanıtı
   */
  const sendMessage = async (message) => {
    isProcessing.value = true;
    
    try {
      // API anahtarını yükle
      if (!deepseekConfig.apiKey) {
        const loaded = loadApiKey();
        if (!loaded) {
          return {
            text: 'API anahtarı bulunamadı. Lütfen sistem yöneticinize başvurun.',
            source: 'Sistem'
          };
        }
      }
      
      // Mesaj geçmişine ekle
      history.value.push({
        role: 'user',
        content: message,
        timestamp: new Date()
      });
      
      // Üretim ortamında gerçek DeepSeek API'ye bağlanılacak
      // Şimdilik processQuery ile lokal simülasyon yapıyoruz
      let response;
      
      try {
        // Önce sisteme entegre olan verilerden enrich edilmiş bir yanıt bulmayı deneyelim
        response = await processQueryWithSystemContext(message);
      } catch (error) {
        console.error('Zenginleştirilmiş sorgu işleme hatası:', error);
        // Yerel işleme ile devam et
        response = await processQuery(message);
      }
      
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
   * Sistem verileriyle zenginleştirilmiş sorgu işleme
   * ERP, Teknik dokümanlar ve diğer sistemlerden veri çekip analiz yaparak cevap döner
   * @param {string} query - Kullanıcı sorgusu
   */
  const processQueryWithSystemContext = async (query) => {
    // Farklı sistemlerden veri toplama
    const systemData = await getSystemData();
    
    // Sorgunun hangi kategoriye ait olduğunu belirle
    const category = determineQueryCategory(query);
    
    // DeepSeek API için sistem mesajını ve kullanıcı sorgusunu hazırla
    const messages = [
      {
        role: "system",
        content: generateSystemMessage(category, systemData)
      },
      {
        role: "user",
        content: query
      }
    ];
    
    // Gerçek DeepSeek API için hazırlık
    // Bu fonksiyon, production'da gerçek API'ye bağlanacak
    // return await callDeepSeekAPI(messages);
    
    // Simülasyon için:
    return await simulateDeepSeekResponse(query, category, systemData);
  };
  
  /**
   * Kullanıcı sorgusunun kategorisini belirle
   */
  const determineQueryCategory = (query) => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('üretim') || lowerQuery.includes('imalat') || lowerQuery.includes('montaj')) {
      return 'production';
    }
    if (lowerQuery.includes('stok') || lowerQuery.includes('malzeme') || lowerQuery.includes('envanter')) {
      return 'inventory';
    }
    if (lowerQuery.includes('sipariş') || lowerQuery.includes('müşteri') || lowerQuery.includes('teslim')) {
      return 'orders';
    }
    if (lowerQuery.includes('teknik') || lowerQuery.includes('şartname') || lowerQuery.includes('trafo') || lowerQuery.includes('doküman')) {
      return 'technical';
    }
    
    return 'general';
  };
  
  /**
   * Kategori ve sistem verilerine göre yapay zeka için sistem mesajını oluştur
   */
  const generateSystemMessage = (category, systemData) => {
    let baseMessage = "Sen MehmetEndüstriyelTakip sisteminin yapay zeka asistanısın. Orta gerilim hücre üretimi yapan bir şirkete ait sistemlere erişimin var. ";
    
    switch (category) {
      case 'production':
        baseMessage += "Üretim verileri: " + JSON.stringify(systemData.production);
        break;
      case 'inventory':
        baseMessage += "Envanter verileri: " + JSON.stringify(systemData.inventory);
        break;
      case 'orders':
        baseMessage += "Sipariş verileri: " + JSON.stringify(systemData.orders);
        break;
      case 'technical':
        baseMessage += "Teknik dokümanlar: " + JSON.stringify(systemData.technicalDocs);
        break;
    }
    
    baseMessage += " Yanıtların kısa, net ve profesyonel olsun. Bilmediğin konular hakkında tahmin yürütme, sadece verdiğim bilgilere dayanarak cevap ver.";
    
    return baseMessage;
  };
  
  /**
   * Sistemdeki verileri topla (ERP, doküman yönetim sistemi vb.)
   * Gerçek uygulamada ilgili servislerden veri çekilecek
   */
  const getSystemData = async () => {
    try {
      // Gerçek uygulamada: 
      // const orders = await erpService.getRecentOrders();
      // const inventory = await erpService.getInventoryStatus();
      // const production = await productionService.getStatus();
      // const technicalDocs = await technicalStore.getDocuments();
      
      // Simülasyon için örnek veriler:
      return {
        orders: [
          { id: '#0424-1251', customer: 'AYEDAŞ', cellType: 'RM 36 CB', status: 'Gecikiyor', progress: 65 },
          { id: '#0424-1245', customer: 'TEİAŞ', cellType: 'RM 36 CB', status: 'Devam Ediyor', progress: 45 },
          { id: '#0424-1239', customer: 'BEDAŞ', cellType: 'RM 36 LB', status: 'Devam Ediyor', progress: 30 },
          { id: '#0424-1235', customer: 'OSMANİYE ELEKTRİK', cellType: 'RM 36 FL', status: 'Planlandı', progress: 10 }
        ],
        inventory: [
          { code: '137998%', name: 'Siemens 7SR1003-1JA20-2DA0+ZY20 24VDC', stock: 2, required: 8, status: 'Kritik' },
          { code: '144866%', name: 'KAP-80/190-95 Akım Trafosu', stock: 3, required: 5, status: 'Düşük' },
          { code: '120170%', name: 'M480TB/G-027-95.300UN5 Kablo Başlığı', stock: 12, required: 15, status: 'Düşük' },
          { code: '109367%', name: '582mm Bara', stock: 25, required: 18, status: 'Yeterli' }
        ],
        production: {
          daily: { planned: 5, completed: 4, efficiency: 92 },
          weekly: { planned: 24, completed: 21, efficiency: 87.5 },
          issues: ["36kV kesici temininde gecikme", "A2 montaj hattında bakım yapılıyor"]
        },
        technicalDocs: [
          { name: 'RM 36 CB Teknik Çizim', date: '15.10.2024', content: 'RM 36 CB hücresine ait teknik çizim detayları...' },
          { name: 'RM 36 LB Montaj Talimatı', date: '10.10.2024', content: 'RM 36 LB hücresi montaj talimatları...' },
          { name: 'Akım Trafosu Seçim Kılavuzu', date: '01.10.2024', content: 'RM 36 CB hücresinde genellikle 200-400/5-5A 5P20 7,5/15VA veya 300-600/5-5A 5P20 7,5/15VA özelliklerinde toroidal tip akım trafoları kullanılmaktadır. Canias kodları: 144866% (KAP-80/190-95) veya 142227% (KAT-85/190-95). Bu trafolar Orta Gerilim Hücrelerinde koruma ve ölçme amacıyla kullanılır.' }
        ]
      };
    } catch (error) {
      console.error('Sistem verisi alınırken hata:', error);
      return {
        orders: [],
        inventory: [],
        production: {},
        technicalDocs: []
      };
    }
  };
  
  /**
   * DeepSeek API yanıtını simüle et
   */
  const simulateDeepSeekResponse = async (query, category, systemData) => {
    // Simüle edilmiş gecikme
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
    
    const lowerQuery = query.toLowerCase();
    
    // Sorgu kategorisine göre yanıt oluştur
    switch (category) {
      case 'production':
        if (lowerQuery.includes('gecik')) {
          return {
            text: `Sistemde geciken 1 sipariş bulunmaktadır: ${systemData.orders[0].id} no'lu ${systemData.orders[0].customer} firmasına ait ${systemData.orders[0].cellType} hücresi. İlerleme durumu: %${systemData.orders[0].progress}. Gecikmenin ana sebebi ${systemData.production.issues[0]}.`,
            source: 'Üretim Dashboard'
          };
        }
        
        if (lowerQuery.includes('verimlilik') || lowerQuery.includes('performans')) {
          return {
            text: `Günlük üretim verimliliği: %${systemData.production.daily.efficiency} (${systemData.production.daily.completed}/${systemData.production.daily.planned}), haftalık verimlilik: %${systemData.production.weekly.efficiency} (${systemData.production.weekly.completed}/${systemData.production.weekly.planned}). Verimlilik üzerindeki ana etken: ${systemData.production.issues[0]}.`,
            source: 'Üretim Metrikleri'
          };
        }
        
        return {
          text: `Güncel üretim durumu: Bugün ${systemData.production.daily.completed} adet hücre tamamlandı, ${systemData.production.daily.planned - systemData.production.daily.completed} adet hücre hedefine ulaşılamadı. Şu anda toplam ${systemData.orders.length} aktif sipariş üretim sürecinde, ${systemData.orders.filter(o => o.status === 'Gecikiyor').length} tanesi gecikmeli. Ana sorunlar: ${systemData.production.issues.join(', ')}.`,
          source: 'Üretim Dashboard'
        };
        
      case 'inventory':
        if (lowerQuery.includes('kritik') || lowerQuery.includes('acil')) {
          const criticalItems = systemData.inventory.filter(item => item.status === 'Kritik');
          return {
            text: `Kritik seviyede olan malzeme: ${criticalItems.map(i => i.name).join(', ')} (Stok: ${criticalItems.map(i => i.stock).join(', ')}, İhtiyaç: ${criticalItems.map(i => i.required).join(', ')})`,
            source: 'Stok Yönetim Sistemi'
          };
        }
        
        if (lowerQuery.includes('röle') || lowerQuery.includes('siemens')) {
          const relays = systemData.inventory.filter(i => i.name.toLowerCase().includes('siemens'));
          return {
            text: `Siemens röle (kod: ${relays[0]?.code || 'bulunamadı'}) için mevcut stok ${relays[0]?.stock || 0} adet, ancak ihtiyaç ${relays[0]?.required || 'belirsiz'} adet. ${relays[0]?.stock < relays[0]?.required ? 'Acilen sipariş verilmesi gerekiyor.' : 'Stok durumu yeterli.'}`,
            source: 'Stok Yönetim Sistemi'
          };
        }
        
        return {
          text: `Mevcut stok durumu: ${systemData.inventory.filter(i => i.status === 'Kritik').length} malzeme kritik seviyede, ${systemData.inventory.filter(i => i.status === 'Düşük').length} malzeme düşük stokta, ${systemData.inventory.filter(i => i.status === 'Yeterli').length} malzeme yeterli durumdadır. Kritik malzemeler için "malzeme yönetimi" bölümünden sipariş verebilirsiniz.`,
          source: 'Stok Yönetim Sistemi'
        };
        
      case 'technical':
        if (lowerQuery.includes('rm 36 cb')) {
          return {
            text: `RM 36 CB hücresi için teknik çizim Rev.2.1 versiyonu mevcut. Bu hücre tipi 36kV gerilimde çalışır, genellikle 200-400/5-5A 5P20 7,5/15VA özelliklerinde akım trafosu kullanılır. Detaylı teknik şartnameyi teknik dokümanlar bölümünden inceleyebilirsiniz.`,
            source: 'RM 36 CB Teknik Çizim'
          };
        }
        
        if (lowerQuery.includes('akım trafo')) {
          const ctDocs = systemData.technicalDocs.filter(doc => doc.name.toLowerCase().includes('akım trafo'));
          return {
            text: ctDocs[0]?.content || 'RM 36 CB hücresinde genellikle KAP-80/190-95 (kod: 144866%) veya KAT-85/190-95 (kod: 142227%) tip akım trafoları kullanılmaktadır. Mevcutta 3 adet KAP-80/190-95 stokta bulunuyor, 5 adete ihtiyaç var.',
            source: ctDocs[0]?.name || 'Teknik Dokümanlar'
          };
        }
        
        return {
          text: `Sistemde toplam ${systemData.technicalDocs.length} teknik doküman mevcut: ${systemData.technicalDocs.map(doc => doc.name).join(', ')}. Bu dokümanları "Teknik Dokümanlar" sayfasından inceleyebilirsiniz.`,
          source: 'Teknik Dokümanlar'
        };
        
      case 'orders':
        if (lowerQuery.includes('ted')) {
          const tedasOrders = systemData.orders.filter(o => o.customer.includes('TEDAŞ') || o.customer.includes('TEİAŞ'));
          return {
            text: `TEİAŞ/TEDAŞ siparişleri: ${tedasOrders.map(o => `${o.id} (${o.cellType}, ${o.status}, %${o.progress})`).join(', ')}`,
            source: 'Sipariş Yönetim Sistemi'
          };
        }
        
        return {
          text: `Sistemde toplam ${systemData.orders.length} aktif sipariş bulunmaktadır. ${systemData.orders.filter(o => o.status === 'Gecikiyor').length} sipariş gecikmiş durumda, ${systemData.orders.filter(o => o.status === 'Devam Ediyor').length} sipariş devam ediyor, ${systemData.orders.filter(o => o.status === 'Planlandı').length} sipariş ise henüz planlanma aşamasında. Detaylı bilgi için "siparişler" sayfasını inceleyebilirsiniz.`,
          source: 'Sipariş Yönetim Sistemi'
        };
        
      default:
        return {
          text: `Elimdeki bilgilere göre: Sistemde ${systemData.orders.length} aktif sipariş, ${systemData.inventory.length} farklı malzeme kaydı ve ${systemData.technicalDocs.length} teknik doküman bulunuyor. Daha spesifik bilgi için lütfen daha detaylı bir soru sorun. Örneğin "Geciken siparişler nelerdir?" veya "Kritik malzeme durumu nedir?" gibi.`,
          source: 'MehmetEndüstriyelTakip Sistemi'
        };
    }
  };
  
  /**
   * DeepSeek API'ye çağrı yap (gerçek uygulamada kullanılacak)
   */
  const callDeepSeekAPI = async (messages) => {
    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deepseekConfig.apiKey}`
        },
        body: JSON.stringify({
          model: deepseekConfig.modelName,
          messages: messages,
          temperature: deepseekConfig.temperature,
          max_tokens: deepseekConfig.maxTokens
        })
      });
      
      if (!response.ok) {
        throw new Error(`DeepSeek API hatası: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        text: data.choices[0].message.content,
        source: 'DeepSeek AI'
      };
    } catch (error) {
      console.error('DeepSeek API çağrısı başarısız:', error);
      throw error;
    }
  };
  
  /**
   * Temel sorgu işleme (sistem verileri olmadan)
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
   * Teknik bir dokümanı sorgula
   * @param {string} question - Teknik soru
   * @returns {Promise<Object>} - AI yanıtı ve ilgili dokümanlar
   */
  const queryTechnical = async (question) => {
    isProcessing.value = true;
    
    try {
      // Gerçek uygulamada teknik dokümanları alıp işle
      // const documents = await technicalStore.getDocuments();
      // const context = prepareDocumentContext(documents, question);
      
      // DeepSeek API'ye gönder
      // return await callDeepSeekAPIWithContext(question, context);
      
      // Simülasyon için:
      await new Promise(r => setTimeout(r, 1500)); // Gecikme simülasyonu
      
      const lowerQuestion = question.toLowerCase();
      let response, relatedDocs = [];
      
      // Simüle edilmiş yanıtlar
      if (lowerQuestion.includes('akım trafosu')) {
        response = {
          answer: {
            text: 'RM 36 CB hücresinde genellikle 200-400/5-5A 5P20 7,5/15VA veya 300-600/5-5A 5P20 7,5/15VA özelliklerinde toroidal tip akım trafoları kullanılmaktadır. Canias kodları: 144866% (KAP-80/190-95) veya 142227% (KAT-85/190-95).',
            reference: 'Akım Trafosu Seçim Kılavuzu'
          },
          relatedDocs: [
            { id: 'doc5', name: 'Akım Trafosu Seçim Kılavuzu', revision: '1.3' },
            { id: 'doc1', name: 'RM 36 CB Teknik Çizim', revision: '2.1' }
          ]
        };
      } else if (lowerQuestion.includes('bara')) {
        response = {
          answer: {
            text: 'OG Hücrelerde kullanılan baralar genellikle elektrolitik bakırdır. RM 36 serisi için 582mm ve 432mm uzunluklarında 40x10mm kesitinde düz bakır baralar kullanılır. Stok kodları: 109367% (582mm) ve 109363% (432mm).',
            reference: 'RM 36 Serisi Bara Montaj Kılavuzu'
          },
          relatedDocs: [
            { id: 'doc6', name: 'RM 36 Serisi Bara Montaj Kılavuzu', revision: '1.8' },
            { id: 'doc1', name: 'RM 36 CB Teknik Çizim', revision: '2.1' }
          ]
        };
      } else {
        response = {
          answer: {
            text: 'RM 36 serisi hücreler, 36kV orta gerilim için tasarlanmıştır. Ana bileşenleri: kesici/yük ayırıcı, akım trafosu, gerilim trafosu, koruma rölesi ve bara sisteminden oluşur. Temel hücre tipleri: CB (Kesicili), LB (Yük Ayırıcılı), FL (Sigortalı), RMU (Ring Main Unit).',
            reference: 'RM 36 Serisi Genel Teknik Şartname'
          },
          relatedDocs: [
            { id: 'doc7', name: 'RM 36 Serisi Genel Teknik Şartname', revision: '3.0' },
            { id: 'doc1', name: 'RM 36 CB Teknik Çizim', revision: '2.1' }
          ]
        };
      }
      
      return response;
    } catch (error) {
      console.error('Teknik sorgulama hatası:', error);
      throw error;
    } finally {
      isProcessing.value = false;
    }
  };
  
  /**
   * Konuşma geçmişini temizler
   */
  const clearHistory = () => {
    history.value = [];
  };
  
  /**
   * Öngörüler ve analizler oluştur
   * myrule2.mdc'deki yapay zeka öngörülerini karşılar
   */
  const generateInsights = async () => {
    try {
      // Gerçek uygulamada farklı sistem kaynaklarından veri çekilecek
      const systemData = await getSystemData();
      
      // DeepSeek API ile öngörüler üretilecek
      // const rawInsights = await callDeepSeekAPIForInsights(systemData);
      // return processInsights(rawInsights);
      
      // Simüle edilmiş öngörüler
      return [
        {
          title: "36kV Kesici Stok Uyarısı",
          description: "36kV kesiciler kritik seviyeye düştü (4 adet kaldı). Bu hafta 2 yeni sipariş bekleniyor ve tahminlere göre yetersiz kalabilir.",
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
          timestamp: new Date(new Date().getTime() - 3 * 3600000) // 3 saat önce
        },
        // ... diğer öngörüler
      ];
    } catch (error) {
      console.error('Öngörü oluşturma hatası:', error);
      return [];
    }
  };
  
  // Yükleme sırasında API anahtarını kontrol et
  loadApiKey();
  
  return {
    isProcessing,
    lastResponse,
    history,
    sendMessage,
    clearHistory,
    queryTechnical,
    generateInsights,
    setApiKey
  };
}

// main.js dosyasında kullanılan aiService örneğini oluşturup dışa aktarıyorum
export const aiService = {
  sendMessage: async (message) => {
    // Temel yapay zeka yanıtı sağlayan basit bir fonksiyon
    const response = {
      text: `Sorgunuza yanıt: ${message}. Detaylı bilgi için lütfen ilgili sayfada yapay zeka özelliklerini kullanın.`,
      source: 'MehmetEndüstriyelTakip Sistemi'
    };
    return response;
  },
  
  queryTechnical: async (question) => {
    // Teknik sorgulamalar için basit bir fonksiyon
    return {
      answer: {
        text: `Sorgunuz işleme alındı: ${question}. Daha spesifik bilgiler için lütfen teknik dokümantasyon sayfasını kullanın.`,
        reference: 'RM 36 Serisi Genel Teknik Şartname'
      },
      relatedDocs: [
        { id: 'doc7', name: 'RM 36 Serisi Genel Teknik Şartname', revision: '3.0' }
      ]
    };
  },
  
  generateInsights: async () => {
    // Temel öngörüler sağlayan fonksiyon
    return [
      {
        title: "Yapay Zeka Öngörüleri",
        description: "Yapay zeka öngörüleri ve analizler için ilgili sayfayı ziyaret edin.",
        importance: "medium",
        type: "info",
        source: "MehmetEndüstriyelTakip Sistemi",
        timestamp: new Date()
      }
    ];
  }
};