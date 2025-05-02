<template>
  <aside class="sidebar" :class="{ 'collapsed': isCollapsed }">
    <div class="sidebar-header">
      <router-link to="/" class="logo-link">
        <img src="@/assets/images/logo.png" alt="Logo" class="logo-icon" v-if="!isCollapsed">
        <img src="@/assets/images/logo-sm.png" alt="Logo" class="logo-icon-sm" v-else>
        <h4 v-if="!isCollapsed">MehmetEndüstriyelTakip</h4>
      </router-link>
      <p v-if="!isCollapsed" class="text-muted small">Orta Gerilim Hücre Üretim Takip</p>
    </div>

    <nav class="sidebar-nav">
      <ul class="nav flex-column">
        <li class="nav-item">
          <router-link class="nav-link" to="/" active-class="active" exact>
            <i class="bi bi-speedometer2"></i>
            <span v-if="!isCollapsed">Genel Bakış</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" to="/orders" active-class="active">
            <i class="bi bi-file-earmark-text"></i>
            <span v-if="!isCollapsed">Siparişler</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" to="/production" active-class="active">
            <i class="bi bi-gear"></i>
            <span v-if="!isCollapsed">Üretim Takip</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" to="/inventory" active-class="active">
            <i class="bi bi-box-seam"></i>
            <span v-if="!isCollapsed">Malzeme Yönetimi</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" to="/planning" active-class="active">
            <i class="bi bi-calendar-check"></i>
            <span v-if="!isCollapsed">Planlama</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" to="/reports" active-class="active">
            <i class="bi bi-graph-up"></i>
            <span v-if="!isCollapsed">Raporlar & Analizler</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" to="/technical" active-class="active">
            <i class="bi bi-file-earmark-code"></i>
            <span v-if="!isCollapsed">Teknik Dokümanlar</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" to="/settings" active-class="active">
            <i class="bi bi-sliders"></i>
            <span v-if="!isCollapsed">Ayarlar</span>
          </router-link>
        </li>
      </ul>
    </nav>

    <div class="sidebar-footer" v-if="!isCollapsed">
      <p>v1.0.0</p>
      <p>© 2025 MehmetEndüstriyel</p>
    </div>
  </aside>
</template>

<script setup>
import { defineProps } from 'vue';

// Props'ları tanımla (DefaultLayout'tan gelecek)
defineProps({
  isCollapsed: {
    type: Boolean,
    default: false
  }
});
</script>

<style lang="scss" scoped>
// Direct import of variables
@import "../../styles/base/_variables.scss";

.sidebar {
  width: $sidebar-width;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  background-color: var(--primary-color, #2c3e50); // Use CSS var with fallback
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  overflow-x: hidden;
  z-index: 1030; // Header'ın üzerinde olması için

  .sidebar-header {
    padding: 1.25rem 1rem;
    text-align: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    .logo-link {
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      color: white;
      margin-bottom: 0.5rem;

      .logo-icon, .logo-icon-sm {
        height: 30px; // Adjust as needed
        margin-right: 10px;
      }
       .logo-icon-sm {
         margin-right: 0;
       }

      h4 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
        white-space: nowrap;
      }
    }

    p {
      margin: 0;
      font-size: 0.8rem;
      white-space: nowrap;
      color: rgba(255, 255, 255, 0.6); // Match ornekindex.html muted style
    }
  }

  .sidebar-nav {
    flex-grow: 1;
    overflow-y: auto;
    padding-top: 1rem;

    .nav-link {
      color: rgba(255, 255, 255, 0.8);
      margin: 0.2rem 0.75rem;
      border-radius: 5px;
      padding: 0.75rem 1rem;
      display: flex;
      align-items: center;
      white-space: nowrap;
      transition: background-color 0.2s ease, color 0.2s ease;

      i {
        margin-right: 10px;
        font-size: 1.1rem;
        width: 20px; // Icon width alignment
        text-align: center;
      }

      &:hover, &.active {
        background-color: rgba(255, 255, 255, 0.1); // Match ornekindex.html active/hover
        color: white;
      }
    }
  }

  .sidebar-footer {
    padding: 1rem;
    text-align: center;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6); // Match ornekindex.html muted style
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    white-space: nowrap;

    p {
      margin: 0;
    }
  }

  // Collapsed state
  &.collapsed {
    width: $sidebar-collapsed-width;

    .sidebar-header {
      padding: 1.25rem 0.5rem; // Adjust padding for collapsed state
       .logo-link h4, p {
         display: none;
       }
    }

    .sidebar-nav {
       .nav-link {
         justify-content: center;
         margin: 0.2rem 0.5rem;
         padding: 0.75rem;
         span {
           display: none;
         }
         i {
           margin-right: 0;
         }
       }
    }
    .sidebar-footer {
      display: none;
    }
  }
}

// Responsive adjustments
@media (max-width: 992px) {
  .sidebar {
    // On smaller screens, the sidebar might behave differently (e.g., overlay)
    // This depends on the desired mobile behavior.
    // For now, let's assume it hides and is toggled by a button in the header.
    left: -#{$sidebar-width}; // Hide by default
    transition: left 0.3s ease;

    &.collapsed {
      // When collapsed on mobile, it should still be hidden or managed differently
      left: -#{$sidebar-width};
      width: $sidebar-width; // Reset width when hidden
    }

    // Add a class when the sidebar should be visible on mobile (e.g., toggled open)
    &.mobile-visible {
       left: 0;
    }
  }
}
</style>
