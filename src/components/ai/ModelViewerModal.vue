<template>
  <transition name="modal-fade">
    <div v-if="show" class="modal-overlay" @click.self="handleClose">
      <div class="model-viewer-modal">
        <div class="model-viewer-header">
          <h5>{{ model.name }} <span class="model-version">v{{ model.version }}</span></h5>
          <div class="model-actions">
            <button v-if="!isFullscreen" @click="toggleARView" class="btn btn-sm" :class="isARMode ? 'btn-success' : 'btn-outline-secondary'">
              <i class="bi bi-badge-ar me-1"></i> {{ isARMode ? 'AR Aktif' : 'AR Moduna Geç' }}
            </button>
            <button @click="toggleFullscreen" class="btn btn-sm btn-outline-secondary mx-2">
              <i class="bi" :class="isFullscreen ? 'bi-fullscreen-exit' : 'bi-fullscreen'"></i>
            </button>
            <button @click="handleClose" class="btn btn-sm btn-outline-danger">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        <div class="model-viewer-content">
          <!-- 3D Model Görüntüleyici -->
          <div 
            class="model-container" 
            ref="modelContainer"
            :class="{'ar-mode': isARMode, 'fullscreen': isFullscreen}"
          >
            <!-- three.js canvas -->
            <canvas ref="modelCanvas"></canvas>
            
            <div v-if="!modelLoaded" class="model-loading">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Yükleniyor...</span>
              </div>
              <div class="mt-3">Model yükleniyor...</div>
            </div>
            
            <div v-if="modelError" class="model-error">
              <i class="bi bi-exclamation-triangle text-warning fs-2"></i>
              <div class="mt-3">Model yüklenemedi: {{ modelError }}</div>
            </div>
            
            <!-- Hotspots (İnteraktif noktalar) -->
            <div v-if="isARMode && modelLoaded" class="hotspots-container">
              <div 
                v-for="(hotspot, index) in activeHotspots" 
                :key="index" 
                class="hotspot"
                :style="{ 
                  left: `${hotspot.screenPosition.x}px`, 
                  top: `${hotspot.screenPosition.y}px`,
                  opacity: hotspot.visible ? 1 : 0
                }"
                @click="showHotspotInfo(hotspot)"
              >
                <div class="hotspot-dot"></div>
                <div class="hotspot-ring"></div>
              </div>
            </div>
          </div>
          
          <!-- Yan panel: Model bilgileri, bileşenler listesi vb. -->
          <div class="model-sidebar" v-if="!isFullscreen">
            <ul class="nav nav-tabs" id="modelTabs" role="tablist">
              <li class="nav-item" role="presentation">
                <button 
                  class="nav-link active" 
                  id="info-tab" 
                  data-bs-toggle="tab" 
                  data-bs-target="#info-tab-pane" 
                  type="button" 
                  role="tab" 
                  aria-controls="info-tab-pane" 
                  aria-selected="true"
                >Bilgi</button>
              </li>
              <li class="nav-item" role="presentation">
                <button 
                  class="nav-link" 
                  id="components-tab" 
                  data-bs-toggle="tab" 
                  data-bs-target="#components-tab-pane" 
                  type="button" 
                  role="tab" 
                  aria-controls="components-tab-pane" 
                  aria-selected="false"
                >Bileşenler</button>
              </li>
              <li class="nav-item" role="presentation">
                <button 
                  class="nav-link" 
                  id="measurements-tab" 
                  data-bs-toggle="tab" 
                  data-bs-target="#measurements-tab-pane" 
                  type="button" 
                  role="tab" 
                  aria-controls="measurements-tab-pane" 
                  aria-selected="false"
                >Ölçümler</button>
              </li>
            </ul>
            
            <div class="tab-content model-tabs-content" id="modelTabsContent">
              <!-- Genel Bilgi Sekmesi -->
              <div class="tab-pane fade show active" id="info-tab-pane" role="tabpanel" aria-labelledby="info-tab" tabindex="0">
                <div class="model-info">
                  <div v-if="!modelAnalysis">
                    <div class="d-flex justify-content-center my-4">
                      <button class="btn btn-primary btn-sm" @click="fetchModelAnalysis('general')">
                        <i class="bi bi-graph-up me-1"></i> Model Bilgilerini Getir
                      </button>
                    </div>
                  </div>
                  <div v-else-if="modelAnalysisLoading">
                    <div class="d-flex justify-content-center my-4">
                      <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Yükleniyor...</span>
                      </div>
                    </div>
                  </div>
                  <div v-else>
                    <div class="model-info-item">
                      <div class="model-info-label">Model Adı:</div>
                      <div class="model-info-value">{{ model.name }}</div>
                    </div>
                    <div class="model-info-item">
                      <div class="model-info-label">Format:</div>
                      <div class="model-info-value">{{ model.format }}</div>
                    </div>
                    <div class="model-info-item">
                      <div class="model-info-label">Sürüm:</div>
                      <div class="model-info-value">{{ model.version }}</div>
                    </div>
                    <div class="model-info-item">
                      <div class="model-info-label">Son Güncelleme:</div>
                      <div class="model-info-value">{{ model.lastUpdated || 'Bilinmiyor' }}</div>
                    </div>
                    <div class="model-info-item">
                      <div class="model-info-label">Açıklama:</div>
                      <div class="model-info-value">{{ modelAnalysis.data?.description || 'Açıklama bulunmuyor' }}</div>
                    </div>
                    
                    <div v-if="modelAnalysis.data?.specifications" class="mt-3">
                      <h6>Teknik Özellikler</h6>
                      <div v-for="(spec, key) in modelAnalysis.data.specifications" :key="key" class="model-spec-item">
                        <div class="model-spec-label">{{ key }}:</div>
                        <div class="model-spec-value">{{ spec }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Bileşenler Sekmesi -->
              <div class="tab-pane fade" id="components-tab-pane" role="tabpanel" aria-labelledby="components-tab" tabindex="0">
                <div class="model-components">
                  <div v-if="!componentsAnalysis">
                    <div class="d-flex justify-content-center my-4">
                      <button class="btn btn-primary btn-sm" @click="fetchModelAnalysis('components')">
                        <i class="bi bi-list-ul me-1"></i> Bileşenleri Getir
                      </button>
                    </div>
                  </div>
                  <div v-else-if="modelAnalysisLoading">
                    <div class="d-flex justify-content-center my-4">
                      <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Yükleniyor...</span>
                      </div>
                    </div>
                  </div>
                  <div v-else>
                    <div v-if="componentsAnalysis.data?.components && componentsAnalysis.data.components.length > 0">
                      <div class="component-list">
                        <div 
                          v-for="(component, index) in componentsAnalysis.data.components" 
                          :key="index"
                          class="component-item"
                          :class="{'component-highlighted': highlightedComponent === index}"
                          @click="highlightComponent(index)"
                          @mouseover="previewHighlightComponent(index)"
                          @mouseleave="cancelHighlightPreview()"
                        >
                          <div class="component-name">{{ component.name }}</div>
                          <div class="component-details">
                            <span v-if="component.material" class="component-detail">
                              <i class="bi bi-circle-fill me-1"></i> {{ component.material }}
                            </span>
                            <span v-if="component.weight" class="component-detail">
                              <i class="bi bi-star-fill me-1"></i> {{ component.weight }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div v-else class="text-center my-3">
                      <div class="alert alert-warning">
                        Bu model için bileşen bilgisi bulunamadı.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Ölçümler Sekmesi -->
              <div class="tab-pane fade" id="measurements-tab-pane" role="tabpanel" aria-labelledby="measurements-tab" tabindex="0">
                <div class="model-measurements">
                  <div v-if="!measurementsAnalysis">
                    <div class="d-flex justify-content-center my-4">
                      <button class="btn btn-primary btn-sm" @click="fetchModelAnalysis('measurements')">
                        <i class="bi bi-rulers me-1"></i> Ölçümleri Getir
                      </button>
                    </div>
                  </div>
                  <div v-else-if="modelAnalysisLoading">
                    <div class="d-flex justify-content-center my-4">
                      <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Yükleniyor...</span>
                      </div>
                    </div>
                  </div>
                  <div v-else>
                    <div v-if="measurementsAnalysis.data?.dimensions" class="mt-3">
                      <h6>Ana Boyutlar</h6>
                      <div class="measurement-item">
                        <div class="measurement-name">Genişlik:</div>
                        <div class="measurement-value">{{ measurementsAnalysis.data.dimensions.width || 'Bilinmiyor' }}</div>
                      </div>
                      <div class="measurement-item">
                        <div class="measurement-name">Yükseklik:</div>
                        <div class="measurement-value">{{ measurementsAnalysis.data.dimensions.height || 'Bilinmiyor' }}</div>
                      </div>
                      <div class="measurement-item">
                        <div class="measurement-name">Derinlik:</div>
                        <div class="measurement-value">{{ measurementsAnalysis.data.dimensions.depth || 'Bilinmiyor' }}</div>
                      </div>
                      <div class="measurement-item">
                        <div class="measurement-name">Ağırlık:</div>
                        <div class="measurement-value">{{ measurementsAnalysis.data.dimensions.weight || 'Bilinmiyor' }}</div>
                      </div>
                    </div>
                    
                    <div v-if="measurementsAnalysis.data?.connectionPoints && measurementsAnalysis.data.connectionPoints.length > 0" class="mt-4">
                      <h6>Bağlantı Noktaları</h6>
                      <div 
                        v-for="(point, index) in measurementsAnalysis.data.connectionPoints" 
                        :key="index"
                        class="connection-point-item"
                        @click="showConnectionPoint(point)"
                      >
                        <div class="connection-point-name">{{ point.name }}</div>
                        <div class="connection-point-type">{{ point.type || 'Standart' }}</div>
                      </div>
                    </div>
                    
                    <div v-if="!measurementsAnalysis.data?.dimensions && !measurementsAnalysis.data?.connectionPoints" class="text-center my-3">
                      <div class="alert alert-warning">
                        Bu model için ölçüm bilgisi bulunamadı.
                      </div>
                    </div>
                    
                    <div class="d-flex justify-content-center mt-4">
                      <button 
                        class="btn btn-sm" 
                        :class="showMeasurements ? 'btn-danger' : 'btn-success'"
                        @click="toggleMeasurements"
                      >
                        <i :class="showMeasurements ? 'bi bi-eye-slash me-1' : 'bi bi-eye me-1'"></i>
                        {{ showMeasurements ? 'Ölçümleri Gizle' : 'Ölçümleri Modelde Göster' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Hotspot Bilgi Kutusu -->
        <div v-if="activeHotspot" class="hotspot-info-container" :style="{
          left: `${activeHotspot.screenPosition.x + 20}px`,
          top: `${activeHotspot.screenPosition.y - 30}px`
        }">
          <div class="hotspot-info">
            <div class="hotspot-info-header">
              <h6>{{ activeHotspot.title }}</h6>
              <button class="btn-close btn-sm" @click="closeHotspotInfo"></button>
            </div>
            <div class="hotspot-info-content">
              {{ activeHotspot.description }}
            </div>
            <div v-if="activeHotspot.measurements" class="hotspot-measurements">
              <div v-for="(value, key) in activeHotspot.measurements" :key="key" class="hotspot-measurement">
                <span class="measurement-label">{{ key }}:</span>
                <span class="measurement-value">{{ value }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useAiService } from '@/services/ai-service';

// Props
const props = defineProps({
  model: {
    type: Object,
    required: true
  },
  show: {
    type: Boolean,
    default: false
  }
});

// Emit
const emit = defineEmits(['close']);

// References
const modelContainer = ref(null);
const modelCanvas = ref(null);

// AI Service
const aiService = useAiService();

// State
const modelLoaded = ref(false);
const modelError = ref('');
const isARMode = ref(false);
const isFullscreen = ref(false);
const modelAnalysis = ref(null);
const componentsAnalysis = ref(null);
const measurementsAnalysis = ref(null);
const modelAnalysisLoading = ref(false);
const highlightedComponent = ref(null);
const previewHighlightedComponent = ref(null);
const showMeasurements = ref(false);
const activeHotspots = ref([]);
const activeHotspot = ref(null);

// Three.js variables
let scene, camera, renderer, controls;
let modelObject = null;
let animationFrameId = null;
let componentMeshes = [];
let originalMaterials = [];
let measurementLines = [];

// Modeli yükle
const loadModel = async () => {
  if (!modelContainer.value || !modelCanvas.value) return;
  
  modelLoaded.value = false;
  modelError.value = '';
  
  // Scene, camera ve renderer oluştur
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);
  
  // Kamera ayarları
  const width = modelContainer.value.clientWidth;
  const height = modelContainer.value.clientHeight;
  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
  camera.position.set(0, 0, 5);
  
  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: modelCanvas.value,
    antialias: true,
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  
  // Kontroller
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  
  // Işıklandırma
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);
  
  const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
  backLight.position.set(-1, -1, -1);
  scene.add(backLight);
  
  try {
    // Model yükleme işlemi
    // Gerçek uygulamada model.path değişkeni ile dosyanın yolu verilmeli
    // Bu örnekte modellerimizin tipi STEP belirtilmiş ancak Three.js doğrudan STEP desteği olmadığından
    // Gerçek uygulamada modellerin önce GLB/GLTF veya STL formatına dönüştürülmesi gerekecek
    const modelPath = props.model.path;
    
    if (!modelPath) throw new Error('Model dosya yolu belirtilmemiş.');
    
    // Bu demo için dosya adının uzantısına göre uygun loader'ı seç
    const fileExtension = modelPath.toLowerCase().split('.').pop();
    
    if (fileExtension === 'stl') {
      const loader = new STLLoader();
      const geometry = await new Promise((resolve, reject) => {
        loader.load(
          modelPath,
          (geometry) => resolve(geometry),
          undefined,
          (error) => reject(error)
        );
      });
      
      const material = new THREE.MeshPhongMaterial({ 
        color: 0xaaaaaa, 
        specular: 0x111111, 
        shininess: 200 
      });
      modelObject = new THREE.Mesh(geometry, material);
      
      // Otomatik boyutlandırma ve merkezleme
      const box = new THREE.Box3().setFromObject(modelObject);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      
      modelObject.position.x -= center.x;
      modelObject.position.y -= center.y;
      modelObject.position.z -= center.z;
      
      scene.add(modelObject);
      
    } else if (fileExtension === 'gltf' || fileExtension === 'glb') {
      const loader = new GLTFLoader();
      const gltf = await new Promise((resolve, reject) => {
        loader.load(
          modelPath,
          (gltf) => resolve(gltf),
          undefined,
          (error) => reject(error)
        );
      });
      
      modelObject = gltf.scene;
      
      // Otomatik boyutlandırma ve merkezleme
      const box = new THREE.Box3().setFromObject(modelObject);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      
      modelObject.position.x -= center.x;
      modelObject.position.y -= center.y;
      modelObject.position.z -= center.z;
      
      scene.add(modelObject);
      
    } else {
      // Gerçek projede format dönüşümü ve diğer formatların desteği gerekebilir
      // Bu demo için sadece basit bir geometri oluşturacağız
      console.warn(`Dosya formatı '${fileExtension}' desteklenmiyor. Demo model gösterilecek.`);
      
      // Basit bir demo model oluştur (box)
      const geometry = new THREE.BoxGeometry(2, 2, 2);
      const material = new THREE.MeshPhongMaterial({ 
        color: 0x0088ff, 
        specular: 0x111111, 
        shininess: 200 
      });
      modelObject = new THREE.Mesh(geometry, material);
      scene.add(modelObject);
    }
    
    // Model başarıyla yüklendiyse bileşenlere ayır (demoda basitleştirilmiş)
    createComponentMeshes();
    
    modelLoaded.value = true;
    animate();
    
  } catch (error) {
    console.error("Model yükleme hatası:", error);
    modelError.value = error.message || 'Model yüklenemedi';
  }
};

// Animasyon döngüsü
const animate = () => {
  if (!renderer || !scene || !camera || !controls) return;
  
  animationFrameId = requestAnimationFrame(animate);
  
  controls.update();
  
  // AR modunda ise hotspotları güncelle
  if (isARMode.value && activeHotspots.value.length > 0) {
    updateHotspotsPosition();
  }
  
  renderer.render(scene, camera);
};

// Bileşen meshlerini oluştur (demo için basitleştirilmiş)
const createComponentMeshes = () => {
  if (!modelObject) return;
  
  if (props.model.components && props.model.components.length > 0) {
    // Gerçek uygulamada model parçalarına ayrılmalı, bu demoda basitleştirdik
    componentMeshes = [];
    originalMaterials = [];
    
    // Demo için bazı renklerle bileşenleri simüle et
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
    
    props.model.components.forEach((component, index) => {
      // Gerçek uygulamada model parçalanmış olmalı, burada sadece temsili
      const colorIndex = index % colors.length;
      
      // Demo mesh oluştur (küçük box)
      const size = 0.5;
      const geometry = new THREE.BoxGeometry(size, size, size);
      const material = new THREE.MeshPhongMaterial({ 
        color: colors[colorIndex], 
        transparent: true,
        opacity: 0.7
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        (index % 3 - 1) * 0.8,
        Math.floor(index / 3) * 0.8 - 0.8,
        0
      );
      
      componentMeshes.push(mesh);
      originalMaterials.push(material.clone());
      
      scene.add(mesh);
    });
  }
};

// Pencere boyutunu değiştir
const handleResize = () => {
  if (!modelContainer.value || !camera || !renderer) return;
  
  const width = modelContainer.value.clientWidth;
  const height = modelContainer.value.clientHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  
  renderer.setSize(width, height);
};

// Bileşeni vurgula
const highlightComponent = (index) => {
  if (highlightedComponent.value === index) {
    // Aynı bileşene tekrar tıklandığında vurguyu kaldır
    highlightedComponent.value = null;
    resetComponentHighlight();
  } else {
    highlightedComponent.value = index;
    highlightComponentMesh(index);
  }
};

// Önizleme vurgulaması
const previewHighlightComponent = (index) => {
  if (highlightedComponent.value !== null) return;
  
  previewHighlightedComponent.value = index;
  highlightComponentMesh(index);
};

// Vurgu önizlemesini kaldır
const cancelHighlightPreview = () => {
  if (highlightedComponent.value !== null) return;
  
  previewHighlightedComponent.value = null;
  resetComponentHighlight();
};

// Bileşen mesh'ini vurgula
const highlightComponentMesh = (index) => {
  if (!componentMeshes[index]) return;
  
  // Önce tüm vurguları kaldır
  resetComponentHighlight();
  
  // Seçili bileşeni vurgula
  const mesh = componentMeshes[index];
  
  // Vurgulanan materyal (highlight)
  mesh.material = new THREE.MeshPhongMaterial({
    color: 0xffff00,
    emissive: 0x333300,
    transparent: true,
    opacity: 0.9
  });
};

// Tüm bileşen vurgularını kaldır
const resetComponentHighlight = () => {
  componentMeshes.forEach((mesh, idx) => {
    if (originalMaterials[idx]) {
      mesh.material = originalMaterials[idx].clone();
    }
  });
};

// Ölçümleri göster/gizle
const toggleMeasurements = () => {
  showMeasurements.value = !showMeasurements.value;
  
  if (showMeasurements.value) {
    displayMeasurements();
  } else {
    hideMeasurements();
  }
};

// Ölçümleri ekranda göster
const displayMeasurements = () => {
  hideMeasurements(); // İlk önce mevcut ölçümleri temizle
  
  if (!scene || !measurementsAnalysis.value || !measurementsAnalysis.value.data) return;
  
  // Model boyutları
  if (measurementsAnalysis.value.data.dimensions) {
    const dims = measurementsAnalysis.value.data.dimensions;
    
    // Model boyutu (bounding box)
    const box = new THREE.Box3().setFromObject(modelObject);
    const size = box.getSize(new THREE.Vector3());
    
    // X ekseni (genişlik)
    const widthLine = createMeasurementLine(
      new THREE.Vector3(-size.x/2, -size.y/2, -size.z/2),
      new THREE.Vector3(size.x/2, -size.y/2, -size.z/2),
      0xff0000
    );
    scene.add(widthLine);
    measurementLines.push(widthLine);
    
    // Y ekseni (yükseklik)
    const heightLine = createMeasurementLine(
      new THREE.Vector3(-size.x/2, -size.y/2, -size.z/2),
      new THREE.Vector3(-size.x/2, size.y/2, -size.z/2),
      0x00ff00
    );
    scene.add(heightLine);
    measurementLines.push(heightLine);
    
    // Z ekseni (derinlik)
    const depthLine = createMeasurementLine(
      new THREE.Vector3(-size.x/2, -size.y/2, -size.z/2),
      new THREE.Vector3(-size.x/2, -size.y/2, size.z/2),
      0x0000ff
    );
    scene.add(depthLine);
    measurementLines.push(depthLine);
  }
};

// Ölçüm çizgisi oluştur
const createMeasurementLine = (start, end, color) => {
  const material = new THREE.LineBasicMaterial({ color });
  const points = [start, end];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return new THREE.Line(geometry, material);
};

// Ölçümleri temizle
const hideMeasurements = () => {
  measurementLines.forEach(line => {
    scene.remove(line);
  });
  measurementLines = [];
};

// AR modunu aç/kapat
const toggleARView = () => {
  isARMode.value = !isARMode.value;
  
  if (isARMode.value) {
    setupARView();
  } else {
    exitARView();
  }
};

// AR modu ayarla
const setupARView = async () => {
  activeHotspots.value = [];
  activeHotspot.value = null;
  
  // AR modeli için analiz yapmamış isek yap
  if (!modelAnalysisLoading.value && !componentsAnalysis.value) {
    await fetchModelAnalysis('components');
  }
  
  // AR modunda hotspot'ları hazırla
  generateHotspots();
};

// AR modundan çık
const exitARView = () => {
  activeHotspots.value = [];
  activeHotspot.value = null;
};

// Hotspotları oluştur
const generateHotspots = () => {
  if (!componentsAnalysis.value || !componentsAnalysis.value.data || !componentsAnalysis.value.data.components) return;
  
  const components = componentsAnalysis.value.data.components;
  
  // Her bileşen için hotspot oluştur
  components.forEach((component, index) => {
    if (!componentMeshes[index]) return;
    
    const mesh = componentMeshes[index];
    const position = mesh.position.clone();
    
    activeHotspots.value.push({
      id: `hotspot-${index}`,
      title: component.name,
      description: `${component.material || 'Metal'} malzemeden üretilmiş bileşen.`,
      measurements: {
        'Ağırlık': component.weight || 'Belirtilmemiş',
      },
      position: position,
      screenPosition: { x: 0, y: 0 },
      visible: true,
      componentIndex: index
    });
  });
  
  // Hotspot pozisyonlarını güncelle
  updateHotspotsPosition();
};

// Hotspot pozisyonlarını güncelle
const updateHotspotsPosition = () => {
  if (!camera || !renderer) return;
  
  activeHotspots.value.forEach(hotspot => {
    // 3D pozisyonu 2D ekran koordinatlarına dönüştür
    const position = hotspot.position.clone();
    const vector = position.project(camera);
    
    // Ekrana göre viewport hesapla
    const rect = renderer.domElement.getBoundingClientRect();
    const x = ((vector.x + 1) / 2) * rect.width + rect.left;
    const y = (-(vector.y - 1) / 2) * rect.height + rect.top;
    
    hotspot.screenPosition = { x, y };
    
    // Kameraya göre görünürlük
    const dot = position.clone().normalize().dot(camera.position.clone().normalize());
    hotspot.visible = dot < 0.2; // Açıya göre görünürlük ayarı
  });
};

// Hotspot detaylarını göster
const showHotspotInfo = (hotspot) => {
  activeHotspot.value = hotspot;
  
  // Bileşeni vurgula
  if (typeof hotspot.componentIndex === 'number') {
    highlightComponent(hotspot.componentIndex);
  }
};

// Hotspot detaylarını kapat
const closeHotspotInfo = () => {
  activeHotspot.value = null;
  highlightedComponent.value = null;
  resetComponentHighlight();
};

// Model analizi getir
const fetchModelAnalysis = async (analysisType) => {
  modelAnalysisLoading.value = true;
  
  try {
    const result = await aiService.analyzeCADModel(props.model.id, analysisType);
    
    if (result.success) {
      switch(analysisType) {
        case 'general':
          modelAnalysis.value = result;
          break;
        case 'components':
          componentsAnalysis.value = result;
          break;
        case 'measurements':
          measurementsAnalysis.value = result;
          break;
      }
    } else {
      console.error(`${analysisType} analizi başarısız:`, result.error);
    }
  } catch (error) {
    console.error(`${analysisType} analizi hatası:`, error);
  } finally {
    modelAnalysisLoading.value = false;
  }
};

// Tam ekran modu aç/kapat
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
  
  nextTick(() => {
    handleResize();
  });
};

// Bağlantı noktasını göster
const showConnectionPoint = (point) => {
  // Demo amaçlı basitleştirilmiş
  alert(`Bağlantı Noktası: ${point.name}\nTip: ${point.type || 'Standart'}`);
};

// Modal kapatma
const handleClose = () => {
  emit('close');
};

// Yaşam döngüsü yönetimi
watch(() => props.show, (newVal) => {
  if (newVal) {
    nextTick(() => {
      loadModel();
      window.addEventListener('resize', handleResize);
    });
  } else {
    // Temizlik
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    
    window.removeEventListener('resize', handleResize);
    
    scene = null;
    camera = null;
    
    if (renderer) {
      renderer.dispose();
      renderer = null;
    }
    
    modelObject = null;
    controls = null;
    componentMeshes = [];
    originalMaterials = [];
    measurementLines = [];
  }
});

// Komponent kaldırıldığında temizlik
onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
}

.model-viewer-modal {
  width: 90vw;
  height: 80vh;
  background-color: var(--bg-color, #ffffff);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.model-viewer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: var(--primary-color, #0d6efd);
  color: white;
}

.model-version {
  font-size: 0.8rem;
  opacity: 0.8;
  margin-left: 5px;
}

.model-viewer-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.model-container {
  flex: 3;
  position: relative;
  overflow: hidden;
}

.model-container.fullscreen {
  flex: 1;
}

.model-container canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.model-sidebar {
  flex: 1;
  border-left: 1px solid var(--border-color, #dee2e6);
  display: flex;
  flex-direction: column;
  min-width: 300px;
  max-width: 400px;
  overflow: hidden;
}

.model-tabs-content {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
}

.model-info-item {
  display: flex;
  margin-bottom: 10px;
}

.model-info-label {
  flex: 1;
  font-weight: 500;
}

.model-info-value {
  flex: 2;
}

.model-spec-item {
  display: flex;
  margin-bottom: 5px;
}

.model-spec-label {
  flex: 1;
  font-weight: 500;
}

.model-spec-value {
  flex: 2;
}

.component-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.component-item {
  padding: 10px;
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.component-item:hover {
  background-color: rgba(13, 110, 253, 0.1);
}

.component-highlighted {
  border-color: var(--primary-color, #0d6efd);
  background-color: rgba(13, 110, 253, 0.1);
  box-shadow: 0 0 0 2px var(--primary-color, #0d6efd);
}

.component-name {
  font-weight: 500;
}

.component-details {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 5px;
  font-size: 0.8rem;
}

.component-detail {
  display: flex;
  align-items: center;
}

.component-detail i {
  font-size: 0.7rem;
}

.measurement-item {
  display: flex;
  margin-bottom: 8px;
}

.measurement-name {
  flex: 1;
  font-weight: 500;
}

.measurement-value {
  flex: 2;
}

.connection-point-item {
  padding: 8px 10px;
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
}

.connection-point-item:hover {
  background-color: rgba(13, 110, 253, 0.1);
}

.connection-point-name {
  font-weight: 500;
}

.connection-point-type {
  font-size: 0.8rem;
  color: var(--secondary-color, #6c757d);
}

.model-loading,
.model-error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.7);
}

.model-error {
  color: var(--danger-color, #dc3545);
}

/* AR Modu */
.hotspots-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.hotspot {
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: auto;
  cursor: pointer;
}

.hotspot-dot {
  width: 12px;
  height: 12px;
  background-color: white;
  border-radius: 50%;
  border: 2px solid var(--primary-color, #0d6efd);
}

.hotspot-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid var(--primary-color, #0d6efd);
  animation: pulse 1.5s infinite;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.hotspot-info-container {
  position: absolute;
  z-index: 100;
  pointer-events: auto;
}

.hotspot-info {
  min-width: 200px;
  max-width: 300px;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.hotspot-info-header {
  padding: 10px;
  background-color: var(--primary-color, #0d6efd);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hotspot-info-header h6 {
  margin: 0;
  font-size: 0.9rem;
}

.hotspot-info-content {
  padding: 12px;
  font-size: 0.9rem;
}

.hotspot-measurements {
  padding: 0 12px 12px 12px;
  font-size: 0.8rem;
  border-top: 1px solid var(--border-color, #dee2e6);
  padding-top: 8px;
  margin-top: 8px;
}

.hotspot-measurement {
  display: flex;
  margin-bottom: 4px;
}

.measurement-label {
  flex: 1;
  font-weight: 500;
}

@keyframes pulse {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(0.8);
  }
  70% {
    opacity: 0.3;
    transform: translate(-50%, -50%) scale(1.3);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.5);
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Koyu mod desteği */
@media (prefers-color-scheme: dark) {
  .model-viewer-modal {
    --bg-color: #212529;
    --border-color: #495057;
  }
  
  .model-sidebar,
  .model-info-item,
  .component-item,
  .connection-point-item {
    border-color: #495057;
  }
  
  .model-loading,
  .model-error {
    background-color: rgba(33, 37, 41, 0.7);
    color: #f8f9fa;
  }
  
  .hotspot-info {
    background-color: #343a40;
    color: #f8f9fa;
  }
  
  .model-container {
    background-color: #1e2124;
  }
}
</style>