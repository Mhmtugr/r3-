import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'

// Bileşen Modülleri
// Bu modüller statik olarak import edildiğinde performans etkisi büyüktür,
// bu nedenle lazy loading (tembelce yükleme) kullanılmalıdır.
// Vite dynamic import için gerekli yorumlar özellikle eklenmiştir.
const DefaultLayout = () => import('@/layouts/DefaultLayout.vue')
const BlankLayout = () => import('@/layouts/BlankLayout.vue')
const NotFound = () => import('@/components/NotFound.vue')

// Rotalara uygun modülleri güvenli bir şekilde import et
// Vite ile uyumlu dynamik import
const safeImport = (path) => {
  try {
    // @vite-ignore yorum satırı eklenerek Vite'ın statik analiz gereksinimleri aşılır
    return import(/* @vite-ignore */ path)
      .catch(err => {
        console.error(`Module import failed for path: ${path}`, err)
        return import('@/components/NotFound.vue')
      })
  } catch (e) {
    console.error(`Error importing module: ${path}`, e)
    return import('@/components/NotFound.vue')
  }
}

// Tüm sayfaların yapısı şu şekilde olmalıdır:
// { 
//   path: '/route-path', 
//   name: 'RouteName', 
//   component: () => import('@/modules/module/views/PageComponent.vue'),
//   meta: { layout: 'default', requiresAuth: true }
// }

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/modules/dashboard/views/DashboardView.vue'),
    meta: { 
      layout: 'default', 
      requiresAuth: true,
      title: 'Dashboard',
      description: 'Ana panel sayfası'
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/components/views/Login.vue'),
    meta: { 
      layout: 'blank', 
      requiresAuth: false,
      title: 'Giriş',
      description: 'Kullanıcı giriş sayfası'
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => safeImport('@/modules/auth/views/Register.vue'),
    meta: { 
      layout: 'blank', 
      requiresAuth: false,
      title: 'Kayıt Ol',
      description: 'Yeni kullanıcı kaydı'
    }
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('@/modules/orders/views/OrdersList.vue'),
    meta: { 
      layout: 'default', 
      requiresAuth: true,
      title: 'Siparişler',
      description: 'Sipariş listesi ve yönetimi'
    }
  },
  {
    path: '/orders/:id',
    name: 'OrderDetail',
    component: () => import('@/modules/orders/views/OrderDetail.vue'),
    meta: { 
      layout: 'default', 
      requiresAuth: true,
      title: 'Sipariş Detayı',
      description: 'Sipariş detay sayfası'
    }
  },
  {
    path: '/production',
    name: 'Production',
    component: () => safeImport('@/modules/production/views/ProductionDashboard.vue'),
    meta: { 
      layout: 'default', 
      requiresAuth: true,
      title: 'Üretim',
      description: 'Üretim paneli ve takibi'
    }
  },
  {
    path: '/materials',
    name: 'Materials',
    component: () => safeImport('@/modules/materials/views/MaterialsList.vue'),
    meta: { 
      layout: 'default', 
      requiresAuth: true,
      title: 'Malzemeler',
      description: 'Malzeme listesi ve yönetimi'
    }
  },
  {
    path: '/materials/:id',
    name: 'MaterialDetail',
    component: () => safeImport('@/modules/materials/views/MaterialDetail.vue'),
    meta: { 
      layout: 'default', 
      requiresAuth: true,
      title: 'Malzeme Detayı',
      description: 'Malzeme detay sayfası'
    }
  },
  {
    path: '/inventory',
    name: 'Inventory',
    component: () => safeImport('@/modules/inventory/views/InventoryDashboard.vue'),
    meta: { 
      layout: 'default', 
      requiresAuth: true,
      title: 'Envanter',
      description: 'Envanter paneli ve takibi'
    }
  },
  {
    path: '/planning',
    name: 'Planning',
    component: () => safeImport('@/modules/planning/views/PlanningDashboard.vue'),
    meta: { 
      layout: 'default', 
      requiresAuth: true,
      title: 'Planlama',
      description: 'Üretim planlama paneli'
    }
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => safeImport('@/views/reports/ReportsDashboard.vue'),
    meta: { 
      layout: 'default', 
      requiresAuth: true,
      title: 'Raporlar',
      description: 'Raporlar paneli'
    }
  },
  {
    path: '/technical',
    name: 'Technical',
    component: () => safeImport('@/modules/technical/views/TechnicalDashboard.vue'),
    meta: { 
      layout: 'default', 
      requiresAuth: true,
      title: 'Teknik',
      description: 'Teknik dokümanlar ve yönetimi'
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => safeImport('@/modules/settings/views/SettingsDashboard.vue'),
    meta: { 
      layout: 'default', 
      requiresAuth: true,
      title: 'Ayarlar',
      description: 'Sistem ayarları'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: { 
      layout: 'blank', 
      requiresAuth: false,
      title: 'Sayfa Bulunamadı',
      description: '404 Hata sayfası'
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

router.beforeEach((to, from, next) => {
  // Sayfa başlığını ayarla
  document.title = to.meta.title ? `${to.meta.title} - METS` : 'METS'
  
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  
  // Kullanıcının giriş durumunu log'a kaydedebiliriz geliştirme aşamasında.
  console.log('Navigating to:', to.path, 'Auth required:', requiresAuth, 'User authenticated:', authStore.isAuthenticated)
  
  if (requiresAuth && !authStore.isAuthenticated) {
    // Doğrulama gerektiren rotalarda, kullanıcı doğrulanmamışsa login sayfasına yönlendir
    // ve kullanıcının nereye gitmek istediğini hatırla
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else {
    // Diğer durumlarda yönlendirmeye izin ver
    next()
  }
})

export default router