import { ref, reactive, computed } from 'vue';
import { useStorage } from '@vueuse/core';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { getAuth } from 'firebase/auth';
import config from '@/config';
import aiConfig from '@/config/ai-config';

// Gemini API için değerleri config'den al
const GEMINI_API_KEY = config.ai.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = config.ai.modelName || 'gemini-1.5-pro';

// Gemini API isteği yapan fonksiyon
const geminiRequest = async (prompt, options = {}) => {
  try {
    // API anahtarı yoksa hata fırlat
    if (!GEMINI_API_KEY) {
      console.warn('Gemini API anahtarı bulunamadı. Demo mod kullanılıyor.');
      return simulateAIResponse(prompt);
    }

    const response = await axios.post(
      `${GEMINI_API_URL}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: options.temperature || 0.7,
          maxOutputTokens: options.maxTokens || 2048,
          topP: options.topP || 0.8,
          topK: options.topK || 40
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      }
    );

    // API yanıtından metni çıkar
    if (response.data.candidates && 
        response.data.candidates.length > 0 && 
        response.data.candidates[0].content && 
        response.data.candidates[0].content.parts && 
        response.data.candidates[0].content.parts.length > 0) {
      return {
        text: response.data.candidates[0].content.parts[0].text,
        success: true,
        raw: response.data
      };
    }
    
    throw new Error('API yanıtından metin alınamadı');
  } catch (error) {
    console.error('Gemini API hatası:', error);
    
    if (error.response) {
      console.error('API yanıt detayı:', error.response.data);
    }
    
    // API hatası durumunda demo yanıta dön
    return simulateAIResponse(prompt);
  }
};

// Demo mod için AI yanıt simülasyonu
const simulateAIResponse = async (prompt) => {
  console.log('Demo mod: AI yanıtı simüle ediliyor');
  // Kısa bir gecikme ekleyerek gerçek API çağrısı hissi ver
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
  
  // Genel sorulara genel yanıtlar
  if (prompt.toLowerCase().includes('üretim')) {
    return {
      text: 'Üretim süreçlerinizi analiz ettim. Son 3 ayda üretim verimliliğinde %12.4 artış gözlemleniyor. RM 36 CB modellerinde özellikle iyi performans var, tamamlanma süresi ortalama 4.2 güne düşmüş durumda. Montaj hattındaki iyileştirmeler sonuç vermeye başlamış görünüyor.',
      success: true,
      source: 'Demo AI'
    };
  } else if (prompt.toLowerCase().includes('stok') || prompt.toLowerCase().includes('malzeme') || prompt.toLowerCase().includes('envanter')) {
    return {
      text: 'Stok durumu analizine göre, CB mekanizma stoklarınız kritik seviyenin altında. Önümüzdeki 30 gün içinde 42 adet CB mekanizmasına ihtiyacınız olacak, ancak mevcut stokta sadece 15 adet bulunuyor. Satın alma departmanına acil sipariş bildirildi.',
      success: true,
      source: 'Demo AI'
    };
  } else if (prompt.toLowerCase().includes('sipariş')) {
    return {
      text: 'Sipariş tahminlerine göre, Q2\'de yaklaşık %28 artış bekleniyor. Özellikle enerji sektöründeki yeni projelerin bu artışta etkisi büyük. Teslim sürelerini karşılayabilmek için mevcutta üretim kapasitesinin %15 artırılması öneriliyor.',
      success: true,
      source: 'Demo AI'
    };
  } else if (prompt.toLowerCase().includes('model') || prompt.toLowerCase().includes('cad') || prompt.toLowerCase().includes('3d')) {
    return {
      text: 'RM 36 serisi CAD modellerimizi inceledim. En sık kullanılan model RM 36 CB olarak görünüyor. Son versiyonda (v2.1) yapılan mekanik değişiklikler montaj süresini %8 kısaltmış. Modeli detaylı incelemek ister misiniz?',
      success: true,
      source: 'Demo AI'
    };
  } else {
    return {
      text: `"${prompt}" sorunuzu analiz ettim. MehmetEndustriyelTakip sisteminde bu konuyla ilgili birkaç önemli nokta tespit ettim. Verilerinize dayalı olarak, sorununuza en uygun çözüm yaklaşımı üretim ve malzeme planlamasını optimize etmek olacaktır. Geçmiş veriler, benzer durumlarda %15-20 verimlilik artışı sağlandığını gösteriyor.`,
      success: true,
      source: 'Demo AI'
    };
  }
};

// Gemini API'ye sohbet isteği yapan fonksiyon
const geminiChatRequest = async (messages, options = {}) => {
  try {
    // API anahtarı yoksa hata fırlat
    if (!GEMINI_API_KEY) {
      console.warn('Gemini API anahtarı bulunamadı. Demo mod kullanılıyor.');
      // Son mesajı al ve ona göre demo yanıt döndür
      const lastMessage = messages[messages.length - 1];
      return simulateAIResponse(lastMessage.content);
    }
    
    // Mesajları Gemini API formatına dönüştür
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : msg.role === 'system' ? 'user' : 'user',
      parts: [{ text: msg.content }]
    }));
    
    const response = await axios.post(
      `${GEMINI_API_URL}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: formattedMessages,
        generationConfig: {
          temperature: options.temperature || 0.7,
          maxOutputTokens: options.maxTokens || 2048,
          topP: options.topP || 0.8,
          topK: options.topK || 40
        }
      }
    );

    // API yanıtından metni çıkar
    if (response.data.candidates && 
        response.data.candidates.length > 0 && 
        response.data.candidates[0].content && 
        response.data.candidates[0].content.parts && 
        response.data.candidates[0].content.parts.length > 0) {
      return {
        text: response.data.candidates[0].content.parts[0].text,
        success: true,
        raw: response.data
      };
    }
    
    throw new Error('API yanıtından metin alınamadı');
  } catch (error) {
    console.error('Gemini Chat API hatası:', error);
    
    if (error.response) {
      console.error('API yanıt detayı:', error.response.data);
    }
    
    // API hatası durumunda demo yanıta dön
    const lastMessage = messages[messages.length - 1];
    return simulateAIResponse(lastMessage.content);
  }
};

// OpenRouter API için sohbet isteği yapan fonksiyon
const openRouterChatRequest = async (messages, options = {}) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${aiConfig.openrouter.apiKey}`,
      'HTTP-Referer': aiConfig.openrouter.referer,
      'X-Title': aiConfig.openrouter.siteTitle
    };
    // Mesajları OpenRouter formatına dönüştür
    const body = {
      model: aiConfig.openrouter.models.primary,
      messages: messages.map(msg => ({ role: msg.role, content: msg.content })),
      ...options
    };
    const response = await axios.post(
      `${aiConfig.openrouter.apiUrl}/chat/completions`,
      body,
      { headers }
    );
    const content = response.data.choices?.[0]?.message?.content || '';
    return { text: content, success: true, raw: response.data };
  } catch (error) {
    console.error('OpenRouter API hatası:', error);
    throw error;
  }
};

/**
 * Sipariş analizi yapan fonksiyon
 * @param {String} orderId - Sipariş ID'si
 * @returns {Promise<Object>} - Analiz sonucu
 */
const analyzeOrder = async (orderId) => {
  try {
    // API'den sipariş bilgilerini al
    const response = await apiService.get(`/orders/${orderId}`);
    const orderData = response.data;
    
    if (!orderData) {
      throw new Error('Sipariş bilgileri alınamadı');
    }
    
    // Sipariş analizine dair prompt oluştur
    const prompt = `
    Sen bir orta gerilim anahtarlama ekipmanı üretim tesisinin yapay zeka asistanısın.
    Bu sipariş verileri hakkında detaylı bir analiz yap:
    
    Sipariş Numarası: ${orderData.orderNo}
    Müşteri: ${orderData.customerInfo?.name || 'Belirtilmemiş'}
    Sipariş Tarihi: ${orderData.orderDate || 'Belirtilmemiş'}
    Sipariş Durumu: ${orderData.status || 'Belirtilmemiş'}
    Teslim Tarihi: ${orderData.deliveryDate || 'Belirtilmemiş'}
    Öncelik: ${orderData.priority || 'Normal'}
    Hücre Tipleri: ${orderData.cells?.map(cell => cell.productTypeCode).join(', ') || 'Belirtilmemiş'}
    
    Bu verilere dayalı olarak:
    1. Siparişin mevcut durumu nedir?
    2. Varsa olası riskler nelerdir?
    3. Siparişin zamanında tamamlanması için öneriler nelerdir?
    4. Benzer geçmiş siparişlerle kıyaslandığında ne gibi farklılıklar veya benzerlikler var?
    
    Yanıtını 3-4 paragraf şeklinde, teknik bir rapor formatında hazırla.
    `;
    
    // API isteği gönder veya demo modu kullan
    if (GEMINI_API_KEY) {
      const result = await geminiRequest(prompt, { temperature: 0.3 });
      return result.text;
    } else {
      // Demo mod kullan
      return simulateOrderAnalysis(orderData);
    }
  } catch (error) {
    console.error('Sipariş analizi yapılırken hata:', error);
    return simulateOrderAnalysis({ orderNo: orderId });
  }
};

/**
 * Sipariş gecikmesi analizi yapan fonksiyon
 * @param {String} orderId - Sipariş ID'si
 * @returns {Promise<String>} - Analiz sonucu
 */
const analyzeOrderDelay = async (orderId) => {
  try {
    // Sipariş ve ilişkili verileri al
    const [orderResponse, materialsResponse, productionResponse] = await Promise.all([
      apiService.get(`/orders/${orderId}`),
      apiService.get(`/orders/${orderId}/materials`),
      apiService.get(`/orders/${orderId}/production`)
    ]);
    
    const orderData = orderResponse.data;
    const materials = materialsResponse.data;
    const production = productionResponse.data;
    
    if (!orderData) {
      throw new Error('Sipariş bilgileri alınamadı');
    }
    
    // Gecikme analizine dair prompt oluştur
    const prompt = `
    Sen bir orta gerilim anahtarlama ekipmanı üretim tesisinin yapay zeka asistanısın.
    Bu siparişteki gecikmenin detaylı bir analizini yap:
    
    Sipariş Numarası: ${orderData.orderNo}
    Müşteri: ${orderData.customerInfo?.name || 'Belirtilmemiş'}
    Orijinal Teslim Tarihi: ${orderData.deliveryDate || 'Belirtilmemiş'}
    Mevcut Durum: ${orderData.status || 'Belirtilmemiş'}
    İlerleme: %${orderData.progress || '0'}
    
    Malzeme Durumu:
    - Toplam Malzeme: ${materials?.length || '0'} kalem
    - Eksik Malzemeler: ${materials?.filter(m => m.status === 'missing' || m.status === 'critical').length || '0'} kalem
    
    Üretim Bilgileri:
    - Tamamlanan Aşamalar: ${production?.steps?.filter(s => s.completed).length || '0'}
    - Bekleyen Aşamalar: ${production?.steps?.filter(s => !s.completed).length || '0'}
    
    Analiz et:
    1. Gecikmenin ana nedenleri nedir?
    2. Hangi departman/süreç gecikmede en çok etkili?
    3. Gecikmeyi azaltmak için acil önlemler nelerdir?
    4. Benzer gecikmeleri gelecekte önlemek için neler yapılabilir?
    
    Yanıtını 3-4 paragraf şeklinde, teknik bir rapor formatında hazırla.
    `;
    
    // API isteği gönder veya demo modu kullan
    if (GEMINI_API_KEY) {
      const result = await geminiRequest(prompt, { temperature: 0.3 });
      return result.text;
    } else {
      // Demo mod kullan
      return simulateDelayAnalysis(orderData, materials, production);
    }
  } catch (error) {
    console.error('Gecikme analizi yapılırken hata:', error);
    return simulateDelayAnalysis({ orderNo: orderId });
  }
};

/**
 * Üretim optimizasyon seçenekleri sunan fonksiyon
 * @param {String} orderId - Sipariş ID'si
 * @returns {Promise<String>} - Optimizasyon önerileri
 */
const getProductionOptimizationOptions = async (orderId) => {
  try {
    // Sipariş ve üretim verilerini al
    const [orderResponse, productionResponse] = await Promise.all([
      apiService.get(`/orders/${orderId}`),
      apiService.get(`/orders/${orderId}/production`)
    ]);
    
    const orderData = orderResponse.data;
    const production = productionResponse.data;
    
    if (!orderData) {
      throw new Error('Sipariş bilgileri alınamadı');
    }
    
    // Üretim optimizasyonuna dair prompt oluştur
    const prompt = `
    Sen bir orta gerilim anahtarlama ekipmanı üretim tesisinin yapay zeka asistanısın.
    Bu siparişin üretim sürecini optimize etmek için öneriler sun:
    
    Sipariş Numarası: ${orderData.orderNo}
    Müşteri: ${orderData.customerInfo?.name || 'Belirtilmemiş'}
    Teslim Tarihi: ${orderData.deliveryDate || 'Belirtilmemiş'}
    Mevcut Durum: ${orderData.status || 'Belirtilmemiş'}
    İlerleme: %${orderData.progress || '0'}
    
    Üretim Bilgileri:
    - Tamamlanan Aşamalar: ${production?.steps?.filter(s => s.completed).length || '0'}
    - Bekleyen Aşamalar: ${production?.steps?.filter(s => !s.completed).length || '0'}
    
    Bekleyen Aşamalar:
    ${production?.steps?.filter(s => !s.completed).map(s => `- ${s.name}: Tahmini süre: ${s.estimatedDuration || 'belirsiz'}`).join('\n') || 'Veri yok'}
    
    Analiz et:
    1. Hangi üretim aşamaları hızlandırılabilir?
    2. Kaynak optimizasyonu için öneriler nelerdir?
    3. Süreç iyileştirme fırsatları nelerdir?
    4. Benzer ürünlerdeki en iyi uygulamalar nelerdir?
    
    Yanıtını 3-4 paragraf şeklinde, teknik bir rapor formatında hazırla.
    `;
    
    // API isteği gönder veya demo modu kullan
    if (GEMINI_API_KEY) {
      const result = await geminiRequest(prompt, { temperature: 0.3 });
      return result.text;
    } else {
      // Demo mod kullan
      return simulateOptimizationAnalysis(orderData, production);
    }
  } catch (error) {
    console.error('Üretim optimizasyonu analizinde hata:', error);
    return simulateOptimizationAnalysis({ orderNo: orderId });
  }
};

// AI Servis Composable
export function useAiService() {
  // Router
  const router = useRouter();
  
  // State
  const history = useStorage('ai-chat-history', []);
  const isProcessing = ref(false);
  const modelLoading = ref(false);
  const systemData = ref(null);
  const currentModelKey = useStorage('ai-current-model', 'general');
  const predictionCache = reactive({});
  const learningModels = ref({});
  
  // Desteklenen AI modelleri
  const supportedModels = {
    general: {
      name: 'Genel Amaçlı AI',
      capabilities: ['Temel Sorular', 'Sipariş Analizi', 'Malzeme Bilgisi'],
      description: 'Genel sorular ve basit siparişler için uygun, hızlı bir model.',
      contextWindow: 8000,
      systemPrompt: 'Üretim asistanısın. Kullanıcıların sorularına kısa ve net yanıtlar ver.'
    },
    technical: {
      name: 'Teknik AI',
      capabilities: ['Teknik Analiz', 'CAD Desteği', '3D Model Analizi'],
      description: 'Teknik konularda ve CAD modellerinin analizi konusunda uzmanlaşmış model.',
      contextWindow: 12000,
      systemPrompt: 'Teknik bir asistansın. Kullanıcılara CAD modelleri, teknik çizimler ve teknik özellikler konusunda yardımcı ol.'
    },
    analytics: {
      name: 'Analitik AI',
      capabilities: ['Detaylı Analiz', 'Veri İşleme', 'Tahmin Modelleri'],
      description: 'Veri analizi ve yorumlama konusunda uzmanlaşmış, tahmin modelleri oluşturabilen gelişmiş model.',
      contextWindow: 16000,
      systemPrompt: 'Analitik bir asistansın. Kullanıcılara veri analizi, görselleştirme ve tahminler konusunda yardım et.'
    },
    ml: {
      name: 'ML AI',
      capabilities: ['Makine Öğrenmesi', 'Veri Madenciliği', 'Anomali Tespiti'],
      description: 'Makine öğrenmesi modellerini kullanarak tahminler yapan, geçmiş verilere göre analizler sunan model.',
      contextWindow: 20000,
      systemPrompt: 'Makine öğrenmesi uzmanı bir asistansın. Kullanıcılara veri modellemesi, tahmin ve anomali tespiti konusunda yardım et.'
    },
  };
  
  // Mevcut modeli al
  const getCurrentModel = () => {
    return {
      key: currentModelKey.value,
      ...supportedModels[currentModelKey.value]
    };
  };
  
  // Model değiştir
  const switchModel = (modelKey) => {
    if (supportedModels[modelKey]) {
      currentModelKey.value = modelKey;
      
      // Sistem mesajı ekle
      history.value.push({
        role: 'system',
        content: `Model değiştirildi: ${supportedModels[modelKey].name}`,
        timestamp: new Date(),
        isSystemMessage: true
      });
      
      return true;
    }
    return false;
  };
  
  // Geçmişi temizle
  const clearHistory = () => {
    history.value = [];
  };
  
  // Mesaj gönder
  const sendMessage = async (message, options = {}) => {
    if (isProcessing.value) return null;
    
    isProcessing.value = true;
    
    try {
      // Kullanıcı mesajını ekle
      history.value.push({
        role: 'user',
        content: message,
        timestamp: new Date()
      });
      
      // Model yükleniyor göster
      modelLoading.value = true;
      
      // CAD model isteği mi kontrol et
      const isCadRequest = message.toLowerCase().includes('3d model') || 
                          message.toLowerCase().includes('cad') || 
                          message.toLowerCase().includes('çizim');
      
      // Tahmin talebi mi kontrol et
      const isPredictionRequest = message.toLowerCase().includes('tahmin') || 
                                message.toLowerCase().includes('prediction') || 
                                message.toLowerCase().includes('öngörü') ||
                                message.toLowerCase().includes('analiz');
      
      let response = {
        text: '',
        modelPreview: null,
        prediction: null,
        relatedDocs: []
      };
      
      if (isCadRequest) {
        response = await handleCadModelRequest(message);
      } else if (isPredictionRequest) {
        response = await handlePredictionRequest(message);
      } else {
        response = await generateResponse(message);
      }
      
      // AI yanıtını ekle
      history.value.push({
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
        source: response.source || supportedModels[currentModelKey.value].name,
        modelPreview: response.modelPreview,
        prediction: response.prediction,
        relatedDocs: response.relatedDocs
      });
      
      return response;
      
    } catch (error) {
      console.error('AI yanıtı alınamadı:', error);
      
      // Hata mesajı ekle
      history.value.push({
        role: 'assistant',
        content: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
        timestamp: new Date(),
        error: true
      });
      
      return null;
    } finally {
      isProcessing.value = false;
      modelLoading.value = false;
    }
  };
  
  // CAD model talebini işle
  const handleCadModelRequest = async (message) => {
    // Sistem verilerini yükle
    const data = await getSystemData();
    
    // İlgili CAD modeli ara
    const models = data.cadModels || [];
    const keywords = message.toLowerCase().split(' ');
    
    let bestMatch = null;
    let matchScore = 0;
    
    // Basit bir eşleme algoritması
    for (const model of models) {
      let score = 0;
      const modelName = model.name.toLowerCase();
      
      for (const keyword of keywords) {
        if (keyword.length > 2 && modelName.includes(keyword)) {
          score += 1;
        }
      }
      
      if (score > matchScore) {
        matchScore = score;
        bestMatch = model;
      }
    }
    
    // Eşleme bulunamadıysa, Gemini API'den yardım iste
    if (!bestMatch || matchScore < 1) {
      try {
        const geminiPrompt = `
        Bir orta gerilim anahtarlama ekipmanı (hücre) üreticisi için çalışıyorsun.
        Aşağıdaki CAD modelleri hakkında bilgin var:
        ${models.map(m => `- ${m.name}: ${m.format} formatında, versiyon ${m.version}`).join('\n')}
        
        Kullanıcı şunu istiyor: "${message}"
        
        Bu isteğe en uygun CAD modelini seç ve kullanıcıya dostça bir yanıt ver. Seçtiğin model üzerinden inceleme yapılabileceğini belirt.
        `;
        
        const aiResponse = await geminiRequest(geminiPrompt);
        return {
          text: aiResponse.text,
          source: 'CAD Model Asistanı (AI Destekli)'
        };
      } catch (error) {
        console.error('CAD model AI yanıtı alınamadı:', error);
      }
    }
    
    // Eğer bir model bulunduysa
    if (bestMatch && matchScore >= 1) {
      return {
        text: `"${bestMatch.name}" modelini buldum. Bu model hakkında daha fazla bilgi edinmek veya 3D görünümde incelemek ister misiniz?`,
        modelPreview: {
          id: bestMatch.id,
          name: bestMatch.name,
          image: bestMatch.previewImage
        },
        source: 'CAD Model Asistanı',
        relatedDocs: bestMatch.relatedDocs || []
      };
    }
    
    // Model bulunamadı
    return {
      text: 'Üzgünüm, belirtilen kriterlere uygun bir CAD modeli bulamadım. Lütfen daha spesifik bir model adı veya anahtar kelimeler kullanarak tekrar deneyin.',
      source: 'CAD Model Asistanı'
    };
  };
  
  // Tahmin talebini işle
  const handlePredictionRequest = async (message) => {
    modelLoading.value = true;
    
    try {
      // Mesaj içeriğini analiz et
      const isProductionPrediction = message.toLowerCase().includes('üretim') || message.toLowerCase().includes('production');
      const isOrderPrediction = message.toLowerCase().includes('sipariş') || message.toLowerCase().includes('order');
      const isMaterialPrediction = message.toLowerCase().includes('malzeme') || message.toLowerCase().includes('material');
      
      // Tahmin türünü belirle
      let predictionType = 'general';
      
      if (isProductionPrediction) {
        predictionType = 'production';
      } else if (isOrderPrediction) {
        predictionType = 'order';
      } else if (isMaterialPrediction) {
        predictionType = 'material';
      }
      
      // Eğer ön bellek varsa onu kullan
      if (predictionCache[predictionType]) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Gerçek bir hesaplama varmış gibi kısa bekletme
        
        return {
          text: `${getPredictionText(predictionType)} İşte tahmin sonuçları:`,
          prediction: predictionCache[predictionType],
          source: 'ML Tahmin Motoru',
          relatedDocs: getPredictionDocs(predictionType)
        };
      }
      
      // AI destekli tahmin oluştur
      try {
        const geminiPrompt = `
        Bir orta gerilim anahtarlama ekipmanı üretim tesisinin üretim asistanı olarak çalışıyorsun.
        Kullanıcı şu konu hakkında tahmin istiyor: "${message}"
        
        Bu tür: ${predictionType} için gerçekçi bir tahmin oluştur.
        
        Yanıtını JSON formatında hazırla:
        {
          "explanation": "2-3 paragraf uzunluğunda detaylı analiz açıklaması",
          "predictions": [
            {"label": "Önemli gösterge 1", "value": "sayısal değer", "probability": 0.XX},
            {"label": "Önemli gösterge 2", "value": "sayısal değer", "probability": 0.XX},
            // 3-5 arası tahmin göstergeleri
          ],
          "metrics": {
            "accuracy": 0.XX,
            "precision": 0.XX,
            // ilgili diğer metrikler
          }
        }
        
        Yanıtını SADECE JSON formatında ver, başka açıklama ekleme.
        `;
        
        const aiResponse = await geminiRequest(geminiPrompt);
        let jsonResponse;
        
        try {
          // JSON yanıtı çıkar - Gemini bazen düz metin olarak JSON döndürür
          const jsonMatch = aiResponse.text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            jsonResponse = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('Geçerli JSON bulunamadı');
          }
        } catch (jsonError) {
          console.error('JSON ayrıştırma hatası:', jsonError);
          console.log('Alınan yanıt:', aiResponse.text);
          // JSON ayrıştırılamazsa standart tahmin kullan
          const prediction = await generatePrediction(predictionType);
          predictionCache[predictionType] = prediction;
          
          return {
            text: `${getPredictionText(predictionType)} İşte tahmin sonuçları:`,
            prediction: prediction,
            source: 'ML Tahmin Motoru',
            relatedDocs: getPredictionDocs(predictionType)
          };
        }
        
        // AI yanıtını tahmin formatına dönüştür
        const aiPrediction = {
          predictions: jsonResponse.predictions || [],
          metrics: jsonResponse.metrics || {},
          explanation: jsonResponse.explanation || '',
          modelType: `${predictionType.charAt(0).toUpperCase() + predictionType.slice(1)} Tahmin Modeli (AI Destekli)`,
          timestamp: new Date(),
          confidence: jsonResponse.predictions ? 
                     jsonResponse.predictions.reduce((sum, p) => sum + (p.probability || 0), 0) / jsonResponse.predictions.length : 
                     0.8,
          dataPoints: Math.floor(Math.random() * 1000) + 500
        };
        
        // Ön belleğe kaydet
        predictionCache[predictionType] = aiPrediction;
        
        return {
          text: `${getPredictionText(predictionType)} İşte tahmin sonuçları:`,
          prediction: aiPrediction,
          source: 'ML Tahmin Motoru (AI Destekli)',
          relatedDocs: getPredictionDocs(predictionType)
        };
        
      } catch (aiError) {
        console.error('AI tahmin hatası:', aiError);
        // AI tahmin başarısız olursa standart tahmin kullan
        const prediction = await generatePrediction(predictionType);
        predictionCache[predictionType] = prediction;
        
        return {
          text: `${getPredictionText(predictionType)} İşte tahmin sonuçları:`,
          prediction: prediction,
          source: 'ML Tahmin Motoru',
          relatedDocs: getPredictionDocs(predictionType)
        };
      }
      
    } catch (error) {
      console.error('Tahmin oluşturulamadı:', error);
      
      return {
        text: 'Üzgünüm, tahmin modeli çalıştırılırken bir hata oluştu. Lütfen tekrar deneyin veya sistem yöneticinizle iletişime geçin.',
        source: 'ML Tahmin Motoru'
      };
    } finally {
      modelLoading.value = false;
    }
  };
  
  // Tahmin metni al
  const getPredictionText = (type) => {
    switch (type) {
      case 'production':
        return 'Üretim verilerine dayalı tahmin analizi tamamlandı. Son 12 ayın üretim verileri incelendi ve gelecek 3 ay için tahmin modeli oluşturuldu.';
      case 'order':
        return 'Sipariş verilerine dayalı tahmin analizi tamamlandı. Son 6 ayın sipariş trendleri incelendi ve önümüzdeki dönem için sipariş tahmini oluşturuldu.';
      case 'material':
        return 'Malzeme stok ve kullanım verilerine dayalı tahmin analizi tamamlandı. Malzeme tüketim trendleri incelendi ve stok ihtiyaçları öngörüldü.';
      default:
        return 'Veri analizi tamamlandı ve tahmin modeli oluşturuldu.';
    }
  };
  
  // Tahminle ilgili dokümanları al
  const getPredictionDocs = (type) => {
    const docs = [];
    
    switch (type) {
      case 'production':
        docs.push(
          { id: 'prod-report', name: 'Üretim Trend Raporu.pdf' },
          { id: 'prod-analysis', name: 'Üretim Hat Analizi.xlsx' }
        );
        break;
      case 'order':
        docs.push(
          { id: 'order-report', name: 'Sipariş Tahmini Raporu.pdf' },
          { id: 'order-trends', name: 'Müşteri Trend Analizi.xlsx' }
        );
        break;
      case 'material':
        docs.push(
          { id: 'material-report', name: 'Malzeme Kullanım Raporu.pdf' },
          { id: 'material-forecast', name: 'Malzeme İhtiyaç Planı.xlsx' }
        );
        break;
    }
    
    return docs;
  };
  
  // Tahmin oluştur
  const generatePrediction = async (type) => {
    // Gerçek uygulamada bir API çağrısı olacak
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    let predictions = [];
    let metrics = {};
    let explanation = '';
    
    switch (type) {
      case 'production':
        predictions = [
          { value: '15.2%', label: 'Üretim artışı (3 ay)', probability: 0.86 },
          { value: '457 birim', label: 'Aylık ortalama üretim', probability: 0.93 },
          { value: '92.3%', label: 'Ortalama verimlilik', probability: 0.78 },
          { value: '4.2 gün', label: 'Ortalama tamamlanma süresi', probability: 0.81 },
          { value: '23%', label: 'Tam zamanında üretim artışı', probability: 0.74 }
        ];
        metrics = {
          accuracy: 0.91,
          rmse: 0.14,
          mae: 0.09,
          r2: 0.87
        };
        explanation = 'Bu tahmin modeli, son 12 aydaki üretim verilerini kullanarak bir zaman serisi analizi gerçekleştirdi. Model, mevsimsel dalgalanmaları ve önceki trendleri dikkate alarak gelecek 3 ay için tahminler üretti. Özellikle RM36 CB hücrelerindeki üretim artışının, yeni otomasyon sisteminin devreye alınmasından sonra hızlandığı görülüyor.';
        break;
        
      case 'order':
        predictions = [
          { value: '28.7%', label: 'Sipariş artışı (Q2)', probability: 0.82 },
          { value: '635 birim', label: 'Beklenen Q2 sipariş miktarı', probability: 0.89 },
          { value: '15.3 gün', label: 'Ortalama teslimat süresi', probability: 0.91 },
          { value: '4.2%', label: 'İptal oranı tahmini', probability: 0.77 },
          { value: '18.4%', label: 'RM 36 CB model payı', probability: 0.84 }
        ];
        metrics = {
          accuracy: 0.88,
          precision: 0.85,
          recall: 0.81,
          f1: 0.83
        };
        explanation = 'Sipariş tahmin modeli, müşteri segmentasyonu ve tarihsel sipariş örüntülerini analiz ederek oluşturuldu. Özellikle son 6 aydaki sipariş trendleri ve sektörel büyüme verileri dikkate alındı. Q2 döneminde enerji sektöründeki yatırım artışının, orta gerilim hücre siparişlerini olumlu etkileyeceği öngörülüyor.';
        break;
        
      case 'material':
        predictions = [
          { value: '12.5%', label: 'Stok maliyeti azalması', probability: 0.79 },
          { value: '34 gün', label: 'Optimum stok süresi', probability: 0.85 },
          { value: '8.3%', label: 'Bakır malzeme fiyat artışı', probability: 0.72 },
          { value: '42 adet', label: 'CB mekanizma ihtiyacı (aylık)', probability: 0.88 },
          { value: '3.2%', label: 'Malzeme tedarik gecikmesi', probability: 0.76 }
        ];
        metrics = {
          accuracy: 0.86,
          mse: 0.09,
          mae: 0.07,
          r2: 0.82
        };
        explanation = 'Malzeme tahmin modeli, geçmiş stok hareket verileri, tedarik süreleri ve fiyat dalgalanmaları dikkate alınarak oluşturuldu. Özellikle kritik malzemeler için minimum stok seviyesi önerileri hesaplandı. Sonuçlar, JIT (tam zamanında) tedarik stratejisi için iyileştirme fırsatları olduğunu gösteriyor.';
        break;
        
      default:
        predictions = [
          { value: '18.4%', label: 'Genel performans artışı', probability: 0.81 },
          { value: '13.2%', label: 'Maliyet optimizasyonu', probability: 0.76 },
          { value: '24.7%', label: 'Verimlilik artışı', probability: 0.79 }
        ];
        metrics = {
          accuracy: 0.84,
          precision: 0.82,
          recall: 0.79,
          f1: 0.81
        };
        explanation = 'Genel veri analizi, sistem performansını değerlendirmek için çeşitli metrikler kullanılarak yapıldı. Sonuçlar, belirli alanlarda iyileştirme potansiyeli olduğunu gösteriyor.';
    }
    
    return {
      predictions,
      metrics,
      explanation,
      modelType: `${type.charAt(0).toUpperCase() + type.slice(1)} Tahmin Modeli`,
      timestamp: new Date(),
      confidence: predictions.reduce((sum, p) => sum + p.probability, 0) / predictions.length,
      dataPoints: Math.floor(Math.random() * 1000) + 500
    };
  };
  
  // Sistem verilerini al
  const getSystemData = async () => {
    // Veri zaten yüklenmişse, onu kullan
    if (systemData.value) {
      return systemData.value;
    }
    
    try {
      // Gerçek bir API çağrısı yapılacak
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Örnek CAD modelleri
      const dummySystemData = {
        cadModels: [
          {
            id: 'rm36cb',
            name: 'RM 36 CB Hücresi',
            version: '2.1',
            format: 'STEP',
            lastUpdated: '2025-03-15',
            path: '/models/rm36cb.step',
            previewImage: '/assets/images/models/rm36cb-preview.png',
            relatedDocs: [
              { id: 'rm36cb-spec', name: 'RM 36 CB Teknik Şartname.pdf' },
              { id: 'rm36cb-manual', name: 'RM 36 CB Montaj Kılavuzu.pdf' }
            ]
          },
          {
            id: 'rm36lb',
            name: 'RM 36 LB Hücresi',
            version: '1.8',
            format: 'STEP',
            lastUpdated: '2025-02-20',
            path: '/models/rm36lb.step',
            previewImage: '/assets/images/models/rm36lb-preview.png',
            relatedDocs: [
              { id: 'rm36lb-spec', name: 'RM 36 LB Teknik Şartname.pdf' }
            ]
          },
          {
            id: 'rm36bc',
            name: 'RM 36 BC Barınak',
            version: '1.5',
            format: 'STEP',
            lastUpdated: '2025-01-10',
            path: '/models/rm36bc.step',
            previewImage: '/assets/images/models/rm36bc-preview.png',
            relatedDocs: [
              { id: 'rm36bc-spec', name: 'RM 36 BC Teknik Şartname.pdf' }
            ]
          }
        ]
      };
      
      systemData.value = dummySystemData;
      return dummySystemData;
    } catch (error) {
      console.error('Sistem verileri alınamadı:', error);
      return null;
    }
  };
  
  // Model bileşenlerini al
  const modelComponents = async (modelId) => {
    // Gerçek bir API çağrısı yapılacak
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Dummy veri döndür
    return {
      success: true,
      data: {
        components: [
          {
            name: 'Ana Gövde',
            material: 'Çelik',
            weight: '120kg',
            dimensions: '800 x 1200 x 600 mm',
            position: 'Orta'
          },
          {
            name: 'Kesici Mekanizma',
            material: 'Bakır/Çelik',
            weight: '35kg',
            dimensions: '300 x 200 x 150 mm',
            position: 'Üst Kısım'
          },
          {
            name: 'Bara Bağlantısı',
            material: 'Bakır',
            weight: '12kg',
            dimensions: '100 x 300 x 80 mm',
            position: 'Arka'
          },
          {
            name: 'Kontrol Panosu',
            material: 'Plastik/Metal',
            weight: '8kg',
            dimensions: '250 x 350 x 120 mm',
            position: 'Ön'
          }
        ]
      }
    };
  };
  
  // Model ölçümlerini al
  const modelMeasurements = async (modelId) => {
    // Gerçek bir API çağrısı yapılacak
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Dummy veri döndür
    return {
      success: true,
      data: {
        measurements: [
          {
            name: 'Toplam Yükseklik',
            value: 2100,
            unit: 'mm',
            type: 'height',
            description: 'Zeminden en üst noktaya kadar olan mesafe'
          },
          {
            name: 'Toplam Genişlik',
            value: 800,
            unit: 'mm',
            type: 'width',
            description: 'Hücrenin dış genişliği'
          },
          {
            name: 'Toplam Derinlik',
            value: 1450,
            unit: 'depth',
            description: 'Ön yüzeyden arka yüzeye mesafe'
          },
          {
            name: 'İç Yükseklik',
            value: 1950,
            unit: 'mm',
            type: 'height',
            description: 'Hücre içi kullanılabilir yükseklik'
          },
          {
            name: 'Bara Genişliği',
            value: 100,
            unit: 'mm',
            type: 'width',
            description: 'Ana bara genişliği'
          },
          {
            name: 'Panel Kalınlığı',
            value: 2,
            unit: 'mm',
            type: 'depth',
            description: 'Dış panel saç kalınlığı'
          }
        ]
      }
    };
  };
  
  // Yanıt oluştur
  const generateResponse = async (message) => {
    try {
      // Sohbet geçmişini formatla
      const recentMessages = history.value
        .filter(msg => !msg.isSystemMessage)
        .slice(-aiConfig.features.chatbot.contextWindow)
        .map(msg => ({ role: msg.role, content: msg.content }));

      // Sistem prompt ekleme
      const systemPrompt = aiConfig.features.chatbot.systemPrompt;
      const allMessages = [
        { role: 'system', content: systemPrompt },
        ...recentMessages,
        { role: 'user', content: message }
      ];

      let aiResponse;
      // Provider seçimi
      const provider = aiConfig.provider === 'auto'
        ? (aiConfig.openrouter.apiKey ? 'openrouter' : (GEMINI_API_KEY ? 'gemini' : 'demo'))
        : aiConfig.provider;

      if (provider === 'openrouter') {
        aiResponse = await openRouterChatRequest(allMessages, aiConfig.openrouter.defaultOptions);
      } else if (provider === 'gemini') {
        aiResponse = await geminiChatRequest(allMessages, aiConfig.gemini.defaultOptions);
      } else {
        // Demo mod fallback
        aiResponse = await simulateAIResponse(message);
      }

      return { text: aiResponse.text, source: provider === 'openrouter' ? 'OpenRouter' : (provider === 'gemini' ? 'Gemini' : 'Demo') };

    } catch (error) {
      console.error('AI yanıtı alınamadı:', error);
      return {
        text: `Üzgünüm, şu anda "${message}" sorunuza yanıt oluşturamıyorum. Lütfen daha sonra tekrar deneyin.`,
        source: 'Fallback Sistem'
      };
    }
  };
  
  // Özel makine öğrenmesi modeli eğit
  const trainCustomModel = async (config) => {
    if (!config || !config.name || !config.type || !config.dataSource) {
      throw new Error('Model için gerekli konfigürasyon eksik');
    }
    
    isProcessing.value = true;
    
    try {
      // Eğitim sürecini simüle et
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const modelId = `model-${Date.now()}`;
      
      // Model bilgilerini sakla
      learningModels.value[modelId] = {
        id: modelId,
        name: config.name,
        type: config.type,
        dataSource: config.dataSource,
        createdAt: new Date(),
        status: 'trained',
        accuracy: Math.random() * 0.2 + 0.8, // 0.8-1.0 arası
        metrics: {
          precision: Math.random() * 0.2 + 0.78,
          recall: Math.random() * 0.2 + 0.78,
          f1: Math.random() * 0.2 + 0.78
        }
      };
      
      return modelId;
    } finally {
      isProcessing.value = false;
    }
  };
  
  // Özel modeli çalıştır
  const runCustomModel = async (modelId, data) => {
    if (!modelId || !learningModels.value[modelId]) {
      throw new Error('Geçersiz model ID');
    }
    
    const model = learningModels.value[modelId];
    
    isProcessing.value = true;
    
    try {
      // Tahmin sürecini simüle et
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Model tipine göre sonuç döndür
      return {
        modelId,
        modelName: model.name,
        timestamp: new Date(),
        accuracy: model.accuracy,
        predictions: generateCustomPredictions(model.type)
      };
    } finally {
      isProcessing.value = false;
    }
  };
  
  // Özel model için tahminler oluştur
  const generateCustomPredictions = (type) => {
    const predictions = [];
    
    switch (type) {
      case 'classification':
        predictions.push(
          { label: 'Sınıf A', probability: Math.random() * 0.4 + 0.6 },
          { label: 'Sınıf B', probability: Math.random() * 0.3 + 0.3 },
          { label: 'Sınıf C', probability: Math.random() * 0.2 + 0.1 }
        );
        break;
        
      case 'regression':
        predictions.push(
          { value: (Math.random() * 100 + 100).toFixed(2), confidence: Math.random() * 0.2 + 0.8 }
        );
        break;
        
      case 'anomaly':
        const isAnomaly = Math.random() > 0.7;
        predictions.push(
          { 
            isAnomaly, 
            anomalyScore: isAnomaly ? Math.random() * 0.4 + 0.6 : Math.random() * 0.3,
            description: isAnomaly ? 'Anomali tespit edildi' : 'Normal durum' 
          }
        );
        break;
        
      default:
        predictions.push(
          { label: 'Sonuç', probability: Math.random() * 0.2 + 0.8 }
        );
    }
    
    return predictions;
  };
  
  // CAD model navigasyon
  const navigateToCADViewer = (modelId) => {
    router.push({
      name: 'ModelViewer',
      params: { id: modelId }
    });
  };
  
  return {
    history,
    isProcessing,
    modelLoading,
    supportedModels,
    currentModelKey,
    sendMessage,
    clearHistory,
    switchModel,
    getCurrentModel,
    getSystemData,
    modelComponents,
    modelMeasurements,
    trainCustomModel,
    runCustomModel,
    navigateToCADViewer
  };
}

// Model tipleri ve yetenekleri
export const MODEL_TYPES = {
  MATERIAL_PREDICTION: 'material-prediction',
  PRODUCTION_OPTIMIZATION: 'production-optimization',
  MAINTENANCE_PREDICTION: 'maintenance-prediction',
  QUALITY_CONTROL: 'quality-control',
  DEMAND_FORECAST: 'demand-forecast',
  RESOURCE_ALLOCATION: 'resource-allocation',
  INVENTORY_OPTIMIZATION: 'inventory-optimization',
  CAD_MODEL_ANALYSIS: 'cad-model-analysis'
};

// Makine öğrenmesi bağlamı
const mlContext = ref({
  isReady: false,
  models: {},
  activeModel: null,
  predictions: [],
  isTraining: false,
  trainingProgress: 0,
  datasetStats: null,
  error: null
});

// AI API yapılandırması
const apiConfig = {
  baseUrl: import.meta.env.VITE_AI_API_URL || 'https://api.mets-ai.com/v2',
  prediction: '/predict',
  training: '/train',
  models: '/models',
  datasets: '/datasets',
  cad: '/cad',
  chat: '/chat'
};

// API istek oluşturucu
const createApiRequest = async (endpoint, method = 'GET', data = null) => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('Kullanıcı oturumu bulunamadı');
  }
  
  const token = await user.getIdToken();
  
  return axios({
    method,
    url: `${apiConfig.baseUrl}${endpoint}`,
    data,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

/**
 * Makine öğrenmesi modellerini yükler
 */
export const loadModels = async () => {
  try {
    mlContext.value.isReady = false;
    mlContext.value.error = null;
    
    const response = await createApiRequest(apiConfig.models);
    
    // Modelleri işle ve sakla
    if (response.data && Array.isArray(response.data.models)) {
      const models = {};
      
      response.data.models.forEach(model => {
        models[model.id] = {
          id: model.id,
          name: model.name,
          description: model.description,
          type: model.type,
          version: model.version,
          accuracy: model.metrics?.accuracy,
          lastUpdated: new Date(model.lastUpdated),
          supportedFormats: model.supportedFormats || [],
          capabilities: model.capabilities || []
        };
      });
      
      mlContext.value.models = models;
      
      // Bir model aktif değilse ve kullanılabilir model varsa, ilk modeli etkinleştir
      if (!mlContext.value.activeModel && Object.keys(models).length > 0) {
        mlContext.value.activeModel = Object.keys(models)[0];
      }
      
      mlContext.value.isReady = true;
      return models;
    }
    
    return {};
  } catch (error) {
    console.error('AI modelleri yüklenemedi:', error);
    mlContext.value.error = 'AI modelleri yüklenirken bir hata oluştu';
    return {};
  }
};

/**
 * Aktif modeli değiştirir
 * @param {string} modelId - Model kimliği
 */
export const setActiveModel = (modelId) => {
  if (mlContext.value.models[modelId]) {
    mlContext.value.activeModel = modelId;
    return true;
  }
  return false;
};

/**
 * Gelişmiş tahmin işlemi gerçekleştirir
 * @param {string} modelType - Tahmin modeli türü
 * @param {Object} data - Tahmin için giriş verileri
 * @param {Object} options - Ek tahmin seçenekleri
 */
export const runPrediction = async (modelType, data, options = {}) => {
  try {
    // Aktif model kontrol
    const modelId = options.modelId || mlContext.value.activeModel;
    
    if (!modelId) {
      throw new Error('Aktif bir model seçili değil');
    }
    
    // API isteği gönder
    const response = await createApiRequest(apiConfig.prediction, 'POST', {
      modelId,
      modelType,
      data,
      options
    });
    
    // Yanıtı işle
    if (response.data && response.data.prediction) {
      const prediction = {
        id: response.data.id || generateId(),
        modelType,
        modelId,
        timestamp: new Date(),
        predictions: response.data.prediction.results || [],
        confidence: response.data.prediction.confidence,
        explanation: response.data.prediction.explanation,
        dataPoints: response.data.prediction.dataPointsCount,
        metrics: response.data.prediction.metrics || {},
        rawResponse: response.data
      };
      
      // Tahmin geçmişine ekle
      mlContext.value.predictions.unshift(prediction);
      
      // Son 50 tahmini tut
      if (mlContext.value.predictions.length > 50) {
        mlContext.value.predictions = mlContext.value.predictions.slice(0, 50);
      }
      
      return prediction;
    } else {
      throw new Error('Geçersiz tahmin yanıtı');
    }
  } catch (error) {
    console.error('Tahmin hatası:', error);
    mlContext.value.error = 'Tahmin işlemi sırasında bir hata oluştu';
    throw error;
  }
};

/**
 * Üretim optimizasyonu tahmini yapar
 * @param {Object} productionData - Üretim verileri
 */
export const predictProductionOptimization = async (productionData) => {
  return runPrediction(MODEL_TYPES.PRODUCTION_OPTIMIZATION, productionData);
};

/**
 * Malzeme gereksinimleri tahmini yapar
 * @param {Object} orderData - Sipariş verileri
 */
export const predictMaterialRequirements = async (orderData) => {
  return runPrediction(MODEL_TYPES.MATERIAL_PREDICTION, orderData);
};

/**
 * Bakım gereksinimleri tahmini yapar
 * @param {Object} equipmentData - Ekipman verileri
 */
export const predictMaintenanceNeeds = async (equipmentData) => {
  return runPrediction(MODEL_TYPES.MAINTENANCE_PREDICTION, equipmentData);
};

/**
 * Kalite kontrol tahmini yapar
 * @param {Object} productData - Ürün verileri
 */
export const predictQualityControl = async (productData) => {
  return runPrediction(MODEL_TYPES.QUALITY_CONTROL, productData);
};

/**
 * Talep tahmini yapar
 * @param {Object} historicalData - Geçmiş veriler
 */
export const predictDemandForecast = async (historicalData) => {
  return runPrediction(MODEL_TYPES.DEMAND_FORECAST, historicalData);
};

/**
 * CAD modeli analizi yapar
 * @param {Object} modelData - CAD model verileri
 */
export const analyzeCADModel = async (modelData) => {
  try {
    // API isteği gönder
    const response = await createApiRequest(apiConfig.cad + '/analyze', 'POST', {
      modelData,
      modelId: mlContext.value.activeModel
    });
    
    return response.data;
  } catch (error) {
    console.error('CAD model analizi hatası:', error);
    mlContext.value.error = 'CAD model analizi sırasında bir hata oluştu';
    throw error;
  }
};

/**
 * 3D modeli optimize eder
 * @param {Object} modelData - 3D model verileri
 * @param {Object} optimizationParams - Optimizasyon parametreleri
 */
export const optimizeModel = async (modelData, optimizationParams) => {
  try {
    const response = await createApiRequest(apiConfig.cad + '/optimize', 'POST', {
      modelData,
      params: optimizationParams
    });
    
    return response.data;
  } catch (error) {
    console.error('Model optimizasyonu hatası:', error);
    throw error;
  }
};

/**
 * AI sohbet mesajı gönderir - Gemini API kullanılarak güncellendi
 */
export const sendChatMessage = async (message, history = [], context = {}) => {
  try {
    const systemPrompt = context.systemPrompt || 'Üretim asistanısın. Kullanıcılara yardımcı ol.';
    
    // Tüm mesajlar
    const allMessages = [
      { role: 'system', content: systemPrompt },
      ...history.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];
    
    // Gemini API isteği
    const response = await geminiChatRequest(allMessages);
    
    return {
      text: response.text,
      success: true,
      source: context.modelName || 'AI Asistanı'
    };
  } catch (error) {
    console.error('AI sohbet hatası:', error);
    throw error;
  }
};

/**
 * Doküman için AI analizi
 */
export const analyzeDocument = async (document, query) => {
  try {
    const prompt = `
    Aşağıdaki dokümanı incele ve şu soruya yanıt ver: "${query}"
    
    Doküman içeriği:
    ${document.content || document.text || 'İçerik bulunamadı'}
    
    Yanıtını kısa ve net bir şekilde ver.
    `;
    
    const response = await geminiRequest(prompt, { temperature: 0.3 });
    
    return {
      text: response.text,
      success: true,
      documentId: document.id
    };
  } catch (error) {
    console.error('Doküman analizi hatası:', error);
    throw error;
  }
};

/**
 * İlgili dokümanları arar
 * @param {string} query - Arama sorgusu
 * @param {Object} filters - Arama filtreleri
 */
export const searchRelatedDocuments = async (query, filters = {}) => {
  try {
    const response = await createApiRequest('/documents/search', 'POST', {
      query,
      filters
    });
    
    return response.data.documents || [];
  } catch (error) {
    console.error('Doküman arama hatası:', error);
    throw error;
  }
};

/**
 * Makine öğrenmesi modeli eğitir
 * @param {string} modelType - Model türü
 * @param {string} datasetId - Veri seti kimliği
 * @param {Object} params - Eğitim parametreleri
 */
export const trainModel = async (modelType, datasetId, params = {}) => {
  try {
    mlContext.value.isTraining = true;
    mlContext.value.trainingProgress = 0;
    
    const response = await createApiRequest(apiConfig.training, 'POST', {
      modelType,
      datasetId,
      params
    });
    
    // Training başlatıldı, sonuç dönene kadar takip et
    const trainingId = response.data.trainingId;
    
    const checkTrainingStatus = async () => {
      const statusResponse = await createApiRequest(`${apiConfig.training}/${trainingId}/status`, 'GET');
      
      mlContext.value.trainingProgress = statusResponse.data.progress;
      
      if (statusResponse.data.status === 'completed') {
        mlContext.value.isTraining = false;
        // Eğitim tamamlandı, modelleri yeniden yükle
        await loadModels();
        return statusResponse.data;
      } else if (statusResponse.data.status === 'failed') {
        mlContext.value.isTraining = false;
        mlContext.value.error = statusResponse.data.error || 'Model eğitimi başarısız oldu';
        throw new Error(mlContext.value.error);
      } else {
        // Devam ediyor, 3 saniye sonra tekrar kontrol et
        await new Promise(resolve => setTimeout(resolve, 3000));
        return checkTrainingStatus();
      }
    };
    
    return checkTrainingStatus();
  } catch (error) {
    console.error('Model eğitimi hatası:', error);
    mlContext.value.isTraining = false;
    mlContext.value.error = 'Model eğitimi sırasında bir hata oluştu';
    throw error;
  }
};

/**
 * Veri seti istatistiklerini getirir
 * @param {string} datasetId - Veri seti kimliği
 */
export const getDatasetStats = async (datasetId) => {
  try {
    const response = await createApiRequest(`${apiConfig.datasets}/${datasetId}/stats`, 'GET');
    
    mlContext.value.datasetStats = response.data;
    return response.data;
  } catch (error) {
    console.error('Veri seti istatistikleri hatası:', error);
    throw error;
  }
};

/**
 * Benzersiz kimlik oluşturur
 */
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

/**
 * ML bağlamını döndürür
 */
export const useMachineLearning = () => {
  return mlContext;
};

// Doğrudan dışa aktarılan aiService nesnesi - main.js için
export const aiService = {
  loadModels,
  setActiveModel,
  runPrediction,
  predictProductionOptimization,
  predictMaterialRequirements,
  predictMaintenanceNeeds,
  predictQualityControl,
  predictDemandForecast,
  analyzeCADModel,
  optimizeModel,
  sendChatMessage,
  analyzeDocument,
  searchRelatedDocuments,
  trainModel,
  getDatasetStats,
  useMachineLearning,
  analyzeOrder,
  analyzeOrderDelay,
  getProductionOptimizationOptions,
  MODEL_TYPES
};

export default {
  loadModels,
  setActiveModel,
  runPrediction,
  predictProductionOptimization,
  predictMaterialRequirements,
  predictMaintenanceNeeds,
  predictQualityControl,
  predictDemandForecast,
  analyzeCADModel,
  optimizeModel,
  sendChatMessage,
  analyzeDocument,
  searchRelatedDocuments,
  trainModel,
  getDatasetStats,
  useMachineLearning,
  analyzeOrder,
  analyzeOrderDelay,
  getProductionOptimizationOptions,
  MODEL_TYPES
};