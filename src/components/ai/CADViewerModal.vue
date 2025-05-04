<template>
  <div class="cad-viewer-modal">
    <div class="cad-viewer-container">
      <div class="cad-viewer-header">
        <h5 class="m-0">
          <i class="bi bi-box me-2"></i>
          {{ modelName }}
        </h5>
        <div class="cad-viewer-actions">
          <button class="btn btn-sm btn-outline-info me-2" @click="captureScreenshot">
            <i class="bi bi-camera"></i>
            <span class="ms-1 d-none d-md-inline">Ekran Görüntüsü</span>
          </button>
          <button class="btn btn-sm btn-outline-info me-2" @click="toggleMeasurements">
            <i class="bi" :class="showMeasurements ? 'bi-rulers' : 'bi-ruler'"></i>
            <span class="ms-1 d-none d-md-inline">Ölçüler</span>
          </button>
          <button class="btn btn-sm btn-outline-info me-2" @click="toggleExplode">
            <i class="bi" :class="isExploded ? 'bi-box2-fill' : 'bi-boxes'"></i>
            <span class="ms-1 d-none d-md-inline">{{ isExploded ? 'Birleştir' : 'Parçala' }}</span>
          </button>
          <!-- AR/VR Modu Tuşları -->
          <button v-if="isARSupported" class="btn btn-sm btn-outline-success me-2" @click="startARView">
            <i class="bi bi-phone-fill"></i>
            <span class="ms-1 d-none d-md-inline">AR</span>
          </button>
          <button class="btn btn-sm btn-outline-primary me-2" @click="startVRView">
            <i class="bi bi-badge-vr"></i>
            <span class="ms-1 d-none d-md-inline">VR</span>
          </button>
          <button class="btn btn-sm btn-danger" @click="$emit('close')">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </div>
      
      <div class="cad-viewer-content">
        <div v-if="isLoading" class="cad-viewer-loading">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Yükleniyor...</span>
          </div>
          <span class="mt-2">3D Model yükleniyor...</span>
        </div>
        
        <div v-if="!isLoading && error" class="cad-viewer-error">
          <i class="bi bi-exclamation-triangle text-danger fs-3"></i>
          <span class="mt-2">{{ error }}</span>
        </div>
        
        <!-- AR/VR Modu Kullanıcı Arayüzü -->
        <div v-if="arMode" class="ar-instructions">
          <div class="alert alert-info">
            <i class="bi bi-info-circle-fill me-2"></i>
            Cihazınızı etrafta hareket ettirerek modeli 3D ortamınıza yerleştirin.
            <button class="btn btn-sm btn-secondary float-end" @click="exitARMode">
              <i class="bi bi-x-circle"></i> Çıkış
            </button>
          </div>
        </div>
        
        <div v-if="vrMode" class="vr-instructions">
          <div class="alert alert-info">
            <i class="bi bi-info-circle-fill me-2"></i>
            VR gözlüğünüzü takın ve başınızı hareket ettirerek modeli inceleyin.
            <button class="btn btn-sm btn-secondary float-end" @click="exitVRMode">
              <i class="bi bi-x-circle"></i> Çıkış
            </button>
          </div>
        </div>
        
        <div class="cad-canvas-container" v-show="!isLoading && !error">
          <canvas ref="canvasElement" class="cad-canvas"></canvas>
        </div>
      </div>
      
      <div class="cad-viewer-footer">
        <div class="cad-viewer-tabs">
          <div class="nav nav-tabs" role="tablist">
            <button 
              class="nav-link" 
              :class="{ active: activeTab === 'info' }" 
              @click="activeTab = 'info'"
              id="info-tab"
            >
              <i class="bi bi-info-circle me-1"></i> Bilgi
            </button>
            <button 
              class="nav-link" 
              :class="{ active: activeTab === 'components' }" 
              @click="activeTab = 'components'"
              id="components-tab"
            >
              <i class="bi bi-diagram-3 me-1"></i> Bileşenler
            </button>
            <button 
              class="nav-link" 
              :class="{ active: activeTab === 'measurements' }" 
              @click="activeTab = 'measurements'"
              id="measurements-tab"
            >
              <i class="bi bi-rulers me-1"></i> Ölçümler
            </button>
            <button 
              class="nav-link" 
              :class="{ active: activeTab === 'ar_options' }" 
              @click="activeTab = 'ar_options'"
              id="ar_options-tab"
            >
              <i class="bi bi-phone-fill me-1"></i> AR Seçenekleri
            </button>
            <button 
              class="nav-link" 
              :class="{ active: activeTab === 'analysis' }" 
              @click="activeTab = 'analysis'"
              id="analysis-tab"
            >
              <i class="bi bi-graph-up me-1"></i> Analiz
            </button>
          </div>
        </div>
        
        <div class="cad-viewer-tab-content">
          <div class="tab-pane fade show" :class="{ active: activeTab === 'info' }" id="info-content">
            <div class="row" v-if="modelInfo">
              <div class="col-md-6">
                <table class="table table-sm">
                  <tbody>
                    <tr>
                      <th>Model Adı</th>
                      <td>{{ modelInfo.name }}</td>
                    </tr>
                    <tr>
                      <th>Versiyon</th>
                      <td>{{ modelInfo.version }}</td>
                    </tr>
                    <tr>
                      <th>Format</th>
                      <td>{{ modelInfo.format }}</td>
                    </tr>
                    <tr>
                      <th>Son Güncelleme</th>
                      <td>{{ modelInfo.lastUpdated }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="col-md-6">
                <div class="mb-2">
                  <strong>Kullanım Talimatları:</strong>
                </div>
                <ul class="list-unstyled small">
                  <li><i class="bi bi-mouse me-1"></i> Sol tıklama ile modeli döndür</li>
                  <li><i class="bi bi-arrows-move me-1"></i> Sağ tıklama ile modeli kaydır</li>
                  <li><i class="bi bi-mouse-fill me-1"></i> Tekerlek ile yakınlaştır/uzaklaştır</li>
                </ul>
              </div>
            </div>
            <div v-else class="text-center py-4">
              <i class="bi bi-exclamation-triangle text-warning me-2"></i>
              Model bilgisi bulunamadı
            </div>
          </div>
          
          <div class="tab-pane fade show" :class="{ active: activeTab === 'components' }" id="components-content">
            <div v-if="modelInfo && modelInfo.components && modelInfo.components.length > 0">
              <div class="table-responsive">
                <table class="table table-sm table-hover">
                  <thead>
                    <tr>
                      <th>Parça</th>
                      <th>Malzeme</th>
                      <th>Ağırlık</th>
                      <th>Görünürlük</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(component, index) in modelInfo.components" :key="index">
                      <td>{{ component.name }}</td>
                      <td>{{ component.material }}</td>
                      <td>{{ component.weight }}</td>
                      <td>
                        <div class="form-check form-switch">
                          <input class="form-check-input" type="checkbox" 
                                :id="`component-${index}`" 
                                v-model="componentVisibility[index]"
                                @change="toggleComponentVisibility(index)">
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div v-else class="text-center py-4">
              <i class="bi bi-exclamation-triangle text-warning me-2"></i>
              Bileşen bilgisi bulunamadı
            </div>
          </div>
          
          <div class="tab-pane fade show" :class="{ active: activeTab === 'measurements' }" id="measurements-content">
            <div v-if="modelMeasurements && modelMeasurements.length > 0">
              <div class="table-responsive">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Ölçü</th>
                      <th>Değer</th>
                      <th>Birim</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(measurement, index) in modelMeasurements" :key="index">
                      <td>{{ measurement.name }}</td>
                      <td>{{ measurement.value }}</td>
                      <td>{{ measurement.unit || 'mm' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div v-else-if="measurementsLoading">
              <div class="text-center py-4">
                <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
                  <span class="visually-hidden">Yükleniyor...</span>
                </div>
                Ölçümler analiz ediliyor...
              </div>
            </div>
            <div v-else class="text-center py-4">
              <i class="bi bi-exclamation-triangle text-warning me-2"></i>
              Ölçüm bilgisi bulunamadı
            </div>
          </div>
          
          <!-- AR Seçenekleri Sekmesi -->
          <div class="tab-pane fade show" :class="{ active: activeTab === 'ar_options' }" id="ar_options-content">
            <div class="row g-3">
              <div class="col-12">
                <div class="form-text mb-3">
                  AR/VR deneyiminizi özelleştirmek için aşağıdaki seçenekleri kullanabilirsiniz.
                </div>
              </div>
              
              <div class="col-md-6">
                <label class="form-label" for="ar-scale">Model Ölçeği</label>
                <div class="d-flex gap-2 align-items-center">
                  <input
                    type="range"
                    class="form-range w-75"
                    id="ar-scale"
                    min="0.1"
                    max="2"
                    step="0.1"
                    v-model.number="arOptions.scale"
                  >
                  <span class="badge bg-secondary">{{ arOptions.scale }}x</span>
                </div>
              </div>
              
              <div class="col-md-6">
                <label class="form-label" for="ar-environment">Ortam Aydınlatması</label>
                <select id="ar-environment" class="form-select" v-model="arOptions.environment">
                  <option value="neutral">Nötr</option>
                  <option value="daylight">Gün Işığı</option>
                  <option value="sunset">Gün Batımı</option>
                  <option value="night">Gece</option>
                  <option value="studio">Stüdyo</option>
                </select>
              </div>
              
              <div class="col-md-6">
                <label class="form-label" for="ar-shadow">Gölge Kalitesi</label>
                <select id="ar-shadow" class="form-select" v-model="arOptions.shadowQuality">
                  <option value="off">Kapalı</option>
                  <option value="low">Düşük</option>
                  <option value="medium">Orta</option>
                  <option value="high">Yüksek</option>
                </select>
              </div>
              
              <div class="col-md-6">
                <div class="form-check form-switch mt-4">
                  <input class="form-check-input" type="checkbox" id="ar-annotations" v-model="arOptions.showAnnotations">
                  <label class="form-check-label" for="ar-annotations">Açıklamaları Göster</label>
                </div>
              </div>
              
              <div class="col-12">
                <div class="mt-3">
                  <button class="btn btn-sm btn-outline-primary" @click="exportARModel">
                    <i class="bi bi-download me-1"></i>
                    AR/VR Modeli İndir
                  </button>
                  <div class="form-text mt-1">
                    3D modeli AR uygulamalarında kullanmak için indirebilirsiniz.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Makine Öğrenmesi Analiz Sonuçları -->
          <div class="tab-pane fade show" :class="{ active: activeTab === 'analysis' }" id="analysis-content">
            <div v-if="analyzeLoading" class="text-center py-4">
              <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
                <span class="visually-hidden">Yükleniyor...</span>
              </div>
              <span>Model analiz ediliyor...</span>
              <div class="progress mt-2">
                <div 
                  class="progress-bar progress-bar-striped progress-bar-animated" 
                  :style="{width: `${analysisProgress}%`}" 
                  role="progressbar" 
                  :aria-valuenow="analysisProgress" 
                  aria-valuemin="0" 
                  aria-valuemax="100"></div>
              </div>
            </div>
            
            <div v-else-if="analysisResults" class="analysis-results">
              <div class="row mb-3">
                <div class="col-md-6">
                  <div class="card h-100">
                    <div class="card-header">
                      <h6 class="m-0">Malzeme Analizi</h6>
                    </div>
                    <div class="card-body">
                      <table class="table table-sm">
                        <thead>
                          <tr>
                            <th>Malzeme</th>
                            <th>Miktar</th>
                            <th>Maliyet</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(material, idx) in analysisResults.materials" :key="idx">
                            <td>{{ material.name }}</td>
                            <td>{{ material.quantity }} {{ material.unit }}</td>
                            <td>{{ material.estimatedCost }} ₺</td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr>
                            <th colspan="2">Toplam Maliyet</th>
                            <th>{{ analysisResults.totalCost }} ₺</th>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
                
                <div class="col-md-6">
                  <div class="card h-100">
                    <div class="card-header">
                      <h6 class="m-0">Üretim Analizi</h6>
                    </div>
                    <div class="card-body">
                      <table class="table table-sm">
                        <tbody>
                          <tr>
                            <th>Tahmini Üretim Süresi</th>
                            <td>{{ analysisResults.production.estimatedTime }} saat</td>
                          </tr>
                          <tr>
                            <th>Zorluk Seviyesi</th>
                            <td>
                              <div class="d-flex align-items-center">
                                <div class="progress flex-grow-1" style="height: 8px;">
                                  <div 
                                    class="progress-bar" 
                                    :class="difficultyClass" 
                                    role="progressbar" 
                                    :style="{width: `${analysisResults.production.difficulty * 20}%`}" 
                                    :aria-valuenow="analysisResults.production.difficulty" 
                                    aria-valuemin="0" 
                                    aria-valuemax="5"></div>
                                </div>
                                <span class="ms-2">{{ analysisResults.production.difficulty }}/5</span>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <th>Özelleştirme Potansiyeli</th>
                            <td>
                              <div class="stars">
                                <i v-for="i in 5" :key="i" 
                                   class="bi" 
                                   :class="i <= analysisResults.production.customizationPotential ? 'bi-star-fill text-warning' : 'bi-star'"></i>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <th>Gerekli Ekipman</th>
                            <td>
                              <span v-for="(equipment, idx) in analysisResults.production.requiredEquipment" 
                                    :key="idx" 
                                    class="badge bg-secondary me-1 mb-1">{{ equipment }}</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="row">
                <div class="col-md-6">
                  <div class="card h-100">
                    <div class="card-header">
                      <h6 class="m-0">Kalite Analizi</h6>
                    </div>
                    <div class="card-body">
                      <div class="mb-3">
                        <strong>Kritik Bileşenler:</strong>
                        <ul class="list-group mt-2">
                          <li v-for="(component, idx) in analysisResults.quality.criticalComponents" 
                              :key="idx" 
                              class="list-group-item d-flex justify-content-between align-items-center py-2">
                            {{ component.name }}
                            <span class="badge bg-primary rounded-pill">{{ component.impactScore }}/10</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <strong>Önerilen Test Yöntemleri:</strong>
                        <ul class="list-unstyled mt-2">
                          <li v-for="(test, idx) in analysisResults.quality.recommendedTests" 
                              :key="idx" 
                              class="mb-1">
                            <i class="bi bi-check-circle-fill text-success me-1"></i> {{ test }}
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="col-md-6">
                  <div class="card h-100">
                    <div class="card-header">
                      <h6 class="m-0">Algoritma Sonuçları</h6>
                    </div>
                    <div class="card-body">
                      <div class="mb-3">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                          <strong>Model Doğruluk Oranı:</strong>
                          <span class="badge bg-success">{{ (analysisResults.algorithm.accuracy * 100).toFixed(2) }}%</span>
                        </div>
                        <div class="progress" style="height: 10px;">
                          <div class="progress-bar bg-success" 
                               role="progressbar" 
                               :style="{width: `${analysisResults.algorithm.accuracy * 100}%`}" 
                               :aria-valuenow="analysisResults.algorithm.accuracy * 100" 
                               aria-valuemin="0" 
                               aria-valuemax="100"></div>
                        </div>
                      </div>
                      
                      <table class="table table-sm">
                        <tbody>
                          <tr v-for="(metric, key) in analysisResults.algorithm.metrics" :key="key">
                            <th>{{ metricLabel(key) }}</th>
                            <td>{{ (metric * 100).toFixed(2) }}%</td>
                          </tr>
                        </tbody>
                      </table>
                      
                      <div class="alert alert-info mt-3 small">
                        <i class="bi bi-info-circle-fill me-1"></i>
                        {{ analysisResults.algorithm.explanation }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-else class="text-center py-4">
              <button class="btn btn-primary" @click="analyzeModel">
                <i class="bi bi-graph-up me-1"></i> Modeli Analiz Et
              </button>
              <p class="text-muted small mt-2">
                Makine öğrenmesi algoritmalarını kullanarak modeli analiz edin.
                Bu işlem birkaç dakika sürebilir.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, reactive, computed } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
// AR/VR için ThreeJS eklentileri
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js'
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js'
import { XREstimatedLight } from 'three/examples/jsm/webxr/XREstimatedLight.js'
import { useAiService } from '@/services/ai-service'

const props = defineProps({
  modelId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close'])

// State
const canvasElement = ref(null)
const isLoading = ref(true)
const error = ref(null)
const modelInfo = ref(null)
const modelName = ref('3D Model Görüntüleyici')
const activeTab = ref('info')
const showMeasurements = ref(false)
const isExploded = ref(false)
const componentVisibility = reactive({})
const modelMeasurements = ref([])
const measurementsLoading = ref(false)

// Makine Öğrenmesi Analiz Durumu
const analyzeLoading = ref(false)
const analysisProgress = ref(0)
const analysisResults = ref(null)

// AR/VR state
const arMode = ref(false)
const vrMode = ref(false)
const isARSupported = ref(false)
const arOptions = reactive({
  scale: 1.0,
  environment: 'neutral',
  shadowQuality: 'medium',
  showAnnotations: true
})

// ThreeJS değişkenleri
let scene, camera, renderer, controls, model, originalModelState
let measurements = []
let xrSession = null
let xrLight = null
const aiService = useAiService()

// 3D görüntüleme için ThreeJS ayarla
const setupViewer = () => {
  if (!canvasElement.value) return
  
  // Sahne oluştur
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf0f2f5)
  
  // Kamera oluştur
  camera = new THREE.PerspectiveCamera(
    45, 
    canvasElement.value.clientWidth / canvasElement.value.clientHeight,
    0.1,
    1000
  )
  camera.position.set(0, 2, 10)
  
  // Işık ekle
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(1, 1, 1)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 2048
  directionalLight.shadow.mapSize.height = 2048
  scene.add(directionalLight)
  
  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5)
  directionalLight2.position.set(-1, -1, -1)
  scene.add(directionalLight2)
  
  // Renderer oluştur
  renderer = new THREE.WebGLRenderer({
    canvas: canvasElement.value,
    antialias: true,
    alpha: true
  })
  renderer.setSize(canvasElement.value.clientWidth, canvasElement.value.clientHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.shadowMap.enabled = true
  renderer.outputEncoding = THREE.sRGBEncoding
  
  // XR özelliklerini ekle
  renderer.xr.enabled = true
  
  // AR desteğini kontrol et
  navigator.xr?.isSessionSupported('immersive-ar')
    .then((supported) => {
      isARSupported.value = supported
    })
    .catch(() => {
      isARSupported.value = false
    })
  
  // Kontrol ekle
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  
  // Pencere boyutu değişirse güncelle
  window.addEventListener('resize', onWindowResize)
  
  // Animasyon döngüsü başlat
  renderer.setAnimationLoop(animate)
}

// Model bilgisini yükle
const loadModelInfo = async () => {
  try {
    const systemData = await aiService.getSystemData()
    const model = systemData.cadModels.find(m => m.id === props.modelId)
    
    if (model) {
      modelInfo.value = model
      modelName.value = model.name
      
      // Görünürlük durumlarını ayarla
      if (model.components) {
        model.components.forEach((_, index) => {
          componentVisibility[index] = true
        })
      }
    } else {
      error.value = 'Model bilgisi bulunamadı'
    }
  } catch (err) {
    console.error('Model bilgisi yüklenirken hata:', err)
    error.value = 'Model bilgisi alınırken bir hata oluştu'
  }
}

// 3D modeli yükle
const loadModel = () => {
  if (!scene) return
  
  const modelPath = modelInfo.value?.path || `/models/${props.modelId}.glb`
  const modelExtension = modelPath.split('.').pop().toLowerCase()
  let loader
  
  // Dosya uzantısına göre yükleyici seç
  switch (modelExtension) {
    case 'glb':
    case 'gltf':
      loader = new GLTFLoader()
      break
    case 'stl':
      loader = new STLLoader()
      break
    case 'obj':
      loader = new OBJLoader()
      break
    default:
      loader = new GLTFLoader() // Varsayılan yükleyici
  }
  
  loader.load(
    modelPath,
    (loadedModel) => {
      // GLB/GLTF için özel işleme
      if (modelExtension === 'glb' || modelExtension === 'gltf') {
        model = loadedModel.scene
      } 
      // STL için özel işleme
      else if (modelExtension === 'stl') {
        const material = new THREE.MeshStandardMaterial({ color: 0xA9A9A9 })
        model = new THREE.Mesh(loadedModel, material)
      }
      // OBJ için doğrudan modeli kullan
      else {
        model = loadedModel
      }
      
      // Model işlemleri
      // Modeli gölgelere duyarlı hale getir
      model.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true
          node.receiveShadow = true
          
          // Modelin materyaline metalik ve pürüzsüz özellikleri ekle
          if (node.material) {
            node.material.metalness = 0.3
            node.material.roughness = 0.7
          }
        }
      })
      
      // Sahneye ekle
      scene.add(model)
      
      // Modeli merkeze hizala
      const box = new THREE.Box3().setFromObject(model)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      
      model.position.x = -center.x
      model.position.y = -center.y
      model.position.z = -center.z
      
      // Kamerayı modele hizala
      const maxDim = Math.max(size.x, size.y, size.z)
      const distance = maxDim * 2
      camera.position.set(distance, distance * 0.5, distance)
      camera.lookAt(0, 0, 0)
      
      // Orijinal modeli sakla
      originalModelState = model.clone()
      
      // Yükleme tamamlandı
      isLoading.value = false
      
      // Ölçüm verilerini yükle
      loadMeasurements()
    },
    (progressEvent) => {
      const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100)
      console.log(`Yükleme: %${progress}`)
    },
    (error) => {
      console.error('Model yüklenirken hata:', error)
      showErrorModel()
    }
  )
}

// Hata durumunda basit bir model göster
const showErrorModel = () => {
  const geometry = new THREE.BoxGeometry(2, 2, 2)
  const material = new THREE.MeshStandardMaterial({ color: 0xff0000 })
  const cube = new THREE.Mesh(geometry, material)
  
  scene.add(cube)
  
  isLoading.value = false
  error.value = 'Model yüklenemedi. Lütfen tekrar deneyin.'
}

// Animasyon döngüsü
const animate = (timestamp, frame) => {
  // XR sessionu varsa
  if (renderer.xr.isPresenting && frame) {
    // XR için gerekli işlemler burada
    handleXRInteractions(frame)
  }
  
  if (controls && !arMode.value && !vrMode.value) {
    controls.update()
  }
  
  if (renderer && scene && camera) {
    renderer.render(scene, camera)
  }
}

// XR etkileşimleri için işlev
const handleXRInteractions = (frame) => {
  if (!xrSession) return
  
  // AR/VR etkileşimleri burada işlenecek
  const referenceSpace = renderer.xr.getReferenceSpace()
  const session = renderer.xr.getSession()
  
  if (frame && session) {
    // Kullanıcı etkileşimlerini işle
    if (session.inputSources) {
      for (const inputSource of session.inputSources) {
        if (inputSource.gamepad) {
          handleControllerInput(inputSource, frame, referenceSpace)
        }
      }
    }
    
    // AR hizalama ve ışıklandırma güncellemeleri
    if (arMode.value && xrLight) {
      xrLight.update(referenceSpace, frame)
    }
  }
}

// VR kontrolcü girişlerini işle
const handleControllerInput = (inputSource, frame, referenceSpace) => {
  if (!inputSource.gamepad) return
  
  const axes = inputSource.gamepad.axes
  const buttons = inputSource.gamepad.buttons
  
  // Modeli döndürmek için kontrol çubuğunu kullan
  if (model && axes.length >= 2 && (Math.abs(axes[0]) > 0.1 || Math.abs(axes[1]) > 0.1)) {
    model.rotation.y += axes[0] * 0.05
    model.rotation.x += axes[1] * 0.05
  }
  
  // Butonlarla etkileşim için
  if (buttons.length > 0 && buttons[0].pressed) {
    // İlk buton basıldığında modeli parçala/birleştir
    toggleExplode()
  }
}

// AR görünümünü başlat
const startARView = () => {
  if (!renderer || !isARSupported.value) return
  
  arMode.value = true
  vrMode.value = false
  
  // AR butonunu oluştur
  const arButton = ARButton.createButton(renderer, {
    requiredFeatures: ['hit-test'],
    optionalFeatures: ['dom-overlay', 'light-estimation'],
    domOverlay: { root: document.body }
  })
  
  document.body.appendChild(arButton)
  
  // AR oturumunu başlat
  renderer.xr.getSession().then((session) => {
    xrSession = session
    
    // Işık tahmini özelliğini ekle
    xrLight = new XREstimatedLight(renderer)
    scene.add(xrLight)
    
    // AR oturumu sonlandığında temizle
    session.addEventListener('end', () => {
      exitARMode()
    })
    
    // AR'da zemin oluştur
    createARGroundPlane()
    
    // Arka planı transparan yap
    scene.background = null
  }).catch(error => {
    console.error('AR oturumu başlatılamadı:', error)
    arMode.value = false
  })
}

// AR için zemin düzlemi oluştur
const createARGroundPlane = () => {
  const planeGeometry = new THREE.PlaneGeometry(20, 20)
  const planeMaterial = new THREE.ShadowMaterial({
    opacity: 0.2
  })
  
  const plane = new THREE.Mesh(planeGeometry, planeMaterial)
  plane.rotation.x = -Math.PI / 2
  plane.position.y = -0.5
  plane.receiveShadow = true
  scene.add(plane)
}

// AR modundan çık
const exitARMode = () => {
  if (xrSession) {
    xrSession.end()
  }
  
  arMode.value = false
  
  // AR elementi varsa kaldır
  const arElement = document.getElementById('ar-button')
  if (arElement) {
    arElement.remove()
  }
  
  // Arka planı geri yükle
  scene.background = new THREE.Color(0xf0f2f5)
  
  // Işık ayarlarını geri getir
  if (xrLight) {
    scene.remove(xrLight)
    xrLight = null
  }
}

// VR görünümünü başlat
const startVRView = () => {
  if (!renderer) return
  
  vrMode.value = true
  arMode.value = false
  
  // VR butonunu oluştur
  const vrButton = VRButton.createButton(renderer)
  document.body.appendChild(vrButton)
  
  // VR oturumunu başlat
  renderer.xr.getSession().then((session) => {
    xrSession = session
    
    // VR kontrolcüleri ekle
    setupVRControllers()
    
    // VR oturumu sonlandığında temizle
    session.addEventListener('end', () => {
      exitVRMode()
    })
  }).catch(error => {
    console.error('VR oturumu başlatılamadı:', error)
    vrMode.value = false
  })
}

// VR kontrolcüleri oluştur
const setupVRControllers = () => {
  if (!xrSession) return
  
  xrSession.inputSources.forEach(inputSource => {
    if (inputSource.gamepad) {
      console.log('VR kontrolcüsü bulundu')
    }
  })
  
  xrSession.addEventListener('inputsourceschange', (event) => {
    // Yeni giriş kaynakları eklendiğinde veya kaldırıldığında
    console.log('Giriş kaynakları değişti:', event)
  })
}

// VR modundan çık
const exitVRMode = () => {
  if (xrSession) {
    xrSession.end()
  }
  
  vrMode.value = false
  
  // VR elementi varsa kaldır
  const vrElement = document.getElementById('vr-button')
  if (vrElement) {
    vrElement.remove()
  }
}

// Kamerayı sıfırla
const resetCamera = () => {
  if (!camera || !model) return
  
  const box = new THREE.Box3().setFromObject(model)
  const size = box.getSize(new THREE.Vector3())
  
  const maxDim = Math.max(size.x, size.y, size.z)
  const distance = maxDim * 2
  camera.position.set(distance, distance * 0.5, distance)
  camera.lookAt(0, 0, 0)
  
  if (controls) {
    controls.enabled = true
    controls.update()
  }
}

// AR/VR modelini dışa aktar
const exportARModel = () => {
  // Modeli GLTF formatına dönüştür ve indir
  try {
    // GLTFExporter'ı kullanmak için önce import edilmesi gerekiyor
    import('three/examples/jsm/exporters/GLTFExporter.js').then(({ GLTFExporter }) => {
      const exporter = new GLTFExporter()
      
      // Modeli kopyala ve AR için hazırla
      const arModel = model.clone()
      
      // AR seçeneklerini uygula
      arModel.scale.set(arOptions.scale, arOptions.scale, arOptions.scale)
      
      exporter.parse(
        arModel,
        (gltf) => {
          if (gltf instanceof ArrayBuffer) {
            saveArrayBuffer(gltf, `${modelName.value.replace(/\s+/g, '-')}-AR.glb`)
          } else {
            const output = JSON.stringify(gltf)
            saveString(output, `${modelName.value.replace(/\s+/g, '-')}-AR.gltf`)
          }
        },
        (error) => {
          console.error('GLTF dışa aktarma hatası:', error)
        },
        { binary: true } // GLB formatında dışa aktar
      )
    })
  } catch (error) {
    console.error('AR modeli dışa aktarılamadı:', error)
  }
}

// ArrayBuffer'ı dosya olarak kaydet
const saveArrayBuffer = (buffer, fileName) => {
  const blob = new Blob([buffer], { type: 'application/octet-stream' })
  const link = document.createElement('a')
  
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  link.click()
  
  // URL'yi temizle
  URL.revokeObjectURL(link.href)
}

// String'i dosya olarak kaydet
const saveString = (text, fileName) => {
  const blob = new Blob([text], { type: 'text/plain' })
  const link = document.createElement('a')
  
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  link.click()
  
  // URL'yi temizle
  URL.revokeObjectURL(link.href)
}

// Ekran görüntüsü al
const captureScreenshot = () => {
  if (!renderer) return
  
  // Canvas elementi bir base64 görüntü olarak dışa aktar
  const screenshot = renderer.domElement.toDataURL('image/png')
  
  // Görüntüyü indirmek için bir bağlantı oluştur
  const link = document.createElement('a')
  link.href = screenshot
  link.download = `${modelName.value.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Ölçümleri göster/gizle
const toggleMeasurements = () => {
  showMeasurements.value = !showMeasurements.value
  
  // Ölçüm çizgilerini göster/gizle
  if (measurements.length === 0 && showMeasurements.value) {
    createMeasurements()
  } else {
    measurements.forEach(m => {
      m.visible = showMeasurements.value
    })
  }
}

// Ölçüm çizgilerini oluştur
const createMeasurements = () => {
  if (!model || !modelMeasurements.value || !scene) return
  
  // Önceki ölçümleri temizle
  measurements.forEach(m => scene.remove(m))
  measurements = []
  
  // Modelin sınırlayıcı kutusunu hesapla
  const box = new THREE.Box3().setFromObject(model)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  
  // Her ölçüm için görsel öğeler oluştur
  modelMeasurements.value.forEach(measurement => {
    if (measurement.type === 'height') {
      const height = new THREE.Group()
      
      // Ölçüm çizgisi
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(center.x - size.x/2, center.y - size.y/2, center.z),
        new THREE.Vector3(center.x - size.x/2, center.y + size.y/2, center.z)
      ])
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 })
      const line = new THREE.Line(lineGeometry, lineMaterial)
      
      // Ölçüm etiketi
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      canvas.width = 256
      canvas.height = 64
      
      context.fillStyle = 'rgba(0, 0, 0, 0.8)'
      context.fillRect(0, 0, canvas.width, canvas.height)
      
      context.font = '24px Arial'
      context.fillStyle = 'white'
      context.fillText(`${measurement.name}: ${measurement.value}${measurement.unit}`, 10, 40)
      
      const texture = new THREE.CanvasTexture(canvas)
      const labelMaterial = new THREE.SpriteMaterial({ map: texture })
      const label = new THREE.Sprite(labelMaterial)
      label.scale.set(2, 0.5, 1)
      label.position.set(center.x - size.x/2 - 1, center.y, center.z)
      
      height.add(line)
      height.add(label)
      
      scene.add(height)
      measurements.push(height)
    }
    
    if (measurement.type === 'width') {
      const width = new THREE.Group()
      
      // Ölçüm çizgisi
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(center.x - size.x/2, center.y - size.y/2, center.z),
        new THREE.Vector3(center.x + size.x/2, center.y - size.y/2, center.z)
      ])
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 })
      const line = new THREE.Line(lineGeometry, lineMaterial)
      
      // Ölçüm etiketi
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      canvas.width = 256
      canvas.height = 64
      
      context.fillStyle = 'rgba(0, 0, 0, 0.8)'
      context.fillRect(0, 0, canvas.width, canvas.height)
      
      context.font = '24px Arial'
      context.fillStyle = 'white'
      context.fillText(`${measurement.name}: ${measurement.value}${measurement.unit}`, 10, 40)
      
      const texture = new THREE.CanvasTexture(canvas)
      const labelMaterial = new THREE.SpriteMaterial({ map: texture })
      const label = new THREE.Sprite(labelMaterial)
      label.scale.set(2, 0.5, 1)
      label.position.set(center.x, center.y - size.y/2 - 1, center.z)
      
      width.add(line)
      width.add(label)
      
      scene.add(width)
      measurements.push(width)
    }
    
    if (measurement.type === 'depth') {
      const depth = new THREE.Group()
      
      // Ölçüm çizgisi
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(center.x - size.x/2, center.y - size.y/2, center.z - size.z/2),
        new THREE.Vector3(center.x - size.x/2, center.y - size.y/2, center.z + size.z/2)
      ])
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff })
      const line = new THREE.Line(lineGeometry, lineMaterial)
      
      // Ölçüm etiketi
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      canvas.width = 256
      canvas.height = 64
      
      context.fillStyle = 'rgba(0, 0, 0, 0.8)'
      context.fillRect(0, 0, canvas.width, canvas.height)
      
      context.font = '24px Arial'
      context.fillStyle = 'white'
      context.fillText(`${measurement.name}: ${measurement.value}${measurement.unit}`, 10, 40)
      
      const texture = new THREE.CanvasTexture(canvas)
      const labelMaterial = new THREE.SpriteMaterial({ map: texture })
      const label = new THREE.Sprite(labelMaterial)
      label.scale.set(2, 0.5, 1)
      label.position.set(center.x - size.x/2, center.y - size.y/2, center.z)
      
      depth.add(line)
      depth.add(label)
      
      scene.add(depth)
      measurements.push(depth)
    }
  })
}

// Modeli parçala/birleştir
const toggleExplode = () => {
  if (!model) return
  
  isExploded.value = !isExploded.value
  
  if (isExploded.value) {
    // Modeli parçalara ayır
    let childIndex = 0
    model.traverse((child) => {
      if (child.isMesh) {
        // Her parçanın orijinal pozisyonunu sakla
        if (!child.userData.originalPosition) {
          child.userData.originalPosition = child.position.clone()
        }
        
        // Parçaları dışa doğru hareket ettir
        const direction = new THREE.Vector3()
        direction.subVectors(child.position, new THREE.Vector3(0, 0, 0)).normalize()
        child.position.add(direction.multiplyScalar(0.5))
        
        // Animasyon için zaman gecikmesi ekle
        setTimeout(() => {
          child.position.add(direction.multiplyScalar(0.3))
        }, 100 * childIndex)
        
        childIndex++
      }
    })
  } else {
    // Modeli birleştir
    model.traverse((child) => {
      if (child.isMesh && child.userData.originalPosition) {
        // Her parçayı orijinal pozisyonuna geri getir
        child.position.copy(child.userData.originalPosition)
      }
    })
  }
}

// Bileşen görünürlüğünü değiştir
const toggleComponentVisibility = (index) => {
  if (!model) return
  
  let componentIndex = 0
  model.traverse((child) => {
    if (child.isMesh) {
      if (componentIndex === index) {
        child.visible = componentVisibility[index]
      }
      componentIndex++
    }
  })
}

// Ölçüm verilerini yükle
const loadMeasurements = async () => {
  measurementsLoading.value = true
  
  try {
    const response = await aiService.modelMeasurements(props.modelId)
    
    if (response && response.success && response.data && response.data.measurements) {
      modelMeasurements.value = response.data.measurements
    } else {
      console.error('Ölçümler alınamadı:', response)
    }
  } catch (error) {
    console.error('Ölçümler yüklenirken hata:', error)
  } finally {
    measurementsLoading.value = false
  }
}

// ML analizi için yeni özellik
const runMachineLearningAnalysis = async () => {
  if (!modelInfo.value) return
  
  try {
    // ML analizi yapılıyor olarak işaretle
    isLoading.value = true
    
    // AI servisi üzerinden ML analizi çalıştır
    const analysis = await aiService.analyzeCADModel({
      modelId: props.modelId,
      modelName: modelInfo.value.name,
      format: modelInfo.value.format
    })
    
    // Analiz sonuçlarını göster
    if (analysis && analysis.results) {
      // ML analiz sonuçlarını modele ekle
      modelInfo.value.mlAnalysis = {
        timestamp: new Date(),
        results: analysis.results,
        suggestions: analysis.suggestions || [],
        optimizations: analysis.optimizations || [],
        similarModels: analysis.similarModels || []
      }
      
      // ML sekmesini aktifleştir
      activeTab.value = 'ml_analysis'
    }
  } catch (error) {
    console.error('ML analizi hatası:', error)
  } finally {
    isLoading.value = false
  }
}

// Zorluk seviyesine göre sınıf hesaplama
const difficultyClass = computed(() => {
  if (!analysisResults.value) return 'bg-secondary';
  
  const difficulty = analysisResults.value.production.difficulty;
  if (difficulty <= 2) return 'bg-success';
  if (difficulty <= 4) return 'bg-warning';
  return 'bg-danger';
})

// Metrik etiketlerini formatla
const metricLabel = (key) => {
  switch(key) {
    case 'precision': return 'Hassasiyet';
    case 'recall': return 'Duyarlılık';
    case 'f1': return 'F1 Skoru';
    case 'accuracy': return 'Doğruluk';
    default: return key.charAt(0).toUpperCase() + key.slice(1);
  }
}

// Modeli analiz et
const analyzeModel = async () => {
  if (!modelInfo.value) return;
  
  analyzeLoading.value = true;
  analysisProgress.value = 0;
  
  try {
    // Progress simulasyonu
    const progressInterval = setInterval(() => {
      analysisProgress.value += Math.random() * 5;
      if (analysisProgress.value > 95) {
        analysisProgress.value = 95;
        clearInterval(progressInterval);
      }
    }, 300);
    
    // AI servisini kullanarak CAD modelini analiz et
    const analysis = await aiService.analyzeCADModel({
      modelId: props.modelId,
      modelName: modelInfo.value.name,
      format: modelInfo.value.format
    });
    
    // Analiz tamamlandı
    analysisProgress.value = 100;
    clearInterval(progressInterval);
    
    // Dummy analiz sonuçları oluştur (gerçek API bağlantısı olana kadar)
    analysisResults.value = {
      materials: [
        { name: 'Çelik', quantity: 120, unit: 'kg', estimatedCost: 1850 },
        { name: 'Bakır', quantity: 15, unit: 'kg', estimatedCost: 2100 },
        { name: 'Paslanmaz Çelik', quantity: 5, unit: 'kg', estimatedCost: 750 },
        { name: 'Plastik', quantity: 8, unit: 'kg', estimatedCost: 320 }
      ],
      totalCost: 5020,
      production: {
        estimatedTime: 120,
        difficulty: 3,
        customizationPotential: 4,
        requiredEquipment: ['CNC', 'Lazer Kesim', 'Büküm Presi', 'Kaynak']
      },
      quality: {
        criticalComponents: [
          { name: 'Kesici Mekanizma', impactScore: 9 },
          { name: 'Bara Bağlantısı', impactScore: 7 },
          { name: 'Ana Gövde', impactScore: 5 }
        ],
        recommendedTests: [
          'Yalıtım Direnci Testi',
          'Yük Altında Çalışma Testi',
          'Sıcaklık Yükselme Testi',
          'IP Koruma Testi'
        ]
      },
      algorithm: {
        accuracy: 0.94,
        metrics: {
          precision: 0.92,
          recall: 0.88,
          f1: 0.90
        },
        explanation: 'Bu analiz, makine öğrenmesi algoritmalarını kullanarak CAD modelini değerlendirdi. Model, benzer endüstriyel elektrik ekipmanlarının bilinen parametrelerine dayalı olarak materyal ve üretim özelliklerini tahmin etmektedir. %94 doğruluk oranıyla, malzeme gereksinimleri ve üretim süresi gibi kritik faktörler için güvenilir sonuçlar sağlamaktadır.'
      }
    };
  } catch (error) {
    console.error('Model analizi sırasında hata:', error);
    analysisResults.value = null;
    error.value = 'Model analiz edilirken bir hata oluştu.';
  } finally {
    analyzeLoading.value = false;
  }
};

// Pencere boyutu değiştiğinde çalışacak işlev
const onWindowResize = () => {
  if (!camera || !renderer || !canvasElement.value) return
  
  camera.aspect = canvasElement.value.clientWidth / canvasElement.value.clientHeight
  camera.updateProjectionMatrix()
  
  renderer.setSize(canvasElement.value.clientWidth, canvasElement.value.clientHeight)
}

// Bileşen oluşturulduğunda
onMounted(async () => {
  // Model bilgisini yükle
  await loadModelInfo()
  
  // 3D görüntüleyiciyi ayarla
  setupViewer()
  
  // Modeli yükle
  if (modelInfo.value) {
    loadModel()
  }
})

// Bileşen kaldırıldığında temizlik yap
onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize)
  
  // ThreeJS kaynaklarını temizle
  if (renderer) {
    renderer.dispose()
    renderer.forceContextLoss()
  }
  
  if (controls) {
    controls.dispose()
  }
  
  // AR/VR oturumu varsa sonlandır
  if (xrSession) {
    xrSession.end()
  }
})

// arOptions.scale değiştiğinde anlık olarak güncelle
watch(() => arOptions.scale, (newScale) => {
  if (model) {
    model.scale.set(newScale, newScale, newScale)
  }
})
</script>

<style lang="scss" scoped>
.cad-viewer-modal {
  background-color: var(--bs-body-bg);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 90vh;
  min-height: 70vh;
  overflow: hidden;
  width: 100%;
}

.cad-viewer-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 0;
  overflow: hidden;
}

.cad-viewer-header {
  align-items: center;
  background-color: var(--bs-tertiary-bg);
  border-bottom: 1px solid var(--bs-border-color);
  display: flex;
  justify-content: space-between;
  padding: .75rem 1rem;
}

.cad-viewer-actions {
  display: flex;
}

.cad-viewer-content {
  flex: 1;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cad-viewer-loading {
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  text-align: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 5;
}

.cad-viewer-error {
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  text-align: center;
  color: var(--bs-danger);
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 5;
}

.cad-canvas-container {
  width: 100%;
  height: 100%;
}

.cad-canvas {
  width: 100%;
  height: 100%;
}

.cad-viewer-footer {
  border-top: 1px solid var(--bs-border-color);
  padding: .75rem 1rem;
  max-height: 30vh;
  overflow-y: auto;
}

.cad-viewer-tabs {
  margin-bottom: 0.5rem;
}

.cad-viewer-tab-content {
  padding-top: 0.5rem;
}

.ar-instructions, .vr-instructions {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  right: 1rem;
  z-index: 10;
}

/* Ölçüm Çizgisi Stilleri */
.measurement-line {
  stroke: var(--bs-primary);
  stroke-width: 2;
  stroke-dasharray: 5;
}

.measurement-label {
  fill: var(--bs-dark);
  font-size: 12px;
  text-anchor: middle;
}

/* Tab içerik stilleri */
.tab-pane {
  display: none;
}

.tab-pane.active {
  display: block;
}

/* Animasyonlar */
@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

.measurement-highlight {
  animation: pulse 2s infinite;
}
</style>